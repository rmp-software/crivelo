# Crivelo

Umbrella monorepo for the Crivelo coffee-community tool family. Crivelo is the
house brand ("from `crivo` — the sieve used to grade coffee beans"); each product
keeps its own coffee-word name endorsed by the house (e.g. **Crema Arena by Crivelo**).

## Structure

```
apps/        product apps (each owns its own data; auth/DB are NOT shared)
  crema-arena/   TNT competition flagship
packages/    shared, reusable surface (the brand / design system)
  tokens/        @crivelo/tokens   — CSS foundation, tailwind preset, fonts, brand assets (zero React)
  ui/            @crivelo/ui       — React primitives (depend on @crivelo/tokens)
  tsconfig/      @crivelo/tsconfig — shared TypeScript bases
  eslint-config/ @crivelo/eslint-config — shared lint config
```

## Tooling

- **pnpm** workspaces + **Turborepo**
- **Node 24** (see `.nvmrc`)

```bash
nvm use            # Node 24
pnpm install       # install all workspaces
pnpm build         # turbo run build across the graph
pnpm dev           # turbo run dev
pnpm type-check    # turbo run type-check
```

## Design system tiers

1. **Foundation** (`@crivelo/tokens`) — typefaces, crema/espresso neutrals, radii, shadows, motion, semantic colors. Shared by every product.
2. **Per-product accent** — each app overrides ~5 CSS variables (`--brand*`, `--focus-ring`). Crema Arena claims cinnamon.
3. **Per-product personality** — app-only motifs (Crema Arena's brackets, podium, `AO VIVO`, trophy SVGs) stay inside the app.

See the decision record in `apps/crema-arena/docs/crivelo-umbrella.md`.
