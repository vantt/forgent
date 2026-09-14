# D05 - Executor Contract And Production Proof

**Capability:** execute

**Depends on:** D04

## Purpose

Close prompt/schema drift and define evidence proving capabilities through real
shipped doors.

## Read First

Accepted D00-D04 artifacts,
`phase-designs/executor-contract-and-production-proof.md`, current Assignment,
DispatchPlan, confinement, adapters, claim validation, result normalization,
persistence, and coordination dispatch paths as read-only evidence.

## File Lease

- May edit: `phase-designs/executor-contract-and-production-proof.md`, `requirements-traceability.md`
- May add: `evidence/d05-*.md`
- Must not edit: every other path

## Work

Specify `agent-result-claim.v2`, status-dependent fields, and assessment by role.
Define one schema source for worker instructions and validation. Specify the
secret-free effective execution-contract snapshot, compilation time,
persistence, provenance, rendering, and redaction. Build positive and negative
proof matrices through config/Assignment, DispatchPlan, confinement, selected
adapter, claim, normalizer, persistence, and inspection. Name test level,
fixture, falsification condition, and evidence; helper tests cannot close a row.

## Required Shape

- Normative claim schema with valid/invalid examples and drift invariant.
- Effective-contract schema, provenance, redaction, and timing.
- Separate executor timeout and session wall-time semantics.
- Positive/negative production-door proof matrix with exact starting doors.
- Future implementation handoff inventory, without source-edit instructions.

## Adversarial Checks

- Prompt and validator disagree; claim certifies itself or becomes RunResult.
- Snapshot is late or secret-bearing; declarations exceed confinement.
- Unit tests substitute for wiring proof; unsupported recovery stays reachable.

## Acceptance

Every field has one source and provenance; every committed capability has a
falsifiable production-door proof; every negative capability has absence/refusal
proof; no HIGH finding remains.

## Verification

```sh
git diff --check
rg 'agent-result-claim|effective execution|production|negative|starting door' plans/260914-dispatch-operability-evidence-attribution/phase-designs/executor-contract-and-production-proof.md
```

## Handoff

D06 reviews one integrated authority model and tests whether the proof matrix
can falsify wiring errors rather than only validate helpers.
