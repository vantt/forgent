---
title: "4.4b Windows holder-lock driver: LockFileEx plus Job Object"
description: "Give fgos-holder-lock a Windows driver (LockFileEx in the locking process, a lock-hold helper for Node, borrowing inside a named kill-on-close job with a second job owner) and give fgos-process the windows-job domain judged by the union rule, so Windows reports kernel instead of unsupported and fgos run stops refusing with lock-driver-unavailable. macOS needs no code here."
status: pending
priority: P2
effort: 36h
branch: plan/4.4b-windows-driver
tags: [holder-lock, kernel-lock, windows, job-object, lockfileex, rust, node, cross-platform]
created: 2026-10-17
blockedBy: [261016-1306-fgctl-rust-callers-on-holder-lock, 261016-1306-main-checkout-single-door-hot-lock]
blocks: [261016-1351-run-supervisor-rust-core-direct-mode]
---

# Plan 4.4b: the Windows holder-lock driver

## Sources (binding)

- **Design r6** [design-261016-1238-...-v3-r6.md](../reports/design-261016-1238-lock-and-run-supervisor-foundation-v3-r6.md): §6.0 (lock port, driver table, Windows `lockfileex` row), §6.0.1 (predecessor rule, steps 0–4), §6.1.2 (capability matrix), §5.3 (containment port, `job-object` row), §11 entry 4.4, §12.10–12.12 (measurements).
- **Amended empty rule** from the owner-machine probe [probe-261017-0710-windows-predecessor-all-owners-dead-race.md](../reports/probe-261017-0710-windows-predecessor-all-owners-dead-race.md):
  - Run 2 showed that `JobObjectBasicProcessIdList` can omit a live, unsignaled member.
  - Run 3 (probe v3, 500 repeats, Windows 10.0.26200) met the gate: 0 violations.
  - The four driver must-haves:
    1. the union rule, re-read on every poll;
    2. fail closed on a pid that is live but cannot be opened;
    3. a second job handle owner;
    4. the Toolhelp fallback when the job cannot be opened.
  - This amendment **replaces** the count-plus-list rule in r6 §6.0.1 step 2.
- **Measured code**: [`tools/platform-probe/src/windows.rs`](../../tools/platform-probe/src/windows.rs) (`Dom`, `refresh`, `domain_active`, `make_kill_job`, `snapshot_procs`, `chain_from`) and [`predecessor.rs`](../../tools/platform-probe/src/predecessor.rs) (`enter`, union rule `Rule`).
- **Handoffs**: [4.2 phase 14](../261016-1104-holder-lock-kernel-lock-foundation/phase-14-cross-platform-drivers-handoff.md) and [4.4a phase 06](../261016-1306-fgctl-rust-callers-on-holder-lock/phase-06-cross-platform-drivers-handoff.md).
- **6.2** [plan.md](../261016-1351-run-supervisor-rust-core-direct-mode/plan.md):
  - D6: containment drivers live in 6.2 P02. This plan amends D6; see D3 below.
  - D7: Windows end-to-end for 6.2 needs this plan.

**Owner decisions applied:**
- Windows reports `unsupported` until this lands; there is never a fallback to the v1 files.
- Single user, no backward compatibility.
- Stop-everything cutover.
- Activation gate = semantics probe + borrow vectors. This plan makes the gate run on Windows.

## Current state (grep on main `0d6da9033`)

- **Holder-lock driver** — [`packages/holder-lock/rust/src/driver/windows.rs`](../../packages/holder-lock/rust/src/driver/windows.rs) is a placeholder:
  - `supported() == false`;
  - every guarantee is `unsupported`.
- **fgos-process domain** — [`packages/process/rust/src/lib.rs:72-102`](../../packages/process/rust/src/lib.rs): `domain_is_empty` and `domain_kill_all` return `Unknown`/`Refused` for `WindowsJob(String)`.
- **fgos-process platform** — [`platform/windows.rs`](../../packages/process/rust/src/platform/windows.rs):
  - `observe` and `signal_by_identity` work;
  - `lock_holders` is `Unlistable`;
  - `scan` is `Unsupported`;
  - `spawn_with_fds` is `Unsupported`;
  - `facts::file_key` is unix only ([`facts.rs:311`](../../packages/process/rust/src/facts.rs)).
