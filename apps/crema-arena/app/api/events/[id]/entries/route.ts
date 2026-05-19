import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/events/[id]/entries - List event's registered competitors with pagination
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    // Check if event exists and user has access
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      select: { organizer_id: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.organizer_id !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [entries, total] = await Promise.all([
      prisma.eventEntry.findMany({
        where: { event_id: params.id },
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
        skip,
        take: limit,
      }),
      prisma.eventEntry.count({ where: { event_id: params.id } }),
    ]);

    return NextResponse.json({
      entries: entries.map((entry) => ({
        entryId: entry.id,
        competitorId: entry.competitor.id,
        name: entry.competitor.name,
        coffeeShop: entry.competitor.coffee_shop,
        photoUrl: entry.competitor.photo_url,
        seed: entry.seed,
        status: entry.status,
        createdAt: entry.created_at.toISOString(),
      })),
      total,
    });
  } catch (error: any) {
    console.error('Error fetching entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entries' },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/entries - Add competitor to event
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
    const { competitor_id, seed } = body;

    if (!competitor_id) {
      return NextResponse.json(
        { error: 'Competitor ID is required' },
        { status: 400 }
      );
    }

    // Check if event exists and is in setup status
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      select: {
        organizer_id: true,
        status: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.organizer_id !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (event.status !== 'setup') {
      return NextResponse.json(
        { error: 'Cannot add competitors to event that is not in setup status' },
        { status: 400 }
      );
    }

    // Check if competitor exists
    const competitor = await prisma.competitor.findUnique({
      where: { id: competitor_id },
    });

    if (!competitor) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      );
    }

    // Check if competitor is already registered
    const existingEntry = await prisma.eventEntry.findUnique({
      where: {
        event_id_competitor_id: {
          event_id: params.id,
          competitor_id: competitor_id,
        },
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: 'Competitor is already registered for this event' },
        { status: 409 }
      );
    }

    // Validate seed if provided
    let seedValue = null;
    if (seed !== undefined && seed !== null) {
      seedValue = parseInt(seed, 10);
      if (isNaN(seedValue) || seedValue < 1) {
        return NextResponse.json(
          { error: 'Seed must be a positive integer' },
          { status: 400 }
        );
      }
    }

    // Create entry
    const entry = await prisma.eventEntry.create({
      data: {
        event_id: params.id,
        competitor_id: competitor_id,
        seed: seedValue,
        status: 'active',
      },
      select: {
        id: true,
        competitor_id: true,
        event_id: true,
        seed: true,
        status: true,
        created_at: true,
      },
    });

    return NextResponse.json(
      {
        entryId: entry.id,
        competitorId: entry.competitor_id,
        eventId: entry.event_id,
        seed: entry.seed,
        status: entry.status,
        createdAt: entry.created_at.toISOString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error adding competitor to event:', error);
    return NextResponse.json(
      { error: 'Failed to add competitor to event' },
      { status: 500 }
    );
  }
}
