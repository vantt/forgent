# HARDEN T1 council, seat "speed and weight" (axes C and D)

Seat report for the [T1 council brief](council-261021-2338-harden-t1-council-brief.md). Repository `/home/vantt/projects/forgent`, branch `main`, **HEAD `284192b2f`**. 2026-10-22, Asia/Saigon. Every `file:line` below is on that commit. The active release `sha256:79d2eed3…` carries the same bytes for every T1 file (`git diff --stat e679a2d4e HEAD -- src/holder-lock src/state/hot-lock.mjs src/util/session-identity.mjs src/convention packages/{holder-lock,session-identity,convention} packages/git/node-addon/src apps/fgos/src/main.rs` is empty), so the measurements are of the code on main.

The big lead's correction (phase-02 line 47, main `3fd0dc544`) is applied: the compatibility policy is answered (plan.md owner decision 1: fences and drains live one release, then go), and Part A's fence answer rests on it.

## 0. What I ran (all read-only, nothing in the repository changed)

1. Read every file the brief lists, then every line of `src/holder-lock/*` (10 files), `src/runner/lock-fence.mjs`, `src/runner/lock-status.mjs`, `src/state/hot-lock.mjs`, `src/util/session-identity.mjs`, `src/util/host-bin-path.mjs`, `src/convention/convention-client.mjs`, `src/native/door.mjs`, `src/runner/dispatch/process-identity.mjs`, `src/setup/holder-lock-checks.mjs`, `src/setup/lock-record-checks.mjs`, the T1 rows of `src/setup/registrations.mjs`; `packages/holder-lock/rust/src/**` (15 files, 5 443 lines), `packages/session-identity/rust/src/**` (7 files, 564), `packages/convention/rust/src/**` (4 files, 1 062); the T0 addon namespaces `packages/git/node-addon/src/{lib,process,durable_file,canonical_json,single_load}.rs`; `apps/fgos/src/main.rs:95-260`; the TEST phase-2 holder-lock report; the T1 test files' titles.
2. Node measurements on the active release payload (`libexec/legacy-node`, host `bin/fgos`), scratch fgosDir `/home/vantt/projects/forgent-worktrees/t1-seat-speed-bench/.fgos` on ext4, `FGOS_STATE_ROOT` pinned to a scratch dir, session variables unset, `</dev/null`. Script: session scratchpad `t1-speed-bench.mjs` (not committed). Two runs, load 0.3; every figure quoted is from run 2 unless noted, and run 1 agreed within 3% except one JIT-cold outlier noted in §B.
3. Rust measurements with a scratch crate in the session scratchpad depending on the workspace crates by path, `cargo run --release --offline`, cargo output under `/home/vantt/projects/forgent-worktrees/t1-seat-speed-target`.
4. No `npm test`, no `cargo test`, no `fgos` verb except through the facade functions the script imports.

### Measured numbers (second machine, 24 cores, ext4 NVMe, load 0.29, 566 pids in /proc)

| Call | p50 | p95 | Where | Note |
|---|---|---|---|---|
| plain `write`+`fsync` probe | 5.28 ms | 10.35 ms | — | fsync reference (bimodal, as GIT found) |
| `spawnSync /bin/true` | 0.74 ms | 0.85 ms | — | spawn floor without the host |
| route `fgos internal lock-fd --guarantee` (bare spawn) | 1.23 ms | 1.29 ms | `driver.mjs:137` | host spawn floor for a lock route |
| route `fgos internal state-root` | 1.25 ms | 1.63 ms | `driver.mjs:250` | baseline 1.23 |
| route `fgos identity --pid` | 1.42 ms | 1.47 ms | `session-identity.mjs:121` | baseline 1.41 |
| `acquireSync`+`release` gateway, uncontended | **1.42 ms** | 1.52 ms | `index.mjs:243,252` | baseline 1.36 |
| `acquire` (async twin), one `--try` | 1.44 ms | 1.54 ms | `index.mjs:291,310` | |
| `probe(gateway)` | 1.28 ms | 1.31 ms | `index.mjs:363,374` | one `--shared-try` spawn |
| `readPredecessorKillWaitMs({projectRoot})` | 28.7 µs | 39.9 µs | `protocol.mjs:70-73` | two config files read and merged on every acquire |
| `ensureLockFile` | 3.3 µs | 4.6 µs | `index.mjs:182` | |
| `guaranteeFor` (cached) | 1.5 µs | 1.6 µs | `driver.mjs:210` | first call per directory is one spawn |
| `resolveLock` | 1.3 µs | 1.5 µs | `registry.mjs:82` | |
| `lockHolders(gateway)` = Node `/proc/*/fd` scan | **5.5 ms** | 5.8 ms | `driver.mjs:300-348` | 566 pids; held or free makes no difference |
| `collectLockStatus` (`fgos lock-status` body) | 10.2 ms | 13.2 ms | `lock-status.mjs:73` | one probe spawn + one scan per existing lock file |
| door `judge(selfRecord)` | 5.0 µs | 5.4 µs | `process-identity.mjs:17` | T0 after: 5.3 |
| door `observe(pid)` | 4.9 µs | 6.1 µs | `process-identity.mjs:19` | |
| `resolveWriterIdentity` (cached) | 1.6 µs | 2.1 µs | `session-identity.mjs:165` | baseline 0.9 |
| `withStateTx` empty body | **19.3 µs** | 25.0 µs | `hot-lock.mjs:304` | baseline 19.6 (run 1 showed 57 µs with only 5 warm-up calls: JIT-cold, not the lock) |
| `withStateTx` empty body, writer prefetched | 17.6 µs | 21.7 µs | | |
| raw fast path: write tmp, `link`, unlink tmp, unlink record | 10.8 µs | 13.3 µs | `hot-lock.mjs:159-175,204-218` | the four syscalls alone |
| `fs.mkdirSync` recursive on an existing dir | 1.0 µs | 1.0 µs | `hot-lock.mjs:179` | on every acquire |
| `readHotRecord` absent | 3.8 µs | 4.2 µs | `hot-lock.mjs:88` | |
| HL-F1, old `withEventsLock` vs `withStateTx`, 3 rounds × 400, alternating | old 16.2–16.7 µs, new 17.4–18.0 µs | | `test/state/hot-lock-multiprocess.test.mjs:249` | **ratio 1.058, 1.072, 1.077** |
| `door.canonicalJson(obj200)` | **80.9 µs** | 85.3 µs | `door.mjs:73-76` | 200 keys, short string values (T0 measured 384 µs at load 3) |
| addon `canonicalJson.canonicalJson(obj200)` direct | 73.8 µs | 75.5 µs | `canonical_json.rs:8` | |
| door `judge(obj200)` (a 200-key object as the record) | **63.4 µs** | 65.0 µs | `process.rs:27` | the N-API `Value` marshal-in alone |
| door `judge({})` | 0.49 µs | 0.52 µs | | N-API floor |
| `JSON.stringify(obj200)` | 6.0 µs | 6.3 µs | `door.mjs:74` | the precheck that is computed and thrown away |
| `JSON.parse` of the 5.7 KB text | 16.4 µs | 16.9 µs | — | V8, for scale |

