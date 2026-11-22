# Phase 5: Owner-reaction hook, one producer

Capability: `code:implement`. Wave 2. Depends on phase 3 (private store). It also needs the `owner-communication`
friction layer from plan `261122-1950-owner-communication-standard`, which is in `blockedBy`. Decisions: CA-D1, CA-D4.

This is the dropped phase `plans/261122-1751-owner-communication-standard/phase-02-capture-owner-reaction.md`
(commit `c61de4c1c`), reused with three changes:
- the owner's words and the previous agent message go to the private store through `--private-detail` semantics,
  never into the tracked record;
- the hook is an ordinary friction producer with no special view or coach logic;
- this repo's `.claude/settings.json` stays outside the footprint, and a project gets the row on its next `fgos setup`.

## Inputs

- `git show c61de4c1c:plans/261122-1751-owner-communication-standard/phase-02-capture-owner-reaction.md` (steps 1-6,
  the signal list T1, T3, T4, T5, T6, T8, T9 and their phrases).
- `plans/discussions/ds-cfsfcbknl6-owner-communication/DISCUSSION.md`, section 6 step 3 (T1-T12).
- `core/skills/_shared/owner-communication.md` (signature names, written by the other plan).
- `apps/fgos/src/wiring/questions_hook.rs` and `apps/fgos/tests/questions_hook.rs` (payload parsing through
  `fgos_mailbox::hook::Adapter`, bounded stdin, transcript tail, exit 0 on every path).
- `apps/fgos/src/routing.rs` (`HookKind`, `HookKind::ALL`), `apps/fgos/src/main.rs` (hook dispatch).
- `packages/observe/rust/src/friction.rs` and `packages/observe/rust/src/private_detail.rs` (phase 3), called in
  process.
- `src/setup/agent-hooks.mjs` (`hookRows`, `claudeQuestionsRow`), `packages/distribution/rust/src/agent_hooks.rs`,
  `packages/distribution/contracts/agent-hooks.v1.json`, `packages/distribution/contracts/doctor-registry.v1.json`
  (the `.claude/settings.json` hooks row).

## Files it may write (footprint)

`packages/observe/contracts/owner-signals.v1.json` (new), `apps/fgos/src/wiring/owner_reaction_hook.rs` (new),
`apps/fgos/tests/owner_reaction_hook.rs` (new), `apps/fgos/src/routing.rs`, `apps/fgos/src/main.rs`,
`apps/fgos/src/wiring/mod.rs`, `src/setup/agent-hooks.mjs`, `test/setup/agent-hooks.test.mjs`,
`src/cli/command-registry.mjs`, `packages/host-runtime/contracts/command-manifest.json`,
`packages/distribution/contracts/agent-hooks.v1.json`, `packages/distribution/contracts/doctor-registry.v1.json`,
`packages/distribution/rust/src/agent_hooks.rs`, `packages/distribution/rust/tests/goldens/agent-hooks-vectors.json`,
`apps/fgctl/tests/goldens/**`, `docs/platform/agent-mailbox/spec.md` (its hook table section only).

## Steps

1. Write `packages/observe/contracts/owner-signals.v1.json` as in the dropped step 1: one entry per text-detectable
   signal with its signature and phrase list, matched case-insensitively. Mark it provisional and refined by the
   coach.
2. Add `HookKind::OwnerReaction` (`owner-reaction`) to `routing.rs`, `ALL` and the route test. Dispatch it in
   `main.rs` to `wiring::owner_reaction_hook::main`.
3. Write `owner_reaction_hook.rs`: `fgos hook owner-reaction --event user-prompt-submit` (Claude Code only).
   - Read the prompt through the Claude adapter and match the signals.
   - Record one friction per matched signature with kind `awkward`, layer `owner-communication`, class the
     signature, and subject the session.
   - Write the owner's words and the last assistant message (from the transcript tail) to the private store only.
     The tracked record carries `fgos.friction.detail_ref` and no text.
   - Never print, never block, catch panics, and exit 0 on every path.
4. Add the setup row beside `claudeQuestionsRow('--event user-prompt-submit', ...)`, guarded `|| true` with a 10 s
   timeout. Add the same row to `agent-hooks.v1.json`, `agent_hooks.rs`, the replay vectors and the fgctl uninstall
   goldens. Extend the doctor registry's hooks row text. Register the subcommand in `command-registry.mjs` and
   `command-manifest.json`.
5. Tests, in their owning files. In `apps/fgos/tests/owner_reaction_hook.rs`:
   - "khoan, cái này là gì" records exactly one friction with layer `owner-communication`.
   - No file under `.fgos/observe/records/` contains "khoan" or "là gì", and the private store does.
   - A neutral prompt records none.
   - An unwritable store still exits 0 with empty stdout.
   Extend `test/setup/agent-hooks.test.mjs` and the distribution vectors for the new row.
6. Document the row in `docs/platform/agent-mailbox/spec.md`'s hook table section.

## Verify

```bash
cargo test -p fgos --test owner_reaction_hook
cargo test -p fgos routing
cargo test -p fgos-distribution
node --test test/setup/agent-hooks.test.mjs
```

Pass: every command exits 0.

## Rollback

`git revert` of this phase's commit removes the hook kind, its row and its signal file. Projects that already ran
`fgos setup` lose the row on their next setup.
