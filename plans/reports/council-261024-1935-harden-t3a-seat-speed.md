# HARDEN T3 part 04a council: speed seat

HEAD `330c5242a`, branch `main`. Seat: speed and weight. Read-only; nothing under `.fgos/` or in the repo was written. A throwaway Rust bench and Node probes live in the session scratchpad and a private target dir (`/home/vantt/projects/forgent-worktrees/t3a-seat-speed-target`, ext4).

## What I ran

- Read-only host verbs only: `fgos metrics ping|coverage|runs|harness`, `fgos friction ping|list|rank`, each with `</dev/null`. `metrics snapshot` and every writing verb were not run.
- `strace -f -c` on `metrics ping/coverage/runs/harness`.
- 10 runs of each metrics verb with `/usr/bin/time` (12 for the friction verbs).
- A Node probe calling the doctor's two coverage halves (`scanAssignmentLayout`, `projectRunEligibility`), 10 runs.
- `invokeHost` under `strace -e trace=execve` for 1 and 11 calls.
- `cargo test -p fgos-observe --test store_lock_multiprocess`, each test timed alone.
- A micro-bench that parses the 531 real `result.json` files four ways.

Load average:

| Measurement | Load average |
|---|---|
| strace counts | 37 to 39 at start, falling quickly |
| The 10-run timings of the three slow verbs | 32 falling to 21 (24 cores) |
| Node probe | about 11 |
| Rust bench numbers quoted below | 4 to 6 |

Timings of the three slow verbs match the baseline taken at load 2.5 (coverage 1.05 s, runs 1.27 s, harness 1.33 s). The work is single-thread CPU-bound (user time is 97 to 98 % of wall), so load did not move it. Syscall counts do not depend on load.

## Part B: why `metrics coverage`, `runs`, `harness` cost 1.0 to 1.4 s

**S-1 (axis: speed; severity: high; reproduced).** The cost is JSON parsing of `result.json`, not the directory scan.

- `packages/run-result/rust/src/lib.rs:568` parses every `result.json` completely into a `serde_json::Value` through `from_reader(BufReader(File))`. The only fields kept are about ten small ones (`run_observation`, lib.rs:640 and following, plus `derive_legacy_outcome`, lib.rs:255 and following).
- The tree holds 531 `result.json` files totalling 294 645 246 bytes (median 934 KB, max 944 KB). In all 531 files the key `evidence` is the last key and holds about 71 % of the bytes. (The 71 % is measured on a re-serialised copy, so it is approximate.) I could not find any reader of that field in the scan path. `coverage` reads only `runId`, `unitRunId`, `settledAt` and `timestamp`.
- strace of `metrics coverage` against `metrics ping` (a bare route): 63 606 syscalls against 1 608.

| Syscall | Calls | What it is |
|---|---|---|
| `read` | 38 116 | 295 MB through an 8 KB `BufReader`, about 72 reads per run |
| `openat` | 5 319 | 531 result files, about 4 160 `read_dir` calls, the rest unattributed |
| `getdents64` | 8 314 | two per directory walked |
| `statx` | 1 091 | one `symlink_metadata` per `result.json`, plus `assignment.json` |

- Timings, 10 runs, load noted above:

| Verb | Wall min / median / max (s) | Mean user (s) |
|---|---|---|
| `metrics ping` | 0.00 (a few ms) | n/a |
| `metrics coverage` | 1.06 / 1.07 / 1.13 | 1.03 |
| `metrics runs` | 1.27 / 1.31 / 1.56 | 1.24 |
| `metrics harness` | 1.32 / 1.34 / 1.37 | 1.21 |

- Micro-bench over the 531 real files, 6 runs each, load 4 to 6; the figures I rely on are the "from_reader" and "typed from_slice" rows:

| Shape | Time |
|---|---|
| `Value` via `from_reader(BufReader)` (what the scan does now) | 0.97 to 1.01 s |
| `Value` via `from_slice` | 0.55 to 0.56 s |
| Small typed struct, `from_slice` (the large `evidence` field skipped, not built) | 0.127 to 0.143 s |
| Reading only the first 16 KB of each file | about 2 ms |

  So the same scan, with the same 295 MB read, costs about 7.5 times less when it parses only the fields it uses. The directory walk is not the cost (S-3 below). I did not time a cold page cache; the data was warm.

**S-2 (axis: speed; severity: medium; reproduced).** The work is not repeated inside one call, but the doctor row pays it twice per run and the window does not prune it.

- One walk per call: `getdents64` is 8 314 for `coverage`, 8 505 for `runs` and 8 527 for `harness`, which is one walk each. `runs` and `harness` are the same scan (`runs.rs:97` and the `sources` loop in `harness.rs`) plus extra sources:
  - `runs` adds transcripts (about 6 000 more reads, in 128 KB chunks) and unit summaries, which is about +0.25 s;
  - `harness` adds git-tracked-file counting, which is about +0.3 s.
