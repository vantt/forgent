# ADR-004: Reserve Job For A Future Scheduler

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
