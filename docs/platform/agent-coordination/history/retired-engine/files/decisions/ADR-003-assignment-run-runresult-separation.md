# Historical File: surviving request/attempt/result separation

```txt
Document type: History
Audience: Human reviewer, maintainer and documentation agent
Purpose: Preserve the complete classified input as non-authority historical evidence
Design status: Candidate
Implementation: Historical snapshot; not current implementation or authority
Provenance: docs/platform/agent-coordination/decisions/ADR-003-assignment-run-runresult-separation.md at d23045c2de83e3508fda8fd2580b43ece2e1e046; SHA256 4368136590c62d3888562191aa46fd999173a08aace9894ee7a192708db388bf
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
# ADR-003: Separate Assignment, Run, And RunResult

```txt
Document type: Decision
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for ADR-003: Separate Assignment, Run, And RunResult
Design status: Candidate
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Retained from docs/architect/agent-coordination/decisions/ADR-003-assignment-run-runresult-separation.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Preserved decision material for ADR-003: Separate Assignment, Run, And RunResult; no authority cutover
Use this when: Comparing this candidate with its pinned legacy source
Do not use this for: Inferring current implementation or supersession of retained sources
Last reviewed: UNPROVEN; independent content review pending
Related:
- None
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
```
Document type: ADR
Design status: Accepted
Implementation: Implemented
Last reviewed: 2026-08-31
Canonical for: semantic request and runtime attempt separation

## Context

A semantic request may be retried, dispatched through different mechanisms, or
fail before launch. Treating request, attempt, and outcome as one object loses
provenance and encourages false-success handling.

## Decision

- Assignment is the immutable semantic request.
- Run is one concrete execution attempt.
- RunResult is the normalized outcome and evidence record for one Run.

Retries create new Runs. Prior attempts and results remain available.

## Consequences

- Dispatch and evidence are auditable per attempt.
- Runtime failure cannot rewrite semantic intent.
- Result confidence can be normalized outside the worker.
- Assignment must not be used as task or Work lifecycle state.
~~~~
