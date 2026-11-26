---
id: p-bifjfd5rix
title: "Mail queued for a head's old generation is not moved to its successor after a rotation, so it is never offered (mailbox, priority P2; source: owner confirmation 2026-11-23, reported by forgent-claude-a3)"
status: done
priority: P2
area: mailbox
created: 2026-11-23
---

# Why

When a head rotates to a new generation, mail already queued for the old generation stays with it and is never offered to the successor. Seen with mail `6c641a476c514265` to `forgent-claude-45`, notice `ack-not-offered`; the secretary also lost a first copy of two messages this way.

# Done when

After a rotation, mail queued for the old generation is offered to the successor exactly once, and an owning proof shows it.

# Notes

Related to the head rotation work in plan `261122-2307-heads-rotate-on-their-own`.
