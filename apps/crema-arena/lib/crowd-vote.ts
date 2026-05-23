// Server-side crowd-vote aggregation. Pure, Prisma-free, unit-testable.
//
// `computeCrowdFavorite` derives the "Favorito do público" award from an
// event's duels. The caller loads the data (duels with crowd_votes_a/b,
// status, and both entries -> competitor); this function only does math, so
// the win/tiebreak rule is defined once and can be tested in isolation.

/** Minimal competitor shape needed for the award. */
export interface CrowdFavoriteCompetitor {
  id: string;
  name: string;
  photoUrl: string;
  coffeeShop: string;
}

/** An entry slot in a duel — links to its competitor. */
export interface CrowdVoteEntry {
  id: string;
  competitor: CrowdFavoriteCompetitor;
}

/** A duel as the caller must load it for crowd-favorite math. */
export interface CrowdVoteDuel {
  status: string;
  crowd_votes_a: number;
  crowd_votes_b: number;
  entry_a: CrowdVoteEntry | null;
  entry_b: CrowdVoteEntry | null;
}

export interface CrowdFavorite {
  competitor: CrowdFavoriteCompetitor;
  crowdWins: number;
  crowdVotes: number;
}

interface Tally {
  competitor: CrowdFavoriteCompetitor;
  crowdWins: number;
  crowdVotes: number;
  order: number; // first-seen index, for stable tiebreak
}

/**
 * Crown the crowd favorite for an event.
 *
 * - **crowdVotes** per competitor: sum of crowd votes cast for the side they
 *   were on, across every duel where they appear with a defined side (both
 *   entries present), completed or not.
 * - **crowd "win"** per duel: the entry on the strict-majority crowd side of a
 *   *completed* duel with both entries present. Equal counts (incl. 0 == 0)
 *   credit no win to anyone.
 * - **winner**: max crowdWins, tiebreak by max crowdVotes, then stable by
 *   first-seen entry order.
 * - Returns `null` when no crowd votes were cast at all (every duel 0/0).
 */
export function computeCrowdFavorite(duels: CrowdVoteDuel[]): CrowdFavorite | null {
  const tallies = new Map<string, Tally>();
  let order = 0;
  let anyVotesCast = false;

  const ensure = (entry: CrowdVoteEntry): Tally => {
    let t = tallies.get(entry.competitor.id);
    if (!t) {
      t = { competitor: entry.competitor, crowdWins: 0, crowdVotes: 0, order: order++ };
      tallies.set(entry.competitor.id, t);
    }
    return t;
  };

  for (const duel of duels) {
    // Only two-entry duels carry a defined side for each competitor.
    if (!duel.entry_a || !duel.entry_b) continue;

    const a = duel.crowd_votes_a ?? 0;
    const b = duel.crowd_votes_b ?? 0;
    if (a > 0 || b > 0) anyVotesCast = true;

    // crowdVotes: sum of votes on the side each competitor was on (all duels).
    ensure(duel.entry_a).crowdVotes += a;
    ensure(duel.entry_b).crowdVotes += b;

    // crowd win: only completed duels, strict majority. Equal => no credit.
    if (duel.status === 'completed') {
      if (a > b) {
        ensure(duel.entry_a).crowdWins += 1;
      } else if (b > a) {
        ensure(duel.entry_b).crowdWins += 1;
      }
    }
  }

  if (!anyVotesCast) return null;

  let best: Tally | null = null;
  for (const t of Array.from(tallies.values())) {
    if (
      best === null ||
      t.crowdWins > best.crowdWins ||
      (t.crowdWins === best.crowdWins && t.crowdVotes > best.crowdVotes) ||
      (t.crowdWins === best.crowdWins &&
        t.crowdVotes === best.crowdVotes &&
        t.order < best.order)
    ) {
      best = t;
    }
  }

  if (!best) return null;

  return {
    competitor: best.competitor,
    crowdWins: best.crowdWins,
    crowdVotes: best.crowdVotes,
  };
}
