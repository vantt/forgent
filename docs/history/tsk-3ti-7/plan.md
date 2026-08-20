# Plan: stop fail-open eligibility fallback in resolveAgentTypeForTaskSpec

Item: `tsk-3ti-7`. Mode: **small** — one function, four call sites, no split.
Risk: **heavy** (audit/security hard-gate keyword — this is the eligibility
gate that decides which agent-type a dispatch actually runs as).

## Approach

Per RESEARCH.md finding 7 (`docs/history/tsk-397-review-followups/RESEARCH.md`):
`resolveAgentTypeForTaskSpec` (`src/runner/dispatch/cli.mjs`) fails open at
4 points, each falling back to `currentAgentType || (agentDefs[0]?.name ??
null)` — an unvalidated or mismatched agent name — instead of refusing:

1. `!taskSpecHeader` (no taskSpec header at all)
2. pinned agent (`taskSpecHeader.agent`) not found in the real roster —
   previously returned `pinnedAgents[0]` verbatim, an unvalidated name
3. no `requires-skill` declared
4. no roster agent matches the declared `requires-skill`

Each of the 4 sites now returns `null` (refuse) instead of falling open.
`null` was already a valid "no opinion" return from this function's own
caller, `resolveAgentTypeForWork` (same file) — that function already
returns `null` in its own "no taskSpec"/"no header" cases, so downstream
consumers already treat `null` as a legitimate outcome; no caller needed
new null-handling logic.

Files touched: `src/runner/dispatch/cli.mjs` (the 4 fallback expressions),
`test/runner/dispatch.test.mjs` (new coverage), `CHANGELOG.md`.

## Cases

- **All 4 fail-close sites**: one assertion per site, covering
  null/undefined `taskSpecHeader`, a pinned agent absent from the roster,
  an empty/blank `requires-skill`, and a `requires-skill` no roster agent
  satisfies — every case asserts `null`, never `currentAgentType` or
  `agentDefs[0]`.
- **Existing behavior unchanged**: the two cases where a match IS found
  (pinned agent present in roster; a roster agent matches required skills)
  are untouched — same as before this change.
- **Blast radius**: per the function's own doc comment, the resolved
  agentType only has an observable effect on an executor that is already
  command-less/adapter-less/invocation-less and declares no static
  `agentType` of its own. Every executor this repo configures today (agy,
  claude, codex, pi) has its own real `command`, so this change does not
  alter current runtime dispatch behavior — it hardens the fallback path
  for a future command-less executor.

## Outstanding questions

None.
