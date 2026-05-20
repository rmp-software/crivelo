---
name: design-system-sync
description: Use when refreshing, cleaning, or removing the Crema Arena design system bundle at `.design-system/crema-arena-design-system/`. Takes a handoff URL from claude.ai/design, downloads it, replaces the existing bundle, and strips files that duplicate the repo (project/app, app_spec.txt, tailwind.config.ts, uploads, chats).
user-invocable: true
---

This skill manages the local design system bundle exported from claude.ai/design. The bundle is reference data consumed by the sibling `crema-arena-design` skill — when it goes stale, refresh it here.

## Layout

```
.design-system/
└── crema-arena-design-system/      # the bundle (replaceable reference data)

.claude/skills/
├── crema-arena-design/             # design skill (committed, stable)
└── design-system-sync/             # this skill (committed, stable)
```

The skills live under `.claude/skills/` and are tracked in git. Replacing the bundle does not touch them.

## Actions

If the user supplies a handoff URL (looks like `https://api.anthropic.com/v1/design/h/<id>`), do a **fetch + replace + clean**. Otherwise ask which they want:

- `fetch <url>` — download, replace existing bundle, clean
- `clean` — strip noise from the current bundle without re-downloading
- `remove` — delete the bundle entirely (the design skill survives, but its visual references will dangle)

## Fetch + replace

1. Confirm: "Replace bundle at `.design-system/crema-arena-design-system/`? Existing one will be backed up as `.bak-<timestamp>/`."
2. Use `WebFetch` to GET the handoff URL. The response is a gzipped tar archive (~3.5 MB uncompressed) — `WebFetch` will save the binary blob to its tool-results directory and report the path. Capture that path.
3. Copy to `/tmp/design-bundle.gz`. Verify: `file /tmp/design-bundle.gz` must report `gzip compressed data`. If not, abort and show what was returned.
4. Extract:
   ```bash
   gunzip -k /tmp/design-bundle.gz
   rm -rf /tmp/design-new && mkdir /tmp/design-new
   tar -xf /tmp/design-bundle -C /tmp/design-new
   ```
5. Sanity check: `ls /tmp/design-new/crema-arena-design-system/` must show `README.md` and `project/`. If not, abort and surface what was inside.
6. Backup: `mv .design-system/crema-arena-design-system .design-system/crema-arena-design-system.bak-$(date +%s)`.
7. Install: `mv /tmp/design-new/crema-arena-design-system .design-system/`.
8. Run **Clean** (below).
9. Diff vs the backup so the user sees what changed:
   ```bash
   diff -rq .design-system/crema-arena-design-system.bak-<ts>/ \
            .design-system/crema-arena-design-system/ | head -40
   ```
10. Do **not** delete the backup automatically — let the user confirm the swap looks right.
11. Clean tmp: `rm -rf /tmp/design-bundle /tmp/design-bundle.gz /tmp/design-new`.

## Clean

Remove bundle files that duplicate the repo (claude.ai/design pulls them from GitHub at export time):

```bash
rm -rf .design-system/crema-arena-design-system/project/app
rm -rf .design-system/crema-arena-design-system/project/uploads
rm -rf .design-system/crema-arena-design-system/chats
rm -f  .design-system/crema-arena-design-system/project/app_spec.txt
rm -f  .design-system/crema-arena-design-system/project/tailwind.config.ts
rm -f  .design-system/crema-arena-design-system/project/SKILL.md
```

The bundle's `SKILL.md` is removed because the live design skill lives at `.claude/skills/crema-arena-design/SKILL.md` — keeping a second copy in the bundle invites drift.

After cleaning, the bundle should contain *only* design-source content:

```
crema-arena-design-system/
├── README.md
└── project/
    ├── README.md
    ├── colors_and_type.css
    ├── fonts.css
    ├── fonts/         (gitignored locally)
    ├── assets/
    ├── preview/
    └── ui_kits/
```

If a future bundle export introduces a new top-level dir not in this list, **ask the user** before deleting it — claude.ai/design may have added something new worth keeping.

## Remove

`rm -rf .design-system/crema-arena-design-system/` — confirm first. The `crema-arena-design` skill keeps loading (its SKILL.md is in `.claude/skills/`), but its references to `preview/`, `ui_kits/`, and the brand `README.md` will dangle until a new bundle is fetched.

## What to never touch

- `.claude/skills/` — the skills themselves
- `/app_spec.txt` at the repo root — canonical, **not** derived from the bundle
- `/public/assets/` — the brand SVGs are already extracted into the repo
- `.gitignore` rules for `.design-system/` (`/*.bak-*/`, `chats/`, `project/uploads/`, `project/fonts/`)

## Final report

After a successful fetch, tell the user:
- Old vs new file count under the bundle
- Which design-relevant files changed (`preview/`, `ui_kits/`, `colors_and_type.css`, `README.md`)
- Path to the backup so they can verify and delete it when ready
