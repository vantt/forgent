---
phase: 6
title: "Eval store and rubric"
status: pending
priority: P2
effort: "1d"
dependencies: [3]
---

# Phase 6: Eval store and rubric

## Overview

A repeatable way to score discussion quality with the council's 0-2 rubric, in its own Observe store. Replaces the one-off manual A/B of 2026-10-04. `metrics case` is not used: its harness list (`fgos|cook-plan|plain`), verdict list (`usable|fixed|discarded`), one-open-case-per-project rule and `--open`-only `list` make it a measurement window, not a scoring record (`case_journal.rs:248, 266-268, 330`; `case.rs:41-44`).

## Requirements

- Functional: `metrics eval record` writes an append-only record `{ v, type: "eval", ts, evalId, harness (free label), question, setup, scores: {criterion: 0..2}, rubric, judge, runRefs[] }` to `.fgos/observe/evals/<writerId>.jsonl`; `metrics eval list [--harness] [--question]` reads them.
- Functional: scores are range-checked when written and when read (a hand-edited tracked line outside 0..2 is reported, not trusted).
- Functional: a rubric reference document (the five criteria used on 2026-10-04: perspective spread, decision clarity, counterfactual depth, evidence discipline, execution quality, each 0-2) with an id/version, and a how-to for a blind comparison.
- Functional: blind judging means the judge receives copies of the outputs in a scratch directory **outside `.fgos`** under neutral names (`A.md`, `B.md`); blind mode alone does not hide `.fgos/observe/evals` or the earlier `ab-*` outputs (`resources.mjs:26-32`).
- Non-functional: an old host reports `unknown subcommand` for `metrics eval` (detectable, unlike silently dropped fields); evals are only recorded with a host that has the subcommand.

## Architecture

D4. A new store beside friction, cases and snapshots, with the same shard-per-writer, lock and envelope rules (`docs/specs/observe.md` §3). Contract `packages/observe/contracts/observe.eval.v1.json`. Rubric as `docs/reference/discussion-quality-rubric.md`; routine as `docs/how-to/compare-discussion-setups-with-metrics-eval.md`.

## Related Code Files

- Create: `packages/observe/contracts/observe.eval.v1.json`, `packages/observe/rust/src/metrics_cli/eval.rs`, `packages/observe/rust/src/eval_journal.rs`, tests, `docs/reference/discussion-quality-rubric.md`, `docs/how-to/compare-discussion-setups-with-metrics-eval.md`.
- Modify: `packages/observe/rust/src/metrics_cli/mod.rs`, `src/cli/command-registry.mjs`, `docs/specs/observe.md` (§3 store, §4 commands), `test/fixtures/observe/` (only after phases 2, 4, 5 have landed, one regeneration at a time), `CHANGELOG.md`.

## Implementation Steps

1. Prior-art: read `plans/reports/council-ab-comparison-261004.md` and `council-lens-experiment-261004/outputs/` for the exact rubric wording and judge setup; the rubric document quotes them.
2. Contract, journal and CLI with tests (record, list, filter, out-of-range write rejected, out-of-range read reported, concurrent writers).
3. Docs: rubric reference and the blind-comparison how-to (scratch directory, neutral names, judge sees only those).
4. Dogfood: run the 2026-10-04 question on two current setups, score both with an Opus judge in the blind setup, record two evals.
5. Spec and CHANGELOG.

## Success Criteria

- [ ] Two eval records listable by harness with their criterion scores.
- [ ] The judge workspace contained only the two neutral files (stated in the how-to and checked once).
- [ ] An old host fails loudly for `metrics eval`.

## Risk Assessment

- One judge and small n: the how-to states results are directional until repeated; the store exists to make repeating cheap.
- `.fgos/observe/evals` is git-tracked: only real records are committed.
- Noticed, not in scope: `observe.case.v1.json` rejects a `unitRuns` field the Rust writer already emits (`additionalProperties: false`); `metrics case list` ignores every flag except `--open`. Logged in the report, left alone.
- Signal it broke: scores incomparable because the rubric text drifted; response: version the rubric id and compare only within a version.
