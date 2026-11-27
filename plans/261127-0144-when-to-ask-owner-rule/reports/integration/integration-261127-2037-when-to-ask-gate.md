# Integration gate: when-to-ask-owner-rule phase 3

Combined tree: branch `when-to-ask-owner-rule/p03` (main `b2ac1288fb` with phase 1 and 2 landed, plus the changelog
line `eab8140d51` and the golden recapture `d33c9625c5`), landed on main as `bcd8afab09`. All suites were run
unconfined by `lead:SUPERVISOR` in the p03 worktree; logs are under `/var/tmp/r/gates/0144-p03/`.

## Results

| Command | Exit | Outcome |
|---|---|---|
| `grep -n "set or change a direction" CHANGELOG.md` | 0 | Line present under `## [Unreleased]`. |
| `npm test` | 1 | 6542 pass, 5 fail. One failure was this plan's (fixed below); four are not this plan's; one was load. |
| `cargo test --workspace` | 101 | 7 failures. Two were this plan's (fixed below); five are not this plan's. |
| `cargo test -p fgos-agent-start-context` (rerun after the fix) | 0 | All tests pass. |
| `test/scripts/project-agents.test.mjs` through the test runner (rerun after the fix) | 0 | 12 pass, 0 fail. |
| `test/runner/claim-lock-window.test.mjs` alone | 0 | 2 pass, 0 fail. |

## Failures caused by this plan, fixed

Phase 1 changed one decision-boundary line in `core/agents/{secretary,supervisor,shaper}.yaml`. The 16 start-context
goldens built from those personas (three `agent-file` and 13 `opening` files under
`packages/agent-start-context/goldens/`) were not recaptured. That failed `project-agents.test.mjs:183`,
`goldens.rs::every_agent_file_golden_is_composed_byte_for_byte_with_no_rule_in_it` and
`every_head_opening_golden_is_composed_byte_for_byte`. Commit `d33c9625c5` replaces that one line in the 16 goldens
and names the recapture in `goldens/NOTES.md`; the reruns above pass. The phase 3 footprint was widened for
criterion 7 (`349b4dd8ff`).

## Failures not caused by this plan

This plan changed only docs, skills, agent text, goldens and the mutation census. These failures do not involve those files:

- `run-doors-doctrine.test.mjs:25`, `project-agents.test.mjs:183` (its rules.json case) and cargo
  `session_rotation_hook a_session_opened_by_hand...`: they fail in any fresh worktree because the skip-worktree
  `.fgos/instructions/effective/rules.json` is absent there. They failed the same way in plan 2324's gate.
- `runner/loop.test.mjs` (600 s timeout) and `mailbox-live-confined.test.mjs:390` (known interference): identical to plan
  2324's baseline.
- `runner/claim-lock-window.test.mjs:71`: a 3 s timing check under suite load; it passes alone (above).
- cargo `init::holder_lock_gate...` and `machine_private_roots...`: not this plan's files, per the supervisor's triage.
- cargo two `release_run_*` tests: fixed on main by plan 1224 phase 2.

## Acceptance criterion 7

The changelog line is present. Both suites are green for this plan's behaviour: each remaining failure is shown above
to be outside this plan. The phase passes.

## Door issues seen (for the supervisor to file)

- `fgos land` refused `.fgos/instructions/effective/rules.json` as `land-outside-footprint` although the footprint
  declares `.fgos/instructions/effective/**`.
- `fgos supervisor widen` judged the 16 goldens already covered by the footprint, while `fgos run --writes` refused
  them as outside it.
