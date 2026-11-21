---
id: p-dlnzf4fqru
title: fgOS's removal of a codex or agy folder-trust entry, and its codex trust seed, rewrite the person's store without the machine's trust-store lock
status: proposed
priority: P2
area: run-supervisor
created: 2026-11-09
---

# Why

Found closing the T4 hand-offs (2026-11-09): the claude store is now add-only and its seeds take the `agent-trust-store` lock (`seedTrust`, `src/run-supervisor/trust-store.mjs`), but `removeCodexTrust` and `removeAgyTrust` (run by `cleanup-trust`, `src/run-supervisor/steps/cleanup-trust.mjs`) and the codex and agy seeds read, edit and replace the file with no lock, so two attempts on one machine ending or starting together can drop each other's entry (a confined worker's private home is not shared, so only unconfined seats on the person's own `~/.codex/config.toml` or agy settings are exposed).

# Done when

The codex and agy seeds and removals take the same lock as `seedTrust`, with the same bounded wait and a `store-busy` refusal; a test runs two writers over one store and keeps both entries

# Notes

Migrated from the legacy backlog table. Original status: proposed.
