# Phase 3: Integration: changelog and full gate

Capability: `code:test`.

## Inputs

- The landed commits of phases 1 and 2 on main.
- `CHANGELOG.md` `## [Unreleased]`.
- `core/skills/fgos-supervisor/SKILL.md` (how a confined head gets a full-suite run from `lead:SUPERVISOR`).

## Files it may write

`CHANGELOG.md`, `plans/261127-0144-when-to-ask-owner-rule/reports/integration/**`.

## Steps

1. Add one line under `## [Unreleased]`: agents now ask the owner only to set or change a direction; the approved
   frame is the approved goal, not the plan's file list; the three questions live in
   `core/skills/_shared/decision-question.md#when-to-ask`.
2. Run the full gate on the combined tree. A confined head cannot run the full suites: send the exact commands to
   `lead:SUPERVISOR` (per the supervisor skill) and wait for its result; this is a hands step, not an owner question.
3. Write the gate result (commands, exit codes, failing test names if any) under `reports/integration/`. A failure
   caused by this plan is fixed in phase 1's files (lead re-runs phase 1); a failure that exists on main without this
   plan is named with its proof and does not block.

## Verify

```bash
npm test
cargo test --workspace
grep -n "When to ask\|set or change a direction" CHANGELOG.md
```

Pass: both suites green (or failures proven present on main without this plan), and the changelog line is present.

## Rollback

`git revert` the phase commit (the changelog line and the report).
