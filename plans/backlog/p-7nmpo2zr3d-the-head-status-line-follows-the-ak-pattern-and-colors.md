---
id: p-7nmpo2zr3d
title: "The head session status line follows the ak status line's layout and colors, and shortens or simplifies what it can (session host, priority P3; source: owner 2026-11-23)"
status: done
priority: P3
area: session-host
created: 2026-11-23
---

# Why

Today the head status line reads `fgOS head · ctx 12% | quota 7%` in plain text (`status_line` in `apps/fgos/src/wiring/session_rotation_hook.rs`). The owner asked for it to take the ak status line's layout and colors, and to shorten or simplify any part where that loses nothing. The line also feeds the rotation measure (a sidecar record beside the transcript), so the numbers must stay exact and the sidecar contract must not change.

# Done when

The head status line uses the ak layout and colors, shows the same context and quota figures, is shorter where it can be, and the existing proof for the status-line output and the sidecar record still holds.

# Notes

The ak reference: `.claude/settings.json` points the repo's own status line at `/home/vantt/projects/forgentX/.claude/ak-engineer-statusline.cjs`, but that file does not exist on this machine, so the planner must locate the ak status line first. Spec: `docs/platform/session-host/spec.md` (the status-line sidecar writer, lines 165-173).
