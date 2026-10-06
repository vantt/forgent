# P02 (Wide-Scope Retest) — Combining The Double-Init Fix Across All `initGitCwdMain()`/`initSessionSafeCwd()` Callers

**Status:** stop, no candidate accepted. Working tree is byte-identical to before this experiment; only this report is new. This retests the hypothesis raised in `hotspot-leak-removal.md` and `fast-fixture-expansion.md`: that the same double-`fgos-init` fix, too small to clear threshold at 4-25 sites, might clear it at a wider scope.

## Scope

Union of every file calling `initGitCwdMain()` (14 files) or `initSessionSafeCwd()` (4 files, 2 overlapping) — 17 distinct test files. Re-ran `scripts/test-proof-inventory.mjs`'s `inventoryRunInitSites` (P00A tooling, unchanged) against all 17:

| Result | Count |
|---|---:|
| Files with ≥1 eligible site | 10 |
| Files with zero sites (no matching call shape) | 7 |
| Total real `fixture-construction` sites found | **67** |
| `process-contract`/`unknown` sites (retained) | 3 (all in `fgos-return.test.mjs`) |

Substituted all 67 sites with the existing `initFgosFixtureInProcess(cwdVar)` helper across the 10 files (same mechanical, already-tested pattern as P01/P02; no new helper code). Syntax-checked all 10 files; import lines added alphabetically per file.

## Measurement — and a real environmental problem

This machine had **heavy concurrent load from other active sessions** during this experiment (`ps aux` showed multiple long-running `claude`/`agy` processes consuming 5-58% CPU each; `uptime` loadavg peaked at 18.3/27.6/16.8 on 16 cores — over 100% saturation). The first 3 before-mutation samples (114.08s, 170.70s, 98.64s) were badly contaminated by this — a 108s spread on a batch that should complete in roughly a minute. Three more before-samples, taken once load visibly settled, came back tight and consistent (73.49s, 67.21s, 62.96s), confirming the first 3 were noise, not real variance in the code under test.

Rather than discard the noisy samples outright, all 6 before-samples and 6 after-samples were kept and reported in full (below) — the point of this section is to show the measurement honestly broke down on wall-clock, not to cherry-pick a favorable subset.

| Metric | Before (6 samples) | After (6 samples) | Median delta | % | Threshold (max(10%·median, 2·range)) | Verdict |
|---|---|---|---:|---:|---:|---|
| Wall (s) | 114.08, 170.70, 98.64, 73.49, 67.21, 62.96 (median 86.06, range 107.74) | 87.43, 148.96, 151.78, 83.55, 64.71, 64.33 (median 85.49, range 87.45) | 0.57 | 0.67% | 215.48 | far below |
| User CPU, process-tree (s) | 423.91, 440.62, 413.64, 393.64, 379.74, 373.97 (median 403.64, range 66.65) | 369.71, 401.61, 410.16, 377.60, 354.93, 351.00 (median 373.65, range 59.16) | 29.99 | 7.43% | 133.30 | below |

**Wall-clock is unusable here**: the sample range (107.74s and 87.45s) is larger than the effect could plausibly be, on both sides — this is exactly the ITR-D09/ITR-D12 scenario ("never sum savings measured... under incomparable load"), and the threshold formula itself correctly reflects that by demanding a huge 215s bar. No verdict can be drawn from wall-clock alone in this window.

**User CPU (process-tree, summed across the whole process tree via GNU `time -v`) is far more robust to scheduling contention** than wall-clock — it measures actual CPU-seconds consumed, not how long the OS scheduler took to grant them. Under this less-confounded lens, the effect is real and directionally consistent: **7.43% reduction**, in the same range as P01's smaller-scope finding (25 sites → 8.76% wall / ~9.5% user CPU). Still below the pre-registered 10% bar.

**Sanity check — minimum-of-set** (a common benchmarking technique: noise only ever adds delay, so the minimum observed sample approximates the least-contended true cost): before-min wall 62.96s vs after-min wall 64.33s — the after set's best sample was actually *slower* than the before set's best sample. This does not support a real win either, though with only 6 samples per side it is not strong evidence against one.

## Why scaling up the scope did not help

Combining 4 sites (P02) → 25 sites (P01) → 67 sites (this retest) did **not** produce a proportionally larger measured effect (1%, 8.76%/9.5%, 7.43% respectively — no clear upward trend with site count). The most likely explanation: the cost removed per site (one subprocess spawn, tens of milliseconds) is small relative to each test's *real* dominant cost — actual `git` operations, `approve`/`merge` business logic, multi-second CLI round-trips (`approve (--github)` alone runs 2.3-10.4s per invocation in these logs). Removing one small fixed cost from many tests that each also carry a much larger, unrelated real cost caps the *relative* improvement at roughly the same percentage regardless of how many tests you touch — it does not compound. This is a genuine, useful negative result: **the double-init pattern is real but structurally small, and no amount of widening its own scope will push it over a 10% bar in this test family.**

## Disposition

**stop**, same as the two narrower attempts. All 209 tests stayed green throughout (both mutated and reverted states) — this was never a correctness risk, only an insufficiently large effect. `git checkout -- .` confirmed a byte-identical revert.

## Handoff

If a future phase wants to actually bank this real-but-small (~7-9% user-CPU) effect, it would need to either (a) accept a lower bar explicitly for CPU-time-only candidates where wall-clock cannot be trusted due to shared-machine noise, or (b) find a candidate whose removed cost is proportional to, not smaller than, each test's other work (P01/P03/P04's other candidate classes are better bets for that). Re-measuring this exact candidate on a quieter, dedicated machine might also produce a cleaner wall-clock reading, but is unlikely to change the CPU-based conclusion, since CPU time is largely independent of contention already.
