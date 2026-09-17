# Phase 07 - Migration And Release Proof

## Goal

Close the track with cross-version, adversarial recovery, consumer, and
documentation proof; leave deferred mutation/fan-out work explicit.

## Scope

- Execute schema migration matrix against old/new binaries/worktrees.
- Prove mixed-version append refusal, legacy session behavior, and explicit
  unsupported-schema/legacy projections.
- Run full adversarial test matrix for declaration tampering, semantic resume
  drift, missing session/definition, corrupt evidence, cancellation, and
  no-later-event integrity behavior.
- Update runner/coordination specs, public how-to material, and changelog with
  scope, caveat, compatibility, and deferred-feature facts.
- Record live proof and final evidence under
  `docs/architect/agent-coordination/verification/cold-resumable-coordination-dag/`.

## Verification

```sh
npm test -- test/runner/coordination-*.test.mjs test/verbs/coordination-*.test.mjs test/cli/coordination.test.mjs
npm test
```

## Exit Criteria

- All schema/version and consumer proofs pass against integrated track SHA.
- Docs explicitly state read-only individual-node scope and defer mutation/fan-
  out DAG behind future evidence gates.
- Final code-panel planned-mode live proof and full-suite baseline comparison
  are recorded; no BLOCKER/HIGH remains.
