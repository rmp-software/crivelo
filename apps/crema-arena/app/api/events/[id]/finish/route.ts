import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/events/[id]/finish - Finish the event
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get event with duels
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        duels: {
          select: {
            id: true,
            status: true,
          },
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

    // Check event is running
    if (event.status !== 'running') {
      return NextResponse.json(
        { error: 'Event must be running to finish' },
        { status: 400 }
      );
    }

    // Check all duels are completed
    const allDuelsCompleted = event.duels.every((d) => d.status === 'completed');
    if (!allDuelsCompleted) {
      return NextResponse.json(
        { error: 'All duels must be completed before finishing event' },
        { status: 400 }
      );
    }

    // Update event status to finished
    const updatedEvent = await prisma.event.update({
      where: { id: params.id },
      data: { status: 'finished' },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      event: {
        id: updatedEvent.id,
        name: updatedEvent.name,
        status: updatedEvent.status,
      },
      message: 'Event finished successfully',
    });
  } catch (error: any) {
    console.error('Error finishing event:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to finish event' },
      { status: 500 }
    );
  }
}
