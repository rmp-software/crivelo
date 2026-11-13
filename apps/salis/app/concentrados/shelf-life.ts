/**
 * Shelf life — when a bottle the student prepared stops being fresh.
 *
 * `docs/01-v1-plan.md` § Calculation rules: "Prep date + shelf life from the
 * concentrate; past it, the inventory row and every recipe row carry ⚠ but
 * still compute." Two screens therefore ask the same question of the same two
 * values, so the date arithmetic lives here rather than being re-derived in
 * each — S5's inventory row (`./inventory.tsx`) and the recipe row (RMP-254)
 * import this, and a change to the rule lands in one place.
 *
 * **A warning, never a blocker.** Nothing here returns "unusable". `expired` is
 * an extra line on a row; the drops are computed from the concentrate's own ion
 * yield either way (`docs/01` § Never block a brew).
 *
 * Pure, and the clock is an argument with a default, so the tests can stand on
 * a fixed day instead of on whatever day CI runs.
 */

/** A prepared bottle's freshness, as of one calendar day. */
export interface ShelfLife {
  /**
   * The last day the bottle is good, `YYYY-MM-DD`. Inclusive — a 90-day
   * concentrate prepared on the 1st is still fresh on day 90 and old on day 91.
   */
  expiresOn: string;
  /** Past {@link expiresOn}. Carries the ⚠, decides nothing else. */
  expired: boolean;
}

const MS_PER_DAY = 86_400_000;

/**
 * Today on the *user's* calendar, as `YYYY-MM-DD`.
 *
 * A second copy of `device-store.ts`'s private `todayIso` — deliberately not
 * imported, because that one is module-private there and this sub-issue does
 * not own that file. Both exist for the same reason: UTC can already be
 * tomorrow in Brazil, and a bottle must not expire a day early because the
 * clock rolled over in London.
 */
function todayIso(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * How long a prepared bottle has left, or `null` when the question does not
 * apply — no prep date (S0 can seed an inventory without one), a date the
 * store would not have written, or a shelf life that is not a count of days.
 *
 * **The shelf life must be a positive whole number of days.**
 * `docs/03-content-schema.md` types the column `int`, but the importer's
 * `requireNumber` only checks that the cell *is* a number, so a `-5` or a `0`
 * or a `0.5` from Juliana's sheet reaches here undefended — and with only a
 * finiteness guard, `shelfLife("2026-11-13", -5, "2026-11-13")` answered
 * `{ expiresOn: "2026-11-08", expired: true }`: a bottle reported dead the
 * moment it was prepared, on two screens. Rejecting it means the row says
 * "Você tem este concentrado." and the recipe row's band stays quiet, which is
 * the right answer to a question the content cannot pose properly.
 *
 * The arithmetic runs in **UTC** on purpose: a date-only string parses as UTC
 * midnight, and adding whole days to a UTC instant can never land on a DST
 * boundary, so `2026-10-15 + 90` is the same day in every timezone. Only the
 * comparison is local, via {@link todayIso} — which is the half that should be,
 * since "has it expired?" is asked against the kitchen calendar.
 *
 * @param preparedOn `state.prepared_on[concentrate.id]`.
 * @param shelfLifeDays `concentrate.shelf_life_days`, from Juliana's sheet.
 * @param today the day to judge against, `YYYY-MM-DD`. Defaults to the device's.
 */
export function shelfLife(
  preparedOn: string | undefined,
  shelfLifeDays: number,
  today: string = todayIso(),
): ShelfLife | null {
  if (!preparedOn || !Number.isInteger(shelfLifeDays) || shelfLifeDays <= 0) {
    return null;
  }
  const prepared = Date.parse(preparedOn);
  if (Number.isNaN(prepared)) return null;
  // The round-trip is the whole shape check, and it is the same one
  // `device-store.ts` applies on the way in. A regex would NOT be equivalent:
  // `2026-02-31` matches `YYYY-MM-DD` and parses — V8 rolls it over to March 3
  // — so only printing it back catches it. A timestamped string is caught the
  // same way.
  if (new Date(prepared).toISOString().slice(0, 10) !== preparedOn) return null;

  const expiresOn = new Date(prepared + shelfLifeDays * MS_PER_DAY)
    .toISOString()
    .slice(0, 10);

  // `YYYY-MM-DD` sorts lexicographically, so there is no date maths left to get
  // wrong here — and no second parse to disagree with the first.
  return { expiresOn, expired: expiresOn < today };
}
