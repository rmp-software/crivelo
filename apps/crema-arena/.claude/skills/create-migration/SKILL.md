---
name: create-migration
description: Create a new Prisma migration safely against the LOCAL dev database. Wraps `prisma migrate dev` with the .env safety check, the git-tracking reminder, and the Neon preview-deploy follow-up. Invoke as /create-migration <slug>.
disable-model-invocation: true
---

# create-migration

Create a Prisma migration for Crema Arena without tripping the known footguns:
Prisma reads `.env` (not `.env.local`), `prisma/migrations` IS git-tracked, and
Neon preview branches are NOT auto-migrated by the Vercel build.

`$ARGUMENTS` is the migration slug (kebab-case, e.g. `add-sponsor-tier`). If empty,
ask the user for one before proceeding.

## Steps

1. **Confirm the target DB is local.** Read the `DATABASE_URL` line from `.env`
   (not `.env.local`) and verify the host is `localhost` / `127.0.0.1`. If it is
   anything else, STOP and warn the user — running `migrate dev` here would mutate
   that database. Do not proceed without explicit confirmation.
   (The `guard-prisma-db.sh` PreToolUse hook also blocks this, but check first so
   you fail fast with a clear message.)

2. **Confirm the schema edit is in place.** The user should have already edited
   `prisma/schema.prisma`. Show a quick `git diff prisma/schema.prisma` so both of
   you are reviewing the same change. If there is no pending schema change, ask what
   the migration should contain.

3. **Run the migration** against local:

   ```
   npx prisma migrate dev --name <slug>
   ```

   This applies the change and regenerates the Prisma client. If it reports drift or
   a failed migration, surface the full output — do NOT pass `--force` or reset the
   DB without asking.

4. **Type-check** — schema changes ripple into generated types:

   ```
   npx tsc --noEmit
   ```

5. **Stage the migration** — `prisma/migrations/` is committed:

   ```
   git add prisma/migrations prisma/schema.prisma
   ```

   Remind the user it must land via PR on a feature branch (never directly on
   `main`).

6. **Preview/prod note.** Vercel's build does NOT auto-run migrations. For a PR's
   Neon preview branch, the migration must be deployed explicitly:

   ```
   DATABASE_URL=<neon-branch-url> npx prisma migrate deploy
   ```

   (The inline `DATABASE_URL=` is what the safety hook allows for non-local targets.)
   Mention this so the preview DB doesn't drift from the schema.

## Don't

- Don't run `prisma migrate reset` / `db push` to "fix" a stuck migration without
  the user's go-ahead — both are destructive.
- Don't put a production URL in `.env`.
