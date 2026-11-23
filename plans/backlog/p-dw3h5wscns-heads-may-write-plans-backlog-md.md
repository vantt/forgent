---
id: p-dw3h5wscns
title: "Heads may write the backlog index file: add plans/backlog.md to the secretary and supervisor session-write grants (session-host, priority P1; owner decision 2026-11-23, question q-nudu6zlusf)"
status: done
priority: P1
area: session-host
created: 2026-11-23
---

# Why

`fgos session write plans/backlog.md` is refused `path-not-granted` for the secretary and the supervisor. The grants in `src/session-host/head-grants.mjs` (lines 61 and 73) cover `plans` and `plans/backlog/*`, not the file `plans/backlog.md`, yet the fgos-secretary and fgos-supervisor skills say heads replace exactly that file. Every new backlog row waits for a person, against product priority 2.

# Done when

The secretary and supervisor rows of the grants allow writing `plans/backlog.md` and nothing wider; the owning test in head-grants proves the write is allowed and a neighbouring path is still refused. The owner chose this option (fix the grant) on 2026-11-23; any wider change to head write grants is out of scope.

# Notes

Until it lands, a person or an unconfined session adds the index lines, including the one for p-v6xinnjoxh.
