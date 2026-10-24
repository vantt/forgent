# H31: Work gate git calls, Git facts calls, spawn cost (read-only investigation)

2026-10-24 10:34-10:42 Asia/Saigon. No tracked file edited, nothing committed. Fixture repo and scratch binaries removed. Scratch: `/tmp/claude-1000/-home-vantt-projects-forgent/8e8e56bb-00a0-4158-ad04-ec29cabf8204/scratchpad/h31/` (`spawn.mjs`, `sp.c`, `tm.py`, strace outputs, an archive of `work/es-cutover` `8d9fab669` under `w/`).

Scope note: `admit_writes` / `write_readiness` / `consumer-event-gate.mjs` are **not on main** (`bd5fd089d`); they exist only on `work/es-cutover`. Code lines below for the gate cite that branch (`git show 8d9fab669:<path>`). Facts and spawn code cite main.

## 1. Where the calls are issued

### 1a. Gate: 4 (admit) + 2 (read) per process, write command, `8d9fab669`

Node entry: `src/state/consumer-event-gate.mjs:38` `store.admitWrites(heldRanks)` -> `src/event-store/native.mjs:82-84` -> `packages/git/node-addon/src/event_store.rs:82` `admit_writes` -> `:251` `write_admission` (asked once per store via `OnceLock`, refused inside rank 60 with `event-store-admission-required`) -> `packages/event-store/rust/src/legacy_import.rs:677` `write_readiness`.

| # | child | Rust fn, file:line |
|---|---|---|
| 1 | `symbolic-ref --quiet HEAD` | `resolve_head`, `packages/git/rust/src/driver.rs:2118`, called from `legacy_import.rs:681` |
| 2 | `rev-parse HEAD^{commit} --symbolic-full-name HEAD` | same fn, `driver.rs:2128` (bracket) |
| 3 | `for-each-ref` (prefix `refs/fgos/legacy`) | `consumer_inventory` `legacy_import.rs:50` -> `event-store/src/refs.rs:21` `list` |
| 4 | `cat-file --batch` (probe of roots `.fgos`, `docs/distillery/state/porting`, `porting` at HEAD) | `absent_roots` `legacy_import.rs:128-152` via `read_paths_at`, inside `INVENTORIES.get_or_compute` (`:124`) |

