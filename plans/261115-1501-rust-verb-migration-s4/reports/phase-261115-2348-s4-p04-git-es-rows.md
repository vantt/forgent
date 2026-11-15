# Phase 04 report: Git and Event Store doctor rows in Rust

Branch `rust-verb-migration-program/s4-p04`, rebased on s4 `2f490135f`. Worktree `/home/vantt/projects/forgent-worktrees/rvm-s4-p04`, target `rvm-s4-p04-target`.

## What changed
- `fgos-git::repository_facts` (new, `pub`): `inspect_repository`, `Inspection`, `RepositoryFacts`, `FloorFacts`, `ProbeFacts`, `DURABILITY`. The addon's `inspectGit` now calls it (one assembly of the facts, no copy). Nothing else new in fgos-git; no change to fgos-event-store or fgos-process. `wired` on HooksReport is phase 09's commit, not mine.
- Host adapters `apps/fgos/src/wiring/doctor/{git.rs,event_store.rs}`, two `GROUP`s beside holder-lock and mailbox in `mod.rs`. Rows (10): `node-version-and-git`, `main-checkout-hook-wired`, `git-component-compatible`, `git-repository-config`, `git-operation-journal`, `git-incidents`, `event-store-open-root|machine-id|legacy-layout|incidents`. Fixes (4): `git-driver-directories`, `git-wal-dir`, `git-publication-refspecs`, `event-store-lock-dirs`. All listed in the registry `inRust`.
- `events.rs`: three message helpers made `pub(crate)` (`operation_failure`, `resolve_message`, `config_message`) so the doctor words store and config failures as the events verb does.
- `mod.rs`: `Run` (one run's shared facts), `config_refusal_text` and `config_read_text` (a refused config worded as the Node door client worded it), test kit with real repositories.
- Node deleted: `src/setup/{git-checks,git-retention-note,event-store-checks}.mjs`, the row and fix registrations, `checkNodeAndGit`, `checkMainCheckoutHookWired`. `event-store-fixes.mjs` stays for `init` (reads `eventStoreFacts` directly now; the lock-dirs fix has a Rust twin until `init` moves, 10). `git-hooks.mjs` `wired()` reads the report's `wired`.
- `main-checkout-hook-wired` applies only to a project whose `.githooks/pre-commit` carries fgOS's guard (`str65-worktree-isolation-enforcement`); remedy `npm run setup:hooks`. A `.githooks` with another pre-commit now passes ("not applicable").
- `doors` row "retired Node Git and Event Store doctor rows" (retired names, `allowed: []`, seeded negative case in `test/architecture.test.mjs`). Docs fixed where made false: git spec (retention constants), event-store spec (2 sentences), setup-doctor-registry (hook row).
- `forge-probe.sh`, `phase07-fixture.mjs`, `triggers.test.mjs`: no import of `fixGitFetchMapping`; they call the addon's `ensureGitFetchMapping` directly (RepositoryConfig, what the fix ran). NOT `fgos doctor --fix` as the phase file said: that runs every fix, including timers and hook wiring, in a scratch repository with the real HOME.

## Accepted changes
1. `node-version-and-git` no longer judges Node: message `git available` (was `node vX, git available`). A Node spawn inside a native row broke the one-Node-child invariant and the interrupt discipline of the bridge (cli_tests). Node missing or too old already fails every bridged row and names the install in `next`. Question for the step lead: add the Node version to the bridge's `end` line if the version text must survive until S6.
2. `git-component-compatible` `detail.versions` lists the Git component's contract versions only (no addon, so no napi/addon/yaml/... entries); the judgment is floor plus the three Git contracts. On macOS the row no longer fails with `event-store-unsupported-platform` (Node's addon-availability probe threw there).
3. Hook row: a foreign `.githooks` passes (V1 corrected); text `run npm run setup:hooks`.
4. `git-operation-journal` `detail.journal.retained*` differ by run time; the table normalises them.
5. Unusual io errors of the open-root `lstat` read as Rust words them; `ENOENT`/`EACCES` keep Node's text.
6. A Git rows context builds the Event Store context separately from the Event Store group (the group is judged in its own call), so a run may read Event Store facts twice. Judgments are the same.

