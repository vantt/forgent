# Phase 4: Replace plan 261119-1615 phase 4

## Inputs
- Phase 2 landed (item frontmatter schema and validation).
- Section 7 anchor `#task-1615-phase4` of `docs/discussions/work-data-model/DISCUSSION.md`, decision D-ADR0082.
- Backlog row `p-xyod5s5h6r`.
- Plan `261119-1615-secretary-capabilities` phase 4 withdrawn.

## Files it may write
- `apps/fgos/src/wiring/session_write_publish.rs`
- `apps/fgos/tests/session_write_publish.rs`
- `src/session-host/head-grants.mjs`
- `test/session-host/head-grants.test.mjs`
- `packages/run-supervisor/rust/src/head_request.rs`
- `packages/run-supervisor/rust/tests/head_request.rs`

## Steps
1. In `src/session-host/head-grants.mjs`:
   - Replace grants for `docs/backlog.md` with `plans/backlog/*`.
   - Replace grants for `docs/discussions/*` with `plans/discussions/*`.
   - Update tests in `test/session-host/head-grants.test.mjs`.
2. In `apps/fgos/src/wiring/session_write_publish.rs`:
   - Ensure `session write` supports creating a new item file atomically under `plans/backlog/<id>-<slug>.md`.
   - Validate that the written file conforms to the item frontmatter contract and convention path before committing.
   - Automatically trigger index regeneration for `plans/backlog.md` upon successful publish.
3. In `packages/run-supervisor/rust/src/head_request.rs` (owner decision `q-y3ypxlucin`): let a grant ending in `/*` match a plain file directly beneath that directory (one level, no `..`, no symlink at any component), and let `session write` create that file atomically when it does not exist yet (same durable-file door, a fresh file mode); an exact-path grant keeps today's behaviour. Prove it in `packages/run-supervisor/rust/tests/head_request.rs` (new file created, nested path refused, symlink refused, exact grant unchanged).
4. Update and run integration tests in `apps/fgos/tests/session_write_publish.rs`.

## Verify
`cargo test -p fgos-run-supervisor --test head_request`; `cargo test -p fgos --test session_write_publish`; `node --test test/session-host/head-grants.test.mjs`

## Rollback
Revert the commit; grants and session write revert to previous path patterns.
