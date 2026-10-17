# Phase 04: borrowing on Windows (`run_borrowed` in a named job)

- **Wave:** 3.
- **Branch:** `win-driver/p04-borrow`, worktree `.claude/worktrees/wd-p04`.
- **Depends on:** P01, P02, P03.

## Read first
- plan.md D2, D5, D6, D9, D12.
- r6 §6.0.1 steps 0–4 and §6.4 (the POSIX borrow and its rules: git gets `-c gc.auto=0 -c maintenance.auto=false`; the hook never runs in the background).
- [`port.rs`](../../packages/holder-lock/rust/src/port.rs): `run_borrowed` `:430`, `borrowed_check` `:560`, `borrowed_argv`.
- [`borrow_vectors.rs`](../../packages/holder-lock/rust/src/borrow_vectors.rs).
- [`index.mjs`](../../src/holder-lock/index.mjs): `runBorrowed`, `checkBorrowedDescription`.
- Probe [`git.rs`](../../tools/platform-probe/src/git.rs) and [`predecessor.rs`](../../tools/platform-probe/src/predecessor.rs) (the blocking-hook scenario, the keeper, the kill timings).

## Requirements

**1. `run_borrowed`, Windows half** (`port.rs`; the POSIX half is untouched)

1. Check that the handle is `Ex` and that the argv passes through `borrowed_argv` (git gets the gc flags).
2. Name the job `fgos-borrow-<lock name>-<128-bit token>` via `windows_job::unique_job_name`.
3. **Declare first:** `handle.declare_domain(Domain::WindowsJob { job, holder: own tuple })`. This happens before the job exists (r6 step 1).
4. Create the job with `create_kill_job(name)`.
5. **Second owner:** spawn `current_exe() --fgos-holder-lock-helper job-keeper --job <name> --holder-pid <self> --holder-start <self creation>`, detached from stdio and not in the job. Wait for its one-byte "opened" ack on stdout (bounded 2 s). No ack → terminate the keeper, close the job, return `BorrowError::Spawn`, and leave the record: an empty job and a dead keeper judge `Empty` next time.
6. **Spawn git suspended into the job:** `CREATE_SUSPENDED`, `AssignProcessToJobObject`, `ResumeThread`.
   - `std::process::Command` cannot create suspended processes, so use `CreateProcessW` directly. Build the command line with std's Windows quoting rules: reuse `std::os::windows::process::CommandExt::raw_arg` or `PROC_THREAD_ATTRIBUTE_JOB_LIST` (Windows 10+).
   - The executor picks one and records why; `PROC_THREAD_ATTRIBUTE_JOB_LIST` avoids the suspend/assign/resume window.
   - Env: the caller's env + `spec.env` + `FGOS_LOCK_JOB=<lock>:<job>`. `FGOS_LOCK_FD` is not set.
   - stdio as in `spec.stdio`, or the files that the `lock-hold` request names.
7. Wait for git to exit.
8. **Release rule step 0:**
   - `TerminateJobObject` for whatever is left;
   - `domain_watch(...).is_empty()` polled until `Empty`, bounded by `kill_wait`;
   - past the bound → `BorrowError::LeftoverNotKilled { pids }`.
9. **Close our job handle.** The keeper sees `Empty` and exits. Remove the predecessor record: we are still the holder, and the domain is empty.
10. `BorrowOutcome { exit, signal: None, leftovers_killed }`.

**2. `job-keeper` helper role** (`helper.rs`)
- Open the job by name, write `K` to stdout, flush.
- Loop every 5 ms: `windows_job` `is_empty` on its own `JobView`, built with the holder tuple from argv.
- On `Empty` → exit 0.
- It never exits on parent death or stdin EOF (D6).
- If it cannot open the job at start → exit 1 without ack.

