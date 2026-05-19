import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // Find current round (first round with pending or in_progress duels)
    let currentRound = 1;
    const totalRounds = event.bracket_size ? Math.log2(event.bracket_size) : 0;

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

    // Find active duel (in_progress)
    const activeDuel = duels.find((d) => d.status === 'in_progress');

    // If no active duel, find next pending duel
    const nextDuel = activeDuel || duels.find((d) => d.status === 'pending');

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        status: event.status,
        date: event.date.toISOString(),
        location: event.location,
        judgesCount: event.judges_count,
      },
      currentDuel: activeDuel
        ? {
            id: activeDuel.id,
            round: activeDuel.round,
            position: activeDuel.position,
            status: activeDuel.status,
            votesA: activeDuel.votes_a,
            votesB: activeDuel.votes_b,
            pourPhotoUrl: activeDuel.pour_photo_url,
            startedAt: activeDuel.started_at ? activeDuel.started_at.toISOString() : null,
            entryA: activeDuel.entry_a
              ? {
                  id: activeDuel.entry_a.id,
                  competitor: activeDuel.entry_a.competitor,
                }
              : null,
            entryB: activeDuel.entry_b
              ? {
                  id: activeDuel.entry_b.id,
                  competitor: activeDuel.entry_b.competitor,
                }
              : null,
          }
        : null,
      nextDuel: !activeDuel && nextDuel
        ? {
            id: nextDuel.id,
            round: nextDuel.round,
            position: nextDuel.position,
            entryA: nextDuel.entry_a
              ? {
                  id: nextDuel.entry_a.id,
                  competitor: nextDuel.entry_a.competitor,
                }
              : null,
            entryB: nextDuel.entry_b
              ? {
                  id: nextDuel.entry_b.id,
                  competitor: nextDuel.entry_b.competitor,
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