(Counted in WORK's fixture; `fence::authority` and `resolve_repo` add no child because the config stamp is unchanged. If the repo tracks `.fgos/`, `read_inventory_roots_at` adds `list_tree` children, and a migrated repo adds pin read, `refs::list(refs/fgos/)` and remote-mapping calls (`legacy_import.rs:695-735`); the fixture is the cheap case.)

Read (`event_store.rs:463` `read` -> `event-store/src/read.rs`):

| # | child | file:line |
|---|---|---|
| 5 | `for-each-ref` with `%(HEAD)`, prefixes `refs/fgos/{events,branch-events,local-events,remotes}/`, `refs/fgos/legacy`, plus `refs/heads/` | `read.rs:206` `tips` -> `refs.rs:45` `list_with_head` |
| 6 | `cat-file --batch` of `.fgos/events` at HEAD (the fence) | `read.rs:335` `read_legacy` -> `fence.rs:36/47` `pinned_at_head`/`read_pin` (memo `FENCE`) |

Read already takes HEAD from child 5 (`read.rs:388-391`, `listed_head`), so it spends no `symbolic-ref`/`rev-parse`. The legacy view, inventory and fence are process-wide `CommitMemo`s keyed by (repository, commit) (`read.rs:377`, `legacy_import.rs:122`, `fence.rs:33`).

Pure repeats: **none byte-identical.** Logical repeats of the same question within one command:
- HEAD observed twice: children 1+2 (admit) vs `%(HEAD)` in child 5 (read).
- refs listed twice: child 3's prefix `refs/fgos/legacy` is a subset of child 5's prefix list (child 5 lists `refs/fgos/legacy` too).
- a path read at the same commit twice: child 4 (`.fgos` ...) and child 6 (`.fgos/events`). In a non-migrated repo child 4 has already proven `.fgos/events` is not a blob, which is exactly what child 6 returns (`PathValue::Absent | NotABlob(Tree)` -> `None`, `fence.rs:57`).

Why they are separate (what rule): not a Git rule. The only rule is the gate rank-60 rule (`event_store.rs:246-250`, ES spec "no spawn in the gate", `8d9fab669:docs/platform/event-store/spec.md` lines 1023-1026, 1189): admission must be settled before the gate, a read never pays for it, and "prepared admission is valid for that process". The listing is not shared because `read` must observe fresh refs per call (git spec: "no HEAD/ref fact is retained between commands", `driver.rs` comment at `fn config`). The two HEAD children exist because of the bracket (`476683a26` 13:41: one `rev-parse` read HEAD several times and paired a commit with another branch's name; `aae0aa00d` 13:20 had made it 1 child). The settled answer for the one place that already lists refs is `e649b1e6a` 18:22 (`%(HEAD)` in the tip listing, 1024-row guard `8633fa191`; spec `docs/platform/git/spec.md:127` and `:1055`; owning proofs `packages/git/rust/tests/head_in_listing.rs`, `packages/event-store/rust/tests/read_head_children.rs`, `head_switch.rs`). Admit simply never adopted it: it still calls `resolve_head`.

### 1b. Git facts: 5 children per process, all once per process, none repeated (main)

Entry `src/git/inspect.mjs:13` `new GitInspect` -> addon `git/inspect.rs:19` -> first `call` -> `driver.rs:326` `resolve_repo` -> `require_floor` + `read_repository_facts` (`:336`).

| # | child | file:line |
|---|---|---|
| 1 | `var GIT_CONFIG_SYSTEM` | `config_paths` `driver.rs:622-660`, memo `CONFIG_SOURCES` (per process) |
| 2 | `var GIT_CONFIG_GLOBAL` | same loop |
| 3 | repo-less `config --null --show-origin --list` | `floor_key` `driver.rs:1354` (floor verdict memo `FLOOR` `OnceLock` `:282`; the on-disk record saves only the probe, the key is rebuilt every process) |
| 4 | repo `config --null --show-origin --list` | `validated_config` `driver.rs:~712` |
| 5 | `rev-parse --show-object-format --show-ref-format` | `repository_formats` `driver.rs:400-402` (stamp-validated cache `keep_formats`) |

Measured on this machine: `strace -f -e execve fgos version` (second run, floor record warm) shows exactly var, var, config (repo-less), config (`--git-dir`), rev-parse formats, then the command's own `rev-parse`. The first run after a reinstall also ran the floor probe (21 children). The second `GitInspect` of WORK's report builds a second `GitDriver` but hits `CONFIG_SOURCES`, `FLOOR`, `REPOSITORY_CONFIG` statics: it costs no child. So the "x2" is two constructions, not 10 children.

Settled decision touching it: T2 `D-T2-9` (plan.md: "F-C3 is kept by evidence"): the two `git var` children stay because only Git can name absent config files that may appear later; a hand derivation would copy git's lookup and the `GIT_*` scrub and lose `git-config-paths-unavailable`.

## 2. bwrap: why, and the cost (measured now)

Why: every non-borrowed child goes through one door, `invoke_context` `driver.rs:997` -> `self.containment.create` / `spawn_in` (`:1228-1237`), regardless of `Policy`. The driver is chosen once per process: `bwrap-pidns` when bwrap can make a pid namespace (`packages/process/rust/src/containment/linux.rs:30-50`), else `linux-pgroup`. Spec rule: git spec section on timeouts (line 294) and E4 (`:752`): cancellation and drain use Process containment, "not a process-group kill alone", because a `setsid()` hook/filter child survived `killpg`. The bwrap argv built by the driver is `bwrap --unshare-pid --as-pid-1 --dev-bind / / --proc /proc --info-fd N -- git ...` (`linux.rs:113-118`, `:150-159`). There is no per-policy skip: repo-less `var`/`config` and read-only plumbing pay it too (22 bwrap execs in one `fgos version` strace).

Spawn method (strace `clone` flags of `fgos version`): git children = `clone(CHILD_CLEARTID|CHILD_SETTID|SIGCHLD)` (glibc `fork`, 4 of them); the `bwrap /bin/true` probe = `clone3(CLONE_VM|CLONE_VFORK)`. Cause is in code: `BwrapPidns::spawn_in` (`linux.rs:150-159`) calls `control::spawn_with_fds` (`control.rs:174-243`), which installs a `pre_exec` closure to dup2 the `--info-fd` slot and close inherited fds; Rust std only uses `posix_spawn` when there is no `pre_exec`, so every contained child forks the caller. The probe (`linux.rs:51-70`) is a plain `Command`, hence vfork. The repo already has the answer: `packages/process/rust/src/mapped.rs` (`spawn_mapped`, commit `cbf9b3feb`, module note says exactly "forces a full fork of the caller: in a large process (Node with its heap) that copy costs milliseconds per child"); holder-lock's borrowed path uses it (`holder-lock/rust/src/port.rs:897,1006`). The containment drivers never moved onto it.

### Measurements (fixture repo on ext4, 1 commit, `git rev-parse HEAD`, 33-40 runs after 3 warm-ups, stdout/stderr captured)

Load at start/end: 3.9 -> 3.9 (first block), 2.9 -> 3.0, then 15.4 / 15.0 -> 11.6 (another lane started a job mid-run; I did not generate it). Medians (p90) ms. C harness `sp.c` = `fork`/`vfork`/`posix_spawn` of `/usr/bin/git` or of the exact driver bwrap argv (minus `--info-fd`), caller holding N MB of touched 1 MB malloc chunks:

| caller RSS | spawn | plain git | via bwrap |
|---|---|---|---|
| ~0 MB | fork | 0.88 | 2.62 |
| ~0 MB | vfork / posix_spawn | 0.73 / 0.73 | 3.08 / 2.67 |
| 100 MB | fork | 2.97 (3.88) | 4.50 (5.34) |
| 100 MB | vfork / posix_spawn | 0.72 / 0.82 | 2.44 / 2.55 |
| 500 MB | fork | 12.32 (15.31) | 18.27 (29.39) |
| 500 MB | vfork / posix_spawn | 0.69 / 0.76 | 2.93 / 2.45 |
| 100 MB, load 15 | fork | 2.45 | 5.58 |
| 100 MB, load 15 | vfork / posix_spawn | 0.68 / 0.69 | 2.50 / 2.50 |

Node `spawnSync` (libuv forks), `spawn.mjs`, plain / bwrap argv with `--info-fd 3`:

| node RSS | plain | bwrap |
|---|---|---|
| 51 MB | 1.50 (1.77) | 3.10 (5.75) |
| 578 MB (500 x 1 MB buffers) | 9.98 (16.54) | 13.43 (21.29) |
| 136 MB, run A (load 2.9) | 9.15 (12.19) | 16.59 (18.80) |
| 136 MB, run B (load 15) | 2.93 (3.69) | 5.59 (6.92) |

Python `subprocess` (vfork) bwrap + repo `rev-parse`: 2.2 (3.3); repo-less `var`: 2.7 (3.5), unstraced. Under `strace -f` the same calls cost 9.5 and 9.0 ms: ptrace inflates a bwrap child by about 7 ms, so strace-derived per-child numbers are inflated and noisy; use them for counts only.

Findings:
1. Hypothesis confirmed structurally and by measurement: fork cost scales with the caller's page tables (about +2.2 ms per 100 MB touched, +12 ms at 500 MB) and does not move with vfork/`posix_spawn`. The CLI's maxrss is 87 MB for `--help` (`/usr/bin/time -v`; bare `node -e 0` is 44 MB), so a `move` is around 100-140 MB: +2 ms per child quiet.
2. The fork cost is **state-dependent**: same 136 MB node, same bwrap argv, 16.6 ms at one moment and 5.6 ms five minutes later (a 3x swing); vfork/`posix_spawn` stayed at 2.4-2.9 in every state (and 0.7 plain). That reproduces the 4 ms -> 15-20 ms swing WORK saw: the swing is in the fork leg, not in bwrap or git. Why the kernel state flips (page-table allocation under cache pressure: 23 GB buff/cache, 2.5 GB free, memory cgroup accounting, THP via `madvise` only) is **not proven**; I could not isolate it.
3. bwrap itself costs about +1.6 ms over plain when quiet (0.7 -> 2.3-2.5 with `posix_spawn`, 1.5 -> 3.1 node). Under other lanes' activity single bwrap runs reached 8-11 ms with every spawn method (C `pspawn` at 0 MB: 8.4, 6.9, 3.7 over three rounds at load 2.9-3.0), so about +5-8 ms per child is a load-dependent bwrap/namespace-setup cost that a spawn method does not remove. Two parallel bwrap loops did not reproduce it (2.6), so it follows other lanes' state, not bwrap-vs-bwrap contention.
4. Not measured: a real Rust `std::process::Command` + `pre_exec` microbench (C `fork` is the same syscall; glibc fork also does not use vfork). No cargo build was run.

## 3. Smallest design (RUL104: better, not bigger)

Cost model for the numbers below: per git child at CLI size (about 130 MB), quiet: about 3-4.5 ms after the fork, 5.5-17 ms in the bad fork state. WORK's gate rows (13.6 ms for 4 children quiet, 47 ms later) fit this.

### A. Admit takes HEAD and the legacy hint from the one listing read already uses (recommended)
- Change: in `write_readiness` (`legacy_import.rs:677`) replace `resolve_head` + `refs::list(refs/fgos/legacy)` by `refs::list_with_head` over the prefixes admission needs (`refs/fgos/legacy`, and `refs/fgos/remotes/` for the migrated branch, which today calls `crate::refs::list(refs/fgos/)` at `:704`), taking the listed HEAD when present and `resolve_head` otherwise: the same `match listed_head { Some(h) if same checkout => h, _ => resolve_head }` that `legacy_view` already has (`read.rs:388-392`). `consumer_inventory` takes the entries instead of listing again.
- Saves: 4 -> 2 children in admit for an attached HEAD within 1024 rows (-2; -3 in a migrated repo where the second listing disappears too). Detached/unborn/over-guard: 3 children, equal to today (listing + the 2-child bracket).
- Correctness: nothing new is trusted. Today's admit HEAD (bracket: two children, refuses `head-changed-during-read`) and the listed HEAD (one child reads HEAD once, row read in the same iteration; spec `git/spec.md:127`) are the two settled observers; read already uses the second for the same HEAD-selects-inventory decision. If HEAD or refs move between admit and read: today read re-observes anyway (admit's answer is per-process `write_refusal`, never a snapshot passed to read); proposed is identical. A HEAD switch inside the listing child is impossible by the same one-read argument; the bracket's failure mode (mixed pair) is what `%(HEAD)` was designed to avoid. Not reopened: `resolve_head` stays as the fallback and for every non-listing caller.
- Do **not** share one ref snapshot between admit and read: read's listing is its freshness proof (a foreign event landing in between would be missed; today's retry `catch-up-required` would turn into a stale read). That would be exactly a cache that can drift.
- Owning tests: `packages/event-store/rust/tests/read_head_children.rs` (already counts children per read and imports `write_readiness`): add a case for the admit count (attached: 1 listing; detached: listing + bracket), and the existing `legacy_import.rs`/`legacy_reader.rs` suites keep the admission verdicts. `head_in_listing.rs` and `head_switch.rs` unchanged. ES spec section 17 line and CHANGELOG-free (internal).
- Line delta: Rust about +15 / -12 in `legacy_import.rs`, +30 test lines. Node: 0.