- **Port** — [`port.rs`](../../packages/holder-lock/rust/src/port.rs):
  - `same_file` is unix only, so `acquire` would retry forever on Windows;
  - `run_borrowed` hands the description at fd slot 3;
  - `borrowed_check` is POSIX-shaped;
  - `wait_exited_unreaped` is a no-op off unix.
- **Semantics probe** — [`semantics.rs`](../../packages/holder-lock/rust/src/semantics.rs) spawns `sleep` holding fd 3, which is POSIX only.
- **fgctl** — [`init.rs:1045-1088`](../../packages/distribution/rust/src/init.rs): `holder_lock_gate` returns `HolderLockGate::Unsupported` on Windows and activation prints a warning.
- **Node** — [`src/holder-lock/index.mjs`](../../src/holder-lock/index.mjs) and [`driver.mjs`](../../src/holder-lock/driver.mjs): acquire hands a Node fd to `fgos internal lock-fd` at slot 3. On Windows `assertDriverUsable` throws `lock-driver-unavailable` (`unsupported-platform`).
- **Doctor** — [`src/setup/holder-lock-checks.mjs`](../../src/setup/holder-lock-checks.mjs):
  - `lock-kernel-semantics` warns on Windows (`:204`);
  - `lock-borrow-vectors` is "not applicable" on win32 (`:235`);
  - `lock-holders` cannot judge `windows-job` (`:377`).
- **CI** — [`ci.yml`](../../.github/workflows/ci.yml) tests on `ubuntu-latest` only. [`platform-probe.yml`](../../.github/workflows/platform-probe.yml) is manual.
- **6.2 P02** (`run-supervisor/p02-containment-win-mac`) has no commits of its own yet. It sits at 6.2 P00.

## Decisions

