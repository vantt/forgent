---
id: p-cxeyevtimz
title: The Dispatch adapter that writes a seat's report declares whether the report is complete (Dispatch, priority medium)
status: done
priority: P2
area: dispatch
created: 2026-11-12
---

# Why

The approved `unit-run-result` contract (§4) gives each attempt an `output { report, claim, complete, incompleteReason }`; Execution reads the report through `reportDigest` (`src/runner/execution/handoff-refs.mjs`) but cannot know `complete`, which only the adapter that wrote the report can declare. Execution therefore writes no attempt `output` today (HARDEN T9 P07, 2026-11-12, report `plans/reports/lead-261112-1059-harden-t9-p07-unit-run-result-fields.md`; COOK agreed it is a later phase).

# Done when

Each Dispatch adapter returns `complete` (and `incompleteReason` when false) with the report it wrote; Execution writes attempt `output` from it; one adapter-level proof per adapter kind and one wiring proof that the field reaches `data`.

# Notes

Migrated from the legacy backlog table. Original status: done (HARDEN T9 P30 `c18d74913`, `4900e0a94`: Dispatch settlement (`declareReport`, `src/runner/dispatch/settlement.mjs`) writes `reportDeclaration { complete, incompleteReason }` on the RunResult for both adapter kinds; Execution writes each attempt `output { report, claim, complete, incompleteReason }` into `data`. `complete` is never null; the reasons are `no-report` and `seat-did-not-finish`. Report `plans/reports/lead-261112-1320-harden-t9-p30-attempt-output-complete.md`.).
