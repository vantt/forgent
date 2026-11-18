# Code facts checked at base 570780a58 (planner scout, 2026-11-18)

1. **`src/portfolio/open-questions.mjs` (115 lines).**
   - It reads three sources:
     - `docs/discussions/*/QUESTIONS.md` table rows with status `open` (lines 22-37);
     - the "owner questions" section of draft plans, through `plan-sections.mjs` (lines 51-70);
     - the `openGates` of Workflow cases, through `readCaseProjection` (lines 72-95).
   - Its callers are the `questions` case in `bin/fgos.mjs:2273` and `src/cli/command-registry.mjs:1416`, a Node verb
     that requires `--open`.
   - Other references:
     - its sha256 pin in `packages/git/contracts/mutation-census.v1.json:1065`;
     - the test `test/portfolio/open-questions.test.mjs`.
   - Text that mentions it:
     - `src/session-host/head-start.mjs:97`;
     - `core/skills/fgos-secretary/SKILL.md:44`;
     - `docs/reading-map.md:191`;
     - `CHANGELOG.md:12`;
     - plan 261118-1117 line 49.
   - Its history is `967101665` (created) and `5c7cf3d13` (unreadable-case fix).
2. **The Observe shard door.** It is in crate `fgos-observe`, which is a lib and already a dependency of `apps/fgos`,
   work-state and run-result.
   - The functions are `writer_shard_name` (`shard.rs:75`), `shard_path(root, store)` (:149, giving
     `.fgos/observe/<store>/<writer>.jsonl`), `encode_line` (:194, 1 MiB cap), `append_lines` (:206, the caller holds
     the lock) and `read_store` (:279).
   - The lock is `acquire_store_lock(root)` in `store_lock.rs:43`, with a 4 s wait, on `<fgosDir>/locks/observe.lock`.
   - Observe spec §3 is at `docs/platform/observe/spec.md:58-65`.
   - The record write door (`record::write`) does not exist yet. Ops-metrics phase 4 builds it.
3. **Identity.**
   - `fgos-identity` `current_session(state_root, caller_pid, fgos_dir)` (`current.rs:154`, feature `directory`)
     returns `{id, handle}`.
   - Roles live on directory entries (`directory.rs:66,113`). Persona is not part of Identity; a head role `head:<persona>`
     carries it.
   - Mint kinds are in `mint.rs:18` (`RandomKind`), with prefixes at :25-26 and `KIND_NAMES` at :65.
4. **Hooks.**
   - Native hook kinds are listed in `apps/fgos/src/routing.rs:97-109` (`mailbox`, `mailbox-sync`,
     `session-rotation`). They exit 0 and run before the composition root. The handler pattern is
     `wiring/session_rotation_hook.rs:32`.
   - Hook rows are in `packages/distribution/rust/src/agent_hooks.rs` (~600-760), mirrored by
     `src/setup/agent-hooks.mjs:218-245`. No `UserPromptSubmit` row exists yet.
   - The doctor rows that point to hooks follow `mailbox-hook` (owner `rust:mailbox`, `pointer: true`).
5. **S04.**
   - The screen spec is `docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md`. The web side is
     `apps/fgos-gateway/web/src/screens/NeedsAnswer.tsx`, which uses `listWork({status:'awaiting-human'})` and
     `answerWork`.
   - The routes are in `gateway.rs:1270-1273` and run through `run_verb_blocking` (:432). The MCP tools
     `ask_work`/`answer_work` are at `mcp.rs:300`.
   - The gateway is excluded from the root workspace.
6. **`fgos ask` and gates.**
   - `fgos ask` is at `bin/fgos.mjs:1631` (`putInAwaiting`) and `fgos answer` at :1666.
   - Gates are `projection.openGates` (`src/workflow/case-projection.mjs:283`), folded in Node from events (:313).
   - No Rust reader of either exists.
7. **Native verb wiring**, using `friction` as the example:
   - `command-routes.json:406` and `command-route-annotations.json:21`;
   - `NATIVE_SUBCOMMANDS` at `routing.rs:80`;
   - the provider in `main.rs:107,285`;
   - `cli_projector.rs:61` and `invocation_doors.rs:475`;
   - a `native: true` entry in `command-registry.mjs:287`, from which the manifest is generated
     (`test/rust-host/command-routes.test.mjs`).
8. **Open questions on disk.** No `QUESTIONS.md` has an open row (ops-metrics and owner-questions are the only two
   files). Five plans are `draft`, and a few of them carry owner-question text.
9. **The `bin/fgos.mjs` bridge pattern.** `apps/fgos/src/wiring/doctor/bridge.rs` runs a payload module through
   `legacy_exec`, bounded, and reads JSON lines with a prefix.
