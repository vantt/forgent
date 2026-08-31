# Deprecated And Reserved Coordination Terms

Document type: Vocabulary
Design status: Accepted
Implementation: Active
Last reviewed: 2026-08-31
Canonical for: deprecated aliases, overloaded terms, and reserved vocabulary

## Reserved

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

## Historical Vocabulary

Older terminology and rationale remain searchable in the
[pre-migration vocabulary map](../history/implementation-records/orchestration-vocabulary-map-2026-08-27.md).
Historical use does not override this document.
