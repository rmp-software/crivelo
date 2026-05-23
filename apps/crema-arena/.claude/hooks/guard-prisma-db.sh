#!/usr/bin/env bash
# PreToolUse(Bash) guard: refuse destructive Prisma commands unless they target a
# local database. Prisma CLI reads .env (NOT .env.local), so `migrate dev`,
# `db push`, `migrate/db reset` run against whatever DATABASE_URL .env points at.
# This turns the "pointed .env at prod" footgun into an automatic stop.
#
# Allowed without challenge:
#   - any command that sets DATABASE_URL=... inline (the documented Neon
#     preview-migration path: `DATABASE_URL=<branch> npx prisma migrate deploy`)
#   - watched commands when .env's DATABASE_URL is localhost / 127.0.0.1
#
# Exit 2 = block (stderr is shown to Claude). Exit 0 = allow.

input=$(cat)

cmd=$(printf '%s' "$input" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write((j.tool_input&&j.tool_input.command)||"")}catch(e){process.stdout.write("")}})')

# Only inspect prisma migrate dev|reset|deploy and db push|reset|execute.
if ! printf '%s' "$cmd" | grep -Eq 'prisma[[:space:]]+(migrate[[:space:]]+(dev|reset|deploy)|db[[:space:]]+(push|reset|execute))'; then
  exit 0
fi

# Explicit inline DATABASE_URL override = intentional. Allow.
if printf '%s' "$cmd" | grep -Eq 'DATABASE_URL='; then
  exit 0
fi

proj="${CLAUDE_PROJECT_DIR:-$(pwd)}"
db_url=$(grep -E '^[[:space:]]*DATABASE_URL[[:space:]]*=' "$proj/.env" 2>/dev/null | tail -1 | sed -E 's/^[^=]*=//; s/^["'\'']//; s/["'\'']$//')

if printf '%s' "$db_url" | grep -Eq 'localhost|127\.0\.0\.1'; then
  exit 0
fi

# Mask credentials before echoing the URL back.
masked=$(printf '%s' "$db_url" | sed -E 's#://[^@]*@#://***@#')

cat >&2 <<EOF
BLOCKED: destructive Prisma command against a non-local database.

  command : $cmd
  .env DB : ${masked:-<DATABASE_URL not found in .env>}

Prisma reads .env (not .env.local), so this would run against the host above.
Allowed only when .env's DATABASE_URL is localhost/127.0.0.1, or when you set
DATABASE_URL=... inline (the Neon preview path).

If this is intentional, run it yourself with the ! prefix, e.g.:
  ! DATABASE_URL=<branch-url> npx prisma migrate deploy
EOF
exit 2
