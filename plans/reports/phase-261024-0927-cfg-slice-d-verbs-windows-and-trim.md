# Config verbs: Windows build and provider trim

Branch cfg/slice-d-verbs. Commits: 5d975ffde (target_revision + tests), 2bc3eb9b7 (Windows build, provider split, hint).

## 1. Windows build

- Proof run: `rustup target add x86_64-pc-windows-msvc`, then `cargo check -p fgos --target x86_64-pc-windows-msvc`.
- Before: `fgos-config` itself did not build on Windows (`migrate` imports the Unix-only write door and lock hold), and the provider was an empty module there, so `apps/fgos` failed to resolve `fgos_config::provider`.
- Fix: `migrate` is `cfg(unix)` like `write`/`relocate`/`doctor`; the provider compiles everywhere; write verbs, `migrate` and `check` live in `provider/unix_verbs.rs` (`cfg(unix)`); on other platforms one stub answers `config-platform-unsupported`. `show`, `explain`, `standard` run as far as the file read path goes (`read_beneath` refuses there with the same id, so `show` refuses, `standard` and `explain` answer). Home is `USERPROFILE` off Unix, `HOME` on Unix (no Linux change). Three Windows-only warnings in the crate removed.
- `config-platform-unsupported` already exists in failure-codes.v1.json (owner `src/files.rs`); not added again.
- Result: fgos-config and apps/fgos compile clean on Windows ONLY with `fgos-git` patched. BLOCKER outside this change: `packages/git/rust` does not compile for Windows on main (`refs.rs:1073` calls `custody_lock_path`, which is `cfg(unix)`; `worktree.rs:405` uses `libc` which is a Unix-only dependency). `fgos-distribution`, `fgos-observe` and `fgos-config` all depend on it, so the full `cargo check -p fgos --target x86_64-pc-windows-msvc` fails regardless of this work. I proved my part by patching those two lines locally, checking (clean, no warnings in config/fgos), and reverting; fgos-git is untouched in the commits. Needs the git lane.
- The `config_*` wiring tests in apps/fgos/tests/cli_tests.rs are not `cfg(unix)`; on Windows the write cases would fail at run time (compile is fine). Not changed.

## 2. Trim

- Host helpers: the host has no shared flag parser (each verb hand-rolls its loop in `cli_projector.rs`, config included) and the presenter already renders `Refusal` and `ConfigOutcome`; nothing in provider.rs duplicated them, so none replaced.
- Crate gaps: `write::target_revision(roots, kind)` is public, built on the transaction's own `place` and a shared `read_target`; the provider copy (`revision`, 17 lines) is deleted. Machine-files fact: the merged crate already has public `machine::unready`, and `doctor::check` now computes machine facts and destinations itself (the merge changed its signature, so HEAD did not compile with `host-provider`); the provider's local derivation from `token::read` errors and its destination mapping are deleted. No second new function was needed.
- `comment-would-be-lost` refusals now end with a hint naming `--acknowledge-comment-loss` (table `HINTS` also holds the machine-check hint). `set`/`patch` do not accept that flag, so the hint says `unset` takes it.
- Behaviour note: the merged findings engine reports `config-machine-files` (a fail row) on a machine with no private directory or token. `config check` on a bare machine therefore exits 65 now; the wiring test lays the machine files first. This follows the doctor row contract (`doctor-rows.v1.json`), not this change.
- Tests (none weakened or deleted): `target_revision_is_the_digest_of_the_file_a_write_to_the_target_edits` (write_golden.rs), `unready_names_what_the_machine_files_lack_and_nothing_once_they_are_in_order` (machine_files.rs; `unready` had no direct proof), the hint assertion added to the existing set/unset/patch wiring case, and the check wiring case now sets up the machine files.

## Line counts

| File | Before | After |
|---|---|---|
| provider.rs | 682 | 354 |
| provider/unix_verbs.rs (new) | 0 | 343 |
| provider total | 682 | 697 (+15: platform gate, stub, hints) |
| inspect.rs | 130 | 130 (unchanged) |
| write.rs | 412 | 432 (+37/-17: target_revision, shared read_target) |
| other crate src | | +6 (lib 2, docs 2, grammar 1, machine 0 net) |

provider.rs meets the 500 target per file; the sum did not shrink because the file was split on the platform seam and gained the hint and the stub. I did not cut further without moving behaviour (e.g. `patch_edits` into the crate) that was not asked.

Slice total, plan method (`find packages/config/rust/src packages/git/node-addon/src/config.rs apps/fgos/src packages/host-runtime/rust/src/catalog.rs -name '*.rs' | xargs wc -l`): aeb11845d 4,466; 72ecf6f55 7,539; HEAD 7,579. Slice delta now +3,113 (ceiling 3,300; this change +40). Node src: `git diff aeb11845d HEAD -- src bin` is polluted by other lanes (865 added / 4,224 removed overall); the confinement files this slice touched add 249 lines; no Node file changed in this work.

## Verification

- `cargo test -p fgos -p fgos-config -p fgos-host-runtime --features fgos-config/host-provider --jobs 4`: all green.
- `cargo clippy ... --all-targets -- -D warnings`: clean. `cargo fmt -p fgos-config --check`: clean (cli_tests.rs not reformatted; it was not rustfmt-clean before).
- Windows: see section 1.
- Git: a stray `git stash pop` of the pre-existing merge autostash was undone with `git reset --hard HEAD` before any edit; `stash@{0}` is untouched.

Unresolved: who fixes `packages/git/rust` for Windows (blocks the full release-target check).
