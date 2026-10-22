# OPC council: red-team seat

Base: `git -C /home/vantt/projects/forgent-worktrees/opc-design rev-parse --short HEAD` = `7a6f366ed`. Read-only review; nothing timed, nothing mounted. Paths are relative to the worktree.

Bottom line: the preliminary design (P1 + L-A anchor, shared set Inspect + LocalMutation) should not be built as written. Its motive numbers are stale, the shared set it needs is contradicted by the repo's own config validation (Q8), and the anchor adds protocol failure modes that the cheaper options do not have. P1 is still the right port shape if an operation domain is ever built.

## 1. Position

| Q | Position | Evidence |
|---|---|---|
| Q1 | (d) measure, then do not build L-A. Cgroup: not on this host. clone3 shim: blocked. | cgroup: `session-215.scope` not delegated (design §7 L-C). clone3: `/proc/sys/kernel/apparmor_restrict_unprivileged_userns` reads `1` on this host (checked). |
| Q2 | Shared set should be empty. `Inspect` needs no pid namespace; `LocalMutation` is 1-2 children per fetch, so nothing to share. | F1 below. |
| Q3 | P1 (default-method extension) remains the correct shape if built, but it needs a concurrency rule (F3) that the design lacks. | design §6; F3. |
| Q4 | (a) no key. | RUL104. |
| Q5 | If an anchor exists: cooperative end on EOF plus an idle timeout, because a long-lived handle never drops its socket (F8). | `driver.rs:741`. |
| Q6 | Re-census first. The Land numbers in the design are from before the spawn work. | F1, F2. |
| Q7 | Named refusal `containment-mount-refused`, carrying bwrap's stderr line, surfaced as the Git refusal cause and in the doctor row. No automatic fallback to `linux-pgroup` for operations that need kernel containment. The existing probe already downgrades silently (F5). | `linux.rs:44-61`, T1 phase 4 (council brief). |
| Q8 | No. `Inspect` cannot reach configured user code: hooks off, fsmonitor off, and any `filter.*.clean/smudge/process`, `diff.*.textconv`, `diff.external`, `merge.*.driver` key in the effective config is refused at preflight. | `driver.rs:788-796` (`check_config`), `driver.rs:708`, `driver.rs:1721-1738` (`command_config`), test `driver.rs:2680-2707`. |
| Q9 | R2, R5 and H6 are fixed by Q8 plus Q10 without any domain, because their contained calls are overwhelmingly `Inspect`. R2: 218 bwrap per 10 adds; R5: ~15 confined git. | ledger rows R2/R5/H6; `debug-261021-1329` per-step table. |
| Q10 | Yes, do these regardless: the 2 ms poll loop, per-child threads, lazy probe (after Q8). | F9 / section 4. |

## 2. Findings (ranked)

### Critical

**F1. The motive is stale and the shared set is nullified by Q8.**
- Design §1 and §9 price Land at 1.43 s p95 with 65 contained children. Current E3: Land p95 0.51 s / 0.49 s against a 1.6 s budget, passing (`plans/reports/verification-261022-0005-git-e3-clean-rerun.md:31`). ScopedCommit p95 185.7 / 183.5 ms against an absolute 250 ms budget, passing (`:30`). No E3 row fails because of containment. The design's "Land −0.42 s" cannot come out of a 0.5 s Land that is already within budget; the census (65 contained) predates that run and is unverified.
- ScopedCommit in situ: 8 contained spawns cost 27 ms of 155 ms warm, 3.4 ms each; standalone `bwrap+git` is 2.1 ms vs 0.65 ms bare, and "the extra ~1.3 ms is the 2 ms `try_wait` sleep loop plus reader threads" (`plans/reports/debug-261021-1329-scoped-commit-e3-breakdown.md:51`). So the pid-namespace part is about 1.45 ms per child, not 7.7 ms. Best possible gain for ScopedCommit is about 8 x 1.45 = 12 ms, not the design's 44 ms (§9 row 2 uses 6.8 ms per child).
- The two older figures disagree with each other by 5x: 10.8 vs 3.1 ms (E3 gate, `gate-261020-0653...:22`, delta 7.7) and 1.98 vs 0.56 ms (T0 D3, design §9 line 141, delta 1.4). The in-situ 2.1 vs 0.65 matches T0. The design adopted the larger number.
- Q8: `check_config` runs on the effective config (all scopes, `driver.rs:788-796` called from `driver.rs:708` for `Policy::Inspect`). The only way Inspect could run user code is a filter or textconv, and those keys are refused. The design's §3 I4 line "filters reachable from Inspect (`status`) are swept by I2" describes a case the driver already refuses. `user_code_may_run` agrees: it never returns true for `Inspect` (`driver.rs:956`).
- Consequence: containment buys read-only children protection against a Git bug only. Spending an anchor, a control protocol and a new helper role on that is "bigger, not better" (RUL104).

