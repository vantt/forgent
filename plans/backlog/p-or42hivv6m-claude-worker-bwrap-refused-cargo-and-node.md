---
id: p-or42hivv6m
title: "The claude worker (claude-cli-bwrap) is refused cargo and node, so claude units cannot build or test (runner, priority medium; source: lead:SUPERVISOR, 2026-11-23)"
status: proposed
priority: P2
area: runner
created: 2026-11-23
---

# Why

Claude units cannot run cargo or node inside the confinement, so they cannot build or test. Evidence: plans/261121-2110-component-authority-doors/reports/lead-261123-0915-wave-1-parked.md. Related to p-dkkodseo63.

# Done when

A claude unit can run cargo and node under its confinement, or the runner routes build and test work to a seat that can.

# Notes

Reported by lead:SUPERVISOR on 2026-11-23 and filed by the secretary on the owner's order. The cause is not proven by the secretary; evidence is in the reports named above.
