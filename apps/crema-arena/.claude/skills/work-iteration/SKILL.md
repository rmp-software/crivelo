---
name: work-iteration
description: Use to execute one sub-issue from a feature breakdown — picks the next pending sub-issue under a spec's parent Linear issue, manages the feature branch + sub-PR, dispatches a coding subagent to implement, then an adversarial Sonnet reviewer subagent. Enforces evidence gates (tsc, dev server, screenshot/test) and caps retries at 3.
user-invocable: true
---

You execute exactly one sub-issue under a feature's Linear parent — implementing, reviewing, committing, and opening a PR into the feature branch. You orchestrate; the actual code-writing and code-reviewing happen in **separate subagents** with isolated context. This separation is intentional and based on Anthropic's harness-design findings: agents reviewing their own work systematically overclaim quality.

## When to use

After `/breakdown-feature` has created the issue tree. Each invocation handles one sub-issue.

## Read first

1. The spec at `docs/specs/<slug>.md` (slug from user argument; if not provided, list specs with status `planned` or `in-progress` and ask)
2. Spec frontmatter — must have `linear_parent_issue` and `feature_branch` set. If not, abort and tell user to run `/breakdown-feature` first.
3. `/CLAUDE.md` for branch policy, test commands, copy rules
4. `.linear_features.json` for Linear team/project IDs

## Workflow

### Step 1 — Identify the next sub-issue

Run `mcp__plugin_linear_linear__get_issue` on the parent (from spec frontmatter). Pull its sub-issues. Pick the first one in `Todo` state (lowest sort order if multiple).

If none are Todo:
- All Done → tell the user the feature is complete; suggest opening the umbrella PR from `feature/<slug>` → main
- Some In Progress → ask user whether to resume one or move past

Record: `<issue-identifier>` (e.g. `RMP-100`), `<issue-title>`, `<issue-description>` (with test steps).

### Step 2 — Branch management

Make sure we're on the right branch:

```bash
git fetch origin
# Ensure feature branch exists locally and is current
if ! git show-ref --verify --quiet refs/heads/feature/<slug>; then
  git checkout -b feature/<slug> origin/main
else
  git checkout feature/<slug>
  git pull origin feature/<slug> 2>/dev/null || true  # may not exist on remote yet
fi
# Create sub-branch off feature
git checkout -b feature/<slug>/<issue-identifier-lowercase>
```

**Never branch directly off main for a sub-issue.** Always off the feature branch.

### Step 3 — Mark the issue In Progress in Linear

Use `mcp__plugin_linear_linear__save_issue` with `stateId` for the team's "In Progress" workflow state. Look it up via `mcp__plugin_linear_linear__list_issue_statuses` if you don't have it cached.

### Step 4 — Dispatch the coding subagent

Use the `Agent` tool. Subagent type: `general-purpose` (broadest tool access). Default model (Opus 4.7).

Prompt structure (compose with full context — the subagent has no conversation history):

