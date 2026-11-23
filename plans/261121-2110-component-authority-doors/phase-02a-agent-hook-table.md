# Phase 2a: Retire the Node agent hook table (door row `agent-hook-table`)

## Waits
The mailbox lane's re-measurement of its frozen experiment sets without the Node hook table (the row's `retiredBy`). Until then `src/setup/agent-hooks.mjs` and `scripts/lib/mailbox-live-confined.mjs` are frozen measurement inputs: their bytes are hashed by `test/live/mailbox-behaviour.v7e/v7h/v7i/v7j-addendum.json` and asserted by `test/scripts/mailbox-behaviour-v7*.test.mjs` (unit report reports/unit-261123-0819-p02-result.md). No backlog item owns that re-measurement yet; the supervisor asks the secretary for one. The phase stays `draft` until it lands.

## Inputs
- Row `packages/component-authority/model/doors/agent-hook-table.json`. Survivor: `packages/distribution/rust/src/agent_hooks.rs`. Debt: `src/setup/agent-hooks.mjs`, `scripts/lib/mailbox-live-confined.mjs`.
- Callers today: `test/live/mailbox-claude.live.mjs`, `test/live/mailbox-behaviour.live.mjs`, `scripts/lib/mailbox-behaviour-run.mjs`, `scripts/lib/mailbox-behaviour-ack.mjs`, `test/scripts/mailbox-live-confined.test.mjs`, `test/setup/agent-hooks.test.mjs`. After the re-measurement the mailbox lane's files no longer import either debt file; re-check with `rg`.

## Files it may write
src/setup/agent-hooks.mjs, scripts/lib/mailbox-live-confined.mjs, test/setup/agent-hooks.test.mjs, test/suite-baseline.json, packages/git/contracts/mutation-census.v1.json, packages/component-authority/model/doors/agent-hook-table.json

## Rules every retirement step follows
- No twin (CA-D2, discussion §3 row 3d): every caller moves to the survivor and the copy is deleted in the same commit. The commit message names the survivor, the deleted path and the last SHA that still had it. The owning area spec's "Lịch sử quyết định" line goes in the phase report for phase 11 to place.
- Before deleting, find the test that owns the behaviour the copy gave its callers. If none does, record vectors from the copy and replay them on the survivor, in the survivor's own test file (design principle 8; the 488d3ab28 pattern).
- A caller outside this phase's files: stop, write Status BLOCKED with the file named, and change nothing. Do not widen.
- Re-read the door row first. A running plan may already have removed some debt; a row with no `debt` left needs only the check below.

## Steps
1. Confirm the re-measurement landed and that no file outside this list imports either debt file.
2. Check that the recorded hook vectors are replayed by `agent_hooks.rs`'s tests; move any case only `test/setup/agent-hooks.test.mjs` owns onto them.
3. Delete `src/setup/agent-hooks.mjs` and its test, and the Node-table import in `scripts/lib/mailbox-live-confined.mjs` (delete the file if the re-measurement left it unused). Remove both debt entries. Regenerate the census with `node scripts/git-one-door-scan.mjs --write-census` and drop the retired test from `test/suite-baseline.json`.

## Verify
`node --test test/architecture.test.mjs test/setup/git-mutation-census.test.mjs` green, no `debt` in the row; `cargo test -p fgos-distribution` green.

## Rollback
Revert the phase commit.
