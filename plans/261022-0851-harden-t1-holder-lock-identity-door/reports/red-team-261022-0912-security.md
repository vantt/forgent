# Red-team review (security / safety lens): HARDEN T1 sub-plan

Plan: `plans/261022-0851-harden-t1-holder-lock-identity-door/` (plan.md + phases 01-07). Frame: arbitration `plans/reports/council-261022-0245-harden-t1-arbitration.md` §2 and owner decisions 9-13 (not reopened here). Code read on `44b43f23d` (= `e94b1618d` plus one plan-doc commit; no source differs). Lens: trust boundaries, descriptor leaks, wrong-process kills, lock-safety invariants, data loss.

Threat model used throughout: one OS user runs everything; there is no hostile local user. "In-process attacker" means a bug or a careless module inside the same Node process, not malice. A finding counts when a realistic bug or ordinary operation reaches a wrong kill, a wedged lock, lost data or a broken documented invariant.

## Findings

### F1. The `holderLock` door is an fd-taking API that grants kill authority with no capability

- **Severity:** High
- **Evidence:** `docs/platform/holder-lock/spec.md:123-126` ("possession of request data, a path or an fd number never grants a holder handle"); `packages/git/node-addon/src/git/handover.rs:1` ("No fd-taking operation API") and `:9-19` (`take_git_handover` is a one-shot capability); `packages/holder-lock/rust/src/port.rs:294-317` (the `unsafe` contract says it "must never supply an arbitrary opened file"); `src/native/door.mjs:70` (`nativeDoor()` hands the whole addon to any importer; 10+ modules import `door.mjs`); `test/architecture.test.mjs:1289-1296` (the guard covers only the Git seam); phase-02 table rows `lockFd(fd, …)`, `drainChild(lock, childPid, …)`, `releaseFd`, `clearDomain`.
- **What goes wrong:** any module can call `nativeDoor().holderLock.lockFd(N, 'ex', {kind:'try'}, …)`. Point it at the fd number of a description the facade already holds (fd numbers are small and easy to guess). `flock(LOCK_EX)` on a description that already holds the lock succeeds, so the door answers `acquired` and mints a second External for the live description. Whoever holds that External can then:
  - call `drainChild(ext, <any pid>, …)` and SIGKILL every holder whose parent is not Node. For the custody `dispatch-cwd` lease, which `spawnWithLocks` hands to the supervisor while the controller keeps its copy (`src/run-supervisor/direct-launch.mjs:274-275`, `assignment-runner.mjs:2097-2098`), those holders are the live gate and agent (`flock.rs:499-506`);
  - call `clearDomain(ext, …)` and clear a predecessor record while the real holder's domain is still alive.

  The plan removes the one property that made the Git loan safe: no fd number crosses into a call that can kill.
- **Threat model note:** this is not an outside attack. It is a bug class: a second module, or a later refactor, minting authority from an fd number. That is exactly the case the spec and `handover.rs` were written to rule out, and the plan breaks that written invariant without amending §5. Code that loads the addon before the facade can already deny startup (fail closed), so the capability does not need to stop malice. It only needs to stop accidental minting.
- **Suggested fix (smallest):**
  1. Add `takeHolderLock()`, a one-shot capability External modelled on `take_git_handover`. Require it as the first argument of `lockFd`, `drainChild`, `releaseFd`, `clearDomain` and `closeHandedOver`. `index.mjs` consumes it when the module loads.
  2. In `lockFd`, refuse an fd whose description already shows a FLOCK lock in `/proc/self/fdinfo/<fd>` before calling `flock`.
  3. Extend `architecture.test.mjs:1289` so the string `holderLock.` appears only in `src/holder-lock/index.mjs`.
  4. Make `mint_git_loan` take the External alone (no `fd` parameter), so the loan duplicates the External's own file.
  5. Rewrite the trust-boundary paragraph (`spec.md:123-126`) in phase 5, not just the `--reach-floor-ticks` sentences.

### F2. Capturing bwrap's stderr through a pipe leaves the gate's stderr pointing at that pipe (EPIPE turns the gate's own messages into a panic)

