# Red-team: failure-mode review of the HARDEN T1 sub-plan

Lens: what breaks at runtime when the plan is executed as written. Read on main `44b43f23d` (only plan/docs commits after the plan's `e94b1618d`; every cited code file has the same line count on both). Owner decisions 9–13 and the arbitration §2 shapes are taken as fixed. Where a fix touches an approved shape, the fix keeps the shape and changes only how it is carried out.

Two claims were checked by running them on this machine:
- `FGOS_RUST_HOST_RECURSION_GUARD=1 <activated fgos> lock-status --json` exits 1 with "recursion guard triggered". With the same variable set, `identity --json` and `internal lock-fd` still answer.
- The object-in `canonicalJson` of the activated addon, compared with `JSON.stringify`: `{d:new Date(0)}` gives `{"d":{}}` against `"1970-01-01T00:00:00.000Z"`, a class with `toJSON` gives `{"t":{"x":1}}` against `"T"`, and a `Buffer` is refused against `{"type":"Buffer",…}`.

## Findings

### F1. The bwrap stderr pipe becomes the gate's stderr for its whole life
- **Severity:** High
- **Evidence:**
  - `packages/process/rust/src/containment/linux.rs:131-133`: `apply_stdio` runs before `spawn_with_fds`. bwrap's fd 2 is inherited by the gate it execs.
  - `packages/process/rust/src/containment/pgroup.rs:155-158`: a spec with no stderr gets `Stdio::null()`.
  - Phase 4's "R3 / RT-M11" bullet and the risk row "on success the write end is closed with the child's stderr mapping unchanged".
- **What goes wrong:** Phase 4 gives bwrap a pipe for stderr whenever the spec has no stderr of its own (every terminal-mode attempt). bwrap does not keep a separate stderr for itself: the sandboxed gate, and through it the agent CLI, inherit that pipe as fd 2. "The child's stderr mapping unchanged" cannot hold, because the mapping is fixed at exec. The sequence:
  1. The namespace comes up and `read_child_pid` succeeds.
  2. The supervisor drops the read end, as the plan says.
  3. The first `eprintln!` in the gate gets EPIPE. Rust's `eprintln!` panics on a write error, and a Node or agent child with default SIGPIPE dies.
  4. If the supervisor keeps the read end but never reads it, the gate blocks after 64 KiB of stderr instead, and the attempt hangs.

  Today that stream goes to `/dev/null`. Every contained terminal attempt on bwrap is exposed.
- **Suggested fix:** Keep the approved shape ("keeps bwrap's pre-gate stderr"), but never leave a pipe without a reader.
  - Either: after `read_child_pid` succeeds, hand the read end to a detached thread that reads and discards until EOF, which keeps the `/dev/null` behaviour.
  - Or: give bwrap an unlinked temp file and, on the failure path only, read its first non-empty line.
  - Add one case to the phase-1 test: a gate that writes 1 MiB to stderr after a successful start still exits 0.

### F2. The hook's new `fgos lock-status` call is a legacy-cli verb, and the host's recursion guard refuses it
- **Severity:** High
- **Evidence:**
  - `packages/host-runtime/contracts/command-routes.json:457-459`: `lock-status` is `route_kind: legacy-cli`.
  - `apps/fgos/src/main.rs:262-268` refuses any legacy-cli verb when `legacy_exec::check_recursion_guard` fails (`apps/fgos/src/legacy_exec.rs:38-45`).
  - `legacy_exec.rs:245` sets the guard in every payload's environment.
  - `src/runner/goal-check.mjs:61` (`runBorrowed` with `spec.env ?? process.env`) passes the guard to verify shells.
  - Only two places strip the guard: `src/setup/agent-hooks.mjs:67` and `src/runner/dispatch/adapters.mjs:131`.
  - Today's hook path uses only `fgos internal lock-fd` (a native route, not guarded) and `fgos identity` (native). Verified live: with the guard set, `lock-status` exits 1.
- **What goes wrong:** After phase 2, `mainLockVerdict` (`.githooks/pre-commit:120-143`) ends in `execFileSync(bin, ['lock-status','--json'])` whenever the commit does not borrow `main-checkout`. That covers:
  - no `FGOS_LOCK_FD`;
  - `FGOS_LOCK_FD` naming a different lock, such as `dispatch-cwd:3` from a goal-check borrower;
  - a borrower check that threw and was caught at `:126`.

  If any ancestor is a host-run payload, the environment carries `FGOS_RUST_HOST_RECURSION_GUARD=1`. The host then refuses with exit 1, and the plan's rule "any other failure → error" refuses the commit fail-closed. One concrete case: this repo's own `npm test` run as a `fgos run` verify command. The hook fixture tests commit under `FGOS_LOCK_FD=dispatch-cwd:3` plus the guard, are not borrowers, and get refused. Phase 2's verification (`git commit` in a plain shell) cannot see this.
- **Suggested fix:**
  - In the hook, build the exec environment without `FGOS_RUST_HOST_RECURSION_GUARD`, following the precedent at `agent-hooks.mjs:67`.
  - Use D2's narrower form (`lock-status main-checkout --json`), or document why the full registry scan is acceptable. Today's verb probes every repo and machine row (`src/runner/lock-status.mjs:96-125`) on top of the cost of booting Node.
  - Add one hook wiring case with the guard set.

### F3. `release()` starts throwing `lock-release-stuck` from code that runs in `finally` blocks, and leaves the handle half-released
- **Severity:** High
- **Evidence:**
  - `src/holder-lock/index.mjs:111-127`: `release()` today throws only while a borrowed child is running.
  - Phase 2's `release()` bullet: "`stuck` throws `lock-release-stuck`" after `fs.closeSync(entry.fd)`.
  - The Rust port never throws on release: `packages/holder-lock/rust/src/port.rs:826-828` returns `Release`, and `Handle::drop` ignores it at `port.rs:189-193`.
  - Callers that release in `finally`: `src/runner/dispatch/provider-capacity.mjs:430-434`, `src/state/hot-lock.mjs:135-137` and `:149-151`, `src/runner/repo-locks.mjs:93`. `provider-capacity.mjs:826` already says "a release problem must not turn a probe answer into a failure".
- **What goes wrong:**
  1. `withProviderStateLock(fn)` runs `fn`, which writes and fsyncs the provider state.
  2. A leftover that cannot be killed (an escaped borrower in D-state, or one owned by another uid) makes the settle report `stuck` after 2000 ms.
  3. `release()` throws inside `finally`. That replaces `fn`'s return value, or `fn`'s own error, so the caller sees a failure for a lease that was in fact written, and retries or double-leases.
  4. Because the plan closes the fd before settling and only then would set `released`/`untrack`, the handle is left with `entry.fd === null`, `released === false` and still tracked in its `LockScope`. A second `release()` calls `fs.closeSync(null)` (TypeError), and the scope keeps the rank, so `assertCanAcquire` refuses later lower-rank acquires in that scope.
- **Suggested fix:** Set `entry.released = true` and call `scope.untrack(this)` before calling `releaseFd`. Do not throw from `release()`. Return the settle outcome instead (`true`, or `{ stuck, killed, pids }`), as the Rust `release` does, and let the callers that need it (doctor, fence) read it. The RT-M2 constraint (settle unless handed over) is unchanged.

### F4. `hot-lock-release-stuck` thrown from `withStateTx`'s `finally` hides the callback's error and reports a committed transaction as failed
- **Severity:** Medium (Windows only)
- **Evidence:**
  - `src/state/hot-lock.mjs:315-327`: `releaseRecord(paths)` is called inside `finally`.
  - Phase 4's T1-CF-02 bullet: "the error propagates as the transaction's error after the callback's own result".
- **What goes wrong:** In JavaScript, a throw inside `finally` replaces the pending exception or return. The plan's sentence is false in both cases:
  - If `fn` threw error A, A is lost and the caller sees only `hot-lock-release-stuck`.
  - If `fn` succeeded, its writes are already on disk but `withStateTx` throws, so a caller that retries applies the change twice (for example `appendEvent`).

  The record also names this live process. Every later `withStateTx` in the same long-lived process (runner, gateway) waits 30 s and then times out on its own pid, unless the S-F1 message names `fgos lock fence`.
- **Suggested fix:** Keep the named error (approved shape), but carry the outcome on it. Add `cause` (the callback's error) and `committed: true` plus `result` when `fn` returned. This is a two-line change in the `finally`, which is WORK's region, so WORK must agree and the plan must list the edit. Add one case to the two Windows cases: "a stuck release after a successful callback is reported as committed".

### F5. Phase 5's state-root claim about the test harness is false: test processes are not run by the host and the harness removes the pin
- **Severity:** Medium
- **Evidence:**
  - `scripts/run-tests.mjs:148` removes `FGOS_STATE_ROOT`, and its own comment (`:135-138`) says the host re-pins it only for payloads it runs. `node --test` processes are not such payloads.
  - Phase 5 says "the test harness re-pins through the host (`scripts/run-tests.mjs:148`)".
  - In-process callers that would throw `state-root-unpinned`:
    - `src/git/inspect.mjs:29`
    - `src/runner/worktree.mjs:173`
    - `src/event-store/native.mjs:56, :153, :157`
    - `src/runner/execution/run.mjs:121`
    - `src/runner/execution/partial-writes.mjs:17`
    - `src/runner/dispatch/provider-capacity.mjs:392`
    - `src/setup/event-store-fixes.mjs:18`
  - There are 20+ call sites, not the 14 the plan's Facts give.
  - Test files that import those modules and set neither `FGOS_STATE_ROOT` nor `FGOS_STATE_HOME`: `test/runner/loop.test.mjs`, `test/runner/credential-store.test.mjs`, `test/event-store/store-hardening.test.mjs`, `test/workflow/conductor-case.test.mjs`, `test/runner/provider-credential-probe.test.mjs`, and more.
- **What goes wrong:** Today an unpinned in-process call asks the route, which resolves from HOME or `FGOS_STATE_HOME`. After phase 5 every such call throws. Phase 5's verification list runs only seven files, so the breakage first shows up in phase 7's full run, or in a later lane. Fixtures that set only `FGOS_STATE_HOME` also lose that variable's meaning in Node.
- **Suggested fix:**
  - In `buildTestEnv`, pin a per-run `FGOS_STATE_ROOT` under the run directory instead of removing it. That is one line, and it also stops tests from touching the real machine root.
  - Grep every `resolveStateRoot`/`resolveLockRoot` caller into phase 5's Facts and run the full suite at the end of phase 5, not only at phase 7.

### F6. The gateway, a supported surface, runs checkout entries, and T1 turns its lock and identity calls into refusals
- **Severity:** Medium
- **Evidence:**
  - `apps/fgos-gateway/src/gateway.rs:1134-1139`: `POST /v1/runner/tick` spawns `node <root>/bin/fgos-runner.mjs --once` with no host in front.
  - `gateway.rs:381-397`: the non-tier-zero fallback of `build_fgos_command` is `node bin/fgos.mjs`.
  - `src/runner/loop.mjs:106, :223`: the runner takes and lists locks.
  - `src/native/door.mjs:18-25`: `ownRelease` loads only the addon of the release whose payload is running, and a checkout payload is not one.
- **What goes wrong:** Owner decision 10 makes `node bin/fgos.mjs` unsupported for lock and identity verbs. The plan's Risks row says "every supported channel runs under the host", but the gateway's tick endpoint is a product surface (AGENTS.md "Starting the fgos gateway") that runs exactly that channel. After phases 2 and 6, a tick in this repo fails `lock-driver-unavailable (addon-not-shipped)` and `host-missing` on its first lock or state write. Under T0 this already applied to process facts, but T1 extends it to every write.

  This finding does not reverse decision 10. It names a consumer of the channel that the plan did not list.
- **Suggested fix:** Either route the tick and the fallback through the activated host (`resolve_fgos` already finds it at `gateway.rs:382`; drop the `node <checkout>` branches), or record the gateway tick as a known break with a backlog item. Add it to phase 5's AGENTS.md text.

### F7. In-process admission, drain and settle block the event loop for up to 2 s in code paths documented as non-blocking
- **Severity:** Medium
- **Evidence:**
  - `packages/holder-lock/rust/src/predecessor.rs:215-232`: `judge` polls with a 500 µs sleep until `kill_wait`.
  - `packages/holder-lock/rust/src/driver/flock.rs` `cleanup_loop` (sleeps of 1 ms until `kill_wait`) is used by both `drain_description` and `settle_release`.
  - `src/runner/dispatch/provider-capacity.mjs:507-509`: "waiting with timers (never blocking the event loop: panel seats run in one process and may share an account)".
  - `src/holder-lock/index.mjs:584-597`: the async `runBorrowed` drain runs in the `exit` handler and today uses the async `runLockRoute`.
- **What goes wrong:** Today `acquire()` and the async drain spawn a helper and await it, so a slow predecessor kill or leftover sweep costs a child process, not the event loop. In phase 2:
  - `attemptFd` calls `holderLock.lockFd` synchronously. When a predecessor domain is still dying, `admit` blocks the JS thread for up to 2000 ms.
  - The async `runBorrowed` exit handler calls `drainChild` synchronously, which also blocks for up to 2000 ms whenever a leftover or foreign holder is present.

  Every panel seat, timer, heartbeat and capture tail in that process freezes for the duration. The plan's "one in-process try per 25 ms, microseconds each" holds only on the uncontended path.
- **Suggested fix:** For the two async paths only (`attemptFd` and the async drain), expose `lockFd` and `drainChild` as napi `AsyncTask`s on the libuv pool. `acquireSync` and the sync `runBorrowed` keep the synchronous calls. There are no new exports, only an async variant of two existing ones.

### F8. `canonicalJson` string-in silently changes bytes for `toJSON` values, and none of the planned guards can see it
- **Severity:** Medium
- **Evidence:**
  - `src/native/door.mjs:71-74` today: a `JSON.stringify` probe, then object-in through `packages/git/node-addon/src/canonical_json.rs:7-11`.
  - Measured on the activated addon: Date gives `{}` where `JSON.stringify` gives an ISO string; a class with `toJSON` gives its own fields where `JSON.stringify` gives the `toJSON` result; a Buffer is refused today and would be accepted.
  - Phase 1's T0-R1 guard and phase 4's corpus rerun both feed `JSON.parse` output, which cannot contain such values.
- **What goes wrong:** After phase 4, any caller that digests a live object containing a Date or a `toJSON` instance gets different bytes than before. Callers include `proof-helpers.mjs`, `effective-execution-contract.mjs`, `trust-store.mjs`, `confinement/authority.mjs` and `assignment-runner.mjs`. A digest recomputed from such a live object then no longer matches the one stored before T1 (reconcile and proof mismatch). An input that was refused (Buffer) starts to be accepted. The "byte-equal or refused" promise breaks with every check green.
- **Suggested fix:** Make the validating replacer also refuse with `canonical-json-not-json` when `this[key]` is an object whose value was changed by `toJSON` (`this[key] !== value`), or when the value is not a plain object or array. Add one Date case and one Buffer case to phase 1's vector loop, as pinned refusals.

### F9. The `holders()` door throws where Node's listing answered `unlistable`, and the facade checks availability only after it has created files
- **Severity:** Medium
- **Evidence:**
  - `packages/holder-lock/rust/src/port.rs:1327-1330`: `holders` uses `File::open(&resource.path)?`, so a missing file is `Err(NotFound)`.
  - Today `src/holder-lock/driver.mjs:303-309` answers `{kind:'unlistable', reason:'cannot resolve …'}` and never throws.
  - Diagnostic callers that build an error message: `src/runner/dispatch/provider-capacity.mjs:395-405` (`firstHolderPid` inside `lockBusyError`), `src/runner/gateway-control.mjs:91-94`, `src/runner/merge.mjs:1138`.
  - `src/holder-lock/index.mjs:174-176` today checks `hostBin` before `ensureLockFile` and `assertDriverUsable`. Phase 2 deletes the `hostBin` step.
- **What goes wrong:**
  - A lock file removed between the busy answer and the listing (by `fgos lock fence`, or a parametric path) turns the named busy error into a raw io error from the addon.
  - With `hostBin` gone, the first thing `prepareAcquire` does is `ensureLockFile` (mkdir and create). From a checkout without an addon, lock directories are created before `lock-driver-unavailable` is thrown. That contradicts the rewritten `driver-unavailable` test ("creates nothing").
  - A lock External minted on `acquired` but discarded on the `sameInode`-false retry path (`index.mjs:254-258, :316-319`) keeps an EX copy alive until GC. The plan's own risk row ("the WeakMap entry owns the External") does not cover the window before `makeHandle`.
- **Suggested fix:**
  - The door maps `NotFound` to `{kind:'unlistable', reason}`, with one Rust case.
  - `prepareAcquire` calls `nativeDoor()` (throwing `addon-not-shipped`) before `ensureLockFile`.
  - Every path that does not return a handle calls `closeHandedOver(lock)`.

### F10. The new `retry` record state crashes or misleads the hot-record readers outside `hot-lock.mjs`
- **Severity:** Medium (Windows only)
- **Evidence:**
  - `src/setup/lock-record-checks.mjs:38-43`: after `absent` and `unreadable`, it calls `judgeHotRecord(seen.record)` and reads `seen.record.pid`.
  - `src/runner/lock-fence.mjs:173-179` maps every state other than `ok` to `'unreadable'` ("its record does not parse").
  - Phase 4 handles `retry` only inside `acquireRecord`, `unlinkRecordIfUnchanged` and the reclaim.
- **What goes wrong:** On Windows a sharing violation during `fgos doctor` now returns `{state:'retry'}`. The `lock-record-unreadable` check (folded into `lock-holders` in phase 5) dereferences `undefined.pid` and throws a TypeError for the whole row. `fgos lock fence state` tells the person the record "does not parse" and asks for `--attest-stopped`, which leads to `clearHotRecord(…, undefined)`. The phase-4 timeout message prints "held by pid undefined".
- **Suggested fix:** Phase 5's moved check and `fenceHotRecord` treat `retry` as "busy, try again" (no warning; the fence refuses with a retryable code). Add one line to each Windows hot-lock case.

## Rejected hypotheses (checked, found sound)

1. **D-T1-1 (mark taken after open, before `flock`) misses a holder.**
   - libuv opens with O_CLOEXEC, and spawns are synchronous on the calling thread.
   - The only `worker_threads` use is `threadId` in `src/util/unique-tmp-tag.mjs:9`, which spawns nothing.
   - A fork between open and mark holds only a CLOEXEC copy, which disappears at exec. `drain_description` already treats an owner's pre-exec CLOEXEC child as foreign rather than a borrower (`flock.rs:519-528`, `has_borrowed_copy` at `:313-323`).

   No persistent holder can be created in that window.
2. **`drainChild` with `owner = std::process::id()` differs from today's `getppid`.** The route's parent is the Node process that spawned it, sync or async (`route.rs:316`), so the owner is the same pid. `me` moves from the helper to Node. Node holds `entry.fd` and the External duplicate, so the self-presence requirement at `flock.rs:487-490` still holds.
3. **`settle_release` on the External's duplicate after Node closed its fd.** The `/proc/self/fd` reopen and the token read happen while the duplicate still holds the lock (`flock.rs:336-346`). The own-copy short circuit (`flock.rs:367-369`) fires only on a live own FLOCK, so it does not misfire once both copies are closed.

   Note: the phase-2 risk row has the failure mode inverted. If Node's fd were still open, the settle would return `Released` at once (a false proof), not spin to `stuck`. The required order (close first) is still right.
4. **Phase 3 circular import or leftover v1 readers.**
   - The only importers of `src/verbs/events/migrate.mjs` are tests.
   - `src/util/host-bin.mjs:1-6` imports only `setup/bin-discovery` and `runner/paths`.
   - Nothing under `packages/*/rust/src` reads `fence`, `v1Path` or `v1Shape`. The only reader is `packages/event-store/rust/tests/registry_rows.rs:28-30`, which the plan edits.
   - `scope.rs` reads only name, rank, kind and v3Path.
5. **The addon's `resolve_current` uses the wrong caller.** The facade already passes `--pid process.pid` (`src/util/session-identity.mjs:109-110`). The host's `getppid` default (`packages/session-identity/rust/src/provider.rs:41-49`) is not on the facade's path. The env lookups read the same process environment.
6. **Rollback readability.** No lock, hot-record, predecessor or tombstone format changes. Only Node read `lock.predecessorKillWaitMs` (`src/holder-lock/protocol.mjs:63-88`), and the previous release's setup re-adds it at the default.

## Fact-check notes (not runtime findings)

- `src/native/door.mjs` is 89 lines on both `e94b1618d` and HEAD. The plan's references `door.mjs:200`, `:202-253`, `:244`, `:256-259` and `:264-272` do not exist. The real locations are `nativeHelperExe` at `:16`, the ABI check at `:64`, `canonicalJson` at `:71-74` and `durable` at `:79-88`. Phases 2, 4 and 6 edit this file and must re-anchor.
- Phase 1's RT-M2 case has the helper script "set `FD_CLOEXEC` on fd 3". Node has no `fcntl` API. The helper needs a shell or `python3` step, or it should hand fd 3 to the grandchild explicitly through `stdio`.
- The `created_since` fast path trusts a mark only for `pid_max / 4e6` seconds, about 1 s at the default `pid_max` (`packages/process/rust/src/platform/linux.rs:114-120`), and the External uses the lagged mark (`port.rs:232-249`). The RT-M4 scan saving therefore applies only to a borrow within about a second of acquire or of the previous proof. The plan should not report it as a general drain speedup.

Status: DONE_WITH_CONCERNS
Summary: Ten runtime failure modes; three High: the bwrap stderr pipe outlives the gate, the hook's `lock-status` call is refused by the recursion guard, and `release()` throws from `finally`.
Concerns/Blockers: F1–F3 should change phases 2 and 4 before any lead starts. F4 needs WORK's agreement for a two-line edit in its region.
