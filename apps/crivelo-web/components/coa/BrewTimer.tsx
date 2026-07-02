"use client";

/**
 * BrewTimer (RMP-224) — the redesigned running brew flow. A faithful port of
 * the locked prototype apps/crivelo-web/.design/crivelo-website/project/coa-timer.jsx
 * into idiomatic Next/Tailwind (no window.Coa globals, no inline-`var()` styling).
 *
 * The ring is a true timer: a big mm:ss elapsed clock sits in the center (Geist
 * Mono) with "of {totalTime}" beneath, while the wheel fills with overall
 * progress and pour-point dots fill as they pass. Every pour of the 4:6 schedule
 * is split into two EXPLICIT phases via `buildPhases` — a "pour" then a
 * "draw"-down — driving both the live readout and a dynamic, tiered recipe list:
 * completed phases collapse into an expandable "{n} steps done" summary, the
 * current phase blows up into a highlighted card with its own progress bar and
 * time window, the next phase carries a "Next" badge, and a "Remove the dripper"
 * finale closes the list.
 *
 * A 5s "Get ready" pre-roll (status `countdown`) precedes timing: the ring
 * depletes full→empty over the pre-roll and lands empty exactly as the clock
 * starts (no snap); "Start now" skips it, and it auto-transitions to running at
 * 0. Real wall-clock time means a mid-brew refresh (phone propped on the
 * counter) resumes from the right place. Session persists under localStorage
 * 'coa-brew' as { status, base?, startTs?, cdStart? }; the load is
 * backward-tolerant so a stale/old-shaped session can't crash. Both themes and
 * `prefers-reduced-motion` honored.
 *
 * Sizing is CSS-driven, not JS: there is no `bp` prop. Responsive Tailwind
 * utilities (`md:` ≥768 = old "wide", `lg:` ≥1024 = old "desktop") pick the
 * container max-width, padding, the two-column grid, and the clock font. The dial
 * is a 270° gap arc (gauge, gap at the bottom) in a FIXED 272×226 viewBox
 * (geometry math in the 272 coordinate space, bottom dead space cropped) and the
 * rendered dial box scales via responsive width/height utilities (236×196 mobile
 * → 272×226 ≥md, clamped to 190×158 on short mobile viewports), so the SVG
 * faithfully scales without recomputing geometry.
 *
 * Live-brew guards (RMP-234): while a brew is live (countdown/running/paused)
 * the restart control is hold-to-confirm (~600ms rAF-driven fill; keyboard
 * activation opens an AlertDialog instead) and the exit affordances confirm via
 * AlertDialog before discarding the session. A screen wake lock (RMP-235) is
 * held through countdown/running. Opt-in pour cues (RMP-239): a bell toggle
 * (persisted under 'coa-brew-sound', default off) fires a short WebAudio chime
 * + vibration once per crossed pour boundary (and at removeAt), never replayed
 * on resume/refocus.
 */
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { cn } from "@crivelo/ui/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@crivelo/ui/alert-dialog";
import { Button } from "../ui/Button";
import {
  clamp,
  fmtTime,
  buildPhases,
  type Recipe,
  type TimerPhase,
} from "../../lib/four-six";
import { IS_DEBUG_ENV } from "../../lib/debug-env";
import { setLastBrew, type RecipeParams } from "../../lib/recipes-store";
import { useWakeLock } from "../../lib/use-wake-lock";
import { toBrewSpeed, type BrewSpeed } from "./brew-speed";
import { Icon } from "./icons";
import { SaveRecipeForm } from "./SaveRecipeForm";

const KEY = "coa-brew";

/** localStorage key for the dev-only chosen brew speed (non-prod only). */
const DEBUG_SPEED_KEY = "coa-debug-speed";

/**
 * The dev speed panel is code-split AND gated on a build-time-literal env check
 * (not the `IS_DEBUG_ENV` constant, whose function-call value the bundler can't
 * fold). Next inlines `process.env.NODE_ENV` / `NEXT_PUBLIC_*`, so on a Vercel
 * production build this whole expression folds to `null` and the dynamic
 * `import()` is dead-code-eliminated — the panel chunk is never emitted, fetched,
 * or rendered. `ssr: false`: a purely client-side, non-production affordance.
 */
const BrewDebugPanel =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_VERCEL_ENV !== "production"
    ? dynamic(() => import("./BrewDebugPanel").then((m) => m.BrewDebugPanel), {
        ssr: false,
      })
    : null;

/** Read the persisted dev speed. Pinned to real time (1×) outside debug envs. */
function loadDebugSpeed(): BrewSpeed {
  if (!IS_DEBUG_ENV || typeof window === "undefined") return 1;
  try {
    return toBrewSpeed(Number(localStorage.getItem(DEBUG_SPEED_KEY)));
  } catch {
    return 1;
  }
}

/** Seconds the "Get ready" pre-roll runs before the clock starts. */
const PREROLL = 5;

/** ms the restart button must be held before a live brew restarts (RMP-234). */
const HOLD_MS = 600;

/** localStorage key for the opt-in pour-cue toggle (RMP-239, default OFF). */
const SOUND_KEY = "coa-brew-sound";

/**
 * Single shared AudioContext for the pour chime. Created/resumed ONLY inside
 * user-gesture handlers (Start / bell-toggle taps) — iOS refuses to unlock
 * audio outside a gesture. Module-level so re-mounts reuse the unlocked ctx.
 */
let audioCtx: AudioContext | null = null;

function unlockAudio(): void {
  try {
    audioCtx ??= new AudioContext();
    if (audioCtx.state === "suspended") void audioCtx.resume();
  } catch {
    audioCtx = null; // no WebAudio — cues fall back to vibration only
  }
}

