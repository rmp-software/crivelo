import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE /api/events/[id]/sponsors/[sponsorId] - Detach sponsor from event by sponsor_id
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; sponsorId: string } }
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

    // Find the EventSponsor link by (event_id, sponsor_id)
    const eventSponsor = await prisma.eventSponsor.findUnique({
      where: {
        event_id_sponsor_id: {
          event_id: params.id,
          sponsor_id: params.sponsorId,
        },
      },
      select: { id: true },
    });

    if (!eventSponsor) {
      return NextResponse.json(
        { error: 'Sponsor is not attached to this event' },
        { status: 404 }
      );
    }

    await prisma.eventSponsor.delete({
      where: { id: eventSponsor.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('Error detaching sponsor from event:', error);
    return NextResponse.json(
      { error: 'Failed to detach sponsor from event' },
      { status: 500 }
    );
  }
}
