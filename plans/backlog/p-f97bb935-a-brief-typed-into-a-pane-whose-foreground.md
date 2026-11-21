---
id: p-f97bb935
title: A brief typed into a pane whose foreground process is the shell is run by the shell, and its backtick spans run as commands
status: done
priority: P2
area: general
created: 2026-10-21
---

# Why

Observed 2026-10-21 02:43 (reported by session `forgentx-5f`, doc plan 260925 Phase 8): `unit-run-1792525366556-23ed5f57` (gemini/omp) never started; the supervisor typed the brief line by line into zsh (`stdout.log` lines 13-68: `command not found: Objective:`, `- Mutation` lines run as `cd -`), and at line 47 zsh ran the backtick span holding the ack path as a command (`no such file or directory: …/outbox/ack-1.json.tmp`). Briefs routinely carry spans such as `fgos run` and `env -u …`, so a typed brief can execute commands in the worktree with the owner's shell rights. This time the cancel landed first (worktree clean, no new runs). Delivery side of `p-d2dc4f2e`; split out because it is a safety invariant, not a reliability fault. Interim mitigation in use: pointer prompts with no backticks.

# Done when

Before every send into a pane, the terminal driver confirms the pane's foreground process is the launched agent, never a shell, and refuses with a named reason otherwise (also for the prompt door); a test sends a brief with a backtick span into a pane whose foreground is zsh and proves nothing is typed and nothing runs Recurred 2026-10-21 18:2x on the active release that predates the fix (`unit-run-1792581615925-e6070be1`, gemini/tetcu72: brief typed into zsh, only `command not found`, worktree clean; reported by `forgentx-5f`) — expected until the fix is activated.

# Notes

Migrated from the legacy backlog table. Original status: done (main `82903e710`: `065cc620a` refuses a send while the foreground is the shell, `foreground-not-agent`; the gate flushes unread tty input before handing the tty back; active in all three owner-machine workspaces since release `52a7e0ac…` 2026-10-22 02:56; seen refusing correctly 04:20 when omp exited to the shell).
