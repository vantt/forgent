---
id: p-ycausep3zs
title: "A long-lived head keeps the release it started with, so a route fix never reaches it (session-host, priority high; source: lead:SUPERVISION, 2026-11-19, plan 261119-1142 phase 1 rerun)"
status: done
priority: P1
area: session-host
created: 2026-11-19
---

# Why

A head's request route runs with the host binary and payload of the release active when the head started. The throwaway lead of plan 261119-1142 was started under release ae71ed18; after release f2cbf36e (carrying the route fix 530050e8e) became active, its `fgos run` tickets still went through the old argv rewrite and failed with exit 4. Every release that fixes a route therefore needs every live head restarted by hand, which nobody tracks. Owner 2026-11-21: raised to high, queued after the release hold. Evidence the same day: the secretary lineage (gens 18 to 20) kept running release 4f7ea1d8 of 2026-11-19 through rotations, so it lacked session stop and the coordination verbs.

# Done when

Either the request route resolves the active release per request, or activation reports each live head still on an older release and the supervisor restarts it; an owning test activates a new release under a live head and shows its next request runs the new route.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
