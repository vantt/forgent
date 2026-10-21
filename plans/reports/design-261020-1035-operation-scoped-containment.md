# Design (preliminary): operation-scoped containment behind the containment port

**Tóm tắt cho owner.** Mỗi lệnh Git "contained" hiện chạy trong một sandbox bwrap (PID namespace) riêng, tốn ≈10.8 ms/lệnh so với 3.1 ms không bọc và 3.7 ms borrowed; Land có ~65 lệnh như vậy (≈0.5 s, 37% thời gian Land), ScopedCommit có 8. Tài liệu này gom toàn bộ vấn đề, bất biến an toàn, ràng buộc tầng lớp và các phương án để hội đồng quyết sau, không phải kế hoạch thi công. Đề xuất sơ bộ: không thêm cơ chế mới mà mở rộng chính port containment hiện có bằng một năng lực "miền theo thao tác" (mở miền, chạy từng lệnh con, chứng minh miền rỗng giữa hai lệnh từ trạng thái OS thật, kết thúc hợp tác SIGTERM→grace→SIGKILL, đóng), với cài đặt mặc định chính là hành vi hôm nay (mỗi lệnh một miền) để mọi driver đạt chuẩn ngay; trên Linux driver `bwrap-pidns` dùng một init nhỏ làm pid 1 sống suốt thao tác (giống mẫu gate của run-supervisor). Chỉ các lệnh đọc/plumbing không hook (Inspect, LocalMutation) dùng chung miền; Remote giữ miền riêng; các lệnh có hook vẫn đi đường borrowed của holder-lock, không đổi. Lợi ích ước tính: Land −0.4 s (≈1.43 → ≈1.0 s p95, vẫn ~4.5× so với đường cũ), ScopedCommit −40 ms. Hội đồng cần quyết 6 câu hỏi ở mục 11. Trạng thái: **hoãn** tới khi Git 07/08 và Event Store 09-11 đã land.

- **Status:** deferred, until Git phases 07/08 and Event Store phases 09-11 have landed, so the optimisation is decided with a view of the running system. Not scheduled. No code change.
- **Owner decision basis (2026-10-20):** "đồng ý về ý tưởng gom sandbox, cần thiết kế kỹ và đặc biệt hexagon vì biết đâu trong tương lai chúng ta có thể đổi sandbox"; then (10:35) "optimisation, do not plan for execution; preliminary design for a council".
- **Evidence:** [gate E3](gate-261020-0653-git-p06b-typed-perf-e3.md), [Land budget brief](brief-261020-0653-land-latency-budget-decision.md) (option C there is this document), [index.lock counsel](counsel-261020-0302-native-index-lock-ownership.md).
- **Scope of facts:** read on `origin/main` 688ca9524, 2026-10-20. Impact-analysis: not run (design only, no symbol edited).

## 1. Problem

| Fact | Source |
|---|---|
| Per-spawn cost (`git rev-parse HEAD`, 100 samples, interleaved): uncontained 3.1 ms, borrowed 3.7 ms, contained 10.8 ms | gate E3, "Per-spawn cost" |
| Land census: prepare 52 + publish 48 = 100 Git execs, of which 32 + 33 = 65 contained; ≈0.5 s (37%) of Land is containment | gate E3, "Census" |
| ScopedCommit: 30 execs, 8 contained (preflight) | gate E3 |
| Even with free containment Land stays ≈4.6× the old path; the Land ≤1.2× ratio is unreachable by this work alone | gate E3 verdict, brief option C |
| Every contained child gets a fresh bwrap user+pid+mount namespace: `create` → `spawn_in` → wait → `is_empty`/`kill_all` | `packages/git/rust/src/driver.rs:1050-1110` |

So the cost is the namespace setup paid per child (≈7 ms × 65), not the Git work. The target is to pay it once per typed operation while keeping every containment guarantee.

## 2. What exists (the port, its drivers, its callers)

