# ADR-003: Separate Assignment, Run, And RunResult

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
