---
id: p-cdsvrsfnui
title: "fgos session type puts text in the pane but never submits it, so a woken head stays idle (supervision; source: owner, 2026-11-25)"
status: done
priority: P1
area: supervision
created: 2026-11-25
---

# Why

The wake step of the supervisor skill types a check into an idle head with `fgos session type`. The text lands in the head's input box and the head does not start. Seen on 2026-11-25 on the heads lead (`head:lead-forgent-261124-0004-heads-1bb1c`) and the orchestration skeleton planner, each with a typed line left in its input box. A retry with a trailing newline did not submit it either.

This was already found on 2026-11-23: report `plans/reports/report-261123-1718-supervisor-wake.md` says "session type does not submit". It sat inside a report, never became a row, and was found again two days later.

# Done when

After `fgos session type`, the target head starts working on the text, and a test proves the host sends the submit key for each head CLI. If a head cannot be woken this way, the verb says so by name instead of reporting `typed`.

# Notes

Idle heads with no working wake path are the owner's main complaint: a lead or planner sits for a long time and nobody notices. Related to the keeper work; the keeper needs a wake that works.
