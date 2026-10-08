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
Related: None; source context is recorded in Provenance
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
