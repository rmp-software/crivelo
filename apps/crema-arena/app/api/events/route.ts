import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/events - List organizer's events with count of competitors
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      organizer_id: session.user.id,
    };

    if (status && ['setup', 'running', 'finished'].includes(status)) {
      where.status = status;
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        select: {
          id: true,
          name: true,
          date: true,
          location: true,
          status: true,
          judges_count: true,
          crowd_vote_enabled: true,
          created_at: true,
          _count: {
            select: { entries: true },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    return NextResponse.json({
      events: events.map((event) => ({
        id: event.id,
        name: event.name,
        date: event.date.toISOString(),
        location: event.location,
        status: event.status,
        judgesCount: event.judges_count,
        crowdVoteEnabled: event.crowd_vote_enabled,
        competitorCount: event._count.entries,
        createdAt: event.created_at.toISOString(),
      })),
      total,
      page,
    });
  } catch (error: any) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST /api/events - Create new event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, date, location, description, judges_count, crowd_vote_enabled } = body;

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

    // Check if date is in the future (for new events)
    if (eventDate < new Date()) {
      return NextResponse.json(
        { error: 'Event date must be in the future' },
        { status: 400 }
      );
    }

    if (!judges_count || judges_count < 1 || judges_count > 10) {
      return NextResponse.json(
        { error: 'Judges count must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        name: name.trim(),
        date: eventDate,
        location: location?.trim() || null,
        description: description?.trim() || null,
        judges_count: parseInt(judges_count, 10),
        // Default to true when the toggle isn't supplied (headline behavior).
        crowd_vote_enabled: crowd_vote_enabled === undefined ? true : Boolean(crowd_vote_enabled),
        status: 'setup',
        organizer_id: session.user.id,
      },
      select: {
        id: true,
        name: true,
        date: true,
        location: true,
        status: true,
        judges_count: true,
        crowd_vote_enabled: true,
        created_at: true,
      },
    });

    return NextResponse.json(
      {
        id: event.id,
        name: event.name,
        date: event.date.toISOString(),
        location: event.location,
        status: event.status,
        judgesCount: event.judges_count,
        crowdVoteEnabled: event.crowd_vote_enabled,
        createdAt: event.created_at.toISOString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
