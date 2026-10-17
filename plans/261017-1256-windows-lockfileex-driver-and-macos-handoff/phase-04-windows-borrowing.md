# Phase 04: borrowing on Windows (`run_borrowed` in a named job)

- **Wave:** 3.
- **Branch:** `win-driver/p04-borrow`, worktree `.claude/worktrees/wd-p04`.
- **Depends on:** P01, P02 and P03.

## Read first
- plan.md D2, D5, D6, D7, D9 and D12.
- Red-team findings 1–3, 5, 9, 10, 12 and 13.
- r6 §6.0.1 steps 0–4 and §6.4 (git gc flags; the hook never runs in the background).
- [`port.rs`](../../packages/holder-lock/rust/src/port.rs): `run_borrowed`, `borrowed_check`, `borrowed_argv`.
- [`borrow_vectors.rs`](../../packages/holder-lock/rust/src/borrow_vectors.rs).
- [`index.mjs`](../../src/holder-lock/index.mjs): `runBorrowed`, the borrow sweep (`:359-422`), `checkBorrowedDescription`.
- `src/runner/provider-capacity.mjs:419` (`spawnHolding`) and `src/runner/provider-credential-probe.mjs:109-129`: the ChildProcess contract.
- The probe's [`git.rs`](../../tools/platform-probe/src/git.rs) and [`predecessor.rs`](../../tools/platform-probe/src/predecessor.rs).

## Requirements

**1. `run_borrowed`, Windows half** (`port.rs`; signature gains `helper: &HelperExe`; the POSIX half is untouched)
1. Require `Ex`; build the argv with `borrowed_argv` (git gets the gc flags).
2. Name the job: `job = windows_job::job_name("fgos-borrow", lock name)`.
3. **Declare** `WindowsJob { job, session_id, declared_at: now, holder: own tuple, keeper: None }` (r6 step 1, before the job exists).
4. `create_kill_job(job)`.
5. **Keeper:** spawn `helper.argv() + ["job-keeper", "--job", job, "--record", <record path>]`:
   - stdin is a pipe, which the holder keeps;
   - stdout is a pipe for the ack; stderr is null;
   - not in the job, not inheriting anything else.
   Then:
   - wait for `K` (bounded 2 s);
   - **rewrite** the record with the keeper tuple (tmp + rename).
   - If there is no ack: terminate the keeper, close the job, remove the record (we hold the lock and the job is empty), and return `BorrowError::Spawn`.
6. **Child:** `std::process::Command` with `creation_flags(CREATE_SUSPENDED | CREATE_NO_WINDOW)`, env `FGOS_LOCK_JOB=<lock>:<job>`, stdio from the spec (null, or the files the `lock-hold` request names). Then `windows_job::assign_and_resume(job, &child)`. This uses std's quoting and handle rules, so there is no hand-rolled `CreateProcessW`. The helper's own std handles are already non-inheritable (P03).
7. Report the child pid (`lock-hold` writes `started-<n>.json`). Wait for the child to exit, or for a `cancel` request, which runs `TerminateJobObject`.
8. **Release rule step 0:** `TerminateJobObject`; poll `job_view(job).is_empty()` until `Empty`, bounded by `kill_wait`. The job view never includes the holder or the keeper. Past the bound → `LeftoverNotKilled { pids }`.
9. Write `finished\n` to the keeper's stdin and close it; close our job handle; remove the record.
10. Return `BorrowOutcome`.

**2. `job-keeper` role** (`helper.rs`, D6)
- Read the record and open the holder's process handle (`SYNCHRONIZE`) and the job.
- Write `K`.
- Loop every 50 ms, using the job view **without a Toolhelp scan**. Exit 0 when **(holder wrote `finished` or the holder handle is signaled) ∧ job view `Empty`**.
- Never exit merely because stdin closed.
- If the job cannot be opened at start → exit 1 without ack.

**3. `borrowed_check_job`** (Windows; D2 a–d)
- Reason names come from P00.
- Route `lock-fd --borrowed-check <path>` on Windows calls it with `FGOS_LOCK_JOB`.

**4. `lock-hold` requests** (`route.rs`)
- `borrow`: run `run_borrowed(&handle, spec, &HelperExe::current())`.
  - git's stdout/stderr → `out-<n>.log` / `err-<n>.log`;
  - `started-<n>.json` once spawned;
  - `result-<n>.json` at the end.
  - One borrow at a time; a second request → `{error: "borrow-busy"}`.