/** Two short quiet beeps (<0.4s total). No-op until a gesture unlocked audio. */
function playChime(): void {
  const ctx = audioCtx;
  if (!ctx || ctx.state !== "running") return;
  const t0 = ctx.currentTime;
  for (const at of [0, 0.18]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, t0 + at);
    gain.gain.exponentialRampToValueAtTime(0.1, t0 + at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + at + 0.13);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0 + at);
    osc.stop(t0 + at + 0.15);
  }
}

/** Vibrate alongside the chime where supported (no-op on iOS Safari). */
function buzz(): void {
  if ("vibrate" in navigator) navigator.vibrate([120, 80, 120]);
}

/** Read the persisted pour-cue opt-in. Defaults to off. */
function loadSoundPref(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) === "1";
  } catch {
    return false;
  }
}

/** tabular + slashed-zero mono numerals (clock / gram readouts). */
const MONO = "font-mono tabular-nums [font-feature-settings:'tnum','zero']";

/**
 * Zero-padded mm:ss for the hero ring clock (e.g. 13 -> "00:13", 90 -> "01:30").
 * The prototype pads the big center clock to two-digit minutes; the unpadded
 * `fmtTime` (m:ss) stays for the "of {total}" subtext and the list windows.
 */
function fmtMMSS(s: number): string {
  const v = Math.max(0, Math.floor(s));
  return (
    String(Math.floor(v / 60)).padStart(2, "0") +
    ":" +
    String(v % 60).padStart(2, "0")
  );
}

/** Section caption / dial label (11px uppercase tracked). */
const CAP = "text-[11px] font-semibold uppercase tracking-[0.08em]";

/** The reused brewing-pulse keyframe, guarded for reduced motion. */
const PULSE = "animate-brew-pulse motion-reduce:animate-none";

/**
 * Shared CTA look (54px tall pill), worn by the app-local Button wrapper. The
 * geometry rides in className via tailwind-merge so the primitive's
 * buttonVariants defaults are neutralised. `p-0 has-[>svg]:px-0` cancels the
 * size-default horizontal padding (these full-width pills are centred).
 */
const CTA_BASE =
  "flex h-[54px] w-full cursor-pointer items-center justify-center gap-[9px] rounded-md p-0 font-body text-body font-semibold whitespace-normal has-[>svg]:px-0";
const CTA_SOLID = "bg-brand text-white border-none shadow-1 hover:bg-brand";
const CTA_OUTLINE =
  "bg-transparent text-fg border border-border-strong shadow-none hover:bg-transparent hover:text-fg";

type Status = "ready" | "countdown" | "running" | "paused" | "done";

interface Session {
  status: Status;
  /**
   * Canonical recipe-params query stamp (`recipeParamsToQuery` output) this
   * session was started for. The brew route resets a session whose stamp doesn't
   * match the incoming URL params, so starting a brew with new params never
   * resumes a previous brew's timer; a same-params reload resumes it.
   */
  params?: string;
  /** Frozen elapsed seconds (paused/done) or the running baseline. */
  base?: number;
  /** Wall-clock ms when the running clock last started; null when not running. */
  startTs?: number | null;
  /** Wall-clock ms when the pre-roll countdown started. */
  cdStart?: number;
}

/**
 * Read the persisted session. Backward-tolerant: a missing key, malformed JSON,
 * or a stale/old-shaped session returns null so we fall back to a fresh pre-roll
 * rather than crashing on a field the old component never wrote.
 */
function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<Session>;
    if (
      !s ||
      typeof s !== "object" ||
      (s.status !== "ready" &&
        s.status !== "countdown" &&
        s.status !== "running" &&
        s.status !== "paused" &&
        s.status !== "done")
    ) {
      return null;
    }
    return s as Session;
  } catch {
    return null;
  }
}

/**
 * Discard any persisted brew session. Used on exit (leaving the brew route) so a
 * completed/abandoned brew doesn't linger, and as the underlying primitive for
 * the params-change reset below.
 *
 * Resume-on-reload is now wired via the route: the `/brew` page mounts this timer
 * directly, and a same-params reload mid-brew resumes the persisted session (a
 * phone propped on the counter). The reset that prevents resuming a *different*
 * brew's timer is driven by the params stamp in `resolveSession`, not by this
 * clear — starting a brew with new URL params lands a fresh session because its
 * stamp won't match the stale one.
 */
export function clearBrewSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** A session that is mid-brew — the only kind worth resuming on re-entry. */
function isInProgress(status: Status): boolean {
  return status === "countdown" || status === "running" || status === "paused";
}

/**
 * Resolve the session to open with, given the route's canonical params `query`
 * and the `autostart` flag. Resume the persisted session ONLY when its params
 * stamp matches the incoming query AND it is still mid-brew (`countdown` /
 * `running` / `paused`) — an accidental reload of a live brew. A stamped session
 * that is `done` or `ready` is NOT resumed even on matching params: tapping
 * "Begin brew" again must start fresh, honoring the incoming `autostart`, not
 * remount onto the done/ready screen. Otherwise start fresh — `countdown`
 * (pre-roll on load) when `autostart`, else the `ready` pre-state. Every fresh
 * session is stamped with `query` so the next mount can tell "same brew" from
 * "new params". Pure but reads localStorage.
 */
function resolveSession(query: string, autostart: boolean): Session {
  const prev = loadSession();
  if (prev && prev.params === query && isInProgress(prev.status)) return prev;
  return autostart
    ? { status: "countdown", cdStart: Date.now(), params: query }
    : { status: "ready", params: query };
}

