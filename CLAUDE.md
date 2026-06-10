# CLAUDE.md — Crivelo monorepo

Turborepo + **pnpm** monorepo (`rmp-software/crivelo`). Apps in `apps/*`, shared
packages in `packages/*`: `@crivelo/tokens` (design foundation), `@crivelo/ui`
(primitives), `@crivelo/tsconfig`, `@crivelo/eslint-config`. The flagship app is
`apps/crema-arena` (its own CLAUDE.md has app-specific rules).

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
- Tailwind: app `content` must include `../../packages/ui/src/**` (or primitive
  classes get purged). Foundation CSS is pulled via **postcss-import**; app
  `@layer base` overrides must be imported AFTER the foundation to win (Tailwind
  hoists `@layer base` to the `@tailwind base` position).

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
