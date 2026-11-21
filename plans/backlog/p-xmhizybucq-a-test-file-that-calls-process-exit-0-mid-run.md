---
id: p-xmhizybucq
title: A test file that calls `process.exit(0)` mid-run reports one passing case, and its remaining tests vanish without a failure (tests, priority medium)
status: proposed
priority: P2
area: platform-foundations
created: 2026-11-15
---

# Why

The exact-set check of the CI test shards (2026-11-15) proves that every file reported, not that all of its tests ran. This predates sharding; MAIL found it while building the shard aggregate.

# Done when

`scripts/run-tests.mjs` fails a file whose reported case count is below its static count of top-level `test(` calls (or an equivalent proof that a file ran every declared test), with an owning test; no file in the suite trips it.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