### High

**F2. The gain claim rests on unmeasured assumptions.** What the speed seat must measure to refute it (all on a bwrap host, interleaved, same quiet window):
1. `git rev-parse HEAD` as: (a) `posix_spawn` bare via `spawn_mapped`, (b) `spawn_with_fds` fork path inside a large Node process, (c) per-child bwrap, (d) `linux-pgroup` driver including its `/proc` scans, (e) borrowed. This separates bwrap cost from the 2 ms poll loop and thread cost (`driver.rs:1219`, `:1197`, `:1676`). Design §9 assumes 4 ms inside an anchor without any of these.
2. bwrap setup decomposition (`strace -c` / `-T`): user ns, mount ns copy (cost grows with mount count; R3 shows sensitivity to mounts), `pivot_root`, `/proc` mount, dev-bind. And the same on a host with many mounts, since R2's 218 bwrap + 249 git in about 0.5 s per add implies about 20 ms per contained child under load, 10x the in-situ figure.
3. Anchor cost, with a throwaway anchor (any tiny static helper): per-child round trip (socket + SCM_RIGHTS + `posix_spawn` + reap + ns scan) and anchor open including `exec` of the host binary (`fgos`, large) rather than `/bin/true` (the probe at `linux.rs:49` uses `/bin/true`).
4. Break-even N: open + close cost against per-child savings; operations with 1-2 contained children (most fetch/ref/worktree-remove calls) must not regress E3.
5. Census per operation on current main: contained children vs plain vs borrowed, split by whether the call has a checkout-local handle (see F3). The design's 65 is from `gate-261020`.
6. `linux-pgroup` per-child cost: `is_empty` runs `remember_tree` / `pgroup_state` (host `/proc` scan, `linux.rs:263-268`), so on pgroup hosts the "default per-child impl" may be the expensive one.
7. Hosts: this machine selects `linux-pgroup` in confined sessions (apparmor sysctl = 1; spec §15 E4 note, `docs/platform/git/spec.md:741`). The anchor gain there is zero; only the gate machine uses bwrap.

**F3. Domain scoping contradicts how Git calls are made; concurrency regresses reads.**
- Design §2 and §5 hang the domain on the operation-local handle (`checkout_config`, set at `driver.rs:757` via `checkout_repository`, "local to one port call", `driver.rs:799`). Most Inspect calls do not have one: they run on the long-lived read handle (`driver.rs:741`, "a long-lived read handle can recover after a config repair") or with `repo = None` (`driver.rs:763`, `:1277`, `:1326`, `:1379`). 81 `Policy::Inspect` sites; `invoke_context` takes 9 parameters (`driver.rs:967`). Sharing for "~65 of 65" needs an operation parameter threaded through most of these; "Git change is small" (design §10) is wrong. Whatever has no operation handle falls back to per-child bwrap, so the real captured share is unknown (F2.5).
- `GitPort` methods take `&RepoHandle` (`lib.rs:336-342`); the config cache is a process-global mutex (`driver.rs:744`), which shows multi-thread use. Invariant I2 says one child at a time and a concurrent request gets `domain-busy` (design §3 I2, conformance 9). Today two threads run Inspect in parallel without error. `domain-busy` turns that into a hard failure; waiting turns it into serialization of parallel reads. Neither is in the design. A domain on a handle that two Node addon threads share also makes I2's "domain contains only its anchor before the next child" meaningless while another thread's child is running.
- A domain that went `domain-closed` (after `containment-unproven`, idle exit, anchor crash) poisons every later call on a long-lived handle unless the handle reopens; the design never says who reopens, or whether the retry is allowed to run unconfined (it must not).

