# Phase 11: transport and worker sessions

Wave 3. Depends on: 3, 5; plan 1045 phase 6 on `main` (met: `47165e3bf`, `e030632ca`, `52af20744`, `2dbabb340`). Effort 2.5d. Library only (engine module `transport`).

## Context

`src/runner/dispatch/`: `transport.mjs` (300, re-exports `resolveHerdrBin` from `terminal-slot.mjs` `:34,67`),
`herdr-round.mjs` (631), `worker-session.mjs` (112), `worker-session-boot.mjs` (224), `visibility-session.mjs` (283:
`classifyRunOutcome` `:189`, `findRunningRuns` `:221`, `reconcileRun` `:249`), `terminal-slot.mjs` (103),
`worker-home.mjs` (223), `adapters.mjs` (151: `CASE_ID_ENV` `:87`, `currentDispatchDepth` `:95`),
`provider-adapter.mjs` (337: `familyOf` `:70`, `extractPolicyShapedFlags` `:151`), `session-attempt.mjs` (160,
`launchSessionAttempt`, which the head launch imports dynamically at `src/session-host/head-start.mjs:135-136`; phase 19
serves it as the internal `launch-session` op), `mechanism.mjs` (95), `runtime-inspection.mjs` (298),
`attention-view.mjs` (109). Behaviour added on `main` since `b5b237534` that the port must carry (re-sync rule):
head grants `mailbox` and `peers` in `session-attempt.mjs` `requirementOf` (now exported) and `headOf(env)` for the
envelope's `session` Identity (`90757718a`, `42e7a0c3c`, `fd59f3445`, `6b3a4dfcf`, `7185f8375`, `ae00671c9`);
`herdr-round.mjs` backend `delivery` (`rootWorkspaceAllowed`, `backendDelivers`) and the bypass-acceptance seeding of a
private claude config dir (`seedBypassAcceptance`, `BYPASS_ACCEPTANCE_SETTINGS` from `worker-home.mjs`);
`attention-view.mjs` contract version 2 with Observe-definition rows and `unmeasured` (`b67e22e97`, `7707c26ad`;
the definitions come from an injected host `metrics query --def` call); every project `.fgos` join through
`fgosDirFromRoot` of `src/util/fgos-file-registry.mjs` (`691255ad0`). Terminal-control and session-host
crates are the lower doors (`fgos-terminal-control`, `fgos-session-host`); the handover goes through phase 05's
controller `launch`. Herdr is the default transport (AGENTS.md "Dispatch"). `familyOf` has its Rust owner
`fgos-execution::executor_model::family_of` (`packages/execution/rust/src/executor_model.rs:236`); door row "derive
executor facts" (`retiredBy: S6a`) lists `provider-adapter.mjs` and `mechanism.mjs` as twins.

## Requirements

- `packages/execution/engine/src/transport/` ports them over `fgos-terminal-control`, `fgos-session-host` and
  `fgos-run-supervisor::controller`; `familyOf` and similar executor facts come from `fgos-execution` (S5 executor
  model), never a second copy.
- `stop-processes-inside` is not ported here (F14): phase 02 moved the Node module to `src/native/` over the addon
  `process` namespace for the scripts and tests; the engine stops processes through `fgos-process` directly.
- Golden vectors under `packages/execution/contracts/transport/` for the pure decisions (mechanism, adapter flags,
  outcome classification) recorded by `test/golden-recorders/transport.recorder.mjs`; an integration test drives a
  direct-mode attempt end to end with a stub agent binary.

## Steps

Read 1045 P6 as landed (`packages/run-supervisor/rust/src/lanes.rs`; the envelope's `lanes` is built by
`laneTransport`, `src/run-supervisor/direct-launch.mjs:308-311`). Commit the recorder; record vectors; red `engine/tests/transport.rs`; port; green; report.

## Validation

`cargo test -p fgos-execution-engine --test transport`; clippy; msvc (terminal mode reports `terminal-mode-unsupported`)
and aarch64-apple-darwin check.

## Risk and rollback

Risk: herdr pane lifecycle differs (pane left open, or closed early). Port as is; the integration test checks the
allocation record. Rollback: revert.
