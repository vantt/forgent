---
id: p-32aibvgmma
title: The Git fetch-mapping fix does not repair missing or stale provenance, so two Event Store refusals cannot point at `fgos doctor --fix` (Git and Event Store, priority medium; owner approved 2026-11-15, routed to OPC)
status: proposed
priority: P2
area: git
created: 2026-11-15
---

# Why

`installFetchMapping` (`src/setup/git-checks.mjs:109-119`, fix `git-publication-refspecs`) repairs only a missing or obsolete mapping. When the mappings are present but the recorded provenance is missing, or records another remote URL than the remote has now, it does nothing, and `ensure_fetch_mapping` (the only writer of provenance) is never called again. The refusals in `packages/event-store/rust/src/refspec.rs:23,38` therefore name the condition instead of a repair (S4 phase 11 review).

# Done when

The fix also repairs when provenance is missing or its URL differs from the current remote URL (inspectGit exposes the recorded provenance); a test per case; both refusal texts name `fgos doctor --fix` again.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