```
You are implementing one sub-issue of a feature for [project-name from CLAUDE.md].

=== Project context ===
Read these files before touching anything:
1. /CLAUDE.md
2. docs/specs/<slug>.md
3. Any files mentioned in the issue's "Surfaces affected" section

=== The sub-issue ===
ID: <identifier>
Title: <title>
Description (includes acceptance criteria and test steps):
<full description body>

=== Your task ===
1. Read the project context.
2. Implement the change. Match existing patterns in `app/` (or equivalent source dir). Use existing primitives — don't create new abstractions unless the issue requires it.
3. Run the test steps from the issue description literally — every step must produce its claimed outcome.
4. Run the project's verification gates:
   - `npx tsc --noEmit` (or the project's type-check command from CLAUDE.md) — must exit 0
   - Boot the dev server (the command from CLAUDE.md) — must serve without error
   - **Browser-based verification is mandatory.** Use a real browser tool (Playwright MCP, Chrome DevTools MCP, Puppeteer — any tool that drives a real browser). **Never use `curl`, `wget`, or other shell-based HTTP requests as evidence** — they miss auth/cookies/CSP/CSRF and return misleading green checks on rendered error pages.
   - For UI work: navigate to the page, exercise the new behavior in the UI, take a screenshot. Save to `.playwright-mcp/<issue-id>-<step>.png`.
   - For API work: drive the UI that calls the route (preferred), OR call the route via `fetch()` from the browser console using `mcp__playwright__browser_evaluate` / `mcp__plugin_chrome-devtools-mcp_chrome-devtools__evaluate_script`, OR capture the request via `browser_network_requests` / `list_network_requests`. Always inside a browser context.
   - For server-only changes (migrations, jobs, internal libs with no HTTP surface): exercise the change through a page that triggers it via the browser, OR write a temporary script that the test runner executes. No raw shell HTTP either way.
5. Report back with:
   - Files changed (paths only)
   - Evidence artifacts (paths to screenshots, command outputs)
   - Any test step that did NOT pass and why
   - Any acceptance criteria you could not verify and why

DO NOT commit. DO NOT push. DO NOT create a PR. Stop after evidence is gathered.

If you cannot complete the task (missing dependency, ambiguous requirement, contradicts existing code), STOP and report what you found. Do not invent or skip steps.
```

### Step 5 — Verify the evidence

Before invoking the reviewer, double-check what the coding agent reported:

- Read each evidence artifact path it cited — confirm the files exist.
- Run `git diff` and review the actual changes — they must match what the agent claimed to change.
- Run `npx tsc --noEmit` yourself once more. If it errors, do not proceed.

If anything is missing or fabricated, treat it as a retry (go to Step 7 with a coder retry, not a reviewer round).

### Step 6 — Dispatch the adversarial reviewer

