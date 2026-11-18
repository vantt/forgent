# Phase 6: Receipt hook

## Inputs
- `plan.md` QP-4, QP-11 and QP-18, and OQ-D5.
- The native hook kinds: `apps/fgos/src/routing.rs`, `HookKind` (:105) and `HookKind::ALL`, which is
  `[(&str, HookKind); 4]` and grows to 5. The handler pattern is
  `apps/fgos/src/wiring/session_rotation_hook.rs:13-35` and its `_unsupported.rs` twin.
- The caller: `fgos_questions::caller::IdentityCaller` (`packages/questions/rust/src/caller.rs`).
- The `stop_hook_active` handling in `packages/mailbox/rust/store/src/adapters/claude.rs:15` and `codex.rs`.
- The hook rows:
  - `packages/distribution/rust/src/agent_hooks.rs`: `hook_rows` (about line 590), the `KIND_*` constants (about
    lines 40-44), and for Claude Code the rows built with `claude_guarded_hook_command(kind)` (:340);
  - the Node mirror `src/setup/agent-hooks.mjs:218-245` and its tests under `test/setup/`;
  - the setup-written files `.claude/settings.json`, `.codex/hooks.json` and `.agents/hooks.json`.
- The existing wiring rows `dispatch-decide-hook-wired`, `codex-hook-wired` and similar: judged in
  `apps/fgos/src/wiring/doctor/packaging.rs` (about lines 36-40 and 55-57) and declared in
  `packages/distribution/contracts/doctor-registry.v1.json` (lines ~75-79 and ~111-114). `agent_hook_row` calls
  `check_hook`, which compares each CLI's file with the `hook_rows` table, so a new table row is judged by the
  existing row of its CLI.
- Claude Code hook output: `UserPromptSubmit` stdout becomes context, and `Stop` takes
  `{"decision":"block","reason":…}`. Check both against the current docs.

## Footprint
See the phase table in `plan.md`, row 6.

## Steps
0. Re-grep the inputs, and confirm the hook output contract in the docs.
1. Add the hook kind `questions` to `HookKind` and to `HookKind::ALL` (4 entries become 5), the routes, the
   registry's native hook list and the regenerated manifest.
2. Write `wiring/questions_hook.rs`, which writes nothing:
   - Resolve the caller through `fgos_questions::caller::IdentityCaller` and the Identity session record. If it
     does not resolve, print nothing. The `head:` roles of the record are kept only for the "same role after
     rotation" rule below.
   - Read only `.fgos/cache/questions.json` (QP-23). Take the answered questions with no ack whose asker is this
     session or holds the same `head:` role. If the view is missing, print nothing.
   - On `UserPromptSubmit`, print one line per question:
     `owner answered <id> (<ref>, asked by <handle>): <option/text>; write it back to <ref>, then: fgos questions ack <id>`.
   - On `Stop` with `stop_hook_active` false, block once only for the questions whose notice line (it holds the id)
     is not yet in the transcript at `transcript_path`. Give their lines as the reason. Otherwise pass. With
     `stop_hook_active` true, pass.
   - Always exit 0. Any error prints nothing.
3. Add the rows in `agent_hooks.rs` (a `KIND_QUESTIONS` constant) and the Node mirror:
   - Claude Code, on `UserPromptSubmit` and `Stop`, with `claude_guarded_hook_command(KIND_QUESTIONS)`;
   - any other CLI whose builder already has an equivalent event.
   List the CLIs left out in the commit body. Then rerun setup's row writer on the committed hook files.
4. No new doctor row: `dispatch-decide-hook-wired` covers Claude Code only, and `check_hook` already expects every
   `hook_rows` entry of the CLI, so the new rows are judged by it (and by `codex-hook-wired` and the others for their
   CLIs). Edit the description of `dispatch-decide-hook-wired` in `doctor-registry.v1.json`, which lists the
   Claude hook kinds, and add a doctor test that a missing questions row fails the judgment.
5. Write `apps/fgos/tests/questions_hook.rs` (acceptance 5), with two sessions and one rotation:
   - each session gets only its own lines;
   - `Stop` blocks once, passes when `stop_hook_active` is set, and passes once the notice is in the transcript;
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