**F4. Descriptor retention gives cross-child leakage or false `containment-unproven`.**
- The host creates three pipes per child (`driver.rs:1169-1171`), hands the child ends to the port, then reads with 1 s `recv_timeout` and answers `containment-unproven` if the reader does not finish (`driver.rs:1229-1236`). A reader finishes only when every write end is closed. In the anchor design, the anchor receives the write ends by SCM_RIGHTS. If the anchor keeps its copy past the child's exit, or if the received fds are not close-on-exec and a later child inherits them, then child N's stdout never reaches EOF while child N+1 lives. That is exactly "a leftover from child N affects child N+1" and it shows as a spurious `containment-unproven`. Same for the stdin pipe: the writer thread (`driver.rs:1197-1200`) blocks in `write_all` until the read end closes; an anchor holding the read end defeats the EPIPE that frees it.
- Needed: `MSG_CMSG_CLOEXEC` on receive, `dup2` onto 0/1/2 in the child, close the anchor's copy before replying, and a conformance vector for "child N's pipes reach EOF at child N's exit with the anchor still alive". Conformance 8 checks fd tables at a point in time; it does not cover this lifetime.
- A child that never reads stdin (any `Inspect` with `input`, e.g. cat-file batch) blocks its writer thread for the whole timeout; unchanged from today, but with a busy domain it also blocks the next child (F3).

**F5. R3: the anchor lengthens mount exposure, and the existing probe already downgrades silently.**
- Today: `pidns_usable` runs bwrap once per process and caches the answer, true or false (`linux.rs:45-61`). A process that starts while a host mount is unremountable caches `false`, selects `linux-pgroup` for its whole life, and nothing names it (`select` returns the driver with no reason, `mod.rs:213`). A process that starts before the mount appears caches `true` and then fails every spawn. T1 phase 4 only touches `spawn_in` / `end_failed_spawn` (council brief), so neither case is covered.
- Anchor: its mount namespace lives for the whole operation (and for a leaked anchor, forever; F8). Per-child namespaces hold mounts for milliseconds. Untested, and the exact reverse of R3: (a) a host `umount` during the operation, if propagation into the anchor's copy is not slave-propagating, returns EBUSY for the anchor's lifetime; (b) a host mount made during the operation (E1 snapshot mount, a tmpfs) may be absent inside the anchor, so a later child's `cwd` or paths differ from the host's view. Test both under `unshare --mount --propagation private`, never on the host.
- A fallback to `linux-pgroup` for one operation silently turns kernel into best-effort for that operation. Safe only where the operation does not need the kernel guarantee, which is Q8's point: if Inspect leaves bwrap, R3 no longer breaks reads at all, and only LocalMutation/Remote remain exposed.

### Medium

**F6. The emptiness proof (I3) is weaker than an available one, and `is_empty` semantics need a rule.**
- Design §3 I3 reads `/proc` inside the namespace and treats numeric entries other than 1 as members. A race-free proof exists: after the direct child is reaped, `waitpid(-1, WNOHANG)` returns `ECHILD` exactly when the anchor has no children, and every namespace member is a child of the anchor or a descendant of one, because orphans reparent to pid 1. No `/proc` read, no window where a member is mid-`clone`. The design should use `ECHILD` (zombies stay children until reaped), with the `/proc` scan as the diagnostic only.
- `domain_is_empty(record)` for a `LinuxGate` record is `judge(anchor)` (`lib.rs:205`, `containment/linux.rs:~168`): an open operation domain is always `NotEmpty` from outside, even between children. So an operation domain must never be declared where the predecessor rule or `adopt` reads `is_empty` (design says so in I6; add it to conformance as a negative test).

**F7. A stated protection is false: Yama.** Design §3 threat model says "Yama ptrace scope keeps descendants from tracing it". `ptrace_scope=1` allows tracing your own descendants, and every member is a descendant of the anchor (and `ptrace_scope=0` on many hosts allows everything same-uid). Also `/proc/1/mem`. If the threat model includes deliberate interference, the anchor needs `prctl(PR_SET_DUMPABLE, 0)` and a vector. If it does not (design says accidents only), drop the claim.

