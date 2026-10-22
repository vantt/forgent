# Process Facts And Control Component Specification

```txt
Document type: BA-grade area specification
Audience: Human reviewer, maintainer, implementation agent
Purpose: Define the single authority for "is this process tuple alive, dead or unknown" and for signalling a process by identity
Design status: Accepted
Implementation status: Implemented (judge vectors, the crate, the domain primitives and the Node door)
Canonical: Yes
Owner: Process component (facts + control, L0)
Source: packages/process/rust (crate fgos-process); Node door src/native/door.mjs and thin client src/runner/dispatch/process-identity.mjs
Contracts: packages/process/contracts/
Last reviewed: 2026-10-21
Related:
- docs/platform/holder-lock/spec.md
- docs/platform/run-supervisor/spec.md
- docs/platform/component-boundary.md
- docs/platform/identity/spec.md
- docs/specs/runner.md
- plans/261016-1104-holder-lock-kernel-lock-foundation/plan.md
- plans/reports/design-261016-1238-lock-and-run-supervisor-foundation-v3-r6.md
- plans/reports/council-261021-1507-harden-t0-arbitration.md
```

## 1. Purpose

The process component is the lowest layer (L0) under every lock, supervisor and gate. It owns two things and nothing else:

- **Facts.** `judge(tuple, observer) → alive | dead | unknown` for a normalized process tuple `{host, bootId, pidNs, pid, startTime}`; the boot id, the start time and the pid namespace of a process; the list of processes holding a lock description; and the read-only scan the stop-everything cutover uses.
- **Control.** Spawning with an explicit fd mapping, signalling a process by identity (never by bare pid), and the two domain primitives the predecessor rule of holder-lock needs: is a domain empty, kill a whole domain.

Facts are almost never on the lock decision path any more (the kernel decides); they serve binding a supervisor or gate to its process, the temporary hot path, display, and the `linux-gate` domain. Control knows nothing about a run, an envelope, a lock or a pane.

## 2. Ownership boundary

| Owns | Does not own |
|---|---|
| The judge table and its shared vectors ([contract](../../../packages/process/contracts/process-facts.judge.v1.json)) | Which lock anyone holds (holder-lock) |
| Boot id, start time, pid namespace of a process, read without spawning | Writer identity (Session Identity) |
| `lock_holders(dev, ino)` and the quiescence `scan` | Deciding what to do with a holder or a scanned process |
| `spawn_with_fds`, `signal_by_identity`, `arm_parent_death_signal` (Linux: `PR_SET_PDEATHSIG(SIGKILL)` on the caller, refused when the visible parent changed while arming) | The other gate primitives (subreaper, a new PID namespace, the tty foreground group) and when a gate arms the death signal: the run supervisor |
| `domain_is_empty`, `domain_kill_all` for a declared domain | The attempt, envelope and lock that use the containment port (run supervisor); the port itself is section 10 |
| The OS-neutral `ProcessPlatform` trait and one driver per OS | mtime of anything; a boot time derived from a clock |

