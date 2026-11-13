# Research: Windows runtime support for fgOS

Date: 2026-11-13 (Asia/Saigon). Backlog rows: `p-ffz65fjo6u` (Windows runtime support, `docs/backlog.md` line 7) and `p-w4cxqq2sbw` (Git write path on Windows, line 5). Read-only research on branch `research/windows-runtime-support` at `1c2307779`. No product code, test or doc was changed.

Evidence tags: **[V]** verified against a file:line in this tree or a named CI run; **[I]** inferred (reasoning or platform knowledge, not measured here).

## 1. Outcome

Windows is much closer to a working runtime at the bottom of the stack than the doctor's 50 failing rows suggest, and much further away at the top.

- **The two lowest layers already exist on Windows and are mostly green in CI.** Process facts (creation-time identity, `TerminateProcess` by identity), the `windows-job` containment driver (named Job Object with `KILL_ON_JOB_CLOSE`), and the holder-lock `LockFileEx` driver with job-scoped borrowing all compile and run on `windows-latest`. In holder-lock-cross-platform run 43391162868 (main, 2026-11-13) `windows_lockfileex` passed 10/10, `windows_borrow` 8/8, `windows_lock_hold_route` 3/3, `windows_job_domain` 10/10 and `windows_spawn` 6/6 **[V]**. What is missing there is a process scan, a lock-holder list, a parent walk for session identity, and three red containment tests (one is a test-side path-spelling bug).
- **Every wall above that layer is one missing primitive, repeated.** Config, the Git WAL, Git worktree custody, Event Store identity and the Event Store lock directory all stop at the same three Unix-only things: a no-follow "open beneath a trusted directory" walk (`openat2`/`O_NOFOLLOW`), a file identity (`dev:ino`), and an owner/mode check (`uid`, `0700`/`0600`). On Windows each of these has a direct counterpart (`FILE_FLAG_OPEN_REPARSE_POINT` per component, `FILE_ID_INFO`, owner SID plus a protected DACL), and holder-lock already uses two of them. If they are built once in `packages/durable-file` (the lowest shared tier), Config, WAL, worktree and Event Store can use them instead of writing four `cfg(not(unix))` refusals.
- **The Git write path is turned off on Windows by design, not just untested.** `require_lock_scope_platform()` refuses every lock-taking Git port on Windows with `git-lockscope-unavailable-windows` (`packages/git/rust/src/lib.rs:642`, owner decision Q6, git spec §C5 line 597) **[V]**. The WAL refuses off Linux (`wal.rs:1208-1227` returns `WalError::Unsupported`) **[V]**. Event Store publication goes through those Git ports (`event-store/rust/src/seal.rs:177` `recover_publications`) **[V]**, so the Event Store cannot be turned on before the Git write path.
- **Confinement is the one part with no Windows design at all.** The only backend is `bwrap` (confinement spec §9.1 "Backend: Linux bwrap; backend khác trả `unsupported`") **[V]**, and every bound posture resolves to `mode: 'required'` (`src/runner/dispatch/confinement/policies.mjs:664`) **[V]**. So once Config works, every confined `fgos run` on Windows will be refused **[I]**. How much confinement Windows needs is an owner decision (section 5, D3).
- **Of the 50 failing doctor rows, 23 are Config read failures, 15 are `--fix` rows, 9 are Event Store or Work, 2 are bwrap and 1 is the ssh-keygen version parser** (run 43264791668, list in section 3.7) **[V]**. Getting Config working on Windows clears or unblocks about three quarters of them.

Rough total effort for Windows as a full peer of Linux: **55-85 engineer-days**. A "runs agents, no confinement" tier without the Git write path and Event Store needs about **20-30**, and **40-60** with them (section 4). The order recommended in section 4 follows strict bottom-up layering.

## 2. What is in place today

| Fact | Evidence |
|---|---|
| rc.7 ships Windows at "installs and activates". Init leaves the Work store out (`workStore: 'unsupported-platform'`). | `src/verbs/state/init.mjs:43,84`; `src/event-store/native.mjs:11` (`process.platform === 'linux'`) [V] |
| The Windows consumer proof accepts a doctor report that is not ok and only asks for a rows array. | `scripts/ci-external-consumer.ps1:185-244` [V] |
| `release-assets-check` → focused tests (windows-latest) leave out the identity `mint`/`project` tests and five runtime-bound Node test files. | `.github/workflows/release-assets-check.yml` steps "cargo test (identity crate, without the mint tests)" and "Node tests for init, the release tree and launchers" (`if: runner.os != 'Windows'`) [V] |
| `process-containment` (windows-latest) is red on main: `windows_job::spawn_plumbing` failed in runs 43391162909 and 43361559114. `fast_exits` also failed on `harden/ci-last-reds` (43414708840). | gh run logs [V] |
| `holder-lock-cross-platform` → `crates (windows-latest)` is red on main (43391162868), with 20 failing tests: 7 in `fgctl` `uninstall_surface` (`os error 267` "The directory name is invalid" at `apps/fgctl/tests/uninstall_surface.rs:82`), 1 in `cli_projector`, 10 in `fgos` `cli_tests` (`config-platform-unsupported`, exit 65), and 2 in containment. | gh run log [V] |
| The repository is public, so `windows-latest` minutes are free. The cost of more Windows CI is wall-clock time and queue time. The `crates (windows-latest)` job took about 6 min, focused tests about 8 min and the Windows asset build about 5 min. | `gh repo view`; job timestamps of runs 43391162868 and 43264791668 [V] |

