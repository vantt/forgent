---
id: p-6f17c807
title: A pane agent starts in its runDir instead of the unit's worktree
status: done
priority: P2
area: general
created: 2026-10-22
---

# Why

Observed 2026-10-22 04:3x on release `sha256:a2b19d78…` (reported by session `forgentx-5f`, doc plan 260925): `unit-run-1792618444653-dbc49199` (`fgos run --provider openai --worktree …phase00…`, bound to the pi invocation) had `envelope.json` `cwd` and `effective-execution-contract.workspace.cwd` = the worktree, but the pane prompt read `01 git:(main)` and the Doer resolved relative paths against `…/producer/1/runs/01`, reported the plan's scripts absent and went blocked. The owner-machine smoke panes (gemini/omp) also sat in the runDir. Earlier codex panes had `foreground_cwd` = worktree. Interim mitigation in use: `cd <worktree>` at the top of the prompt. Cause being bisected (gate / run-supervisor direct-launch / herdr-spawn; also why `--provider openai` now binds pi instead of codex).

# Done when

The launched agent's working directory is the envelope's `cwd` for every transport; a test launches a pane run with a worktree and proves the agent process's cwd (`/proc/<pid>/cwd`) is the worktree

# Notes

Migrated from the legacy backlog table. Original status: closed, not reproduced (2026-10-22 04:45): a live probe on the same release (`seat-p09-lead`, temp worktree, pi/openai and omp/gemini) had `pwd` and `$PWD` = the worktree in both; the pane prompt `01 git:(main)` is the launcher's cwd (runDir by design since `ad4d68ce1`), not the agent's; the files the agent called absent were present at the run's HEAD `775836a7c` (`git ls-tree`). Most likely a false claim by the standard-tier model; no command output survives to prove either way, see `p-1837c4c7`.
