---
phase: 32
title: "Provenance single writer: Seat Binding writes it, Dispatch copies it"
status: landed
depends_on: [21, 30]
parallel: "file-disjoint from P31 (run.mjs durationMs, run-result fixtures, seat-providers.mjs)"
---

# Phase 32 - Provenance single writer (T5)

**Authority:** `bind` (`src/runner/execution/bind.mjs`) writes a seat's provenance: executor, invocation, pool, model, tier, effort, persona, account and the source of each. Dispatch and the assignment runner pass it through and record what a launch did under their own names.

## Context

P21 removed the `cliOverride` relabel. A scan of `src/runner`, `src/workflow` found the remaining writes after bind: `withLaunchProvenance` (settlement) added `reasoningEffort.rendered` and `modelDrift` into the policy's provenance; `effectiveDispatchPolicy` (plan.mjs) dropped the id of a bound seat's executor source and relabelled its persona (`opPolicy` / `default`) and an unset effort (`default`) instead of copying Seat Binding's. The write gate and doctor `mutating-assignment-binding-snapshot` recompute read `bindingInput` and the config digest only, never a field written after bind.

## Requirements

1. A bound seat's policy provenance for executor, tier, model, effort and persona is `{ value, source: { scope: 'seat-binding', id } }` of what bind returned.
2. Launch facts live in `policy.launch { effortRendered, modelDrift }`, never in `provenance`.
3. `cliOverride` remains a provenance source only for callers with no binding (`fgos dispatch probe-account`, work-hint assignments through `bindWorkSeat`).

## Files

`src/runner/dispatch/plan.mjs`, `src/runner/dispatch/settlement.mjs`; tests `test/runner/execution/run-provider-failover.test.mjs` (owning proof: fallback attempt plus skipped account pin), `test/cli/run-verb.test.mjs` (wiring proof), `test/runner/dispatch-plan-policy.test.mjs`, `test/runner/dispatch-execute-effort.test.mjs`; `docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md`, `CHANGELOG.md`.

## Validation

Focused tests, architecture and doc-health tests, census scan, one real read-only `fgos run`, full `npm test`. Rollback: revert the merge commit.