| # | Decision | Why |
|---|---|---|
| D1 | **Windows guarantee:** `{driver: "lockfileex", exclusion: kernel, borrow: job-scoped, holders: unsupported}`, and `holders()` returns `HoldersList::Unlistable`. A remote volume (`GetDriveTypeW == DRIVE_REMOTE`, or `FileRemoteProtocolInfo` readable) gives `exclusion: none` and a named refusal (`unsupported-filesystem`), like NFS/SMB on POSIX. Doctor and `fgctl` print `kernel`. **This deviates from the 4.4a P06 handoff**, which said doctor reports `job-scoped`: here `job-scoped` is the borrow level, not the exclusion level. | `LockFileEx` exclusion is kernel-enforced and measured (r6 §12.10: released 0.1 ms after `TerminateProcess`). Borrowing is correct only through the job plus the predecessor rule, which is the existing `JobScoped` level ([`port.rs:179`](../../packages/holder-lock/rust/src/port.rs)). Win32 has no API that lists byte-range lock holders. A helper self-report (r6 table) has no consumer, so it is not built (YAGNI). |
| D2 | **Borrowing on Windows is neither handle inheritance nor a duplicated handle.** `run_borrowed` runs the child inside a job that the locking process creates: named, `KILL_ON_JOB_CLOSE`, no breakaway. The locking process keeps holding the lock throughout, and the lock handle is never inheritable. <br>• **Env:** the child gets `FGOS_LOCK_JOB=<lock name>:<job name>`. The job name is not a secret, because it is written in the record and the env; the authority comes from (c)+(d) below. <br>• **Borrower check** (`borrowed_check_job`) passes only when all hold: (a) the env names this lock and a job; (b) the predecessor record names that job and a holder tuple; (c) `IsProcessInJob(self, job)`; (d) the recorded holder (pid + creation time) is in this process's Toolhelp ancestor chain, and `probe` sees the lock held. <br>• **Borrow vectors** run on Windows: the same four names plus the sibling check. Each background command writes its **Windows** pid (`/proc/$!/winpid` under Git for Windows' `sh`). The vector opens its own `SYNCHRONIZE` handle to that pid and asserts it is signaled when `run_borrowed` returns. It does not use the driver's own empty rule, so the check is not circular, and it does not rely on `probe == Free`, which is trivially true on Windows. | Measured: a child holding an inherited handle does **not** hold a `LockFileEx` lock, and the lock is released when the locking process dies (r6 §12.10). So passing a handle proves nothing. The holder's own lock plus job membership is the only real carrier. The vectors are about background processes that git leaves behind; on Windows these are job members that the release rule must end. Asserting that end with an independent handle gives the gate real meaning. |
| D3 | **The `windows-job` domain lives in this plan (P02), in `fgos-process`.** That covers `domain_watch`, `domain_is_empty`, `domain_kill_all` and the job and Toolhelp helpers. 6.2 P02 keeps `create`, `spawn_in`, `guarantee` and macOS `pgroup-tree`, and calls these functions. This amends 6.2 D6, which the owner settled on 2026-10-16. The amendment block in [6.2 phase-02](../261016-1351-run-supervisor-rust-core-direct-mode/phase-02-containment-windows-macos.md) was confirmed by the owner on 2026-10-17 13:53 and is on main. **If the owner says no:** P02 moves to 6.2 P02 unchanged in content, and 6.2 P02 lands on main **alone and early**, ahead of the rest of 6.2. That breaks the cycle "4.4b blocks 6.2, P04 waits for 6.2". | D6 kept one owner per file, and that still holds: one owner, now this plan. Without the move, P04 would wait for the whole of 6.2 (83 h, whose D7 in turn waits on this plan). 6.2 P02 has not started, so no work is lost. Its written rule (count plus list) also predates probe runs 2–3. |
| D4 | **Record shape** `windows-job.domainId` = `{job, sessionId, declaredAt, holder: {host, pid, startTime}, keeper: {host, pid, startTime} \| null}`. <br>• `declaredAt` is the FILETIME at declare. <br>• `keeper` is filled by rewriting the record (tmp + rename) right after the keeper's ack, before any member exists. <br>• `startTime` is the creation FILETIME as a decimal string, as `platform/windows.rs` writes it. <br>• `v` stays `1`. A string `domainId` (the old shape) parses to `None`, so it stays fail-closed. <br>The same shape is used everywhere and is asserted in P00's contract test. | The holder tuple is needed by the tree source and the fallback. `declaredAt` and the keeper tuple let the tree source exclude the holder, the keeper and anything older than the borrow (D5). `sessionId` closes the cross-session case (D5). No Windows record was ever written, and there is no backward compatibility to keep. |
| D5 | **Two views of a `windows-job` domain** (fixes red-team findings 1 and 6). <br>**Job view**, used by the release rule (step 0) and the keeper: `ActiveProcesses == 0` **and** every member ever named by `JobObjectBasicProcessIdList` ∪ {Toolhelp processes where `IsProcessInJob`} is signaled. It never uses the holder tree, never includes the holder or keeper, never kills outside the job, and never opens a snapshot in the keeper. <br>**Contender view**, used by `admit` after the kernel lock is held: <br>• **Recorded holder alive** (pid + creation time match): it released normally. Judge with the job view; if that view is not empty (a step-0 violation), `TerminateJobObject` only. Never signal the holder or the keeper. <br>• **Recorded holder dead:** the union of three sources, re-read on every poll: (1) the job list; (2) the in-job scan; (3) the **tree** = descendants of the recorded holder **created at or after `declaredAt`**, excluding the keeper tuple. A tree process whose parent is a tree node but whose creation time cannot be read is an **unopenable member**. So is any named pid whose `OpenProcess(SYNCHRONIZE)` fails with anything but `ERROR_INVALID_PARAMETER`. While present in the snapshot it keeps the domain **not empty** (must-have 2). <br>• **Job does not open:** Toolhelp fallback over the tree source only, with the same rules, and **two consecutive quiet snapshots** are required (as in the probe's `fallback_wait`). <br>• **Kill** = `TerminateJobObject`, plus `signal_by_identity(Kill)` for tree members not in the job. <br>• **Record `sessionId` differs from the contender's session:** `NotEmpty`, with reason `predecessor-other-session`. That is fail closed; the fallback is never used across sessions. <br>Job names are `Local\fgos-borrow-<sanitized lock name>-<pid>-<creation>-<counter>`. | Using the probe's tree walk while the holder is alive put the holder and the keeper inside their own domain: every borrow would end in `LeftoverNotKilled`, keepers would leak, and a stale record would kill a live Rust holder's tree. The probe only ever walked a dead holder's tree. The probe skipped unopenable pids, and its tree walk skipped processes without a creation time, so must-have 2 is stated here explicitly. `Local\` and session isolation follow the probe's naming. **This is probe v3's rule plus three changes:** the holder-alive split, the `declaredAt`/keeper exclusion, and fail closed in the tree. The changes are tested by P02 and gated by P06. |
| D6 | **Second job owner = `job-keeper`**, spawned **by the locking process** before the job gets any member and kept outside the job. It opens the job by name and acks. It **exits only when both hold**: (i) the holder has written its `finished` line, or the holder's `SYNCHRONIZE` handle is signaled; **and** (ii) the job view is empty. It polls every 50 ms with the list and count only, never a Toolhelp snapshot. It never exits just because its stdin closed. | r6 §6.0.1 step 1 says the Node facade spawns the keeper. Spawning it from the locking process gives the same property (outside the job, survives the holder's death; measured in run 3, `predecessor-dying-job-open`) and one code path for every holder. Exiting on "empty" alone would end the keeper before git is even assigned (red-team finding 2). The keeper never decides admission, so a cheap poll is enough. |
| D7 | **Node on Windows: one `fgos internal lock-hold` helper per held lock** (r6 §6.0 measured design). Node passes a private work directory `os.tmpdir()/fgos-lock-hold-<pid>-<seq>-<rand>/`. <br>• **Acquire:** the helper acquires in-process and writes `ready.json` (tmp + rename). `acquireSync` polls for it with `Atomics.wait`; `acquire` polls with `setTimeout`. <br>• **Requests:** Node writes request files `req-<n>.json` (tmp + rename) into the work directory. The helper polls the directory every 5 ms. Nothing depends on writing to stdin from sync code: libuv queues pipe writes and shutdowns until the loop turns, and `Atomics.wait` blocks the loop. <br>• **Release:** `release()` already refuses while a borrow runs (`index.mjs:85`), so the helper's domain is empty. Release = `child.kill()` (`TerminateProcess`; the lock is free 0.1 ms later) plus a bounded wait for exit. Sync code polls `process.kill(pid, 0)`; the pid cannot be reused while libuv still holds the unreaped child handle, and it does until the loop turns. Async code awaits `'exit'`. <br>• **Async borrow** returns a ChildProcess-shaped object: `pid` (git's Windows pid, from `started.json`), `stdout`/`stderr` streams that tail the output files every 20 ms, `'exit'`/`'close'`/`'error'` events, `kill()` (a `{op: "cancel"}` request → `TerminateJobObject`) and `borrowed`. That keeps `spawnHolding` (`provider-capacity.mjs:419`, `provider-credential-probe.mjs:109-129`) working. <br>• **Lifetime:** libuv puts every non-detached Node child in a process-wide `KILL_ON_JOB_CLOSE` job, so the helper dies with Node. Its `SILENT_BREAKAWAY_OK` means the keeper and git are outside that job, so the crash path stays correct. The helper still waits on its parent's handle, for a non-Node parent. Node `unref`s the helper and its pipes, so a held lock never keeps a CLI's event loop alive. The helper's stdout and stderr go to files, and stdin is `'ignore'`. <br>• **Parent death mid-borrow:** `TerminateJobObject` at once, wait for the job view up to `kill_wait`, then unlock and exit. | Node cannot call `LockFileEx` (no addon, r6 §6.3), and the lock belongs to the locking process, so a process must live as long as the lock. Red-team findings 3, 4, 8 and 9 each break one half of the earlier stdin protocol; this shape avoids the event-loop dependency entirely. |
| D8 | **Rust in-process holders on Windows** (`fgctl` activation, `install.lock`, observe) call `LockFileEx` on their own `File`, offset 0, length 1, as in the probe. Every successful `try_lock` returns a `Locked<'_>` guard whose drop calls the new driver hook `before_close`: `UnlockFileEx` on Windows, a no-op on POSIX. That covers `Handle`, the `same_file` and `admit` drop paths, `probe`, `borrowed_check` and `semantics`. `ERROR_IO_PENDING` is an error. `same_file` on Windows compares `FILE_ID_INFO` in full (volume serial + 128-bit id, `GetFileInformationByHandleEx(FileIdInfo)`) between the locked handle and a fresh handle to the path. | On Windows no other process can share a lock, so an explicit unlock is equivalent and deterministic; MS docs say unlock on close "depends upon available system resources". The POSIX close-only rule exists because borrowed copies share a description, and that cannot happen here. The 64-bit file index is not unique on ReFS or Dev Drive. A lingering `Sh` from `probe` would give contenders a spurious `Held`. |
| D9 | **Helper roles via an explicit helper executable.** The crate API takes `HelperExe` (a path). Production passes `std::env::current_exe()`; tests in `apps/fgos/tests/` and `apps/fgctl/tests/` pass `env!("CARGO_BIN_EXE_…")`. That is a real parameter, not a test switch. **Roles** (`probe-holder`, `job-keeper`) are entered as `fgos internal holder-lock-helper <role> …`, which goes through the existing `internal` dispatch first (`apps/fgos/src/main.rs:154`), and as a hidden `fgctl internal holder-lock-helper <role>` arm that is matched before the subcommand match (`apps/fgctl/src/main.rs:30`). Both call `fgos_holder_lock::helper::main(args)`. | The `fgctl` gate must not run anything under the candidate release (`init.rs:1041`), so `fgctl` re-execs itself. Inside a libtest binary `current_exe()` is the test binary, which knows no roles (red-team finding 5). So every Windows test that spawns a role lives in the binary crates' `tests/`. A leading-dash selector would break the R1 argv rule in `apps/fgos/src/main.rs`. |
| D10 | **Doctor on Windows.** <br>• `lock-kernel-semantics`: passes on `lockfileex` + `kernel` + a green two-process probe. The Windows warn branch is deleted, and a guarantee of `unsupported` now fails by name. <br>• `lock-borrow-vectors`: runs the Windows set (D2); red = FAIL; the `win32` branch is deleted. <br>• `lock-holders`: holders are unlistable (info). A `windows-job` record is judged by a new **read-only** flag `fgos internal lock-fd --predecessor-state <lockFile>` (contender view, one pass, never kills). The Node `judge()` for `linux-gate`/`macos-tree` records stays as it is, so there is no Linux change. | Same contract as POSIX; the only platform difference is in the driver. |
| D11 | **`fgctl` gate on Windows:** `HolderLockGate::Unsupported` and the warning line are deleted. Windows runs guarantee + two-process probe + borrow vectors like the other platforms; red refuses activation. A platform with no driver now refuses (`lock-kernel-semantics-failed`). | Applies the owner's gate decision to Windows now that the vectors run there. |
| D12 | **CI** = a new workflow `holder-lock-cross-platform.yml`, triggered on `push` with path filters and on `workflow_dispatch`. Matrix: `windows-latest`, `macos-latest`. Steps: `cargo test -p fgos-process -p fgos-holder-lock -p fgos-distribution -p fgos -p fgctl --tests`, `cargo build -p fgos`, then the Node Windows tests with an `if compgen -G …; then node --test …; else echo …; fi` guard, so a failing test fails the step. **Acceptance gate** = the stress test `apps/fgos/tests/windows_predecessor_stress.rs` (`#[ignore]`). It drives the **shipped** path: the holder is `fgos.exe internal lock-hold` with a borrow request, the keeper is the real role, and the contender is an in-process `acquire(Wait)`. It runs 500 repeats each of `all-owners-dead`, `dying-job-open` and `borrow-hook-predecessor-check` on the owner's machine (Windows 10.0.26200, herdr on PATH), from the exe that the manual `stress-artifact` job builds. **Required:** 0 violations; `dying-job-open` opens the job in ≥ 50 % of repeats (keeper-kill delay calibrated from 20 warm-up repeats); the per-source attribution (`namedByOneSourceOnly`) is reported. A deterministic unit test of the union decision covers "the list omits a live member", which runs 2–3 could not force. | Windows code cannot run on the Linux dev box (only `cargo check --target x86_64-pc-windows-msvc`), so every phase needs a real runner. The race is rare, so CI's few repeats cannot be the gate. Run 3 never reproduced the list omission, so a synthetic test must cover it. `ci.yml` stays Linux-only. |
| D13 | **macOS: nothing in this plan, and no separate plan.** The `flock` driver runs and is gated at activation (4.2). `macos-tree` containment is 6.2 P02 (D6 there, not moved). Holders stay unlistable. The only macOS change is the `macos-latest` CI leg (D12). | X2 measured `flock` exclusion and borrow on real macOS (r6 §12.10). Nothing on macOS reports `unsupported`. |
| D14 | **Windows `ProcessPlatform::scan` stays `Unsupported`.** The fence quiesce scan needs argv, and Toolhelp has no command line. Fences on Windows use the attested path that already exists (`holder-lock-checks.mjs:520`). | YAGNI. Reading the PEB command line is fragile, and the single Windows workspace can be stopped by hand. |
| D15 | **Sequencing:** wave 0 branches from main after 4.4a ([plan](../261016-1306-fgctl-rust-callers-on-holder-lock/plan.md); edits `init.rs`, `store.rs`, `store_lock.rs`) and 4.3 ([plan](../261016-1306-main-checkout-single-door-hot-lock/plan.md); edits `src/holder-lock/*`) have landed. **Phase leads never push.** A phase that needs its Windows CI run asks the big lead (`forgentx-95`) to push `win-driver/pNN-*`, and reports the run id. | Both plans are in flight and own files this plan touches. The push rule stays with the big lead. |

