---
id: p-a178ca5c
title: "A herdr pane run can die before the agent reads its brief: the user's interactive shell and the agent CLI's own start screen race the typed launch line and brief"
status: done
priority: P2
area: general
created: 2026-10-22
---

# Why

Seen 2026-10-22 08:5x on release `a2b19d78…`: (1) `[oh-my-zsh] Would you like to update? [Y/n]` in the fresh pane swallowed the first keystroke of `cd <runDir> && launcher.sh`, so it ran as `d '<runDir>' && …` (mcp-skill-hub `unit-run-1792634101346-4b90086b`; forgentX DOC `unit-run-1792634106376-588dca27`, gemini/omp, which also printed "Still starting after 10s"); (2) with the launch line intact, agy (Antigravity CLI 1.4.2, gemini/mucdong in mcp-skill-hub) showed a "Meet Gemini 4 Argon … esc to dismiss" banner, took the pasted brief and then exited to the shell (`unit-run-1792634261328-e5d67cdd`). Each time `terminal:foreground-not-agent` cancelled the run correctly (nothing ran in the shell). mcp-skill-hub's `execute`/`code:*` lead with gemini=agy (MP-B1 06), so every such run there fails today. Same family as `p-d2dc4f2e`. 09:46: the owner ran `omz update` (removes cause 1 on this machine only); the next mcp-skill-hub run passed on agy (`unit-run-1792637184012-c7facdf4`), so the agy banner case is intermittent. The item stays: any user shell with a start prompt can still break a launch.

# Done when

A pane launch does not depend on the user's interactive shell state (launch the launcher as the pane's own command or wait for a ready shell, and start shells with their update prompts off), and a delivery waits for the agent's input to be ready (start screen dismissed) before typing; tests cover a shell that prints a prompt on start and an agent with a start banner

# Notes

Migrated from the legacy backlog table. Original status: done (main `172b3906b`: a ready-shell handshake types the launcher only after the pane's own shell has run a probe and holds the foreground; panes start with `DISABLE_AUTO_UPDATE=true`; per-CLI start-banner data dismisses agy's banner before the brief; tests in `core_failures.rs`, `agy/vectors.json`, `supervise_terminal_fake_herdr.rs`; active on `fg-server` since release `fe017e04…` 2026-10-23 00:56, live: probe `fgos-ok-<nonce>` seen in the zsh pane before the launch line, `DISABLE_AUTO_UPDATE=true` in the pane shell, 7/8 read-only runs pass; the one failure is `p-4bkfiw7d3j`; report `plans/reports/measure-261022-1758-cook-p6-pane-launch.md`).
