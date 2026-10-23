# Containment conformance map (phase 04)

Read-only mapping. Worktree `opc-phase-a`, branch `opc/phase-a`. Line numbers are the `fn` line of each `#[test]`, as in the phase's requirement 5. Sources read: the phase file, the five containment test files, and `src/containment/{mod,linux,pgroup,macos,windows}.rs`, `facts.rs`, `platform/linux.rs`.

## 1. One row per existing test

| file:line | name | behaviour | fate |
|---|---|---|---|
| bwrap:76 | containment_gate_is_pid_1_inside_and_its_host_pid_matches_nspid | the gate is pid 1 of its namespace and its host pid equals the first `NSpid` | driver-only, req 5 |
| bwrap:96 | containment_killing_the_gate_stops_a_setsid_grandchild_and_empties_the_domain | a setsid grandchild beating a file stops once the gate is killed; domain Empty | T (body T; the heartbeat becomes a property of the shared tree workload) |
| bwrap:121 | containment_terminal_gate_helper | re-exec role: arms the death signal, execs the heartbeat script | stays; supports :187 (req 5) |
| bwrap:132 | containment_supervisor_helper | re-exec role: starts the gate, then waits to be killed | stays; supports :178 and :187 (req 5) |
| bwrap:178 | containment_direct_gate_outlives_a_killed_supervisor | a direct gate survives its killed supervisor | driver-only, req 5 |
| bwrap:187 | containment_terminal_gate_dies_with_a_killed_supervisor | a terminal gate dies with its supervisor | driver-only, req 5 |
| bwrap:196 | containment_direct_refuses_die_with_parent_by_name | `bwrap_prefix` validation errors by name | driver-only, req 5 |
| bwrap:221 | containment_select_prefers_bwrap_pidns_when_user_namespaces_work | `select` picks bwrap-pidns, falls back to linux-pgroup | driver-only, req 5. Note: it holds the second copy of the bwrap probe, see section 3 |
| bwrap:245 | a_hundred_fast_exits_are_normal_spawns | 100 spawn, wait, Empty, kill_all Ok | F |
| bwrap:257 | fast_exit_preserves_a_nonzero_status | 100 fast `exit 7` keep code 7, then Empty | F (F alternates exit 0 and exit 7, asserts the code each time) |
| pgroup:70 | containment_pgroup_ends_a_tree_of_twenty_including_a_setsid_child | a tree of about 20 including a setsid child ends; the double-fork escape survives and is named in the guarantee | T (tree, escape row) and G (guarantee text) |
| pgroup:105 | containment_pgroup_record_alone_judges_and_ends_the_domain | `domain_is_empty` and `domain_kill_all` on the record alone | R |
| pgroup:117 | containment_pgroup_grace_snapshot_keeps_a_setsid_child_of_a_leader_that_ends_on_sigterm | leader dies on SIGTERM, a TERM-ignoring setsid child is still killed after grace | driver-only, req 5 |
| pgroup:133 | a_hundred_fast_exits_are_normal_spawns | as bwrap:245 | F |
| pgroup:145 | fast_exited_leader_does_not_hide_a_remaining_grandchild | leader exits at once but a grandchild lives: domain stays NotEmpty until kill_all | not in req 5, not in the T/R/F list. Proposal: second case of F, row `leader_exit_ends_domain` (false on pgroup and macos, true on bwrap). Needs TEST's ruling, see section 6 |
| pgroup:171 | spawn_in_never_makes_the_caller_a_subreaper | spawn does not set the caller as subreaper | driver-only, req 5 |
| macos:70 | containment_macos_tree_ends_a_tree_of_forty | a tree of 40 ends | T |
| macos:96 | containment_macos_tree_record_alone_judges_and_ends_the_domain | as pgroup:105 | R |
| macos:108 | containment_macos_tree_names_the_double_fork_escape | the double-fork escapee lives and the guarantee names it | T (escape row, observed on the escape pid) plus G. Not in req 5 and carries no extra case; retired into those two |
| macos:131 | a_hundred_fast_exits_are_normal_spawns | as bwrap:245 | F |
| windows:129 | helper_role | re-exec role body, not a behaviour test | stays in a shared module, see section 2 (loaded by both the conformance binary and the windows file) |
| windows:204 | containment_windows_job_close_ends_child_grandchild_and_detached_child | tree incl. detached child ends when the job's last handle closes | T for the "tree ends" part (via `kill_all`). The "closing the handle ends it" part has no `kill_all` equivalent: needs TEST's ruling, see section 6 |
| windows:235 | containment_windows_job_refuses_breakaway | no breakaway flag, kill-on-close set | driver-only, req 5 |
| windows:250 | containment_windows_job_outlives_its_supervisor_while_the_gate_holds_a_handle | job survives while the gate holds a handle | driver-only, req 5 |
| spawn_timeout:34 | a_timed_out_spawn_leaves_no_process_of_the_attempt | a bwrap that never reports leaves no process | not in req 5 and not in the move list. Proposal: stays untouched, driver-only (it needs a bwrap wrapper fixture and is a failure path of one driver). Ask TEST to confirm |

