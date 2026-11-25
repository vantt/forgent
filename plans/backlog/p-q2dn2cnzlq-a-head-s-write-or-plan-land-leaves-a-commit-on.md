---
id: p-q2dn2cnzlq
title: "A head's write or plan land leaves a commit on local main that is never pushed, and every later land is refused `land-target-ahead` (git, priority high; source: owner via Miu, 2026-11-21; hit twice in one day)"
status: proposed
priority: P1
area: git
created: 2026-11-21
---

# Why

Commit 9ee4b097a (a lead's plan.md park, 2026-11-20 16:48) and commit 9469a4b57 (`docs(head:supervisor-forgent): write docs/backlog.md`, written through the head write door, 2026-11-21) both stayed on the main checkout's local main without reaching origin. Every `fgos land` after them was refused `land-target-ahead` (a work-data-model phase was parked for it, and the cores phase 4 land waited) until the supervisor pushed by hand. Cause not yet proven: which door leaves the commit (`session write`, `land --paths`, or the land door interrupted when the disk was full) and why its push step does not follow.

# Done when

The cause is proven by naming the door and the step. A head write, or a `land --paths`, either ends with the commit on origin/main or leaves local main unchanged, never ahead. A later head's `fgos land` succeeds with no hand push, and an owning test shows exactly that: a head write followed by another head's land. If a push can fail, the door reports it and its own verb retries it; nothing is left for a later land to trip on.

# Notes

Migrated from the legacy backlog table. Original status: done (plan 261121-0747-land-door-hygiene, commit e7701dcfc: a rejected paths land undoes its own unpublished commit and retries from a fresh sync).

2026-11-22 18:24 recurrence (lead:SUPERVISOR): a secretary land of a discussion seed left local main at 2a295e00b, not pushed, with pending chain land-258313-1795346357099722999-1. Every other land was then refused with land-target-ahead, and once with land-abandoned-writer-mismatch, until lead:SUPERVISOR pushed it by hand. Same shape as 8c3c3a611 on 2026-11-21.

Likely root cause (lead:OPC, 2026-11-22 18:35): both dead chains of the day (land-50307 at 11:55, land-258313 at 18:24) were pid writers with no session id. The secretary and shaper lands appear to run without FGOS_SESSION_ID, so a land that dies leaves a chain nobody can recover by its own id, and its pushed-or-not commit sits on local main (2a295e00b, cc8bb2699).

# Update 2026-11-25 (supervisor, owner order to fix landing)

Seen again three times today: after a dead land writer (`land-477002`, 13:23), after an owner by-hand commit on main (`b4581336d`), and after the supervisor's own land died at the push step (`83c313366`, 14:12). Each time every land was refused `land-target-ahead` until a person ran `fgos git recover` and pushed; a confined head cannot (`.git` read-only), so only one unconfined session could. Three leads waited on it at once. This row has been `proposed` since 2026-11-21. Owner asked on 2026-11-25 to fix the landing blockage first. Do it in one plan with `p-o4juyw2ntg`: both are the same door, the land door finishing or recovering its own half-done work.
