import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface CompetitorDb {
  id: string;
  name: string;
  photo_url: string;
  coffee_shop: string;
}
function toCamelCompetitor(c: CompetitorDb) {
  return { id: c.id, name: c.name, photoUrl: c.photo_url, coffeeShop: c.coffee_shop };
}

// GET /api/events/[id]/current-duel - Get current active duel (public endpoint for live display)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        status: true,
        bracket_size: true,
        date: true,
        location: true,
        judges_count: true,
        crowd_vote_enabled: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // If event is not running, return event info with no active duel
    if (event.status !== 'running') {
      return NextResponse.json({
        event: {
          id: event.id,
          name: event.name,
          status: event.status,
          date: event.date.toISOString(),
          location: event.location,
          judgesCount: event.judges_count,
          crowdVoteEnabled: event.crowd_vote_enabled,
        },
        currentDuel: null,
        currentRound: null,
        totalRounds: event.bracket_size ? Math.log2(event.bracket_size) : 0,
      });
    }

    // Get all duels for the event
    const duels = await prisma.duel.findMany({
      where: { event_id: params.id },
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
    });

    // Find current round (first round with pending or in_progress duels).
    // Fallback to totalRounds so headers stay sensible once everything is done.
    const totalRounds = event.bracket_size ? Math.log2(event.bracket_size) : 0;
    let currentRound = totalRounds || 1;

    for (let round = 1; round <= totalRounds; round++) {
      const roundDuels = duels.filter((d) => d.round === round);
      const hasIncomplete = roundDuels.some(
        (d) => d.status === 'pending' || d.status === 'in_progress'
      );
      if (hasIncomplete) {
        currentRound = round;
        break;
      }
    }

    // In the final round, bronze (3rd-place playoff) plays BEFORE the grand
    // final per standard tournament convention. Comparator pushes bronze first
    // when both are in the same round; positional order otherwise.
    const playOrder = (a: typeof duels[number], b: typeof duels[number]) => {
      if (a.round !== b.round) return a.round - b.round;
      if (a.round === totalRounds) {
        if (a.is_bronze_match && !b.is_bronze_match) return -1;
        if (!a.is_bronze_match && b.is_bronze_match) return 1;
      }
      return a.position - b.position;
    };
    const orderedDuels = [...duels].sort(playOrder);

    // Skip duels the organizer has explicitly deferred (deferred_at != null).
    // Status is preserved server-side; deferral just removes them from active
    // selection until the organizer clicks "Retomar".
    const notDeferred = (d: typeof duels[number]) => d.deferred_at == null;

    // Find active duel (in_progress, not deferred)
    const activeDuel = orderedDuels.find((d) => d.status === 'in_progress' && notDeferred(d));

    // If no active duel, find next pending duel (not deferred)
    const nextDuel = activeDuel || orderedDuels.find((d) => d.status === 'pending' && notDeferred(d));

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        status: event.status,
        date: event.date.toISOString(),
        location: event.location,
        judgesCount: event.judges_count,
        crowdVoteEnabled: event.crowd_vote_enabled,
      },
      currentDuel: activeDuel
        ? {
            id: activeDuel.id,
            round: activeDuel.round,
            position: activeDuel.position,
            status: activeDuel.status,
            votesA: activeDuel.votes_a,
            votesB: activeDuel.votes_b,
            crowdVotesA: activeDuel.crowd_votes_a,
            crowdVotesB: activeDuel.crowd_votes_b,
            photoLeftSlot: activeDuel.photo_left_slot,
            pourPhotoUrl: activeDuel.pour_photo_url,
            startedAt: activeDuel.started_at ? activeDuel.started_at.toISOString() : null,
            isBronzeMatch: activeDuel.is_bronze_match,
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
      nextDuel: !activeDuel && nextDuel
        ? {
            id: nextDuel.id,
            round: nextDuel.round,
            position: nextDuel.position,
            status: nextDuel.status,
            votesA: nextDuel.votes_a,
            votesB: nextDuel.votes_b,
            crowdVotesA: nextDuel.crowd_votes_a,
            crowdVotesB: nextDuel.crowd_votes_b,
            photoLeftSlot: nextDuel.photo_left_slot,
            isBronzeMatch: nextDuel.is_bronze_match,
            entryA: nextDuel.entry_a
              ? {
                  id: nextDuel.entry_a.id,
                  competitor: toCamelCompetitor(nextDuel.entry_a.competitor),
                }
              : null,
            entryB: nextDuel.entry_b
              ? {
                  id: nextDuel.entry_b.id,
                  competitor: toCamelCompetitor(nextDuel.entry_b.competitor),
                }
              : null,
          }
        : null,
      currentRound,
      totalRounds,
    });
  } catch (error: any) {
    console.error('Error fetching current duel:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current duel' },
      { status: 500 }
    );
  }
}
