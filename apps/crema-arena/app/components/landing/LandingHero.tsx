"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ArrowRight, Lock, ChevronLeft, ChevronRight, User } from "lucide-react";
import { Button } from "@crivelo/ui/button";
import { cn } from "@crivelo/ui/lib/utils";
import { requestAccessMailto } from "./requestAccessMailto";
import { Reveal } from "./Reveal";

// Hero — 2-col grid (1-col below 960px). Left: eyebrow + headline + serif-italic
// subtitle + "Pedir acesso" CTA. Right: the "telona" live-display mock.
//
// RMP-204 motion: the telona runs a duel loop — score animates 0 × 0 → 2 × 1, the
// jury dots fill one by one, Lucas (left) is marked winner, and the verdict line
// swaps "Copo na mesa. Jurados escolhendo." → "2 × 1 para Lucas." in sync. The loop
// repeats. Under prefers-reduced-motion the telona shows the FINAL state immediately
// (2 × 1, winner marked, jury 2-1, final verdict) with no animation — that final
// state is also what a static render shows.
//
// jdots final picks: left, right, left → 2 for Lucas (left), 1 for Marina (right).
const JDOT_PICKS = ["l", "r", "l"] as const;
const FINAL_SCORE = "2 × 1";
const ZERO_SCORE = "0 × 0";
const VERDICT_INITIAL = "Copo na mesa. Jurados escolhendo.";
const VERDICT_FINAL = "2 × 1 para Lucas.";

// Phase timeline for the duel loop (ms). Each step reveals one more jury vote; the
// score and winner flip at the final vote, then hold before resetting.
const STEP_MS = 1100;
const HOLD_MS = 3400;

