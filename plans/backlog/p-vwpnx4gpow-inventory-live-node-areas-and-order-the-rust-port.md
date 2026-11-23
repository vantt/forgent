---
id: p-vwpnx4gpow
title: "Inventory every remaining live Node area and order the Rust port, one plan per area (core/platform, priority high; source: owner order 2026-11-23 14:21 via lead:SUPERVISOR)"
status: done
priority: P1
area: platform-foundations
created: 2026-11-23
---

# Why

`src/` still holds 323 `.mjs` files and 588 test files of live Node. The owner wants the port to Rust planned as a whole, not area by area as it comes up.

# Done when

One table (in `plans/discussions` or a plan) lists every Node area still live in `src/` and its tests. Each row has: area, files and tests, what Rust already owns of it, live callers, the Rust component it moves into, and its dependencies. Rows are ordered bottom-up per the owner port order of 2026-11-14: packaging-distribution first, then lower layers before upper. After the table, one plan per area is opened, one at a time, in that order. Dead Node already has its own plan (`261122-2108-delete-dead-node-execution-closure`) and is excluded.

# Constraints

Owner: the port is clean and causes no impact. Every plan moves all callers and deletes the Node path and its tests in the same change (L10, design principles 1 and 8), never leaves a twin, and sequences around the footprints of running plans so nothing collides (component-authority-doors, heads-stable-and-able).

# Notes

Routed to a shaper by the secretary on 2026-11-23.