export interface BrewTimerProps {
  recipe: Recipe;
  /**
   * The resolved recipe inputs `recipe` was derived from. Carried alongside
   * `recipe` (which is the derived schedule) because the save system persists the
   * four inputs, not the schedule: on `done` they are written to `coa-last-brew`
   * and seed the "Save recipe" form. Kept in lockstep with `query` (its canonical
   * serialization) via the route.
   */
  params: RecipeParams;
  /**
   * Canonical recipe-params query (`recipeParamsToQuery` output) the brew route
   * derived `recipe` from. Stamped onto the persisted session so a same-params
   * reload resumes and a different-params entry resets (never resuming a previous
   * brew's timer).
   */
  query: string;
  /**
   * `true` (URL `autostart=1`, from "Begin brew") starts the pre-roll countdown
   * on load; `false` (URL `autostart=0`, from a "Brew again") lands in the
   * "ready" state until the user taps Start. Only decides the *fresh* session's
   * initial status — a matching-params resume keeps its persisted status.
   */
  autostart: boolean;
  /** Leave the brew route (back to the idle calculator). Clears the session. */
  onExit: () => void;
}

export function BrewTimer({
  recipe,
  params,
  query,
  autostart,
  onExit,
}: BrewTimerProps) {
  const t = useTranslations("BrewTimer");
  const tCalc = useTranslations("Calculator");
  const tSchedule = useTranslations("Schedule");

  // Resolve the opening session from the route's params + autostart: resume a
  // same-params session (accidental reload), else start fresh (pre-roll on
  // autostart, otherwise the "ready" pre-state). BrewTimer only mounts
  // client-side, so reading localStorage in the initializer is safe (no
  // SSR/hydration concern).
  const [sess, setSess] = useState<Session>(() =>
    resolveSession(query, autostart),
  );
  const [, force] = useState(0);
  const [expandDone, setExpandDone] = useState(false);
  // Controls the "Save recipe" dialog opened from the done screen.
  const [saveOpen, setSaveOpen] = useState(false);

  // Dev-only brew-clock multiplier (always 1× in production). It scales the live
  // wall-clock delta below so a full brew can be exercised in seconds; recipe
  // math and displayed times are untouched.
  const [debugSpeed, setDebugSpeed] = useState<BrewSpeed>(loadDebugSpeed);
  const speed = IS_DEBUG_ENV ? debugSpeed : 1;

  // RMP-234: live-brew guards. Hold-to-restart fill fraction (0..1, rAF-driven)
  // plus the two confirm dialogs (restart via keyboard, exit while live).
  const [holdFrac, setHoldFrac] = useState(0);
  const holdRaf = useRef(0);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);

  // RMP-239: opt-in pour cues (client-only mount — localStorage read is safe).
  const [soundOn, setSoundOn] = useState(loadSoundPref);

  // Persist on every change.
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(sess));
    } catch {
      /* ignore */
    }
  }, [sess]);

  // 200ms tick — re-render so the wall-clock readouts advance.
  useEffect(() => {
    const id = setInterval(() => force((x) => x + 1), 200);
    return () => clearInterval(id);
  }, []);

  // Seconds elapsed since a stored timestamp, scaled by the (dev) brew speed.
  // The single funnel for every wall-clock read so acceleration is uniform.
  const since = (ts: number) => ((Date.now() - ts) / 1000) * speed;

  const liveElapsed = () => {
    if (sess.status === "running" && sess.startTs != null) {
      return (sess.base ?? 0) + since(sess.startTs);
    }
    if (sess.status === "countdown") return 0;
    return sess.base ?? 0;
  };

  let elapsed = liveElapsed();
  const finished = elapsed >= recipe.removeAt;
  if (finished) elapsed = recipe.removeAt;

  // Pre-roll countdown (depletes full→empty over PREROLL seconds).
  const counting = sess.status === "countdown";
  const cdLeft =
    counting && sess.cdStart != null
      ? Math.max(0, PREROLL - since(sess.cdStart))
      : 0;

  // Auto-transition the pre-roll into the running clock at 0. Keeps the params
  // stamp so a reload through running still resumes (no reset).
  useEffect(() => {
    if (counting && sess.cdStart != null && since(sess.cdStart) >= PREROLL) {
      setSess((s) => ({ ...s, status: "running", base: 0, startTs: Date.now() }));
    }
  });

  // Flip a running session to done once it crosses removeAt.
  useEffect(() => {
    if (sess.status === "running" && liveElapsed() >= recipe.removeAt) {
      setSess((s) => ({ ...s, status: "done", base: recipe.removeAt, startTs: null }));
    }
  });

  // Phases.
  const phases = buildPhases(recipe);
  const done = sess.status === "done" || finished;
  const paused = sess.status === "paused";

  // RMP-235: keep the screen awake while the brew is actually ticking
  // (countdown/running); paused/done/ready release, unmount releases.
  useWakeLock(sess.status === "countdown" || sess.status === "running");

  // RMP-239: pour-boundary cue bookkeeping. Boundaries are each pour start plus
  // the final removeAt. `lastCueIdx` is the last boundary index already cued;
  // on a resumed mid-brew mount it syncs silently to the current position so a
  // reload/refocus never replays cues, and a jump past several boundaries
  // (backgrounded tab) fires at most one cue.
  const boundaries = recipe.steps.map((s) => s.t).concat(recipe.removeAt);
  const crossedIdx = (el: number) => {
    let i = -1;
    while (i + 1 < boundaries.length && el >= boundaries[i + 1]) i++;
    return i;
  };
  const lastCueIdx = useRef<number | null>(null);
  lastCueIdx.current ??=
    sess.status === "running" || sess.status === "paused" || done
      ? crossedIdx(elapsed)
      : -1;
  useEffect(() => {
    if (sess.status !== "running") return;
    const idx = crossedIdx(elapsed);
    if (idx > (lastCueIdx.current ?? -1)) {
      // Advance even when the toggle is off so flipping it mid-brew never
      // replays already-passed boundaries.
      lastCueIdx.current = idx;
      if (soundOn) {
        playChime();
        buzz();
      }
    }
  });

  // Silently capture this brew as the implicit "last brew" the instant it reaches
  // done — no prompt. Guarded so it writes exactly once per done-entry: the 200ms
  // tick re-renders this component ~5×/s while the done screen is shown, and a
  // same-params reload remounts with `key={query}`, so without a guard `setLastBrew`
  // would fire on every frame. The ref is keyed on `query` (the canonical params): a
  // fresh brew with new params re-arms the write, but repeated renders of the same
  // done screen do not. The "Save recipe" form is an explicit, separate action; this
  // last-brew write happens regardless of whether the user saves.
  const lastBrewWrittenFor = useRef<string | null>(null);
  useEffect(() => {
    if (done && lastBrewWrittenFor.current !== query) {
      lastBrewWrittenFor.current = query;
      setLastBrew(params);
    }
  }, [done, query, params]);
  // The "ready" pre-state (autostart=0): nothing runs until Start is tapped.
  const ready = sess.status === "ready";
  let curIdx = phases.findIndex((p) => elapsed < p.end);
  if (curIdx === -1) curIdx = phases.length - 1;
  const cur = phases[curIdx];
  const pourPhase = !done && !counting && !ready && cur.kind === "pour";

  // Ring geometry. The SVG coordinate space is a FIXED 272 viewBox; CSS scales the
  // rendered dial box per breakpoint (236px mobile → 272px ≥md), so every derived
  // value (R, CX, CIRC, pour ticks, strokeDashoffset) stays in the 272 space and
  // scales faithfully with the box. The live ring fill / tick fills remain runtime
  // inline-style bridges.
  const SZ = 272;
  const STROKE = 8;
  const R = SZ / 2 - STROKE / 2 - 13;
  const CX = SZ / 2;
  const CIRC = 2 * Math.PI * R;
  // 270° gap arc (gauge, RMP-238): gap centered at the bottom. In SVG coords
  // (y down, angles clockwise) the arc starts at 135° (bottom-left) and sweeps
  // 270° to 45° (bottom-right) — same direction the circle's dash runs after
  // `rotate(135)`. Dash pattern `ARC on, CIRC off` has period > path length, so
  // offset ARC·(1-p) fills exactly [0, p·ARC] with no wraparound tail; p=1 is
  // the full 270°, never beyond.
  const ARC = 0.75 * CIRC;
  const ARC_START = 135;
  const ARC_SWEEP = 270;
  // Cropped viewBox height: arc bottom extremes sit at CX + R·sin45° + caps ≈ 225,
  // so 226 trims the dead space below the gap (box height = 226/272 ≈ 83% of width).
  const VBH = 226;
  const progress =
    counting || ready
      ? // Ready + the pre-roll's first frame both show a full ring (it depletes
        // once the countdown starts).
        ready
        ? 1
        : clamp(cdLeft / PREROLL, 0, 1)
      : clamp(elapsed / recipe.removeAt, 0, 1);
  const ringStroke = done ? "var(--success)" : "var(--brand)";
  const pourTicks = recipe.steps.map((s) => s.t / recipe.removeAt);

  // Controls. Every fresh-session transition re-stamps `query` so a reload after
  // it still resumes (a stamp drop would look like new params and reset).
  const pause = () =>
    setSess((s) => ({ ...s, status: "paused", base: liveElapsed(), startTs: null }));
  const resume = () => {
    unlockAudio();
    setSess((s) => ({ ...s, status: "running", startTs: Date.now() }));
  };
  // Start (from the "ready" pre-state) enters the existing countdown → running
  // flow — the pre-roll, identical to an autostart entry. Start/restart re-arm
  // the pour-cue tracker and count as the audio-unlock gesture (iOS).
  const start = () => {
    unlockAudio();
    lastCueIdx.current = -1;
    setSess({ status: "countdown", cdStart: Date.now(), params: query });
  };
  const restart = () => {
    unlockAudio();
    lastCueIdx.current = -1;
    setSess({ status: "countdown", cdStart: Date.now(), params: query });
  };
  const startNow = () => {
    unlockAudio();
    lastCueIdx.current = -1;
    setSess({ status: "running", base: 0, startTs: Date.now(), params: query });
  };
  const exit = () => {
    clearBrewSession();
    onExit();
  };
  // A live brew (countdown/running/paused) is guarded: exiting confirms first,
  // restarting requires the hold (pointer) or the confirm dialog (keyboard).
  const live = isInProgress(sess.status);
  const requestExit = () => (live ? setConfirmExit(true) : exit());

  // Hold-to-restart: rAF drives the fill; completing the hold restarts, any
  // early release/leave/cancel aborts. The rendered fill height is a runtime
  // bridge (per-frame value), so its inline style is legitimate.
  const beginHold = () => {
    cancelAnimationFrame(holdRaf.current);
    const t0 = performance.now();
    const step = (now: number) => {
      const f = Math.min(1, (now - t0) / HOLD_MS);
      setHoldFrac(f);
      if (f >= 1) {
        setHoldFrac(0);
        restart();
      } else {
        holdRaf.current = requestAnimationFrame(step);
      }
    };
    holdRaf.current = requestAnimationFrame(step);
  };
  const cancelHold = () => {
    cancelAnimationFrame(holdRaf.current);
    setHoldFrac(0);
  };
  useEffect(() => () => cancelAnimationFrame(holdRaf.current), []);

  // RMP-239: bell toggle. Opting in doubles as the iOS audio-unlock gesture.
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    try {
      localStorage.setItem(SOUND_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
    if (next) unlockAudio();
  };

  // Dev-only: change the brew speed. Rebase a running clock first — freeze the
  // brew-seconds accumulated at the old speed into `base` and restart the delta —
  // so the new multiplier applies going forward without a jump in the readout.
  // `base` is computed from the updater's own `s` (not the render-closure `sess`)
  // and the current `speed`, so a concurrent re-render can't desync the rebase.
  const changeSpeed = (next: BrewSpeed) => {
    setSess((s) =>
      s.status === "running" && s.startTs != null
        ? {
            ...s,
            base: (s.base ?? 0) + ((Date.now() - s.startTs) / 1000) * speed,
            startTs: Date.now(),
          }
        : s,
    );
    setDebugSpeed(next);
    try {
      localStorage.setItem(DEBUG_SPEED_KEY, String(next));
    } catch {
      /* ignore */
    }
  };

  // Ring-center status word (distinguishes pour vs draw, unlike the top pill).
  // "Ready" (pre-start) and "Get ready" (countdown) are distinct (RMP-244).
  const statusWord = ready
    ? t("ready")
    : counting
      ? t("getReady")
      : done
        ? t("complete")
        : paused
          ? t("paused")
          : pourPhase
            ? t("pouring")
            : t("drawDown");
  const statusTone =
    ready || counting
      ? "text-accent-ink"
      : done
        ? "text-success"
        : paused
          ? "text-fg-3"
          : pourPhase
            ? "text-accent-ink"
            : "text-fg-3";
  // The pulsing status dot rides currentColor so it tracks the status tone.
  const dotTone =
    ready || counting
      ? "bg-accent-ink"
      : done
        ? "bg-success"
        : paused
          ? "bg-fg-3"
          : pourPhase
            ? "bg-accent-ink"
            : "bg-fg-3";

  // Bold "what now" + a mono detail under the ring.
  // Rich-text emphasis renders via t.rich; emphasized values get a colored span.
  const fg = (chunks: ReactNode) => <span className="text-fg">{chunks}</span>;
  const ink = (chunks: ReactNode) => (
    <span className="text-accent-ink">{chunks}</span>
  );

  let action: ReactNode;
  let detail: ReactNode;
  let actionTone: string;
  if (ready) {
    action = t("readyTitle");
    detail = t("readyHint");
    actionTone = "text-accent-ink";
  } else if (counting) {
    action = t("getReady");
    detail = t("brewStartsIn", { n: Math.ceil(cdLeft) });
    actionTone = "text-accent-ink";
  } else if (done) {
    action = t("complete");
    detail = t("totalTime", { time: recipe.totalTime });
    actionTone = "text-success";
  } else if (paused) {
    action = t("paused");
    detail = t("resumeHint");
    actionTone = "text-fg-2";
  } else if (pourPhase) {
    action = t("pourNow");
    detail = t.rich("pourInSeconds", {
      b: fg,
      g: cur.add ?? 0,
      s: Math.round(cur.end - cur.start),
    });
    actionTone = "text-accent-ink";
  } else if (cur.isLastPour) {
    action = t("letItFinish");
    detail = t.rich("removeIn", {
      b: fg,
      time: fmtTime(Math.ceil(recipe.removeAt - elapsed)),
    });
    actionTone = "text-fg-2";
  } else {
    action = t("drawDown");
    detail = t.rich("nextPourIn", {
      b: fg,
      time: fmtTime(
        Math.ceil((cur.nextPourStart ?? recipe.removeAt) - elapsed),
      ),
    });
    actionTone = "text-fg-2";
  }

  // Recipe-list counter — pour-based (RMP-244): "Pour {n} of {total}", with a
  // draw-down suffix during drainage, matching the 5-pour card count (not the
  // 10 internal phases).
  const pourCounter =
    cur.kind === "pour"
      ? t("pourCounter", { n: cur.pourNo, total: cur.total })
      : t("pourCounterDraw", { n: cur.pourNo, total: cur.total });

  // ===== sub-components (closures over elapsed, t, paused) =====
  function CurrentCard({ p }: { p: TimerPhase }) {
    const isPour = p.kind === "pour";
    const frac = clamp((elapsed - p.start) / (p.end - p.start), 0, 1);
    return (
      <div
        className={cn(
          "my-1 rounded-md border-[1.5px] px-[18px] py-[15px] shadow-1",
          isPour
            ? "border-brand bg-accent-halo"
            : "border-border-strong bg-surface-raised",
        )}
      >
        <div className="mb-[9px] flex items-center gap-[7px]">
          <span className={cn(CAP, isPour ? "text-accent-ink" : "text-fg-2")}>
            {isPour
              ? t("nowPourOf", { n: p.pourNo, total: p.total })
              : t("nowDrawDown")}
          </span>
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              isPour ? "bg-brand" : "bg-fg-3",
              !paused && PULSE,
            )}
          />
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-display text-[22px] font-bold tracking-[-0.01em] text-fg">
            {isPour
              ? t.rich("pourInSeconds", {
                  b: ink,
                  g: p.add ?? 0,
                  s: Math.round(p.end - p.start),
                })
              : p.isLastPour
                ? t("finalDrawDown")
                : t("letItDrawDown")}
          </span>
          {isPour && (
            <span
              className={cn(
                MONO,
                "text-mono font-semibold whitespace-nowrap text-fg-3",
              )}
            >
              {t("pourTarget", { g: p.target })}
            </span>
          )}
        </div>
        <div className="mt-[13px] mb-2 h-1.5 overflow-hidden rounded-full bg-border-strong">
          {/* last-resort: runtime progress fraction → bar width */}
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-200 ease-linear motion-reduce:transition-none",
              isPour ? "bg-brand" : "bg-fg-3",
            )}
            style={{ width: `${frac * 100}%` }}
          />
        </div>
        <div
          className={cn(
            MONO,
            "flex items-center justify-between text-[12px] text-fg-3",
          )}
        >
          <span>{fmtTime(p.start)}</span>
          <span className="text-fg-4">
            {isPour
              ? t("steadyPour")
              : p.isLastPour
                ? t("thenRemove")
                : t("nextPourAt", {
                    time: fmtTime(p.nextPourStart ?? recipe.removeAt),
                  })}
          </span>
          <span>{fmtTime(p.end)}</span>
        </div>
      </div>
    );
  }

  function CompactRow({
    p,
    st,
  }: {
    p: TimerPhase;
    st: "done" | "next" | "future";
  }) {
    const isPour = p.kind === "pour";
    const isDone = st === "done";
    const isNext = st === "next";
    const dim = isDone
      ? "opacity-50"
      : st === "future"
        ? "opacity-[0.62]"
        : "opacity-100";
    if (isPour) {
      return (
        <div className={cn("flex items-center gap-3 px-1 py-[7px]", dim)}>
          <span
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] bg-transparent",
              isDone
                ? "border-success"
                : isNext
                  ? "border-brand"
                  : "border-border-strong",
            )}
          >
            {isDone ? (
              <Icon
                name="check"
                size={12}
                className="text-success"
                stroke={2.6}
              />
            ) : (
              <span
                className={cn(
                  MONO,
                  "text-[12px] font-semibold",
                  isNext ? "text-accent-ink" : "text-fg-3",
                )}
              >
                {p.pourNo}
              </span>
            )}
          </span>
          {isNext && (
            <span className={cn(CAP, "text-[9.5px] text-accent-ink")}>
              {t("nextBadge")}
            </span>
          )}
          <span
            className={cn(
              "flex-1 text-[14.5px]",
              isNext ? "font-semibold text-fg" : "font-medium text-fg-2",
            )}
          >
            {tSchedule("pour", { n: p.pourNo })}
          </span>
          <span
            className={cn(
              MONO,
              "text-mono font-semibold whitespace-nowrap",
              isNext ? "text-accent-ink" : "text-fg-2",
            )}
          >
            {p.target} {tCalc("grams")}
          </span>
          <span
            className={cn(MONO, "w-[38px] text-right text-[12px] text-fg-4")}
          >
            {fmtTime(p.start)}
          </span>
        </div>
      );
    }
    return (
      <div className={cn("flex items-center gap-3 py-1 pr-1 pl-9", dim)}>
        <span
          className={cn(
            "h-[7px] w-[7px] shrink-0 rounded-full",
            isDone ? "bg-success" : "border-[1.5px] border-border-strong",
          )}
        />
        <span className="flex-1 text-[13px] text-fg-3">
          {p.isLastPour ? t("finalDrawDown") : t("letItDrawDown")}
        </span>
        <span className={cn(MONO, "w-[38px] text-right text-[12px] text-fg-4")}>
          {fmtTime(p.end)}
        </span>
      </div>
    );
  }

  function DripRow({ complete }: { complete: boolean }) {
    return (
      <div
        className={cn(
          "mt-1 flex items-center gap-3 border-t border-border px-1 pt-2.5",
          complete ? "opacity-100" : "opacity-[0.62]",
        )}
      >
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px]",
            complete ? "border-success" : "border-border-strong",
          )}
        >
          {complete ? (
            <Icon
              name="check"
              size={12}
              className="text-success"
              stroke={2.6}
            />
          ) : (
            <Icon name="droplet" size={12} className="text-fg-3" />
          )}
        </span>
        <span
          className={cn(
            "flex-1 text-[14px] font-semibold",
            complete ? "text-success" : "text-fg-2",
          )}
        >
          {t("removeDripper")}
        </span>
        <span className={cn(MONO, "w-[38px] text-right text-[12px] text-fg-4")}>
          {recipe.removeTime}
        </span>
      </div>
    );
  }

  // Done: show every phase as a static row + the completed drip finale.
  const doneRows = phases.map((p, i) => <CompactRow key={i} p={p} st="done" />);

  const summaryBtn =
    "my-0.5 flex w-full cursor-pointer items-center gap-2.5 rounded-sm border border-border bg-surface px-3.5 py-[11px] text-left font-body text-[13.5px] font-semibold text-fg-2 hover:bg-surface";

  function listInner() {
    if (done) {
      return (
        <>
          {doneRows}
          <DripRow complete />
        </>
      );
    }
    const donePhases = phases.slice(0, curIdx);
    return (
      <>
        {curIdx > 0 &&
          (expandDone ? (
            <>
              {donePhases.map((p, i) => (
                <CompactRow key={i} p={p} st="done" />
              ))}
              <Button
                type="button"
                onClick={() => setExpandDone(false)}
                className={summaryBtn}
              >
                {t("hideCompleted")}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={() => setExpandDone(true)}
              className={summaryBtn}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] border-success">
                <Icon
                  name="check"
                  size={11}
                  className="text-success"
                  stroke={2.6}
                />
              </span>
              <span className="flex-1">
                {t("stepsDone", { count: curIdx })}
              </span>
              <Icon name="chevR" size={15} className="rotate-90 text-fg-4" />
            </Button>
          ))}
        <CurrentCard p={cur} />
        {phases.slice(curIdx + 1).map((p, idx) => (
          <CompactRow
            key={curIdx + 1 + idx}
            p={p}
            st={idx === 0 ? "next" : "future"}
          />
        ))}
        <DripRow complete={false} />
      </>
    );
  }

  return (
    <>
      {BrewDebugPanel && (
        <BrewDebugPanel speed={speed} onSpeedChange={changeSpeed} />
      )}
      <SaveRecipeForm
        open={saveOpen}
        onOpenChange={setSaveOpen}
        params={params}
      />
      {/* RMP-234: confirm leaving a live brew (back affordance). */}
      <AlertDialog open={confirmExit} onOpenChange={setConfirmExit}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-h4 font-bold text-fg">
              {t("leaveTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-small text-fg-3">
              {t("leaveBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("keepBrewing")}</AlertDialogCancel>
            <AlertDialogAction onClick={exit}>{t("leave")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* RMP-234: keyboard-accessible restart confirm (the pointer path uses
          hold-to-restart; a keyboard can't hold, so it confirms here). */}
      <AlertDialog open={confirmRestart} onOpenChange={setConfirmRestart}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-h4 font-bold text-fg">
              {t("restartTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-small text-fg-3">
              {t("restartBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("keepBrewing")}</AlertDialogCancel>
            <AlertDialogAction onClick={restart}>
              {t("restartConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <main className="mx-auto box-border max-w-[390px] px-5 pt-2.5 pb-12 md:max-w-[700px] md:px-6 md:pt-4 md:pb-[60px] lg:max-w-[1000px]">
        {/* top bar — back affordance + status pill */}
        <div className="mb-2 flex items-center justify-between md:mb-4">
          <Button
            type="button"
            onClick={requestExit}
            className="-ml-1 inline-flex h-auto cursor-pointer items-center justify-start gap-[5px] rounded-none border-none bg-transparent px-1 py-[6px] font-body text-small font-semibold text-fg-2 hover:bg-transparent hover:text-fg-2 has-[>svg]:px-1 [&_svg:not([class*='size-'])]:size-[18px]"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 5l-7 7 7 7" />
            </svg>
            {t("recipe")}
          </Button>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                CAP,
                "inline-flex items-center gap-[7px]",
                done ? "text-success" : "text-fg-2",
              )}
            >
              <span
                className={cn(
                  "h-[7px] w-[7px] rounded-full",
                  done ? "bg-success" : paused || ready ? "bg-fg-4" : "bg-brand",
                  !paused && !done && !ready && PULSE,
                )}
              />
              {ready
                ? t("ready")
                : counting
                  ? t("getReady")
                  : done
                    ? t("done")
                    : paused
                      ? t("paused")
                      : t("brewing")}
            </span>
            {/* RMP-239: pour-cue opt-in (bell). Inline SVGs match the file's
                icon idiom; icons.tsx has no bell glyph. */}
            <Button
              type="button"
              onClick={toggleSound}
              aria-pressed={soundOn}
              aria-label={t("soundCues")}
              title={t("soundCues")}
              className={cn(
                "flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-0 hover:bg-transparent has-[>svg]:px-0 [&_svg:not([class*='size-'])]:size-[18px]",
                soundOn
                  ? "text-accent-ink hover:text-accent-ink"
                  : "text-fg-4 hover:text-fg-4",
              )}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {soundOn ? (
                  <>
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </>
                ) : (
                  <>
                    <path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5" />
                    <path d="M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    <path d="m2 2 20 20" />
                  </>
                )}
              </svg>
            </Button>
          </div>
        </div>

        <div className="block items-start md:grid md:grid-cols-[300px_1fr] md:gap-[52px] lg:grid-cols-[340px_1fr]">
          <div>
            {/* ring */}
            <div className="flex justify-center">
              {/* Dial box: responsive size at the arc's 226:272 aspect; the SVG
                  fills it via width/height 100% and the fixed 272-wide viewBox,
                  so the 272-space geometry scales. On short viewports (≤700px
                  tall, mobile only) the dial clamps smaller so the current-step
                  card keeps its slot. */}
              <div className="relative h-[196px] w-[236px] max-md:[@media(max-height:700px)]:h-[158px] max-md:[@media(max-height:700px)]:w-[190px] md:h-[226px] md:w-[272px]">
                <svg width="100%" height="100%" viewBox={`0 0 ${SZ} ${VBH}`}>
                  <circle
                    cx={CX}
                    cy={CX}
                    r={R}
                    fill="none"
                    stroke="var(--border-strong)"
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    strokeDasharray={`${ARC} ${CIRC}`}
                    // last-resort: gauge arc starts at 135° (bottom-left)
                    transform={`rotate(${ARC_START} ${CX} ${CX})`}
                  />
                  <circle
                    cx={CX}
                    cy={CX}
                    r={R}
                    fill="none"
                    stroke={ringStroke}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    strokeDasharray={`${ARC} ${CIRC}`}
                    transform={`rotate(${ARC_START} ${CX} ${CX})`}
                    className="transition-[stroke-dashoffset] duration-[250ms] ease-linear motion-reduce:transition-none"
                    // last-resort: live arc fill — runtime strokeDashoffset
                    strokeDashoffset={ARC * (1 - progress)}
                  />
                  {!counting &&
                    pourTicks.map((tick, i) => {
                      const a = ((ARC_START + tick * ARC_SWEEP) * Math.PI) / 180;
                      const dx = CX + Math.cos(a) * R;
                      const dy = CX + Math.sin(a) * R;
                      const passed = progress >= tick - 0.002;
                      return (
                        <circle
                          key={i}
                          cx={dx}
                          cy={dy}
                          r={3.4}
                          fill={passed ? ringStroke : "var(--surface-raised)"}
                          stroke={passed ? ringStroke : "var(--border-strong)"}
                          strokeWidth="1.5"
                        />
                      );
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span
                    className={cn(
                      CAP,
                      "mb-2 inline-flex items-center gap-1.5",
                      statusTone,
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        dotTone,
                        !paused && !done && !ready && PULSE,
                      )}
                    />
                    {statusWord}
                  </span>
                  <span
                    className={cn(
                      MONO,
                      "text-[52px] font-semibold leading-[0.92] tracking-[-0.02em] max-md:[@media(max-height:700px)]:text-[44px] md:text-[60px]",
                      counting || ready ? "text-accent-ink" : "text-fg",
                    )}
                  >
                    {/* `ready` is a non-running state: instead of a meaningless
                        00:00 running clock, the center previews the planned total
                        brew duration. countdown shows the seconds left; otherwise
                        the live elapsed clock. */}
                    {ready
                      ? recipe.totalTime
                      : counting
                        ? Math.ceil(cdLeft)
                        : fmtMMSS(elapsed)}
                  </span>
                  <span
                    className={cn(
                      MONO,
                      "mt-2 text-[13px] font-semibold text-fg-4",
                    )}
                  >
                    {/* No "of {total}" before the brew starts — in `ready` the
                        center IS the total, so the subtext labels it instead. */}
                    {ready
                      ? t("totalLabel")
                      : counting
                        ? t("getSet")
                        : t("ofTotal", { time: recipe.totalTime })}
                  </span>
                </div>
              </div>
            </div>

            {/* action + detail */}
            <div className="mt-4 min-h-[50px] text-center">
              <div
                className={cn(
                  "font-display text-[22px] font-bold tracking-[-0.01em]",
                  actionTone,
                )}
              >
                {action}
              </div>
              <div
                className={cn(MONO, "mt-1 text-small font-semibold text-fg-3")}
              >
                {detail}
              </div>
            </div>

            {/* controls */}
            {ready ? (
              <div className="mt-[22px]">
                <Button
                  type="button"
                  onClick={start}
                  className={cn(
                    CTA_BASE,
                    CTA_SOLID,
                    "[&_svg:not([class*='size-'])]:size-[17px]",
                  )}
                >
                  <Icon name="play" size={17} className="text-white" />{" "}
                  {t("start")}
                </Button>
              </div>
            ) : counting ? (
              <div className="mt-[22px]">
                <Button
                  type="button"
                  onClick={startNow}
                  className={cn(
                    CTA_BASE,
                    CTA_SOLID,
                    "[&_svg:not([class*='size-'])]:size-[17px]",
                  )}
                >
                  <Icon name="play" size={17} className="text-white" />{" "}
                  {t("startNow")}
                </Button>
              </div>
            ) : done ? (
              <div className="mt-[22px] flex flex-col gap-2.5">
                <Button
                  type="button"
                  onClick={() => setSaveOpen(true)}
                  className={cn(CTA_BASE, CTA_SOLID)}
                >
                  {t("saveRecipe")}
                </Button>
                <Button
                  type="button"
                  onClick={restart}
                  className={cn(CTA_BASE, CTA_OUTLINE)}
                >
                  {t("brewAgain")}
                </Button>
                <Button
                  type="button"
                  onClick={exit}
                  className={cn(CTA_BASE, CTA_OUTLINE)}
                >
                  {t("backToRecipe")}
                </Button>
              </div>
            ) : (
              <div className="mt-[22px] flex gap-2.5">
                <Button
                  type="button"
                  onClick={paused ? resume : pause}
                  className={cn(
                    CTA_BASE,
                    paused ? CTA_SOLID : CTA_OUTLINE,
                    "flex-1 [&_svg:not([class*='size-'])]:size-[17px]",
                  )}
                >
                  {paused ? (
                    <>
                      <Icon name="play" size={17} className="text-white" />{" "}
                      {t("resume")}
                    </>
                  ) : (
                    t("pause")
                  )}
                </Button>
                <Button
                  type="button"
                  // Hold-to-restart (RMP-234): pointer holds fill and fire;
                  // keyboard (Enter/Space) opens the confirm dialog instead.
                  // No onClick — a plain tap must not kill a live brew.
                  onPointerDown={beginHold}
                  onPointerUp={cancelHold}
                  onPointerLeave={cancelHold}
                  onPointerCancel={cancelHold}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setConfirmRestart(true);
                    }
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                  aria-label={t("restartAria")}
                  title={t("holdToRestart")}
                  className="relative flex h-[54px] w-[54px] shrink-0 cursor-pointer touch-none items-center justify-center overflow-hidden rounded-md border border-border-strong bg-surface p-0 text-fg-2 select-none hover:bg-surface has-[>svg]:px-0 [&_svg:not([class*='size-'])]:size-5"
                >
                  {holdFrac > 0 && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 bg-brand/25"
                      // last-resort: runtime hold progress → fill height
                      style={{ height: `${holdFrac * 100}%` }}
                    />
                  )}
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.7L3 8" />
                    <path d="M3 4v4h4" />
                  </svg>
                </Button>
              </div>
            )}
          </div>

          {/* recipe list */}
          <div className="mt-7 md:mt-1">
            <div className="mb-3.5 flex items-center justify-between">
              <span className={cn(CAP, "text-fg-3")}>{t("recipe")}</span>
              <span className={cn(MONO, "text-[12px] font-semibold text-fg-3")}>
                {done ? t("finished") : pourCounter}
              </span>
            </div>
            <div className="flex flex-col gap-1">{listInner()}</div>
          </div>
        </div>
      </main>
    </>
  );
}