## Phases and dependencies

| Phase | Content | Depends on | Wave | Hours |
|---|---|---|---|---|
| [00](phase-00-contracts-and-dependencies.md) | Contracts (guarantee, record shape, `lock-hold`, helper roles, borrow env, Windows vectors, `--predecessor-state`), `windows-sys` deps | 4.4a, 4.3 landed; D3 answered | 0 | 2 |
| [01](phase-01-lockfileex-driver-core.md) | `LockFileEx` driver, `Locked` guard + `before_close`, `FILE_ID_INFO` `same_file`, guarantee, `HelperExe` + role dispatch + `probe-holder`, CI workflow | 00 | 1 | 6 |
| [02](phase-02-windows-job-domain.md) | `fgos-process` `windows-job` domain: job view + contender view, fail closed, Toolhelp fallback, kill; job helpers; record shape | 00 | 1 | 7 |
| [03](phase-03-node-lock-hold-helper.md) | `fgos internal lock-hold` (work dir, request files) + Node facade acquire/release/probe on Windows | 01 | 2 | 5 |
| [04](phase-04-windows-borrowing.md) | `run_borrowed` in a named job + `job-keeper` + borrower check + Windows vectors + Node `runBorrowed` (sync + ChildProcess-shaped async) + stress test | 01, 02, 03 | 3 | 10 |
| [05](phase-05-doctor-gate-docs.md) | Doctor, `fgctl` gate, `--predecessor-state`, remaining Windows branches, spec/docs/CHANGELOG | 01–04 | 4 | 3 |
| [06](phase-06-integration-gate-landing.md) | Integration, CI run ids, review, owner's 500-repeat gate, landing and activation | 00–05 | 5 | 3 (Lead) |

