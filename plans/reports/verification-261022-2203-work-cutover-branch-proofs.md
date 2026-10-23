---
title: "WORK cutover branch proofs: ported proofs, full gate, Work-gate latency, trigger cost, door"
date: 2026-10-22 (Asia/Saigon)
branch: work/es-cutover (tip before this report: b430af365)
---

# Verdict

Not green. The branch has two open items for owners, one of them a blocker for `npm test`:

1. `test/runner/loop.test.mjs` takes about 1150 s on this branch against 295 s on origin/main, so it breaks the 600 s per-file limit and fails the suite. Cause measured, not fixed (section 4).
2. Part (a) misses the 50 ms mark when the gate hold is read as the whole mutex window (65-77 ms). The store increment alone passes (43-44 ms at 10-20 sessions). Numbers only, per the brief (section 3).

Everything else is green or classified.

# 1. Ported proofs

Source: `origin/es/p09-cutover`. Retargeted to today's code; existing owners extended, no case copied twice.

| Proof | Result | Where / run |
|---|---|---|
| V-AUTH-01, symlinked `.fgos` (two processes, two linked worktrees: same `expectedStatus` move; last worker slot, then settle) | PASS 2/2 | `test/event-store/v-auth-01.test.mjs`, solo run 11.6 s |
| V-AUTH-01, worktree with its own `.fgos` (writes through `extraRoots`, ceiling config read from the worktree): exactly one winner, and nothing but `config.json` left in either worktree's `.fgos` | PASS 2/2 | same file |
| Settle fault: ENOSPC and SIGKILL injected at the real `write` of the settle append (ptrace, Linux x86_64). Claim file, cache and history unchanged; next trigger recovers; one attempt event | PASS 2/2 (`injection.containsSettleAttempt` true) | `node scripts/event-store/settle-host-proof.mjs --host`, helper `scripts/event-store/settle-fault.py`. Host script, not in `npm test` (needs ptrace and host PIDs) |
| V-SEQ-01 Work, N1 rebuild busy (bounded attempts, old cache kept, installs only a current candidate) | already owned, PASS | `test/event-store/work-gate.test.mjs` "rebuild installs only a current own-stream candidate..." and "the gate reads its configuration from the trusted main root..." |
| V-SEQ-01 Work, cross-machine conflict incl. 3-origin cascade | already owned, PASS | `test/event-store/work-conflicts.test.mjs` "three independent machine stores...", "a cascade across three machines..." (not duplicated) |

The old-layout "sequence-recovery refusal on settle" case from the p09 file is not ported: `work-gate.test.mjs` "sequence recovery conflict leaves the gate..." owns it.

# 2. Full gate

## cargo

- `cargo test --locked --workspace`: first run 1282 passed, 1 failed, 11 ignored. The failure was a real defect (below). After the fix: **1312 passed, 0 failed, 11 ignored** (222 result lines, exit 0). Logs: `/tmp/claude-1000/-home-vantt-projects-forgent/2334f2ba-b501-4572-a523-2ed479073a55/scratchpad/u8-cargo-test.log` (before), `.../u8-cargo-test2.log` (after).
- `cargo clippy --workspace --all-targets -- -D warnings`: clean (exit 0).
- `cargo fmt --all -- --check`: **red, main's.** 3457 diff hunks on this branch against 3462 on plain origin/main (34059c15d). Installed rustfmt is 1.10.0 (2026-09-28); the tree is formatted for an older one. Not ours, not touched.

## npm test

```
suite: 595 files, 7988 test() calls, 826 s wall (baseline 594 / 7977 / 202 s at 3bf66cb97)
```

Exit 1. The `ERROR` lines and the reds, each classified (a "solo" run is `scripts/run-tests.mjs` on the file alone):

