# HARDEN T0 Council — Red-Team Seat Report

Revision reviewed: `1477ff770` (current `main`; the three seat reports were recorded on `71ba43d80`, and `git log --oneline 71ba43d80..1477ff770` contains only docs/board commits `2d215a4d0`, `5a4b73533`, `1477ff770`, so all source/test line numbers are identical).

**What I read:** Every line of `packages/process/rust/**`, `packages/host-runtime/rust/**`, `packages/canonical-json/rust/**`, `packages/durable-file/rust/**`, their `contracts/`, `src/runner/dispatch/process-identity.mjs`, `src/util/unique-tmp-tag.mjs`, all Phase-01 §A–§E Node sites and importers, `src/git/native.mjs`, `packages/git/node-addon/src/**`, `packages/holder-lock/rust/src/route.rs`, `packages/run-supervisor/rust/src/{envelope,supervise,gate,adopt}.rs`, `docs/architecture-manifest.json`, and the three seat reports (`council-261021-1324-harden-t0-seat-correctness.md`, `council-261021-1324-harden-t0-seat-simplicity.md`, `council-261021-1324-harden-t0-seat-speed.md`).

**What I ran:** Read-only `rg`/`git log` checks plus focused read-only `node -e` reproductions using a temporary directory `/tmp/fgos-work-fa1-*` (removed in `finally`) to reproduce `F-A1`/`RT-M4` (`stopGateway` killing an unrelated process and stalling 10.16s on the resulting zombie) and `process-identity.mjs` edge cases. No workspace file was modified.

---

## Missed findings

### RT-M1 — `LinuxPgroup::spawn_in` sets `PR_SET_CHILD_SUBREAPER` on the calling process (parent) instead of the domain leader, leaking zombies into Node callers and defeating its own `ppid` tree walk

- **Axis / Severity / Status:** A, B, E | **High** | **reproduced** (verified in `packages/process/rust/src/containment/linux.rs:243,355-369,476-482` and demonstrated by `packages/process/rust/tests/containment_pgroup.rs:65,78,101`, where the test runner process itself becomes the subreaper, adopts the reparented `escape_pid` at `ppid == std::process::id()`, and `driver.is_empty` / `driver.kill_all` miss it because `members()` only walks `ppid` under `leader.pid.0`, forcing the test to manually `libc::kill(escape_pid, SIGKILL)` at `:101`).
- **Evidence (`file:line`):**
  - `packages/process/rust/src/containment/linux.rs:238-257,476-482`: `LinuxPgroup::spawn_in` calls `become_subreaper()?` (`libc::prctl(libc::PR_SET_CHILD_SUBREAPER, 1, 0, 0, 0)`) in the **calling process** before `control::spawn_with_fds(cmd, &mapped)`.
  - `packages/process/rust/src/containment/linux.rs:355-369`: `members(root, walk_tree, pgid)` walks `row.ppid == parent` starting from `frontier = vec![root]` where `root = leader.pid.0` (the child spawned by `spawn_in`, not the caller `std::process::id()`).
  - `packages/git/rust/src/driver.rs:282,1188-1195`: `GitDriver::new` calls `containment::select(&Default::default())`, and every non-borrowed git command calls `self.containment.spawn_in(&mut domain, spec)` inside the calling process (including Node via `fgos.node`).
  - `docs/platform/process/spec.md:40`: explicitly states `fgos-process` does **not** own subreaper (*"The other gate primitives (subreaper, a new PID namespace, the tty foreground group) ...: the run supervisor"*), and `packages/run-supervisor/rust/src/gate/unix.rs:81` already sets `PR_SET_CHILD_SUBREAPER` inside the gate process itself.
- **What goes wrong and when:**
  1. On any Linux host where `bwrap` user/PID namespaces are unavailable, `containment::select` picks `LinuxPgroup` (`linux.rs:32`). The first `GitDriver` call through the in-process N-API addon permanently mutates the **Node process** into a `PR_SET_CHILD_SUBREAPER`. Because Node/libuv only `waitpid`s direct children it spawned (never `waitpid(-1)`), every orphaned grandchild of the Node process is reparented to Node instead of PID 1 and remains an unreaped zombie for the lifetime of the Node process.
  2. For `LinuxPgroup` containment itself (when the spawned leader is not `fgos internal gate`), making the **parent** of `leader` the subreaper means that whenever an intermediate child under `leader` exits, its children are reparented to the caller (`ppid == std::process::id()`), above `leader.pid.0`. Because `members(leader.pid.0, true, ...)` only walks descendants of `leader.pid.0`, any child reparented to the caller that also called `setsid` becomes invisible to `remember_tree`, `pgroup_state`, and `pgroup_kill` even while `leader` is still alive.
- **Fix shape:** Remove `become_subreaper()` from the parent in `LinuxPgroup::spawn_in` (`packages/process/rust/src/containment/linux.rs:243,476-482`); if subreaper is kept in `LinuxPgroup`, call `libc::prctl(libc::PR_SET_CHILD_SUBREAPER, 1, 0, 0, 0)` inside `cmd.pre_exec` (`:249-253`) on the domain leader (`child`) so orphans reparent to `leader.pid.0` while `leader` lives and the calling process is never mutated. Replaces `become_subreaper()` (−7 lines).

### RT-M2 — `pgroup_state`, `pgroup_kill`, `tree_state`, `tree_kill`, and `live_rows` collapse `Verdict::Unknown` and `/proc` read errors to `DomainState::Empty` / `KillOutcome::Ok`

- **Axis / Severity / Status:** A, B, F | **High** | **reproduced** (deterministic from code and contract; reproduce with a unit test in `packages/process/rust/src/containment/linux.rs` passing a dead `leader` and `seen = vec![ProcTuple { host: "other-host".into(), ..leader.clone() }]` to `pgroup_state(&leader, &seen)`, which returns `DomainState::Empty` instead of `DomainState::Unknown`).
- **Evidence (`file:line`):**
  - `packages/process/rust/src/containment/linux.rs:408-421` (`pgroup_state`) and `packages/process/rust/src/containment/macos.rs:175-188` (`tree_state`):
    ```rust
    if seen.iter().any(|tuple| tuple != leader && facts::judge_here(&tuple.to_record()) == Verdict::Alive) {
        return DomainState::NotEmpty;
    }
    DomainState::Empty
    ```
  - `packages/process/rust/src/containment/linux.rs:439-442` (`pgroup_kill`) and `packages/process/rust/src/containment/macos.rs:223-226` (`tree_kill`):
    ```rust
    for tuple in targets {
        if facts::judge_here(&tuple.to_record()) != Verdict::Alive {
            continue;
        }
    ```
  - `packages/process/rust/src/containment/linux.rs:328-338` (`live_rows`): `let Ok(entries) = fs::read_dir("/proc") else { return Vec::new(); };`.
  - Violates `packages/process/contracts/containment.port.v1.json:39` and `docs/platform/process/spec.md:128` (*"unknown is never treated as empty by a caller"*).
- **What goes wrong and when:**
  1. When `leader` is `Verdict::Dead`, if any remembered descendant in `domain.seen` judges as `Verdict::Unknown` (e.g. `Observed::Unreadable(Permission | DriverMissing | Timeout)`), `judge_here(...) == Verdict::Alive` is `false`, so `pgroup_state` and `tree_state` return `DomainState::Empty`.
  2. In `pgroup_kill` and `tree_kill`, a target in `seen` that judges `Verdict::Unknown` is skipped by `!= Verdict::Alive` without setting `refused = true`; the post-check `pgroup_state(leader, seen) == DomainState::Empty` then succeeds, returning `KillOutcome::Ok` while an unverified domain member may still be running.
  3. If `fs::read_dir("/proc")` fails in `live_rows()` (e.g. `EMFILE`/`ENFILE`), it returns `Vec::new()`, causing `members()` to return `[]` and `pgroup_state` to report `DomainState::Empty`.
