# OPC council: correctness and security seat

HEAD: `7a6f366ed` (`git -C /home/vantt/projects/forgent-worktrees/opc-design rev-parse --short HEAD`). Read 2026-10-22 (Asia/Saigon). Paths are relative to the worktree.

**What I ran** (all read-only, no timing, no host-visible mount; each `bwrap` makes only its own private mount namespace, the same argv production uses):

- `.fgos/runtime/tmp/opc-correctness/anchor.py` as pid 1 under `bwrap --unshare-pid --as-pid-1 --dev-bind / / --proc /proc`: a setsid plus double-fork escapee, an in-namespace SIGTERM sent to pid 1, a `kill(-1, SIGTERM)` sweep, a zombie count, and a fork storm swept by `kill(-1, SIGKILL)`.
- `.fgos/runtime/tmp/opc-correctness/{host,fds,mi}.sh`: the host sends SIGTERM and SIGKILL to the bwrap gate, then reads the fd tables of the monitor and the gate, the gate's `NSpid`, and the propagation tags in the sandbox `mountinfo`.
- Git 2.53.0 scratch repositories (in the session scratchpad): does `status`, `diff` or `merge-tree` run a clean filter or a merge driver, and does a superproject `status` run a filter configured in a submodule?

Host facts: `kernel.yama.ptrace_scope=1`, `apparmor_restrict_unprivileged_userns=1`, AppArmor profile `bwrap-userns-restrict` present, and the bwrap probe argv works in this session.

## 1. Position

| Q | Position (one line) | Evidence |
|---|---|---|
| Q1 | **L-A (bwrap plus a pid-1 anchor), under the correctness conditions of §3 below.** The quiescence proof must be `kill(-1, 0) == ESRCH` after reaping, not a `/proc` listing. Record L-C as a later driver. | Verified: an escapee reparents to pid 1 and stays visible. `kill(-1,0)` counts zombies until they are reaped, then returns ESRCH. A fork storm was empty after 2 sweeps (anchor.py). |
| Q2 | **`Inspect` yes.** `LocalMutation` yes only if a child in flight when the anchor dies is reported as `containment-unproven` / recovery-required. Remote and borrowed children stay out. | Anchor death SIGKILLs every member with no SIGTERM (verified, host.sh case 4), so `update-ref` can leave `<ref>.lock` behind. |
| Q3 | **P1, with one change.** `quiesce` returns its own type (`Quiescent \| Busy \| Unknown`) and never reuses `DomainState`. `is_empty` keeps meaning "domain ended". | `DomainState::Empty` is what the predecessor rule and the run supervisor rely on (`docs/platform/process/spec.md:142-151`). Overloading it is P3 in disguise. |
| Q4 | No new key. Doctor reports `operationDomain`. | No correctness need for a kill switch: the fallback is the default per-child implementation. |
| Q5 | **(a) Control-socket EOF.** The anchor sends SIGTERM to member groups, waits the grace, then SIGKILLs, and only then exits. It must not exit early: its own exit SIGKILLs everyone (verified). | PDEATHSIG on the anchor would track the bwrap **monitor**, which is its real parent. The monitor does not die with the host in Direct mode (`containment/linux.rs:104-106`). |
| Q6 | No view. | |
| Q7 | **A named error by default (`containment-mount-refused`, surfaced as a Git refusal and a doctor row). No silent per-operation fallback.** A fallback is acceptable only if contained children with possible user code then run under the environment-marker watch, and the result states `best-effort`. | Today's `select` already downgrades silently for the whole process when the bad mount exists at probe time (`containment/linux.rs:27-34,45-63`, same `--dev-bind / /` argv). On `linux-pgroup` the contained branch has no watch (finding F2). |
| Q8 | **Keep a domain for `Inspect`.** It is cheap to share, and residual user code is real: a superproject `status` ran a submodule's clean filter (verified). Repository-level filters, merge drivers and textconv are already refused by preflight. | `driver.rs:788-797` (refusal), `:1721-1739` (`command_config`). The submodule test: superproject `config --list` showed 0 filter keys, and the filter still ran once. |
| Q9 | Operation boundary: one Git port call, on the operation-local `RepoHandle` (the lifetime of `checkout_config`). A CLI call that is not a typed operation gets one domain per port call. H6 (the probe) is not fixed by a domain; making the first `open` serve as the probe is safe only if its failure is handled exactly as `select` handles it today. | `driver.rs:282` (`select` per `GitDriver::new`), `containment/linux.rs:45-63`. |
| Q10 | Two correctness wins inside today's shape: (1) bound the wait after `kill_all` (`driver.rs:1216-1217`), which can hang forever today; (2) replace the 2 ms poll with a pidfd poll on the monitor (equivalent semantics, race-free). | F4 and §4. |

