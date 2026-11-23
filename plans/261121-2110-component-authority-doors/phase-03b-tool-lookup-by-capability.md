# Phase 3b: Close the Node tool-provider twin (door row `tool-lookup-by-capability`)

## Waits
Phase 8 of `261122-2108-delete-dead-node-execution-closure`, which owns deleting `src/runner/dispatch/tool-providers.mjs` and the tests that import it (the row's `retiredBy`, `p-24xw2cwdvo`). The phase stays `draft` until that phase lands.

## Inputs
- Row `packages/component-authority/model/doors/tool-lookup-by-capability.json`. Survivor: `packages/execution/rust/src/tools.rs`. Debt: `src/runner/dispatch/tool-providers.mjs` (created as a twin in 5a7045242).

## Files it may write
packages/component-authority/model/doors/tool-lookup-by-capability.json

## Rules every retirement step follows
- No twin (CA-D2, discussion §3 row 3d): every caller moves to the survivor and the copy is deleted in the same commit. The commit message names the survivor, the deleted path and the last SHA that still had it. The owning area spec's "Lịch sử quyết định" line goes in the phase report for phase 11 to place.
- Before deleting, find the test that owns the behaviour the copy gave its callers. If none does, record vectors from the copy and replay them on the survivor, in the survivor's own test file (design principle 8; the 488d3ab28 pattern).
- A caller outside this phase's files: stop, write Status BLOCKED with the file named, and change nothing. Do not widen.
- Re-read the door row first. A running plan may already have removed some debt; a row with no `debt` left needs only the check below.

## Steps
1. Confirm the file is gone. If the closure plan kept it alive (its `reports/closure.md` names the reason), stop and report the owning step.
2. Remove the debt entry, citing the closure plan's deleting commit and the last SHA.

## Verify
`node --test test/architecture.test.mjs` green, no `debt` in the row.

## Rollback
Revert the phase commit.
