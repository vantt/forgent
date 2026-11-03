# ADR-005: Herdr Is Visibility, Not Evidence

```txt
Document type: Decision
Audience: Human reviewers, maintainers, documentation agents
Purpose: Identify the surviving current owner and preserve superseded sections in exact history
Design status: Accepted at atomic cutover
Implementation: Current scope below is bound to present code; historical design is not implementation proof
Provenance: Source material from `docs/architect/agent-coordination/decisions/ADR-005-herdr-visibility-only.md` at `947dc310396071a4d530216d5c06d05993d63bf5`; live routes and the explicitly stated implementation corrections are adapted here.
Writer type: Documentation maintainer
Canonical for: The stated document scope; source implementation limits remain explicit
Use this when: Reading the checked surviving scope or tracing original historical claims
Do not use this for: Reinstating retired Session, Flow, Protocol or Work-stage contracts
Last reviewed: No current review date recorded; retained source dates are historical
Related:
- None
Supersedes: None; the retained source records the historical design
Superseded by: None
Carriage note: Current-owner evidence and explicit historical section separation
```
## Current Scope

This document retains the surviving owner and boundary below. It is not a second runtime schema or an approval of the former engine. Current execution authority remains [the runner spec](../../runner/spec.md).

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
