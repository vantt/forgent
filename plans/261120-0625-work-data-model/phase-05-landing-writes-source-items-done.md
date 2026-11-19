# Phase 5: Landing writes source items done

## Inputs
- Phase 2 landed (item contract and frontmatter schema).
- Phase 4 landed (backlog items stored as discrete files under `plans/backlog/`).
- Settled discussion `docs/discussions/work-data-model/DISCUSSION.md` §6, §7 `#task-landing-done`, D-ADR0082.

## Files it may write
- `apps/fgos/src/wiring/land.rs`
- `apps/fgos/tests/landing_source_items.rs`

## Steps
1. In `apps/fgos/src/wiring/land.rs`:
   - Inspect the landing plan's frontmatter when `status` transitions to `done`.
   - Parse the `source:` list of the plan for backlog item IDs (`p-[a-z2-7]{10}`).
   - For each cited backlog item, locate `plans/backlog/<id>-*.md` and update its frontmatter `status` to `done`.
   - Stage and commit the updated backlog item files in the same atomic commit as the plan landing.
   - Trigger index regeneration so `plans/backlog.md` reflects the `done` status.
2. Add integration tests in `apps/fgos/tests/landing_source_items.rs`:
   - Land a plan with cited source items and assert that the cited item files are updated to `status: done` in the resulting commit.
   - Assert that an invalid source item id is refused clearly without leaving uncommitted changes.

## Verify
`cargo test -p fgos --test landing_source_items`

## Rollback
Revert the commit; landing door no longer automatically mutates source item files.