**3. `borrowed_check`, Windows half (D2)**
- Signature: add `#[cfg(windows)] pub fn borrowed_check_job(lock_path, fgos_lock_job: Option<&str>) -> BorrowedCheck`.
- All of these must hold:
  - (a) the env parses to `<lock>:<job>`;
  - (b) `predecessor.json` next to the lock parses to `WindowsJob { job == env job, holder }`;
  - (c) `IsProcessInJob(GetCurrentProcess(), open_job(job))`;
  - (d) `holder` (pid + creation time) is in this process's Toolhelp ancestor chain;
  - (e) `probe(resource) == Held`.
- New `NotBorrowerReason` names: `job-missing`, `record-mismatch`, `not-in-job`, `holder-not-ancestor`, `lock-not-held` (contract P00; append if missing).
- Route `lock-fd --borrowed-check <path>` on Windows calls this. There is no slot to take.

**4. `lock-hold` `op: borrow`** (`route.rs`)
- Run `run_borrowed` on the held handle with the request's spec.
- git's stdout and stderr go to the request's files (Node reads them afterwards; output size bounded as in the facade's `MAX_OUTPUT_BYTES`).
- Write `resultFile` (tmp + rename).
- One borrow at a time. A second request while one is in flight → error `borrow-busy`.

**5. Node `runBorrowed` and `checkBorrowedDescription`, transport `hold`** (`index.mjs` + `driver.mjs`)

- `runBorrowed`:
  - write the request line to `entry.child.stdin` with `fs.writeSync` on the pipe's fd (sync), or `child.stdin.write` (async mode);
  - wait for `resultFile` with `Atomics.wait` polling (sync) or `setTimeout` (async), bounded by `spec.timeoutMs ?? none` plus kill wait;
  - read the stdout and stderr files, delete the three files;
  - return the same shape as POSIX (`{exit, signal: null, stdout, stderr, leftoversKilled}`);
  - map errors to the same named `HolderLockError`s.
- `checkBorrowedDescription` on Windows: run `lock-fd --borrowed-check <lockPath>` with `FGOS_LOCK_JOB` from env.
- The main-checkout git hook already calls this function. Check with `rg checkBorrowedDescription src scripts` and confirm each caller passes env through.
- Scrub: `workerBaseEnv` ([`adapters.mjs:99-109`](../../src/runner/dispatch/adapters.mjs)) also drops `FGOS_LOCK_JOB`. This is a one-line edit; this phase owns that line only.

**6. Borrow vectors on Windows** (`borrow_vectors.rs`)
- The same four vectors and the sibling check. Each vector creates the background process the POSIX vector creates, through Git for Windows' `sh`:
  - an alias `!sh -c 'sleep 30 &'`;
  - a clean filter that starts `sleep 30 &`;
  - a post-commit hook `sleep 30 &`;
  - `gc.auto=1` with loose objects (the borrow API disables auto gc; the vector proves no gc process outlives the borrow).
- Windows assertion: when `run_borrowed` returns, the background `sleep` is signaled; it was in the job and the release rule ended it. `probe` right after release → `Free`.
- **Sibling:** a process with `FGOS_LOCK_JOB` copied into its env but spawned outside the job (by the test, not through `run_borrowed`) → `borrowed_check_job` gives `NotBorrower(not-in-job)`.
- No `sh` (git without Git for Windows' `sh`) → the vectors that need it report `RunError::Unavailable("sh not found next to git")`. That is red at the gate, as `git` missing is today.

**7. Stress test (acceptance gate, D12)** — `packages/holder-lock/rust/tests/windows_predecessor_stress.rs`, `#![cfg(windows)]`, every test `#[ignore]`. Repeats come from `HL_STRESS_REPEATS` (default 500), read only in this test file. Scenarios, the same as probe v3 but through the driver's real code (`run_borrowed`, `acquire`, the keeper role):
- **`all-owners-dead`:** a holder process borrows, and git blocks in a pre-commit hook (waits on a named event). The test kills the holder and the keeper. A contender process `acquire(Wait)`s. Violation = the contender is admitted while any process ever in the job is unsignaled (the test opens `SYNCHRONIZE` handles to the hook and git pids as soon as they report themselves through a pipe).
- **`dying-job-open`:** as above, but the keeper's death is delayed 0–50 ms after the holder's. A test-only keeper wrapper sleeps before exiting; the production keeper has no delay switch.
- **`borrow-hook-predecessor-check`:** the holder alone is killed while git is blocked; the keeper stays.
- Output: a JSON report per scenario: repeats, violations, `jobOpened` count, extra wait p50/p95/max, and per violation the sources that named each live pid. Write it to `HL_STRESS_OUT` (default `%TEMP%\fgos-holder-lock-stress.json`).
- **CI job `stress-artifact`** in `holder-lock-cross-platform.yml`, `workflow_dispatch` only:
  - `windows-latest`: `cargo test --release -p fgos-holder-lock --test windows_predecessor_stress --no-run`;
  - upload the test exe (path from `--message-format=json`) plus a `README.txt` with the run command: `<exe> --ignored --test-threads=1`;
  - also run it once with `HL_STRESS_REPEATS=50` so CI shows the path works.

## Owned files

| Action | File |
|---|---|
| edit | `packages/holder-lock/rust/src/port.rs` (Windows `run_borrowed`, `borrowed_check_job`), `helper.rs` (`job-keeper`), `route.rs` (`op: borrow`, `--borrowed-check` on Windows), `borrow_vectors.rs` |
| edit | `src/holder-lock/index.mjs`, `src/holder-lock/driver.mjs`, `src/runner/dispatch/adapters.mjs` (scrub line) |
| create | `packages/holder-lock/rust/tests/{windows_borrow.rs,windows_predecessor_stress.rs}`, `test/holder-lock/windows-borrow.test.mjs` |
| edit | `.github/workflows/holder-lock-cross-platform.yml` (the `stress-artifact` job) |

## Tests

**Windows (CI):**
1. `run_borrowed(git commit)` with a hook that runs `sleep 30 &` → it returns once the commit finishes; `leftovers_killed ≥ 1`; the `sleep` pid is signaled; the record is gone; `probe` after release → `Free`.
2. The hook calls `fgos internal lock-fd --borrowed-check` → `borrower`. A sibling with the copied env → `not-in-job`.
3. The holder is killed mid-borrow, and the keeper stays → the next `acquire` terminates the job and admits only after git is signaled (50 repeats, 0 violations).
4. The keeper's ack times out (the keeper role is given a bad job name by a test-only call of the role) → `BorrowError::Spawn`, nothing left running.
5. Node `runBorrowed` sync and async through `lock-hold` → same results as test 1; stdout and stderr are captured.
6. `borrow_vectors::run(git)` → all green, sibling green.
7. The `stress-artifact` job, 50 repeats per scenario, 0 violations.

**Linux:** `cargo test -p fgos-holder-lock` and `node --test test/holder-lock` stay green; the POSIX `run_borrowed` is unchanged (`git diff` of the POSIX half is empty except imports).

**Windows proof:** push request to `forgentx-95`; record the run ids of the push run and the dispatched `stress-artifact` run; attach the artifact name.

## Acceptance
- Tests 1–7 are green on `windows-latest`.
- Linux and macOS are green.
- The artifact exists and is ready for the owner (P06).

## Risk / rollback
- **`PROC_THREAD_ATTRIBUTE_JOB_LIST` vs suspend/assign/resume:** both are correct. Suspend leaves a process outside the job until it is assigned, but it cannot run, so it cannot create children.
- **Git for Windows `sh` spawning outside the job through a service:** r6 names service/COM-created processes as the escape. The vectors use plain `sh`.
- **Rollback:** revert. Windows borrowing returns `BorrowError::Unsupported`, and the facade throws `borrow-unsupported`; that fails loudly, with no silent fallback.
