# Phase 2a: Retire the Node agent hook table (door row `agent-hook-table`)

## Waits
None. Owner decision 2026-11-23 (via Miu, relayed by lead:SUPERVISOR 14:15): `src/setup/agent-hooks.mjs` is deleted
either way, and this phase does not wait for the mailbox lane. The mailbox is re-tested afterwards under backlog
`p-irt4weqipe`, which owns the re-measurement and does not block this phase.

## Inputs
- Row `packages/component-authority/model/doors/agent-hook-table.yaml`. Survivor: `packages/distribution/rust/src/agent_hooks.rs`. Debt: `src/setup/agent-hooks.mjs`, `scripts/lib/mailbox-live-confined.mjs`.
- The Node hook table's only product import is `scripts/lib/mailbox-live-confined.mjs:39` (`installClaudeHook`,
  `installCodexHook`, `installOmpHook`, `installPiHook`, used at :158-174). The survivor's door for Node is the host
  verb `fgos wire-agents` (RUL111), reached through `invokeHost` (`src/util/host-bin.mjs`). The confinement module
  itself stays: `scripts/lib/mailbox-behaviour-run.mjs`, `scripts/lib/mailbox-behaviour-ack.mjs`,
  `test/live/mailbox-behaviour-ack.live.mjs`, `test/live/mailbox-wake-probe.live.mjs` and
  `test/scripts/mailbox-live-confined.test.mjs` import it.
- Hash freezes that name a debt file:
  - `test/live/mailbox-behaviour.v7e-addendum.json` freezes `src/setup/agent-hooks.mjs`;
  - `v7h`, `v7i` and `v7j` freeze both debt files (their builders are `scripts/lib/mailbox-behaviour-v7e.mjs:30`,
    `-v7h.mjs:31-33`, `-v7i.mjs:26-28` and `-v7j.mjs:72`);
  - `v7k`, `v7m` and `v7n` freeze `scripts/lib/mailbox-live-confined.mjs` only.
- Tests that read the real files: `test/scripts/mailbox-behaviour-v7e.test.mjs:33-51`, `-v7h.test.mjs:29-48`,
  `-v7i.test.mjs:29-48` and `-v7j.test.mjs:47-96` copy them from the repository into a scratch repo and assert the
  freeze lists. They fail as soon as `agent-hooks.mjs` is deleted.
- Stale comments name the deleted file: `packages/mailbox/rust/store/src/adapters/extension.rs:1` and the
  `delivery` strings in the v7e/v7h/v7i builders.

## Files it may write
src/setup/agent-hooks.mjs, scripts/lib/mailbox-live-confined.mjs, test/setup/agent-hooks.test.mjs, test/scripts/mailbox-live-confined.test.mjs, scripts/lib/mailbox-behaviour-v7e.mjs, scripts/lib/mailbox-behaviour-v7h.mjs, scripts/lib/mailbox-behaviour-v7i.mjs, scripts/lib/mailbox-behaviour-v7j.mjs, test/live/mailbox-behaviour.v7e-addendum.json, test/live/mailbox-behaviour.v7h-addendum.json, test/live/mailbox-behaviour.v7i-addendum.json, test/live/mailbox-behaviour.v7j-addendum.json, test/live/mailbox-behaviour.v7k-addendum.json, test/live/mailbox-behaviour.v7m-addendum.json, test/live/mailbox-behaviour.v7n-addendum.json, test/scripts/mailbox-behaviour-v7e.test.mjs, test/scripts/mailbox-behaviour-v7h.test.mjs, test/scripts/mailbox-behaviour-v7i.test.mjs, test/scripts/mailbox-behaviour-v7j.test.mjs, packages/mailbox/rust/store/src/adapters/extension.rs, test/suite-baseline.json, packages/git/contracts/mutation-census.v1.json, packages/component-authority/model/doors/agent-hook-table.yaml

## Rules every retirement step follows
- No twin (CA-D2, discussion §3 row 3d): every caller moves to the survivor and the copy is deleted in the same commit. The commit message names the survivor, the deleted path and the last SHA that still had it. The owning area spec's "Lịch sử quyết định" line goes in the phase report for phase 11 to place.
- Before deleting, find the test that owns the behaviour the copy gave its callers. If none does, record vectors from the copy and replay them on the survivor, in the survivor's own test file (design principle 8; the 488d3ab28 pattern).
- A caller outside this phase's files: stop, write Status BLOCKED with the file named, and change nothing. Do not widen.
- Re-read the door row first. A running plan may already have removed some debt; a row with no `debt` left needs only the check below.

## Steps
1. Confirm with `rg` that no file outside this list imports either debt file.
2. Check that the recorded hook vectors are replayed by `agent_hooks.rs`'s tests, and move any case only
   `test/setup/agent-hooks.test.mjs` owns onto them.
3. Re-point `scripts/lib/mailbox-live-confined.mjs` from the Node hook table to the survivor: install each
   workspace's hooks with `fgos wire-agents` through `invokeHost`, aimed at the confined workspace. First confirm
   that the verb can target that workspace. If it cannot without a new flag, stop with `Status: BLOCKED` and name
   the missing option; never widen. Keep `test/scripts/mailbox-live-confined.test.mjs` green on the new path.
4. Retire or re-point the frozen sets, in the same commit:
   - The v7e, v7h, v7i and v7j addenda were measured against bytes that no longer exist, so they are retired. Delete
     each addendum and its builder's freeze entry for a deleted file. Delete or narrow each freeze test in
     `test/scripts/mailbox-behaviour-v7{e,h,i,j}.test.mjs` so it asserts only behaviour that still exists (stop
     rules, verdicts, homes, scoring). Never assert a freeze of a deleted file.
   - The v7k, v7m and v7n addenda freeze `mailbox-live-confined.mjs`, whose bytes step 3 changes. Their hashes no
     longer match. Mark each one retired the same way, or re-point it, as its builder allows.
   - The phase report lists every addendum and test retired or narrowed, with its last SHA. It names backlog
     `p-irt4weqipe` as the owner of the mailbox re-measurement that produces new frozen sets on the new bytes.
5. Delete `src/setup/agent-hooks.mjs` and `test/setup/agent-hooks.test.mjs`. Fix the comment at `extension.rs:1` and
   the `delivery` strings so they name the Rust survivor. Remove both debt entries. Regenerate the census with
   `node scripts/git-one-door-scan.mjs --write-census`, and drop the retired tests from `test/suite-baseline.json`.

## Verify
`node --test test/architecture.test.mjs test/setup/git-mutation-census.test.mjs test/scripts/mailbox-live-confined.test.mjs test/scripts/mailbox-behaviour-v7*.test.mjs` is green, and the row has no `debt`. `cargo test -p fgos-distribution` and `cargo test -p fgos-mailbox` are green. Searching `rg -n "agent-hooks\.mjs"` outside plans, archive and CHANGELOG finds nothing.

## Rollback
Revert the phase commit.
