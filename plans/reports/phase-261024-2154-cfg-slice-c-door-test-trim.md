# Door test trim and global migrate without the project layer

## Task 1: one wiring proof per door entry

Each owner below was read before the Node case was retired.

| Retired | Owning crate test | What the owner proves |
|---|---|---|
| `config-door` `init`: second call keeps the file, header-only text, global target, accounts target refusal | `golden_init.rs` `a_new_file_holds_the_header_and_no_key`, `an_existing_file_is_kept_whether_yaml_or_legacy_json`, `a_confined_session_an_accounts_target_and_a_symlinked_directory_are_refused` | header text and modes for both targets, keep-existing (yaml, legacy json, tombstone), confined / accounts / symlink refusals |
| `config-door` test `snapshot without a project root is the machine view...` | `machine_view.rs` `a_project_file_is_never_read_so_it_cannot_fail_or_change_the_machine_value`, `accounts_are_in_the_view_only_when_unconfined` | project file never read, no `project` revision, confined has `unavailable-confined` and no accounts revision |
| `facade` test `a legacy config.json still reads and a migration tombstone is no source` (legacy read, tombstone, config.json present) | `files_select.rs` `exactly_one_source_is_chosen_...` (tombstone and near-tombstone cases), `golden_migrate.rs` (snapshot reads a legacy json value), `golden_init.rs` (tombstone means no source) | source choice and the legacy read |

Kept in the door test `init` entry: reaches the crate, result has no prototype, one refusal by id (`config-write-confined`). The `init` wiring still reads back the created file header once.

Kept in the facade test: `projectConfigPresent` (absent then present), which is the facade's own logic; per-call global dir and class, the error type and the no-fallback test are untouched.

Not retired (no crate owner found): the `snapshot` linked-worktree / main-checkout test (`detect_path.rs` is about executable detection, not the trusted root) and the `sections`/`origins` narrowing in the main `snapshot` test (no `sections` or `origins` case in `golden_snapshot.rs`). Left as they are.

## Task 2: `config migrate --global` read the project file

Cause: `relocate::copy` built its write request from `req.roots` whole, so the write transaction's snapshot read the project layer. An unmigrated project file holding `gateway.port` / `gateway.token` refused that snapshot (`config-key-out-of-scope`, `config-key-in-wrong-file`). The token is installed before the accounts write, so the run stopped with the token copied and the pools not.

Fix (`packages/config/rust/src/relocate.rs`, one line): the accounts write uses `without_project(&req.roots)`, the existing helper from `write.rs`. This covers the verb and the `doctor --fix` copy (`repair.rs`), which share `copy`. `finish` never reads the project layer; no change.

Partial copy: kept the per-key behaviour, no new mechanism. Basis: spec section 13 ("a crash between the two leaves the key in both, reported as `config-key-in-wrong-file`, and the destination wins"; a move writes and verifies the destination first) and decision D9 (stage 1 copies, source kept, safe to rerun; `doctor --fix` runs stage 1 only). A conflicting destination is already refused before any write (`states(.., true)`), so the remaining half-way cases are crash or I/O ones, which a rerun completes (`copy-twice-writes-nothing-the-second-time`, `a-crash-after-the-destination-is-written-...`). The project layer was the only refusal source that did not belong to the global copy.

Owning proof: new case `copy-reads-no-project-file-so-an-unmigrated-one-cannot-refuse-it` in `packages/config/contracts/fixtures/relocate.v1.json`, run by `relocate.rs` `relocate_cases`. It failed with exactly the two refusals before the fix and passes after.

CHANGELOG: one line under `[Unreleased]`.

## Results

- `cargo test -p fgos-config -j 4`: green, all test binaries.
- `node scripts/run-tests.mjs test/config/config-door.test.mjs test/config/facade.test.mjs`: 19 pass, 0 fail.
- Full `npm test` not run (owner runs it).

Status: DONE
Summary: Door and facade tests trimmed to one wiring proof per entry, each retired case pointing at its crate owner; global stage-1 copy no longer reads the project file.
Concerns/Blockers: the linked-worktree and sections/origins snapshot cases were kept for lack of a crate owner. The running addon in an installed release needs a restage before `fgos config migrate --global` shows the fix.
