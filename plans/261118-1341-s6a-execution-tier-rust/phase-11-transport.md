# Phase 11: transport base (adapters, worker sessions, visibility)

Wave 3. Depends on: 3, 5; plan 1045 phase 6 on `main` (met: `47165e3bf`, `e030632ca`, `52af20744`, `2dbabb340`). Effort 1.75d. Library only (engine module `transport`).
Split by file on `f031ab0c8` (P20; the old phase was 3 026 Node lines): this phase ports the lower half (8 files,
1 528 lines); [phase 11b](phase-11b-transport-round.md) ports the files that import it (5 files, 1 498 lines) in wave 4.
The cut follows the Node import direction inside the old group: `transport.mjs` imports `provider-adapter.mjs`,
`adapters.mjs`, `terminal-slot.mjs`; `herdr-round.mjs` imports `visibility-session.mjs`, `worker-home.mjs`,
`worker-session-boot.mjs`, `terminal-slot.mjs`; `runtime-inspection.mjs` and `attention-view.mjs` import
`visibility-session.mjs`; no file here imports a file of 11b.

## Context

`src/runner/dispatch/`: `adapters.mjs` (151: `CASE_ID_ENV` `:87`, `currentDispatchDepth` `:95`), `provider-adapter.mjs`
(337: `familyOf` `:70`, `extractPolicyShapedFlags` `:151`), `visibility-session.mjs` (283: `classifyRunOutcome` `:189`,
`findRunningRuns` `:221`, `reconcileRun` `:249`), `terminal-slot.mjs` (103, `resolveHerdrBin`), `worker-session.mjs`
(112), `worker-session-boot.mjs` (224), `worker-home.mjs` (223), `mechanism.mjs` (95). Not here (phase 11b):
`transport.mjs`, `herdr-round.mjs`, `session-attempt.mjs`, `runtime-inspection.mjs`, `attention-view.mjs`. Behaviour
added on `main` since `b5b237534` that the port must carry (re-sync rule): the bypass-acceptance seeding of a private
claude config dir (`seedBypassAcceptance`, `BYPASS_ACCEPTANCE_SETTINGS` in `worker-home.mjs`, used by
`herdr-round.mjs`); every project `.fgos` join through `fgosDirFromRoot` of `src/util/fgos-file-registry.mjs`
(`691255ad0`). Terminal-control and session-host crates are the lower doors (`fgos-terminal-control`,
`fgos-session-host`). Herdr is the default transport (AGENTS.md "Dispatch"). `familyOf` has its Rust owner
`fgos-execution::executor_model::family_of` (`packages/execution/rust/src/executor_model.rs:236`); door row "derive
executor facts" (`retiredBy: S6a`) lists `provider-adapter.mjs` and `mechanism.mjs` as twins.

## Requirements

- `packages/execution/engine/src/transport/` ports them over `fgos-terminal-control` and `fgos-session-host`;
  `familyOf` and similar executor facts come from `fgos-execution` (S5 executor model), never a second copy. The
  module exposes what 11b's `transport_round` needs (adapter flags, dispatch depth, terminal slot, worker home and
  session boot, run visibility); 11b adds nothing to it.
- `stop-processes-inside` is not ported here (F14): phase 02 moved the Node module to `src/native/` over the addon
  `process` namespace for the scripts and tests; the engine stops processes through `fgos-process` directly.
- Golden vectors under `packages/execution/contracts/transport/` for the pure decisions (mechanism, adapter flags,
  outcome classification, home layout) recorded by `test/golden-recorders/transport.recorder.mjs`.

## Footprint

`packages/execution/engine/src/transport/**`, `packages/execution/engine/tests/transport.rs`,
`packages/execution/contracts/transport/**`, `test/golden-recorders/transport.recorder.mjs`.

## Steps

Commit the recorder; record vectors; red `engine/tests/transport.rs`; port; green; report.

## Validation

`cargo test -p fgos-execution-engine --test transport`; clippy; msvc (terminal mode reports `terminal-mode-unsupported`)
and aarch64-apple-darwin check.

## Risk and rollback

Risk: outcome classification drifts (`classifyRunOutcome`), which inspection and the round both read. Vectors assert
every class. Rollback: revert (11b depends on this phase; revert 11b first).
