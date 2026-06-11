---
slug: landing-page
status: planned
created: 2026-06-10
design_link: https://api.anthropic.com/v1/design/h/HQq9Xbi7R_Ceo6FlfXfmdw?open_file=Crema+Arena+Landing.html
design_handoff_local: apps/crema-arena/.design/  # gitignored; bundle pulled from design_link, per root CLAUDE.md
linear_project_id: aac21a02-f206-4d19-9284-e852b2c0b43c
linear_parent_issue: RMP-196
feature_branch: feature/landing-page
---

<feature_specification>

  <feature_name>Public landing page + UI foundation (Tailwind v4 · shadcn · motion)</feature_name>

  <overview>
    Two things in one spec, by explicit decision: (1) a **UI foundation** that modernizes the
    monorepo — migration to Tailwind v4, shadcn/ui as the commodity-primitive layer in the shared
    `@crivelo/ui` package, `motion` for animation, a `cn()` helper, and a **written, enforceable
    styling guide**; and (2) the Crema Arena **public landing page** at `/`, which is the **first
    consumer and reference implementation** of that foundation — it has to be perfect.

    The direction is "buy commodity UI, build the domain": stop re-implementing in-house what
    established libraries already solve (modals, drawers, toasts, focus traps, animation) and spend
    effort on what is product. The pattern follows what was adopted in `~/dev/molly` (shadcn under
    a `ui/` dir, `cn()` with an extended tailwind-merge, styling guide in `<styling_conventions>` +
    `<compliance_rules>`), adapted to this monorepo.

    The landing's hi-fi was designed in Claude Design and is the visual source of truth. Per the
    monorepo convention (root CLAUDE.md → "Claude Design handoffs"), the bundle is **not committed**:
    the canonical source is `design_link`, with a gitignored local copy at `design_handoff_local`
    (`apps/crema-arena/.design/`). The implementation recreates the layout faithfully in
    React/Next against the tokens, using the new foundation — zero deprecated patterns.
  </overview>

  <problem>
    - **No public entry point.** `middleware.ts` redirects anonymous visitors from `/` to `/login`;
      the first screen a prospect sees is a password form. The current `app/page.tsx` is dead code.
      With no public signup, there is no path to request access.
    - **Poor Tailwind quality / everything in-house.** Today: **19 files with inline `style={{…}}`**
      and **~1120 `var(--…)` references** in crema-arena app code (color/style via inline style
      instead of utilities). Primitives (`Button`, `Card`, `Input`, `Modal`, `ConfirmationModal`,
      `Toast`, `Badge`, `EmptyState`, `LoadingSpinner`, `PageHeader`) are all hand-rolled in
      `@crivelo/ui`, with no commodity (shadcn) layer and no enforced styling convention. Animation
      would be another manual `setInterval`/keyframes. This scales badly and diverges per new
      screen — and now it repeats across **two apps**: `crivelo-web` arrived with the same debt
      (18 inline-style files, ~188 `var()` refs, a manual keyframe). See `<preflight_flags>`.
  </problem>

  <preflight_flags>
    <!-- RESOLVED — coa-v60-calculator has merged into main; findings below. -->
    - **`apps/crivelo-web` HAS LANDED on `main`** (Crivelo web shell + COA V60 calculator). The
      assumption "crema-arena is the only consumer of `@crivelo/tokens`/`@crivelo/ui`" is officially
      void: the v4 migration and the styling guide now cover **two apps**.
    - **Good news: `crivelo-web` is structurally identical to `crema-arena`** — same styling stack,
      so the v4 migration is the *same shape* in both:
        * Tailwind `^3.4.0` + the `@crivelo/tokens/tailwind` preset; `postcss-import` + `tailwindcss`;
          `globals.css` imports `foundation.css` then an app-local accent file
          (`crivelo-tokens.css` = **teal** accent, the exact analog of `arena-tokens.css` = cinnamon).
        * Depends on `@crivelo/tokens` **and** `@crivelo/ui` (workspace), but **imports zero**
          primitives from `@crivelo/ui` today — it uses its own `brand/ · shell/ · coa/` components.
        * Already ships a manual `@keyframes` (`coaBrewPulse` in BrewTimer) — a future `motion`
          candidate when that screen is touched (not now; grandfathered).
    - **Style debt in `crivelo-web` (measured on `main`):** 18 files with `style={{`, 140
      occurrences, ~188 `var(--…)` refs, 8 raw hex in tsx, 0 `motion` imports. Same order of
      magnitude as crema-arena — **grandfathered** by the same strategy (`<deprecation_strategy>`).
    - **DONE:** `main` has been merged into this branch (fast-forward), so `crivelo-web` is now
      physically present and both apps can be migrated for real. Re-validate Tailwind locks/versions
      before starting the foundation work.
  </preflight_flags>

  <scope>
    <in_scope>
      <!-- UI foundation -->
      - Migrate the monorepo to **Tailwind v4** (`@tailwindcss/postcss`, `@theme` model):
        `@crivelo/tokens` (becomes the `@theme` source instead of the v3 `tailwind-preset.js`),
        the accent files, and each app's `globals.css`/postcss (`crema-arena` and `crivelo-web`).
      - Add **shadcn/ui as the commodity-primitive layer in `@crivelo/ui`** (shared package): wire
        via `components.json` + a `@theme` alias layer mapping shadcn's `--color-*` to the
        Crivelo/Arena tokens; `utils` → `cn()`. No blind `shadcn init`.
      - Add `cn()` (clsx + `tailwind-merge`, extended with the custom font-size/shadow groups) as a
        shared util consumed by the primitives.
      - Add **`motion`** (`motion/react`) as the default animation library.
      - Write the **styling guide** and **promote** it into `app_spec.txt` (`<styling_conventions>`
        + `<compliance_rules>` with `grep`) and `CLAUDE.md` (styling rules + build-vs-buy), so
        `rmp:spec-compliance-reviewer` enforces it on all new code (see `<styling_guide>`).
      - **Deprecation strategy** for the old patterns without a big-bang rewrite (see
        `<deprecation_strategy>`).
      - **Consistency migration:** move the commodity-UI layer of **`crema-arena` and `crivelo-web`**
        onto the shared shadcn primitives in `@crivelo/ui`, so both apps are consistent (see
        `<shared_primitives_migration>`). Large phase, sliced per primitive/app, each slice with
        visual non-regression.

      <!-- Landing page (first consumer, perfect) -->
      - Public landing at `/` for anonymous visitors, three sections + footer, faithful to the
        local handoff (see `<sections>`), built **entirely on the new foundation** (shadcn/motion/
        cn/utilities — zero inline-style/hex/var() in `style`, zero deprecated primitive).
      - `middleware.ts` change: anonymous at `/` renders the landing; authenticated at `/` →
        `/dashboard`; the `/dashboard/*` guard is unchanged.
      - Replace `app/page.tsx`; client component (`'use client'`) with the interactions via
        `motion` (hero duel loop, tab switching, scroll-reveal), respecting `prefers-reduced-motion`.
      - Add the 5 ramp tokens the design uses (see `<design_tokens>`).
      - Prefilled `mailto:lucas.rmagalhaes@gmail.com` CTA.
    </in_scope>
    <out_of_scope>
      - **Rewriting non-commodity screens/logic.** The v4 migration is mechanical (tokens/postcss);
        the old *usage* pattern (inline style, hand-rolled domain UI) is **grandfathered** except
        for the commodity-primitive swap in `<shared_primitives_migration>`. Domain components are
        not rewritten.
      - Backend, email-capture form, lead storage, signup/self-registration.
      - "Copy email" fallback (decided: `mailto` only).
      - Functional QR / real data in the landing mocks (illustrative and static).
      - Advanced SEO, blog, i18n, changes to `/login` or the `/dashboard/*` guard.
    </out_of_scope>
  </scope>

  <engineering_foundation>
    <build_vs_buy>
      Buy commodity UI, build the domain. Before re-implementing a solved problem
      (modal/drawer/toast/dialog/focus/animation), reach for an established library. Domain logic
      (bracket, duel, wildcard, leaderboard; COA recipe/timer) stays bespoke — that is the product.
      Judge libraries on maintenance/adoption, bundle size, fit, a11y, and license before installing.
    </build_vs_buy>

    <tailwind_v4>
      - `@crivelo/tokens`: replace `tailwind-preset.js` (v3 JS preset) with a CSS **`@theme`** source
        the apps import. Colors/radii/shadows/easing/fonts become the utility source
        (`bg-surface`, `text-fg`, `rounded-md`, `shadow-brand`, `ease-standard`, etc.).
      - Each app: `@import "tailwindcss"` + `@tailwindcss/postcss`; `arena-tokens.css` /
        `crivelo-tokens.css` become `@theme`/`@theme inline`; remove/empty `tailwind.config.ts`
        (v4 auto-detects content; config becomes optional). Bump to `tailwindcss@^4` +
        `@tailwindcss/postcss`.
      - The Tier-2 accents (cinnamon in arena, teal in crivelo-web), today in `tailwind.config.ts` /
        the accent CSS, move into `@theme` so `bg-cinnamon-500` etc. still generate.
      <!-- TODO: confirm the exact @theme mechanics for a shared package vs per-app (where the base
           layer is declared and where apps override). -->
    </tailwind_v4>

    <shadcn>
      - Commodity primitives live in **`@crivelo/ui`** (`packages/ui/src/ui/`), source we own and
        customize; add via `npx shadcn@latest add <name>` pointed at the package.
      - Wired via `components.json`: `style` new-york, `rsc`, `tsx`, `iconLibrary: lucide`,
        `aliases.utils` → the shared `cn()` (not the default `@/lib/utils`).
      - A `@theme` **alias layer** maps shadcn's `--color-*` to the Crivelo/Arena tokens
        (`--bg`, `--fg`, `--brand`, …) so the primitives inherit the warm theme. **Never** run a
        blind `shadcn init` (it rewrites the base CSS).
      - New deps in the package: `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`.
      <!-- TODO: shadcn inside a shared monorepo package on Tailwind v4 is non-trivial wiring
           (components.json location, registry, the @theme layer). Validate with one primitive
           (Button) before migrating the rest. -->
    </shadcn>

    <motion>
      - `motion` (`motion/react`) as the animation library. On the landing: the hero duel loop, tab
        transitions, and scroll-reveal. Always behind `prefers-reduced-motion` (`useReducedMotion`)
        with a static fallback. Dep in the app (promote into `@crivelo/ui` only once there is a
        reusable animated primitive).
    </motion>
  </engineering_foundation>

  <styling_guide>
    <!-- Base text of the guide (adapted from molly for Tailwind v4 + this monorepo). To be promoted
         into app_spec.txt <styling_conventions> and CLAUDE.md; the `grep` rules become <compliance_rules>. -->
    - **Utility-first.** The design tokens ARE the utility vocabulary (mapped via `@theme`).
      Off-scale one-offs use arbitrary values (`min-h-[44px]`). Raw ramp steps without a semantic
      name may be referenced as arbitrary tokens: `bg-[var(--espresso-800)]`.
    - **No raw hex and no `var(--…)` inside `style`.** Style only with semantic utility classes.
    - **`cn()`** (clsx + tailwind-merge) for conditional/variant classes via className lookups
      (`Record<status, classes>`), never an inline `style` ternary.
    - **Primitives own their variants** (Button, Card, Input, …) via className maps / cva; the caller
      passes props/variants, not ad-hoc styles.
    - **Inline `style` is a last resort**, only for what cannot be a utility: computed dimensions
      (progress-bar fill width), SVG geometry, state-driven transforms, and `@keyframes`. (With
      `motion`, animation rarely needs manual `style`.)
    - **Tap targets ≥ 44px**; visible focus (cinnamon `--focus-ring`) on every interactive element.

    <compliance_rules_to_add>
      <!-- to add to app_spec.txt <compliance_rules>, enforced by the reviewer -->
      - grep `style={{` — no inline `style` in new code (except the "last resort" cases above).
      - grep `#[0-9a-fA-F]{3,8}` — no raw hex in app code (a design_tokens rule already exists; reinforce).
      - Rule: new commodity UI uses shadcn from `@crivelo/ui`; do not create a new hand-rolled primitive.
      - Rule: animation uses `motion` + `prefers-reduced-motion`; no manual `setInterval`/keyframes in new code.
    </compliance_rules_to_add>
  </styling_guide>

  <deprecation_strategy>
    <!-- Grandfather is the safety net during rollout; the goal is CONVERGENCE: both apps consuming
         the same shared primitives. Real and enforceable. -->
    - **Grandfather (interim):** files with inline style, `var(--)` refs in `style`, and the
      hand-rolled primitives keep working and **do not break** — no big-bang rewrite.
    - **Mark deprecated:** annotate the hand-rolled `@crivelo/ui` primitives with `@deprecated`
      (JSDoc) pointing at the shadcn equivalent, so editors flag them. Note in `CLAUDE.md`.
    - **Block in new code:** the `<compliance_rules_to_add>` above make the reviewer reject new
      inline-style/hex/hand-rolled-primitive usage.
    - **Reference implementation:** the landing page uses **no** deprecated pattern — the living
      proof of the new foundation before migrating the rest.
    - **Convergence (see `<shared_primitives_migration>`):** after the reference is validated,
      migrate `crema-arena` **and** `crivelo-web` onto the shared primitives so both apps are
      visually and structurally consistent — not two dialects of the same design system.
  </deprecation_strategy>

  <shared_primitives_migration>
    <!-- The consistency step requested: both apps on the same set of @crivelo/ui primitives. -->
    - **Goal:** `crema-arena` and `crivelo-web` consume the **same** shadcn primitives from
      `@crivelo/ui` (Button, Card, Input, Modal/Dialog, Toast/Sonner, Badge, …). A button is the
      same button in both apps.
    - **Migration scope = commodity UI**, not domain. Migrate:
        * `crema-arena`: swap the hand-rolled `@crivelo/ui` primitive call sites (Button, Card,
          Input, Modal, ConfirmationModal, Toast, Badge, EmptyState, LoadingSpinner, PageHeader)
          for the shadcn equivalents in the same package. Where the import path is already
          `@crivelo/ui`, the swap is re-implementing the primitive + adjusting props/variants.
        * `crivelo-web`: today it **imports zero** `@crivelo/ui` primitives and uses its own
          components under `shell/ · brand/ · coa/`. Adopt the shared primitives where the component
          is commodity (buttons, inputs, the NavSheet sheet/drawer, etc.); **keep** what is domain
          (CoaCalculator, BrewTimer, PourSchedule, TastePad, brand/*).
    - **Do NOT migrate:** domain logic/screens, app-specific layout, or content — only the primitive
      layer. Legitimate "last resort" inline style stays.
    - **Sequence:** per primitive, app by app, each with visual non-regression. Start with `Button`
      (already the foundation's validation primitive) and expand. This is a large phase — the
      breakdown must slice it per primitive/app, not one giant PR.
    - **Done when:** no app imports a deprecated hand-rolled primitive for commodity UI; a `grep`
      for deprecated imports comes back clean in both apps.
  </shared_primitives_migration>

  <surfaces_affected>
    - `packages/tokens/*` — modified (v3 preset → v4 `@theme` source; foundation.css)
    - `packages/ui/*` — modified (shadcn in `src/ui/`, `cn()`, deps radix/cva/clsx/tailwind-merge; `@deprecated` on the hand-rolled)
    - `apps/crema-arena/{app/globals.css, app/arena-tokens.css, postcss.config.mjs, tailwind.config.ts, package.json}` — modified (v4)
    - `apps/crivelo-web/{app/globals.css, app/crivelo-tokens.css, postcss.config.mjs, tailwind.config.ts, package.json}` — modified (v4)
    - both apps' commodity-UI call sites — modified (shared-primitives migration)
    - `apps/crema-arena/app/page.tsx` — modified (landing)
    - `apps/crema-arena/app/components/landing/*` — new (client component + subcomponents, with motion)
    - `apps/crema-arena/middleware.ts` — modified (remove the anonymous `/` bounce)
    - `app_spec.txt`, `CLAUDE.md` (root + `apps/crema-arena/`) — modified (styling guide + rules + build-vs-buy)
  </surfaces_affected>

  <design_tokens>
    <!-- Ramp steps the landing design uses that the app does not yet define. Add into `@theme`
         (values from the Claude Design bundle; same practice as marigold-300 in RMP-145). -->
    - `--espresso-800: #2C1D17;`
    - `--espresso-600: #5A3F33;`
    - `--crema-400:    #C7AB7C;`
    - `--cinnamon-300: #E1885A;`
    - `--marigold-700: #B07A1E;`
  </design_tokens>

  <sections>
    <!-- Vertical order of the landing. Full visual detail in the local handoff (design_handoff_local). -->
    <header>Sticky, translucent espresso with blur. Left: `monogram.svg` + "Crema Arena" wordmark (Crema serif italic, Arena display 800). Right: "Entrar" link → /login.</header>
    <hero>2-col grid (1-col below 960px). Left: mono eyebrow, headline, serif-italic subtitle, "Pedir acesso" CTA + "Acesso sob convite" note. Right: the "telona" — a live-display mock with an AO VIVO badge, timer, two competitors, mono score, and three `jdots` (judge selection). `motion` animates the score `0 × 0` → `2 × 1` in a loop and marks the winner; under reduced-motion it shows the final state. Floating "no ar 2026" seal + `rings.svg` background.</hero>
    <does>Light section (`--bg`) "Rode seu TNT sem o caos". Story-bracket: two feeder cards (Praticidade, Engajamento) converging through an SVG connector into a "Resultado" card with a cinnamon border, `trophy.svg` in the kicker and `stamp-seal.svg` in the corner. Below 960px: vertical stack.</does>
    <feat>Dark section (`--bg-inverse`) "Tudo que roda no dia do TNT". Deep-dive with 4 tabs (tablist): Chave / Console / Telona / Companion. Each panel: an intro + a "zig" of 3 alternating cards on a center spine, some with illustrative in-card mocks. Below 960px: tabs become a scrollable strip; the zig becomes a left-spine ladder.</feat>
    <footer>Espresso. Left: monogram + "Acesso sob convite. Já tem conta? Entrar" (→ /login). Right: "Crema Arena · 2026" in mono.</footer>
  </sections>

  <ui_copy>
    <!-- pt-BR verbatim from the hi-fi (these ARE the user-facing strings — the only pt-BR in this
         spec). Sentence case; TNT is the only ALL CAPS; `2 × 1` uses Unicode ×; at most one "!" on
         the whole page (it lives in the mailto body); no trailing period on buttons. -->
    Header/footer: wordmark "Crema"+"Arena" · link "Entrar" · footer "Acesso sob convite. Já tem conta? Entrar" · mono "Crema Arena · 2026".
    Hero: eyebrow "Ao vivo · TNT · café especial" · headline "A arena do café especial" · subtitle "Organize e transmita competições de latte art, barista e bar battle" · CTA "Pedir acesso" · note "Acesso sob convite". Telona: "Ao vivo", "Tempo"/"00:27", "TNT SP 2026 · Final · Free pour", "Lucas — Torra Comum · SP", "Marina — Tostado · SP", score `0 × 0`→`2 × 1`, verdict "Copo na mesa. Jurados escolhendo."→"2 × 1 para Lucas.", QR "Leve o público pelo celular"/"crema.app/e/tnt-sp", seal "no ar"/"2026".
    Does: eyebrow "Por que a Crema Arena" · title "Rode seu TNT sem o caos" (caos italic) · "Praticidade"/"Montou, já rodou"/"Inscreve, monta a chave e dá o start. Sem planilha, sem improviso na hora — você cuida do café, a plataforma cuida da logística." · "Engajamento"/"A plateia no jogo"/"Cronômetro na telona, votação dos jurados ao vivo e o público acompanhando pelo celular. Ninguém assiste de fora." · "Resultado"/"Um TNT que vira tradição"/"Organização redonda mais plateia ligada dá casa cheia — e aquele evento que todo mundo já quer repetir no mês que vem."
    Feat: eyebrow "Por dentro da plataforma" · title "Tudo que roda no dia do TNT" (TNT italic). Tabs: 01 "Chave"/"Inscrição e chaveamento" · 02 "Console"/"Você no comando" · 03 "Telona"/"Tela ao vivo" · 04 "Companion"/"Plateia no celular".
      Chave (intro "Do cadastro ao chaveamento, em minutos."): "Inscrição"/"Inscreva em segundos"/"Adiciona competidor, casa de café e cidade — ou importa a lista inteira de uma vez." · "Chaveamento"/"Chave automática, num clique"/"32 entram, 1 sai com o avental." · "Seeds & byes"/"Byes e seeds na régua"/"Número ímpar? A plataforma distribui os byes e respeita os cabeças-de-chave sem você fazer conta."
      Console (intro "Sem app de competidor ou jurado — você conduz tudo."): "Você no comando"/"Tudo pelo seu console"/"Inscreve, monta a chave e conduz cada duelo de um lugar só. Competidor e jurado não precisam de app — a plataforma é sua." · "Captura"/"Registra o voto ou o walkover"/"Você marca a seleção do júri a cada duelo. Faltou um competidor? Registra o walkover e escolhe quem avança." · "Fotos"/"Os copos direto na telona"/"Fotografa a mesa com os copos e a imagem vai pra telona e pro companion — a plateia vê o latte art de perto."
      Telona (intro "O duelo na tela grande do salão."): "Destaque"/"Duelo em primeiro plano"/"Competidores, cronômetro e a rodada atual — grandes o suficiente pro fundo do bar." · "Ao vivo"/"Votação em tempo real"/"Os votos aparecem na hora em que o júri decide." · "QR fixo"/"Plateia a um toque"/"Um QR code sempre visível leva o público pro companion na hora."
      Companion (intro "O público acompanha do próprio bolso."): "No celular"/"A arena na palma da mão"/"Chave, duelo atual e quem já caiu — tudo num lugar só." · "Sem fricção"/"Sem instalar nada"/"Abre pelo navegador via QR. Entra em segundos, sem app, sem cadastro." · "Sincronizado"/"Todo mundo junto"/"A galera vê o mesmo que a telona, em tempo real, sem recarregar a página."
    CTA mailto (build with encodeURIComponent): to `lucas.rmagalhaes@gmail.com`, subject "Acesso à Crema Arena", body "Olá! Gostaria de pedir acesso à Crema Arena.\n\nNome:\nCasa de café:\nCidade:\n".
  </ui_copy>

  <acceptance_criteria>
    <!-- Foundation -->
    - [ ] Tailwind v4 active: `@crivelo/tokens` exposes tokens via `@theme`; `crema-arena` and `crivelo-web` build and render identically to before the migration (no visual regression)
    - [ ] shadcn installed in `@crivelo/ui` with `components.json` pointing `utils` → `cn()`; at least `Button` validated inheriting the warm theme via the `@theme` alias layer
    - [ ] `cn()` exists (clsx + tailwind-merge with the custom font-size/shadow groups) and is used by the primitives
    - [ ] `motion` installed and used on the landing; animation disables under `prefers-reduced-motion`
    - [ ] Styling guide written into `app_spec.txt` (`<styling_conventions>` + `<compliance_rules>` with `grep`) and `CLAUDE.md`; hand-rolled primitives marked `@deprecated`
    <!-- Consistency migration -->
    - [ ] After the landing reference is validated, both apps' commodity UI consumes the shared `@crivelo/ui` primitives; a `grep` for deprecated hand-rolled imports is clean in `crema-arena` and `crivelo-web`
    - [ ] Domain components (bracket/duel/wildcard/leaderboard; CoaCalculator/BrewTimer/PourSchedule/TastePad/brand) are NOT rewritten
    <!-- Landing -->
    - [ ] Anonymous at `/` sees the landing (no `/login` redirect); authenticated at `/` → `/dashboard`; anonymous at `/dashboard/*` → `/login`
    - [ ] The three sections + footer render faithful to the local handoff; the 4 tabs switch with correct `aria-selected`/`role=tab`/`role=tabpanel`; the hero duel animates `0 × 0`→`2 × 1`
    - [ ] "Pedir acesso" opens a prefilled email to `lucas.rmagalhaes@gmail.com`; "Entrar" (header and footer) → `/login`
    - [ ] The landing uses **zero** inline-style/hex/`var()` in `style` and **zero** deprecated primitive — only utilities/shadcn/motion/cn; the 5 new tokens live in `@theme`
    - [ ] Text is pt-BR sentence case, `2 × 1` with Unicode ×, at most one "!" on the page; legible from 375px to desktop across the 960/560/380px breakpoints
  </acceptance_criteria>

  <risks>
    - **Large, risky scope in a single spec** (user's decision). The v4 migration + shadcn-in-a-shared-
      package is foundational and touches two apps + two packages; the breakdown MUST sequence
      **foundation before the landing** and validate with one primitive (`Button`) before migrating
      the rest. The shared-primitives migration is itself a large multi-PR phase.
    - **shadcn in a shared package on v4** is non-trivial wiring (components.json, registry, the
      `@theme` layer). There are `<!-- TODO -->`s in `<engineering_foundation>` to resolve up front.
    - **Visual regression** in the v4 migration: existing screens don't change usage but change
      pipeline (preset → @theme). Needs visual non-regression checks in both apps.
    - **Consistency migration risk:** swapping primitives can shift spacing/variants subtly across
      many screens. Slice per primitive/app, screenshot-diff each slice; do not bundle with the
      foundation PRs.
    - `middleware.ts`: surgical change (only the anonymous `/` branch), covered by the criteria.
    - The landing mocks are illustrative/static — do not wire them to the polling endpoints by mistake.
    - Porting static HTML+CSS to idiomatic React with `motion`, no `dangerouslySetInnerHTML`;
      `aria-hidden` on the decorative mocks (the design already marks them).
  </risks>

  <breakdown_sketch>
    <!-- Suggested sequence: foundation first, landing as the first consumer, consistency migration last. -->
    - Tailwind v4: `@crivelo/tokens` (preset → @theme) + migrate `crema-arena` and `crivelo-web` (postcss/globals/tokens), check non-regression
    - `cn()` in `@crivelo/ui` + deps (clsx, tailwind-merge, cva, radix)
    - shadcn wiring in `@crivelo/ui` (components.json + @theme layer) + validate with `Button`
    - `motion` installed
    - Styling guide → `app_spec.txt` (`<styling_conventions>` + `<compliance_rules>`) + `CLAUDE.md`; `@deprecated` on the hand-rolled primitives
    - Ramp tokens (5) into `@theme`
    - Middleware: remove the anonymous `/` bounce
    - Landing: `app/page.tsx` + `app/components/landing/*` (client, motion), mailto CTA, "Entrar" links
    - Responsiveness (375px → desktop) + a copy-compliance pass against `app_spec.txt`
    - Consistency migration: move both apps' commodity UI onto the shared primitives, sliced per primitive/app
  </breakdown_sketch>

</feature_specification>
