---
id: p-nykfevjxqf
title: Event payloads are not masked for declared secrets
status: proposed
priority: P2
area: event-store
created: 2026-10-25
---

# Why

A secret typed into a Work item, note or reason is pushed to the remote with its event and cannot be erased (Event Store spec, "Known limits"). The `secrets` door (`packages/secrets`, `RedactionSet`) has no production consumer yet, and no config declares a secret, so masking at append would mask nothing today (HARDEN 04b scouting, 2026-10-25). Do it in the same change that gives the `secrets` door its first production use: build the set once per opened store in the addon and mask payload string leaves in Rust `append` before the hash; decide then whether declared names are masked too, and how the store reads values past the consumer check (secrets spec rules 2 and 4).

# Done when

A declared secret value never appears in a stored or pushed event payload; the event hash covers the masked bytes; promote passes no masking; one Rust proof in `append_recovery.rs` and one wiring proof.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
