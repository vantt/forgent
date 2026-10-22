# OPC council arbitration: operation-scoped containment

**Tóm tắt cho owner.**
- **Số đo thật nhỏ hơn bản sơ bộ khoảng hai lần.** Hôm nay mọi lệnh git chạy trong bwrap của Land, ScopedCommit và push đều là lệnh đọc (`Inspect`). Tổng chi phí containment của Land khoảng 0,20 s trong khoảng 0,5 s, không phải 0,5 s. Land và ScopedCommit đều đã đạt ngân sách E3.
- **Hội đồng đề xuất làm ngay Phase A.** Không thêm cơ chế mới; Phase A sửa trong hình dạng hiện có:
  - bỏ vòng poll 2 ms, chỉ riêng việc này đã lấy lại khoảng 40% chi phí;
  - sửa một lỗi treo có thật sau `kill_all`;
  - đặt tên lỗi `containment-mount-refused` cho R3;
  - vá lỗ E4 trên `linux-pgroup`;
  - gom bộ test containment thành một bộ conformance chung cho mọi driver.
- **Phase B là domain theo thao tác.** Dùng một anchor pid-1 trong bwrap, đặt sau port mở rộng kiểu hexagon. Thiết kế đã đủ để thi công. So với Phase A, B chỉ thêm khoảng −0,11 s mỗi Land và −14 ms mỗi ScopedCommit, nhưng đổi lại phải thêm một helper role và một giao thức. Lead đề xuất ghi B thành thiết kế sẵn sàng và hoãn tới khi có điều kiện kích hoạt bằng số đo.
- **Phương án bỏ pid namespace cho lệnh đọc bị bác.** Ghế correctness đã chứng minh `status` của repo cha chạy được filter của submodule.
- Có bốn câu hỏi cho owner ở §8.

- Lead: session `forgent-35`, 2026-10-22 (Asia/Saigon). Base `origin/main` `d6afdc7e6`, worktree `forgent-worktrees/opc-design`.
- Seat reports: [correctness](council-261022-1251-opc-seat-correctness.md) (opus), [speed](council-261022-1251-opc-seat-speed.md), [simplicity](council-261022-1251-opc-seat-simplicity.md), [red-team](council-261022-1251-opc-seat-redteam.md), [ship-maintain](council-261022-1251-opc-seat-ship-maintain.md) (sonnet). [Brief](council-261022-1251-opc-council-brief.md). Preliminary design: [design-261020-1035](design-261020-1035-operation-scoped-containment.md).
- Impact analysis: not run (design only, no symbol edited). The implementation plan runs it per symbol.

## 1. What the council established (facts, with owner)

