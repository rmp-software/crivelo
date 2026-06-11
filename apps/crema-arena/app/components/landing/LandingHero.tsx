import Image from "next/image";
import { ArrowRight, Lock, ChevronLeft, ChevronRight, User } from "lucide-react";
import { Button } from "@crivelo/ui/ui/button";
import { cn } from "@crivelo/ui/lib/utils";
import { requestAccessMailto } from "./requestAccessMailto";

// Hero — 2-col grid (1-col below 960px). Left: eyebrow + headline + serif-italic
// subtitle + "Pedir acesso" CTA. Right: the "telona" live-display mock, rendered in
// its STATIC FINAL state (score 2 × 1, Lucas marked winner, jury 2-1, final verdict)
// since the duel loop animation is RMP-204 — and that final state is also the
// reduced-motion fallback. Floating "no ar 2026" seal + rings background (decorative).
//
// jdots final picks: left, right, left → 2 for Lucas (left), 1 for Marina (right).
const JDOT_PICKS = ["l", "r", "l"] as const;

export function LandingHero() {
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
        <div>
          <div className="mb-[26px] inline-flex items-center gap-[10px] font-mono text-xs font-medium uppercase tracking-[0.14em] text-[var(--crema-300)]">
            <span className="size-[7px] rounded-full bg-[var(--live)] shadow-[var(--shadow-live-halo)]" aria-hidden="true" />
            Ao vivo · TNT · café especial
          </div>
          <h1 className="m-0 text-balance font-display text-[clamp(46px,7vw,86px)] font-extrabold leading-[0.96] tracking-[-0.03em] text-[var(--crema-50)] max-[380px]:text-[40px]">
            A arena do café especial
          </h1>
          <p className="mt-6 max-w-[30ch] text-pretty font-serif text-[clamp(21px,2.6vw,30px)] font-normal italic leading-[1.3] tracking-[-0.01em] text-[var(--crema-200)]">
            Organize e transmita competições de latte art, barista e bar battle
          </p>
          <div className="mt-[38px] flex flex-wrap items-center gap-[18px]">
            <Button
              asChild
              className="min-h-[54px] gap-[10px] rounded-md bg-[var(--brand)] px-7 py-[15px] font-body text-[18px] font-semibold text-[var(--fg-inverse)] shadow-2 hover:bg-[var(--brand-hover)] active:bg-[var(--brand-press)] max-[560px]:w-full [&_svg]:size-[19px]"
            >
              <a href={requestAccessMailto}>
                Pedir acesso
                <ArrowRight aria-hidden="true" />
              </a>
            </Button>
            <span className="inline-flex items-center gap-2 font-body text-sm text-[var(--crema-300)]">
              <Lock className="size-[15px]" aria-hidden="true" />
              Acesso sob convite
            </span>
          </div>
        </div>

        {/* Telona mock */}
        <div className="relative max-[960px]:max-w-[540px]" aria-hidden="true">
          <div className="relative overflow-hidden rounded-lg border border-[var(--crema-50)]/12 bg-[var(--espresso-800)] px-6 pt-[22px] pb-[26px] shadow-2 max-[560px]:px-4 max-[560px]:pt-[18px] max-[560px]:pb-[22px]">
            <div className="relative z-[1] mb-[6px] flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--live-soft)] px-[13px] py-[6px] text-[var(--mint-700)]">
                <span className="size-[9px] rounded-full bg-[var(--live)]" aria-hidden="true" />
                <span className="whitespace-nowrap font-mono text-xs font-semibold uppercase tracking-[0.12em]">Ao vivo</span>
              </span>
              <span className="text-right">
                <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--crema-400)]">Tempo</span>
                <span className="mt-[3px] block font-mono text-[22px] font-semibold leading-none tabular-nums text-[var(--crema-100)]">00:27</span>
              </span>
            </div>
            <div className="relative z-[1] mx-0 mt-[2px] mb-[18px] text-center font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--crema-400)]">
              TNT SP 2026 · Final · Free pour
            </div>

            <div className="relative z-[1] grid grid-cols-[1fr_auto_1fr] items-center gap-[14px] max-[560px]:gap-[6px]">
              {/* Competitor A — Lucas (winner) */}
              <Competitor name="Lucas" shop="Torra Comum · SP" win />
              {/* Central score + jury dots */}
              <div className="flex flex-col items-center gap-[9px]">
                <div className="whitespace-nowrap font-mono text-[56px] font-semibold leading-none tracking-[-0.02em] text-[var(--marigold-300)] [font-feature-settings:'tnum','zero'] max-[560px]:text-[40px]">
                  2 × 1
                </div>
                <div className="flex gap-[7px]" aria-hidden="true">
                  {JDOT_PICKS.map((pick, i) => (
                    <JudgeDot key={i} pick={pick} />
                  ))}
                </div>
              </div>
              {/* Competitor B — Marina */}
              <Competitor name="Marina" shop="Tostado · SP" />
            </div>

            <div className="relative z-[1] mt-[22px] flex items-center justify-between gap-4 border-t border-[var(--crema-50)]/10 pt-[18px] max-[560px]:flex-col max-[560px]:items-start max-[560px]:gap-[14px]">
              <span className="pl-10 font-serif text-[15px] italic text-[var(--crema-200)] max-[560px]:pl-14">
                <b className="font-mono font-semibold not-italic text-[var(--marigold-300)]">2 × 1</b> para Lucas.
              </span>
              <span className="flex items-center gap-[11px]">
                <span
                  className="size-[46px] shrink-0 rounded-[6px] border-[3px] border-[var(--crema-50)] [background:repeating-conic-gradient(var(--crema-50)_0deg_90deg,var(--espresso-900)_90deg_180deg)] [background-size:11px_11px]"
                  aria-hidden="true"
                />
                <span className="font-body text-[11.5px] leading-[1.3] text-[var(--crema-300)]">
                  <b className="block font-semibold text-[var(--crema-100)]">Leve o público pelo celular</b>
                  crema.app/e/tnt-sp
                </span>
              </span>
            </div>
          </div>
          {/* Floating "no ar 2026" seal */}
          <div
            className="absolute -bottom-6 -left-10 z-[2] flex size-[84px] -rotate-6 flex-col items-center justify-center rounded-full border-2 border-[var(--marigold-500)] bg-[var(--espresso-800)] shadow-[var(--shadow-telona)] max-[560px]:-bottom-[18px] max-[560px]:-left-[14px] max-[560px]:size-[64px]"
            aria-hidden="true"
          >
            <span className="font-display text-[18px] font-extrabold uppercase leading-none tracking-[-0.01em] text-[var(--crema-50)] max-[560px]:text-[14px]">no ar</span>
            <span className="mt-[3px] font-display text-[11px] font-bold uppercase leading-none tracking-[0.22em] text-[var(--marigold-500)] max-[560px]:text-[9px]">2026</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Competitor({ name, shop, win = false }: { name: string; shop: string; win?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-[11px] text-center">
      <div
        className={cn(
          "flex size-[86px] shrink-0 items-center justify-center rounded-full border-[3px] bg-[var(--espresso-700)] max-[560px]:size-16",
          win ? "border-[var(--marigold-500)]" : "border-[var(--crema-200)]",
        )}
      >
        <User className="size-[54%] text-[var(--crema-300)]" aria-hidden="true" />
      </div>
      <div>
        <div className="font-display text-[18px] font-bold leading-[1.05] tracking-[-0.01em] text-[var(--crema-50)] max-[560px]:text-[15px]">
          {name}
        </div>
        <div className="font-serif text-[13px] italic leading-[1.1] text-[var(--crema-300)] max-[560px]:text-[11.5px]">
          {shop}
        </div>
      </div>
    </div>
  );
}

function JudgeDot({ pick }: { pick: "l" | "r" }) {
  const pickedClass =
    pick === "l"
      ? "border-[var(--cinnamon-300)] bg-[var(--cinnamon-300)]/20"
      : "border-[var(--marigold-300)] bg-[var(--marigold-300)]/[18%]";
  return (
    <span className={cn("flex size-[26px] items-center justify-center rounded-full border-[1.5px]", pickedClass)}>
      {pick === "l" ? (
        <ChevronLeft className="size-[13px] text-[var(--cinnamon-300)]" />
      ) : (
        <ChevronRight className="size-[13px] text-[var(--marigold-300)]" />
      )}
    </span>
  );
}
