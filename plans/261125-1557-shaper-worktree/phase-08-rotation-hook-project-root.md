# Phase 8: The rotation hook finds the head's lineage from a worktree

Capability: `code:implement`.

Opened by the phase 6 live proof rerun (`reports/live-proof.md`, section "Rerun on af9a5d5b15", defect D): a shaper's
rotation ends `no-answer`. The session-rotation hook resolves `.fgos` from `CLAUDE_PROJECT_DIR` (or the cwd), which in
a shaper is its linked worktree; the worktree has a `.fgos` directory of its own (tracked files), so the hook reads
`rotation.json`, the handoff and `placement.json` there, while the session start and rotate doors wrote them under
the project's `.fgos`. The successor's Stop hook then sends `session rotate` instead of `session answered`, and its
SessionStart hook misses the handoff.

## Inputs

- `apps/fgos/src/wiring/session_rotation_hook.rs` `fgos_dir_of` and its tests (the comment says a head may also be
  started with a linked worktree as its project root, so the main checkout behind a worktree is not the answer).
- `src/session-host/head-start.mjs` `placeHead` (the launch `env` of every head; the rotation executor places the
  successor through it).

## Footprint

- `src/session-host/head-start.mjs`
- `test/session-host/head-start.test.mjs`
- `apps/fgos/src/wiring/session_rotation_hook.rs`

## Steps

1. `placeHead` puts `FGOS_HEAD_PROJECT_ROOT=<projectRoot>` (absolute) in the launch env of every head, beside
   `FGOS_HEAD_ROLE`.
2. `fgos_dir_of` takes that variable first: when it names a directory holding `.fgos`, that `.fgos` is the answer;
   otherwise it keeps today's order (`CLAUDE_PROJECT_DIR`, then the cwd). No other hook changes.
3. Tests: in `session_rotation_hook.rs`, a head whose `CLAUDE_PROJECT_DIR` is a worktree with its own `.fgos` resolves
   the project's `.fgos` from `FGOS_HEAD_PROJECT_ROOT`, and the old order holds without it; in
   `head-start.test.mjs`, the launch request of a head carries `FGOS_HEAD_PROJECT_ROOT`.

## Verify

`cargo test -p fgos --bin fgos session_rotation_hook` and `node --test test/session-host/head-start.test.mjs` pass;
then the phase 6 live proof's rotation step passes (the successor answers and holds the role, its save is accepted).

## Rollback

Revert the phase's squash commit; a shaper's rotation ends `no-answer` again.
