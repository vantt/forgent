# Phase 4 — integration and live check

Status: the suites (criterion 5) and the scope, binding and isolation parts of the live check (criterion 4) pass.
One part of criterion 4 is still open (the head-supervisor raise); see "Open" at the end.

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

## Steps 2-5: live check on fg-server2 (lead:SUPERVISOR, unconfined, 2026-11-27 17:30)

Active release sha256:05acb89c, built from main dc49aa8816 and activated by hand on the owner's order.

1. **Scopes.** `systemctl --user list-units --type=scope 'fgos-run-*'` lists one transient scope per run supervisor started on the new release. Two examples:
   - `fgos-run-cmd_1795774904321_e8f97ab1.scope` holds a unit run of 0144.
   - `fgos-run-cmd_1795775304502_162a0e0b.scope` holds the 1557 lead.

   `/proc/<pid>/cgroup` of each supervise pid ends in its own `app.slice/fgos-run-<attempt>.scope`. None sits under `fgos-watcher-<id>.service`.
   Supervisors started before the release were launched from the old release and still sit in the launching session's scope. They move to scopes as they restart.
2. **Binding.** `supervisor-binding.json` `failureDomain` for both examples above is `{"kind":"systemd-scope","unit":"fgos-run-cmd_…"}`.
3. **Kill one.** Two throwaway read-only `fgos run` units started; their supervisors 1497691 and 1498563 each got their own scope.
   - `kill -9 1497691`: that supervisor and its scope (`…3087b59f`) are gone.
   - Supervisor 1498563 and its scope (`…fb8c1e10`) stay active and running.
   - The live heads (1557 lead, 0144 lead) keep answering, and `fgos session list` still lists the live sessions.
4. **Dead supervisor raised.** Pending: this waits for the next watcher tick (about 10 minutes). The head-state source then judges the killed supervisor dead, and the session-gone event should name it. lead:SUPERVISOR checks the queue after the tick and appends the result here.

Verdict: PASS for scopes, binding and isolation. The raise is to be confirmed after one watcher tick.

## Open

- **Dead-supervisor raise.** The kill in step 3 hit the supervisor of a throwaway `fgos run` unit, not a head's.
  The head-state source judges heads only, from `placement.json` and its `runDir` (`docs/platform/observe/spec.md`,
  `fgos.head.state`). So no `session-gone` with `supervisor-gone` is expected for that kill. Criterion 4 asks for
  the raise of a killed **head** supervisor: start a test head, `kill -9` its supervise pid, and after one tick see
  `session-gone` with state `supervisor-gone` for that head.
- **Watcher unit stop.** Done at 17:31; it passes (below).

## Watcher stop (17:31)

I ran `systemctl --user stop fgos-watcher-e9756c48.service` while 15 run supervisors were live.

- Every head's supervise pid survived. Before the stop the list was 1264836, 1434631, 1524287, 1524866, 1524901, 1627308, 1627327, 2808636, 2881217, 2928156, 3168132, 3233392, 3606232, 4073802 and 4086090.
- After the stop it was the same, except that one ordinary unit run ended (1627327) and another started (1634689); both were normal churn.
- The timer restarted the service by itself, which then showed `activating`. A watcher stop no longer takes any supervisor with it.
