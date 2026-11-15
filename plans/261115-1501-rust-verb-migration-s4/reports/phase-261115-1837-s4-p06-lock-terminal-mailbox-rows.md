# Phase 06 report: holder-lock, mailbox and timer doctor rows in Rust (terminal rows stay bridged)

Branch `rust-verb-migration-program/s4-p06`, one commit on `ef1056cc9` (integration head at report time).
Status: DONE_WITH_CONCERNS.

## What moved
- `wiring/doctor/holder_lock.rs`: rows `lock-kernel-semantics`, `lock-borrow-vectors`, `lock-holders` (pointer, never fails), fix `lock-dirs`. Calls `fgos_holder_lock` (`port::guarantee`, `semantics::two_process_probe`, `borrow_vectors::run`, `state_root`, `DEFAULT_KILL_WAIT_MS`). The borrow vectors run in process on their own thread with the old 30 s bound (a hang ends the row, not the doctor); no `fgos internal lock-borrow-vectors` child, no host spawn from Node.
- `wiring/doctor/mailbox.rs`: row `mailbox-hook` (pointer; fails only on an unreadable/untrusted record), rows and fixes `mailbox-sync-timer`, `account-probe-timer` over `fgos_distribution::timer` (the timer fixes keep their old answer shape: `message` only, no `changed`). The opt-in comes from `fgos_distribution::agent_hooks::mailbox_opt_in`; the record verdict from `mailbox_verbs::status_for_root`, the same code the `mailbox status` verb runs (`status` was split into `status` + `status_of`, no behaviour change).
- `wiring/doctor/mod.rs`: `Rows` (one group = ids + two calls), `GROUPS`, `NativeOwner::{row_ids, fix_ids}` derived from the groups (the consts are gone), fixes run one at a time in registry order across groups, rows batched per group. `project_root_refusal` (pub): the door's text for a project directory it cannot open (`config-request-invalid (projectRoot)`), for phases 04/05 to reuse.
- Registry `inRust`: 6 rows, 3 fixes. The owner labels did not change (they were already `rust:*`), so the 56/53 split and its test are untouched.
- Deleted: `src/setup/holder-lock-checks.mjs`, the Node bodies and `registerCheck/registerFix` calls of the six rows and three fixes, `mailboxRecordVerdict`, `checkMailboxHook`, `crossMachineNote`.

