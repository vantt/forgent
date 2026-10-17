# Red-team: plan 4.4b Windows LockFileEx driver (plans/261017-1256-…)

Scope: plan.md and phase-00..06, plus the amendment block in 6.2 phase-02. I only read and grepped; nothing was built or run. Checked against r6 §5.3, §6.0, §6.0.1, §6.1.1, §6.1.2, §6.3, §6.4, the probe report (runs 1–3), `tools/platform-probe/src/{windows,predecessor}.rs` and the current crate and Node code on `ef8a77566`.

## Findings

### 1. Critical: the holder-tree source puts the live holder and the keeper inside its own domain
- **Evidence:**
  - The probe's `chain_from` adds the holder itself when its creation time matches (`tools/platform-probe/src/windows.rs` ~l.465: `if procs.iter().any(|p| p.pid == holder_pid && p.created == Some(holder_created)) { out.push(holder_pid) }`). It also adds every descendant of the holder, which includes the keeper, because D6 says the locking process spawns it.
  - The probe only called this on a holder that was already dead. The plan calls it in three places where the holder is alive:
    - **(a) Release rule.** P04 step 8 polls `domain_watch(...).is_empty()` until `Empty`. The record's holder is `self`, so it is alive and in the tree, and the keeper is alive too. `Empty` never comes, and every Windows borrow ends in `LeftoverNotKilled` after `kill_wait`.
    - **(b) Keeper exit.** P04 §2 builds the keeper's `JobView` with the holder tuple. The holder and the keeper are both in it, so the keeper never exits on its own and one keeper leaks per borrow. The risk table rates this "Low × Low"; in fact it happens on every borrow.
    - **(c) Contender.** P02 `kill_all` calls `signal_by_identity(Kill)` on "tree members not in the job", and the fallback counts "the holder process itself … when its creation time matches". So any record left behind makes the next acquirer kill a holder that is alive and already released the lock, together with all its descendants.
  - Ways a record gets left behind:
    - P04 step 5 "leave the record";
    - `remove_record` ignores errors (`packages/holder-lock/rust/src/predecessor.rs:100-104`), and on Windows a delete can fail on a transient AV sharing violation.
  - Who gets hurt: on the Node path the holder is the `lock-hold` helper, which exits anyway. Rust in-process holders outlive the lock: `fgctl` running the vectors, and the 6.2 supervisor that D6 names explicitly. For the supervisor, its whole process tree would be killed, including agents in other domains.
- **Fix:**
  - Define the tree source in D5/P00 as: descendants of the recorded holder that were **created at or after the record's declare time**, and **excluding** the holder itself and the keeper. Record the keeper's pid and creation time in the record after its ack.
  - Use the tree source only when the recorded holder is dead (the case the probe measured). A live recorded holder means a normal release, so judge with the job-only view: count, list and scan.
  - The release rule (step 0) and the keeper use the job-only view.
  - Add a test: a Rust holder borrows, then releases with the record deliberately left in place. A second acquire must not kill the first process.

### 2. High: the keeper's exit rule is wrong either way
- **Evidence:** D6 and P04 §2 say: spawned "before the job gets any member", it loops `is_empty` every 5 ms and exits on `Empty`.
  - With finding 1 fixed: before git is assigned, `ActiveProcesses == 0` and every source is empty, so the keeper exits at once and the second owner is gone exactly when it is needed.
  - Without the fix: it never exits.
- **Fix:** the keeper exits only when **both** hold:
  - the holder has said "borrow finished" (stdin line or EOF) **or** the holder's `SYNCHRONIZE` handle is signaled;
  - **and** the job-only view is empty, having seen at least one member or the holder's "finished" message.
  - Polling every 5 ms takes a full Toolhelp snapshot plus `OpenProcess`/`IsProcessInJob` for every process on the system. Drop the snapshot from the keeper, or poll every 50 ms. The keeper does not decide admission.

### 3. High: Node async `runBorrowed` on Windows breaks the `spawnHolding` contract
- **Evidence:**
  - `provider-capacity.mjs:419` documents `spawnHolding` as "`spawn`'s signature and ChildProcess", built on `runBorrowed(..., { sync: false })`.
  - `provider-credential-probe.mjs:109-129` uses `child.stdout.on`, `child.on('close'|'error')`, `child.pid` and `process.kill(-child.pid)`.
  - P04 §5 returns `{exit, signal, stdout, stderr, leftoversKilled}` after polling a result file.
  - Result: provider credential probe and renewal break on Windows, which is the `fgos run` path the plan claims to unblock.
  - There is also no way to cancel a borrow: on a timeout the caller cannot reach the job, because the helper owns it.