```text
wave 0: P00
wave 1: P01 ∥ P02            (holder-lock crate vs fgos-process crate + predecessor.rs; disjoint files, see table)
wave 2: P03                  (needs the in-process driver from P01)
wave 3: P04                  (needs P01 driver, P02 domain, P03 helper)
wave 4: P05
wave 5: P06 (Lead)           ──> unblocks 6.2 D7 (Windows end-to-end)
```

**Branches and worktrees:**
- **Integration branch:** `win-driver/integration`, worktree `.claude/worktrees/wd-integration`, created from main once D15 holds.
- **Phase branches:** `win-driver/pNN-<slug>`, worktree `.claude/worktrees/wd-pNN`, created from the integration head at the start of each wave.
- **Merge order:** P00 → P01 → P02 → P03 → P04 → P05.

**File ownership** (one owner per file; anything not listed is untouched):

| File | Owner |
|---|---|
| `packages/holder-lock/contracts/*` | P00 |
| `packages/process/rust/Cargo.toml`, `packages/holder-lock/rust/Cargo.toml` | P00 |
| `packages/holder-lock/rust/src/driver/windows.rs`, `driver/mod.rs`, `semantics.rs`, new `helper.rs`, `lib.rs` | P01; P04 adds `job-keeper` to `helper.rs` |
| `packages/holder-lock/rust/src/port.rs` | P01 (`Locked`, `same_file`, `HelperExe`), then P04 (`run_borrowed`, `borrowed_check_job`) |
| `packages/holder-lock/rust/tests/common/mod.rs`, `tests/windows_lockfileex.rs` | P01 |
| `packages/process/rust/src/lib.rs`, new `src/platform/windows_job.rs`, `src/platform/mod.rs`, new `tests/windows_job_domain.rs` | P02 |
| `packages/holder-lock/rust/src/predecessor.rs`, new `packages/holder-lock/rust/tests/predecessor_record_shape.rs` | P02 |
| `packages/holder-lock/rust/src/route.rs` | P03 (`lock-hold`, `--probe`), then P04 (requests), then P05 (`--predecessor-state`) |
| `apps/fgos/src/main.rs`, `apps/fgctl/src/main.rs` (role dispatch line) | P01 |
| `apps/fgos/tests/windows_*.rs`, `apps/fgctl/tests/windows_*.rs` | the phase that creates each file (P01, P03, P04, P05) |
| `src/holder-lock/driver.mjs`, `index.mjs` | P03, then P04 |
| `packages/holder-lock/rust/src/borrow_vectors.rs` | P04 |
| `src/runner/dispatch/adapters.mjs` (one scrub line, `FGOS_LOCK_JOB`); `src/runner/provider-capacity.mjs`, `provider-credential-probe.mjs` (only a kill call, if needed) | P04 |
| `packages/holder-lock/rust/src/predecessor.rs` `admit_with_trace` | P04 (after P02 is merged) |
| `src/setup/holder-lock-checks.mjs`, `packages/distribution/rust/src/init.rs`, `docs/platform/holder-lock/spec.md`, `CHANGELOG.md` | P05 |
| `.github/workflows/holder-lock-cross-platform.yml` | P01; P04 adds the `stress-artifact` job |
| Root `Cargo.lock` | regenerated with `cargo build` by whoever merges second |

