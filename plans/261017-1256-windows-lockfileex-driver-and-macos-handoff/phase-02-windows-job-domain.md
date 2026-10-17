# Phase 02: the `windows-job` domain in `fgos-process` (two views)

- **Wave:** 1.
- **Branch:** `win-driver/p02-job-domain`, worktree `.claude/worktrees/wd-p02`.
- **Depends on:** P00.
- **Runs in parallel with:** P01.
- **Ownership:** this phase owns the domain functions that 6.2 P02 originally owned (plan D3). If the owner rejected D3, this phase's content moves to 6.2 P02.

## Read first
- plan.md D3, D4 and D5 (the two views), D6.
- The probe report, runs 2 and 3, and its review note about failing closed.
- The red-team report, findings 1, 6, 12, 14 and 16.
- Measured code in [`tools/platform-probe/src/windows.rs`](../../tools/platform-probe/src/windows.rs):
  - `Dom`, `refresh`, `job_pids`, `pid_in_job`, `domain_open`, `domain_active`, `domain_kill`;
  - `snapshot_procs`, `chain_from` (line ~453 skips a process with no creation time; line ~465 adds the live holder);
  - `fallback_wait` (two quiet snapshots).
- The current code:
  - [`packages/process/rust/src/lib.rs:38-102`](../../packages/process/rust/src/lib.rs);
  - [`packages/holder-lock/rust/src/predecessor.rs`](../../packages/holder-lock/rust/src/predecessor.rs).

## Requirements

**1. Shape (D4).**
- `Domain::WindowsJob(WindowsJob)`:
  ```rust
  pub struct WindowsJob {
      job: String,
      session_id: u32,
      declared_at: u64,
      holder: ProcTuple,
      keeper: Option<ProcTuple>,
  }
  ```
- `predecessor.rs` (`domain_json` and `parse_record`) reads and writes `{job, sessionId, declaredAt, holder: {host, pid, startTime}, keeper}`.
- A string `domainId` → `None` → `admit` answers `NotEmpty` with the raw record.

**2. `platform/windows_job.rs`** (`#[cfg(windows)]`).
- **Pure decision core**, which the tests drive with synthetic input:
  ```rust
  fn decide(acct: Option<u32>, members: &[MemberState], unopenable: &[u32], quiet_rounds: u32, job_open: bool) -> DomainState
  ```
- **`JobView`** (the job view):
  - holds the job handle;
  - polls `ActiveProcesses` plus `JobObjectBasicProcessIdList`, growing the buffer on `ERROR_MORE_DATA`; the buffer size is a parameter;
  - with `with_scan = true` (contenders only), also adds every Toolhelp process where `IsProcessInJob`;
  - tracks every member ever seen with a `SYNCHRONIZE` handle, checking the creation time against the snapshot;
  - `Empty` ⇔ `acct == 0` ∧ every tracked member is signaled ∧ no `unopenable` pid.
  - The holder and the keeper are never members of this view: they are not in the job.
- **`ContenderView`** (`admit` and `--predecessor-state`):
  - **Holder alive** (an `observe` of the holder tuple says `Live` with the same start time): use the job view with the scan. `kill_all` = `TerminateJobObject` only.
  - **Holder dead and the job opens:** the union of the job view with the scan and the **tree**. The tree is the set of processes reached by the parent chain from `holder.pid`, keeping only those whose creation time is ≥ `declared_at`, excluding the holder tuple and the keeper tuple. A process whose parent is a tree node but whose creation time cannot be read is **unopenable**. So is any named pid whose `OpenProcess(SYNCHRONIZE)` fails with anything but `ERROR_INVALID_PARAMETER` while it is still in the snapshot. Unopenable means `NotEmpty` while present. `kill_all` = `TerminateJobObject` + `signal_by_identity(Kill)` for tree members outside the job. It never touches the keeper or the holder.
  - **Job does not open:** the tree only, with the same rules. `Empty` requires two consecutive polls that are both quiet: no live tree member and no unopenable pid.
  - **`session_id != ProcessIdToSessionId(self)`:** always `NotEmpty`, reason `predecessor-other-session`. No fallback.