- `cancel`: `TerminateJobObject` on the in-flight borrow's job; the borrow then completes its steps 8–10.
- **Parent death while a borrow is in flight** (red-team finding 9): `TerminateJobObject` at once, wait for the job view up to `kill_wait`, unlock, exit.

**5. Node `runBorrowed`, transport `hold`** (`index.mjs` and `driver.mjs`)
- **Sync:**
  - write `W/req-<n>.json`;
  - poll `W/result-<n>.json` with `Atomics.wait`; bounded by `spec.timeoutMs` if given, after which write a `cancel` request and keep waiting up to `killWait + slack`;
  - read the out/err files, delete the request's files;
  - return `{exit, signal: null, stdout, stderr, leftoversKilled}`, the same shape as POSIX.
- **Async** (`sync: false`): return a **ChildProcess-shaped** `EventEmitter`:
  - `pid`: from `started-<n>.json`, awaited before the object is handed back, within 2 s;
  - `stdout`/`stderr`: `Readable` streams that tail the log files every 20 ms;
  - events `'spawn'`, `'exit'(code, null)`, `'close'(code, null)` after the final tail drain, and `'error'`;
  - `kill()` → a `cancel` request;
  - `borrowed`: the same promise as today.
  - `spawnHolding` (`provider-capacity.mjs`) and `runCredentialProbe` work unchanged. Their `process.kill(-child.pid)` group kill becomes `child.kill()` on win32 **only if** they already branch there; otherwise route the existing kill through `child.kill()` and say so in the report.
- **Borrow sweep** (`index.mjs:359-422`): replaced, for transport `hold`, by the helper's own release rule. Remove the `process.platform` checks from `index.mjs`, so they live in `driver.mjs` only.
- **`checkBorrowedDescription`** on win32: `lock-fd --borrowed-check <lockPath>` with the env passed through. `rg checkBorrowedDescription src scripts` lists the callers; each must pass `env`.
- **Scrub:** `workerBaseEnv` (`src/runner/dispatch/adapters.mjs:99-109`) drops `FGOS_LOCK_JOB`.

**6. Borrow vectors on Windows** (`borrow_vectors.rs`, D2). `run` takes `&HelperExe`; `fgctl` passes `HelperExe::current()`.
- Each vector's background command is `sh -c 'sleep 30 & cat /proc/$!/winpid > <pidfile>'`, placed in an alias, a clean filter, a post-commit hook, or `gc.auto=1` with loose objects.
- After `run_borrowed` returns, the vector reads the pidfile, `OpenProcess(SYNCHRONIZE)`s it, and asserts it is signaled; or that the open fails with `ERROR_INVALID_PARAMETER` (already gone and reaped). It does not use the driver's own empty rule.
- Then: release, and `probe == Free`.
- **Sibling:** a process with the copied env but outside the job → `not-in-job`.
- **No `sh`:** a vector whose alias fails to run is red, and names `sh` in the detail (detected by running it, not by guessing a path).

**7. Stress test** (gate, D12): `apps/fgos/tests/windows_predecessor_stress.rs`, `#![cfg(windows)]`, every test `#[ignore]`.
- **Holder:** `env!("CARGO_BIN_EXE_fgos") internal lock-hold` with a `borrow` request for `git commit`, where the pre-commit hook blocks on a named event and reports its own and git's Windows pids through a file.
- **Contender:** an in-process `acquire(Wait)` in the test, through the crate's real `admit`. As soon as it returns, the test checks its own `SYNCHRONIZE` handles to every pid that was ever in the borrow; any unsignaled pid is a violation.
- **Scenarios:**
  - `borrow-hook-predecessor-check`: terminate the holder only.
  - `all-owners-dead`: terminate the holder and then the real keeper (found as a Toolhelp child of the holder).
  - `dying-job-open`: terminate the holder, then the real keeper after a delay drawn from `[0, 2 × p50 contender lock-wait]`, where p50 is measured in 20 warm-up repeats.
