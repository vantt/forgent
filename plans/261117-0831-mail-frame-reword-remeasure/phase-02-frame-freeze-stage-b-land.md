# Phase 2: write the wording, freeze v7o, stage B, land

Depends on: phase 1 stage A report and the lead applying the pre-registered choice rule.

## Steps

1. **Frame**: write the chosen text into `packages/mailbox/contracts/frame.v1.txt:46`, or nothing if the rule kept W0.
   Update `packages/mailbox/rust/core/tests/frame.rs:259` (the rendered line) and, for W3, :380 (the required token).
   Do not change `[message]` or any other section. Check that `src/cli/command-registry.mjs:1199` and the generated
   `packages/host-runtime/contracts/command-manifest.json:2274` ("its frame tells it to reply in one line") still
   say something true. Edit them only if the chosen wording contradicts them (both are hot files of other lanes).
2. **Freeze v7o**: one commit that writes `test/live/mailbox-behaviour.v7o-addendum.json` through `writeOnce` over
   the final bytes, plus `test/scripts/mailbox-behaviour-v7o.test.mjs`. That test owns: binding to V6's hash, the
   files it freezes (frame, limits, adapters, live-confined, run.mjs, v7/v7f/v7g/v7j, live driver), the shipped arm,
   and "matches what the runner would freeze". Then OPC review point 2.
3. **Stage B** (quiet window 2, HOLD line): the ack `leak` cell (6 per CLI, chosen wording, host rebuilt from the
   branch head), then v7o through `test/live/mailbox-behaviour.live.mjs --addendum v7o`, then the controller marks
   through a delegate reviewer, as V7n did. Stop rules as frozen.
4. **Report** at the `fgos convention path` report location: stage A and B numbers, the choice and the rule, the
   v7o verdicts (harmful pooled, H1, H2), exclusions, cost, the limits (2.1.309 socket frame text, untested versions
   if Q2 = no), and the spec lines for the spec owner (or the spec edit itself if Q5 allows).
5. **CHANGELOG** `## [Unreleased]`: the new acknowledgement wording, and Claude 2.1.326 tested (if Q2). Board: the
   MAIL lane row, one log line, and a note to S4/COOK about Q3's answer.
6. **Landing gate**: full `npm test` + `cargo test --workspace` through the queue (read the fail count and the ERROR
   lines), msvc/darwin `cargo check` for the touched crates, `clippy -D warnings`, regenerated census. Then OPC review
   point 3. Then land on main and push.

## Validation

- `mailbox-behaviour-v7o.test.mjs` is green and v7n's record assertions are green. `frame.rs` and `limits_contract.rs`
  are green. A `git diff origin/main --stat` lists only the files in the plan's phase table.
- Leak cell 0 of 12 (otherwise stop and reopen the wording; do not land the reword).
- v7o harmful pooled acted = 0 for the bar, or the report says plainly that it failed and the frame text that ships
  stays as main has it. In that case only the zombie, door and limits work lands, and v7o is still recorded.

## Risk and rollback

A leak or harmful hit means the reword does not land: revert step 1 on the branch and land the rest with v7o
re-frozen over W0. If that happens, ask the owner before spending a second v7o budget. After landing, revert the
landing merge. The frame only reaches users in a new release.
