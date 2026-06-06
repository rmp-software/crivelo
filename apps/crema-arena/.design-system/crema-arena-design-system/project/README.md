# Crema Arena — Design System

> Rode seu TNT sem o caos.

**Lançamento primário: Brasil · idioma padrão: pt-BR.**

Crema Arena é a plataforma de competições do café especial brasileiro — **TNTs** de latte art (a comunidade BR chama de TNT, não *throwdown*), campeonatos regionais de barista, batalhas de balcão. A organização inscreve os competidores, monta a chave, e a plataforma roda o evento: cronômetro, seleção do júri ao vivo, leaderboard e tela grande.

## Como funciona o julgamento (importante)

**Seleção por jurado, não nota 0–100.**

No TNT, dois competidores fazem o pour ao mesmo tempo. Tipicamente **3 jurados** olham os dois copos e cada um aponta para o latte art que preferiu — lado A *ou* lado B. Não existe nota numérica.

- Placar de um duelo: `2 × 1` (vitória comum), `3 × 0` (unânime).
- Sem empates: ímpar de jurados garante decisão.
- Sem casas decimais, sem média, sem barra de progresso.
- O placar global de um competidor no evento é quantos duelos venceu / quantos jurados o escolheram no torneio.

Tudo na UI — da célula da chave até a tela grande do bar — reflete esse modelo. Sem sliders de 0–100. Sem cartões de jurado numéricos. O jurado tem um botão pra cada lado e pronto.

## Superfícies

1. **Console do organizador (web)** — onde o head judge e o organizador inscrevem competidores, montam a chave, rodam baterias, capturam votos.
2. **Tela ao vivo (display de TV)** — monitor grande no salão mostrando o duelo atual, votos chegando, placar e QR code pra plateia acompanhar do celular.

Não existe app do competidor. A organização faz tudo via console; o competidor recebe link/QR no dia.

---

## Sources

No codebase, Figma file, or screenshots were provided for this engagement. The system below is constructed from the brief:

- Brand description, positioning, and tone (above)
- Direction: *playful, earthy color palette, mobile-first, community of baristas and coffee enthusiasts*

If/when production code or Figma files become available, the colors_and_type tokens and the JSX UI kit components are the right places to reconcile against ground truth.

---

## Index

- `README.md` — this file (context, judging model, content + visual foundations, iconography)
- `SKILL.md` — Claude/Agent skill manifest
- `colors_and_type.css` — color + type tokens (base + semantic)
- `fonts.css` — Webfont loader (Instrument Serif + Bricolage Grotesque + Geist Mono local; Geist Sans on Google Fonts pending brand file)
- `fonts/` — Brand-supplied font files (Instrument Serif, Bricolage Grotesque variable, Geist Mono variable + statics)
- `assets/` — wordmark, brand mark, supporting graphics
- `preview/` — Design System tab cards (one HTML per concept)
- `ui_kits/`
  - `organizer_dashboard/` — web organizer console (inscrição, chave, captura de votos)
  - `organizer_mobile/` — companion mobile do head judge (captura de votos no celular)
  - `live_display/` — tela ao vivo para TV / monitor grande (com QR code)

---

## Content fundamentals

**Idioma.** pt-BR é primário em todo lugar — UI, microcopy, e-mails, páginas de marketing. Termos técnicos já incorporados pelo specialty BR ficam em inglês como loanwords: *free pour*, *pour*, *cup down*, *head judge*, *lane*, *seed*. **TNT** é como a comunidade BR chama o throwdown — use *TNT*, não *throwdown*, em UI e marketing.

**Voz.** Crema Arena fala como head judge com prancheta e bom humor: direta, calorosa, levemente debochada, nunca corporativa. Café é levado a sério — as *pessoas* não.

**Pessoa.** *Você* em todo lugar com competidor e organizador. Primeira pessoa do plural *nós* só quando a plataforma age em nome de alguém ("Vamos montar a chave conforme as inscrições chegam."). Nunca *tu* nem *o senhor*. Verbo no imperativo curto e ativo.

**Capitalização.** Sentence case em todos os lugares — botões, títulos de tela, navs, modais. Title Case fica reservado para nomes de *eventos* e *rodadas* ("TNT SP 2026", "Oitavas"). *TNT* sempre em caixa alta (é sigla). Nunca CAIXA ALTA para ênfase no resto — use peso ou cor.

**Pontuação.** Travessão em apartes — use à vontade. Vírgula de Oxford não se aplica ao português. Um ponto de exclamação por tela, no máximo — faça por merecer. Sem ponto final em texto de botão, toast, ou stat card de uma linha. Use aspas curvas tipográficas.

