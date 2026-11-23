# Phase 3d: Close the Node dispatch decider twin (door row `decide-a-dispatch`)

## Waits
Phase 8 of `261122-2108-delete-dead-node-execution-closure`, which owns deleting `src/runner/dispatch/plan.mjs` and rewiring its two test importers (`test/state/work-size-rigor.test.mjs`, `test/setup/capability-catalog-doctrine.test.mjs`; both in that plan's files). The phase stays `draft` until that phase lands.

## Inputs
- Row `packages/component-authority/model/doors/decide-a-dispatch.json`. Survivor: `packages/execution/rust/src/decide.rs`. Debt: `src/runner/dispatch/plan.mjs`.

## Files it may write
packages/component-authority/model/doors/decide-a-dispatch.json

## Rules every retirement step follows
- No twin (CA-D2, discussion §3 row 3d): every caller moves to the survivor and the copy is deleted in the same commit. The commit message names the survivor, the deleted path and the last SHA that still had it. The owning area spec's "Lịch sử quyết định" line goes in the phase report for phase 11 to place.
- Before deleting, find the test that owns the behaviour the copy gave its callers. If none does, record vectors from the copy and replay them on the survivor, in the survivor's own test file (design principle 8; the 488d3ab28 pattern).
- A caller outside this phase's files: stop, write Status BLOCKED with the file named, and change nothing. Do not widen.
- Re-read the door row first. A running plan may already have removed some debt; a row with no `debt` left needs only the check below.

## Steps
1. Confirm the file is gone; otherwise stop and report the owning step from the closure report.
2. Remove the debt entry with the deleting commit and last SHA.

## Verify
`node --test test/architecture.test.mjs` green, no `debt` in the row.

## Rollback
Revert the phase commit.
