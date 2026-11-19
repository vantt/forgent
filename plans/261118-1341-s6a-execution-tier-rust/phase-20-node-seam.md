# Phase 20: Node consumer seam; Execution Core Node deleted

Wave 9. Depends on: 17, 19. Effort 3d. Cut-over phase: run the re-sync step of the phase-lead rules first.

## Context

After phase 19 the host serves `fgos run`, the internal execution routes and the attempt steps, and
`src/native/execution-door.mjs` exists. The Node callers above tier 5 (phase 00 §2, every import and string hit
classed) still import `src/runner/execution/**`, `src/run-supervisor/**` and parts of `src/runner/dispatch/**`. This
phase moves every one onto a door (P4, P14, P15, P18) and deletes `src/runner/execution/**` and `src/run-supervisor/**`.

## Requirements

- `host` class, Workflow: `src/workflow/runner.mjs` calls `runUnitInHost` with the same options object it gives
  `runUnit` today (`:158-176`, call `:177`, `custody-predecessor-unknown` branch `:179`) and its existing port; `onCaseAdmitted` records `recordScheduled` after a granted admit
  (V18). On `{ unsettled }` it settles nothing: the reservation stays live and the existing `releaseDeadReservations`
  (`src/workflow/case-runtime.mjs:104-112`) decides it under the advance hold with `reservationDead`'s proof (custody +
  unit-run record, `:74-80`), never a blind `releasedUnitRunSettle` (P16, F5). `src/workflow/case-gate.mjs` custody and
  verify call `executionOp('custody'|'verify', ...)`.
