---
id: p-rjzck3f7mg
title: "Supervisor wake reports and lead progress notes stop landing on main one commit at a time (supervision; source: owner, 2026-11-25)"
status: proposed
priority: P1
area: supervision
created: 2026-11-25
---

# Why

Main is a hot shared store again. Between 10:00 and 11:45 on 2026-11-25 it took 45 commits, one every two to three minutes, and about 4 of them were code. Roughly 14 were supervisor wake reports, 14 were plan progress notes ("parked", "waiting on ticket"), and 7 were discussion edits. Every one passes the land door and its merge slot, so every lead and the supervisor queue behind each other. The same pattern ran from 2026-11-20: 142 wake report commits on the 20th to the 22nd and 58 on the 23rd.

No rule asks for this. `core/skills/fgos-supervisor/SKILL.md` says only to put the full report in a file named by `fgos convention path --kind report`; landing it on main is a habit. Prior art: on 2026-10-23 the owner decided plan records stay off main's tip through an archive ref (decision L12-129, `plans/*/reports/phase-08/owner-answers.md`), for size rather than frequency.

# Done when

Main receives code, settled decisions and plan status changes (draft, running, done) only. A wake report and a lead's running-state note are written somewhere that is not main's tip, with one stated home and one stated write rate. A design principle says every periodic writer names where it writes and how often.

# Notes

Owner order 2026-11-25: do not build a separate mechanism; fold the home for reports and running state into the keeper plan split out of `261122-0056-orchestration-skeleton`. Do not plan it a second time.
