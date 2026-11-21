---
id: p-re2cgxvfq5
title: "A rotation successor on release c9506cc4 never started its CLI in its pane, so the rotation failed with no-answer (session rotation, priority high; source: owner via Miu, 2026-11-21; same family as p-4r4h3jqtth)"
status: done
priority: P1
area: session-rotation
created: 2026-11-21
---

# Why

At 08:23 +07 a manual rotation of the secretary from generation 18 spawned generation 19 in pane w6:p1B2 (run dir .fgos/assignments/head-secretary-miu-19/runs/01). Its supervise log says it typed nothing into the pane because the pane's shell was still in the foreground, and rotation.log records `no-answer` after 120000 ms. Generation 18 kept running. The previous rotation, 17 to 18 on the older release, worked. Cause not proven: what changed on c9506cc4 between the pane spawn and the brief typing (head start opening, tab label, or terminal-control changes), and why the foreground check never saw the CLI.

# Done when

The cause is named with evidence from the gen 19 run dir and supervise log. A rotation on the current release starts the successor's CLI and gets its answer. An owning test or a live rotation proof on a throwaway head shows the successor answering. A failure records its reason in the rotation record.

# Notes

Migrated from the legacy backlog table. Original status: done (plan 261121-0851-rotation-successor-launch, commit 1328342e0; live after the next release).
