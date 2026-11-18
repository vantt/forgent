# Phase 07: confinement policy and request

Wave 3. Depends on: 3. Effort 2.5d. Library only (engine module `confinement::policy`). Lands before 08.

## Context

`src/runner/dispatch/confinement/`: `policies.mjs` (733: built-in policy ids, shape validation, legacy normalisation),
`resources.mjs` (741: `resolveConfinementResources`, machine-private roots per agent-confinement spec §9.3),
`request.mjs` (536), `authority.mjs` (1 023: posture, nested-dispatch depth, env for the worker), `workspace-paths.mjs`,
`bypass-pairing.mjs`. Doctor rows `confinement-policies-declared` and `confinement-strict-readiness` judge with them
(phase 15). Spec: `docs/platform/agent-confinement/spec.md`; component-boundary row "Dispatch Transport & Confinement".

## Requirements

- `packages/execution/engine/src/confinement/policy/` ports those modules; the request type is the one fixed in the
  skeleton's `confinement/mod.rs`.
- Pure parts (policy shape, request assembly from facts) take facts as inputs; machine reads (home dirs, login stores,
  registry) go through one small trait implemented with real fs in this module.
- Golden vectors `packages/execution/contracts/confinement-policy.v1.json` recorded from Node, including the
  `MACHINE_PRIVATE_ROOTS` cases and nested-dispatch refusal.
- Behaviour unchanged; known defects become backlog rows in the report.

## Steps

Record vectors; red `engine/tests/confinement_policy.rs`; port; green; report twinned Node modules (deleted when phase
16/21 removes their last caller) and their tests' new owner.

## Validation

`cargo test -p fgos-execution-engine --test confinement_policy`; clippy; msvc and aarch64-apple-darwin check (Linux-only
parts behind `cfg`, matching Node's platform branches).

## Risk and rollback

Risk: a confined worker sees a private root after cutover (security). Vectors cover every root and every policy id.
Rollback: revert the module.
