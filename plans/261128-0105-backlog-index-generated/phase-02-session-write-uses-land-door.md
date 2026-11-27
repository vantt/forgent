# Phase 2 — Session write publishes rows through the land door

Capability: `code:implement`. Depends on phase 1 (the door must regenerate on a row land).

## Inputs

- `plan.md` of this directory (criterion 5, Authority map row 2).
- `docs/platform/session-host/spec.md` (the `session write` paragraph).
- `apps/fgos/src/wiring/session_write_publish.rs`: `refresh_backlog_index`, `publish`, `catch_up_once`.
- `apps/fgos/src/wiring/supervision.rs`: how the land command builds its `BacklogPort` (after phase 1).
- `apps/fgos/tests/session_write_publish.rs`.

## Footprint

apps/fgos/src/wiring/session_write_publish.rs, apps/fgos/tests/session_write_publish.rs

## Steps

1. Run impact analysis on `refresh_backlog_index` and `publish`; record it in the phase report.
2. In `publish`, pass the same `BacklogPort` the land command uses (reuse the builder from supervision.rs or
   portfolio.rs; if it is private there, read it through the narrowest visibility change, which phase 1's files
   own; if a change to those files is needed, widen this phase's footprint with `fgos supervisor widen` naming
   criterion 5). Leave `catch_up_once` with `None`: it commits nothing.
3. Keep the item checks of `refresh_backlog_index` (frontmatter contract, `<id>-<slug>.md` file name, a minted id
   for a new file) and rename it to say what it now does; delete its index generation and durable write and the
   `BACKLOG_INDEX`/`INDEX_MODE` constants once unused. `publish` no longer appends the index to `paths`: the door
   writes and commits it.
4. Tests in `apps/fgos/tests/session_write_publish.rs`: the row-write case asserts the commit holds the row and
   the generated index; the cases that used `plans/backlog.md` as an arbitrary writable file (the base-stale and
   dirty-path cases) move to another granted path so they keep proving the same behaviour.

## Verify

`cargo test -p fgos --test session_write_publish` and `cargo test -p fgos` pass. Pass condition:
`rg -n "generate_backlog_index" apps/fgos/src/wiring/session_write_publish.rs` returns nothing.

## Rollback

Revert the phase's commit; session write regenerates the index itself again.
