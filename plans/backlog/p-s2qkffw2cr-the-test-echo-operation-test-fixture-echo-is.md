---
id: p-s2qkffw2cr
title: The test echo operation `test.fixture.echo` is registered in the production catalog (host-runtime, priority low; found by the T9 close check 2026-11-18)
status: done
priority: P3
area: host-runtime
created: 2026-11-18
---

# Why

`packages/host-runtime/rust/src/catalog.rs:117-121` still declares it; only the `main.rs` registration was removed. Move the test-only provider under tests. Plan `plans/261118-1818-harden-t9-leftovers` phase 2.

# Done when

...

# Notes

Migrated from the legacy backlog table. Original status: done.
