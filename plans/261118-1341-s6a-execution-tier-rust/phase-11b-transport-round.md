# Phase 11b: transport round, session attempt and run inspection

Wave 4. Depends on: 11; plan 1045 phase 6 on `main` (met: `47165e3bf`, `e030632ca`, `52af20744`, `2dbabb340`). Effort 1.25d. Library only (engine module `transport_round`).
Split by file from the old phase 11 on `f031ab0c8` (P20; 3 026 Node lines): 5 files, 1 498 lines; each imports the
lower half that [phase 11](phase-11-transport.md) ports (`transport.mjs` -> `provider-adapter.mjs`, `adapters.mjs`,
`terminal-slot.mjs`; `herdr-round.mjs` -> `visibility-session.mjs`, `worker-home.mjs`, `worker-session-boot.mjs`;
`runtime-inspection.mjs`, `attention-view.mjs` -> `visibility-session.mjs`).

## Context

`src/runner/dispatch/`: `transport.mjs` (300, re-exports `resolveHerdrBin` from `terminal-slot.mjs` `:34,67`),
`herdr-round.mjs` (631), `session-attempt.mjs` (160, `launchSessionAttempt`, which the head launch imports dynamically
at `src/session-host/head-start.mjs:135-136`; phase 19 serves it as the internal `launch-session` op),
`runtime-inspection.mjs` (298), `attention-view.mjs` (109). Consumers of the inspection half: `src/verbs/state/read.mjs:5`,
dispatch `inspect`/`watch`/`show-run` (phase 21), doctor `src/setup/terminal-control-checks.mjs:13` (phase 17).
Behaviour added on `main` since `b5b237534` that the port must carry (re-sync rule): head grants `mailbox` and `peers`
in `session-attempt.mjs` `requirementOf` (now exported) and `headOf(env)` for the envelope's `session` Identity
(`90757718a`, `42e7a0c3c`, `fd59f3445`, `6b3a4dfcf`, `7185f8375`, `ae00671c9`); `herdr-round.mjs` backend `delivery`
(`rootWorkspaceAllowed`, `backendDelivers`) and its use of the bypass-acceptance seeding (`worker-home.mjs`, phase 11);
`attention-view.mjs` contract version 2 with Observe-definition rows and `unmeasured` (`b67e22e97`, `7707c26ad`; the
definitions come from an injected host `metrics query --def` call); every project `.fgos` join through
`fgosDirFromRoot` (`691255ad0`). The handover goes through phase 05's controller `launch`.

## Requirements

- `packages/execution/engine/src/transport_round/` ports them over engine `transport` (phase 11),
  `fgos-terminal-control`, `fgos-session-host` and `fgos-run-supervisor::controller`; nothing of phase 11's module is
  copied. Run-result and assignment-layout readers that `runtime-inspection.mjs` and `visibility-session.mjs` use come
  from their owners (12, 13) through injected readers, as phase 11 does.
- The module line `pub mod transport_round;` and its `mod.rs` stub are phase 03's (skeleton); this phase writes only
  its own directory.
- Golden vectors under `packages/execution/contracts/transport-round/` (round decisions, session-attempt requirements
  incl. head grants, inspection and attention rows) recorded by `test/golden-recorders/transport-round.recorder.mjs`;
  an integration test drives a direct-mode attempt end to end with a stub agent binary (moved here from phase 11: it
  needs `transport.mjs`'s round).

## Footprint

`packages/execution/engine/src/transport_round/**`, `packages/execution/engine/tests/transport_round.rs`,
`packages/execution/contracts/transport-round/**`, `test/golden-recorders/transport-round.recorder.mjs`.

## Steps

Read 1045 P6 as landed (`packages/run-supervisor/rust/src/lanes.rs`; the envelope's `lanes` is built by
`laneTransport`, `src/run-supervisor/direct-launch.mjs:308-311`). Commit the recorder; record vectors; red
`engine/tests/transport_round.rs`; port; green; report.

## Validation

`cargo test -p fgos-execution-engine --test transport_round`; clippy; msvc (terminal mode reports
`terminal-mode-unsupported`) and aarch64-apple-darwin check.

## Risk and rollback

Risk: herdr pane lifecycle differs (pane left open, or closed early). Port as is; the integration test checks the
allocation record. Rollback: revert.
