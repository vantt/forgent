---
id: p-cf1280a6
title: A codex council seat in a worktree without project hooks stopped at `Continue anyway? [y/N]` once (c
status: proposed
priority: P2
area: dispatch-worker-hygiene-and-recovery
created: 2026-10-09
---

# Why

A codex council seat in a worktree without project hooks stopped at `Continue anyway? [y/N]` once (council-lite, 2026-10-09); not reproduced, cause unknown. A failed round that closes its pane now keeps the last 40 screen lines in its failure record, so the next occurrence has evidence. Open it when it recurs: read the `screen` field of the failure record, find what asked, then decide the fix.

# Done when

The dialog's full text is captured from a real recurrence and the seat no longer stops on it, proven by one named run

# Notes

Migrated from the legacy backlog table. Original status: proposed.
