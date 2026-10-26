---
title: "Why the test suite keeps growing and slowing"
description: "Measured causes of the suite's growth and slowdown since the one-proof rule, with the mechanisms, the evidence and the guards that miss them."
---

# Why the test suite keeps growing and slowing

Owner goal 2026-10-25 23:10 (TEST plan, section "Owner decision 2026-10-25 23:10"): find, with evidence, why the suite keeps getting slower and larger. Measured on `fg-server2` (24 cores) on 2026-10-25/26. Raw data sits in TEST's scratchpad (`f14b/`, `f14c/`, `g1/`), and the numbers below are copied from it.

## Answer in one paragraph

The suite no longer grows in Node tests. It grows in Rust tests, which no guard counts, and it slows because **each test costs more, not because there are more tests**. The extra cost is product cost that every test pays. Since the Event Store cutover, every Work read and write is a series of `git` processes, and since Git containment every `git` process starts inside its own `bwrap` PID namespace. Namespace creation gets slower under the suite's 24-way parallelism (16–18 ms per contained call against 2.4 ms for plain git). A second, separate cause makes results and cost depend on who starts the suite: `buildTestEnv` copies the caller's whole environment and removes a hand-kept deny-list, so each new environment-sensing feature (HOME, PATH, herdr) leaks into the suite until someone notices. The `suite:` line prints the wall time against a baseline, but nothing acts on it.

## 1. Size: the Node count holds, Rust grows unseen

`git grep` at first-parent main commits (`test()`/`it()` calls in `test/**/*.test.mjs`; `#[test]`/`#[tokio::test]` in `*.rs`):

| Date | Node test files | Node `test()` | Rust tests |
|---|---|---|---|
| 09-01 | 229 | 4371 | 221 |
| 10-01 | 420 | 7520 | 450 |
| 10-20 (one-proof rule) | 573 | 8049 | 1428 |
| 10-24 | 601 | 8014 | 1927 |
| 10-25 23:00 | 612 | 8085 | 2286 |

- From 10-20 to 10-25 the Node count moved +0.4% while CFG Slice C, identity I4, the Event Store cutover and the mailbox landed. The rule and the clone ratchet work for Node.
- Rust tests went +60% (+858) in five days: mailbox +286, yaml-doc +108, git +97, config +95, identity +90, apps/fgos +46, event-store +42. Most of this is new crates (new product areas, or Node areas moved to Rust). The `suite:` line, the baseline and the H1 brief line count only Node `test()` calls, so this growth is reviewed by nobody as a whole.

## 2. Time: the same number of tests got heavier

Four full profiles on fg-server2 (`scripts/test-timing.mjs profile`; junit per test case):

| Profile | Cases | Sum of case seconds | Cases ≥ 1 s | Cases ≥ 10 s | Wall | CPU user+sys |
|---|---|---|---|---|---|---|
| 10-21 `0e7be44a2` | 8750 | 5871 | 1339 | 80 | 418 s | 4842 s |
| 10-24 `4688c735e` (before Work cutover) | 8681 | 4938 | 1161 | 62 | 392 s | – |
| 10-24 `d884f1fbc` (after cutover) | 8673 | 7473 | 1644 | 100 | 593 s | – |
| 10-25 `7dc527a8c` | 8747 | 9092 | 1766 | 163 | 660 s | 6743 s |
| 10-25 `0cade91e3` (herdr fix) | 8748 | 9611 | 1776 | 195 | 689 s | 6751 s |

- Case count is flat; CPU is +39% since 10-21, and 103 cases crossed 10 s between the morning of 10-24 and 10-25 (sum 1483 s; largest in `operation-choice`, `loop`, the `fgos-approve*`, `fgos-post-merge*`, `fgos-edit*` CLI files, `agy-permissions`, `dir-resolution`, `fgctl-init*`).
- Static counts of heavy test mechanisms barely moved from 10-21 to 10-25 (`git init`/`initRepo` 513 → 471, CLI spawns 332 → 351, `initStore` 153 → 149, `bwrap` mentions 593 → 614, all `spawn*`/`execFile*` 2094 → 2023). **The tests did not get heavier; what they call did.**
- The two 10-25 runs differ only by the herdr fix and burn the same CPU (6743 vs 6751 s). Whole-suite wall is CPU-bound, and per-file times of CLI files move ±30–40% with their neighbours, so wall time alone is a noisy measure; CPU seconds are the stable one.

## 3. Mechanism A: every store operation is many contained git processes

Exec counts (`strace -f -e trace=execve`; load-insensitive):

