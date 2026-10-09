# Historical File: surviving delivery authority decision, mixed retired Work-stage statement

```txt
Document type: History
Audience: Human reviewer, maintainer and documentation agent
Purpose: Preserve the complete classified input as non-authority historical evidence
Design status: Candidate
Implementation: Historical snapshot; not current implementation or authority
Provenance: docs/platform/agent-coordination/decisions/ADR-001-work-lifecycle-authority.md at d23045c2de83e3508fda8fd2580b43ece2e1e046; SHA256 7e5e23e2afdf4b9f8380b8bebb2d7c65e344625993764dd79e6a8abe1cd7921a
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
# ADR-001: Work Owns Delivery Lifecycle

```txt
Document type: Decision
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for ADR-001: Work Owns Delivery Lifecycle
Design status: Candidate
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Retained from docs/architect/agent-coordination/decisions/ADR-001-work-lifecycle-authority.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Preserved decision material for ADR-001: Work Owns Delivery Lifecycle; no authority cutover
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
Canonical for: delivery lifecycle authority

## Context

Coordination introduces Assignments, Runs, results, possible sessions, and
temporary tasks. Letting those objects mutate lifecycle independently would
create conflicting status, approval, and merge truth.

## Decision

Work and existing Work engine verbs are the sole authority for Work status,
stage, claim/return, acceptance, approval, durable branch, and merge lifecycle.

Coordination objects may provide evidence or recommendations to a Work driver,
but cannot perform lifecycle transitions except through authorized Work verbs.

## Consequences

- Session/task status must remain collaboration-local.
- Agent consensus cannot approve or complete Work.
- Work-attached dispatch must return results to the driver.
- Standalone coordination can exist without gaining delivery authority.
- Lifecycle leakage is a high-severity review finding.
~~~~
