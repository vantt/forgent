# Process Facts And Control Component Specification

```txt
Document type: BA-grade area specification
Audience: Human reviewer, maintainer, implementation agent
Purpose: Define the single authority for "is this process tuple alive, dead or unknown" and for signalling a process by identity
Design status: Accepted
Implementation status: In progress (judge vectors landed; crate, Node leaf alignment and the domain primitives land in parallel phases)
Canonical: Yes
Owner: Process component (facts + control, L0)
Source: packages/process/rust (crate fgos-process); Node leaf src/runner/dispatch/process-identity.mjs
Contracts: packages/process/contracts/
Last reviewed: 2026-10-16
Related:
- docs/platform/holder-lock/spec.md
- docs/platform/component-boundary.md
- docs/platform/session-identity/spec.md
- docs/specs/runner.md
- plans/261016-1104-holder-lock-kernel-lock-foundation/plan.md
- plans/reports/design-261016-1238-lock-and-run-supervisor-foundation-v3-r6.md
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
| `spawn_with_fds`, `signal_by_identity` | The gate primitives (subreaper, `PR_SET_PDEATHSIG`, a new PID namespace, the tty foreground group): deferred to the run supervisor, no consumer in this track |
| `domain_is_empty`, `domain_kill_all` for a declared domain | The full containment port (`create`, `spawn_in`, `guarantee`): run supervisor |
| The OS-neutral `ProcessPlatform` trait and one driver per OS | mtime of anything; a boot time derived from a clock |

The reconcile planner keeps importing only the `facts` module (the existing import-graph rule of `src/runner/dispatch/process-identity.mjs`). The component-boundary entry is [Process Facts & Control (L0)](../component-boundary.md#4-current-high-level-components).

## 3. Facts: the judge table

The tuple is `{host, bootId, pidNs, pid, startTime}`. A record written before the tuple existed carries `processStartTime`; the adapter reads it as `startTime`. Rules are evaluated in order; the first that applies decides.

| Event | Result |
|---|---|
| Other host, or other pid namespace without a decisive anchor | unknown |
| Same host, recorded boot id differs from the running kernel's | dead |
| No pid in the record (missing, corrupt, not a positive integer) | unknown (the Node leaf answered `dead` here before; a record without a pid proves nothing) |
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

Authoritative boot id: Linux `/proc/sys/kernel/random/boot_id`; macOS `sysctl kern.bootsessionuuid`; Windows has no boot id and uses the process creation time (`FILETIME`), which does not repeat when a pid is reused. Boot is never inferred from a clock minus uptime, and mtime is never used. The leaf reader never spawns: the macOS Node driver does not call `ps`, and a missing start time is `unknown`.

The same vectors are run by cargo and by the Node leaf, so there is no second judge table. `resolveHolderLiveness` in the Node leaf becomes an adapter of `judge` (`dead → 'dead'`, `alive | unknown → 'held'`); the one behaviour change is that a record without a pid now reads `held` and a zombie reads `dead`. `pidExists(pid)` (`process.kill(pid, 0)`, `EPERM` counts as existing) is the one helper the cutover phases use in place of every private `isPidAlive` copy, which they delete in the same commit.

## 4. Control

- **Signal by identity.** Linux: `pidfd_open`, check the start time, `pidfd_send_signal`, so there is no pid-reuse window. Other platforms: the tuple is checked right before `kill`, and the remaining window is stated.
- **Spawn with an explicit fd mapping.** `spawn_with_fds(cmd, fd_map)` closes every fd above 2 that is not in the map; a mapped fd is `dup2`'d in `pre_exec` and is not `CLOEXEC` only at that moment (holder-lock description rule 1). The leak test: a child spawned with `{3: fd}` has the inode at fd 3, a grandchild spawned without a map does not, and a child spawned with no map at all does not either.
- **Domain primitives.** `domain_is_empty(domain) → Empty | NotEmpty | Unknown` and `domain_kill_all(domain) → Ok | Refused`. In this track only `linux-gate` is implemented: empty iff `judge(tuple) == dead` (the kernel kills and reaps every task of the namespace before its init becomes a zombie), and `kill_all` is `signal_by_identity(tuple, SIGKILL)`. `windows-job` is judged by the Windows domain functions of `windows_job.rs`; `macos-tree` by the `macos-tree` containment driver (group plus descendant scan, with a second scan after 500 ms when judged from the record alone). Each answers `Unknown` and `Refused` on the other platforms.

Public types carry no raw fd or `pid_t`: `ProcId(u32)`, `FdSlot(u32)`, with `#[cfg(unix)]` inside the driver.

## 5. OS-neutral port

`ProcessPlatform` (facts + control) has one driver per OS. Linux is complete. macOS and Windows are real drivers for the parts that have clear semantics only: macOS reads the boot id through `sysctl`, reports `lock_holders` as `Unlistable` and `scan` as `Unsupported`; Windows uses the creation time in place of a boot id, `Unlistable`, `Unsupported`. `cargo check` for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin` is part of the crate's acceptance.

The containment port of the design (`create(attemptId) → domain`, `spawn_in`, `is_empty`, `kill_all`, `guarantee() → kernel | best-effort`) with the Linux `bwrap-pidns` driver (gate as pid 1 of the namespace), the Windows `job-object` driver and the macOS `pgroup-tree` driver is the run supervisor's work; this track ships only the two domain primitives above. Measured levels, for the record: Linux kernel (PID namespace when a user namespace is available, else best-effort process group), Windows kernel (Job Object, asynchronous kill, hence the predecessor rule), macOS best-effort (a `setsid` + double-fork escapee survives a group kill, measured on macOS 26.6).

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
- **2026-10-16 — Plan 4.2 (Lead D3, D8): phạm vi của crate trong track này.** Không có primitive cho gate (subreaper, PDEATHSIG, PID namespace, tty) vì 4.2 không có consumer; chỉ hai primitive miền `domain_is_empty`/`domain_kill_all` với `linux-gate` cài thật, `windows-job`/`macos-tree` trả `Unknown`/`Refused` tới khi driver tương ứng có. Leaf Node `process-identity.mjs` đọc cùng vector, `resolveHolderLiveness` thành adapter của `judge`, thêm `pidExists` để các phase cutover thay mọi bản chép `isPidAlive`. [Plan](../../../plans/261016-1104-holder-lock-kernel-lock-foundation/plan.md).

## 9. Related files

| Relationship | File |
|---|---|
| defines (judge vectors) | [process-facts.judge.v1.json](../../../packages/process/contracts/process-facts.judge.v1.json) |
| consumed by | [holder-lock/spec.md](../holder-lock/spec.md) |
| sibling L0/L1 authority | [session-identity/spec.md](../session-identity/spec.md) |
| boundary | [component-boundary.md](../component-boundary.md) |
| Node leaf and its callers | [runner.md](../../specs/runner.md) |
| plan | [plan.md](../../../plans/261016-1104-holder-lock-kernel-lock-foundation/plan.md) |
| design and evidence | [design r6](../../../plans/reports/design-261016-1238-lock-and-run-supervisor-foundation-v3-r6.md) |
