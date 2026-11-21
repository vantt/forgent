---
id: p-vquz26ibnn
title: "Make the secretary and the supervisor stable and fully able before any other work moves (session-host, priority high and first after the release hold; source: owner via Miu, 2026-11-21)"
status: proposed
priority: P1
area: session-host
created: 2026-11-21
---

# Why

Owner order: the system only runs smoothly when Miu and the supervisor are stable, so they come first and other rows rank behind this one (no other row is edited). Gaps found today, each with its own row where one exists: (1) a head cannot write friction, `fgos friction record` fails on the read-only observe lock (p-ndortdckid); (2) the supervisor cannot change config, `fgos config patch` is refused `config-write-confined`, so the planner pin to Opus waits on the owner (q-o3omqvtsuc); (3) a head keeps the release it started on (p-ycausep3zs); (4) a coordinating head can be bound to a weak provider (p-of5vpvce3e, p-s2t244hkqj); (5) a head ran 33 hours without rotating (p-4r4h3jqtth); (6) `fgos answer` fails on the read-only locks in the secretary sandbox, still to confirm whether it is needed once work items retire; (7) the supervisor head restarted 85 times in about 8 hours (generation 41 at 01:22Z, 126 at 09:25Z), mostly on session-idle alarms that were false, and the idle alarm and wake rate are not tuned; (8) the manual `lead:SUPERVISOR` session still runs all day because no retire condition is written; (9) Miu's own login (claude-miu) expired and her seat runs on the tetcu pool. Owner decisions 2026-11-21 17:39: (2) yes, `config patch` joins the supervisor grant; (6) withdrawn, the secretary's `questions answer` is how the owner's reply reaches the asker and it already works, while the old Work-item `fgos answer` was a different verb and is not a head need; (8) approved, the manual `lead:SUPERVISOR` session retires once the supervisor head runs one plan end to end alone; the verb-by-verb list is approved in principle and is written by the supervisor, with the owner reading the final table. Owner added 2026-11-21 21:28: (a) the secretary does not wake on its own; it acts only when the owner types or mail arrives, so two owner questions sat open over 2 hours unreported. The secretary must be woken when the question store or the mailbox has something new, and must relay open owner questions in the five-part form without being asked; the mechanism (watcher event, timer, or both) is for the supervisor to propose and the owner to choose. (b) Measure it: time from a question being asked to the owner seeing it. (c) Lead sessions that park a phase for another party's work must raise an event themselves, so no lead sits idle unseen.

# Done when

One owner-approved list of what each of the two heads must be able to do through its request socket and what it must never do, checked verb by verb from a confined head (a live probe per verb, not a reading of the grant); every gap above either closed or named as out of scope with a reason; the supervisor wake rate and false idle alarms measured before and after a tuning change; written retire condition for the manual supervisor session (a plan run end to end by the head alone); each of the nine items is a row, a closed row or an explicit no.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