`spawn_fds_leak.rs` is untouched (req 4).

## 2. Shared bodies

All bodies live in one new file `tests/containment_conformance.rs`. The shared helpers (scratch dir, `wait_for`, `lines`, `spec`, the Windows `helper_role` and its workload roles) move to `tests/common/mod.rs`, which every containment test file includes with `mod common;`. The Windows `helper_role` must exist in each binary that re-executes itself, so `common` is the one place it can live.

Common types:

```rust
struct Props {
    name: &'static str,                  // driver.name()
    level: GuaranteeLevel,
    escapes: &'static [&'static str],    // substrings guarantee() must carry
    double_fork_escapee_survives: bool,  // pgroup, macos true; bwrap, windows false
    term_without_handler_kills: bool,    // bwrap false (pid 1 drops it); pgroup, macos true
    term_phase: bool,                    // windows false: kill_all ignores grace
    killed_status: KilledStatus,         // Code(137) bwrap; Signal(9) pgroup, macos; windows read at implementation
    leader_exit_ends_domain: bool,       // bwrap true; pgroup, macos false
    fast_iterations: u32,                // 100 unix, fewer on windows (each spawn is a test binary)
}
struct Instance { driver: Box<dyn ContainmentDriver>, props: Props, work: &'static dyn Workloads }
trait Workloads {                        // what to run, one impl per OS family
    fn tree(&self, dir: &Path) -> SpawnSpec;        // child, grandchild, setsid/detached child, optional escapee; pids in dir
    fn sleeper(&self) -> SpawnSpec;
    fn exit_with(&self, code: i32) -> SpawnSpec;
    fn term_probe(&self, dir: &Path, handler: bool) -> SpawnSpec;
    fn echo(&self, dir: &Path) -> SpawnSpec;        // prints env, cwd, stdin to stdout, a line to stderr, exits 7
    fn lingering_grandchild(&self) -> SpawnSpec;
}
```

Bodies (no `if instance == …` inside any of them):