### B. Spawn through the existing no-fork door (recommended, bigger win and the cause of the swing)
- Change: `BwrapPidns::spawn_in` (`containment/linux.rs:150-159`) and, for symmetry, `LinuxPgroup::spawn_in` start through `mapped::spawn_mapped` (already tested: `packages/process/rust/tests/spawn_mapped.rs`; already used by holder-lock). `spawn_mapped` supports env, cwd, pipes, process group and the fd map; two gaps: `Spawned.child` is `std::process::Child` and `MappedChild` has `id/kill/wait` but no `try_wait` (needed at `driver.rs:1251` and `run-supervisor/src/supervise.rs:350,457,474`), and stdio here are caller-supplied files, not pipes it creates (`apply_stdio` dups caller files; `MappedStdio` has `Null/Piped/Inherit`). So the real edit is: add `try_wait` and a "given file" stdio variant to `mapped.rs` (~30 lines), make `Spawned.child` the mapped child type, adjust the three run-supervisor and the one git site (~15 lines), `LinuxPgroup`'s `setsid` -> `POSIX_SPAWN_SETSID` (glibc 2.26+; fallback keeps the `Command` path, as `spawn_mapped` already does off glibc). Net about +60 / -25 Rust, one spec sentence (process spec section 4-5 "spawn without forking the caller"), no Node.
- Saves, per child, no change in count: about 2.1 ms at 100 MB quiet (4.5 -> 2.4 bwrap), 3 ms at load 15 (5.58 -> 2.50), up to 15 ms in the 500 MB / bad state; 11 children in B's `move` -> about 23-33 ms quiet, and it removes the 3x swing (vfork stayed flat 2.4-2.9 in every round).
- Correctness: containment semantics unchanged (same bwrap argv, same `--info-fd` handshake, same gate identity read). Risk: fd-close completeness (the `pre_exec` list is rebuilt as `addclose` actions, same list `inheritable_fds()`), signal mask/`SIGPIPE` default (set in `mapped.rs`), `pre_exec`-less error reporting (`ENOEXEC`, handled there). Owning proofs: `process/rust/tests/spawn_mapped.rs`, `gate_pid1.rs`/`supervise_*` (run-supervisor), git `scoped_commit.rs` E4 tests under `bwrap-pidns`. This touches the Process and Run-supervisor owners: hand over, do not edit from Git.
- Not proven: that it also removes the entire 4 -> 15-20 ms step; my data say the fork leg explains 2-10 ms of it and bwrap's load-dependent setup the rest.

