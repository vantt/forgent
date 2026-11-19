# Phase 21: dispatch subs native; Dispatch Node deleted

Wave 10. Depends on: 20. Effort 2d. Cut-over phase: run the re-sync step of the phase-lead rules first.

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

## Requirements

- `apps/fgos/src/wiring/dispatch_subs.rs`: each sub native, argv and envelope unchanged (phase 00 copies the flag
  tables); `recover --action` keeps `mutates_store`; `recover` offers only `adopt` (component-boundary row). Readers
  (`show-run`, `inspect`, `reconcile`, `recover`) replay the phase 00 corpus, incl. the open Node-era attempt and the
  adopt fixture (F13).
- Routes: every `dispatch` sub native (or `dispatch.route_kind` native); regenerate; `test/rust-host/command-routes.test.mjs`.
- `bin/fgos.mjs`: dispatch arms, the static tier-5 imports at `:51-91` and the dynamic ones go;
  `loadRunnerConfigForDir` and `RunnerConfigError` uses left in `bin/fgos.mjs` import from
  `src/native/execution-door.mjs` (phase 20's door); `enableCancelOnSignal` goes with its arm or switches to the
  `cancel` op.
- Delete `src/verbs/dispatch/**`, `src/runner/dispatch/**` (everything left after phases 15-20; phase 00's port map
  says each file's deleter), `src/runner/dispatch.mjs`, the alias's live mentions; the `execute`/`log` tombstones go
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
  facts" (eight `dispatch/` files) and "decide a dispatch" (`dispatch/plan.mjs`); line numbers in
  `reports/facts-part-b.md` §5. A row whose job
  is gone is left to phase 22 to close.
- Tests: `cli_tests.rs` one wiring case per sub; `test/cli/dispatch-*.test.mjs`, `test/runner/dispatch*.test.mjs`,
  `test/runner/dispatch/**`, `test/verbs/dispatch-*.test.mjs`, the test importers outside those directories (scan on
  `f031ab0c8`): `test/config/facade.test.mjs`, `test/holder-lock/windows-borrow.test.mjs`,
  `test/holder-lock/driver-unavailable.test.mjs` (string path), `test/live/mailbox-wake-probe.live.mjs`,
  `test/seat-binding/client.test.mjs`, `test/session-identity/attempt-writer-id.test.mjs`,
  `test/state/work-size-rigor.test.mjs`, `test/util/session-identity.test.mjs`, `test/git/write-scope-parity.test.mjs`
  (reads `dispatch/write-scope.mjs`), and the other files phase 00 §6 assigns here retired to
  their Rust owners (report table); parity table per sub (integration only).

## Steps

1. Re-sync from main; report table.
2. Red cli cases and parity; wire; flip routes; delete Node; doors edits; retire tests; gates.
3. Rerun `test/golden-recorders/seam-scan.mjs` and the string scan: no hit into any deleted path. Anchored check
   (V16; before it, drop the live mentions in `src/runner/agent-roster.mjs:3`, `src/report/authoritative-match.mjs:11`
   and `scripts/check-decision-citation-drift.baseline.json:37`, which it would otherwise hit): `rg -n -e "src/(runner/execution|run-supervisor|runner/dispatch|verbs/dispatch)/" -e "src/runner/dispatch\.mjs" -e "\.\./run-supervisor/" -e "'\./(execution|dispatch)/" src bin scripts`
   returns nothing.

## Validation

`cargo test -p fgos --test cli_tests dispatch`; parity; acceptance 1 and 2 checks of `plan.md`; step 3 empty;
`test/architecture.test.mjs`; lead-rules gates.

## Risk and rollback

Risk: `recover --action adopt` on a Node-era attempt. Landing precondition nothing in flight in this repo; corpus
adopt fixture; CHANGELOG upgrade line for other projects (phase 22). Rollback: revert the phase.
