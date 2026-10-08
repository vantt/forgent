# Evidence And Result Architecture

```txt
Document type: Architecture
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for Evidence And Result Architecture
Design status: Candidate
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Retained from docs/architect/agent-coordination/architecture/evidence-and-results.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Preserved architecture material for Evidence And Result Architecture; no authority cutover
Use this when: Comparing this candidate with its pinned legacy source
Do not use this for: Inferring current implementation or supersession of retained sources
Last reviewed: UNPROVEN; independent content review pending
Related: None; source context is recorded in Provenance
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
```
Document type: Architecture
Design status: Accepted
Implementation: Implemented
Last reviewed: 2026-08-31
Canonical for: evidence trust, result confidence, and false-success boundaries

## Principle

```txt
Executors claim outcomes.
RunResult normalizes claims.
Evidence supports confidence.
Drivers decide what the evidence permits.
```

## Evidence Sources

Depending on the selected TaskSpec or validated inline execution contract,
evidence may include:

- structured worker result artifact;
- process settlement and exit metadata;
- post-run file snapshots and expected-file checks;
- git delta scoped to the Run;
- command/test output captured after execution;
- artifact paths, hashes, timestamps, and provenance;
- independent reviewer or verifier result.

No one source proves every operation type.

## Confidence Boundaries

- Worker self-report alone cannot produce externally verified confidence.
- Exit code zero cannot satisfy missing semantic outputs.
- Pre-existing dirty files cannot count as changes produced by the Run.
- Stale or cross-Assignment evidence must be rejected.
- Read-only analytical output may remain `reported` when the TaskSpec or inline
  execution contract permits it.
- Mutating success requires post-run external evidence appropriate to the claim.
- Missing/malformed required evidence must not false-pass.

## Aggregation

Task or synthesis aggregation cannot raise evidence quality by majority. Failed,
missing, unsupported, or excluded branches remain visible in aggregate output.

## Visibility Boundary

Herdr pane state, terminal text, quietness, and process appearance are useful
diagnostics only. They cannot replace structured runtime and evidence records.
