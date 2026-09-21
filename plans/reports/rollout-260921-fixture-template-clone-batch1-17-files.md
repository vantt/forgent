# 3.11 rollout batch 1: 17 CLI test files, `tmpCwd` → `tmpCwdFromTemplate`

**Date:** 2026-09-21
**Follows:** `plans/reports/pilot-260921-fixture-template-clone-vs-subprocess-init.md` (single-file pilot, ~22% wall-clock)

## Scope

17 of the ~30 CLI test files using the shared harness's `tmpCwd()`, restricted
to files with **zero** explicit `['init'` argv references (i.e. none test
`fgos init`'s own behavior — same eligibility rule the single-file pilot
used). The remaining ~13 files (`fgos-setup.test.mjs`, every
`fgos-approve*.test.mjs`, every `fgos-post-merge*.test.mjs`,
`fgos-intake-2/4/7.test.mjs`, `fgos-decision-kind.test.mjs`,
`fgos-disconnected-worktree-guard.test.mjs`) reference `['init'` and were
left untouched — each needs individual review to confirm whether that
reference is incidental argv or an actual test of init's own behavior,
not a blind batch swap.

Batch: `fgos-read.test.mjs`, `fgos-read-2.test.mjs`, `fgos-read-3.test.mjs`,
`fgos-edit.test.mjs`, `fgos-edit-2.test.mjs`, `fgos-edit-3.test.mjs`,
`fgos-stage.test.mjs`, `fgos-stage-2.test.mjs`, `fgos-stage-3.test.mjs`,
`fgos-intake.test.mjs`, `fgos-intake-3.test.mjs`, `fgos-intake-5.test.mjs`,
`fgos-intake-6.test.mjs`, `fgos-post-merge-2.test.mjs`,
`fgos-gate-approve.test.mjs`, `fgos-decision.test.mjs`, `coordination.test.mjs`
(328 tests total). Only bare `tmpCwd()` call sites were swapped; every
file's own `rawTmpCwd()` call sites (pre-init-state tests) were left as-is.

## Measurement

Whole batch run together (`node --test <17 files>`), 3 samples before, 3 after,
same machine state.

| | wall (3 samples) | median | user (samples) | median |
|---|---|---|---|---|
| Before | 41.89s / 40.32s / 40.82s | 40.82s | 412.27s / 406.26s / 409.55s | 409.55s |
| After | 31.08s / 30.51s / 30.42s | 30.51s | — / 297.67s / 296.54s | 297.1s |

Wall-clock: **-25.3%**. User-CPU: **-27.5%**. Both well above this track's
minimum accepted effect (baseline wall range 1.57s, 2× ≈ 7.7% of median —
25.3% clears it comfortably). Test count identical before/after (328/328),
0 failures. A separate full `node --test test/cli/*.test.mjs` run afterward
(962 tests, the whole CLI suite, not just this batch) also passed clean —
no cross-file interaction issue from the swap.

## Disposition

**Kept.** Consistent with the single-file pilot's ~22%, confirming the
mechanism generalizes across files, not a one-file fluke.

## Remaining risk / explicit deferred work

- ~13 files referencing `['init'` left untouched — need individual review,
  not a blind swap, before any further rollout.
- Files defining their own **local** `tmpCwd()` (not importing the shared
  harness's) are entirely out of this rollout's reach — a separate,
  pre-existing duplication issue.
- This measurement invoked `node --test <17 files>` as one call, the same
  shape `scripts/run-tests.mjs`'s `buildTestArgv`/`spawn` uses for the real
  `npm test` (one `spawnSync` with every discovered file as argv) — so the
  measured effect reflects the real full-suite invocation shape, not a
  synthetic one. Whether `node --test`'s own internal worker isolation lets
  `fgosTemplateDir`'s per-process memo carry savings across files within
  that one invocation, or each file still pays its own one-time template
  build, was not verified here — the wall/user numbers above are the actual
  measured result either way.
