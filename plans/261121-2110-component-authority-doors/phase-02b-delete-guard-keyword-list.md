# Phase 2b: Close the delete-guard keyword list twin (door row `delete-guard-keyword-list`)

## Waits
Phase 2a, which deletes `src/setup/agent-hooks.mjs`, the only debt file of this row. The phase stays `draft` until 2a is `done`.

## Inputs
- Row `packages/component-authority/model/doors/delete-guard-keyword-list.yaml`. Survivor: `packages/distribution/rust/src/agent_hooks.rs`. Debt: `src/setup/agent-hooks.mjs` (its own literal keyword list).
- `test/setup/agent-hooks.test.mjs` pinned the Node literal list equal to the data file; phase 2a deletes that test.

## Files it may write
packages/distribution/rust/src/agent_hooks.rs, packages/component-authority/model/doors/delete-guard-keyword-list.yaml

## Rules every retirement step follows
- No twin (CA-D2, discussion §3 row 3d): every caller moves to the survivor and the copy is deleted in the same commit. The commit message names the survivor, the deleted path and the last SHA that still had it. The owning area spec's "Lịch sử quyết định" line goes in the phase report for phase 11 to place.
- Before deleting, find the test that owns the behaviour the copy gave its callers. If none does, record vectors from the copy and replay them on the survivor, in the survivor's own test file (design principle 8; the 488d3ab28 pattern).
- A caller outside this phase's files: stop, write Status BLOCKED with the file named, and change nothing. Do not widen.
- Re-read the door row first. A running plan may already have removed some debt; a row with no `debt` left needs only the check below.

## Steps
1. Confirm `src/setup/agent-hooks.mjs` is gone.
2. Make sure `agent_hooks.rs` has a test that pins its keyword list equal to the data file; add it there if the Node test was the only proof.
3. Remove the debt entry.

## Verify
`node --test test/architecture.test.mjs` green, no `debt` in the row; `cargo test -p fgos-distribution` green.

## Rollback
Revert the phase commit.
