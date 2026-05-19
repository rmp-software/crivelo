/**
 * One-shot: repair brackets corrupted by the old auto-walkover cascade (RMP-65).
 *
 * Symptom: round 2+ duels were prematurely marked completed/walkover with a
 * winner that hadn't actually won (the sibling feeder was still pending).
 *
 * Repair rule: for any duel in round >= 2 that is `completed` or `walkover`,
 * verify that *both* of its feeders are themselves terminal. If not, reset
 * the duel: clear winner_entry_id + completed_at + status -> pending. Also
 * propagate the reset to any downstream duel that received the phantom winner.
 *
 * Run with:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' \
 *     scripts/repair-bracket-cascade.ts <eventId>
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function repair(eventId: string) {
  const duels = await prisma.duel.findMany({
    where: { event_id: eventId },
    orderBy: [{ round: 'asc' }, { position: 'asc' }],
  });

  if (duels.length === 0) {
    console.log(`No duels found for event ${eventId}`);
    return;
  }

  const byId = new Map(duels.map((d) => [d.id, d]));
  const feedersOf = new Map<string, typeof duels>();
  for (const d of duels) {
    if (d.next_duel_id) {
      const arr = feedersOf.get(d.next_duel_id) ?? [];
      arr.push(d);
      feedersOf.set(d.next_duel_id, arr);
    }
  }

  const toReset: string[] = [];

  // Walk top-down; mark phantom completions for reset.
  // A round-2+ duel is phantom-completed if EITHER:
  //   (a) any feeder isn't terminal yet (sibling still pending), OR
  //   (b) status==='completed' with zero votes (real wins always have votes).
  for (const d of duels) {
    if (d.round < 2) continue;
    if (d.status !== 'completed' && d.status !== 'walkover') continue;

    const feeders = feedersOf.get(d.id) ?? [];
    const allFeedersTerminal = feeders.every(
      (f) => f.status === 'completed' || f.status === 'walkover'
    );

    const phantomCompleted =
      d.status === 'completed' && d.votes_a === 0 && d.votes_b === 0;

    if (!allFeedersTerminal || phantomCompleted) {
      toReset.push(d.id);
    }
  }

  // Reset cascades downstream too. If duel X is bad, anything fed by X may also be bad.
  let changed = true;
  while (changed) {
    changed = false;
    for (const d of duels) {
      if (d.round < 2) continue;
      if (d.status !== 'completed' && d.status !== 'walkover') continue;
      if (toReset.includes(d.id)) continue;

      const feeders = feedersOf.get(d.id) ?? [];
      // If any feeder is in the reset list, this duel's "winner" came from a phantom.
      if (feeders.some((f) => toReset.includes(f.id))) {
        toReset.push(d.id);
        changed = true;
      }
    }
  }

  if (toReset.length > 0) {
    console.log(`Event ${eventId}: repairing ${toReset.length} duel(s):`);
    for (const id of toReset) {
      const d = byId.get(id)!;
      console.log(`  R${d.round} duel ${d.position + 1} (status=${d.status})`);
    }
  } else {
    console.log(`Event ${eventId}: no phantom completions; scanning for phantom slot entries...`);
  }

  await prisma.$transaction(async (tx) => {
    for (const id of toReset) {
      const d = byId.get(id)!;

      // Recompute which entries should be in this slot, based on FEEDER winners.
      const feeders = feedersOf.get(id) ?? [];
      let entryA: string | null = null;
      let entryB: string | null = null;
      for (const f of feeders) {
        const slot = f.next_duel_slot;
        const feederTerminal = f.status === 'completed' || f.status === 'walkover';
        const advance = feederTerminal && !toReset.includes(f.id) ? f.winner_entry_id : null;
        if (slot === 'a') entryA = advance;
        else if (slot === 'b') entryB = advance;
      }

      await tx.duel.update({
        where: { id },
        data: {
          status: 'pending',
          winner_entry_id: null,
          completed_at: null,
          votes_a: 0,
          votes_b: 0,
          entry_a_id: entryA,
          entry_b_id: entryB,
        },
      });
    }

    // Also clear phantom entries on still-pending round-2+ duels: an entry that
    // sits in a slot whose feeder isn't terminal (or whose feeder's winner is
    // different) was placed by the buggy cascade.
    for (const d of duels) {
      if (d.round < 2) continue;
      if (toReset.includes(d.id)) continue;
      if (d.status === 'completed' || d.status === 'walkover') continue;

      const feeders = feedersOf.get(d.id) ?? [];
      const patch: Record<string, string | null> = {};
      for (const f of feeders) {
        const feederTerminal = f.status === 'completed' || f.status === 'walkover';
        const expected =
          feederTerminal && !toReset.includes(f.id) ? f.winner_entry_id : null;
        const actual = f.next_duel_slot === 'a' ? d.entry_a_id : d.entry_b_id;
        if (actual !== expected) {
          patch[f.next_duel_slot === 'a' ? 'entry_a_id' : 'entry_b_id'] = expected;
        }
      }
      if (Object.keys(patch).length > 0) {
        await tx.duel.update({ where: { id: d.id }, data: patch });
        console.log(`  cleared phantom entries on R${d.round} duel ${d.position + 1}`);
      }
    }

    // Restore eliminated entries that lost only to phantom winners.
    const survivors = await tx.eventEntry.findMany({
      where: { event_id: eventId, status: 'eliminated' },
    });
    for (const e of survivors) {
      // An entry was wrongly eliminated if it currently sits in a fresh slot
      // (i.e. a reset duel's entry_a_id or entry_b_id).
      const stillIn = await tx.duel.findFirst({
        where: {
          event_id: eventId,
          OR: [{ entry_a_id: e.id }, { entry_b_id: e.id }],
          status: 'pending',
        },
      });
      if (stillIn) {
        await tx.eventEntry.update({
          where: { id: e.id },
          data: { status: 'active', eliminated_at_round: null },
        });
      }
    }
  });

  console.log('Done.');
}

const eventId = process.argv[2];
if (!eventId) {
  console.error('Usage: ts-node scripts/repair-bracket-cascade.ts <eventId>');
  process.exit(1);
}

repair(eventId)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
