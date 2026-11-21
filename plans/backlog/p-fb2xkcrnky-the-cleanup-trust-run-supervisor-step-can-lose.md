---
id: p-fb2xkcrnky
title: The `cleanup-trust` run-supervisor step can lose a concurrent write to an agent's trust store
status: proposed
priority: P2
area: run-supervisor
created: 2026-11-21
---

# Why

The step (`src/run-supervisor/steps/cleanup-trust.mjs`) removes the folder-trust entry the controller wrote through `removeTrust` and its codex and agy twins (`src/run-supervisor/trust-store.mjs`): each reads the whole store (for claude `~/.claude.json`, which the claude CLI itself also rewrites), deletes one key and renames a temp file over it, with no lock. A second writer between the read and the rename (another attempt's step, the CLI, a person) loses its change. The temp-and-rename keeps the file whole, not the edit. Found while closing the run-supervisor layer; the layer does not own the trust store (it moves with the Execution Core).

# Done when

`cleanup-trust` and the controller's trust seeding change the store under one lock, or by a merge that cannot drop another writer's key, proven by one test with two concurrent writers; or the entry is no longer written into a shared store at all; until then the limit is listed in the [run-supervisor spec, section 15](platform/run-supervisor/spec.md#15-known-limits)

# Notes

Migrated from the legacy backlog table. Original status: proposed.
