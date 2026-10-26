---
phase: 7
title: "Hook install table, config registration, doctor probe"
status: pending
priority: P1
effort: "6h"
dependencies: [6]
---

# Phase 7: Install, setup and doctor

## Goal

Turn the hook installer's four hand-written functions into **one table** (spec §7.1), add the mailbox rows for Claude Code and Codex, and extend `commandIsKind` and the doctor probe. Register every `mailbox.*` key into `fgos setup` config-merge from the limits contract (AGENTS.md install gate; spec §12).

## Context

- Plan decisions 4, 14 and 15. Spec §7.1, §12. Review M6 is not touched here.
- `src/setup/agent-hooks.mjs` (536 lines) has:
  - `CLAUDE_HOOKS` and `codexHooks()` (`PreToolUse` arrays);
  - `agyGroups()` (named groups with nested `PreToolUse`);
  - the omp and pi extension generators;
  - four install/check pairs;
  - `commandIsKind(command, kind)`, matching `\bhook <kind>( --format=agy)?\s*$`;
  - `isShimRunnable` (runs `hook dispatch-decide` with `{}`).

  `registrations.mjs` imports the per-CLI functions (lines 47–58) and registers their checks and fixes (around 1191 and 1457–1499).
- Owning tests: `test/setup/agent-hooks.test.mjs` (12) and `test/setup/claude-code-hooks.test.mjs` (10); the registry in `test/setup/registrations.test.mjs`.
- The recorded hook shapes (V3, `adapters.v1.json` and `fixtures/hooks/<cli>/accepted-*.json`):
  - **Claude Code:** `hooks.Stop: [{hooks:[{type:"command",command}]}]` and `hooks.PostToolUse: [{matcher, hooks:[…]}]`;
  - **Codex** `.codex/hooks.json`: the same keys.

  Read the accepted fixtures; never assume the shape.
- Shared files: `src/setup/agent-hooks.mjs`, `src/setup/registrations.mjs` and their tests. `checks.mjs` only re-exports and needs no edit. `registrations.mjs` was changed on 10-22 by HARDEN and IDENT; merge first.

## Tests before