**F8. Anchor lifecycle and availability.**
- Q5(a) ends the domain on control-socket EOF. A domain on a long-lived handle (F3) never sees EOF while the host lives; the idle anchor holds a mount namespace (F5) and the working directory open for the process lifetime. Needs an idle timeout, which then adds a race (the anchor exits between "domain open" and the next request; the host must reopen and re-prove quiescence, not run unconfined).
- The anchor is `fgos internal process-domain-anchor` (design §7 L-A, HelperExe pattern). Git runs inside the Node addon, loaded by `bin/fgos.mjs` channels that have no host binary unless `FGOS_HOST_BIN` is set (`AGENTS.md`, Legacy-Node CLI Ownership). Without it there is no anchor, so the operation silently runs per-child (a performance downgrade only, but then measurements and E3 depend on how the process was started). Cost of exec of the large host binary inside the namespace is not in the 10.8 ms estimate.
- The host-side `spawn_with_fds` used for bwrap forks the caller (`mapped.rs:1-14`: milliseconds in a large Node process). The open cost in §9 ignores that.

**F9. Protocol races at deadline and output limit.**
- Today the host owns the `Child` and `kill_all` is "signal the gate by identity (pidfd)" (`containment.port.v1.json` kill_all; `linux.rs:~180`). In the anchor design the host asks the anchor to terminate "child N" while the anchor's `waitpid(-1)` loop may have already reaped it; a later signal by pid can hit a recycled pid, in a namespace whose pids restart at 2. Use pidfd inside the anchor for the child, or signal by process group created per child; define the exit-vs-terminate crossing (the outcome `terminated` / `killed-after-grace` vs natural exit must be one answer).
- A slow or `SIGSTOP`ped anchor (the counsel's own freeze mechanism, design §3 I8, `SIGSTOP` reaches members from the parent ns) blocks every request: each host request needs its own bound, and a partial frame or a split SCM_RIGHTS message must close the domain, never resync. Design §10 has one row for this ("host bound on every request"); conformance has no protocol-fuzz vector (truncated frame, unexpected fd count, oversized env).
- Env and argv per child travel over the socket (I11); size bound and reject-by-name are unspecified. `Scrubbed::new` copies the whole host env (`driver.rs:190-201`), which can be large.

**F10. E3 and E1 migration risks.**
- E3: operations with one or two contained children get slower (open cost about one child plus close and anchor exec). Open lazily on the second child, or do not open at all (F1).
- E1/E4: `invoke_context` is one function holding both the borrowed branch (`driver.rs:1018-1160`) and the contained branch (`:1165-1245`). The design's "one branch asks the port for the operation's domain" leaves the type system unable to stop a `Publication`, `HookContext` or loan call from receiving the shared domain. Make the child spec a type that only the unborrowed branch can build, and have a test that fails when a `HookContext` call reaches the domain. E4 spec text says escapee drain goes "through the Process containment driver of each platform, not a process-group kill" (`docs/platform/git/spec.md:740`); that sentence covers hooks and filters, which `Inspect` has none of, but moving Inspect to a pgroup-level driver needs one sentence in the spec saying so.
- Holder-lock: the anchor must be spawned with only its control socket. `spawn_with_fds` closes every fd from 3 up except the map (`containment.port.v1.json` fdMap), so this holds; but if the anchor is opened after a borrow starts, `Reach::Since` (holder-lock `flock.rs:230-260`) will see the anchor and its members as processes started during the borrow. They hold no lock description, so they are not reported; keep a vector for it. Open the anchor before any lock work, or avoid the issue by not anchoring.

### Low

**F11. Quiescence cost shape.** Each leftover costs a SIGTERM and up to 3 s of grace per child that leaves one (I1, `driver.rs:1216,1223`). Inspect children leave none today, so this is rare, but a hung leftover makes the next child wait: one bad child slows the whole operation instead of one call.

**F12. Existing inefficiencies the design would carry.** Three threads per child (stdin writer `driver.rs:1197`, two readers `:1676`) and a 2 ms sleep poll (`:1219`) sit on the host side of every contained call and stay in the anchor design. These alone are about 1.3 ms of the 3.4 ms in-situ (F1).

## 3. Recommended shape

Do not build the operation domain now. In order, each step measured by the speed seat before the next:

1. **Cheap wins (Q10), no port change.** Replace the 2 ms `try_wait` loop with an exit wake (one waiter thread or pidfd, the way the borrowed path already does in holder-lock `port.rs:1023`). Fold the stdin writer into the same thread. Expected about 1.3 ms per contained child (`debug-261021-1329:51,73`).
2. **Inspect leaves the pid namespace.** `Inspect` children run through the cheapest existing path: `spawn_mapped` (`posix_spawn`) in their own process group, `killpg` on deadline or output limit, emptiness by the group. Mechanism: the existing `linux-pgroup` driver, or a policy-level choice of level, not a new driver. Guarantee drops from kernel to best-effort for reads only, justified by `check_config` (F1). This needs an owner decision (a guarantee downgrade for a class), written in the Git spec next to E4. It also shrinks R3 to LocalMutation and Remote, and removes the premise of T0's rejection of a lazy probe (every caller spawns right after `select`, `council-261021-1507-harden-t0-arbitration.md` D3): after this change most callers do not spawn a contained child at all, so the bwrap probe can move to the first contained spawn (H6, about 2 ms per process).
3. **If a measured remaining customer exists after steps 1-2** (re-census on current main), then P1 with L-A, with these design changes: `ECHILD` quiescence (F6); fd lifetime rules and vector (F4); an explicit concurrency rule, preferably one domain per call stack and a lock-free refusal replaced by "open a second domain" (F3); idle timeout (F8); lazy open on the second child (F10); pidfd for child control (F9); the child spec type only the unborrowed branch can build (F10). Driver order after that: `linux-cgroup` as a later driver behind the same port where a delegated subtree exists.
4. **R3 (Q7).** `containment-mount-refused` named by `BwrapPidns::spawn_in` (T1 phase 4 supplies the stderr line), carried as the Git refusal cause and as a `process-containment` doctor row; the per-process probe records why it chose `linux-pgroup` so a silent downgrade is visible in doctor.

Deletion list (L10): if step 2 lands, nothing is deleted in the port. Candidates that become deletable only with it: the per-process eager probe in `GitDriver::new` (`driver.rs:282`) in favour of a lazy one; the 2 ms sleep loop (`driver.rs:1219`) with step 1. If step 3 is ever built, the default-method per-child implementation becomes the single path for non-Linux drivers and must not be copied.

## 4. Proposed additions (RUL104)

- **Lazy bwrap probe.** Problem: about 2 ms per CLI process (H6). Evidence: `linux.rs:45-61`; T0 D3. Benefit: only valid after step 2; do not do it before. Not requested by the mandate.
- **Record why a driver was selected.** Problem: a cached probe `false` silently selects `linux-pgroup` for a process lifetime. Evidence: `linux.rs:45-61`. Benefit: doctor can say "pgroup because the probe failed: <reason>", which is R3's missing signal.
- **Retire the bench's stale 1.5x ScopedCommit verdict line.** Problem: prints `passed:false` against an absolute budget. Evidence: `verification-261022-0005:38`. Benefit: honest reports. Belongs to the E3 owner, listed only as an observation.

## 5. What would change my position

- A census on current main showing 30 or more contained children in some operation that the owner wants faster, and step 1 (poll loop) not closing most of it.
- A measured per-child bwrap cost of 7 ms or more on the owner's production hosts (not only the gate machine) after step 1; the in-situ figure here is 1.45 ms.
- Evidence that `Inspect` can reach user code despite `check_config` (for example a filter configured through an include that `command_config` does not catch, or a global config scope exempt from the check). Then Q8 flips and the shared set returns.
- An owner decision that no guarantee level may differ between read and write children (then step 2 is out and the anchor is the only route).
- A passing anchor spike for F4 and F9 (fd lifetime and exit-vs-terminate vectors) plus a measured open cost under 5 ms including `exec` of the host binary.

Status: DONE
Summary: Recommend not building L-A; the motive numbers are stale (E3 now passes) and Inspect needs no pid namespace, which removes the shared set. If an operation domain is ever built, P1 is the right shape but needs the concurrency, fd-lifetime, ECHILD-quiescence and idle-timeout fixes listed.

1. Critical: E3 now passes (Land 0.51 s, ScopedCommit 185 ms) and the in-situ pid-namespace cost is about 1.45 ms per child, so the design's gain is overstated about 4x.
2. Critical: `check_config` refuses filter/textconv/external keys, so Inspect runs no user code and gets nothing from a pid namespace (Q8); the shared set is empty.
3. High: domain on the checkout-local handle misses most Inspect calls, and `domain-busy` regresses parallel reads; SCM_RIGHTS fd retention can leak pipes across children.
4. High: R3 is worsened by a long-lived mount namespace; the existing probe already downgrades to pgroup silently.
5. Do first: replace the 2 ms poll loop, move Inspect to the cheap path, name `containment-mount-refused`; the speed seat's refutation list is in F2.
