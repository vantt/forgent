# Phase 2 report: session write publishes rows through the land door

## Impact analysis
GitNexus / `fgos dispatch decide --for impact-analysis` were not used in the sandbox; callers were cross-checked with `rg`.
`refresh_backlog_index` and `publish` are private to `session_write_publish.rs`. `publish` is reached only through
`publisher()` (main.rs:288, supervision.rs:846, 2795, the test). Blast radius: the `session write` path only. Risk: low.

## Changes
- `apps/fgos/src/wiring/session_write_publish.rs`
  - `refresh_backlog_index` became `check_backlog_item`. It keeps the item checks (frontmatter contract, `<id>-<slug>.md`
    name, minted id for a new file) and no longer generates or writes the index.
  - Removed the `BACKLOG_INDEX` / `INDEX_MODE` constants.
  - `publish` lands only `[path]`. It passes a `BacklogPort` (`portfolio::classify_backlog_ref` plus an index closure over
    `tracked_item_paths` and `generate_backlog_index_for_commit`), so the door writes and commits the index.
  - `catch_up_once` is unchanged (`backlog_index: None`).
- `apps/fgos/tests/session_write_publish.rs`
  - The envelope grant is `["docs/note.md", "plans/backlog/*"]`, so `plans/backlog.md` is no longer granted.
  - The stale-base, dirty-path, publish and retry cases use `docs/note.md` (a new tracked fixture file) and prove the same
    behaviours. The retry gate `when` is now `docs/**`.
  - The row-write case is unchanged. It asserts the commit holds exactly the row plus `plans/backlog.md`, and that the
    index holds the row.

## Deviation (needs a write outside scope)
The land command's index builder, `backlog_index` in `apps/fgos/src/wiring/supervision.rs`, is private. Reusing it needs a
visibility change in that file, which this phase may not write. `publish` therefore holds a ~8-line closure with the same
body. Follow-up: make `backlog_index` `pub(super)` in `supervision.rs` and call it from `publish`, then delete the closure.

## Verification
- `cargo check -p fgos --tests`: passes, with no warnings from the two touched files.
- `cargo test -p fgos --test session_write_publish`: does not link here (`ort-sys` link error, no `ORT_LIB_LOCATION`), so
  the tests were not run. The behaviour is unproven by execution.
- `rg -n "generate_backlog_index\b" apps/fgos/src/wiring/session_write_publish.rs` returns nothing.

## Fix round
- `backlog_index` in `apps/fgos/src/wiring/supervision.rs` is now `pub(super)`; `publish` in
  `apps/fgos/src/wiring/session_write_publish.rs` calls it and the duplicated closure is gone. The host has one builder
  of the `BacklogPort` index.
- `rg -n "generate_backlog_index" apps/fgos/src/wiring/session_write_publish.rs` returns nothing.
- `apps/fgos/tests/session_write_publish.rs` compiles `session_write_publish.rs` by path and cannot compile
  `supervision.rs` (it pulls in the whole host), so it declares a small `supervision` module with the same body as the
  host's builder. Production has one builder; the test has a stand-in. Cleaner follow-up: move the builder into
  `wiring/portfolio.rs` (already compiled by the test), which is outside this unit's write scope.
- `cargo check -p fgos --tests` passes; `cargo fmt --all --check` passes. Tests were not run (the `ort-sys` link error
  from the first round still applies).
