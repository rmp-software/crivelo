// Bracket generation utility for single-elimination tournaments

import { randomUUID } from 'crypto';

interface EventEntry {
  id: string;
  seed: number | null;
  competitor: {
    id: string;
    name: string;
    photo_url: string;
    coffee_shop: string;
  };
}

interface BracketSlot {
  entryId: string | null;
  competitorId: string | null;
  competitorName: string | null;
  competitorPhoto: string | null;
  isBye: boolean;
}

/**
 * Shape of a duel row ready to be passed straight into `prisma.duel.createMany`.
 * IDs and all self-references (next_duel_id, bronze_duel_id) are pre-computed,
 * so the whole bracket can be inserted in a single round-trip.
 */
export interface DuelData {
  id: string;
  round: number;
  position: number;
  entry_a_id: string | null;
  entry_b_id: string | null;
  status: 'pending' | 'walkover';
  next_duel_id: string | null;
  next_duel_slot: 'a' | 'b' | null;
  bronze_duel_id: string | null;
  is_bronze_match: boolean;
}

/**
 * Calculate the next power of 2 that is >= the input number
 */
function nextPowerOf2(n: number): number {
  if (n <= 1) return 2;
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * Get standard seeding positions for single-elimination bracket
 * For example, in an 8-person bracket:
 * - Seed 1 plays Seed 8 (position 0)
 * - Seed 4 plays Seed 5 (position 1)
 * - Seed 2 plays Seed 7 (position 2)
 * - Seed 3 plays Seed 6 (position 3)
 */
function getStandardSeedingPositions(bracketSize: number): number[] {
  function buildSeeding(size: number): number[] {
    if (size === 2) return [1, 2];
    const half = buildSeeding(size / 2);
    const result: number[] = [];
    for (let i = 0; i < half.length; i++) {
      result.push(half[i]);
      result.push(size + 1 - half[i]);
    }
    return result;
  }
  return buildSeeding(bracketSize);
}

/**
 * Generate a fully-linked bracket structure for a single-elimination tournament.
 * Every duel gets a pre-minted UUID, and `next_duel_id` / `bronze_duel_id` are
 * resolved inline — so callers can ship the whole array to `createMany` in one
 * INSERT (Postgres checks self-referential FKs at end-of-statement).
 */
export function generateBracket(entries: EventEntry[]): DuelData[] {
  if (entries.length < 2) {
    throw new Error('At least 2 competitors required to generate bracket');
  }

  const bracketSize = nextPowerOf2(entries.length);
  const seedingOrder = getStandardSeedingPositions(bracketSize);
  const totalRounds = Math.log2(bracketSize);

  // Separate + shuffle entries
  const seededEntries = entries.filter(e => e.seed !== null).sort((a, b) => a.seed! - b.seed!);
  const nonSeededEntries = entries.filter(e => e.seed === null);
  const shuffledNonSeeded = [...nonSeededEntries].sort(() => Math.random() - 0.5);

  // Bracket slots — round 1 entry positions
  const slots: BracketSlot[] = Array(bracketSize).fill(null).map(() => ({
    entryId: null,
    competitorId: null,
    competitorName: null,
    competitorPhoto: null,
    isBye: true,
  }));

  // Place seeded competitors at their seed positions.
  seededEntries.forEach((entry) => {
    const seed = entry.seed!;
    if (seed > 0 && seed <= bracketSize) {
      const positionIndex = seedingOrder.indexOf(seed);
      if (positionIndex !== -1) {
        slots[positionIndex] = {
          entryId: entry.id,
          competitorId: entry.competitor.id,
          competitorName: entry.competitor.name,
          competitorPhoto: entry.competitor.photo_url,
          isBye: false,
        };
      }
    }
  });

  // Fill remaining slots with non-seeded competitors, walking the bracket in
  // ascending logical-seed order. Non-seeded entries take the best remaining
  // seed positions; byes end up tied to the highest logical seeds, which pair
  // with the top real seeds in round 1 and become walkovers for them (standard
  // tournament behavior).
  let nonSeededIndex = 0;
  for (
    let logicalSeed = 1;
    logicalSeed <= bracketSize && nonSeededIndex < shuffledNonSeeded.length;
    logicalSeed++
  ) {
    const slotIdx = seedingOrder.indexOf(logicalSeed);
    if (slotIdx === -1 || !slots[slotIdx].isBye) continue;
    const entry = shuffledNonSeeded[nonSeededIndex];
    slots[slotIdx] = {
      entryId: entry.id,
      competitorId: entry.competitor.id,
      competitorName: entry.competitor.name,
      competitorPhoto: entry.competitor.photo_url,
      isBye: false,
    };
    nonSeededIndex++;
  }

  // Pre-mint UUIDs for every duel slot in the bracket (main + bronze).
  // We need IDs up front so the create call can reference next_duel_id /
  // bronze_duel_id in the same INSERT statement.
  const idAt = new Map<string, string>();
  for (let round = 1; round <= totalRounds; round++) {
    const duelsInRound = Math.pow(2, totalRounds - round);
    for (let position = 0; position < duelsInRound; position++) {
      idAt.set(`${round}-${position}`, randomUUID());
    }
  }
  const bronzeId = totalRounds >= 2 ? randomUUID() : null;
  const semifinalRound = totalRounds - 1;

  const duels: DuelData[] = [];

  // Round 1 — slot pairs from the placement phase.
  const firstRoundDuels = bracketSize / 2;
  for (let position = 0; position < firstRoundDuels; position++) {
    const slotA = slots[position * 2];
    const slotB = slots[position * 2 + 1];
    const isWalkover = slotA.isBye || slotB.isBye;

    // Where does the winner of this duel go?
    const isFinalRound = 1 === totalRounds;
    const nextDuelId = isFinalRound ? null : idAt.get(`2-${Math.floor(position / 2)}`) ?? null;
    const nextSlot: 'a' | 'b' | null = isFinalRound ? null : position % 2 === 0 ? 'a' : 'b';

    duels.push({
      id: idAt.get(`1-${position}`)!,
      round: 1,
      position,
      entry_a_id: slotA.isBye ? null : slotA.entryId,
      entry_b_id: slotB.isBye ? null : slotB.entryId,
      status: isWalkover ? 'walkover' : 'pending',
      next_duel_id: nextDuelId,
      next_duel_slot: nextSlot,
      // Round 1 only feeds bronze when round 1 IS the semifinal (4-entry bracket).
      bronze_duel_id: bronzeId && 1 === semifinalRound ? bronzeId : null,
      is_bronze_match: false,
    });
  }

  // Rounds 2..totalRounds (placeholder duels — entries filled in by cascade as
  // earlier duels complete).
  for (let round = 2; round <= totalRounds; round++) {
    const duelsInRound = Math.pow(2, totalRounds - round);
    const isFinalRound = round === totalRounds;
    for (let position = 0; position < duelsInRound; position++) {
      const nextDuelId = isFinalRound ? null : idAt.get(`${round + 1}-${Math.floor(position / 2)}`) ?? null;
      const nextSlot: 'a' | 'b' | null = isFinalRound ? null : position % 2 === 0 ? 'a' : 'b';
      duels.push({
        id: idAt.get(`${round}-${position}`)!,
        round,
        position,
        entry_a_id: null,
        entry_b_id: null,
        status: 'pending',
        next_duel_id: nextDuelId,
        next_duel_slot: nextSlot,
        bronze_duel_id: bronzeId && round === semifinalRound ? bronzeId : null,
        is_bronze_match: false,
      });
    }
  }

  // 3rd-place playoff: only when there are semifinals (totalRounds >= 2).
  // Position = 1 so it sits next to the final (position 0) in the same round.
  if (bronzeId) {
    duels.push({
      id: bronzeId,
      round: totalRounds,
      position: 1,
      entry_a_id: null,
      entry_b_id: null,
      status: 'pending',
      next_duel_id: null,
      next_duel_slot: null,
      bronze_duel_id: null,
      is_bronze_match: true,
    });
  }

  return duels;
}

/**
 * Calculate which round a competitor was eliminated in
 */
export function calculateEliminationRound(
  totalRounds: number,
  roundLost: number
): number {
  return roundLost;
}
