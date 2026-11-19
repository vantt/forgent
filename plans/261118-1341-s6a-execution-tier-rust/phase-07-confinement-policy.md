# Phase 07: confinement policies and resources

Wave 3. Depends on: 3. Effort 1.5d. Library only (engine module `confinement::policy`). Split from the old phase 7
(3 095 Node lines); 7b follows in wave 4.

## Context

`src/runner/dispatch/confinement/`: `policies.mjs` (733: built-in policy ids, shape validation, legacy normalisation),
`resources.mjs` (890: `resolveConfinementResources`, machine-private roots per agent-confinement spec §9.3),
`workspace-paths.mjs` (55), `bypass-pairing.mjs` (34). 1 712 lines on `f031ab0c8` (1 536 on `b5b237534`). Grown since
the base by the session verb plan: the `mailbox-record` and `peer-sessions` resources of a head
(`workspace-paths.mjs` `MAILBOX_RECORD_RESOURCE`, `PEER_SESSIONS_RESOURCE`; `90757718a`, `42e7a0c3c`, `5b751154c`,
`fd59f3445`), the mailbox lock path through `resolveLock('mailbox')` (`resources.mjs:19,90`, `src/holder-lock/registry.mjs:70`;
the port takes it from `fgos-holder-lock`, never a hard-coded path), and `controlDelivery`
(`bypass-pairing.mjs`, `7185f8375`, `a8b1f6229`). Doctor row `confinement-policies-declared` judges
with them (phase 15). Spec: `docs/platform/agent-confinement/spec.md`; component-boundary row "Dispatch Transport &
Confinement".

## Requirements

- `packages/execution/engine/src/confinement/policy/` ports those modules.
- Pure parts (policy shape, legacy normalisation) take facts as inputs; machine reads (home dirs, login stores) go
  through one small trait implemented with real fs in this module.
- Golden vectors under `packages/execution/contracts/confinement-policy/` recorded by
  `test/golden-recorders/confinement-policy.recorder.mjs` (committed), including every `MACHINE_PRIVATE_ROOTS` case (`resources.mjs:196`), the head `mailbox-record` and `peer-sessions`
  resources (peer-sessions is a read-only bind-back, not a machine-private leak) and every `controlDelivery` case.
- Behaviour unchanged; known defects become backlog rows in the report.

## Steps

Commit the recorder; record vectors; red `engine/tests/confinement_policy.rs`; port; green; report twinned Node modules
(deleted when phase 21 removes their last caller) and their tests' new owner.

## Validation

`cargo test -p fgos-execution-engine --test confinement_policy`; clippy; msvc and aarch64-apple-darwin check (Linux-only
parts behind `cfg`, matching Node's platform branches).

## Risk and rollback

Risk: a confined worker sees a private root after cutover (security). Vectors cover every root and every policy id.
Rollback: revert the module.
