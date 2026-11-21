---
id: p-5gczifzh7h
title: "The supervisor takes a lead's \"waiting on a background shell\" at its word and never checks that the wait is still going (supervisor, priority high; source: owner, 2026-11-21 22:29, \"rất nhiều pane idle mà không ai quan tâm, watcher không để ý à\")"
status: proposed
priority: P1
area: supervisor
created: 2026-11-21
---

# Why

At 22:29 the owner found several idle lead panes. lead:WINCI started a wait loop on three Windows CI runs at 18:36. The runs finished at 19:40, but the lead never resumed and sat idle for about 3 hours, until lead:SUPERVISOR typed into its pane at 22:33. The supervisor wake at 22:18 did not list that plan at all. For lead:WINCUSTODY it judged "idle with a background shell watching CI, it wakes when the shell exits, not stuck", read only from the screen. The same wake called the work-data-model lead "busy", but that lead had just been interrupted after a land refused `resource-recovery-required`. The watcher does raise `session-idle`, and the wake for a live idle lead exists (p-waxzxz5mio, done), but the judgement trusts the pane's own claim: nothing checks that the shell or run the lead waits on is still alive, or that what it waits for is still pending. Related: p-vquz26ibnn item 7 (idle alarms and wake rate not tuned).

# Done when

When a live lead is idle, the supervisor checks the thing it waits on (the background process exists, the CI run or request is still pending) and wakes the lead as soon as that wait is over; a screen claim alone never closes a `session-idle` event. A fixture with a finished wait and an idle lead shows the lead woken within one watcher interval.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
