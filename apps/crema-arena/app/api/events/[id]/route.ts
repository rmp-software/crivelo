import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/events/[id] - Get single event detail with registered competitors
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        entries: {
          include: {
            competitor: {
              select: {
                id: true,
                name: true,
                coffee_shop: true,
                photo_url: true,
              },
            },
          },
          orderBy: { seed: 'asc' },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check authorization (must be organizer or admin)
    if (event.organizer_id !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        date: event.date.toISOString(),
        location: event.location,
        description: event.description,
        judgesCount: event.judges_count,
        status: event.status,
        bracketSize: event.bracket_size,
        organizerId: event.organizer_id,
        createdAt: event.created_at.toISOString(),
        updatedAt: event.updated_at.toISOString(),
      },
      competitors: event.entries.map((entry) => ({
        entryId: entry.id,
        id: entry.competitor.id,
        name: entry.competitor.name,
        coffeeShop: entry.competitor.coffee_shop,
        photoUrl: entry.competitor.photo_url,
        seed: entry.seed,
        status: entry.status,
      })),
      totalEntries: event.entries.length,
    });
  } catch (error: any) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id] - Update event (only in setup status)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, date, location, description, judges_count } = body;

    // Check if event exists and get its current state
    const existingEvent = await prisma.event.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        organizer_id: true,
        status: true,
      },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check authorization
    if (existingEvent.organizer_id !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow updates in setup status
    if (existingEvent.status !== 'setup') {
      return NextResponse.json(
        { error: 'Cannot edit event that is not in setup status' },
        { status: 400 }
      );
    }

    // Validation
    if (!name || name.trim().length < 3) {
      return NextResponse.json(
        { error: 'Event name is required and must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: 'Event date is required' },
        { status: 400 }
      );
    }

    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (!judges_count || judges_count < 1 || judges_count > 10) {
      return NextResponse.json(
        { error: 'Judges count must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Update event
    const event = await prisma.event.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        date: eventDate,
        location: location?.trim() || null,
        description: description?.trim() || null,
        judges_count: parseInt(judges_count, 10),
      },
      select: {
        id: true,
        name: true,
        date: true,
        location: true,
        status: true,
        judges_count: true,
        updated_at: true,
      },
    });

    return NextResponse.json({
      id: event.id,
      name: event.name,
      date: event.date.toISOString(),
      location: event.location,
      status: event.status,
      judgesCount: event.judges_count,
      updatedAt: event.updated_at.toISOString(),
    });
  } catch (error: any) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - Delete event (only in setup status, no results/duels)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if event exists and get its current state
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        organizer_id: true,
        status: true,
        _count: {
          select: { duels: true },
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

    // Only allow deletion in setup status
    if (event.status !== 'setup') {
      return NextResponse.json(
        { error: 'Cannot delete event that is not in setup status' },
        { status: 400 }
      );
    }

    // Check if there are any duels (bracket has been generated)
    if (event._count.duels > 0) {
      return NextResponse.json(
        { error: 'Cannot delete event with generated bracket' },
        { status: 400 }
      );
    }

    // Delete event (cascade will delete entries)
    await prisma.event.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