Rust side (scratch crate, release build):

| Call | p50 | p95 | Note |
|---|---|---|---|
| `serde_json::from_str` 5.7 KB | 19.3 µs | 34.5 µs | parse half of a string-in canonical door |
| `fgos_canonical_json::canonical_json(&Value)` 200 keys | 12.1 µs | 12.8 µs | the crate alone (T0 said 49 µs under load) |
| `from_str` + `canonical_json` | **32.5 µs** | 33.2 µs | whole Rust side of a string-in door |
| `fgos_process::facts::lock_holders(dev, ino)` | **4.5 ms** | 5.0 ms | Rust `/proc/*/fd` scan, same cost class as Node's |
| `fgos_holder_lock::holders(&resource)` | 4.5 ms | 5.2 ms | `flock.rs:194` |
| `lock_table_entries()` (`/proc/locks`) | **19.5 µs** | 19.8 µs | `platform/linux.rs:334`, one file read |
| `probe(&resource)` | 1.1 µs | 1.1 µs | `port.rs:1305`: open, `LOCK_SH|LOCK_NB`, close |
| `lock_description(file, Ex, Try)` + close | 1.1 µs | 1.2 µs | `port.rs:656`, what `lock-fd --try` does minus the predecessor file |
| `acquire` + `release`, uncontended, in process | **28.4 µs** | 28.8 µs | `port.rs:700,826`, includes `settle_release` reading `/proc/locks` |
| `fgos_session_identity::resolve_current` | 0.5 µs | 0.5 µs | env branch (the pid walk is a few µs) |
| `mint_attempt_writer_id` | 0.0 µs | | pure |
| `state_root()` | 0.3 µs | | pure |

## Part A: target shape per component

### A.1 Holder-lock (with `fgos lock fence` and `fences.mjs`)

1. **Authority.** Who holds which resource as the kernel sees it: kernel locks on open file descriptions, the registry, lock order inside a scope, the predecessor rule, the borrow drain, the machine state root.
2. **Contract and ports.** Rust port unchanged (`acquire`, `release`, `run_borrowed`, `probe`, `holders`, `guarantee`, `validate`, `clear_domain`, `state_root`, `two_process_probe`). Node reaches it through one **in-process `holderLock` namespace of the combined addon** (`packages/git/node-addon`, which already links `fgos-holder-lock`, `Cargo.toml:18`, and already turns a Node-owned fd into a Rust `BorrowedHandle` for Git: `git.rs:14`, `port.rs:311`): `lockFd(fd, mode, wait, killWaitMs, predecessorKinds)` (the body of `route.rs:339-371` over Node's own description), `probe(path)`, `guarantee(dir)` (+ `reachFloorTicks`), `borrowedCheck(fd, path, env)`, `predecessorState(path)`, `drainChild(fd, childPid, killWaitMs, protectedRoots, reachFloorTicks)`, `clearDomain(fd, path, killWaitMs)`, `holders(path)` (Rust decides: `/proc/locks` stamp first, fdinfo scan only on request), `stateRoot()`, `twoProcessProbe(dir)`. Named errors stay those of `protocol.mjs:33` plus `lock-driver-unavailable` from the door (`process-door-unavailable`/`not-shipped` map to it). Routes that **keep a process boundary** because their caller is not the payload: `lock-fd --borrowed-check` (git hook child, `.githooks/pre-commit:30,124`: keeps the route until the hook itself calls the door), `quiesce-scan` (`fgctl` and `src/verbs/events/migrate.mjs:70`), `lock-borrow-vectors` (doctor, `fgctl`), `holder-lock-helper` roles (`helper.rs`).
3. **Rust/Node boundary and Node budget.** Rust decides everything it decides today plus the holder listing, the Windows hold and the two-process probe. Node keeps: the description's lifetime (open, `WeakMap`, `release`, `runBorrowed` stdio mapping), `LockScope`, the registry path templates, `readPredecessorKillWaitMs`, `fgos lock fence`/`lock-status` presentation. **Node budget: `src/holder-lock/` ≤ 1 100 lines in 7 files** (`index.mjs` ≈ 450, `driver.mjs` ≈ 80 as the door adapter, `registry.mjs` 102, `lock-scope.mjs` 71, `protocol.mjs` ≈ 60, `hot-guard.mjs` 72, `native-handover.mjs` 9, `state-root.mjs` ≈ 30). `hold-transport.mjs` and `fences.mjs` gone. Through the door: every acquire, try, probe, guarantee, drain, clear-domain, holder list, state root (the compat channel only; the host's pin `legacy_exec.rs:254` stays the normal path). Keeps a route: the three above.
4. **Delete list.** `src/holder-lock/hold-transport.mjs` (498); `src/holder-lock/fences.mjs` (514; `ownPidChain` + `parentPid`, 22 lines, move into `lock-fence.mjs`, its only remaining caller `lock-fence.mjs:16`); `driver.mjs:84-348` (route runner, `runStateRootRoute`, Node fd scan); `index.mjs` route plumbing and hold branches (`:187-194,204-229,268-279,302-333,429-458,472-510,672-680`); `protocol.mjs:14-16,43-61` (`PROTOCOL`, `parseRouteLine`); `state-root.mjs:36` route fallback (door instead); `holder-lock-checks.mjs:92-221` (Node copy of `semantics.rs`), `:567-720` (fences check and fix), `:756-790` (`state-root` row); `lock-record-checks.mjs` folded into `lock-holders`; doctor rows `lock-fences`, `state-root`, `lock-record-unreadable`, `lock-predecessor-kill-wait` (merged, §Doctor table); fix `lock-fences` (`registrations.mjs:2383`); Rust `route/hold.rs` (554), `route.rs:192-372` except `--borrowed-check`, `:415-471`, contracts `internal-route.lock-hold.v1.json`, `internal-route.state-root.v1.json`, most of `internal-route.lock-fd.v1.json`; instruction text: holder-lock spec §2 "Node cannot call flock" paragraph, §9, §10 route table, §12-§13 fence prose, `distribution.md:74,77,78` row text for the deleted rows; tests in §Tests table. **Fences: every fence `fences.mjs` places can go now.** They were placed at the 4.2/4.3 cutovers (`81c34f702`, 2026-10-17) and the 4.4 rows the same day; since then more than one release has been activated on every workspace and both machines (`e679a2d4e` is 2026-10-22), so no binary that reads a legacy lock path runs anywhere. The on-disk `TOMBSTONE` directories stay as they are (nothing reads them; removing them would be a mechanism). The one fence that is not Node's, the Git-WAL activation fence of `fgctl` (`tombstone.rs`, `d1d4ec7ee`, 2026-10-18), is GIT's to retire under the same decision; the `git-fence-missing` condition of `checkLockFences` (`holder-lock-checks.mjs:611-613`) must move to a GIT row or be retired by GIT, not vanish silently.
5. **Doctor rows kept:** `lock-driver` (today's `lock-kernel-semantics` + `lock-borrow-vectors` + the state-root and kill-wait lines) and `lock-holders` (today's `lock-holders` + `lock-record-unreadable`). Fix kept: `lock-dirs`.
6. **Size target.** Node −2 050 (±150): hold −498, fences −494, driver −265, index −250, checks −300, protocol/state-root −40, lock-record-checks −40, lock-fence/registrations −30, plus ≈ +90 for the door adapter and merged rows. Rust −430 (±100): −554 `route/hold.rs`, −330 `route.rs`, +130 addon namespace, +20 `holders` by lock table, −?? contracts (−164 lines of JSON). Tests −1 600 (±200), §Tests table. Windows is the part that cannot be verified on this machine: the plan should land the Linux door first and the Windows in-process LockFileEx second, after the owner's Windows CI (`.github/workflows/holder-lock-cross-platform.yml`) is green on it; until then `hold-transport.mjs` stays and the target is Node −1 550 / Rust +130 / tests −1 200, still far below T0's +150.

