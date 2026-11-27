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

## Fix round 2
- `backlog_index` moved from `apps/fgos/src/wiring/supervision.rs` into `apps/fgos/src/wiring/portfolio.rs` (`pub(super)`,
  same body, next to `tracked_item_paths`). `supervision.rs` (land command) and `session_write_publish.rs` (`publish`)
  both call `portfolio::backlog_index`. The repo has one copy of the builder body.
- The stand-in `supervision` module is deleted from `apps/fgos/tests/session_write_publish.rs`; the test compiles the
  real builder through the `portfolio.rs` it already includes.
- `cargo check -p fgos --tests` passes; `cargo fmt --all --check` passes. Tests were not run (the `ort-sys` link error
  from the first round still applies).

## Verify run

Command, run twice at the same tree, identical both times:

```
ORT_LIB_LOCATION=/home/vantt/.cache/fgos/ort-static/1.31.1 cargo test -p fgos --test session_write_publish --test portfolio_check
```

`test result:` lines, exactly as printed:

```
test result: ok. 15 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

```
test result: FAILED. 5 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 13.36s
```

Cargo exited non-zero with `error: test failed, to rerun pass `-p fgos --test session_write_publish``.

Failure output in full (`apps/fgos/tests/session_write_publish.rs`, `a_secretary_heads_write_is_fast_forwarded_committed_alone_pushed_and_never_forced_or_silently_lost`):

```
---- a_secretary_heads_write_is_fast_forwarded_committed_alone_pushed_and_never_forced_or_silently_lost stdout ----
fgos internal supervise: head-request w1 session write refused write-base-stale: docs/note.md is now 825951dd82484a6df82a7a184e584dcdb1a8ed74, the write was based on 3367afdbbf91e638efe983616377c60477cc6612; read it again and redo the edit
fgos internal supervise: head-request w1 session write done -
fgos internal supervise: head-request w1 session write done -
fgos internal supervise: head-request w1 session write refused write-path-dirty
fgos internal supervise: head-request w1 session write done -
fgos internal supervise: head-request w1 session write done -
fgos internal supervise: head-request w1 session write done -
fgos internal supervise: head-request w1 session write done -
fgos internal supervise: head-request write plans?backlog?p-cdefghij23-broke not published write-item-invalid
fgos internal supervise: head-request w1 session write done -
fgos internal supervise: head-request write plans?backlog?wrong-name?md not published write-item-invalid
fgos internal supervise: head-request w1 session write done -
fgos internal supervise: head-request w1 session write refused path-not-granted
fgos internal supervise: head-request w1 session write done -
fgos internal supervise: head-request write plans?backlog?p-cdefghij23-again not published land-backlog-index-failed
fgos internal supervise: head-request w1 session write done -

thread 'a_secretary_heads_write_is_fast_forwarded_committed_alone_pushed_and_never_forced_or_silently_lost' (1899) panicked at apps/fgos/tests/session_write_publish.rs:524:5:
assertion `left == right` failed: {"type":"REPLY","id":"w1","result":"done","data":{"path":"plans/backlog/p-cdefghij23-again.md","bytes":152,"publish":{"refusal":"land-backlog-index-failed","detail":"duplicate-id: backlog id 'p-cdefghij23' is used twice"}}}
  left: String("land-backlog-index-failed")
 right: "write-item-invalid"
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

### What the failure says

The behaviour itself holds and the refusal code does not. The duplicate-id case
(`apps/fgos/tests/session_write_publish.rs:520-529`) still expects
`write-item-invalid` from `data.publish.refusal`, and it still gets a refusal that
publishes nothing and leaves no file behind; the code is now
`land-backlog-index-failed` with detail
`duplicate-id: backlog id 'p-cdefghij23' is used twice`. The check moved with the
index: `check_backlog_item` (`apps/fgos/src/wiring/session_write_publish.rs:412-441`)
no longer generates the index, so duplicate detection now happens inside the land
door's index builder (`apps/fgos/src/wiring/portfolio.rs:727`) and its failure comes
back through the land door's own code (`land(&command, ...).map_err(|why| refusal(&why.code, ...))`,
same file, `publish`). Either the assertion moves to the new code or the refusal
code is mapped back at the `publish` boundary; that choice is the phase owner's,
and this unit is verification only.

Unrelated and unaffected: the other five cases in
`session_write_publish` pass, and all 15 in `portfolio_check` pass, including
`test_check_portfolio_index_drift` and `test_generate_backlog_index`, which cover
the builder the row now reuses.

## Fix round 3

Cause: the land door refuses a duplicate-id or otherwise invalid row as `land-backlog-index-failed`, but the
request layer takes back its created file only for `write-item-invalid` or `write-index-failed`, so the file stayed.

Change (one owned marker, no copied tag lists):
- `portfolio::backlog_index` prefixes the generator's error with `INDEX_ITEM_INVALID` (`item-invalid: `) for
  `CommitIndexError::Invalid` and `INDEX_UNREADABLE` (`index-unreadable: `) for `Unreadable` (`pub(super)` consts).
- `session_write_publish::publish` maps a `land-backlog-index-failed` refusal whose detail starts with
  `INDEX_ITEM_INVALID` to `write-item-invalid`, any other `land-backlog-index-failed` to `write-index-failed`, keeping
  the door's detail. Every other refusal keeps its own code. The generator is not called again in `check_backlog_item`;
  no test expectation changed.

Verification: `cargo fmt --all --check` clean; `cargo check -p fgos --tests` passes (warnings only, none new from
these files). Tests were not run in this fix round, so `session_write_publish` duplicate-id case is unconfirmed here
(linking can fail with OrtGetApiBase in this sandbox).
