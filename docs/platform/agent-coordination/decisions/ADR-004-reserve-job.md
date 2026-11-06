# ADR-004: Reserve Job For A Future Scheduler

```txt
Document type: Decision
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Accepted at atomic cutover
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Source material from `docs/architect/agent-coordination/decisions/ADR-004-reserve-job.md` at `947dc310396071a4d530216d5c06d05993d63bf5`; live routes and the explicitly stated implementation corrections are adapted here.
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: No current review date recorded; retained source dates are historical
Related:
- docs/platform/agent-coordination/README.md
- docs/platform/runner/spec.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Carriage note: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/decisions/ADR-004-reserve-job.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

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