## Retired test -> owner now
| retired | owner now |
|---|---|
| `git-checks.test.mjs` combined ABI row | `git.rs` `the_contract_versions_must_equal...`, `a_git_below_the_feature_floor_fails...`, `the_compatibility_row_keeps_its_facts_under_detail...` |
| malformed explicit addon / addon-less channel | removed with the addon-load path (the host has the Git crate linked) |
| journal row fence-missing, no WAL, WAL fix | `git.rs` `the_journal_row_fails_with_git_fence_missing...`, `..._names_the_fix_while_no_git_wal_exists`, `the_wal_fix_initializes_once...` |
| rows outside a repository | `git.rs` `the_repository_rows_report_information...` |
| one inspection shared by a run | `Run` caches (structure); `mod.rs` group test |
| incidents row | `git.rs` `the_incidents_row_never_fails...` |
| repository-config rows (missing mapping, unsafe refspec, moved remote, pushes) | `git.rs` `..._fails_a_missing_fetch_mapping...`, `..._allows_ordinary_pushes...` |
| retention sentence, Git error text | `git.rs` `the_retention_sentence...`, `a_git_error_reads_as...` |
| no-remote skip and fix | `git.rs` `..._skips_naming_the_command...`, `the_fetch_mapping_fix_has_nothing_to_repair...` |
| `native-load` umask probe: driver dirs, transport config, obsolete mapping, reserved refs | `git.rs` `a_group_writable_driver_directory...`, `..._names_an_untrusted_transport_setting...`, `an_obsolete_legacy_mapping...`, `reserved_legacy_mirror_refs...`; the addon-level cases stay in `native-load.test.mjs` |
| `event-store-checks.test.mjs` (12) | `event_store.rs`: pure `incidents_of` cases (age 599/601/3601, orphans, integrity, skipped mirror and sync warning, unpublished vs local stream), `machine_id_of`, real-repository cases (fresh pass, open root, orphan/worktree keys, integrity record, remembered failed context, malformed coalescing window). Not ported: the two cases that need a second clone syncing through a forge (shared machine ref, peer mirror) are covered by `incidents_of`/`machine_id_of` over the status values the crate reports; the crate's `diagnostics::status` stays owned by `fgos-event-store` |
| `node-version-and-git` test | `git.rs` `the_floor_row_passes_where_git_is_available_and_starts_no_node` |
| `main-checkout-hook-wired` test, `a doctor row keeps its facts under detail` | `git.rs` `the_hook_row_applies_only...`, `the_compatibility_row_keeps_its_facts...` |
| `recovery.test.mjs`, `topologies.test.mjs` `checkGit` assertions | `readGitStatus` assertions in the same tests; floor-below case is `git.rs` |
| `event-store-fixes.test.mjs` | stays (init until 10); Rust twin `event_store.rs` `the_lock_dirs_fix_repairs_modes...`, `a_symlinked_locks_directory_is_refused...` |

## Gates
- fmt; clippy `-D warnings` on `fgos`, `fgos-git`, `fgos-node-addon` (tests too); msvc and darwin `cargo check --tests -p fgos -p fgos-git`: clean for this phase's files.
- `cargo test --locked -p fgos --no-fail-fast`: all binaries green (283 bin incl. 74 doctor, 67 cli_tests, ...). `fgos-git` tests of `repository_facts` unit test.
- Census regenerated (0 undeclared). Registry `inRust` lists the 10 rows and 4 fixes.
- Node (focused, 63 files that import or read a changed file, plus architecture, census, door, status, recovery, parity): all green except the five release-tree tests that need `cargo build --release --workspace` (not run: quiet window; unchanged by this phase).
- Parity (`doctor.cases.mjs`, 70 cases, host vs base `118df7065`, rebased on s4 `6e79fbffe`): green, with wire-agents and uninstall tables. The table also leaves out the base's executor policy warnings on stderr (a clone of this repository) and the pid a writer-identity row names.
- Rebased gates: `cargo test --locked -p fgos` all binaries green (303 bin, 67 cli_tests); clippy workspace `-D warnings` clean; msvc and darwin `cargo check --tests -p fgos -p fgos-git` clean; one-door scan 0 undeclared; 61 focused Node files 998 tests, 5 red = the release-tree tests that need `cargo build --release --workspace` (not run).

## Tests the series gate must still run
Everything that reads the registry or `DOCTOR_CHECKS`: `registrations`, `checks`, `checks-doctor-config`, `yaml-parse-failures`, `doctor-bridge`, `architecture`, `release-tree` (needs release build), install-git-hooks; `test/event-store/*` through `phase07-fixture.mjs`; `test/git/native-load`.

## Proposed `## [Unreleased]` line
`fgos doctor` judges the Git and Event Store rows and their fixes in the host; the hooks row applies only to a project whose pre-commit is fgOS's own guard and names `npm run setup:hooks`; the Node-and-Git row reports the Git floor only.

## Concerns
- Parity base differs from the tree on two OPC-reworded sentences and the mailbox doc comment; normalised in the table with a comment each (accepted).
- "Interrupted operation" fixture is a merge in progress plus `index.lock`; a pending journal entry needs the addon's land fixture and is owned by `recovery.test.mjs` and `incidents` unit tests.
- New `pub` in an OPC-reviewed crate: `fgos_git::repository_facts::*` (listed above).
