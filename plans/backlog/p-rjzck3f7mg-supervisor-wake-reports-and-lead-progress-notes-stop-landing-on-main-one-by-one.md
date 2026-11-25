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

# Where it lives instead

Coordination data already has a home outside main: the Event Store (`docs/platform/event-store/spec.md`). Events are appended to an open log outside the work tree, acknowledged after fsync, and sealed into `refs/fgos/events/<machine-id>`; publication never takes `main-checkout` or the Work gate. The supervisor queue, the question store, the mailbox and head tickets already use it, and none of the 45 commits above was an event. Running state of a lead ("waiting on ticket", "parked") and the record of a wake belong there too, as events of a registered stream, not as text in a phase file or a report file landed on main. The same lesson as the 2026-10 event-store stall: nothing that is written often goes through the main checkout.

Plan frontmatter keeps changing only when the plan changes state for real (draft, ready, running, done).

# Discussions

A discussion is the same pattern: the shaping skill says to commit `DISCUSSION.md` at the end of every round, so every owner reply was a commit on main. On 2026-11-25 from 10:00 to 11:45, 9 of 83 commits were rounds of one discussion (`ds-ubqlutna6r`). Worse, the shaper edits `DISCUSSION.md` in the main checkout and lands later, so the file sits dirty on main while the shaper waits for the owner; at 11:08 that dirty file made lead 2108's sync refuse. Two discussion files and one new discussion folder were dirty at 13:50.

Owner order 2026-11-25 (agreed to proposals 1 and 2): a shaper works in a worktree or branch of its own for the discussion and commits each round there; the discussion lands on main once, when it is settled or a decision is final. No round is landed on main by itself, and the main checkout never holds a discussion edit.

# Done when

Main receives code, settled decisions (a discussion arrives once, settled) and plan status changes only. A wake record and a lead's running-state note are events of a registered Event Store stream, read by the supervisor and later by the keeper from there; no phase file or report file is landed per wake. A design principle says every periodic writer names where it writes and how often.

# Notes

Owner order 2026-11-25: use the Event Store that exists, no new mechanism, no `records/*` branch; fold the work into the keeper plan split out of `261122-0056-orchestration-skeleton` (the keeper must read lead state from this stream to see an idle lead). Do not plan it a second time.
