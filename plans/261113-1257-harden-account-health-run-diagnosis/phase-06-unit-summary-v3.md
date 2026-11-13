---
phase: 6
title: "Unit summary v3: infrastructure, infrastructureReason and refused are persisted"
status: pending
depends_on: []
parallel: "wave 1 with P01 and P03; shares the fgos-run-result crate with P03 but no file"
branch: harden/acct-b-p06
---

# P06 - `unit-summary` contract v2 -> v3

**Authority:** Execution computes the Unit facts once, in `finishUnit` (`src/runner/execution/run.mjs:437-466`); the summary copies them, never re-derives (`unit-run-result.md` section 2: "A stored form of those facts bumps `unit-summary` to version 3, with its Rust reader first"). Owner chose the bump; all machines upgrade together, so there is no cross-machine dual-read phase, but v2 files on disk keep a reader.

## Context (verified)

- `finishUnit` calls `settleUnitRun(ctx, ruled.outcome)` (`run.mjs:440`) **before** it computes `infrastructure` (`:457`); `settleUnitRun` (`:361-368`) persists only `{outcome, settledAt}` to `unit.json` and then writes the summary (`publishUnitSummary` `:53-58`). The error path settles `execution-failure` (`:323`); `failedUnitFacts` (`:229-240`) says `infrastructure: true`.
- `buildUnitSummary` (`src/runner/execution/unit-summary.mjs:66-170`) reads `record.settlement` (`:132`); contract `{id: unit-summary, version: 2}` (`:17`). Refused seats exist only as results (`refusedSeat`, `run.mjs:559`; `result.refused` set at `:824`, `:832`) and have no run directory, so the summary cannot find them from disk.
- Rust reader: `UNIT_SUMMARY_VERSION = 2` (`packages/run-result/rust/src/unit_summary.rs:13`), `valid_summary` (`:65`), version gate `unsupported-version` (`:165-173`); consumer `fgos metrics discussions` (`packages/observe/rust/src/metrics_cli/discussions.rs`).
- Unit 455840350: `unit.json` settlement `execution-failure`, binding `producer/1` commit `{status: failed, reason: git-error}` (author identity unknown); summary seat `pass`; nothing on the summary says why.

## Requirements

1. `finishUnit` computes the facts first, then `settleUnitRun(ctx, {outcome, infrastructure, infrastructureReason, refused})`; `unit.json.settlement` stores all four (plus `settledAt`).
2. `infrastructureReason` (string, null when `infrastructure` is false), first that applies: `not-started` (no brief delivered); `scope-check-failed` (`ruled.error`); for the first attempt with `isInfrastructure(outcome)`: `verify-<timeout|not-run>` (its `infrastructureReason`), `commit-failed:<commit.reason>`, else its run result `classification.outcome.reason` (e.g. `infra-exec-failed`, `infra-no-report` after P03), else `execution-failure`. The throw path writes `run-error`.
3. `refused`: `[{seat, round, reason, detail}]` from results that carry `refused`, `[]` when none.
4. Summary v3 copies the three from `record.settlement`; a unit record settled before this change yields `infrastructure: null, infrastructureReason: null, refused: []` (not known, never a pass; contract section 5).
5. Rust reader accepts version 2 (as today) and 3; v3 requires `infrastructure` bool|null, `infrastructureReason` nullable string, `refused` array of `{seat, round, reason, detail}`; any other version stays `unsupported-version`.
6. `packages/run-result/contracts/unit-summary.read.v2.json` is renamed to `unit-summary.read.v3.json`, describing v3 and naming v2 as still read.

## Files

- Modify: `src/runner/execution/run.mjs` (`finishUnit`, `settleUnitRun`, the error-path call), `src/runner/execution/unit-summary.mjs`, `packages/run-result/rust/src/unit_summary.rs`, `packages/run-result/rust/tests/unit_summary.rs`, `test/runner/execution/unit-summary.test.mjs`, `docs/platform/runner/contracts/unit-run-result.md` (sections 2, 3, 5), `docs/platform/observe/spec.md` (`:85`, `:101`), `docs/platform/runner/architecture/h-69197b459754.md` (`:105`), `docs/reading-map.md` (`:190`).
- Rename: `packages/run-result/contracts/unit-summary.read.v2.json` -> `unit-summary.read.v3.json` (`git mv`).
- Delete: none. Historical narratives (`docs/platform/runner/decisions/h-36d872fbb0e5.md`) keep their v2 wording.

## Owning proofs

| Behaviour | Owner |
|---|---|
| reader accepts v2 and v3, rejects v1 and a malformed v3 | extend `reader_reports_root_wide_missing_and_unusable_summaries_without_reconstruction` (`tests/unit_summary.rs:333`): add a v3 summary (counted) and a v3 with `refused: "x"` (`invalid-contract`) |
| summary copies the settlement facts; an old record reads not-known | extend `complete summary uses owner workflow/outcome` (`unit-summary.test.mjs:35`) and `failed seat maps classification` (`:69`) |
| `finishUnit` writes the facts (commit failure -> `commit-failed:git-error`, refused seat listed, not-started) | extend the failed-commit case in `test/runner/execution/commit-unit-work.test.mjs` or `run-sync.test.mjs` (whichever drives `runUnit` to settlement; read both first); no new file |

Tests retired: none. Net size: about +45 Node, +25 Rust, contract file renamed with +10 lines.

## Validation

`cargo test -p fgos-run-result -p fgos-observe`; `node scripts/run-tests.mjs test/runner/execution/unit-summary.test.mjs test/runner/execution/legacy-seat-read.test.mjs test/runner/execution/run-verify-pin.test.mjs test/workflow/propose-classify.test.mjs`; after a dev build, `npm run fgos:dev -- metrics discussions` on this checkout reads the existing v2 summaries without new `unsupported-version`.

## Risk / rollback

Risk: `settleUnitRun` signature change missing a caller - two callers (`run.mjs:323`, `:440`), both moved here. Risk: `infrastructureReason` vocabulary drift - the list lives in one function in `run.mjs` and in the contract table. Rollback: revert; v3 files then read `unsupported-version` until `node scripts/backfill-unit-summaries.mjs --regenerate` rewrites them.
