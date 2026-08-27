---
type: reference
title: Test suite legibility/dedup cleanup — before/after numbers
tags: []
timestamp: 2026-07-29T03:14:35.000Z
source_capture_ids: [tsk-3wr-3]
framework: diataxis
mode: reference
---
# Test suite legibility/dedup cleanup — before/after numbers

Quick-reference numbers for the `tsk-3wr` lineage (rename + dedup +
measure). Full narrative and methodology:
`plans/reports/test-suite-legibility-cleanup-measurement-report.md`.

> ```json
> "actual":{"outcome":"proposed","passed":true,"attempts":1,"errorClass":null,"aheadCount":2}
> ```
> — real `work.outcome` capture, id `tsk-3wr-3`

## Test suite (`npm test`, real `node --test` output)

| Metric | Before dedup | After dedup |
|---|---|---|
| Total test cases | 1554 | 1552 |
| Pass | 1549 | 1547 |
| Skip | 5 | 5 |
| Fail | 0 | 0 |
| Wall-clock | 53.6s | 59.0s |

## Test-description legibility (`tsk-3wr-1`'s metric)

| Metric | Before rename | After rename |
|---|---|---|
| Test descriptions embedding a plan/decision-code citation (`D#`, `str##`, `STR##`, `RUL##`, `tsk-*`) | 147 (31 files) | 0 (2 legitimate exceptions — see below) |

The 2 remaining `STR`/`RUL` matches (`test/scripts/next-doc-id.test.mjs`)
are the id-generator's own test fixture literals, not citations — left
alone deliberately.

## Reading the runtime number

Runtime did not improve (53.6s -> 59.0s). Only 2 of 1554 tests (0.13%)
were removed by the dedup pass — too small a change to move wall-clock
time above ordinary run-to-run variance. This suite ran under repeated,
directly-observed interference from another concurrent live session
sharing the same checkout throughout this work (see
`docs/how-to/diagnose-a-blocked-return-from-an-unrelated-verify-failure.md`
for a concrete instance). The runtime delta is noise, not a regression
from the cleanup.

## Related

- `plans/reports/test-suite-legibility-cleanup-measurement-report.md` —
  full report with method and reasoning.
- `docs/explanation/judging-real-test-duplication.md` — the discriminator
  used to decide which apparent duplicates were real (`tsk-3wr-2`).
- `docs/history/test-suite-legibility/CONTEXT.md` — the locked decisions
  (D1/D2) this whole lineage worked under.