### C. Facts, 5 -> 3 (optional, small, needs the big lead)
- `git var -l` (Git 2.53: usage is `var (-l | <variable>)`, one variable per call, so `var A B` fails) prints `GIT_CONFIG_SYSTEM=` and `GIT_CONFIG_GLOBAL=` lines in one child; parse by exact prefix. -1 child per process. It still asks Git, so `D-T2-9`'s argument (no hand derivation, fail-closed) holds; new evidence only. Risk: output also carries the config, so the parser must accept only the two names and refuse relative paths as today (`driver.rs:645-655`); `PATH_LIMIT` is 64 MB, no overflow risk. Delta about +8 / -10 in `config_paths`; owning tests in `packages/git/rust/tests` for config paths (`config_paths`, "absent file appears later" case).
- Formats from the config records (`extensions.objectformat`, `extensions.refstorage`, repo-origin only) instead of `rev-parse --show-object-format --show-ref-format`: -1 child. Correct in principle (they are config facts, the code already says so at `driver.rs:358`) but it copies Git's rule and changes the failure cause for a repository Git itself rejects: I do not recommend it now.
- Not worth it: merging the repo-less and repo `config --list` children (floor key must exist before any repo is resolved, `resolve_repo` `driver.rs:327`).
- No cross-process facts record: it would be a new persisted cache beyond the floor record; refused by RUL104.

