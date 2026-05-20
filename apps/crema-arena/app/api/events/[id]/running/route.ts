import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface CompetitorDb {
  id: string;
  name: string;
  photo_url: string;
  coffee_shop: string;
}

function toCamelCompetitor(c: CompetitorDb) {
  return {
    id: c.id,
    name: c.name,
    photoUrl: c.photo_url,
    coffeeShop: c.coffee_shop,
  };
}

// GET /api/events/[id]/running - Get running event details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        duels: {
          include: {
            entry_a: {
              include: {
                competitor: {
                  select: {
                    id: true,
                    name: true,
                    photo_url: true,
                    coffee_shop: true,
                  },
                },
              },
            },
            entry_b: {
              include: {
                competitor: {
                  select: {
                    id: true,
                    name: true,
                    photo_url: true,
                    coffee_shop: true,
                  },
                },
              },
            },
            winner_entry: {
              include: {
                competitor: {
                  select: {
                    id: true,
                    name: true,
                    photo_url: true,
                    coffee_shop: true,
                  },
                },
              },
            },
          },
          orderBy: [{ round: 'asc' }, { position: 'asc' }],
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check authorization
    if (event.organizer_id !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find current round (first round with pending or in_progress duels).
    // Fallback: when every duel is complete, the "current round" is the final
    // round — so the panel header reads "Final" and lists the final-round duels
    // instead of falling back to round 1.
    const totalRounds = event.bracket_size ? Math.log2(event.bracket_size) : 0;
    let currentRound = totalRounds || 1;

    for (let round = 1; round <= totalRounds; round++) {
      const roundDuels = event.duels.filter((d) => d.round === round);
      const hasIncomplete = roundDuels.some(
        (d) => d.status === 'pending' || d.status === 'in_progress'
      );
      if (hasIncomplete) {
        currentRound = round;
        break;
      }
    }

    // Get duels for current round, ordered for play. In the final round the
    // bronze (3rd-place) match plays BEFORE the grand final, then positional
    // order — standard tournament convention.
    const currentRoundDuels = event.duels
      .filter((d) => d.round === currentRound)
      .sort((a, b) => {
        if (currentRound === totalRounds) {
          if (a.is_bronze_match && !b.is_bronze_match) return -1;
          if (!a.is_bronze_match && b.is_bronze_match) return 1;
        }
        return a.position - b.position;
      });

    // Find active duel (first in_progress, or first pending — in play order).
    // Skip duels the organizer has deferred (`deferred_at != null`).
    const activeDuel =
      currentRoundDuels.find((d) => d.status === 'in_progress' && d.deferred_at == null) ||
      currentRoundDuels.find((d) => d.status === 'pending' && d.deferred_at == null) ||
      null;

    // Check if all duels are completed
    const allDuelsCompleted = event.duels.every((d) => d.status === 'completed');

    return NextResponse.json({
      currentRound,
      totalRounds,
      activeDuel: activeDuel
        ? {
            id: activeDuel.id,
            round: activeDuel.round,
            position: activeDuel.position,
            status: activeDuel.status,
            votesA: activeDuel.votes_a,
            votesB: activeDuel.votes_b,
            pourPhotoUrl: activeDuel.pour_photo_url,
            entryA: activeDuel.entry_a
              ? {
                  id: activeDuel.entry_a.id,
                  competitor: toCamelCompetitor(activeDuel.entry_a.competitor),
                }
              : null,
            entryB: activeDuel.entry_b
              ? {
                  id: activeDuel.entry_b.id,
                  competitor: toCamelCompetitor(activeDuel.entry_b.competitor),
                }
              : null,
          }
        : null,
      judgesCount: event.judges_count,
      duels: currentRoundDuels.map((duel) => ({
        id: duel.id,
        round: duel.round,
        position: duel.position,
        status: duel.status,
        votesA: duel.votes_a,
        votesB: duel.votes_b,
        pourPhotoUrl: duel.pour_photo_url,
        deferredAt: duel.deferred_at?.toISOString() ?? null,
        wildcardType: duel.wildcard_type,
        isBronzeMatch: duel.is_bronze_match,
        entryA: duel.entry_a
          ? {
              id: duel.entry_a.id,
              competitor: toCamelCompetitor(duel.entry_a.competitor),
            }
          : null,
        entryB: duel.entry_b
          ? {
              id: duel.entry_b.id,
              competitor: toCamelCompetitor(duel.entry_b.competitor),
            }
          : null,
        winner: duel.winner_entry
          ? {
              id: duel.winner_entry.id,
              competitor: toCamelCompetitor(duel.winner_entry.competitor),
            }
          : null,
      })),
      allDuelsCompleted,
    });
  } catch (error: any) {
    console.error('Error fetching running event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch running event' },
      { status: 500 }
    );
  }
}
