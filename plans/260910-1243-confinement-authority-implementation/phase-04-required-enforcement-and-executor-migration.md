# Phase 04 — Required Enforcement And Executor Migration

Depends on: Phase 03 closed.

## Objective

Turn confinement from observation into enforcement for supported required routes
and migrate the three committed bwrap executors from hardcoded argv confinement
to Authority-managed backend references.

## Requirements

- R1: Required policy refuses before spawn when backend missing, disabled,
  unsupported, stale-proof refresh fails, grant invalid, need unsatisfied, or
  prepared claims mismatch the plan.
- R2: Preferred support remains disabled or explicitly bounded if not fully
  implemented; do not silently run preferred as unconfined.
- R3: Explicit `unconfined` produces audited attestation with backend null.
- R4: Migrate `claude-bwrap`, `agy-bwrap`, and `codex-bwrap` config to use
  `confinement.backend: bwrap` plus capability policy instead of security
  semantics hidden inside argv.
- R5: Preserve executor IDs so existing capability preferences and evidence
  trails keep resolving.
- R6: Close fail-open paths:
  F-a `cliSpawnAdapter` ignores confinement,
  F-b invocation confinement override bypasses validation,
  F-c capability fallback loses policy,
  F-d establishConfinement returns success-shaped unconfined result.
- R7: Update `runner.capabilities` defaults so `advise`, `code:review`,
  `code:debug`, and any committed read-only group-thinking route have explicit
  confinement policy or explicit `unconfined`.
- R8: Add focused live-safe smoke tests that use fake executors for deterministic
  enforcement and optional live bwrap tests gated by env when real bwrap exists.

## Files

Likely touch:

- `.fgos/config.json` only if dogfood config migration is intentionally part of
  this cell; otherwise provide fixture config and leave local config to P06.
- `src/runner/dispatch/confinement/**`
- `src/runner/dispatch/cli.mjs`
- `src/runner/dispatch/resolve.mjs`
- `src/runner/dispatch/config.mjs`
- `src/setup/registrations.mjs`
- `test/runner/dispatch*.test.mjs`
- `test/runner/dispatch-confinement*.test.mjs`
- `CHANGELOG.md`

## Verification

- Required missing backend produces `DispatchError` with `confinement-*` code and
  zero adapter call.
- Capability fallback still carries the original capability anchor and policy.
- Invocation override cannot add grants, lower controls, change policy ID, or
  switch required/preferred to unconfined.
- Static test proves hardcoded bwrap security argv is no longer the enforcement
  story for migrated executors.
- Capability annotation for this cell: `code:implement`.

