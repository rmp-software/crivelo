import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateBracket } from '@/lib/bracket';

// POST /api/events/[id]/bracket/regenerate
// Wipe the bracket and re-build with current entries + seeds.
// Allowed only while the event is in `setup` status.
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
      include: {
        entries: {
          where: { status: 'active' },
          include: {
            competitor: {
              select: { id: true, name: true, photo_url: true, coffee_shop: true },
            },
          },
          orderBy: { seed: 'asc' },
        },
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
        { error: 'Bracket can only be regenerated for events in setup status' },
        { status: 400 }
      );
    }
    if (event.entries.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 competitors required to generate bracket' },
        { status: 400 }
      );
    }

    const bracketData = generateBracket(event.entries);
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(event.entries.length)));

    const result = await prisma.$transaction(async (tx) => {
      // Wipe existing duels + their vote records. cascade isn't defined on Vote→Duel
      // FK relation here, so delete votes first.
      await tx.vote.deleteMany({ where: { duel: { event_id: params.id } } });
      await tx.duel.deleteMany({ where: { event_id: params.id } });

      await tx.event.update({
        where: { id: params.id },
        data: { bracket_size: bracketSize },
      });

      // Single multi-row INSERT — UUIDs and self-FKs are pre-resolved.
      await tx.duel.createMany({
        data: bracketData.map((d) => ({
          id: d.id,
          event_id: params.id,
          round: d.round,
          position: d.position,
          entry_a_id: d.entry_a_id,
          entry_b_id: d.entry_b_id,
          status: d.status,
          next_duel_id: d.next_duel_id,
          next_duel_slot: d.next_duel_slot,
          bronze_duel_id: d.bronze_duel_id,
          is_bronze_match: d.is_bronze_match,
        })),
      });

      return bracketData;
    }, { timeout: 30_000, maxWait: 10_000 });

    return NextResponse.json({
      success: true,
      bracketSize,
      duelsCreated: result.length,
      message: 'Chave re-gerada.',
    });
  } catch (error: any) {
    console.error('Error regenerating bracket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to regenerate bracket' },
      { status: 500 }
    );
  }
}
