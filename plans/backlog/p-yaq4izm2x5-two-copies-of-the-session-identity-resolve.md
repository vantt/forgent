---
id: p-yaq4izm2x5
title: Two copies of the session-identity resolve order outside the identity crate (one door, priority low)
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

`src/util/session-identity.mjs` `ENV_ORDER` is a Node copy of `fgos-identity`'s resolve order, used as a cache key, so it can drift from the crate; `plugins/fgOS/skills/terminal/terminal-port.sh:29-31` keeps its own identity fallback chain, and `plugins/` is outside the doors guard's roots. Found by the reviewer of the launcher-environment fix.

# Done when

The Node cache key comes from the crate (the addon exports the order or the resolved key), the shell script asks `fgos identity` instead of walking variables, and the guard covers the script or the row names it.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
