# Mailbox V2: what a record hold costs, against S0 and the 50 ms hook target

Two runs on the same day: the first with the no-write rule decided by re-encoding the state, the second after that rule was replaced by the core's change report. The verdict below is the first run's; the re-run section updates it.

Plan: [`plans/261022-1005-mailbox-v2-record-store/phase-07-size-ceiling-and-costs.md`](../261022-1005-mailbox-v2-record-store/phase-07-size-ceiling-and-costs.md). Baseline: [S0 H3](research-261020-1612-mailbox-s0-hook-and-record-costs.md) §3. Branch `mailbox/v1-v3`. The example and this report are committed together, so the example's source at that commit is the one measured.

## Verdict

**The steady-state no-mail hold is under 50 ms for the record alone, but with no room left for the host, and it passes 50 ms once registered heads fill the same week. Owner question Q1 is now due.**

- The one-sender steady week (20,140 headers, 7.0 MB): no-mail claim hold p50 30.0 ms, p95 42.5 ms, max 46.6 ms.
- The same week plus 10 registered heads at their lifetime cap: p95 49.5 ms, max 51.4 ms.
- Plus 100 such heads (39,940 headers, 13.8 MB): p50 58.0 ms, p95 64.2 ms. That is over 50 ms.
- 50 ms is the target for the whole hook. The host's own cost per call (S0: p95 6.5 ms for a native verb called directly, 11.3 ms through the shim) comes on top of these record-only numbers. Read with it, even the one-sender week is at or over the target.
- No lever was picked (coordinator instruction). The provisional default of Q1 (a) stands, and the numbers are added to Q1 in the plan.

## Re-run after the hold stopped re-encoding (same day, same machine)

The plan owner (agent) reversed plan decision 3 after the first run. A hold now writes exactly when the core reports a change, and an unchanged hold neither encodes nor compares. Same command, load 1.5 to 1.6. Rows of the first run are kept below for comparison.