No phase edits `bin/fgos.mjs`, `test/test-ownership.mjs` or `src/setup/registrations.mjs`, unless a new test file needs an ownership row. In that case the owning phase adds it and says so in its report.

## Data flow (Windows)

```text
Node acquireSync(scope, name)
  └─ mkdir W=os.tmpdir()/fgos-lock-hold-<pid>-<seq>-<rand>/
     spawn  fgos internal lock-hold --path P --mode ex --wait-ms N --kill-wait-ms K --work W   (stdio: ignore; child.unref())
        helper: OpenProcess(parent, SYNCHRONIZE) → port::acquire  [LockFileEx(0,1) via Locked guard + same_file(FILE_ID_INFO) + admit]
                admit: windows-job record → contender view (D5): holder alive → job view, TerminateJobObject only
                                                               holder dead → union (list ∪ in-job scan ∪ tree≥declaredAt minus keeper), fail closed
                                                               job unopenable → tree fallback, 2 quiet snapshots; other session → NotEmpty
                write W/ready.json → poll W/req-*.json every 5 ms | parent handle signaled
  └─ Atomics.wait poll W/ready.json → handle = {helper child, W}
Node runBorrowed(handle, git commit)
  └─ write W/req-<n>.json {op: borrow, argv, cwd, env, stdin}
        helper (port::run_borrowed, Windows half):
          declare record {job: Local\fgos-borrow-…, sessionId, declaredAt, holder: self, keeper: null}
          CreateJobObjectW(KILL_ON_JOB_CLOSE, no breakaway)
          spawn <HelperExe> internal holder-lock-helper job-keeper … → ack → rewrite record with keeper tuple
          Command(git).creation_flags(CREATE_SUSPENDED) → main thread via TH32CS_SNAPTHREAD → Assign → ResumeThread
             env FGOS_LOCK_JOB=<lock>:<job>  → hook: borrowed_check_job (D2 a–d)
          W/started.json {pid} → wait git → TerminateJobObject → job view empty ≤ K → W/result-<n>.json
          write "finished" to keeper → keeper: finished ∧ job view empty → exit
Node release(handle) → child.kill() (TerminateProcess) → bounded wait for exit → rm W
Rust holder (fgctl/observe) → port::acquire in-process; release = Locked drop → UnlockFileEx + close (D8)
```

