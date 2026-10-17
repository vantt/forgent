# Phase 01: the `LockFileEx` driver core

- **Wave:** 1.
- **Branch:** `win-driver/p01-lockfileex`, worktree `.claude/worktrees/wd-p01`.
- **Depends on:** P00.
- **Runs in parallel with:** P02 (disjoint files; see the plan.md ownership table).

## Read first
- plan.md D1, D8, D9, D12.
- r6 §6.0 (the Windows `lockfileex` row) and §12.10.
- The measured calls in [`tools/platform-probe/src/windows.rs:64-102`](../../tools/platform-probe/src/windows.rs): `open_lock`, `try_lock`, `lock_free`.
- The current code:
  - [`driver/windows.rs`](../../packages/holder-lock/rust/src/driver/windows.rs) and [`driver/mod.rs`](../../packages/holder-lock/rust/src/driver/mod.rs);
  - [`port.rs`](../../packages/holder-lock/rust/src/port.rs): `same_file`, `acquire`, `probe`, `borrowed_check`, `release`;
  - [`semantics.rs`](../../packages/holder-lock/rust/src/semantics.rs);
  - [`tests/common/mod.rs`](../../packages/holder-lock/rust/tests/common/mod.rs) (the re-exec pattern);
  - `apps/fgos/src/main.rs:146-160` (the `internal` dispatch) and `apps/fgctl/src/main.rs:24-35`.

## Requirements

**Driver** (`driver/windows.rs`; rename the struct to `LockFileExDriver`):
1. `supported() = true`.
2. `try_lock(file, mode)`:
   - `LockFileEx` on `file.as_raw_handle()`, offset 0, length 1, with a zeroed `OVERLAPPED`;
   - flags: `LOCKFILE_FAIL_IMMEDIATELY`, plus `LOCKFILE_EXCLUSIVE_LOCK` for `Ex`;
   - `ERROR_LOCK_VIOLATION` (33) → `WouldBlock`;
   - every other error, `ERROR_IO_PENDING` included → `Err`.
3. `guarantee(dir)` and `file_guarantee(file)`:
   - **remote** = `GetDriveTypeW(GetVolumePathNameW(nearest existing ancestor)) == DRIVE_REMOTE`, or `GetFileInformationByHandleEx(FileRemoteProtocolInfo)` succeeds on the open file;
   - remote → `exclusion: None`, with a note;
   - local → D1 levels, `driver: "lockfileex"`, `platform: "windows"`.
