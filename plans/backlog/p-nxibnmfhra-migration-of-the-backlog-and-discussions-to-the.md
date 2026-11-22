---
id: p-nxibnmfhra
title: "Migration of the backlog and discussions to the new data model (portfolio, priority medium); source: p-mc25x5pfi6, `docs/discussions/work-data-model/DISCUSSION.md` §7 `#task-migration`"
status: done
priority: P2
area: portfolio
created: 2026-11-21
---

# Why

Rows become files, discussions move to `plans/discussions/`, references are rewritten, hard-coded paths go through the convention door, and an upgrade verb serves other projects.

# Done when

The check passes on the migrated repo; `git grep docs/discussions` finds only history; `npm test` and `cargo test --workspace` pass.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
