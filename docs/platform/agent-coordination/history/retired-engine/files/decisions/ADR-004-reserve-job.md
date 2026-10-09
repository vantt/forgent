# Historical File: ADR-004: Reserve Job For A Future Scheduler

```txt
Document type: History
Audience: Human reviewer, maintainer and documentation agent
Purpose: Preserve the complete classified input as non-authority historical evidence
Design status: Candidate
Implementation: Historical snapshot; not current implementation or authority
Provenance: docs/platform/agent-coordination/decisions/ADR-004-reserve-job.md at d23045c2de83e3508fda8fd2580b43ece2e1e046; SHA256 a60ce5298c77d43edee04c299a0a0eb71b3515833c743f937cba009ce421453a
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
# ADR-004: Reserve Job For A Future Scheduler

```txt
Document type: Decision
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for ADR-004: Reserve Job For A Future Scheduler
Design status: Candidate
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Retained from docs/architect/agent-coordination/decisions/ADR-004-reserve-job.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Preserved decision material for ADR-004: Reserve Job For A Future Scheduler; no authority cutover
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
Canonical for: Job vocabulary and V1 scope

## Context

Queue/scheduler terminology can be useful later, but Team Dispatch V1 executes
Assignments directly and does not require another persisted lifecycle object.

## Decision

`Job` is reserved for a future durable queue/scheduler abstraction. V1 must not
create Job records or use Job as an alias for Work, AdhocTask, Assignment, or
Run.

## Consequences

- V1 remains smaller and avoids a shadow lifecycle.
- Future scheduler design must define why Job is needed and how it references
  Assignment/Run without replacing them.
- Config, docs, and code should reject accidental Job terminology where it
  implies current behavior.
~~~~