- `--since` and `--until` do not prune the scan. `RunResultSource::observations` (`run-result/rust/src/lib.rs:358`) calls `scan_runs` and filters afterwards. I measured `runs --since=2026-10-24` at 1.23 s wall (user 1.14) and a one-hour window at 1.19 s, against 1.31 s unfiltered.
- The doctor row `observe-run-coverage` (`src/setup/registrations.mjs:6138`, host call at line 6143) is the only Node caller of `metrics coverage`. Every doctor run pays:
  - the host call, about 1.05 s, which parses 295 MB;
  - `projectRunEligibility` (`src/runner/dispatch/assignment-layout.mjs`), which does `JSON.parse(fs.readFileSync(...))` of every `result.json` again to compare with the host. Measured 463 to 485 ms over 10 runs, with the directory layout part only 24 to 29 ms.
  - Total about 1.55 s for one row, and the whole 295 MB is parsed twice.
- The host call has a hard 5 s timeout (`src/util/host-bin.mjs:10`, used at line 99). A timeout turns the row into `run coverage unavailable`, not a slow pass. Cost is linear in the number of runs (about 2 ms each now, and each new run adds about 0.9 MB), so the margin is about 5 times today and shrinks as history grows. There is no pruning or size cap on `result.json` in this scan. The sibling unit-summary reader does have one (`MAX_UNIT_SUMMARY_BYTES`, `unit_summary.rs:12` and `:125`).

**S-3 (axis: speed; severity: low; reproduced).** The "445 directories" scan is bounded and cheap. The walk visits 4 157 directories outside `runs/` (445 at depth 1, 855 at depth 2, 710 at depth 3, 1 710 at depth 4, 436 at depth 5) and 535 run attempt directories, with `MAX_ASSIGNMENT_DEPTH` 16 (`lib.rs:445` and following). Node's layout walk over the same tree takes 25 ms and the host's syscall time for it is about 13 ms. Per walked directory it is about 5 syscalls (open, two `getdents64`, fstat, close). Do not touch the walk rule: Node and Rust share it by design through `test/fixtures/run-layout/expected.json`.

**Fix shape for S-1 and S-2 (inside existing code, no new feature).**

1. In `scan_assignment_runs`, read the file once into a byte buffer and deserialize it into a small typed struct holding the keys the scan uses, with `evidence` skipped. Measured gain: about 1.0 s down to about 0.13 s of parse.
2. Do the same on the Node side in `projectRunEligibility`. That brings the doctor row to roughly 0.25 to 0.3 s in total.
3. A prefix-only read (about 2 ms) is possible because `evidence` is last in all 531 files. It relies on key order written by Node's `JSON.stringify`, so I would not take it without a written writer contract; the typed read does not need one.

   Ordering for the receiver: the typed read is the same change as S-1 and has no layer dependency (run-result is a lower component, T3 may take it). Whether to also add a size cap, as unit summaries have, is for the owner.

## Part B (continued): Observe's Node paths

**S-4 (axis: speed; severity: low; reproduced).** `friction-client.mjs` spawns once per record, and that is cheap.

- `strace -e trace=execve` on `invokeHost`: 1 call gives 2 execves (node plus host), 11 calls gives 12. So exactly one host spawn per call. `resolveMainCheckoutRoot` and `resolveHostBin` spawn nothing (0.4 to 0.5 ms median each, in process).
- One `invokeHost(['metrics','ping'])` takes about 3 ms median (12 runs, load about 8). Read friction verbs on the host: `ping` 10 ms, `list` 30 ms, `rank` 10 ms median wall. Writes will be a little more; I did not run them.
- Call sites: `src/verbs/merge/approve.mjs` (about 17 sites), `sync-root.mjs` (7), `src/runner/loop.mjs:1179`. They are error and decision paths, not tight loops. No batching is needed for speed.
- Weight, not speed: the client re-lists the published layers, dispositions, doc types and reasons (`friction-client.mjs:12` to `27`), which are constants in Rust `friction.rs:20` to `30`. The Node copy only saves a spawn on bad input. A thin client is: build args, pass detail on stdin, call `invokeHost`, fault-log and warn on failure, which is about 60 of the 194 lines. This is the Observe seat's call; I only confirm that removing the Node validation costs nothing measurable.

**S-5 (axis: tests/speed; severity: medium; reproduced).** `store_lock_multiprocess.rs` is 35 s of pure sleep guarding a mechanism that no longer exists.

