# OPC council: speed seat

HEAD `d6afdc7e6` (worktree `/home/vantt/projects/forgent-worktrees/opc-design`, branch `opc/design-council`). Measured 2026-10-22 13:07-13:35 Asia/Saigon on this host (24 cores, kernel 7.0.0-38, bwrap 0.11.1, git 2.53.0). All numbers are ms, p50 unless stated; "Δ" is a difference of interleaved paired medians.

## 0. Headline (read this if nothing else)

1. **Every contained child in every measured typed operation is an `Inspect` child.** Land (typed), ScopedCommit and Sync (push) run their mutating Git children outside bwrap (borrowed/host path); the `bwrap` children are all `--no-optional-locks` reads (`config`, `rev-parse`, `for-each-ref`, `symbolic-ref`, `worktree list`, `status`, `ls-files`, `ls-tree`, `cat-file`). An operation-scoped domain around "all children" would therefore contain reads only. This matches red-team Q8 and makes option (iii) (Inspect without a pid namespace) capture 100% of the available gain.
2. **One bwrap child costs +1.8 to +3.7 ms over a plain spawn (central +2.3), and the 2 ms `try_wait` sleep costs another ≈ +1.4 ms per contained child.** The poll is 35-45% of today's per-child overhead and is removable with no new mechanism.
3. **An anchor child costs ≈ +0.13 ms over plain; the anchor itself costs ≈ 2-3 ms to open and ≈ 0.2-0.6 ms to close.** Break-even is 2 children. Real, but it only matters for Land (≈ 54 children) and worktree add (≈ 22); ScopedCommit saves ≈ 14 ms and push ≈ 0.
4. **bwrap flag tuning cannot reach the fixed floor.** Best flag change (`--ro-bind` for read-only children) saves 0.4-1.0 ms; dropping `--proc` saves 0.1-0.3 (noise level).

## 1. Position

| Q | Position (speed seat) | Evidence |
|---|---|---|
| Q1 Linux mechanism | Per-child Δ(bwrap) is real (+2.3) but an anchor is not needed to recover it: Inspect children do not need a pid namespace (Q8), and the mutating children are not in bwrap today. If an anchor is still wanted for non-speed reasons, it is speed-neutral to positive from N ≥ 2. | §3 rows c, e; §5 census |
| Q6 timing/target | The design's "Land -0.42 s" is not reachable: today's total contained overhead for Land is ≈ 54 x (2.3 + 1.4) ≈ 0.20 s of a ≈ 0.5 s Land. Best case with anchor + poll removal ≈ -0.19 s; with (iii) + poll removal ≈ -0.20 s. | §6 |
| Q8 Inspect needs pidns? | No view on safety. Speed: it is the only change that removes all per-child bwrap cost and the probe, and 100% of contained children are Inspect. It is a guarantee downgrade (no kernel emptiness proof, pgroup is best-effort), see §6(iii). | §5 census |
| Q9 R2/R5/H6 | R2 (≈ 22 bwrap/add from the ledger, not re-measured) and R5 (≈ 15 git) are the same Inspect-dominated shape; cheap wins + (iii) fix them with no domain. H6 probe = 2.8 ms once per process, exactly one probe per process in the census. | §3 row 4, §5 |
| Q10 cheap wins | Yes, do poll removal regardless: ≈ 1.4 ms per contained child, 35-45% of the bwrap overhead, zero new surface. Lazy probe: saves 2.8 ms only in processes that spawn no contained child; every typed operation spawns ≥ 2, so it is nearly worthless unless Inspect leaves bwrap (then the probe disappears altogether). Flag tuning: negligible except `--ro-bind` for read-only children. | §3, §4 |

## 2. Findings

**High. F-S1: the contained path is an Inspect path.** Census on current HEAD (`d6afdc7e6`) with `strace -f -s 65535` over `scripts/git/e3-bench.mjs scoped-census` and `census`: bwrap argv carries `--no-optional-locks` in 100% of contained children in land-prepare (32/32), land-publish (22/22), scoped-preflight (2/2), scoped-commit (6/6), land-legacy (75/75) and push (2 per push, all `config`). The other Git children (scoped-commit 15 of 21, land 32 of 86, push 7 direct) are not under bwrap. Consequence: design §1/§9 price containment of mutators; the measured shared set is reads. Source: `/dev/shm/opc-census*/…strace` (deleted after counting; reproduce with `census.sh`/`census2.sh`).