## 3. Per-part analysis

### 3.1 Process facts: identity, liveness, scan, lock holders

**a. Linux today.**
- Facts come from `/proc`: `/proc/<pid>/stat` start time plus `/proc/sys/kernel/random/boot_id` for identity (`packages/process/rust/src/platform/linux.rs:67,159`), pid namespace from `/proc/self/ns/pid` (`:80`), and lock holders from `/proc/*/fdinfo` (`:115-130`).
- Signals go through a pidfd. The scan walks `/proc` and reads argv and cwd, with an exec-settle retry (`read_cmdline`, backlog `p-5zazr53vd2`).
- The session-identity parent walk uses `relation_of` and `command_name_of` (`packages/identity/rust/src/proc_tree.rs:26-42`). [V]

**b. What Windows needs.**
- *Identity:* a process handle plus `GetProcessTimes` creation time. This is the right Windows tuple and is already implemented: an open handle pins the pid against reuse while the check runs. There is no boot id, and creation time stands in for it (process spec line 77).
- *Liveness:* `WaitForSingleObject(h, 0)`, not the exit code.
- *Scan:* `CreateToolhelp32Snapshot` for pid, ppid and image name, plus a command line read through `NtQueryInformationProcess(ProcessCommandLineInformation)` (Windows 8.1 and later). A cwd has no documented API. It needs a PEB read (`ProcessBasicInformation` → `RTL_USER_PROCESS_PARAMETERS.CurrentDirectory` via `ReadProcessMemory`), which works only for same-user, same-bitness processes **[I]**.
- *Environment marker* (`environment_marked`): the same PEB read of the environment block **[I]**.
- *Lock holders:* Win32 has no API that lists byte-range lock holders. The Restart Manager (`RmStartSession`/`RmRegisterResources`/`RmGetList`) lists processes that have a *handle* open on a file. That is an upper bound on holders, good enough for a diagnostic, not for proof **[I]**.
- *Session parent walk:* ppid plus creation time from the Toolhelp snapshot. A ppid is valid only when the parent's creation time is earlier than the child's.

**c. Already compiles on Windows, partly unproven.**
- `platform/windows.rs`: `observe` (`:132-144`) and `signal_by_identity` with the creation-time recheck under the open handle (`:158-195`) [V]. `scan` returns `Scan::Unsupported` (`:150-152`) and `lock_holders` returns `Holders::Unlistable` (`:146-148`) [V].
- `platform/windows_job.rs` already holds a Toolhelp snapshot with creation times, `ancestor_chain()` (`:997`) and `own_session()` (`:1044`) [V]. These are the building blocks for both the scan and the identity parent walk.
- `identity/rust/src/proc_tree.rs:64-72`: `UnreadableTree` returns `None`, so a Windows caller stays unresolved [V].
- Tests that compile to 0 tests on Windows: `signal_identity`, `holders_multiprocess`, `file_users`, `spawn_fds_leak`, `spawn_mapped` (run 43391162868, "0 passed") [V].
- Consumers that degrade when the scan is unsupported: the holder-lock quiesce route (`holder-lock/rust/src/route.rs:698`), which asks a person to attest; worktree liveness (`git/rust/src/worktree.rs:598` → `worktree-cwd-unknown`); and the addon's `process.scan` (`git/node-addon/src/process.rs:153`) [V].

**d. Proof on windows-latest.**
- Add a `windows_scan` integration test to `packages/process/rust/tests/`. It spawns a known child with a marked argv and cwd and asserts that the scan finds it with exact argv and cwd, and that a dead pid is absent.
- Port `signal_identity.rs` to Windows: kill by stale tuple → `IdentityMismatch`.
- Add a `proc_tree` test in the identity crate that resolves the test binary's own parent chain.
- Run all of these in `process-containment.yml` (already covers `-p fgos-process`).

**e. Effort and risk.** M, 4-6 days. Risk medium. The PEB read is undocumented layout, and a cross-bitness or elevated process makes it fail. The scan must report such a process as `unreadable`, never as clean (the same fail-open trap as backlog `p-xqkchdr6iy`).

### 3.2 Holder-lock

**a. Linux today.** `flock` on an open file description (`holder-lock/rust/src/driver/flock.rs`). A borrow hands the description to the child through fd inheritance. Holders are listed from `/proc` fdinfo (holder-lock spec line 65). The Node facade reaches the crate in process through the combined addon (spec line 8). [V]

**b. What Windows needs.** `LockFileEx` on byte 0, length 1. The lock belongs to the *process and handle* that took it, so an inherited or duplicated handle does not carry it. A borrow therefore cannot hand the lock over. It must keep the lock in the holder and run the child inside a named kill-on-close job, then judge the job empty before release (holder-lock spec §8.1). Handle inheritance must be an explicit `PROC_THREAD_ATTRIBUTE_HANDLE_LIST`, because `std::process::Command` always passes `bInheritHandles = TRUE` (spec line 207). A remote volume gives no exclusion and is refused. All of this is designed and built. [V]