- Each test timed alone: `a_write_longer_than_the_old_expiry_is_not_stolen` 35.01 s, `a_taker_times_out_after_five_seconds_on_a_long_holder` 5.01 s, `a_taker_waits_for_a_holder_that_releases` 1.01 s, the other two under 0.1 s. Cargo runs them in parallel, so the file's wall time is the longest one, 35 s.
- The long test (`store_lock_multiprocess.rs`, the test named in S-5) spawns a holder for 35 000 ms, then does `std::thread::sleep(31 s)` and then waits out the remainder. That is a fixed sleep, not a condition poll, so the 35 s is real wall time on every run.
- `store_lock.rs:1` to `5` says the lock is a kernel lock through `fgos-holder-lock`: "a killed holder frees it at once, so there is no expiry". The test checks that a live holder keeps the lock "past the old 30 s expiry". The old expiry went away in commit `8549e77f1`. Exclusion by a live holder is already proved by `a_taker_times_out_after_five_seconds_on_a_long_holder`, and the kernel-lock behaviour is owned by `packages/holder-lock/rust/tests/multiprocess.rs`.
- Fix shape: retire the 35 s test (the behaviour it names is gone) and name the surviving owning test in the commit. The 5 s timeout test can run on `acquire_store_lock_within` with a short wait; the 5 s constant is a value, not a behaviour.
- I did not read `holder-lock`'s tests in full, so the claim that it owns "a live holder is never stolen" is inferred from file names. The Observe seat or the test seat should confirm before the delete.

## Tables

### Migration (speed lens only)

| Node part | What it decides | Move? | Reason | Order | Receiving layer | Node budget after |
|---|---|---|---|---|---|---|
| `projectRunEligibility` and `readJson` in `src/runner/dispatch/assignment-layout.mjs` (doctor row second implementation) | which run dirs are admissible; compared with the host | Do not move. Make it parse only what it needs, or drop the full re-parse, once the owner judges the doctor's second implementation (baseline §6 item 5) | The doctor's independence is on purpose (`docs/specs/observe.md`). Speed fix is the typed or partial read, not a move | after S-1 | T3 | no net change in lines |
| `friction-client.mjs` validation constants | publish layer, disposition, doc-type and reason sets | Delete, Rust already owns them | Duplicate; no measurable cost to remove | with the Observe seat's client change | T3 | about 60 lines |

### Delete list

| Item | Why | Replaced by |
|---|---|---|
| `a_write_longer_than_the_old_expiry_is_not_stolen` | tests an expiry that was removed (`8549e77f1`); 35 s of sleep | `a_taker_times_out_after_five_seconds_on_a_long_holder` and holder-lock's multiprocess test (to confirm) |

### Doctor

| Row | Cost now | Note |
|---|---|---|
| `observe-run-coverage` | about 1.55 s (host 1.05 s plus Node 0.5 s), two full parses of 295 MB, under a 5 s host timeout | Keep the row. Cut the cost by the typed read on both sides (S-1, S-2). No new row |

### Tests

| Behaviour | Owning proof | Note |
|---|---|---|
| A live holder keeps the observe lock | `a_taker_times_out_after_five_seconds_on_a_long_holder` | the 35 s test adds nothing |
| Time-based waits in this file | 35.01 s, 5.01 s, 1.01 s | only the 1 s and 5 s tests assert a real wait; the 35 s one is a pure sleep |
| Run admission accounting, Node against Rust | `test/fixtures/run-layout/expected.json` fixture | shared on purpose; unchanged by the speed fix |

## Proposed additions

None. S-1 and S-2 are changes to existing parsing, not new features. A size cap on `result.json` (like unit summaries have) would be a new rule; I list it only as a question for the owner. Problem: unbounded read of a worker-written file. Evidence: the unit-summary reader caps at 1 MiB, the run-result scan has no cap. Benefit: a bound on the worst case of the 5 s doctor timeout.

## Rejected hypotheses

- "The directory scan over 445 directories is the cost": rejected. Walk is about 25 ms on the Node side and about 13 ms of syscall time in the host, against 1 000 ms or more of parsing.
- "The scan runs several times in one call": rejected. One walk per call (`getdents64` counts).
- "Load made the numbers": rejected. User CPU is 97 to 98 % of wall, and the figures match the baseline taken at load 2.5.
- "friction-client spawns the host several times per record, or runs git": rejected. Exactly one execve per call, and the root resolution is in process.
- "`--since` makes `runs` cheaper": rejected, measured above (1.19 to 1.23 s against 1.31 s).

## Not measured

- Cold page cache for the 295 MB tree.
- The writing friction verbs.
- A full `fgos doctor` run (the row cost is the sum of its two measured halves).

Status: DONE
Summary: The 1.0 to 1.4 s is JSON parsing of 295 MB of `result.json` (71 % of it an unread `evidence` field) through `Value` plus `BufReader`, not the directory scan; a typed read measures about 7.5 times faster, and the doctor row parses the same data twice (about 1.55 s) under a 5 s host timeout. The 35 s lock test is a fixed sleep guarding a removed expiry, and `friction-client.mjs` costs one cheap spawn per record.
Concerns/Blockers: The claim that holder-lock's own tests cover "a live holder is never stolen" is inferred from file names and should be confirmed before the 35 s test is deleted. The micro-bench is a stand-in outside the repo, so the 0.13 s figure is an estimate for the real scan, which also does walking and per-file syscalls.
