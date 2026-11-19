# Phase 2: Item contract, check and generated index

## Inputs
- Phase 1 landed (`ds-` minting and convention paths).
- Section 7 anchor `#task-item-check` of `docs/discussions/work-data-model/DISCUSSION.md`, decision D-ADR0082.
- Backlog row `p-rw5iadsp2p`.

## Files it may write
- `packages/portfolio/**`
- `src/portfolio/**`
- `apps/fgos/src/wiring/portfolio.rs`
- `apps/fgos/tests/portfolio_check.rs`
- `test/portfolio/**`

## Steps
1. Define frontmatter schema and validation rules:
   - Backlog item (`plans/backlog/<p-id>-<slug>.md`): required frontmatter keys `id`, `title`, `status`, `priority` (`P0..P3`), `area`, `created`. Body sections: `Why`, `Done when`, `Notes` (pre-plan detail only). Allowed statuses: `proposed`, `parked`, `in-flight`, `done`, `dropped`.
   - Discussion (`plans/discussions/<ds-id>-<slug>/DISCUSSION.md`): required frontmatter keys `id`, `title`, `status` (`open`, `paused`, `settled`), `source` (list of backlog `p-` ids), `created`.
2. Implement portfolio contract check:
   - Validates frontmatter fields and allowed enum values.
   - Validates `source:` citations: every referenced `p-` and `ds-` id must exist.
   - Enforces that an `in-flight` backlog item has at least one citing discussion or plan.
   - Enforces that any new discussion or plan cites at least one backlog item.
   - Flags drift: item `done` with a citing plan `running`, or item `in-flight` with all citing plans completed/withdrawn.
   - Checks that `plans/backlog.md` matches the freshly generated index (drift fails the check).
3. Implement index generator: compiles `plans/backlog.md` markdown table listing id, title, status, priority, area, and citing plans/discussions.
4. Implement native Rust item write door (`fgos item create|edit` or `fgos backlog item ...`) to safely create and edit individual item files.
5. Add unit and fixture tests in `apps/fgos/tests/portfolio_check.rs` and `test/portfolio/`.

## Verify
`cargo test -p fgos --test portfolio_check`; `node --test test/portfolio/portfolio-check.test.mjs`

## Rollback
Revert the commit; item contract, index generator, and check door are removed.
