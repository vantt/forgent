---
phase: 31
title: "Duration and family: Execution writes each attempt's wall time; the binding's family is the one Workflow reads"
status: in-progress
depends_on: [21, 30]
parallel: "run.mjs, handoff-refs.mjs, the run-result fixtures and their two owning tests are P30's until it lands; the durationMs hunk is made after P30 is on main"
---

# Phase 31 - Duration and family - Execution (T5), Workflow read (T6)

**Authority moved:** the provider family a seat was served by is Seat Binding's (`binding.family`, written by `bind`, spelled by `familyOf`); `src/workflow/seat-providers.mjs` stops taking it from `runResult.policy.providerModel` and `familySpread`. The duration of an attempt is a fact of Execution (the launch-to-return span it observes around the dispatch of one seat); no other layer computes it.

## Context

[Contract](../../docs/platform/runner/contracts/unit-run-result.md) section 4 rows `binding.family` and `durationMs, usage`. P21 put `family` on the binding and P07 left the two fields to a later phase. The owner put this phase in the release gate (decision 87).

## Requirements

1. `data.results[].binding.family` is the family `bind` computed, present on every attempt that was bound; Workflow reads that field and nothing else for a seat's family. A result without it reads as not known (`null`).
2. `data.results[].runResult.durationMs` is the milliseconds between the start and the end of the dispatch of that attempt, taken from a monotonic clock, recorded in the attempt record of `unit.json` so a resumed run hands up the same value. A seat that never ran, and every record written before this change, read `null`.
3. Fixtures carry both fields; the Node and Rust readers agree.

## Files

`src/workflow/seat-providers.mjs`, `src/runner/execution/run.mjs` (the attempt record and `withActivity`), `packages/run-result/contracts/fixtures/*` and their README, `test/workflow/seat-evidence.test.mjs`, `test/runner/execution/run-case-admission.test.mjs`, `test/runner/execution/unit-run-result-fixtures.test.mjs`, the contract's "Today" cells for the two fields, `CHANGELOG.md`, the Git mutation census (regenerated).

## Validation

Focused tests, architecture, doc-health, citation-drift, census scan, `cargo test -p fgos-run-result`, one real read-only `fgos run` showing both fields, full `npm test`. Rollback: revert the merge commit.