The reconcile planner imports only the thin client `src/runner/dispatch/process-identity.mjs` and, through it, the door; the import-graph test (`test/runner/dispatch-reconciliation-import-graph.test.mjs`) pins that closure. The component-boundary entry is [Process Facts & Control (L0)](../component-boundary.md#4-current-high-level-components).

## 3. Facts: the judge table

The tuple is `{host, bootId, pidNs, pid, startTime}`. A record written before the tuple existed carries `processStartTime`; the adapter reads it as `startTime`. Rules are evaluated in order; the first that applies decides.

| Event | Result |
|---|---|
| Other host, or other pid namespace without a decisive anchor | unknown |
| Same host, recorded boot id differs from the running kernel's | dead |
| No pid in the record (missing, corrupt, not a positive integer) | unknown (the former Node judge answered `dead` here; a record without a pid proves nothing) |
| pid does not exist (`ESRCH`) | dead |
| pid exists in state `Z` or `X` in `/proc/<pid>/stat` | dead (`kill(pid, 0)` still succeeds for a zombie; the stat state decides) |
| pid exists, start time matches | alive |
| pid exists, start time differs (pid reused) | dead |
| Start time cannot be read (driver missing, permission, timeout) | unknown |

A process inside an attempt's PID namespace has no pid the host can read, and the reverse. The gate sets `FGOS_PIDNS_ANCHOR` (its own host tuple) for every process in the namespace; a record written inside carries `{pidNs, pid, startTime, anchor}`.

| Event | Result |
|---|---|
| Record pid namespace differs from the observer's, the record has an anchor, and the anchor is dead | dead (when a namespace's init dies the kernel has killed the whole namespace) |
| Record pid namespace differs; anchor alive, unknown or absent | unknown: hold (never judge a holder you cannot see dead) |
| The observer is not in the initial PID namespace and the record has no `pidNs` (an old `{pid, startTime}` record) | unknown: hold (an agent in a sandbox running `fgos` must not clean a host holder's record) |

Consequence: a holder inside an attempt that dies while holding a hot lock keeps it until the attempt ends (bounded by the hard ceiling), never for ever; a process inside a namespace never steals a host process's lock.

Authoritative boot id: Linux `/proc/sys/kernel/random/boot_id`; macOS `sysctl kern.bootsessionuuid`; Windows has no boot id and uses the process creation time (`FILETIME`), which does not repeat when a pid is reused. Boot is never inferred from a clock minus uptime, and mtime is never used. The reader never spawns, and a missing start time is `unknown`. Boot id and pid namespace are read once per process (`platform/linux.rs`); no fgOS process that judges ever unshares its pid namespace after it starts, so the cached values stay true.

Node does not judge. It reaches the judge through one in-process door: `src/runner/dispatch/process-identity.mjs` is a thin client of six exports (`judge`, `observe`, `selfRecord`, `signalByIdentity`, `scan`, `resolveHolderLiveness`), at most 60 lines, with no `/proc` read and no `process.kill`. It calls the combined native addon through the loader leaf `src/native/door.mjs`, which Git also uses; the addon is the same crate cargo runs, so the vectors have one table and one runner. Calls are synchronous and never throw on a judgement: an unjudgeable record answers `unknown` (`judge`) or `unreadable` (`observe`), and a process that is gone answers `dead` or `absent`.

Two caller policies, both from the verdict and nothing else:

- **P1, reclaim only on `dead`.** `resolveHolderLiveness(record)` is the one adapter: `dead → 'dead'`, `alive | unknown → 'held'`. A record this observer cannot disprove is never reclaimed, cleaned or overwritten.
- **P2, signal only on `sent`.** `signalByIdentity(record, signal)` signals only while the process still matches the record, and answers `sent`, `identity-mismatch`, `identity-unknown`, `not-found`, `unsupported`, `denied` or `failed`. A caller counts a process as stopped only after it judges `dead`; `identity-mismatch` and `not-found` are re-judged, `identity-unknown` signals nothing, `unsupported` escalates to the next signal, `denied` and `failed` are errors. No site signals a bare pid.

`unknown` maps the same way everywhere: hold the record, signal nothing, and say what could not be read (the gateway refuses to stop with `gateway-stop-identity-unknown`, a lock fence refuses with `lock-fence-identity-unknown`).

Loader errors are named and fail closed, each with its next step: `process-door-unavailable` (the addon is missing, a symlink, of another target or ABI, or fails its digest; restage the active release with `fgctl init`) and `process-door-not-shipped` (this channel carries no addon, as the npm install does not: onboard the project with `fgctl init`). There is no JavaScript fallback.

Verification of the addon is per process: the loader hashes the `.node` file once per file identity (digest key of the manifest and addon, `dev`, `ino`, size, `mtimeNs`, `ctimeNs`), loads it lazily on the first door call, refuses a symlinked addon, and refuses a second, different file in one process (`git-addon-second-load`). Nothing is recorded across processes: `activation.json` has no addon field, and the cross-process verification of the original request stays open as a hand-off to the Host & Surface plan.

The Node budget is 60 lines of client; the Node judge, its `/proc` and `ps` readers and every private liveness copy are deleted. The internal host route that once answered a single pid is deleted too: no route answers a process question, and the exports of the door are the only Node surface.

## 4. Control

- **Signal by identity.** Linux: `pidfd_open`, check the start time, `pidfd_send_signal`, so there is no pid-reuse window. Other platforms: the tuple is checked right before `kill`, and the remaining window is stated.
- **Spawn with an explicit fd mapping.** `spawn_with_fds(cmd, fd_map)` closes every fd above 2 that is not in the map; a mapped fd is `dup2`'d in `pre_exec` and is not `CLOEXEC` only at that moment (holder-lock description rule 1). The leak test: a child spawned with `{3: fd}` has the inode at fd 3, a grandchild spawned without a map does not, and a child spawned with no map at all does not either.
- **Domain primitives.** `domain_is_empty(domain) → Empty | NotEmpty | Unknown` and `domain_kill_all(domain) → Ok | Refused`. In this track only `linux-gate` is implemented: empty iff `judge(tuple) == dead` (the kernel kills and reaps every task of the namespace before its init becomes a zombie), and `kill_all` is `signal_by_identity(tuple, SIGKILL)`. `windows-job` is judged by the Windows domain functions of `windows_job.rs`; `macos-tree` by the `macos-tree` containment driver (group plus descendant scan, with a second scan after 500 ms when judged from the record alone). Each answers `Unknown` and `Refused` on the other platforms.

Public types carry no raw fd or `pid_t`: `ProcId(u32)`, `FdSlot(u32)`, with `#[cfg(unix)]` inside the driver.

## 5. OS-neutral port

`ProcessPlatform` (facts + control) has one driver per OS. Linux is complete. macOS and Windows are real drivers for the parts that have clear semantics only: macOS reads the boot id through `sysctl`, reports `lock_holders` as `Unlistable` and `scan` as `Unsupported`; Windows uses the creation time in place of a boot id, `Unlistable`, `Unsupported`. `cargo check` for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin` is part of the crate's acceptance.

The containment port (`create`, `spawn_in`, `is_empty`, `kill_all`, `guarantee`) with the Linux `bwrap-pidns` and `linux-pgroup` drivers, the Windows `windows-job` driver and the macOS `macos-tree` driver is specified in section 10; the holder-lock track shipped only the two domain primitives above. Measured levels, for the record: Linux kernel (PID namespace when a user namespace is available, else best-effort process group), Windows kernel (Job Object, asynchronous kill, hence the predecessor rule), macOS best-effort (a `setsid` + double-fork escapee survives a group kill, measured on macOS 26.6).

## 6. Quiescence scan

`scan(filter) → Vec<ProcView{tuple, exe, cmdline, cwd, env_subset}>` reads `/proc/*/{cmdline,cwd,environ}` on Linux. An entry that cannot be read (permission, vanished) is counted as `unreadable`, never skipped silently, because the stop-everything check must not report clean on a partial view. The route `fgos internal quiesce-scan` exposes it ([holder-lock spec, section 10](../holder-lock/spec.md#10-internal-routes)); on other platforms the answer is `unavailable` and a person confirms that no fgOS process is left.

## 7. Known limits

- A start time that cannot be read is `unknown`, so a holder whose `/proc` entry is hidden (another user, a hardened mount) is held, never cleaned.
- The macOS and Windows drivers cannot list lock holders; diagnostics there say `unlistable`.
- Without a user namespace the Linux containment level is best-effort; that is reported by the run supervisor's doctor check, not here.
- Two `/proc` readers remain outside this crate until their owners move: the Session Identity process-tree adapter and the Observe store lock reader.

## 8. Lịch sử quyết định

- **2026-10-15 — Thiết kế nền bản 3: facts rời khỏi đường quyết định lock.** Kernel lock quyết ai giữ; facts chỉ còn cho binding supervisor/gate, fast path nóng tạm thời và hiển thị. Tuple chuẩn `{host, bootId, pidNs, pid, startTime}`; boot id từ nguồn có thẩm quyền, không từ đồng hồ, không mtime. [Design r6](../../../plans/reports/design-261016-1238-lock-and-run-supervisor-foundation-v3-r6.md) §5.1.
- **2026-10-16 — Phản biện vòng 1 (gemini R3-3): zombie và record thiếu pid.** `kill(pid, 0)` thành công với zombie nên zombie bị coi là sống; record thiếu pid bị `process-identity.mjs` coi là chết. Sửa: trạng thái `Z`/`X` → dead; thiếu pid → unknown (giữ). Design §14 vòng 1.
- **2026-10-16 — Phản biện vòng 2 (Argon R4-1) và vòng 3 (kongming N3, N4): PID namespace.** pid trong namespace không có nghĩa với host; gate đặt `FGOS_PIDNS_ANCHOR`, record trong namespace mang anchor; anchor chết → dead, còn lại → unknown; người phán ngoài init namespace gặp record không `pidNs` → unknown (agent trong sandbox không dọn record của holder host). "Miền rỗng" của attempt là `judge(gate) == dead`, quét inode namespace chỉ để chẩn đoán. Design §5.1, §14.
- **2026-10-16 — Plan 4.2 (Lead D3, D8): phạm vi của crate trong track này.** Không có primitive cho gate (subreaper, PDEATHSIG, PID namespace, tty) vì 4.2 không có consumer; chỉ hai primitive miền `domain_is_empty`/`domain_kill_all` với `linux-gate` cài thật, `windows-job`/`macos-tree` trả `Unknown`/`Refused` tới khi driver tương ứng có. Leaf Node `process-identity.mjs` đọc cùng vector, `resolveHolderLiveness` thành adapter của `judge`, thêm `pidExists` để các phase cutover thay mọi bản chép `isPidAlive` (leaf và `pidExists` đã bị thay thế bởi mục 2026-10-21 bên dưới). [Plan](../../../plans/261016-1104-holder-lock-kernel-lock-foundation/plan.md).
- **2026-10-19 — `arm_parent_death_signal` và đọc `/proc/locks` tới EOF.** Primitive PDEATHSIG cho gate terminal nằm ở crate này (gate gọi trước HELLO; run supervisor đóng cửa sổ monitor chết trước khi cài, xem [run-supervisor spec](../run-supervisor/spec.md) mục 16). `lock_table_entries` đọc hết một seq_file mở tới EOF thay vì một prefix: bảng không atomic, nên vắng mặt vẫn chỉ là lý do chạy probe shared-lock, không phải bằng chứng đã nhả.
- **2026-10-21 — T0 hội đồng: Node vào cửa in-process, bỏ leaf và route.** Thay thế mục **2026-10-16 — Plan 4.2 (Lead D3, D8)** ở trên theo tên: leaf Node `process-identity.mjs` đọc cùng vector và `pidExists` bị gỡ; Node không còn phán, chỉ gọi judge Rust qua cửa `src/native/door.mjs` (client mỏng sáu export), route nội bộ quan sát một pid bị xoá, các bản `isPidAlive`/`kill(pid, 0)` và `signalByIdentity` thứ hai của lock fence bị xoá. Chính sách P1 (chỉ thu hồi khi `dead`) và P2 (chỉ coi là dừng khi đã `sent` rồi judge `dead`); `unknown` luôn là giữ. Xác minh addon giữ theo từng process (không thêm trường `activation.json`, không kênh npm: chỉ `fgctl init` được hỗ trợ), theo quyết định của anh ngày 2026-10-21 (12:05, 17:43). Containment: `linux-pgroup` không đặt subreaper lên caller, `is_empty` trả `unknown` khi bất kỳ thành viên nào không phán hoặc không đọc được. [Phân xử](../../../plans/reports/council-261021-1507-harden-t0-arbitration.md), [plan](../../../plans/261021-1547-harden-t0-process-facts-door/plan.md).
- **2026-10-22 — Hội đồng containment theo thao tác: sửa trong hình dạng hiện có.** Port không thêm thao tác. `control::exit_descriptor` (pidfd) chuyển từ holder-lock xuống crate này để Git và holder-lock dùng chung một bản; marker môi trường của lượt chạy được theo dõi (`containment::WATCH_ENV`, `watch_token`) cũng chuyển xuống đây. `environment_marked` trả rỗng ngoài Linux, nên `macos-tree` không theo dõi được escapee. Domain theo thao tác (anchor pid-1) đã thiết kế nhưng hoãn tới khi có điều kiện kích hoạt. [Phân xử](../../../plans/reports/council-261022-1251-opc-arbitration.md), [plan](../../../plans/261022-1335-opc-phase-a-containment-fixes/plan.md).

## 9. Related files

| Relationship | File |
|---|---|
| defines (judge vectors) | [process-facts.judge.v1.json](../../../packages/process/contracts/process-facts.judge.v1.json) |
| consumed by | [holder-lock/spec.md](../holder-lock/spec.md) |
| sibling L0/L1 authority | [identity/spec.md](../identity/spec.md) |
| boundary | [component-boundary.md](../component-boundary.md) |
| Node door and its callers | [door.mjs](../../../src/native/door.mjs), [process-identity.mjs](../../../src/runner/dispatch/process-identity.mjs), [runner.md](../../specs/runner.md) |
| plan | [plan.md](../../../plans/261016-1104-holder-lock-kernel-lock-foundation/plan.md) |
| design and evidence | [design r6](../../../plans/reports/design-261016-1238-lock-and-run-supervisor-foundation-v3-r6.md) |

## 10. Containment port

Added by the run supervisor ([run-supervisor spec](../run-supervisor/spec.md)); source `packages/process/rust/src/containment/`, [contract](../../../packages/process/contracts/containment.port.v1.json). The port is an OS-neutral process domain per attempt that can be proven empty. L0: it knows no attempt beyond the id that names a domain, and no envelope, lock or pane. The supervisor never calls bwrap, a Job Object or a process group directly.

| Operation | Meaning |
|---|---|
| `create(attemptId) -> domain` | A domain with no process yet |
| `spawn_in(domain, spec) -> root tuple` | Start the gate inside the domain with an explicit fd map (`spawn_with_fds`, every other fd from 3 up is closed) and an exact environment; the domain id is complete afterwards. The id is identical to the `domainId` of the holder-lock predecessor record, so it can be declared as is |
| `is_empty(domain) -> empty \| not-empty \| unknown` | The OS's real state; a caller never treats `unknown` as empty |
| `kill_all(domain, graceMs) -> ok \| refused` | SIGTERM (or job terminate), then SIGKILL after `graceMs` (0 means at once), then wait for empty; `refused` when the driver cannot act (identity mismatch, unsupported) |
| `guarantee() -> {driver, level, escapes}` | `kernel`, `best-effort` or `unsupported`, with the named escape routes the doctor prints |

Driver selection: Linux uses `bwrap-pidns` when bwrap with user and PID namespaces works (probed once per process and path), else `linux-pgroup`; Windows `windows-job`; macOS `macos-tree`; anything else `unsupported-platform`. Port errors have stable names: `unsupported-platform`, `driver-unavailable`, `spawn-failed`, `namespace-unavailable`, `invalid-bwrap-prefix`, `io`.

| Driver | Mechanism | `is_empty` | Level | Named escapes |
|---|---|---|---|---|
| `bwrap-pidns` (Linux) | `bwrap --unshare-pid --as-pid-1 --proc /proc`; the gate is pid 1 of the namespace. `--die-with-parent` only in terminal mode, refused in direct mode | `judge(gate host tuple) == dead`: the kernel kills and reaps every task of the namespace before its init becomes a zombie. No `ns/pid` inode scan (doctor diagnostics only) | `kernel` | Processes created by a daemon outside the namespace on the agent's request (herdr, systemd, docker) |
| `linux-pgroup` (Linux, no user namespace) | Own session and process group for the gate; `kill_all` is `killpg` by identity of the root plus a descendant scan. The driver sets no subreaper on its caller (the run supervisor owns that, section 2) | `judge(root) == dead`, no process in the `/proc` row scan of the group, and no descendant seen by an earlier scan still alive. `unknown`, never `empty`, when any seen or listed member cannot be judged or read, or the table cannot be listed | `best-effort` | `setsid` descendants leave the group; a group scan after the leader died can meet a reused pgid; daemons outside the domain |
| `windows-job` | A named Job Object (`KILL_ON_JOB_CLOSE`, no breakaway); the gate is a member from its first instruction. The job functions belong to the Windows domain code of this crate (`windows_job.rs`) | The job view and contender view of the predecessor contract; never `ActiveProcesses == 0` alone, never an unopenable job read as empty | `kernel` | Processes created outside the job by a service or COM server on the agent's request |
| `macos-tree` (`pgroup-tree`) | Own session and group for the agent; `killpg` plus a scan of the descendant tree (`proc_listchildpids`) | No process in the group and none in the scanned tree; judged from the record alone, a second scan runs after 500 ms | `best-effort` | `setsid` plus a double fork reparents a descendant to launchd, out of the group and the tree (measured: it survives `killpg`); a group or tree scan after the root died can meet a reused pgid; launchd or XPC services |

**Guarantee level.** `kernel` means the OS itself keeps the domain: a PID namespace, a Job Object. `best-effort` means the driver finds and kills what it can see; on a best-effort platform a free attempt lock does not prove that no writer remains, so adopt waits and scans again, and the attempt's binding records the level. No platform is refused for being best-effort; the level is said out loud (doctor `process-containment`, `fgos run --json`, `dispatch inspect`).

**Escapes stated explicitly** (beyond the table):

1. *Reused pgid.* On `macos-tree` and on `linux-pgroup` (best-effort), a pgid scan made after the leader died can meet a pgid the kernel has since given to an unrelated group. The drivers signal a group only while the leader still matches its recorded identity and otherwise fall back to the descendant list gathered earlier; a window remains where a scan after the leader's death cannot tell a stranger's group from the domain's.
2. *Environment marker (`linux-pgroup`, 2026-10-20, phase 07 unit 22, owner decision).* `containment::environment_marked(name, value)` lists the live processes of the user whose environment carries `name=value`. A borrower that must not report plain success past a `setsid` or double-fork escapee (Git spec section 15 E4) plants a per-run value in the borrowed child's environment and asks this function after its own cleanup; descendants inherit the value through every reparenting, so the answer does not depend on the group, the session or the parent chain. It is a best-effort observation: a descendant that clears its environment, or another user's process, is not found. It never kills, and it does not change `is_empty`, which stays judged from the record alone.
3. *Windows kill wait.* `kill_all` on `windows-job` terminates the job at once and ignores `graceMs` (Windows has no polite stop for a tree), then waits a fixed 5 seconds (`EMPTY_WAIT` in `containment/windows.rs`) for the job to be empty; if it is not, the answer is `refused`. Open: this bound is not yet read from `lock.predecessorKillWaitMs`.

Domain primitives of section 4 are what the port uses underneath: `linux-gate` and `windows-job` and `macos-tree` records are judged by `domain_is_empty` / `domain_kill_all` or their watchers; `linux-pgroup` is a `domainKind` of the predecessor record.

- **2026-10-18 — Fast-exit containment:** Successful spawn remains successful when the child exits before identity capture. Linux process-group and macOS tree roots retain an unreaped child's start time, including zombies; group members still determine emptiness. A bwrap `child-pid` reported under `--unshare-pid --as-pid-1` names namespace init: if already absent, its `linux-gate` tuple carries reserved start time `exited-before-identity`, an empty-domain tombstone whose kill is a no-op (including record-only checks); the monitor still yields the actual exit status. Missing namespace reports remain `namespace-unavailable`, and unreadable identity is never evidence of emptiness.

2026-10-20 (Git phase 06 unit 12): `facts::file_users(device, inode)` is a read-only Linux diagnostic snapshot over the existing `/proc` pid enumeration and descriptor inode matching. It returns visible users' rechecked process identities and executable paths, including descriptors without advisory kernel locks; unsupported platforms return unavailable. Hidden/unreadable processes are omitted. Descriptor reuse and concurrent close/open remain possible: the snapshot never grants ownership or proves quiescence, and no file is moved or signalled by this primitive. Process knows no Git paths or lock policy.
