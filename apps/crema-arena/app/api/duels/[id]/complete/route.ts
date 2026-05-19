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

      // Advance winner to next duel if exists
      if (duel.next_duel_id && duel.next_duel_slot) {
        const updateData: any = {};
        if (duel.next_duel_slot === 'a') {
          updateData.entry_a_id = winner_entry_id;
        } else {
          updateData.entry_b_id = winner_entry_id;
        }

        // Check if next duel becomes a walkover or has both entries
        const nextDuel = await tx.duel.findUnique({
          where: { id: duel.next_duel_id },
        });

        if (nextDuel) {
          const nextEntryAId = duel.next_duel_slot === 'a' ? winner_entry_id : nextDuel.entry_a_id;
          const nextEntryBId = duel.next_duel_slot === 'b' ? winner_entry_id : nextDuel.entry_b_id;

          // If one side is filled and the other is empty, it's a walkover
          if ((nextEntryAId && !nextEntryBId) || (!nextEntryAId && nextEntryBId)) {
            updateData.status = 'walkover';
            // Auto-complete walkover
            const walkoverWinnerId = nextEntryAId || nextEntryBId;
            if (walkoverWinnerId) {
              updateData.winner_entry_id = walkoverWinnerId;
              updateData.status = 'completed';
              updateData.completed_at = new Date();

              // Recursively advance if there's a next duel
              if (nextDuel.next_duel_id && nextDuel.next_duel_slot) {
                const nextNextUpdateData: any = {};
                if (nextDuel.next_duel_slot === 'a') {
                  nextNextUpdateData.entry_a_id = walkoverWinnerId;
                } else {
                  nextNextUpdateData.entry_b_id = walkoverWinnerId;
                }

                await tx.duel.update({
                  where: { id: nextDuel.next_duel_id },
                  data: nextNextUpdateData,
                });
              }
            }
          }

          await tx.duel.update({
            where: { id: duel.next_duel_id },
            data: updateData,
          });
        }
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
