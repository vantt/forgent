# Evidence And Result Architecture

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

Depending on TaskSpec, evidence may include:

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
- Read-only analytical output may remain `reported` when TaskSpec permits it.
- Mutating success requires post-run external evidence appropriate to the claim.
- Missing/malformed required evidence must not false-pass.

## Aggregation

Task or synthesis aggregation cannot raise evidence quality by majority. Failed,
missing, unsupported, or excluded branches remain visible in aggregate output.

## Visibility Boundary

Herdr pane state, terminal text, quietness, and process appearance are useful
diagnostics only. They cannot replace structured runtime and evidence records.
