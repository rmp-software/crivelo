# Crivelo — umbrella brand & platform structure (decision record)

> Captured from the brainstorming sessions of **May 23–27, 2026** so the thread can
> continue across machines. This is a *decision record*, not a feature spec — it
> records what was decided, what's still open, and the rationale. Source transcript:
> `~/.config/superpowers/conversation-archive/-home-lucas--config-superpowers-worktrees-crema-arena-crowd-vote/69db933c-304f-4693-83be-0b478c3f64d9.jsonl`

## The pivot (why this exists)

Crema Arena is a TNT-competition app. The plan is to grow a **family of coffee-community
tools** beyond competitions, starting with at least two more:

1. **Cupping companion** (cupping/scoring sessions — probably needs a backend)
2. **V60 / 4:6 recipe calculator** (Kasuya / 4:6 — likely pure client-side math)

…plus a front-door **portal**, a **dictionary**, and a **blog** later. Crema Arena
becomes *one product* under a parent umbrella brand: "**Crema Arena by Crivelo**".

---

## 1. Brand identity — **LOCKED (finalist, pending checks)**

**Umbrella brand: `Crivelo`** (chosen May 27, suggested by Gemini during a cross-model check).

Naming journey: `Bica` → `Kopiteca` → **`Crivelo`**. Crivelo superseded Kopiteca because it
better serves the "craft × code" positioning.

**Etymology / rationale**
- From pt-BR `crivo` = *sieve / screen*. In Brazilian specialty coffee it's real working
  vocabulary: the **screen size used to grade green beans** (e.g. "café crivo 17/18") —
  Q-grader / roaster terminology, not generic café atmosphere.
- Lineage: Latin *cribrum* → Italian *crivello* → pt `crivo`. **Crivelo** is a
  Portuguese-friendly stylization (single L; stress *kri-VÉ-lo*, paroxytone) so it reads
  native, not borrowed.
- **Double metaphor (the load-bearing point):** a sieve = quality-sorting (coffee craft)
  *and* filtering / curation / logic gates (tech). One word bridges both — "a studio that
  curates and builds tools for coffee makers." Kopiteca only said "collection."
- More ownable than Kopiteca (whose phonetic twin "Copiteca" is a print-on-demand shop).

**Known flags (raised, not resolved)**
- **Sonic clash:** "Crema Arena **by** Crivelo" stacks three hard `Cr-` onsets. Not fatal
  (cf. Coca-Cola, Calvin Klein) but pressure-test by saying it aloud over a few days.
- **Insider-only meaning:** lay drinkers won't know `crivo`; insiders will love it.
- **Brazilian search shadow:** Marcelo Crivella (ex-mayor of Rio) — phonetic neighbor.
- **Distant slang:** `crivar de balas` ("riddle with bullets") — lexically far from the
  noun `crivo`; minor.

### Endorsed product-naming system ("X by Crivelo")

Each product keeps its own coffee-word name, endorsed by the house:

| Surface | Name | Meaning |
|---|---|---|
| Portal / front door | **Crivelo** | the sieve / curator's house |
| TNT flagship | **Crema Arena** by Crivelo | existing product |
| Cupping | **Mesa** by Crivelo | *mesa de prova* (cupping table) |
| V60 / 4:6 | **Coa** by Crivelo | *café coado* (filtered/poured) |
| Dictionary | **Léxico** by Crivelo | lexicon |
| Blog | **Diário** by Crivelo | diary / editorial voice |

### Tagline seeds (pt-BR — for Claude Design to refine)
- *Ferramentas para quem vive café.*
- *Sua coleção de café, em um lugar.*
- *Do grão à chave.* (bean → bracket; playful tie-together)

### To grab / verify
- Domains: `crivelo.com` first; fallbacks `crivelo.cafe` · `crivelo.coffee` · `crivelo.com.br`
- Handle: `@crivelo`
- ⏳ **Crivelo collision / trademark / domain check was requested but never run.** (The
  Kopiteca check was done; Crivelo's wasn't.)

---

## 2. Design system — **LOCKED (three-tier model)**

Two-/three-tier theming so the family looks like one brand while each tool keeps its own
voice. Mechanically friendly to the eventual package split (a shared `tokens` layer ships
the foundation + default ramp; each app drops in its own accent override).

