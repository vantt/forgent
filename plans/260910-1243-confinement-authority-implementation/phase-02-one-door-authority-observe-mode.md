# Phase 02 — One-Door Authority Observe Mode

Depends on: Phase 01 closed.

## Objective

Introduce `executeThroughConfinement(request, adapterPort)` as the only runtime
door to external executor adapters. In this phase the door may observe and
attest legacy/unconfigured routes, but production dispatch call sites must stop
executing adapters directly.

## Requirements

- R1: Create `src/runner/dispatch/confinement/authority.mjs` with
  `executeThroughConfinement(request, adapterPort)`.
- R2: Authority request construction happens after executor resolution and
  `runDir` allocation, at the seam identified by the spec, before adapter spawn.
- R3: Move adapter execute-handle lookup into the Authority path. Callers may
  pass adapter identity/metadata, but not call `EXECUTOR_ADAPTERS[adapter]`
  directly in production dispatch.
- R4: Route both `spawnWorker` and `executeExecutorCli` through the same facade.
- R5: Preserve current external result shape: successful dispatch still returns
  the existing `ExecutorResult`, with confinement attestation attached where the
  caller can carry it. Refused/failed confinement becomes a named
  `DispatchError` with structured details.
- R6: Explicitly handle in-process Agent/Task dispatch as
  `authorityScope: external-harness` with null attestation; required
  confinement must refuse if no trusted harness attestation contract exists.
- R7: Observe mode must emit `unknown`/`unconfined` attestation for legacy
  omitted policy, not silently call that enforced.
- R8: Add static/import tests proving production callers cannot call adapter
  execute functions directly after this phase.

## Files

Likely touch:

- `src/runner/dispatch/confinement/authority.mjs`
- `src/runner/dispatch/confinement/request.mjs`
- `src/runner/dispatch/cli.mjs`
- `src/runner/dispatch/transport.mjs`
- `src/runner/dispatch.mjs`
- `src/runner/dispatch/result-ladder.mjs`
- `test/runner/dispatch.test.mjs`
- `test/runner/dispatch-production-call-sites.test.mjs`
- `test/architecture.test.mjs`

Do not touch:

- bwrap argv migration for real executors
- herdr lifecycle migration
- strict mode defaults

## Verification

- Fake adapter tests prove the adapter receives only prepared invocation through
  Authority.
- Throw in policy resolve/compile/observe creates zero spawn.
- Existing dispatch tests stay behavior-compatible for unconfigured routes.
- Static test enumerates adapter execute call sites and allows only Authority
  plus non-production tests/config metadata readers.
- Capability annotation for this cell: `code:implement`.

