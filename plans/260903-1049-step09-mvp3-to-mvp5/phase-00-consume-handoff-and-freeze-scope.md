# Phase 00 - Consume MVP1/MVP2 Handoff And Freeze Scope

## Objective

Start MVP3-5 from the real implemented MVP1/MVP2 shape, not from stale
assumptions or the discussion proposal.

## Requirements

- **R1 Handoff audit.** Read the MVP1/MVP2 verification index, plan, closed cell
  traces, and final implementation contracts. Identify which primitives exist
  and which limitations are explicit.
- **R2 Scope freeze.** Record exactly what MVP3 may build on:
  fixture id/version, authorization event shape, assignment provenance shape,
  context grant behavior, artifact ref behavior, and bounds behavior.
- **R3 No active-track interference.** Confirm the MVP1/MVP2 track is closed or
  has an explicit maintainer handoff. Do not edit files that an active
  MVP1/MVP2 cell owns.
- **R4 Baseline.** Record git status and test baseline for this plan. Preserve
  unrelated/user changes.

## Files

Expected docs/proof files:

- `plans/260903-0004-step09-group-thinking-mvp1-mvp2/plan.md`
- `docs/architect/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md`
- `docs/architect/agent-coordination/contracts/coordination-session.md`
- `docs/architect/agent-coordination/contracts/flow-definition.md`
- `docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5/index.md`
- `docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5/current-cell.md`

Do not modify source runtime in this phase.

## Tests First

Docs/proof checks only unless the handoff requires a smoke command:

```bash
git diff --check -- \
  plans/260903-1049-step09-mvp3-to-mvp5 \
  docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5
```

If MVP1/MVP2 changed runtime, run the focused smoke tests named by its final
handoff before continuing.

## Proofs And Exit

- The trace names the exact MVP1/MVP2 artifacts this plan consumes.
- Any missing prerequisite is recorded as a blocker, not silently implemented in
  this phase.
- No active MVP1/MVP2 work is modified.

## Risks / Rollback

Risk: building MVP3 against intended rather than actual MVP2 semantics. The
rollback is to stop before source edits and ask for a proper MVP1/MVP2 handoff.

