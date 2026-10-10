# Deprecated And Reserved Coordination Terms

```txt
Document type: Vocabulary
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/vocabulary/deprecated-and-reserved.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

## Reserved

### Participant

Platform event-log participant: any process that speaks the event-log format
and append/read/subscribe contract, including a non-Node implementation
(`docs/specs/platform-foundations.md:210-219`). Do not redefine this platform
term as a CoordinationSession actor or a terminal pane.

### Job

Reserved for a future durable scheduler/queue abstraction. No current Job
record or Job-based dispatch selector is implied; Assignment and Run retain
their distinct identities. See [ADR-004](../decisions/ADR-004-reserve-job.md).

### Mission

Reserved vocabulary, not a current execution identity or a reason to create a second lifecycle store. The former session-specific proposal is historical.

## Discouraged Or Ambiguous

### Cell

An informal planning/manual-harness unit, not a current universal runtime
entity. Use Unit/Workflow execution for immediate execution and child Work
when an independently durable delivery lifecycle is required. The retired
AdhocTask/session-local proposal is not a current API.

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

- Participant is not a CoordinationSession actor.
- Job is not Work, Assignment, Run or a capability selector.
- Cell is not an implicit persisted task or Work record.
- Worker claim is not normalized RunResult or verified completion.
- Process exit or pane quietness is not Work acceptance/approval.

## Historical Vocabulary

Older terminology and rationale remain searchable in the
[pre-migration vocabulary map](../history/implementation-records/orchestration-vocabulary-map-2026-08-27.md).
Historical use does not override this document.

