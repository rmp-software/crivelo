"use client";

import Image from "next/image";
import { Zap, Users } from "lucide-react";
import { Reveal } from "./Reveal";

// "Does" story-bracket — light section (--bg). Title "Rode seu TNT sem o caos"
// (caos italic). Two feeder cards (Praticidade, Engajamento) converge through an
// SVG connector into a "Resultado" card with a cinnamon border (trophy.svg in the
// kicker, stamp-seal.svg in the corner). Below 960px: vertical stack with a left
// stub instead of the horizontal connector.
//
// RMP-204 motion: header + cards scroll-reveal on enter. Under reduced-motion the
// Reveal wrapper renders plain elements (always visible — never an opacity-0 trap).
export function LandingDoes() {
  return (
    <section className="relative bg-bg px-7 py-[88px] text-fg max-[560px]:px-[18px] max-[560px]:py-16">
      <div className="mx-auto max-w-[1200px]">
        <Reveal className="mx-auto mb-[60px] max-w-[720px] text-center">
          <div className="mb-[26px] inline-flex items-center justify-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.14em] text-fg-3">
            <span className="size-[7px] rounded-full bg-brand" aria-hidden="true" />
            Por que a Crema Arena
          </div>
          <h2 className="m-0 text-balance font-display text-[clamp(30px,4.6vw,50px)] font-extrabold leading-[1.02] tracking-[-0.025em] text-fg">
            Rode seu TNT sem o{" "}
            <em className="font-serif font-normal italic text-brand">caos</em>
          </h2>
        </Reveal>

        <div className="grid items-center gap-0 [grid-template-columns:minmax(0,1fr)_64px_minmax(0,1.02fr)] max-[960px]:block">
          {/* Feeder cards */}
          <Reveal className="grid gap-[22px] max-[960px]:gap-4">
            <FeederCard
              kicker="Praticidade"
              icon={<Zap className="size-[19px] text-fg-2" aria-hidden="true" />}
              title="Montou, já rodou"
              body="Inscreve, monta a chave e dá o start. Sem planilha, sem improviso na hora — você cuida do café, a plataforma cuida da logística."
            />
            <FeederCard
              kicker="Engajamento"
              icon={<Users className="size-[19px] text-fg-2" aria-hidden="true" />}
              title="A plateia no jogo"
              body="Cronômetro na telona, votação dos jurados ao vivo e o público acompanhando pelo celular. Ninguém assiste de fora."
            />
          </Reveal>

          {/* Connector — desktop only */}
          <div className="relative self-stretch max-[960px]:hidden" aria-hidden="true">
            <svg
              viewBox="0 0 64 220"
              preserveAspectRatio="none"
              fill="none"
              className="absolute inset-0 size-full stroke-brand [stroke-width:1.5]"
            >
              <path d="M0 60 H32 V160 H0" strokeOpacity="0.5" />
              <path d="M32 110 H64" strokeOpacity="0.9" />
            </svg>
          </div>

          {/* Resultado / convergence card */}
          <Reveal
            delay={0.12}
            className="relative self-center rounded-md border-[1.5px] border-cinnamon-500 bg-surface-raised px-[30px] pt-[30px] pb-7 shadow-2 max-[960px]:mt-4 max-[960px]:before:absolute max-[960px]:before:-top-4 max-[960px]:before:left-10 max-[960px]:before:h-4 max-[960px]:before:w-[1.5px] max-[960px]:before:bg-cinnamon-500 max-[960px]:before:content-['']"
          >
            <Image
              src="/assets/stamp-seal.svg"
              alt=""
              aria-hidden="true"
              width={64}
              height={64}
              className="absolute -top-[26px] right-[26px] size-16 -rotate-6"
            />
            <span className="mb-3 inline-flex items-center gap-[9px] font-mono text-[11.5px] font-semibold uppercase tracking-[0.16em] text-marigold-700">
              <Image src="/assets/trophy.svg" alt="" aria-hidden="true" width={22} height={22} className="size-[22px]" />
              Resultado
            </span>
            <h3 className="m-0 mb-[9px] font-display text-[27px] font-extrabold leading-[1.08] tracking-[-0.02em] text-fg">
              Um TNT que vira tradição
            </h3>
            <p className="m-0 font-body text-[15.5px] leading-[1.55] text-fg-2">
              Organização redonda mais plateia ligada dá casa cheia — e aquele evento que todo mundo já quer
              repetir no mês que vem.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function FeederCard({
  kicker,
  icon,
  title,
  body,
}: {
  kicker: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-md border border-border bg-surface-raised px-7 py-[26px] shadow-1">
      <span className="mb-3 inline-flex items-center gap-[9px] font-mono text-[11.5px] font-medium uppercase tracking-[0.14em] text-brand">
        {icon}
        {kicker}
      </span>
      <h3 className="m-0 mb-2 font-display text-[23px] font-bold leading-[1.12] tracking-[-0.015em] text-fg">
        {title}
      </h3>
      <p className="m-0 font-body text-[15px] leading-[1.55] text-fg-2">{body}</p>
    </div>
  );
}
