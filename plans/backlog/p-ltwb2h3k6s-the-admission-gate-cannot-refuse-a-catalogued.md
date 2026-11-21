---
id: p-ltwb2h3k6s
title: The admission gate cannot refuse a catalogued operation (host-runtime, priority low; deliberately deferred by the owner 2026-11-18)
status: proposed
priority: P3
area: host-runtime
created: 2026-11-18
---

# Why

`authority_gate.rs` `allow_catalog_policies` checks policies against the same catalog it was built from. A real fix needs an externally sourced allow-list, which is a new mechanism, so it waits. Plan `plans/261118-1818-harden-t9-leftovers` phase 3 (not scheduled).

# Done when

...

# Notes

Migrated from the legacy backlog table. Original status: proposed.