### A.2 Session Identity

1. **Authority.** Which writer this process is and how far the id is trusted; the attempt writer id; the launcher scrub.
2. **Contract and ports.** Rust `resolve`, `resolve_current`, `mint_attempt_writer_id`, `scrub_and_set` unchanged. Node: **door exports `identity.resolve(pid, fgosDir)` and `identity.mintAttempt(id)`** on the combined addon (the crate is pure apart from `/proc`: `resolve.rs:145-164`; the addon already links it transitively through `fgos-git`? No: `packages/git/rust/Cargo.toml:12-13` links holder-lock and process only, so the addon gains one path dependency of 564 lines, no new native code beyond ≈ 25 lines of marshalling). The verb `fgos identity` and the route `fgos internal identity mint-attempt` stay for the doctor row and for a person; `WriterIdentityError` names unchanged (`host-missing`, `host-version-mismatch` become door errors with the same names; `timeout`, `host-error`, `bad-output` disappear with the spawn; `identity-in-lock` becomes unnecessary and goes, because a 5 µs in-process call under the hot mutex is harmless, which also deletes `noteLockHeld`/`noteLockReleased` and their calls at `hot-lock.mjs:312,323`).
3. **Boundary and budget.** Rust decides; Node facade ≤ 70 lines (`resolveWriterIdentity`, `mintAttemptWriterId`, the error class, the cache keys can go too: 1.6 µs cached vs ≈ 3 µs uncached is not worth 30 lines). `probeIdentity` moves into the doctor body (`registrations.mjs:6471`), because the doctor must ask each binary directly, which is the one caller that needs the spawn.
4. **Delete list.** `session-identity.mjs:33-35,47-58,82-98,108-134,136-156,186-250` (≈ 190 lines); `test/state/identity-before-lock.test.mjs` (175: the behaviour "never exec under the lock" is removed with the exec); spec §5 third and fourth bullets.
5. **Doctor row kept:** `writer-identity-resolvable`.
6. **Size target.** Node −190, Rust +25 (addon), tests −175.

### A.3 Convention

1. **Authority.** Deterministic names and placement; unchanged.
2. **Contract and ports.** The native verb through `invokeHost` (`convention-client.mjs:11-21`, 5 s timeout); cold path only (pre-commit hook `.githooks/pre-commit:440-447`, doctor `registrations.mjs:6359`). Keeps the route: a 1.4 ms spawn once per commit or doctor run is not a hot path.
3. **Boundary and budget.** Node 21 lines, unchanged. Edits wait for SEAT (adds `definition-names.mjs`, `seat-id.mjs`).
4. **Delete list.** Nothing.
5. **Doctor row kept:** `convention-conformance`.
6. **Size target.** 0 / 0 / 0.

### A.4 The one state-root / `.fgos` lookup door

1. **Authority.** Holder-lock's `state_root()` (`state_root.rs:43`) for the machine root; the repository `.fgos` placement is a path convention (`<root>/.fgos`), not a decision, and Convention's spec §2 says `src/runner/paths.mjs` keeps it.
2. **Contract.** Machine root: `FGOS_STATE_ROOT` pin exported by the host (`legacy_exec.rs:254`), else `holderLock.stateRoot()` through the door once per process (`state-root.mjs:33-38` with the door in place of `runStateRootRoute`). Repository `.fgos`: `resolveFgosDir(root)` in `src/runner/paths.mjs:93`.
3. **Boundary and budget.** Node keeps the pin read (10 lines) and one `.fgos` join helper. The 103 hand-written `path.join(x, '.fgos')` sites in 36 files are joins of a known root, not lookups; rewriting them to one helper is 0 lines net and 0 µs, so this seat does not ask for it; it asks only that the two private copies of the helper (`src/setup/holder-lock-checks.mjs:57` `fgosDirOf`, `src/observe/friction-client.mjs:30` `resolveFgosDir`) import `paths.mjs`'s (−8 lines).
4. **Delete list.** `driver.mjs:246-270` `runStateRootRoute`, `route.rs:460-471`, the `state-root` route contract, the `state-root` doctor row (its only fail condition, "Node and the host disagree", cannot occur once Node has no resolver).
5. **Doctor row kept:** none of its own; the `lock-driver` row prints the root, its source and (when pinned) the unpinned answer, as `checkStateRoot` does at `holder-lock-checks.mjs:781-789`.
6. **Size target.** Node −60, Rust −45, tests −30.

### A.5 The hot mutex (review only)

Stays in Node until WORK lands (owner decision 3). Defects and what WORK needs from T1 are in findings S-5, S-6, S-7; the T0/T1 range is `hot-lock.mjs:1-226`; WORK's branch `work/es-cutover` rewrites `createTx` and `withStateTx` (`git diff main work/es-cutover -- src/state/hot-lock.mjs`: +161/−54, hunks at `:21,:48-90,:129,:182,:224-310,:310+`), so nothing below proposes an edit inside `:227-331`.

## Part B: findings

Severity per proposal §2.2; "reproduced" means I measured it or read the exact lines; "inferred" means the number is a sum of measured parts.

### S-1 (axis C, **High**, reproduced). Every lock operation of the Node facade is a host spawn: 1.3–1.4 ms each, on paths the owner named hot.

