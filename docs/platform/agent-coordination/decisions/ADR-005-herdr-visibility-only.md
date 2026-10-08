# ADR-005: Herdr Is Visibility, Not Evidence

```txt
Document type: Decision
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for ADR-005: Herdr Is Visibility, Not Evidence
Design status: Candidate
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Retained from docs/architect/agent-coordination/decisions/ADR-005-herdr-visibility-only.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Preserved decision material for ADR-005: Herdr Is Visibility, Not Evidence; no authority cutover
Use this when: Comparing this candidate with its pinned legacy source
Do not use this for: Inferring current implementation or supersession of retained sources
Last reviewed: UNPROVEN; independent content review pending
Related:
- None
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
```
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