**Números.** Números até dez por extenso no corpo de texto ("três baterias"). Em stats e cronômetros: sempre algarismos. Horas em `mm:ss` (`00:27`). Placar de duelo: `2 × 1`, `3 × 0` (multiplicação `×` com espaços, não `x`). Moeda: `R$ 30` (com espaço, sem zeros depois da vírgula em valor cheio).

**Não existe nota 0–100.** Nunca escreva "nota 92", "score 87", "média 81,4". O modelo é seleção por jurado.

**Datas.** Formato curto: `Sex 25 mai · 19h`. Formato completo: `25 de maio de 2026`. Sempre dia antes de mês.

**Emoji.** Sem emoji em UI chrome, títulos ou botões. Única exceção: conteúdo gerado pelo usuário (notas de jurado, comentários, chat).

**Exemplos.**
- ✅ "Rodada 2 começa em 4 min. Vaporiza esse leite."
- ✅ "Chave montada. 32 entram, 1 sai com o avental."
- ✅ "Em quem você vota?" (botão do jurado)
- ✅ "2 × 1 para Marina Okada."
- ✅ "Unânime. 3 × 0."
- ✅ "Copo na mesa. Jurados escolhendo."
- ✅ "Bateria 3 · Free Pour"
- ❌ "🔥 RODADA 2 COMECANDO AGORA!!!"
- ❌ "Enviar nota 87/100." (modelo numérico errado)
- ❌ "Suas notas foram registradas pelo sistema." (voz passiva + modelo errado)

**Movimentos de microcopy que a gente curte.**
- *Conta o copo:* "32 entram, 1 sai com o avental."
- *Voz do cronômetro:* "Copo na mesa. Jurados escolhendo."
- *Resultado:* "2 × 1 para Marina." — ou "Unânime." quando for 3 × 0.
- *Empty states:* "Nenhum TNT ainda. Bota o primeiro →"
- *Erros:* "Cadê o jurado 3? Só fecha o duelo com todos os votos."
- *Botões do jurado:* "Esquerda", "Direita" (com nome do competidor abaixo) — nunca "submit".
- *Botões do organizador:* "Inscrever", "Iniciar bateria", "Encerrar duelo", "Desclassificar", "Salvar rodada".

**Glossary (BR ↔ EN).**
| pt-BR             | Loanword / EN equiv  |
|-------------------|----------------------|
| **TNT**           | Throwdown (BR slang — use TNT em UI) |
| Bateria           | Heat                 |
| Chave             | Bracket              |
| Duelo             | Match                |
| Rodada            | Round                |
| Oitavas           | Round of 16          |
| Quartas           | Quarterfinal         |
| Semi              | Semifinal            |
| Final             | Final                |
| Cabeça-de-chave   | Seed                 |
| Voto / seleção    | Vote / pick          |
| Placar (`2 × 1`)  | Score                |
| Jurado            | Judge                |
| Unânime           | Unanimous (`3 × 0`)  |
| Inscrição         | Registration         |
| Cafeteria         | Shop                 |
| Ao vivo           | Live                 |
| Vencedor / vencedora | Winner            |
| Fora              | Out / eliminated     |

(Free pour, pour, cup down, lane, head judge — mantidos em inglês. "Throwdown" só aparece em textos explicando a origem do TNT.)

---

## Visual foundations

**Color.** A small, earthy palette built around an espresso/crema axis with a single hot accent (cinnamon rust) and a second supporting gold (marigold) for wins and stage moments. Mint and cherry are reserved for **live** and **eliminated** semantic states — they never appear as decorative color. Cream is the dominant surface; pure white is never used as a background. Pure black is never used for text — espresso `#1F1410` always.

**Type.** Display is **Bricolage Grotesque** — a contemporary variable grotesque with enough personality to feel hand-set without slipping into novelty. Editorial italic moments (pull quotes, the wordmark itself, hero subtitles) use **Instrument Serif Italic** for a chalkboard-menu flourish. Body and UI text are **Geist**. Scores, timers, seed numbers, and bracket positions are **Geist Mono** — always tabular figures.

**Spacing.** 4px base unit. Touch targets minimum 44px. Card padding starts at 16px on mobile, 24px on tablet/desktop. Vertical rhythm runs on a 4/8/16/24/32/48 ramp.

**Backgrounds.** Solid cream `--bg` is default. A second tone `--bg-2` (latte) is used to delineate sections, never gradients. Hero/stage moments may use full-bleed espresso `--bg-inverse` with a subtle paper-grain noise overlay at 4% opacity. No image gradients. No glassy/frosted blur except over photography. No glow.