**c. Compiles and partly proven.**
- `driver/windows.rs` (`LockFileExDriver`) is guarantee `kernel`/`job-scoped`/holders `unsupported`, and remote volumes are refused (`:39-58`).
- `borrow_windows.rs` implements the job borrow with a keeper.
- `platform/windows_spawn.rs` spawns with an explicit handle list (`:354`).
- Node starts one `fgos internal lock-hold` helper per held lock (spec line 210). [V]
- Tests that pass on windows-latest: `windows_lockfileex` 10, `windows_borrow` 8, `windows_lock_hold_route` 3, `windows_holder_lock_gate` 1, `windows_semantics_probe` 2 (run 43391162868) [V].
- Unix-gated, so 0 tests on Windows: `borrow_io`, `borrow_git`, `multiprocess`, `scope_rank`, `stress` [V]. `windows_predecessor_stress` is `--ignored`, and the acceptance gate is a 500-repeat run on the owner's machine (spec line 216). Whether it has been run is not recorded here [I].
- Node `test/holder-lock/windows-*.test.mjs` (4 files) runs in the same job [V].
- The quiesce scan is unsupported, so `fgos events migrate` asks a person to attest (spec line 215) [V].

**d. Proof on windows-latest.**
- Make `scope_rank.rs` and `multiprocess.rs` platform-neutral or give them Windows twins. Rank order and two-process exclusion are not Unix ideas.
- Keep `holder-lock-cross-platform.yml` as the owning job and make it green. Today it is red only for reasons outside holder-lock: fgctl uninstall paths, Config, containment.
- Record the owner-machine 500-repeat `windows_predecessor_stress` result on the board.

**e. Effort and risk.** S-M, 2-4 days. Risk low. The mechanism is measured and proven. The work left is test portability and the stress record.

### 3.3 Durable file and Config

**a. Linux today.**
- `durable-file` `beneath.rs` opens beneath a trusted root with one `openat2(RESOLVE_BENEATH|RESOLVE_NO_SYMLINKS|RESOLVE_NO_MAGICLINKS)` or a per-component `openat(O_NOFOLLOW|O_DIRECTORY)` (`packages/durable-file/rust/src/beneath.rs:51-54,189-203`), and it is `#[cfg(unix)]` (`lib.rs:443-448`) [V].
- A replace writes a temp file with `O_NOFOLLOW` and the mode (`lib.rs:258-266`), then `sync_all`, then `fs::rename` (`:332`), then a parent `fsync` [V].
- Config reads through `read_beneath` (`packages/config/rust/src/files.rs:65`). The write door (`write`), findings engine (`doctor`), `migrate`, `repair` and `relocate` modules are `#[cfg(unix)]` (`config/rust/src/lib.rs:27-52`, `relocate.rs:7`) [V].
- The global, accounts and token files are mode 0600 and `~/.fgos/private` is 0700 (config spec line 271). The executable check reads the `0o111` bit (`detect.rs:68-78`) [V].

**b. What Windows needs.**
- *Beneath open:* walk each component with `CreateFileW(FILE_FLAG_BACKUP_SEMANTICS | FILE_FLAG_OPEN_REPARSE_POINT)`, refuse any `FILE_ATTRIBUTE_REPARSE_POINT` (symlink or junction), and open the next component relative to the parent handle (`NtCreateFile` with `OBJECT_ATTRIBUTES.RootDirectory`). Otherwise use a path open plus a `GetFinalPathNameByHandleW` and `FILE_ID_INFO` recheck that the handle is still under the root. The leaf-only version exists: `open_no_reparse` (`durable-file/rust/src/lib.rs:424-441`) [V].
- *Directory identity:* `GetFileInformationByHandleEx(FileIdInfo)` (volume serial plus 128-bit id). Holder-lock already has this as `file_id()` (`holder-lock/rust/src/driver/windows.rs:101`) [V], and it should move down to durable-file.
- *Modes:* replace 0600/0700 with "owner is the current user SID, DACL is protected and grants only the owner (plus SYSTEM)", set through `SetSecurityInfo`. The check reads `GetSecurityInfo` [I].
- *Durable replace:* `MoveFileExW(MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH)` or `ReplaceFileW`, after `FlushFileBuffers` on the temp file. The no-replace install already uses `MoveFileExW(MOVEFILE_WRITE_THROUGH)` (`lib.rs:388-401`) [V]. The replace path uses `fs::rename`, which on Windows does not pass `WRITE_THROUGH` [I].
- *Directory sync:* `FlushFileBuffers` on a directory handle opened with `FILE_FLAG_BACKUP_SEMANTICS` and write access is already coded (`lib.rs:404-418`) [V]. Whether NTFS honours it as a metadata barrier needs a crash proof [I].
- *Executable bit:* PATHEXT lookup in place of `0o111` [I].

**c. Compiles and partly proven.** `install_name` Windows (`MoveFileExW`), `sync_directory` Windows and `open_no_reparse` compile and run inside distribution and holder-lock code, which is green on Windows (distribution lib 89/89, run 43391162868) [V]. Config builds on Windows with read verbs only. `read_beneath`, `machine.rs:181`, `provider.rs:36-46` and `files.rs:99-108` all answer `config-platform-unsupported` [V]. Config locks go through `LockScope`, which is cross-platform (`holder-lock/rust/src/lib.rs:25`), and only the `hold` wrapper is `#[cfg(unix)]` (`config/rust/src/locks.rs:27`) [V]. Tests that fail on Windows: 10 `fgos` `cli_tests` config cases, exit 65 `config-platform-unsupported` (run 43391162868) [V]. `durable-file/tests/beneath.rs` and `creation_modes.rs` are unix-only [V].

