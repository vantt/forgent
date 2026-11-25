---
id: p-427ymxp33q
title: "The land gate fails at random when a live head writes into .fgos while the gate's tests run (land; source: owner, 2026-11-25)"
status: done
priority: P1
area: land
created: 2026-11-25
---

# Why

`fgos land` runs `scripts/run-tests.mjs` in the main checkout. That script snapshots the whole `.fgos` store before and after the run and fails the gate with `test suite leaked unexpected files or modifications into .fgos store` on any difference outside `allowedFgosMutations`. On a machine with live heads, other sessions write into `.fgos` all the time: the watcher state, head tickets, unit-run assignments, session rotation. A gate that runs for 40 seconds is hit by one of those writes often. Measured 2026-11-25 12:10: 9 of the last 30 land gate logs under `.fgos/runtime/land/` failed that way with every test green (170 of 170 passing). Two lands of one skill change failed this way in a row, once on `.fgos/runtime/watcher/state.json` and once on a lead's unit-run assignment.

This is a likely cause of the lands that "never get through" while main moves: the remote lead DOCOS rebased `docos/howto-doctor-tables` at least twice, and every retry reruns the gate.

# Done when

The leak check judges only what the test suite itself wrote, not what other sessions wrote at the same time, for example by running the gate against a store the live system does not write to, or by attributing writes to the test process. A land whose tests all pass is not refused because a head ticked. No env switch or flag that skips the check.

# Notes

Related: p-rjzck3f7mg (main takes a commit every two to three minutes, so every retry has more to fight). Fix the gate first: it makes a land fail with nothing wrong in it. Do not weaken the check; one proof of "the suite leaks nothing" stays, owned by the run-tests script.
