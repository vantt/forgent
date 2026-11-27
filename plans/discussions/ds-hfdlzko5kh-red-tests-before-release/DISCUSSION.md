---
id: ds-hfdlzko5kh
title: "Fix the red tests on main so the release can run"
status: settled
source:
  - p-4nmomwje7j
created: 2026-11-27
---

discussion: settled

## Hand-off

- **Outcome:** an unconfined `npm test` on main has none of the listed reds, so the release check passes on its next run. Every goal plan waits on this release.
- **Owner answer (q-apqmci34ry, 2026-11-27 01:26Z):** "Secretary opens a red-tests plan". One plan fixes the listed reds, then one release rerun after it lands.
- **Constraints:**
  - Fix each cause in production code or its fixture; never weaken or skip a test, never change the release recipe or skip a check.
  - Fastest path: one planner, priority P0 (the backlog has only P1 to P3, so state P0 in the plan title and raise it first), narrow footprint (only the files each red needs).
  - Raise the plan to the supervisor when it is ready.
- **Reds still on main at `a4131c2bf8`** (triage in backlog row p-4nmomwje7j, update 2026-11-27):
  - `test/runner/provider-per-cli-credential-sources.test.mjs` (6, worse after `410f9ab4af`)
  - `test/workflow/guide-schema.test.mjs` (2)
  - Logs on fg-server2: `.fgos/runtime/tmp/keeper-final-gate/npm-reds-recheck.log` and `npm-test.log`.
  - The terminal-cutover and crash-matrix timeouts and the idle-lead test are in the row's notes; recheck them against the logs before leaving them out.
- **Done when:** the plan lands, and a rerun of those two files plus a full `npm test` on a clean worktree of main is green.
