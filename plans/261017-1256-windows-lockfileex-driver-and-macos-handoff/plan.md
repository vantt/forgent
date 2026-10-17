---
title: "4.4b Windows holder-lock driver: LockFileEx plus Job Object"
description: "Give fgos-holder-lock a Windows driver (LockFileEx in the locking process, a lock-hold helper for Node, borrowing inside a named kill-on-close job with a second job owner) and give fgos-process the windows-job domain judged by the union rule, so Windows reports kernel instead of unsupported and fgos run stops refusing with lock-driver-unavailable. macOS needs no code here."
status: pending
priority: P2
effort: 30h
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
| D1 | **Windows guarantee:** `{driver: "lockfileex", exclusion: kernel, borrow: job-scoped, holders: unsupported}`. A remote volume (`GetDriveTypeW == DRIVE_REMOTE`, or `FileRemoteProtocolInfo` readable) gives `exclusion: none` and a named refusal (`unsupported-filesystem`), like NFS/SMB on POSIX. Doctor and `fgctl` print `kernel`. | `LockFileEx` exclusion is kernel-enforced and measured (r6 §12.10: released 0.1 ms after `TerminateProcess`). Borrowing is correct only through the job plus the predecessor rule, which is exactly the existing `JobScoped` level ([`port.rs:179`](../../packages/holder-lock/rust/src/port.rs)). Listing holders has no Win32 API, so `unsupported` like macOS `unlistable`; a helper self-report (r6 table "helper tự báo") is not built. YAGNI: no consumer needs it. |
| D2 | **Borrowing on Windows is neither handle inheritance nor a duplicated handle.** `run_borrowed` runs the child inside a named `KILL_ON_JOB_CLOSE` job, without breakaway, created by the locking process, which keeps holding the lock throughout. The lock handle is never inheritable. The child gets `FGOS_LOCK_JOB=<lock name>:<job name>`; the job name carries a 128-bit token, so it acts as the one-time token. **Borrower check** (`borrowed_check` on Windows) passes only when all four hold: (a) the env names this lock and a job; (b) `<lock>.predecessor.json` names that job and a holder tuple; (c) `IsProcessInJob(self, job)`; (d) the recorded holder (pid + creation time) is in this process's Toolhelp ancestor chain, and `probe` sees the lock held. **Borrow vectors run on Windows** with the same four names plus the sibling check. Their assertion is Windows-specific: when `run_borrowed` returns, every process the borrow created is signaled (job empty under the union rule), and right after release the lock is free. | Measured: a child holding an inherited handle does **not** hold a `LockFileEx` lock, and the lock is released when the locking process dies (r6 §12.10). So passing a handle proves nothing and gives no authority. The holder process's own lock plus job membership is the only real carrier. The vectors are about background processes that git leaves behind; on Windows these are job members, which the release rule (step 0) must end. So the same scenarios, asserted on what Windows can leak, give the gate real meaning instead of "not applicable". |
| D3 | **The `windows-job` domain (`domain_is_empty`, `domain_kill_all` and the Toolhelp helpers) is built here (P02), in `fgos-process`, not in 6.2 P02.** 6.2 P02 keeps `create`, `spawn_in`, `guarantee` and macOS `pgroup-tree`, and calls these functions. This amends 6.2 D6; the amendment is written into [6.2 phase-02](../261016-1351-run-supervisor-rust-core-direct-mode/phase-02-containment-windows-macos.md) in the same commit. **Needs the owner's confirmation** (open question 1). | D6 kept one owner per file, and that still holds: one owner, now this plan. Without the move, P04 here would wait for 6.2 to land (an 83 h plan, D7 in turn waits on this one), so Windows would stay `unsupported` through all of 6.2. 6.2 P02 has not started, so no work is lost. Its written rule (count plus list) also predates runs 2–3 and would have to change anyway. |
| D4 | **Record shape:** `windows-job` `domainId` becomes `{ "job": "<name>", "holder": { "pid": n, "startTime": "<creation FILETIME>" } }`, so `Domain::WindowsJob` becomes a struct. `v` stays `1`. | The union rule's third source (the holder's process tree) and the Toolhelp fallback both need the holder tuple; a job name alone cannot give it. No Windows record was ever written, because the driver reported `unsupported`, and there is no backward compatibility to keep. |
| D5 | **Empty rule = probe v3, unchanged.** The domain is the union of: (1) `JobObjectBasicProcessIdList`; (2) every Toolhelp process for which `IsProcessInJob` is true; (3) the recorded holder's tree (parent chain by pid + creation time). The union is re-read on every poll; each member gets a `SYNCHRONIZE` handle. "Empty" means `ActiveProcesses == 0` **and** every member ever named is signaled. A pid named by a source whose `OpenProcess(SYNCHRONIZE)` fails and that is still present in the next snapshot keeps the domain **not empty** (fail closed). The probe skipped such a pid; the driver must not. When the job cannot be opened: Toolhelp fallback over the holder's tree only, with the same signaled and fail-closed rules. `domain_kill_all` = `TerminateJobObject`, plus `TerminateProcess` by identity for tree members outside the job (the fallback path). | Run 3: 0/500 and 0/495 violations, with the union and a second owner. Run 2 proved that the list alone misses members. The fail-closed clause is the review note recorded in the probe report. |
| D6 | **Second job owner = `job-keeper`**: a helper process spawned **by the locking process** before the job gets any member, and kept outside the job. It opens the job by name and exits only when the domain is empty under D5. It never exits on its parent's death or on a closed stdin. | r6 §6.0.1 step 1 says the Node facade spawns the keeper. Spawning it from the locking process gives the same property (outside the job, survives the holder's death; measured in run 3, `predecessor-dying-job-open`) **and** one code path for every holder: the Node `lock-hold` helper and Rust in-process holders (borrow vectors in `fgctl`, later the 6.2 supervisor). |
| D7 | **Node on Windows: one `fgos internal lock-hold` helper per held lock** (r6 §6.0 measured design). <br>• **Acquire:** the helper runs `acquire` in-process (`LockFileEx` plus the predecessor rule), writes the result to a ready file whose path Node passes in, then waits on a `SYNCHRONIZE` handle to its parent (opened at start, while the parent blocks) and on stdin lines. <br>• **Waiting from Node:** `acquireSync` polls for the ready file with `Atomics.wait`; `acquire` polls with `setTimeout`. <br>• **Release:** Node closes the helper's stdin; the helper ends its domain (release rule) and exits; `release` polls `process.kill(pid, 0)` until the helper is gone, bounded by kill wait plus slack, and past the bound kills it. <br>• **Borrow:** one JSON request line on stdin; the result arrives through a result file. | Node cannot call `LockFileEx` (no addon, r6 §6.3), and the lock belongs to the locking process, so a process must live as long as the lock. Released means gone, so a re-acquire right after `release()` behaves as on POSIX. |
| D8 | **Rust in-process holders on Windows** (`fgctl` activation, `install.lock`, observe) call `LockFileEx` on their own `File` with offset 0 and length 1, as in the probe. Release = `UnlockFileEx`, then close. This is a new driver hook, `before_close`, a no-op on POSIX. They create no domain, so the predecessor rule only reads records. `same_file` on Windows compares volume serial plus file index (`GetFileInformationByHandle`) through `fgos_process::facts::file_key`. | On Windows no other process can share a lock, so an explicit unlock is equivalent and deterministic. MS docs: unlock on close "depends upon available system resources". The POSIX close-only rule exists because borrowed copies share a description, and that cannot happen here. Without `file_key` on Windows, `acquire` loops on the inode check. |
| D9 | **Helper roles inside `fgctl` and `fgos` via self re-exec:** the crate gets `fgos_holder_lock::helper::run_if_requested()`, called first in `fgos` and `fgctl` `main`. Hidden roles are selected by `argv[1] == "--fgos-holder-lock-helper"`: `probe-holder` (the semantics probe's second process) and `job-keeper` (D6). `lock-hold` stays a contracted `fgos internal` route, because only Node calls it. | The `fgctl` gate must not run anything under the candidate release (`init.rs:1041`), yet on Windows the two-process probe and the keeper need a process that runs this crate's code. Self re-exec is real behavior, not a test switch. |
| D10 | **Doctor on Windows.** <br>• `lock-kernel-semantics`: passes on `lockfileex` + `kernel` + a green two-process probe; the Windows warn branch is deleted. <br>• `lock-borrow-vectors`: runs the Windows set (D2); red = FAIL; the `win32` "not applicable" branch is deleted. <br>• `lock-holders`: holders are `unlistable` (info); a `windows-job` predecessor record is judged by a new **read-only** flag, `fgos internal lock-fd --predecessor-state <lockFile>` (`domain_is_empty`, never kills); a non-empty domain warns, as on Linux. | Same contract as POSIX; the only platform difference is in the driver. |
| D11 | **`fgctl` gate on Windows:** `HolderLockGate::Unsupported` and the warning line are deleted. Windows runs guarantee + two-process probe + borrow vectors, like Linux and macOS; red refuses activation (`lock-kernel-semantics-failed` / `lock-borrow-vectors-failed`). | Applies the owner's gate decision to Windows now that the vectors run there. |
| D12 | **CI** = a new workflow `holder-lock-cross-platform.yml`, triggered on `push` with path filters (holder-lock, process, distribution `init.rs`, `src/holder-lock/**`, `src/setup/holder-lock-checks.mjs`, the workflow itself) and on `workflow_dispatch`. Matrix: `windows-latest`, `macos-latest`. Steps: `cargo test -p fgos-process -p fgos-holder-lock -p fgos-distribution`, `cargo build -p fgos`, then `node --test test/holder-lock/windows-*.test.mjs` with `FGOS_HOST_BIN` set (the Node files skip on non-win32 with a named reason). **Acceptance gate** = the ignored stress test `windows_predecessor_stress` (P04): 500 repeats each of `all-owners-dead`, `dying-job-open` and `borrow-hook-predecessor-check`, run on the owner's machine (Windows 10.0.26200, herdr on PATH) from the test exe built by the manual job `stress-artifact`. Required: 0 violations. | Windows code cannot run on the Linux dev box (only `cargo check --target x86_64-pc-windows-msvc`), so every phase needs a real runner. A path-filtered push trigger proves each phase branch once it is pushed. `ci.yml` stays Linux-only, as it is today. The race is rare (1 in 50 to 1 in 200 before the union rule), so CI's few repeats cannot be the gate. The owner's machine is where runs 1–3 ran. |
| D13 | **macOS: nothing in this plan, and no separate plan.** The `flock` driver runs and is gated at activation (4.2). `macos-tree` containment is 6.2 P02 (D6 there, not moved). Holders stay `unlistable`. The only macOS change is the `macos-latest` CI leg from D12, which proves the crates on every relevant push. | X2 measured `flock` exclusion and borrow on real macOS (r6 §12.10). Nothing on macOS reports `unsupported`. |
| D14 | **Windows `ProcessPlatform::scan` stays `Unsupported`.** The fence quiesce scan needs argv, and Toolhelp has no command line. Fences on Windows use the attested path that already exists (`holder-lock-checks.mjs:520`). | YAGNI. Reading the PEB command line is fragile, and the single Windows workspace can be stopped by hand. |
| D15 | **Sequencing:** wave 0 branches from main after 4.4a ([plan](../261016-1306-fgctl-rust-callers-on-holder-lock/plan.md), edits `init.rs`, `store.rs`, `store_lock.rs`) and 4.3 ([plan](../261016-1306-main-checkout-single-door-hot-lock/plan.md), edits `src/holder-lock/*`) have landed. **Phase leads never push** (common rules). When a phase needs its Windows CI run, the phase lead asks the big lead (`forgentx-95`) to push `win-driver/pNN-*` and reports the run id. | Both plans are in flight and own files this plan touches. The push rule stays with the big lead. |

## Phases and dependencies

| Phase | Content | Depends on | Wave | Hours |
|---|---|---|---|---|
| [00](phase-00-contracts-and-dependencies.md) | Contracts (guarantee, record shape, `lock-hold`, helper roles, borrow env, Windows vectors, `--predecessor-state`), `windows-sys` deps, 6.2 P02 amendment check | 4.4a, 4.3 landed | 0 | 2 |
| [01](phase-01-lockfileex-driver-core.md) | `LockFileEx` driver, `file_key`, `before_close`, guarantee, semantics probe-holder role, helper entry in `fgos`/`fgctl`, CI workflow | 00 | 1 | 6 |
| [02](phase-02-windows-job-domain.md) | `fgos-process` `windows-job` domain: union rule, fail closed, Toolhelp fallback, kill; record shape | 00 | 1 | 6 |
| [03](phase-03-node-lock-hold-helper.md) | `fgos internal lock-hold` + Node facade acquire/release/probe on Windows | 01 | 2 | 5 |
| [04](phase-04-windows-borrowing.md) | `run_borrowed` in a named job + `job-keeper` role + borrower check + Windows borrow vectors + Node `runBorrowed` + stress test | 01, 02, 03 | 3 | 8 |
| [05](phase-05-doctor-gate-docs.md) | Doctor, `fgctl` gate, `--predecessor-state`, Windows branches in Node, spec/docs/CHANGELOG | 01–04 | 4 | 3 |
| [06](phase-06-integration-gate-landing.md) | Integration, CI run ids, owner's 500-repeat gate, landing and activation | 00–05 | 5 | 3 (Lead) |

```text
wave 0: P00
wave 1: P01 ∥ P02            (holder-lock crate vs fgos-process crate; disjoint files)
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
| `packages/holder-lock/rust/src/driver/windows.rs`, `driver/mod.rs`, `semantics.rs`, new `helper.rs`, `lib.rs` | P01 |
| `packages/holder-lock/rust/src/port.rs` | P01 (`same_file`, `before_close`), then P04 (`run_borrowed`, `borrowed_check` Windows halves) |
| `packages/process/rust/src/facts.rs` | P01 (`file_key` on Windows only) |
| `packages/process/rust/src/lib.rs`, new `src/platform/windows_job.rs`, `src/platform/mod.rs` | P02 |
| `packages/holder-lock/rust/src/predecessor.rs` | P02 |
| `packages/holder-lock/rust/src/route.rs` | P03 (`lock-hold`), then P04 (`borrow` command), then P05 (`--predecessor-state`) |
| `src/holder-lock/driver.mjs`, `index.mjs` | P03, then P04 |
| `packages/holder-lock/rust/src/borrow_vectors.rs` | P04 |
| `src/runner/dispatch/adapters.mjs` (one scrub line, `FGOS_LOCK_JOB`) | P04 |
| `src/setup/holder-lock-checks.mjs`, `packages/distribution/rust/src/init.rs`, `docs/platform/holder-lock/spec.md`, `CHANGELOG.md` | P05 |
| `apps/fgos/src/main.rs`, `apps/fgctl/src/main.rs` (one call line each) | P01 |
| `.github/workflows/holder-lock-cross-platform.yml` | P01; P04 adds the `stress-artifact` job |
| Root `Cargo.lock` | regenerated with `cargo build` by whoever merges second |

No phase edits `bin/fgos.mjs`, `test/test-ownership.mjs` or `src/setup/registrations.mjs`, unless a new test file needs an ownership row. In that case the owning phase adds it and says so in its report.

## Data flow (Windows)

```text
Node acquireSync(scope, name)
  └─ spawn  fgos internal lock-hold --path P --mode ex --wait-ms W --kill-wait-ms K --ready R   (stdin pipe)
        helper: OpenProcess(parent, SYNCHRONIZE) → port::acquire  [LockFileEx(0,1) + same_file + predecessor::admit]
                admit: record windows-job {job, holder} → fgos_process::domain_is_empty (union rule, D5)
                       not empty → domain_kill_all → wait signaled ≤ K → proceed | held(predecessor-domain-not-empty)
                write R {result}  →  wait(parent handle | stdin line | stdin EOF)
  └─ Atomics.wait poll R → handle = {helper child}
Node runBorrowed(handle, git commit)
  └─ stdin line {argv,cwd,env,out,err,result}
        helper (port::run_borrowed, Windows half):
          declare predecessor {job: fgos-borrow-<lock>-<token128>, holder: self}
          CreateJobObjectW(name, KILL_ON_JOB_CLOSE, no breakaway)
          spawn self --fgos-holder-lock-helper job-keeper --job <name>        (outside the job; owner #2)
          CreateProcess(git, CREATE_SUSPENDED) → AssignProcessToJobObject → ResumeThread
             env FGOS_LOCK_JOB=<lock>:<job>  → hook: borrowed_check (D2 a–d)
          wait git → TerminateJobObject leftovers → wait empty (union) ≤ K → write result
Node release(handle) → close helper stdin → helper: domain empty? → UnlockFileEx → exit → Node polls pid gone
Rust holder (fgctl/observe) → port::acquire in-process; release = UnlockFileEx + close (D8)
```

## Done criteria

1. On `windows-latest` (CI run ids recorded):
   - `cargo test -p fgos-process -p fgos-holder-lock -p fgos-distribution` is green;
   - `node --test test/holder-lock/windows-*.test.mjs` is green.
   - The same workflow on `macos-latest` is green.
2. On Linux: `cargo test` for the same crates and the full `npm test` are green on `win-driver/integration`, run with `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<integration build>`.
3. `cargo check --target x86_64-pc-windows-msvc --target aarch64-apple-darwin` is green for `fgos-process`, `fgos-holder-lock`, `fgos-distribution` and `fgos`.
4. **Acceptance gate:** the owner runs the stress exe on their machine. Each scenario gives 500 repeats with 0 violations, and `dying-job-open` opens the job in at least 450/500 repeats. Without that, the job-open path is not exercised. The JSON report is committed under `plans/reports/`.
5. On the owner's Windows workspace, after activation:
   - `fgos doctor` reports `lock-kernel-semantics` with `"driver":"lockfileex","exclusion":"kernel"` and a green probe;
   - `lock-borrow-vectors` passes;
   - `fgctl upgrade` ran the gate, with no "unsupported" line;
   - `fgos run "<read-only prompt>"` gets past lock acquisition with no `lock-driver-unavailable`. Any later failure is named and recorded; the full Windows `direct` run is 6.2 D7.
6. `rg -n "unsupported on Windows|no holder-lock driver yet|not applicable on Windows|HolderLockGate::Unsupported" src packages scripts` is empty. The `CHANGELOG.md` `[Unreleased]` section says that Windows now has the driver.

## Main risks

| Risk | Likelihood × impact | Mitigation |
|---|---|---|
| Owner does not confirm D3 (the domain stays in 6.2 P02) | Medium × Medium | P02 then moves to 6.2 P02 unchanged in content, and P04 waits for 6.2 P02 to reach main. Every other phase is unaffected. |
| The Node sync wait (`Atomics.wait` poll on a ready file) adds latency to cold-path acquires | High × Low | Cold path only (r6 §6.6). Measured in P03 and reported as p50/p95. The hot `events.lock` path does not use the port. |
| The stress run surfaces a new race | Low × High | D5 is exactly probe v3; the stress test logs, per violation, which sources named each live pid (as the probe does), so a fix is evidence-led. The gate stays closed until 0. |
| `job-keeper` leaks when the job never empties (a member in an uninterruptible wait) | Low × Low | The keeper polls; `lock-holders` reports the open record; the next acquire terminates the job. Holding the keeper is the correct state, because the domain is not empty. |
| `windows-latest` and the owner's machine differ (Server 10.0.26100 vs client 10.0.26200) | Medium × Medium | Both are required: CI for regressions, the owner's machine for the gate. |
| The Windows runner is slow or costly on every push | Low × Low | Path filters; matrix of two. |

## Rollback

- **Before landing:** drop `win-driver/*`.
- **After landing:** revert the merge on main; restage and reactivate the previous release on the three Linux workspaces. On Windows, reactivating the previous release makes the locks `unsupported` again, which is the state before this plan.
- Lock files carry no data. A `windows-job` predecessor record left behind is judged `NotEmpty` by an old release (unknown shape), so the fallback stays fail-closed.

## Open questions (for the big lead / owner)

1. **D3 amends 6.2 D6:** the `windows-job` domain functions move from 6.2 P02 to this plan's P02. **Recommended: yes.** Without it, Windows stays `unsupported` until all of 6.2 lands. The amendment text is already in 6.2 phase-02 on this branch. If the answer is no, revert that file's amendment block and make P04 depend on 6.2 P02.
2. **Stress gate run:** the owner runs the stress exe on their Windows machine (about 15 minutes, like run 3). P06 cannot close without it.
