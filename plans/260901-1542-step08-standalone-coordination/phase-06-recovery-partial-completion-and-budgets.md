# Phase 06 - Recovery, Partial Completion, And Budget Hardening

## Objective

Turn the proven happy paths into a fail-closed runtime whose crash recovery,
partial completion, retry, topology, evidence, and hard-budget behavior is
auditable under adversarial conditions.

## Requirements

- **R1 Required actors/quorum.** Default completion requires every required
  SessionActor/task. An explicit partial policy names minimum actors/results and
  allowed omissions before execution. Final state lists every missing, failed,
  replaced, late, and dissenting branch; partial never serializes as consensus.
- **R2 Retry/replacement.** Retry creates a new Run for the same Assignment when
  policy permits. Actor replacement occurs only through declared retry policy,
  records old/new actor and allocation provenance, re-runs governance, and
  cannot silently relax provider/tier/diversity/evidence requirements.
- **R3 Crash recovery.** Inject crashes at every manifest/event/Assignment/Run/
  result boundary and during concurrent fan-out/fan-in. Resume produces no
  duplicate logical task/Assignment, loses no accepted ref, and cannot consume
  half-written/foreign evidence. Ambiguous state fails with repair guidance.
- **R4 Cancellation and terminal states.** Define and test bounded transitions
  among planned/running/partially-complete/completed/failed/cancelled. Cancellation
  stops new materialization, records in-flight outcomes, and does not delete
  immutable Runs/evidence.
- **R5 Hard budgets.** Enforce wall time, Assignment count, concurrency, peer
  rounds, and task depth at admission and before each launch. Boundary equality,
  zero/negative/overflow/unknown fields, concurrent races, and restart cannot
  bypass limits. Tokens/cost remain measured-or-unknown telemetry only.
- **R6 Security/adversarial suite.** Independently attack topology bypass,
  SessionActor impersonation, context leakage, foreign/stale evidence, evidence
  laundering, policy-source forgery, planner/resolver drift, governance bypass,
  path traversal, corrupt ledger, and partial-consensus false success.
- **R7 Work isolation negative contract.** A request with two concurrent
  mutating actors sharing one workspace is refused before Assignment creation.
  Coordination may store opaque domain-provisioned workspace/resource refs but
  exposes no branch/worktree/merge/approve/Work-transition operation. A static
  import/API test enforces this boundary.
- **R8 Independent closure.** Reviewer and Red-Team must independently approve
  the full recovery/budget matrix. Every accepted finding gets a focused
  regression test; unresolved High/Critical findings block Phase 07.

## Files

Modify `src/runner/coordination/**` and focused tests/proofs. Update accepted
CoordinationSession contract, runner spec, and CHANGELOG for settled state/
recovery behavior. Dispatch changes are permitted only for retry re-resolution
through existing APIs.

Do not implement Work-attached mutation, domain worktree allocation, merge,
Mission, token/cost enforcement, telemetry service, or CLI/headless surfaces.

## Tests First

- Table-driven state transition/quorum/partial policy tests.
- Deterministic crash injection at each persistence boundary.
- Concurrent admission tests for every hard bound.
- Replacement preserves hard constraints and provenance.
- Fuzz/property-style malformed event/ref/path tests using bounded deterministic
  seeds if repo tooling permits; otherwise exhaustive fixtures.
- Static import and public-export checks for Work isolation.

Focused command:

```bash
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/coordination-*.test.mjs' \
  'test/runner/cohort-planner*.test.mjs' \
  'test/runner/group-cognition*.test.mjs'
npm test
```

## Proofs And Exit

Persist a recovery matrix mapping each injected failure to final state and
duplicate count. Persist adversarial findings/dispositions. Close AC-I001/003/
004/006/008/009 rows; AC-I009 mutation live proof remains deferred-preserved.

## Risks / Rollback

Recovery fixes can accidentally rewrite evidence. Treat Assignment/Run/
RunResult as immutable and repair only session references/views. Land quorum/
retry separately from hard-budget/adversarial changes.