## 2. Findings

| # | Severity | Claim | Evidence | Consequence |
|---|---|---|---|---|
| F1 | High (design correction) | The design's emptiness proof I3 ("numeric `/proc` entries ≠ 1") is weaker than what the kernel offers. Pid 1 can prove the namespace empty atomically: `kill(-1, 0)` returns ESRCH exactly when no task other than init exists in the namespace. Zombies still count, so the anchor must reap until `ECHILD` first. A `/proc` readdir races with fork. | anchor.py: `alone()` was False with an unreaped zombie and True after reaping. A fork storm was proven empty after 2 `kill(-1,SIGKILL)` sweeps. Fork-time group signals reach the new child: kill(-1) is a multi-process signal (kernel ≥ 4.20). | Specify the proof as: sweep `kill(-1,SIGKILL)`, reap until `ECHILD`, and require `kill(-1,0)==ESRCH`. Anything else, or a bound reached, is `Unknown`/`Busy`, never quiescent. |
| F2 | High | On `linux-pgroup`, the **contained** branch has no escapee watch. The environment marker is planted only on the borrowed path. A `setsid` escapee of user code run by an Inspect child (a submodule filter, see F3) survives, and the call reports plain success. A per-operation fallback to `linux-pgroup` (Q7) inherits exactly this gap. | `driver.rs:1166-1245`: no marker. `holder-lock/rust/src/port.rs:1111` is the only caller of `environment_marked` (`containment/linux.rs:367`). Git spec §15 E4 (line 740) claims drain "through the Process containment driver of each platform". | E4 holds on `bwrap-pidns` for contained children (the kernel zaps on pid-1 exit) but not on `linux-pgroup`. Confined agent sessions select `linux-pgroup` (Git spec line 741). Fix by reusing the marker, not with a new mechanism (§4). |
| F3 | Medium (design correction) | The premise of I4 / Q8, "filters reachable from Inspect `status`", is mostly closed already. Preflight refuses any effective config with `filter.*.clean/smudge/process`, `merge.*.driver`, `*.textconv` or `gpg.program`, and the config stamp is rechecked between children. What remains: (a) a **submodule's** own config, which `config --list` of the superproject does not show, while `status` and `diff` recurse into submodules to test dirtiness; (b) a config write that races between the stamp check and Git's own read. | `driver.rs:364,708,788-797,1721-1739`; test `checkout_stamp_rechecks_external_config_writes_between_children` (`driver.rs:2670`). Verified: `status` in the superproject ran the submodule filter once. `inspect.rs:1094` runs `status` without `--ignore-submodules`. | A pid namespace for Inspect is worth it for (a) and (b), not for top-level filters. Q8 answer: keep the domain. Sharing it is safe once F1 holds. |
| F4 | Medium | Today's timeout and output-limit path can hang without bound. `kill_all(&mut domain, 3000)` ignores a `Refused` outcome and then calls `spawned.child.wait()` on the bwrap monitor, which waits for pid 1. Pid 1 blocks in namespace teardown while any member sits in D-state. | `driver.rs:1216-1217`. The kernel's init exit waits for every namespace task (the process spec states the same, `docs/platform/process/spec.md:151`). | I9 promises `containment-unproven` and not a hang. Cheap fix inside today's shape: if `kill_all` is not `Ok`, detach the monitor to a reaper thread and return `containment-unproven`. The same rule must hold for the anchor's `close`. |
| F5 | Medium | The "cooperative SIGTERM" of I1/I8 does not reach today's per-child bwrap child unless it installed a handler. Git is pid 1 there, and the kernel drops non-forced signals from the parent namespace to an init with no handler. Read-only Git without a tempfile has no handler, so a timed-out Inspect child waits the full 3 s grace and then gets SIGKILL. `update-ref` does have a handler once it holds `<ref>.lock` (Git's tempfile sigchain), so its lock cleanup works. | host.sh case 1: the gate was alive 0.5 s after a host SIGTERM. `containment/linux.rs:183-186`. | (1) Conformance vector 4 cannot assert `terminated` for a handler-less child on the default per-child bwrap implementation. Either it names `killed-after-grace` as the default's honest outcome, or the vector applies to native implementations only. (2) Under the anchor, children are not pid 1 and SIGTERM works normally. This is a behaviour change and an improvement; say so. |
| F6 | Medium | Exit-status encoding differs by driver. bwrap reports a signalled gate as exit code 128+n (137 measured for SIGKILL), so today `Output.code` is `Some(137)` on `bwrap-pidns` and `None` on `linux-pgroup`. An anchor would report the real wait status. | host.sh case 6; `driver.rs:1252-1256` copies `status.code()`. | The port contract must pin one encoding (`exited{code} \| signalled{sig}`). Otherwise the default and native implementations disagree, and so do the drivers. |
| F7 | Medium | I5 hazard: the anchor is a **pre-existing process that receives descriptors by SCM_RIGHTS**. Holder-lock's narrowed `Reach::Since` drain explicitly does not cover that ("Descriptor transfers by SCM_RIGHTS … to pre-existing processes are outside that narrowed candidate set"). A lock description sent to the anchor by mistake would survive every borrow return until release. | `docs/platform/holder-lock/spec.md:114`. | Make it structural, not only a convention. The anchor `recvmsg`s with `MSG_CMSG_CLOEXEC`, `fstat`s every received fd and refuses anything that is not a FIFO, a socket or `/dev/null` (a lock description is a regular file), and closes its copies right after the spawn. A copy it keeps would also hold the host's stdout pipe open and turn every child into `containment-unproven` through the 1 s `recv_timeout` (`driver.rs:1230-1238`). Conformance 8 asserts all of this. |
| F8 | Low (verified non-issue) | bwrap's monitor, which stays in the host namespace, does **not** keep descriptors mapped into the gate. Its fd table is 0-2 plus its signalfd; the gate holds the mapped fd. A description mapped through bwrap therefore lives only inside the namespace. | fds.sh: monitor `0 1 2 3(signalfd)`, gate held fd 5. | No extra holder-lock attribution problem from the bwrap layer. The anchor's control fd is likewise held only by the anchor. |
| F9 | Low | Do **not** harden the anchor with `PR_SET_DUMPABLE=0`. A non-dumpable task's `/proc/<pid>/fd` is owned by root (the userns maps no uid 0), so holder-lock's release-time descriptor scan would meet an unreadable process, read it as uncertainty and return `lock-release-stuck`. Members cannot ptrace the anchor anyway at Yama scope ≥ 1 (the anchor is their ancestor). At scope 0, list it as a named escape. | Kernel reasoning (`proc_fd_permission`, `task_dump_owner`), not run. `ptrace_scope=1` here. `docs/platform/holder-lock/spec.md:120` (an unreadable holder is uncertainty). | Keep the anchor dumpable. Document "yama 0: a same-uid member can trace pid 1" next to the existing daemon escape. |
| F10 | Low | The anchor must install **no** signal handlers and must **not** block signals for a signalfd. Members can then never signal pid 1: the in-namespace SIGTERM to init was dropped (verified). A blocked signal would be queued even for init, which lets any member feed the anchor's loop. The run-supervisor gate installs SIGTERM/SIGINT handlers (`docs/platform/run-supervisor/spec.md:112`), so any agent process can `kill -TERM 1` and cancel its own attempt. That is prior art **not** to copy. | anchor.py ("init survived in-ns SIGTERM"); kernel `sig_ignored` returns false for blocked signals. | The anchor loop polls the control socket plus a pidfd of the current child, reaps with `waitpid(-1, WNOHANG)`, and spawns each child with a default signal mask and default dispositions. |
| F11 | Low | A long-lived anchor sees host mount changes. The sandbox mounts are slaves of the host (48 of 50 entries carry `master:`), so R3 exposure drops from once per child (≈65 per Land) to once per open (≈2 per Land). The anchor's cwd pins its mount in the namespace copy. | mi.sh. | Anchor `chdir("/")`. Children get `SpawnSpec.cwd`. |
| F12 | Low (out of OPC scope; separate item per RUL11) | The borrowed `merge` path is not watched for a merge driver. Merge drivers are refused by preflight, so the gap is limited to submodule config and config races, the same as F3. `user_code_may_run` also ignores submodule configs. | `land.rs:561`, `sync.rs:252`, `driver.rs:928-963`. | Record as a Git item. It does not block OPC. |

