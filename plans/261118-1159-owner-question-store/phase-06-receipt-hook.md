# Phase 6: Receipt hook

## Inputs
- `plan.md`, decisions QP-11 and QP-18, and OQ-D5.
- The native hook kinds in `apps/fgos/src/routing.rs:97-109`, and the handler pattern in
  `apps/fgos/src/wiring/session_rotation_hook.rs:32` and its `_unsupported.rs` twin.
- The hook rows in `packages/distribution/rust/src/agent_hooks.rs` (around lines 600-760), the Node mirror
  `src/setup/agent-hooks.mjs:218-245`, and their tests under `test/setup/`.
- The doctor row pattern of `mailbox-hook` in `packages/distribution/contracts/doctor-registry.v1.json`.
- Claude Code hook semantics: `UserPromptSubmit` stdout adds context, and on `Stop` the JSON
  `{"decision":"block","reason":…}` continues the turn. Check them in the current docs before relying on them.

## Footprint
See the phase table in `plan.md`, row 6.

## Steps
0. Re-grep the inputs, and confirm the Stop/UserPromptSubmit output contract in the Claude Code docs.
1. Add the hook kind `questions` to `HookKind`, together with the routes, the registry `native` hook list and the
   regenerated manifest.
2. Write `wiring/questions_hook.rs`.
   - It resolves the current session. With no session it prints nothing and exits 0.
   - It folds the store for questions this session asked that are answered and not acked.
   - For each question not yet noticed (`.fgos/runtime/questions/notified/<session>.json`), it prints one line:
     `owner answered <id> (<ref>): <option/text>; write it back to <ref>, then: fgos questions ack <id>`.
   - On `Stop`, it blocks once with that line as the reason, then records the id as noticed.
   - It exits 0 always, and an error prints nothing.
3. Add the hook rows to `agent_hooks.rs` and its Node mirror: Claude Code `UserPromptSubmit` and `Stop`, plus any
   other CLI that has an equivalent event in the row builder. List the CLIs left out in the commit body and in the
   integration report.
4. Add the doctor row `questions-hook`, with owner `rust:packaging` like the other hook-wired rows. Add a pointer row
   "N answered, not acked, run `fgos questions --answered`" only if the registry's pointer rules allow it. It warns
   and never fails.
5. Write `apps/fgos/tests/questions_hook.rs` (acceptance 5). On a fixture with two sessions:
   - each session sees only its own answered question;
   - the second `Stop` passes;
   - after `ack` nothing is shown.
   Extend the existing setup test that owns hook rows so it covers the new rows.

## Verify
- `cargo test -p fgos --test questions_hook`
- `cargo test -p fgos-distribution`
- the owning setup test, through the repo test runner

Pass condition: all three are green.

## Rollback
Revert the phase commit. `fgos setup` then removes the hook rows on its next run.
