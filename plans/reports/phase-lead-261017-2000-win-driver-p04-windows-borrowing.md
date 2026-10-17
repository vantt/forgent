# Phase lead report: 4.4b P04, Windows borrowing

Branch `win-driver/p04-windows-borrowing`, merged into `win-driver/integration`.

## What landed
- **`run_borrowed`, Windows half** (`borrow_windows.rs`, new module; `port.rs` delegates). Declare record, `create_kill_job`, `job-keeper` (stdin pipe kept, `K` ack bounded 2 s, record rewritten with the keeper tuple), suspended child with `FGOS_LOCK_JOB`, `assign_and_resume`, wait or cancel, release step 0 (terminate, job view empty bounded by `kill_wait`), `finished` to keeper, record removed only when empty. No ack: keeper ended, record removed, `BorrowError::Spawn`. Signature gains `&HelperExe`; POSIX half only gets that parameter, `clear_env` and a `Files` refusal.
- **`job-keeper` role** (`helper.rs`): exits only when (holder finished or holder handle signaled) and job view empty; never exits because stdin closed; no Toolhelp scan.
- **`borrowed_check_job`** (a-d of D2) and the Windows `--borrowed-check` route; new reasons `job-missing`, `record-mismatch`, `not-in-job`, `holder-not-ancestor`, `lock-not-held`.
- **`lock-hold` requests** (`route/hold.rs`): `borrow` (one at a time, `borrow-busy`), `cancel`, parent death ends the job first, files `started/out/err/result`. A borrow that leaves processes it could not end blocks the next borrow (`borrow-leftover-pending`), so the kept record is never overwritten.
- **Node** (`index.mjs`, `hold-transport.mjs`, `driver.mjs`): `runBorrowed` on the hold transport, sync and ChildProcess-shaped async (pid before return, tailing streams, `spawn/exit/close/error`, `kill()` = cancel, `borrowed` promise). `process.platform` is gone from `index.mjs` (moved into `driver.mjs` as `leftoverSweep`, `borrowLeadsGroup`). `checkBorrowedDescription` on win32 uses `FGOS_LOCK_JOB`. `workerBaseEnv` drops `FGOS_LOCK_JOB`.
- **Borrow vectors on Windows**: pid files via `/proc/$!/winpid`, own `SYNCHRONIZE` check, `sh` named when the command never ran, sibling check with a real record and job (`not-in-job`).
- **Stress gate** `apps/fgos/tests/windows_predecessor_stress.rs` plus CI job `stress-artifact`. `acquire_with_trace` / `admit_with_trace` expose the per-pid source trace.

## Decisions I made
- Windows-only code lives in new `borrow_windows.rs` (lib.rs gets one `mod` line) to keep `port.rs` under the size limit.
- `BorrowSpec.clear_env`: a Node request's env replaces the child's whole env; `BorrowStdio::Files` carries the log files.
- Release step 0 uses the job view **with** the in-job scan (D5 text); the keeper uses list and count only. CI run 1 showed the list-only view returns early (2 tests red).
- `leftoversKilled` counts members still running before the terminate, not `ActiveProcesses` (which lags the process object).
- A hook's `lock-fd --borrowed-check` on Windows passes the job env through `FGOS_LOCK_JOB` only; the lock name in the env is not matched against the file (same as POSIX): authority is job membership plus holder ancestry.
- `provider-credential-probe.mjs` already branched nowhere on win32: added a win32 branch that calls `child.kill()` (a cancel) instead of `process.kill(-pid)`.
- Edits outside the owned list, needed: `packages/process/rust` (`WatchTrace`, `NamedBy`, `JobView::live_pids`, `ancestor_chain`, `own_session` public), `packages/distribution/rust/src/init.rs` (new `run` argument), `apps/fgos/Cargo.toml` (windows-sys dev-dep), lock-hold contract (error names), `windows_support/mod.rs` shared by the two Windows test files, `hold-transport-borrow.test.mjs` (protocol test against a stand-in helper, runs on every platform), `windows_lock_hold_route.rs` (old `borrow-unsupported` case now `request-unknown`).
- GitNexus index was stale (b334695); impact was done with `rg` over callers of `run_borrowed`, `borrow_vectors::run` and `BorrowStdio`. All callers updated. `run_borrowed` signature is a public API change inside the repo only (callers: init.rs, route.rs, tests).

## Review (Sonnet code-reviewer)
Fixed: async start bound shorter than keeper ack plus spawn (could free the lock under a running child); second borrow after a failed release overwrote the record; async early-result had no pid; `fail()` left files and streams; output not capped; dead `admit_after_lock`. Not changed: `Tail` ignores push backpressure; the vector's pid-reuse spurious red is theoretical.

## Evidence
- Linux: `cargo test -p fgos-process -p fgos-holder-lock -p fgos-distribution -p fgos -p fgctl`: 211 passed, 0 failed (private target dir). `node --test test/holder-lock/*.test.mjs`: 100 tests, 91 pass, 0 fail, 9 skipped (Windows only). `test/architecture.test.mjs`: 27 pass.
- Cross-check green: `cargo check --tests` for x86_64-pc-windows-msvc and aarch64-apple-darwin, all five crates.
- `rg "process.platform" src/holder-lock/index.mjs`: empty.
- Windows CI, fgos-process, holder-lock, distribution, fgos, fgctl, Node Windows tests: see run ids in the done file. Run 39034762840 (first push) had 2 red Windows tests (borrow released too early), fixed in `a5f67ee09`. Run 39035194498 (push) green on windows and macos. Run 39036311735 (push) and 39036316905 (dispatch, crates + stress-artifact) on `402892809`: all jobs green, including the Node Windows tests. Earlier run 39035199481 (dispatch): crates and macOS green, stress-artifact green, one flaky P03 Node test (helper process count while test files ran in parallel), fixed by `--test-concurrency=1`.
- Stress artifact `windows-predecessor-stress` (run 39034769500, 50 repeats): all three scenarios 0 violations, `dying-job-open` jobOpened 50/50, namedByOneSourceOnly 0, extra wait p50 about 13.7 ms, p95 about 17.5 ms.

## Unresolved
- The 500-repeat gate on the owner's machine is P06. In CI `dying-job-open` opened the job in every repeat because the keeper kill delay (up to 2x p50 about 27 ms) is long next to the contender's wait; P06 should read that percentage on the owner's machine and widen the delay range if it is below 50 percent.
- P06 (from the big lead): the helper-count test in `windows-facade.test.mjs` counts machine-wide `fgos.exe`; make it count only helpers its own test spawned, so it no longer depends on test concurrency. CI works around it with `--test-concurrency=1`.
- `Tail` has no backpressure handling for a consumer slower than the child.
