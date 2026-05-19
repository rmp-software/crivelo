import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/duels/[id]/complete - Complete a duel and advance winner
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
    const { winner_entry_id } = body;

    if (!winner_entry_id) {
      return NextResponse.json(
        { error: 'Winner entry ID is required' },
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
      },
    });

    if (!duel) {
      return NextResponse.json({ error: 'Duel not found' }, { status: 404 });
    }

    // Check authorization
    if (duel.event.organizer_id !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate winner is one of the entries
    if (winner_entry_id !== duel.entry_a_id && winner_entry_id !== duel.entry_b_id) {
      return NextResponse.json(
        { error: 'Winner must be one of the duel participants' },
        { status: 400 }
      );
    }

    // Complete duel and advance winner
    await prisma.$transaction(async (tx) => {
      // Update duel as completed
      await tx.duel.update({
        where: { id: params.id },
        data: {
          status: 'completed',
          winner_entry_id: winner_entry_id,
          completed_at: new Date(),
        },
      });

      // Update loser entry status
      const loser_entry_id = winner_entry_id === duel.entry_a_id ? duel.entry_b_id : duel.entry_a_id;
      if (loser_entry_id) {
        await tx.eventEntry.update({
          where: { id: loser_entry_id },
          data: {
            status: 'eliminated',
            eliminated_at_round: duel.round,
          },
        });
      }

      // Advance winner to next duel if exists.
      // In single-elim, every feeder produces exactly one winner (either via real
      // play or via a round-1 bye walkover resolved at event start). The next duel
      // must stay `pending` until the sibling feeder also finishes — never auto-
      // promote it to walkover/completed here. Doing so before the sibling completes
      // is the source of the cascade bug where an unfinished round-1 duel's
      // semifinal shows a phantom winner.
      if (duel.next_duel_id && duel.next_duel_slot) {
        const updateData =
          duel.next_duel_slot === 'a'
            ? { entry_a_id: winner_entry_id }
            : { entry_b_id: winner_entry_id };

        await tx.duel.update({
          where: { id: duel.next_duel_id },
          data: updateData,
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Duel completed and winner advanced',
    });
  } catch (error: any) {
    console.error('Error completing duel:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete duel' },
      { status: 500 }
    );
  }
}
