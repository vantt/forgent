# Phase 1: Push outcomes of the paths land

Decisions: D5, D6 of `plans/discussions/ds-izibwo45vm-plan-claim-who-and-where/DISCUSSION.md`. Capability:
`code:implement`.

## Inputs

- The discussion, sections 3 (row D3) and 6 (the push-outcomes table).
- `packages/supervision/rust/src/land.rs`: `paths_commit` (the push after `scoped_commit`, around the comment "A push
  that failed without an answer may have reached the remote"), `push_local`, `paths_attempt` (the `kept` cell),
  `sync_target` (`pushed_orphan`), `catch_up`.
- `packages/git/rust/src/inspect.rs` `main_checkout_scoped_commits`; `packages/git/rust/src/refs.rs` around line 168
  (pre-send `resource-recovery-required` / `resource-busy`); `packages/git/rust/src/remote.rs` `transfer_refs_with`;
  `ResultCode` in `packages/git/rust/src/lib.rs`.
- Evidence: `.fgos/observe/records/fc4222ff-0936-4c7a-a78e-68d49e6badce.jsonl`, the `fgos.supervisor.wake` records at
  07:32:22Z (`publish-failed:resource-recovery-required`) and 07:33:07Z (`publish-failed:write-branch-ahead`);
  commits ded8d6557 and 03888152b; commit 37e4ee719 (the orphan push).
- Owning tests: `packages/supervision/rust/tests/land.rs`.

## Files it may write

`packages/supervision/rust/src/land.rs`, `packages/supervision/rust/tests/land.rs`,
`packages/git/rust/src/inspect.rs`, `packages/git/rust/tests/**`.

## Steps

1. **Pre-send refusal (D5).** Today `push_local` maps any `push_refs` error through `from_git`, and `?` returns it
   from `paths_commit` with `kept` still true, so the commit stays. Confirm from `remote.rs` which `ResultCode`
   values the door can return after the transfer has started (expected: only `RemoteOutcomeUnknown`). Then, in
   `paths_commit`, a push error whose code is not `RemoteOutcomeUnknown` goes through the existing `unpublished`
   closure: the commit is undone, `kept` is false, and `paths_attempt` restores the door's bytes; the refusal keeps
   the Git door's code. Add no retry for it.
2. Extend the owning test in `tests/land.rs`: commit, a pre-send `resource-recovery-required` (a dead pending chain on
   the ref, as `refs.rs` detects it), then local main equals origin and the named path holds the bytes it held on
   entry. The existing unknown-outcome test stays unchanged: that commit still stays.
3. **Recognition (D6).** Reproduce first: build the 07:33:07Z state (a land-door commit of the main checkout left
   unpushed, next to the dead pending chain) and show which branch of `sync_target` /
   `main_checkout_scoped_commits` makes `foreign` non-empty or `ours` empty. Candidates to rule in or out:
   `Wal::open_existing` or `retained` erroring (the function swallows both into an empty list), the chain pruned
   past `WAL_SCAN_BOUND`, the outcome not recorded as `Outcome::Commit`, a `payload.worktree` that differs from the
   trusted main root inside the sandbox. Write the proven cause in the test's doc comment, in behaviour words.
4. Fix exactly at the proven cause, through the existing `pushed_orphan` path. If the cause is a swallowed WAL error,
   surface it as a refusal naming the cause instead of reading it as "not ours". Add no new mechanism.
5. Extend `tests/land.rs` (and `packages/git/rust/tests/` if the fix is in `inspect.rs`) with the reproduced case:
   the catch-up pushes the leftover commit and the next land proceeds.

## Verify

`cargo test -p fgos-supervision --test land` and `cargo test -p fgos-git` pass, and both new cases fail on the base
commit (show the red run in the phase report).

## Rollback

Revert the phase's merge commit; no data or config migrates.
