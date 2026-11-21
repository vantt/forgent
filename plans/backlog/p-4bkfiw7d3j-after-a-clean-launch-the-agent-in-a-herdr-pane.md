---
id: p-4bkfiw7d3j
title: After a clean launch, the agent in a herdr pane sometimes loses the terminal foreground about 7 s after it starts, before the brief is typed; the shell takes the tty back and `foreground-not-agent` cancels the run
status: proposed
priority: P2
area: general
created: 2026-10-23
---

# Why

Seen 2026-10-23 00:59 on `fg-server`, release `fe017e04…` (pane launch fix active): `unit-run-1792691991881-bb9ea1d6` (gemini/omp, read-only): the probe and launch line ran correctly, omp drew its ready screen, then zsh printed its partial-line `%` and prompt about 7 s after start; the supervisor refused the brief at 18:00:02Z (`nothing typed into the pane: the pane's shell (pid 4183583) is in the foreground`), the gate was SIGKILLed by the cancel at 18:00:13Z (`gate-exit.json`), omp captured no stdout or stderr. The same symptom hit COOK P6 row 2 on the older release `ce430e51…` (`unit-run-1792641651323-104e13d5`, 17 s after launch). Rate: 1 in 8 runs on 2026-10-23, 1 in 8 launches on 2026-10-22. The failed run is the only one where the pane was read every 0.5 s with `herdr pane read`, which is read-only but not yet ruled out. Same family as `p-d2dc4f2e`. Nothing ran in the shell: the safety gate held.

# Done when

A test reproduces an agent whose job loses the tty foreground after start (stopped or exited) and the cause is named from the pane facts (job stopped, agent exited with its code, or foreground handed back); a run either keeps the agent in the foreground until the brief is typed or ends with that named cause instead of a generic cancel; a 20-run live check on `fg-server` shows no such loss

# Notes

Migrated from the legacy backlog table. Original status: proposed.