**High. F-S2: the poll loop is the largest single removable item.** `packages/git/rust/src/driver.rs:1207-1219`: the first `try_wait` runs immediately after spawn, always misses, then `sleep(2ms)`. Result: a 0.9 ms plain child costs 2.17 ms; a 2.7 ms bwrap child costs 4.2 ms. Measured Δ(poll − blocking wait): plain +1.27 (p50), bwrap +1.5 (p50), mean +1.2 / +1.4. Applies only to the contained branch (borrowed branch is separate).

**Medium. F-S3: `--unshare-user` adds nothing.** Production argv already creates a user namespace: `strace` shows `clone(CLONE_NEWNS|CLONE_NEWUSER|CLONE_NEWPID)` for the argv without `--unshare-user`, because bwrap enters a userns when unprivileged. Rows c and d are equal within noise (2.74 vs 2.59 rev; 3.74 vs 3.86 status).

**Medium. F-S4: fork cost in a large caller is flat on this host.** `spawn_with_fds` forks the caller (`packages/process/rust/src/mapped.rs:1-14` claims "milliseconds in a large process"). Measured fork+exec vs `posix_spawn` of `git --version` with 1/100/400/1000 MB touched heap: 0.67/0.66/0.65/0.66 vs 0.59/0.60/0.57/0.59 (Δ 0.07 ms, independent of heap). Caveat: one contiguous malloc; Node's heap has many VMAs and threads, so this is a lower bound, not a Node measurement. Not measured: the same in a Node process.

**Medium. F-S5: bwrap floor is dominated by fixed work.** `strace -f -c` of one production-argv child: 2 `execve` (bwrap, git), 29 `mount` (25 are per-submount remounts for `--dev-bind / /`, 53 mountinfo lines here), 2 `pivot_root`, 2 `umount2` (the final `umount2(".", MNT_DETACH)` is 0.69 ms under strace, the slowest single call). A plain `/bin/true` costs 0.47; the same under bwrap costs 2.80 (probe.py, n=300). The remount loop scales with host mount count (≈ 6-20 µs per mount); this host has 53. R2's "≈ 20 ms per child" would need hundreds of mounts or heavy load; not reproducible here (see §7).

**Low. F-S6: stale contained readers exist right now.** Two `bwrap … git cat-file --batch[-check]` trees with PPID 1, 15 h and 17 h old (pids 454661, 2480972; not mine, not touched). Long-lived read handles leak outside any domain today. A per-operation domain would have reaped them; a per-child domain does not. Relevant to Q5/Q8, not to timing.

## 3. Measurements

### Micro: per-child cost, `git rev-parse HEAD` (rev) and `git status --porcelain` (status), small repo

Interleaved ABAB per iteration (one of each variant per round), `posix_spawn`, stdio to /dev/null, wall time spawn to `waitpid`. Three batches (load noted in §7).

Batch 1 (n=300 per row; load1 2.4, one 56% core busy):

| variant | rev p50 / p95 | status p50 / p95 |
|---|---|---|
| a plain | 0.90 / 2.90 | 1.41 / 4.32 |
| b setsid (≈ linux-pgroup spawn) | 0.90 / 3.53 | 1.49 / 3.98 |
| c bwrap production argv | 2.74 / 9.19 | 3.74 / 10.44 |
| d c + `--unshare-user` | 2.59 / 9.18 | 3.86 / 10.67 |
| c without `--proc` | 2.53 / 8.88 | 3.59 / 9.52 |
| c with `--ro-bind / /` instead of `--dev-bind` | 2.28 / 8.29 | 2.80 / 7.97 |
| c with `--bind / /` (no dev) | 2.31 / 8.47 | 2.80 / 9.01 |
| a plain + 2 ms sleep poll | 2.17 / 4.60 | 2.18 / 4.59 |
| c bwrap + 2 ms sleep poll | 4.23 / 10.72 | 4.26 / 10.73 |

Batch 2 (n=500; load1 1.5; machine visibly slower in this window): plain 1.76, setsid 1.84, c 5.44, d 5.08, no-proc 4.77, ro-bind 4.42; status: plain 2.07, c 5.51, ro-bind 3.88. Plain+poll 2.25, c+poll 6.38.

Batch 3 (n=500; load1 1.45): plain 1.05, c 4.25, plain+poll 2.23. (Absolute values drift 2x between batches; the interleaved deltas and ratios are what to read. Δ(c-a): +1.84 / +3.68 / +3.20 across batches.)