## Done criteria

1. On `windows-latest` (CI run ids recorded):
   - `cargo test -p fgos-process -p fgos-holder-lock -p fgos-distribution -p fgos -p fgctl` is green;
   - the Node Windows tests are green;
   - the `stress-artifact` job is green with 50 repeats.
   - The same workflow on `macos-latest` is green.
2. On Linux: `cargo test` for the same crates and the full `npm test` are green on `win-driver/integration`, run with `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<integration build>`.
3. `cargo check --target x86_64-pc-windows-msvc --target aarch64-apple-darwin` is green for `fgos-process`, `fgos-holder-lock`, `fgos-distribution`, `fgos` and `fgctl`.
4. **Acceptance gate:** the owner runs the stress exe on their machine.
   - Every scenario gives 500 repeats with 0 violations.
   - `dying-job-open` opens the job in ≥ 50 % of repeats.
   - Per-source attribution is reported.
   - The JSON report is committed under `plans/reports/`.
5. On the owner's Windows workspace, after the new `fgctl.exe` is installed and the workspace activated:
   - `fgos doctor` reports `lock-kernel-semantics` with `"driver":"lockfileex","exclusion":"kernel"` and a green probe;
   - `lock-borrow-vectors` passes;
   - `fgctl upgrade` ran the gate, with no "unsupported" line;
   - `fgos run "<read-only prompt>"` gets past lock acquisition with no `lock-driver-unavailable`. Any later failure is named and recorded; the full Windows `direct` run is 6.2 D7.
