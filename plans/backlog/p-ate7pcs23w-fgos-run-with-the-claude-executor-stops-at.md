---
id: p-ate7pcs23w
title: "`fgos run` with the claude executor stops at Claude Code's directory-trust prompt even in a trusted repository (runner, priority high)"
status: proposed
priority: P1
area: runner
created: 2026-11-17
---

# Why

On 2026-11-17 on fg-server2 (rc.10), three `fgos run --pattern solo --provider claude --writes ... --worktree <linked worktree>` runs ended `blocked / provider-blocked` with `terminal:needs-human`: the pane starts Claude Code with its working directory in the run dir `.fgos/assignments/<run>/producer/1/runs/01` (inside the main checkout, not the worktree), and Claude Code asks "Adding a new directory … This session hasn't worked here before" although `/home/vantt/projects/forgent` is trusted (`hasTrustDialogAccepted: true`). So out-of-process claude seats cannot run headless in this repository; the plan-supervisor RUNBOOK step B3 (trust the folder once) does not cover it. Cause found the same day: the seat does not use the person's `~/.claude`; inside bwrap `~/.claude` is a tmpfs and fgOS composes a per-run Claude home (step `finalize-home`, a copied `.claude.json`), and its `cleanup-trust` step recorded `trust: none-written`: fgOS wrote no trust entry for the seat's working directory, so trusting the folder interactively (owner tried, no prompt there) cannot help.

# Done when

A headless claude seat starts without a trust prompt in a trusted project: either the seat's working directory is the worktree it writes (or another already-trusted path), or the invocation passes Claude Code's documented non-interactive trust/add-dir setting; the fix is proven by one live `fgos run --provider claude --writes` reaching `pass` on this repo, and a pane that does stall on a prompt still ends `needs-human` with the prompt text. Fix on branch fix/claude-seat-trust seeds trust for every `--add-dir` directory in the seat's private home; live pass re-run open until the claude quota resets on Nov 19 or another claude account.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
