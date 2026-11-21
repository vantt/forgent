---
id: p-jjusaqtge3
title: On macOS the Git driver fails to start Git with `git-spawn-failed` in the identity mint tests and init's Git WAL step (Git, priority medium; routed to OPC)
status: proposed
priority: P2
area: git
created: 2026-11-21
---

# Why

Seen on macos-latest once `fgos-identity` joined the cross-platform workflow: `packages/identity/rust/tests/mint.rs` `a_released_number_goes_back_only_while_nobody_claimed_after` and `concurrent_claims_from_different_clones_get_distinct_consecutive_numbers` refuse with `sequence-unreachable (git-spawn-failed)`; the init WAL case fails the same way. The cause of the spawn failure on macOS is not yet read. Windows results for the identity crate are hidden by the truncated workflow log.

# Done when

The cause is named and fixed, or the tests name it in an `#[ignore]` reason.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