`index.mjs:252` (`acquireSync`), `:310` (`acquire`, one spawn per poll), `:374` (`probe`), `:103` (`clearDomain`), `:429-436,439,445` (`--drain-child` after **every** `runBorrowed` child), `:654,678` (`checkBorrowedDescription`), `:684` (`predecessorState`), `driver.mjs:215` (`guaranteeFor`, once per directory), `:252` (`runStateRootRoute`). Measured 1.42 ms for an uncontended `acquireSync`+`release` against a 1.23 ms bare lock route and 0.74 ms for `spawnSync /bin/true`: the lock itself is 1.1 µs in process (`lock_description`), the whole in-process `acquire`+`release` 28.4 µs. The spawn is 98% of the cost. Hot callers: `cwd-lock.mjs:59` (every `fgos run` and every claim), `repo-locks.mjs:29,86` (every main-checkout checkpoint, every worktree add), `merge.mjs:927,1144`, `session.mjs:156` (every session create), `gateway-control.mjs:104`, `loop.mjs:216`, `provider-capacity.mjs:420,494,512` (every account lease), `case-lock.mjs:62` (every advance), `direct-launch.mjs:54` (every attempt), `hot-lock.mjs:127,144` (reclaim, cold). A claim with one checkpoint commit costs ≥ 5 lock spawns (dispatch-cwd, guarantee, main-checkout, worktree-admin, `--drain-child` for the git child) ≈ 7 ms before any git runs. Lock waits: `acquire`'s poll loop (`index.mjs:335-355`) spawns a helper every 25 ms while waiting, so a 30 s wait is ≈ 1 200 spawns. **Fix shape:** Part A.1: the `holderLock` door namespace over Node's own fd, replacing the route runner (`driver.mjs:137-201`) and the `--try/--wait-ms/--shared-try/--guarantee/--probe/--predecessor-state/--drain-child/--clear-domain` modes of `route.rs:192-372`. Expected acquire 1.42 ms → ≈ 60 µs (28 µs port + 29 µs config read, inferred). The existing Git loan (`port.rs:311` `from_acquired_description`, `git.rs:14`) is the precedent: Rust already operates on a description Node owns.

### S-2 (axis C, **Medium**, reproduced). The Node holder scan reads every `/proc/<pid>/fd` and `fdinfo` on the machine: 5.5 ms per call, on the `fgos run` path.

`driver.mjs:300-348` `descriptionHolders`; callers on live paths: `cwd-lock.mjs:87` `dispatchCwdHolder` ← `run.mjs:556` (every `fgos run`), `case-runtime.mjs:61`, `case-bindings.mjs:156`, `reconciliation-planner.mjs:86`; `cwd-lock.mjs:21` on every in-flight refusal; `case-lock.mjs:29,40`; `repo-locks.mjs:31,72`; `lock-fence.mjs:103,125,152` (three scans per fence); `lock-status.mjs:22-25` per lock file; doctor `holder-lock-checks.mjs:547` per lock file (≈ 20 files × 5.5 ms). Rust's own fdinfo scan costs the same (4.5 ms, `flock.rs:194` → `facts::lock_holders`): moving the scan does not make it fast; it is syscall-bound. What is fast: "is it held" is `probe` at 1.1 µs in process (`port.rs:1305`), and the locker pid is one read of `/proc/locks` at 19.5 µs (`platform/linux.rs:334`, already read by `settle_release`, `flock.rs:350`). **Fix shape:** the door's `holders(path)` answers from the lock table (`{pid}` of the FLOCK stamp whose token matches the file) and runs the fdinfo scan only when the caller asks for the full list (`lock-fence`, doctor, `lock-status --json`); `dispatchCwdHolder`, `holderPidOf`, `liveAdvanceHolder`, `withRepoLock`'s error path use the cheap answer. This deletes `driver.mjs:272-348` (77 lines) and the one-door allowlist entry `test/process/one-door.test.mjs:22`. Caveat the fix must state: the lock-table pid is the process that called `flock`, so after `spawnWithLocks` (`index.mjs:612`) hands a lease to a supervisor the stamp still names the controller; the message "held by process N" may name a dead parent until the fdinfo fallback is asked (only when the stamped pid judges dead).

### S-3 (axis C, **Medium**, reproduced). The writer identity costs one 1.42 ms spawn per process, on every CLI call and every first state write.

`session-identity.mjs:121` (`execFileSync fgos identity`), `:224` (`mint-attempt`, once per attempt). The rule in Rust is 0.5 µs (env branch) and pure apart from `/proc` (`resolve.rs:145-164`, `provider.rs:55-64`). Every `fgos` verb that writes state pays it (`store.mjs:160,371,452,486,810,1243,1575,1676,1712`, `hot-lock.mjs:309`, `bin/fgos.mjs:1474,1491,1843,3635,3665`), plus the 18 ms import graph the facade was carved around (`host-bin-path.mjs:9-11`). **Fix shape:** Part A.2: `identity.resolve`/`identity.mintAttempt` on the door; delete the spawn, the parse, the two caches, the `heldLocks` guard (`:47-58,108-114,203-208`) and `identity-before-lock.test.mjs`. The doctor keeps `probeIdentity` because it must ask the activation's own binary (`registrations.mjs:6459-6476`). This replaces a mechanism (route) by the door the owner already chose, no new one.

### S-4 (axis C, **Medium**, reproduced; **T0-R1**). Canonical JSON through N-API: 85% of the cost is the `Value` marshal-in, not the crate.

