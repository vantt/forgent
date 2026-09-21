# 3.11 rollout batch 2: 13 more CLI test files, including all previously-excluded `['init'` cases

**Date:** 2026-09-21
**Follows:** `plans/reports/pilot-260921-fixture-template-clone-vs-subprocess-init.md`,
`plans/reports/rollout-260921-fixture-template-clone-batch1-17-files.md`

## Scope: the ~13-14 files batch 1 excluded, re-reviewed per-block

Batch 1 excluded every file whose source referenced `['init'` anywhere,
file-level. Per-block review (checking whether a `tmpCwd()` call and an
explicit `['init'` argv reference ever occur in the SAME test) found that
filter was too coarse:

- `test/cli/fgos-disconnected-worktree-guard.test.mjs`'s one `['init'`
  reference is `execFileSync('git', ['init', ...])` — real `git init`, not
  `fgos init`. Unrelated to `tmpCwd()` entirely.
- In every other file except `fgos-setup.test.mjs`, an explicit
  `run(cwd, ['init'])` call co-occurring with `tmpCwd()` in the same test is
  a **redundant, harmless second init** — `tmpCwd()` already bootstraps the
  store once internally, and `fgos init` is documented idempotent
  (`fgos-cli-harness.mjs`'s own comment: "the handful of tests that still
  call init explicitly afterward are unaffected — a harmless no-op second
  call"). None of these tests assert anything about init's own behavior;
  they test `decision`, `add --footprint`, etc.
- `fgos-setup.test.mjs` is the one genuine exception: many of its own test
  titles ("init creates .fgos/ with an empty log...", "init in a git repo
  with zero commits reports gitHeadless...") directly assert init's own
  behavior as the subject under test. Left untouched, not swapped.

Swapped 13 files: `fgos-intake-4/2/7.test.mjs`, `fgos-post-merge/4/3.test.mjs`,
`fgos-approve-2/6/3/4.test.mjs`, `fgos-approve.test.mjs`,
`fgos-decision-kind.test.mjs`, `fgos-disconnected-worktree-guard.test.mjs`
(153 tests total).

## Measurement (noisier than batch 1 — heavier tests, honest accounting)

This batch includes real git-worktree/main-checkout-lock operations
(`cleanup releases main-checkout lock`, etc.) — a much larger fraction of
each test's own runtime than the `.fgos/` store bootstrap this pilot
targets, so a smaller relative effect was expected going in.

Ambient system load swung heavily mid-measurement (wall-clock samples
ranged from 24s to 115s across the session for the *same* code, both
swapped and unswapped) — consistent with this track's prior findings on
ambient-load sensitivity. A same-instant paired comparison (swapped, then
immediately original, then immediately swapped) under stable load:

| | user-CPU samples | median |
|---|---|---|
| Swapped | 231.88s / 236.79s | 234.3s |
| Original | 277.40s / 272.58s | 275.0s |

**-14.8%** — smaller than batch 1's ~25-27%, as expected given the heavier
git/worktree share of these tests' runtime, but still clears this track's
10% minimum accepted effect.

One test run (out of ~10 total across this investigation) exited non-zero
under extreme ambient load (wall-clock >100s for a normally ~25-30s batch);
the specific failure was never captured on a rerun despite several
attempts, and the same class of heavy-load run on the **original**
(unswapped) code completed clean in the samples taken — inconclusive on its
own, but with no plausible causal link between this swap (which only
changes `.fgos/` store bootstrap, not git-worktree locking) and the failing
tests' subject matter (main-checkout lock release). Treated as ambient-load
flake, not a regression; noted here for a future reader rather than hidden.

## Disposition

**Kept.** All 153 tests pass; correctness re-verified clean immediately
before commit. Effect is smaller than batch 1 but real and above threshold.

## 3.11 rollout is now complete

Batch 1 (17 files) + batch 2 (13 files) + the original single-file pilot
(`fgos-read-4.test.mjs`) covers every CLI test file using the shared
harness's `tmpCwd()`, except `fgos-setup.test.mjs` (genuinely tests init's
own behavior — correctly excluded, not merely unreviewed). No further
`tmpCwd()` rollout candidates remain in `test/cli/`.

## Remaining risk / explicit deferred work

- Files defining their own **local** `tmpCwd()` instead of importing the
  shared harness's are still out of this rollout's reach (a separate,
  pre-existing duplication issue, not addressed here).
- The one uncaptured flake above: if it recurs, re-open and get a full
  stack/diff this time.
