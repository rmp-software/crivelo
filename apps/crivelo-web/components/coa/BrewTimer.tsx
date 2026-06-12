"use client";

/**
 * BrewTimer (RMP-192) — the running brew timer. A live dial that guides each
 * pour of the 4:6 schedule and counts real wall-clock time, so a mid-brew
 * refresh (phone propped on the counter) resumes from the right place. Ported
 * faithfully from apps/crivelo-web/.design/project/coa-timer.jsx — same dial geometry
 * (SZ=248 / R=110), pour ticks around the rim, liveElapsed/session math, the
 * 200ms tick, the ~12s pour window, progress = elapsed/removeAt, and the ring
 * strokeDashoffset.
 *
 * Differences from the prototype: idiomatic React/TS (no window.Coa / globals),
 * the engine comes from lib/four-six.ts, and the site-level CSS vars are used
 * (--brand / --accent-ink / --success / --border-strong / --font-mono tnum) in
 * place of the prototype's --coa* names.
 *
 * Session is persisted under localStorage key 'coa-brew' as
 * { base, startTs, status }; elapsed is recomputed from the wall clock on every
 * tick. Exiting (Back to recipe) clears the key.
 */
import { useEffect, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@crivelo/ui/lib/utils";
import { Button } from "../ui/Button";
import { clamp, fmtTime, type Recipe } from "../../lib/four-six";
import { Icon } from "./icons";
import type { Breakpoint } from "./useViewport";

const KEY = "coa-brew";

/** tabular + slashed-zero mono numerals (clock / gram readouts). */
const MONO = "font-mono tabular-nums [font-feature-settings:'tnum','zero']";

/** Section caption / dial label (11px uppercase tracked). */
const CAP =
  "text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-3";

/**
 * Shared CTA look (54px tall pill), worn by the app-local Button wrapper
 * (RMP-217 commodity-UI sweep). `solid` paints the brand action (white ink,
 * shadow); `outline` is the secondary ghost variant (--fg ink, 1px strong border).
 * The geometry rides in className via tailwind-merge so the primitive's
 * buttonVariants defaults (rounded-md, h-9/px, bg-primary, text-sm, font-medium,
 * gap-2) are neutralised — pixel identical to the prior hand-rolled <button>.
 * `p-0 has-[>svg]:px-0` cancels the size-default horizontal padding (these
 * full-width pills are centred, never inset).
 */
const CTA_BASE =
  "flex h-[54px] w-full cursor-pointer items-center justify-center gap-[9px] rounded-md p-0 font-body text-body font-semibold whitespace-normal has-[>svg]:px-0";
const CTA_SOLID =
  "bg-brand text-white border-none shadow-1 hover:bg-brand";
const CTA_OUTLINE =
  "bg-transparent text-fg border border-border-strong shadow-none hover:bg-transparent hover:text-fg";

type Status = "running" | "paused" | "done";

interface Session {
  base: number;
  startTs: number | null;
  status: Status;
}

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export interface BrewTimerProps {
  recipe: Recipe;
  onExit: () => void;
  bp?: Breakpoint;
  /** Container max-width on wide layouts (mobile is fixed at 390). */
  max?: number;
}

export function BrewTimer({
  recipe,
  onExit,
  bp = "mobile",
  max = 390,
}: BrewTimerProps) {
  const t = useTranslations("BrewTimer");
  const tCalc = useTranslations("Calculator");
  const tSchedule = useTranslations("Schedule");
  const wide = bp !== "mobile";

  // Resume any persisted session synchronously (so a mid-brew refresh picks up
  // the saved wall-clock start before the first paint). BrewTimer only mounts
  // client-side (behind the "Begin brew" click), so there is no SSR/hydration
  // concern with reading localStorage in the initializer.
  const [sess, setSess] = useState<Session>(
    () => loadSession() || { base: 0, startTs: Date.now(), status: "running" },
  );
  const [, force] = useState(0);

  // Persist on every change.
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(sess));
    } catch {
      /* ignore */
    }
  }, [sess]);

  // 200ms tick — re-render so liveElapsed advances against the wall clock.
  useEffect(() => {
    const id = setInterval(() => force((x) => x + 1), 200);
    return () => clearInterval(id);
  }, []);

  const liveElapsed = () =>
    sess.status === "running" && sess.startTs != null
      ? sess.base + (Date.now() - sess.startTs) / 1000
      : sess.base;

  let elapsed = liveElapsed();
  const finished = elapsed >= recipe.removeAt;
  if (finished) elapsed = recipe.removeAt;

  // Flip a running session to done once it crosses removeAt.
  useEffect(() => {
    if (sess.status === "running" && liveElapsed() >= recipe.removeAt) {
      setSess({ base: recipe.removeAt, startTs: null, status: "done" });
    }
  });

  // current pour
  const steps = recipe.steps;
  let curIdx = 0;
  for (let i = 0; i < steps.length; i++) if (elapsed >= steps[i].t) curIdx = i;
  const cur = steps[curIdx];
  const isLastPour = curIdx === steps.length - 1;
  const nextT = isLastPour ? recipe.removeAt : steps[curIdx + 1].t;
  const toNext = Math.max(0, Math.ceil(nextT - elapsed));
  const sinceStart = elapsed - cur.t;
  const pouring = sinceStart < 12 && !finished;
  const progress = clamp(elapsed / recipe.removeAt, 0, 1);

  // ring geometry
  const SZ = 248,
    R = 110,
    CX = SZ / 2,
    CIRC = 2 * Math.PI * R;
  const ticks = steps.map((s) => s.t / recipe.removeAt).concat([1]);

  const done = sess.status === "done" || finished;
  const paused = sess.status === "paused";

  const pause = () =>
    setSess({ base: liveElapsed(), startTs: null, status: "paused" });
  const resume = () =>
    setSess((s) => ({ ...s, startTs: Date.now(), status: "running" }));
  const restart = () =>
    setSess({ base: 0, startTs: Date.now(), status: "running" });
  const exit = () => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    onExit();
  };

  const centerStatus = done
    ? t("brewComplete")
    : paused
      ? t("paused")
      : t("pourOf", { n: curIdx + 1, total: steps.length });
  const ringColor = done ? "var(--success)" : "var(--brand)";

  // The container max-width is runtime data (the `max` prop on wide layouts; a
  // fixed 390 on mobile), so it travels through a CSS custom property consumed by
  // the static `max-w-[var(--mw)]` utility rather than a themed inline style.
  const mwVar = { "--mw": `${wide ? max : 390}px` } as CSSProperties;

  return (
    <main
      // last-resort: runtime container max-width (data-driven `max` prop)
      style={mwVar}
      className={cn(
        "mx-auto box-border max-w-[var(--mw)]",
        wide ? "px-6 pt-[18px] pb-[44px]" : "px-5 pt-[14px] pb-9",
      )}
    >
      {/* top row — the back-to-recipe affordance also rides the Button wrapper
          (RMP-217); h-auto/py-[6px] + has-[>svg]:px-1 neutralise the size-default
          height and padding so it stays the bespoke text-link height. */}
      <div className="mb-2 flex items-center justify-between">
        <Button
          type="button"
          onClick={exit}
          className="-ml-1 inline-flex h-auto cursor-pointer items-center gap-[5px] rounded-none justify-start border-none bg-transparent px-1 py-[6px] font-body text-small font-semibold text-fg-2 hover:bg-transparent hover:text-fg-2 has-[>svg]:px-1 [&_svg:not([class*='size-'])]:size-[18px]"
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
              done
                ? "bg-success"
                : paused
                  ? "bg-fg-4"
                  : "bg-brand",
              !paused &&
                !done &&
                "animate-[coaBrewPulse_1.6s_var(--ease-standard)_infinite]",
            )}
          />
          {done ? t("done") : paused ? t("paused") : t("brewing")}
        </span>
      </div>

      <div
        className={cn(
          "items-center",
          wide
            ? "mt-2.5 grid grid-cols-[300px_1fr] gap-11"
            : "mt-0 block gap-0",
        )}
      >
        <div>
          {/* dial */}
          <div className="mx-0 mt-2.5 mb-1.5 flex justify-center">
            {/* last-resort: dial box sized to the runtime ring constant SZ */}
            <div
              className="relative"
              style={{ width: SZ, height: SZ }}
            >
              <svg
                width={SZ}
                height={SZ}
                viewBox={`0 0 ${SZ} ${SZ}`}
                // last-resort: SVG is rotated -90deg so the ring starts at 12 o'clock
                style={{ transform: "rotate(-90deg)" }}
              >
                <circle
                  cx={CX}
                  cy={CX}
                  r={R}
                  fill="none"
                  stroke="var(--border-strong)"
                  strokeWidth="6"
                />
                <circle
                  cx={CX}
                  cy={CX}
                  r={R}
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - progress)}
                  // last-resort: live ring fill — animates the runtime strokeDashoffset
                  style={{ transition: "stroke-dashoffset 0.2s linear" }}
                />
                {ticks.map((t, i) => {
                  const a = t * 2 * Math.PI,
                    ix = CX + Math.cos(a) * (R + 13),
                    iy = CX + Math.sin(a) * (R + 13);
                  const ox = CX + Math.cos(a) * (R + 19),
                    oy = CX + Math.sin(a) * (R + 19);
                  const passed = progress >= t - 0.001;
                  return (
                    <line
                      key={i}
                      x1={ix}
                      y1={iy}
                      x2={ox}
                      y2={oy}
                      stroke={passed ? ringColor : "var(--border-strong)"}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span
                  className={cn(
                    CAP,
                    "mb-1.5",
                    done ? "text-success" : "text-fg-3",
                  )}
                >
                  {centerStatus}
                </span>
                {done ? (
                  <span className="font-display text-[30px] font-bold leading-[1.05] tracking-[-0.02em]">
                    {t("removeThe")}
                    <br />
                    {t("theDripper")}
                  </span>
                ) : (
                  <>
                    <span
                      className={cn(
                        MONO,
                        "whitespace-nowrap text-[58px] font-semibold leading-[0.92] tracking-[-0.02em] text-fg",
                      )}
                    >
                      {cur.cumulativeG}
                      <span className="text-[22px] text-fg-3">
                        {" "}
                        {tCalc("grams")}
                      </span>
                    </span>
                    <span
                      className={cn(
                        MONO,
                        "mt-1.5 whitespace-nowrap text-mono font-semibold text-accent-ink",
                      )}
                    >
                      {t("thisPour", { g: cur.pourG })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* action + countdown */}
          <div className="mb-3.5 min-h-[58px] text-center">
            {done ? (
              <div
                className={cn(
                  MONO,
                  "text-mono font-semibold text-fg-2",
                )}
              >
                {t("totalTime", { time: recipe.totalTime })}
              </div>
            ) : (
              <>
                <div
                  className={cn(
                    "font-display text-[21px] font-bold tracking-[-0.01em]",
                    pouring
                      ? "text-accent-ink"
                      : "text-fg-2",
                  )}
                >
                  {pouring
                    ? t("pourNow", { g: cur.cumulativeG })
                    : t("letItDrawDown")}
                </div>
                <div
                  className={cn(
                    MONO,
                    "mt-1 text-small font-semibold text-fg-3",
                  )}
                >
                  {t.rich(isLastPour ? "removeIn" : "nextPourIn", {
                    // Keep the time portion emphasized (--fg) as a sibling span,
                    // but supply it via interpolation so a whitespace-stripping
                    // formatter can't collapse "Next pour in" + the time.
                    time: () => (
                      <span className="text-fg">
                        {fmtTime(toNext)}
                      </span>
                    ),
                  })}
                  <span className="text-fg-4">
                    {"  ·  "}
                    {fmtTime(Math.floor(elapsed))} / {recipe.totalTime}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div>
          {/* schedule list */}
          <div className="mb-[18px] rounded-md border border-border bg-surface-raised px-4 py-[6px] shadow-1">
            {steps.map((s, i) => {
              const stDone = i < curIdx || finished;
              const active = i === curIdx && !finished;
              return (
                <div
                  key={s.index}
                  className={cn(
                    "flex items-center gap-3 py-[9px]",
                    i < steps.length - 1 &&
                      "border-b border-border",
                    !active && !stDone ? "opacity-55" : "opacity-100",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full",
                      active
                        ? "border-none bg-brand"
                        : cn(
                            "border-[1.5px] bg-transparent",
                            stDone
                              ? "border-success"
                              : "border-border-strong",
                          ),
                    )}
                  >
                    {stDone && (
                      <Icon
                        name="check"
                        size={11}
                        color="var(--success)"
                        stroke={2.4}
                      />
                    )}
                    {active && (
                      <span className="h-[6px] w-[6px] rounded-full bg-white" />
                    )}
                  </span>
                  <span
                    className={cn(
                      MONO,
                      "w-[34px] text-[13px] font-semibold",
                      active ? "text-fg" : "text-fg-3",
                    )}
                  >
                    {s.time}
                  </span>
                  <span
                    className={cn(
                      "flex-1 text-small",
                      active
                        ? "font-semibold text-fg"
                        : "font-normal text-fg-2",
                    )}
                  >
                    {tSchedule("pour", { n: i + 1 })}
                  </span>
                  <span
                    className={cn(
                      MONO,
                      "whitespace-nowrap text-mono font-semibold",
                      active
                        ? "text-accent-ink"
                        : "text-fg-2",
                    )}
                  >
                    {s.cumulativeG} {tCalc("grams")}
                  </span>
                </div>
              );
            })}
          </div>

          {/* controls — routed through the app-local Button wrapper (RMP-217
              commodity-UI sweep); CTA_BASE/SOLID/OUTLINE neutralise the primitive
              defaults so the look is pixel-identical. The 17px resume icon and 20px
              restart icon override the primitive's 16px svg sizing rule. */}
          {done ? (
            <div className="flex flex-col gap-2.5">
              <Button
                type="button"
                onClick={restart}
                className={cn(CTA_BASE, CTA_SOLID)}
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
            <div className="flex gap-2.5">
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
                    <Icon name="play" size={17} className="text-white" /> {t("resume")}
                  </>
                ) : (
                  t("pause")
                )}
              </Button>
              <Button
                type="button"
                onClick={restart}
                aria-label={t("restartAria")}
                className="flex h-[54px] w-[56px] cursor-pointer items-center justify-center rounded-md border border-border-strong bg-surface p-0 text-fg-2 hover:bg-surface has-[>svg]:px-0 [&_svg:not([class*='size-'])]:size-[20px]"
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
      </div>
    </main>
  );
}
