---
id: p-ndortdckid
title: "Heads cannot record friction, so troubles of the secretary and supervisor are never captured (observe, priority high; source: owner via Miu, 2026-11-21)"
status: done
priority: P1
area: observe
created: 2026-11-21
---

# Why

The secretary skill says to record friction per `_shared/friction-capture.md`, but the secretary grant in `src/session-host/head-grants.mjs` has no friction verb, `metrics record` accepts only `fgos.coordination.*` kinds, and `fgos friction record` from a head sandbox fails with `lock-driver-unavailable` (observe.lock read-only). No `fgos.friction.recorded` line exists since 2026-11-18 although heads hit rotation failures, a Gemini head, a stale release and read-only writes since. Owner decision: heads record friction themselves through the request socket; the supervisor does not collect it for them.

# Done when

`friction record` is a head verb served through the request socket (the host writes outside the sandbox) for the secretary, supervisor, planner, shaper and lead grants, with the same fail-open rule as today; the head skills' friction section names the trigger (a workaround, a retry, a wait, a refused verb); an owning test has a confined head record one friction and finds it in `friction list`.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