**d. Proof on windows-latest.**
- Add `cargo test -p fgos-durable-file -p fgos-config` to a Windows job (neither runs on Windows today).
- Give the beneath tests Windows cases: a junction and a symlink in the middle and at the leaf are refused; a root escape is refused.
- An ACL test asserts that a written private file has a protected owner-only DACL.
- The 10 `cli_tests` config cases pass.
- The consumer proof's 23 Config-rooted doctor rows pass.

**e. Effort and risk.** L, 10-14 days (durable-file Windows beneath plus ACL, 4-5; Config write door, findings, migrate, repair, relocate ungated and adapted, 6-9). Risk medium-high. ACLs are where a "protected" file can quietly stay world-readable through inheritance, and Config G6, the private-dir mask, relies on bwrap on Linux. On Windows the ACL is the only protection.

### 3.4 Git write path: WAL, worktree, restore

**a. Linux today.**
- Every lock-taking Git port calls `require_lock_scope_platform()` (`git/rust/src/lib.rs:641-647`). The callers are `refs.rs:620,973,1000,1137`, `land.rs:304,1152`, `scoped_commit.rs:288`, `remote.rs:98`, `repository_config.rs:146` and `node-addon/src/git.rs:58,312` [V].
- The WAL opens directories with `O_DIRECTORY|O_NOFOLLOW|O_CLOEXEC`, checks the owner uid and that the directory is not group or other writable, and resolves children through `/proc/self/fd/<n>` (`wal.rs:1194-1227`). Repository identity is `dev:ino` (`:1888-1899`). The durable identity is `dev, ino, birth time` (`:1295-1311`). Records are read with `O_NOFOLLOW|O_NONBLOCK` plus an owner and mode check (`:1937-1950`) [V].
- Worktree custody probes the `dispatch-cwd` holder lock (`worktree.rs:526-559`), and liveness uses the process scan (`:598`) [V].
- Restore extract uses `openat` with modes (`restore.rs:1137-1183`). Native lock quarantine uses inode identity (`native_lock.rs:140-180`) [V].

**b. What Windows needs.**
- The same three primitives as 3.3: a handle-relative no-reparse directory walk in place of `/proc/self/fd`, `FILE_ID_INFO` in place of `dev:ino` (the creation time from `FILE_BASIC_INFO` stands in for birth time), and an owner-SID/DACL check in place of uid/mode.
- The C5 scan/fence admission for Windows (git spec line 597).
- E4 descendant drain through `windows-job`. Git children run borrowed inside the holder's job (holder-lock §8.1), and the job judged empty is the proof (git spec line 303).
- Caller-supplied paths must leave in plain spelling: `worktree.rs` `text()` (`:136-138`) passes `fs::canonicalize` output (`\\?\D:\...`) into `worktree add/remove/move` arguments (`:923,978,1162,1301-1302`). The driver already has the right function, `plain_path` (`driver.rs:1791`), and `text()` should go through it (backlog `p-w4cxqq2sbw`).

**c. Compiles and partly proven.** The read path landed: `plain_path` and `text_path` (`driver.rs:1782-1806`) are used by the addon's `resolveRepo` and the EventStoreRoot `commonDir` getter (commits `04b9559b5`, `2d5354efb`) [V]. The write side compiles on Windows only as refusals: `WalError::Unsupported` (`wal.rs:1223`), `git-lockscope-unavailable-windows` (`worktree.rs:557,761,1834`; `scoped_commit.rs:358`), `restore-extract-platform-unsupported` (`restore.rs:1179`), `native-lock-identity-unavailable` (`native_lock.rs:175`), and `creation_identity = "unavailable-on-this-platform"` (`worktree.rs:532-538`) [V]. Test gating:
- `tests/worktree.rs`, `recovery_matrix.rs`, `land.rs`, `land_crash_matrix.rs`, `safe_restore.rs`, `scoped_commit_sync.rs`, `publication*.rs`, `refs_remote.rs`, `head_*`, `sequence.rs`, `borrow_deadline.rs`, `repository_config.rs`, `inspect.rs` and `ssh_transport.rs` are all file-level `#![cfg(...)]` gated to Linux or Unix.
- The WAL lib tests are `#[cfg(all(test, target_os = "linux"))]` (`wal.rs:2770`).
- 28 of 29 `test/verbs` worktree Node tests skip on win32 (backlog line 5). [V]

**d. Proof on windows-latest.**
1. WAL open, begin and append, then crash-recover, on a real NTFS temp dir. This means a `wal` test module that is not Linux-gated.
2. `tests/worktree.rs` create, remove and move with a plain-spelled path that Git accepts, and a refused reparse-point path.
3. A ScopedCommit whose hook starts a detached child: the job drain must end it before the commit reports success (the E4 vector on Windows).
4. `test/verbs` worktree tests un-skipped.

The crash-matrix tests use a Linux syscall harness. A Windows equivalent needs a checkpoint-based fault hook. The `filesystem.checkpoint(...)` seam already exists in `native_lock.rs:512` and durable-file `checkpoint`, so no production fault flag is needed [I].

**e. Effort and risk.** L, 12-18 days. Risk high. This is the crash-safety core, and the Linux proofs (`land_crash_matrix`, `recovery_matrix`) depend on Linux-specific harnesses. Lifting Q6 is itself an owner-visible change to a recorded decision.

### 3.5 Event Store and Work store