Identity check (requested). The host tuple of the anchor comes from bwrap `--info-fd` (`containment/linux.rs:127-166`). A member's host pid is recoverable: the host's `/proc/<p>/status` shows `NSpid: <host> <ns>` (fds.sh: `NSpid: 2884004 1`), and the start time is the same in both views because bwrap creates no time namespace. So the counsel's future freeze-and-read-fd mechanism (I8) still works, provided the host maps the anchor-reported `(ns pid, start time)` through `/proc/<anchor>/task/*/children`, or through a scan filtered by the `ns/pid` inode.

Is the default per-child implementation really today's behaviour? Only if it keeps all of the following:

- the `is_empty` check after exit, then `kill_all(3000)`, then a second `is_empty`;
- the 1 s pipe `recv_timeout` that catches pipe-holding escapees (`driver.rs:1221-1238`);
- Direct mode, where a contained child outlives a dead host;
- bwrap's 128+n exit encoding;
- F5's dropped SIGTERM.

The conformance suite must document the last two as properties of the default implementation, not hide them.

## 3. Recommended shape

**Port (P1, extension of `ContainmentDriver`).**

- `open_operation(id) -> OperationDomain`
- `run(&mut od, ChildSpec) -> ChildHandle`, where `ChildSpec` holds argv, an exact env, cwd and stdio fds only (no `fd_map`). `ChildHandle` gives `wait`, `try_wait` and `terminate(grace)`, and its outcome is `Exited{code} | Signalled{sig} | DomainLost`.
- `quiesce(&mut od, bound) -> Quiescent | Busy | Unknown`
- `close(od, grace) -> KillOutcome`