**Tier 1 — Shared foundation (every tool):**
- The four typefaces: **Bricolage Grotesque, Instrument Serif, Geist, Geist Mono**
- **crema / espresso neutrals** (`--bg`, `--fg`, surfaces, borders)
- radii, shadows, motion
- semantic colors (success / danger)

**Tier 2 — Per-product accent:** each tool overrides ~5 CSS variables on its root —
`--brand`, `--brand-hover`, `--brand-press`, `--brand-soft`, `--focus-ring`. "Claiming an
accent" is literally swapping those five. Crema Arena keeps **cinnamon**; siblings choose
their own (e.g. V60 calmer/more utilitarian).

**Tier 3 — Per-product personality:** Arena-only motifs (podium, brackets, `AO VIVO` badge,
trophy SVGs) stay inside Crema Arena. Quieter tools stay calm.

---

## 3. Architecture / repo structure — **DECIDED in principle, build DEFERRED**

**Core reframe:** the genuinely reusable surface is the **brand / design system**, *not*
application logic.
- **Reusable:** color tokens + fonts (`globals.css`, `tailwind.config.ts`, `public/fonts`),
  brand SVGs, a few UI primitives (`Toast`, `ConfirmationModal`), pt-BR copy conventions,
  maybe `file-upload.ts` / `device-id.ts` (extract on demand, not preemptively).
- **NOT reusable:** `bracket.ts`, `crowd-vote.ts`, judge-voting model, split-cadence
  polling — all TNT-specific. The cupping companion and V60 calculator share none of it.

**Decision: "one brand, independent apps."**
- ✅ Share the design system (tokens, fonts, tailwind preset, brand SVGs, primitives)
- ✅ Share config presets (base `tsconfig`, tailwind preset, eslint/prettier) — nearly free, prevents drift
- 🟡 Extract a couple utilities on demand (`file-upload`, `device-id`) — only when a 2nd app reaches for them
- ❌ **Do NOT share** auth / DB / user accounts — heterogeneous apps, heavy coupling for zero benefit. Each app owns its own data and decides whether it even needs a backend.

**Turborepo: now the right call** (YAGNI caution retired — 4–6 planned surfaces sharing one
brand justify it, where 2 hypothetical apps wouldn't).

**Build in layers (foundation first):**
1. **Foundation (design first):** turborepo monorepo + extracted design-system package +
   umbrella brand layer. Crema Arena migrates in as **`apps/crema-arena`** and keeps working
   identically. Placeholder package scope used during build (e.g. `@coffee/ui`), renamed to
   `@crivelo/*` later — naming doesn't block structure.
2. **Then each as its own spec → plan → build:** V60 calculator · cupping companion ·
   portal/landing hub · dictionary · blog.

Per-app Vercel projects; deploy/domain model is part of the deferred structure pass.

---

## 4. Open / deferred / TODO

- [ ] **Crivelo collision + domain + trademark check** (coffee F&B class *and* software/SaaS class) — requested, never run.
- [ ] **Sonic pressure-test** "Crema Arena by Crivelo" (Cr-Cr-Cr) before final lock.
- [ ] **Claude Design handoff:** visual identity, brand voice doc, taglines, the
      "Crema Arena + by Crivelo" lockup, portal homepage. (Was the agreed next step.)
- [ ] **Structure pass (the real architecture conversation):** turborepo layout, exact
      shared-package boundaries, Crema Arena migration plan (without breaking live prod at
      `crema-arena.com`), deploy + domain routing model (root → portal? subdomains per
      product? separate apps?), final `@crivelo/*` package scopes.
- [ ] Whether the Crivelo portal has its own accent or wears the neutral foundation.
- [ ] Whether Crema Arena's brand SVGs get Crivelo co-branding or stay standalone.

## Status snapshot

| Area | State |
|---|---|
| Umbrella name (Crivelo) | ✅ Decided (pending sonic test + collision check) |
| Product naming system | ✅ Decided |
| Design-system tier model | ✅ Locked |
| "One brand, independent apps" + turborepo | ✅ Decided in principle |
| Turborepo layout / migration / deploy | ⏳ Deferred to structure pass |
| Visual identity / Claude Design | ⏳ Not started |
| Collision / trademark / domains | ⏳ Not started |