- **Fix:**
  - In async mode, return an `EventEmitter`/ChildProcess-shaped object. It needs `pid` (git's), `stdout`/`stderr` streams that tail the files or come from a named pipe, `'exit'`/`'close'`/`'error'` events, `kill()`, and `borrowed`.
  - Add a `lock-hold` request `{op: "cancel"}` that runs `TerminateJobObject`.
  - Add `test/holder-lock/windows-borrow.test.mjs` coverage through `runCredentialProbe(plan, { spawnFn: handle.spawnHolding })`.

### 4. High: sync release and sync borrow need the event loop, which `Atomics.wait` blocks
- **Evidence:**
  - P03 release: `child.stdin.end()` is described as a "sync close of the pipe fd". In Node, `end()` on a child pipe queues a libuv shutdown that runs only when the loop turns, and the loop never turns while the code spins in `Atomics.wait`. So the helper never sees EOF. Every sync `release()` waits `killWaitMs + ROUTE_SLACK_MS` (3 s by default), then `TerminateProcess`es the helper.
  - P04 §5 says to write the request "with `fs.writeSync` on the pipe's fd". On Windows a ChildProcess stdin is a libuv named-pipe handle with no CRT fd, so `fs.writeSync` has nothing to write to.
- **Fix:**
  - Release: `release()` already refuses while `borrows > 0` (`index.mjs:85`), so the domain is empty at release. Make release = `child.kill()` (`TerminateProcess`; the lock is freed 0.1 ms later, r6 §12.10) plus a bounded wait for exit.
  - Borrow requests: pass them through a request file plus a named event, or have the helper poll a request directory. Do not depend on stdin writes from sync code.
  - Keep stdin EOF only as a parent-death signal.

### 5. High: self re-exec through `current_exe()` cannot work inside cargo test binaries, so most Windows tests and the stress gate cannot test what they claim
- **Evidence:**
  - D9 and P01 have production code spawn `current_exe() --fgos-holder-lock-helper probe-holder|job-keeper`.
  - In `tests/*.rs` (libtest harness), `current_exe()` is the test binary, which rejects unknown options (exit 101) and never calls `run_if_requested()`.
  - Affected:
    - P01 test 7;
    - all P04 tests (`run_borrowed` spawns the keeper);
    - P05 "`holder_lock_gate(tmp,…)` → Passed" on Windows in `fgos-distribution`;
    - the stress test.
  - P04 §7 then needs "a test-only keeper wrapper", which contradicts "through the driver's real code (…, the keeper role)".
- **Fix:**
  - Put the Windows tests that need roles under `apps/fgos/tests/`, where `CARGO_BIN_EXE_fgos` exists, or declare those test targets `harness = false` with a `main` that calls `helper::run_if_requested()` first.
  - In the stress test, run the **shipped** path as the holder: `fgos.exe internal lock-hold` plus `op: borrow`.
  - For `dying-job-open`, the test kills the real keeper itself after a random delay. It can find the keeper pid via Toolhelp as a child of the holder, so no wrapper is needed.

### 6. High: must-have #2 (fail closed) cannot fire in the tree or fallback path, and the fallback is not "exactly probe v3"
- **Evidence:**
  - `chain_from` skips any process whose creation time could not be read (`windows.rs` ~l.453: `let Some(created) = p.created else { continue };`). `snapshot_procs` reads that time through the same `OpenProcess` that fails for an unopenable pid. The scan source can only name processes it opened. So only the job-list source can ever name an unopenable pid.
  - The fallback path, used in 499 of 500 all-owners-dead repeats, therefore never fails closed.
  - The probe's fallback (`fallback_wait`) required **two clean snapshots in a row**. P02's fallback uses a single read, yet D5 and the risk table say "D5 is exactly probe v3".
- **Fix:**
  - In the driver's tree walk, a process whose `ppid` is a known tree node but whose creation time is unreadable is a tree member that cannot be opened. It counts as not empty while present.
  - Keep the two-consecutive-quiet-snapshots rule.
  - Correct the "exactly probe v3" claim.

### 7. High: the CI step hides Node test failures
- **Evidence:** P01's CI guard is ``ls test/holder-lock/windows-*.test.mjs >/dev/null 2>&1 && node --test ... || echo "no Windows facade tests yet"``. When `node --test` fails, the `|| echo` runs and the step exits 0. The repo rule is that failing tests are never hidden.
- **Fix:** `if compgen -G 'test/holder-lock/windows-*.test.mjs' >/dev/null; then node --test test/holder-lock/windows-*.test.mjs; else echo "no Windows facade tests yet"; fi`.

### 8. Medium: libuv's global job changes the Node helper's lifecycle, and the plan does not account for it
- **Evidence:**
  - On Windows, libuv puts every non-detached child into one process-wide job with `KILL_ON_JOB_CLOSE | SILENT_BREAKAWAY_OK`. When Node exits, the `lock-hold` helper is therefore terminated, and does not run "release rule, then exit" (D7).
  - P03 test 1 ("helper sees the parent die") passes through that termination, so it does not prove the parent-handle path.
  - A held helper also keeps Node's event loop alive (ref'd process and stdin pipe). A CLI that relies on exit to release a lock would hang where POSIX exits.
