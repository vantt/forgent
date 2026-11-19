# Phase 6: Session write creates one item file and replaces plan 1615 phase 4

## Inputs
- Phase 2 landed (item frontmatter schema and validation).
- Phase 4 landed (portfolio paths under `plans/`).
- Settled discussion `docs/discussions/work-data-model/DISCUSSION.md` §6, §7 `#task-1615-phase4`, D-ADR0082.
- Plan `261119-1615-secretary-capabilities` phase 4 withdrawn.

## Files it may write
- `apps/fgos/src/wiring/session_write_publish.rs`
- `apps/fgos/tests/session_write_publish.rs`
- `src/session-host/head-grants.mjs`
- `test/session-host/head-grants.test.mjs`

## Steps
1. In `src/session-host/head-grants.mjs`:
   - Replace grants for `docs/backlog.md` with `plans/backlog/*`.
   - Replace grants for `docs/discussions/*` with `plans/discussions/*`.
   - Update tests in `test/session-host/head-grants.test.mjs`.
2. In `apps/fgos/src/wiring/session_write_publish.rs`:
   - Ensure `session write` supports creating a new item file atomically under `plans/backlog/<id>-<slug>.md`.
   - Validate that the written file conforms to the item frontmatter contract and convention path before committing.
   - Automatically trigger index regeneration for `plans/backlog.md` upon successful publish.
3. Update and run integration tests in `apps/fgos/tests/session_write_publish.rs`.

## Verify
`cargo test -p fgos --test session_write_publish`; `node --test test/session-host/head-grants.test.mjs`

## Rollback
Revert the commit; grants and session write revert to previous path patterns.
