# Phase 3: The fold reads through the checkpointed read

Honors D3 (reuse the Event Store's existing `read_checkpointed`; `debt-ok`). Criterion 4 (code part; the live
figure is phase 4). Capability: `code:implement`.

## Inputs

- `plans/discussions/ds-r42bvbzode-watcher-tick-cpu/DISCUSSION.md` §3 C4, C5, R2; §4 D3.
- `packages/event-store/rust/src/read.rs:494` (`read_checkpointed`) and `packages/event-store/rust/src/checkpoint.rs`
  (`Checkpoint { path, reuse }`, what `load` checks: origin, the stream set, the `project` flag).
- The one existing consumer: `packages/git/node-addon/src/event_store.rs:448-459` and
  `src/state/work-event-store.mjs:63-69` (Node work state reads stream `project` with checkpoint file
  `.fgos/cache/event-history.json`, `src/util/fgos-file-registry.mjs:43`).
- `packages/supervision/rust/src/queue.rs` after phase 2 (`fold`, `Queue::open`).

## Files it may write

- `packages/supervision/rust/src/queue.rs`
- `packages/supervision/rust/tests/queue.rs`

## Steps

1. Pick the checkpoint file. Find the Rust door that resolves `.fgos` paths (`rg -n 'fgos_dir|\.fgos' packages/*/rust/src
   apps/fgos/src` for the existing resolver; one door, principle 1) and the path the queue's clone uses. If the
   queue's read request (origin, streams `{project}`, `project: true`) matches what the Node work-state read stores in
   `.fgos/cache/event-history.json`, use that same file: one history, one file. If the queries differ, use a sibling
   file in the same `.fgos/cache/` directory named for the queue, resolved through the same door; say which and why
   in the commit body. No config key (constraint).
2. `fold`: call `read_checkpointed(driver, repo, request, None, &Checkpoint { path, reuse: true }, None)` in place of
   `read`. Everything after the read (skipped mirrors, deferred, missing, the raised/handled fold, the cover) is
   unchanged.
3. Test in `tests/queue.rs`: a queue whose checkpoint file is corrupt or belongs to another store still answers the
   same raised/handled set (the store decides), and a second queue opened on the same store after appends sees the
   new events. These are the queue's own guarantees over the checkpoint; the checkpoint mechanics stay owned by the
   event-store tests.
4. Keep this as one commit on top of phase 2, so it reverts alone.

## Verify

`cargo test -p fgos-supervision --test queue --test watcher` and `cargo test -p fgos-event-store` green. Pass: the
queue tests of phase 2 pass unchanged on the checkpointed fold.

## Rollback

`git revert` this commit; the fold reads from zero again and criterion 4 is recorded as debt in the closing report.
