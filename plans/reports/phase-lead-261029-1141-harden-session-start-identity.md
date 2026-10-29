# HARDEN: register identity at session start

Worktree `/home/vantt/projects/forgent-worktrees/harden-session-start`, branch `harden/session-start-identity` (from origin/main 96ceca5e2). Not pushed, not merged.

## Commits
1. `ca48ca187` feat(identity): session register skips a seat the runner started
2. `028702892` feat(setup): register the agent's session from its SessionStart hook
3. `a4a4f78d3` docs(changelog): agents register their identity at session start

Net: 10 files, +111 / -21 (about 25 lines are the regenerated mutation census; the rest is code, tests, one changelog line).

## Runner-seat signal reused
The writer id `att-...` (`FGOS_SESSION_ID`, first in `ENV_ORDER`), tested with `fgos_identity::is_attempt_writer_id`. This is the same test the mailbox uses (`packages/mailbox/rust/store/src/hook/shell.rs:238`, `verbs.rs:106,161`). No new signal. In `packages/identity/rust/src/provider.rs`, `in_runner_seat(request)` resolves the writer with `resolve_identity` and a `SessionAction::Register` arm before the real one returns `{"registered": false, "reason": "runner-seat"}`, exit 0, empty stderr, no directory write, no publish. Every CLI gets it because it sits in the verb. Note it covers `--register --role ...` too: a runner seat never claims a role.

## CLIs
Rows added to `hookRows` in `src/setup/agent-hooks.mjs` (new kind `session-register`, event `SessionStart`, timeout 10 s, command `<shim> identity session --register || true`):
- claude: row. Evidence: `SessionStart` is a Claude Code hook event (this repo's own `.claude/settings.json` wires one). Guarded form like the mailbox rows (`[ -x "$S" ] || exit 0`), no matcher so every source runs it.
- codex: row. Evidence: `plans/reports/research-261020-1612-mailbox-s0-human-input-and-peer-prompt-hooks.md` (Codex 0.162.1): `hooks.json` with `SessionStart` fired, source `startup`. Nested entry, no matcher, absolute single-quoted shim.
- agy: row. Evidence: same report (agy 1.4.2): `SessionStart` is one of six documented events and was observed firing (first turn of a conversation). It is a flat event; `research-261019-1653-mailbox-delivery-cli-probe.md` measured that agy skips nested entries for flat events. So the row carries `flat: true` and is written as `"fgos-session-register": {enabled, SessionStart: [{type, command, timeout}]}`. Minimum table code: `groupEntry` and `isGroupEntryOf` helpers used by install and check, and the wrong-shape message for a flat row.
- omp, pi: NO row. `adapters.v1.json` `hookFacts` records no session-start event for any CLI (only Stop and PostToolUse channels). omp and pi are not rows in the table (they are the generated extension, which holds MAIL's mailbox part). `session_start` appears only in a live probe (`test/live/mailbox-role-probe-ext.ts`), not in facts, so no guess. They keep registering at their first fgOS verb.

Gap to know: `adapters.v1.json` itself has no session-start facts for claude, codex or agy either. The evidence above is the measured research reports and the repo's own claude hook. If the owner wants the facts file to name the event, that is a MAIL-owned contract edit.

## Doctor
No new check. `checkRows` is table-driven (`rowsOf` then `rowPresent`), so a missing row reads `... missing canonical hook(s): session-register`, and a nested agy row reads "in a shape AGY does not read".

## Tests
- Rust: `identity_session_register_in_a_runner_seat_exits_quietly_and_registers_nothing` in `apps/fgos/tests/cli_tests.rs` (the identity verb's wiring file): att- seat gets the quiet answer and no `identity` dir; an ordinary session still registers. `cargo test -p fgos --test cli_tests identity_` 12/12; `cargo test -p fgos-identity` all green; `cargo clippy -p fgos-identity -p fgos --all-targets -- -D warnings` clean; `cargo check -p fgos-identity` for x86_64-pc-windows-msvc and aarch64-apple-darwin clean (both targets installed; checked the identity crate only).
- Node: `setup writes a SessionStart registration row for Claude Code, Codex and agy, none for omp and pi, and doctor accepts it` in `test/setup/agent-hooks.test.mjs`. It also checks that doctor names a missing codex row and a wrong-shape agy row. The existing table test got a flat-row branch.
- Two tests in `test/setup/claude-code-hooks.test.mjs` asserted the whole `SessionStart` list unchanged; they now assert the user's entry is untouched (index 0) with ours beside it, since fgos now adds its own entry there.
- Counts, `test/setup/agent-hooks.test.mjs` + `claude-code-hooks.test.mjs`: before 37 tests, 3 fail; after 38 tests, 3 fail (34 and 35 pass). Same three red (MAIL: "mailbox rows install only when the project opts in...", omp and pi extension tests). Without them: 35/35 pass. Also green: `visibility-checks`, `agy-permissions`, `agent-cli-trust-check`, `install-packaging`, `cli/command-registry`, `fgos-verb-help-json`, `subcommand-flag-drift`, `fgos-help` (91 tests).
- One-door census regenerated and staged in commits 1 and 2.

## Other changes
`src/cli/command-registry.mjs` (identity session description) said "hooks ... never [register]"; now false, reworded. CHANGELOG `[Unreleased]` line added.

## Docs lines needed (docs/ frozen, not edited)
- `docs/platform/identity/spec.md`: where it says registration is explicit and hooks never register, add that `fgos setup` writes a SessionStart row (claude, codex, agy) that calls `identity session --register`, and that a seat whose writer id is `att-...` answers `registered: false` and is never listed.
- `docs/platform/agent-mailbox/spec.md` section 7 (hook install, table-driven rows): the table now also carries the `session-register` kind and a `flat` row shape (agy `SessionStart`); omp and pi get none.
- `docs/specs/` area spec for setup/doctor (hook rows list: dispatch, decision, mailbox, + session-register).

## Notes / unresolved
- Ownership matching: `isOwnedHook` for the new rows is exact-command (no `commandIsKind` migration, whose regex starts with `hook <kind>`). A project moved to a new path would keep a stale codex/agy row (`|| true`, harmless) beside the new one. Tell me if you want the matcher generalised.
- The hook's stdout is the verb's JSON envelope; Claude and Codex add SessionStart stdout to the session context. Not redirected, per the spec'd command shape. Say so if the owner wants it silenced.
- The store mints on first append only when the project has a project id (publish path unchanged).

Status: DONE_WITH_CONCERNS