- **Fix:**
  - State the libuv job in D7.
  - `child.unref()` and unref the stdin socket.
  - Test the parent-handle path with a parent that is not a libuv child (a Rust test parent), or drop it as dead code. With `SILENT_BREAKAWAY_OK`, the keeper and git are outside the libuv job, so the borrow crash path stays correct.

### 9. Medium: parent death in the middle of a borrow is unbounded
- **Evidence:** P03 step 5 says "a borrow in flight finish[es] its own release rule first, bounded by kill wait". The release rule starts after git exits, and git can block in a hook indefinitely, so the helper holds the lock after its owner died.
- **Fix:** on parent death or stdin EOF with a borrow in flight, `TerminateJobObject` at once, then wait for the job-only empty view up to `kill_wait`, then unlock and exit.

### 10. Medium: the process-creation guidance in P04 step 6 is inaccurate
- **Evidence:**
  - "`std::process::Command` cannot create suspended processes" is false: `CommandExt::creation_flags(CREATE_SUSPENDED)` exists. What std does not expose is the main thread handle.
  - "Reuse `CommandExt::raw_arg`" does not help a hand-rolled `CreateProcessW` command line.
  - A hand-rolled `CreateProcessW` with `bInheritHandles=TRUE` leaks every inheritable handle in the helper into git and its background children. That includes Node's stdio pipes, which then stay open while leftovers live.
- **Fix:** pick one of these and state it:
  - std `Command` + `creation_flags(CREATE_SUSPENDED)`, then a Toolhelp `TH32CS_SNAPTHREAD` lookup → `OpenThread(THREAD_SUSPEND_RESUME)` → assign → `ResumeThread`;
  - or `CreateProcessW` with `PROC_THREAD_ATTRIBUTE_JOB_LIST` **and** `PROC_THREAD_ATTRIBUTE_HANDLE_LIST`, plus a quoting function tested against std's rules (`argv` containing quotes, spaces and trailing backslashes).

### 11. Medium: D8's "explicit unlock" covers only `Handle::drop`
- **Evidence:** a locked raw `File` is still dropped without `UnlockFileEx` in several places:
  - `port::acquire` on the `same_file` mismatch and on `admit → NotEmpty` (`port.rs:443-453`);
  - `port::probe` after a successful `Sh` lock (`port.rs:655-659`);
  - `borrowed_check`'s try-lock;
  - `semantics::probe_at`.
  - D8 itself cites MS docs that unlock-on-close timing "depends upon available system resources". A lingering `Sh` from `probe` gives a contender a spurious `Held` on `Wait::Try`.
- **Fix:** a small `Locked<'a>(&File)` guard whose drop calls `before_close`, used by every successful `try_lock` in the port.

### 12. Medium: the stress gate is weaker than stated
- **Evidence:**
  - **(a)** `jobOpened ≥ 450` is tuned to the probe's contender loop. The driver's `lock_until` backs off up to 10 ms (`port.rs:358-371`), so with a keeper lifetime of 0–50 ms the contender misses the job more often. The gate can then fail on a sanity number rather than on safety.
  - **(b)** The event the union rule exists for (the list omitting a live member) happened 1 in 200 in run 2 and 0 times in run 3 ("git was in the list in 493 of 495"). So 0/500 does not show the union rule works; it may only show the race did not occur.
  - **(c)** As planned, the gate runs a test exe, not the `fgos.exe` `lock-hold` path that production uses (finding 5).
