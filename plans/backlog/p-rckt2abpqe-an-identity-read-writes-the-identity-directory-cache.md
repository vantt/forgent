---
id: p-rckt2abpqe
title: "A read-only Identity query writes `.fgos/cache/identity-directory.json` (identity, priority P2; source: lead of plan 261122-0056 via the help queue, 2026-11-26; report `plans/261122-0056-orchestration-skeleton/reports/lead-261126-1653-wave-1-status.md`)"
status: proposed
priority: P2
area: identity
created: 2026-11-26
---

# Why

The Keeper lead saw the Rust Identity query paths (`project.rs`, the refresh in `provider.rs`, `event_store_clone.rs`) write the identity directory cache file on what callers treat as a read. A read that writes breaks read-only callers (confined heads, sandboxed units) and races with concurrent writers of the same cache.

# Done when

An Identity read never writes; the cache is refreshed only by a named write path, and a read under a read-only confinement succeeds.

# Notes

Raised by the Keeper lead (plan 261122-0056) as out of its plan scope in help event 3ad2caf1cb1c3171; recorded by the supervisor.
