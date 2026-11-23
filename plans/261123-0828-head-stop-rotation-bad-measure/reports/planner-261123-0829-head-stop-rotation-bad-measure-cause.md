# Cause: head Stop-hook rotation requests refused `bad-measure`

Backlog row: `p-vbv57yc4d5`. Discussion: `plans/discussions/ds-p7bc4sheox-head-stop-rotation-refused-bad-measure/DISCUSSION.md`.

## Verdict

The cause is a transport step: the head's request socket decoder in the run supervisor turned every JSON decimal into an
object. Commit `23d6c85a0` (2026-11-22 13:50 +07, "fix(session-rotation): resolve orphaned rotations and preserve stop
measures") already fixed it. That fix is on `main` and in the activated release. Since that release went live, heads
write `stop-trace.jsonl` lines, and two heads over soft started rotations. No code change is left to make.

## Mechanism

- `apps/fgos/Cargo.toml` turns on serde_json's `arbitrary_precision` feature. Cargo unifies features within one
  binary, so the run supervisor's decoder inside the same `fgos` binary gets it too.
- With that feature, serde_json does not deliver a number through `visit_f64`. It delivers the number as a one-entry
  private map, `{"$serde_json::private::Number": "0.33"}`.
- Before `23d6c85a0`, the bounded decoder in `packages/run-supervisor/rust/src/head_request.rs` (`impl Visitor for
  Bounded`, `visit_map`) copied that map as an ordinary object. The Node route then received
  `measure.fraction = {"$serde_json::private::Number": "..."}`, and `checkMeasure` (`src/session-rotation/rotate.mjs`)
  refused it: `fraction must be a number of at least 0, or null`.
- Integers took the same path. Only floats hit a validator that checks the type, and the Stop hook's `fraction` is
  the only float any head verb sends. That is why only `session rotate` was refused.
- The hook (`apps/fgos/src/wiring/session_rotation_hook.rs`) and the validator were consistent from the start, in
  `2c10a76a4`. The fault sat in the transport between them, which is the "stringifies or drops" suspect named in the
  discussion.

## Fix already landed (prior art reused, nothing missing)

- `23d6c85a0` makes `visit_map` recognise the private-number key and parse its token back into a `Value::Number`. It
  also refuses a second entry after it.
- Owning proof of the real request shape across the socket:
  `packages/run-supervisor/rust/tests/head_request.rs`,
  `a_rotation_frame_preserves_decimal_exponent_and_integer_numbers_for_the_route`. The test sends raw frame bytes with
  `measure.fraction: 0.33`, an exponent, an integer and a u64-overflow number. It then asserts that the route child's
  stdin carries JSON numbers and no private map.
- A refused stop is recorded, not silent: `stop()` in `session_rotation_hook.rs` calls `record_incident` on every
  `StopError`, including a route refusal coming through `StopError::from_client`. That appends a `stop-failed` line
  to the lineage's `incidents.jsonl`. The proof is
  `a_stop_hook_that_fails_before_the_node_route_runs_leaves_one_incident_line_in_the_lineage` in the same file.

## Evidence (live state, read 2026-11-23 08:29 +07)

- Activation: `.fgos/installation/activation.json` activated 2026-11-22T23:45:56Z (06:45 +07 on 11-23), digest
  `sha256:3b595f7c...`. `git merge-base --is-ancestor 23d6c85a0 HEAD` succeeds.
- Before the fix: `.fgos/assignments/head-secretary-miu-28/runs/01/supervisor.log` has 56 `bad-measure` lines. The
  last `bad-measure` line in any head's supervisor log was written at 2026-11-22 21:52 +07
  (`head-shaper-coach-agent-and-observe-views-1`), before the activation.
- After the fix: `head-secretary-miu-30` through `-35` have 0 `bad-measure` lines. Twelve or more lineages under
  `.fgos/runtime/session-rotation/*/` now hold `stop-trace.jsonl`. `secretary-miu` alone has 78 lines, for example
  `{"fraction":0.132176,"source":"sidecar","decision":"below-soft","outcome":"below-threshold"}`.
- Heads over soft rotate. Across all lineages, the stop traces hold two `at-or-above-soft` lines, both with outcome
  `started`:
  - `2026-11-22T23:26:48Z` at fraction 0.15267
  - `2026-11-23T01:16:43Z` at fraction 0.150075, which matches `head-secretary-miu-35` being created at 08:16:43 +07.

  The secretary's soft threshold is 0.15.
- The `secretary-miu` lineage has no `stop-failed` incident since the fix.

## What remains

Run the full gate on `main` (`npm test`, `cargo test --workspace`) and close `p-vbv57yc4d5`. The plan's single phase
owns both.
