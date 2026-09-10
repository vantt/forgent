# Phase 03 — Local Bwrap Backend, Probes, And Attestation

Depends on: Phase 02 closed.

## Objective

Implement the first real backend driver: local bwrap v1. Add resource
resolution, independent falsification probes, attestation persistence, cleanup,
and reaper mechanics needed before `required` can enforce.

## Requirements

- R1: Implement backend driver allowlist and bwrap driver config validation.
  Unknown driver type or unknown config key must refuse.
- R2: Implement resource resolver for `run-output`, `workspace`,
  `workspace-git-metadata`, `private-home`, and `executor-credentials` with
  canonical path validation and symlink-escape rejection.
- R3: Implement bwrap `assess` for default support matrix only. Unsupported
  controls return unsatisfied/unknown with named mismatch, never best-effort
  acceptance.
- R4: Implement bwrap `prepare` that materializes mounts/bindings from resolved
  resources, never from raw config path guesses or provider-specific branches.
- R5: Implement cleanup for local temp/private-home resources with ownership
  markers and idempotent reaper support.
- R6: Persist plan/prepared/terminal attestation records outside agent write
  grants. Public events/results may carry redacted references and digests only.
- R7: Add probe harness for local-bwrap-v1 proving:
  run-output writable, cwd/repo root denied for host-write-denied,
  workspace writable only for workspace-write, other dispatch runDir denied,
  private home writable without writing host home, no inherited writable fd
  outside grant, credentials read-only, and host read/network not overclaimed.
- R8: Doctor uses the same probe harness and reports stale/failing probes
  without requiring a separate manual script.

## Files

Likely touch:

- `src/runner/dispatch/confinement/backend-registry.mjs`
- new `src/runner/dispatch/confinement/drivers/bwrap.mjs`
- new `src/runner/dispatch/confinement/resources.mjs`
- new `src/runner/dispatch/confinement/attestation-store.mjs`
- new `src/runner/dispatch/confinement/probes/*.mjs`
- `src/setup/registrations.mjs`
- `test/runner/dispatch-confinement*.test.mjs`
- `test/setup/*.test.mjs`

Do not touch:

- executor config migration in `.fgos/config.json`
- group-thinking protocol files

## Verification

- Probe tests include red falsifiers; a driver claim alone cannot pass.
- Cleanup tests cover prepare failure, adapter failure, timeout/cancel, and
  startup reaper idempotence for local resources.
- Attestation schema tests cover prepared/completed/failed/refused phases and
  `channels` completeness.
- Capability annotation for this cell: `code:implement`.