`canonical_json.rs:8` takes `value: serde_json::Value`; napi-rs builds that `Value` by walking the JS object property by property. Measured: `judge(obj200)` 63.4 µs vs `judge({})` 0.49 µs, so the 200-key marshal-in is ≈ 63 µs; the crate itself is 12 µs; the door total 80.9 µs (T0's 384 µs was at load 3 with longer values; the shape is the same). The door already computes `JSON.stringify(value)` at `door.mjs:74` and discards it. The Rust side of a string-in door is 32.5 µs measured (`from_str` 19.3 + canonical 12.1). **Fix shape:** `canonicalJson(text: String) -> String` in `canonical_json.rs`; `door.mjs:73-76` becomes `const text = JSON.stringify(value) /* throws → not-json */; return nativeDoor().canonicalJson.canonicalJson(text)`. Expected ≈ 6 + 32.5 + ≈ 2 (5.7 KB string in and out) ≈ **41 µs** (inferred from measured parts), under the 80 µs budget, with one line less in Node and the same error name (`canonical-json-not-json` from a `serde_json` parse error cannot happen, since the text came from `JSON.stringify`; `NonFiniteNumber` stays). Also removes the `float_roundtrip`-sensitive path? No: `from_str` keeps it; the vectors in `packages/canonical-json/contracts/vectors/canonical.v1.json` prove bytes, unchanged. Every caller is cold, so this is "better" (gate 1: 2×), not urgent.

### S-5 (axis C, **Low**, reproduced; **HL-F1**). The hot mutex fast path is 5–8% slower than the lock it replaced; the whole difference is ≈ 1 µs of JS allocation, in WORK's region.

Reproduced alone, three alternating rounds: ratio 1.058, 1.072, 1.077 (old 16.2–16.7 µs, new 17.4–18.0 µs). The four syscalls of the fast path cost 10.8 µs on this filesystem; both locks pay them. The extra microsecond is `createTx` (`hot-lock.mjs:227-292`: an object with 9 closures per transaction, `path.resolve` twice, the `revoke` closure) plus `fs.mkdirSync` on every acquire (`:179`, 1.0 µs) and `enterHotLock` (`hot-guard.mjs:21`). Not a route, not fsync, not identity (1.6 µs cached, same for both). `createTx` and `withStateTx` are being rewritten on `work/es-cutover` (+161 lines), so T1 should hand WORK the numbers rather than touch them: (a) the 1.10 bound compares against a mechanism that no longer exists, fetched with `git show eab4d617b` (`test/state/hot-lock-multiprocess.test.mjs:254`), skipped in a shallow clone, and sensitive to suite load (TEST saw 1.101); (b) `mkdirSync` per acquire can move to the `ENOENT` branch of `writeFileSync`. **Recommendation for ask 1:** replace the relative bound with an absolute one measured in the same run: `withStateTx` p50 ≤ 2 × the raw link/unlink quartet of that run (today 17.6 vs 10.8 µs → 1.6×), which is a proof of the behaviour "the mutex adds no second syscall class" and never skips. Keeping the 1.10 bound is the owner's call, as the brief says.

### S-6 (axis A/D, **Medium**, reproduced by reading; **HL-N8/N9**). The reclaim path compares the record bytes twice and judges once; one compare and one judge is the contract, and each needs its own proof.

`reclaimDeadHolder` (`hot-lock.mjs:125-137`) under the reclaim kernel lock reads the record (`:130`), compares bytes to what the waiter read outside the lock (`:131`), judges again (`:132`), then calls `unlinkRecordIfUnchanged` (`:133`), which reads a third time and compares again (`:109-111`). While the reclaim lock is held and the record exists, nobody can replace it: a new holder's `link` fails `EEXIST` (`:163`), and the only removers run under the same kernel lock (`:127,:144`). So inside `reclaimDeadHolder` the second read-and-compare is dead weight (≈ 4 µs on a cold path, 3 lines), which is exactly why TEST found that dropping either check leaves every test green. What each check is for: the judge under the lock (`:132`) is what protects a **live** holder that arrived between the waiter's read (`:184`) and the lock: without it a fresh live record would be unlinked (the bytes check alone would also catch it, but the judge is the stronger, contract-named guard). The bytes check is what protects `clearHotRecord` (`:142-151`, the `fgos lock fence --attest-stopped` path), where no judge is possible (the record does not parse or judges `unknown`) and the person's reading is the only reference. **Both checks are needed, one per door; the duplicate inside `reclaimDeadHolder` is not.** Fix shape (T0/T1 range `:109-137`): `reclaimDeadHolder` reads once under the lock, returns `changed` unless `again.raw === observed.raw && judge(again.record) === 'dead'`, then `fs.unlinkSync` directly; `unlinkRecordIfUnchanged` stays for `clearHotRecord` only (−6 lines). Owning proofs, one each, in `test/state/hot-lock-multiprocess.test.mjs` (Linux, two processes): **P-N9** "a live holder that takes the record after the waiter judged the old one dead is never reclaimed": process A reads dead record D; under a held reclaim lock, replace the file with a live record L (another process's `selfRecord`) and then call `reclaimDeadHolder(fgosDir, 'state', D)` → `'changed'`, L intact; red when `:132` is dropped. **P-N8** "`fgos lock fence --attest-stopped` clears only the bytes the person saw": write unparseable record U, call `clearHotRecord(fgosDir, 'state', rawSeen)` where `rawSeen` is U; then replace the file with U' and call again with `rawSeen` = U → `false`, U' intact; red when `:111` is dropped. Each proof goes in the file that owns the module; `hot-lock-contract.test.mjs:30` (contract prose) then no longer carries the behaviour alone and can retire its `bytes equal` assertion.

### S-7 (axis F, **Low**, reproduced by reading). Rust lock callers ignore `lock.predecessorKillWaitMs`; the doctor row says the key is the bound.

`scope.rs:159` passes `DEFAULT_KILL_WAIT_MS` for every Rust `LockScope::acquire` (Git, `fgctl`, Observe); only Node reads the key (`protocol.mjs:70-88`, 29 µs on every acquire today). The doctor row `lock-predecessor-kill-wait` (`registrations.mjs:2325`) and the config default (`:2333`) promise one bound. Two shapes: (a) Rust reads the merged config too (adds a config reader to a foundation crate, bigger), or (b) **delete the key**: measured kills take "a few ms" (spec §8), the default 2000 ms is a ceiling nobody tunes, and deleting it removes `protocol.mjs:25-27,63-88`, the row, the fix-less config default, the `lock-dirs`-adjacent setup merge line, `holder-lock-checks.mjs:722-754`, three tests (`holder-lock-checks.test.mjs:95,113`, `facade-multiprocess.test.mjs:256`) ≈ −150 lines and 29 µs per acquire. This reverses an owner-set config key, so it is an ask-1 item, not a decision of this seat.

### S-8 (axis D, **Medium**, reproduced by reading). A second implementation of the two-process semantics probe lives in Node.

