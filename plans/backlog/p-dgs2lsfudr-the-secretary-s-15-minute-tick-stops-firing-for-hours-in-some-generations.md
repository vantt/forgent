---
id: p-dgs2lsfudr
title: "The secretary's 15-minute question tick stopped firing for hours in some generations, and most answered questions have no relay record (secretary, priority P1; source: lead of plan 261122-0118-heads-stable-and-able, phase 10 measure, 2026-11-23)"
status: proposed
priority: P1
area: secretary
created: 2026-11-23
---

# Why

Phase 10 of plan `261122-0118-heads-stable-and-able` measured the secretary's 15-minute `questions list` tick. It cut the
median owner wait from 76 to 15.5 minutes, but it did not fire for hours in generations 32 and 34 to 37
(2026-11-22 15:29Z to 2026-11-23 07:30Z). Those silences hold the four longest waits of the window (110 to 203 minutes).
15 of 19 answered questions have no relay record. Evidence:
`plans/261122-0118-heads-stable-and-able/reports/secretary-wake.md`.

# Done when

The cause of the missed ticks is proven from the secretary's transcripts (never armed, or the loop stopped), and the
fix keeps the bound "at most one tick" across generations, or the event-driven wake half owned by plan
`261122-0056-orchestration-skeleton` replaces the dependency on the tick. The missing relay records are explained or
fixed.

# Notes

The transcripts sit in the secretary's confined home; the lead's sandbox cannot read them, so the investigation needs an
unconfined session or the owner.
