---
id: p-vwaujnak4j
title: "`fgos session write` writes a whole file blind and can lose newer updates (session-host, priority high; seen 2026-11-19)"
status: proposed
priority: P1
area: session-host
created: 2026-11-19
---

# Why

Miu's write of docs/backlog.md was built from an older copy; it wrote "written, not published" and, if published, would have deleted two newer rows (p-kghvlvmj6s, p-k6apgwaddh); the supervisor republished by hand (ca20738fb).

# Done when

The write carries the base blob OID the writer read (contract `session write` args gain `base`, the CLI passes the OID of the file it read) and the route refuses `write-base-stale` when the file moved since — or, absent a base, compares against the catch-up's pre-write OID; the writer re-reads and rebases; proven by a route test where a concurrent commit lands between read and write.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
