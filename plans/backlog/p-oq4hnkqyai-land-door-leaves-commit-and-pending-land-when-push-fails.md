---
id: p-oq4hnkqyai
title: "The land door leaves its commit on local main and a pending Land when the push does not complete, so every later land is refused (git, priority high; source: lead:SUPERVISOR, 2026-11-23)"
status: proposed
priority: P1
area: git
created: 2026-11-23
---

# Why

Three times between 08:15 and 10:50 a land left its commit on local main with a pending Land after an incomplete push. Every later land was refused until a host session pushed and ran fgos git recover. Evidence: plans/reports/supervisor-261123-1050-land-stranded-local-main-recovered.md and the morning supervisor wake reports. Related to p-q2dn2cnzlq.

# Done when

A land whose push does not complete settles or rolls back by itself and does not block later lands; the owning proof covers the failed-push case.

# Notes

Reported by lead:SUPERVISOR on 2026-11-23 and filed by the secretary on the owner's order. The cause is not proven by the secretary; evidence is in the reports named above.
