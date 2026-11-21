# Progress: phase 6 is reviewed and green; its land waits on another session's dirty file

Lead: head:lead-forgent-261120-0625-work-d-ce9f6. Date: 2026-11-21, Asia/Saigon.

## Outcome

Branch `work-data-model/p06b` (tip `eef163ff5`) implements criterion 6 in the real land door (`packages/supervision/rust/src/land.rs`). When a paths land turns a plan to done, the door does the following in the same commit:
- sets `status: done` on each backlog item the plan cites, for both minted and legacy ids;
- regenerates `plans/backlog.md` through an app-supplied port, which uses the one tracked-scoped generator, now in `portfolio.rs` and shared with session write.

The door refuses an invalid `p-` source, a missing or ambiguous item, and a dirty item it adds itself, leaving nothing changed. After a push whose outcome is unknown, the door keeps its writes whenever the commit stays.

The land is blocked. `fgos land work-data-model/p06b` was refused four times with `main-checkout-dirty-overlap` on `docs/discussions/orchestration-skeleton/DISCUSSION.md`. That file holds an uncommitted edit from the orchestration-skeleton shaper session, and the sync to the remote tip would overwrite it. The lead does not touch another session's files. The land is retried once that session lands its edit. If the supervisor sees the file still dirty, the shaper needs to land it.

## What ran

1. Unit `c-127816` wrote the door, the port and three tests. It could not run cargo.
2. The first review found 4 blockers:
   - the door restored its writes while the commit stayed;
   - uncommitted item edits rode along in the land commit;
   - a crash left items open on main;
   - the index was built from stray working-tree files.

   It also found 6 smaller issues. All were fixed in `3ce31a573`.
3. The second review found 3 new blockers:
   - the index was not regenerated when no item changed;
   - real legacy `p-<8hex>` ids were refused;
   - items the caller names in `--paths` were refused.

   It also found 3 smaller issues. All were fixed in `b2ed67842`.
4. The third review found no blocking defects. Its two small points were fixed in `6635a3e7d`:
   - the file list is built only when items can close, so every other paths land costs what it did before;
   - items are matched by their frontmatter `id`.
5. Gate fixes: the "write a YAML frontmatter fence" door row flagged a reader's `"---"` comparison. Both readers in `land.rs` now use one `is_fence` helper (`eef163ff5`).

## Lead decisions inside the approved frame

- A legacy-shaped id that names an existing item file is closed like a minted one. Only a `p-` entry that is neither minted nor legacy is refused. The id shapes stay owned by `portfolio.rs` and reach the door through the port.
- A `dropped` item is left as is.
- Session write passes no index port, so its behaviour is unchanged. Whether a plan set to done through `fgos session write` should close items is an open follow-up.
- `fgos-durable-file` is not a dependency of fgos-supervision, so the door writes with std. A failed restore is named in the refusal's `cleanup_note`.

## Verify by the lead

The following are green:
- `cargo test -p fgos-supervision` in full (land: 53);
- `cargo test -p fgos --test session_write_publish --test portfolio_check --test migrate_portfolio` (5, 15 and 18);
- `cargo clippy -p fgos --all-targets` and `-p fgos-supervision --lib --test land` with `-D warnings`;
- `cargo fmt --all --check`;
- the architecture door rows.

`queue.rs:413` fails clippy on main, outside this plan.

## Open follow-ups

- The index generator reads the working-tree content of tracked items and plans that are not in the commit. Session write already does this.
- Should a plan set to done through session write close items?
- Phase 5 unit 2 (the data move) still waits on `q-exu5x27hbq`.