| No-mail claim hold | Before p50 / p95 / max | After p50 / p95 / max | Read p50 after | Headers, bytes |
|---|---|---|---|---|
| week-one (one sender's steady week) | 29.95 / 42.53 / 46.56 | **22.63 / 36.83 / 40.80** | 14.62 | 20,140, 6,988,646 |
| week-grid, 10 heads at lifetime cap | 38.28 / 49.46 / 51.43 | **17.18 / 36.01 / 41.28** | 13.49 | 21,940, 7,609,695 |
| week-grid, 100 heads at lifetime cap | 58.02 / 64.15 / 64.56 | **44.11 / 49.68 / 51.98** | 29.47 | 39,940, 13,824,249 |
| **if `bodyRetentionSec` = 86400** (the Q1 recommendation, measured only; the contract value is unchanged): week-one | | **2.17 / 2.20 / 2.21** | 1.81 | 2,880, 1,000,540 |
| (same shorter retention) week-one send | | 8.14 / 29.33 / 39.04 | 2.03 | 2,880, 1,000,540 |
| s0-one | 0.11 / 0.13 / 0.50 | 0.29 / 0.46 / 0.50 | 0.13 | 50 |
| s0-hundred | 5.07 / 5.31 / 5.62 | 4.24 / 4.32 / 4.36 | 3.59 | 5,000 |

Reading:
- **The read of the record alone is now under 50 ms p95 in every week population measured**, though at 100 heads with no margin (49.7 ms).
- The read and parse of the whole snapshot is now the floor: about 14 ms at 7 MB and 29 ms at 14 MB.
- What remains after the read ("after", p50 3 to 15 ms) is mostly freeing the parsed state and releasing the lock. That is an inference: no encode runs on this path any more.
- The host's own cost per call (S0: p95 6.5 to 11.3 ms) still comes on top.
- A one-day header horizon (the recommendation sent to the owner) cuts the steady week to 2,880 headers and 1.0 MB, and the no-mail hold to 2.2 ms.
- Writes are unchanged by the reversal, as expected: they still encode once. Week-one send is p50 53.5 ms, claim+finish 86.0 ms.
- The contended row showed no tail this time (max 0.20 ms against 338.58 ms in the first run). The background sender's interleaving differs between runs, so the first run's tail stands as the observed bound and the hook's 100 ms wait cap is still what limits it.

## Machine and method

- Linux 7.0.0-38-generic, 24 cores, ext4 on NVMe (`/dev/nvme0n1p2`), the same class as S0. The load average is recorded on each row (1.3 to 2.5).
- Command:

  ```text
  cargo run --release -p fgos-mailbox --example mailbox-record-cost -- <worktree>/.fgos/runtime/tmp/mailbox-v2/cost all
  ```

  The example creates its own `.fgos` under that parent and removes it afterwards.
- Each scenario builds its population with core calls in one hold. Then 3 warm-up and 50 measured holds run through the real `Record` API, with S0's nearest-rank percentiles. Before each measured hold, the population's snapshot is put back (untimed), so every sample sees the same population. The contended row is the exception, because a second process keeps writing.
- Steps are stamped by the hold's own observer (`Step`). "after" is the time from the last step reached to the hold's return.
  - For a no-mail claim, "after" is the closure, the re-encode for the no-write byte comparison, the comparison and the lock's release.
  - For a write, "after" is the rest of the hold and the release.
- Policy values all come from `limits.v1.json`. The populations are S0's own, or derived from the ceiling.

## Results (ms)

| Scenario and hold | Headers | Snapshot bytes | p50 | p95 | max | p50 per step | S0 beside it |
|---|---|---|---|---|---|---|---|
| s0-one send | 50 | 18,024 | 6.78 | 9.43 | 9.85 | lock 0.05, read 0.24, core 0.12, body 2.53, write 0.04, fsync 1.18, rename 0.05, dir fsync 1.32, collect 0.10, after 0.26 | H3 N=50: 10.31 / 10.84 / 29.43 |
| s0-one no-mail claim | 50 | 18,024 | 0.11 | 0.13 | 0.50 | lock 0.01, read 0.04, after 0.06 | none (S0 measured writes only) |
| s0-hundred send | 5,000 | 1,723,805 | 16.95 | 34.25 | 39.97 | read 4.71, core 1.96, body 2.73, fsync 2.32, dir fsync 1.82, collect 1.12, after 0.59 | H3 100 x 50 (808,801 bytes): 13.43 / 28.31 / 39.52 |
| s0-hundred no-mail claim | 5,000 | 1,723,805 | 5.07 | 5.31 | 5.62 | read 3.29, after 1.77 | S0 read+parse 2.16 at 0.8 MB |
| week-one send | 20,140 | 6,988,578 | 51.46 | 58.61 | 61.45 | read 14.29, core 8.78, body 2.17, write 1.08, fsync 3.56, dir fsync 0.98, collect 3.50, after 15.33 | |
| **week-one no-mail claim** | 20,140 | 6,988,578 | **29.95** | **42.53** | **46.56** | read 14.14, after 14.93 | |
| week-one claim+finish (two holds) | 20,140 | 6,988,578 | 90.99 | 107.05 | 108.07 | (two holds; not split) | S0 inferred about 21 for a drain with mail |
| week-grid, 1 head at lifetime cap, no-mail claim | 20,140 | 6,988,266 | 35.85 | 44.32 | 48.77 | read 14.31, after 21.19 | |
| week-grid, 10 heads, no-mail claim | 21,940 | 7,609,789 | 38.28 | 49.46 | 51.43 | read 15.59, after 22.39 | |
| **week-grid, 100 heads, no-mail claim** | 39,940 | 13,824,211 | **58.02** | **64.15** | **64.56** | read 28.49, after 29.40 | |
| dead-bindings registering hold | 20,240 | 7,069,178 | 42.67 | 56.84 | 60.08 | read 13.67, core 6.99, fsync 3.67, collect 2.12, after 13.55 | |
| dead-bindings claim+finish | 20,240 | 7,069,178 | 81.79 | 99.85 | 102.98 | (two holds) | |
| dead-bindings send (judges every binding for dead names) | 20,240 | 7,069,178 | 44.91 | 57.16 | 62.06 | read 13.81, core 7.00, body 2.15, fsync 3.55, collect 3.37, after 12.74 | |
| contended no-mail claim (a second process sending in a loop) | 50 | 18,025 | 0.11 | 4.41 | 338.58 | lock (acquire) dominates the tail | S0 3.4: a prober waited up to 1,262 |

The week populations are the ceiling's: one sender with no head, at `session.budget` per window, for the header horizon plus two windows. 20,140 headers sit under the derived ceiling `H_sender = 20,180`, and `tests/record_ceiling.rs` asserts that bound. The snapshot costs about 347 bytes per header (6,988,578 / 20,140).

## What dominates

- **Small records are fsync-bound and cheaper than S0.**
  - A send at 50 headers costs p50 6.8 ms against S0's 10.3 ms. The two fsync chains (body, then snapshot) sum to about 5 ms, and the body install about 2.5 ms.
  - The no-mail hold at that size costs 0.1 ms.
- **Large records are parse- and serialize-bound.**
  - At the week's 7 MB, reading and parsing the snapshot costs about 14 ms. The core's work on a write costs about 9 ms (the lazy sweep walks every header).
  - "after" costs about 15 ms. On a no-mail hold that is the re-encode of the whole state for the no-write byte comparison (plan decision 3) plus the release. By elimination most of it is the re-encode, because S0 measured a normal release at about 0.07 ms.
  - Read plus re-encode is the whole no-mail cost, and it grows linearly with the snapshot: 13.8 MB doubles both (28.5 ms and 29.4 ms).
- **Pruning and dead-name judging are not the cost.**
  - The prune checks the cheap "named" and "idle" conditions before it judges liveness, so 100 named dead bindings add little: a registering hold is p50 42.7 ms, against a week-one send at 51.5 ms.
  - The send's dead-name judgement (owner Q2 option B) judges every one of the 103 bindings through `/proc`, and stays within the same range: p50 44.9 ms.
- **Contention.** With a second process looping sends at 50 headers, the measured no-mail hold's acquire reaches 338 ms at the maximum, with p95 4.4 ms. A hook waits at most `mailbox.hook.lockWaitMs` (100 ms) and then skips its drain with `lock-busy`, so the hook would not wait that long. The wait cap bounds only the poll for the lock; it does not bound the read, the parse, the re-encode, or `settle_release` on release.

## One line per scenario against S0 and the 50 ms target

- s0-one: below S0 (6.8 against 10.3 ms p50); the no-mail hold, at 0.1 ms, is far under 50 ms.
- s0-hundred: about S0 for a write (17.0 / 34.3 against 13.4 / 28.3, at twice S0's bytes: this snapshot is 1.7 MB against S0's 0.8 MB); no-mail 5.1 ms, under 50 ms.
- week-one: no-mail 30.0 / 42.5 ms, under 50 ms for the record alone, with no margin left for the host's own cost per call.
- week-grid: 10 heads reach 49.5 ms p95; 100 heads are over 50 ms (58.0 / 64.2).
- dead-bindings: a write is in week-one's range; pruning and dead-name judging add little.
- contended: the tail is lock waiting, which the hook's wait cap stops at 100 ms.

## Measured, not built (for the owner; RUL104)

| Idea | Evidence | Benefit |
|---|---|---|
| Decide the no-write rule from the core's own "changed" answer instead of re-encoding the state (V3 already returns `state_changed` from the drain; `claim` returns `changed`) | "after" is about 15 ms of a 30 ms week-one no-mail hold, and about 29 ms of a 58 ms hold at 100 heads | roughly halves the no-mail hold at these sizes; changes plan decision 3 |
| Q1 options (b), (c) or (d) of the plan | the per-identity and whole-snapshot sizes above | they bound the read itself; it is the owner's choice |
