---
id: p-ogziciqtrb
title: "`session-no-result` wakes the supervisor about 116 times a day and looks false: measure it before any change (supervisor, priority medium; source: owner via Miu, 2026-11-23, evidence from heads-stable phase 9)"
status: proposed
priority: P2
area: supervisor
created: 2026-11-23
---

# Why

The phase 9 after-measure of plan `261122-0118-heads-stable-and-able` found `session-no-result` is now the second source of supervisor wakes: 116 in the 24-hour after window (4.8 per hour) and 123 in the 49-hour baseline. The change in that plan did not touch it, and nobody has yet decided how many of these wakes are false. Evidence: `plans/261122-0118-heads-stable-and-able/reports/after-wake-and-idle.md`.

# Done when

A written rule says when a `session-no-result` wake is false or true, and a measurement over a stated window counts both with the same commands as the phase 9 report. Only after that is a change chosen, and a change is measured before and after like the `session-idle` one. The measure also checks whether the fix of `p-du3gbevrs5` already lowers this count.

# Notes

Owner approved 2026-11-23. Order after `p-du3gbevrs5`: the fallback fix may change what this measure sees.