Standalone probe script (`probe.py`, n=300, `/bin/true`, Python subprocess, interleaved, load1 7): plain 0.47 / 0.75; production argv + `/bin/true` 2.80 / 4.38; probe argv (with `--unshare-user`) 2.79 / 4.59. Δ = +2.3.

Setsid (b) is indistinguishable from plain (Δ ≤ 0.05): a `linux-pgroup` child costs the same as a plain child, apart from the host-side `/proc` tree scan in `is_empty` (`containment/linux.rs`, `remember_tree`/`pgroup_state`), which is not measured here.

**Central per-child numbers used in §6:** Δbwrap = +2.3 ms (range 1.8-3.7); Δpoll = +1.4 ms (range 1.2-1.5).

### Row e: anchor (spike)

Source: `/home/vantt/projects/forgent-worktrees/opc-design/.fgos/runtime/tmp/opc-speed/anchor.c` (pid 1 of `bwrap --unshare-pid --as-pid-1 --dev-bind / / --proc /proc`, SOCK_SEQPACKET on fd 3, request = cwd + argv + 3 fds via SCM_RIGHTS, `posix_spawn` with dup2 file actions, `waitpid`, drain `waitpid(-1, WNOHANG)` until ECHILD, then `kill(-1,0)==ESRCH` as emptiness proof, reply status+empty; `MSG_CMSG_CLOEXEC` on receive, close of received fds before reply). Harness: `bench.c` in the same directory. Every anchor child replied `empty=1`, status 0 (no discrepancies printed in any batch).

| row | value |
|---|---|
| anchor child, rev (n=1000 per batch) | 0.81-0.89 p50, p95 1.47-3.66 |
| plain, interleaved with the anchor child (batch 3) | 0.75 p50, p95 1.22 |
| anchor child − plain (same loop) | **+0.13 ms** |
| anchor child status (batch 1) | 1.27 p50 vs plain 1.41 (different phase, not paired) |
| anchor open (n=100) | 1.60-2.91 p50, p95 4.1-6.7 |
| anchor close (n=100) | 0.21-0.64 p50, p95 0.57-3.0 |

Caveats: (1) the anchor here is a ~40-line static-ish C program; the real anchor would be `fgos internal …` (exec of a 9 MB binary measured at `fgos --version` 0.59 p50 / 1.00 p95 vs `/bin/true` 0.47), so add ≈ 0.1-0.5 ms to open. (2) Excludes host-side per-child work that stays in either design: three pipes, reader threads, `tuple_of` /proc reads, `Command` fork (0.07 ms Δ here). (3) The spike confirms the SCM_RIGHTS protocol works and a descriptor-lifetime bug is easy to hit: my first version hung because the anchor inherited its own socket peer (no EOF on close) and was fixed with `SOCK_CLOEXEC` plus `FD_CLOEXEC` on fd 3. This is the red-team F4 hazard, observed.

### Item 3: the 2 ms poll

See batch 1: plain 0.90 to 2.17 (+1.27), bwrap 2.74 to 4.23 (+1.49); means 1.32 to 2.53 and 3.99 to 5.40. Cause: `driver.rs:1207` polls once at t≈0 (child not done), then sleeps a fixed 2 ms, so any child under 2 ms pays up to the full quantum and a 2-4 ms child pays two. A blocking `wait` (or `pidfd`/`waitpid` on a helper thread with the existing overflow/timeout flag checked by a short-timeout condvar) removes it.

### Item 4: the H6 probe

2.80 p50 / 4.59 p95 per call (probe argv with `/bin/true`). The census shows exactly one probe execve per process, at the first contained spawn (the `bwrap --unshare-user … /bin/true` line precedes the first production bwrap). So H6 costs 2.8 ms per Node/Rust process that ever needs a contained child, and 0 for processes that never do.

## 4. Breakdown of the bwrap child (item 2)

`strace -f -T -tt` and `-c` of the production argv (`/dev/shm`, 53 mountinfo lines):

| step | observation |
|---|---|
| `clone(CLONE_NEWNS\|CLONE_NEWUSER\|CLONE_NEWPID)` | 0.22 ms |
| `mount /` slave, tmpfs `/tmp`, bind `newroot`, `pivot_root`, bind oldroot | ≈ 0.6 ms (5 syscalls, 55-185 µs each under strace) |
| remount of each of 25 submounts (`--dev-bind / /` repeats MS_REMOUNT per mount) | ≈ 6-20 µs each, ≈ 0.3-0.5 ms total, **scales with host mount count** |
| `mount proc` | 0.03 ms |
| `umount2(oldroot)`, `pivot_root(".",".")`, `umount2(".")` | 0.09 + 0.14 + 0.69 ms |
| `execve(git)` after setup | 0.30 ms |

