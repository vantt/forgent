# Phase 02: the `windows-job` domain in `fgos-process` (union rule)

- **Wave:** 1.
- **Branch:** `win-driver/p02-job-domain`, worktree `.claude/worktrees/wd-p02`.
- **Depends on:** P00.
- **Runs in parallel with:** P01.
- **Ownership:** this phase owns the domain functions that 6.2 P02 originally owned (plan D3; see the amendment in 6.2 phase-02).

## Read first
- plan.md D3, D4, D5.
- The probe report, runs 2 and 3, and the review note about fail-closed.
- Measured code, [`tools/platform-probe/src/windows.rs`](../../tools/platform-probe/src/windows.rs):
  - `Dom`, `refresh`, `job_pids`, `pid_in_job`, `domain_open`, `domain_active`, `domain_kill`;
  - `snapshot_procs`, `chain_from` (the Toolhelp parent chain by pid + creation time).
- [`predecessor.rs`](../../tools/platform-probe/src/predecessor.rs) `enter` (the contender loop).
- The current code:
  - [`packages/process/rust/src/lib.rs:38-102`](../../packages/process/rust/src/lib.rs) (`Domain`, `domain_is_empty`, `domain_kill_all`);
  - [`packages/holder-lock/rust/src/predecessor.rs`](../../packages/holder-lock/rust/src/predecessor.rs) (`domain_json`, `parse_record`, `admit`).

## Requirements

**1. Domain shape (D4)**
- `Domain::WindowsJob(WindowsJob)` with `pub struct WindowsJob { pub job: String, pub holder: ProcTuple }`.
- The holder tuple uses the Windows `observe` facts: `start_time` = the creation FILETIME as a decimal string, as `platform/windows.rs` already does.
- `predecessor.rs`: `domain_json` and `parse_record` read and write `{job, holder: {host, pid, startTime}}`.
- A string `domainId` (the old shape) parses to `None`, so `admit` answers `NotEmpty` with the raw record (unknown shape stays fail-closed).

**2. `platform/windows_job.rs`** (`#[cfg(windows)]`), ported from the probe with the driver changes:
- **`struct JobView`:**
  - the job handle, opened with `JOB_OBJECT_QUERY | JOB_OBJECT_TERMINATE | SYNCHRONIZE`;
  - the holder tuple;
  - members: `pid`, `SYNCHRONIZE` handle, creation time.
- **`refresh()`:**
  - union = `job_pids` ∪ {Toolhelp processes where `IsProcessInJob`} ∪ `chain_from(holder pid, holder creation)`;
  - for every pid not yet tracked, `OpenProcess(SYNCHRONIZE | PROCESS_QUERY_LIMITED_INFORMATION)`;
  - check its creation time against the snapshot entry, to guard against pid reuse.
- **Fail closed (D5):** when `OpenProcess` fails with anything but `ERROR_INVALID_PARAMETER` (pid gone), **and** the pid is still in the current Toolhelp snapshot with the same parent chain:
  - record it as `unopenable`;
  - `is_empty` stays `NotEmpty` while it is in the snapshot.
- **`JobObjectBasicProcessIdList` buffer:** grow and retry on `ERROR_MORE_DATA`. The probe used a fixed 1024 entries.
- **`is_empty(view)`:** `refresh`, then `ActiveProcesses == 0` **and** every tracked member is signaled (`WaitForSingleObject(h, 0) == WAIT_OBJECT_0`) **and** no `unopenable` pid is left.
- **Fallback when `OpenJobObjectW` fails:**
  - the view keeps no job handle; the union is the holder tree only;
  - the same signaled and fail-closed rules apply;
  - the holder process itself counts only when its creation time matches.
- **`kill_all(view)`:**
  - `refresh`;
  - `TerminateJobObject(job, 1)` when the job is open;
  - plus `signal_by_identity(Kill)` for every tracked member that is not in the job (the fallback path, or tree members outside it);
  - `Refused` only when `TerminateJobObject` fails for a reason other than "already gone".

**3. `lib.rs`**
- `domain_is_empty` and `domain_kill_all` route `Domain::WindowsJob` to `platform::windows_job` on `cfg(windows)`. Elsewhere it stays `Unknown`/`Refused`.
- The admit loop (`holder-lock` `predecessor::admit`) polls every 500 µs. For Windows, keep **one** `JobView` across the polls, so members first seen early keep their handles; a pid closed and reused can then never pass as signaled.
- That needs a stateful API: add `pub fn domain_watch(domain) -> DomainWatch` with `is_empty(&mut self)` and `kill_all(&mut self)`. For `LinuxGate` it wraps the existing functions; for `MacosTree` it stays `Unknown`/`Refused`.
- `predecessor::admit` moves to `domain_watch` (one watch per `admit` call). The stateless functions stay as thin wrappers, because 6.2 uses them.

