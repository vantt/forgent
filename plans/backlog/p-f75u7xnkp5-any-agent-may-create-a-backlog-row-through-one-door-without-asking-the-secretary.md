---
id: p-f75u7xnkp5
title: "Any agent may create a backlog row itself through one door, without mailing the secretary: id minted, row file checked, index row added, landed as one change (backlog, priority P1; source: owner via Miu, 2026-11-28 16:0x)"
status: proposed
priority: P1
area: backlog
created: 2026-11-28
---

# Why

Today only the secretary writes backlog rows. A confined head that finds a problem mails the secretary and waits, and the secretary writes it. On 2026-11-28 this happened at least three times in one hour: the supervisor asked for a row because "its git dir is read-only", a lead's own mail to the secretary was refused `caller-unknown`, and a planner asked for five rows from a hand-off. Each row costs a mail, a wake and a round trip, and a row is lost when the mail is lost or the secretary is asleep. This works against the product priority "release humans": an agent that finds a real problem should be able to record it.

# Done when

- One door (for example `fgos backlog add`) that every head role may call, confined heads included, through their request socket. It does the whole job: mints the id (`fgos identity mint backlog`), writes the row file from the creator's text, checks it (frontmatter, the three sections the index requires, one title, a source naming who created it), adds the index row, and lands it as one change.
- The creator sets `status: proposed` only. The priority is the creator's advice; the owner or the secretary confirms it, and nobody but the owner raises a row above P1.
- The door refuses a row that nearly duplicates an open one (same near-duplicate check the rule writer uses) and says which row, so agents extend a row instead of adding a copy.
- The door treats the text as untrusted input (never spliced into a shell command), caps its size, and records who created each row.
- A test shows a confined head creating a row without the secretary, a refusal for a near-duplicate, and a refusal when the sections are missing.
- The secretary skill and the head skills say agents open their own rows; the mail route stays only for rows that need the owner's wording.

# Notes

Related: `p-o4iniqvitl` (the backlog index generated from the row files, plan `261125-1556`, draft). If the index is generated, adding a row is one file and the door needs no write to `plans/backlog.md`, which also removes most of the land contention on that file. Related: `p-nnaksnxtwu` (a head that lacks a door can always speak up to the owner). Needs a shaper before a planner: it changes who may write portfolio files, which is a grant and confinement decision.