6. `rg -n "unsupported on Windows|no holder-lock driver yet|not applicable on Windows|HolderLockGate::Unsupported" src packages scripts` is empty. The `CHANGELOG.md` `[Unreleased]` section says that Windows now has the driver.

## Main risks

| Risk | Likelihood × impact | Mitigation |
|---|---|---|
| Owner does not confirm D3 | Medium × Medium | 6.2 P02 takes P02's content and lands alone, early (D3). Every other phase is unaffected. |
| The Node sync wait (`Atomics.wait` poll on files) adds latency to cold-path acquires | High × Low | Cold path only (r6 §6.6). Measured in P03 and reported as p50/p95. The hot `events.lock` path does not use the port. |
| The stress run surfaces a new race | Low × High | D5 is probe v3 plus three tested changes. The stress test logs, per violation, which sources named each live pid, so a fix is evidence-led. The gate stays closed until 0. |
| The contender view misjudges a live holder that violated step 0 | Low × Medium | Only the job is terminated, never the holder or the keeper. P02 test 9 covers it. |
| `job-keeper` lives on while a dead holder's members still run and no contender comes | Low × Low | That is correct: the domain is not empty. `lock-holders` shows the record, and the next acquire terminates the job. |
| `windows-latest` and the owner's machine differ (Server 10.0.26100 vs client 10.0.26200; CI steps may themselves run inside a job) | Medium × Medium | Both are required: CI for regressions, the owner's machine for the gate. Nested jobs work on Windows 8+; P02 records whether its process runs in a job. |
| The Windows runner is slow or costly on every push | Low × Low | Path filters; matrix of two. |

## Rollback

- **Before landing:** drop `win-driver/*`.
- **After landing:** revert the merge on main; restage and reactivate the previous release on the three Linux workspaces. On Windows, reactivating the previous release makes the locks `unsupported` again, which is the state before this plan.
- Lock files carry no data. A `windows-job` predecessor record left behind is judged `NotEmpty` by an old release (unknown shape), so it stays fail-closed.

## Red-team

One Opus review: [red-team-261017-1330-windows-lockfileex-driver-plan-review.md](../reports/red-team-261017-1330-windows-lockfileex-driver-plan-review.md). It made 18 findings, and all were applied. The ones that changed decisions:

| Finding | Where applied |
|---|---|
| 1, 2: the holder tree and the keeper's exit rule | D4, D5, D6 |
| 3, 4, 8, 9: the Node helper protocol | D7 |
| 5, 18.4: self re-exec in tests and the helper selector | D9 |
| 6: fail closed in the tree and fallback | D5 |
| 7: the CI guard | D12 |
| 11, 18.1, 18.3: unlock paths, file identity, `ERROR_IO_PENDING` | D8 |
| 12: stress gate thresholds | D12 |
| 13: phantom vectors | D2 |
| 14: job namespace and sessions | D5 |
| 16: record shape | D4 |
| 17: the D3 amendment and the rejection path | D3 |
| 18.2: token claim and crypto feature | D2, D5 |
| 18.5: Windows `fgctl` bootstrap | P06 |
| 18.8: deviation from the 4.4a handoff | D1 |
| 18.9: Linux judge | D10 |

Findings 10 and 15 changed only phase text.

## Open questions (for the big lead / owner)

1. **D3 amends 6.2 D6, which the owner settled on 2026-10-16:** the `windows-job` domain functions move from 6.2 P02 to this plan's P02. **Recommended: yes.** Without the move, Windows stays `unsupported` until all of 6.2 lands. The amendment block in 6.2 phase-02 is on this branch only, and must not reach main without confirmation. If the answer is no, delete the block, move P02's content to 6.2 P02 and land 6.2 P02 alone and early.
2. **Stress gate run:** the owner runs the stress exe on their Windows machine (about 15 minutes, like run 3). P06 cannot close without it.
3. **For 6.2's owner:** for an attempt job, is the recorded holder (the gate) always a job member? If so, the holder-alive split in D5 changes nothing for attempts, and only holder-lock borrows rely on it.
