# Phase 21: dispatch subs native; Dispatch Node deleted

Wave 9. Depends on: 20. Effort 2d.

## Context

`fgos dispatch` has `decide`, `explain` native (S5); the rest is Node: `probe-account`, `probe-session`, `reconcile`,
`inspect`, `show-run`, `watch`, `recover` (`src/verbs/dispatch/{inspect,reconcile,watch,show-run,recover}.mjs`, 817
lines; `src/runner/dispatch/cli.mjs` 361 with the `execute`/`log` refusal tombstones; `src/runner/dispatch.mjs` the
`node src/runner/dispatch.mjs ...` alias). `bin/fgos.mjs:51-91` imports the config loader, `RunnerConfigError`,
`enableCancelOnSignal` and the five use cases. Engine modules: accounts (probes), transport
(`runtime-inspection`, `visibility-session`, `attention-view`), assignment runner (recovery and reconciliation
planners), run result (show-run readers).

## Requirements

- `apps/fgos/src/wiring/dispatch_subs.rs`: each sub native, argv and envelope unchanged (phase 00 copies the flag
  tables); `recover --action` keeps `mutates_store`; `recover` offers only `adopt` (component-boundary row).
- Routes: every `dispatch` sub native (or `dispatch.route_kind` native); regenerate; `test/rust-host/command-routes.test.mjs`.
- `bin/fgos.mjs`: dispatch arms and the tier-5 imports at `:51-91` go; `loadRunnerConfigForDir` and `RunnerConfigError`
  uses left in `bin/fgos.mjs` switch to the config facade / moved error (phase 20's choice); `enableCancelOnSignal`
  goes with its arm or switches to the internal `cancel` route.
- Delete `src/verbs/dispatch/**`, `src/runner/dispatch/**` (everything left after phases 15-20; phase 00's port map
  says each file's deleter), `src/runner/dispatch.mjs`, the alias's live mentions; the `execute`/`log` tombstones go
  with `cli.mjs` (hand-off).
- Tests: `cli_tests.rs` one case per sub; `test/cli/dispatch-*.test.mjs`, `test/runner/dispatch*.test.mjs`,
  `test/runner/dispatch/**` and the other Node dispatch tests retired to their Rust owners (report table); parity table
  per sub (integration only).

## Steps

Red cli cases and parity; wire; flip routes; delete Node; retire tests; gates.

## Validation

`cargo test -p fgos --test cli_tests dispatch`; parity; acceptance 1 and 2 checks of `plan.md` for
`src/runner/dispatch`, `src/verbs/dispatch`; `rg -n "runner/dispatch" src bin scripts` empty; lead-rules gates.

## Risk and rollback

Risk: `recover --action adopt` on a Node-era attempt. Landing precondition nothing in flight; parity includes an
adopt fixture. Rollback: revert the phase.
