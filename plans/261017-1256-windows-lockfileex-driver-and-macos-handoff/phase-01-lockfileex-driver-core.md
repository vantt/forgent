# Phase 01: the `LockFileEx` driver core

- **Wave:** 1.
- **Branch:** `win-driver/p01-lockfileex`, worktree `.claude/worktrees/wd-p01`.
- **Depends on:** P00.
- **Runs in parallel with:** P02 (different crate files).

## Read first
- plan.md D1, D8, D9, D12.
- r6 §6.0 (the Windows `lockfileex` row) and §12.10.
- Measured calls in [`tools/platform-probe/src/windows.rs:64-102`](../../tools/platform-probe/src/windows.rs):
  - `open_lock`;
  - `try_lock` (`LockFileEx(h, EXCLUSIVE|FAIL_IMMEDIATELY, 0, 1, 0)`);
  - `lock_free`.
- The current code:
  - [`driver/windows.rs`](../../packages/holder-lock/rust/src/driver/windows.rs) and [`driver/mod.rs`](../../packages/holder-lock/rust/src/driver/mod.rs) (the `LockDriver` trait);
  - [`port.rs`](../../packages/holder-lock/rust/src/port.rs): `same_file` `:358`, `acquire` `:376`, `probe`, `release`;
  - [`semantics.rs`](../../packages/holder-lock/rust/src/semantics.rs);
  - [`facts.rs:300-315`](../../packages/process/rust/src/facts.rs) (`file_key`).

## Requirements

**`WindowsDriver`** (rename the struct to `LockFileExDriver`; module `driver/windows.rs`):

1. `supported() = true`.

2. `try_lock(file, mode)`:
   - call `LockFileEx` on `file.as_raw_handle()`, offset 0, length 1;
   - flags: `LOCKFILE_FAIL_IMMEDIATELY`, plus `LOCKFILE_EXCLUSIVE_LOCK` for `Ex`;
   - map `ERROR_LOCK_VIOLATION` (33) and `ERROR_IO_PENDING` to `WouldBlock`;
   - map every other error to `Err`.

3. `guarantee(dir)` and `file_guarantee(file)`:
   - find the volume of the nearest existing ancestor (`GetVolumePathNameW` + `GetDriveTypeW`; for an open file, `GetFileInformationByHandleEx(FileRemoteProtocolInfo)`, which succeeds only on a remote volume);
   - remote → `exclusion: None`, with a note;
   - local → D1 levels (`Kernel`, `JobScoped`, `Unsupported`), `driver: "lockfileex"`, `platform: "windows"`.

4. `description_path(file)` = `GetFinalPathNameByHandleW`, with the `\\?\` prefix stripped.

5. `holders` = `Unlistable("Windows has no API that lists byte-range lock holders")`.

6. New trait method `before_close(&self, file: &File)`:
   - default no-op (POSIX);
   - Windows: `UnlockFileEx(0, 1)`, ignoring `ERROR_NOT_LOCKED`.
   - `Handle` gets `impl Drop` that calls `driver::current().before_close(&self.file)`; the file then closes as before.
   - The port doc comment says why this is safe on Windows only (D8).

7. `prepare_borrow`, `end_leftovers`: leave unimplemented here (`Err` with detail `"borrowing lands with the job driver"`). P04 replaces them.

**Port** (`port.rs`):

- `same_file`: add a `#[cfg(windows)]` arm comparing `fgos_process::facts::file_key(file)` with the key of a freshly opened handle to `path`. `std::fs::metadata` has no stable file index on Windows, so the comparison opens the path with `FILE_SHARE_READ|WRITE|DELETE` and reads its key.
- Keep `open_lock_file`. std on Windows opens files non-inheritable and with share `READ|WRITE|DELETE`. Assert both in a test.

**`fgos-process` `facts::file_key`** (`#[cfg(windows)]` arm):
- `GetFileInformationByHandle`;
- return `(dwVolumeSerialNumber as u64, (nFileIndexHigh << 32) | nFileIndexLow)`.
- Only this function changes in `facts.rs`.

**Helper entry (D9)**: new module `packages/holder-lock/rust/src/helper.rs`.
- `pub fn run_if_requested() -> Option<i32>`: returns `None` unless `argv[1] == "--fgos-holder-lock-helper"`.
- Role `probe-holder --path P`: open P, lock `Ex`, write one byte `R` to stdout, flush, then sleep up to 60 s (the parent kills it).
- An unknown role → exit 64 with a message.
- P04 adds `job-keeper` here.
- `apps/fgos/src/main.rs` and `apps/fgctl/src/main.rs` call it first: `if let Some(code) = fgos_holder_lock::helper::run_if_requested() { std::process::exit(code) }`.
- Check that both binaries already depend on the crate. `fgctl` does through `fgos-distribution`; add a direct dependency if needed.

