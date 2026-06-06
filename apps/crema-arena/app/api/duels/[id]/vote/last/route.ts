import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE /api/duels/[id]/vote/last - Remove the most recent vote
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cupParam = searchParams.get('cup');
    const side = cupParam ? cupParam.toLowerCase() : null;
    if (side !== null && side !== 'a' && side !== 'b') {
      return NextResponse.json(
        { error: 'Invalid cup parameter. Must be "A" or "B"' },
        { status: 400 }
      );
    }

    const duel = await prisma.duel.findUnique({
      where: { id: params.id },
      include: {
        event: {
          select: { id: true, organizer_id: true, status: true },
        },
      },
    });

    if (!duel) {
      return NextResponse.json({ error: 'Duel not found' }, { status: 404 });
    }

    if (duel.event.organizer_id !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (duel.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Can only undo votes on duels in progress' },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const lastVote = await tx.vote.findFirst({
        where: { duel_id: params.id, ...(side ? { side: side as 'a' | 'b' } : {}) },
        orderBy: { created_at: 'desc' },
      });

      if (!lastVote) {
        return null;
      }

      await tx.vote.delete({ where: { id: lastVote.id } });

      const decrementData =
        lastVote.side === 'a'
          ? { votes_a: { decrement: 1 } }
          : { votes_b: { decrement: 1 } };

      return tx.duel.update({
        where: { id: params.id },
        data: decrementData,
        select: { id: true, votes_a: true, votes_b: true },
      });
    });

    if (!updated) {
      return NextResponse.json(
        { error: side ? `Sem votos para remover desse lado.` : 'Sem votos para remover.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      duel: { id: updated.id, votesA: updated.votes_a, votesB: updated.votes_b },
    });
  } catch (error: any) {
    console.error('Error removing vote:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove vote' },
      { status: 500 }
    );
  }
}
