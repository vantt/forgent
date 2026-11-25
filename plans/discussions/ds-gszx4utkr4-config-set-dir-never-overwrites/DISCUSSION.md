---
id: ds-gszx4utkr4
title: "fgos config set --dir must not overwrite the tracked project config"
status: open
source:
  - p-mfllw32ynj
created: 2026-11-26
---

discussion: open

## Seed

Opened by the secretary (Miu) on the owner order relayed by lead:SUPERVISOR, goal set 2026-11-26. Read the source backlog rows first; they hold the evidence. Park owner questions in the question store instead of waiting on them.

- **Outcome:** `fgos config set --dir <linked worktree>` never writes a fresh project config over the tracked one, and a hidden overwrite cannot occur. Data-loss risk; back up before any change.
