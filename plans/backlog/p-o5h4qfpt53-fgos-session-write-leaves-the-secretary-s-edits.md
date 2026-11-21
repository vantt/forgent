---
id: p-o5h4qfpt53
title: "`fgos session write` leaves the secretary's edits uncommitted in the main checkout (session host, priority high; owner 2026-11-19)"
status: done
priority: P1
area: session-host
created: 2026-11-19
---

# Why

The head write door (session verb phase 7c) writes the file atomically but commits nothing; on 2026-11-19 four of Miu's backlog edits sat uncommitted until the supervisor committed them by hand (86b50667a, c59ffd340), and the main checkout is usually behind origin, so a naive commit there can be stale.

# Done when

A write through the door is committed and pushed by the host: only the written path, attributed to the head role, after a fast-forward of the main checkout to origin (refused by name, not forced, when it cannot fast-forward or the path has other uncommitted changes); the reply names the commit. One owning proof through the real door. Evidence: 1159 phase 8b, 849d0bc36.

# Notes

Migrated from the legacy backlog table. Original status: done.
