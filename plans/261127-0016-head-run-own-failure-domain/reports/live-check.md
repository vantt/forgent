# Phase 4 — integration and live check

Status: the suites are recorded (acceptance criterion 5). The live check (criterion 4, steps 2-5) has not run yet.
It waits for the supervisor's release from main, which follows plan `261127-0829-red-tests-before-release`.

## Step 1: full suites on the combined tree

Run by lead:SUPERVISOR, unconfined, on a clean `main` at `b2682853bbad1ec6108929af3630bf155afd0567`, on 2026-11-27.
That tip contains phases 1-3 (phase 3 landed at `4cb58c9240`). Logs are in `.fgos/runtime/tmp/p0-0016-phase4/`
(`tip.txt`, `npm-test.log`, `cargo-test.log`).

| Run | Exit | Result | Failing |
|---|---|---|---|
| `npm test` | 1 | 6571 tests, 6542 pass, 2 fail, 27 skipped | `test/docs/run-doors-doctrine.test.mjs` "the run-door-contract unit teaches both doors…" and `test/scripts/project-agents.test.mjs` "the real personas project through the start-context door…" (`start-rule-set-invalid`), plus the run-tests `.fgos` store guard (deleted `.fgos/runtime/dev-host/run-NJevrK`) |
| `cargo test --workspace` | 101 | 597 pass, 1 fail in the `fgos` crate | `wiring::session_rotation_hook::tests::a_session_opened_by_hand_gets_the_rules_scoped_to_hand_opened_sessions_as_its_one_additional_context` (`session_rotation_hook.rs:1357`) |

All three failing tests are the worktree-environment failures that plan `261127-0829` proved
(`plans/261127-0829-red-tests-before-release/reports/phase-04/result.md`). A fresh worktree lacks the tracked
`.fgos/project.json` and `.fgos/instructions/effective/rules.json`. With `.fgos/project.json` restored, all three
pass (`plans/261127-0829-red-tests-before-release/reports/phase-04/rerun-start-context.log`). The store-guard
failure is the "real red" that the same 0829 report names and owns. No failure touches this plan's files, so
criterion 5 is met for this plan's change. The suite-wide reds belong to plan 0829.

## Steps 2-5: live check on fg-server2

Not run. The release build, stage and activate, two test heads in their own `fgos-run-*.scope`, `kill -9` of one
supervisor with the `session-gone`/`supervisor-gone` event, and `systemctl --user stop fgos-watcher-<id>.service`
are run by the supervisor once 0829 closes. A lead never starts or stops a session. Results go below.

| Step | Pass/fail | Evidence |
|---|---|---|
| 2 release built, staged, activated | pending | |
| 3 each supervisor in its own scope, binding `failureDomain` | pending | |
| 4 `kill -9` one supervisor: other socket answers; `session-gone` with `supervisor-gone` | pending | |
| 5 watcher unit stopped: both sockets answer | pending | |