**4. Creation helpers for P04 and 6.2** (`pub`, `#[cfg(windows)]`):
- `create_kill_job(name) -> io::Result<OwnedJob>`: `KILL_ON_JOB_CLOSE`, no `BREAKAWAY_OK`/`SILENT_BREAKAWAY_OK`.
- `OwnedJob::assign_suspended_and_resume(child)`.
- `open_job(name)`.
- `unique_job_name(prefix)`: prefix + 128-bit random token from `BCryptGenRandom`, or from `getrandom` if it is already in the tree.
- These are the only job-creating calls in the repository, so 6.2 P02's `containment::windows::create` calls them.

## Owned files

| Action | File |
|---|---|
| edit | `packages/process/rust/src/lib.rs`, `packages/process/rust/src/platform/mod.rs` (module line) |
| create | `packages/process/rust/src/platform/windows_job.rs`, `packages/process/rust/tests/windows_job_domain.rs` |
| edit | `packages/holder-lock/rust/src/predecessor.rs` (record shape + `admit` via `domain_watch`) |
| edit | `packages/holder-lock/rust/tests/*` only where a `Domain::WindowsJob(String)` literal must change |

## Tests

`tests/windows_job_domain.rs`, `#![cfg(windows)]`, real processes (re-exec pattern), each loop 50 repeats in CI:

1. **Second owner alive, holder killed, member blocked:**
   - a test "keeper" process holds the job;
   - the holder (in the test, the parent of the member chain) is terminated;
   - `is_empty` is `NotEmpty` until `kill_all`, then `Empty` within 2 s.
   - Assert, at the moment `Empty` is first returned, that every recorded member pid is signaled (checked through handles opened by the test itself before the kill). 0 violations.
2. **All owners dead:**
   - keeper and holder are both terminated while a member is blocked;
   - `open_job` fails → fallback;
   - `Empty` only after the member chain is signaled. 0 violations in 50.
3. **Dying job open** (the run 3 scenario): the keeper lives 0–50 ms (random) after the holder dies. 0 violations in 50; report how many repeats opened the job.
4. **Fail closed:** a live process in the holder tree that the test makes unopenable is a run-time condition the test cannot force on a CI runner. Unit-test the decision function instead: `fn decide(acct, members, unopenable) -> DomainState` (pure). An unopenable pid present in the snapshot → `NotEmpty`. A real-process test is not possible without a second user; say so in the report.
5. **Stale record:** a job closed long ago and a holder tuple whose pid is reused by another process (creation time differs) → `Empty` at once.
6. **Breakaway refused:** a member spawning with `CREATE_BREAKAWAY_FROM_JOB` fails, and its child is in the job.
7. **`JobObjectBasicProcessIdList` growth:** more than 1024 members is not feasible in CI. Unit-test the buffer loop by injecting `ERROR_MORE_DATA` through a small first buffer: the function takes the buffer size as a parameter, and production passes the default.
8. **Record round-trip:** `domain_json(parse_record(x)) == x` for the new shape; the old string shape → `parse_record` gives `None` → `admit` gives `NotEmpty` with the raw record. Runs on all platforms.

Linux: the existing `fgos-process` and `fgos-holder-lock` tests are green; `cargo check` for the Windows and macOS targets is green.

**Windows proof:** ask `forgentx-95` to push `win-driver/p02-job-domain` (the workflow runs on push), then record the run id.

## Acceptance
- Tests 1–8 are green on `windows-latest`, with 0 violations in every loop. Report the extra-wait p50/p95 next to the probe's run 3 (122/150 ms).
- Linux and macOS are green.

## Risk / rollback
- **The probe's `Dom` skipped unopenable pids.** The driver's fail-closed rule could turn a protected system process that happens to be in the holder's tree into a permanent `NotEmpty`. The holder tree only holds processes descended from the recorded holder (`chain_from` with creation-time checks), which are fgOS-spawned. Any `predecessor-domain-not-empty` names the pid, and `lock-holders` shows it.
- **Rollback:** revert. `admit` goes back to `Unknown` → `NotEmpty` for `windows-job`, which is fail-closed.
