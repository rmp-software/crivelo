# CLAUDE.md — Crivelo monorepo

Turborepo + **pnpm** monorepo (`rmp-software/crivelo`). Apps in `apps/*`, shared
packages in `packages/*`: `@crivelo/tokens` (design foundation), `@crivelo/ui`
(primitives), `@crivelo/tsconfig`, `@crivelo/eslint-config`. The flagship app is
`apps/crema-arena` (its own CLAUDE.md has app-specific rules).

## Language (hard rule)
**Portuguese (pt-BR) is ONLY for user-facing UI strings. EVERYTHING else is English** —
across the whole monorepo, every app and package. That means English for: code,
identifiers, comments, commit messages, PR descriptions, **specs/docs** (`docs/specs/*`,
READMEs), config, and test names. The only pt-BR allowed is the literal text a user reads
in the rendered UI (and its source strings). A spec written in Portuguese is a defect —
rewrite it. (App-specific UI copy rules live in `apps/crema-arena/CLAUDE.md` / `app_spec.txt`.)

## Subagents (hard rule)
**Never dispatch the generic `general-purpose` subagent** — every dispatch in this repo must
use a specialized agent, even when a skill (e.g. `rmp:work-iteration`) tells you to use
`general-purpose`. A `PreToolUse` hook (`.claude/hooks/enforce-specialized-agent.sh`) enforces
this and will deny the call. Substitute by role: **implementation** → `principal-engineer`
(new code) or `code-refactor-master` (pure restructuring); **correctness review** →
`rmp:code-reviewer`; **UI/copy/spec compliance** → `rmp:spec-compliance-reviewer`;
**architecture/system-integration** → `code-architecture-reviewer`.

## Environment (bites every session)
- Shell defaults to **Node 20**; everything needs **24**. Prefix commands:
  `export NVM_DIR="$HOME/.nvm"; \. "$NVM_DIR/nvm.sh"; nvm use 24` (pnpm 11 needs ≥22.13).
- Run pnpm from the repo **root**. `pnpm --filter crema-arena <cmd>`,
  `pnpm turbo run build --filter crema-arena`.
- pnpm 11 blocks postinstall scripts → Prisma is allow-listed via `allowBuilds` in
  `pnpm-workspace.yaml`.
- **Never run `next dev` and `next build` at once** — they share `.next` and corrupt
  it (`PageNotFoundError`). `turbo.json` uses `ui: "stream"` for clean piped logs.

## Design system tiers
- `@crivelo/tokens` = the **neutral house** (Tier 1): `styles/foundation.css` +
  `tailwind-preset.js` + `next/font` module. No product accent.
- Each app brings its accent + extra palette app-local. Crema Arena:
  `apps/crema-arena/app/arena-tokens.css` (cinnamon Tier-2 + gold/marigold/live).
- Tailwind v4: no `tailwind.config.ts`. The CSS entry is `@import "tailwindcss"`
  with `@tailwindcss/postcss`; the app source-scan adds the shared primitives via
  `@source "../../packages/ui/src/**"` in that entry (or their classes get purged).
  Foundation + token CSS are pulled via `@import` in the entry, and app `@layer base`
  overrides must come AFTER the foundation import to win.

## Styling / build-vs-buy
The monorepo styles with **Tailwind v4 `@theme`** (tokens are the utility vocabulary) +
**shadcn primitives in `@crivelo/ui`** + **`cn()`** (clsx + tailwind-merge) + **`motion`**
for animation. The principle is **buy commodity UI (modal/drawer/toast/dialog/focus/
animation), build the domain.** New code follows the styling guide — utility-first, no raw
hex / no `var(--…)` in `style`, shadcn over hand-rolled (the old `@crivelo/ui` primitives are
`@deprecated`, now at `@crivelo/ui/deprecated/*`), motion + `prefers-reduced-motion`. The guide
is written and enforced per app via `app_spec.txt` (`<styling_conventions>` + grep'd
`<compliance_rules>`); the app CLAUDE.md has the concise version.