**Port.** `ContainmentDriver` (`packages/process/rust/src/containment/mod.rs:187`): `name`, `create(attemptId)`, `spawn_in(domain, SpawnSpec)`, `is_empty(domain) -> Empty|NotEmpty|Unknown`, `kill_all(domain, grace_ms)` (SIGTERM, grace, SIGKILL, wait for empty), `guarantee() -> {driver, level, escapes}`. Selection: `select(&SelectEnv)` (`mod.rs:213`). Contract: `packages/process/contracts/containment.port.v1.json`. Spec: `docs/platform/process/spec.md` §10. L0: knows no attempt, lock, Git.

**Drivers.**

| Driver | Mechanism | Empty proof | Level | Code |
|---|---|---|---|---|
| `bwrap-pidns` | `bwrap --unshare-pid --as-pid-1 --dev-bind / / --proc /proc --info-fd N -- argv`; the command itself is pid 1 | `judge(gate tuple) == dead` (kernel tears down the ns before init is a zombie) | kernel | `containment/linux.rs:66-205` |
| `linux-pgroup` | setsid + subreaper + descendant scan | group empty, root dead, seen tree dead | best-effort | `linux.rs:227-310` |
| `windows-job` | named Job Object, KILL_ON_JOB_CLOSE, no breakaway | job + contender views | kernel | `containment/windows.rs:50-130` |
| `macos-tree` | own group + `proc_listchildpids` scan | group and tree empty | best-effort | `containment/macos.rs` |

**Callers (complete).** Production: Git driver `GitDriver.containment` (`driver.rs:190`, selected with `select(&Default::default())` at `driver.rs:264`, used only in the unborrowed branch of `invoke_context`, `driver.rs:1050-1110`); run supervisor (`packages/run-supervisor/rust/src/route.rs:108` and the supervise route; one domain per attempt, gate as pid 1). Tests: `packages/run-supervisor/rust/tests/support/mod.rs:194-214`, `tests/portable/mod.rs:207`, `packages/process/rust/tests/containment_*.rs`.

**Which Git children are contained today.** `invoke_context` (`driver.rs:846`) routes by `Policy` (`driver.rs:146`):

| Policy | Path | Hooks | Who uses it |
|---|---|---|---|
| `Inspect` | contained (bwrap per child) | off: trusted empty `core.hooksPath`, `core.fsmonitor=false`, `--no-optional-locks`, `--no-lazy-fetch`, `protocol.allow=never` (`driver.rs:860-925`) | ~62 call sites: config/format/topology reads, rev-parse, status, diff (`--no-ext-diff --no-textconv`), cat-file batch with stdin |
| `LocalMutation` | contained | off | fetch's `update-ref --no-deref` CAS without a loan (`remote.rs:472-490`) |
| `Remote` without loan | contained | off (also carried to server-side `upload-pack`/`receive-pack`) | fetch/ls-remote/push transport (`remote.rs:60-83`); spawns ssh / remote helpers |
| `Publication`, `Remote`/`HookContext` with loan | **borrowed** via `fgos_holder_lock::run_borrowed_io` (`driver.rs:1018-1045`, `holder-lock/rust/src/port.rs:975`) | `HookContext` runs repo hooks (commit, merge, checkout) | publication CAS, checkout/index mutations, hook-bearing commands |

Borrowed children never touch the containment port: holder-lock spawns them with `spawn_mapped` in their own process group (`flock.rs:214`), SIGTERM→grace→SIGKILL on failure (`port.rs:1055-1070`), then the drain/reach rule (`flock.rs:230-260`, `Reach::Since`) and release settle (`flock.rs:332`). **This design leaves that path untouched.**

