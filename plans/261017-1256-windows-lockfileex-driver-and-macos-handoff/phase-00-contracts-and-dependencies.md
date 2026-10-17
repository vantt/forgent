# Phase 00: contracts and dependencies

- **Wave:** 0.
- **Branch:** `win-driver/p00-contracts`, worktree `.claude/worktrees/wd-p00`.
- **Depends on:** 4.4a and 4.3 landed on main (plan D15), and plan open question 1 (D3) answered.

## Read first
- plan.md D1, D2, D4, D5, D6, D7, D9, D10.
- The current contracts in [`packages/holder-lock/contracts/`](../../packages/holder-lock/contracts/), in particular:
  - `holder-lock.port.v1.json`
  - `predecessor.v1.json`
  - `internal-route.lock-fd.v1.json`
  - `internal-route.lock-borrow-vectors.v1.json`
- `test/holder-lock/registry-contract.test.mjs` (how contracts are tested).

## Requirements

**1. `holder-lock.port.v1.json`**
- Add the Windows guarantee row: `{driver: "lockfileex", exclusion: "kernel", borrow: "job-scoped", holders: "unsupported"}`. `holders()` answers `unlistable`.
- Add the remote-volume rule: `exclusion: "none"`.
- Write down the unlock rule:
  - on Windows, every successful lock is unlocked explicitly before its handle closes (D8);
  - the close-only rule applies to POSIX descriptions.
- Add the borrow env `FGOS_LOCK_JOB=<lock>:<job>` next to `FGOS_LOCK_FD`.
- Add the Windows borrower check (D2 a–d), with the new `NotBorrowerReason` names: `job-missing`, `record-mismatch`, `not-in-job`, `holder-not-ancestor`, `lock-not-held`.
- Add the error names `lock-release-stuck` and `borrow-busy`.
- Add the **helper roles** section:
  - `fgos internal holder-lock-helper <role>` and `fgctl internal holder-lock-helper <role>`;
  - roles `probe-holder --path P` and `job-keeper --job NAME --record <recordPath>`;
  - both are internal, with no CLI promise;
  - the helper executable is an explicit `HelperExe` parameter of the crate API (D9).

**2. `predecessor.v1.json`**
- Set `windows-job.domainId` to `{job, sessionId, declaredAt, holder: {host, pid, startTime}, keeper: {host, pid, startTime} | null}` (D4).
- Write out the two views (D5):
  - the job view;
  - the contender view, with its three cases (holder alive, holder dead, job not openable);
  - the cross-session rule;
  - fail closed on an unopenable member;
  - two quiet snapshots in the fallback.
- Write out the keeper's exit rule (D6).
- `v` stays 1. A string `domainId` is an unknown shape and stays fail-closed.

**3. `internal-route.lock-fd.v1.json`**
- Add `--probe <lockFile>`: a shared try based on the path, used by Node on Windows.
- Add `--predecessor-state <lockFile>`: read-only, one pass of the contender view, never kills. It returns `{result: "predecessor", state: empty|not-empty|unknown|absent, domain}`.
- `--borrowed-check <lockFile>` on Windows uses `FGOS_LOCK_JOB` and takes no slot.

**4. New `internal-route.lock-hold.v1.json`**
- Argv:
  - `--protocol`, `--path`, `--mode ex|sh`;
  - `--wait-ms N` or `--try`;
  - `--kill-wait-ms K`;
  - `--work <dir>`.
- Work-directory files, each written as tmp + rename:
  - `ready.json`: the same result shapes as `lock-fd`, plus `helperPid`;
  - `req-<n>.json` (written by Node): `{op: "borrow", argv, cwd, env, stdin: "null"}` or `{op: "cancel", n}`;
  - `started-<n>.json`: `{pid}`, git's Windows pid;
  - `out-<n>.log` and `err-<n>.log`, appended as git writes;
  - `result-<n>.json`: `{exit, leftoversKilled}` or `{error: <name>}`.
- Lifetime:
  - the helper polls `req-*` every 5 ms and watches its parent's handle;
  - on parent death: terminate any borrow job, wait for the job view up to K, unlock, exit;
  - Node releases by terminating the helper.
- Exit codes are the same as `lock-fd`.

**5. `internal-route.lock-borrow-vectors.v1.json`**
- Per-platform assertion:
  - POSIX: unchanged;
  - Windows: each background process reports its Windows pid; an independent `SYNCHRONIZE` handle shows it signaled when `run_borrowed` returns; the lock is free after release.
- The vector names do not change.

**6. Dependencies**
- Add `[target.'cfg(windows)'.dependencies] windows-sys` to `packages/holder-lock/rust/Cargo.toml` and `packages/process/rust/Cargo.toml`.
- Use the version already in `Cargo.lock` (0.61). Declare it through `[workspace.dependencies]` if the root has that table.
- Features:
  - `Win32_Foundation`, `Win32_Security`;
  - `Win32_Storage_FileSystem`, `Win32_System_IO`;
  - `Win32_System_JobObjects`, `Win32_System_Threading`;
  - `Win32_System_Diagnostics_ToolHelp`, `Win32_System_RemoteDesktop` (`ProcessIdToSessionId`).
- No crypto feature: job names need no secret (D2).

**7. D3 gate**
- **Confirmed:** keep the amendment block in 6.2 phase-02.
- **Rejected:** delete it in this phase's commit, then move this plan's P02 content to 6.2 P02 and tell the big lead that 6.2 P02 must land alone and early (D3).

## Owned files

| Action | File |
|---|---|
| edit | `packages/holder-lock/contracts/{holder-lock.port.v1.json,predecessor.v1.json,internal-route.lock-fd.v1.json,internal-route.lock-borrow-vectors.v1.json}` |
| create | `packages/holder-lock/contracts/internal-route.lock-hold.v1.json` |
| edit | `packages/holder-lock/rust/Cargo.toml`, `packages/process/rust/Cargo.toml`, root `Cargo.toml` (only for `[workspace.dependencies]`), `Cargo.lock` |
| edit | `test/holder-lock/registry-contract.test.mjs` (or whichever contract test loads these files) |

## Tests
- Contract test (`env -u CLAUDE_CODE_SESSION_ID node --test test/holder-lock/registry-contract.test.mjs`). It asserts:
  - the Windows guarantee row;
  - the record shape (every key in D4);
  - the `lock-hold` argv and files;
  - the vector assertion per platform;
  - the new reason and error names.
- `cargo check -p fgos-process -p fgos-holder-lock --target x86_64-pc-windows-msvc`.
- `cargo test -p fgos-holder-lock -p fgos-process` on Linux stays green.

## Acceptance
- The tests above are green.

## Risk / rollback
- Contracts only. Rollback: revert.