- Repeats come from `HL_STRESS_REPEATS` (default 500); output goes to `HL_STRESS_OUT`. Both are read only by this test file.
- **JSON per scenario:** repeats, violations, `jobOpened`, extra wait p50/p95/max, `namedByOneSourceOnly`, and per violation the sources that named each live pid. The contender's `admit` exposes this through a `#[doc(hidden)] pub fn admit_with_trace(...)`. It is a real code path that returns the trace it already computes, not a switch.
- **CI job `stress-artifact`** (`workflow_dispatch`, `windows-latest`):
  - `cargo test --release -p fgos --test windows_predecessor_stress --no-run --message-format=json` → upload the test exe, `fgos.exe` (the test spawns its sibling through `CARGO_BIN_EXE_fgos`, a baked absolute path, so the README says to keep the two side by side and documents the `FGOS_STRESS_FGOS_BIN` override, read only by the test), and `README.txt` with the command;
  - then run once with `HL_STRESS_REPEATS=50`.

## Owned files

| Action | File |
|---|---|
| edit | `packages/holder-lock/rust/src/port.rs` (Windows `run_borrowed`, `borrowed_check_job`, `admit_with_trace` passthrough), `helper.rs` (`job-keeper`), `route.rs` (`borrow`, `cancel`, `--borrowed-check` on Windows), `borrow_vectors.rs` |
| edit | `packages/holder-lock/rust/src/predecessor.rs` (only `admit_with_trace`; P02 owns the rest and is merged first) |
| edit | `src/holder-lock/index.mjs`, `src/holder-lock/driver.mjs`, `src/runner/dispatch/adapters.mjs` (scrub line), `src/runner/provider-capacity.mjs` / `provider-credential-probe.mjs` (only if the kill call needs routing, see §5) |
| create | `apps/fgos/tests/{windows_borrow.rs,windows_predecessor_stress.rs}`, `test/holder-lock/windows-borrow.test.mjs` |
| edit | `.github/workflows/holder-lock-cross-platform.yml` (`stress-artifact`) |

## Tests

**Windows** (CI):
1. `run_borrowed(git commit)` with a hook that runs `sleep 30 &` and writes its winpid → it returns once the commit is done; the sleep is signaled (independent handle); the record is gone; the keeper has exited (no `fgos.exe` child left); `probe` after release → `Free`.
2. A hook running `fgos internal lock-fd --borrowed-check` → `borrower`. A sibling with the copied env → `not-in-job`.
3. Holder terminated mid-borrow, keeper alive → the next `acquire` terminates the job and admits only after every member is signaled. 50 repeats, 0 violations.
4. The keeper gets an invalid job name → no ack → `BorrowError::Spawn`, no process left, no record left.
5. **A Rust holder that outlives its lock** (red-team finding 1(c)):
   - a long-lived test process (with a child it spawned before the borrow) borrows, then releases;
   - the test then writes the borrow's record back in place, as a failed removal would leave it;
   - another process `acquire`s → `Acquired`;
   - the first process and its child are still **alive**.
6. Node `runBorrowed` sync → the same as test 1, with stdout/stderr captured.
7. Node `spawnHolding` through `runCredentialProbe(plan, { spawnFn: handle.spawnHolding })` with a fake provider CLI script → streams deliver data, `'close'` fires, `kill()` cancels a blocked child within 1 s.
8. `borrow_vectors::run(git, &HelperExe(CARGO_BIN_EXE_fgos))` → all green, sibling green.
9. `stress-artifact` with 50 repeats → 0 violations.

**Linux:** `cargo test -p fgos-holder-lock` and `node --test test/holder-lock` are green. The POSIX `run_borrowed` diff is limited to the `HelperExe` parameter.

**Windows proof:** ask `forgentx-95` to push and then dispatch `stress-artifact`; record both run ids and the artifact name.

## Acceptance
- Tests 1–9 are green on `windows-latest`.
- Linux and macOS are green.
- `rg "process.platform" src/holder-lock/index.mjs` is empty.
- The artifact is ready for P06.

## Risk / rollback
- **Suspend → assign window:** the child cannot run before it is resumed, so it cannot create children outside the job.
- **Service- or COM-created processes:** they escape the job, as r6 §5.3 names. The vectors use plain `sh`.
- **Rollback:** revert. Windows borrowing returns `BorrowError::Unsupported` and the facade throws `borrow-unsupported`: loud, with no fallback.