| Red | Class | Evidence |
|---|---|---|
| `fgos_work_state` Rust test `test_view_schema_version_is_the_one_the_node_writer_saves` (6 vs 7) | **ours, fixed** (a7065d65b) | Node writer moved to view schema 7; the Rust reader still trusted 6, so it would have refused every saved view. Reader constant is now 7 and two fixtures read the constant. `cargo test -p fgos-work-state` 10/10 |
| `fgos-coding-knowledge` flow, two `knowledge-canary` tests (`event-store-io: NotFound`) | **ours, fixed** (dc9aebef9) | Fixtures made a bare `git init`; the store needs a machine id and the activation fence. They now use `initializeWorkRepository`. Solo 3/3 pass |
| `test/runner/loop.test.mjs` timed out at 601 s | **ours, open, blocker** | Section 4 |
| `ERROR: test suite left temporary directories behind` (`fgos-loop-test-*`, 70-72 each, `fgos-tp-*`) | consequence of the loop file being killed | Section 4 |
| `terminal: settled-no-result: --resume ...` (`crash-matrix-adopt-resume`, 120 s wait) | flaky under load | Solo run with `provider-capacity`: 64/64 pass |
| `provider-capacity` two account-lock tests (killed holder, own PID namespace) | flaky under load | Same solo run passes |
| `ERROR: product code started git ... scripts/lib/test-git-config-guard.mjs:128: git -C .../fgos-cli-* init -q -b main (272x)` | **unclassified, probably ours** | The 272 spawns match `git('init','-q','-b','main')` in `test/helpers/work-store-release.mjs` (`initializeWorkRepository`, absent from main). The same helper in `fgos-move.test.mjs`, `triggers.test.mjs`, `knowledge-canary.test.mjs` alone does not trip the spy, so the spy attributes the frame wrongly only under some full-suite import order. I did not find the file. Next step: run the suite with the spy log kept (`FGOS_GIT_SPAWN_SPY_LOG`) and read the pid-to-file mapping |

Other `suite:` lines: 2 new CLI/host spawn sites without a `boundary:` reason (`test/event-store/triggers.test.mjs:119`, `test/setup/yaml-parse-failures.test.mjs:142`), 2 new `fgos init` sites without a reason (`test/cli/fgos-setup.test.mjs:145,149`), 12 titles in more than one file. Warnings, not failures; not mine, left.

The baseline `wallSeconds` (202) was not rewritten: no clean full run exists on this branch.

# 3. Part (a): Work gate latency on ext4

Harness: `node scripts/event-store/v-spawn-bench.mjs --work-gate --strace --sessions 1,10,15,20 --seed-items 1000`, fixtures under `/home/vantt/projects/forgent-worktrees/work-es-bench` (ext4, deleted after the run). Raw result: `/tmp/claude-1000/-home-vantt-projects-forgent/2334f2ba-b501-4572-a523-2ed479073a55/scratchpad/u8-work-gate.json`. Run on commit `acbfee571` working tree.

The existing script measured only the bare store gate (synthetic one-type contract, own cache). I added `--work-gate` (committed): every one of the 200 mutations goes through `withWorkState`, so the gate holds the real Work fold, preconditions and the whole-view cache write. Seed: 1000 `work.add` events, 8,460,781 payload bytes (live view is 8.2 MB / 1042 items); the generated seed stands in because the live history sits in the main checkout, which I did not touch.

"Increment" is `readInGate + append + fold + prepareEvents` (the budget definition). "Hold p95" is the whole mutex window including the cache write. Spawns are `clone/fork/execve` between gate begin and end under `strace -f`.

| Sessions | Increment p50 / p95 ms | Hold p95 ms | Cache write p95 ms | Convoy wait p50 / p95 / max ms | Spawns in gate | 200 mutations |
|---:|---|---:|---:|---|---:|---:|
| 1 | 40.3 / **50.2** | 77.0 | 31.7 | 0.3 / 0.4 / 3.7 | 0 | 72.3 s |
| 10 | 22.6 / 43.4 | 65.4 | 27.8 | 136 / 868 / 1512 | 0 | 12.3 s |
| 15 | 23.3 / 44.4 | 71.0 | 29.7 | 241 / 1602 / 2651 | 0 | 12.1 s |
| 20 | 24.0 / 43.1 | 67.7 | 31.8 | 436 / 2385 / 3590 | 0 | 12.2 s |

Reading:

- Script verdict PASS (zero spawns in 200 of 200 windows at every level, 3-4 fsyncs per append, 20-session increment p95 43.1 ms under 50, 200 mutations in 12.2 s under 60 s).
- Increment p95 is 50.16 ms at 1 session, 0.16 ms over; the script only enforces the 50 ms mark at 20 sessions.
- Hold p95 is 65-77 ms at every level because the whole-view cache write costs 28-32 ms p95 (8.5 MB JSON per mutation). If the owner reads "p95 <= 50 ms" as the mutex hold, **part (a) is missed** by 15-27 ms and the cache write is the lever. Stopped there, as briefed.
- Convoy: wait grows roughly as (sessions - 1) x hold. At 15 sessions the p95 wait is 1.6 s and at 20 it is 2.4 s (max 3.6 s). The gate itself does not degrade (hold p95 stays 65-71 ms); the queue does.
- Outside the gate the worker spawns 5 git processes per steady mutation (`gitExecsPerSteadyMutation`: 900-995 git execs between windows over 200 mutations). That is the "spawns outside the gate per mutation" figure for part (b).
- One `strace` run is the benchmark's own trace of all 200 windows per level, not a sampled run.

