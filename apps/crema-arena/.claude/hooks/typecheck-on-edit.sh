#!/usr/bin/env bash
# PostToolUse(Edit|Write) gate: run the project's de-facto type gate
# (`npx tsc --noEmit`) after a .ts/.tsx edit and surface failures to Claude.
# CLAUDE.md names this as the pre-commit gate ("lint isn't strict").
#
# Note: full-project tsc runs after each .ts/.tsx edit (~seconds). During a
# multi-file change intermediate errors may appear and resolve as edits land.
# Exit 2 = surface stderr to Claude. Exit 0 = quiet pass.

input=$(cat)

fp=$(printf '%s' "$input" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write((j.tool_input&&j.tool_input.file_path)||"")}catch(e){process.stdout.write("")}})')

case "$fp" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac

proj="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$proj" || exit 0

if out=$(npx tsc --noEmit 2>&1); then
  exit 0
fi

echo "tsc --noEmit reported type errors (project type gate) after editing $fp:" >&2
printf '%s\n' "$out" >&2
exit 2
