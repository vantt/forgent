# Phase 5: Migration of backlog and discussions

## Inputs
- Phase 1 landed (convention rules for `plans/backlog/`, `plans/discussions/`, `plans/backlog.md`).
- Phase 2 landed (item contract check, index generator).
- Phase 4 landed (session write and grant updates).
- Section 7 anchor `#task-migration` of `docs/discussions/work-data-model/DISCUSSION.md`, decision D-ADR0082.
- Backlog row `p-nxibnmfhra`.

## Files it may write
- `plans/backlog/**`
- `plans/discussions/**`
- `plans/backlog.md`
- `docs/backlog.md`
- `docs/discussions/**`
- `scripts/migrate-portfolio.mjs`
- `src/runner/agent-roster.mjs`
- `packages/supervision/rust/src/discussion_source.rs`
- `packages/questions/rust/src/refcheck.rs`
- `test/e2e/fixture-marketing-domain.test.mjs`
- `test/runner/dispatch-confinement-backend-p03.test.mjs`
- `test/runner/dispatch-confinement-machine-private.test.mjs`
- `test/runner/dispatch-confinement-policies.test.mjs`
- `test/session-host/head-permission-mode.test.mjs`
- `test/session-host/head-request.test.mjs`
- `test/session-host/head-start.test.mjs`
- `test/session-rotation/rotate.test.mjs`
- `test/state/domain-fields.test.mjs`
- `src/session-host/head-grants.mjs` (already in the plan footprint)
- `test/session-host/head-grants.test.mjs` (already in the plan footprint)

## Steps
1. Create and execute migration script `scripts/migrate-portfolio.mjs`:
   - Parse `docs/backlog.md` rows into discrete `plans/backlog/<p-id>-<slug>.md` files with validated frontmatter (`id`, `title`, `status`, `priority`, `area`, `created`) and body sections (`Why`, `Done when`, `Notes`).
   - Move `docs/discussions/*` into `plans/discussions/<ds-id>-<slug>/DISCUSSION.md`, minting `ds-` IDs for discussions and adding valid frontmatter (`id`, `title`, `status`, `source`, `created`).
   - Run the index generator to emit the canonical generated `plans/backlog.md`.
   - Remove legacy `docs/backlog.md` or replace it with a redirect pointer to `plans/backlog.md`.
2. Mechanical reference rewrite:
   - Rewrite references from `docs/discussions/` to `plans/discussions/` across existing plans, reports, and documentation using an automated mapping table.
3. Replace hard-coded path strings in runtime code with calls to `fgos convention path` (RUL11):
   - `packages/supervision/rust/src/discussion_source.rs`
   - `packages/questions/rust/src/refcheck.rs`
   - `src/runner/agent-roster.mjs`
   - other identified references.
4. Package the migration as a reusable upgrade command (`fgos migrate portfolio`) for external projects.
5. Swap the head grants in `src/session-host/head-grants.mjs` in the same commit that creates the directories (the sandbox refuses a launch whose granted path does not exist, `workspace-path-missing`, so phase 4 could not grant them early): the shaper gets `plans/discussions` in place of `docs/discussions`; the secretary, supervisor and planner drop `docs/backlog.md` and `docs/discussions`. `test/session-host/head-permission-mode.test.mjs` already proves every sandbox path of a head exists in the repository; it must stay green.
6. Verify that `git grep docs/discussions` finds only archive/history entries.

## Verify
The portfolio check passes on the migrated repository; `git grep docs/discussions` yields no active code paths; `npm test` and `cargo test --workspace` pass.

## Rollback
Revert the migration commit; restore `docs/backlog.md` and `docs/discussions/`.