- **Job helpers for P04 and 6.2**, all `pub` and only defined here:
  - `create_kill_job(name)`: `KILL_ON_JOB_CLOSE`, no breakaway flags;
  - `open_job(name)`;
  - `job_name(prefix, lock_name)` → `Local\<prefix>-<sanitized lock name>-<pid>-<creation>-<counter>`. Sanitizing maps anything outside `[A-Za-z0-9._-]` to `_`.
  - `assign_and_resume(job, child: &std::process::Child)`: find the main thread of a child created with `CREATE_SUSPENDED` through `CreateToolhelp32Snapshot(TH32CS_SNAPTHREAD)` (the only thread of that pid), `OpenThread(THREAD_SUSPEND_RESUME)`, `AssignProcessToJobObject`, `ResumeThread`. Assign failure → `TerminateProcess` the suspended child and return the error.

**3. `lib.rs`**
- Add `pub fn domain_watch(domain: &Domain) -> DomainWatch`, with `is_empty(&mut self)` and `kill_all(&mut self)`:
  - Windows → `ContenderView` (one per watch, so member handles live across polls);
  - `LinuxGate` → the existing judge and signal;
  - `MacosTree` → `Unknown`/`Refused` (still 6.2).
- Add `pub fn job_view(name) -> Option<JobView>` (Windows) for the release rule and the keeper (P04).
- `domain_is_empty` and `domain_kill_all` stay, as one-shot wrappers over `domain_watch`.
- `predecessor::admit` uses one `domain_watch` per call.

## Owned files

| Action | File |
|---|---|
| edit | `packages/process/rust/src/lib.rs`, `packages/process/rust/src/platform/mod.rs` (module line) |
| create | `packages/process/rust/src/platform/windows_job.rs`, `packages/process/rust/tests/windows_job_domain.rs` |
| edit | `packages/holder-lock/rust/src/predecessor.rs` |
| create | `packages/holder-lock/rust/tests/predecessor_record_shape.rs` |

## Tests

**`decide` unit tests** (all platforms; pure):
1. The list omits a live member that the scan or the tree names → `NotEmpty`. This covers the run-2 event, which run 3 never reproduced.
2. `acct == 0` with an unsignaled member → `NotEmpty`.
3. An unopenable pid present → `NotEmpty`.
4. In the fallback, one quiet round → still `NotEmpty`; two → `Empty`.
5. List-buffer growth: the first call with a buffer of 2 and 5 members → retry → all 5 seen.

**`tests/windows_job_domain.rs`** (`#![cfg(windows)]`, real processes through the `HL_TEST_ROLE`-style re-exec of this test binary; no crate helper roles are needed, because the test plays holder and keeper itself). Every loop runs 50 repeats:

6. **Holder dead, second owner alive, member blocked:** `NotEmpty` until `kill_all`, then `Empty` within 2 s. At the first `Empty`, every member is signaled, checked through the test's own handles. 0 violations.
7. **All owners dead:** the fallback; `Empty` only after the chain is signaled. 0 violations.
8. **Dying job open:** the keeper lives 0–50 ms after the holder. 0 violations; report `jobOpened`.
9. **Holder alive, record left behind:** the holder process is alive with a live child that was created **before** `declaredAt`, plus an empty job. Result: `Empty`, and `kill_all` is never called on the holder or that child; both are still alive afterwards. This is red-team finding 1(c).
10. **Holder alive, job not empty** (a step-0 violation): `kill_all` terminates the job members only; the holder is alive afterwards.
11. **Stale record:** the job closed long ago and the holder pid has been reused (creation time differs) → `Empty` at once.
12. **Other session:** `session_id = self + 1` → `NotEmpty` with reason `predecessor-other-session`.
13. **Breakaway refused:** a member spawning with `CREATE_BREAKAWAY_FROM_JOB` fails, and its child is in the job.
14. **`assign_and_resume`:** a child created suspended is in the job before its first instruction; its own child is in the job too.

**`tests/predecessor_record_shape.rs`** (all platforms):
15. Round trip of the D4 shape; a string `domainId` → `NotEmpty` with the raw record.

**Linux:** existing tests are green. `cargo check` for the Windows and macOS targets is green.

**Windows proof:** ask `forgentx-95` to push `win-driver/p02-job-domain`, then record the run id. Report the extra wait p50/p95 next to probe run 3 (122/150 ms), and whether the CI runner's process runs inside a job.

## Acceptance
- Tests 1–15 are green on `windows-latest` with 0 violations.
- Linux and macOS are green.

## Risk / rollback
- **The tree rule differs from the probe (holder split, `declaredAt`, fail closed).** Tests 1–4 and 9–10 pin each difference, and P06's stress gate covers the races.
- **Rollback:** revert. `windows-job` goes back to `Unknown` → `NotEmpty`, which is fail-closed.
