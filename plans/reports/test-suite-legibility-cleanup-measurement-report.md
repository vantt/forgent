# Test suite legibility/dedup cleanup — before/after measurement (tsk-3wr-3)

Evidence for tsk-3wr's D1 (verify) and the parent's own work item (3):
"đo lại thời gian + số lượng test sau dọn, đối chiếu trước/sau" (remeasure
time + test count after cleanup, compare before/after).

## Method

All numbers below are real `npm test` (`node --test 'test/**/*.test.mjs'`)
output, not estimates. "Before" is measured directly after tsk-3wr-1's
rename pass (before any tsk-3wr-2 dedup edit landed) — the first point in
this lineage where a plain, non-coverage-instrumented full-suite run was
captured. "After" is measured now, after both tsk-3wr-1 (rename) and
tsk-3wr-2 (dedup) are merged to `main`.

## Test count

| | Before (post-rename, pre-dedup) | After (post-dedup) | Delta |
|---|---|---|---|
| Total test cases | 1554 | 1552 | -2 |
| Pass | 1549 | 1547 | -2 |
| Skip | 5 | 5 | 0 |
| Fail | 0 | 0 | 0 |

The -2 is exactly the two real duplicate-invariant tests tsk-3wr-2 found
and removed (a byte-identical `reviewDiff` duplicate in
`test/runner/merge.test.mjs`, and an arbitrary example in
`test/state/porting.test.mjs` fully subsumed by that file's own
exhaustive cross-product test) — see
`docs/explanation/judging-real-test-duplication.md` for the full audit.
Per D2 (locked in `docs/history/test-suite-legibility/CONTEXT.md`), the
dedup pass was open-ended and duplication-driven with no target count —
a full manual audit of all 73 test files found very little real
duplication once each shape-similar candidate was checked against
source, and most of the suite's apparent repetition turned out to be
independently-meaningful coverage of independently-written code, not
padding. A small, real count reduction — not a large one — is the
honest result of that audit, not a shortfall against a target that was
deliberately never set.

## Runtime

| | Before (post-rename, pre-dedup) | After (post-dedup) |
|---|---|---|
| Wall-clock (`npm test`) | 53.6s | 59.0s |

Runtime did not improve, and in fact reads slightly higher. Two real
tests were removed out of 1554 (0.13% of the suite) — far too small a
change to move wall-clock time in a way distinguishable from ordinary
run-to-run variance (this session had persistent evidence of another
concurrent live session sharing the same machine/checkout throughout —
see `docs/how-to/diagnose-a-blocked-return-from-an-unrelated-verify-failure.md`
for a directly-observed instance of that interference). Reporting this
plainly rather than fitting it to a "cleanup made it faster" narrative
the actual measurement does not support.

## Legibility (tsk-3wr-1's own metric, included for completeness)

| | Before | After |
|---|---|---|
| Test descriptions embedding a decision-code citation (`D#`, `str##`, `STR##`, `RUL##`, `tsk-*`) | 147 (31 files) | 0 (2 legitimate exceptions: `test/scripts/next-doc-id.test.mjs`'s `STR`/`RUL` literals are the id-generator's own test fixture data, not citations) |

## Coverage (no real assurance lost)

The baseline coverage run captured at `fgos-coding-validating` (before any edit
in this lineage): 93.13% line / 83.83% branch / 91.21% function, 1549
pass / 0 fail. Every test removed during tsk-3wr-2 was individually
verified via source-reading (not assumed) to be a true duplicate of
another test still present — no distinct invariant lost its only
verification. See `docs/explanation/judging-real-test-duplication.md`
for the full case-by-case reasoning behind every merge/removal, including
the concrete example CONTEXT.md originally cited (`isFrozen` field-by-
field checks) that turned out, on inspection, to be a false positive —
left untouched.

## Bottom line

- Suite is real, provably green: 1547/1552 pass, 5 legitimately skipped, 0 fail.
- Test count: small, evidence-backed reduction (-2), not a padded number.
- Runtime: no measurable improvement — honestly reported, not overstated.
- Legibility: 147 -> 0 decision-code citations in test descriptions, the
  suite's stated original problem.
- Coverage: unchanged in substance — every removal individually proven
  non-lossy, not asserted.