# 4. Open defect: `loop.test.mjs` is 3.9x slower than main

- origin/main: 98 tests, 295 s file time, mean 3.0 s per test (run on a detached worktree of 34059c15d).
- This branch: 99 tests, mean 11.7 s over the 20 that finished before I stopped the run (extrapolates to about 1150 s). Limit is 600 s per file.
- Same single test (`runOnce logs the "<executorId> ..." announce line`, `strace -f -e trace=execve`): main 191 git processes (160 under bwrap), this branch 627 (521 under bwrap). The extra 436 are `cat-file` (about 210: `-t <same oid>` 96x, `--batch-check -Z` 72x, `--batch -Z` 43x), `symbolic-ref HEAD` 70 against 20, `for-each-ref` 38 against 13. Each costs a contained spawn.
- Likely owner: Event Store reads and ref walks outside the gate going through the git driver one process per object, and one oid probed 96 times in a test. I did not trace the callers; fix is not small and not clearly inside Work code. A cache of the probed oid, or reading objects in one batch, is the first thing to look at.
- The 600 s kill leaves about 70 `fgos-loop-test-*` trees behind, which is a second `ERROR` in the same run.

# 5. End-of-command trigger cost

Repo with a local bare remote on ext4, event-store refspec set, 200 sealed events. `node bin/fgos.mjs list`, 20 runs after 2 warm-ups, interleaved. "With": seal due and push due on every run (one fresh open event aged 5 s, `seal.intervalSec` 1, `sync.intervalSec` 1, 20 of 20 runs advanced the remote refs). "Without": `seal.intervalSec` 86400, `sync.intervalSec` 0.

| | p50 ms | p95 ms | mean ms |
|---|---:|---:|---:|
| without seal and push | 2154 | 3056 | 2180 |
| with seal and push | not recorded | 4694 | 3770 |

The trigger adds about **1.6 s** to the command that pays it. In-process split of the same two steps, 12 repetitions, median: maintenance facts 1 ms, `sealIfDue` with one due event 678 ms (max 688), push 981 ms after a new seal and 1000 ms when nothing is new (max 1078). So the push costs the same whether or not there is anything to send. Defaults are 300 s for both intervals, so a clone pays this at most once per interval per command-that-finds-it-due, not on every command; the common command pays the 1 ms fact read. A command that lands just after the interval pays seal plus push, about 1.7 s, in the foreground. The base `fgos list` at 2.2 s in this fixture is itself slow and is not trigger cost.

# 6. Door check

- `test/event-store/door.test.mjs` 5/5 green with `door-fixtures`, `v-spawn-bench`, `no-spawn-in-gate` (13/13). Its "no product file reads the retired event files or imports a reader of them" test is the reader census, empty.
- `scripts/git-one-door-scan.mjs` reports 5 `unresolved-binary` sites (`bin/fgos.mjs:3480,3624`, `src/runner/merge.mjs:1215,1245`, `src/runner/worktree.mjs:146`: configured invariant-check commands). The committed census already recorded `sites: 5` before this work, so they predate it and none is an Event Store ref site. Not in scope; noted.
- Census and suite baseline regenerated only through `--write-census` and `--write-baseline` (b430af365).

# Commits on `work/es-cutover` (not pushed)

| Commit | Content |
|---|---|
| 375906b47 | `v-auth-01.test.mjs`, `settle-fault.py`, `settle-host-proof.mjs` |
| a7065d65b | Rust Work view schema 7 |
| dc9aebef9 | knowledge fixtures on an activated repo |
| acbfee571 | `--work-gate` bench mode |
| b430af365 | census and suite baseline |
| this report | verification record |

# Cleanup

Removed: bench directory, the detached origin/main worktree (via `fgos worktree remove --delivered-to origin/main` after `git clean -ffdX`) and its cargo target, four temp trees of my killed runs. No bench, strace or cargo process of mine is left. A three-day-old orphan `git`/`pre-commit` pair in `/tmp/fgos-test-run-Tc67io` is not mine and was left.

# Unresolved questions

1. Is the part (a) mark the store increment (passes) or the whole mutex hold (misses by the 28-32 ms cache write)? The spec text for 23.2 item 8 and section 17 should say which.
2. Who owns the git call volume in section 4: Work readers, the Event Store walk, or the git driver? It decides whether the fix goes to U1-U7 owners or to the Git lane.
3. Which test file produced the 272 `init -q -b main` spawns attributed to the config guard frame?
4. The 1.6 s trigger cost sits in the foreground of an owner command. Is that accepted, or should push move off the foreground path? The review question asked this; I measured, I did not decide.
