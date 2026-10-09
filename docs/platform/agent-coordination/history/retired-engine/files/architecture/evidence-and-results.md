# Historical File: surviving normalized evidence trust boundary

```txt
Document type: History
Audience: Human reviewer, maintainer and documentation agent
Purpose: Preserve the complete classified input as non-authority historical evidence
Design status: Candidate
Implementation: Historical snapshot; not current implementation or authority
Provenance: docs/platform/agent-coordination/architecture/evidence-and-results.md at d23045c2de83e3508fda8fd2580b43ece2e1e046; SHA256 09d3074a859abf556cb7fee54034af799fcc938b9a3c844f18d7f796435ebd43
Writer type: Documentation maintainer
Canonical for: Historical evidence only; no current authority
Use this when: Auditing original claims or section-level retirement
Do not use this for: Current runtime behaviour, accepted proposals or executable routing
Last reviewed: Pending independent whole-area review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: None; this is an exact historical carrier
Superseded by: Current execution ownership in docs/specs/runner.md
Added in candidate: Historical framing only; literal file bytes are unchanged
```

The coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see `docs/specs/runner.md` **CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)**. Original statuses and instructions below are dated evidence, not current claims.

## Literal Snapshot

~~~~text
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
Related:
- None
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
~~~~
