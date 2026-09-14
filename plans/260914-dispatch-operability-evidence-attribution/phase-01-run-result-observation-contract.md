# D01 - RunResult And RunObservation Contract

**Capability:** execute

**Depends on:** D00

## Purpose

Make terminal truth, mutable observation, host outcomes, and worker claims
non-overlapping concepts.

## Read First

Read D00 outputs, `contracts/run-result-and-observation.md`, the Run/Assignment
sections in `docs/specs/runner.md`, and existing result schemas, normalizers,
fixtures, and readers as read-only evidence.

## File Lease

- May edit: `contracts/run-result-and-observation.md`, `requirements-traceability.md`
- May add: `evidence/d01-*.md`
- Must not edit: every other path

## Work

Specify normative schemas and invariants for RunResult v2 and RunObservation:
ownership, write cardinality, lifecycle, vocabularies, required fields, unknown
values, provenance, corruption behavior, and legacy projections. Write the
deterministic historical-v1 interpreter. Define how execution, assessment,
failure, policy, confidence, and delivery combine without collapsing into one
status. Prove ProviderOutcome and agent-result claim are not terminal authority.

## Required Shape

- Entity authority table and normative JSON examples.
- Examples for pass, findings, provider failure, completion-unknown, replay,
  legacy-derived, and corrupt v2.
- Compatibility truth table, reader/writer invariants, invalid states, and
  byte-preserving migration rules.

## Adversarial Checks

- Findings become an execution crash; policy refusal erases a result.
- Missing legacy data is invented; corrupt v2 passes.
- RunObservation settles a Run; session schema controls RunResult version.

## Acceptance

Every example has one terminal interpretation; incomplete/conflicting cases are
typed; v1 reading is deterministic and byte-preserving; no second outcome entity
is needed; and no HIGH finding remains.

## Verification

```sh
git diff --check
rg 'RunResult|RunObservation|ProviderOutcome|legacy-derived|contract-corrupt' plans/260914-dispatch-operability-evidence-attribution/contracts/run-result-and-observation.md
```

## Handoff

D02 consumes these contracts unchanged. Any newly discovered terminal concept
returns to D01 as a finding.
