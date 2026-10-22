HEAD: 7a6f366ed (worktree `/home/vantt/projects/forgent-worktrees/opc-design`, read 2026-10-22, Asia/Saigon)

# OPC council, simplicity / hexagonal seat

Posture: port shape and swappability. Read-only; no measurement taken (every number below is arithmetic on E3/ledger figures, not a new measurement). Paths are relative to the worktree.

## 1. Position

| Q | Answer (one line) | Evidence |
|---|---|---|
| Q3 | Smaller than P1 and not P2: one defaulted trait method `open_operation` returning `Option<Box<dyn OperationDomain>>`, a 3-verb `OperationDomain` (`spawn`, `settle`, `close`), a 1-verb `ChildProcess` (`wait`). The default is one shared `PerChild` struct in `mod.rs`, not code in each driver. Quiescence folds into `settle`; no `quiesce`, no child-level `terminate`. | `containment/mod.rs:187-207` (today's 6 methods); `driver.rs:1190-1229` (the ladder `settle` replaces) |
| Q3a | `ChildSpec` must not carry `bwrap_prefix`, `mode` or `fd_map`; the port's `SpawnSpec` already leaks bwrap into the port and the operation shape must not copy that. | `mod.rs:36-52` (`bwrap_prefix`, `mode`), contract `spawn_in.spec.bwrapPrefix` |
| Q3b | `Spawned.child: std::process::Child` cannot represent a child that an anchor spawned in another namespace, so the operation shape needs its own child handle; reusing `Spawned` is not possible. | `mod.rs:60-67` |
| Q4 | No config key. A driver that has no native operation domain uses `PerChild`; the only runtime input is the anchor executable path, which belongs in `SelectEnv` (where the bwrap path already is), not in config. Doctor reports `operationDomain` from `guarantee()`. | `mod.rs:210-215`; `src/setup/registrations.mjs:2330` (doctor row `process-containment`) |
| Q5 | Port rule: dropping or closing an open operation domain ends every member; a host that dies ends it (anchor control-socket EOF; Windows `KILL_ON_JOB_CLOSE` gives the same for free). `PerChild` keeps today's "Direct child may outlive the host", and the contract says so per `guarantee().operationDomain`; neither mode may ever claim `Empty` it did not prove. | contract `spawn_in` mode text; `tests/containment_bwrap.rs:178` (`direct_gate_outlives_a_killed_supervisor`) |
| Q7 | Named port error `mount-refused` (detail carries bwrap's stderr line naming the mount), no silent downgrade to `linux-pgroup` inside an operation. Downgrade only by an explicit re-`select` the caller can see through `guarantee()`. T1 phase 4 can use this name unchanged (it only edits `linux.rs` `spawn_in`/`end_failed_spawn`). | brief "Settled by neighbours"; `linux.rs:94-105` (`NamespaceUnavailable` path), ledger R3 |
| Q8 | No firm view; one fact for the owner: Git already has `user_code_may_run(repo, policy)` (`driver.rs:928`), the exact predicate "can a hook or filter run here". An `Inspect` on a repo where it answers false has nothing for a pid namespace to sweep. This is a Git policy decision, not a port change. See proposed addition A3. | `driver.rs:928-975` |
| Q9 | The capability fixes R2 only if Git opens the operation scope at the typed entry (`Worktree::add`), because ~88% of an add's git execs are contained reads (218 bwrap of 249 execs per 10 adds, ledger R2) while the add itself already runs borrowed (`worktree.rs:218-227`, `Policy::Publication`). It does nothing for a lone `Inspect` call (one contained child per call: the open costs about one bwrap). R5's ≈15 confined git are separate typed calls from Node: the capability helps only if they are batched under one entry; otherwise the lever is Q8 policy or a cheaper driver. H6's per-process probe is fixed by a lazy `select` (Q10), not by the capability. | `worktree.rs:212-233`, `:763-777`; ledger R2/R5/H6 |
| Q10 | Two inside today's shape: (1) replace the 2 ms `try_wait` poll with a waiter thread plus one event channel; (2) make `GitDriver`'s `select` lazy (first contained spawn), so a CLI call with no contained child pays no probe. | `driver.rs:1207-1221`, `driver.rs:282` |
| Q1, Q2, Q6 | No view. One port-level remark for Q1: a driver whose per-child cost is already low (cgroup v2, L-C) does not implement `open_operation` at all; that is the argument for keeping the native hook optional. | design §7 L-C |

## 2. Findings

| Sev | Claim | Evidence | Consequence |
|---|---|---|---|
| High | The design's "operation domain rides on the same handle as `checkout_config`" is wrong for the operation boundary. A `RepoHandle` is per `resolve_repo`, and one typed operation resolves several: `Worktree::add` resolves a second handle (`worker_repo`) inside the add; `checkout_config` exists only on operation-local checkout handles. | `worktree.rs:772-776`; `lib.rs:93-98` (`checkout_config: Option<..>` "present only on an operation-local checkout handle") | A domain hung on a handle would be opened per handle, losing the gain exactly in Land/worktree add. The slot must be created by the typed entry and shared by every handle resolved inside it (see 3.4). |
| High | `Spawned.child` is `std::process::Child`; an anchored child has no std `Child`, and its exit status arrives over the anchor's control socket. | `mod.rs:60-67`; run-supervisor uses `spawned.child` directly (`supervise.rs:462`) | A new child handle type is required, and `spawn_in`/`Spawned` must stay untouched for the run supervisor (no caller churn). |
| Medium | Git has no helper-exe path today. Borrowed children need none on Linux (holder-lock uses `HelperExe` only for the Windows keeper, `borrow_windows.rs:64`). In the Node addon `current_exe()` is `node`, which plays no role. | `port.rs:65-71` (`HelperExe::current()` = `current_exe()`); `driver.rs` has no `HelperExe` | The anchor needs a host binary path the addon does not have now; the plumbing (`FGOS_HOST_BIN` resolution) is new work on Linux. Absent path must mean "per-child", never an error. |
| Medium | The pid-1 reap loop already exists in the run-supervisor gate (`waitpid(-1)`, `gate_pid1.rs:161` `no zombies`, `gate_orphan`). An anchor in Process (L0) cannot import the gate (L4); copying it breaks design principle 1 and 2. | gate spec line 116; `tests/gate_pid1.rs:161-190` | Either a shared leaf in Process (`reap_all`) that the gate also imports in the same change (L10), or the duplication is named and accepted. Verify the gate's loop before choosing; I have not read its source. |
| Medium | Per-child cost of the 2 ms poll is bounded by construction at 2 ms per child (65 children in Land is at most 130 ms of pure sleep granularity). | `driver.rs:1221` `sleep(Duration::from_millis(2))` | Worth fixing regardless of the capability (Q10); it also removes the only reason the child handle would need `try_wait`. |
| Low | `Guarantee` is a struct literal in four drivers; adding a field edits all four plus any test literal. | `linux.rs:186-190`, `pgroup`/`macos`/`windows` literals | Prefer deriving "native or per-child" from `open_operation` plus one test, not a second hand-maintained flag (3.1). |
| Low | Lifetime: `select` returns `Box<dyn ContainmentDriver>`; a `PerChild` that borrows `&dyn` cannot outlive the borrow, and a Git-side operation slot must. | `mod.rs:213`, `driver.rs:207` | Git wraps the selected driver in `Arc<dyn ContainmentDriver>` (`Arc::from(box)`); `PerChild` clones the `Arc`. No port change to `select`. |

## 3. Recommended shape

### 3.1 Rust signatures (additive in `packages/process/rust/src/containment/mod.rs`)

```rust
/// One child of an operation. No bwrap prefix, no start mode, no fd map: those are
/// the gate's concern. Paths are host paths; a driver that runs the child elsewhere
/// (VM, container) must make them valid there.
pub struct ChildSpec {
    pub argv: Vec<String>,
    pub env: BTreeMap<String, String>,   // exact, nothing inherited
    pub cwd: PathBuf,
    pub stdin: Option<File>,
    pub stdout: Option<File>,
    pub stderr: Option<File>,
}

pub struct ChildExit { pub code: Option<i32>, pub signal: Option<i32> }

/// Independent of the domain: `wait` may block on another thread while the
/// owner calls `settle`.
pub trait ChildProcess: Send {
    fn wait(&mut self) -> io::Result<ChildExit>;
}

/// A domain that outlives one child. Children run one at a time. The driver's own
/// machinery (anchor, job keeper) is never a member.
pub trait OperationDomain: Send {
    /// Refused `domain-busy` while the previous child is not settled,
    /// `domain-closed` after `close` or after the domain was lost.
    fn spawn(&mut self, spec: ChildSpec) -> Result<Box<dyn ChildProcess>, ContainmentError>;
    /// End every member (a running child included): SIGTERM, `grace_ms`, SIGKILL
    /// (0: at once); then answer from real OS state. `Unknown` is never `Empty`.
    /// After `Empty` the next `spawn` is admitted.
    fn settle(&mut self, grace_ms: u64) -> DomainState;
    /// Idempotent. Dropping the domain is `close(0)`.
    fn close(&mut self, grace_ms: u64) -> KillOutcome;
}

pub trait ContainmentDriver: Send + Sync {
    // ...today's six methods, unchanged...
    /// `Ok(None)`: no native operation domain, use `PerChild`.
    fn open_operation(&self, _id: &str) -> Result<Option<Box<dyn OperationDomain>>, ContainmentError> { Ok(None) }
}

/// The one door. Native when the driver has one, else `PerChild`.
pub fn operation(driver: &Arc<dyn ContainmentDriver>, id: &str) -> Result<Box<dyn OperationDomain>, ContainmentError>;

/// Default for every driver without a native domain: today's behaviour. Each
/// `spawn` is `create` + `spawn_in` (`bwrap_prefix: None`, `Direct`, empty fd map);
/// `settle` is today's `is_empty` -> `kill_all(grace)` -> `is_empty` ladder;
/// `close` settles the last child's domain. Not selectable, not driver code.
struct PerChild { driver: Arc<dyn ContainmentDriver>, id: String, current: Option<ContainmentDomain>, busy: bool }
```

Why this is the smallest shape that still works:
- Not P3: `is_empty` keeps its meaning for the predecessor rule and the supervisor (`predecessor.rs`, `supervise.rs:366`); `settle` is a new verb with its own contract.
- Not P2 as a second port: `OperationDomain` is produced by the one driver chosen by the one `select`; it has no selector of its own, no config, no registration. It is one default method plus the object it returns.
- Fewer methods than P1's four: `quiesce` and a child `terminate` collapse into `settle(grace)` because after a normal exit the old code does `is_empty` then `kill_all` then `is_empty` (`driver.rs:1222-1224`) and on a deadline does `kill_all` then wait (`driver.rs:1216`): both are "sweep with grace, then judge".
- `ChildProcess` exposes no pid or tuple. Git does not use one (`Output` carries code only, `driver.rs:1239-1244`), and a VM/job driver would have to invent one. The operation domain is never declared as a custody domain (design I6), so no id leaves the port.
- Native detection: `guarantee().operationDomain` is derived (native iff `open_operation` returned `Some`), proven by one test (3.5, item G), instead of a hand-set field in four struct literals.

### 3.2 Contract v2 delta (`packages/process/contracts/containment.port.v1.json` becomes `containment.port.v2.json`, same change, v1 deleted, every reference moved)

Additive; v1 operations untouched, run supervisor unchanged.

```json
{
  "contract": { "id": "process-containment-port", "version": 2 },
  "operationDomain": {
    "open_operation": {
      "input": { "id": "string" },
      "output": "OperationDomain, or none when the driver has no native one; the port then supplies the per-child default with identical semantics",
      "errors": { "enum": ["driver-unavailable", "namespace-unavailable", "mount-refused", "io"] }
    },
    "spawn": {
      "input": { "argv": "string[]", "env": "exact object", "cwd": "absolute host path", "stdio": "{stdin, stdout, stderr}: each a parent fd or null" },
      "output": "child with wait() -> {code|null, signal|null}",
      "errors": { "enum": ["spawn-failed", "domain-busy", "domain-closed", "io"] },
      "rule": "one child at a time; the child holds no descriptor but its stdio; nothing is inherited"
    },
    "settle": {
      "input": { "graceMs": "integer >= 0" },
      "output": { "enum": ["empty", "not-empty", "unknown"] },
      "rule": "ends every member including a running child, then judges from OS state; unknown is never empty; the driver's own machinery is not a member"
    },
    "close": { "input": { "graceMs": "integer >= 0" }, "output": { "enum": ["ok", "refused"] }, "rule": "idempotent; drop is close(0); a dead owner ends the domain on native drivers" }
  },
  "guarantee": { "operationDomain": { "enum": ["native", "per-child"] } },
  "drivers": {
    "bwrap-pidns": "native: one bwrap with a resident anchor as pid 1 (helper role passed by the caller through SelectEnv.anchor; absent => per-child)",
    "windows-job": "native: one job per operation, AssignProcessToJobObject per child; graceMs ignored as today",
    "linux-pgroup, macos-tree": "per-child (the default)"
  }
}
```

New port error names: `domain-busy`, `domain-closed`, `mount-refused`. `containment-unproven` stays Git's name (Git maps any non-`Empty` `settle` to it, as today).

`SelectEnv` gains `anchor: Option<PathBuf>`: the executable that plays `internal process-domain-anchor`, passed by the caller exactly as holder-lock passes `HelperExe`, but through `SelectEnv` because Process (L0) cannot import holder-lock's type. Process defines the role and its argv; the caller supplies only the path.

### 3.3 Driver-swap test (what a new driver must implement, and whether anything Linux-shaped leaks)

| Driver | Must implement | Leak into the port? |
|---|---|---|
| cgroup v2 (L-C) | The six existing methods. `open_operation` can stay `None`: if a cgroup per child is cheap, `PerChild` is already the answer. If it wants one cgroup per operation: `mkdir`, spawn with `posix_spawnattr_setcgroup_np`, `settle` = `cgroup.kill` + `cgroup.events populated 0`. | None. `ChildSpec` has no namespace or mount notion. |
| microVM | `open_operation` (guest agent per VM); `spawn` pumps the given stdio fds over vsock; `settle` asks the guest agent. | Two stated contract assumptions, both honest: stdio arrives as fds (unix/Windows handle), and `cwd`/paths are host paths the VM must mirror. Neither is bwrap-specific. |
| Landlock | Not a containment driver: it restricts what a child may touch, not which processes belong to the domain. It composes with a driver at the confinement layer (the existing `bwrap_prefix` seam), not through this port. | The existing `SpawnSpec.bwrap_prefix` is the leak to avoid copying; `ChildSpec` omits it. |
| Windows job | Native `open_operation`; `settle` = job view plus member scan, as `windows_job.rs`. | None. |

Conclusion: the shape forces no Linux or bwrap assumption. The one place a Linux idea survives is in the word "anchor", which stays inside the `bwrap-pidns` driver and `SelectEnv.anchor`, a field a Windows or cgroup driver ignores.

### 3.4 Layering and the operation boundary

- Process (L0): owns `ChildSpec`, `OperationDomain`, `PerChild`, the anchor role and its protocol, the conformance suite. Knows no Git, lock, Policy, operation name.
- Holder-lock (L1): unchanged. The anchor is spawned with only its control socket (design I5); borrowed/`HookContext`/`Publication` children never enter the domain.
- Git: owns the decision. Corrections to the design:
  - The slot is not on `RepoHandle` (finding 1). The typed entry (`Land`, `ScopedCommit`, `Sync`, `SafeRestore`, `Worktree::add`, ...) creates `Arc<OperationSlot>` (`Mutex<Option<Box<dyn OperationDomain>>>`, opened lazily on the first contained child) and every `RepoHandle` resolved inside it carries a clone. The slot drops with the entry; drop closes the domain.
  - Concurrency without a port error: `invoke_context` takes the slot with `try_lock`; on contention that one child runs in a throwaway `PerChild`. The port still refuses `domain-busy`, but Git never meets it, which settles the design's open "two operations on one handle" question without a trace.
  - Which children: unchanged from design §4 (`Inspect`, `LocalMutation` use the slot; `Remote` without loan takes a throwaway `PerChild`; loans stay borrowed). The branch in `invoke_context` stays one branch: it asks `operation()` for a domain instead of `create`.
- Anchor helper: `fgos internal process-domain-anchor --control 3`, a role of the host binary like `fgos internal holder-lock-helper`; contract under `packages/process/contracts/`. Path via `SelectEnv.anchor`; absent path means `PerChild`, never an error, so hosts and tests without the host binary behave exactly as today.

### 3.5 Conformance suite, cut to one owning proof per behaviour

One new file, `packages/process/rust/tests/operation_domain.rs`: one test body per behaviour, instantiated for each available driver (cargo-vector style, like `judge_vectors.rs`). That is one proof per behaviour run N times, not N copies. Behaviours the existing tests already own for the per-child path are not re-proved for `PerChild`; one wiring test shows `PerChild` calls the driver in the right order.

| # | Behaviour | Owner | Extends / reuses |
|---|---|---|---|
| A | N sequential children: exit code, stdout/stderr bytes, stdin, exact env, cwd | new body, all drivers | none of `containment_*.rs` asserts env/cwd/stdio exactness; this is new |
| B | A background `sleep` left by child 1 is gone, and SIGTERM-handling child removes its lock inside grace while a SIGTERM-ignoring child is killed after grace, before child 2 runs | new body, native drivers only | `containment_pgroup.rs:117` (grace snapshot) and `containment_bwrap.rs:96` already own per-child kill; `PerChild` is not re-proved |
| C | `setsid` + double-fork escapee killed (kernel) or reported per named escape (best-effort) | existing: `containment_bwrap.rs:96`, `containment_pgroup.rs:70`, `containment_macos.rs:108`; plus one native-anchor case in B's body | no new per-driver copy |
| D | `spawn` on an unsettled domain is `domain-busy`; after `close` or a killed anchor is `domain-closed`; `close` idempotent; `Unknown` never `Empty` | new body, all drivers (this is the port rule each implementation must meet) | `Unknown` handling already owned by `containment_pgroup.rs:105` for the record |
| E | Owner SIGKILLed mid-child: native domain empty within bound; `PerChild` unchanged | native: reuse the killed-supervisor helper of `containment_bwrap.rs:157-195`; `PerChild`: existing `:178` | no second helper |
| F | fd table: anchor holds stdio + control only, child stdio only, a held lock description invisible inside | extend `spawn_fds_leak.rs` (it owns the descriptor rule for `spawn_with_fds`) with an anchor case | no copy of its helper |
| G | `guarantee().operationDomain == native` iff `open_operation` returned `Some` | new, one test | replaces a hand-set flag |

Cut from the design's list:
- Item 5 (deadline and output-limit through `terminate`): these are Git policy (`git-timeout`, `git-output-limit`), owned at Git layer. Output limit already has `test/git/inspect.test.mjs:36`; a deadline case belongs with the Git driver, not the port.
- Item 11 (bench row): not a test; it is the E3 harness's row.
- Item 10 is merged into D.
- Wiring above the port: one proof, the existing escapee test `test/git/scoped-commit.test.mjs:113-128` (`containment-unproven` on a surviving escapee). No new Node-level copy. Run-supervisor tests (`gate_pid1`, `gate_orphan`, `supervise_*`) need no change because `spawn_in`/`Spawned` are untouched.

### 3.6 Deletion list (L10)

Disappears when the capability lands:
- `driver.rs` contained branch: the `create` id (`SERIAL`, `format!("git-...")`), the `SpawnSpec` literal with `bwrap_prefix: None`/`StartMode::Direct`/empty `fd_map`, the 2 ms `try_wait` loop, and the `is_empty`/`kill_all`/`is_empty` ladder (about 40 lines); Git imports of `SpawnSpec`, `StartMode`, `DomainState` shrink to `ChildSpec`, `DomainState`. The ladder moves once into `PerChild::settle` (one door), it is not duplicated per driver.
- Per-child `bwrap` for every `Inspect`/`LocalMutation` child on bwrap hosts (the whole cost, 65 children in Land).
- `containment.port.v1.json` (replaced by v2 in the same change).
- Eager `select` in `GitDriver::new` (replaced by a lazy one; Q10).
- Tests: none of the existing containment tests retire, because their behaviours (kill, escapee, grace, host death) stay; the design's own list items 5 and 11 are not added.

What stays, and why:
- The default `PerChild` stays permanently. It is the single implementation of the contract for `linux-pgroup`, `macos-tree`, and any future driver without a native domain; it is not a parallel path. It could only be deleted if every driver gained a native domain, and for pgroup and macos a native domain is the same code (no anchor, a set of pgroups).
- `BwrapPidns::spawn_in` (the gate) stays: the run supervisor calls it.
- The `Remote`-without-loan child stays per-child (via `PerChild`).

## 4. Proposed additions (RUL104)

| # | Addition | Problem and evidence | Benefit |
|---|---|---|---|
| A1 | Shared pid-1 reap primitive in Process, imported by both the gate and the anchor | Two reap loops otherwise (finding 4); `gate_pid1.rs:161` proves the gate's loop, none proves an anchor's | One owner, one proof; needs the gate edited in the same change, so it is a scope decision for the owner |
| A2 | Lazy `select` in `GitDriver` (a `OnceLock`) | `driver.rs:282` probes bwrap on every `GitDriver::new`; HARDEN D3 measured about 2 ms of a ~250 ms CLI call; the probe is already cached per process and path | Every CLI call with no contained child pays nothing; no behaviour change (the probe still runs before the first spawn, which is the invariant D3 required) |
| A3 | Skip the pid namespace for `Inspect` when `user_code_may_run` is false | `driver.rs:928` already computes it; hooks are off for `Inspect`, filters are the only user code left (Q8) | Removes most contained children for ordinary repos; changes the I2/I3 guarantee for reads, so it needs an owner decision, not a council default |
| A4 | Waiter thread plus one event channel instead of the 2 ms poll | `driver.rs:1207-1221`; at most 2 ms of sleep granularity per contained child | Cuts a bounded per-child delay now, independent of the capability; also makes `ChildProcess::wait` blocking, so the new handle needs no `try_wait` |

## 5. What would change my position

- A read of the gate's reap loop showing it is already a library function in a crate Process may import (finding 4 and A1 would change).
- A trace showing typed Git entries share `RepoHandle`s more than `worktree.rs:772-776` suggests (the slot-on-entry design would simplify to slot-on-handle).
- A driver whose children must be addressed by pid across calls (for example a Custody-style declare of the operation domain): then `ChildProcess` would need an identity, and I6 would no longer hold.
- A measured result from the speed seat that an anchored child costs close to a per-child bwrap: the native hook would then buy nothing and the answer would be Q8/A3 plus the lazy probe only.
- An owner decision to make `PerChild` match native host-death semantics (for example `--die-with-parent` per child), which would remove the per-mode wording in Q5.

Status: DONE
Summary: Extend the one port with a single defaulted `open_operation` returning a 3-verb `OperationDomain` and a 1-verb `ChildProcess`, with one shared `PerChild` default that stays; no config key, no Linux assumption in the shape, and the operation slot must live on the typed Git entry, not on `RepoHandle`.
