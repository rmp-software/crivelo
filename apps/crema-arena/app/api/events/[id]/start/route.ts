import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateBracket, linkDuels } from '@/lib/bracket';

// POST /api/events/[id]/start - Start event (generate bracket + change status to running)
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
        { error: 'Event can only be started from setup status' },
        { status: 400 }
      );
    }

    // Validate minimum competitors
    if (event.entries.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 competitors required to start event' },
        { status: 400 }
      );
    }

    // Check if bracket already exists
    const existingDuels = await prisma.duel.count({
      where: { event_id: params.id },
    });

    // Generate bracket if it doesn't exist
    let duelsCreated = 0;
    let bracketSize = event.bracket_size;

    if (existingDuels === 0) {
      // Generate bracket structure
      const bracketData = generateBracket(event.entries);

      // Calculate bracket size
      bracketSize = Math.pow(2, Math.ceil(Math.log2(event.entries.length)));

      // Create duels in database
      const createdDuels = await prisma.$transaction(async (tx) => {
        // Create all duels
        const duels = await Promise.all(
          bracketData.map((duelData) =>
            tx.duel.create({
              data: {
                event_id: params.id,
                round: duelData.round,
                position: duelData.position,
                entry_a_id: duelData.entry_a_id,
                entry_b_id: duelData.entry_b_id,
                status: duelData.status,
              },
              select: {
                id: true,
                round: true,
                position: true,
              },
            })
          )
        );

        // Link duels together
        const duelLinks = linkDuels(duels);

        // Update duels with linking information
        await Promise.all(
          duelLinks.map((link) =>
            tx.duel.update({
              where: { id: link.id },
              data: {
                next_duel_id: link.next_duel_id,
                next_duel_slot: link.next_duel_slot,
              },
            })
          )
        );

        return duels;
      });

      duelsCreated = createdDuels.length;
    }

    // Update event status to running and set bracket_size
    const updatedEvent = await prisma.event.update({
      where: { id: params.id },
      data: {
        status: 'running',
        bracket_size: bracketSize,
      },
      select: {
        id: true,
        name: true,
        status: true,
        bracket_size: true,
      },
    });

    // Resolve any byes automatically
    await resolveByeDuels(params.id);

    return NextResponse.json({
      success: true,
      event: {
        id: updatedEvent.id,
        name: updatedEvent.name,
        status: updatedEvent.status,
        bracketSize: updatedEvent.bracket_size,
      },
      duelsCreated,
      message: 'Event started successfully',
    });
  } catch (error: any) {
    console.error('Error starting event:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start event' },
      { status: 500 }
    );
  }
}

/**
 * Automatically resolve duels that have byes (one or both slots empty)
 */
async function resolveByeDuels(eventId: string) {
  // Find all walkover duels
  const byeDuels = await prisma.duel.findMany({
    where: {
      event_id: eventId,
      status: 'walkover',
    },
    include: {
      entry_a: true,
      entry_b: true,
      next_duel: true,
    },
  });

  // Resolve each bye duel
  for (const duel of byeDuels) {
    // Determine winner (the entry that's not null)
    const winnerId = duel.entry_a_id || duel.entry_b_id;

    if (winnerId && duel.next_duel_id) {
      // Mark this round-1 bye as completed (winner advanced without playing).
      await prisma.duel.update({
        where: { id: duel.id },
        data: {
          winner_entry_id: winnerId,
          status: 'completed',
          completed_at: new Date(),
        },
      });

      // Advance winner into the next duel slot. The next duel stays `pending` —
      // it only becomes playable once the sibling feeder also produces a winner.
      const updateData =
        duel.next_duel_slot === 'a'
          ? { entry_a_id: winnerId }
          : { entry_b_id: winnerId };

      await prisma.duel.update({
        where: { id: duel.next_duel_id },
        data: updateData,
      });
    }
  }
}
