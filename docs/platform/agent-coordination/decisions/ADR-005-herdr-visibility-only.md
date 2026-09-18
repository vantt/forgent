# ADR-005: Herdr Is Visibility, Not Evidence

Document type: ADR
Design status: Accepted
Implementation: Partial
Last reviewed: 2026-08-31
Canonical for: interactive visibility trust boundary

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
