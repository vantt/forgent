---
id: ds-ti2vip43kp
title: "The leak check of run-tests ignores live runtime directories"
status: settled
source:
  - p-s6te2445rb
created: 2026-11-24
---

discussion: settled

The owner asked on 2026-11-24, through the manual supervisor, for a small plan that fixes this. The request is complete as written and is seeded here unchanged so a planner can bind to it.

## Hand-off to the planner

- **Outcome:** the check in `scripts/run-tests.mjs` that looks for files a test run left in `.fgos` no longer fails a run because of live files that other heads write while the run is going, and still fails when a test really leaks a file.
- **Constraints:** one phase if it is small enough, with a footprint of `scripts/run-tests.mjs` and the test of that script. Exclude from the comparison: `runtime/land`, `runtime/mailbox`, `observe/records`, `logs`, `cache`, and the log of the land that is running (the `land-*.log.partial` file). Find the existing test file of `run-tests.mjs` and extend it (one owning proof); add no env switch or flag that skips the check.
- **Non-goals:** changing which tests run; changing the land gates; touching any other script.
- **Acceptance criteria:** (1) with a live file added in each excluded directory during a run, the check passes; (2) a file a test leaves in another `.fgos` path still fails the check; (3) `node scripts/run-tests.mjs` on the script's own test is green.
- **Evidence:** three red lands with 0 failures, each by files in `observe/records`, `mail-taken`, `invocation-faults.jsonl` and `land-*.log.partial`.
- **After planning:** do not set the plan to `ready`; tell the supervisor, who approves it.
- **Open points:** none that block.
