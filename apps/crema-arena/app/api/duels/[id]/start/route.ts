import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/duels/[id]/start - Start a duel
export async function POST(
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

    // Check event is running
    if (duel.event.status !== 'running') {
      return NextResponse.json(
        { error: 'Event must be running to start duels' },
        { status: 400 }
      );
    }

    // Check duel status
    if (duel.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only start duels in pending status' },
        { status: 400 }
      );
    }

    // Update duel status to in_progress
    const updatedDuel = await prisma.duel.update({
      where: { id: params.id },
      data: { status: 'in_progress', started_at: new Date() },
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
      },
    });

    return NextResponse.json({
      success: true,
      duel: {
        id: updatedDuel.id,
        round: updatedDuel.round,
        position: updatedDuel.position,
        status: updatedDuel.status,
        votesA: updatedDuel.votes_a,
        votesB: updatedDuel.votes_b,
        pourPhotoUrl: updatedDuel.pour_photo_url,
        entryA: updatedDuel.entry_a
          ? {
              id: updatedDuel.entry_a.id,
              competitor: updatedDuel.entry_a.competitor,
            }
          : null,
        entryB: updatedDuel.entry_b
          ? {
              id: updatedDuel.entry_b.id,
              competitor: updatedDuel.entry_b.competitor,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error('Error starting duel:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start duel' },
      { status: 500 }
    );
  }
}
