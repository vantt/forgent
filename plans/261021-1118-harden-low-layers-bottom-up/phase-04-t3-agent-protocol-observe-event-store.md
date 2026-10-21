---
phase: 04
title: "T3: Agent protocol, Observe, Event Store"
status: pending
depends_on: [03 closed, "ES store layer done (Event Store part only)"]
effort: ~4d (rough)
---

# Phase 04 — T3: Agent protocol, Observe, Event Store

Template layer: follow the loop in [plan.md](plan.md#the-per-layer-loop).

## Context links

Specs: [agent-protocol](../../docs/platform/agent-protocol/spec.md), [event-store](../../docs/platform/event-store/spec.md), [observe](../../docs/specs/observe.md); board rows ES and WORK; [TEST plan](../261020-1757-test-governance-port-inventory-and-slow-file-extraction/plan.md) phase 2 event-store row (70 Node tests in 19 files vs 150 Rust).

## Split rule (proposal §4.4)

When phase 03 closes: if the ES lane has finished the store layer, run T3 whole. Otherwise **04a** agent protocol + Observe first, **04b** Event Store when ES is done; both before phase 05.

## Components, crates, Node

| Component | Rust | Node around it |
|---|---|---|
| Agent protocol | `packages/agent-protocol/rust` (1 883) | outcome naming also appears in `src/run-supervisor/steps/settle-attempt.mjs` (only Node file naming `usage-limit`/`trust-dialog`/`needs-human`); council checks for Node twins in `src/runner/dispatch/usage-parsers.mjs`, `provider-adapter.mjs` |
| Observe | `packages/observe/rust` (7 632) | `src/observe/friction-client.mjs` |
| Event Store | `packages/event-store/rust` (14 376), shared N-API addon | `src/event-store/*` 4 files, 268 lines; `src/state/events.mjs` (144); `src/state/legacy-event-git-adapter.mjs` |

Doctor rows: observe — `observe-dir-writable` :6586, `observe-friction-migrated` :6592, `observe-host-resolvable` :6598, `observe-run-coverage` :6645; event-store — config default `eventStore` :6650 only. `src/setup/event-store-checks.mjs` is not registered as a check (only imported by `src/setup/event-store-fixes.mjs:7`, used by `src/verbs/events/migrate.mjs:10`): the store is dormant on main; decide its doctor rows with the ES lane, do not add rows for a dormant component.

## Constraints

- The Work cutover onto Event Store is the WORK lane: no consumer is registered here.
- ES lane owns the store layer until done; HARDEN reviews after it, not alongside.

## Files

Filled by the T3 sub-plan with Create / Modify / **Delete** / **Tests to retire** (event-store Node tests TEST phase 2 has not already retired).

## Net size

Estimate before council (HARDEN commits only): Node −100 to −400 (legacy event adapter, duplicated outcome naming), Rust −300 to +100, tests −100 to −400. Layer total ≤ 0.

## Risks (layer-specific)

| Risk | L × I | Mitigation |
|---|---|---|
| ES not done delays T4 | M × M | Split 04a/04b; 04b still blocks 05 (proposal §4.4). |
| Reviewing dormant code that WORK will reshape | M × L | Critical/High only for the Event Store consumer side; store layer full review. |

## Done when

Loop close criteria for each part; T3 net size ≤ 0.
