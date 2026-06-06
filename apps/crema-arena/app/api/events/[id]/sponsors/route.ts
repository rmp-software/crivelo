import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CADENCE_FROZEN_MS } from '@/lib/data-cadence';

// Frozen-tier endpoint: cache for CADENCE_FROZEN_MS at edge + browser.
const FROZEN_S = CADENCE_FROZEN_MS / 1000;

// GET /api/events/[id]/sponsors - List event's sponsors ordered by position
// Public, unauthenticated: this is the frozen-tier endpoint polled (~15s) by the
// live display and audience companion. Matches current-duel/leaderboard (no session).
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventSponsors = await prisma.eventSponsor.findMany({
      where: { event_id: params.id },
      include: {
        sponsor: {
          select: {
            id: true,
            name: true,
            logo_url: true,
            website: true,
          },
        },
      },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json(
      eventSponsors.map((es) => ({
        id: es.id,
        sponsor: es.sponsor,
        position: es.position,
      })),
      {
        headers: {
          'Cache-Control': `public, max-age=${FROZEN_S}, s-maxage=${FROZEN_S}`,
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching event sponsors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event sponsors' },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/sponsors - Attach sponsor to event
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if event exists and user has access
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

    // Sponsors can only be edited while the event hasn't started.
    if (event.status !== 'setup') {
      return NextResponse.json(
        {
          error: 'event_not_in_setup',
          message: 'Só dá pra editar patrocinadores antes do evento começar.',
        },
        { status: 409 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'validation_error', message: 'Corpo inválido.' },
        { status: 400 }
      );
    }
    const { sponsor_id } = body ?? {};

    if (!sponsor_id || typeof sponsor_id !== 'string') {
      return NextResponse.json(
        { error: 'validation_error', message: 'sponsor_id é obrigatório.' },
        { status: 422 }
      );
    }

    // Check if sponsor exists
    const sponsor = await prisma.sponsor.findUnique({
      where: { id: sponsor_id },
      select: { id: true },
    });

    if (!sponsor) {
      return NextResponse.json(
        { error: 'validation_error', message: 'Patrocinador não encontrado.' },
        { status: 422 }
      );
    }

    // Assign next position = current max + 1, or 0 if first
    const last = await prisma.eventSponsor.findFirst({
      where: { event_id: params.id },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    const nextPosition = last ? last.position + 1 : 0;

    let eventSponsor;
    try {
      eventSponsor = await prisma.eventSponsor.create({
        data: {
          event_id: params.id,
          sponsor_id,
          position: nextPosition,
        },
        include: {
          sponsor: {
            select: {
              id: true,
              name: true,
              logo_url: true,
              website: true,
            },
          },
        },
      });
    } catch (error) {
      // Unique constraint on (event_id, sponsor_id) — already attached
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return NextResponse.json(
          {
            error: 'sponsor_already_attached',
            message: 'Esse patrocinador já está neste evento.',
          },
          { status: 409 }
        );
      }
      // FK violation — sponsor deleted between the existence check and the create
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        return NextResponse.json(
          { error: 'validation_error', message: 'Patrocinador não encontrado.' },
          { status: 422 }
        );
      }
      throw error;
    }

    return NextResponse.json(
      {
        id: eventSponsor.id,
        sponsor: eventSponsor.sponsor,
        position: eventSponsor.position,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error attaching sponsor to event:', error);
    return NextResponse.json(
      { error: 'Failed to attach sponsor to event' },
      { status: 500 }
    );
  }
}

// PATCH /api/events/[id]/sponsors - Reorder sponsors within event
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if event exists and user has access
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

    // Sponsors can only be edited while the event hasn't started.
    if (event.status !== 'setup') {
      return NextResponse.json(
        {
          error: 'event_not_in_setup',
          message: 'Só dá pra editar patrocinadores antes do evento começar.',
        },
        { status: 409 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'validation_error', message: 'Corpo inválido.' },
        { status: 400 }
      );
    }
    const { order } = body ?? {};

    if (!Array.isArray(order)) {
      return NextResponse.json(
        { error: 'validation_error', message: 'order deve ser um array de IDs.' },
        { status: 422 }
      );
    }

    if (!order.every((entry) => typeof entry === 'string')) {
      return NextResponse.json(
        { error: 'validation_error', message: 'order deve conter apenas IDs.' },
        { status: 422 }
      );
    }

    // Validate that every id in `order` belongs to this event
    const existing = await prisma.eventSponsor.findMany({
      where: { event_id: params.id },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((es) => es.id));

    const foreign = order.filter((id: string) => !existingIds.has(id));
    if (foreign.length > 0) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Um ou mais IDs não pertencem a este evento.',
        },
        { status: 422 }
      );
    }

    // Reject duplicate IDs — a repeated id would pass the foreign and length
    // checks yet leave another row with a stale position after the transaction.
    const orderSet = new Set(order);
    if (orderSet.size !== order.length) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'A ordem contém patrocinadores duplicados.',
        },
        { status: 422 }
      );
    }

    // The order array must cover ALL of this event's sponsors — a partial array
    // would leave omitted rows with stale/duplicate positions.
    if (order.length !== existingIds.size) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'A ordem deve conter todos os patrocinadores do evento.',
        },
        { status: 422 }
      );
    }

    // Atomic reorder: set each EventSponsor's position to its index in the array
    await prisma.$transaction(
      order.map((id: string, index: number) =>
        prisma.eventSponsor.update({
          where: { id },
          data: { position: index },
        })
      )
    );

    const eventSponsors = await prisma.eventSponsor.findMany({
      where: { event_id: params.id },
      include: {
        sponsor: {
          select: {
            id: true,
            name: true,
            logo_url: true,
            website: true,
          },
        },
      },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json(
      eventSponsors.map((es) => ({
        id: es.id,
        sponsor: es.sponsor,
        position: es.position,
      }))
    );
  } catch (error: any) {
    console.error('Error reordering event sponsors:', error);
    return NextResponse.json(
      { error: 'Failed to reorder event sponsors' },
      { status: 500 }
    );
  }
}
