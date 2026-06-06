import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/events/[id]/sponsors/bulk - Attach many sponsors in one shot.
// Takes { sponsor_ids: string[] } (in the order to lay them out) and creates all
// links in a single createMany, assigning sequential positions from the current
// max. One round trip / one atomic write instead of N sequential POSTs.
export async function POST(
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
    const { sponsor_ids } = body ?? {};

    if (!Array.isArray(sponsor_ids) || sponsor_ids.length === 0) {
      return NextResponse.json(
        { error: 'validation_error', message: 'sponsor_ids é obrigatório.' },
        { status: 422 }
      );
    }

    // Dedupe while preserving order (positions follow selection order).
    const ids = Array.from(
      new Set(sponsor_ids.filter((id): id is string => typeof id === 'string'))
    );
    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'validation_error', message: 'sponsor_ids deve conter ao menos um ID.' },
        { status: 422 }
      );
    }

    // Drop ids that don't resolve to a real sponsor.
    const sponsors = await prisma.sponsor.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    const validSet = new Set(sponsors.map((s) => s.id));

    // Skip the ones already attached (idempotent), keep selection order.
    const attached = await prisma.eventSponsor.findMany({
      where: { event_id: params.id, sponsor_id: { in: ids } },
      select: { sponsor_id: true },
    });
    const attachedSet = new Set(attached.map((es) => es.sponsor_id));
    const toCreate = ids.filter((id) => validSet.has(id) && !attachedSet.has(id));

    if (toCreate.length === 0) {
      return NextResponse.json(
        { error: 'validation_error', message: 'Nenhum patrocinador válido para adicionar.' },
        { status: 422 }
      );
    }

    // Positions continue from the current max so existing order is preserved.
    const last = await prisma.eventSponsor.findFirst({
      where: { event_id: params.id },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    const base = last ? last.position + 1 : 0;

    // Single atomic write. skipDuplicates guards a concurrent attach racing the
    // attached-check above (its position is simply skipped — harmless gap).
    await prisma.eventSponsor.createMany({
      data: toCreate.map((sponsor_id, i) => ({
        event_id: params.id,
        sponsor_id,
        position: base + i,
      })),
      skipDuplicates: true,
    });

    const eventSponsors = await prisma.eventSponsor.findMany({
      where: { event_id: params.id },
      include: {
        sponsor: { select: { id: true, name: true, logo_url: true, website: true } },
      },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json(
      {
        added: toCreate.length,
        skipped: ids.length - toCreate.length,
        sponsors: eventSponsors.map((es) => ({
          id: es.id,
          sponsor: es.sponsor,
          position: es.position,
        })),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error bulk-attaching sponsors to event:', error);
    return NextResponse.json(
      { error: 'Failed to attach sponsors to event' },
      { status: 500 }
    );
  }
}
