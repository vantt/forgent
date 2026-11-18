# Phase 14a — Git: `walk_changes`, the one history read door

The owner chose option B on 2026-11-18 (`reports/decision-261118-2126-p14-history-reader.md`). The Git component gets
one door call, `walk_changes`, that returns the commits changing a path set since a point. Ops-metrics' plan sources
(`plan_history.rs`) move onto it, and phase 14 reads discussion markers through it, so there is one history reader.
This closes backlog `p-vtalldv5zn`. Rust. lead:OPC reviews before land.

## Inputs
Step 0 first: re-grep every item, and run `git log -S'commit_records'` and `-S'walk'` on `packages/git/rust` and
`apps/fgos/src/wiring/observe_sources` for prior art.
- Today's walker: `apps/fgos/src/wiring/observe_sources/plan_history.rs` (`commit_records`, `with_walk_limit`, the
  `fgos_git` calls it composes; it walks every branch and diffs `plan.md` front matter; 30-80 s on this repository).
- Backlog row `p-vtalldv5zn` in `docs/backlog.md` (acceptance: a `fgos.plan.*` query over the default attention window
  finishes well under the watcher interval, measured and recorded in the row).
- The Git component's read doors (inspect/diff/blob) in `packages/git/rust/src/` and their spec rows in
  `docs/platform/git/spec.md`; a read door takes no write lock.
- Phase 14's parked reader on branch `sv/p14` (`discussion_source.rs`: first-parent walk, changed paths with rename
  entries, blob reads): its needs are an input to the door's shape; do not edit it here.

## Footprint
`packages/git/rust/src/**` (one new door call; keep it in its own module where possible, so it does not collide with
other Git work), `packages/git/rust/tests/**`, `docs/platform/git/spec.md`,
`apps/fgos/src/wiring/observe_sources/plan_history.rs`, `docs/backlog.md` (close `p-vtalldv5zn` only).

## Steps
1. Door: `walk_changes(repo, refs, since, paths) -> Vec<ChangedCommit>`.
   - `refs`: one or more refs, with first-parent only or all-reachable as an option.
   - `since`: a commit or an instant.
   - `paths`: pathspecs or prefixes.
   - Each `ChangedCommit` carries the oid, the commit time, its parent oid, and the changed paths with status and
     rename source (`from`).
   - A `blob(commit, path)` read is reused if one exists, else added in the same module.
   - One `git log`/`diff-tree` style invocation through the Git driver, bounded output, no write lock, no WAL.
2. Tests in `packages/git/rust/tests/` on real repos: a path set limits the commits returned; `since` excludes older
   commits; first-parent skips side-branch commits; a rename reports `from`; the root commit is included; and an
   output bound gives a named error.
3. Move `plan_history.rs` onto the door. The records it emits are unchanged (same kinds, attrs, ids). Measure one
   `fgos metrics query` over `fgos.plan.*` with the default attention window before and after, and record both times
   in `p-vtalldv5zn`, then mark the row done.
4. Git spec: a row for the door and a decision-history line.

## Verify
- `cargo test -j 4 -p fgos-git`; `cargo test -j 4 -p fgos` for the plan sources' tests; clippy `-D warnings`; fmt;
  `cargo check` for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin`; the census scan reports 0 undeclared.
- The plan-status records before and after are equal on this repository (same ids), and the query is faster.

## Rollback
Revert the phase commit; `plan_history.rs` returns to its own walk.
