# Phase 3: Layer T6 Workflow (program step S6b)

Capability: `code:review` for steps 1–3; the implementation runs in the sub-plan.

This phase is program step S6b of `plans/261114-2051-rust-verb-migration-program` (D18): one owner, run as the HARDEN
loop (D7), not a plain port. It carries S6b's exit items from that program row (tier-6 Node deleted, door rows, the
step's bridged doctor rows moved into Rust and off the bridge, the parity runner restored for those rows).

## Gate

Phase 2 is closed (`reports/phase-02-close.md`).

## Inputs

- Phase 0 report: the `workflow` and `work-driver` rows, triage weights, job → doors map, and the S6b/S7 door rows
  phase 0 assigned to T6 (D21).
- Discussion §6 inventory rows 15 and 16; §3 H1 (Workflow hardened inside Node, no crate, doctor rows on the bridge).
- `src/workflow/`, the seat-binding client and the dispatch/execution live rest reached from
  `src/workflow/definition.mjs`; `docs/platform/workflow/`.
- Program row S6b: `plans/261114-2051-rust-verb-migration-program/plan.md`.
- Note the draft `261122-0056-orchestration-skeleton`, which touches workflow files; check its status before the
  sub-plan's footprint is fixed.

## Files it may write

`plans/261124-1026-harden-next-round/reports/phase-03*`. Code, specs and the model change only through the sub-plan.

## Steps

Run the per-layer loop as phase 1 lists it (steps 1–9). Workflow is expected to triage full (no crate; H1). The
council settles the Workflow crate's authority, contracts and door before any move; Node to Rust is one column of its
migration table (D7). The sub-plan closes every door row assigned to T6 (D21).

## Verify

`reports/phase-03-close.md` holds the phase 1 close evidence, plus: every door row assigned to T6 is closed, and the
Workflow doctor rows are off the bridge.

## Rollback

Code reverts through the sub-plan; delete this phase's reports.
