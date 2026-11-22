# Phase 2: Capture the owner's reaction

Capability: `code:implement`. Wave 2. Depends on phase 1 (the `owner-communication` layer and the signal table).

## Inputs

- `plans/discussions/ds-cfsfcbknl6-owner-communication/DISCUSSION.md`, section 6 step 3 (T1-T12) and step 4 level 1;
  decisions OC-D4, OC-D7.
- `core/skills/_shared/owner-communication.md` (signatures named in phase 1).
- `apps/fgos/src/wiring/questions_hook.rs` (payload parsing through `fgos_mailbox::hook::Adapter`, caller
  resolution, transcript tail reading, exit-0-on-every-path) and `apps/fgos/tests/questions_hook.rs`.
- `apps/fgos/src/routing.rs` (`HookKind`, `HookKind::ALL`, `native_subcommands` of `hook`) and `apps/fgos/src/main.rs`
  line 358.
- `packages/observe/rust/src/friction.rs` (the record use case to call in-process).
- `src/setup/agent-hooks.mjs` (`HOOK_KINDS`, `hookRows`, `claudeQuestionsRow`), `packages/distribution/rust/src/agent_hooks.rs`,
  `packages/distribution/contracts/agent-hooks.v1.json`, `packages/distribution/contracts/doctor-registry.v1.json`
  (the `.claude/settings.json` hooks row near line 277).

## Files it may write (footprint)

`packages/observe/contracts/owner-signals.v1.json` (new), `apps/fgos/src/wiring/owner_reaction_hook.rs` (new),
`apps/fgos/tests/owner_reaction_hook.rs` (new), `apps/fgos/src/routing.rs`, `apps/fgos/src/main.rs`,
`apps/fgos/src/wiring/mod.rs`, `src/setup/agent-hooks.mjs`, `src/cli/command-registry.mjs`,
`packages/host-runtime/contracts/command-manifest.json`, `packages/distribution/contracts/agent-hooks.v1.json`,
`packages/distribution/contracts/doctor-registry.v1.json`, `packages/distribution/rust/src/agent_hooks.rs`,
`packages/distribution/rust/tests/goldens/agent-hooks-vectors.json`, `apps/fgctl/tests/goldens/**`,
`test/setup/agent-hooks.test.mjs`, `docs/platform/agent-mailbox/spec.md` (its hook table section only).

Not in the footprint: this repo's `.claude/settings.json`. A project gets the new row on its next `fgos setup`.

## Steps

1. Write `packages/observe/contracts/owner-signals.v1.json`: one entry per text-detectable signal (T1, T3, T4, T5,
   T6, T8, T9), each with its signature from phase 1 and its phrase list taken from the discussion's table (for
   example T3 `là gì`, `ai`, `cái nào`, `khoan`; T6 `cứ làm đi`, `ok làm luôn`; T4 `không phải`, `cần lưu ý`, `em có
   hiểu ý anh không`; T1 `!!`, `đã nói rồi`). Matching is case-insensitive on the prompt text. The other signals (T2,
   T7, T10, T11, T12) stay with the agent's own recording through friction-capture.md. Note in the file that the list
   is provisional and refined by the coach. Point the standard's signal table at this file is phase 3's job only if
   it edits the fragment; otherwise leave the standard as phase 1 wrote it.
2. Add `HookKind::OwnerReaction` (`owner-reaction`) to `routing.rs` and its `ALL` list and route test; dispatch it in
   `main.rs` to `wiring::owner_reaction_hook::main`.
3. Write `owner_reaction_hook.rs`: `fgos hook owner-reaction --event user-prompt-submit` (Claude Code only). Read the
   payload through the Claude adapter (bounded stdin, as in the questions hook), take the prompt text, match the
   signals; on the first match per signature, read the last assistant message from the transcript tail and record
   one friction per matched signature: kind `awkward`, layer `owner-communication`, class the signature, subject the
   session, detail holding the owner's words and the previous agent message (both capped to the store's detail
   limit). Never print, never block, catch panics, exit 0 on every path, including a failed record.
4. Add the row to `hookRows` in `src/setup/agent-hooks.mjs` beside `claudeQuestionsRow('--event user-prompt-submit',
   ...)`, guarded `|| true` with a 10 s timeout, and the same row to `agent-hooks.v1.json`, `agent_hooks.rs`, the
   replay vectors and the fgctl uninstall goldens. Extend the doctor registry's `.claude/settings.json` hooks row text
   to name the reaction hook. Register the subcommand in `command-registry.mjs` and `command-manifest.json` the way
   `questions` is.
5. Tests, in the files that own them: in `apps/fgos/tests/owner_reaction_hook.rs` (new boundary, so a new file):
   a prompt "khoan, cái này là gì" records exactly one friction with layer `owner-communication`; a neutral prompt
   records none; an unwritable store still exits 0 with empty stdout. Extend `test/setup/agent-hooks.test.mjs` and
   the distribution vectors for the new row; do not add a second copy of these cases elsewhere.
6. Document the row in `docs/platform/agent-mailbox/spec.md`'s hook table section.

## Verify

```bash
cargo test -p fgos --test owner_reaction_hook
cargo test -p fgos routing
cargo test -p fgos-distribution
node --test test/setup/agent-hooks.test.mjs
npm test && cargo test --workspace
```

Pass: every command exits 0.

## Rollback

`git revert` of this phase's commit removes the hook kind, its row and its data file. Projects that already ran
`fgos setup` lose the row on their next setup.
