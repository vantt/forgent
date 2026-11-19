# Phase 4: Migration of backlog and discussions to the new data model

## Inputs
- Phase 1 landed (convention rules for `plans/backlog/`, `plans/discussions/`, `plans/backlog.md`).
- Phase 2 landed (item contract check, index generator).
- Phase 3 landed (plan status enforcement).
- Settled discussion `docs/discussions/work-data-model/DISCUSSION.md` §6, §7 `#task-migration`, D-ADR0082.

## Files it may write
- `plans/backlog/**`
- `plans/discussions/**`
- `plans/backlog.md`
- `docs/backlog.md`
- `docs/discussions/**`
- `scripts/migrate-portfolio.mjs`
- `src/session-host/head-grants.mjs`
- `src/runner/agent-roster.mjs`
- `packages/supervision/rust/src/discussion_source.rs`
- `packages/questions/rust/src/refcheck.rs`
- `test/**`

## Steps
1. Create and execute migration script `scripts/migrate-portfolio.mjs`:
   - Parse `docs/backlog.md` rows into discrete `plans/backlog/<p-id>-<slug>.md` files with validated frontmatter (`id`, `title`, `status`, `priority`, `area`, `created`) and body sections (`Why`, `Done when`, `Notes`).
   - Move `docs/discussions/*` into `plans/discussions/<ds-id>-<slug>/DISCUSSION.md`, minting `ds-` IDs for discussions and adding valid frontmatter (`id`, `title`, `status`, `source`, `created`).
   - Run the index generator to emit the canonical generated `plans/backlog.md`.
   - Remove legacy `docs/backlog.md` or replace it with a redirect/pointer to `plans/backlog.md`.
2. Mechanical reference rewrite:
   - Rewrite references from `docs/discussions/` to `plans/discussions/` across existing plans, reports, and documentation using an automated mapping table.
3. Replace hard-coded path strings in runtime code with calls to `fgos convention path` (RUL11):
   - `packages/supervision/rust/src/discussion_source.rs`
   - `packages/questions/rust/src/refcheck.rs`
   - `src/session-host/head-grants.mjs`
   - `src/runner/agent-roster.mjs`
   - other identified references.
4. Package the migration as a reusable upgrade command (`fgos migrate portfolio`) for external projects.
5. Verify that `git grep docs/discussions` finds only archive/history entries.

## Verify
The portfolio check passes on the migrated repository; `git grep docs/discussions` yields no active code paths; `npm test` and `cargo test --workspace` pass.

## Rollback
Revert the migration commit; restore `docs/backlog.md` and `docs/discussions/`.
