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
 * backward-tolerant so a stale/old-shaped session can't crash. Both themes,
 * three breakpoints, `prefers-reduced-motion` honored.
 */
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@crivelo/ui/lib/utils";
import { Button } from "../ui/Button";
import {
  clamp,
  fmtTime,
  buildPhases,
  type Recipe,
  type TimerPhase,
} from "../../lib/four-six";
import { Icon } from "./icons";
import type { Breakpoint } from "./useViewport";

const KEY = "coa-brew";

/** Seconds the "Get ready" pre-roll runs before the clock starts. */
const PREROLL = 5;

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

type Status = "countdown" | "running" | "paused" | "done";

interface Session {
  status: Status;
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
      (s.status !== "countdown" &&
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
 * Discard any persisted brew session. Call when starting a brand-new brew so a
 * stale session left behind by a previous, abandoned brew can't auto-resume
 * (which would skip the "Get ready" pre-roll and drop the user mid-brew).
 *
 * The persisted session exists for resume-on-reload (a phone propped on the
 * counter), but that path is not wired today: `CoaCalculator`'s `view` resets to
 * "idle" on every load, so this timer only ever mounts via "Begin brew". Until a
 * future change reopens an active brew on reload, the only consumer of a stale
 * session is the "Begin brew" button — which must start fresh, hence this clear.
 */
export function clearBrewSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export interface BrewTimerProps {
  recipe: Recipe;
  onExit: () => void;
  bp?: Breakpoint;
  /**
   * Container max-width the idle calculator uses for its wide layout. Accepted
   * for API parity with `CoaCalculator`'s call site, but the timer caps its own
   * two-column container narrower (700 tablet / 1000 desktop) so the brew flow
   * reads as a focused, centred panel rather than a full-bleed calculator — the
   * locked prototype's intent.
   */
  max?: number;
}

// `max` is part of BrewTimerProps for call-site parity with CoaCalculator but is
// intentionally not destructured here: the timer caps its own wide container.
export function BrewTimer({ recipe, onExit, bp = "mobile" }: BrewTimerProps) {
  const t = useTranslations("BrewTimer");
  const tCalc = useTranslations("Calculator");
  const tSchedule = useTranslations("Schedule");
  const wide = bp !== "mobile";
  const desktop = bp === "desktop";

  // Resume any persisted session synchronously, else open in the pre-roll.
  // BrewTimer only mounts client-side (behind "Begin brew"), so reading
  // localStorage in the initializer is safe (no SSR/hydration concern).
  const [sess, setSess] = useState<Session>(
    () => loadSession() || { status: "countdown", cdStart: Date.now() },
  );
  const [, force] = useState(0);
  const [expandDone, setExpandDone] = useState(false);

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

  const liveElapsed = () => {
    if (sess.status === "running" && sess.startTs != null) {
      return (sess.base ?? 0) + (Date.now() - sess.startTs) / 1000;
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
      ? Math.max(0, PREROLL - (Date.now() - sess.cdStart) / 1000)
      : 0;

  // Auto-transition the pre-roll into the running clock at 0.
  useEffect(() => {
    if (
      counting &&
      sess.cdStart != null &&
      (Date.now() - sess.cdStart) / 1000 >= PREROLL
    ) {
      setSess({ status: "running", base: 0, startTs: Date.now() });
    }
  });

  // Flip a running session to done once it crosses removeAt.
  useEffect(() => {
    if (sess.status === "running" && liveElapsed() >= recipe.removeAt) {
      setSess({ status: "done", base: recipe.removeAt, startTs: null });
    }
  });

  // Phases.
  const phases = buildPhases(recipe);
  const done = sess.status === "done" || finished;
  const paused = sess.status === "paused";
  let curIdx = phases.findIndex((p) => elapsed < p.end);
  if (curIdx === -1) curIdx = phases.length - 1;
  const cur = phases[curIdx];
  const pourPhase = !done && !counting && cur.kind === "pour";

  // Ring geometry (runtime constants → inline style bridges only).
  const SZ = wide ? 272 : 236;
  const STROKE = 8;
  const R = SZ / 2 - STROKE / 2 - 13;
  const CX = SZ / 2;
  const CIRC = 2 * Math.PI * R;
  const progress = counting
    ? clamp(cdLeft / PREROLL, 0, 1)
    : clamp(elapsed / recipe.removeAt, 0, 1);
  const ringStroke = done ? "var(--success)" : "var(--brand)";
  const pourTicks = recipe.steps.map((s) => s.t / recipe.removeAt);

  // Controls.
  const pause = () =>
    setSess({ status: "paused", base: liveElapsed(), startTs: null });
  const resume = () =>
    setSess((s) => ({ ...s, status: "running", startTs: Date.now() }));
  const restart = () => setSess({ status: "countdown", cdStart: Date.now() });
  const startNow = () =>
    setSess({ status: "running", base: 0, startTs: Date.now() });
  const exit = () => {
    clearBrewSession();
    onExit();
  };

  // Ring-center status word (distinguishes pour vs draw, unlike the top pill).
  const statusWord = counting
    ? t("getReady")
    : done
      ? t("complete")
      : paused
        ? t("paused")
        : pourPhase
          ? t("pouring")
          : t("drawDown");
  const statusTone = counting
    ? "text-accent-ink"
    : done
      ? "text-success"
      : paused
        ? "text-fg-3"
        : pourPhase
          ? "text-accent-ink"
          : "text-fg-3";
  // The pulsing status dot rides currentColor so it tracks the status tone.
  const dotTone = counting
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
  if (counting) {
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
      time: fmtTime(Math.ceil((cur.nextPourStart ?? recipe.removeAt) - elapsed)),
    });
    actionTone = "text-fg-2";
  }

  // Recipe-list bookkeeping.
  const stepCount = phases.length;
  const stepNo = Math.min(curIdx + 1, stepCount);

  // The container max-width is runtime data (the `max` prop on wide layouts; a
  // fixed 390 on mobile), so it travels through a CSS custom property consumed by
  // the static `max-w-[var(--mw)]` utility.
  const mwVar = {
    "--mw": `${wide ? (desktop ? 1000 : 700) : 390}px`,
  } as CSSProperties;

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
              <Icon name="check" size={12} className="text-success" stroke={2.6} />
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
      <div
        className={cn(
          "flex items-center gap-3 py-1 pr-1 pl-9",
          dim,
        )}
      >
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
            <Icon name="check" size={12} className="text-success" stroke={2.6} />
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
  const doneRows = phases.map((p, i) => (
    <CompactRow key={i} p={p} st="done" />
  ));

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
              <span className="flex-1">{t("stepsDone", { count: curIdx })}</span>
              <Icon
                name="chevR"
                size={15}
                className="rotate-90 text-fg-4"
              />
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
    <main
      // last-resort: runtime container max-width (data-driven `max`/bp).
      style={mwVar}
      className={cn(
        "mx-auto box-border max-w-[var(--mw)]",
        wide ? "px-6 pt-4 pb-[60px]" : "px-5 pt-2.5 pb-12",
      )}
    >
      {/* top bar — back affordance + status pill */}
      <div
        className={cn(
          "flex items-center justify-between",
          wide ? "mb-4" : "mb-2",
        )}
      >
        <Button
          type="button"
          onClick={exit}
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
              done ? "bg-success" : paused ? "bg-fg-4" : "bg-brand",
              !paused && !done && PULSE,
            )}
          />
          {counting
            ? t("getReady")
            : done
              ? t("done")
              : paused
                ? t("paused")
                : t("brewing")}
        </span>
      </div>

