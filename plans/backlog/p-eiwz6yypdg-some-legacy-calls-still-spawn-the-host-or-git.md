---
id: p-eiwz6yypdg
title: Some legacy calls still spawn the host or Git many times (Host surface, performance, priority medium)
status: proposed
priority: P2
area: platform-foundations
created: 2026-11-17
---

# Why

Measured at the T9 baseline and not changed by it: the seat-binding doctor rows spawn the host 98 and 84 times, `fgos lock-status` takes 349 ms, and `getMainFgosDir` starts five Git processes. Doctor takes about 15 s in a release root against a 12 s target. S4 measured the doctor in the host (release build, 15 runs, median, 2026-11-17, through the activated shim): in a fresh project `fgos doctor --json` 4.36 s (4.65 s on the base release that ran it in Node) and `--fix` 5.14 s (4.86 s; one Node rows-bridge call for the checks and three for the fix segments, four in all); in a clone of this repository `--json` 3.80 s (4.08 s) and `--fix` 25.2 s (24.6 s; single runs range from 5.9 s to 25.7 s on both releases, so one step of about 20 s comes and goes in both). The seat-binding rows still run in Node until S5.

# Done when

Each of the three is measured before and after on one load class and brings the call count to one per fact; `fgos doctor` reaches the 12 s target or the owner accepts the figure.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
