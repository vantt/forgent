# Historical File: Deprecated And Reserved Coordination Terms

```txt
Document type: History
Audience: Human reviewer, maintainer and documentation agent
Purpose: Preserve the complete classified input as non-authority historical evidence
Design status: Candidate
Implementation: Historical snapshot; not current implementation or authority
Provenance: docs/platform/agent-coordination/vocabulary/deprecated-and-reserved.md at d23045c2de83e3508fda8fd2580b43ece2e1e046; SHA256 64772305e549d11f0a822655718281dd4b6f7c37abb6a549666a3a991c3a1d35
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
# Deprecated And Reserved Coordination Terms

```txt
Document type: Vocabulary
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for Deprecated And Reserved Coordination Terms
Design status: Candidate
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Retained from docs/architect/agent-coordination/vocabulary/deprecated-and-reserved.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Preserved vocabulary material for Deprecated And Reserved Coordination Terms; no authority cutover
Use this when: Comparing this candidate with its pinned legacy source
Do not use this for: Inferring current implementation or supersession of retained sources
Last reviewed: UNPROVEN; independent content review pending
Related:
- docs/platform/agent-coordination/vocabulary/canonical-concepts.md
- docs/platform/agent-coordination/decisions/ADR-008-coordination-session-and-mission-deferral.md
- docs/platform/agent-coordination/history/implementation-records/orchestration-vocabulary-map-2026-08-27.md
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
```
Document type: Vocabulary
Design status: Accepted
Implementation: Active
Last reviewed: 2026-09-01
Canonical for: deprecated aliases, overloaded terms, and reserved vocabulary

## Reserved

### Participant

Reserved for the existing fgOS platform-level concept: any process that
speaks the fgOS event-log contract is a full "participant"
(`docs/specs/platform-foundations.md` D0014,
`docs/knowledge/fgos-participant-contract-what-it-takes-to-be-a-full-partici/fgos-participant-contract.md`).
That definition lives outside this documentation tree and is not restated
here. Do not reuse `Participant` for the agent-coordination actor-instance
concept — the addressable instance that fills a Role inside a definition or
session is [SessionActor](canonical-concepts.md#sessionactor)
(per [ADR-008](../decisions/ADR-008-coordination-session-and-mission-deferral.md)).

### Job

Reserved for a future durable queue/scheduler unit. Team Dispatch V1 does not
create Job records. Do not use Job as a generic synonym for Work, AdhocTask,
Assignment, or Run.

### Mission

Reserved for an optional broader objective envelope. Until its proposal is
accepted, do not make Mission mandatory for standalone coordination and do not
give it Work lifecycle semantics.

## Discouraged Or Ambiguous

### Cell

May be used informally in implementation planning or the operating harness, but
is not currently a canonical runtime entity. Use AdhocTask for the proposed
session-local runtime concept and child Work for durable lifecycle units.

### Exec Packet

Avoid as an alias for Assignment. If used in historical material, it describes
an implementation-era execution payload, not a separate canonical lifecycle.

### Worker

Use only as a protocol role or generic executing participant with explicit
context. Do not assume Worker identifies provider, model, process, or lifecycle
owner.

### Agent Result

Use for the worker-produced structured artifact when discussing transport.
Use RunResult for the normalized fgOS runtime record and confidence decision.

### Completion Signal

Avoid without qualification. Distinguish process settlement, worker claim,
task satisfaction, Work completion, and visible terminal state.

## Forbidden Equivalences

- Do not call Assignment a Job.
- Do not call Run a task lifecycle.
- Do not call Herdr pane state evidence.
- Do not call Mission a Work replacement.
- Do not call every planner child Work.
- Do not call every temporary helper unit an independent Work item.
- Do not use consensus as a synonym for verified synthesis.
- Do not call a SessionActor a Participant; Participant is reserved for the
  platform-level event-log-contract concept.

## Historical Vocabulary

Older terminology and rationale remain searchable in the
[pre-migration vocabulary map](../history/implementation-records/orchestration-vocabulary-map-2026-08-27.md).
Historical use does not override this document.
~~~~
