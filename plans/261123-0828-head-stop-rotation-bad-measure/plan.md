---
contract: plan-v1
title: "Head Stop-hook rotation requests reach the host with a valid measure: confirm the landed fix and close the row"
status: running
lead: head:lead-forgent-261123-0828-head-s-62d31
priority: P1
blockedBy: []
base: fa7f61288083289bbb39d84ff0d7a11c3f2a1bda
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
| 1 | [Verify on main and close the row](phase-01-verify-and-close.md) | - | plans/261123-0828-head-stop-rotation-bad-measure/reports/, plans/backlog.md, plans/backlog/p-vbv57yc4d5-every-head-stop-rotation-request-is-refused-bad-measure.md | 1 | running |

Phase 1 is parked, with status `running`, since 2026-11-23 21:12 +07: run ticket `c-1493-1795442268950` (unit-run `unit-run-1795442269420-67ac68f8`,
worktree `/home/vantt/projects/forgent-worktrees/261123-0828-head-stop-rotation-bad-measure-p01`, branch
`head-stop-rotation-bad-measure/p01`) was still `running` after 12 result waits, on producer fallback attempt
`fb2`. The next wake resumes it with `fgos request result c-1493-1795442268950`; it must not start a second run. The lead
checked the live evidence on its own: no `bad-measure` line after activation `2026-11-23T08:56:33Z` (the last one is
from 2026-11-22 21:52 +07), and 11 `at-or-above-soft` stops with outcome `started`.

Supervisor order, 2026-11-23 21:22 +07: do not wait on that ticket. Its full-gate runs used sandbox workarounds
(`FGOS_FULL_SUITE_QUEUE=off`, a temporary `FGOS_STATE_HOME`), so they are invalid proof for criterion 5. The lead was
to run the gate itself outside the sandbox. Result: blocked. The lead session is confined too (`FGOS_CONFINED=1`):
the worktree, `/proc` and `~/.local/state/fgos` are read-only to it, so it cannot build, install `node_modules` or run
`npm test` / `cargo test --workspace`. The status stays `running` because the plan contract has no parked status.

Parked on owner question `q-pcwf3slkfp` (supervisor, 2026-11-23 22:40 +07): no unconfined `lead:SUPERVISOR` session is
live, so the full gate waits on the owner. The `plan-no-progress` event for this wait was closed; the live lead is left
idle on purpose and resumes when the question is answered.
Owner answer 2026-11-23 22:26 +07 (via Miu), written back by the supervisor: `q-pcwf3slkfp` "Fold into
`q-vbh2knqpnu`'s suite run". The owner's unconfined host trip for heads-stable phase 11 runs `npm test` and
`cargo test --workspace` once on main and puts the result in this plan's `reports/` too. No code change is allowed;
a red this plan caused is the lead's to fix through a plan note. Phase 1 closes when that result is in `reports/`.

Phase 1 evidence so far:
- Criterion 2 is green: `cargo test -p fgos-run-supervisor --test head_request a_rotation_frame_preserves_decimal_exponent_and_integer_numbers_for_the_route`
  reported 1 passed, run by the unit at `d265faf28`.
- Criterion 3 is green: `cargo test -p fgos a_stop_hook_that_fails_before_the_node_route_runs_leaves_one_incident_line_in_the_lineage`
  reported 1 passed, run by the unit at `d265faf28`.
- Criterion 4 is green: the lead checked it itself, as noted above.
- Criterion 5 is open. In the sandbox, 12 or more `apps/fgos` tests under `wiring::doctor::confinement` and
  `wiring::doctor::git` failed. They need the host's `/proc` and state home, so they say nothing about `main`.
- Criterion 6 waits on criterion 5. The row stays `in-flight`.

Needed to close: an unconfined run of `npm test` and `cargo test --workspace` on current `main`. A clean verify
worktree is ready at `/home/vantt/projects/forgent-worktrees/261123-0828-head-stop-rotation-bad-measure-p01v`
(branch `head-stop-rotation-bad-measure/p01v`, tip `5a5dde6e0`, `node_modules` not installed).

Full gate, 2026-11-23 23:33 +07: the owner ran `npm test` unconfined on `main` `5a5dde6e0`. It is **red**: 7895
tests, 18 failing, none in the rotation or measure path. Per Risks, the row stays `in-flight` and no unrelated code is
fixed here. `cargo test --workspace` is still not reported. Reds by name and likely source:
[phase 1 verify report](reports/lead-261123-2333-head-stop-rotation-bad-measure-verify.md). Phase 1 waits on a green
`main` (both gates) and then closes from that tree.

Supervisor, 2026-11-24 01:40 +07: `npm test` and `cargo test --workspace` (joined with `;`) are running unconfined
on `main` `980d1276d`. The supervisor sends the result. The lead then re-reads it and closes phase 1 from that tree
if both gates are green.

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
