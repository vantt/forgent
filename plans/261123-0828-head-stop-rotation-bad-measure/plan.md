---
contract: plan-v1
title: "Head Stop-hook rotation requests reach the host with a valid measure: confirm the landed fix and close the row"
status: ready
priority: P1
blockedBy: []
base: 805beabb809bc225727bbb2f587632f1cacdadbb
footprint:
  - plans/261123-0828-head-stop-rotation-bad-measure/**
  - plans/backlog.md
  - plans/backlog/p-vbv57yc4d5-every-head-stop-rotation-request-is-refused-bad-measure.md
source:
  - plans/discussions/ds-p7bc4sheox-head-stop-rotation-refused-bad-measure/DISCUSSION.md
  - p-vbv57yc4d5
created: 2026-11-23
---

# Head Stop-hook rotation requests reach the host with a valid measure

Mode: tiny. The discussion asked phase 1 to prove the cause. The planner proved it while gathering facts, and the
proof shows the fix has already landed. See [the cause report](reports/planner-261123-0829-head-stop-rotation-bad-measure-cause.md).

## Outcome

`p-vbv57yc4d5` closes on a verified `main`. The cause is named with evidence: the run supervisor's bounded
request-socket decoder turned serde_json `arbitrary_precision` numbers into objects, so `checkMeasure` refused
`fraction`. That cause was fixed by `23d6c85a0`, and the fix is live in the activated release. Live stop traces show
that heads trace every stop and that heads over soft start rotations. The full gate is green on the tree where the
row closes.

## Acceptance criteria

1. The cause is named with evidence:
   `plans/261123-0828-head-stop-rotation-bad-measure/reports/planner-261123-0829-head-stop-rotation-bad-measure-cause.md`.
2. One owning proof of the real request shape across the socket exists and passes:
   `cargo test -p fgos-run-supervisor --test head_request a_rotation_frame_preserves_decimal_exponent_and_integer_numbers_for_the_route`.
   The phase uses the crate name from `packages/run-supervisor/rust/Cargo.toml` if it differs.
3. A refused stop is recorded: `cargo test -p fgos a_stop_hook_that_fails_before_the_node_route_runs_leaves_one_incident_line_in_the_lineage`
   passes, and the hook's `stop()` calls `record_incident` on every `StopError`
   (`apps/fgos/src/wiring/session_rotation_hook.rs`).
4. Live: no `bad-measure` line in any `.fgos/assignments/head-*/runs/*/supervisor.log` written after the activation
   time in `.fgos/installation/activation.json`. At least one `at-or-above-soft` line with outcome `started` exists
   in `.fgos/runtime/session-rotation/*/stop-trace.jsonl`.
5. `npm test` and `cargo test --workspace` are green on the tree where the row closes.
6. `p-vbv57yc4d5` is `done` in `plans/backlog.md` and in its row file, linking this plan.

## Non-goals

- Changing rotation thresholds or the soft/hard policy (from the discussion).
- Any code change: the transport fix, its socket proof and the refused-stop incident line are already on `main`
  (`23d6c85a0`, `2c10a76a4`). Adding a second proof of the same behaviour would break design principle 8.

## Prior art

Reused:
- `23d6c85a0`, the decoder fix plus the socket proof, which also preserves stop measures.
- `2c10a76a4`, the hook measure, the stop trace and the `stop-failed` incident.
- The plan `261122-2307-heads-rotate-on-their-own`, and the `p-4r4h3jqtth` family of plans.

Missing: nothing. Found by `git log -S checkMeasure` and `git log -S 'private::Number'`.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Verify on main and close the row](phase-01-verify-and-close.md) | - | plans/261123-0828-head-stop-rotation-bad-measure/reports/, plans/backlog.md, plans/backlog/p-vbv57yc4d5-every-head-stop-rotation-request-is-refused-bad-measure.md | 1 | ready |

With one phase there is no wave overlap. No integration phase is needed because there is nothing to merge: the
phase's verify step is the full gate on `main`.

## Owner questions

None. The evidence settles the cause and shows the fix is live.

## Risks and rollback

- Risk: an unrelated red in `npm test` or `cargo test --workspace` on `main` holds the close. In that case, record
  the red by name in the phase report and leave the row `in-flight`. Do not fix unrelated code under this plan.
- Risk: a `bad-measure` line appears after the activation. That would mean a second cause. Stop, record it in the
  phase report, and hand back to the planner.
- Rollback: revert the land commit of the backlog edit, which sets the row back to `proposed`.
