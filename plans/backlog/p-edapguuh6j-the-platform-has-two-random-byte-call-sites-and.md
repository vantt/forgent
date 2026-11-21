---
id: p-edapguuh6j
title: The platform has two random-byte call sites and no one primitive (Identity, priority low)
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

`fgos-identity` (`packages/identity/rust/src/text.rs`, `random_bytes`) reads `/dev/urandom` on unix and calls `BCryptGenRandom` on Windows; `fgos-process` (`packages/process/rust/src/containment/windows.rs`, `random_token`) has its own private `BCryptGenRandom` wrapper. Two Windows random calls is the same decision held twice. Give the platform one random-bytes primitive at the lowest tier both crates can import, then move both callers to it and delete the second copy in the same change. Proof: one test on the primitive that two draws differ and are non-zero on the host OS; the callers keep only their wiring tests.

# Done when

One door fills a byte array from the kernel generator on Linux, macOS and Windows, and no other crate calls `BCryptGenRandom` or opens `/dev/urandom` for ids or tokens.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