| body | signature | steps |
|---|---|---|
| T | `fn tree_ends(i: &Instance)` | create, spawn `tree`, wait for pid files, assert NotEmpty, `kill_all(0)` Ok, Empty, no member of tree/setsid child alive, escapee alive iff `double_fork_escapee_survives` (then SIGKILL it), `child.wait()` status equals `killed_status` |
| R | `fn record_alone(i: &Instance)` | spawn `sleeper`, clone the record, `domain_is_empty` NotEmpty, `domain_kill_all` Ok, Empty |
| F | `fn fast_exits(i: &Instance)` | `fast_iterations` times: create, spawn `exit_with(i % 2 * 7)`, wait, code matches, `is_empty` Empty, `kill_all(0)` Ok. Second case: `lingering_grandchild`, leader exits, `is_empty` is NotEmpty unless `leader_exit_ends_domain`, then `kill_all` Ok and Empty |
| A | `fn spawn_plumbing(i: &Instance)` | `echo` with a known env (exactly the spec's keys), a temp cwd, stdin and stdout and stderr files; assert the env dump equals the spec env, cwd equals, stdin echoed, stderr line present, `child.wait()` code is 7 |
| D | `fn kill_all_grace(i: &Instance)` | (a) `term_probe(handler=true)`, `kill_all(grace)`: Ok, Empty, elapsed >= grace (the probe ignores TERM); the probe file shows TERM arrived iff `term_phase`. (b) `term_probe(handler=false)`, large grace: elapsed < grace iff `term_without_handler_kills`, else >= grace; Empty |
| G | `fn guarantee_names_itself(i: &Instance)` | `guarantee().driver == name()`, `level == props.level`, every row of `props.escapes` is a substring of some escape. G checks the text, T checks the behaviour of the escape |

Property rows and their single observer:

| row | observed by | notes |
|---|---|---|
| pid-1 SIGTERM dropped (`term_without_handler_kills`) | D case (b) | bwrap: dies only after grace |
| exit encoding (`killed_status`) | T, after the kill | 137 on bwrap, no code (signal 9) on pgroup and macos; windows: the job's terminate code, read from the driver at implementation, not checked here |
| `term_phase` | D case (a), probe file | windows has no polite stop (`kill_all` ignores grace) |
| `double_fork_escapee_survives` | T (escapee pid) | replaces macos:108 and the escape tail of pgroup:70 |
| `escapes` / `level` | G | |
| `leader_exit_ends_domain` | F second case | proposal; replaces pgroup:145 |
| `fast_iterations` | F | |
| record judged alone works | R | assumed true on all four; windows is unverified (`domain_watch` accepts `WindowsJob`) |

Windows workloads reuse the existing `helper_role` roles (`tree`, `nest`, `sleep`) and add three small ones: `exit`, `echo`, `term` (about 30 lines). Windows has no setsid escapee, so `Workloads::tree` writes no `escape.pid` there; T skips the escapee step when the file is not part of the workload (a `has_escapee` row would be an alternative; I prefer the file-absent rule).

## 3. Per-OS instances

Instances are built by one function per OS, compiled with `cfg`:

- `cfg(target_os = "linux")`: `linux-pgroup` (constructed directly, `LinuxPgroup`) and `bwrap-pidns`.
- `cfg(target_os = "macos")`: `macos-tree` (`MacosTree`).
- `cfg(windows)`: `windows-job` (`WindowsJobDriver`).

Each is a `macro_rules!` that emits one `#[test]` per body per instance (module names `linux_pgroup`, `bwrap_pidns`, `macos_tree`, `windows_job`), so a failure names the driver.

bwrap "not run": libtest has no runtime skip. A test that returns early is counted as passed, which req 3 forbids; an env opt-out that skips is forbidden by AGENTS.md ("never add an env switch … that skips checks"). Options:

- A. Probe fails, the instance panics with the reason. Honest but red on hosts without user namespaces (for example Ubuntu 24.04 runners with the AppArmor restriction).
- B. `harness = false` with a hand-written runner. Loses libtest and breaks the Windows `--exact helper_role` re-exec.
- C. A `build.rs` in `packages/process/rust` probes bwrap with the same command as `pidns_usable` and emits `cargo:rustc-cfg=bwrap_pidns_usable`; the instance has `#[cfg_attr(not(bwrap_pidns_usable), ignore = "bwrap-pidns probe failed at build time, see the build log")]`. libtest then prints `ignored`, never `ok`.

Recommendation: C. Its failure modes are loud (a stale "usable" turns into a red test) or visibly ignored (a stale "unusable"), never a pass; `cargo:rerun-if-changed` on the bwrap paths narrows staleness. Cost: a new `build.rs`, so ask TEST/owner. The probe reason goes into a `cargo:warning`. `containment_bwrap.rs:221` already contains a second copy of the probe; it should call the shared probe (shared with `containment_spawn_timeout.rs`, another copy), which removes two copies.

## 4. Line estimate (rough, plus or minus 60)

Existing: bwrap 265, pgroup 190, macos 140, windows 268, spawn_timeout 93 (untouched) = 956.

| | removed | added |
|---|---|---|
| bwrap | about 105 (T, F x2, duplicated helpers) | 0 |
| pgroup | about 125 (T, R, F, F2, helpers, imports) | 0 |
| macos | 140 (file deleted; escape test folded into T/G) | 0 |
| windows | about 35 (close test, helper dups) | helpers move to `common` (net 0) |
| `tests/common/mod.rs` | | about 60 (unix helpers, `Workloads` unix impl); windows role code moved, plus about 30 new roles |
| `containment_conformance.rs` | | Props table about 50, bodies about 170 (T 35, R 12, F 35, A 35, D 40, G 15), instances and macro about 40, bwrap probe about 10 |
| `build.rs` (option C) | | about 25 (outside the tests directory) |
| total | about 405 | about 360 (tests directory) |

Net about -45 on the tests directory, so net <= 0 is reachable, but the margin is thin because A and D (about 75 lines) are new behaviours with no existing copy. If it misses, the first levers are fewer per-driver Props (drop `fast_iterations`), and one shared sleeper spec for R, D and F. If it still misses, say so in the phase 05 report with the real `git diff --stat`; I would not delete an owning proof to hit the number.

## 5. Known load flake: pgroup "a hundred fast exits"

Symptom: `LinuxPgroup::is_empty` returns `Unknown` under load (seen 10-22), so `assert_eq!(.., Empty)` fails.

Reading of the code (hypothesis, not reproduced here). `is_empty` calls `pgroup_state` (`containment/pgroup.rs:50`). The leader is Dead after `child.wait()`, so the answer comes from the listing `members` (`linux.rs`, around line 345): it scans all of `/proc`, system-wide, and counts a row as `unreadable` for every `read_stat` error that is not `NotFound`. A process that exits between `readdir` and the read can answer with a different errno (ESRCH while the task is being torn down, or a transient `PermissionDenied`/`InvalidData` on a half-formed `stat`). The process belongs to some other test thread or the host. One such row gives `unreadable > 0`, and `state` then returns `Unknown` (`pgroup.rs:58`, `68-71`). The cargo test threads and the 100-iteration loop make this likely under load. A second path: `facts::platform::observe` (`platform/linux.rs:59-71`) maps `NotFound` while `kill(pid, 0)` still succeeds to `Unreadable`, which `judge_here` turns into `Unknown`, and that applies to `seen` tuples. bwrap's `is_empty` never scans `/proc`, so its F copy is not exposed.

Verdict: the driver is wrong, not body F. `Unknown` is a correct answer to a table that cannot be read, but `members` treats "this process vanished" as "unreadable", which is a lie about a different pid than the domain's. The fix belongs in `members` (treat a vanished process as gone, count only truly unreadable ones, ideally only ones whose group is the domain's), with a test of its own at the driver level. Body F must not poll or retry on `Unknown`: the port contract says `Unknown` is never empty, so tolerating it would hide the same bug on every driver and weaken the proof. If TEST wants a stopgap, the only acceptable one is bounded retry inside the driver (`kill_all` already polls). Not fixed here.

