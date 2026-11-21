---
id: p-uys2d2jgrm
title: A raced Git config read reaches the host's events child as message text, not a typed cause (Git and Event Store, priority low; needs OPC review, routed to OPC)
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

The detached `events` child skips a refusal whose message contains `repository-config-changed-during-read` (`apps/fgos/src/wiring/events.rs`), because `fgos_event_store::StoreError` loses `fgos_git::OperationError.cause`. Any message carrying that text would match.

# Done when

The cause survives end to end (a `cause` field or an `ErrorCode` variant for the config race) and `events.rs` matches the typed value; the substring match is deleted.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
