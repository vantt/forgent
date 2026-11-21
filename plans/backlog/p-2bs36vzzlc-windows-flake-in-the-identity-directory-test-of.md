---
id: p-2bs36vzzlc
title: "Windows flake in the identity directory test of a dead holder replaced under the lock (identity, priority medium; source: lead:WINCUSTODY and lead:OPC, 2026-11-21 20:27)"
status: proposed
priority: P2
area: identity
created: 2026-11-21
---

# Why

`a_dead_holder_is_judged_and_replaced_only_under_the_directory_lock_so_a_rewrite_that_revived_it_survives` (`packages/identity/rust/tests/directory.rs:1823`) failed with "the dead holder was removed without the lock" in the windows-latest focused tests of run 44906548688. OPC's reading: after a 300 ms sleep the test takes `read_dir().next()` as the one entry file, but the directory can hold another file at that moment, and Windows lists entries in a different order. The Git custody plan for Windows did not touch identity.

# Done when

The test picks the holder's entry file by name or content, never by listing order, and waits on a condition instead of a fixed sleep; windows-latest focused tests pass it repeatedly.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