**Prior art.** `git log -S ContainmentDriver`: c1e79c6ad (port + bwrap/pgroup), bdc5c4eef (Windows/macOS), 4c15ffc9c (run-supervisor plan). The run-supervisor gate is already a long-lived pid 1 inside bwrap that reaps every orphan with `waitpid(-1)` (`docs/platform/run-supervisor/spec.md` §"gate", line 116) — the same shape this design needs per operation. `git log -S setns` / `-S systemd-run`: only a design-r6 mention, no implementation. Holder-lock's `HelperExe` + `fgos internal holder-lock-helper <role>` (holder-lock spec §8.1) is the existing pattern for a helper process role owned by a low crate. The 2026-10-19 operation-preflight decision (Git spec line 309) already scopes facts to an operation-local handle (`RepoHandle.checkout_config`, `lib.rs:97`, set at `driver.rs:757`); the operation domain would live on the same handle. Missing today: any multi-child domain operation in the port.

## 3. Requirements and safety invariants that must survive

| # | Invariant | How it holds today | What the operation domain must do |
|---|---|---|---|
| I1 | Kill is clean, nothing left behind | per child: `kill_all(domain, 3000)` then `is_empty` else `containment-unproven` (`driver.rs:1097-1108`) | per child *and* per domain: cooperative SIGTERM → 3 s grace → SIGKILL of every member; close ends the domain the same way |
| I2 | No process of an earlier Git child survives into the next child | each child has a fresh namespace; leftovers die with its init | **quiescence gate**: after each child exits, every other member is terminated (I1) and the domain is proven to contain only its anchor before the next child is admitted; one child at a time (a concurrent request is refused) |
| I3 | Emptiness from real OS state, `Unknown` never empty | `judge(gate) == dead` | Linux: the anchor (pid 1 of the ns) reads its own namespace `/proc`; members = numeric entries ≠ 1; orphans reparent to pid 1, so setsid/double-fork escapees are visible and killable. Host fallback: `judge(anchor) == dead` |
| I4 | Hook-bearing commands and filters keep their own containment | hooks run only on the borrowed path | unchanged; shared domain never runs `HookContext`/`Publication`; clean/process filters reachable from Inspect (`status`) are swept by I2 |
| I5 | Holder-lock borrow / drain / reach / release settle unchanged; no `Reach::Everyone` per spawn | holder-lock spec §5, §8; `flock.rs:242` | domain children hold no lock description: the anchor is spawned with only its control socket (fd map), children only stdio; conformance asserts the fd tables; no host scan added |
| I6 | Lock custody and predecessor records unchanged | contained children are not declared in any predecessor record | unchanged; the operation domain is not a custody domain and is never declared |
| I7 | Parent-death containment | Direct mode: no `--die-with-parent`; a contained Git child outlives a dead host | anchor ends the domain cooperatively on control-socket EOF (not `PDEATHSIG`, which fires on the *creating thread's* exit and would kill domains of a live Node addon worker); **behaviour change**: children no longer outlive the host (see Q5) |
| I8 | index.lock / ref-lock attribution not weakened | contained path takes no `index.lock` (Inspect `--no-optional-locks`); `update-ref` takes `<ref>.lock`; SIGTERM lets Git remove its own locks (counsel TL;DR) | same SIGTERM-first rule per child; the child's host identity stays recoverable (`NSpid` in `/proc/<host-pid>/status`, children of the anchor via `/proc/<anchor>/task/*/children`) so the counsel's future freeze-and-read-fd mechanism (`SIGSTOP` reaches ns members from the parent ns) still works |
| I9 | Deadline / output-limit stop is the child's, not the domain's | per-child deadline → `kill_all` | per-child terminate request (I1) then quiescence (I2); a domain that cannot be proven quiescent is closed and the operation fails `containment-unproven` exactly as today |
| I10 | Same error vocabulary | `containment-unproven`, `git-timeout`, `git-output-limit` | no new caller-visible Git refusal; port gains at most `domain-busy`, `domain-closed` |
| I11 | Exact environment, cwd, stdio per child; nothing inherited | `SpawnSpec.env/cwd/stdio` | per-child spec carried over the control channel; stdio passed as fds (SCM_RIGHTS) |

**Threat model.** Children are the trusted Git binary plus repository-configured filters (validated config, `driver.rs:731`). The design protects against accidental leftovers and hung children, not a deliberate same-uid adversary; each driver states its escapes (e.g. cgroupfs write, daemon on request). The anchor installs no handler for catchable signals except what it needs, so members cannot signal pid 1 (kernel ignores in-ns signals to init without a handler; SIGKILL/SIGSTOP from inside are ignored); Yama ptrace scope keeps descendants from tracing it.

## 4. Which Git children share a domain

| Class | Shares the operation domain? | Why |
|---|---|---|
| `Inspect` (reads, plumbing, config, cat-file batch) | **yes** | ~all of the 65; hooks off; short; filters possible but swept by I2 |
| `LocalMutation` (fetch `update-ref` CAS) | **yes** | hooks off (empty `core.hooksPath` also silences `reference-transaction`); SIGTERM-first keeps `<ref>.lock` cleanup |
| `Remote` without loan | **no, own per-child domain** | long (120 s), network, ssh `ControlPersist`/remote helpers; 1-2 per Sync, so sharing gains nothing and widens blast radius |
| `Publication`, `HookContext`, `Remote` with loan | **no, borrowed path unchanged** | runs hooks / holds the lock description; governed by holder-lock §5/§8, Q2 of the Git spec custody rules |
| Floor probes (`probe_floor`, ~14, cached) | optional | one-off, cached per key (`driver.rs:1138`); may use one domain, low value |

The choice is per command in Git (`Policy`), never in Process or holder-lock.

## 5. Layering (strict bottom-up, one door)

- **Process (L0)** owns the operation-domain capability on the existing port, the anchor helper role and the conformance vectors. Knows no Git, no lock, no Policy. Domain naming stays "an id".
- **Holder-lock (L1)** unchanged. Knows no Git, no operation domain.
- **Git** owns the decision: `invoke_context` sends `Inspect`/`LocalMutation` children to the operation domain on the operation-local handle (same lifetime as `checkout_config`), `Remote`-without-loan to a per-child domain, loans to holder-lock. Domain dropped (cooperatively closed) when the port call ends; next call opens fresh.
- **One door:** no second spawn path. `invoke_context` keeps one branch for unborrowed spawns; it only asks the port for "the operation's domain" instead of "a new domain". The anchor role is passed in as `HelperExe`-style executable from the host, like holder-lock.

## 6. Port shape options (hexagonal, swappable)

| Option | Shape | Pros | Cons |
|---|---|---|---|
| **P1. Default-method extension of `ContainmentDriver`** (recommended) | `open_operation(id) -> OperationDomain`; `run(&mut od, ChildSpec) -> ChildHandle` (wait/try_wait/terminate(grace)); `quiesce(&mut od, grace) -> DomainState`; `close(od, grace) -> KillOutcome`. Default impl = today's per-child `create`+`spawn_in`+`kill_all` (degenerate domain) | every driver conforms on day one; one port, one selection; driver opts into a cheaper impl; RUL104/L10-friendly | trait grows by 4 methods |
| P2. Separate `OperationContainment` trait | new port | clean separation | second port for the same concept: violates one door / L10 |
| P3. Allow repeated `spawn_in` on the existing domain + `is_empty` meaning "only anchor left" | no new methods | smallest surface | overloads `is_empty` semantics used by the predecessor rule and run supervisor; silent contract change; rejected |

**What a new sandbox driver must implement (P1):** `name`, `create`, `spawn_in`, `is_empty`, `kill_all`, `guarantee` (unchanged), and optionally the four operation methods; `guarantee()` gains `operationDomain: native | per-child` so doctor reports which one runs.

**Conformance suite (every driver, cargo vectors like the judge table):**
1. N sequential children: exit codes, stdout/stderr bytes, stdin input, env exactness, cwd.
2. Child leaves `sleep` in background → gone before the next child starts (pidfile + `judge`), result unaffected.
3. `setsid` + double-fork escapee → killed (kernel drivers) or reported per named escape (best-effort).
4. SIGTERM-handling child removes its `*.lock` inside grace; SIGTERM-ignoring child killed after grace; outcome names `terminated` / `killed-after-grace`.
5. Deadline and output-limit path through `terminate`.
6. Host killed with SIGKILL mid-child → domain empty within bound (fresh observer).
7. Anchor killed externally → next `run` refuses `domain-closed`, never runs outside containment; `quiesce` answers by `judge(anchor)`.
8. fd-leak: anchor fd table = stdio + control; child = stdio only; a held lock description is not visible inside (extends `tests/spawn_fds_leak.rs`).
9. Concurrent `run` on a busy domain → `domain-busy`.
10. `Unknown` never reported as `Empty`; `close` idempotent.
11. Bench row: open cost, per-child cost, close cost (feeds E3).

## 7. Driver options per OS (Linux first)

| # | Linux option | Feasibility | Cost estimate | Guarantee | Notes |
|---|---|---|---|---|---|
| L-A | **bwrap + long-lived anchor as pid 1** (recommended). `bwrap --unshare-pid --as-pid-1 --dev-bind / / --proc /proc -- <host> internal process-domain-anchor --control 3`; children spawned by the anchor (`posix_spawn`, own process group) on request over a unix socket; stdio via SCM_RIGHTS | high: bwrap already probed/used; gate precedent; no new privilege | open ≈10.8 ms once; per child ≈ fork/exec + socket RTT + ns `/proc` read, expected ≈3.5-4.5 ms (**to measure**) | kernel (unchanged) | needs a helper role (new route, contract); anchor must reap `waitpid(-1)`, sweep with `kill(-1, SIGTERM/SIGKILL)` (signals every ns member except init) |
| L-B | `setns` into a kept pid/user namespace via pidfd | low: `setns(CLONE_NEWUSER)` refused for multithreaded callers (host is); needs fork-without-exec, defeats the `posix_spawn` fast path (`mapped.rs:1-14`); AppArmor | low per child if it worked | kernel | rejected |
| L-C | cgroup v2 domain (`cgroup.kill`, `cgroup.events populated`), children via `posix_spawnattr_setcgroup_np` (glibc ≥ 2.39; host 2.43) | medium/low: needs a delegated writable subtree; this host runs in `session-215.scope` (not delegated) → `systemd-run --user --scope -p Delegate=yes` or a user service; containers/CI/WSL often lack | per child ≈0.2-0.5 ms (mkdir/spawn/rmdir) — could even make **per-child** domains cheap and remove I2 entirely | kernel against accidents; same-uid cgroupfs write escapes unless cgroupns + `nsdelegate` | best long-term candidate as a new driver `linux-cgroup` behind the same port; availability-dependent |
| L-D | Cheaper per-child namespace: native `clone3(CLONE_NEWUSER\|CLONE_NEWPID)` + tiny pid-1 shim, no bwrap | low on this host: `kernel.apparmor_restrict_unprivileged_userns=1` (Ubuntu 26.04) gives an unconfined binary no caps in a new userns; needs an AppArmor profile installed by setup (root) | per child maybe 1-2 ms over plain spawn (**unmeasured**) | kernel | keeps per-child isolation (no I2); distribution cost |
| L-E | Tune bwrap flags per child | unknown: bwrap always makes a mount ns + pivot_root; first measure where the 7.7 ms go (`strace -c`, `perf`) | unknown | kernel | cheapest experiment; may shrink L-A's opening cost too |
| L-F | Host subreaper + process group (`linux-pgroup` style) | high | ≈uncontained | best-effort (setsid escape) | downgrade from kernel; rejected |

**Windows (`windows-job`):** native operation domain is natural — one job per operation, `AssignProcessToJobObject` per child, quiescence = job view empty (`ActiveProcesses == 0` plus member scan, holder-lock §8.1 rules). Gain small (job creation is cheap); Git's borrowed path is unix-only today (`port.rs:960-971`). Default per-child impl is acceptable.
**macOS (`macos-tree`):** no expensive setup per child; default per-child impl; best-effort level unchanged.
**`linux-pgroup` fallback:** default per-child impl.

## 8. Driver selection and setup/doctor

Today Git hardcodes `select(&Default::default())` (`driver.rs:264`); the run supervisor reads `envelope.containment.preferred`. Proposal: the same `select` door returns the driver; the operation capability is a property of the driver (`guarantee().operationDomain`), not a separate selector. If a config key is wanted (e.g. `process.containment.operationDomain: auto | per-child`), it registers in `fgos setup` config-merge and the existing doctor check `process-containment` (`src/setup/registrations.mjs:2330`) reports `driver`, `level`, `operationDomain`. A new helper route registers its contract under `packages/process/contracts/`. CHANGELOG `[Unreleased]` only if doctor output changes. Whether to add the key at all is Q4.

## 9. Expected gain and measurement

| Row | Today p95 | Estimate with L-A (per child ≈4 ms, open ≈11 ms, 2 opens for Land) | Note |
|---|---|---|---|
| Land prepare+publish | 1433-1462 ms | ≈1.0 s (−0.42 s); ratio ≈4.5× | still fails ≤1.2×; budget decision is the brief's option A |
| ScopedCommit | 383-395 ms | ≈345 ms (−8×6.8 + 11 ≈ −44 ms); ratio ≈1.2 | already passes ≤1.5 |
| Sync | not in E3 | census first | add a Sync row |

Method: the existing E3 harness, interleaved main/branch ×2, same host class, idle, `powersave`; add (a) census per operation: domains opened vs contained children vs borrowed; (b) micro rows: per-child in-domain vs per-child bwrap vs uncontained vs borrowed; (c) open/close cost; (d) `rollbackWithLiveProcesses` and kill-point suites unchanged (0 lost). Acceptance for a future implementation: conformance suite green on Linux (bwrap and pgroup), Windows and macOS CI; Land contained-spawn share of wall time ≤10%; no E3 safety row regresses; `npm test` and `cargo test --workspace` green; bwrap `borrow_deadline` ignored test still passes.

### Input from HARDEN T0 (2026-10-21)

The HARDEN T0 council (plans/reports/council-261021-1507-harden-t0-arbitration.md §4, item D3) measured the per-process containment cost outside typed operations: every CLI process pays about 2 ms for the bwrap probe (`containment::select`, called from `GitDriver::new`), then about 1.4 ms extra per git child in a pid namespace (1.98 ms against 0.56 ms bare), with 5-6 git calls per CLI call, so about 10 ms of a ~250 ms CLI call. T0 adds no probe cache (every caller spawns right after `select`; an unprobed driver breaks hosts without user namespaces). Whether read-only git children need a pid namespace at all is a question for this design (§4 shared set, Q2), not changed before the council.

E3 of 2026-10-21 (performance governor, plans/reports/verification-261021-1323-git-e3-performance-governor.md): Land p95 0.54 s (budget 1.6 s, met); ScopedCommit p95 207 ms against legacy 77 ms (2.69 ×, budget 1.5 ×, missed; per-step breakdown in progress).

## 10. Risks

| Risk | L×I | Mitigation |
|---|---|---|
| Cross-child leakage from a wrong quiescence proof | M×H | ns-`/proc` proof by pid 1 + host `judge(anchor)` fallback; conformance 2/3/6/7 |
| Anchor bug/hang blocks an operation | M×M | host bound on every request; on timeout `kill_all` the anchor tuple (kernel kills the ns) → `containment-unproven`, same as today |
| Uninterruptible (D-state) member | L×M | sweep bound → `containment-unproven`, operation recovery-required (today's rule) |
| fd leak via SCM_RIGHTS/control socket | L×H | close-on-exec everywhere, fd-table conformance 8 |
| Behaviour change on host death (children die) | M×L | intended for reads; `update-ref` gets SIGTERM first; Q5 |
| Gain smaller than estimated (anchor protocol slow) | M×M | measure L-E and an L-A spike before committing |
| AppArmor/bwrap packaging changes | L×M | probe stays in `select`; fallback is per-child (today) |
| Scope creep into holder-lock/borrowed path | M×M | explicit non-goal; Q2 |

Rollback: driver falls back to the default per-child impl (today's behaviour); no persisted state, no record format change, so revert is a code revert.

Rough size (not an estimate): Process port extension + Linux anchor + conformance vectors is the bulk (medium); Git change is small (one branch in `invoke_context`, domain on the operation handle); Windows native job reuse small; docs: process spec §10, containment contract, Git spec §5.

## 11. Questions for the council

**Q1 — Linux mechanism.** What: which Linux driver implements the operation domain. Cause: per-child bwrap costs ≈7 ms setup × 65. Options: (a) L-A bwrap + pid-1 anchor — kernel level kept, no new privilege, ≈−0.42 s Land, adds a helper role and a control protocol; (b) L-C cgroup v2 driver — cheapest per child, could keep per-child domains, but needs delegation (absent on this host's session scope) and states a cgroupfs escape; (c) L-D native userns+pidns per child — keeps per-child isolation, needs an AppArmor profile installed with root; (d) measure L-E first and decide after. Recommendation: (d) then (a), with (b) recorded as a later additional driver behind the same port. Scope: Linux driver choice only.

**Q2 — Shared set.** What: which children share. Cause: sharing needs the I2 quiescence gate; borrowed/hook paths have their own holder-lock rules. Options: (a) `Inspect` + `LocalMutation` only; (b) also `Remote`-without-loan — no measurable gain, longer-lived transport children; (c) also move borrowed children into the domain — touches holder-lock §5/§8, large. Recommendation: (a). Scope: Git `Policy` routing.

**Q3 — Port shape.** What: extend `ContainmentDriver` with default methods (P1) or a new trait (P2). Cause: owner wants the sandbox swappable; L10 wants one door. Options: P1 (4 methods, default = today); P2 (second port); P3 (overload `is_empty`, rejected). Recommendation: P1. Scope: process port contract v2.

**Q4 — Configuration.** What: add a config key to force per-child mode, or auto only. Cause: install/setup/doctor gate requires registration of any key; RUL104 prefers no new knob. Options: (a) auto only, doctor reports the mode — no key, rollback by release; (b) `process.containment.operationDomain` key registered in setup/doctor — field kill switch, more surface. Recommendation: (a). Scope: setup/doctor registry.

**Q5 — Host death.** What: should contained Git children die when the host dies. Cause: today Direct mode lets a contained child outlive the host; an operation anchor must end on control EOF or it leaks forever. Options: (a) anchor terminates cooperatively on EOF (SIGTERM → grace → SIGKILL) — no leak, reads and `update-ref` CAS may be cut (recovery already covers CAS); (b) anchor waits for the running child, then exits — preserves today's child semantics, longer orphan window. Recommendation: (a). Scope: process anchor contract.

**Q6 — Timing and target.** What: when to take this up and against which budget. Cause: Land still misses ≤1.2× even with free containment; the owner deferred it until Git 07/08 and Event Store 09-11 land. Options: (a) revisit after those land, with fresh E3 including Sync, decide against an absolute Land budget (brief option A); (b) drop if the new running system shows Land latency is not on any user path. Recommendation: (a), re-measure first. Scope: scheduling of this design only.

## Unresolved

- Per-child cost inside an anchored domain and the bwrap cost breakdown are unmeasured (L-A/L-E spike needed).
- Sync contained-spawn census is not in E3.
- Whether the Git port ever runs two operations concurrently on one `RepoHandle` (affects `domain-busy` semantics) — needs a trace once Git 07/08 land.
