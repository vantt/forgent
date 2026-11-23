# Phase 3e: Close the Node and holder-lock global-directory copies (door row `global-fgos-directory`)

## Waits
- Phase 8 of `261122-2108-delete-dead-node-execution-closure`, which deletes `src/runner/dispatch/llm-accounts.mjs` and `src/runner/dispatch/confinement/probes/harness.mjs` with the dead closure.
- Backlog item `p-n22bigucgp` (two rules decide the user's home directory). `packages/holder-lock/rust/src/state_root.rs` reads HOME first on every platform while Config reads USERPROFILE on Windows; picking the one rule changes Windows behaviour, so that item settles it.
The phase stays `draft` until both land. The row's `apps/fgos-gateway/src/gateway.rs` entry is phase 9's.

## Inputs
- Row `packages/component-authority/model/doors/global-fgos-directory.yaml`. Survivors: `packages/config/rust/src/machine.rs`, `src/config/facade.mjs`. Debt for this phase: the three files above.

## Files it may write
packages/component-authority/model/doors/global-fgos-directory.yaml

## Rules every retirement step follows
- No twin (CA-D2, discussion §3 row 3d): every caller moves to the survivor and the copy is deleted in the same commit. The commit message names the survivor, the deleted path and the last SHA that still had it. The owning area spec's "Lịch sử quyết định" line goes in the phase report for phase 11 to place.
- Before deleting, find the test that owns the behaviour the copy gave its callers. If none does, record vectors from the copy and replay them on the survivor, in the survivor's own test file (design principle 8; the 488d3ab28 pattern).
- A caller outside this phase's files: stop, write Status BLOCKED with the file named, and change nothing. Do not widen.
- Re-read the door row first. A running plan may already have removed some debt; a row with no `debt` left needs only the check below.

## Steps
1. Confirm the two Node files are gone and `state_root.rs` resolves through `machine::global_dir` (or the rule `p-n22bigucgp` settles).
2. Remove those three debt entries; leave the gateway entry for phase 9.

## Verify
`node --test test/architecture.test.mjs` green, only the gateway entry left in the row's `debt`.

## Rollback
Revert the phase commit.