### D. Skip bwrap for pure plumbing (not recommended without an owner decision)
Quiet saving per child about +1.6 ms (0.7 vs 2.3-2.5), more under load. The Git driver would need an allow-list of verbs that cannot run user code (`rev-parse`, `symbolic-ref`, `for-each-ref`, `cat-file`, `var`, `config`, `ls-tree`; not `status`/`diff`, which run clean filters). That is a per-call containment classification, a new mechanism, and it reopens the E4/containment rule that every child is contained. The code already knows Inspect runs no user code (`user_code_may_run`, `driver.rs:944`), so the argument is available, but B first removes most of the waste. Owner question, not a proposal.

### E. Optional extra: pin read in the admit probe (skip)
Read's child 6 could ride child 4 (`.fgos/events` added to `absent_roots`' batch) and seed `FENCE` with `None` when it is not a blob: -1 child in non-migrated repos, couples two memos, +15 lines. After A the gain is about one 3 ms child; skip unless WORK needs it.

### Expected result (fixture, quiet; same assumptions as WORK's table)
| | children now | after A | A + B (time) |
|---|---|---|---|
| gate admit + read | 6 | 4 | about 40% of the 29-97 ms gate cost removed (children 6 -> 4, per child -2 to -10 ms) |
| facts | 5 | 5 (4 with C) | per child -2 to -10 ms |
| whole `move` B | 11 | 9 | print 215 -> about 165 (quiet) and 302 -> about 215 (later) is within reach with WORK's other items; A+B alone about -45 ms quiet, -120 ms in the later regime |

(The last row is an estimate from per-child costs, not a measured run; I did not build the Work branch addon.)

## Unresolved
1. What changes kernel-side between the 4 ms and 15-20 ms fork regimes (cannot be isolated from user space with this data). Test: run `sp fork 100 ... 1` in a loop for an hour with `vmstat`, `/proc/pagetypeinfo`, `/proc/meminfo` PageTables snapshots, and compare to `pspawn`.
2. The load-dependent bwrap setup cost (8-11 ms at times, independent of spawn method). Not reproduced with two parallel bwrap loops.
3. I did not measure the real addon (no Work release build; the repo had no addon from `8d9fab669` and I did not build). Child counts for the gate rest on the code trace plus WORK's strace counts; the trace reproduces 4 + 2 for a non-migrated fixture exactly.
4. B changes the `Spawned` public type shared with run-supervisor; needs the Process/Run-supervisor owner's go.

Status: DONE_WITH_CONCERNS
Summary: Gate = 4 admit children (HEAD bracket 2, legacy ref listing, `.fgos` probe) + 2 read (HEAD-in-listing, fence read); no byte-identical repeats but admit ignores the `%(HEAD)` listing rule read already uses, so A (admit via `list_with_head`, -2 children, no settled rule reopened) is the smallest fix. The git-fork hypothesis is confirmed (fork cost grows about 2.2 ms per 100 MB and swings 3x with machine state; `posix_spawn`/vfork is flat); the one door is `BwrapPidns::spawn_in` -> `control::spawn_with_fds` (`pre_exec` forces fork), and `process::mapped::spawn_mapped` already exists.
Concerns/Blockers: machine load changed mid-run (2.9 -> 15) so absolute numbers vary; the 4 -> 15-20 ms step is only partly explained; gate counts are from code plus WORK's strace, not from a run of the Work-branch addon; B touches Process/Run-supervisor owners.