- **Fix shape:** In `pgroup_state` (`linux.rs:417-420`) and `tree_state` (`macos.rs:184-187`), fold `seen` verdicts so any `Verdict::Alive` returns `DomainState::NotEmpty`, any `Verdict::Unknown` (or `/proc` open failure in `live_rows`) returns `DomainState::Unknown`, and only all-`Verdict::Dead` returns `DomainState::Empty`. In `pgroup_kill` (`linux.rs:440`) and `tree_kill` (`macos.rs:224`), set `refused = true` when a target judges `Verdict::Unknown`. Replaces the `== Verdict::Alive` checks in `linux.rs` and `macos.rs`.

### RT-M3 — `lock-fence.mjs` treats `null === null` when `/proc/<pid>/stat` is missing or unreadable as a matching `startTime`, signalling without identity proof and hanging `fenceHotRecord` for 8s before throwing `lock-fence-still-held` on an already-dead process

- **Axis / Severity / Status:** A, B | **High** | **reproduced** (verified in `src/runner/lock-fence.mjs:48-57,67-87,137,175-192`).
- **Evidence (`file:line`):**
  - `src/runner/lock-fence.mjs:48-57`: `startTimeOf(pid)` returns `null` when `/proc/<pid>/stat` throws (`ENOENT`, `EACCES`, or off Linux).
  - `src/runner/lock-fence.mjs:67-69`: `identityOf(pid)` returns `{ pid, startTime: startTimeOf(pid), cmdline: cmdlineOf(pid) }`.
  - `src/runner/lock-fence.mjs:72-76`:
    ```js
    function signalByIdentity(holder, signal) {
      if (startTimeOf(holder.pid) !== holder.startTime) return false;
      try {
        process.kill(holder.pid, signal);
        return true;
      }
    ```
  - `src/runner/lock-fence.mjs:175-192` (`fenceHotRecord`):
    ```js
    const verdict = seen.state === 'ok' ? judgeHotRecord(seen.record, fgosDir) : 'unreadable';
    if (verdict === 'alive') {
      const holder = identityOf(seen.record.pid);
      ...
      if (!(await confirm(holders))) ...
      terminated = holders.filter((h) => signalByIdentity(h, 'SIGTERM')).map((h) => h.pid);
      let left = holders.filter((h) => startTimeOf(h.pid) === h.startTime);
      for (const deadline = Date.now() + TERM_WAIT_MS; left.length > 0 && Date.now() < deadline; left = left.filter((h) => startTimeOf(h.pid) === h.startTime)) await sleep(POLL_MS);
      killed = left.filter((h) => signalByIdentity(h, 'SIGKILL')).map((h) => h.pid);
    ```
- **What goes wrong and when:**
  1. `fenceHotRecord` (`:177`) ignores `seen.record.startTime` and instead calls `identityOf(seen.record.pid)`, re-reading `/proc/<pid>/stat` without verifying it still matches `seen.record.startTime`.
  2. If the holder process exits between line 175 (`judgeHotRecord`) and line 177 (`identityOf`), `holder.startTime` is captured as `null`.
  3. At line 185 (`signalByIdentity`), `startTimeOf(holder.pid) !== holder.startTime` evaluates `null !== null` (`false`) and calls `process.kill(holder.pid, 'SIGTERM')` with no identity protection (if the PID was reused by a process whose `/proc/<pid>/stat` is unreadable, it signals that process).
  4. At lines 186–192, while `h.pid` remains dead (`ENOENT`), `startTimeOf(h.pid)` is `null` and `h.startTime` is `null`, so `startTimeOf(h.pid) === h.startTime` evaluates `null === null` (`true`)! `fenceHotRecord` spins for the full `TERM_WAIT_MS` (5,000 ms), sends `SIGKILL` to `h.pid` at `:188` (after a 5-second PID-reuse window!), spins for the full `KILL_WAIT_MS` (3,000 ms), and then throws `lock-fence-still-held` for a process that was already dead before the first signal!
- **Fix shape:** Delete `startTimeOf`, `cmdlineOf`, `identityOf`, and `signalByIdentity` in `src/runner/lock-fence.mjs:48-87`. In `fenceHotRecord`, use `seen.record` (the tuple from disk) directly with the T0 door's `signalByIdentity(seen.record, sig)` and poll `judge(seen.record) === 'alive'`. In `fenceLock`, obtain full `ProcTuple`s via `observe`/`identity_of` before `confirm`, refuse with `lock-fence-identity-unknown` if any holder lacks a readable tuple, and signal/poll via `signalByIdentity` and `judge`.

### RT-M4 — `gateway-control.mjs` `startGateway` fast-exit check is dead code on Unix because `pidExists` (`kill(pid, 0)`) returns `true` on an unreaped zombie during `sleepSync`, and `stopGateway` stalls 10s on zombies and deletes `gateway.json` even if the process survives `SIGKILL`

- **Axis / Severity / Status:** A, B, C | **High** | **reproduced** (ran `stopGateway` in `node -e` against a spawned child that exited on `SIGTERM`: `stopGateway` took `10.16 s` — `5000 ms` `SIGTERM` wait + `5000 ms` `SIGKILL` wait — because `waitUntilDeadOrDeadline` at `:67` polls `pidExists(pid)`, which returns `true` while `/proc/<pid>/stat` is in state `Z`).
- **Evidence (`file:line`):**
  - `src/runner/gateway-control.mjs:66-72`: `waitUntilDeadOrDeadline(pid, deadline)` loops `while (pidExists(pid))`.
  - `src/runner/gateway-control.mjs:210-259`: `startGateway` spawns `fgos-gateway` with `{ detached: true }` (which calls `setsid()` in the child; the child is still a direct child `ppid == process.pid` of the calling Node process) and immediately enters a synchronous `for (;;) { if (!pidExists(child.pid)) { ... } ... sleepSync(STARTUP_POLL_MS); }` loop (`:238-259`).
  - `src/runner/gateway-control.mjs:305-315`: `stopGateway` calls `waitUntilDeadOrDeadline(entry.pid, Date.now() + STOP_TIMEOUT_MS)` after `SIGTERM` and again after `SIGKILL`, ignores the `false` return at `:311`, and unconditionally calls `writeRegistry(fgosDir, null)` at `:314`.
- **What goes wrong and when:**
  1. In `startGateway` (`:238-259`), while the Node process is blocked inside the synchronous `sleepSync` loop, the Node event loop cannot run libuv's `SIGCHLD` `waitpid` handler. If `fgos-gateway` panics or exits immediately on startup (e.g. missing `gateway.token` or port in use), it becomes a zombie (`Z`). Because `pidExists(child.pid)` (`process.kill(child.pid, 0)`) returns `true` for a zombie on Linux and macOS, `if (!pidExists(child.pid))` at `:239` **never fires on Unix**: every immediate startup crash stalls for the full `STARTUP_TIMEOUT_MS` (15,000 ms) and throws the timeout error (`:256`) without the log tail (`:242-246`).
  2. In `stopGateway` (`:67,305-315`), if the gateway process is a zombie or its PID is reused while waiting, `waitUntilDeadOrDeadline` stalls for `2 * STOP_TIMEOUT_MS` (10,000 ms); and if the gateway process genuinely survives `SIGKILL` (e.g. `EPERM` or uninterruptible sleep), line 314 deletes `gateway.json` anyway and returns `{ alreadyStopped: false }`, stranding a live gateway with no registry.
  3. Speed seat (`council-261021-1324-harden-t0-seat-speed.md:53,189`) explicitly proposed **keeping `pidExists`** in `process-identity.mjs` for `gateway-control.mjs:66-72`, which keeps this bug alive.