**Photography & imagery.** When photos appear they are warm-toned, low-key, and slightly grainy — milk pours, latte art crowns from above, hands on a portafilter. Imagery never overlays text in a hero; text sits beside or below. No stock-looking studio shots, no people staring at the camera giving thumbs up.

**Illustration & motifs.** Concentric rings (crema rings, cup-top view) are the recurring abstract motif — used as section dividers, loading indicators, score gauges, and avatar frames. A second motif is the **stamp seal** — a soft rotated circular badge for awards, "judged", "live", etc. Bracket lines are 1.5px, espresso, with a 4px rounded join.

**Borders.** 1px `--border` (a warm brown at low opacity) for most dividers and inputs. Cards opt for shadow over border, but when bordered it's 1.5px espresso for emphasis. Never use light-gray neutrals — borders are always tinted.

**Corner radii.** A two-tier system. Small surfaces (chips, buttons, inputs, score pills) use `--radius-sm: 10px`. Cards and modals use `--radius-md: 18px`. Full-bleed sheets use `--radius-lg: 28px` on the top corners only. Pills (avatar groups, status chips) use `--radius-full`. No 4px corners — too rectangular for this brand.

**Cards.** Cream surface, no border by default, with a soft warm-brown shadow: `0 1px 0 rgba(31,20,16,.04), 0 8px 24px -12px rgba(31,20,16,.12)`. On press they don't lift — they nudge down 1px and the shadow tightens. Highlighted/winning cards get a 1.5px cinnamon border plus a tiny corner stamp.

**Shadows.** Two elevation levels. `--shadow-1` for resting cards (subtle, warm). `--shadow-2` for floating menus and the score-submission sheet. No third level — if it needs to go higher it should be a full sheet.

**Transparency & blur.** Used sparingly. The bottom tab bar gets a 16px backdrop blur over `--bg/.78`. Modals dim the scrim with `rgba(31,20,16,.55)`. Frosted panels never appear inside cards.

**Animation.** Default easing is `cubic-bezier(.2,.7,.2,1)` — confident but not springy. Standard duration 180ms; hero/stage transitions 320ms. Score commits use a small overshoot bounce (210ms, ease-out-back) — the *only* place that bounce shows up. Page transitions cross-fade with a 4px Y nudge. Loading spinners are concentric crema rings rotating at different speeds.

**Hover & press.**
- Hover (web only): background steps one tone darker (`--bg → --bg-2 → --bg-3`); never opacity changes; never scale.
- Press (everywhere): 1px translateY down and shadow tightens. Buttons get a 4% darker fill.
- Focus: 2px cinnamon ring offset by 2px from the element. Always visible — accessibility floor.

**Layout rules.** Mobile screens have a 16px gutter and a 56px bottom tab bar. Top safe area is preserved; a 12px breathing zone sits below it before content begins. Sticky headers collapse from 96px → 56px on scroll. On organizer (web) the canvas maxes at 1280px content, but the bracket view is allowed to scroll horizontally and goes edge-to-edge.

**Live state treatment.** Anything actively happening — a heat in progress, a live leaderboard, a judge currently scoring — wears a small **mint dot + "LIVE" mono caps label** and a 1.5px mint left edge on the card. Live state never blinks; mint is enough.

---

## Iconography

**Set.** [Lucide](https://lucide.dev/) icons, loaded via CDN. Stroke 1.75px on mobile (24px size), 1.5px on desktop (20px size). Espresso color by default, currentColor inherited.

> **Substitution note.** No proprietary icon set existed at handoff. Lucide was chosen because its 1.5–1.75px stroke and rounded joins match the rest of the system better than Heroicons (too thin) or Material (too geometric). If a custom icon set is produced later, it should match Lucide's outline-only, rounded-join, 24×24 viewbox grid so swap-in is trivial. **Please confirm Lucide is acceptable or point us at the intended set.**

**Usage rules.**
- Outline style only. No filled/duotone variants.
- 24px in mobile chrome, 20px in dense lists, 16px inside buttons.
- Icons in buttons get 8px gap from the label.
- Status icons (live, eliminated, winner) are **not** lucide — they're brand-specific shapes (see `assets/`): the **crema ring** dot, the **stamp seal**, and the **trophy cup** mark.

**Emoji & unicode.** Never used as UI affordances. Allowed inside user-generated copy only (judge notes, chat). The em-dash `—` and middle dot `·` are used as text separators ("Heat 3 · Free Pour").

**Logos & marks.** Wordmark, monogram, and stamp seal live in `assets/`. The wordmark uses Instrument Serif Italic for "Crema" and Bricolage Grotesque Bold for "Arena" — a deliberate slow→fast typographic pairing reflecting the brand (craft meets competition).

---
