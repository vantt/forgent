# tsk-34y — Quantify + consolidate repeated assertion-shape invariants in fgOS test suite

## Feature boundary

`test/cli/fgos.test.mjs` (and possibly other test files) contain many tests
that assert the *same invariant* repeatedly across different inputs (flag
names, verbs) using hand-written, near-identical test bodies instead of a
single parameterized (data-table driven) test. This item measures how much
of that duplication is real (same invariant, safe to merge) versus
incidental similarity (different invariant, must stay separate), then
performs the safe merges.

This item does **not** cover renaming or general test legibility — that is
`tsk-3wr` (dependency, separate item, `docs/history/test-suite-legibility/`).

## Scout evidence (2026-07-29)

- `test/cli/fgos.test.mjs`: 6149 lines, 377 `it(`/`test(` blocks — by far the
  largest test file. Next largest: `test/runner/loop.test.mjs` (1497 lines,
  49 tests).
- `"is rejected as validation, exit 4"` string appears 54 times in
  `test/cli/fgos.test.mjs` — same shape (bad input → exit 4 → no event
  written), differing only in which flag/verb is exercised.
- `"no event written"` / `"does not write"` postcondition assertions: 53
  occurrences — same repeated postcondition across many tests.
- Bare-flag-rejection shape (`"<verb> with a bare --<flag> (no value) is
  rejected as validation"`): 8 occurrences — one full test per flag instead
  of one parameterized test over a flag list.
- Other large-ish test files checked for the same shape-duplication pattern
  (counts as of 2026-07-29, to be scanned properly during execution, not
  assumed clean): `test/state/replay.test.mjs` (63 tests), `test/runner/
  dispatch.test.mjs` (59), `test/runner/loop.test.mjs` (49), `test/intake/
  decompose.test.mjs` (38), `test/intake/discovery.test.mjs` (36),
  `test/state/store.test.mjs` (34). None dominate the way `fgos.test.mjs`
  does, but the item's own việc (1) requires scanning the whole suite, not
  just the biggest file — this list is where to start, not the full set.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Scope is measure **and** refactor, not measure-only. Quantify duplicate assertion-shape clusters across the whole test suite (not just `fgos.test.mjs`), and merge confirmed same-invariant duplicates into parameterized (data-table + one test body) form, preserving every edge case's individual coverage. Do NOT merge two tests that look similar but verify different invariants — read assertion content, never guess from test name. Report test count before/after and run time before/after. |
| D2 | `verify` = `npm test` (full suite) passes green AND a before/after report (test count, run time, which clusters were merged and why) exists. No fixed numeric reduction quota — this is a quality bar (only genuine same-invariant duplication gets merged), not a target percentage to hit. |

## Pinned terms

- **"same invariant"**: two tests assert the identical pre/post-condition
  shape (same setup pattern → same kind of assertion → same kind of
  side-effect check), differing only in which input value (flag name, verb,
  argument) is plugged in. Verified by reading the assertion body, not by
  test name similarity.
- **"parameterized test"**: one test body driven by a data table (array of
  `{input, expected}` fixtures), iterated with `for (const case of table)`
  or the test runner's native parameterization, replacing N near-identical
  hand-written tests with 1 body + N data rows.

## Outstanding questions deferred to planning

- Whether the merge work is small enough for one execution pass or needs
  splitting into child items (e.g., one item per test file) is a shaping
  judgment for `fgos-coding-planning` — not decided here (out of scope for
  `fgos-coding-exploring` per its own hard rules).
- Exact list of which specific test clusters qualify as "confirmed same
  invariant" vs. must stay separate is an implementation-time judgment for
  whoever executes — this doc does not pre-enumerate every cluster, only
  gives the clusters already measured as evidence that duplication exists.

## Dependency

Depends on `tsk-3wr` (test suite naming/legibility) — must land first per
existing `deps` field on this item.