**No design-token `var()` in a className.** A token is a utility, not an arbitrary value:
write `text-fg-3` / `bg-surface` / `border-border` / `bg-espresso-800` / `text-h4`, **never**
`text-[color:var(--fg-3)]` / `bg-[var(--surface)]` / `bg-[var(--espresso-800)]`. The semantic
house neutrals, accents, and the named type scale are registered in `@theme`
(`packages/tokens/styles/theme.css`); each app adds its accent/palette in its own
`*-theme.css`. A token missing a utility is a gap to fix in the `@theme`, not a reason to reach
for `[var(--…)]`. Spacing/size follows the **scale** (`gap-2.5`, `p-4`) — snap a `[NNpx]` to a
scale step **only on an exact match** (no nearest-step rounding); genuinely off-scale values
(`gap-[18px]`, `max-w-[1060px]`, odd font sizes) stay documented arbitraries. **Arbitrary
`[var(--…)]` / inline-style vars are reserved for runtime bridges only** — a value computed
per render from JS (drag coords, measured/`%`/`clamp()` dims, animation offset, alpha-blended
`rgba()`). A finite enumerable set is **not** a runtime bridge: map it to a static className
lookup. The shadcn alias utilities (`bg-background`, `text-muted-foreground`, …) stay **internal
to `@crivelo/ui/src/ui/**`**; app/component code uses the house neutrals.

**`@crivelo/ui` is the single source of truth for primitives** (`@crivelo/ui/button`, `/card`,
`/dialog`, …). Apps **never** import `radix-ui` / shadcn directly — every primitive comes from
`@crivelo/ui`. A primitive that doesn't exist yet is added **to `@crivelo/ui`**, never kept in an
app's scope; an app may add a thin local **wrapper** that imports a `@crivelo/ui` primitive and
extends it (variants, sizes), but a wrapper is an extension, not a new primitive.

## Shared-package API design (think through the abstraction)
When you build or extend a shared package (`@crivelo/*`), **the package absorbs the complexity so
its consumers don't.** Business logic, parsing, guards, assembly — push them *into* the package and
expose the highest-leverage entry point, not raw building blocks each app must re-wire.

- **The test: look at what every consumer has to write, and push everything identical down.** If two
  apps would copy the same wiring and only a config object differs, that wiring is package logic —
  move it in, behind a single call. **Duplicated boilerplate across apps is the smell that logic
  leaked out of the package**; fix it by relocating the logic, not by documenting the boilerplate.
- **Design for N consumers, not just the first.** Only genuinely per-app values (the config, the
  brand glyph, colours) stay app-local; anything the same across apps belongs to the package. Ask
  "what happens when the 2nd and 3rd app adopt this?" before settling an API.
- **Prefer a factory / handler over exposed internals** when the integration is otherwise
  boilerplate — mirror the ecosystem's own patterns (NextAuth-style `export const { GET } =
  createSplashRoute(cfg)` beats making each app hand-write the parse-guard-render route). The
  consumer keeps only what the framework *forces* to be app-local (a static `runtime` export, a
  file-convention path); everything else is one call.
- Worked example: `@crivelo/pwa` drives `createManifest` / `renderIcon` / `createSplashRoute` from a
  single `PwaConfig` — onboarding a new app (incl. out-of-repo Molly) is config + thin wrappers,
  never re-implementing logic. The first cut exposed only `renderSplash` and left each app to wire
  the route; the duplicated size logic was the signal to raise the abstraction to a route factory.

## Claude Design handoffs
- **Never commit a Claude Design output** (the exported bundle: `project/`, `_ds/`
  design-system, `chats/`, screenshots, etc.) into the repo.
- It lives **locally only**, gitignored, in a **`.design/`** (or `.design_system/`) folder
  at the consuming app's root — e.g. `apps/crivelo-web/.design/`. Both names are gitignored
  repo-wide.
- The **canonical, retrievable source is the live link** — record it in the feature spec's
  frontmatter as `design_link:` (the `claude.ai/design` URL), and point `design_handoff_local:`
  at the gitignored folder. A fresh clone pulls the bundle from the link, not from git.
- Implement against `app/` (re-create the visuals in real Next/Tailwind); the prototype is
  reference only. (The legacy `apps/crema-arena/.design-system/` predates this rule.)

## Deploy / data
- One Vercel project per app; Crema Arena's has Root Directory `apps/crema-arena` +
  `ENABLE_EXPERIMENTAL_COREPACK=1`. `main` auto-deploys to prod
  (`crema-arena.vercel.app`, no custom domain). Work via PR + preview.
- Previews sit behind Vercel deployment protection — use the Vercel MCP
  `get_access_to_vercel_url` to get a bypass link for screenshots/login.
- **Migrations are manual**: the build command has no `migrate deploy`. After
  merging a migration run `DATABASE_URL=<target> npx prisma migrate deploy` (the
  prisma guard hook allows inline `DATABASE_URL=`).
- Neon `misty-fire-35266550`: `production` branch (default → prod) and
  `development` branch (→ previews). QA login on development: `qa@crema-arena.com`.