**a. Linux today.**
- The Node gate is `eventStorePlatformSupported() → process.platform === 'linux'` (`src/event-store/native.mjs:11`). The addon gate is `cfg!(target_os = "linux")` (`git/node-addon/src/event_store.rs:20-26`) [V].
- Store identity is `dev:ino` of the common dir (`event-store/rust/src/identity.rs:46-58`). The lock directory must be an existing `0700` directory (`locks.rs:113-125`). Export creates directories with `0700` (`export.rs:43-52`) [V].
- Seal and publication go through Git (`seal.rs:177`), and fsync goes through durable-file (`fsio.rs:56-78`) [V].
- Spec: "Linux only … the seal crash matrix has not run there" (event-store spec line 649) [V].

**b. What Windows needs.** `FILE_ID_INFO` for the store identity, an owner-only protected DACL for `locks/`, the holder-lock Windows guarantee (`kernel`/`job-scoped`), already present, and the Git write path from 3.4 for publication. Work-store init then follows by flipping one function (`init.mjs:43`).

**c. Compiles and partly proven.** The crate builds on Windows (it is in the Windows workspace build, run 43264791668 "Compiling fgos-event-store") [V]. Every entry refuses with `event-store-unsupported-platform` [V]. `test/event-store/facade.test.mjs` has 11 platform skips [V].

**d. Proof on windows-latest.**
- `cargo test -p fgos-event-store` on Windows. Today it is not in any Windows job.
- The seal crash matrix on NTFS.
- `test/event-store/facade.test.mjs` un-skipped.
- The consumer proof's 9 Event Store and Work doctor rows pass.
- `fgos init` reports a Work store.

**e. Effort and risk.** L, 8-12 days after 3.3 and 3.4. Risk high. It is the durability core, and its crash matrix has never run off Linux.

### 3.6 Containment and confinement

**a. Linux today.**
- Containment: `bwrap-pidns` when bwrap with user and pid namespaces works, else `linux-pgroup` (`process/rust/src/containment/mod.rs:250-253`; process spec line 157) [V].
- Confinement (the filesystem view an agent sees): the `bwrap` backend only (`src/runner/dispatch/confinement/drivers/bwrap.mjs`; spec §9.1). Every bound posture is `required` (`policies.mjs:656-665`) [V].
- Run supervisor: `direct` mode works on every platform. `terminal` mode reports `terminal-mode-unsupported` on Windows because there is no herdr build (run-supervisor spec lines 8, 173) [V].

**b. What Windows needs.**
- *Containment:* already designed. The `windows-job` driver uses a named Job Object with `KILL_ON_JOB_CLOSE` and no breakaway. The gate is created `CREATE_SUSPENDED`, assigned to the job, then resumed, and the agent runs in a nested kill-on-close job (run-supervisor spec line 145).
- *Confinement*, three levels (the owner chooses, D3):
  1. **None, with a warning:** explicit `unconfined` on Windows.
  2. **Restricted token plus low integrity:** `CreateRestrictedToken` with deny-only SIDs, plus `SetTokenInformation(TokenIntegrityLevel = Low)`, plus job UI and limits. A low-integrity process cannot write medium-integrity files, so host-write-denied holds by default, but it can still *read* nearly everything. `hostRead: blind` is not reachable this way. Workspace write needs a low-integrity label (`icacls /setintegritylevel low`) on the granted directories [I].
  3. **AppContainer (or LPAC):** `CreateAppContainerProfile` plus `SECURITY_CAPABILITIES`. It denies reads and writes outside paths explicitly granted to the container SID, so it is the closest match to bwrap `blind`. Grants are ACL edits on the workspace, run output and private-home paths, which must be undone. Network can be denied with capabilities. Node, Git and agent CLIs under AppContainer are untested here, and some (named pipes, `%USERPROFILE%` reads, credential stores) are likely to break [I].

**c. Compiles and partly proven.**
- `containment/windows.rs` (`WindowsJobDriver`), `platform/windows_job.rs` (1429 lines) and `windows_spawn.rs` are built and tested: `windows_job_domain` passes 10/10 [V].
- Red on main: `containment_conformance` `windows_job::spawn_plumbing` (`tests/containment_conformance.rs:274`). The child printed `cwd:C:\Users\RUNNER~1\...` (an 8.3 short name) while the test compares against `fs::canonicalize` (`\\?\C:\Users\runneradmin\...`). This is a test-side path-spelling bug: the child's cwd is right, the expected string is spelled differently (runs 43391162909, 43361559114) [V].
- `containment_windows_job_outlives_its_supervisor_while_the_gate_holds_a_handle` failed once ("agent … is still alive", `tests/containment_windows.rs:40`, run 43391162868) and passed in the containment workflow the same day. It is flaky, cause not investigated [V/I].
- `fast_exits` failed on `harden/ci-last-reds` [V].
- Confinement has no Windows code. The doctor rows say so (`registrations.mjs:3458-3462,3505-3510,3550-3551`) [V].

**d. Proof on windows-latest.**
- Containment: `process-containment.yml` green on Windows three runs in a row. Fix `spawn_plumbing` by comparing through one spelling, `GetLongPathNameW` or `plain_path` on both sides, and investigate the two flaky tests.
- Confinement, if level 2 or 3 is chosen: a Windows twin of the bwrap falsification probes (spec §9.3: 9 probes). Host write outside grants is denied, a peer's run dir is unreadable (AppContainer only), and the private machine dir is hidden. These run as a new `confinement-windows` test file in `process-containment.yml`.

**e. Effort and risk.** Containment: S, 1-3 days, risk low. Confinement: level 1 is S (1 day: a policy plus a doctor `skip`), level 2 is M-L (8-12 days), level 3 is L (15-25 days). Risk high for 2 and 3: security semantics, plus agent CLIs breaking under reduced tokens.