## 6. Questions for TEST

1. windows:204 "close ends tree": T uses `kill_all`, so "dropping the last handle ends the tree" has no owner. Keep one Windows-only test (not on the req 5 list), or add a property row `drop_ends_domain` plus a T step that drops the domain for drivers where it is true? I propose keeping the one test, argued as the `KILL_ON_JOB_CLOSE` contract with no other-driver analogue.
2. pgroup:145 (`fast_exited_leader…`): second case of F with row `leader_exit_ends_domain`, as proposed? It is the only copy and would have no owner otherwise.
3. `containment_spawn_timeout.rs`: stay as is? It is not on the req 5 list.
4. bwrap "not run": option C (a `build.rs`)? Option A fails hosts, B breaks the Windows re-exec.
5. R on Windows is unverified on this host (no Windows runner here); first proof is the CI run.

Status: DONE_WITH_CONCERNS

Summary:
- 25 test fns mapped (incl. 3 helper roles): 11 retire into shared bodies T/R/F, pgroup:145 and windows:204 need a TEST ruling, the rest stay driver-only.
- Shared bodies T,R,F,A,D,G over a `Props` table plus a `Workloads` trait; rows observed once each; Windows needs three small new roles.
- The bwrap "not run" report needs a `build.rs` cfg-ignore (option C); a runtime skip would count as a pass.
- Net lines estimated -45 (plus or minus 60), so <= 0 is reachable but thin; A and D are about 75 new lines.
- The load flake is, by my reading, `members` counting a vanished process as unreadable (`linux.rs`, `pgroup.rs:58`), so the driver is wrong, not body F; unreproduced.
