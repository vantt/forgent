# Phase 6: Landing writes item done

## Inputs
- Phase 2 landed (item contract and frontmatter schema).
- Phase 5 landed (backlog items stored as discrete files under `plans/backlog/`).
- Section 7 anchor `#task-landing-done` of `docs/discussions/work-data-model/DISCUSSION.md`, decision D-ADR0082.
- Backlog row `p-pjouokg3jm`.

## Files it may write
Owner answer `q-76qpywi7if` ("Sửa cửa land thật"): the real land door, never a new wiring file beside it (L10, design principle 8).
- `packages/supervision/rust/src/land.rs`
- `packages/supervision/rust/tests/land.rs` (the land door's owning proof; extend it)
- `apps/fgos/src/wiring/supervision.rs` (only if a port is needed to read or write item files)

Forbidden by the answer: changing any other land behaviour (gates, footprint check, merge slot) or adding an event.

## Steps
1. In the paths land of `packages/supervision/rust/src/land.rs`:
   - Inspect the landing plan's frontmatter when `status` transitions to `done`.
   - Parse the `source:` list of the plan for backlog item IDs (`p-[a-z2-7]{10}`).
   - For each cited backlog item, locate `plans/backlog/<id>-*.md` and update its frontmatter `status` to `done`.
   - Stage and commit the updated backlog item files in the same atomic commit as the plan landing.
   - Trigger index regeneration so `plans/backlog.md` reflects the `done` status.
2. Extend the owning proof `packages/supervision/rust/tests/land.rs`:
   - Land a plan with cited source items and assert that the cited item files are updated to `status: done` in the resulting commit.
   - Assert that an invalid source item id is refused clearly without leaving uncommitted changes.

## Verify
`cargo test -p fgos-supervision --test land`

## Rollback
Revert the commit; landing door no longer automatically mutates source item files.
