---
id: p-4qbpdv2cfw
title: Three cross-platform test gaps left by the S4 gate (tests, priority low; needs OPC review)
status: proposed
priority: P3
area: packaging-distribution
created: 2026-11-21
---

# Why

(1) `agent_hooks.rs` recorded-case test runs on Unix only; Windows should run it and expect the mailbox rows unchanged. (2) `doctor/git.rs` fetch-mapping row test is Linux only; its refspecs could be set with plain `git config` so macOS proves a secret is never echoed. (3) `wiring/uninstall.rs` hooks-path tests need a macOS case.

# Done when

Each runs, or is gated with a named cause, on Windows and macOS.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