| # | Fact | Source |
|---|---|---|
| E1 | Every bwrap child of typed Land (54 of 86 git execs), ScopedCommit (8 of 29), push (2) is an `Inspect` read with `--no-optional-locks`. Mutating children already run outside bwrap: borrowed (holder-lock) or host. The design's 65 for Land was stale. | speed F-S1, strace census on `d6afdc7e6` |
| E2 | Per contained child: bwrap +2.3 ms over plain (range 1.8–3.7), plus the 2 ms `try_wait` poll at `driver.rs:1207-1219`, +1.4 ms. A `setsid`/pgroup spawn is free (Δ ≤ 0.05 ms). `--unshare-user` adds nothing. Flag tuning saves at most 0.4–1.0 ms (`--ro-bind`). | speed §3 (3 interleaved batches, n=300–500, load1 1.4–2.4) |
| E3 | An anchor spike as pid 1 in bwrap costs 1.6–2.9 ms to open and 0.2–0.6 ms to close, and +0.13 ms per child. Break-even is 2 children. The spike hung once on an inherited socket peer, the descriptor-lifetime hazard red-team F4 predicted. | speed §3–4, `.fgos/runtime/tmp/opc-speed/anchor.c` (throwaway, not committed) |
| E4 | Land's total contained overhead ≈ 54 × 3.7 ≈ 0.20 s of a ≈ 0.5 s Land. E3 today: Land p95 0.51 s (budget 1.6 s), ScopedCommit p95 185 ms (absolute 250 ms); both pass. The design's "−0.42 s" is not reachable. | speed §6; `verification-261022-0005-git-e3-clean-rerun.md` |
| E5 | `Inspect` still reaches user code. Preflight refuses repository filters, textconv, merge drivers and gpg in the effective config (`driver.rs:788-797`, `:1721-1739`), but a superproject `status` runs a **submodule's** clean filter (verified on Git 2.53). Config writes can also race the stamp check. | correctness F3 |
| E6 | Today's contained branch can hang without bound: after a deadline or output limit, a refused `kill_all` is ignored and `child.wait()` waits on the bwrap monitor (`driver.rs:1216-1217`). A D-state member blocks namespace teardown forever. | correctness F4 |
| E7 | On `linux-pgroup` (confined agent sessions, hosts without userns), contained children have no escapee watch. The environment marker is planted only on the borrowed path (`holder-lock/rust/src/port.rs:1111`). A `setsid` escapee of a submodule filter survives a read that reports success, while Git spec §15 E4 claims a drain "through the driver of each platform". | correctness F2 |
| E8 | The probe caches `false` per process when a host mount is unremountable (R3), and `select` then picks `linux-pgroup` silently for the process's life. A process that probed before the mount appeared fails every spawn. | red-team F5, `containment/linux.rs:27-63` |
| E9 | Per-child bwrap drops a host SIGTERM to a handler-less git (git is pid 1), so a timed-out read always waits the full 3 s grace before SIGKILL. bwrap encodes a signalled child as 128+n (137); `linux-pgroup` reports no code. | correctness F5, F6 (verified) |
| E10 | Two `bwrap … git cat-file --batch` trees, 15 h and 17 h old with PPID 1, are alive on this host, with cwd `/tmp/es-sync-*` (Event Store sync test fixtures, likely interrupted runs; HARDEN, 10-22). Long-lived read children outlive their host in Direct mode. | speed F-S6; HARDEN message |
| E11 | R2 (≈ 0.5 s per worktree add) is not explained by per-child cost here: the ledger's ≈ 22 bwrap per add × 3.7 ms ≈ 80 ms. Mount-count scaling (25 remounts for 53 mounts here) is one candidate; the end-to-end run was not done. | speed F-S5, §5 |

## 2. Decisions on the council's questions

| Q | Decision | Why |
|---|---|---|
| Q1 Linux mechanism | **L-A (bwrap + long-lived pid-1 anchor)** is the native operation domain if B is built. L-C `linux-cgroup` is recorded as a later driver behind the same port, where delegation exists. L-D (clone3 shim) rejected: needs a root-installed AppArmor profile. L-E (flag tuning) rejected: below noise against the floor. | E2, E3; correctness F1; red-team Q1 |
| Q2 Shared set | `Inspect` only. `LocalMutation` (fetch `update-ref`) stays per-child: anchor loss SIGKILLs without SIGTERM and can leave `<ref>.lock` (correctness Q2), and it is 1–2 children. Remote and borrowed paths unchanged. | E1; correctness Q2 |
| Q3 Port shape | One defaulted method on the existing `ContainmentDriver`: `open_operation(id) -> Option<Box<dyn OperationDomain>>`, plus the one door `containment::operation(driver, id)`, which returns the native domain or the `PerChild` default. `OperationDomain { spawn, settle, close }`, `ChildProcess { wait }` (simplicity §3.1), with the correctness amendments in §4. No second port, no selector. | simplicity §3; correctness Q3; L10 |
| Q4 Config key | None. Doctor `process-containment` reports `operationDomain: native \| per-child`. | all seats |
| Q5 Host death | The anchor ends on control-socket EOF: SIGTERM to members, grace, SIGKILL sweep, then exit. No PDEATHSIG, which would track bwrap's monitor, not the host. This is a behaviour change: contained reads no longer outlive a dead host, which also fixes E10 for reads in an operation domain. | correctness Q5, F10 |
| Q6 Timing / target | Phase A now. Phase B deferred with the trigger in §5. There is no failing budget to aim at today (E4). | E4; red-team F1; ship-maintain |
| Q7 R3 | **Named error, no silent per-operation fallback.** `containment-mount-refused` is a cause under the existing port error `namespace-unavailable` ("namespace-unavailable: containment-mount-refused: <bwrap stderr line>"); HARDEN T1 phase 4 supplies the stderr line and uses this name (agreed 10-22). It surfaces as the Git refusal cause and in doctor. The probe also records **why** it chose `linux-pgroup`, so the silent downgrade of E8 becomes a doctor line. A per-operation fallback is rejected: it would silently turn kernel into best-effort. | E8; correctness Q7; red-team Q7; HARDEN T1 |
| Q8 Do reads need a pid namespace? | **Yes, keep a domain for `Inspect`.** Option (iii), "Inspect under pgroup", is rejected as a guarantee downgrade bought for ≈ 10 ms per Land more than B: E5 shows reads do run user code. Red-team's own reversal condition ("evidence that Inspect can reach user code") is met. | E5; red-team §5 |
| Q9 Operation boundary | One Git **port call**. The typed entry creates an operation slot (`Arc`) that every `RepoHandle` resolved inside that call shares; `Worktree::add` resolves a second handle (simplicity §3.4), so the slot cannot live on `RepoHandle`. A busy slot (another thread) makes Git open a throwaway per-child domain instead of failing, so today's parallel reads never see `domain-busy` (red-team F3). Calls with no typed entry stay per-child. R5 (seat launch) is mostly Node children, not fixed here. H6 is not fixed: every typed operation spawns ≥ 2 contained children. | simplicity §3.4; red-team F3; speed Q9 |
| Q10 Cheap wins | Phase A (§3). | E2, E6, E7, E8 |