Flag variants (batch 1, n=300): drop `--proc` -0.1 to -0.3; `--ro-bind` -0.46 (rev) / -0.94 (status); `--bind` (no dev) -0.43 / -0.94. Batch 2 agrees (-0.4 to -1.0). So L-E (flag tuning) saves at most ≈ 15-25% and only for children that may use a read-only root; I did not check exit codes of the ro-bind rows for `status` (stdout to /dev/null), so treat them as an upper bound on viability, not a recommendation. The floor (two `execve`, user+mount+pid namespace creation, `pivot_root`, detach) is ≈ 1.8 ms and cannot be flagged away.

Not measured: scaling with host mount count (no privilege to create mounts: `unshare --mount -r` is refused by `apparmor_restrict_unprivileged_userns=1`; `sudo -n` needs a password; nested bwrap inside bwrap fails with "No permissions to create a new namespace", also a fact worth knowing: any caller already inside a bwrap cannot nest). R3/R2 sensitivity to mount count is therefore extrapolation only.

## 5. Census on HEAD `d6afdc7e6` (item 5)

Method: `strace -f -qq -s 65535 -e trace=execve,…` around `scripts/git/e3-bench.mjs scoped-census` (Land + ScopedCommit, paired legacy/port fixtures) and `census` (push), against a release addon/host built at HEAD into `~/.cache/opc-speed-cargo` (staged via a throwaway `stage.mjs`). Markers bracket each phase. Counts are one run each (sample 1), from execve lines. `git` = `/usr/bin/git` execs (contained or not, top-level); descendants like `/usr/lib/git-core/git` shown apart.

| operation (phase) | git execs | under bwrap | contained share | contained are Inspect? |
|---|---|---|---|---|
| ScopedCommit preflight | 8 | 2 | 25% | 2/2 |
| ScopedCommit commit | 21 | 6 | 29% | 6/6 |
| **ScopedCommit total** | 29 | **8** | 28% | 8/8 |
| Land typed prepare | 49 | 32 | 65% | 32/32 |
| Land typed publish | 37 | 22 | 59% | 22/22 |
| **Land typed total** | 86 | **54** | 63% | 54/54 (design §9 said 65) |
| Land legacy (Node path, includes port calls) | 107 | 75 | 70% | 75/75 |
| Sync push (objects / no objects) | 21 / 21 (14 of them descendants, `sh`, `upload-pack`, `receive-pack`, `pack-objects`) | 2 / 2 | 7 direct host children + 2 contained | 2/2 (`config`) |
| worktree add (R2) | not run | ledger: 218 bwrap + 249 git per 10 adds ≈ 22 bwrap/add | | not verified; ledger only |

Landing verbs inside bwrap (typed Land): `for-each-ref` 17, `rev-parse` 8, `symbolic-ref` 9, `config` 7, `worktree` 5, `cat-file` 1, `status` 2, `ls-files` 3, `ls-tree` 2. Running a worktree add end to end was not done (needs an activated project and verb surface; outside the 15-minute budget); R2 numbers are quoted from the HARDEN ledger. Seat launch (R5) likewise ledger-only.

Probe: one `bwrap … /bin/true` execve before the first contained child per process, as expected.

## 6. Expected savings per operation (item 6)

Inputs: Δbwrap 2.3 (1.8-3.7), Δpoll 1.4, anchor child +0.13, anchor open+close ≈ 3.3 (open 2.7 incl. a larger exec, close 0.6), probe 2.8 once per process. N = contained children from §5. Savings are wall-clock per operation, p50-scale; gaps are measured Δ's, not a re-timed operation. Reference budgets: Land p95 ≈ 0.51 s (budget 1.6 s), ScopedCommit p95 ≈ 185 ms (absolute 250 ms), from the E3 clean rerun.

