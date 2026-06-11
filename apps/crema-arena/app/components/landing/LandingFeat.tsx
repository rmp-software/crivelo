"use client";

import { useId, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { cn } from "@crivelo/ui/lib/utils";
import { Reveal } from "./Reveal";
import {
  BracketMock,
  CaptureMock,
  PhotoMock,
  MiniTelonaMock,
  PhoneMock,
} from "./featMocks";

// "Feat" deep-dive — dark section (--bg-inverse). Title "Tudo que roda no dia do
// TNT" (TNT italic). 4 tabs (Chave / Console / Telona / Companion) with FUNCTIONAL
// switching via useState (instant, no animation — RMP-204 adds the transition).
// Each panel: an intro + a "zig" of 3 alternating cards on a center spine, some with
// illustrative in-card mocks. Below 960px: tabs become a scrollable strip; the zig
// becomes a left-spine ladder. a11y: role=tablist / tab (aria-selected + aria-controls)
// / tabpanel.

type ZigCard = {
  kicker: string;
  title: string;
  body: string;
  side: "left" | "right";
  mock?: React.ReactNode;
};

type Panel = {
  id: string;
  num: string;
  label: string;
  sub: string;
  introTitle: string;
  introText: string;
  cards: ZigCard[];
};

const PANELS: Panel[] = [
  {
    id: "chave",
    num: "01",
    label: "Chave",
    sub: "Inscrição e chaveamento",
    introTitle: "Chave",
    introText: "Do cadastro ao chaveamento, em minutos.",
    cards: [
      {
        kicker: "Inscrição",
        title: "Inscreva em segundos",
        body: "Adiciona competidor, casa de café e cidade — ou importa a lista inteira de uma vez.",
        side: "left",
      },
      {
        kicker: "Chaveamento",
        title: "Chave automática, num clique",
        body: "32 entram, 1 sai com o avental.",
        side: "right",
        mock: <BracketMock />,
      },
      {
        kicker: "Seeds & byes",
        title: "Byes e seeds na régua",
        body: "Número ímpar? A plataforma distribui os byes e respeita os cabeças-de-chave sem você fazer conta.",
        side: "left",
      },
    ],
  },
  {
    id: "console",
    num: "02",
    label: "Console",
    sub: "Você no comando",
    introTitle: "Console do organizador",
    introText: "Sem app de competidor ou jurado — você conduz tudo.",
    cards: [
      {
        kicker: "Você no comando",
        title: "Tudo pelo seu console",
        body: "Inscreve, monta a chave e conduz cada duelo de um lugar só. Competidor e jurado não precisam de app — a plataforma é sua.",
        side: "left",
      },
      {
        kicker: "Captura",
        title: "Registra o voto ou o walkover",
        body: "Você marca a seleção do júri a cada duelo. Faltou um competidor? Registra o walkover e escolhe quem avança.",
        side: "right",
        mock: <CaptureMock />,
      },
      {
        kicker: "Fotos",
        title: "Os copos direto na telona",
        body: "Fotografa a mesa com os copos e a imagem vai pra telona e pro companion — a plateia vê o latte art de perto.",
        side: "left",
        mock: <PhotoMock />,
      },
    ],
  },
  {
    id: "telona",
    num: "03",
    label: "Telona",
    sub: "Tela ao vivo",
    introTitle: "Telona",
    introText: "O duelo na tela grande do salão.",
    cards: [
      {
        kicker: "Destaque",
        title: "Duelo em primeiro plano",
        body: "Competidores, cronômetro e a rodada atual — grandes o suficiente pro fundo do bar.",
        side: "left",
      },
      {
        kicker: "Ao vivo",
        title: "Votação em tempo real",
        body: "Os votos aparecem na hora em que o júri decide.",
        side: "right",
        mock: <MiniTelonaMock />,
      },
      {
        kicker: "QR fixo",
        title: "Plateia a um toque",
        body: "Um QR code sempre visível leva o público pro companion na hora.",
        side: "left",
      },
    ],
  },
  {
    id: "companion",
    num: "04",
    label: "Companion",
    sub: "Plateia no celular",
    introTitle: "Companion",
    introText: "O público acompanha do próprio bolso.",
    cards: [
      {
        kicker: "No celular",
        title: "A arena na palma da mão",
        body: "Chave, duelo atual e quem já caiu — tudo num lugar só.",
        side: "left",
        mock: <PhoneMock />,
      },
      {
        kicker: "Sem fricção",
        title: "Sem instalar nada",
        body: "Abre pelo navegador via QR. Entra em segundos, sem app, sem cadastro.",
        side: "right",
      },
      {
        kicker: "Sincronizado",
        title: "Todo mundo junto",
        body: "A galera vê o mesmo que a telona, em tempo real, sem recarregar a página.",
        side: "left",
      },
    ],
  },
];

export function LandingFeat() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(PANELS[0].id);
  const activePanel = PANELS.find((p) => p.id === active) ?? PANELS[0];
  const baseId = useId();
  const tabId = (id: string) => `${baseId}-tab-${id}`;
  const panelId = (id: string) => `${baseId}-panel-${id}`;
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Roving-tabindex keyboard nav for the tablist (ArrowLeft/Right + Home/End).
  const onTabsKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const current = PANELS.findIndex((p) => p.id === active);
    let next = current;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = (current + 1) % PANELS.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = (current - 1 + PANELS.length) % PANELS.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = PANELS.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    setActive(PANELS[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <section className="relative bg-[var(--bg-inverse)] px-7 py-[90px] text-[var(--fg-inverse)] max-[560px]:px-[18px] max-[560px]:py-16">
      <div className="relative z-[1] mx-auto max-w-[1200px]">
        <Reveal className="mb-[52px] max-w-[760px]">
          <div className="mb-[26px] inline-flex items-center gap-[10px] font-mono text-xs font-medium uppercase tracking-[0.14em] text-[var(--crema-300)]">
            <span className="size-[7px] rounded-full bg-[var(--brand)]" aria-hidden="true" />
            Por dentro da plataforma
          </div>
          <h2 className="m-0 text-balance font-display text-[clamp(30px,4.4vw,48px)] font-extrabold leading-[1.04] tracking-[-0.025em] text-[var(--crema-50)]">
            Tudo que roda no dia do{" "}
            <em className="font-serif font-normal italic text-[var(--marigold-300)]">TNT</em>
          </h2>
        </Reveal>

        <div className="grid grid-cols-[282px_1fr] items-start gap-[52px] max-[960px]:grid-cols-1 max-[960px]:gap-7">
          {/* Tabs */}
          <div
            role="tablist"
            aria-label="Funcionalidades"
            onKeyDown={onTabsKeyDown}
            className="sticky top-[92px] flex flex-col gap-[10px] max-[960px]:static max-[960px]:flex-row max-[960px]:flex-nowrap max-[960px]:gap-2 max-[960px]:overflow-x-auto max-[960px]:pb-1"
          >
            {PANELS.map((p, i) => {
              const on = p.id === active;
              return (
                <button
                  key={p.id}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  id={tabId(p.id)}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-controls={panelId(p.id)}
                  tabIndex={on ? 0 : -1}
                  onClick={() => setActive(p.id)}
                  className={cn(
                    "flex w-full min-h-[44px] items-start gap-[14px] rounded-md border px-[18px] py-4 text-left font-body transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]",
                    "max-[960px]:w-auto max-[960px]:min-w-[170px] max-[960px]:flex-[0_0_auto]",
                    on
                      ? "border-[var(--cinnamon-500)] bg-[var(--espresso-800)] shadow-[inset_3px_0_0_var(--cinnamon-500)]"
                      : "border-[var(--crema-50)]/10 bg-transparent hover:bg-[var(--espresso-800)]",
                  )}
                >
                  <span className="shrink-0 pt-[2px] font-mono text-xs font-semibold text-[var(--cinnamon-300)]">
                    {p.num}
                  </span>
                  <span className="min-w-0">
                    <b className="block font-display text-[17px] font-bold leading-[1.15] tracking-[-0.01em] text-[var(--crema-50)]">
                      {p.label}
                    </b>
                    <span className="mt-[2px] block text-[13px] leading-[1.3] text-[var(--crema-400)]">
                      {p.sub}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Panels. Every inactive panel keeps an empty `role="tabpanel"` shell in the
              DOM (aria-labelledby its tab, hidden) so ARIA + keyboard nav (Arrow/Home/End)
              stay correct. The ACTIVE panel is a SINGLE, stably-keyed host
              (key="active-tabpanel") that only swaps its `id` / `aria-labelledby` props
              as the active tab changes — it never remounts, so the AnimatePresence inside
              it persists. That single persisted AnimatePresence drives one keyed
              motion.div (key={active}); on a tab change only the child's key changes, so
              exit + enter actually play (fade/slide) instead of switching instantly.
              initial={false} keeps the first page load static while later key changes
              animate enter + exit. Under reduced-motion the swap is instant. */}
          <div className="relative">
            <div
              key="active-tabpanel"
              id={panelId(active)}
              role="tabpanel"
              aria-labelledby={tabId(active)}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active}
                  initial={reduce ? false : { opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? { opacity: 1 } : { opacity: 0, x: -16 }}
                  transition={{ duration: reduce ? 0 : 0.3, ease: "easeOut" }}
                >
                  <PanelBody panel={activePanel} />
                </motion.div>
              </AnimatePresence>
            </div>
            {PANELS.filter((p) => p.id !== active).map((p) => (
              <div
                key={p.id}
                id={panelId(p.id)}
                role="tabpanel"
                aria-labelledby={tabId(p.id)}
                hidden
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PanelBody({ panel: p }: { panel: Panel }) {
  return (
    <>
      <div className="mb-[30px]">
        <h3 className="m-0 mb-[6px] font-display text-[26px] font-bold tracking-[-0.02em] text-[var(--crema-50)]">
          {p.introTitle}
        </h3>
        <p className="m-0 font-serif text-[19px] italic text-[var(--crema-200)]">{p.introText}</p>
      </div>

      {/* Zig: alternating cards on a center spine (desktop); left-spine ladder (mobile) */}
      <div className="relative flex flex-col gap-[30px] before:absolute before:left-1/2 before:top-[14px] before:bottom-[14px] before:w-[2px] before:-translate-x-1/2 before:bg-gradient-to-b before:from-[var(--cinnamon-500)] before:to-[var(--cinnamon-300)] before:content-[''] max-[960px]:gap-4 max-[960px]:pl-[38px] max-[960px]:before:left-[11px] max-[960px]:before:top-[22px] max-[960px]:before:bottom-[22px] max-[960px]:before:translate-x-0">
        {p.cards.map((c, i) => (
          <div
            key={i}
            className={cn(
              "relative z-[1] w-[66%] rounded-md border border-[var(--crema-50)]/12 bg-[var(--espresso-800)] px-6 py-[22px] shadow-2",
              c.side === "left" ? "self-start" : "self-end",
              // mobile: full-width ladder rung with node + connector
              "max-[960px]:w-full max-[960px]:self-stretch",
              "max-[960px]:before:absolute max-[960px]:before:-left-[33px] max-[960px]:before:top-[22px] max-[960px]:before:size-4 max-[960px]:before:rounded-full max-[960px]:before:border-2 max-[960px]:before:border-[var(--cinnamon-500)] max-[960px]:before:bg-[var(--espresso-900)] max-[960px]:before:shadow-[0_0_0_4px_var(--bg-inverse)] max-[960px]:before:content-['']",
              "max-[960px]:after:absolute max-[960px]:after:-left-[17px] max-[960px]:after:top-[29px] max-[960px]:after:h-[2px] max-[960px]:after:w-[17px] max-[960px]:after:bg-[var(--cinnamon-500)] max-[960px]:after:content-['']",
            )}
          >
            <span className="mb-[10px] block font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--cinnamon-300)]">
              {c.kicker}
            </span>
            <h4 className="m-0 mb-2 font-display text-[20px] font-bold leading-[1.15] tracking-[-0.015em] text-[var(--crema-50)]">
              {c.title}
            </h4>
            {c.mock ? <div aria-hidden="true">{c.mock}</div> : null}
            <p className="m-0 mt-2 font-body text-[14.5px] leading-[1.55] text-[var(--crema-300)]">
              {c.body}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
