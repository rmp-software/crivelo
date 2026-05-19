import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/duels/[id]/vote - Record a vote for cup A or B
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
    const { cup } = body;

    // Validate cup parameter
    if (!cup || (cup !== 'A' && cup !== 'B')) {
      return NextResponse.json(
        { error: 'Invalid cup parameter. Must be "A" or "B"' },
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
            judges_count: true,
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

    // Check duel status
    if (duel.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Can only vote on duels in progress' },
        { status: 400 }
      );
    }

    // Enforce vote cap (votes_a + votes_b ≤ judges_count)
    if (duel.votes_a + duel.votes_b >= duel.event.judges_count) {
      return NextResponse.json(
        { error: 'Todos os votos já foram registrados.' },
        { status: 409 }
      );
    }

    // Record vote and increment counter
    const updatedDuel = await prisma.$transaction(async (tx) => {
      // Create vote record
      await tx.vote.create({
        data: {
          duel_id: params.id,
          side: cup.toLowerCase() as 'a' | 'b',
        },
      });

      // Increment vote counter
      const updateData = cup === 'A'
        ? { votes_a: { increment: 1 } }
        : { votes_b: { increment: 1 } };

      return tx.duel.update({
        where: { id: params.id },
        data: updateData,
        select: {
          id: true,
          votes_a: true,
          votes_b: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      duel: {
        id: updatedDuel.id,
        votesA: updatedDuel.votes_a,
        votesB: updatedDuel.votes_b,
      },
    });
  } catch (error: any) {
    console.error('Error recording vote:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record vote' },
      { status: 500 }
    );
  }
}
