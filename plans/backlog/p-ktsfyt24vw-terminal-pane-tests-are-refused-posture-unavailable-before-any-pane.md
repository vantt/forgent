---
id: p-ktsfyt24vw
title: "The herdr pane-lifecycle tests are refused posture-unavailable before any pane starts (run-supervisor, priority medium; source: start-context lead, fg-server, 2026-11-27)"
status: proposed
priority: P2
area: run-supervisor
created: 2026-11-27
---

# Why

`test/run-supervisor/terminal-cutover.test.mjs` (8 of 10) and `terminal-crash-matrix.test.mjs` (1 of 1) fail on main,
and on `f68937f41` before them. Each `startController` run of `test/run-supervisor/support/terminal-harness.mjs` ends
at once with outcome `policy-refusal`, reason `posture-unavailable`: `executor "seat" has no invocation that can carry
this seat's posture`. The test then times out waiting for an attempt directory that is never made.

A `fgos run` session never sets `postureAtLaunch`. So `resolve_posture_invocation`
(`packages/execution/rust/src/executor_model.rs`) requires a confined invocation with a registered, enabled bwrap
backend, for a writer seat as much as for a read-only one. Three changes were tried on fg-server and are not landed;
each alone still gave the same refusal:
- giving the controller's invocation `confinement: { backend: "bwrap" }`;
- making the unit a writer in a linked worktree;
- creating the project with `confined: true`, which registers the backend.

The two confined tests that pass start through `startFgosRun`, whose executor is built differently: two invocations,
a credential store, `HERDR_ENV`.

# Done when

The pane-lifecycle cases reach their pane again. Either the harness's controller executor is built the way a passing
confined run is, or the posture rule for these launches is settled and the harness follows it. Both files then pass
on a machine with herdr's fake and bwrap.
