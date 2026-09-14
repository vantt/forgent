# D04 - Guard Reconciliation

**Capability:** execute

**Depends on:** D03

## Purpose

Specify narrow mutation that repairs proven-stale guards without becoming
semantic recovery.

## Read First

Accepted D00-D03 artifacts, `phase-designs/guard-reconciliation.md`, current
recovery authorities, lock/claim formats, process-incarnation handling, and
adapter liveness contracts as read-only evidence.

## File Lease

- May edit: `phase-designs/guard-reconciliation.md`, `requirements-traceability.md`
- May add: `evidence/d04-*.md`
- Must not edit: every other path

## Work

Define `dispatch.runtime.reconcile` plan/apply schemas. For each repair, identify
owner, authoritative proof, snapshot, CAS preconditions, lock scope, expiry,
idempotency, audit, and refusals. Profiles unable to prove death/absence remain
unsupported. External I/O occurs before the short commit lock; commit re-reads
local authority. Result collection defers to the existing Run/Coordination owner.

## Required Shape

- Authority/effect table; plan/apply state machine and schemas.
- CAS/concurrency pseudocode with crash points.
- Liveness capability matrix and complete refusal matrix.
- Audit, idempotency, and partial-failure behavior.

## Adversarial Checks

- TTL means death; PID reuse deletes a successor guard.
- External I/O occurs under lock; a stale plan mutates after a result lands.
- Reconciliation retries, resumes, reassigns, kills, or admits work.
- Concurrent applies both report a new mutation.

## Acceptance

Every mutation repairs proven truth, has one owner and CAS guard, and returns a
typed non-mutating answer when proof is unavailable. No path evolves a Run's
semantic future and no HIGH finding remains.

## Verification

```sh
git diff --check
rg 'CAS|plan-stale|dead-proven|absent-proven|idempotent|refus' plans/260914-dispatch-operability-evidence-attribution/phase-designs/guard-reconciliation.md
```

## Handoff

D05 turns positive and negative behavior into production-door proof without
widening mutation authority.
