# Phase 2 (Unit P2) — Claude-only parallel execution report

Runbook: `runbook-claude-only-parallel-execution.md`. Branch `unit/P2`,
worktree `.claude/worktrees/dispatch-engine-liveness-p2-admission-worker-visibility`,
base `main@647e23a5c` (post-P1), integrated `main@a92bb68a3` (later
carried forward unchanged when P3 merged on top, final combined tip
`58be9e527`).

Audit finding S1 (HIGH): admission and provider-capacity lease reclaim
only checked the runner process's own pid, not the detached worker it
spawned — a SIGKILLed runner whose worker survives could still be
readmitted for a second concurrent attempt.

## Implementer (sonnet, fullstack-developer)

Migrated `cli-spawn-supervisor.mjs`'s `isBoundProcessAlive(bound)` onto
Phase 1's promoted judge:
`resolveHolderLiveness(bound, isProcessAlive(bound.pid)) === 'held'` —
this closes a real bootId/reboot-detection gap the old hand-rolled
comparison lacked, not just a refactor.

Added `isCliSpawnRunStillWorking(runDir)` to `assignment-runner.mjs`
(reads the real supervisor/worker binding files) and wired it into two
call sites: the admission in-flight check, and a
`providerCapacityIsRunWorkerAlive` closure threaded into lease-reclaim.

Changed `provider-capacity.mjs`'s `reclaimDeadLeases` formula from
`pidDead || runIsDead(...)` to
`(pidDead && !isRunWorkerAlive(runId, lease)) || runIsDead(runId, lease)`,
with safe defaults reproducing pre-fix behavior when `isRunWorkerAlive`
isn't supplied (keeps every other caller's existing behavior intact).

Added a real-process test to `test/runner/assignment-dispatch.test.mjs`:
`'executeAssignment: admission refuses a second attempt while a
SIGKILLed runner's detached cli-spawn worker is still alive (S1 live
probe)'` — spawns a real runner subprocess, SIGKILLs it, confirms the
real detached supervisor+worker survive, asserts a second admission
attempt is correctly refused. Plus 2 new unit tests for the
`reclaimDeadLeases` formula in `test/runner/provider-capacity.test.mjs`.

## Lead final verification and merge

Independently read all 4 touched production files in full and confirmed
each change matched the report (`isBoundProcessAlive`'s new one-line
delegation; the new `isCliSpawnRunStillWorking` helper and its two call
sites at the admission check and the lease-reclaim closure; the exact
`reclaimDeadLeases` formula change, line-by-line).

Did not accept the SIGKILL-probe test's pass as proof on its own:
reverted the 3 touched production files to `HEAD~1`, reran the test,
confirmed it genuinely fails (`Missing expected rejection`), then
restored the fix and reran to confirm it passes again — the test
actually catches the regression it claims to catch.

Ran the 2 touched test files directly (pass), then the full suite in the
worktree: 7994 tests, 7921 pass, 0 fail.

`git -C /home/vantt/projects/forgentX merge --no-ff unit/P2` from the
main checkout, `ort` strategy, clean auto-merge, no conflicts.
`integratedSha = a92bb68a3...`.

## Next

See Phase 3's own report and the plan's "Interaction finding" note under
Phase 3 for the post-merge investigation into a combined-suite failure
that surfaced only after Phase 3 was also merged on top of this commit —
confirmed as a pre-existing test-fixture race, not a defect in this
phase's own change.
