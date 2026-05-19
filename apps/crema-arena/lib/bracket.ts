// Bracket generation utility for single-elimination tournaments

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

interface DuelData {
  round: number;
  position: number;
  entry_a_id: string | null;
  entry_b_id: string | null;
  next_duel_id?: string;
  next_duel_slot?: 'a' | 'b';
  status: 'pending' | 'walkover';
  is_bronze_match?: boolean;
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
  const positions: number[] = [];

  // Build seeding array recursively
  function buildSeeding(size: number): number[] {
    if (size === 2) {
      return [1, 2];
    }

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
 * Generate bracket structure for a single-elimination tournament
 * @param entries - Event entries with competitors
 * @returns Array of duel data to create in the database
 */
export function generateBracket(entries: EventEntry[]): DuelData[] {
  if (entries.length < 2) {
    throw new Error('At least 2 competitors required to generate bracket');
  }

  // Calculate bracket size (next power of 2)
  const bracketSize = nextPowerOf2(entries.length);

  // Get standard seeding positions
  const seedingOrder = getStandardSeedingPositions(bracketSize);

  // Separate seeded and non-seeded entries
  const seededEntries = entries.filter(e => e.seed !== null).sort((a, b) => a.seed! - b.seed!);
  const nonSeededEntries = entries.filter(e => e.seed === null);

  // Shuffle non-seeded entries randomly
  const shuffledNonSeeded = [...nonSeededEntries].sort(() => Math.random() - 0.5);

  // Create bracket slots
  const slots: BracketSlot[] = Array(bracketSize).fill(null).map(() => ({
    entryId: null,
    competitorId: null,
    competitorName: null,
    competitorPhoto: null,
    isBye: true,
  }));

  // Place seeded competitors at their standard positions
  seededEntries.forEach((entry) => {
    const seed = entry.seed!;
    if (seed > 0 && seed <= bracketSize) {
      // Find the position for this seed in the seeding order
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

  // Fill remaining slots with non-seeded competitors
  let nonSeededIndex = 0;
  for (let i = 0; i < slots.length && nonSeededIndex < shuffledNonSeeded.length; i++) {
    if (slots[i].isBye) {
      const entry = shuffledNonSeeded[nonSeededIndex];
      slots[i] = {
        entryId: entry.id,
        competitorId: entry.competitor.id,
        competitorName: entry.competitor.name,
        competitorPhoto: entry.competitor.photo_url,
        isBye: false,
      };
      nonSeededIndex++;
    }
  }

  // Generate duels for all rounds
  const duels: DuelData[] = [];
  const totalRounds = Math.log2(bracketSize);

  // Create a map to track duel IDs (we'll use temporary IDs and update later)
  const duelMap: { [key: string]: string } = {};

  // Generate first round duels
  const firstRoundDuels = bracketSize / 2;
  for (let position = 0; position < firstRoundDuels; position++) {
    const slotA = slots[position * 2];
    const slotB = slots[position * 2 + 1];

    // Determine if this is a walkover (bye)
    const isWalkover = slotA.isBye || slotB.isBye;

    const duel: DuelData = {
      round: 1,
      position,
      entry_a_id: slotA.isBye ? null : slotA.entryId,
      entry_b_id: slotB.isBye ? null : slotB.entryId,
      status: isWalkover ? 'walkover' : 'pending',
    };

    duels.push(duel);
    duelMap[`1-${position}`] = `1-${position}`; // Temporary ID
  }

  // Generate subsequent rounds
  for (let round = 2; round <= totalRounds; round++) {
    const duelsInRound = Math.pow(2, totalRounds - round);

    for (let position = 0; position < duelsInRound; position++) {
      const duel: DuelData = {
        round,
        position,
        entry_a_id: null,
        entry_b_id: null,
        status: 'pending',
      };

      duels.push(duel);
      duelMap[`${round}-${position}`] = `${round}-${position}`;
    }
  }

  // 3rd-place playoff: only when there are semifinals (totalRounds >= 2).
  // Position = 1 so it sits next to the final (position 0) in the same round.
  if (totalRounds >= 2) {
    duels.push({
      round: totalRounds,
      position: 1,
      entry_a_id: null,
      entry_b_id: null,
      status: 'pending',
      is_bronze_match: true,
    });
  }

  return duels;
}

/**
 * Link duels together to form the tournament tree
 * This should be called after duels are created in the database
 */
export function linkDuels(duels: { id: string; round: number; position: number; is_bronze_match?: boolean }[]): Array<{
  id: string;
  next_duel_id: string | null;
  next_duel_slot: 'a' | 'b' | null;
  bronze_duel_id?: string | null;
}> {
  const updates: Array<{
    id: string;
    next_duel_id: string | null;
    next_duel_slot: 'a' | 'b' | null;
    bronze_duel_id?: string | null;
  }> = [];

  // The "main" bracket excludes the bronze match for cascade math.
  const mainDuels = duels.filter((d) => !d.is_bronze_match);
  const bronzeDuel = duels.find((d) => d.is_bronze_match);
  const maxMainRound = mainDuels.length > 0 ? Math.max(...mainDuels.map((d) => d.round)) : 0;
  const semifinalRound = maxMainRound - 1;

  // Sort duels by round and position
  const sortedDuels = [...duels].sort((a, b) => {
    if (a.round !== b.round) return a.round - b.round;
    return a.position - b.position;
  });

  // Lookup for the main-bracket duel at (round,position)
  const duelMap = new Map<string, string>();
  mainDuels.forEach((duel) => {
    duelMap.set(`${duel.round}-${duel.position}`, duel.id);
  });

  sortedDuels.forEach((duel) => {
    if (duel.is_bronze_match) {
      // Bronze duel itself doesn't cascade anywhere.
      updates.push({ id: duel.id, next_duel_id: null, next_duel_slot: null });
      return;
    }

    if (duel.round < maxMainRound) {
      const nextRound = duel.round + 1;
      const nextPosition = Math.floor(duel.position / 2);
      const nextSlot: 'a' | 'b' = duel.position % 2 === 0 ? 'a' : 'b';
      const nextDuelKey = `${nextRound}-${nextPosition}`;
      const nextDuelId = duelMap.get(nextDuelKey);

      const update: {
        id: string;
        next_duel_id: string | null;
        next_duel_slot: 'a' | 'b' | null;
        bronze_duel_id?: string | null;
      } = {
        id: duel.id,
        next_duel_id: nextDuelId ?? null,
        next_duel_slot: nextDuelId ? nextSlot : null,
      };

      // Semi losers feed the bronze duel: even-position semi → bronze slot A, odd → slot B
      if (bronzeDuel && duel.round === semifinalRound) {
        update.bronze_duel_id = bronzeDuel.id;
      }

      updates.push(update);
    } else {
      // Final - no next duel
      updates.push({ id: duel.id, next_duel_id: null, next_duel_slot: null });
    }
  });

  return updates;
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
