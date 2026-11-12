# HARDEN: windows distribution-tests

Branch `harden/windows-dist-tests`. Windows proof: "Release assets check" workflow_dispatch run 43222841831 (windows-latest, step "cargo test (distribution crate)": 87 unit tests plus every integration binary, all green).

## Verdict per failing test
| Test | Verdict | Cause and fix |
| --- | --- | --- |
| 3x `init::tests::pin_override_*` | (a) test | Dirs were named `releases/sha256:<hex>`; a colon is invalid on Windows. Production already maps it through `release_dir_name`; the tests now use it. |
| `run_command_is_bare_...` | (a) test | Expected `/opt/fgos/bin/fgos`; production correctly answers `fgos.cmd` joined with the platform separator. The test now builds the expectation with the platform launcher name and path join. |
| `purge_removes_only_store_shaped_entries...` | (a) test | Same colon-named release dir; uses `release_dir_name`. |
| `purge_guard_refuses_root_home_relative_dotdot_and_ancestors` | (a) test, plus (b) production | Unix-shaped absolute paths are not absolute on Windows; the test now gives them a drive. The guard also had a real Windows hole: home and ancestor checks compared path components case-sensitively and treated `\\?\C:\x` as different from `C:\x`, so `c:\users\someone` slipped past a guard on `C:\Users\Someone`. `guard_store_root` now compares folded components (`comparable`). New Windows-only test `purge_guard_refuses_windows_drive_forms_and_case_or_verbatim_spellings_of_home` (drive root, `C:`, `C:rel`, rootless, verbatim root, case and verbatim home, ancestor in other case, `..`); platform-specific because the behaviour is. |

## Found once the unit tests passed
- `tests/fetch_download.rs` (7 of 11 failing on Windows, hidden before because cargo stops at the first red binary): the tests built `file://C:\...`; the transport gate rightly refuses a backslash. Tests now build `file:///C:/...` through one `file_url` helper. Production unchanged.
- msvc clippy `-D warnings` was red on test-only items used by unix tests only (`snapshot_tree`, `GATE_TESTS`, `GATE_BOUND_MS`, `PRETTY`) and an unused `path` in `write_workspace_shims`; gated with `cfg(unix)`.

## Gates
fmt; clippy -D warnings linux and msvc (`--no-deps`; `fgos-process` has its own msvc clippy errors, not touched); darwin check; `cargo test -p fgos-distribution -p fgctl`; focused node tests (fgctl-init-*, closing-block, install-packaging, architecture, doc-health): green. Full `npm test`: 8859 tests, 3 fail: citation drift (document-identity spec), V7n addendum (both known), and `mailbox-live-confined` "ending a confined run leaves no process" (listed load flake; it also failed alone on rerun, not read by this change).

## Authority
none. Closed no decisions.

## For the ci runner-env lead (not mine to touch)
- `release-assets-check.yml` windows job step "cargo test (session identity crate)" fails: `package ID specification fgos-session-identity did not match any packages` (crate renamed). That hides the two Node steps after it on Windows.
- `holder-lock-cross-platform.yml` windows `cargo test -p fgos` fails to compile `apps/fgos/tests/cli_tests.rs` (`std::os::unix`, `Permissions::from_mode` not gated); macOS has 8+ mailbox/identity failures there. Out of this phase.
- `fgos-process` msvc clippy: `manual_repeat_n` and others in `windows_spawn.rs`.

## Lessons
- A Windows job that stops at the first red test binary hides later reds; fix and rerun until the step ends, not just the named tests.
- `fgos-process` and `fgos` have separate msvc problems; local `clippy --target x86_64-pc-windows-msvc --no-deps` per crate is the quick proof.
- The census commit hook trips on any packages/ edit: regenerate with `--write-census` before each commit, and on every rebase conflict take origin/main's file then regenerate.