- `host` class, Work callers (P14, V2): `src/runner/operation-choice.mjs:2327-2342`, `src/runner/work-dispatch.mjs:129-144`,
  `src/runner/fanout-batch.mjs:98-108` replace `runUnit(` with `runUnitInHost(` (same options, same port built from
  `createCaseAdmissionPort`), and `src/session-host/head-start.mjs:135` replaces the `launchSessionAttempt` import with
  `launchSessionInHost`. Only the call site and its import change; no other Work logic is edited; `fgos run` argv is
  not widened. `src/runner/loop.mjs:103` `sweepAttempts` (call `:1309`) and `src/session-rotation/rotate.mjs:27` and `src/session-host/head-stop.mjs:10` `requestCancel` call
  `executionOp('sweep-attempts'|'cancel', ...)`. Binding helpers (`loop.mjs:83`, `head-start.mjs:121` `bind`) switch to
  the door phase 00 names (S5's seat-binding client or the addon).
- `addon` class (P4b, P15): an addon `execution` namespace (`packages/git/node-addon/src/execution.rs`,
  `versions().execution`, `src/native/door.mjs` ABI check) over `fgos-execution`, `fgos-config`, `fgos-holder-lock`,
  `fgos-durable-file` and `fgos-run-supervisor` (`default-features = false, features = ["lease"]`; added to
  `packages/git/node-addon/Cargo.toml`) serves the pure helpers phase 00 lists (`validateUnit`, write-scope checks,
  outcome predicates, case paths, pattern lookup, seat checks, handoff refs), `loadRunnerConfigForDir` with
  `RunnerConfigError` codes (6c), and the effectful reads `custodyHeld`, `unitRunFacts`, `judgeUnitRun` (6c judgements
  over files, holder lists and the lease inspection). `src/native/execution-door.mjs` re-exports them with the Node
  names, so a caller changes only its import line.
- `config` class (V5): every `loadRunnerConfigForDir` caller (`src/workflow/{case-gate,runner,propose,case-start}.mjs`,
  `bin/fgos-runner.mjs:25`, `src/runner/{operation-choice,fanout-batch}.mjs`, `src/session-host/head-start.mjs:140`,
  `src/runner/agent-definitions.mjs:21` for `RunnerConfigError`) imports it from `src/native/execution-door.mjs`; no
  switch to `src/config/facade.mjs` (it lacks the checks, `facade.mjs:81`). `bin/fgos.mjs`'s own imports are phase 21's.
  The door row "locate and read a project config file" moves its allowed path in phase 21 with the file.
- `move-up` class: `git mv` into the one consuming layer; one copy, no twin.
- `script` class: `scripts/lib/mailbox-live-confined.mjs` (bwrap prepare, resources, credential expiry),
  `scripts/backfill-unit-summaries.mjs`, `scripts/record-mailbox-hook-fixtures.mjs:1188` (worker-session boot) switch
  to the door phase 00 names (addon or host route), or the script is deleted if its job is gone (report).
- `src/verbs/state/read.mjs`, `src/report/capability-plan-lint.mjs`,
  `src/cli/verb-exit.mjs`, `src/runner/{work-compat,operation-capability}.mjs`, `src/setup/*` remaining imports switch
  per their class (`src/portfolio/open-questions.mjs` is gone: deleted by the owner-question store, `1cabfe384`).
- Importers added on main since the plan base (scan on `f031ab0c8`): `src/session-host/head-request.mjs:25-28`
  (`assignmentDir`, write-scope checks, `readStoredUnitSummary`, `unitRunFacts`; head request door, `9d2c0abd8`/
  `e28f71949`) and `src/session-host/head-stop.mjs:10` (`requestCancel`, `e28f71949`) switch per their class (import
  lines only; the write-scope checks go to the addon write-scope namespace, `0b51fb44c`).
- Files that phase 21 owns but that import the two directories this phase deletes switch those imports here (import
  lines only): `bin/fgos.mjs:57` (`enableCancelOnSignal`), `:2384` (`runUnit` in the dispatch arm), `:3371` and `:3418`
  (`resolveGitRoots` in the `session` and `request` arms), `:3724` (`DispatchError`) (`:2274` is phase 02's
  `capability-config.mjs` move, `:2497-2498` phase 19's `run` arm); `src/verbs/dispatch/show-run.mjs:20-21` and
  `src/verbs/dispatch/recover.mjs:24,28` (`adoptRun`, `currentGeneration`, `controlDirs`, `deriveUnitState`); and
  `scripts/git/e3-bench.mjs:297` (string path `src/runner/execution/commit-unit-work.mjs`, caught by step 4's
  anchored check).
- Delete `src/runner/execution/**` and `src/run-supervisor/**`, and the recorders under `test/golden-recorders/` whose
  only Node source was there (vectors stay). Same change (V4): manifest tier/layer entries, and every `doors`
  `allowed`/`debt` entry naming a deleted file ("list run directories (twin)": `client.mjs`, `case-run-paths.mjs`;
  "process facts: read /proc": `runtime-dir.mjs`; "canonical JSON bytes" and "agent hook table": `trust-store.mjs`;
  "the raw capability section ...": `execution/run.mjs`; S5 rows "the Node bind facade has only its named callers"
  (`execution/{run,dry-bind,account-pin,unit-run-start,account-rotation}.mjs`) and "derive executor facts"
  (`execution/{run,seat-resolver}.mjs`); line numbers in `reports/facts-part-b.md` §5). Node tests under
  `test/runner/execution/**`, `test/run-supervisor/**`, `test/workflow/**` and `test/helpers/{run-unit-with-port,run-unit-repo-fixture,declared-assignment,ownership-marker,work-seat-config}.mjs`,
  the test importers outside those directories (scan on `f031ab0c8`): `test/cli/execution-outcome-exit-codes.test.mjs`,
  `test/cli/fgos-manifest.test.mjs`, `test/convention/seat-id.test.mjs`, `test/portfolio/work-questions.test.mjs`,
  `test/seat-binding/client.test.mjs`, `test/verbs/dispatch-recovery.test.mjs` (its `run-supervisor/run-lock.mjs`
  import), and the other files phase 00 §6 assigns here are retired, switched or moved (report table).
- P11: delete `src/seat-binding/client.mjs` if phase 17 found no remaining caller.

## Steps

1. Re-sync from main; report table.
2. Red: the Workflow peer wiring test (incl. "child killed after admit and before settle: the reservation stays live
   and the dead-reservation sweep decides it"); one Work call-site wiring test (`operation-choice` runs a unit through
   the host and gets the same result shape); a workflow case step end to end through the host.
3. Switch callers class by class; delete directories; regenerate census and suite baseline.
4. Rerun `test/golden-recorders/seam-scan.mjs` and the phase 00 string scan: no hit into `src/runner/execution/` or
   `src/run-supervisor/` outside them. Anchored check (V16):
   `rg -n -e "src/(runner/execution|run-supervisor)/" -e "\.\./run-supervisor/" -e "'\./execution/" src bin scripts`
   returns nothing.

## Validation

Acceptance 2 path checks for the two directories; `node scripts/run-tests.mjs` over `test/workflow/**`,
`test/runner/loop*.test.mjs`, `test/runner/operation-choice.test.mjs`, `test/session-host/head-start.test.mjs` and every
test importing a switched file; `test/architecture.test.mjs`; lead-rules gates.

## Risk and rollback

Risk: Workflow or Work runs slower (a process per unit). Measure one case and one Work step before and after (report).
Risk: peer deadlock: the server reads the child's stdout continuously and answers on stdin; stderr drained
concurrently. Risk: the dead-reservation proof cannot tell a settled committed run from a never-started one
(`case-runtime.mjs:73-79` releases both as not-started); this exists today when Workflow itself dies, so RUL104 keeps
it and the phase report files it as a backlog row. Rollback: revert the phase (directories return; phase 19 still
serves the verb).
