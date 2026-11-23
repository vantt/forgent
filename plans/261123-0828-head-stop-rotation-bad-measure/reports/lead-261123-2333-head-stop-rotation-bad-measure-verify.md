# Phase 1 verify: head Stop-hook rotation bad-measure

Date: 2026-11-23 23:33 +07. Tree: `main` at `5a5dde6e0`, in the clean worktree
`/home/vantt/projects/forgent-worktrees/261123-0828-head-stop-rotation-bad-measure-p01v`.

## Verdict

The row does not close. Criteria 2, 3 and 4 are green. Criterion 5 is red: `npm test` has 18 failures on `main`, and
none of them is in the rotation or measure path. As the plan's Risks section says, the reds are recorded here by
name, `p-vbv57yc4d5` stays `in-flight`, and no unrelated code is fixed under this plan.

## Evidence by criterion

| # | Check | Result |
|---|---|---|
| 1 | Cause named | [planner cause report](planner-261123-0829-head-stop-rotation-bad-measure-cause.md) |
| 2 | `cargo test -p fgos-run-supervisor --test head_request a_rotation_frame_preserves_decimal_exponent_and_integer_numbers_for_the_route` | 1 passed, 0 failed (run by the verify unit at `d265faf28`) |
| 3 | `cargo test -p fgos a_stop_hook_that_fails_before_the_node_route_runs_leaves_one_incident_line_in_the_lineage` | 1 passed, 0 failed (run by the verify unit at `d265faf28`) |
| 4 | Live traces | Activation `2026-11-23T08:56:33Z`. The newest `bad-measure` supervisor log has mtime 2026-11-22 21:52 +07, before the activation. `stop-trace.jsonl` holds 11 `at-or-above-soft` stops with outcome `started` and 1 `rotation-in-progress` |
| 5 | `npm test`, unconfined, run by the owner at `5a5dde6e0` | **red**: 7895 tests, 7849 pass, 18 fail, 28 skipped, 635 s |
| 5 | `cargo test --workspace`, unconfined | not reported; still owed |
| 6 | Row `done` | not done; waits on criterion 5 |

The verify unit's own full-gate runs (ticket `c-1493-1795442268950`, later failed with `exit-11`) used sandbox
workarounds (`FGOS_FULL_SUITE_QUEUE=off`, a temporary `FGOS_STATE_HOME`). On the supervisor's order they are invalid
proof and are not counted.

## The 18 `npm test` failures, grouped by likely source

Attribution is from `git log` on the failing module, not a proven cause. None of these files is in this plan's
footprint.

1. **Component-authority model loading** (`2e1c059aa`, 2026-11-23 17:09, and the `component-authority-doors` lands).
   Nine failures. `test/setup/instruction-registry.test.mjs` has 8 tests at lines 121, 520, 588, 614, 640, 779 and
   1003 that fail with `model.components is not iterable` at `src/setup/instruction-registry.mjs:469`.
   `test/report/decision-index.test.mjs:241` fails with `decisionKinds is not iterable` at `src/report/decision-index.mjs:41`.
2. **Backlog index grant** (`e900a7e10`, 2026-11-23 17:46, "coordinating heads may replace the backlog index file").
   Two failures. `test/session-host/head-permission-mode.test.mjs:47` reports that `plans/backlog.md` names a directory.
   `test/session-host/head-start.test.mjs:370` gets an extra `plans/backlog.md` in the secretary paths.
3. **Coloured exit code in output**. Two failures: `test/distribution/native-addon.test.mjs:32` and
   `test/git/native-load.test.mjs:72`. Both get `'\x1B[33m8\x1B[39m'` where they expect `'8'`. This looks like the
   environment of the run (a colour-forcing TTY or env) rather than code.
4. **Workflow guide schema**. Two failures in `test/workflow/guide-schema.test.mjs`. Line 39 counts 10 registered
   workflows where it expects 9. Line 48 reads `guide` where it expects `playbook` for `coding/bugfix`.
5. **Domain registry without dependencies**. `test/state/domain-registry-compiled.test.mjs:27` fails because
   `src/workflow/definition.mjs` now imports `src/native/door.mjs`, which the no-deps copy lacks.
6. **Terminal group title**. `test/run-supervisor/terminal-groups.test.mjs:310` expects `tsk-1lvx · fix terminal layout`
   but gets `tsk-1lvx: fix terminal layout`.
7. **Convention conformance**. `test/scripts/convention-conformance.test.mjs:200` finds 1 post-cutoff naming
   violation.
8. **Concurrent case-close prunes**. `test/workflow/case-close.test.mjs:263` reports `unreadable` once. It may be
   flaky under load.

## What closes the row

1. The owners of those areas turn `npm test` green on `main`.
2. Someone unconfined runs `cargo test --workspace` on that same tree.
3. On that tree, criteria 2 and 3 are re-read from the workspace run, and `p-vbv57yc4d5` is set `done` with this plan
   linked.