## Not moved (facts report F2, contradiction 7)
- `terminal-control`, `terminal-allocations` stay `bridge:S6a`: the judge imports `resolveHostBin` from `src/runner/dispatch/transport.mjs` (no Rust owner). `src/setup/terminal-control-checks.mjs` and its test stay.
- `mailbox-claude-accept` moves in 07. `src/setup/managed-timer.mjs` and `test/setup/managed-timer.test.mjs` stay for `uninstall` until 09 (the `managed timer` door row's debt reason and `retiredBy` now say so). `agent-hooks.mjs` / `mailbox-limits.mjs` untouched except `crossMachineNote` out (no other reader).
- Timer rows keep the registry owner `rust:packaging` but live in `mailbox.rs`, as the phase file says.

## Doors
New row `holder-lock and mailbox doctor judgments` (door, debt none, allowed only the two adapter files); matches definitions by name, so `test/architecture.test.mjs` seeds six negative cases (3 Node names, 3 Rust names). `managed timer` row: debt reason and `retiredBy` reworded (uninstall is the one caller left).

## Parity (host vs base release 118df7065, `doctor.cases.mjs`, 42 cases, green on this tree)
Eight cases added: mailbox opted in (read, `--fix`), both timers asked for (missing, `--fix` -> units written then disabled because the service manager is pointed at a bus that does not exist, `--fix` twice), refused config, lock directories fixed then measured, lock directory made too open then tightened. The timers world carries an executable project shim so the timer rows reach the unit files. Normalised: the timer unit's path hash. The runner's node-child bound is now `2 + inRust fixes` per `--fix` (read from the registry, no per-phase edit). One real difference found and fixed: `--dir` naming a missing path (Node: `config-request-invalid (projectRoot)` on the three rows).
"lock-holders with a held lock": the row is a constant pointer in both entries, so a held lock cannot change it; not added.

## Gates
fmt; clippy `-D warnings` `fgos --all-targets` clean; `cargo test -p fgos --bin fgos wiring::doctor` 32 green; msvc and darwin `cargo check -p fgos --tests` clean (only warnings that exist on the base); census regenerated, 0 undeclared; `export-command-selectors --check` clean. Node (focused): 37 importers of registrations/checks/mailbox-limits/registry/slice-kinds + managed-timer, event-store-fixes, registry-contract, command-routes, census, architecture: green after two test fixes below; post-rebase re-run of architecture, registrations, census, checks, agent-hooks: 189 green. Not run by me (series gate): the full suite. Tests my change could reach beyond the focused set: anything reading `DOCTOR_CHECKS` through the harness (about 30 files, the importers were run), `test/rust-host/release-*`, `test/runner/dispatch-confinement-*`, `operation-prompt-templates`, `provider-credential-renewal`, `dispatch-governance-operability` (import registrations; skipped in my run, same module), doc-link checks on `docs/reading-map.md` and the holder-lock spec.
Windows: `apps/fgos/tests/windows_doctor_lock_rows.rs` (`cfg(windows)`) was compile-checked for msvc only; it runs where `holder-lock-cross-platform.yml` runs `cargo test -p fgos`.

## Retired test -> owner now
| retired | owner now |
|---|---|
| `test/setup/holder-lock-checks.test.mjs` lock-dirs create/once/tighten | `holder_lock.rs` `lock_dirs_creates_both_directories_private_once_and_tightens_a_directory_made_too_open`, `lock_dirs_names_a_directory_it_could_not_make_and_still_makes_the_other` |
| same, kernel semantics warn then pass | `lock_kernel_semantics_warns_for_a_missing_directory_then_passes_on_the_real_mount_once_it_exists` |
| same, refusal wording | `a_guarantee_of_unsupported_fails_by_name_a_network_filesystem_too_and_a_kernel_one_passes` |
| same, borrow vectors with real host and git | `the_borrow_vectors_row_passes_with_the_real_driver_and_real_git` (+ wording test) |
| same, lock-holders pointer | `lock_holders_is_a_read_only_pointer_to_the_lock_status_verb` |
| `test/holder-lock/windows-doctor.test.mjs` | `apps/fgos/tests/windows_doctor_lock_rows.rs` |
| `registrations.test.mjs` mailbox check on/off/default | `mailbox.rs` `the_row_says_why_it_cannot_tell_when_the_config_is_refused_and_reads_no_record_when_the_project_opted_out` (the "enabled by default" half is the standard's value, owned by the config crate; not a row behaviour) |
| `registrations.test.mjs` cross-machine note | `mailbox.rs` `cross_machine_mail_is_worded_with_counts_and_names_every_unconfirmed_key` |
| `registrations.test.mjs` mailbox-hook record verdict | kept as a host-driven wiring proof (runs the host doctor: none yet, ok, untrusted); wording cases in `mailbox.rs` `a_record_*`, `an_answer_with_no_record_*` |
| `agent-hooks.test.mjs` mailbox row under a refused config | `mailbox.rs` refused-config case |
| `checks.test.mjs` id list | six ids removed |
| `registrations.test.mjs` Data Dictionary #7/#7b | now compare the spec lists with the registry's rows and fixes (the registered Node bodies are a subset); `yaml-parse-failures.test.mjs` "lists every check" compares the Node-bodied rows in order |

## Proposed `## [Unreleased]` line
None needed for users; if wanted: `fgos doctor` judges the holder-lock, mailbox and timer rows itself instead of through Node and the host.

## Accepted changes (visible)
- The `stateRoot ... (<source>)` word in `lock-kernel-semantics` now says `home` when the state root is not pinned (the host no longer pins it for a Node child); parity normalises it.
- Windows: `lock-dirs` no longer reports "mode tightened" on every run (Node saw a non-private mode there always).
- The borrow-vectors failure text for a hang is `the borrow vectors did not finish within 30 s` (was the spawn error).

## Concerns / for the step lead and OPC
1. **File outside the phase Modify list:** `apps/fgos/src/wiring/mailbox_verbs.rs` (+ `mailbox_verbs_unsupported.rs`): `status_for_root(&Path)`, `record_dir_from`, `status_of` extracted from the verb (needed so the row calls the verb's own function without changing the process cwd). MAIL lane may touch this file: rebase check.
2. `project_root_refusal` is a second statement of the node-addon's `canonicalize` rule (`packages/git/node-addon/src/config.rs:132`); phases 04/05 should reuse it, and the config crate may want to own it.
3. No new `pub` item in fgos-git, fgos-process, fgos-holder-lock or any crate under `packages/`; new `pub` items are only in the `fgos` binary (`Rows`, `NativeOwner::row_ids/fix_ids`, `project_root_refusal`, `mailbox_verbs::status_for_root`).
4. `NativeOwner` shape changed (consts -> functions over `GROUPS`): phases 04, 05, 07 add one `pub mod` line and one `GROUPS` entry each and a `GROUP` const in their own file; expect a trivial conflict in `mod.rs` and in `registrations.test.mjs`/`yaml-parse-failures.test.mjs`/`checks.test.mjs` id lists.
5. Parity needs the real systemd bus out of reach: the table sets `XDG_RUNTIME_DIR` and `DBUS_SESSION_BUS_ADDRESS` to missing paths in every case.

Status: DONE_WITH_CONCERNS