- **Fix:**
  - Contender polling in the stress test uses the production `acquire(Wait)`; derive the threshold from a dry run, or make the keeper's delay relative to the measured lock-wait.
  - Add a pure, deterministic unit test of the union decision with synthetic "list omits a live member that scan/tree name" input.
  - Keep per-source attribution in the JSON and report `namedByOneSourceOnly`.

### 13. Medium: the Windows borrow vectors risk becoming phantom tests
- **Evidence:**
  - Background processes never hold a `LockFileEx` lock, so `probe == Free` after release (the current pass criterion, `borrow_vectors.rs` `vector()`) is trivially true on Windows.
  - "The background `sleep` is signaled" needs the sleep's **Windows** pid. MSYS `$!` is an MSYS pid (the Windows pid is `/proc/$!/winpid`).
  - If the check reuses `run_borrowed`'s own empty rule, it is circular.
  - "sh not found next to git" fails the standard Git for Windows layout (`cmd\git.exe`, `usr\bin\sh.exe`).
- **Fix:**
  - The background command writes `$(cat /proc/$!/winpid)` to a file. The vector opens a `SYNCHRONIZE` handle to that pid itself and asserts it is signaled when `run_borrowed` returns.
  - Detect sh by running the alias and naming the failure; do not probe a path.

