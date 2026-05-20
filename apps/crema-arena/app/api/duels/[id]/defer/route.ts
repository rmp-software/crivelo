import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/duels/[id]/defer    — mark the duel as deferred (skipped, come back later).
// DELETE /api/duels/[id]/defer  — clear the deferred flag (resume).
//
// Server-side state so the Live Display + companion follow the organizer's skip
// decisions. Status (pending / in_progress) is preserved either way — deferral
// just hides the duel from active-duel selection until resumed.

async function checkAuth(duelId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const duel = await prisma.duel.findUnique({
    where: { id: duelId },
    include: { event: { select: { organizer_id: true, status: true } } },
  });
  if (!duel) {
    return { error: NextResponse.json({ error: 'Duel not found' }, { status: 404 }) };
  }
  if (duel.event.organizer_id !== session.user.id && session.user.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  if (duel.event.status !== 'running') {
    return {
      error: NextResponse.json(
        { error: 'Event must be running to defer duels' },
        { status: 400 }
      ),
    };
  }
  return { duel };
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await checkAuth(params.id);
  if ('error' in auth) return auth.error;
  const updated = await prisma.duel.update({
    where: { id: params.id },
    data: { deferred_at: new Date() },
    select: { id: true, deferred_at: true },
  });
  return NextResponse.json({ success: true, duel: { id: updated.id, deferredAt: updated.deferred_at?.toISOString() ?? null } });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await checkAuth(params.id);
  if ('error' in auth) return auth.error;
  const updated = await prisma.duel.update({
    where: { id: params.id },
    data: { deferred_at: null },
    select: { id: true, deferred_at: true },
  });
  return NextResponse.json({ success: true, duel: { id: updated.id, deferredAt: null } });
}
