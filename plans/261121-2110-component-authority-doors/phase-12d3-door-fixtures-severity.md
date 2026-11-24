# Phase 12d3: The Node test fixtures of a door row carry the now-required `severity`

## Why now
Phase 12d2 (edc811107) made `severity` required on every door row. Two Node tests build a small model of their own,
and their door row has no `severity`, so the host refuses the model (`model file invalid: .../doors/one.yaml: missing
field severity`). Reported by the DOCOS lead on 2026-11-24 20:55 from a run outside the sandbox (main 49f0f47dc,
release 71dd6eb7): `test/report/decision-index.test.mjs` (narrativeHolderResolver, line 241) and
`test/setup/instruction-registry.test.mjs` (discoverKnownOwners at line 1020; discoverInstructionSources at lines 125,
524, 592, 618, 644, 783). No other test, script or source file writes a door row (`rg 'kind: door'`).

## Files it may write
test/report/decision-index.test.mjs, test/setup/instruction-registry.test.mjs

## Steps
1. Add `severity: low` right after `kind: door` in the door-row string of each file.

## Verify
`env -u CLAUDE_CODE_SESSION_ID node scripts/run-tests.mjs test/report/decision-index.test.mjs test/setup/instruction-registry.test.mjs`
is green with the activated host.

## Rollback
Revert the commit.
