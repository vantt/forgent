# E3 push p95 variance: 193 ms vs 146 ms between clean rounds

Date 2026-10-22. Branch git/followups. Status: cause found, host NVMe state; no product code changed.

## Verdict

Not a product regression, not remote-repo growth, not CPU frequency or core type. The push time follows the **fsync latency of the NVMe (Samsung 980 PRO, ext4)**, which flips between two stable modes on this host: **5.2 ms** and **7.5 ms** per 4 KiB write+fsync. In the 7.5 ms mode the same binary and fixture push at about 190 ms; in the 5.2 ms mode at about 141 ms. The flip happens without any change in our code or load, sometimes in the middle of a run. A push with no new objects does 13 fsyncs (subprocess census, identical in both rounds), so the gap is a durability-floor effect.

## Evidence

Tool: `node scripts/git/e3-bench.mjs push-only` (new mode, reuses the bench's push fixture; `--rounds N --pushSamples N`), release artifacts from the landed build, governor `performance`, every round started at 1-min load < 2.5, root on ext4 `/var/tmp`.

1. Bimodal, not drifting. 8 separate processes, 1 round x n=100 (push without objects p95 / push with objects p95): 253 (one noisy), 146, 149, 146, 145, **195, 197, 193** (rounds 6-8: 190-ish p50). Later 4 more: 194, 145, 146, 146. One process running 8 consecutive rounds: 146, 146, 145, 145, **195**, 187 (mixed), 146, 145. So the level changes between rounds of the same process on the same binary and fixture. This reproduces the clean-rerun pair (193.4 vs 145.7): both are the two modes.
2. Remote repo growth ruled out. Remote size 4.26-4.32 MB, 116 loose ref entries, 0 packs in every round, fast or slow. Each round builds fresh repos, so nothing accumulates; the slow mode appears in round 1 and in round 8 alike.
3. CPU frequency ruled out. Mean MHz at round start/end: slow rounds 2522/2740, 2742/2470, 2197/3022; fast rounds 3507/3506, 2377/3355, 2878/3012. Same range in both modes (`performance` governor, hybrid i7-13700 reading is noisy per sample).
4. Core type ruled out as the cause, and a control. `taskset` P-cores 0-15: 132 (fast), 182 (slow), 182 (slow), 132 (fast) -> both modes still occur; pinning to P-cores is also about 10 ms faster in the fast mode (128.7 vs 140.9 p50). `taskset` E-cores 16-23: 4 of 4 fast (149-151), slower than P in the fast mode but never in the slow mode (4 samples only). So core type moves the level by ~10-15 ms, not the 45-50 ms step.
5. The step is fsync latency. 14 paired rounds, a plain Python probe (200 x pwrite 4 KiB + fsync on `/var/tmp`, no git, no node) before and after each round:
   - rounds 1-7, 12-14: probe 5.15-5.26 ms, push p50 140.3-141.5 ms.
   - round 8: probe 5.21 before, 7.47 after; push p50 189.3 (flipped during the round).
   - rounds 9-10: probe 7.40-7.77; push p50 141 with p95 198 (flip into slow mid-round) and 189.9.
   - round 11: probe 7.61 before, 5.24 after; push p50 144.7, p95 189 (flip back mid-round).
   The probe tracks the push level in every round, including both mid-round flips.
6. strace -f -ttt -T of 6 runs of 1 round x n=30 (`st-1..6.log`, strace inflates absolute times): runs 1-2 slow (p50 273), runs 3-6 fast (p50 222). Same syscall counts in both (clock_nanosleep 2 ms poll steps: 376-388 per run; wait4/waitid about 12,700 per run; 4,282 fsyncs per run). fsync latency per call: slow runs mean 8.0 / 7.85 ms (p50 7.6 / 7.5), fast runs 5.36-5.39 ms (p50 5.14-5.16). Total fsync time 34.3 s / 33.6 s vs 23.0 s. Process-exec and bwrap gaps also grow in the slow runs, but they sit directly behind fsyncs (the next child starts only after the WAL fsync returns), so they are the same wait seen from the other side. Per-step wall clock was not separated further.
7. Other candidates: receive-pack connectivity checks and maintenance: constant (`rev-list --not --all`, `maintenance run --auto --detach`, a few ms, same in both). Remote loose objects: constant. Another session's I/O: loads were comparable (1.9-2.8) in both modes; a probe that never touches git shows the same two levels, so the flip is on the device/filesystem path. The trigger is not identified (see open questions).

Arithmetic: +2.3 ms per plain fsync x 13 push fsyncs is about 30 ms. The observed step is about 49 ms. The remainder is plausibly the costlier fsyncs (new files and renames, which need a journal commit with more than one device flush, so they move by more than the probe's overwrite+fsync). This is an inference; I did not measure per-fsync latency by kind.

## Why the budget sits on the edge

Fast mode p95 is 145-147 ms against the 150 ms budget (about 3% headroom); slow mode is 193-198 ms. The existing amendment for the changing CAS (2026-10-19) already says the floor is the ten durable record installs at 5-10 ms each. Push with objects (250 ms budget) passes in both modes (150 / 198 ms); only push without objects (150 ms) flips verdict.

## Options (owner picks; nothing changed)

1. Set the push-without-objects budget from the fsync floor, as was done for the changing CAS: for example p95 <= 200 ms on the owner's host class, and have the bench record the fsync probe next to the verdict (same idea as the 2026-10-19 measurement condition). Gain: stable verdict, no product change. Cost: budget loosened by 50 ms against the original 150.
2. Keep 150 ms and make the verdict conditional on the recorded probe: judge only when probe p50 < 6 ms, otherwise report "host in slow-fsync mode, not judged". Gain: keeps the number honest. Cost: a run can be unjudged.
3. Product side: fewer fsyncs per push (13 now). Not evaluated here: it needs a read of the transfer WAL sequence (Intent, pin, start, outcome records) against the signed ordering rules, and RUL104 says no new mechanism. Each fsync removed saves about 5 ms in fast mode and 2.3-4 ms more in slow mode. Mention only; not proposed without the owner's call on the durability rules.

## Small fix made

`scripts/git/e3-bench.mjs`: ScopedCommit is judged `passed` by p95 <= 250 ms and Land by p95 <= 1.6 s (`budgetP95Ms` in the row); `p95Ratio` is still printed. Census regenerated (`mutation-census.v1.json`), `test/git/e3-census.test.mjs` green. Commit f1c76f063.

## Owner decision 2026-10-22: judge by disk state

Option 2 chosen. `e3-bench.mjs` now runs a plain 4 KiB write+fsync probe (p50 of 200) before and after the push row; the round is `fsync-fast` only if both probes are within 1.2 x the lowest probe the process has seen (the floor, so no host number is hardcoded; 1.2 sits between 1 and the observed 1.44 ratio). The 150 ms and 250 ms budgets apply only to fsync-fast rounds; a slow round reports p95, `p95OverBudget` and the probes with verdict `not-judged: fsync-slow`. Limit: a process whose probes are all slow has a slow floor and is judged as fast; rerun when push p95 is high and the probe reads above the usual 5.2 ms. Budget table updated in `e3-budgets.md`; classification and verdict covered in `test/git/e3-census.test.mjs`.

## Open questions

- What flips the device between 5.2 and 7.5 ms? Candidates: NVMe APST (`default_ps_max_latency_us` is 100000 here, so deep states are allowed), controller thermal/SLC-cache state (temps read 43.9 / 53.9 C when I looked, not logged per round), or another session's writes. Not tested; needs root `nvme smart-log` or a temperature log next to the probe.
- The probe only shows the mode; I did not run the NVMe through a longer idle-versus-busy test.
- Whether 13 fsyncs per push is the minimum under the signed WAL ordering.

Raw rows and scripts: `/home/vantt/.claude/jobs/e1505f04/tmp/pv/` (`*.jsonl`, `corr.out`, `st-*.log`, `probe.py`).
