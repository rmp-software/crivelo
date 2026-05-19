import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT /api/events/[id]/entries/[entry_id] - Update competitor entry (seed assignment)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; entry_id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { seed } = body;

    // Check if entry exists and get event info
    const entry = await prisma.eventEntry.findUnique({
      where: { id: params.entry_id },
      include: {
        event: {
          select: {
            organizer_id: true,
            status: true,
          },
        },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Verify entry belongs to the event
    if (entry.event_id !== params.id) {
      return NextResponse.json({ error: 'Entry does not belong to this event' }, { status: 400 });
    }

    // Check authorization
    if (entry.event.organizer_id !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow updates in setup status
    if (entry.event.status !== 'setup') {
      return NextResponse.json(
        { error: 'Cannot update entry for event that is not in setup status' },
        { status: 400 }
      );
    }

    // Validate seed if provided
    let seedValue = null;
    if (seed !== undefined && seed !== null && seed !== '') {
      seedValue = parseInt(seed, 10);
      if (isNaN(seedValue) || seedValue < 1) {
        return NextResponse.json(
          { error: 'Seed must be a positive integer' },
          { status: 400 }
        );
      }
    }

    // Update entry
    const updatedEntry = await prisma.eventEntry.update({
      where: { id: params.entry_id },
      data: { seed: seedValue },
      select: {
        id: true,
        seed: true,
        updated_at: true,
      },
    });

    return NextResponse.json({
      entryId: updatedEntry.id,
      seed: updatedEntry.seed,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error updating entry:', error);
    return NextResponse.json(
      { error: 'Failed to update entry' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id]/entries/[entry_id] - Remove competitor from event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; entry_id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if entry exists and get event info
    const entry = await prisma.eventEntry.findUnique({
      where: { id: params.entry_id },
      include: {
        event: {
          select: {
            organizer_id: true,
            status: true,
          },
        },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Verify entry belongs to the event
    if (entry.event_id !== params.id) {
      return NextResponse.json({ error: 'Entry does not belong to this event' }, { status: 400 });
    }

    // Check authorization
    if (entry.event.organizer_id !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow deletion in setup status
    if (entry.event.status !== 'setup') {
      return NextResponse.json(
        { error: 'Cannot remove competitor from event that is not in setup status' },
        { status: 400 }
      );
    }

    // Delete entry
    await prisma.eventEntry.delete({
      where: { id: params.entry_id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing entry:', error);
    return NextResponse.json(
      { error: 'Failed to remove entry' },
      { status: 500 }
    );
  }
}
