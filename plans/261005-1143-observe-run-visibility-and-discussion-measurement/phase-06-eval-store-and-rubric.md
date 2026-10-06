---
phase: 6
title: "Eval store and rubric"
status: completed
priority: P2
effort: "1d"
dependencies: [3]
---

# Phase 6: Eval store and rubric

Execution gate: Owner xác nhận ngày 2026-10-06 trong phiên lead rằng yêu cầu
"làm hết tất cả phase đi" (2026-10-05) là của owner và ghi đè cổng "chỉ làm nền
tảng trước"; bản ghi hội thoại không nằm trong repo. Store/rubric repairs and a
new read-audited (not sandbox-isolated) historical-question comparison are
complete; original confounded scores remain labeled.


## Overview

A repeatable way to score discussion quality with the council's 0-2 rubric, in its own Observe store. Replaces the one-off manual A/B of 2026-10-04. `metrics case` is not used: its harness list (`fgos|cook-plan|plain`), verdict list (`usable|fixed|discarded`), one-open-case-per-project rule and `--open`-only `list` make it a measurement window, not a scoring record (`case_journal.rs:248, 266-268, 330`; `case.rs:41-44`).

## Requirements

- Functional: `metrics eval record` writes an append-only record `{ v, type: "eval", ts, evalId, harness (free label), question, setup, scores: {criterion: 0..2}, rubric, judge, runRefs[] }` to `.fgos/observe/evals/<writerId>.jsonl`; `metrics eval list [--harness] [--question]` reads them.
- Functional: write/read range checks plus exactly all five canonical criteria for `discussion-quality.v1`. Duplicate eval IDs are rejected under the shared Observe lock across all shards before append/fsync; invalid existing stores fail closed for uniqueness-dependent writes. Read-side duplicate/unsafe-shard diagnostics precede filters. Existing supported Unix targets use libc no-follow/nonblock constants.
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

- [x] Real solo/panel records list by exact harness with all five `discussion-quality.v1` scores.
- [x] Judge isolation is demonstrated for a new comparison using the entire 2026-10-04 objective: actual selected argv, SDK tools/MCP/skills/slash-empty metadata and zero tool/hook events are retained. The scratch inventory (only `A.md`/`B.md` before and after) is asserted only in coordinator-authored JSON, and the scratch was deleted, so it is **UNPROVEN**; outputs reached the judge inline and it had zero tools. The arms are separated by read audit only (no seat read the other arm's output, checked from raw tool calls); they were **not** sandbox-isolated: forgentX stayed readable to every seat except Gemini, including a file with the solo's position summary written before the panel launched and the 2026-10-04 outputs. Both arms received a coordinator-built source packet that contains the decision settled after 2026-10-04, so the evidence condition differs from 2026-10-04. One question and one isolated judge: directional only. Original judgments remain data-blind/confounded, not retrospectively validated.
- [x] Unchanged installed host rejects `metrics eval` explicitly, exit 4.

Evidence: [`observe-discussion-measurement-261005.md`](../reports/observe-discussion-measurement-261005.md), corrected [judge metadata and actual rationales](../reports/observe-measurement-blind-judge-261005.json), and `.fgos/observe/evals/observe-measurement-261005.jsonl`. Both original texts scored 7/10, but the setup-independence and historical-question confounds invalidate presenting this as a fair setup comparison. [Acceptance repairs](../reports/observe-acceptance-fixes-261006.md) track any new run and unresolved proof; no isolation acceptance is claimed from the old scores.

Store integrity repair `f11504363`: main eval harness23 pass, including six-process same-shard and two-process same-ID behavior; native rejects partial/duplicate/invalid-store writes without inventing scores. Arm64 cargo check is compile-only proof. The earlier readonly Pi lock issue is resolved by existing owning-root account-backed private-home profiles and normal opaque fgOS provisioning, not manual credential extraction. New solo `unit-run-1791270002490-60cc7659` is retained without rerun; contaminated panel `unit-run-1791270002581-a9476c1b` is excluded, and replacement panel `unit-run-1791270868625-812a0306` passes all four roles with identical source-packet bytes. Actual isolated Opus judgment scores solo7/panel5; native append/list proves two new complete records, four total, invalid[]. Two rejected judges ran with the default (non-isolated) argv and swapped labels (A = panel); their retained transcripts still score solo 7 vs panel 6 and solo 7 vs panel 5, the same direction, as data-blind replicates only. The [repair ledger](../reports/observe-acceptance-fixes-261006.md#independent-comparison-completion--2026-10-06) links SDK, access, inventory, rationale and record evidence. One question/one successfully isolated judge, unverified citations, unchanged overlength outputs and different CLI transport limit the inference; no general setup ranking is claimed.

## Risk Assessment

- One judge and small n: the how-to states results are directional until repeated; the store exists to make repeating cheap.
- `.fgos/observe/evals` is git-tracked: only real records are committed.
- Noticed, not in scope: `observe.case.v1.json` rejects a `unitRuns` field the Rust writer already emits (`additionalProperties: false`); `metrics case list` ignores every flag except `--open`. Logged in the report, left alone.
- Signal it broke: scores incomparable because the rubric text drifted; response: version the rubric id and compare only within a version.