### 14. Medium: the job namespace is unspecified
- **Evidence:**
  - `fgos-borrow-<lock name>-<token>` has no `Local\` prefix (the probe used `Local\fgos-probe-…`), and lock names are not sanitized (`\` is invalid in object names).
  - A contender in another logon session (SSH, scheduled task, a service-hosted gateway) cannot open a `Local\` job. It then falls into the fallback (finding 6), and a borrower check across sessions fails (c).
- **Fix:**
  - Spell out `Local\` and sanitize the lock name.
  - Record the session id in the record.
  - When the contender's session differs from the record's, return `NotEmpty`/`Unknown` (fail closed) rather than the fallback.

### 15. Medium: phase acceptance and file-ownership conflicts
- **Evidence:**
  - P03's acceptance says `rg "process.platform" src/holder-lock/index.mjs` is empty, but `index.mjs:359,373,422` (the borrow sweep) is runBorrowed code that P04 rewrites, so P03 cannot meet it.
  - P01 says it makes `tests/common/mod.rs` portable, but the file is not in P01's owned table.
  - P02 (wave 1, parallel with P01) also edits `packages/holder-lock/rust/tests/*`, so the "disjoint crates" claim is wrong for tests.
- **Fix:**
  - Move that acceptance line to P04.
  - Give `tests/common/mod.rs` to P01, and have P02 touch only the named test files.

### 16. Medium: the record shape differs across documents
- **Evidence:** the holder tuple is written three ways:
  - plan D4 and the P00 contract: `holder: {pid, startTime}`;
  - P02: `{host, pid, startTime}`;
  - the 6.2 amendment: `{host, …}`.
  - `signal_by_identity` compares `host` and `pid_ns` (`control.rs:104-107`), so the tuple needs `host`, and `pidNs` is `none`.
- **Fix:** one shape everywhere, `{host, pid, startTime}` plus the keeper tuple (finding 1), asserted in P00's contract test.

### 17. Medium: D3 overrides a settled owner decision
- **Evidence:**
  - 6.2 plan.md, open question 1 is marked "Đã chốt 2026-10-16" (settled), and D6 cites the owner's brief.
  - The plan presents D3 as an open question, which is correct. But the amendment block is already committed into 6.2's phase file before confirmation.
  - If the owner says no, the rejection path makes a cycle: 4.4b `blocks` 6.2, while P04 "waits for 6.2 P02 to reach main".
  - The amendment also says it removes `platform/windows.rs` (domain part) from 6.2's table, but the domain lives in the new `windows_job.rs`.
- **Fix:**
  - Keep the amendment off the integration path until confirmed. P00 item 8 already gates it; also say "do not merge to main unconfirmed".
  - For "no", add an explicit exception: 6.2 P02 may land alone before the rest of 6.2.
  - Fix the file name in the amendment.

### 18. Low: smaller points
1. **File identity on ReFS.** `file_key` via `GetFileInformationByHandle` uses a 64-bit index that is not unique on ReFS / Dev Drive. Use `GetFileInformationByHandleEx(FileIdInfo)` (128-bit) and hash it to the `(u64,u64)` key, or widen the type.
2. **Token and missing feature.** `BCryptGenRandom` needs the `Win32_Security_Cryptography` feature, which is missing from P00's list, and `getrandom` is not in `Cargo.lock`. The job name is written in the record and the env, so it is not a secret; the authority is (c)+(d). "Acts as the one-time token" (D2) is decoration. Pid + creation time + a counter makes the name unique (YAGNI).
3. **`ERROR_IO_PENDING`.** P01 maps it to `WouldBlock`. With a stack `OVERLAPPED`, a pending completion would write into freed stack. It cannot happen on a synchronous handle, so treat it as `Err`.
4. **Hidden selector.** `--fgos-holder-lock-helper` as a leading dash token contradicts the R1 rule in `apps/fgos/src/main.rs` (comment above the selector match). Use `fgos internal holder-lock-helper <role>`, which is already dispatched first. `fgctl` needs its own hidden verb.
5. **Windows activation bootstrap.** After 4.4a, the installed `fgctl` refuses on Windows (4.4a D5). P06 C4 must first install the new `fgctl.exe` (`install.ps1`), then run `upgrade`.
6. **`process.kill(pid, 0)` and pid reuse.** Once libuv has closed the exited child's handle (async path), a reused pid reads as alive, which leads to a false `lock-release-stuck`. Prefer `child.exitCode`/`'exit'`, or `kill()` as in finding 4.
7. **Undrained stderr.** In sync mode the helper's stderr `'pipe'` is never drained. Use `'ignore'` or a file.
8. **Unstated deviations.** D1 (`exclusion: kernel`) departs from the 4.4a P06 handoff ("báo `job-scoped` trên Windows") without saying so. D1 also says `holders: unsupported` while D10 says "unlistable"; pick one name.
9. **Linux scope creep.** P05 replaces the Node `judge()` for `linux-gate` records with one route spawn per record. That is a Linux change outside the Windows scope and adds a host dependency to doctor; mark it as intentional or drop it.

## Checklist notes
- **API existence:** these exist and fit:
  - `process.kill(pid, 0)` on Windows (libuv health check);
  - `GetFileInformationByHandleEx(FileRemoteProtocolInfo)`, which succeeds only on remote volumes;
  - `windows-sys` 0.61.2, already in `Cargo.lock`. The probe used 0.59, so expect small API drift when porting.

  The feature names in P00 are right, except for item 18.2.
- **macOS (D13):** agreed. `flock` is measured and gated, and containment stays in 6.2. The CI leg is enough.
- **D14 (Windows `scan` unsupported → attested fences):** justified. The `needs-attest` branch exists in `holder-lock-checks.mjs` (~l.519).
- **Decisions:**
  - Justified as written: D1 (apart from 18.8), D4, D8, D11, D12 (apart from finding 7), D13, D14, D15.
  - Need rework: D2 (borrower check is fine; the "token" claim is not), D5 (findings 1 and 6), D6 (findings 1 and 2), D7 (findings 3, 4 and 8), D9 (findings 5 and 18.4), D10 (18.9), D3 (finding 17).

## Verdict
Not ready to execute. Findings 1 and 2 are design bugs, not polish. As written, every Windows borrow fails or leaks a keeper, and a leftover record makes a contender kill a live Rust holder's process tree. Findings 3–7 would ship a Windows path where the provider-account borrow and sync release break, or are untested, while CI stays green. Revise D5/D6/D7 and P02–P04 before wave 0. P00 and P01 (driver core, `file_key`, guarantee, the CI fix) can go ahead once findings 5, 7 and 11 are folded in.

## Unresolved questions
1. Do GitHub `windows-latest` steps run inside a job without breakaway? This affects the meaning of P02 test 6 ("breakaway refused") and of keeper survival on CI.
2. For 6.2, is the recorded holder of an attempt job always a job member (the gate)? If so, the tree-source fix in finding 1 matters only for the holder-lock borrow; confirm with 6.2's owner.
3. Do async borrow callers (provider credential probe and renewal) need live stdout streaming, or is output at close enough? This decides between a file tail and a named pipe in finding 3.