The default methods are today's per-child sequence. `guarantee()` gains `operationDomain: native | per-child`. Two new port errors: `domain-busy`, `domain-closed`. If the council adopts T1's name, the mount refusal is a cause under `namespace-unavailable`, for example `namespace-unavailable: containment-mount-refused: <bwrap line>`. That keeps I10 (no new Git refusal vocabulary) and aligns with T1 phase 4.

**Linux native implementation (`bwrap-pidns`).** The anchor is a helper role, spawned through the existing `spawn_in` with `fd_map = [control]`. Its rules:

1. No signal handlers, no blocked signals. It stays dumpable and runs with cwd `/`.
2. Its loop polls the control socket plus a pidfd of the current child, and reaps orphans continuously with `waitpid(-1, WNOHANG)`.
3. One child at a time; a concurrent request gets `domain-busy`. The child gets its own process group, default signal mask and dispositions, and only its stdio. Received fds pass F7's checks and are closed after the spawn.
4. `terminate(grace)` is SIGTERM to the child's group through the child's pidfd identity, the grace, then the quiescence sweep.
5. Quiescence: `kill(-1,SIGTERM)` (only on `close`), `kill(-1,SIGKILL)`, reap until `ECHILD`, then `kill(-1,0)==ESRCH`, within the bound. Otherwise `Busy`/`Unknown` (F1).
6. On control EOF: SIGTERM, grace, SIGKILL sweep, then exit (Q5a).
7. The status of a child is reported only by the anchor. A host that loses the anchor mid-child reports `DomainLost`, and Git maps that to `containment-unproven`. Closed pipes alone never count as success.

**Host side.** Every request is bounded. On a timeout or a lost anchor, the host SIGKILLs the anchor's tuple (forced across the namespace boundary), and `close` reports `judge(anchor) == dead`. It never waits on the monitor without a bound (F4).