| File (owning proof) | New or changed test |
|---|---|
| `test/setup/agent-hooks.test.mjs` | `the_hook_table_is_the_only_source_of_each_clis_rows` (each row: cli, kind, event, file, shape, flat or nested; install then check passes for every row in a temp project) |
| same | `mailbox_rows_install_stop_and_post_tool_use_for_claude_and_codex_and_none_for_agy_omp_or_pi` |
| same | `command_is_kind_recognises_its_own_entries_with_cli_and_event_and_never_a_user_hook_or_a_path_containing_a_kind_name` (cases: the project path containing `mailbox`, a user hook running `fgos hook mailbox-foo`, reordered flags) |
| same | `install_preserves_user_hooks_on_the_same_events_and_is_idempotent` (extend the existing preservation test with a user `Stop` entry, **and with a user hook object inside the same entry's `hooks` array as ours**; RT9) |
| same | `a_command_whose_tail_merely_reads_like_ours_is_not_owned` (`bash -c 'x; echo hook mailbox --cli codex --event stop'` and a wrapper with another prefix are left alone) |
| same | `the_claude_mailbox_command_is_guarded_and_never_execs` (the installed string checks `[ -x "$S" ] || exit 0`, ends with `|| true`, and contains no `exec`) |
| same | `a_wrong_file_shape_is_skipped_silently_and_reported_by_check` (spec §7.1: run it on the agy flat-vs-nested groups and on a Claude `Stop` entry in the wrong shape, the V4 L2 case) |
| same | `the_doctor_probe_runs_the_mailbox_kind_with_benign_input_and_requires_exit_0_and_empty_stdout` (a stub shim in a temp project records its argv; with no mailbox rows installed, the probe skips the mailbox kind) |
| `test/setup/registrations.test.mjs` | `every_mailbox_limits_key_registers_one_config_default_with_its_contract_value`; `the_registered_mailbox_section_equals_the_committed_fixture_the_rust_loader_reads`. The one drift proof (RT12): the section `registerConfigDefault('mailbox')` holds must deep-equal `packages/mailbox/contracts/fixtures/config/registered-mailbox-section.json`, which phase 4's `the_exact_object_setup_registers_loads_unchanged` loads in Rust. Regenerating the fixture is a deliberate edit, so both sides fail on drift |

## Implementation

1. **The table.** `const HOOK_ROWS = [...]`, one entry per (cli, kind, event) with:
   - `file`: `.claude/settings.json`, `.codex/hooks.json` or `.agents/hooks.json`;
   - `container`: `hooks.<Event>` for Claude/Codex, or the agy group name;
   - `matcher` (or `null` for Claude `Stop`);
   - `shape`: `flat` or `nested`;
   - `command(repoRoot)`;
   - `legacyMarkers` (Claude only, as today).

   One `installRows(repoRoot, cli)` and one `checkRows(cwd, cli)` replace the bodies of `installClaudeHook`/`checkClaudeHook`, `installCodexHook`/`checkCodexHook` and `installAgyHook`/`checkAgyHook`. **The exported function names stay**, so `registrations.mjs` and `claude-code-hooks.mjs` keep their imports (no API change). omp and pi stay extension generators: they are TypeScript extensions, not JSON hook files, and outside the table by spec §4.1.
2. **Mailbox rows** (decision 14).
   - **Claude Code `Stop`** (no matcher) and **`PostToolUse`** (matcher `.*` unless the accepted fixture shows none). The command is the guarded form, with no `exec`:
     ```sh
     S="${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos"; [ -x "$S" ] || exit 0; "$S" hook mailbox --cli claude --event <e> || true
     ```
     That is the style of this repository's own `.claude/settings.json` hooks, minus their `exec`. The shell must stay between Claude Code and the host for the caller check (plan decisions 7 and 14).
   - **Codex `Stop` and `PostToolUse`:** the form phase 2 P4 showed Codex runs. Use the guarded form if Codex ran it through a shell; otherwise use `shimCommand(repoRoot, 'hook mailbox --cli codex --event <e>')`, with the residual that a missing shim shows an error.
   - The Codex row's `timeout`, and the Claude row's if the schema has one, use `ceil(mailbox.hook.budgetMs / 1000) + 2` seconds, read from the limits contract, so the CLI never cuts the hook before its own watchdog does. If neither CLI's recorded shape has a timeout field, leave it out.
   - **Ownership and replacement** (RT9): a hook object is ours only when its `command` equals this row's canonical string for this project, or matches one of our legacy markers. The installer replaces or appends only that hook object inside the entry's `hooks` array. It never rewrites the whole entry, so sibling user hooks stay. The existing `PreToolUse` code that replaces whole entries (`agent-hooks.mjs:239-259`) moves to the same rule in the table refactor. The existing 22 tests are the regression proof that this keeps current behaviour for entries holding only our hook.
3. **`commandIsKind(command, kind)`.** It stays only as the **check-side** recogniser for legacy entries (an older canonical form), extended to `\bhook <kind>(?: --format=agy)?(?: --cli [a-z]+)?(?: --event [a-z-]+)?(?: \|\| true)?\s*$`. Install-side ownership is the exact canonical string (step 2). A mailbox row matches only when kind, cli and event all match that row, so the `Stop` and `PostToolUse` rows are not confused.
4. **Doctor probe** (`isShimRunnable`).
   - It keeps the `dispatch-decide` probe.
   - When any mailbox row is installed for a CLI, it also runs `shim hook mailbox --cli <cli> --event post-tool-use` with input `{}`. That is malformed for the adapter, so the drain is quiet `Malformed`. It requires exit 0 and empty stdout.
   - **Doctor stays read-only.** Phase 6 opens the record lazily, only after the payload parsed and the caller check passed, so the probe creates no `.fgos/runtime/mailbox`, writes nothing and takes no lock. The probe test asserts that the directory does not exist afterwards.
   - The probe runs with the shim's own cwd, the project root. The existing env scrub (`FGOS_RUST_HOST_RECURSION_GUARD`) stays.
   - The check messages say which kind failed.
5. **Config registration** (`registrations.mjs`).
   - `registerConfigDefault({ id: 'mailbox', key: 'mailbox', shape })`. `shape` is built at module load from `packages/mailbox/contracts/limits.v1.json`: every key whose reader is `core` or `hook`, nested by its dotted path below `mailbox`, with its default.
   - Read the contract file once with `readFileSync` relative to the repository root, the same way other registrations read contracts. Find the precedent with `rg -n "contracts/.*\.json" src/setup/registrations.mjs`.
   - Comment above it (owner memory "config comments are documentation"): what the section does, that the values are unsigned placeholders from the contract, and that the Rust loader reads only the project file.
6. **No new doctor check** (spec §12 puts the minimal mailbox check at V7). The existing per-CLI hook checks now cover the mailbox rows and run the probe.

## Tests after

```bash
cd /home/vantt/projects/forgent-mailbox || exit 1
node --test test/setup/agent-hooks.test.mjs test/setup/claude-code-hooks.test.mjs test/setup/registrations.test.mjs test/setup/checks-setup-config.test.mjs test/setup/checks-doctor-config.test.mjs
echo "exit=$?"
```

## Regression gate

The command above, plus `node --test test/setup/` in full (it is still small enough), with memory checked first. Then regenerate the census.

## Risks

- **Projects that already have fgOS rows.** The table refactor rewrites owned entries only and preserves every user entry, which the existing preservation tests plus the new `Stop` case prove. Run the existing 22 tests unchanged first: they are the refactor's regression proof, so they must stay green **before** the mailbox rows are added (two commits: refactor, then rows).
- **The config shape writes about 26 keys into every project's `config.json` on `fgos setup`.** This is what spec §12 and the install gate require today. The Config component's "only differences" rule (CFG spec §4) converts it later. Note it in the phase 9 spec update.
- **This repository's own `.claude/settings.json` must not change.** It is tracked, and modified by another session in the main checkout. No step runs `fgos setup` or `doctor --fix` in a real checkout. Tests use temp projects only.

## Todo

- [ ] Refactor to one table, with the existing tests green and no new rows (commit 1)
- [ ] Mailbox rows, `commandIsKind`, probe (commit 2)
- [ ] Config registration from the contract, and the drift proof (commit 3)
- [ ] Run the gate; regenerate the census; sync and push

## Notes

- Plan owner decision 2 (2026-10-23): the Codex rows use the plain `shimCommand` form. Codex runs a hook command through the user's `$SHELL -c`; a guarded form keeps that shell (the user's login shell, the program the tools run in) at the head position, while zsh execs the plain form into the direct topology. Consequence for owner question 2: on a release older than the native kind, an unguarded Codex row shows "Unknown hook kind" (exit 1) on every hook call.
- Commits: `fd473def5` (one table; the existing 22 installer tests green unchanged), `4bc78a9d2` (mailbox rows, ownership by the shim running exactly the row's kind and arguments, the wrong-shape report, the mailbox probe), `cc30b2c63` (config registration and the shared fixture), and the commit after it (the full-config fixtures of `config-not-stale` and the non-git copy of `setup` know the mailbox section).
- Gate: `test/setup/` 931 passed, 1 failed: `active-release-drift-check.test.mjs` "real builder selection and staged production dependency payload agree with doctor" (`fgos.node: file too short` from the fixture's fake addon); it fails the same with this phase's change set aside, so it is checked against clean main in phase 9.
- Mutants: 10 killed.
- Deviations: the plain-form Codex rows (plan owner decision 2); Claude Code's PostToolUse matcher is `*`, the form the V3/V4 recordings used; both CLIs' mailbox rows carry `timeout` 10 (the recorded hook objects carried one); the shared fixture is `packages/mailbox/contracts/fixtures/config/mailbox-section.v1.json`; `package.json` ships `packages/mailbox/contracts/limits.v1.json`.
