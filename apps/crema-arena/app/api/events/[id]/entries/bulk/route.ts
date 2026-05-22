import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/events/[id]/entries/bulk - Inscribe many competitors in one shot.
// Takes { competitor_ids: string[] } and creates all entries in a single
// createMany (skipDuplicates), so adding a full 64-slot field is one round trip
// and one atomic write instead of N sequential requests.
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
    const { competitor_ids } = body;

    if (!Array.isArray(competitor_ids) || competitor_ids.length === 0) {
      return NextResponse.json(
        { error: 'competitor_ids must be a non-empty array' },
        { status: 400 }
      );
    }

    // Dedupe and keep only well-formed string ids.
    const ids = Array.from(
      new Set(competitor_ids.filter((id): id is string => typeof id === 'string'))
    );
    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'competitor_ids must contain at least one valid id' },
        { status: 400 }
      );
    }

    // Event must exist, be owned by the caller (or admin), and be in setup.
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      select: { organizer_id: true, status: true },
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

    // Drop ids that don't resolve to a real competitor.
    const competitors = await prisma.competitor.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    const validIds = competitors.map((c) => c.id);
    if (validIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid competitors to add' },
        { status: 404 }
      );
    }

    // Skip the ones already registered (idempotent add).
    const existing = await prisma.eventEntry.findMany({
      where: { event_id: params.id, competitor_id: { in: validIds } },
      select: { competitor_id: true },
    });
    const existingSet = new Set(existing.map((e) => e.competitor_id));
    const toCreate = validIds.filter((id) => !existingSet.has(id));

    if (toCreate.length > 0) {
      // Single atomic write. skipDuplicates guards against a concurrent add
      // racing the existence check above.
      await prisma.eventEntry.createMany({
        data: toCreate.map((competitor_id) => ({
          event_id: params.id,
          competitor_id,
          status: 'active' as const,
        })),
        skipDuplicates: true,
      });
    }

    // Return the canonical entries for everything requested (created + already
    // present) so the client can reconcile its optimistic rows in one pass.
    const entries = await prisma.eventEntry.findMany({
      where: { event_id: params.id, competitor_id: { in: validIds } },
      include: {
        competitor: {
          select: { id: true, name: true, coffee_shop: true, photo_url: true },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    return NextResponse.json(
      {
        added: toCreate.length,
        skipped: validIds.length - toCreate.length,
        entries: entries.map((entry) => ({
          entryId: entry.id,
          competitorId: entry.competitor.id,
          name: entry.competitor.name,
          coffeeShop: entry.competitor.coffee_shop,
          photoUrl: entry.competitor.photo_url,
          seed: entry.seed,
          status: entry.status,
        })),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error bulk-adding competitors to event:', error);
    return NextResponse.json(
      { error: 'Failed to add competitors to event' },
      { status: 500 }
    );
  }
}
