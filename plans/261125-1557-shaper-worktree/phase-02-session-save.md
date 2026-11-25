# Phase 2: The session save verb

Capability: `code:implement`.

## Inputs

- `packages/run-supervisor/rust/src/route.rs` (how `session write` is answered through the `WritePublisher` port) and `packages/run-supervisor/rust/src/head_request.rs` (verb list, `SUCCESSOR_READ_VERBS`).
- `apps/fgos/src/wiring/session_write_publish.rs` and `apps/fgos/src/main.rs` around the publisher wiring (read; the new port is filled beside it).
- `packages/git/rust/src/lib.rs` ScopedCommit, and `docs/platform/git/spec.md` section 8 (literal paths, store exclusion, rollback on failure).
- `packages/run-supervisor/contracts/head-request.v1.json`, `packages/session-host/contracts/head-permissions.v1.json`, `packages/session-host/rust/src/permissions.rs`.
- `bin/fgos.mjs` around `sub === 'write'` of the `session` verb, and `packages/host-runtime/contracts/command-manifest.json`.

## Footprint

- `packages/run-supervisor/rust/src/head_request.rs`
- `packages/run-supervisor/rust/src/route.rs`
- `packages/run-supervisor/rust/tests/head_request.rs`
- `packages/run-supervisor/contracts/head-request.v1.json`
- `packages/session-host/contracts/head-permissions.v1.json`
- `packages/session-host/rust/src/permissions.rs`
- `packages/session-host/rust/tests/permissions.rs`
- `apps/fgos/src/wiring/session_save_commit.rs` (new)
- `apps/fgos/src/wiring/mod.rs`
- `apps/fgos/src/main.rs`
- `bin/fgos.mjs`
- `packages/host-runtime/contracts/command-manifest.json`
- `test/cli/session-verb.test.mjs`

## Steps

1. Contract: add verb `session save` to `head-request.v1.json` with args `{ paths: string[] (non-empty), message: string }`
   and answer `{ commit, paths }`; not a read verb.
2. Permissions: allow `session save` for the `shaper` persona only (`head-permissions.v1.json`, `permissions.rs`). No
   other persona gains it.
3. Supervisor answer (Rust, `route.rs`), in this order, each refusal leaving nothing committed:
   - the head's working checkout is the attempt cwd; when it is the project root's main checkout refuse
     `save-needs-linked-worktree`;
   - every path must lie inside the grant's `writes` (the same matcher `session write` uses), else `path-outside-grant`;
   - call the new port `SaveCommitter` with the checkout, the literal paths, the message and the head's writer id.
4. Port filling (`apps/fgos/src/wiring/session_save_commit.rs`): one ScopedCommit on the checked-out branch of that
   checkout; no fetch, no push, no merge slot. A no-op ScopedCommit answers `save-nothing-to-commit`. Pass it to the
   route in `main.rs` beside the write publisher.
5. CLI arm: `fgos session save <path>... --message <text>` in `bin/fgos.mjs` sends the verb through the request socket
   (only inside a head; outside one it refuses `not-a-head` like `session write`), prints `committed <sha>`; add the
   command to the manifest.
6. Tests: owning proofs in `packages/run-supervisor/rust/tests/head_request.rs` (commits only the named paths on the
   worktree branch, main's tip unchanged; the three refusals) and `packages/session-host/rust/tests/permissions.rs`
   (only the shaper holds the verb); one wiring proof in `test/cli/session-verb.test.mjs`.

## Verify

`cargo test -p fgos-run-supervisor head_request`, `cargo test -p fgos-session-host permissions` and
`node --test test/cli/session-verb.test.mjs` pass.

## Rollback

Revert the phase's squash commit; no skill names the verb until phase 5.