Use the `Agent` tool. Subagent type: `pr-review-toolkit:code-reviewer`. **Pass `model: "sonnet"`** to override the default. The separation (Sonnet reviewing Opus's work) reduces shared blind spots.

Reviewer prompt — adversarial framing:

```
You are an adversarial code reviewer. Your job is to find problems, NOT to approve.

=== Scope of review ===
Branch: feature/<slug>/<issue-identifier-lowercase>
Diff against: feature/<slug>
Run: `git diff feature/<slug>...HEAD`

=== Context ===
Sub-issue being implemented:
Title: <title>
Description (with acceptance criteria and test steps):
<full description body>

Spec: docs/specs/<slug>.md
Project conventions: /CLAUDE.md

=== Your standard ===
Assume there are bugs. You must find at least 3 concrete issues OR explicitly show what you checked and why none exist.

Check, at minimum:
1. Each acceptance criterion line-by-line — is it actually true in the diff?
2. Each test step — does the code support it actually passing? Don't trust the implementer's claim; reason from the code.
3. Edge cases: null/empty inputs, concurrency, error paths, what happens when an upstream call fails.
4. Project conventions from CLAUDE.md — branch policy, copy rules, "never do X" rules.
5. Silent failures: try/catch that swallows, fallbacks that hide bugs, removed assertions.
6. Type safety: anywhere `any` was introduced, `@ts-ignore` was used, or types were widened.
7. Pre-existing tests: any that this change breaks (don't run them — reason from the diff).

=== Output ===
Return one of:
- BLOCK: with a numbered list of concrete issues, each with a file:line reference and a one-line description of the fix needed.
- APPROVE: with a numbered list of the 5+ specific checks you performed and what you saw that satisfied each.

Do NOT return "looks good" or any variant. Approval requires evidence of checking, not absence of obvious bugs.
```

### Step 7 — Handle the verdict

**If BLOCK:**

Tell the user what the reviewer found, in a tight summary. Ask whether to:
- (a) Dispatch the coder again to address the feedback (counts as 1 retry)
- (b) Manually intervene
- (c) Abandon this sub-issue

If (a), increment the retry counter. **Cap retries at 3.** On the 4th cycle, automatically pick (b) and surface to the user — do not loop further. The retry coder prompt should include the reviewer's full feedback verbatim plus the original prompt.

**If APPROVE:**

Proceed to Step 8.

### Step 8 — Commit and PR

Stage exactly the files the coder reported. Commit message:

```
<conventional-prefix>(<scope>): <issue title in sentence case>

<issue identifier>
Resolves the sub-issue: <one-line description>

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

The conventional prefix follows the project's existing log style (run `git log --oneline -10` to check — `feat:`, `fix:`, `chore:` etc.).

Push the sub-branch:
```bash
git push -u origin feature/<slug>/<issue-identifier-lowercase>
```

Open a PR from the sub-branch into the **feature branch** (NOT main):
```bash
gh pr create --base feature/<slug> --title "<title>" --body "$(cat <<'EOF'
## What
<one-line description>

## Linear
<issue-identifier>

## Evidence
- <evidence path 1>
- <evidence path 2>

## Adversarial review
<reviewer's APPROVE block — the list of specific checks>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### Step 9 — Update Linear

- Sub-issue → state "In Review" (or whatever state matches "PR open" in this team's workflow). Add a comment with the PR URL.
- Parent issue: add a comment summarizing progress (e.g. "Sub-issue RMP-100 done — N/M complete").

### Step 10 — Report back to the user

3–5 lines:
- Sub-issue ID + title (done)
- PR URL
- Reviewer's APPROVE checklist (so the user can see what was actually verified)
- Retries used (if any) and a one-line summary of what changed during retries
- Next step: another `/work-iteration <slug>` for the next sub-issue, or open the umbrella PR if this was the last

## Things to never do

- **Never commit code the reviewer BLOCKED.** No "the issues are small, I'll fix in next PR."
- **Never push to main.** Sub-PRs target the feature branch.
- **Never let the same agent both code and review.** The Sonnet reviewer is non-negotiable structural separation.
- **Never invent evidence.** If a screenshot path is claimed, you must `ls` it and confirm size > 0.
- **Never accept `curl` / `wget` / shell HTTP as verification.** Browser-driven verification only. If the coding subagent reports curl output as evidence, treat it as missing evidence and require a browser-based check.
- **Never skip the verification gates** (tsc + browser check) because "the change is small."
- **Never silently increase the retry cap.** 3 is the cap. After that, the human takes over.
- **Never bypass git hooks** (no `--no-verify`). If a hook fails, that's signal — investigate.

## Evidence gates — minimum bar

A sub-issue cannot pass to commit unless ALL of these are present in the conversation:

1. Git diff visible (run `git diff feature/<slug>...HEAD` and confirm output looks right)
2. `npx tsc --noEmit` (or project equivalent) — exit 0, output captured
3. Dev server boot check — confirmed via a browser navigation to the dev URL (Playwright/Chrome DevTools), NOT curl. The page must load without console errors that didn't exist before.
4. **Browser-driven verification of the change** (hard block — no exceptions):
   - For UI: at least one screenshot in `.playwright-mcp/` with size > 0 showing the new behavior in a real browser
   - For API: at least one network request captured via `browser_network_requests` / `list_network_requests`, OR a browser-evaluated `fetch()` result in the conversation
   - `curl`/`wget` output does NOT satisfy this gate, even if the response looks correct
5. Reviewer APPROVE block with ≥5 specific checks

If any is missing, you cannot proceed to Step 8.

## Cross-session resumption

If the user invokes this skill on a sub-issue that already has an open PR (check via `gh pr list --head feature/<slug>/<issue-identifier-lowercase>`), do NOT re-implement. Instead, report the PR status and ask whether they want to:
- View the open PR
- Pick a different sub-issue
- Force-restart (delete branch + PR — confirm before doing this)