| operation (N) | today's contained overhead N x (2.3+1.4) | (i) poll removal + lazy probe | (ii) anchor per operation (L-A), with poll removal | (iii) Inspect without pidns, with poll removal |
|---|---|---|---|---|
| ScopedCommit (8) | ≈ 30 ms | -11 ms (poll), probe 0 (≥ 2 contained children always) | -(11 + 8 x 2.17 - 3.3) ≈ **-25 ms** | -(11 + 18) ≈ **-29 ms** |
| Land typed (54) | ≈ 200 ms | -76 ms | -(76 + 54 x 2.17 - 3.3) ≈ **-190 ms** | -(76 + 124) ≈ **-200 ms** |
| Sync push (2) | ≈ 7 ms | -2.8 ms | -(2.8 + 2 x 2.17 - 3.3) ≈ **-3.8 ms** (anchor open eats the gain) | ≈ -7.4 ms |
| worktree add (≈ 22, ledger) | ≈ 81 ms | -31 ms | -(31 + 48 - 3.3) ≈ **-75 ms** | ≈ -81 ms |
| process with ≥ 1 contained child | +2.8 ms probe | probe lazy: 0 gain | anchor open covers the probe at its own price | probe vanishes: -2.8 ms |

Read:
- (i) alone recovers 35-40% of the contained overhead everywhere at zero new surface (poll removal is a few lines in one function, `driver.rs:1207-1219`).
- (ii) adds ≈ 0.9 ms per child beyond (i) at the price of an anchor protocol, a helper role and the open/close cost; for ScopedCommit that is 14 ms more than (i) (≈ 8% of its p95), for push ≈ 1 ms (nothing), for Land ≈ 114 ms more than (i).
- (iii) beats (ii) on every measured row because all contained children are Inspect and there is no open/close; it also removes the probe. It is a guarantee downgrade: Inspect would run under `linux-pgroup` (best-effort emptiness, escapees via setsid+double fork not caught) instead of a kernel proof, and R3 (host mount breaks bwrap) stops affecting reads. The pgroup per-child `/proc` scan is not measured; it must be subtracted from (iii)'s savings (red-team F2.6).
- The design's headline Land gain (-0.42 s) is bounded by the 0.20 s of contained overhead that exists at all: no option can exceed (i)+(anchor or iii) ≈ 0.2 s.

## 7. Method (reproducibility)

Throwaway files, all under `/home/vantt/projects/forgent-worktrees/opc-design/.fgos/runtime/tmp/opc-speed/`: `bench.c` (interleaved micro + anchor harness), `anchor.c` (spike), `mk.sh` (gcc -O2), `run1.sh`/`run2.sh`/`run3.sh` (wait for load1 < 2.5 / 1.5, then `./bench N <repo> rev|status`), `probe.py` (probe + prod argv + `/bin/true`, n=300), `fs.c` (fsync probe), `forkbig.c` (fork vs `posix_spawn` by heap size), `st.sh` (strace of one child), `census.sh`/`census2.sh`/`parse.py`/`parse2.py`/`stage.mjs` (census), `cb.sh` (release build into `~/.cache/opc-speed-cargo`), `res1.txt`..`res3.txt` (raw output). The small repo is `small/` (one file, one commit). Commands that name "target"/".git" live in script files per the hook.

Host driver: this shell is unconfined (not inside bwrap); the probe succeeds and the production code issued `bwrap` for every contained child in the census, so `bwrap-pidns` is selected here. `kernel.apparmor_restrict_unprivileged_userns=1` yet bwrap works (it has an apparmor profile); `/usr/bin/bwrap` is not setuid.

Load readings (`uptime` at start, then top CPU):
- 13:06:59 load1 28.8 (several `fgos.mjs` node processes of other sessions at 90-100% CPU): not measured; waited.
- batch 1 start 13:12:22 load1 2.41 (one `MainThread` 56%); end 13:12:44 2.51.
- batch 2 start 13:15:40 load1 1.47 (top 4.4%); end 13:16:25 1.78.
- batch 3 start 13:17:03 load1 1.45; end 13:17:24 4.73 (the bench itself plus 24-core drift).
- probe.py: load1 7.07 (decaying average; top process idle-ish). Quiet only in the sense of no hot cargo/node; the load1 > 2 rule was waived for batch 1 after the instantaneous top process was a single 56% core on a 24-core host. Mitigation: all comparisons are interleaved within one process, and the three batches agree in sign and ordering; absolute values drift up to 2x between batches, so quote ranges.
- fsync probe (`fs`, n=200, write 1 byte + `fsync`, ext4 NVMe): 5.30 p50 / 5.54 p95 (fast mode). No row above touches fsync (read-only Git children), so no fsync pairing is needed for them; the census fsync counts (push 25 per push, cas-changing 20) are unrelated to containment.

