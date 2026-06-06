import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/duels/[id]/wildcard - Handle wildcard substitutions
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { wildcard_type, selected_competitor_id, target_slot } = body;

    if (target_slot && !['a', 'b'].includes(target_slot)) {
      return NextResponse.json(
        { error: 'target_slot must be "a" or "b" when provided' },
        { status: 400 }
      );
    }

    if (!wildcard_type || !['walkover', 'manual', 'random'].includes(wildcard_type)) {
      return NextResponse.json(
        { error: 'Valid wildcard_type is required (walkover, manual, or random)' },
        { status: 400 }
      );
    }

    // Get duel with event info
    const duel = await prisma.duel.findUnique({
      where: { id: params.id },
      include: {
        event: {
          select: {
            id: true,
            organizer_id: true,
            status: true,
          },
        },
        entry_a: {
          include: {
            competitor: true,
          },
        },
        entry_b: {
          include: {
            competitor: true,
          },
        },
      },
    });

    if (!duel) {
      return NextResponse.json({ error: 'Duel not found' }, { status: 404 });
    }

    // Check authorization
    if (duel.event.organizer_id !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check event is running
    if (duel.event.status !== 'running') {
      return NextResponse.json(
        { error: 'Event must be running to use wildcards' },
        { status: 400 }
      );
    }

    // Handle walkover case
    if (wildcard_type === 'walkover') {
      // Determine which competitor is present
      const presentEntry = duel.entry_a_id ? duel.entry_a : duel.entry_b;
      const absentSlot = duel.entry_a_id ? 'b' : 'a';

      if (!presentEntry) {
        return NextResponse.json(
          { error: 'Cannot perform walkover: no competitor present' },
          { status: 400 }
        );
      }

      await prisma.$transaction(async (tx) => {
        // Update duel status to walkover and set winner
        await tx.duel.update({
          where: { id: params.id },
          data: {
            status: 'walkover',
            wildcard_type: 'walkover',
            winner_entry_id: presentEntry.id,
            completed_at: new Date(),
          },
        });

        // Advance winner to next duel if exists
        if (duel.next_duel_id && duel.next_duel_slot) {
          const updateData: any = {};
          if (duel.next_duel_slot === 'a') {
            updateData.entry_a_id = presentEntry.id;
          } else {
            updateData.entry_b_id = presentEntry.id;
          }

          await tx.duel.update({
            where: { id: duel.next_duel_id },
            data: updateData,
          });
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Walkover completed',
        duel: {
          id: duel.id,
          status: 'walkover',
          winner: presentEntry.competitor.name,
        },
      });
    }

    // For manual and random, we need a competitor
    if (!selected_competitor_id) {
      return NextResponse.json(
        { error: 'selected_competitor_id is required for manual and random wildcards' },
        { status: 400 }
      );
    }

    // Get eliminated competitors from this event
    const eliminatedEntries = await prisma.eventEntry.findMany({
      where: {
        event_id: duel.event.id,
        status: 'eliminated',
      },
      include: {
        competitor: true,
      },
    });

    // Verify selected competitor is eliminated
    const selectedEntry = eliminatedEntries.find(
      (e) => e.competitor_id === selected_competitor_id
    );

    if (!selectedEntry) {
      return NextResponse.json(
        { error: 'Selected competitor must be an eliminated competitor from this event' },
        { status: 400 }
      );
    }

    // Determine target slot: explicit param wins; otherwise pick the empty slot.
    const wildcardSlot: 'a' | 'b' | null =
      (target_slot as 'a' | 'b' | undefined) ??
      (!duel.entry_a_id ? 'a' : !duel.entry_b_id ? 'b' : null);

    if (!wildcardSlot) {
      return NextResponse.json(
        { error: 'Both slots are filled; specify target_slot to replace a competitor' },
        { status: 400 }
      );
    }

    const replacedEntryId =
      wildcardSlot === 'a' ? duel.entry_a_id : duel.entry_b_id;

    if (replacedEntryId === selectedEntry.id) {
      return NextResponse.json(
        { error: 'Selected competitor already occupies this slot' },
        { status: 400 }
      );
    }

    // Perform the wildcard substitution
    await prisma.$transaction(async (tx) => {
      // If we're replacing a filled slot, mark the displaced entry as eliminated
      if (replacedEntryId) {
        await tx.eventEntry.update({
          where: { id: replacedEntryId },
          data: {
            status: 'eliminated',
            eliminated_at_round: duel.round,
          },
        });
      }

      // Update the event entry status to wildcard_in
      await tx.eventEntry.update({
        where: { id: selectedEntry.id },
        data: {
          status: 'wildcard_in',
        },
      });

      // Update the duel with the wildcard entry
      const updateData: any = {
        wildcard_type: wildcard_type,
      };

      if (wildcardSlot === 'a') {
        updateData.entry_a_id = selectedEntry.id;
      } else {
        updateData.entry_b_id = selectedEntry.id;
      }

      // If duel was pending and now has both entries, it's ready to start
      if (duel.status === 'pending') {
        updateData.status = 'pending';
      }

      await tx.duel.update({
        where: { id: params.id },
        data: updateData,
      });
    });

    return NextResponse.json({
      success: true,
      message: `Wildcard ${wildcard_type} successful`,
      duel: {
        id: duel.id,
        wildcardType: wildcard_type,
        wildcardCompetitor: selectedEntry.competitor.name,
      },
    });
  } catch (error: any) {
    console.error('Error handling wildcard:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to handle wildcard' },
      { status: 500 }
    );
  }
}

// GET /api/duels/[id]/wildcard - Get available wildcard options (eliminated competitors)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get duel with event info
    const duel = await prisma.duel.findUnique({
      where: { id: params.id },
      include: {
        event: {
          select: {
            id: true,
            organizer_id: true,
          },
        },
      },
    });

    if (!duel) {
      return NextResponse.json({ error: 'Duel not found' }, { status: 404 });
    }

    // Check authorization
    if (duel.event.organizer_id !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get eliminated competitors from this event
    const eliminatedEntries = await prisma.eventEntry.findMany({
      where: {
        event_id: duel.event.id,
        status: 'eliminated',
      },
      include: {
        competitor: true,
      },
      orderBy: {
        eliminated_at_round: 'desc',
      },
    });

    const eliminatedCompetitors = eliminatedEntries.map((entry) => ({
      entryId: entry.id,
      competitorId: entry.competitor.id,
      name: entry.competitor.name,
      coffeeShop: entry.competitor.coffee_shop,
      photoUrl: entry.competitor.photo_url,
      eliminatedAtRound: entry.eliminated_at_round,
    }));

    return NextResponse.json({
      eliminatedCompetitors,
    });
  } catch (error: any) {
    console.error('Error fetching wildcard options:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch wildcard options' },
      { status: 500 }
    );
  }
}
