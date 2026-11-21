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
- `src/runner/dispatch/session-attempt.mjs` (owner decision `q-b3acdzi4ur`)
- `test/session-host/head-permission-mode.test.mjs`

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
5. In `src/runner/dispatch/session-attempt.mjs` `requirementOf` (owner decision `q-b3acdzi4ur`): the sandbox workspace-paths grant cannot carry glob characters, so map a grant entry `<dir>/*` to `<dir>` for the sandbox (the head request door keeps the one-level `/*` rule). Prove in `test/session-host/head-permission-mode.test.mjs` that the requirement of a grant holding `plans/backlog/*` names `plans/backlog` and that the secretary and supervisor requirements pass the workspace-paths validator.

## Verify
`cargo test -p fgos-run-supervisor --test head_request`; `cargo test -p fgos --test session_write_publish`; `node --test test/session-host/head-grants.test.mjs`; `node --test test/session-host/head-permission-mode.test.mjs`

## Rollback
Revert the commit; grants and session write revert to previous path patterns.