Sample counts: micro n=300 (batch 1), n=500 (batches 2, 3), per variant, one of each variant per round; anchor child n=1000, anchor open/close n=100; probe n=300; fork n=100. p95 = sorted index 0.95 n.

Cleanup: no process of mine left running (checked); `/dev/shm` census files removed; the two leaked 15 h / 17 h bwrap trees in F-S6 belong to other sessions and were left alone. Cargo target `~/.cache/opc-speed-cargo` kept (ext4).

## 8. Recommended shape (speed seat)

1. Do first, independent of OPC: replace the 2 ms poll with a blocking wait (≈ -1.4 ms per contained child; Land ≈ -76 ms, ScopedCommit ≈ -11 ms). Needs one test that a timeout and an output overflow still stop the child, in the existing driver tests.
2. Decide Q8 before any domain: the measurements say the domain would contain only reads. If Inspect leaves bwrap (guarantee downgrade for reads only), no anchor is justified on speed; the remaining contained set (mutators) is not bwrap-contained today anyway.
3. If an anchor is built anyway: break-even is 2 children, per-child +0.13 ms, open ≈ 2-3 ms; it should sit behind the existing port as one more driver. Make `SOCK_CLOEXEC`/`MSG_CMSG_CLOEXEC` and "child N's pipes reach EOF at child N's exit" explicit conformance vectors (the spike hit the descriptor-lifetime trap).
4. Deletion list (L10) from speed alone: the `sleep(2ms)` poll in `driver.rs`; nothing else is justified by the numbers.

## 9. Proposed additions (RUL104)

- Lazy probe is not recommended: problem (H6, 2.8 ms per process) is real but every typed operation spawns ≥ 2 contained children, so laziness saves nothing; it disappears only if Inspect leaves bwrap.
- A per-op contained-child counter in the E3 census (already in `scripts/git/e3-bench.mjs`, only needs a bwrap column): problem, the design's 65 was unverified for months; evidence, today's 54 vs 65; benefit, the next design starts from a measured census.

## 10. What would change my position

- A measurement of per-child cost inside the real Node host (fork path, threads, many-VMA heap) showing the host-side overhead dwarfs the namespace cost, or a host with hundreds of mounts where the remount loop dominates (R2 "20 ms per child"): then flag tuning/anchor gain grows and (ii) becomes more valuable. I could not create mounts here.
- A typed operation whose mutators run under bwrap (none exist at HEAD): the "reads only" finding would no longer hold.
- The pgroup per-child `/proc` scan costing > ≈ 1 ms: then (iii)'s saving shrinks accordingly.

```text
Status: DONE_WITH_CONCERNS
Summary: Measured per-child, anchor, poll, probe and census on HEAD d6afdc7e6; all contained children in Land/ScopedCommit/push are Inspect reads, bwrap costs +1.8-3.7 ms (central 2.3) and the poll another +1.4 ms per child, an anchor child costs +0.13 ms plus 2-3 ms open.
Concerns/Blockers: Window was not fully quiet (load1 1.4-2.4 in the batches, interleaved so ratios hold, absolute values drift 2x); mount-count scaling, worktree-add and seat-launch end-to-end, pgroup is_empty cost and fork cost inside Node were not measured.
```

## Key numbers

| item | value |
|---|---|
| plain git rev-parse | 0.9 (0.5-1.8 across batches) |
| setsid / pgroup spawn | = plain (Δ ≤ 0.05) |
| bwrap production argv | +1.8 to +3.7 over plain, central +2.3 |
| bwrap + `--unshare-user` | = production (userns already implicit) |
| `--proc` dropped / `--ro-bind` | -0.1..-0.3 / -0.4..-1.0 |
| 2 ms poll vs blocking wait | +1.3 plain, +1.5 bwrap per child |
| anchor child vs plain | +0.13 |
| anchor open / close | 1.6-2.9 / 0.2-0.6 |
| H6 probe | 2.8 p50, 4.6 p95, once per process |
| census contained children | ScopedCommit 8 of 29 git, Land 54 of 86, push 2 (+7 direct), all Inspect |
| savings (i) / (ii) / (iii) Land | -76 / -190 / -200 ms |
| savings (i) / (ii) / (iii) ScopedCommit | -11 / -25 / -29 ms |
| savings (i) / (ii) / (iii) push | -2.8 / -3.8 / -7.4 ms |
