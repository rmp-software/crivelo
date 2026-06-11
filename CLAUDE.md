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

**`@crivelo/ui` is the single source of truth for primitives** (`@crivelo/ui/button`, `/card`,
`/dialog`, …). Apps **never** import `radix-ui` / shadcn directly — every primitive comes from
`@crivelo/ui`. A primitive that doesn't exist yet is added **to `@crivelo/ui`**, never kept in an
app's scope; an app may add a thin local **wrapper** that imports a `@crivelo/ui` primitive and
extends it (variants, sizes), but a wrapper is an extension, not a new primitive.

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
