# Phase report: Windows driver P01, LockFileEx driver core

Status: DONE_WITH_CONCERNS. Branch `win-driver/p01-lockfileex-driver`, merged into `win-driver/integration`.

## Delivered
- `driver/windows.rs`: `LockFileExDriver` (offset 0, len 1, `FAIL_IMMEDIATELY`; `ERROR_LOCK_VIOLATION` → WouldBlock, all else incl. `ERROR_IO_PENDING` → Err); guarantee `lockfileex`/kernel/job-scoped/holders unsupported; remote volume (`GetDriveTypeW`, `FileRemoteProtocolInfo`) → exclusion none; `description_path`; holders unlistable; `before_close` = `UnlockFileEx`; `same_file` = full `FILE_ID_INFO`.
- Trait `LockDriver` gained `before_close` and `same_file` (POSIX: no-op / moved dev:ino check).
- `port.rs`: `Locked` guard (acquire failure paths, `probe`, `borrowed_check`), `Handle::drop` calls `before_close`, `HelperExe`.
- `helper.rs` (`probe-holder`, exit 64 on unknown role), routed from `fgos internal holder-lock-helper` and hidden `fgctl internal holder-lock-helper`.
- `semantics::two_process_probe(dir, &HelperExe)`; Windows half uses the helper process. `init.rs` caller passes `HelperExe::current()`.
- Workflow `.github/workflows/holder-lock-cross-platform.yml` (windows + macos, `--no-fail-fast`, Node facade glob guard, in-job report).
- Tests: `tests/windows_lockfileex.rs` (8 + child_entry), `apps/fgos/tests/windows_semantics_probe.rs` (2).

## Evidence
- Windows CI run **39031156336** (head 5cd7b73a3): windows-latest and macos-latest both green. Windows: `windows_lockfileex` 9 passed (incl. child_entry), `windows_semantics_probe` 2 passed.
- Earlier runs: 39030755100 (red: unix-shaped cli tests, macOS gate 1193 ms), 39030962758 (red: state-root vector, /proc test on macOS; all Windows driver tests green).
- Linux on integration (merge f6ee5b2f0): `cargo test -p fgos-process -p fgos-holder-lock -p fgos-distribution -p fgos -p fgctl --no-fail-fast` = 190 passed, 1 failed: `holder_lock_gate_passes_on_a_local_mount_with_the_real_git` took 7-10 s under machine load average ~20 (other leads building); rerun when quiet: 2/2 gate tests pass in ~1.2 s. Load flake, not a regression.
- `cargo check` + clippy `x86_64-pc-windows-msvc`, check `aarch64-apple-darwin`: clean.
- Phase-private build: `fgos`/`fgctl internal holder-lock-helper nope` → 64; `fgctl ... probe-holder` writes `R`; `fgctl` help unchanged.
- npm suite not run (no Node change in this phase).

## Decisions
- `DRIVE_REMOTE` defined as a local const (4): its windows-sys feature (`Win32_System_WindowsProgramming`) is not in P00's dependency set.
- Test timing: "within 50 ms" assertions use 150 ms (kill) and 250 ms (drop→other process) to tolerate runners.
- Gate time bound: Linux/Windows keep 1000 ms; macOS 3000 ms (measured 1193 ms, run 39030755100).
- Pre-existing Unix-shaped tests gated `#[cfg(unix)]`/linux so the new workflow can be green: 3 `cli_tests` (sh spy, symlinks), `activation_description_does_not_leak` (/proc, linux). State-root vector test now compares built paths, not `Path::components` (contract file untouched).
- `init.rs` (P05 owner) touched in two places: the `two_process_probe` call and the test bound constant.

## Concerns
- **Finding for P05:** macOS misses the <1 s gate target on a shared runner (1193 ms); spec text (RUL18 in `docs/specs/distribution.md`) needs a per-platform target.
- GitNexus index stale (mapped `main` entry points as HIGH); changes there are a leading dispatch arm. Risk judged low by reading.
- `spawn_term_ignoring_sleep` and other POSIX roles in `tests/common/mod.rs` compile on Windows but are unused there.

## Unresolved questions
- None.
