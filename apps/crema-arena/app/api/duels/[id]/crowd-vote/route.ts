import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// POST /api/duels/[id]/crowd-vote - Public, anonymous crowd vote for side a or b.
// No session: the audience is unauthenticated. This handler must NEVER read or
// write the judge-vote path (votes_a / votes_b / Vote / winner_entry_id / status).
// It only touches CrowdVote rows and the duel's denormalized crowd_votes_a/b.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Hoisted so the outer P2002 recovery (below) can re-read this device's
  // persisted vote without re-consuming the already-read request body.
  let deviceId: unknown;
  try {
    const body = await request.json().catch(() => null);
    const side = body?.side;
    deviceId = body?.deviceId;

    // Validate body
    if (side !== 'a' && side !== 'b') {
      return NextResponse.json(
        { error: 'Lado inválido. Use "a" ou "b".' },
        { status: 400 }
      );
    }
    if (typeof deviceId !== 'string' || deviceId.trim() === '') {
      return NextResponse.json(
        { error: 'deviceId obrigatório.' },
        { status: 400 }
      );
    }
    // Narrowed const so TS keeps the string type inside the transaction closure.
    const device = deviceId;

    const result = await prisma.$transaction(async (tx) => {
      // Load duel + the bits of the event/duel we need (crowd path only)
      const duel = await tx.duel.findUnique({
        where: { id: params.id },
        select: {
          id: true,
          status: true,
          crowd_votes_a: true,
          crowd_votes_b: true,
          event: {
            select: {
              crowd_vote_enabled: true,
            },
          },
        },
      });

      if (!duel) {
        return { status: 404 as const, payload: { error: 'Duel not found' } };
      }

      if (duel.event.crowd_vote_enabled === false) {
        return {
          status: 403 as const,
          payload: { error: 'Voto do público desativado.' },
        };
      }

      if (duel.status !== 'in_progress') {
        return {
          status: 409 as const,
          payload: { error: 'Votação encerrada.' },
        };
      }

      // Upsert the device's vote on (duel_id, device_id)
      const existing = await tx.crowdVote.findUnique({
        where: {
          duel_id_device_id: {
            duel_id: params.id,
            device_id: device,
          },
        },
        select: { side: true },
      });

      let crowdVotesA = duel.crowd_votes_a;
      let crowdVotesB = duel.crowd_votes_b;

      if (!existing) {
        // New vote → create row + increment that side's counter.
        // Two simultaneous POSTs from the same device can both pass the
        // findUnique===null check above and both reach this create; the loser
        // hits the (duel_id, device_id) unique constraint and throws P2002.
        // We let that escape the transaction (Postgres aborts it on the failed
        // statement, so we must NOT keep querying on `tx` here) and handle it
        // idempotently in the outer catch below.
        await tx.crowdVote.create({
          data: {
            duel_id: params.id,
            device_id: device,
            side,
          },
        });
        const updated = await tx.duel.update({
          where: { id: params.id },
          data:
            side === 'a'
              ? { crowd_votes_a: { increment: 1 } }
              : { crowd_votes_b: { increment: 1 } },
          select: { crowd_votes_a: true, crowd_votes_b: true },
        });
        crowdVotesA = updated.crowd_votes_a;
        crowdVotesB = updated.crowd_votes_b;
      } else if (existing.side !== side) {
        // Side switch → move the row, decrement old side, increment new side
        await tx.crowdVote.update({
          where: {
            duel_id_device_id: {
              duel_id: params.id,
              device_id: device,
            },
          },
          data: { side },
        });
        const updated = await tx.duel.update({
          where: { id: params.id },
          data:
            side === 'a'
              ? { crowd_votes_a: { increment: 1 }, crowd_votes_b: { decrement: 1 } }
              : { crowd_votes_b: { increment: 1 }, crowd_votes_a: { decrement: 1 } },
          select: { crowd_votes_a: true, crowd_votes_b: true },
        });
        crowdVotesA = updated.crowd_votes_a;
        crowdVotesB = updated.crowd_votes_b;
      } else {
        // Same side → no-op (no row change, no counter change). The snapshot
        // read at the top of the transaction may be stale (other devices can
        // have voted in between), so re-read fresh counters before returning.
        const fresh = await tx.duel.findUnique({
          where: { id: params.id },
          select: { crowd_votes_a: true, crowd_votes_b: true },
        });
        if (fresh) {
          crowdVotesA = fresh.crowd_votes_a;
          crowdVotesB = fresh.crowd_votes_b;
        }
      }

      return {
        status: 200 as const,
        payload: {
          crowdVotesA,
          crowdVotesB,
          yourSide: side as 'a' | 'b',
        },
      };
    });

    return NextResponse.json(result.payload, { status: result.status });
  } catch (error: unknown) {
    // Concurrent same-device race: two simultaneous first-time POSTs both pass
    // the existence check and both create; the loser's transaction aborts with
    // P2002 on the (duel_id, device_id) unique constraint. The winner already
    // counted this device exactly once, so treat P2002 as success — re-read the
    // persisted side + fresh counters (outside the rolled-back transaction) and
    // return 200. This makes the cast idempotent without Serializable + retry.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      try {
        if (typeof deviceId === 'string' && deviceId.trim() !== '') {
          const [persisted, fresh] = await Promise.all([
            prisma.crowdVote.findUnique({
              where: {
                duel_id_device_id: {
                  duel_id: params.id,
                  device_id: deviceId,
                },
              },
              select: { side: true },
            }),
            prisma.duel.findUnique({
              where: { id: params.id },
              select: { crowd_votes_a: true, crowd_votes_b: true },
            }),
          ]);
          if (persisted && fresh) {
            return NextResponse.json(
              {
                crowdVotesA: fresh.crowd_votes_a,
                crowdVotesB: fresh.crowd_votes_b,
                yourSide: persisted.side,
              },
              { status: 200 }
            );
          }
        }
      } catch (recoverError: unknown) {
        // Fall through to the generic 500 if the idempotent re-read also fails.
        console.error('Error recovering from crowd-vote P2002:', recoverError);
      }
    }

    // Public, anonymous endpoint: log server-side detail but never leak Prisma/DB
    // internals (e.g. a P2002 constraint name) to the caller.
    console.error('Error recording crowd vote:', error);
    return NextResponse.json(
      { error: 'Não foi possível registrar o voto' },
      { status: 500 }
    );
  }
}
