---
id: p-1837c4c7
title: A pi-backed run keeps no transcript, so a blocked or failed claim cannot be audited afterwards
status: proposed
priority: P2
area: general
created: 2026-10-22
---

# Why

Seen 2026-10-22 on `unit-run-1792618444653-dbc49199` (openai via the `pi-herdr` invocation): the agent reported plan files absent and went blocked; the pane closed, `stdout.log`/`stderr.log` hold only the last 39 lines (final report and result heredoc), and no pi session file exists under the confined HOME or `~/.pi`, so the commands it ran (its `pwd`, `ls`) are gone and the claim could only be disproved indirectly (`p-6f17c807`).

# Done when

A pane run's evidence keeps the agent's full terminal transcript (or the agent CLI's own session log) in the runDir, for every transport, so a reviewer can read the commands behind a claim after the pane closes; a test proves the transcript survives pane close

# Notes

Migrated from the legacy backlog table. Original status: proposed.