**Semantics probe (Windows half)** in `semantics.rs` (`#[cfg(windows)]`):
- spawn `std::env::current_exe()` with `--fgos-holder-lock-helper probe-holder --path <probe file>`, stdout piped;
- wait for `R` (bounded 2 s);
- `port::probe` must say `Held`;
- kill the child; `Free` within `FREE_WAIT`.
- The POSIX half stays as it is.

**CI (D12)**: create `.github/workflows/holder-lock-cross-platform.yml`.
- Triggers: `push` (all branches) with `paths:` covering:
  - `packages/holder-lock/**`, `packages/process/**`
  - `packages/distribution/rust/src/init.rs`
  - `apps/fgos/src/main.rs`, `apps/fgctl/src/main.rs`
  - `src/holder-lock/**`, `src/setup/holder-lock-checks.mjs`
  - `test/holder-lock/**`
  - the workflow file itself
- Also `workflow_dispatch`.
- Job `crates`, matrix `[windows-latest, macos-latest]`, `fail-fast: false`, timeout 30 min:
  1. checkout;
  2. Rust toolchain as in `ci.yml`;
  3. `cargo test -p fgos-process -p fgos-holder-lock -p fgos-distribution`;
  4. `cargo build -p fgos`;
  5. setup-node as in `ci.yml`, `npm ci`;
  6. `node --test test/holder-lock/windows-*.test.mjs` with `FGOS_HOST_BIN` set to the built binary (`fgos.exe` on Windows).
- The Node step is a no-op glob until P03 adds files. Use `shell: bash` and guard: `ls test/holder-lock/windows-*.test.mjs >/dev/null 2>&1 && node --test ... || echo "no Windows facade tests yet"`.

## Owned files

| Action | File |
|---|---|
| edit | `packages/holder-lock/rust/src/driver/{windows.rs,mod.rs}`, `packages/holder-lock/rust/src/port.rs` (only `same_file`, `Handle` `Drop`, `release` doc), `packages/holder-lock/rust/src/semantics.rs`, `packages/holder-lock/rust/src/lib.rs` |
| create | `packages/holder-lock/rust/src/helper.rs`, `packages/holder-lock/rust/tests/windows_lockfileex.rs` |
| edit | `packages/process/rust/src/facts.rs` (only `file_key`) |
| edit | `apps/fgos/src/main.rs`, `apps/fgctl/src/main.rs` (one call each), `apps/fgctl/Cargo.toml` only if the direct dependency is missing |
| create | `.github/workflows/holder-lock-cross-platform.yml` |

## Tests

`tests/windows_lockfileex.rs`, `#![cfg(windows)]`, with real processes. Reuse the existing re-exec pattern of [`tests/common/mod.rs`](../../packages/holder-lock/rust/tests/common/mod.rs) (`HL_TEST_ROLE`, `child_entry`), extended with Windows roles. Make its `#![cfg(unix)]` parts portable where needed.

1. A child holds `Ex`; the parent's `acquire(Try)` → `Held`. `TerminateProcess` the child → the parent's `acquire` → `Acquired` within 50 ms (r6 measured 0.1 ms).
2. Two `File`s in one process: the second `Ex` try → `WouldBlock` (two scopes exclude each other).
3. `Sh` + `Sh` → both locked; `Sh` held + `Ex` try → `WouldBlock`.
4. Release (`drop(handle)`) → another process acquires within 50 ms, with no wait for the OS to unlock on close.
5. `same_file`: the lock file is renamed away and recreated between open and lock → `acquire` retries and locks the new file.
6. The lock handle is not inherited: spawn `cmd /c exit` with inherit on; the child holds nothing (the parent then releases, and a third process acquires at once).
7. `semantics::two_process_probe(tmp)` → `Ok`, under 1000 ms.
8. `guarantee(tmp)` = `lockfileex` / `kernel` / `job-scoped` / `unsupported`.
9. `file_key` is equal for two handles of one file and different for two files.

Linux: the existing tests stay green (`cargo test -p fgos-holder-lock -p fgos-process`).

**Commands:**
- Local:
  - `cargo test -p fgos-holder-lock -p fgos-process`
  - `cargo check -p fgos-holder-lock -p fgos-process -p fgos -p fgctl --target x86_64-pc-windows-msvc --target aarch64-apple-darwin`
  - `cargo clippy` for the Windows target.
- **Windows proof:** commit, then SendMessage `forgentx-95` asking for a push of `win-driver/p01-lockfileex`. The workflow runs on push. Record the run id; red → fix and ask again.

## Acceptance
- Tests 1–9 are green on `windows-latest`.
- The macOS leg is green.
- Linux is green.
- The run id is in the phase report.
- `fgos --fgos-holder-lock-helper nope` exits 64.
- `fgos --help` is unchanged.

## Risk / rollback
- **`LockFileEx` on a handle opened by std with `FILE_FLAG_OVERLAPPED` absent:** a synchronous handle plus `FAIL_IMMEDIATELY` returns at once, which the probe measured. Keep `OVERLAPPED` zeroed.
- **Rollback:** revert. Windows goes back to `unsupported`.