## 3. Phase A: better, not bigger (no new mechanism)

Each item corrects existing behaviour inside today's shape (RUL104). The owner still approves A, because the mandate says no code before approval.

| # | Change | Gain / defect fixed | Owning proof | Size (est.) |
|---|---|---|---|---|
| A1 | Replace the 2 ms `try_wait` sleep in the contained branch with a blocking exit wake (waiter thread or pidfd, as holder-lock's borrowed path already does, `port.rs:1023`) | −1.4 ms per contained child: Land ≈ −76 ms, ScopedCommit ≈ −11 ms, worktree add ≈ −31 ms | the existing driver timeout and output-limit tests still stop the child | ~40 src |
| A2 | Bound the wait after `kill_all`: if it is not `Ok`, hand the monitor to a reaper thread and return `containment-unproven` | E6: a possible hang forever, against I9 | one driver test: a member stopped with SIGSTOP makes the call return `containment-unproven` within its bound | ~20 src, ~40 test |
| A3 | `containment-mount-refused` as the cause under `namespace-unavailable` (T1 phase 4 lands the stderr capture); the probe keeps its reason; doctor `process-containment` prints the driver plus the reason it was chosen | R3/E8: a named failure instead of "user namespaces unavailable?" and a visible downgrade | T1's red test `containment_bwrap.rs` ("a refused mount is named"), plus one doctor row assertion | ~40 src; CHANGELOG line (doctor output changes) |
| A4 | Environment-marker watch on contained children on `linux-pgroup` when user code may run, reusing `environment_marked` (no new mechanism) | E7: makes the Git §15 E4 claim true on best-effort hosts | extends the existing `setsid` escapee test in `test/git/scoped-commit.test.mjs` to a contained read on `linux-pgroup` | ~60 src |
| A5 | One conformance suite: one test body per behaviour, instantiated per driver (`bwrap-pidns`, `linux-pgroup`, `macos-tree`, `windows-job`), consolidating `containment_bwrap.rs`, `containment_pgroup.rs`, `containment_macos.rs` and `spawn_fds_leak.rs`. It states E9's quirks as properties of each driver: dropped SIGTERM to a pid-1 child, and the exit encoding. | Owner mandate: one suite every driver passes. It is the base B extends. | the suite itself; retired copies named in the plan; TEST reviews | net test lines ≤ 0 |

A1 and A2 move the contained branch in `packages/git/rust/src/driver.rs` and need a Git-area review (§8 Q4). A5 needs TEST's review (design principle 8). A3 coordinates with HARDEN T1 phase 4, which lands the `linux.rs` part.

## 4. Phase B: native operation domain (designed, deferred)

**Port** (Process, L0; knows no Git, lock or Policy). Simplicity §3.1 signatures, amended as follows:

- `settle` returns its own type, `Quiescent | Busy | Unknown`, and never reuses `DomainState`. `is_empty` keeps meaning "the domain ended", which the predecessor rule and the run supervisor rely on (correctness Q3).
- `ChildProcess::wait` returns `Exited{code} | Signalled{sig} | DomainLost`, one encoding for every implementation (E9). `DomainLost` maps to `containment-unproven` in Git, never to success (correctness F-rule 7).
- New port errors: `domain-busy`, `domain-closed`. Contract `containment.port.v2.json` replaces v1 in the same change, and every reference moves (L10).
- `guarantee().operationDomain` is derived from whether `open_operation` returns `Some`.

**Linux native (`bwrap-pidns`) anchor rules** (correctness §3, red-team F4/F6/F8/F9):

1. Spawned through today's `spawn_in` with `fd_map = [control]`. Lazy: opened at the operation's second contained child (break-even 2, E3). Passed in as a helper executable from the host, in holder-lock's `HelperExe` pattern. Without a host binary (Node-only channel), the operation runs `PerChild`, a speed downgrade only.
2. Installs no signal handlers and blocks no signals. Stays dumpable (holder-lock's release scan must read its fds). `chdir("/")`.
3. `recvmsg` with `MSG_CMSG_CLOEXEC`. It `fstat`s every received fd and refuses anything but a FIFO, a socket or `/dev/null`, so a lock description, which is a regular file, can never enter. It closes its copies before replying.
4. One child at a time, in its own process group with a default signal mask and dispositions. The child is controlled through a pidfd inside the anchor.
5. Quiescence: `kill(-1, SIGKILL)` sweeps, reap until `ECHILD`, then require `kill(-1, 0) == ESRCH`. A `/proc` listing is diagnostic only (correctness F1, verified).
6. On control EOF or an idle timeout: SIGTERM, grace, SIGKILL sweep, exit.
7. The host bounds every request. On a timeout or a lost anchor it SIGKILLs the anchor's tuple and reports `DomainLost`. A truncated frame or an unexpected fd count closes the domain and never resyncs.

**Git**: `Inspect` children of a typed port call go to the call's operation slot (§2 Q9). A child spec type that only the unborrowed branch can build keeps `Publication`/`HookContext`/loan calls out of the shared domain (red-team F10).

**Other drivers** keep `PerChild`. `windows-job` may later go native (one job per operation). `linux-cgroup` is the recorded later driver.

**Expected gain over A**: Land ≈ −114 ms (−190 ms total with A), ScopedCommit ≈ −14 ms, worktree add ≈ −45 ms (ledger count), push ≈ −1 ms. Reads in an operation domain no longer outlive a dead host (E10).

**Cost**: an anchor role and route with its contract (~400–600 src lines Rust), conformance vectors 12–16 of correctness §3 plus red-team's fd-lifetime and exit-vs-terminate vectors (~300 test lines), the Git slot (~100), and doctor and spec updates.

**Trigger to build B** (any one): after A, a measured operation users wait on spends ≥ 15% of its wall time in contained children; R2 re-measured end to end shows worktree add still ≥ 100 ms of containment; or the owner wants it now for the kernel-level reaping of leaked readers (E10).

## 5. Deletion list (L10)

| Phase | Deleted | Replaced by |
|---|---|---|
| A1 | the 2 ms `try_wait`/`sleep` loop, `driver.rs:1205-1220` | blocking exit wake |
| A2 | the unbounded `child.wait()` after `kill_all`, `driver.rs:1216-1217` | bounded reap and `containment-unproven` |
| A5 | the per-driver duplicate cases in `containment_{bwrap,pgroup,macos}.rs`, `spawn_fds_leak.rs` | one conformance body per behaviour |
| B | Git's `create`/`spawn_in`/`is_empty`/`kill_all` ladder in the contained branch (`driver.rs:1166-1245`); `containment.port.v1.json` | `containment::operation` + `settle`; v2 contract |
| never | `create`/`spawn_in`/`kill_all`/`is_empty` in Process | stay as `PerChild` and as the run supervisor's door |

## 6. Proofs

- **Conformance** (A5, extended by B): one body per behaviour, run per driver on the Linux CI job and on the existing `process-containment` matrix (`.github/workflows/process-containment.yml`, today triggered only on run-supervisor paths, so the trigger must include `packages/process/**`).
- **E1** rerun (Publication + ScopedCommit) and **E4** escapee tests (`test/git/scoped-commit.test.mjs`) on `bwrap-pidns`, plus a `linux-pgroup` run for A4.
- **E3** rows: ScopedCommit, Land, push, plus new census rows (contained vs borrowed vs host per operation) and a worktree-add row (R2). Interleaved against main, with a paired fsync probe.
- `npm test` and `cargo test --workspace` green.

## 7. Coordination and hand-offs

- **HARDEN T1 phase 4**: uses the name `containment-mount-refused` as a cause under `namespace-unavailable` (sent 10-22 14:2x).
- **HARDEN T2 (R2)**: per-child numbers here do not explain ≈ 0.5 s per worktree add; T2 re-measures it end to end (sent).
- **TEST**: reviews the A5 conformance plan before it is final (promised).
- **GIT**: separate items, not OPC:
  - E10, long-lived `cat-file --batch` readers outliving their host;
  - the submodule-aware user-code predicate (correctness F3/F12): `check_config` and `user_code_may_run` see only the superproject's config, and the borrowed `merge` path has the same gap.
  - Recorded on the GIT row for the next Git owner.

## 8. Questions for the owner

**Owner answers, 2026-10-22 13:30–13:40:** Q1 (a) Phase A1–A5; Q2 (a) defer B with the §4 trigger; Q3 (a) reads keep kernel containment (after the trade-off of (b) and the hybrid "pgroup only without submodules" was explained; hybrid noted as the better next step than B if more speed is wanted after A); Q4 (c) HARDEN T2 (`forgent-a8`) reviews OPC's Git-area diffs.

**Q1. Phase A: approve?**
- **Chuyện gì:** five corrections in today's shape: the poll, a hang, R3 naming, the E4 gap on pgroup, and one conformance suite.
- **Nguyên nhân:** measured (E2) and verified defects (E6, E7, E8).
- **Lựa chọn:**
  - (a) approve A1–A5. About 200 src lines, test lines net ≤ 0, CHANGELOG plus doctor line. Land −76 ms, two defects fixed.
  - (b) approve only A1–A3. A4 and A5 go to the Git and TEST backlogs.
  - (c) none.
- **Khuyến nghị:** (a). A4 makes an existing spec claim true, and A5 is the suite the mandate asks for.
- **Phạm vi:** a yes authorizes an implementation plan for A and, after that plan is approved, code in `packages/process/rust/src/containment/`, the contained branch of `packages/git/rust/src/driver.rs`, doctor `process-containment`, and tests. It does not authorize B.

**Q2. Phase B: when?**
- **Chuyện gì:** the native operation domain is designed (§4) but buys only ≈ −0.11 s per Land beyond A.
- **Nguyên nhân:** E1 and E4. Every budget already passes.
- **Lựa chọn:**
  - (a) defer, with the §4 trigger recorded on the board. Zero cost now; the design stays ready.
  - (b) build B right after A. About 800–1000 lines src+test. Land ≈ 0.32 s, reads die with their host, and the swappable port gets its first native implementation.
  - (c) drop B.
- **Khuyến nghị:** (a). It is the smallest change that does not grow the platform for a gain no user is waiting on (RUL104, AGENTS.md priority 1: a project using fgOS does not feel 0.1 s on Land).
- **Phạm vi:** (a) authorizes only recording the trigger. (b) authorizes planning B.

**Q3. Reads keep kernel containment (no pgroup for `Inspect`)?**
- **Chuyện gì:** option (iii) would save about 10 ms more per Land than B, by running reads in a process group.
- **Nguyên nhân:** E5. Reads can run a submodule's filter.
- **Lựa chọn:**
  - (a) keep reads in a pid namespace: today's guarantee.
  - (b) reads under pgroup plus the A4 watch: a downgrade to best-effort, and R3 stops affecting reads.
- **Khuyến nghị:** (a). This is a product-intent question about the guarantee level, so the owner decides.
- **Phạm vi:** a yes for (a) closes option (iii).

**Q4. Who reviews Git-area diffs?**
- **Chuyện gì:** A1, A2 and A4 edit `packages/git/rust/src/driver.rs`. The GIT/ES coordinator session closed at 13:00, and Git review is "waiting for a receiver".
- **Nguyên nhân:** the board's GIT row and the 10-22 13:00 log line.
- **Lựa chọn:**
  - (a) the owner names a Git reviewer session.
  - (b) OPC runs an independent code-review seat (a different model) and records it on the GIT row.
  - (c) HARDEN T2, which owns Git hardening next, reviews.
- **Khuyến nghị:** (c) if HARDEN agrees, else (b).
- **Phạm vi:** applies to OPC's diffs only.

## Unresolved

- R2 end-to-end cost (E11) and the `linux-pgroup` per-child `/proc` scan cost: not measured.
- The fork cost of `spawn_with_fds` inside a real Node process: only a lower bound was measured (speed F-S4).
- The `PR_SET_DUMPABLE` effect on holder-lock's scan is kernel reasoning, not a run (correctness F9). B keeps the anchor dumpable either way.