### 3.7 Doctor and setup rows that are small

**a. Today (run 43264791668, 50 failing rows) [V]:**

| Group | Count | Rows |
|---|---|---|
| Config read (`config-platform-unsupported`) | 23 | `node-version-and-git`, `runner-generated-paths`, `runner-patterns-config`, `tool-registry-configured`, `provider-capacity-state`, `run-supervisor-config`, `workflow-capabilities-configured`, `capability-serves-valid`, `worker-slots-ceiling-usable`, `config-parse`, `config-schema`, `config-legacy-shadowed`, `config-format-legacy-json`, `config-comment-missing-why`, `config-comment-migrated-why`, `config-unknown-key`, `config-migrate-backup-stale`, `terminal-control`, `confined-pane-accounts`, `confinement-policies-declared`, `confinement-strict-readiness`, `git-component-compatible`, `git-incidents` |
| Fix is `fgos doctor --fix` | 15 | `project-fgos-launcher`, `dispatch-decide-hook-wired`, `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`, `config-doc-drift`, `config-comment-missing-doc`, `config-redundant-value`, `config-key-in-wrong-file`, `config-global-permissions`, `config-secret-outside-private`, `gateway-token-configured`, `git-repository-config`, `git-operation-journal` |
| Event Store and Work | 9 | `work-classification-vocabulary`, `work-step-vocabulary`, `work-recorded-conflicts`, `root-drift`, `leaf-notify-drift`, `delivered-not-on-trunk`, `event-store-open-root`, `event-store-machine-id`, `event-store-legacy-layout` |
| bwrap | 2 | `bwrap-available`, `confinement-bwrap-platform` |
| Identity | 1 | `identity-ssh-keygen` |

The backlog row says "ten" Event Store rows. This run shows nine.

**b. What Windows needs.**
- *`identity-ssh-keygen`:* `parseOpensshVersion` uses `/OpenSSH_(\d+)\.(\d+)/` (`src/setup/identity-checks.mjs:100-103`) and fails on `OpenSSH_for_Windows_9.5p2`. Allow the optional `for_Windows_` infix.
- *bwrap rows:* use the existing `status: 'skip'` (passed) mechanism, already used by `agent-cli-trust.mjs:109`, `git-checks.mjs:63` and `registrations.mjs:2670,2735,2783` [V]. Whether they should skip or fail is owner decision D1.
- *`--fix` rows:* the 7 `config-*`, `gateway-token-configured` and the two `git-*` fixes most likely fail because they write through the Config or Git write door, which refuse on Windows [I]. The five hook rows and `project-fgos-launcher` ("another fgos first on PATH", backlog row) need a per-row look [I].
- *The five Node files skipped on Windows:* one is `ERR_UNSUPPORTED_ESM_URL_SCHEME` from importing a bare drive path. The fix is `pathToFileURL` [V from backlog; fix I].
- *`fgctl` `uninstall_surface`:* `os error 267` at `apps/fgctl/tests/uninstall_surface.rs:82` [V].

**c. Compiles and partly proven.** All rows run and report on Windows, and the report shape is proven by the PowerShell consumer proof [V].

**d. Proof on windows-latest.** Turn `scripts/ci-external-consumer.ps1:237-244` back into the Linux assertion (`data.ok === true`) once the owner-declared not-applicable rows skip. Fold the five Node files back into the Windows focused-tests step, and add unit cases for `parseOpensshVersion` with the Windows string.

**e. Effort and risk.** S-M. The ssh parser takes under half a day. Not-applicable skips take 1 day after D1. The `--fix` rows and the five Node files take 2-4 days. The uninstall test takes about 1 day. Risk low.

## 4. Proposed order (strict bottom-up)

Each step lands green on `windows-latest` before the next one starts. Inside a step, file-disjoint phases can run in parallel.

