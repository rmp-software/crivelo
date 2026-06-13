---
slug: coa-brew-timer-redesign
status: planned
created: 2026-06-13
linear_project_id: 2ac8ab29-150b-4787-b0dc-c75613daa20d
linear_parent_issue: RMP-220
feature_branch: feature/coa-brew-timer-redesign
design_link: https://api.anthropic.com/v1/design/h/m0LSFAGILjD-BxjIR0EG2A?open_file=Coa+Homepage.html
design_handoff_local: apps/crivelo-web/.design/   # gitignored — NOT committed; pull from design_link
---

<feature_specification>

  <feature_name>Coa — brew-timer redesign (the running brew flow)</feature_name>

  <overview>
    Replace the Coa running-brew screen — the view behind "Begin brew" in
    `apps/crivelo-web` — with the redesigned flow the user locked in a follow-up Claude
    Design session. The idle 4:6 calculator (shipped in `coa-v60-calculator`) is unchanged;
    this spec covers only the post-calculator brew experience rendered by
    `components/coa/BrewTimer.tsx`.

    The visual design is already locked. Pull the handoff bundle from the `design_link` in
    the frontmatter (gitignored, lives at `apps/crivelo-web/.design/`); the source of truth is
    `project/coa-timer.jsx` (the redesigned prototype) and `chats/chat2.md` (the "Brewing
    Stage Redesign" transcript — the design conversation and where the user landed). This
    spec translates that prototype into idiomatic Next/Tailwind; it does not redesign it. A
    researched implementation plan also exists at
    `/Users/lucas/.claude/plans/partitioned-imagining-moon.md`.

    crivelo-web is bilingual, English-first (`/` = en, `/pt` = pt-BR). All code/identifiers in
    English; all UI copy externalized to `messages/{en,pt}.json`.
  </overview>

  <problem>
    The current brew timer was implemented (RMP-192) before this screen was designed, so its
    UX is weak. The user's complaints from `chat2.md`:

    1. The clock is too shy — the ring center shows cumulative grams, not elapsed time. The
       ring should read as a real timer with the clock in the forefront.
    2. The schedule is a flat, static list — every step at the same hierarchy, all shown at
       once, not dynamic.
    3. Each pour secretly has two actions ("pour" then "let it draw down") shown only as
       text; they should be explicit, separate steps.
    4. Too much information, and the one important action isn't highlighted.
    5. On mobile the highlighted step gets pushed off-screen by the stack of completed steps.
    6. The user is "dropped in" from the calculator with no time to prepare before timing
       starts.

    The redesign fixes all six and is the screen the user actually wants shipped.
  </problem>

  <scope>
    <in_scope>
      - Rewrite `components/coa/BrewTimer.tsx` to match the locked prototype `coa-timer.jsx`.
      - Hero `mm:ss` elapsed clock in the ring center (Geist Mono), `of {totalTime}` beneath;
        the ring still fills with overall progress; pour points render as filled dots on the
        ring (passed dots fill with the accent / success colour).
      - A 5-second "Get ready" pre-roll before timing starts: the ring depletes full→empty over
        5s and lands empty exactly as the clock starts; a big `5→1` count + "get set"; a
        "Start now" button skips it. New session status `countdown`. "Brew again" re-runs it.
      - Split every pour into two explicit phases via a `buildPhases(recipe)` engine helper: a
        `pour` phase (nominal `POUR_SECS = 9`s window) then a `draw` phase (to the next pour, or
        `removeAt` for the last). Drives both the live readout and the recipe list.
      - Dynamic, tiered recipe list ("mode A"): completed phases collapse into one expandable
        "N steps done" summary; the current phase is a highlighted card with its own progress
        bar + time window (teal for pour, neutral for draw-down); next previewed with a "Next"
        badge; a "Remove the dripper" finale row at `removeTime`.
      - Copy: "Pour {g} g in {s} s" with the values emphasized; the cumulative target shown as
        `→ {target} g`; one bold "what now" action line under the ring + a mono detail line.
      - Real-time + resume-across-refresh (wall-clock, localStorage `coa-brew`), Pause / Resume
        / Restart, "Brew again" / "Back to recipe", carried over from today's component.
      - `buildPhases` + unit tests in `lib/four-six.ts`.
      - Promote `--accent-halo` to a `bg-accent-halo` utility in `app/crivelo-theme.css`.
      - Add `droplet` + `chevR` icon paths to `components/coa/icons.tsx`.
      - Extend the `BrewTimer` i18n namespace in `messages/{en,pt}.json`; prune obsolete keys.
      - Both themes (light/dark/system), all three breakpoints, `prefers-reduced-motion`.
    </in_scope>
    <out_of_scope>
      - The idle calculator (`CoaCalculator`, `TastePad`, `RecipeInputs`, `PourSchedule`) — unchanged.
      - The shell (Header / NavSheet / Footer), routing, theming mechanism, and locale wiring.
      - The 4:6 math itself (`computeRecipe`) — only the new `buildPhases` derivation is added.
      - A pour-moment chime / haptic cue (raised in the design chat; explicitly deferred).
      - New routes or screens — the pre-roll is a state inside `BrewTimer`, not a new page.
    </out_of_scope>
  </scope>

  <surfaces_affected>
    - `apps/crivelo-web/components/coa/BrewTimer.tsx` — modified (full rewrite to the new design)
    - `apps/crivelo-web/lib/four-six.ts` — modified (add `POUR_SECS`, `TimerPhase`, `buildPhases`)
    - `apps/crivelo-web/lib/four-six.test.ts` — modified (phase-expansion tests)
    - `apps/crivelo-web/app/crivelo-theme.css` — modified (promote `--accent-halo` → `bg-accent-halo`)
    - `apps/crivelo-web/components/coa/icons.tsx` — modified (add `droplet`, `chevR`)
    - `apps/crivelo-web/messages/en.json` — modified (`BrewTimer` namespace)
    - `apps/crivelo-web/messages/pt.json` — modified (`BrewTimer` namespace, pt-BR voice)
  </surfaces_affected>

  <ui_copy>
    English-first; pt-BR follows Crivelo's house voice (sentence case, "você", warm/precise,
    no exclamation, `mm:ss` for time, algarismos for data). Proper nouns untranslated. All
    strings externalized — no hardcoded UI text in the component.

    Key English strings (from the locked design; pt-BR equivalents authored in `pt.json`):
    - Status pill / ring word: "Get ready" · "Brewing" · "Paused" · "Done" / "Complete".
    - Ring subtext: "get set" (pre-roll) · "of {totalTime}" (running).
    - Pre-roll detail: "Brew starts in {n} s"; button "Start now".
    - Pour readout + card: "Pour {g} g in {s} s" (values emphasized); target "→ {target} g".
    - Draw-down readout: "Draw down" / "Let it finish"; detail "Next pour in {m:ss}" /
      "Remove in {m:ss}".
    - Current-card headers: "Now · pour {n} of {total}" / "Now · draw down"; card titles
      "Pour {g} g in {s} s" · "Let it draw down" · "Final draw down".
    - List header: "Recipe"; counter "Step {n} / {total}" / "finished".
    - Collapsed summary: "{n} step done" / "{n} steps done"; expanded toggle "Hide completed".
    - Compact rows: "Pour {n}"; "Let it draw down" / "Final draw down"; "Next" badge.
    - Finale row: "Remove the dripper" at `{removeTime}`.
    - Controls / done: "Pause" · "Resume" · "Restart brew" (aria) · "Brew again" ·
      "Back to recipe"; done detail "Total {totalTime}".
    - Top bar: "Recipe" (back).

    Layout: single column on mobile (ring → action → controls → list); two columns on
    tablet/desktop (ring + action + controls left, recipe list right) — the same `bp`/`max`
    props the component already accepts. Reference renders:
    `.design/.../screenshots/{countdown,brew-pour,brew-draw-light,brew-done}.png`,
    `.design/.../screens/timer-wide.png`.
  </ui_copy>

  <acceptance_criteria>
    - [ ] Given "Begin brew" is tapped (or a fresh brew loads), when the timer mounts, then it starts in the "Get ready" pre-roll: status reads "Get ready", the ring shows a big 5→1 count that depletes the ring full→empty, and "Brew starts in {n} s" shows under it.
    - [ ] Given the pre-roll, when "Start now" is tapped, then the clock starts immediately at 00:00; and when the 5s elapse untouched, then it auto-transitions to running at 00:00 with the ring empty (no snap).
    - [ ] Given a running brew, when it ticks, then the ring center shows elapsed `mm:ss` (not grams) with "of {totalTime}" beneath, and the ring fills proportionally to elapsed/removeAt with pour-point dots filling as they pass.
    - [ ] Given `buildPhases(recipe)`, then it returns `2 × recipe.steps.length` phases alternating pour/draw, contiguous (each phase `start` = prior `end`), the pour window = `min(start + POUR_SECS, drawEnd)`, and the final draw phase ends exactly at `recipe.removeAt`.
    - [ ] Given an active pour phase, when it is current, then the action line reads "Pour now" with "{g} g in {s} s", and the recipe list shows a teal highlighted card "Pour {g} g in {s} s · → {target} g" with a progress bar tracking the pour window.
    - [ ] Given an active draw-down phase, when it is current, then the action reads "Draw down" (or "Let it finish" on the last) with "Next pour in {m:ss}" (or "Remove in {m:ss}"), and the current card is neutral ("Let it draw down" / "Final draw down").
    - [ ] Given completed phases exist, when brewing, then they collapse into a single "{n} steps done" summary row that expands on tap (to the rows + "Hide completed") and collapses again — so the current card stays near the top on mobile (does not push off-screen).
    - [ ] Given the recipe list, then the next phase shows a "Next" badge, future phases are dimmed, and a "Remove the dripper" finale row shows at `{removeTime}`.
    - [ ] Given an in-progress brew, when the page is refreshed, then it resumes from the correct wall-clock elapsed time and phase; when "Back to recipe" is used, then the saved session clears and the idle calculator returns.
    - [ ] Given Pause / Resume / Restart, then elapsed freezes / continues / resets (Restart returns to the pre-roll); and reaching `removeAt` flips to the done state ("Complete", "Total {totalTime}", "Brew again" + "Back to recipe").
    - [ ] Given "Brew again" on the done state, when tapped, then a new pre-roll countdown runs.
    - [ ] Given `/pt`, when the brew flow renders, then all copy is pt-BR (house voice, proper nouns untranslated); and a grep finds no hardcoded UI strings in `BrewTimer.tsx` — all resolve from `messages/{en,pt}.json`.
    - [ ] Given light, dark, and system themes at mobile / tablet / desktop widths, then the screen renders correctly with no console errors (verified live, including on a phone), matching the reference screenshots.
    - [ ] Given `prefers-reduced-motion: reduce`, then the pulse and progress animations are disabled (no infinite animation), while state still updates.
    - [ ] Given the styling rules in CLAUDE.md, then no design-token `var(--…)` appears in a `className` (the pour card uses `bg-accent-halo`); inline `style` is limited to runtime bridges (ring geometry, `strokeDashoffset`, progress `width %`, `--mw`).
  </acceptance_criteria>

  <risks>
    - The prototype is throwaway structure (inline-styled, `window.Coa` globals, Babel-in-browser). Recreate the visuals in idiomatic Next/Tailwind — do not port the inline-`var()` style architecture. Honor the "no design-token var() in className" rule; runtime bridges stay inline.
    - `POUR_SECS = 9` is invented by the design (flagged as tunable in `chat2.md`). It is a presentation-only window for the pour step; it must not alter the real schedule math (`computeRecipe`, `removeAt`, the 0:45 pour spacing).
    - Wall-clock resume + the new `countdown` status interact: a refresh mid-pre-roll must resume the countdown from `cdStart`, and a refresh mid-brew from `startTs`/`base`. Keep the localStorage session shape backward-tolerant (a stale session without `cdStart`/new fields must not crash — `loadSession` already try/catches).
    - The `coaBrewPulse` keyframe already exists; the prototype names it `coaPulse`. Reuse the existing keyframe name; don't add a duplicate. Guard every animation for `prefers-reduced-motion`.
    - Time-based UI is hard to assert in unit tests — keep `buildPhases` pure and table-test it; verify the live timing behavior via the dev server + Playwright, not unit tests of wall-clock.
  </risks>

  <breakdown_sketch>
    - Engine: add `POUR_SECS`, `TimerPhase`, `buildPhases(recipe)` to `lib/four-six.ts` + tests (TDD: phase count, contiguity, pour-window clamp, final end = removeAt).
    - Tokens + icons: promote `--accent-halo` → `bg-accent-halo` in `crivelo-theme.css`; add `droplet` + `chevR` to `icons.tsx`.
    - i18n: extend the `BrewTimer` namespace in `messages/en.json`, author pt-BR in `pt.json`, prune obsolete keys.
    - Component: rewrite `BrewTimer.tsx` — pre-roll/running/paused/done state machine, hero clock ring with dots, action+detail line, tiered recipe list (summary / CurrentCard / CompactRow / DripRow), controls via the app-local `Button`, two-column wide layout, reduced-motion guards.
    - Verify: tsc + lint + unit tests; Playwright across both themes + 3 breakpoints + phone; compare to reference screenshots; PR + `/code-review`.
  </breakdown_sketch>

</feature_specification>
