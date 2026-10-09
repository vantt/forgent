# ADR-003: Separate Assignment, Run, And RunResult

```txt
Document type: Decision
Audience: Human reviewers, maintainers, documentation agents
Purpose: Identify the surviving current owner and preserve superseded sections in exact history
Design status: Candidate
Implementation: Current scope below is bound to present code; historical design is not implementation proof
Provenance: Retained from docs/architect/agent-coordination/decisions/ADR-003-assignment-run-runresult-separation.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Candidate current-owner and boundary guidance only; no authority cutover or duplicate runtime schema
Use this when: Reading the checked surviving scope or tracing original historical claims
Do not use this for: Reinstating retired Session, Flow, Protocol or Work-stage contracts
Last reviewed: Pending independent whole-area review
Related:
- None
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Current-owner evidence and explicit historical section separation
```
## Current Scope

This candidate retains the surviving owner and boundary below. It is not a second runtime schema or an approval of the former engine. Current execution authority remains [the runner spec](../../../specs/runner.md).

The normalizer takes distinct Assignment and Run identifiers; Unit execution identity and round are separate inputs. Evidence: `src/runner/dispatch/run-result.mjs:350-355`.

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

## Historical Sections

The complete classified input, including all former contracts, schemas, qualifications and implementation statuses, is [preserved verbatim](../history/retired-engine/files/decisions/ADR-003-assignment-run-runresult-separation.md#literal-snapshot). The coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see the runner spec’s historical CoordinationSession section. Retired Session/Flow/Protocol and Work-stage sections are not current contracts. No historical claim is deleted or silently reclassified as implemented.
