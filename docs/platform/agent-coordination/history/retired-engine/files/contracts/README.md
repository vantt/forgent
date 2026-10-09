# Historical File: Agent Coordination Contracts

```txt
Document type: History
Audience: Human reviewer, maintainer and documentation agent
Purpose: Preserve the complete classified input as non-authority historical evidence
Design status: Candidate
Implementation: Historical snapshot; not current implementation or authority
Provenance: docs/platform/agent-coordination/contracts/README.md at d23045c2de83e3508fda8fd2580b43ece2e1e046; SHA256 5fbb019e87a413ea2a85b1f07b9eaf297f723d71b5f6f2893b4e6f80d7ec09d6
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
# Agent Coordination Contracts

```txt
Document type: Collection index
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for Agent Coordination Contracts
Design status: Candidate
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Retained from docs/architect/agent-coordination/contracts/README.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Preserved collection-index material for Agent Coordination Contracts; no authority cutover
Use this when: Comparing this candidate with its pinned legacy source
Do not use this for: Inferring current implementation or supersession of retained sources
Last reviewed: UNPROVEN; independent content review pending
Related:
- docs/platform/agent-coordination/vision.md
- docs/platform/agent-coordination/contracts/workflow-stage-operation.md
- docs/platform/agent-coordination/contracts/assignment-run-runresult.md
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
```
Document type: Index
Design status: Accepted
Implementation: Partial
Last reviewed: 2026-09-01
Canonical for: navigation across accepted behavioral contracts

> **Ghi chú chuyển tiếp (2026-10-02):** Khái niệm `CoordinationSession` và `FlowDefinition` đã được thu hồi ở P4 per D-0050; thay bằng **Unit run** qua **CollaborationPattern** (`solo`, `reviewed`, `panel` + preset) và **Workflow run** (`src/workflow/**`).
Read the [Agent Coordination Foundation Vision](../vision.md) first. Contracts
define exact behavior beneath it and cannot make Work or a predeclared protocol
universally mandatory.
## Migration Status

This directory has been promoted from
`docs/architect/agent-coordination/contracts/` during the platform
documentation migration. Contract language is preserved first; any later
semantic change needs an accepted decision and compatibility notes.

## Contracts

1. [Workflow Stage Operation](workflow-stage-operation.md) defines operation
   normalization, lookup, references, validation, and compatibility behavior.
2. [Assignment, Run, And RunResult](assignment-run-runresult.md) defines semantic
   request, execution attempt, normalized outcome, and evidence boundaries.
3. [CoordinationSession](coordination-session.md) defines the CoordinationSession
   manifest/event schema, storage layout, one-way session-to-Assignment
   membership, and recovery rules.
4. [FlowDefinition](flow-definition.md) defines the shared graph/operation/policy
   IR and the Workflow/CoordinationProtocol typed-profile schemas.

AdhocTask, generalized AgentMessage, and the full standalone protocol runtime
remain proposals and are not listed as accepted contracts. The accepted
direction for a future validated inline Assignment contract is in the Vision
and Assignment contract; its field-level schema remains unaccepted.
~~~~
