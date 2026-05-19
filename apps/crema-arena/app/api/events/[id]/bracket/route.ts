import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateBracket } from '@/lib/bracket';

interface CompetitorDb {
  id: string;
  name: string;
  photo_url: string;
  coffee_shop: string;
}
function toCamelCompetitor(c: CompetitorDb) {
  return { id: c.id, name: c.name, photoUrl: c.photo_url, coffeeShop: c.coffee_shop };
}

// GET /api/events/[id]/bracket - Get bracket state (public endpoint for live display)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const totalRounds = event.bracket_size ? Math.log2(event.bracket_size) : 0;

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        status: event.status,
        bracketSize: event.bracket_size,
      },
      duels: event.duels.map((duel) => ({
        id: duel.id,
        round: duel.round,
        position: duel.position,
        status: duel.status,
        votesA: duel.votes_a,
        votesB: duel.votes_b,
        isBronzeMatch: duel.is_bronze_match,
        entryA: duel.entry_a
          ? { id: duel.entry_a.id, competitor: toCamelCompetitor(duel.entry_a.competitor) }
          : null,
        entryB: duel.entry_b
          ? { id: duel.entry_b.id, competitor: toCamelCompetitor(duel.entry_b.competitor) }
          : null,
        winner: duel.winner_entry
          ? { id: duel.winner_entry.id, competitor: toCamelCompetitor(duel.winner_entry.competitor) }
          : null,
      })),
      totalRounds,
    });
  } catch (error: any) {
    console.error('Error fetching bracket:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bracket' },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/bracket - Generate bracket for event
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get event with entries
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        entries: {
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
          where: { status: 'active' },
          orderBy: { seed: 'asc' },
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

    // Check event is in setup status
    if (event.status !== 'setup') {
      return NextResponse.json(
        { error: 'Bracket can only be generated for events in setup status' },
        { status: 400 }
      );
    }

    // Check if bracket already exists
    const existingDuels = await prisma.duel.count({
      where: { event_id: params.id },
    });

    if (existingDuels > 0) {
      return NextResponse.json(
        { error: 'Bracket already exists for this event' },
        { status: 400 }
      );
    }

    // Validate minimum competitors
    if (event.entries.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 competitors required to generate bracket' },
        { status: 400 }
      );
    }

    // Generate bracket structure
    const bracketData = generateBracket(event.entries);

    // Calculate bracket size
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(event.entries.length)));

    // Create the whole bracket in a single multi-row INSERT — `generateBracket`
    // mints UUIDs and resolves next_duel_id / bronze_duel_id up front so no
    // second pass is needed. Two round-trips total: one event UPDATE, one duel
    // INSERT (was ~32 before).
    const createdDuels = await prisma.$transaction(async (tx) => {
      await tx.event.update({
        where: { id: params.id },
        data: { bracket_size: bracketSize },
      });

      await tx.duel.createMany({
        data: bracketData.map((d) => ({
          id: d.id,
          event_id: params.id,
          round: d.round,
          position: d.position,
          entry_a_id: d.entry_a_id,
          entry_b_id: d.entry_b_id,
          status: d.status,
          next_duel_id: d.next_duel_id,
          next_duel_slot: d.next_duel_slot,
          bronze_duel_id: d.bronze_duel_id,
          is_bronze_match: d.is_bronze_match,
        })),
      });

      return bracketData;
    }, { timeout: 30_000, maxWait: 10_000 });

    return NextResponse.json({
      success: true,
      bracketSize,
      duelsCreated: createdDuels.length,
      message: 'Bracket generated successfully',
    });
  } catch (error: any) {
    console.error('Error generating bracket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate bracket' },
      { status: 500 }
    );
  }
}
