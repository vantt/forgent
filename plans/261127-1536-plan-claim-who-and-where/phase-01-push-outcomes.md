# Phase 1: Push outcomes of the paths land

Decisions D5 and D6 of
[ds-izibwo45vm](../discussions/ds-izibwo45vm-plan-claim-who-and-where/DISCUSSION.md). This phase lands first among the
code phases, because it removes stranded commits on every head write, not only on admission.

## Inputs

- `packages/supervision/rust/src/land.rs`: `paths_commit` (the push step and `unpublished`/`undo_commit`),
  `push_local` (maps every Git door error through `from_git`, so a pre-send refusal escapes the undo while `kept`
  stays true), and `sync_target` (the `pushed_orphan` branch: pushes only when every commit ahead is recognised and the
  merge slot is held, else `land-target-ahead`).
- `packages/git/rust/src/inspect.rs` `main_checkout_scoped_commits` (WAL `ScopedCommit` chains from the main
  checkout with a `Commit` outcome, scan bound `WAL_SCAN_BOUND`, stops at the first commit it does not recognise).
- `packages/git/rust/src/refs.rs:150-170`: the pre-send refusals `resource-busy` (live writer) and
  `resource-recovery-required` (dead pending chain).
- `apps/fgos/src/wiring/session_write_publish.rs` `catch_up_once`: `land-target-ahead` becomes `write-branch-ahead`.
- Evidence: observe records `fgos.supervisor.wake` at 2026-11-27T07:32:22Z (`publish-failed:resource-recovery-required`)
  and 07:33:07Z (`publish-failed:write-branch-ahead`) in
  `.fgos/observe/records/fc4222ff-0936-4c7a-a78e-68d49e6badce.jsonl` on fg-server; commits ded8d6557 and 03888152b.
- The existing tests in `packages/supervision/rust/tests/land.rs` for the rejected push and the orphan push (search
  `land-paths-push-rejected` and `pushed_orphan`); extend them, do not add a parallel file.

## Files it may write

`packages/supervision/rust/src/land.rs`, `packages/supervision/rust/tests/land.rs`,
`packages/git/rust/src/inspect.rs` (only if recognition is the hole; its proof goes in an inline test module or in
`tests/land.rs`), `plans/261127-1536-plan-claim-who-and-where/reports/push-outcomes-cause.md`.

## Steps

1. **Prove the second hole first.** In `tests/land.rs`, reproduce the 2026-11-27 sequence: a paths land commits,
   its push is refused before sending (stage a dead pending Git operation on the ref, as `refs.rs` checks), then a
   later catch-up runs under the merge slot. Observe which condition makes the commit read as foreign. Candidates:
   the WAL chain of the scoped commit is not retained or has no `Commit` outcome after the refused push, the scan
   bound, the order of `ahead` combined with the `break`, or the slot not being held. Write the cause into
   `plans/261127-1536-plan-claim-who-and-where/reports/push-outcomes-cause.md`.
2. **D5.** In `paths_commit`, treat a push error whose Git door code is a pre-send refusal (`resource-busy`,
   `resource-recovery-required`, and any other code the door documents as "nothing sent") like a rejection: undo the
   commit through `undo_commit` and return the refusal with its code, so `paths_attempt` restores the door's bytes
   and the caller (admission) restores the path. Only `Remote::Unknown` keeps the commit. Decide from the Git door's
   error code, never from message text.
3. **D6.** Fix recognition where step 1 showed it failed, inside the existing `pushed_orphan` path or
   `main_checkout_scoped_commits`. Add no new push path.
4. Extend the owning tests: (a) pre-send refusal leaves local main equal to origin and the path bytes back as they
   were; (b) a catch-up under the slot pushes this checkout's own leftover land commit in the shape step 1 found;
   (c) a foreign commit ahead still refuses `land-target-ahead`.

## Verify

`cargo test -p fgos-supervision --test land` and `cargo test -p fgos-git` pass. The new tests fail on the base commit
(state that in the report).

## Rollback

Revert the phase commit. Behaviour returns to keeping the commit on any non-rejection push error.
