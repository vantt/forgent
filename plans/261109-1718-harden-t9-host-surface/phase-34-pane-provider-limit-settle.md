---
phase: 34
title: "A pane seat whose omp gave up on a provider wait settles `provider-limit` at once"
status: landed
depends_on: []
parallel: "touches only the agent-protocol classifier, its fixtures and one run-supervisor test"
---

# Phase 34 - pane seat provider limit - agent-protocol classifier

**Authority moved:** none moved. The agent-protocol classifier owns "the screen says the provider ended the round" (`blocked(usage-limit | provider-error)`); the supervisor receipt carries it; `providerStopOf` in settlement maps it to `provider-limit`; Seat Binding and the lease own quarantine. Nothing new was added to those layers.

## Context

An omp seat on a quota-exhausted gemini account printed `Cloud Code Assist API error (429) RESOURCE_EXHAUSTED`, then `Error: Retry failed after 1 attempts: Provider requested 1800000ms wait, exceeds retry.maxDelayMs (300000ms)`, and returned to an idle prompt with an empty outbox. The pane path already settles a screen `blocked(usage-limit | provider-error)` as `provider-limit` (checked on the supervisor's existing wait loop, only when the agent is idle), and the walk already follows. The give-up line matched no wording, and the 429 line above it sat more than twelve lines from the bottom, outside the screen window the classifier reads. Prior art: a 404 from the same CLI was fixed the same way on 2026-11-06 (`provider-error`).

## Requirements

1. The line that ends omp's retries is read with the same anchoring as the other provider wordings (start of line after a marker and an `error` label). A provider wait beyond omp's limit gives `blocked(usage-limit)`; any other give-up gives `blocked(provider-error)`. One classifier (`direct/mod.rs`) serves the terminal and the direct path; no second list.
2. A retry still in progress (agent working) and prose that quotes the wording settle nothing.
3. No new outcome, no new polling.

## Files

`packages/agent-protocol/rust/src/direct/mod.rs`, `packages/agent-protocol/contracts/fixtures/terminal/omp/` (screen recorded from the real pane, four vectors), `docs/platform/agent-protocol/spec.md`, `packages/git/contracts/mutation-census.v1.json` (regenerated), `CHANGELOG.md`; wiring proof in `test/run-supervisor/terminal-fallback.test.mjs`.

## Validation

Owning proof: the terminal vectors (`cargo test -p fgos-agent-protocol`). Wiring proof: a pane idle on the recorded screen settles `provider-limit` and the second candidate runs. Rollback: revert the merge commit.
