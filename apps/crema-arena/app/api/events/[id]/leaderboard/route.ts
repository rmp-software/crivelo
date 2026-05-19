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

// GET /api/events/[id]/leaderboard - Get event leaderboard (public endpoint)
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
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get all entries with their duels data
    const entries = await prisma.eventEntry.findMany({
      where: { event_id: params.id },
      include: {
        competitor: {
          select: {
            id: true,
            name: true,
            photo_url: true,
            coffee_shop: true,
          },
        },
        wins: {
          where: {
            status: 'completed',
          },
          select: {
            id: true,
            round: true,
            votes_a: true,
            votes_b: true,
            winner_entry_id: true,
          },
        },
      },
    });

    // Calculate leaderboard data
    const leaderboard = entries.map((entry) => {
      const wins = entry.wins.length;

      // Calculate total votes received
      const totalVotesReceived = entry.wins.reduce((total, duel) => {
        // Determine which side this competitor was on
        return total + (duel.winner_entry_id === entry.id ?
          (duel.votes_a > duel.votes_b ? duel.votes_a : duel.votes_b) : 0);
      }, 0);

      // Get duels where this entry participated (as A or B)
      const allDuels = prisma.duel.findMany({
        where: {
          OR: [
            { entry_a_id: entry.id },
            { entry_b_id: entry.id },
          ],
          status: 'completed',
        },
        select: {
          votes_a: true,
          votes_b: true,
          entry_a_id: true,
        },
      });

      return {
        entryId: entry.id,
        competitor: toCamelCompetitor(entry.competitor),
        status: entry.status,
        wins,
        eliminatedAtRound: entry.eliminated_at_round,
        totalVotesReceived,
        seed: entry.seed,
      };
    });

    // Sort leaderboard:
    // 1. By status (active > eliminated > dropped_out)
    // 2. By wins (descending)
    // 3. By total votes (descending)
    // 4. By seed (ascending - lower seed = higher rank)
    leaderboard.sort((a, b) => {
      // Status priority
      const statusPriority = { active: 3, wildcard_in: 2, eliminated: 1, dropped_out: 0 };
      const statusDiff = (statusPriority[b.status] || 0) - (statusPriority[a.status] || 0);
      if (statusDiff !== 0) return statusDiff;

      // Wins
      if (b.wins !== a.wins) return b.wins - a.wins;

      // Total votes
      if (b.totalVotesReceived !== a.totalVotesReceived) {
        return b.totalVotesReceived - a.totalVotesReceived;
      }

      // Seed (lower is better, nulls last)
      if (a.seed && b.seed) return a.seed - b.seed;
      if (a.seed) return -1;
      if (b.seed) return 1;

      return 0;
    });

    // When a bronze match exists and is complete, force positions 1–4 from the
    // bracket so we don't depend on tie-breaks for the podium.
    if (event.status === 'finished') {
      const decisiveDuels = await prisma.duel.findMany({
        where: { event_id: params.id, round: event.bracket_size ? Math.log2(event.bracket_size) : 0 },
        select: {
          is_bronze_match: true,
          status: true,
          winner_entry_id: true,
          entry_a_id: true,
          entry_b_id: true,
        },
      });
      const finalDuel = decisiveDuels.find((d) => !d.is_bronze_match);
      const bronzeDuel = decisiveDuels.find((d) => d.is_bronze_match);
      if (
        finalDuel?.status === 'completed' &&
        bronzeDuel?.status === 'completed' &&
        finalDuel.winner_entry_id &&
        bronzeDuel.winner_entry_id
      ) {
        const firstId = finalDuel.winner_entry_id;
        const secondId =
          finalDuel.winner_entry_id === finalDuel.entry_a_id
            ? finalDuel.entry_b_id
            : finalDuel.entry_a_id;
        const thirdId = bronzeDuel.winner_entry_id;
        const fourthId =
          bronzeDuel.winner_entry_id === bronzeDuel.entry_a_id
            ? bronzeDuel.entry_b_id
            : bronzeDuel.entry_a_id;

        const reorder = (ids: (string | null)[]) => {
          const picked: typeof leaderboard = [];
          for (const id of ids) {
            if (!id) continue;
            const idx = leaderboard.findIndex((e) => e.entryId === id);
            if (idx >= 0) picked.push(leaderboard.splice(idx, 1)[0]);
          }
          return [...picked, ...leaderboard];
        };

        const reordered = reorder([firstId, secondId, thirdId, fourthId]);
        leaderboard.length = 0;
        leaderboard.push(...reordered);
      }
    }

    // Add position numbers
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      position: index + 1,
    }));

    // For running events, show only top competitors or those with wins
    const isFinished = event.status === 'finished';
    const displayLeaderboard = isFinished
      ? rankedLeaderboard
      : rankedLeaderboard.filter((entry) => entry.wins > 0 || entry.status === 'active').slice(0, 10);

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        status: event.status,
      },
      leaderboard: displayLeaderboard,
      isComplete: isFinished,
    });
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
