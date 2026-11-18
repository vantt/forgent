# Phase 21: dispatch subs native; Dispatch Node deleted

Wave 10. Depends on: 20. Effort 2d. Cut-over phase: run the re-sync step of the phase-lead rules first.

## Context

`fgos dispatch` has `decide`, `explain` native (S5); the rest is Node: `probe-account`, `probe-session`, `reconcile`,
`inspect`, `show-run`, `watch`, `recover` (`src/verbs/dispatch/{inspect,reconcile,watch,show-run,recover}.mjs`, 817
lines; `src/runner/dispatch/cli.mjs` 361 with the `execute`/`log` refusal tombstones; `src/runner/dispatch.mjs` the
`node src/runner/dispatch.mjs ...` alias). `bin/fgos.mjs:51-91` imports the config loader, `RunnerConfigError`,
`enableCancelOnSignal` and the five use cases; dynamic imports at `bin/fgos.mjs:2127,2314,3450,3687,3775` (V1). Engine
modules: accounts (probes), transport (`runtime-inspection`, `visibility-session`, `attention-view`), planning
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
  "tool lookup by capability" (`tool-providers.mjs`, job text), and S5's twin rows for these files. A row whose job
  is gone is left to phase 22 to close.
- Tests: `cli_tests.rs` one wiring case per sub; `test/cli/dispatch-*.test.mjs`, `test/runner/dispatch*.test.mjs`,
  `test/runner/dispatch/**`, `test/verbs/dispatch-*.test.mjs` and the other files phase 00 §6 assigns here retired to
  their Rust owners (report table); parity table per sub (integration only).

## Steps

1. Re-sync from main; report table.
2. Red cli cases and parity; wire; flip routes; delete Node; doors edits; retire tests; gates.
3. Rerun `test/golden-recorders/seam-scan.mjs` and the string scan: no hit into any deleted path. Anchored check
   (V16): `rg -n -e "src/(runner/execution|run-supervisor|runner/dispatch|verbs/dispatch)/" -e "src/runner/dispatch\.mjs" -e "\.\./run-supervisor/" -e "'\./(execution|dispatch)/" src bin scripts`
   returns nothing.

## Validation

`cargo test -p fgos --test cli_tests dispatch`; parity; acceptance 1 and 2 checks of `plan.md`; step 3 empty;
`test/architecture.test.mjs`; lead-rules gates.

## Risk and rollback

Risk: `recover --action adopt` on a Node-era attempt. Landing precondition nothing in flight in this repo; corpus
adopt fixture; CHANGELOG upgrade line for other projects (phase 22). Rollback: revert the phase.