- **Fix shape:** Do not keep `pidExists` for `gateway-control.mjs`. Capture the spawned child's `ProcTuple` via the T0 door right after `spawn`; in both `startGateway` (`:239`) and `waitUntilDeadOrDeadline` (`:67`), check `judge(tuple) === 'alive'` (which immediately reports `'dead'` for state `'Z'` and for a reused PID); in `stopGateway` (`:311-315`), throw a `GatewayControlError` and keep `gateway.json` if `judge(tuple)` is still `'alive'` after the `SIGKILL` deadline.

### RT-M5 — All three seats missed `provider-capacity.mjs:578-580,642-645`, `direct-launch.mjs:130-138`, and `cancel-registry.mjs:75-83` when proposing to delete `getBootId`, `getPidNs`, `getProcessStartTime`, `pidExists`, and `resolveHolderLiveness`

- **Axis / Severity / Status:** A, E, F | **High** | **reproduced** (verified by `rg "process-identity\.mjs" src test` and cross-checking `packages/run-supervisor/rust/src/{adopt.rs:257,gate.rs:206,supervise.rs:194,supervise/terminal.rs:306-313}`).
- **Evidence (`file:line`):**
  - `src/runner/dispatch/provider-capacity.mjs:11,578-580,642-645`: imports `{ getProcessStartTime, pidExists, resolveHolderLiveness }`; `:579` calls `resolveHolderLiveness({ pid: lease.pid, processStartTime: lease.processStartTime }, pidExists(lease.pid))`; `:643` writes `processStartTime: getProcessStartTime(process.pid)`.
  - `src/run-supervisor/direct-launch.mjs:17,130-138`: imports `{ getBootId }`; `boottimeNow()` (`:131`) writes `{ bootId: getBootId(), boottimeNs }` into `createdAt`, `deadlines.softAt`, and `deadlines.hardCeiling` of `envelope.json`.
  - `packages/run-supervisor/rust/src/supervise.rs:194`, `packages/run-supervisor/rust/src/gate.rs:206`, `packages/run-supervisor/rust/src/adopt.rs:257`: all three require `bootId` in `softAt`, `hardCeiling`, and `createdAt` to be a JSON string (`.as_str()` returns `Some(...)`), otherwise `soft_at` is `None`, `ceiling` is `None`, and `still_starting` returns `false`.
  - `src/run-supervisor/cancel-registry.mjs:16,75-83`: imports `{ getBootId, getPidNs, getProcessStartTime }`; `selfTuple()` at `:79` writes `pidNs: process.platform === 'linux' ? (/\[(\d+)\]/.exec(getPidNs())?.[1] ?? '') : ''`.
- **What goes wrong and when:**
  1. **Unmigrated §A site (`provider-capacity.mjs:579,643`):** Phase 01 §A mentioned `provider-capacity.mjs:11` only in the prose importer list (`:59`), not in the 14-row table, so all three seats omitted it from their migration tables. On Windows, `getProcessStartTime(process.pid)` at `:643` writes `null`, so every account lease on Windows lacks a `startTime` and stays `'held'` (`unknown`) while any process reuses that PID.
  2. **Silent disabling of Windows deadlines and startup grace (`direct-launch.mjs:131`):** In `process-identity.mjs:27-33`, `getBootId()` returns the string `'unknown-boot'` on Windows. In Rust `fgos-process`, `Windows::boot_id()` (`packages/process/rust/src/platform/windows.rs:114-116`) returns `None`, and `Record::to_json()` (`facts.rs:122-124`) omits `"bootId"` when `None`. Deleting `getBootId()` and replacing it with `selfRecord().bootId` makes `bootId` `undefined` on Windows, causing `supervise.rs:194`, `gate.rs:206`, and `adopt.rs:257` to silently drop `soft_at`, `ceiling`, and `still_starting` startup grace on Windows!
  3. **Malformed `pidNs` in `cancel-registry.mjs:79`:** `cancel-registry.mjs:79` strips `"pid:[4026531836]"` to `"4026531836"` (and `""` off Linux), whereas `packages/run-supervisor/rust/src/supervise/terminal.rs:306-313` (`tuple_of`) and `fgos-process` compare `pid_ns` against `"pid:[4026531836]"` on Linux and `"none"` off Linux.
- **Fix shape:** Include `provider-capacity.mjs:578-580,642-645`, `cancel-registry.mjs:75-83`, `direct-launch.mjs:130-138`, and `run-lock.mjs:51-59` (`buildRunControlHolder`) in the T0 door migration: mint full tuples via `selfRecord()`, judge leases via `resolveHolderLiveness(lease)` through the door, and in `direct-launch.mjs:131` write `bootId: selfRecord().bootId ?? 'unknown-boot'`.

### RT-M6 — `process-identity.mjs:98-106` (`observeProcess`) misclassifies a process exiting between `pidExists(pid)` and `readFileSync('/proc/<pid>/stat')` as `unreadable` (`unknown` / `held`) instead of `absent` (`dead`)

- **Axis / Severity / Status:** A, F | **Medium** | **reproduced** (`observeProcess(999999999, true)` in `test/process/process-facts-vectors.test.mjs:124` executes this exact path and returns `{ kind: 'unreadable', cause: 'permission' }`, so `resolveHolderLiveness` returns `'held'`).
- **Evidence (`file:line`):** `src/runner/dispatch/process-identity.mjs:98-106` vs `packages/process/rust/src/platform/linux.rs:48-61`; falsifies Simplicity seat's claim (`council-261021-1324-harden-t0-seat-simplicity.md:244`) that the Node leaf and Rust judge agree on every edge rule.
- **What goes wrong and when:** `Linux::observe` (`platform/linux.rs:48-61`) reads `/proc/<pid>/stat` first and only calls `pid_exists(raw)` (`kill(pid, 0)`) when `read_to_string` returns `ErrorKind::NotFound`. `observeProcess` (`process-identity.mjs:98-106`) calls `pidExists(pid)` first and then `fs.readFileSync('/proc/${pid}/stat')`, catching **every** error (including `ENOENT` when the process exited between the two syscalls) as `{ kind: 'unreadable', cause: 'permission' }` (`judge` -> `'unknown'`, `resolveHolderLiveness` -> `'held'`).
- **Fix shape:** Eliminated when `process-identity.mjs` routes `observe` and `judge` to Rust `fgos-process`; retire `test/process/process-facts-vectors.test.mjs:121-125` and `test/runner/process-identity.test.mjs:57-64` (which pinned the Node-only `isAlive=true` + `ENOENT` -> `unreadable` bug).

### RT-M7 — `durable-file::install_once` runs a redundant ~5.1 ms directory `fsync` on `AlreadyExists`, and `durable-file`'s retained `.durable-file-<pid>-<seq>.tmp` on pre-install errors corrupts `provider-credential-renewal.mjs:721-734` (`treeDigest`)

- **Axis / Severity / Status:** A, C | **Medium** | **reproduced** (source inspection at `packages/durable-file/rust/src/lib.rs:218-295` and `src/runner/dispatch/provider-credential-renewal.mjs:105-120,721-750`).
- **Evidence (`file:line`):**
  - `packages/durable-file/rust/src/lib.rs:256-295`: when `!replace` (`install_once`) and `install_name` returns `ErrorKind::AlreadyExists`, `installed` is `Installed::AlreadyExists`; after `fs::remove_file(&temporary)` at `:276`, execution falls through to `sync_directories(&dirs)` at `:285`.
  - `packages/durable-file/rust/src/lib.rs:218-253`: on any `write_all` or `file.sync_all()` error (e.g. `ENOSPC`, `EIO`), `durable-file` intentionally leaves `.durable-file-<pid>-<seq>.tmp` on disk (`temporary: Some(temporary.clone())`).
  - `src/runner/dispatch/provider-credential-renewal.mjs:105-120,721-750`: `writeFileAtomic` (`:117`) removes `tmp` on error, and `treeDigest(dir)` (`:721-734`) hashes every file in a credential store directory (ignoring only `-shm` at `:728`, not `.durable-file-*.tmp`).
