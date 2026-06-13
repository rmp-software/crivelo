#!/usr/bin/env bash
# PreToolUse hook (matcher: Agent|Task).
# This repo bans the generic `general-purpose` subagent — every dispatch must use a
# specialized agent. Reads the PreToolUse payload on stdin and DENIES only when
# .tool_input.subagent_type == "general-purpose"; every other dispatch is allowed
# (emits `{}` = no opinion). See CLAUDE.md "Subagents (hard rule)".
exec jq -c '
  if .tool_input.subagent_type == "general-purpose" then
    {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: "This repo bans the generic general-purpose subagent. Substitute a specialized agent and re-dispatch: principal-engineer (new code) or code-refactor-master (restructuring) for implementation; rmp:code-reviewer for correctness review; rmp:spec-compliance-reviewer for UI/copy; code-architecture-reviewer for architecture/system-integration."
      }
    }
  else {} end'