- One trivial in-process test (`test/intake/plan.test.mjs` "resolvePlan throws a validation StoreError for an unknown id") spawns **37 `git` and 32 `bwrap`**. Of the git calls, 12 are `git config`, 4 `git var GIT_CONFIG_*` and 5 `rev-parse`: repeated per-operation probes.
- One `fgos list` (installed release, main checkout, quiet machine: 0.9 s, 5.4 s when a sync is due) spawns **391 processes: 224 `git`, 141 `bwrap`**. Event Store reads page commits with `rev-list --max-count=256 --stdin` and read objects with `cat-file --batch` 29 + 29 + 14 times and `for-each-ref` 47 times, so **read cost grows with the length of event history**. This is product cost for every user, and it grows with use.
- A random sample of 32 suite files ≤ 60 s (173.7 case-seconds, seed 26) made 4817 `git` and 3634 `bwrap` execs, about 21 contained calls per case-second. Extrapolated to the whole suite, that is about 150 000–250 000 contained git calls per run. The rate is lower in light files and higher in the heavy ones left out of the sample (`test/direct/fgos-read.test.mjs` alone: 1634 git, 1122 bwrap).

Cost per call, measured on a quiet machine (load ≈ 2) with 24 threads in parallel, the suite's shape:

| Call | Serial wall | 24-way wall | CPU user / sys per call |
|---|---|---|---|
| `git rev-parse HEAD` | 1.67 ms | 2.38 ms | 0.54 / 0.85 ms |
| `bwrap --unshare-pid … git rev-parse HEAD` | 5.07 ms | 16.4 ms | 1.13 / 4.71 ms |
| `bwrap --unshare-user --unshare-pid … /bin/true` | 4.10 ms | 18.3 ms | – |

Containment adds about 4.5 ms of CPU and about 14 ms of wall to each git call under suite parallelism. That is about 7× the call it wraps, and most of it is kernel (sys) time. At 150k–250k calls, containment alone is roughly 700–1100 CPU-seconds per run (10–16% of suite CPU), plus the wall lost to namespace contention.

**Prior art, not counted twice.** HARDEN's ledger already has R2 (TEST's strace of 10 `addWorktreeSync` calls: 218 bwrap + 249 git; containment was the main cost of a worktree add) and R5 (a seat launch ≈ 1.2 s, about 15 calls of it confined git). OPC's Phase B (one containment domain per typed Git operation, `plans/reports/council-261022-1251-opc-arbitration.md` §4) was designed and deferred. Its triggers were judged on a quiet machine, per operation (worktree add 30–65 ms against a 100 ms bound). New here: the load curve, the `fgos list` count, and the suite-wide extrapolation. Trigger 1 of §4 reads "a measured operation users wait on spends ≥ 15% of its wall time in contained children". `fgos list` (0.9 s) with 141 contained calls at ≥ 1.4 ms quiet overhead each is ≥ 0.2 s (≥ 22%) on a quiet machine, and more under load.

## 4. Mechanism B: the suite inherits whoever starts it

`buildTestEnv` (`scripts/run-tests.mjs`) passes the caller's environment through and deletes a hand-kept list (`NODE_TEST_CONTEXT`, `FGOS_STATE_ROOT`, now `HERDR_*`/`FGOS_HERDR_BIN`). Every product feature that senses its environment therefore enters the suite unasked. Three such leaks were found on 10-25 alone:

| Leak | Effect | Found by | Fix |
|---|---|---|---|
| HOME | `fgctl init` in a fixture ran `doctor --fix` on the real home and wrote `gateway.token` into the real global config | MAIL / CFG (board 16:24) | `isolateHome()`; Slice C removed the token fix |
| PATH | Since Slice C, 533 cases passed only where an assistant CLI is on PATH | HARDEN, `env -i` gate; TEST diagnosis | CFG `b407b3d2e`: refuse a missing default executor at use |
| herdr | From an agent's herdr pane, `detectHerdrPresent()` sent Units through the real herdr server: one `operation-choice` case made 512 herdr calls, 58 s instead of 5.6 s; the file 235 → 90 s | TEST profile, this report | TEST `e3b319a29`: `buildTestEnv` drops `HERDR_*` |

The same suite gives different results and costs on an agent's pane, in HARDEN's `env -i` gate, and in CI. HARDEN's `env -i` gate never saw the herdr cost. Through `isolateHome()` it also hides three pi/omp proofs: `piOmpInstall()` looks under the empty test HOME, so those proofs skip everywhere (routed to MAIL).

