/**
 * Data cadence tiers for Crema Arena polling.
 *
 * - HOT (5s): live duel state. Endpoints: current-duel, bracket, leaderboard.
 *   Client polls every CADENCE_HOT_MS; no shared caching.
 * - COLD (one-shot): fetched once at page load, not polled. Event metadata,
 *   competitor pool, organizer profile.
 * - FROZEN (15s): near-static data that changes during an event but rarely.
 *   Sponsors are the inaugural case. Server sets `Cache-Control: public,
 *   max-age=<CADENCE_FROZEN_MS/1000>` (and `next: { revalidate }` on internal
 *   fetches); client polls every CADENCE_FROZEN_MS.
 *
 * Future near-static endpoints (judge roster, etc.) should reuse FROZEN
 * rather than being added to the hot polling payload.
 */
export const CADENCE_HOT_MS = 5_000;
export const CADENCE_FROZEN_MS = 15_000;