| # | Step | Contents | Days | Gate |
|---|---|---|---|---|
| 1 | Process facts | Windows scan (Toolhelp plus command line, cwd read with `unreadable` on failure); identity `ProcessTree` from the existing `windows_job` snapshot; the `spawn_plumbing` spelling fix; investigate the `fast_exits`/`outlives` flakes | 5-8 | `process-containment` Windows green ×3 |
| 2 | Holder-lock | Port `scope_rank`/`multiprocess` to Windows; record the owner-machine 500-repeat stress; quiesce route reads the new scan | 2-4 | `holder-lock-cross-platform` Windows holder-lock tests green |
| 3 | Durable file, then Config | Windows beneath walk, `FILE_ID_INFO` and ACL primitives in `durable-file` (moving holder-lock's `file_id`/`same_file_id` down); write-through replace; then Config write door, findings, migrate, repair and relocate on Windows; G4 closes | 10-14 | `cargo test -p fgos-durable-file -p fgos-config` and 10 `cli_tests` config cases on Windows; 23 doctor rows pass |
| 4 | Git write path | WAL directories, identity and owner checks on the step 3 primitives; Windows C5 fence admission; E4 drain through `windows-job`; `worktree.rs` `text()` → `plain_path`; lift Q6 (D2) | 12-18 | Windows WAL, worktree and ScopedCommit tests; `test/verbs` worktree un-skipped |
| 5 | Event Store and Work | Identity and lock dir on the primitives; drop both Linux-only gates; seal crash matrix on NTFS | 8-12 | `cargo test -p fgos-event-store` on Windows; 9 doctor rows pass; `fgos init` makes a Work store |
| 6 | Containment and confinement | Containment is done in step 1. Confinement at the level from D3 | 1-25 | Windows confinement probes |
| 7 | Doctor | Not-applicable skips (D1), `--fix` rows, the five Node files, the uninstall test, and the consumer proof back to `ok: true` | 3-5 | PowerShell consumer proof asserts `ok: true` |

The ssh-keygen regex (step 7) touches no lower layer and can land at any time as a half-day leaf fix.

**Totals.** Full peer, confinement level 3: about 55-85 days. "Runs agents, no confinement" tier: steps 1-3 and 7 with confinement level 1 take about 20-30 days; adding steps 4-5 (Git write path, Event Store) makes it about 40-60. Range rather than point estimates: none of the Windows crash or ACL work has been prototyped [I].

## 5. Decisions for the owner

### D1. Doctor rows of a component that does not exist on Windows

- **What is happening:** On Windows, doctor fails rows for components that are Linux-only by design (bwrap, and until steps 3-5 also Config and Event Store), so `fgos doctor` is never ok there and the consumer proof had to be weakened to "returns a report".
- **Cause:** Rows check `os.platform() !== 'linux'` and return `passed: false` (`src/setup/registrations.mjs:3458-3462,3505-3510`). The `status: 'skip'` mechanism already exists and is used for "not installed on this machine" cases (`agent-cli-trust.mjs:109`, `git-checks.mjs:63`).
- **Options:**
  - (a) Rows of a component the owner declares absent on a platform return `skip` ("not applicable on win32"). Gain: doctor ok means "what exists is healthy", and the consumer proof can assert `ok: true` again. Harm: a user can miss that confinement is absent unless the skip message says so plainly. Cost: about 40-80 lines in `registrations.mjs` plus tests, 1 day.
  - (b) Rows keep failing until the component exists. Gain: nothing is hidden. Harm: doctor is useless on Windows for weeks, and real regressions drown in 50 known failures. Cost: 0.
  - (c) Rows warn, neither pass nor fail. Gain: visible but not blocking. Harm: a new status meaning across the registry (contract change per `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` §3). Cost: 2 days.
- **Recommendation:** (a), with one rule: a skip is allowed only for a component listed in one place (a platform-support table next to the registry), and the skip message names the missing capability (for example "no confinement on Windows: agents run unconfined").
- **Scope of the answer:** A yes authorizes skip rows for bwrap now, and for Config and Event Store only until their step lands. It does not authorize skipping any row whose component exists on Windows.

### D2. Which tier Windows targets

- **What is happening:** rc.7 ships Windows at "installs and activates". The next tier has to be named before steps 3-6 are planned, because it decides whether the Git write path (Q6) and Event Store are lifted.
- **Cause:** Section 3. Steps 1-3 make Windows run Config and agents in containment. Steps 4-5 make it a full Work and Event Store peer. Step 6 decides what an agent can see.
- **Options:**
  - (a) **"Runs agents" tier:** steps 1-3 plus 7, confinement level 1 (unconfined, warned). Gain: Windows users can `fgos run` agents in `direct` mode in about 20-30 days. Harm: no Work store, no worktree or commit door, and agents see the whole host. Cost: about 20-30 days, touching process, holder-lock, durable-file, config and setup.
  - (b) **Full peer without confinement:** steps 1-5 plus 7. Gain: Work, worktrees and the Event Store on Windows, and Q6 lifted. Harm: a large crash-safety surface with new proofs; confinement still missing. Cost: about 40-60 days.
  - (c) **Full peer with confinement:** (b) plus D3 level 2 or 3. Cost: about 50-85 days.
  - (d) **Stay at "installs and activates":** Cost: 0, and Windows remains a launcher-only target.
- **Recommendation:** (a) now, with (b) as a separate later item. Mission #1 projects on Windows get value from running agents first. The Git and Event Store work is the riskiest part, and nothing in (a) blocks it later.
- **Scope of the answer:** Authorizes planning and executing steps 1-3 and 7 under one frame. It does not lift Q6 or open Event Store work on Windows.

### D3. Confinement level on Windows

- **What is happening:** Confinement exists only as bwrap, and every bound posture requires it (`policies.mjs:664`), so confined dispatch on Windows will be refused once Config works.
- **Cause:** Confinement spec §9.1 names only the Linux backend. Windows has no namespace sandbox like bwrap. Its options are token-based or AppContainer-based (section 3.6b).
- **Options:**
  - (a) **None plus warn:** Windows runs bound postures as `unconfined`, with a doctor skip and a run-time warning. Gain: works now. Harm: an agent can read and write the whole user profile. Cost: about 1 day.
  - (b) **Restricted token plus low integrity:** host write denied by integrity level; reads unrestricted (`hostRead: blind` unsupported). Gain: protects against writes outside the workspace. Harm: no read isolation, so a peer's run output and private files stay readable. Cost: about 8-12 days, plus label cleanup on granted directories.
  - (c) **AppContainer/LPAC:** read and write denied outside grants, closest to bwrap `blind`. Gain: parity with Linux confinement. Harm: Node, Git and agent CLIs may not run inside it; grants are ACL edits that must be reverted; highest risk. Cost: about 15-25 days, plus a feasibility probe first (2-3 days).
- **Recommendation:** (a) for the D2(a) tier. Then a 2-3 day AppContainer feasibility probe (run `node`, `git` and one agent CLI inside an AppContainer with a granted workspace), and decide between (b) and (c) from that evidence.
- **Scope of the answer:** Authorizes unconfined-with-warning on Windows and the feasibility probe. It does not change Linux policy or the `required` default there.

### D4. CI cost of a full Windows suite

- **What is happening:** Windows proofs are spread over four workflows, with path filters and hand-picked test lists. Two of them are red on main, and many test files compile to zero tests on Windows.
- **Cause:** `ci.yml` is Linux-only (`holder-lock-cross-platform.yml` header). The repository is public, so Windows minutes are free. The cost is wall time (Windows jobs take about 6-8 min for the crate subset today) and the maintenance of skip lists.
- **Options:**
  - (a) **A full `cargo test --workspace` plus `npm test` Windows job on every push to main.** Gain: one owning gate, no hand lists. Harm: likely 30-60 min per run [I], and red until steps 1-5 land unless known-unsupported tests are cfg-gated. Cost: 1 day of setup, then a standing wait.
  - (b) **Per-crate Windows jobs that grow as each step lands, plus a nightly full run.** Gain: each step adds its crate to the Windows matrix, and the nightly catches drift. Harm: two places to look. Cost: 0.5 day per step.
  - (c) **Status quo.** Harm: Windows regressions stay invisible.
- **Recommendation:** (b). It matches the bottom-up order, and each step's gate in section 4 is its Windows job.
- **Scope of the answer:** Authorizes adding Windows matrix entries and one nightly workflow. It does not make the Windows job a required check for merging until the owner says so.

### D5. Does macOS ride along?

- **What is happening:** macOS is a supported build target (keep it compiling), but it shares several of the same walls: the Event Store refuses macOS (spec line 649, backlog `p-zsy3fmbcpd`), the WAL refuses everything but Linux (`wal.rs:1208`), and the macOS scan is unsupported.
- **Cause:** The step 3 primitives are Unix-shaped on macOS (`openat` per component already works there, `beneath.rs:54`), but the WAL uses `/proc/self/fd`, which macOS lacks, and macOS needs its own fsync (`F_FULLFSYNC`) semantics.
- **Options:**
  - (a) **Ride along:** each step also lands macOS where the change is the same abstraction (WAL directory handle in place of `/proc/self/fd`, scan via `proc_pidinfo`). Gain: one pass over each layer, no second pass later. Harm: about +20-30% effort, and macOS proof needs `macos-latest` jobs (already in the two matrices). The owner has no Mac, so CI is the only proof.
  - (b) **Windows only now:** macOS stays as is. Gain: smaller frame. Harm: a second pass over the WAL and Event Store later.
- **Recommendation:** (a) for steps 1 and 4 (the WAL directory abstraction should not be designed twice), (b) for everything else.
- **Scope of the answer:** Authorizes macOS code in the WAL directory and scan abstractions, proved on `macos-latest`. It does not authorize macOS Event Store support.

## 6. Unresolved questions

1. Has the owner-machine 500-repeat `windows_predecessor_stress` gate (holder-lock spec line 216) been run, and with what result? No record was found in this research.
2. Why does `containment_windows_job_outlives_its_supervisor_while_the_gate_holds_a_handle` sometimes see the agent alive after 20 s, and is `fast_exits` the same cause? Not investigated.
3. Does `FlushFileBuffers` on an NTFS directory handle give the metadata barrier the WAL and Event Store assume? It needs a power-cut or `NtFlushBuffersFileEx` study, not an assumption.
4. Which of the 15 `--fix` rows fail only because Config or Git writes refuse, and which have their own Windows bug (the five hook rows, `project-fgos-launcher`)? It needs one Windows run of `fgos doctor --fix --json` after step 3.
5. Can Node, Git and the agent CLIs (claude, codex) run inside an AppContainer with a granted workspace at all? This decides D3 (b) against (c).
6. Lifting Q6 (`git-lockscope-unavailable-windows`) changes a recorded owner decision. Does it need a new decision ID in the Git spec's decision history, or is it the planned activation the spec already anticipates ("until the Windows handoff exists")?
7. Is the `fgctl` `uninstall_surface` failure (`os error 267` at line 82) a test fixture bug or an uninstall bug on Windows? It is red on main and was not diagnosed here.
8. Where should the platform-support table that D1(a) proposes live: the packaging-distribution spec, or next to the registry in `src/setup/`?

## Owner answers (2026-11-13 18:3x, relayed by the HARDEN lead)

- **D2 (a):** the tier is "runs agents", plus worktree and the Event Store. The Event Store publishes through the Git write ports, so this lifts Q6 (`require_lock_scope_platform`, `packages/git/rust/src/lib.rs:642`). The plan must record that as a superseding decision in the Git spec's decision history, never as an edit in place.
- **D1 (a):** on Windows, the rows of Linux-only parts report skip with a plain message. One platform-support table lists those rows. Where that table lives (Q8) is for the plan to settle.
- **D3 (a):** Windows runs unconfined with a warning. A 2-3 day AppContainer feasibility probe comes first, then the choice between restricted token (b) and AppContainer (c).
- **D5 (a):** macOS rides along in the process scan and the WAL directory abstraction only.
- **D4 (b), decided by the HARDEN lead:** each step adds its crates to a per-crate Windows job, plus one nightly full run. It is not a required check.
- **Queue:** the work comes after account-health A, account-health C and the branch cleanup, so there is no plan yet. This report lands with the held board lines after the rc.8 tag.
