# Phase 01 — Config, Policy, And Machine Registry

Depends on: Phase 00 closed.

## Objective

Add the canonical config vocabulary and machine backend registry needed by the
Authority, without routing dispatch through it yet. This phase makes
setup/doctor aware of the new state so later runtime code never depends on an
undiscoverable config file, env var, binary, or writable directory.

## Requirements

- R1: Extend runner config validation for capability-level confinement:
  `mode`, `policy`, `allowInvocationOverride`, explicit `unconfined`, and
  `runner.confinement.strict`.
- R2: Add built-in policy definitions for `host-write-denied` and
  `workspace-write` with immutable IDs and closed schema validation.
- R3: Add custom `confinementPolicies` validation for full
  `confinement-policy.v1` documents, rejecting unknown keys and invalid control
  values.
- R4: Preserve legacy `{privateHome, isolatedSession, ownWorktree}` only at the
  normalization boundary. Runtime-facing normalized data must be v1-shaped.
- R5: Implement a machine backend registry loader for
  `confinement-backend-registry.v1`. It must reject project-local attempts to
  define or override backend instance deployment config.
- R6: Register setup defaults for shared config keys and machine registry
  bootstrap where allowed by distribution doctrine. Fill missing values, never
  overwrite custom values.
- R7: Register doctor checks for:
  `confinement-policies-declared`, backend registry readability/schema,
  bwrap binary/platform availability, probe freshness placeholder, and strict
  readiness.
- R8: Update `docs/specs/distribution.md` check/default rows and
  `CHANGELOG.md` because this adds user-visible setup/doctor behavior.

## Files

Likely touch:

- `src/runner/dispatch/config.mjs`
- `src/setup/registrations.mjs`
- new `src/runner/dispatch/confinement/policies.mjs`
- new `src/runner/dispatch/confinement/backend-registry.mjs`
- `test/runner/dispatch-executor-profile.test.mjs`
- `test/setup/*.test.mjs`
- `docs/specs/distribution.md`
- `CHANGELOG.md`

Do not touch:

- adapter execution wiring in `src/runner/dispatch/cli.mjs`
- `src/runner/dispatch/transport.mjs` execute handles
- coordination runtime files

## Verification

- Config tests reject unknown keys, missing policies in strict mode, override
  downgrades, invalid network filters, malformed grants, and project-defined
  `confinementBackends`.
- Setup tests prove missing defaults are merged without overwriting custom
  values.
- Doctor tests prove new checks are registered, callable, and distinguish
  configured/disabled/unavailable/ready.
- Capability annotation for this cell: `code:implement`.

