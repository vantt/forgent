---
id: p-bxahsop7em
title: "WORK: `loadDomainsFromDisk` in `src/state/domain-registry.mjs` walks `domains/` by hand"
status: proposed
priority: P2
area: domainization
created: 2026-11-21
---

# Why

The loop at `:72` reads the directory itself while every other caller now goes through `listDomainDirs` (`src/util/domain-dirs.mjs`, one sorted walk that skips files and links). The two answers agree today; the hand loop is the last second path to the domain list. HARDEN left the file untouched because it is WORK's.

# Done when

`loadDomainsFromDisk` calls `listDomainDirs` for the directory list and keeps its own `registry.yaml` filter; `rg -n "readdirSync\(.*domains" src scripts bin` then matches only the leaf.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
