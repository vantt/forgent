# Phase 11: transport and worker sessions

Wave 3. Depends on: 3, 5; plan 1045 phase 6 on `main`. Effort 2.5d. Library only (engine module `transport`).

## Context

`src/runner/dispatch/`: `transport.mjs` (300, `resolveHerdrBin`), `herdr-round.mjs` (600), `worker-session.mjs`,
`worker-session-boot.mjs`, `visibility-session.mjs` (283: `findRunningRuns`, `classifyRunOutcome`, `reconcileRun`),
`terminal-slot.mjs`, `worker-home.mjs` (222), `adapters.mjs` (151: `currentDispatchDepth`, `CASE_ID_ENV`),
`provider-adapter.mjs` (337: `familyOf`, `extractPolicyShapedFlags`), `session-attempt.mjs`, `mechanism.mjs`,
`stop-processes-inside.mjs` (82), `runtime-inspection.mjs`, `attention-view.mjs`. Terminal-control and session-host
crates are the lower doors (`fgos-terminal-control`, `fgos-session-host`); the handover goes through phase 05's
controller `launch`. Herdr is the default transport (AGENTS.md "Dispatch").

## Requirements

- `packages/execution/engine/src/transport/` ports them over `fgos-terminal-control`, `fgos-session-host` and
  `fgos-run-supervisor::controller`; `familyOf` and similar executor facts come from `fgos-execution` (S5 executor
  model), never a second copy.
- `stop-processes-inside` (used by `scripts/run-tests.mjs`, the test watchdog and the dev host) lands here or, if phase
  00 finds `fgos-process` already has the job, is replaced by that door (one door); phase 20 switches the scripts.
- Golden vectors `packages/execution/contracts/transport.v1.json` for the pure decisions (mechanism, adapter flags,
  outcome classification); an integration test drives a direct-mode attempt end to end with a stub agent binary.

## Steps

Read 1045 P6 as landed. Record vectors; red `engine/tests/transport.rs`; port; green; report.

## Validation

`cargo test -p fgos-execution-engine --test transport`; clippy; msvc (terminal mode reports `terminal-mode-unsupported`)
and aarch64-apple-darwin check.

## Risk and rollback

Risk: herdr pane lifecycle differs (pane left open, or closed early). Port as is; the integration test checks the
allocation record. Rollback: revert.
