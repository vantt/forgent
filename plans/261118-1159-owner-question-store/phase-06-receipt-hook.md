# Phase 6: Receipt hook

## Inputs
- `plan.md` QP-4, QP-11 and QP-18, and OQ-D5.
- The native hook kinds: `apps/fgos/src/routing.rs:97-109`. The handler pattern is
  `apps/fgos/src/wiring/session_rotation_hook.rs:32` and its `_unsupported.rs` twin.
- The `stop_hook_active` handling in `packages/mailbox/rust/store/src/adapters/claude.rs:15` and `codex.rs`.
- The hook rows:
  - `packages/distribution/rust/src/agent_hooks.rs` (around lines 600-760);
  - the Node mirror `src/setup/agent-hooks.mjs:218-245` and its tests under `test/setup/`;
  - the setup-written files `.claude/settings.json`, `.codex/hooks.json` and `.agents/hooks.json`.
- The existing wiring rows `dispatch-decide-hook-wired`, `codex-hook-wired` and similar, in
  `apps/fgos/src/wiring/doctor/packaging.rs` and `doctor-registry.v1.json`.
- Claude Code hook output: `UserPromptSubmit` stdout becomes context, and `Stop` takes
  `{"decision":"block","reason":…}`. Check both against the current docs.

## Footprint
See the phase table in `plan.md`, row 6.

## Steps
0. Re-grep the inputs, and confirm the hook output contract in the docs.
1. Add the hook kind `questions` to `HookKind`, the routes, the registry's native hook list and the regenerated
   manifest.
2. Write `wiring/questions_hook.rs`, which writes nothing:
   - Resolve the session id and the `head:` role. If there is neither, print nothing.
   - Read the store fold for answered questions where the asker is this session or holds the same `head:` role, and
     that have no ack.
   - On `UserPromptSubmit`, print one line per question:
     `owner answered <id> (<ref>, asked by <handle>): <option/text>; write it back to <ref>, then: fgos questions ack <id>`.
   - On `Stop` with `stop_hook_active` false, block once and give all those lines as the reason. With
     `stop_hook_active` true, pass.
   - Always exit 0. Any error prints nothing.
3. Add the rows in `agent_hooks.rs` and the Node mirror:
   - Claude Code, on `UserPromptSubmit` and `Stop`;
   - any other CLI whose builder already has an equivalent event.
   List the CLIs left out in the commit body. Then rerun setup's row writer on the committed hook files.
4. Extend the existing `*-hook-wired` doctor judgments so they expect the new rows. Do not add a new row.
5. Write `apps/fgos/tests/questions_hook.rs` (acceptance 5), with two sessions and one rotation:
   - each session gets only its own lines;
   - `Stop` blocks once and passes when `stop_hook_active` is set;
   - the hook writes no file (assert that the directory is unchanged);
   - after `ack`, the session gets nothing.
   Extend the setup test that owns the hook rows.

## Verify
- `cargo test -p fgos --test questions_hook`
- `cargo test -p fgos-distribution`
- the owning setup test, through the repo test runner

Pass condition: all three are green.

## Rollback
Revert the phase commit. The next `fgos setup` removes the rows.