      <div
        className={cn(
          "items-start",
          wide
            ? cn(
                "grid gap-[52px]",
                desktop ? "grid-cols-[340px_1fr]" : "grid-cols-[300px_1fr]",
              )
            : "block",
        )}
      >
        <div>
          {/* ring */}
          <div className="flex justify-center">
            {/* last-resort: dial box sized to the runtime ring constant SZ */}
            <div className="relative" style={{ width: SZ, height: SZ }}>
              <svg
                width={SZ}
                height={SZ}
                viewBox={`0 0 ${SZ} ${SZ}`}
                // last-resort: ring starts at 12 o'clock
                style={{ transform: "rotate(-90deg)" }}
              >
                <circle
                  cx={CX}
                  cy={CX}
                  r={R}
                  fill="none"
                  stroke="var(--border-strong)"
                  strokeWidth={STROKE}
                />
                <circle
                  cx={CX}
                  cy={CX}
                  r={R}
                  fill="none"
                  stroke={ringStroke}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  className="transition-[stroke-dashoffset] duration-[250ms] ease-linear motion-reduce:transition-none"
                  // last-resort: live ring fill — runtime strokeDashoffset
                  strokeDashoffset={CIRC * (1 - progress)}
                />
                {!counting &&
                  pourTicks.map((tick, i) => {
                    const a = tick * 2 * Math.PI;
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
                      !paused && !done && PULSE,
                    )}
                  />
                  {statusWord}
                </span>
                <span
                  className={cn(
                    MONO,
                    "font-semibold leading-[0.92] tracking-[-0.02em]",
                    wide ? "text-[60px]" : "text-[52px]",
                    counting ? "text-accent-ink" : "text-fg",
                  )}
                >
                  {counting ? Math.ceil(cdLeft) : fmtMMSS(elapsed)}
                </span>
                <span
                  className={cn(
                    MONO,
                    "mt-2 text-[13px] font-semibold text-fg-4",
                  )}
                >
                  {counting ? t("getSet") : t("ofTotal", { time: recipe.totalTime })}
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
            <div className={cn(MONO, "mt-1 text-small font-semibold text-fg-3")}>
              {detail}
            </div>
          </div>

          {/* controls */}
          {counting ? (
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
                onClick={restart}
                className={cn(
                  CTA_BASE,
                  CTA_SOLID,
                  "[&_svg:not([class*='size-'])]:size-[17px]",
                )}
              >
                <Icon name="play" size={17} className="text-white" />{" "}
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
                onClick={restart}
                aria-label={t("restartAria")}
                className="flex h-[54px] w-[54px] shrink-0 cursor-pointer items-center justify-center rounded-md border border-border-strong bg-surface p-0 text-fg-2 hover:bg-surface has-[>svg]:px-0 [&_svg:not([class*='size-'])]:size-5"
              >
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
        <div className={wide ? "mt-1" : "mt-7"}>
          <div className="mb-3.5 flex items-center justify-between">
            <span className={cn(CAP, "text-fg-3")}>{t("recipe")}</span>
            <span className={cn(MONO, "text-[12px] font-semibold text-fg-3")}>
              {done
                ? t("finished")
                : t("stepCounter", { n: stepNo, total: stepCount })}
            </span>
          </div>
          <div className="flex flex-col gap-1">{listInner()}</div>
        </div>
      </div>
    </main>
  );
}
