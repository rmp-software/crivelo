---
slug: coa-v60-calculator
status: planned
created: 2026-06-10
linear_project_id: 2ac8ab29-150b-4787-b0dc-c75613daa20d
linear_parent_issue: RMP-185
feature_branch: feature/coa-v60-calculator
design_handoff: docs/design/coa-v60/
design_link: https://api.anthropic.com/v1/design/h/0MqsCZhlmJ-1R1PEgMUW2g?open_file=Coa+Responsive.html
---

<feature_specification>

  <feature_name>Coa — V60 / 4:6 calculator + the Crivelo hub</feature_name>

  <overview>
    Stand up `apps/crivelo-web` — the Crivelo website: one Next.js app that hosts the
    family of small, client-side coffee tools under one roof, one nav, one accent (the
    model used by cerejacafe.com.br). Its first tool is also its homepage: Coa, a V60 / 4:6
    pour-over recipe calculator with a guided brew timer.

    This is the first sibling app built on the foundation from `crivelo-monorepo-structure`
    and `crivelo-design-pull-in`. It consumes the shared design system (`@crivelo/tokens` +
    `@crivelo/ui`) and brings its own teal accent app-local, exactly as `apps/crema-arena`
    brings cinnamon. The visual design is already locked — designed and iterated in Claude
    Design and exported to `docs/design/coa-v60/` (live source: the `design_link` in the
    frontmatter). Read `docs/design/coa-v60/chats/chat1.md` (the full design conversation)
    and the prototype source under `docs/design/coa-v60/project/` before implementing. This spec translates that prototype
    into production architecture; it does not redesign it.

    Language convention differs from Crema Arena (which is pt-BR only): crivelo-web is
    bilingual, English-first (`/` = English) with Portuguese at `/pt`. All code/identifiers
    in English; all UI copy externalized to message catalogs.
  </overview>

  <problem>
    Crivelo needs a first shipped tool. The 4:6 calculator is the lightest candidate —
    pure client-side math, no backend, no auth, no data — so it delivers a genuinely useful
    tool and proves the hub pattern end-to-end (shell, theming, i18n, deploy) before heavier
    tools (Mesa/cupping) arrive. Building it as the hub homepage gives Crivelo a real
    website on day one rather than a marketing page with a tool buried behind a CTA.

    This spec also refines the decision record in `apps/crema-arena/docs/crivelo-umbrella.md`,
    which said "one brand, independent apps" with a per-product accent for every tool. In
    practice the family splits into two buckets: the Crivelo hub (one app, one accent, hosts
    the light client-side tools) and standalone heavy apps (Crema Arena, later Mesa — own
    backend/auth/data). The hub carries a single accent (teal), resolving the umbrella doc's
    open question "whether the Crivelo portal has its own accent or wears the neutral
    foundation." (The bundled design-system guide still says "the house is neutral, no
    accent" — that predates this decision; the hub's teal accent is the intended override.)
  </problem>

  <scope>
    <in_scope>
      - New app `apps/crivelo-web` (Next.js App Router) consuming `@crivelo/tokens` + `@crivelo/ui`, wired like `apps/crema-arena`.
      - Teal accent for the whole site (not Coa-specific), app-local in `crivelo-tokens.css`, light + dark. Future tools inherit it.
      - The 4:6 engine (framework-agnostic typed math, ported from the prototype) + unit tests.
      - Coa calculator homepage (idle): 2D taste pad, dose/ratio steppers, live water total, pour schedule, "Begin brew" CTA, external method link.
      - Brew timer (running): live dial, pour guidance, countdown, schedule progress, pause/resume/restart, real-time + resume-across-refresh via localStorage.
      - Crivelo shell: header, left-sliding nav sheet (family + language + appearance), footer.
      - Theming: Light / Dark / System, persisted.
      - i18n via `next-intl`, path-prefixed locales (`/` = en default, `/pt`), all copy externalized.
      - Responsive: mobile single-column (<700px), tablet/desktop two-column (≥700px).
      - New Vercel project, deployed to its generated URL.
      - Update `apps/crema-arena/docs/crivelo-umbrella.md` to record the hub refinement.
    </in_scope>
    <out_of_scope>
      - Production domain cutover (`crivelo.coffee` root + `crema-arena.crivelo.coffee`). v1 ships to the Vercel URL; cross-app links point at the current Crema Arena URL; method link is an external placeholder. Domain/DNS move is its own infra task.
      - The "how 4:6 works" explainer page — external link for now; becomes a Diário (blog) post later.
      - A Crema Arena landing page inside the hub (linked external for now).
      - Roast → water-temperature guidance in the UI. The engine exposes a TEMP table, but the locked design surfaces no roast selector, so v1 omits it.
      - Léxico / Diário tools (nav shows them as "soon").
      - Any backend, accounts, or saved recipes. The hub stays client-only; the first tool that needs persistence triggers a re-evaluation.
    </out_of_scope>
  </scope>

  <surfaces_affected>
    - `apps/crivelo-web/` — new app (Next.js App Router; scaffold mirrors `apps/crema-arena` wiring)
    - `apps/crivelo-web/app/[locale]/layout.tsx` — new (shell + theme + locale providers)
    - `apps/crivelo-web/app/[locale]/page.tsx` — new (Coa homepage: idle calculator ↔ brew timer)
    - `apps/crivelo-web/app/crivelo-tokens.css` — new (teal Tier-2 accent, light + dark)
    - `apps/crivelo-web/lib/four-six.ts` — new (the 4:6 engine + types)
    - `apps/crivelo-web/components/{brand,shell,coa}/*` — new (brand marks, shell, calculator, timer)
    - `apps/crivelo-web/messages/{en,pt}.json` — new (i18n catalogs)
    - `apps/crivelo-web/{i18n.ts,middleware.ts,next.config.js,tailwind.config.ts,postcss.config.mjs,tsconfig.json,vercel.json,package.json}` — new (monorepo wiring)
    - `apps/crema-arena/docs/crivelo-umbrella.md` — modified (record the hub refinement)
  </surfaces_affected>

  <ui_copy>
    English-first; Portuguese in `messages/pt.json` follows Crivelo's pt-BR voice (sentence
    case, "você", warm/precise; see the design-system guide in
    `docs/design/coa-v60/project/_ds/`). Proper nouns are never translated: Coa, Crivelo,
    Crema Arena, Léxico, Diário.

    Key English strings (from the locked design):
    - Intro: caption "Café coado · the 4:6 method"; serif line "Set your taste — Coa works out the pours."
    - Taste pad: edge labels "Stronger" / "Lighter" / "Sweet" / "Bright"; readout "{tasteLabel} · {n} pours" (Sweet, round / Sweet-leaning / Balanced / Bright-leaning / Bright, juicy).
    - Inputs: "Coffee", "Ratio", "Water".
    - Schedule: "Pour schedule", "Pour 1…5", final row "Remove dripper · drawdown".
    - CTA: "Begin brew · {totalTime}"; link "How the 4:6 method works" (external ↗).
    - Brew timer: "Recipe" (back), "Brewing"/"Paused"/"Done", "Pour N of M", "+{g} g this pour", "Pour now → {g} g", "Let it draw down", "Next pour in {m:ss}", "Remove the dripper", "Brew again", "Back to recipe", "Pause"/"Resume".
    - Shell: "Tools for people who live coffee."; nav section "The house"; "you are here"; tags "the 4:6 calculator" / "open in new tab" / "soon"; "Language", "Appearance" (Light/Dark/System); footer "The family", "© 2026 Crivelo · Para quem vive café."

    New components — see `<breakdown_sketch>`. Layout: mobile single column (intro → pad →
    inputs → schedule → CTA → footer); tablet/desktop two columns (left: intro + pad +
    inputs; right: sticky "Your recipe" panel with big water total + schedule + CTA). The
    brew timer replaces the idle view in place and reflows to two columns on wide screens.
  </ui_copy>

  <acceptance_criteria>
    - [ ] Given the homepage at `/`, when it loads, then the Coa 4:6 calculator renders as the homepage (idle state) in English.
    - [ ] Given the default inputs (20 g, 1:15, balanced, 3 pours), when the schedule computes, then it equals 60/120/180/240/300 g at 0:00/0:45/1:30/2:15/3:00 and removes the dripper at 3:30.
    - [ ] Given the taste pad, when the puck is dragged horizontally, then `acidity` varies continuously and the first/second pour split moves within 30–70% of the 40% (smaller first = sweeter, larger first = brighter).
    - [ ] Given the taste pad, when the puck is dragged vertically, then strength rounds to 1–4 pours (no vertical snap of the puck) and the pour count + `removeAt` update accordingly (more pours = stronger).
    - [ ] Given the Coffee/Ratio steppers, when adjusted, then dose clamps 8–60 g, ratio clamps 1:12–1:18, and the water total = dose × ratio updates live.
    - [ ] Given "Begin brew", when tapped, then the view switches to the brew timer and the dial fills in real time against elapsed/removeAt.
    - [ ] Given an in-progress brew, when the page is refreshed, then the timer resumes from the correct wall-clock elapsed time; when exited, the saved session clears.
    - [ ] Given the brew timer, when pour windows pass, then each schedule row checks off, "Pour now / Let it draw down" guidance toggles, and reaching removeAt shows "Remove the dripper".
    - [ ] Given the brew timer, when Pause/Resume/Restart are used, then elapsed time freezes/continues/resets correctly.
    - [ ] Given the nav sheet, when opened, then it slides from the left, leads with the Crivelo sieve lockup, lists Coa (you are here) + Crema Arena (external ↗) + Léxico/Diário (soon), and exposes Language (EN/PT) and Appearance (Light/Dark/System).
    - [ ] Given the appearance control, when Light/Dark/System is chosen, then the theme applies (System follows the OS and updates live) and the choice persists across reloads.
    - [ ] Given `/pt`, when it loads, then all UI copy renders in Portuguese with proper nouns untranslated and pt-BR number formatting; the language switcher round-trips while preserving the current path.
    - [ ] Given no hardcoded UI strings remain (grep clean) — all copy resolves from `messages/{en,pt}.json`.
    - [ ] Given the viewport, when it crosses 700px and 1024px, then the calculator and brew timer switch between single- and two-column layouts.
    - [ ] Given two brand marks, then the Crivelo sieve monogram represents the house (neutral) and the Coa V60 cone represents the tool (teal), used in the right places (house in nav/footer, Coa in header).
    - [ ] Given the deployed Vercel URL, then the calculator works in both locales and both themes with no console errors, including on a phone.
    - [ ] Given `crivelo-umbrella.md`, when updated, then it records the two-bucket hub model and no longer contradicts a single hub accent.
  </acceptance_criteria>

  <risks>
    - No backend by design — keep it that way for v1; the first tool wanting persistence triggers a re-evaluation (graduate to its own app, or add a backend). Don't sneak in auth/DB.
    - The method math is the load-bearing correctness surface (a coffee person will notice if it's wrong) — hence engine-first with tests validated against the canonical 20 g / 1:15 / 3:30 schedule.
    - The handoff prototype is throwaway structure (inline-styled, single-file, Babel-in-browser). Recreate the visuals in idiomatic Next/Tailwind; don't port the prototype's architecture.
    - The bundled design-system guide says "house is neutral, no accent" — superseded for the hub. An implementer must not "correct" the teal back to neutral citing that guide.
    - The teal accent belongs to the whole Crivelo site, not the Coa module — it is the site's single accent and every future tool inherits it. Name the tokens at site level (`--brand`, `--accent-*`), not `--coa-*`. `--brand` in `@crivelo/tokens` is ink (espresso); the hub overrides it to teal app-local so primary actions render teal site-wide (same mechanism crema-arena uses for cinnamon).
    - Cross-app links are temporary until the domain cutover — centralize them so the later DNS task is a one-file change.
    - Monorepo gotchas from CLAUDE.md apply: Node 24, pnpm from root, tailwind `content` must include `../../packages/ui/src/**`, foundation CSS imported before app `@layer base`, never run `next dev` + `next build` together.
  </risks>

  <breakdown_sketch>
    - Scaffold `apps/crivelo-web` (Next.js App Router; mirror crema-arena wiring: transpilePackages, tailwind preset + content globs, postcss-import, tsconfig, globals.css importing the foundation).
    - Site accent tokens (`crivelo-tokens.css`) — light + dark sets named at site level (`--brand` teal, `--accent-ink`, `--accent-soft`/`--accent-halo`/`--accent-dot`, `--pour-strength-rgb`; the prototype's `--coa-*` vars map onto these), imported after the foundation. The accent is the website's, inherited by every tool.
    - The 4:6 engine + unit tests (`lib/four-six.ts`) — port `coa-engine.js` to typed pure TS; TDD against the canonical schedule, the 30/70 acidity bounds, and pour-count 1–4 → removeAt.
    - Brand marks (`components/brand/`) — Monogram (sieve), CoaMark (V60 cone), CriveloLockup, CoaLockup, SieveGrid (puck + fill modes).
    - Crivelo shell (`components/shell/`) — Header, left NavSheet (family + language + appearance), Footer; cross-app links centralized.
    - Coa calculator idle (`components/coa/`) — TastePad, RecipeInputs, PourSchedule, CTA, responsive idle layout via a useRecipe hook over the engine.
    - Brew timer (`components/coa/BrewTimer`) — dial, guidance, countdown, schedule progress, controls, real-time + localStorage resume.
    - i18n (`next-intl`) — locales/middleware/`[locale]` layout, externalize all copy to `messages/en.json`, author `messages/pt.json` in pt-BR voice, language switcher routes preserving path.
    - Update `crivelo-umbrella.md` decision record (two-bucket hub model; single teal accent; resolves the portal-accent open question).
    - Deploy — new Vercel project, Root Directory `apps/crivelo-web`, `ENABLE_EXPERIMENTAL_COREPACK=1`, no DB/env; verify both locales + themes + phone.
  </breakdown_sketch>

</feature_specification>