- **Severity:** High
- **Evidence:** phase-04 "R3 / RT-M11" ("gives `bwrap` a pipe for stderr when the spec has no stderr of its own … on success the write end is closed with the child's stderr mapping unchanged"); `packages/process/rust/src/containment/linux.rs:127-143` (`spawn_in` returns `Spawned { child, root }`, so a local read end is dropped on return); `packages/process/rust/src/containment/pgroup.rs:155-159` (bwrap's stdio is what the gate inherits); `packages/run-supervisor/rust/src/gate.rs:129, :324`, `gate/unix.rs:718, :727`, `supervise/terminal.rs:475, :554` (`eprintln!`).
- **What goes wrong:** bwrap execs the gate with bwrap's own fd 2. In Terminal mode (the case the plan targets) that becomes the new pipe. "Child's stderr mapping unchanged" cannot hold: the mapping *is* the pipe.
  - If `spawn_in` drops the read end (the natural shape, since it is a local), the gate's first `eprintln!` hits EPIPE. Rust ignores SIGPIPE, and `eprintln!` panics when the write fails. The gate exits 101 instead of exiting with its named failure, and the failure text (`gate.rs:324`) is lost.
  - If the read end is kept but never read, a chatty gate blocks once the pipe holds 64 KiB.

  In Direct mode the plan reads the tail of the caller-supplied stderr file instead. That file is the agent capture file, so the "first non-empty line" can be text an earlier writer put there, and the containment error is then misattributed.
- **Threat model note:** a real failure on the success path of every Terminal-mode bwrap attempt, not a hostile one. The "poisoned error" angle is low here: the gate has not run when `--info-fd` is empty.
- **Suggested fix:** leave the success path byte-identical to today. Only when `read_child_pid` returns 0 bytes, run `bwrap <same prefix> -- /bin/true` once with stderr piped and bounded to 4 KiB, and report its first line. This costs one extra spawn on the failure path only. Do not read caller capture files.

### F3. One `origin.rs` classifier for both the doctor and `quiesce-scan` has opposite safety polarities

- **Severity:** High
- **Evidence:** phase-02 `holders` row: "`holder_origin(view, lock_name, state_root)` … `names_payload` moved from `route.rs:557-569` plus Node's rules … `quiesce-scan` reads the same function". `packages/holder-lock/rust/src/route.rs:557-569` (`names_payload(argv, dirs, state_root)` counts any absolute argv path under the workspace or its worktrees). `route.rs:660-671` (non-`--workspace-only` mode uses it). `src/holder-lock/fences.mjs:437-438` (`checkStopped` runs that mode for `events migrate`). `packages/distribution/rust/src/git_gate.rs:96` (fgctl's gate also uses `quiesce-scan`).
- **What goes wrong:** the proposed signature has no `dirs`, so one of two things breaks:
  - **(a) The workspace-argv rule disappears from `quiesce-scan`.** The stop-everything check for `events migrate` and fgctl's git gate can then answer `clean` while a process runs on workspace paths from another cwd. The migration then rewrites the event store under a live writer.
  - **(b) The rule is kept for `lock-holders`.** Then any holder whose argv names a workspace path is labelled `fgos-payload` and the doctor stops warning. A hand-run `flock .fgos/locks/x.lock sleep 1e6` is exactly such a holder, and that warning is the user's only signal of a wedged lock.

  There is also a polarity question for the Node-only `borrowed` origin. A child carrying `FGOS_LOCK_FD` (a git commit under a lock) must block quiesce. The plan does not say which origins count as "fgOS" for quiesce.
- **Threat model note:** (a) is a data-loss path (event-store migration under a live writer); (b) is a lost safety diagnostic. Neither needs an attacker.
- **Suggested fix:** keep two predicates in `origin.rs`.
  - `holder_origin(view, lock_name, state_root)` for the doctor, without the workspace-path rule.
  - `is_workspace_process(view, dirs, state_root)` for quiesce, which keeps `under(dirs)` and treats every non-`foreign` origin as blocking.

  Add one vector each, plus one quiesce vector: a process whose cwd is outside the workspace but whose argv names a workspace path still blocks.

### F4. `release()` has no ordering rule for a throw after `closeSync`: the External is left to GC and a reused fd number can be double-closed

- **Severity:** Medium
- **Evidence:** phase-02 facade bullet "`release()` … `fs.closeSync(entry.fd)` then … `holderLock.releaseFd(entry.lock, …)`; `stuck` throws `lock-release-stuck`". Today's state commit is at `src/holder-lock/index.mjs:111-127` (`entry.fd = null; entry.released = true; scope.untrack`). Callers swallow errors at `src/run-supervisor/direct-launch.mjs:75` (`catch { /* already closed */ }`). `src/state/hot-lock.mjs:136, :150` release in `finally`, so a throw there replaces the `'cleaned'`/`true` return.
- **What goes wrong:** the plan does not say whether the entry's state (fd null, released, untracked, External consumed) is committed before `releaseFd` can throw.
  - **State not committed first:** a retry, or the second loop pass at `direct-launch.mjs:73-75`, calls `closeSync` again on a stale fd number. Node may by then have reused that number for another description, possibly another lock, and that lock is dropped silently. The scope still lists the handle, so later acquires can hit `lock-order-violation`.
  - **Addon fails before taking the file** (`check()`, a poisoned mutex): the External's duplicate keeps the kernel lock after Node's own fd is closed. The lock stays held until a GC finalizer runs, which in a long-lived gateway or runner may be never. The process then sees its own lock as `held`.
- **Threat model note:** an ordinary failure path, not an attack. It matters only when the settle reports stuck or the addon refuses.
- **Suggested fix:** in `release()`, set `entry.fd = null`, `entry.lock = null`, `entry.released = true` and `scope.untrack` first, then `closeSync(fd)`, then `releaseFd(lock)`. In Rust, `releaseFd` and `closeHandedOver` must `take()` the External's file before any step that can fail. State this in phase 2 and pin it with one wiring case (release that throws stuck, then a second `release()` returns `false` and closes nothing).

### F5. The async `acquire` and the async borrow sweep become synchronous kill waits on the event loop

- **Severity:** Medium
- **Evidence:** `src/holder-lock/index.mjs:283-290` ("the event-loop-friendly twin: … never a blocking wait"), `:441-447` (async `sweepLeftovers`, today an awaited child process). `packages/holder-lock/rust/src/driver/flock.rs:305-311` (`cleanup_loop` sleeps 1 ms per pass until `kill_wait`), `:522-528` (a foreign holder keeps the loop running to the deadline). Phase-02: "the poll loop stays (one in-process `try` per 25 ms, microseconds each)"; `drainChild`, `releaseFd` and `lockFd` (with `predecessor::admit`) are synchronous napi calls.
- **What goes wrong:** microseconds holds only when nobody needs killing. Two cases block the event loop for up to `killWaitMs` (2000 ms):
  - every async `acquire` try that meets a non-empty predecessor domain;
  - every borrowed-child exit whose drain sees a foreign holder (for example the supervisor sharing the custody lease, `flock.rs:499-509`).

  The controller's capture tail, `waitForBinding` timers and the gateway's request handling stall for that time. Today these calls were awaited child processes.
- **Threat model note:** a liveness and timing regression, not a wrong kill. It can still turn into wrong decisions where a timer bounds a liveness judgement.
- **Suggested fix:** expose `drainChild`, `releaseFd` and the admission half of `lockFd` as napi `AsyncTask`s (libuv threadpool) for the async paths, keeping `entry.sweeps` as the snapshot guard; the sync paths keep the sync calls. Otherwise state the blocking bound in the facade's doc comment and the spec.

### F6. The hook as a host client briefly SH-locks ~14 unrelated locks on every commit

- **Severity:** Medium
- **Evidence:** D-T1-4 (`fgos lock-status --json`, "no new flag"). `src/runner/lock-status.mjs:66-78` and `:107-124`: every fixed repo- and machine-scoped row that exists is probed with a shared lock, and its holders are listed by a full fdinfo scan. The registry has 14 such fixed rows (gateway, runner, sessions, reconcile, full-suite, provider-state, main-checkout, two `.reclaim` locks, worktree-admin, activation, install, observe, repo-config). `docs/platform/holder-lock/spec.md:118` ("This brief SH hold can cause a concurrent exclusive `Wait::Try` acquirer to report held"). Try-acquirers of those rows: `src/runner/loop.mjs:217` (runner), `src/runner/dispatch/reconciliation-planner.mjs:216` (reconcile). House rule: `src/workflow/case-lock.mjs:36-37` ("a status read never makes a concurrent advance see the lock held; the probe … is only for a platform that cannot list holders").
- **What goes wrong:** today the hook probes only `main-checkout`. After D-T1-4, every commit (ScopedCommit runs it for each writing `fgos run`) briefly holds SH on every existing fixed lock. A concurrent `fgos runner` start or reconcile then gets a spurious `held` / "already running" refusal with no holder to name. Each commit also pays roughly 14 full `/proc/*/fdinfo` scans.
- **Threat model note:** a real, low-probability false refusal that grows with commit rate. Not a wrong kill or data loss.
- **Suggested fix:** the hook needs one row. Either add `--lock main-checkout` to `lock-status` (a few lines; it narrows the existing verb rather than adding a mechanism), or make `lock-status` list holders first and probe only rows the platform cannot list, as `case-lock.mjs` does. The second option also fixes the same contention for people running `fgos lock-status`.

### F7. On Windows the new `retry` record state has no way out and no doctor line

- **Severity:** Medium
- **Evidence:**
  - Phase-04 T1-CF-01: `retry` "is never eligible for reclaim".
  - `src/state/hot-lock.mjs:185-200`: the timeout message reads `held by pid ${seen.record?.pid}`, which is `undefined` for `retry`, and gives no `reason`.
  - `src/setup/lock-record-checks.mjs:38-43`: `retry` is neither `absent` nor `unreadable`, so the check calls `judgeHotRecord(undefined)` and the row throws. Phase 5 moves this code into `lock-holders` with no `retry` row in its merge table.
  - `src/runner/lock-fence.mjs:180, :197-201`: `fgos lock fence state` treats the record as unreadable, needs `--attest-stopped`, then `clearHotRecord(…, undefined)`, which phase 4 makes return `false` for `retry`.
- **What goes wrong:** a record that stays EBUSY or EPERM (an AV scanner, a handle opened without `FILE_SHARE_DELETE`) makes every `withStateTx` time out with "held by pid undefined; retry the operation". The doctor row crashes or says nothing, and the documented way out (`fgos lock fence`) cannot clear it. Before the plan, the code mapped this to `absent` and spun; after it, the store is wedged until a person deletes the file by hand.
- **Threat model note:** Windows only; real (sharing violations held by AV software are common).
- **Suggested fix:**
  - At the deadline, a `retry` state times out with `reason: 'lock-record-unreadable'`, the path, and the fence sentence.
  - The merged `lock-holders` check reports `retry` as "record cannot be opened (EBUSY/EPERM)".
  - `fgos lock fence --attest-stopped` may unlink a record whose last read was `retry`, still under the reclaim lock.
  - Add one Windows case to `windows-hot-lock.test.mjs`.

### F8. `hot-lock-release-stuck` thrown from `withStateTx`'s `finally` replaces the callback's error and hides a committed transaction

- **Severity:** Medium
- **Evidence:** `src/state/hot-lock.mjs:316-326`, where `releaseRecord(paths)` runs inside `finally`. Phase-04 T1-CF-02 says "the error propagates as the transaction's error after the callback's own result … no edit inside `:227-332`".
- **What goes wrong:** in JavaScript, a throw from `finally` replaces the pending completion.
  - If `fn(tx)` threw E, E is lost and the caller sees `hot-lock-release-stuck`. A caller that branches on E's code takes the wrong branch.
  - If `fn(tx)` succeeded, its writes are already durable, but the caller gets an exception and retries a committed transaction. For an append (events, ledgers) that means a duplicate entry.

  Both outcomes need an edit inside `:316-326`, which the plan forbids (WORK's region).
- **Threat model note:** Windows only, rare, but the duplicate-append outcome is data corruption.
- **Suggested fix:** hand a three-line change to WORK (record it like H22). Catch the release error in `finally`. If the callback threw, attach the release error as `cause` and rethrow the original. Otherwise throw `hot-lock-release-stuck` with `committed: true` and the result, so callers do not retry. Or keep today's silent return until WORK lands this.

### F9. D-T1-9's owner-machine precondition cannot be checked as written and is weaker than the arbitration's line

- **Severity:** Medium
- **Evidence:**
  - plan.md:28 itself shows the doctor's `lock-fences` message truncates to five names ("The SEAT landing report's '54 of 425 …' was the doctor's five-name truncation").
  - plan.md:73 accepts a warning "when every named path is a worktree, branch or run created after 2026-10-17" and requires that "`activation.json` names a release built on or after 2026-10-17 16:25".
  - Arbitration "Unresolved questions" 1 says the deletion lands on the owner machine "only after its three workspaces show `lock-fences` green".
  - Checked on this machine: `.fgos/installation/activation.json` carries `artifactDigest` and `activatedAt` only, and the release `manifest.json` has no build time or source commit.
- **What goes wrong:**
  - The owner can verify neither "every path" (the warning shows five) nor "built on or after" (there is no such field).
  - The plan relaxes "green" to "warning accepted" without saying so.
  - After phase 3, `doctor --fix` places no new fences. A pre-cutover release still in `~/.local/state/fgos/releases/` (20 digests here) activated by hand would then take v1 locks on every unfenced path with no fence and no doctor row.
- **Threat model note:** owner decision 1 accepts deleting the fences. This finding is only about whether the stated precondition can be checked. The residual risk is a hand rollback past the cutover.
- **Suggested fix:**
  - The guide lists the exact allowed digests per machine (post-cutover builds), not a date.
  - It has the owner run the pre-T1 release's `fenceStatus` with full JSON output (or `fgos doctor --json`, if that row is not truncated) and check every unfenced path.
  - Either restate "green" or record the relaxation as a big-lead decision with its reason.

### F10. `process.selfChain()` from `facts::relations()` drops the parent on macOS and Windows, so the fence's self-protection weakens

- **Severity:** Medium (narrow)
- **Evidence:** D-T1-5 ("this pid and its ancestors from `facts::relations()`"). `packages/process/rust/src/platform/mod.rs:43-45` (`relations()` returns `None` on every platform except Linux). Today's `src/holder-lock/fences.mjs:415-423` always includes `process.ppid`. `src/runner/lock-fence.mjs:185` (the hot-record fence signals an `alive` holder unless it is in the chain).
- **What goes wrong:** on macOS and Windows the chain shrinks from `[pid, ppid]` to at most `[pid]`. When the hot record's holder is the parent of the process running `fgos lock fence state --yes` (a wrapper or REPL that took the mutex earlier and spawned before taking it), the fence now SIGTERMs and then SIGKILLs its own parent. The holder-list path is safe here because on those platforms holders are unlistable and need an attestation.
- **Threat model note:** a real wrong-process kill, but it needs a narrow sequence.
- **Suggested fix:** seed the chain from `getppid()` in Rust (or `process.ppid` in the wrapper), then walk `relations()` where present. Add one assertion to the existing `facts.rs` test.

## Rejected attacks

1. **`settle_release` on the External's duplicate after Node closed its own fd** (`packages/holder-lock/rust/src/driver/flock.rs:332-407`).
   - The fdinfo token and `/proc/self/fd/<dup>` are read while the duplicate is still open, so no EBADF.
   - The kill set is limited to FLOCK records stamped with Node's pid and the inode's token, held by a process that is not Node and either has a non-Node parent or holds a non-CLOEXEC copy. EX exclusivity means only this handle's description can carry that stamp at that moment.
   - Direct pre-exec children with CLOEXEC copies are waited, never killed (`:397`). The supervisor's gate is spared only because handed-over handles never settle (the RT-M2 mark).
   - Correction to phase-02's risk row: had Node's fd still been open, `mine` (`:364-367`) would report `released` falsely, not "spin to stuck". The plan's close-first order prevents this, so it is not a finding.
2. **`drainChild` with owner `std::process::id()` kills Node's children or a protected sibling.** Today's helper passes `owner = getppid()`, which is Node (`route.rs:313`), and excludes itself as `me` (`flock.rs:462-465`). In process, `me` and `owner` are both Node and the helper is gone. The holder set, the domain rule (`:495-520`) and the protected roots (`index.mjs:432`, `:568-598`) are unchanged. Pre-existing and unverified (an open question, not a finding): if a borrow ever runs on the custody lease while the supervisor lives, `flock.rs:499-506` treats the supervisor's children as escapees.
3. **The hook's `fgos` calls inherit slot 3, or recurse, or mutate.** The hook already execs `fgos identity` with inherited fds today (`src/util/session-identity.mjs:105-118`; git leaves fd 3 open). `lock-status` runs only on the not-borrower path. Any lingering child is a descendant of the borrowed git, so the borrow drain bounds it. `lock-status` is read-only: it never creates an absent lock file (`lock-status.mjs:70`), takes only SH probes (F6), never runs `--fix` and never commits, so it cannot re-enter the hook.
4. **No-host hook bypass of the main-checkout check.** With `bin === null` the lock step warns, but the identity exec at `.githooks/pre-commit:552` (after D-T1-4, the same `bin`) fails and the commit is refused. Fail-closed holds.
5. **The in-process identity answer differs from today's exec.** Today's exec passes `--pid process.pid` (`src/util/session-identity.mjs:105`); `resolve_current` uses `std::process::id()` (`packages/session-identity/rust/src/resolve.rs:156-163`), the same pid. Main-thread `process.env` writes are real `setenv` calls, so the env lookup sees the same values. `FGOS_PARENT_WRITER_ID` and the scrub are the gate's (session-identity spec §5a) and untouched. Caveat: a worker thread's `process.env` is a copy, so its edits are invisible in process.
6. **A forged `FGOS_LOCK_FD` in another process's environ makes it `borrowed`.** Only the same user can set it. Another user's environ is EACCES, so the view lands in `unreadable` and the classifier falls back to cmdline, exactly as Node does today (`src/setup/holder-lock-checks.mjs:415-427`). Not a threat in the one-user model. The real residual is pre-existing: an escaped descendant of a borrowed child inherits the variable and is labelled `borrowed`, so the doctor stays quiet about the very process that wedges the lock.

## Notes (not scored)

- **Plan citations that do not exist on `e94b1618d`:**
  - `src/native/door.mjs` has 89 lines; the plan cites `:200`, `:244`, `:256-259`, `:264-272`. The ABI check is at `:60-61`, `canonicalJson` at `:73`, `nativeHelperExe` at `:17`.
  - `src/holder-lock/native-handover.mjs` has 9 lines; the plan cites `:180`.

  plan.md:16 claims "every `file:line` below was re-read", which is not true for these.
- `packages/holder-lock/rust/src/port.rs:1342` (`ffi_handover_retains_the_acquisition_floor_and_refuses_missing_history`) proves the `lock-reach-*` branches phase 2 deletes. It is missing from the phase-2 retire list.
- **Phase 5:**
  - With no pin, `src/runner/lock-status.mjs:101-105` swallows the `HolderLockError` and reports every machine row as `free`: the `<lockRoot>` segment never expands, so there are no instances. It can only be reached from the unsupported checkout channel (the host pins, `apps/fgos/src/legacy_exec.rs:249-255`), but it should refuse rather than answer `free`.
  - Deleting `checkStateRoot`'s "without the pin the host resolves …" line (`holder-lock-checks.mjs:780-788`) removes the only visibility of a leaked or stale pin.