- **What goes wrong and when:**
  1. Every contender that loses an `install_once` race (`run-lock.mjs:227`, `proof-helpers.mjs:99`) pays an extra ~5.1 ms directory `fsync` even though it did not install `target` and already unlinked its temp file.
  2. All three seats propose moving `provider-credential-renewal.mjs:105-120` (`writeFileAtomic`) onto `durable-file::replace_durably`. If `write_durably` fails pre-rename and leaves `.durable-file-<pid>-<seq>.tmp` behind inside a credential copy directory, `treeDigest` (`:721-734`) includes `.durable-file-<pid>-<seq>.tmp` in the SHA-256 digest, so `kept().has(digest)` (`:749`) returns `false` and `sweepOneStaging` cannot reap already-kept staging copies (or leaves `.durable-file-*.tmp` inside the user's live home store).
- **Fix shape:** (1) In `packages/durable-file/rust/src/lib.rs:283`, skip `sync_directories` when `installed == Installed::AlreadyExists`. (2) In the Node `replaceDurably` wrapper (or `provider-credential-renewal.mjs:105`), unlink `err.temporary` on pre-install failure when the caller does not inspect `err.temporary`, and ignore `.durable-file-*.tmp` alongside `-shm` in `treeDigest` (`provider-credential-renewal.mjs:728`).

### RT-M8 — `packages/process/rust/src/mapped.rs:237` (`posix::program`) calls `std::env::current_dir()?` unconditionally, failing when the parent's ambient `cwd` was removed even when `request.cwd` is `Some(abs_path)`

- **Axis / Severity / Status:** B | **Low** | **reproduced** (`packages/process/rust/src/mapped.rs:237-241`).
- **Evidence (`file:line`):** `packages/process/rust/src/mapped.rs:237-238`: `let cwd = std::env::current_dir()?; let cwd = request.cwd.as_ref().map_or(cwd.clone(), |p| cwd.join(p));`.
- **What goes wrong and when:** When `request.cwd` is `Some(abs_path)` (or all `PATH` entries are absolute), `cwd.join(p)` discards the parent's `cwd`, yet line 237 still calls `std::env::current_dir()?` first and fails with `ENOENT` if the parent process's ambient `cwd` (e.g. a deleted worktree) no longer exists.
- **Fix shape:** If `request.cwd` is `Some(p)` and `p.is_absolute()`, use `p.clone()` directly without calling `std::env::current_dir()`. Replaces `:237-238` (0 net lines).

---

## Verdict on each High finding

### 1. Correctness `F-A1` (`gateway stop` can signal an unrelated reused PID — `src/runner/gateway-control.mjs:225-231,287-315`)

- **Verdict:** **VERIFIED (and now REPRODUCED by red-team; Correctness seat's report violated the brief's evidence rule by leaving it `inferred` at High, and missed the `startGateway` / zombie / unconditional-unlink bugs at the same site).**
- **Evidence on `main` (`1477ff770`):**
  - Correctness (`council-261021-1324-harden-t0-seat-correctness.md:49`) rated `F-A1` **High, inferred**, violating `council-261021-1324-harden-t0-council-brief.md:46` (*"inferred findings cannot be rated above Medium until reproduced"*).
  - Red-team reproduced `F-A1` with a read-only `node -e` command against `src/runner/gateway-control.mjs:280-318`: spawning an unrelated child process, writing its PID with `startedAt: "1999-01-01T00:00:00.000Z"` into a temporary `gateway.json`, and calling `stopGateway(fgosDir)` delivered `SIGTERM` to the unrelated process and killed it.
  - Correctness also missed that `startGateway` (`gateway-control.mjs:177`) uses `pidExists(existing.pid)` (refusing `gateway start` when an old gateway's PID was reused by an unrelated process) and missed `RT-M4` (`:67,239,311-314`).

### 2. Correctness `F-A3` (directory cleanup has an unbounded PID-reuse kill window — `src/runner/dispatch/stop-processes-inside.mjs:33-52,60-72`)

- **Verdict:** **VERIFIED on the 1.5-second bare-PID `SIGKILL` window (`:61-72`); FALSIFIED on the claim (`:65`) that migration changes what "self/parent" means via a host-route scan.**
- **Evidence on `main` (`1477ff770`):**
  - `src/runner/dispatch/stop-processes-inside.mjs:33-53` (`processesInside`) returns bare numeric PIDs; `:64` sends `process.kill(pid, 'SIGTERM')`; `:67` sleeps up to `graceMs = 1500` ms while polling `alive(pid)` (`process.kill(pid, 0)`); `:70` sends `process.kill(pid, 'SIGKILL')` by bare PID. If one scanned process exits on `SIGTERM` while another keeps the loop waiting up to 1.5s, any process that reuses the first PID in that window satisfies `alive(pid) === true` at `:69` and receives `SIGKILL` at `:70`.
  - However, Correctness (`:65`) claimed *"A host-route scan also changes what 'self/parent' means, so the present implicit exclusion cannot survive migration unchanged."* Under the owner's 12:05 decision (`council-261021-1324-harden-t0-council-brief.md:22`), Node calls `fgos-process` **in-process via N-API**, not via a host-route subprocess. Inside `facts::scan` (`packages/process/rust/src/platform/linux.rs:148`), `std::process::id()` is the calling Node process's own `process.pid`. Passing `excludePids: [process.pid, process.ppid]` to the Node filter over `scan` views preserves the exact exclusion contract without a host-route parent shift.

### 3. Simplicity `S-E1` (Liveness judged nine ways by `kill(pid, 0)` — `src/runner/dispatch/process-identity.mjs:69-77`, etc.)

- **Verdict:** **VERIFIED on the duplication and need for one door; PARTIALLY FALSIFIED on the site count (missed `provider-capacity.mjs:579`) and on what `docs/platform/process/spec.md:73` actually said.**
- **Evidence on `main` (`1477ff770`):**
  - Simplicity (`council-261021-1324-harden-t0-seat-simplicity.md:129`) lists 10 `process.kill(..., 0)` calls across 7 files (`process-identity.mjs:72`, `run-lock.mjs:37`, `hold-transport.mjs:53`, `fences.mjs:100`, `stop-processes-inside.mjs:22`, `provider-credential-renewal.mjs:707`, `registrations.mjs:5510,6021,6063,6116`), but missed `src/runner/dispatch/provider-capacity.mjs:579` (which calls `pidExists(lease.pid)` and injects it into `resolveHolderLiveness`).
  - Simplicity claimed `docs/platform/process/spec.md:73` said these copies were deleted for the tuple judge; in fact `process/spec.md:73` explicitly prescribed `pidExists(pid)` (`process.kill(pid, 0)`) as the helper for cutover phases. That spec sentence itself is what must be superseded in `process/spec.md` §3 and §8.

### 4. Speed `S6` (`durable-file` costs 10.3 ms per write; no-fsync sites must not move to it — `packages/durable-file/rust/src/lib.rs:169-296`)

- **Verdict:** **FALSIFIED as a High finding against current `main` (it is the Q2 migration boundary, not a bug in current code), and Speed's claim (`:98`) that "nothing in the crate is wasted" is FALSIFIED by `RT-M7`.**
- **Evidence on `main` (`1477ff770`):**
  - None of the 14 no-fsync Node sites call `durable-file` on `main` today; rating a hypothetical mis-migration as a "High reproduced finding" against current code violates `proposal-261021-0851-harden-review-criteria-and-method.md:28-52`.
  - Conversely, inside `packages/durable-file/rust/src/lib.rs:262,285`, `install_once` (`replace = false`) **does** waste a full ~5.1 ms directory `fsync` when `install_name` returns `AlreadyExists` (`RT-M7`).

### 5. Verdict on Part A target shapes across the three seats

| Component | Verdict on the seats' Part A target shapes |
|---|---|
| `fgos-process` + Containment port | **Simplicity + Correctness loader boundary wins over Speed (`RT-M4`, `test/runner/dispatch-reconciliation-import-graph.test.mjs:192-255`), with 6 exports on `process-identity.mjs` (`judge`, `observe`, `selfRecord`, `signalByIdentity`, `scan`, `resolveHolderLiveness`).** Speed's proposal (`:53,107,189`) to load T0 through `src/git/native.mjs` and keep `pidExists` fails `dispatch-reconciliation-import-graph.test.mjs:255` (which bans `native-handover.mjs` from `reconcile`'s closure) and preserves the zombie stall in `gateway-control.mjs:67,239` (`RT-M4`). Correctness's proposal (`:10`) to expose `containment::{create,spawnIn,guarantee}`, `domainIsEmpty`, and `domainKillAll` on N-API has 0 Node callers and violates RUL104. Simplicity's 5-export list (`:22`) forgot `scan`, which its own row `:162` (`stop-processes-inside.mjs`) requires. |
| `host-runtime` | **Correctness + Simplicity (`T0 Δ = 0`, Node budget `0`, hand off `external_process` / `EchoProvider` / `CallerAdmission` to T9) win over Speed (`:63-65`).** Speed's T0 deletion of `EchoProvider` (`#[cfg(test)]`) and `test.fixture.echo` from `CATALOG` breaks compilation of `packages/host-runtime/rust/tests/two_projectors.rs:10` and breaks 40+ tests in `host-runtime`, and editing `apps/fgos/src/main.rs:105,225` violates the Phase-01 SEAT constraint (`phase-01:181`). |
| `canonical-json` | **Correctness + Simplicity (expose `canonical_json` on the T0 N-API addon; 1 re-export in Node; keep `trust-store.mjs:379` `sortedJson` separate) win over Speed (`:73-74`).** Speed's `11.6 µs` N-API floor measurement (`:24,73`) measured `addon.versions()`, which runs `serde_json::from_str` on `envelope.v4.schema.json` on every call (`packages/git/node-addon/src/lib.rs:22-25`), not the N-API call floor. Keeping a second JS implementation violates Design Principle 7 and the owner's 10:01 Rust-authority rule. |
| `durable-file` | **Correctness + Speed (move only the 5 `replace-durable` and 4 `create-only` durable sites; keep no-fsync helpers in place in Node with `uniqueTmpTag`) win over Simplicity (`:64,177`).** Simplicity's new `src/util/write-atomic.mjs` module and `.durable-file-*` temp-name prefix for non-durable writes add a new file/mechanism (RUL104), touch SEAT/GIT shared files (`run.mjs:51`, `unit-summary.mjs:196`, `worktree.mjs:236`), and conflate non-durable temp files with `durable-file`'s diagnostic retained crash files. |

---

## Disagreements and verdicts

### 1. `canonical-json`: N-API binding call (Correctness `:31`, Simplicity `:48-50`) vs keeping a 13-line Node leaf (Speed `:73,115,201`)

- **Seats' positions:** Correctness and Simplicity expose `canonicalJson` from the Rust `fgos-canonical-json` crate via the T0 N-API addon (`<= 20 LOC` / `1 re-export` in Node). Speed keeps a 13-line JS implementation in `src/runner/dispatch/proof-helpers.mjs:11-23`, arguing that its measured `addon.versions()` N-API call (`11.6 µs`) is slower than small-object JS serialization (`2.0 µs`).
- **Verdict:** **Evidence supports Correctness + Simplicity (N-API binding to `fgos-canonical-json`), gated by the persisted-corpus byte-equality check (`phase-01:110`), while keeping `trust-store.mjs:379-385` (`sortedJson`) untouched (Simplicity `:52,173`).**
- **Why:**
  1. **Speed's `11.6 µs` N-API floor is an artifact of `addon.versions()`:** In `packages/git/node-addon/src/lib.rs:17-30`, `versions()` executes `serde_json::from_str(include_str!("../../../event-store/contracts/envelope.v4.schema.json"))` on **every invocation** (`:22-25`) and builds a nested JSON object. A string-returning N-API function does not parse a JSON schema per call, and for 200-key objects Rust is already 3.5–11× faster (`14.7–49 µs` vs `171–181 µs`, `research-261021-1210-harden-t0-baseline.md:36-38`). All Node callers of `canonicalJson` are cold (once per run/proof/plan).
  2. **One authority (Principle 7, owner 10:01):** `proof-helpers.mjs:11-23` does **not** match `fgos-canonical-json` on non-JSON values (`proof-helpers.mjs:16` turns sparse array holes `[,1]` into `[undefined,1]` and `NaN`/`Infinity` into `null`, whereas `packages/canonical-json/rust/src/lib.rs:28-34` refuses `NonFiniteNumber`).
  3. **`trust-store.mjs:379-385` (`sortedJson`):** Speed (`:74,201`) wrongly puts `sortedJson` on the delete list; Simplicity (`:52,173,243`) rightly keeps it because `codexHookTrustHash` (`trust-store.mjs:388-394`) must match external OpenAI Codex CLI's `BTreeMap` + `serde_json::to_string` (`codex-rs/hooks/src/engine/discovery.rs`), which is UTF-8 byte order, not RFC 8785 UTF-16 code-unit order.

### 2. Deleting vs keeping the `command-routes-drift` doctor row (`src/setup/registrations.mjs:5217-5255,5281-5285`)

- **Seats' positions:** Correctness (`:24,136`) and Simplicity (`:40,206`) keep `command-routes-drift` under T9 Host & Surface / Packaging. Speed (`:64,182,214,232`) deletes `command-routes-drift` in T0, arguing `test/rust-host/command-routes.test.mjs` already proves it and the row spawns `node scripts/export-command-selectors.mjs --check` (`150–250 ms`).
- **Verdict:** **Evidence supports Correctness + Simplicity (keep `command-routes-drift` in T0; hand off to T9/Packaging).**
- **Why:**
  1. Deleting `command-routes-drift` breaks `test/setup/checks.test.mjs:184` and `test/rust-host/release-tree.test.mjs:317` (which Speed did not list in its test updates) and contradicts `docs/specs/distribution.md:77`, `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md:133`, and `docs/how-to/install-fgos-in-a-project-and-use-doctor.md:220`.
  2. `command-routes-drift` is a T9/Packaging check (`phase-01:121`), and if its 150–250 ms spawn cost in a source checkout is unwanted, T9 can call the already-exported `checkCommandRoutes()` from `scripts/export-command-selectors.mjs:15` in-process (~1 ms) without losing the doctor condition during local development.

### 3. `host-runtime` as T9: Zero T0 deletions (Correctness `:22-25`, Simplicity `:38-42`) vs Deleting `providers/external_process/**` and `EchoProvider` in T0 (Speed `:63-65,97,211-212`)

- **Seats' positions:** All three seats agree `host-runtime`'s router, admission/grant gates, `InvocationService`, and `providers/*` are T9 Host & Surface concerns while `civil_time.rs` (262 LOC) is a T0 primitive. However, Speed puts deleting `providers/external_process/**` and `EchoProvider`/`test.fixture.echo` (−4,800 lines) into T0's Part A delete list and size target, whereas Correctness and Simplicity keep T0's `host-runtime` Δ at `0` and hand those candidates to Phase 07 (T9).
- **Verdict:** **Evidence supports Correctness + Simplicity (`T0 Δ = 0` for `host-runtime`; hand `external_process` and `EchoProvider` to T9 / owner pick).**
- **Why:**
  1. Speed's proposed T0 edit to `apps/fgos/src/main.rs:105,225` violates the explicit Phase-01 SEAT constraint (`phase-01:181`: *"any `apps/fgos/src/main.rs` route edit"* is on the SEAT carry list).
  2. Speed's proposed `#[cfg(test)]` on `EchoProvider` and removal of `test.fixture.echo` from `CATALOG` breaks `packages/host-runtime/rust/tests/two_projectors.rs:10` (integration tests compile the library without `cfg(test)`) and breaks 40+ tests across `registry.rs`, `operation_provider_router.rs`, `authority_gate.rs`, and `invocation_service.rs` (see Unsafe Deletions #4).
  3. Crediting a −4,800-line T9 deletion to T0 violates `plan.md:46,108-109` (per-layer size accounting).

### 4. Per-machine `bwrap` probe cache (Speed `:94,260`) vs lazy in-process probe at first `spawn_in`/`guarantee()` (Simplicity `S-E8`, `:136,237`)

- **Seats' positions:** Simplicity (`S-E8`, `:136`) proposes probing `bwrap` lazily at first `spawn_in` / `guarantee()` instead of inside `containment::select()` (`packages/process/rust/src/containment/linux.rs:26-33`). Speed (`S2`, `:29-31,94,260-261`) measured the probe at `1.77–2.12 ms` per process and proposes either a per-boot cache file in the state root (Proposed Addition #1) or an unprobed `SelectEnv` mode (Proposed Addition #2).
- **Verdict:** **Speed's measurements falsify Simplicity's `S-E8` lazy-probe claim, and Speed's unprobed `SelectEnv` idea is unsafe on hosts without user namespaces; only the per-boot probe cache (as an owner-picked Proposed Addition) or a T2 Git / OPC change is viable.**
- **Why:**
  1. **Why Simplicity `S-E8` fails:** `containment::select(env)` (`packages/process/rust/src/containment/linux.rs:26-33`) returns `Box<dyn ContainmentDriver>` — either `Box::new(BwrapPidns)` (`name() == "bwrap-pidns"`) or `Box::new(LinuxPgroup)` (`name() == "linux-pgroup"`). It **cannot** choose which struct to return without knowing `pidns_usable(&bwrap)`. Moreover, every caller that calls `containment::select` (`GitDriver::new` at `packages/git/rust/src/driver.rs:282`, `supervise` at `packages/run-supervisor/rust/src/supervise/unix.rs:146`, and `supervise --probe` at `packages/run-supervisor/rust/src/route.rs:108`) **immediately** calls `spawn_in` (`driver.rs:1194`) or `guarantee()` (`route.rs:108`) in the same process! Deferring the probe from `select()` to `spawn_in()`/`guarantee()` saves zero `bwrap` spawns.
  2. **Why Speed's unprobed `BwrapPidns::new` in `SelectEnv` fails:** If `GitDriver` constructed `BwrapPidns` without probing on a Linux machine where user namespaces are disabled, every `git` invocation in `GitDriver` (`driver.rs:1194`) would fail with `NamespaceUnavailable` instead of falling back to `LinuxPgroup`.
  3. Whether read-only `GitDriver` calls need `containment.spawn_in` (`+1.4 ms` per git call × 5–6 calls per CLI command) belongs to T2 Git / OPC, and a per-boot probe cache file is a new mechanism that stays in Proposed Additions for owner choice (RUL104).

### 5. `durable-file` for create-only sites (`phase-01 §B` row 4) and no-fsync consolidation (`phase-01 §B` row 2)

- **Seats' positions:**
  - On create-only sites: Correctness (`:113`) moves only sites where directory `fsync` is wanted; Simplicity (`:66,90`) moves 4 sites (`run-lock.mjs:227,252`, `proof-helpers.mjs:99`, `case-bindings.mjs:51,99`); Speed (`:83,90`) moves `run-lock.mjs:225,250`, `proof-helpers.mjs:86`, and `case-bindings.mjs:97` (`createPendingBinding`), leaving `case-bindings.mjs:51` (`ensureBindingsSentinel`).
  - On no-fsync sites: Simplicity (`:64,88,177`) creates a new shared helper `writeAtomic(file, bytes)` in `src/util/`; Correctness (`:111`) and Speed (`:82,203`) keep the existing per-module helpers in place.
- **Verdict:** **Evidence supports moving the 4 create-only durable sites (`run-lock.mjs:225-235`, `run-lock.mjs:250-261`, `proof-helpers.mjs:86-110`, `case-bindings.mjs:97-112`, plus `case-bindings.mjs:51` once `RT-M7` is fixed) onto `durable-file::install_once`, and supports Correctness + Speed (NO new `src/util/write-atomic.mjs` module) for the no-fsync class.**
- **Why:**
  1. All 4 create-only sites (`run-lock.mjs:225,250`, `proof-helpers.mjs:86`, `case-bindings.mjs:97`) **already call `fsyncSync(fd)` and `fsyncDir(dir)`** on `main` today (`run-lock.mjs:80,234,259`, `proof-helpers.mjs:94,108`, `case-bindings.mjs:106,110`), so they already pay the 10.3 ms durable cost! Moving them to `durable-file::install_once` adds zero fsync cost, fixes `F-A4` (swallowed directory-fsync errors in `run-lock.mjs:108-126` and `proof-helpers.mjs:73-84`), and fixes a partial-file visibility race in `case-bindings.mjs:99-105` (where `openSync(recordPath, 'wx')` creates an empty file at the final path before `writeSync` writes the JSON bytes, allowing a concurrent `readBinding` at `:82-86` to read a 0-byte file and return `binding-unsettled`).
  2. For the no-fsync class, Simplicity's `src/util/write-atomic.mjs` is a hidden addition with cross-lane and import-graph breakage (see Unsafe Deletions / Hidden Additions below).

### 6. `unknown -> held/keep` policy ownership and `fgos internal process-observe` route retirement

- **Seats' positions:**
  - Correctness (`:9,145`) puts `unknown -> held/keep` in each caller with per-caller tests; Simplicity (`:22,97`) and Speed (`:161,190`) keep `judge` three-valued (`alive | dead | unknown`) and provide one adapter (`resolveHolderLiveness` / `isProvenDead`) in `process-identity.mjs`.
  - Simplicity (`:81,187`) deletes `fgos internal process-observe` immediately with the N-API door; Speed (`:113,200`) keeps the host route for cold admin paths on `direct node bin/fgos.mjs` until every channel ships the addon.
- **Verdict:** **Keep `judge` three-valued AND keep the single `resolveHolderLiveness` (`isProvenDead`) adapter in `process-identity.mjs` (Simplicity + Speed); delete `fgos internal process-observe` once `native-addon.json` / the addon is staged across all supported channels (L10).**
- **Why:** All reclaim/cleanup sites in §A (#2, #7, #9, #11, #12, #13, plus `provider-capacity.mjs:579`) share the identical policy (`judge(record) === 'dead'`), and `resolveHolderLiveness` is on the SEAT carry list (`phase-01:178`). Meanwhile, `fgos internal process-observe` (`packages/holder-lock/rust/src/route.rs:477-505`) only ever served `hot-lock.mjs:60` on Windows (it never served `lock fence`, `gateway stop`, or `doctor`, contrary to Speed `:113`), so once `hot-lock.mjs` uses the in-process N-API binding on Windows, `process-observe` has zero callers on any channel and must be deleted under L10.

---

## Unsafe deletions or hidden additions

### Unsafe deletions in the seat reports

1. **Deleting `getBootId`, `getPidNs`, `getProcessStartTime`, `pidExists`, and `resolveHolderLiveness` from `src/runner/dispatch/process-identity.mjs` without migrating unlisted production and test importers (All 3 seats: Correctness `:13`, Simplicity `:22,24`, Speed `:52-54,188`)**
   - **Missed production callers:** `src/runner/dispatch/provider-capacity.mjs:11,579,643`, `src/run-supervisor/direct-launch.mjs:17,131` (needs `'unknown-boot'` fallback when `bootId` is `null`/`undefined` so `supervise.rs:194`, `gate.rs:206`, and `adopt.rs:257` do not drop deadlines/grace on Windows; `RT-M5`), `src/run-supervisor/cancel-registry.mjs:16,78-81`, and `src/runner/dispatch/run-lock.mjs:28,51-59` (`buildRunControlHolder`).
   - **Missed test callers:** `test/cli/fgos-lock-fence.test.mjs:214`, `test/run-supervisor/legacy-sweep.test.mjs:12`, `test/runner/provider-capacity.test.mjs:29`, `test/setup/holder-lock-checks.test.mjs:33`, and `test/setup/lock-record-checks.test.mjs:11`.
   - **Required fix:** Migrate those 4 production modules and 5 test files onto `selfRecord()` / `observe()` / `resolveHolderLiveness()` in the same change (L10), and keep `resolveHolderLiveness` exported from `process-identity.mjs` (and re-exported from `run-lock.mjs:69` for `assignment-runner.mjs:75,82,823`).

2. **Deleting the entire `test/setup/doctor-coordination-checks.test.mjs` file when deleting `coordination-abandoned-claims` (Speed `:56`, Correctness `:151`)**
   - **Evidence:** `test/setup/doctor-coordination-checks.test.mjs:16-45` tests `runner-coordination-orgPolicy-shape` (`src/setup/registrations.mjs:5916-5988`), a live doctor check and `--fix` registration that is **not** being deleted. Only lines `47-115` of `test/setup/doctor-coordination-checks.test.mjs` test `coordination-abandoned-claims`. Deleting the whole file removes the sole owning proof of `runner-coordination-orgPolicy-shape` (violating Design Principle 8 / Gate 4). In addition, deleting `coordination-abandoned-claims` from `registrations.mjs:5990-6145` requires removing `'coordination-abandoned-claims'` from `test/setup/checks.test.mjs:193`, `docs/specs/distribution.md:78`, `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md:133,135`, and `docs/how-to/install-fgos-in-a-project-and-use-doctor.md:331`.

3. **Deleting `command-routes-drift` from `src/setup/registrations.mjs:5217-5255,5281-5285` (Speed `:64,182,214,232`)**
   - **Evidence:** Breaks `test/setup/checks.test.mjs:184` and `test/rust-host/release-tree.test.mjs:317` (`R4: Doctor checks rust host packaging checks are registered and report the current target posture`), and removes a documented T9/Packaging check (`docs/specs/distribution.md:77`).

4. **Making `EchoProvider` `#[cfg(test)]` and deleting `test.fixture.echo` from `CATALOG` in `packages/host-runtime` (Speed `:63,97,212`)**
   - **Evidence:** `packages/host-runtime/rust/tests/two_projectors.rs:10` is an integration test target (`tests/`), which compiles `fgos-host-runtime` **without** `cfg(test)`. Gating `EchoProvider` / `ECHO_PROVIDER_DESCRIPTOR` behind `#[cfg(test)]` in `src/providers/builtin.rs` breaks compilation of `tests/two_projectors.rs`, and removing `test.fixture.echo` from `CATALOG` (`src/catalog.rs:62-72`) breaks `SNAPSHOT_FOR_TESTS` (`src/registry.rs:96`) and 40+ unit/integration tests across `operation_provider_router.rs`, `authority_gate.rs`, `invocation_service.rs`, and `tests/two_projectors.rs`.

5. **Deleting `sweepProcessGroup` (`src/holder-lock/index.mjs:451-459`) as a "legacy R4 fence" (Speed `:169,221`)**
   - **Evidence:** `src/holder-lock/driver.mjs:40-42` (`leftoverSweep`) returns `'group'` on macOS (`platform === 'linux' ? 'holders' : 'group'`) because `fgos internal lock-fd --drain-child` is Linux-only. `sweepProcessGroup` is the active macOS leftover sweep for `runBorrowed`, not a v1->v3 fence. It belongs to T1 (where it should be replaced by `Domain::MacosTree` / `domain_kill_all`, never deleted without replacement).

6. **Replacing `live_rows()` (`packages/process/rust/src/containment/linux.rs:328-338`) with `facts::relations()` (`packages/process/rust/src/platform/linux.rs:91-99`) without filtering zombies (Speed `S3`, `:95,216`)**
   - **Evidence:** `facts::relations()` and `facts::parse_relation()` (`facts.rs:455-464`) discard `state` (`fields.next()?`) and include zombies (`'Z'`, `'X'`), whereas `live_rows()` (`containment/linux.rs:336`) filters `row.state != 'Z' && row.state != 'X'`. Feeding unfiltered `relations()` into `members()` causes any unreaped zombie in the process group to keep `pgroup_state` (`:414`) `DomainState::NotEmpty` and causes `pgroup_kill` (`:425-461`) to fail with `KillOutcome::Refused`. If consolidated (Speed `S4` / Simplicity `S-E2`), `Relation` (or the shared stat parser) must preserve `state: char` and `members()` must filter `state != 'Z' && state != 'X'`.

7. **Deleting `facts::start_time` (`packages/process/rust/src/facts.rs:254-259`) without updating `packages/process/rust/tests/holders_multiprocess.rs:23` (Simplicity `S-D1`, `:145,190`; Speed `S10`, `:99,215`)**
   - **Evidence:** `packages/process/rust/tests/holders_multiprocess.rs:23` calls `facts::start_time(ProcId(std::process::id()))`. That call must be switched to `facts::self_identity().unwrap().start_time` in the same commit.

8. **Moving `provider-credential-renewal.mjs:105-120` (`writeFileAtomic`) to `durable-file::replace_durably` without unlinking `InstallError.temporary` and filtering `.durable-file-*.tmp` in `treeDigest` (`:721-734`) (All 3 seats)**
   - **Evidence:** See `RT-M7`. `writeFileAtomic` (`:117`) deletes its temp file on error; `durable-file` keeps `.durable-file-<pid>-<seq>.tmp` on pre-install error (`packages/durable-file/rust/src/lib.rs:27,225`), which corrupts `treeDigest` (`provider-credential-renewal.mjs:721-734`).

### Hidden additions (RUL104 violations)

1. **Simplicity's `src/util/write-atomic.mjs` (`writeAtomic`) + `test/util/write-atomic.test.mjs` + `.durable-file-<uniqueTmpTag>.tmp` prefix across 10 no-fsync sites (`council-261021-1324-harden-t0-seat-simplicity.md:64,66,88,140,177,225`)**
   - Adds a new module in `src/util/` and a new test file in `test/util/` for non-durable writes outside `durable-file`'s authority (violating RUL104 and Design Principle 6).
   - Requires editing `docs/architecture-manifest.json` (`test/architecture.test.mjs`) and `EXPECTED_CLOSURE` in `test/runner/dispatch-reconciliation-import-graph.test.mjs:192-240`.
   - Touches SEAT-owned (`src/runner/execution/run.mjs:51`, `src/runner/execution/unit-summary.mjs:196`) and GIT-owned (`src/runner/worktree.mjs:236`) files.
   - Reuses the `.durable-file-*` temp-name prefix for non-durable writes, colliding with `durable-file`'s diagnostic retained crash files.

2. **Correctness's N-API bindings for `containment::{create, spawnIn, guarantee}`, `domainIsEmpty`, and `domainKillAll` (`council-261021-1324-harden-t0-seat-correctness.md:10`)**
   - Zero Node callers exist or are planned for `containment::{create, spawnIn, guarantee}` or `domainIsEmpty`/`domainKillAll` in T0 (only Rust `fgos-run-supervisor`, `fgos-holder-lock`, and `fgos-git` call them). Adding N-API wrappers for them grows Rust with dead binding code (violating RUL104).

3. **Loader import-graph trap (`test/runner/dispatch-reconciliation-import-graph.test.mjs:108,192-255`) missed by all 3 seats**
   - `src/runner/dispatch/process-identity.mjs` is in `reconcile.mjs`'s locked transitive import closure (`EXPECTED_CLOSURE`, `test/runner/dispatch-reconciliation-import-graph.test.mjs:224`).
   - Speed's proposal (`:107`) to have `process-identity.mjs` import `src/git/native.mjs` pulls `src/holder-lock/native-handover.mjs` and `src/run-supervisor/payload-root.mjs` into `reconcile`'s closure and fails `dispatch-reconciliation-import-graph.test.mjs:255`.
   - Even with a dedicated T0 loader inside `process-identity.mjs` (or a new leaf), loading an N-API addon requires `import { createRequire } from 'node:module'` and `src/run-supervisor/payload-root.mjs`, which **requires updating `ALLOWED_BUILTINS` (`:108`, adding `'module'`) and `EXPECTED_CLOSURE` (`:192-240`, adding `payload-root.mjs` and any loader leaf) in `test/runner/dispatch-reconciliation-import-graph.test.mjs`** (and `docs/architecture-manifest.json` if a new file is created), plus removing the `SIGNAL_ZERO_PROBE` (`process.kill(pid, 0)`) exemption at `dispatch-reconciliation-import-graph.test.mjs:146-151` once `provider-capacity.mjs:579` and `process-identity.mjs:72` stop calling `process.kill(pid, 0)`.

---

## Rejected attacks

- **Attack on `packages/process/rust/src/mapped.rs:254-382` (`posix::spawn` missing `placeholders` for free `fd_map` slots when `MappedStdio::Piped` opens pipes):** Rejected. In `posix::spawn`, `sources` for `fd_map` are duplicated first with `F_DUPFD_CLOEXEC` at `above = max(slots) + 1` (`:266-278`), and all `adddup2(child_pipe, 0|1|2)` file actions (`:323`) are queued into `posix_spawn_file_actions_t` **before** `adddup2(source, *slot)` (`:332`). Even if `pipe2` (`:320`) allocates a free fd number that is also a target `slot >= 3` in `fd_map`, the child executes `dup2(child_pipe, 0|1|2)` before `dup2(source, slot)` overwrites `slot`, and `pipe2` sets `O_CLOEXEC` (`:215`) so `inheritable_fds()` (`:335`) never adds an `addclose` for the pipe fd.
- **Attack on `src/runner/dispatch/process-identity.mjs:72,140` (`pid` in `0x8000_0000..=0xffff_ffff` wrapping negative in `process.kill(pid, 0)` and signalling a process group or `-1`):** Rejected (reproduced via `node -e`). Node's `process.kill` throws `ERR_OUT_OF_RANGE` for `pid > 2147483647` (`i32::MAX`), which `pidExists` catches and maps to `false` (`judge` -> `'dead'`, matching Rust `as_pid_t` at `packages/process/rust/src/platform/mod.rs:94-99`).
- **Attack on `packages/process/rust/src/platform/linux.rs:176-219` (`signal_by_identity` TOCTOU between `pidfd_open` and `judge`):** Rejected. `pidfd_open` (`:185`) pins the kernel `struct pid` before `judge` (`:199`) reads `/proc/<pid>/stat`; if the target was reaped and its PID reused before `pidfd_open`, `judge` sees the newcomer's `start_time` and returns `IdentityMismatch`; if the target exited after `pidfd_open`, `pidfd_send_signal` (`:203`) returns `ESRCH` (`NotFound`) on the pinned dead process and never signals a newcomer.
- **Attack on `packages/process/rust/src/platform/windows.rs:146-180` (`signal_by_identity` TOCTOU between `creation_time()` and `TerminateProcess`):** Rejected. `ProcessHandle::open` (`:153`) holds an open Win32 process handle across `creation_time()` (`WaitForSingleObject(handle, 0)` + `GetProcessTimes`, `:71-84`) and `TerminateProcess` (`:171`); Windows never recycles a PID while an open handle references the process object.
- **Attack on Simplicity `S-A1` (`council-261021-1324-harden-t0-seat-simplicity.md:128`) claiming `scripts/build-rust-distribution.mjs:451` emits `"nativeAddon":undefined` when a target has no addon:** Rejected for `manifestWithoutDigest` as written today. In `scripts/build-rust-distribution.mjs:367`, `nativeAddon` is initialized to `null` (not `undefined`), and `releaseVersion` / `stateSchemas` (`:466-468`) are attached conditionally, so `manifestWithoutDigest` contains no `undefined` values today. However, `canonicalJson` in `build-rust-distribution.mjs:37-47` and `effective-execution-contract.mjs:39-48` genuinely emit invalid JSON `{"k":undefined}` whenever an input object has an `undefined`-valued property (`S-A1` / `F-A5` confirmed on the function itself and on `effective-execution-contract.mjs:270-271`).
- **Attack on `packages/canonical-json/rust/src/lib.rs:14-62` (UTF-16 surrogate-pair ordering and `-0` / scientific notation):** Rejected. `a.encode_utf16().cmp(b.encode_utf16())` (`:48`) and `ryu_js::Buffer::new().format_finite(n)` (`:33`) conform to RFC 8785 and are covered by `packages/canonical-json/contracts/vectors/canonical.v1.json`.

---

```text
Status: DONE_WITH_CONCERNS
Summary: Red-team code audit of T0 found 5 High and 2 Medium/Low missed bugs across `fgos-process` (`LinuxPgroup::spawn_in` mutating the calling Node/supervisor process into a `PR_SET_CHILD_SUBREAPER` and breaking its own `ppid` tree walk; `pgroup_state`/`tree_state`/`live_rows` collapsing `Verdict::Unknown` and `/proc` errors to `DomainState::Empty`), `durable-file` (`install_once` paying a redundant 5.1 ms directory `fsync` on `AlreadyExists` and leaving `.durable-file-*.tmp` files that corrupt `provider-credential-renewal.mjs`'s `treeDigest`), and Node (`lock-fence.mjs` treating `null === null` as a matching `startTime`; `gateway-control.mjs` `pidExists` stalling 10-15s on zombies and deleting `gateway.json` after failed `SIGKILL`; unmigrated `provider-capacity.mjs`, `cancel-registry.mjs`, and `direct-launch.mjs` callers that break Windows deadlines if `getBootId()` is dropped). Attacked all seat High findings, resolved all 7 inter-seat disagreements with `file:line` evidence, and flagged 8 unsafe deletions and 3 hidden additions/import-graph traps.
Concerns/Blockers: Correctness left its two High findings (`F-A1`, `F-A3`) `inferred` (reproduced here by red-team so T0 is not blocked by the High-reproduction rule); Speed's proposals to load T0 via `src/git/native.mjs`, keep `pidExists` in `gateway-control.mjs`, delete `command-routes-drift`, delete `sweepProcessGroup`, and edit `apps/fgos/src/main.rs` / `CATALOG` in `host-runtime` break existing tests and architecture guards and must be rejected in arbitration.
```
