---
id: ds-lvxt3vde7k
title: "The land gate judges only what the test run wrote, not what live heads write"
status: settled
source:
  - p-427ymxp33q
created: 2026-11-25
---

discussion: settled

The owner asked on 2026-11-25 (through the manual supervisor, then confirmed to the secretary directly) for a plan that fixes this. The request is complete as written and is seeded here so a planner can bind to it.

## Hand-off to the planner

- **Outcome:** the `.fgos` leak check of `scripts/run-tests.mjs` judges only what the test run itself wrote. A land whose tests all pass is not refused because a live head wrote into `.fgos` during the run, and a file a test really leaks still fails.
- **Constraints:** this extends the done plan `plans/261124-1945-run-tests-fgos-leak-check`; do not plan it as new work. Replace the stopgap the owner committed by hand (b4581336d: `runtime`, `assignments`, `locks` added to `LIVE_FGOS_DIRS`) with attribution of writes to the test run (for example a store the live system does not write to, or attributing writes to the test process). No env switch or flag that skips the check. Footprint: `scripts/run-tests.mjs`, `test/scripts/run-tests.test.mjs`, `packages/git/contracts/mutation-census.v1.json`; no running plan touches them.
- **Non-goals:** changing which tests run; changing the land gates; weakening the check.
- **Acceptance criteria:** (1) a live write by another session in any `.fgos` path during a run does not fail the check; (2) a file a test leaves in `.fgos` still fails it; (3) one owning proof in `test/scripts/run-tests.test.mjs`; (4) the stopgap directory list is gone or reduced to what the new check needs.
- **Evidence:** backlog row p-427ymxp33q: 9 of the last 30 land gate logs failed this way with all 170 tests green; failures came from `runtime/watcher`, `runtime/head-tickets`, `runtime/supervision`, `runtime/session-rotation`, `assignments/*` and `locks`.
- **Priority:** P1.
- **After planning:** mark the plan ready so the supervisor admits it; a lead slot was free (2 of 3 live) at 12:35.
- **Open points:** none that block.
