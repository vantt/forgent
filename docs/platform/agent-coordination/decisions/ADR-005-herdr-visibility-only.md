# ADR-005: Herdr Is Visibility, Not Evidence

```txt
Document type: Decision
Audience: Human reviewers, maintainers, documentation agents
Purpose: Identify the surviving current owner and preserve superseded sections in exact history
Design status: Candidate
Implementation: Current scope below is bound to present code; historical design is not implementation proof
Provenance: Retained from docs/architect/agent-coordination/decisions/ADR-005-herdr-visibility-only.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
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

Visibility detachment changes only visibility state, not Run settlement truth. Evidence: `src/runner/dispatch/visibility-session.mjs:130-133`.

## Context

Terminal panes and process state are valuable operational signals but cannot
reliably prove semantic success, artifact freshness, verification, or Work
lifecycle completion.

## Decision

Herdr is an observability surface. Structured runtime settlement, RunResult,
artifacts, and evidence establish outcome truth. Work verbs establish lifecycle
truth.

## Consequences

- Quietness, visible text, or pane closure cannot mark a Run successful.
- Herdr may display canonical Run/RunResult/evidence references.
- Correctness must survive headless or detached execution.
- Visibility bugs and evidence bugs remain separate failure categories.

## Historical Sections

The complete classified input, including all former contracts, schemas, qualifications and implementation statuses, is [preserved verbatim](../history/retired-engine/files/decisions/ADR-005-herdr-visibility-only.md#literal-snapshot). The coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see the runner spec’s historical CoordinationSession section. Retired Session/Flow/Protocol and Work-stage sections are not current contracts. No historical claim is deleted or silently reclassified as implemented.
