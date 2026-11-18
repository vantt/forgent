# Phase 20: Node consumer seam; Execution Core Node deleted

Wave 8. Depends on: 17, 19. Effort 2.5d.

## Context

After phase 19 the host serves `fgos run`, the internal execution routes and the attempt steps. The Node callers above
tier 5 (planner scan §2; phase 00 section 2 classes each symbol) still import `src/runner/execution/**`,
`src/run-supervisor/**` and parts of `src/runner/dispatch/**`. This phase moves every one of them onto a door (P4)
and deletes `src/runner/execution/**` and `src/run-supervisor/**`.

## Requirements

- `host` class: `src/workflow/runner.mjs` spawns `fgos run --unit <file> --json --admission-fd 3` asynchronously
  (never `spawnSync`) and serves the four port operations from its existing port over fd 3; on child exit without
  `settle` it settles with `releasedUnitRunSettle`. `src/workflow/case-gate.mjs` custody and verify,
  `src/runner/loop.mjs:104` `sweepAttempts`, `src/session-rotation/rotate.mjs:27` `requestCancel` call
  `fgos internal execution <op> --protocol 1` through the host-spawn code `src/seat-binding/client.mjs` already uses
  (host resolution through `src/util/host-bin-path.mjs`, protocol check, `host-version-mismatch`). No new client
  module: if more than one caller needs it, phase 00 names where that existing code moves (tier 0), as a move.
- `addon` class: an addon `execution` namespace over `fgos-execution` (`packages/git/node-addon/src/execution.rs`,
  `versions().execution`, `src/native/door.mjs` ABI check) serves `validateUnit`, write-scope checks, outcome
  predicates, case paths, pattern lookup, seat checks and the other pure helpers phase 00 lists.
- `move-up` class: `git mv` into the one consuming layer (for example `RunnerConfigError` into `src/workflow/` if only
  Workflow uses it after the cutovers); one copy, no twin.
- `config` class: `loadRunnerConfigForDir` callers (`src/workflow/{case-gate,runner,propose,case-start}.mjs`,
  `bin/fgos-runner.mjs`) switch to the config facade under `src/config/` (F0 "locate and read a project config file"
  door); `bin/fgos.mjs`'s own imports are phase 21's.
- `script` class: `scripts/run-tests.mjs`, `scripts/lib/test-file-watchdog.mjs`, `scripts/run-rust-dev-host.mjs`
  (stop-processes-inside), `scripts/lib/mailbox-live-confined.mjs` (bwrap prepare, resources, credential expiry),
  `scripts/backfill-unit-summaries.mjs` switch to the door phase 00 names (addon or host route), or the script is
  deleted if its job is gone (report).
- `src/verbs/state/read.mjs`, `src/runner/work-dispatch.mjs`, `src/portfolio/open-questions.mjs`,
  `src/report/capability-plan-lint.mjs`, `src/cli/verb-exit.mjs` switch per their class.
- Delete `src/runner/execution/**` and `src/run-supervisor/**`; manifest layer/tier entries and debt paths naming
  them removed; Node tests under `test/runner/execution/**`, `test/run-supervisor/**` retired to their Rust owners
  (report table); one Node wiring test in `test/workflow/` for the peer (incl. "child dies between admit and settle:
  the reservation is released").
- P11: delete `src/seat-binding/client.mjs` if phase 17 found no remaining caller.

## Steps

1. Red: the workflow peer wiring test; a test that runs a workflow case step end to end through the host.
2. Switch callers class by class; delete directories; regenerate census and suite baseline.
3. `rg -n "runner/execution/|run-supervisor/" src bin scripts` must return only `src/util/payload-root.mjs`-free hits
   of other paths (i.e. nothing).

## Validation

Acceptance 2 path checks for the two directories; `node scripts/run-tests.mjs` over `test/workflow/**`,
`test/runner/loop*.test.mjs`, every test importing a switched file; `test/architecture.test.mjs`; lead-rules gates.

## Risk and rollback

Risk: Workflow case runs slower (a process per unit) or deadlock on fd 3. Measure one case before and after (report);
the parent reads fd 3 asynchronously. Rollback: revert the phase (directories return; phase 19 still serves the verb).
