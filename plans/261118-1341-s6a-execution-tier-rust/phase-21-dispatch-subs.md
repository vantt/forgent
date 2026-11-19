# Phase 21: dispatch subs native; Dispatch Node deleted

Wave 10. Depends on: 11b, 20. Effort 2.5d. Cut-over phase: run the re-sync step of the phase-lead rules first.

## Context

`fgos dispatch` has `decide`, `explain` native (S5); the rest is Node: `probe-account`, `probe-session`, `reconcile`,
`inspect`, `show-run`, `watch`, `recover` (`src/verbs/dispatch/{inspect,reconcile,watch,show-run,recover}.mjs`, 839
lines on `f031ab0c8`; `src/runner/dispatch/cli.mjs` 355 with the `execute`/`log` refusal tombstones; `src/runner/dispatch.mjs` the
`node src/runner/dispatch.mjs ...` alias). `bin/fgos.mjs:51-91` imports the config loader, `RunnerConfigError`,
`enableCancelOnSignal` (`:57`, switched by phase 20 with `src/run-supervisor/`) and the five use cases; dynamic
imports into `src/runner/dispatch/` at `bin/fgos.mjs:2118,2372,2377,2383,3636` (V1; on `f031ab0c8`; the execution and
run-supervisor ones at `:2384,3371,3418,3724` are phase 20's, `:2274` phase 02's, `:2497-2498` phase 19's).
`inspect --attention` also runs the project's `core/attention/definitions` through the host's `metrics query --def`
(`src/verbs/dispatch/inspect.mjs`, `b67e22e97`). Engine
modules: accounts (probes), transport (`runtime-inspection`, `visibility-session`, `attention-view`; the native `inspect --attention` asks Observe
for the definitions in process instead of spawning `metrics query`), planning
(recovery and reconciliation planners), run result (show-run readers).

This phase also deletes the 30 files of `src/runner/execution/` and `src/run-supervisor/` that phase 20 could not
(phase 00 §1, finding D1: Node `src/runner/dispatch/**` and `src/verbs/dispatch/**` import them, directly or
transitively, e.g. `assignment-runner.mjs:10,13,44,46,47,69,92-96`, `plan.mjs:19-22`, `recover.mjs:24,28`,
`show-run.mjs:20`), so after this phase both directories are gone:

- `src/runner/execution/` (17): `account-rotation.mjs`, `bind.mjs`, `legacy-seat-read.mjs`, `loops/debate.mjs`, `loops/index.mjs`, `loops/panel.mjs`, `loops/reviewed.mjs`, `loops/role-tasks.mjs`, `loops/solo.mjs`, `loops/verify.mjs`, `outcome.mjs`, `patterns/retired-keys.mjs`, `seat-ledger.mjs`, `seat-resolver.mjs`, `unit-control.mjs`, `unit-run-history.mjs`, `unit-state.mjs`.
- `src/run-supervisor/` (13): `cancel-registry.mjs`, `client.mjs`, `cwd-lock.mjs`, `direct-launch.mjs`, `dispatch-error.mjs`, `gate-kill-grace.mjs`, `protocol.mjs`, `run-lock.mjs`, `runtime-dir.mjs`, `steps/cleanup-trust.mjs`, `stray-writes.mjs`, `trust-store.mjs`, `worker-artifacts.mjs`.

## Requirements

- `apps/fgos/src/wiring/dispatch_subs.rs`: each sub native, argv and envelope unchanged (phase 00 copies the flag
  tables); `recover --action` keeps `mutates_store`; `recover` offers only `adopt` (component-boundary row). Readers
  (`show-run`, `inspect`, `reconcile`, `recover`) replay the phase 00 corpus, incl. the open Node-era attempt and the
  adopt fixture (F13).
- Routes: every `dispatch` sub native (or `dispatch.route_kind` native); regenerate; `test/rust-host/command-routes.test.mjs`.
- `bin/fgos.mjs`: dispatch arms, the static tier-5 imports at `:51-91` and the dynamic ones go (incl. `:3724`
  `DispatchError` from `src/run-supervisor/dispatch-error.mjs`, left by phase 20);
  `loadRunnerConfigForDir` and `RunnerConfigError` uses left in `bin/fgos.mjs` import from
  `src/native/execution-door.mjs` (phase 20's door); `enableCancelOnSignal` goes with its arm or switches to the
  `cancel` op.
- Delete `src/verbs/dispatch/**`, `src/runner/dispatch/**` (everything left after phases 15-20; phase 00's port map
  says each file's deleter), the 30 Execution Core files above (then `src/runner/execution/` and `src/run-supervisor/`
  are empty and removed), `src/runner/dispatch.mjs`, the alias's live mentions; the `execute`/`log` tombstones go
  with `cli.mjs` (hand-off); the remaining recorders under `test/golden-recorders/` (vectors stay).
- Same change (V4): manifest tier/layer entries and every `doors` `allowed`/`debt` entry naming a deleted file:
  "locate and read a project config file" (`dispatch/config.mjs`), "global fgOS directory" (`llm-accounts.mjs`,
  `probes/harness.mjs`), "process control: signal a process or group" (`provider-credential-probe.mjs`), "process
  facts: read /proc" (`bwrap.mjs`, `probes/harness.mjs`), "canonical JSON bytes" (`recovery-planner.mjs`,
  `effective-execution-contract.mjs`), "list run directories (twin)" (`assignment-layout.mjs`), "agent hook table"
  (`worker-home.mjs`), "choose an executor ... purposeSeatOf" (`dispatch/config.mjs`, job text naming `plan.mjs`),
  "tool lookup by capability" (`tool-providers.mjs`, job text), "the footprint and write-scope overlap rule" (debt
  `dispatch/write-scope.mjs`, row added by `3c7dbf905`; its `retiredBy` is met when the file goes), and S5's rows
  "the Node bind facade has only its named callers" (`dispatch/{plan,assignment-runner}.mjs`), "derive executor
  facts" (eight `dispatch/` files) and "decide a dispatch" (`dispatch/plan.mjs`); and, for the 30 Execution Core files
  (left by phase 20): "list run directories (twin)" (`run-supervisor/client.mjs`), "process facts: read /proc"
  (`runtime-dir.mjs`), "canonical JSON bytes" and "agent hook table" (`trust-store.mjs`), "the Node bind facade has
  only its named callers" (`execution/{bind,account-rotation}.mjs`), "derive executor facts" (`execution/seat-resolver.mjs`); line numbers in
  `reports/facts-part-b.md` §5. A row whose job
  is gone is left to phase 22 to close.
- Tests: `cli_tests.rs` one wiring case per sub; `test/cli/dispatch-*.test.mjs`, `test/runner/dispatch*.test.mjs`,
  `test/runner/dispatch/**`, `test/verbs/dispatch-*.test.mjs`, the test importers outside those directories (scan on
  `f031ab0c8`): `test/config/facade.test.mjs`, `test/holder-lock/windows-borrow.test.mjs`,
  `test/holder-lock/driver-unavailable.test.mjs` (string path), `test/live/mailbox-wake-probe.live.mjs`,
  `test/seat-binding/client.test.mjs`, `test/session-identity/attempt-writer-id.test.mjs`,
  `test/state/work-size-rigor.test.mjs`, `test/util/session-identity.test.mjs`, `test/git/write-scope-parity.test.mjs`
  (reads `dispatch/write-scope.mjs`), `test/scripts/write-wrapper-script.test.mjs` (fixture text
  `node "$root/src/runner/dispatch.mjs" execute` at `:51`, data only: reword or keep, report),
  `test/cli/{execution-outcome-exit-codes,fgos-manifest}.test.mjs` (`execution/outcome.mjs`),
  `test/verbs/dispatch-recovery.test.mjs`; the tests of the 30 Execution Core files: `test/runner/execution/**` files
  importing them, the 13 files of `test/run-supervisor/` whose imports die here (`adopt-client`, `bwrap-driver`,
  `cancel-registry`, `direct-crash-matrix`, `direct-cutover`, `inspect-recover-adopt`, `pane-host`, `prepare-seat`,
  `runtime-dir`, `sweep`, `terminal-groups`, `windows-custody` `.test.mjs`, `fixtures/terminal-controller.mjs`: 12 tests
  and the fixture; of phase 00's 14 importers there, `attempt-steps.test.mjs` is phase 20's), the helpers that import only dispatch or these files
  (`test/helpers/{declared-assignment,ownership-marker,packaged-definitions,work-seat-config,executor-model-vectors.helper}.mjs`);
  and the other files phase 00 §6 assigns here retired to
  their Rust owners (report table); parity table per sub (integration only).

## Footprint

As the plan table row 21, which holds `src/runner/execution/**`, `src/run-supervisor/**`, `test/run-supervisor/**` and
`test/helpers/**` in addition to the dispatch paths.

## Steps

1. Re-sync from main; report table.
2. Red cli cases and parity; wire; flip routes; delete Node; doors edits; retire tests; gates.
3. Rerun `test/golden-recorders/seam-scan.mjs` and the string scan: no hit into any deleted path; `ls src/runner/execution
   src/run-supervisor` fails. Anchored check
   (V16; before it, drop the live mentions in `src/runner/agent-roster.mjs:3`, `src/report/authoritative-match.mjs:11`
   and `scripts/check-decision-citation-drift.baseline.json:37`, which it would otherwise hit): `rg -n -e "src/(runner/execution|run-supervisor|runner/dispatch|verbs/dispatch)/" -e "src/runner/dispatch\.mjs" -e "\.\./run-supervisor/" -e "'\./(execution|dispatch)/" src bin scripts`
   returns nothing.

## Validation

`cargo test -p fgos --test cli_tests dispatch`; parity; acceptance 1 and 2 checks of `plan.md`; step 3 empty;
`test/architecture.test.mjs`; lead-rules gates.

## Risk and rollback

Risk: `recover --action adopt` on a Node-era attempt. Landing precondition nothing in flight in this repo; corpus
adopt fixture; CHANGELOG upgrade line for other projects (phase 22). Rollback: revert the phase.
