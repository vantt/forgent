# Phase 1: Catch-up finishes an unpublished land-door commit

Capability: `code:implement`. Source row: p-q2dn2cnzlq.

## Inputs

- `plan.md` of this directory (Cause, Non-goals, Risks).
- `packages/supervision/rust/src/land.rs`: `catch_up`, `Lander::sync_target`, `land_paths` (the `scoped_commit`
  then `push_local` sequence, `undo_commit`, the rejected-push retry).
- `apps/fgos/src/wiring/session_write_publish.rs` (read only): a head write calls the same `catch_up` and
  `land`; its `BranchAhead` mapping must keep working for a by-hand commit.
- `packages/git/rust/src/scoped_commit.rs` and `packages/git/rust/src/wal.rs` (read only): how a ScopedCommit
  chain records its worktree, authority binding, writer and resulting commit oid; `Wal::active`, `scan`,
  compacted chains.
- `packages/git/rust/tests/land_push_catch_up.rs`, `packages/supervision/rust/tests/land.rs` (line ~709 is the
  current `land-target-ahead` test) for fixtures.

## Footprint

- `packages/supervision/rust/src/land.rs`
- `packages/supervision/rust/tests/land.rs`
- `packages/git/rust/src/inspect.rs`
- `plans/261125-1558-land-door-recovers-half-done-work/reports/`

## Steps

1. **Prove the cause.** From an unconfined session, read the Git journal (`fgos git status --json`, and the
   chains by id) for the three 2026-11-25 incidents: dead writer `land-477002` (13:23), by-hand commit
   `b4581336d`, supervisor land that died at the push step leaving `83c313366` (14:12). For each, name the
   door and the step it stopped at. Write `reports/cause.md`. If the journal contradicts the plan's Cause
   section, stop and report `NEEDS_CONTEXT` with the evidence.
2. Add a read on `GitDriver` in `inspect.rs`: for a list of commit oids on the main checkout's branch, which
   were made by a ScopedCommit chain of the main checkout (the paths-land/head-write commit), from live,
   retained or compacted journal records. Unknown provenance answers "not ours".
3. In `sync_target`, when local main is strictly ahead of the fetched remote tip (remote tip is an ancestor of
   local), list the ahead commits. If every one is the land door's own (step 2), push local main with
   `push_local` under the merge slot already held, then re-fetch and continue as an in-sync target. If any is
   not the land door's, keep `land-target-ahead` unchanged, naming the foreign commits.
4. If that push is rejected (the remote moved meanwhile), fall into the existing diverged path: refuse with
   the existing code; never force. A push without an answer stays as today and the next sync finds it on origin.
5. Tests in `packages/supervision/rust/tests/land.rs`, extending the existing `land-target-ahead` test as the
   owning proof:
   - a paths land whose run stops after its local commit (simulate the death after `scoped_commit`, using the
     fixture's existing crash/checkpoint hook if present), then another writer's paths land: succeeds, no hand
     push, origin/main holds both commits;
   - a by-hand commit on local main: still `land-target-ahead`, origin unchanged.

## Verify

```bash
cargo test -p fgos-supervision --test land
cargo test -p fgos-git --test land_push_catch_up
```

Pass: both green, the two new cases present, `reports/cause.md` names door and step for all three incidents.

## Rollback

`git revert` the phase commit. No journal or contract format changes in this phase.