`holder-lock-checks.mjs:92-221` re-implements `semantics.rs:32-171` (lock a fresh file, hand it to `sleep`, probe held, kill, probe free, both transports) because "the Rust body has no route" (spec §20, 2026-10-17). With the door it is one call: `twoProcessProbe(dir)` → `semantics::two_process_probe(dir, HelperExe)` (the addon knows the release's `fgos` via `door.mjs:54-59` `nativeHelperExe`). −130 Node lines; the `lock-kernel-semantics` behaviour keeps its Rust owner (`semantics.rs:178`) and one Node wiring test.

### S-9 (axis D, **Medium**, reproduced by reading). The Windows transport is a 498-line Node file-polling protocol plus a 554-line Rust helper for something the addon can do in one process.

`hold-transport.mjs` exists because "Node cannot call `LockFileEx`" (`index.mjs:10-13`). The combined addon is built for `win32-x64` (T0 arbitration finding 4) and links `fgos-holder-lock`, whose `LockFileExDriver` (`driver/windows.rs`) and `borrow_windows::run` (`borrow_windows.rs:174`) run in any process. In-process, the lock lives on a handle the Node process owns, as on Linux; the borrow job and the keeper stay (`helper.rs:73-185`). Delete: `hold-transport.mjs` (498), `route/hold.rs` (554), `internal-route.lock-hold.v1.json` (56), `index.mjs` hold branches (≈ 80), `windows-facade`/`windows-borrow`/`hold-transport-borrow` tests (≈ 550), spec §8.1 "lock-hold route" paragraph. Cannot be verified here; land after the Linux door, gated on the Windows CI job.

### S-10 (axis D, **Low**, reproduced by reading; **T0's size debt**). Where T1 and T0 can shrink.

- T0's N-API namespaces are 218 lines (`process.rs` 161, `durable_file.rs` 46, `canonical_json.rs` 11) and already thin: `observe` and `scan` build JSON by hand (`process.rs:40-66,134-161`) and could use `serde_json::to_value` on serializable crate types, but the derives would move the same lines into `fgos-process`. Net ≈ 0; not worth a change. The debt is paid by T1's deletions (Part A sums to ≈ −2 300 Node, −450 Rust, −1 800 tests), not by trimming the door.
- Phase-1 red tests that now duplicate an owning proof (each a wiring of the judge table or the P2 signal policy at a second boundary, principle 8 allows one): `test/runner/run-lock-identity.test.mjs:35,45,60` (live/reused/dead through `acquireRunControl`: three verdict-table cases; keep one wiring case, owner `packages/process/rust/tests/judge_vectors.rs`) ≈ −45; `test/state/hot-lock-multiprocess.test.mjs:299` (`judgeHotRecord` is `judge`, `hot-lock.mjs:54-56`; four verdict cases again) ≈ −22; `test/runner/stop-processes-inside.test.mjs:48` and `test/process/process-facts-vectors.test.mjs:29` both prove "a reused pid gets `identity-mismatch` and no signal"; keep the vectors file's, ≈ −25. Inferred: I did not run mutations on them.
- `test/process/one-door.test.mjs:22-24` loses three allowlist entries when `driver.mjs`'s scan, `fences.mjs`'s `parentPid` and the doctor's `/proc` reads go (the doctor's `holderOrigin` at `holder-lock-checks.mjs:401-428` reads `environ`/`cmdline`/`comm` of each holder; the door's `holders` can return `cmdline` as `facts::ProcView` already carries it, `process.rs:157`).

### S-11 (axis F, **Low**, reproduced by reading; **T0-R2**). The durable door's `mode` is required and a missing one surfaces as N-API `NumberExpected`.

`durable_file.rs:32,41` `mode: u32`; `door.mjs:78-80` passes it through. The T0 shape made `mode` explicit on purpose (component-boundary durable-file row). Smallest fix: one named check in `door.mjs:81` before the call, `if (!Number.isInteger(mode)) throw Object.assign(new Error('durable-file-mode-missing: …'), { code: 'durable-file-mode-missing' })` (+1 line Node, 0 Rust). A default would silently pick a mode for a record whose mode matters (trust store 0600); the named error is the right shape.

### S-12 (axis C, **Low**, reproduced). `fgos lock-status` and doctor `lock-holders` are quadratic in lock files.

`lock-status.mjs:73` one probe spawn (1.28 ms) and `:22-25` one fdinfo scan (5.5 ms) per existing lock file; `holder-lock-checks.mjs:547` one scan per file plus `holderOrigin` reads per holder. Measured 10.2 ms with three files; a workspace with 20 lock files ≈ 140 ms. Cold; fixed for free by S-1/S-2 (probe 1 µs, lock table 20 µs, one scan for all files when the full list is wanted: `lock_holders` takes one `(dev, ino)`, so the door should take a list).

### S-13 (axis G, **Low**, reproduced). The acquire reads and merges two config files on every call.

`protocol.mjs:70-73` → `readSharedConfigOrEmpty` + `mergeWithGlobalConfig`, 28.7 µs per acquire, after the door the largest remaining cost of an acquire (28 µs port). Resolved by S-7 (b); if the key stays, read it once per `projectRoot` per process in `prepareAcquire` (`index.mjs:173`), as `guarantees` is cached (`driver.mjs:203`).

## Migration table

| Node part | What it decides | Move or not | Reason | Order | Node budget after |
|---|---|---|---|---|---|
| `index.mjs:243-355` acquire/try/poll, `:363` probe, `driver.mjs:137-201,210-227` route runner and guarantee | nothing; spawns the host to call `flock` | **move** to the door (S-1) | hot path, lock wait, 1.42 ms → ≈ 60 µs; owner 12:05 | 1 | ≈ 300 lines of fd lifetime, scope, results |
| `index.mjs:429-447` drain after borrow, `:98-105` clearDomain, `:643-680` borrowed check, `:683` predecessor state | nothing | **move** to the door; `--borrowed-check` route stays for the git hook child | same spawn class, after every borrowed git child | 1 | ≈ 60 |
| `driver.mjs:300-348` fd scan (`descriptionHolders`) | which pids hold a copy (a Node copy of `flock.rs:194`) | **move**; answer from `/proc/locks` first (S-2) | 5.5 ms on `fgos run`; two implementations of one scan | 1 | 0 |
| `hold-transport.mjs` (Windows) | lock lifetime through a helper | **move** in-process (S-9) | 1 052 lines of protocol for a syscall the addon can make | 3 (after Windows CI) | 0 |
| `state-root.mjs:36` route fallback, `driver.mjs:246-270` | nothing | **move** (door) | one less route and contract | 1 | 30 |
| `holder-lock-checks.mjs:92-221` two-process probe | a copy of `semantics.rs` | **move** (S-8) | duplicate body | 2 | 10 |
| `fences.mjs` | fence placement, v1 enumeration, stop check | **delete** (owner decision 1) | mechanism's release has passed | 1 | `ownPidChain` 22 lines in `lock-fence.mjs` |
| `lock-scope.mjs` | lock order per scope (a Node twin of `scope.rs:95-105`) | **keep** | the scope tracks Node handles; moving it adds a door call per acquire for a 1 µs check; accepted twin for the simplicity seat to weigh | — | 71 |
| `registry.mjs` template fill (twin of `scope.rs:133-152`) | path of a row from Node params | **keep** | params are Node's; data file shared | — | 102 |
| `protocol.mjs:70-88` kill-wait config read | the bound forwarded to Rust | **keep or delete** (S-7, ask 1) | config is Node's until T5 | — | 60 |
| `hot-lock.mjs` | the hot mutex | **keep** (owner decision 3) | WORK replaces the store | — | 331 (WORK's) |
| `session-identity.mjs` resolve and mint | nothing; spawns the verb | **move** (S-3) | 1.42 ms per process → 5 µs | 2 | 70 |
| `session-identity.mjs:108-134` `probeIdentity` | nothing | **keep** inside the doctor body | must ask the activation's binary | — | 30 |
| `convention-client.mjs` | nothing | **keep route** | cold (hook, doctor) | — | 21 |
| `host-bin-path.mjs` | which release's binary and addon | **keep** | the door needs it (`door.mjs:30`) | — | 98 |
| `lock-fence.mjs`, `lock-status.mjs` | presentation of a verb | **keep**, use the door | cold | 1 | 205 + 130 |
| 103 `path.join(…, '.fgos')` sites | a path convention | **keep**; dedupe two helper copies | no decision, no spawn | — | — |

## Delete list

| Candidate | Evidence nothing needs it |
|---|---|
| `src/holder-lock/fences.mjs` (all but `ownPidChain`/`parentPid`) | callers: `holder-lock-checks.mjs:598,689,703` (the row and fix being deleted) and `src/verbs/events/migrate.mjs:70` (`checkStopped` only: keep `checkStopped`+`scanWorkspace` 60 lines in `migrate.mjs` or in `lock-fence.mjs`; GIT/ES owns `migrate`); `lock-fence.mjs:16` (`ownPidChain`). `rg -n "placeFences\|fenceStatus\|fenceCutover\|fenceTargets" src bin` finds only those. Run: a workspace activated on `e679a2d4e` has every tombstone in place (`fgos doctor` on this machine: `lock-fences` passes, closing report §5), so the placement never runs again. |
| doctor row `lock-fences` + fix (`registrations.mjs:2315-2318,2383`), `holder-lock-checks.mjs:567-720` | same; `distribution.md:77,78` rows to edit |
| `src/holder-lock/hold-transport.mjs`, `route/hold.rs`, `internal-route.lock-hold.v1.json` | S-9; the only importers are `index.mjs:47` and `holder-lock-checks.mjs:20` (`holdTwoProcessProbe`, goes with S-8); after Windows CI |
| `driver.mjs:84-348` | S-1/S-2; importers `index.mjs:33-46`, `holder-lock-checks.mjs:19`, `lock-status.mjs:12`, all moving to the door |
| `route.rs:192-372` except `--borrowed-check`; `:460-471`; `internal-route.state-root.v1.json`; most of `internal-route.lock-fd.v1.json` | callers are the Node facade only (`rg -n "internal', 'lock-fd\|internal lock-fd" src bin .githooks`: `driver.mjs:128`, `holder-lock-checks.mjs:475`, `.githooks/pre-commit` through `checkBorrowedDescription`) |
| `session-identity.mjs:33-35,47-58,82-98,136-156,186-250`; `packages/session-identity/rust/src/route.rs` (63) once `mintAttemptWriterId` uses the door | `rg -n "mint-attempt" src bin test`: `session-identity.mjs:224`, `test/session-identity/attempt-writer-id.test.mjs:24` (route proof moves to a door wiring case) |
| `test/state/identity-before-lock.test.mjs` (175) | the behaviour "never exec while holding the hot mutex" is removed with the exec (principle 8: removed behaviour) |
| `holder-lock-checks.mjs:92-221`, `:756-790`; row `state-root`; `lock-record-checks.mjs` as a separate row | S-8, A.4, doctor table |
| `test/process/one-door.test.mjs:22-24` entries | the sites go |
| config key `lock.predecessorKillWaitMs` and its row | only if the owner takes S-7 (b) |

## Doctor table (gate 8: no condition lost)

| Today's row | Fail / warn / info condition | Surviving row that keeps it |
|---|---|---|
| `lock-kernel-semantics` | cannot ask the driver (fail); lock root unresolved (fail); directory missing (warn); guarantee `unsupported`/`none` (fail); probe failed (fail); prints driver/exclusion/borrow/holders | **`lock-driver`** (same body, probe through the door) |
| `lock-borrow-vectors` | route did not finish / red vector or sibling / unavailable / protocol mismatch / other exit (all fail) | **`lock-driver`** (second line of the same row; the route stays) |
| `lock-predecessor-kill-wait` | config unreadable (fail); not 1..60000 (fail); prints value and source | **`lock-driver`** third line, or gone with the key (S-7 b) |
| `state-root` | cannot resolve (fail); Node ≠ host (fail); pinned root shows the unpinned answer (info) | "cannot resolve" → **`lock-driver`**; "Node ≠ host" removed with Node's resolver (behaviour gone); the pinned/unpinned line → **`lock-driver`** |
| `lock-holders` | no enumeration for a row (fail); foreign holder (warn); predecessor record unreadable/unknown version/not empty/Windows job not judged (warn); holders unlistable (info); attempt-lock member rule | **`lock-holders`** unchanged |
| `lock-record-unreadable` | hot record unparseable or holder unjudgeable for > 5 min (warn, names `fgos lock fence`) | **`lock-holders`** (the hot records are listed next to the reclaim lock files it already enumerates, `holder-lock-checks.mjs:373-374`) |
| `lock-fences` | cannot read status (fail); `git-fence-missing` (fail); legacy path unfenced (warn); v1 lock present (warn); fix waits for activation (warn) | all but one removed with the mechanism (owner decision 1); **`git-fence-missing` goes to GIT** (the fgctl WAL fence, `tombstone.rs`) to keep or retire, named in the hand-off ledger |
| `writer-identity-resolvable` | no host binary (fail); probe error per door (fail); no activation at home (note) | unchanged |
| `convention-conformance` | post-cutoff violations (fail); pre-cutoff counts; host unavailable/mismatch (pass-skip) | unchanged |
| fixes `lock-dirs`, `lock-fences`; config default `lock` | | `lock-dirs` stays; `lock-fences` deleted; `lock` default stays unless S-7 (b) |

Rows: 9 → 4 (`lock-driver`, `lock-holders`, `writer-identity-resolvable`, `convention-conformance`).

## Tests table

TEST phase 2 labels (`ff24dbde3`, report §5) are reused: route 7, owns 74, contract-prose 27.

| Behaviour | Owning proof | Node ↔ Rust duplicate / time-based wait | Action |
|---|---|---|---|
| kernel lock on a description, exclusion, SIGKILL release, predecessor kill | `packages/holder-lock/rust/tests/multiprocess.rs` | — | unchanged |
| the facade's acquire/probe/release wiring | `test/holder-lock/facade-multiprocess.test.mjs:88` (route) | becomes the door wiring proof | keep, rewrite the expectation from "helper exits" to "no child process" (one `spawn` count, as `native-load.test.mjs:91` does) |
| route timeout answer and closed description | `facade-multiprocess:152,:228` (HL-R6, HL-N3, HL-N6) | `:204` waits 100 ms on a timer | keep; the 100 ms release becomes a barrier file (event, not time) |
| state root vectors | `state_root_vectors.rs`; Node `state-root.test.mjs:49` (3 pinned cases) | `:78` "not guessed without a host" | `:49` keeps the pin rule only; `:78` retires (behaviour removed: Node no longer asks a host; the door's `not-shipped` error is owned by `native-load.test.mjs:43`) |
| fences (5 files: `fences-main-door` 177, `fences-rust-locks` 177, `fences-stop-check` 250, `fences-v1-ledger` 223, `fences-v1-tombstone` 211) | — | `fences-stop-check:28,71`, `fences-rust-locks:170` time waits | retire with the mechanism (−1 038), except `fences-stop-check:134,143,217,230` (the quiesce-scan route proofs, ≈ 100 lines) which move to the file that keeps `checkStopped`, and `fences-rust-locks:116` (fgctl activates behind the fences) which is Git/distribution behaviour and moves to `test/distribution` |
| hold transport (`hold-transport-borrow` 165, `windows-facade` 214, `windows-borrow` 169, `windows-hot-lock` 133) | — | `hold-transport-borrow:91,104` 400/300 ms child timers | retire with S-9 (−681); `windows-hot-lock:64,82,105` keep as the Windows hot-mutex proofs (−133 not counted) |
| protocol parser (`driver-unavailable:108`) | — | — | retire (behaviour removed with the route); `:22,:85` stay (door errors by name) |
| identity resolve through the door | `packages/session-identity/rust/tests/golden.rs` | `test/util/session-identity.test.mjs` (318 lines) runs the env vectors "through the real binary" (spec §3) and pins the exec/cache/error-classification behaviour of the facade | keep one wiring case through the door and the error-name cases; the vector loop and the exec/timeout/`bad-output` cases retire (behaviour removed) (−≈ 150, inferred: titles read, bodies not) |
| `identity-before-lock.test.mjs` (175) | — | `:152,:160` 10 ms polls | retire (behaviour removed) |
| HL-F1 bound | `hot-lock-multiprocess:249` | compares against `git show eab4d617b` | replace by the absolute bound of S-5 (ask 1) |
| HL-N8 / HL-N9 | none today (`hot-lock-contract:30` prose) | — | add P-N8 and P-N9 (S-6) in `hot-lock-multiprocess`; retire the `bytes equal` prose line |
| judge table at a second boundary | `judge_vectors.rs`; one Node wiring `process-facts-vectors.test.mjs:13` | `run-lock-identity:35,45,60`; `hot-lock-multiprocess:299`; `stop-processes-inside:48` | retire to one case each (S-10) |
| `lock-predecessor-kill-wait` | `holder-lock-checks.test.mjs:95,113`, `facade-multiprocess:256` | — | retire only with S-7 (b) |
| doctor rows merged | `holder-lock-checks.test.mjs:149-195,204-314,439`, `lock-record-checks.test.mjs` (5 cases) | — | keep every case, re-titled under the two rows |
| time-based waits left in T1 tests | `hot-lock-multiprocess:105` (600 ms), `:141` (30 ms), `hot-lock-tx:54`, `holder-lock-checks.test:89,275,287` (20 ms) | | each is a "let the other process get there" sleep; replace with the barrier-file idiom the same file already uses at `:91` |

Net tests ≈ −1 800 (Linux door) to −2 500 (with Windows), coverage of every behaviour kept by a named owner.

## Rejected hypotheses (checked, found fine)

- **A route spawn hides under the hot mutex.** No: `hot-guard.mjs:60-71` wraps every `child_process` entry and `syncBuiltinESMExports`; `withStateTx` resolves identity before the lock (`hot-lock.mjs:309`), `test/state/hot-lock-known-exec-sites.test.mjs` pins the three historic sites.
- **`guaranteeFor` spawns per acquire.** No: cached per directory per process (`driver.mjs:203-227`); 1.5 µs after the first call.
- **`hostBin` resolves per call.** No: once per process (`driver.mjs:50-70`).
- **HL-F1 is the identity exec or an fsync.** No: identity is cached (1.6 µs), the hot path has no fsync (`event-log.mjs:220` appends, no `fsyncSync`), both locks pay the same four syscalls (10.8 µs).
- **The canonical crate is slow.** No: 12.1 µs for 200 keys; the cost is marshalling (S-4).
- **Rust's holder scan would be fast.** No: 4.5 ms vs 5.5 ms; both read every `/proc/<pid>/fd`.
- **The state-root route is on a hot path.** No: the host pins `FGOS_STATE_ROOT` (`legacy_exec.rs:254`); the route runs only on the `node bin/fgos.mjs` channel, once per process (`state-root.mjs:36`).
- **`fgos convention` is on a hot path.** No: hook and doctor only.
- **The acquire's non-spawn work is significant today.** No: ≈ 40 µs (config 29 + open 3 + registry 1 + guarantee 1.5) under a 1.4 ms spawn; it becomes significant only after S-1 (S-13).
- **The session-identity cache misses per fgosDir.** No: `pid`/`unresolved` answers are keyed by env only (`session-identity.mjs:166-168`), one exec per process in the common case.
- **The 57 µs `withStateTx` reading of run 1.** JIT warm-up (5 calls); run 2 and the HL-F1 rounds give 17.4–19.3 µs, matching the baseline's 19.6.
- **`quiesce-scan` protocol 1 pairing (spec §10, 2026-10-21 caveat).** Not a T1 speed or weight item; the route stays for `fgctl`.

## Proposed additions (for the owner; none is required by the findings)

None. Every fix above replaces a route, a copy or a test with a smaller thing. The one owner question that is not an addition is S-7 (b), deleting a config key.

```text
Status: DONE_WITH_CONCERNS
Summary: Measured on the active release: every Node lock operation is a 1.3–1.4 ms host spawn (the lock itself is 1 µs, in-process acquire+release 28 µs), the Node holder scan is 5.5 ms on the `fgos run` path, identity is a 1.4 ms spawn per process, HL-F1 is a real but 1 µs cost inside WORK's region, and the T0-R1 cost is 85% N-API marshal-in (string-in halves it). Part A proposes one in-process holder-lock door, deleting hold-transport, fences, the Node route runner and the Node probe copy: ≈ −2 300 Node, −450 Rust, −1 800 tests, paying T0's +150 many times over.
Concerns/Blockers: the Windows in-process LockFileEx half (S-9) cannot be verified on this machine and should land after the Linux door behind the Windows CI job; the `git-fence-missing` condition and the fgctl WAL fence are GIT's to retire (hand-off needed); S-7 (b) and the HL-F1 bound (S-5) reverse owner-set values and belong in ask 1.
```