**Git.** `Inspect` and `LocalMutation` go to the operation domain, on the operation-local `RepoHandle`. Remote without a loan keeps a per-child domain. Borrowed children are unchanged.

**Other drivers.** `linux-pgroup`, `macos-tree` and `windows-job` keep the default implementation. On `linux-pgroup`, the contained branch reuses the environment marker when user code may run, which also covers submodules (F2).

**Deletion list (L10).** `driver.rs` contained branch:

- the per-child `create`/`spawn_in`/2 ms poll/`kill_all`/`is_empty` block (`:1166-1245`) is replaced by `run` plus `quiesce` on the handle's domain;
- the 2 ms `try_wait` loop goes (`:1205-1220`);
- the unbounded `child.wait()` after `kill_all` goes (`:1216-1217`).

No Process code is deleted: per-child `create`/`spawn_in` stay as the default implementation and as the run supervisor's door.

**Conformance additions to design §6.**

- (12) An anchor dies after a child exits but before its status is reported: the host reports `DomainLost`, never success.
- (13) A member queues SIGTERM to pid 1: the anchor's state is unchanged.
- (14) A received regular-file fd is refused.
- (15) The exit encoding is identical across the default and native implementations.
- (16) A D-state member, simulated as a member stopped with `SIGSTOP` from the host in a test fixture, makes `quiesce` return `Busy`/`Unknown` within its bound, and the host never hangs.

## 4. Proposed additions (RUL104)

1. **Environment-marker watch for contained children on `linux-pgroup`.**
   - Problem: F2. E4 is silently unheld for contained children on best-effort hosts and in any per-operation fallback.
   - Evidence: `driver.rs:1166-1245` has no marker; the submodule filter runs (verified).
   - Benefit: the same rule as the §15 E4 unit-22 decision, reusing `environment_marked`, with no new mechanism. It is what makes the Q7 fallback acceptable.
2. **Bounded post-kill wait in today's contained branch.**
   - Problem: F4, a possible hang forever.
   - Evidence: `driver.rs:1216-1217`.
   - Benefit: honours I9 now, independent of OPC. It is a few lines.
3. **Submodule-aware user-code predicate.**
   - Problem: F3 and F12. The `check_config` refusal and `user_code_may_run` see only the superproject's config, while `status`/`diff` recurse into submodules.
   - Evidence: the scratch test.
   - Benefit: closes the residual route for both the borrowed watch and the contained path. It is a separate Git item, not part of OPC.

## 5. What would change my position

- **Q8 / F3 (whether Inspect needs a domain).** If Git always passes `--ignore-submodules=all` for Inspect reads, or refuses repositories that have submodules, and the config-race window is shown to be closed, then Inspect runs no user code. A plain process group would then do, and that could replace the domain for reads. This is H6's cheaper answer.
- **Q1.** A measured L-C (cgroup v2 `cgroup.kill` plus `populated`) that is available on the owner's hosts would give a stronger, atomic emptiness proof per child and remove I2 altogether. I would prefer it to L-A.
- **Q2 (`LocalMutation`).** Evidence that `<ref>.lock` left behind by a killed `update-ref` is already recovered automatically would let it share the domain unconditionally. Evidence that it is not would move it to a per-child domain.
- **F1.** A kernel older than 4.20 among supported hosts weakens the fork-race argument for `kill(-1)`. The repeat-until-ESRCH loop still holds, with more sweeps.

## 6. Status

```text
Status: DONE_WITH_CONCERNS
Summary: L-A is sound if quiescence is proven by kill(-1,0)==ESRCH after reaping, the anchor installs no signal handlers and type-checks the fds it receives, and anchor loss is never read as success; the per-child default is today's behaviour only with its dropped-SIGTERM and 128+n quirks stated. Concerns: on linux-pgroup, contained children have no escapee watch (E4 gap, which a Q7 fallback would inherit), and today's contained branch can hang after a refused kill_all.
```

Unresolved: the F9 `PR_SET_DUMPABLE` effect is kernel reasoning and was not run. Mount propagation was read from `mountinfo` tags; no mount was performed.
