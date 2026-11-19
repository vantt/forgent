# Phase 19: Node seam, admission peer and payload launcher (first part of `fgos run` native)

Wave 8, first of three serial phases (19 -> 19b -> 19c). Depends on: 18; plan 1045 phase 6 on `main` (met: `done`, lane pool `47165e3bf`). Effort 3d. First verb cut-over: run the re-sync step of the
phase-lead rules first.

## Context

`fgos run` is a `legacy-cli` route today; its Node arm builds the request (`src/runner/execution/run-request.mjs`),
injects Workflow's `confinedWriteRefusal` and `activityUnitOf` (`case 'run'` at `bin/fgos.mjs:2496`, port injected
`:2499-2505`), builds the case-admission port
(`run-request.mjs:356`) and calls `runUnit`. After this phase the host serves it from engine `unit_run`. Node callers
of `runUnit` (Workflow, Work) still run the Node path until phase 20 switches them to the `run-unit` internal op. The
supervisor's attempt step (`packages/run-supervisor/rust/src/attempt_step.rs:89-116`, routed at `route.rs:188,200` and
`apps/fgos/src/main.rs:245`) still finds `node`; P9 moves it to a
host route composed from engine `steps`. The doctor bridge already starts a legacy-payload module over stdin/stdout
through `legacy_exec::payload_command` (`apps/fgos/src/wiring/doctor/bridge.rs:186-199`,
`apps/fgos/src/legacy_exec.rs:260`).

## Scope after the split (lead decision 2026-11-19)

One pass delivered only the Node seam, so this phase keeps what it landed (commit `2c7d015bb` on `s6/p19`) and the rest moved to
[19b](phase-19b-unit-run-host.md) (host composition) and [19c](phase-19c-run-route-flip.md) (route flip, internal ops).
Status stays `draft` until `land s6/p19` is on `main`; scope below is done as landed.

## Requirements (done as landed)

- `apps/fgos/src/legacy_exec.rs`: `payload_module_command`, the one launcher of a payload module the host talks to over
  stdin/stdout; `apps/fgos/src/wiring/doctor/bridge.rs` calls it with the same refusal texts. Every `NodeBridge::new()`
  caller is unchanged.
- `src/native/execution-door.mjs` (tier 0): `RunnerConfigError` and `CaseAdmissionRefusedError` declared once (the old modules
  `src/runner/dispatch/runner-config-error.mjs` and `src/runner/execution/case-admission-port.mjs` re-export them, so
  `instanceof` holds for in-process and rethrown errors; `src/runner/execution/run.mjs` re-exports as well), `serveAdmissionPeer`
  and `runUnitErrorOf` (rethrows a run-unit error result as its tagged class; engine classes of failed port/Git/record calls
  carry no `errorClass`, as Node's errors did).
- `src/workflow/admission-peer.mjs`: builds the Workflow case admission port and serves it to the host.
- `test/native/execution-door.test.mjs`: admission-peer and run-unit contract vectors replayed on the Node side, peer entry
  driven over its own stdin/stdout. Manifest entries in `docs/architecture-manifest.json`; census regenerated.

## Footprint

`apps/fgos/src/legacy_exec.rs`, `apps/fgos/src/wiring/doctor/bridge.rs`, `src/native/execution-door.mjs`,
`src/workflow/admission-peer.mjs`, `src/runner/execution/run.mjs`, `src/runner/dispatch/runner-config-error.mjs`,
`src/runner/execution/case-admission-port.mjs`, `test/native/execution-door.test.mjs`, `docs/architecture-manifest.json`,
`packages/git/contracts/mutation-census.v1.json` (generated).

## Validation

Doctor bridge tests green after the launcher move; `node scripts/run-tests.mjs test/native/execution-door.test.mjs
test/architecture.test.mjs`; `cargo test -p fgos`.

## Risk and rollback

Low: no route changes, no Node arm removed. Rollback: revert the phase.