4. `description_path` = `GetFinalPathNameByHandleW`, with the `\\?\` prefix stripped.
5. `holders` = `Unlistable("Windows has no API that lists byte-range lock holders")`.
6. New trait method `before_close(&self, file: &File)`:
   - POSIX: no-op;
   - Windows: `UnlockFileEx(0, 1)`, ignoring `ERROR_NOT_LOCKED`.
7. `prepare_borrow` and `end_leftovers` stay unimplemented on Windows (`Err`, detail `"borrowing lands with the job driver"`). P04 replaces them.

**Port** (`port.rs`):
- **`Locked<'a>(&'a File)` guard:**
  - every successful `try_lock` in the port goes through it, including `lock_until`, `probe`, `borrowed_check` and `semantics`;
  - its `Drop` calls `driver::current().before_close(file)`;
  - `Handle` keeps the file plus a flag and calls `before_close` in its own `Drop` before the file closes;
  - every early `drop(file)` after a successful lock (the `same_file` mismatch, `admit → NotEmpty`) unlocks first (D8).
  - The doc comment states why explicit unlock is safe on Windows only.
- **`same_file` on Windows:**
  - read `GetFileInformationByHandleEx(FileIdInfo)` (volume serial + 128-bit id) for the locked handle and for a fresh `CreateFileW(path, 0, FILE_SHARE_READ|WRITE|DELETE)` handle;
  - compare them in full;
  - keep it a private helper in `driver/windows.rs` (`fn same_file_id(&File, &Path)`), exposed through a new trait method `same_file(&self, file, path) -> bool`. The POSIX impl moves the existing code there.
  - `fgos_process::facts::file_key` is not changed.
- **`HelperExe`:** `pub struct HelperExe(pub PathBuf)` with `HelperExe::current()` (= `current_exe()`), and the argv prefix `[exe, "internal", "holder-lock-helper"]`. `semantics::two_process_probe` takes it as a parameter, and callers pass `HelperExe::current()`.
- **Role entry:** new module `helper.rs`. `pub fn main(args: &[OsString]) -> i32` dispatches:
  - `probe-holder --path P`: open P, lock `Ex`, write `R` to stdout, flush, sleep up to 60 s;
  - any unknown role: exit 64.
  - P04 adds `job-keeper`.
- **Binaries:**
  - `apps/fgos/src/main.rs`: inside the existing `internal` dispatch, route `holder-lock-helper` to `fgos_holder_lock::helper::main`;
  - `apps/fgctl/src/main.rs`: add a hidden arm `"internal"` → `holder-lock-helper` that the help text does not list;
  - add direct dependencies if missing.

**Semantics probe (Windows half):**
- spawn `helper.argv() + ["probe-holder", "--path", <file>]` with stdout piped;
- wait for `R` (bounded 2 s);
- `port::probe` → `Held`;
- kill the child → `Free` within `FREE_WAIT`.
- The POSIX half is unchanged.

**CI** — create `.github/workflows/holder-lock-cross-platform.yml`.
- `push` with `paths:` covering:
  - `packages/holder-lock/**`, `packages/process/**`;
  - `packages/distribution/rust/src/init.rs`;
  - `apps/fgos/**`, `apps/fgctl/**`;
  - `src/holder-lock/**`, `src/setup/holder-lock-checks.mjs`;
  - `test/holder-lock/**`, `test/setup/holder-lock-checks.test.mjs`;
  - the workflow itself.
- Plus `workflow_dispatch`.
- Job `crates`: matrix `[windows-latest, macos-latest]`, `fail-fast: false`, 40 min, `shell: bash`. Steps:
  1. Rust toolchain and setup-node as in `ci.yml`; `npm ci`.
  2. `cargo test -p fgos-process -p fgos-holder-lock -p fgos-distribution -p fgos -p fgctl`.
  3. `cargo build -p fgos`.
  4. `if compgen -G 'test/holder-lock/windows-*.test.mjs' >/dev/null; then FGOS_HOST_BIN=… node --test test/holder-lock/windows-*.test.mjs; else echo "no Windows facade tests yet"; fi`. A failing test fails the step.
  5. Windows only: print whether the step process runs inside a job, using a PowerShell one-liner (`Add-Type` + `IsProcessInJob`). This answers red-team open question 1. It is informational and never fails the job.

## Owned files

| Action | File |
|---|---|
| edit | `packages/holder-lock/rust/src/driver/{windows.rs,mod.rs,flock.rs}` (`same_file`, `before_close` in the trait), `port.rs` (`Locked`, `Handle` `Drop`, `HelperExe`), `semantics.rs`, `lib.rs` |
| create | `packages/holder-lock/rust/src/helper.rs` |
| edit | `packages/holder-lock/rust/tests/common/mod.rs` (portable where needed) |
| create | `packages/holder-lock/rust/tests/windows_lockfileex.rs`, `apps/fgos/tests/windows_semantics_probe.rs` |
| edit | `apps/fgos/src/main.rs`, `apps/fgctl/src/main.rs`, their `Cargo.toml` if a direct dependency is missing |
| create | `.github/workflows/holder-lock-cross-platform.yml` |

## Tests

**`packages/holder-lock/rust/tests/windows_lockfileex.rs`** (`#![cfg(windows)]`, the `HL_TEST_ROLE` re-exec pattern, no helper roles needed):
1. A child holds `Ex`; the parent's `acquire(Try)` → `Held`. `TerminateProcess` the child → `Acquired` within 50 ms.
2. Two `File`s in one process: the second `Ex` → `WouldBlock`.
3. `Sh` + `Sh` lock; `Sh` + `Ex` → `WouldBlock`.
4. Release by `drop(handle)` → another process acquires within 50 ms.
5. `probe` while nobody holds, followed immediately by an `Ex` try from another process → `Locked` (no lingering `Sh`).
6. `same_file`: rename the lock file away and recreate it between open and lock → `acquire` relocks the new file.
7. The lock handle is not inherited: a child spawned with inheritance holds nothing.
8. `guarantee(tmp)` = `lockfileex` / `kernel` / `job-scoped` / `unsupported`.

**`apps/fgos/tests/windows_semantics_probe.rs`** (`#![cfg(windows)]`):
9. `two_process_probe(tmp, HelperExe(env!("CARGO_BIN_EXE_fgos")))` → `Ok`, under 1000 ms.
10. `fgos internal holder-lock-helper nope` → exit 64.

**Linux:** existing tests stay green, and `semantics` keeps its unix test.

**Commands:**
- `cargo test -p fgos-holder-lock -p fgos-process -p fgos`;
- `cargo check -p fgos-holder-lock -p fgos-process -p fgos -p fgctl --target x86_64-pc-windows-msvc --target aarch64-apple-darwin`;
- `cargo clippy` for the Windows target.

**Windows proof:** commit, then ask `forgentx-95` to push `win-driver/p01-lockfileex`. Record the run id; on red, fix and ask again.

## Acceptance
- Tests 1–10 are green on `windows-latest`.
- macOS and Linux are green.
- The run id is in the report.
- `fgos --help` and `fgctl` help are unchanged.

## Risk / rollback
- **The `Locked` guard touches every lock path on POSIX too:** `before_close` is a no-op there, and the existing Linux tests cover the paths.
- **Rollback:** revert.