export function LandingHero() {
  const reduce = useReducedMotion();
  // revealed = how many jury votes have landed (0..3). At 3 the duel is decided.
  // ALWAYS start at 0 so the server render and the client's first paint agree
  // (useReducedMotion is null on the server but resolves on the client — reading it
  // in the initializer would cause a text-content hydration mismatch). The effect
  // below jumps straight to the final state under reduced motion.
  const [revealed, setRevealed] = useState(0);

  // Normalize the tri-state useReducedMotion() (null → false → true across hydration)
  // to a stable boolean BEFORE using it as the effect dependency. Depending on `reduce`
  // directly re-fires the effect on the null→false transition at hydration, restarting
  // the loop (a first-load stutter for non-reduced users). `loopDisabled` only flips
  // when reduced-motion is genuinely on, so hydration doesn't restart the duel loop.
  const loopDisabled = reduce === true;

  useEffect(() => {
    if (loopDisabled) {
      setRevealed(JDOT_PICKS.length);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const tick = (step: number) => {
      setRevealed(step);
      if (step < JDOT_PICKS.length) {
        timer = setTimeout(() => tick(step + 1), STEP_MS);
      } else {
        // decided — hold the final state, then reset and replay
        timer = setTimeout(() => tick(0), HOLD_MS);
      }
    };
    timer = setTimeout(() => tick(1), STEP_MS);
    return () => clearTimeout(timer);
  }, [loopDisabled]);

  const decided = revealed >= JDOT_PICKS.length;
  const score = decided ? FINAL_SCORE : ZERO_SCORE;
  const verdict = decided ? VERDICT_FINAL : VERDICT_INITIAL;
  const winnerMarked = decided;

  return (
    <section className="relative overflow-hidden px-7 pt-[60px] pb-[84px] max-[960px]:pt-10 max-[960px]:pb-[60px] max-[560px]:px-[18px]">
      <Image
        src="/assets/rings.svg"
        alt=""
        aria-hidden="true"
        width={620}
        height={620}
        className="pointer-events-none absolute -top-40 -right-[180px] z-0 size-[620px] opacity-50 max-[960px]:size-[420px] max-[960px]:-top-[120px] max-[960px]:-right-[140px]"
      />
      <div className="relative z-[1] mx-auto grid max-w-[1200px] grid-cols-[0.92fr_1.08fr] items-center gap-14 max-[960px]:grid-cols-1 max-[960px]:gap-11">
        {/* Copy */}
        <Reveal>
          <div className="mb-[26px] inline-flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.14em] text-crema-300">
            <span className="size-[7px] rounded-full bg-live shadow-live-halo" aria-hidden="true" />
            Ao vivo · TNT · café especial
          </div>
          <h1 className="m-0 text-balance font-display text-[clamp(46px,7vw,86px)] font-extrabold leading-[0.96] tracking-[-0.03em] text-crema-50 max-[380px]:text-[40px]">
            A arena do café especial
          </h1>
          <p className="mt-6 max-w-[30ch] text-pretty font-serif text-[clamp(21px,2.6vw,30px)] font-normal italic leading-[1.3] tracking-[-0.01em] text-crema-200">
            Organize e transmita competições de latte art, barista e bar battle
          </p>
          <div className="mt-[38px] flex flex-wrap items-center gap-[18px]">
            <Button
              asChild
              className="min-h-[54px] gap-2.5 rounded-md bg-brand px-7 py-[15px] font-body text-[18px] font-semibold text-fg-inverse shadow-2 hover:bg-brand-hover active:bg-brand-press max-[560px]:w-full [&_svg]:size-[19px]"
            >
              <a href={requestAccessMailto}>
                Pedir acesso
                <ArrowRight aria-hidden="true" />
              </a>
            </Button>
            <span className="inline-flex items-center gap-2 font-body text-sm text-crema-300">
              <Lock className="size-[15px]" aria-hidden="true" />
              Acesso sob convite
            </span>
          </div>
        </Reveal>

        {/* Telona mock */}
        <Reveal delay={0.12} className="relative max-[960px]:max-w-[540px]" aria-hidden="true">
          <div className="relative overflow-hidden rounded-lg border border-crema-50/12 bg-espresso-800 px-6 pt-[22px] pb-[26px] shadow-2 max-[560px]:px-4 max-[560px]:pt-[18px] max-[560px]:pb-[22px]">
            <div className="relative z-[1] mb-1.5 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full bg-live-soft px-[13px] py-1.5 text-mint-700">
                <span className="size-[9px] rounded-full bg-live" aria-hidden="true" />
                <span className="whitespace-nowrap font-mono text-xs font-semibold uppercase tracking-[0.12em]">Ao vivo</span>
              </span>
              <span className="text-right">
                <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-crema-400">Tempo</span>
                <span className="mt-[3px] block font-mono text-[22px] font-semibold leading-none tabular-nums text-crema-100">00:27</span>
              </span>
            </div>
            <div className="relative z-[1] mx-0 mt-0.5 mb-[18px] text-center font-mono text-[11px] uppercase tracking-[0.18em] text-crema-400">
              TNT SP 2026 · Final · Free pour
            </div>

            <div className="relative z-[1] grid grid-cols-[1fr_auto_1fr] items-center gap-3.5 max-[560px]:gap-[6px]">
              {/* Competitor A — Lucas (winner) */}
              <Competitor name="Lucas" shop="Torra Comum · SP" win={winnerMarked} reduce={reduce} />
              {/* Central score + jury dots */}
              <div className="flex flex-col items-center gap-[9px]">
                <div className="relative whitespace-nowrap font-mono text-[56px] font-semibold leading-none tracking-[-0.02em] text-marigold-300 [font-feature-settings:'tnum','zero'] max-[560px]:text-[40px]">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={score}
                      initial={reduce ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                      transition={{ duration: 0.32, ease: "easeOut" }}
                      className="block"
                    >
                      {score}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <div className="flex gap-[7px]" aria-hidden="true">
                  {JDOT_PICKS.map((pick, i) => (
                    <JudgeDot key={i} pick={pick} on={i < revealed} reduce={reduce} />
                  ))}
                </div>
              </div>
              {/* Competitor B — Marina */}
              <Competitor name="Marina" shop="Tostado · SP" reduce={reduce} />
            </div>

            <div className="relative z-[1] mt-[22px] flex items-center justify-between gap-4 border-t border-crema-50/10 pt-[18px] max-[560px]:flex-col max-[560px]:items-start max-[560px]:gap-3.5">
              <span className="min-h-[1.4em] pl-10 font-serif text-[15px] italic text-crema-200 max-[560px]:pl-14">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={verdict}
                    initial={reduce ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="block"
                  >
                    {decided ? (
                      <>
                        <b className="font-mono font-semibold not-italic text-marigold-300">2 × 1</b> para Lucas.
                      </>
                    ) : (
                      VERDICT_INITIAL
                    )}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span className="flex items-center gap-[11px]">
                <span
                  className="size-[46px] shrink-0 rounded-[6px] border-[3px] border-crema-50 [background:repeating-conic-gradient(var(--crema-50)_0deg_90deg,var(--espresso-900)_90deg_180deg)] [background-size:11px_11px]"
                  aria-hidden="true"
                />
                <span className="font-body text-[11.5px] leading-[1.3] text-crema-300">
                  <b className="block font-semibold text-crema-100">Leve o público pelo celular</b>
                  crema.app/e/tnt-sp
                </span>
              </span>
            </div>
          </div>
          {/* Floating "no ar 2026" seal */}
          <div
            className="absolute -bottom-6 -left-10 z-[2] flex size-[84px] -rotate-6 flex-col items-center justify-center rounded-full border-2 border-marigold-500 bg-espresso-800 shadow-telona max-[560px]:-bottom-[18px] max-[560px]:-left-[14px] max-[560px]:size-[64px]"
            aria-hidden="true"
          >
            <span className="font-display text-[18px] font-extrabold uppercase leading-none tracking-[-0.01em] text-crema-50 max-[560px]:text-[14px]">no ar</span>
            <span className="mt-[3px] font-display text-[11px] font-bold uppercase leading-none tracking-[0.22em] text-marigold-500 max-[560px]:text-[9px]">2026</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}


function Competitor({
  name,
  shop,
  win = false,
  reduce,
}: {
  name: string;
  shop: string;
  win?: boolean;
  reduce: boolean | null;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-[11px] text-center">
      <motion.div
        animate={reduce ? undefined : { scale: win ? 1.06 : 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={cn(
          "flex size-[86px] shrink-0 items-center justify-center rounded-full border-[3px] bg-espresso-700 transition-colors max-[560px]:size-16",
          win ? "border-marigold-500" : "border-crema-200",
        )}
      >
        <User className="size-[54%] text-crema-300" aria-hidden="true" />
      </motion.div>
      <div>
        <div className="font-display text-[18px] font-bold leading-[1.05] tracking-[-0.01em] text-crema-50 max-[560px]:text-[15px]">
          {name}
        </div>
        <div className="font-serif text-[13px] italic leading-[1.1] text-crema-300 max-[560px]:text-[11.5px]">
          {shop}
        </div>
      </div>
    </div>
  );
}

function JudgeDot({ pick, on, reduce }: { pick: "l" | "r"; on: boolean; reduce: boolean | null }) {
  const pickedClass =
    pick === "l"
      ? "border-cinnamon-300 bg-cinnamon-300/20"
      : "border-marigold-300 bg-marigold-300/[18%]";
  const emptyClass = "border-crema-50/20 bg-transparent";
  return (
    <motion.span
      animate={reduce ? undefined : { scale: on ? 1 : 0.82 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={cn(
        "flex size-[26px] items-center justify-center rounded-full border-[1.5px] transition-colors",
        on ? pickedClass : emptyClass,
      )}
    >
      {on ? (
        pick === "l" ? (
          <ChevronLeft className="size-[13px] text-cinnamon-300" />
        ) : (
          <ChevronRight className="size-[13px] text-marigold-300" />
        )
      ) : null}
    </motion.span>
  );
}
