# Execution report — phase-1-review-fixes-2

Worker: Carl · Cell: `phase-1-review-fixes-2` (deps: `phase-1-review-fixes-1`)

## Scope

Close F3 (crash-window recovery gap) plus the four remaining P3 test gaps
bundled into this cell: view-stale-but-present rebuild, corrupt line in the
middle of the event log, done-terminal via the real CLI, exit-5 on a mutation
attempted against an already-corrupt log, and documenting that a dependency
cycle cannot be constructed. Test-only cell — no changes to `src/` or `bin/`.

## What was added

- `test/state/events.test.mjs`: one new test, `readEvents detects a corrupt
  line in the middle of the log — valid, corrupt, valid` (valid → corrupt →
  valid, not just corrupt-at-tail), placed next to the existing
  corrupt-anywhere test.
- `test/cli/fgos.test.mjs`: five new tests, placed next to the existing
  rmSync-based rebuild test —
  1. `rebuild reconstructs state.json ... when the view file still exists
     but is stale (not deleted)` — writes a wrong-status/missing-item view
     in place (file never removed), asserts it differs from the log-derived
     view, then asserts `rebuild` produces the log-derived view exactly.
  2. `done is terminal via the real CLI: moving out of done is refused as
     precondition, exit 2, no event written`.
  3. `a mutation (add) attempted on an already-corrupt log is refused as
     corrupt-log, exit 5, no event written`.
  4. `a mutation (move) attempted on an already-corrupt log is refused as
     corrupt-log, exit 5, no event written`.
  5. `a dependency cycle is impossible to construct` — `add a --deps b`
     (b absent) and `add b --deps a` (a never written, since the first
     attempt wrote nothing) both exit 4, proving no sequence of `add` calls
     can ever produce a cycle.

All new tests exercise the real CLI binary via `spawnSync` or the real
library functions directly — no filesystem mocking, no writes inside the
repo (every test uses `mkdtemp`).

## Verification

`npm test`: 82/82 passing (76 baseline + 6 new). Full output recorded via
`bee cells verify --output-file`.

## Deviations

None. No product bug surfaced during this cell — all five findings were
pure test-coverage gaps, exactly as scoped.