## 5. Why the existing guards did not stop it

1. **They count tests, not cost.** The `suite:` line, `test/suite-baseline.json` and the clone ratchet track Node files and `test()` calls. Cost per test, and the spawns a product operation makes, are measured by nobody on a schedule. H1's `--cli-cost` (`fgos --help`, `fgos list`) is a number a brief may quote, never compared against anything.
2. **The wall-time baseline is printed and ignored.** `wallSeconds` 202 s was recorded at `4c4ecded3` on 10-20 without the machine named. Every run since prints `659 s wall (baseline … 202 s)` and nothing fails or warns.
3. **Rust tests are outside every guard.** Neither the baseline, the `suite:` line nor the H1 brief line counts them.
4. **Performance triggers are judged per operation on a quiet machine.** Phase B's triggers (and the R2 re-measure) use single-operation timings, while the suite and real multi-agent machines run at 24-way load, where containment costs 3–7× more.
5. **The test env is a deny-list.** Each environment-sensing feature (HOME, PATH, herdr) leaks until a person happens to run the suite from a different place.
6. **Read cost that grows with history has no budget.** Event Store reads page through history, so `fgos list` and every Work-reading test get slower as events accumulate, and no proof bounds spawns per read.

## 6. What TEST does inside its frame (better, not bigger)

- Done: `e3b319a29` (herdr env), `c4c3b4a82` (mutation clone on a detached gate), `24f4e2a8a` (instruction-audit render on fresh trees).
- Next, in the TEST plan: F14c (batch-plant fixture events and one initialized repo per file, to cut per-test store writes), the HOME item (fixtures set HOME explicitly), F1/H21, F16, and the pi/omp skips with MAIL.

## 7. Questions for the owner (decision-question form)

Sent to `lead:COMMUNICATION` and recorded on the board.

**Q1. Open OPC Phase B (one containment domain per Git operation)?**
- *What is happening:* every git call starts its own `bwrap` PID namespace. Under 24-way load each costs about 14 ms of wall and 4.5 ms of CPU more than git itself. `fgos list` makes 141 such calls. The suite makes roughly 150k–250k per run.
- *Cause:* PerChild containment (Phase A). Phase B was deferred on triggers measured per operation on a quiet machine.
- *Options:*
  - (a) Open Phase B now. Cost per the arbitration: ~400–600 Rust src lines, ~300 test lines. Gain: Land −114 ms, worktree add −45 ms, and most of the per-call containment cost of reads.
  - (b) First cut the number of contained calls per operation: config/var probes cached per operation, Event Store reads that do not walk history. No new mechanism (HARDEN T2/T4 or OPC).
  - (c) Keep as is.
- *Recommendation:* (b) then (a). (b) is "better, not bigger" and also cuts plain git cost; (a) remains a new mechanism that needs the owner.
- *Scope of the answer:* Git containment and Event Store read paths; owners OPC (Git review) and HARDEN.

**Q2. Make the suite env an allow-list?**
- *What is happening:* three env leaks in one day.
- *Cause:* `buildTestEnv` is a deny-list.
- *Options:*
  - (a) Allow-list: PATH, HOME (isolated), the locale and TMP variables, the suite's own `FGOS_*` keys. A test that needs more sets it explicitly.
  - (b) Keep the deny-list and add keys as they are found.
- *Recommendation:* (a). TEST can do it inside its frame; it touches only `scripts/run-tests.mjs` and the tests that relied on inherited env.
- *Scope:* suite infrastructure only.

**Q3. Give the cost signal teeth?**
- *What is happening:* the wall baseline is printed and ignored, and Rust tests are uncounted.
- *Options:*
  - (a) Extend the existing `suite:` line, no new tool: count Rust tests too, record CPU seconds as well as wall, and warn, without failing, when CPU per case rises more than 15% over the baseline, naming the top files that moved.
  - (b) Same, but fail the run.
  - (c) Leave it printed only.
- *Recommendation:* (a). A warning that names files puts the rise in front of every lead without making gates flaky on a shared machine.
- *Scope:* `scripts/test-proof-inventory.mjs`, `test/suite-baseline.json`, `scripts/run-tests.mjs`.

## Not yet proven

- The extrapolated containment share (10–16% of CPU) comes from a 32-file sample without the heaviest files; a full-suite exec count would tighten it.
- The rise from 10-21 to 10-24 morning (392–418 s) to the cutover (593 s) is attributed in the 10-24 F14 analysis to the native store's per-write cost. This report adds the mechanism (contained git per store operation) but has not re-run old commits with exec counts.
