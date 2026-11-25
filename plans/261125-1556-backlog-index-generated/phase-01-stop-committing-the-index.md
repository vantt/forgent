---
phase: 1
title: Stop committing the index
status: draft
capability: code:implement
---

# Phase 1: Stop committing the index

The land door and the row write stop putting `plans/backlog.md` in a commit. The land door renders it into the main
checkout after the land instead, as a note-only side effect. The commit-scoped generator and the drift check retire.

## Inputs

- `plans/261125-1556-backlog-index-generated/plan.md` (Prior art, Decisions taken here 1 to 5).
- `apps/fgos/src/wiring/portfolio.rs`: `generate_backlog_index` (kept, the one generator), `check_portfolio` and
  `CheckOptions.check_index` (section "8. Index drift check"), `generate_backlog_index_for_commit`,
  `CommitIndexError`, `tracked_item_paths`, `backlog_item_name`.
- `apps/fgos/src/wiring/session_write_publish.rs`: `refresh_backlog_index`, `publish`.
- `apps/fgos/src/wiring/supervision.rs`: the `index` closure and `fn backlog_index` passed as `BacklogPort.index`.
- `packages/supervision/rust/src/land.rs`: `BacklogPort`, `BacklogIndexFn`, `BACKLOG_INDEX`, `close_cited_items`
  (the index write and `land-backlog-index-failed`), `LandOutcome`.
- Owning tests: `apps/fgos/tests/session_write_publish.rs::a_new_backlog_item_is_created_validated_and_indexed_in_one_commit`;
  `packages/supervision/rust/tests/land.rs::landing_a_plan_that_turns_done_commits_its_cited_items_as_done_and_the_regenerated_index`
  and `a_plan_turning_done_whose_cited_items_are_all_done_still_commits_the_regenerated_index`;
  `apps/fgos/tests/portfolio_check.rs` (the index-missing and index-drift case near line 672).
- `docs/platform/supervision/spec.md` section 5 "Lead to land" for the door's note-not-refusal style.

## Files it may write (footprint)

`apps/fgos/src/wiring/portfolio.rs`, `apps/fgos/src/wiring/supervision.rs`,
`apps/fgos/src/wiring/session_write_publish.rs`, `apps/fgos/src/wiring/migrate.rs` (only its `check_index: false`
field), `apps/fgos/tests/portfolio_check.rs`,
`apps/fgos/tests/session_write_publish.rs`, `packages/supervision/rust/src/land.rs`,
`packages/supervision/rust/tests/land.rs`.

## Steps

1. **Render helper (portfolio.rs).** Add `pub fn render_backlog_index(root: &Path, tracked_index: bool) -> RenderOutcome`
   where `RenderOutcome` says `Written`, `Unchanged`, `Tracked` (the file is tracked: nothing written, note
   `backlog-index-tracked: plans/backlog.md is tracked by Git; run git rm --cached plans/backlog.md`) or `Failed(why)`,
   and carries the skipped row files. It reads the portfolio with `check_portfolio` (index check gone), renders with
   `generate_backlog_index` over every row that parsed, and writes `plans/backlog.md` through
   `fgos_durable_file::replace_durably_with_mode` (mode 0o644) only when the bytes differ. Whether the index is tracked
   is the caller's fact (it holds the Git door); the helper never shells out to git.
2. **Retire the commit-scoped path (portfolio.rs).** Delete `generate_backlog_index_for_commit` and `CommitIndexError`;
   delete `CheckOptions.check_index`, the "Index drift check" block and the `index-missing` / `index-drift` errors, and
   the `check_index: false` field the one caller in `apps/fgos/src/wiring/migrate.rs` sets.
   Keep `tracked_item_paths` (session write still needs it for the minted-id rule) and `backlog_item_name`.
3. **Row write publishes one file (session_write_publish.rs).** Rename `refresh_backlog_index` to
   `validate_backlog_item`, keep its three checks (item contract, `<id>-<slug>.md` file name, minted id for an untracked
   file) with their `write-item-invalid` refusals, and drop the index generation and write; `publish` lands
   `vec![path]` only. Wire the land with the backlog port (step 5) so the main checkout's copy is refreshed after the
   row lands.
4. **Land door (land.rs).** Reshape `BacklogPort.index` into `render: &dyn Fn(&Path) -> Option<String>` (returns a note
   or `None`), drop `BacklogIndexFn` and `BACKLOG_INDEX` if unused. In `close_cited_items` remove the index write and
   the `land-backlog-index-failed` refusal; rows are still set `done` and committed. After a successful land (paths or
   branch) whose landed paths overlap `plans/**`, call `render` on the main checkout root and put its note in
   `LandOutcome.backlog_index_note: Option<String>`; a note never turns the land into a refusal.
5. **Wiring (supervision.rs, session_write_publish.rs).** Replace `fn backlog_index` by a closure that asks the Git door
   whether `plans/backlog.md` is tracked (`tracked_paths` page lookup, as `tracked_item_paths` does) and calls
   `portfolio::render_backlog_index`; map the outcome to a note (`Written`/`Unchanged` -> `None` unless rows were
   skipped, then `backlog-index-skipped: <files>`). Emit `backlogIndexNote` in the `fgos land` result JSON when set.
   `session_write_publish.rs` passes the same port.
6. **Tests: reshape the owning proofs, add none beside them.**
   - session_write_publish.rs: rename the item case to `a_new_backlog_item_is_validated_and_lands_as_one_file`; assert
     the commit's changed paths are exactly the row file and that the main checkout's `plans/backlog.md` lists the row
     afterwards. Its invalid-item refusals stay as they are.
   - land.rs: rename the two plan-done cases to say the commit holds the plan and the closed rows and no index, and
     assert the rendered local file shows the row `done`. Add to this file (it owns the land door): one case with an
     unparseable row file (the land succeeds, `backlog_index_note` names the file) and one with `plans/backlog.md`
     tracked (bytes unchanged, note `backlog-index-tracked`).
   - portfolio_check.rs: retire the index-missing / index-drift case (behaviour removed); drop `check_index: false` from
     the other cases.

## Verify

```bash
cargo test -p fgos-supervision --test land
cargo test -p fgos --test session_write_publish --test portfolio_check --test migrate_portfolio
cargo build -p fgos
rg -n "generate_backlog_index_for_commit|CommitIndexError|check_index|index-drift|land-backlog-index-failed" apps packages
```

Pass: every test green, the build clean, and the `rg` prints nothing.

## Rollback

Revert this phase's commit; the committed-index path and its tests come back unchanged.
