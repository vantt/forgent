---
phase: 30
title: "Attempt output: Dispatch settlement declares whether a seat's report is complete, Execution writes the attempt output"
status: landed
depends_on: [7]
parallel: "file-disjoint from P29 (store.mjs, legacy-ledger-read.mjs, case-projection.mjs)"
---

# Phase 30 - Attempt output and report completeness (T5)

**Authority:** `complete` is declared by Dispatch settlement, the one reader of the worker's own report and claim (`readWorkerArtifacts`); Execution never guesses it. No unknown value exists: `false` carries `no-report` or `seat-did-not-finish` (contract section 4, `f5e8cb2a5`).

## Context

Backlog row `p-cxeyevtimz`. Contract `docs/platform/runner/contracts/unit-run-result.md` section 4. No adapter writes a report from the final message today: both `cli-spawn` and `herdr-spawn` seats write `report-N.md` themselves, so the declaration is a fact of settlement, not of a transport.

## Requirements

1. The RunResult carries `reportDeclaration { complete, incompleteReason }`: complete when a substantive report exists and the seat ended on its own (claim written, no timeout, no signal).
2. Each attempt in `data.results[]` carries `output { report, claim, complete, incompleteReason }`; `report` is the digest of that attempt's own report (`reportDigestOf`, sharing the file read with `reportDigest`), absent `output` for an attempt settled before the declaration.
3. One RunResult copy helper (`extendedRunResult`, `src/runner/dispatch/run-result.mjs`) replaces `withActivity` and `unfrozenCopy`.

## Files

`src/runner/dispatch/settlement.mjs`, `run-result.mjs`, `assignment-runner.mjs`, `src/runner/execution/run.mjs`, `handoff-refs.mjs`; fixtures in `packages/run-result/contracts/fixtures/`; tests `test/runner/run-result-report-complete.test.mjs` (owning proof per adapter kind), `test/runner/execution/run-case-admission.test.mjs` (wiring proof), `handoff-refs.test.mjs`, `unit-run-result-fixtures.test.mjs`; `docs/backlog.md`, `CHANGELOG.md`. Rust reader unchanged: it ignores unknown fields and its fixture test passes on the extended files.

## Validation

Focused tests, architecture and doc-health tests, census scan, one real read-only `fgos run`, full `npm test`. Rollback: revert the merge commit.
