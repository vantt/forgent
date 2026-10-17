# Phase 00: contracts and dependencies

- **Wave:** 0.
- **Branch:** `win-driver/p00-contracts`, worktree `.claude/worktrees/wd-p00`.
- **Depends on:** 4.4a and 4.3 landed on main (plan D15).

## Read first
- plan.md D1, D2, D4, D6, D7, D9, D10.
- The current contracts: [`packages/holder-lock/contracts/`](../../packages/holder-lock/contracts/), in particular:
  - `holder-lock.port.v1.json`
  - `predecessor.v1.json`
  - `internal-route.lock-fd.v1.json`
  - `internal-route.lock-borrow-vectors.v1.json`
- `test/holder-lock/registry-contract.test.mjs`: how the contracts are tested.

## Requirements

**1. `holder-lock.port.v1.json`**
- Add the Windows guarantee row: `{driver: "lockfileex", exclusion: "kernel", borrow: "job-scoped", holders: "unsupported"}`.
- Add the remote-volume rule: `exclusion: "none"`.
- Say that on Windows `release` = unlock + close (D8), and that the close-only rule applies to POSIX descriptions.
- Add the borrow env `FGOS_LOCK_JOB=<lock>:<job>` beside `FGOS_LOCK_FD`, plus the four-part Windows borrower check (D2).

**2. `predecessor.v1.json`**
- `windows-job.domainId` = `{job: string, holder: {pid: integer, startTime: string}}`.
- Write the empty rule in full (plan D5):
  - the union of the three sources;
  - re-read on every poll;
  - `ActiveProcesses == 0` and every member signaled;
  - fail closed on a live pid that cannot be opened;
  - the Toolhelp fallback when the job does not open;
  - kill = `TerminateJobObject` plus terminate-by-identity for tree members.
- Add the second-owner requirement (D6).
- `v` stays 1.

**3. `internal-route.lock-fd.v1.json`**
- Add `--probe <lockFile>`: path-based shared try, used by Node on Windows, where no fd is handed over.
- Add `--predecessor-state <lockFile>`: read-only; `{result: "predecessor", state: empty|not-empty|unknown|absent, domain}`; never kills.

**4. New `internal-route.lock-hold.v1.json`**
- Argv: `--protocol`, `--path`, `--mode ex|sh`, `--wait-ms N` or `--try`, `--kill-wait-ms K`, `--ready <file>`.
- Ready-file JSON: the same result shapes as `lock-fd` (`acquired | held | timeout | unavailable`), plus `helperPid`.
- Lifetime:
  - the helper exits on stdin EOF or on parent death, always after the release rule;
  - stdin request lines: `{op: "borrow", argv, cwd, env, stdin: "null"|"inherit", stdoutFile, stderrFile, resultFile}`;
  - result-file JSON: `{exit, leftoversKilled}` or `{error: <BorrowError name>}`.
- Exit codes are the same as `lock-fd`.

**5. `internal-route.lock-borrow-vectors.v1.json`**
- Add the per-platform assertion (D2):
  - POSIX: the description is not held after release;
  - Windows: when `run_borrowed` returns, every process of the borrow is signaled, and right after release the lock is free.
- The vector names do not change.

**6. Helper roles (D9)**
- Add a short section to `holder-lock.port.v1.json`: `--fgos-holder-lock-helper probe-holder --path P` and `--fgos-holder-lock-helper job-keeper --job NAME --holder-pid N --holder-start T`.
- Mark them as internal and not a CLI surface.

**7. Dependencies**
- `packages/holder-lock/rust/Cargo.toml` and `packages/process/rust/Cargo.toml`: `[target.'cfg(windows)'.dependencies] windows-sys`. Use the version already in `Cargo.lock` (0.61), declared through `[workspace.dependencies]` if the root has that table, with the features `Win32_Foundation`, `Win32_Security`, `Win32_Storage_FileSystem`, `Win32_System_IO`, `Win32_System_JobObjects`, `Win32_System_Threading`, `Win32_System_Diagnostics_ToolHelp`.
- `fgos-process`'s existing hand-written `extern` block stays; P02 may move it to `windows-sys` in its own file only.

**8. 6.2 amendment**
- Check that the amendment block written into `plans/261016-1351-run-supervisor-rust-core-direct-mode/phase-02-containment-windows-macos.md` (on this plan branch) is present on the integration branch.
- If the owner rejected D3, follow the plan's open question 1 instead.

## Owned files

| Action | File |
|---|---|
| edit | `packages/holder-lock/contracts/{holder-lock.port.v1.json,predecessor.v1.json,internal-route.lock-fd.v1.json,internal-route.lock-borrow-vectors.v1.json}` |
| create | `packages/holder-lock/contracts/internal-route.lock-hold.v1.json` |
| edit | `packages/holder-lock/rust/Cargo.toml`, `packages/process/rust/Cargo.toml`, root `Cargo.toml` (only if `[workspace.dependencies]` needs the entry), `Cargo.lock` |
| edit | `test/holder-lock/registry-contract.test.mjs` (or the contract test that already loads these files): assert the new fields |

## Tests
- `node --test test/holder-lock/registry-contract.test.mjs` (with `env -u CLAUDE_CODE_SESSION_ID`).
- `cargo check -p fgos-process -p fgos-holder-lock --target x86_64-pc-windows-msvc` (the dependency resolves; no code uses it yet).
- `cargo test -p fgos-holder-lock -p fgos-process` on Linux stays green.

## Acceptance
- The contract tests are green and assert:
  - the Windows guarantee row;
  - the `windows-job` record shape;
  - the `lock-hold` argv and the ready-file shape;
  - the vector assertion per platform.
- `cargo check` for the Windows target is green.

## Risk / rollback
- Contracts only, so the risk is low. Rollback: revert.
