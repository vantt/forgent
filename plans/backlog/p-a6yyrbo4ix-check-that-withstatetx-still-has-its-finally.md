---
id: p-a6yyrbo4ix
title: "Check that `withStateTx` still has its `finally` after T1 changed `release()` to return a settle outcome (state, priority medium; source: HARDEN ledger hand-off `plans/handoffs/harden-ledger-open-handoffs-20261118-1830.md`, ledger row H23)"
status: proposed
priority: P2
area: state
created: 2026-11-21
---

# Why

Whether the change landed after the WORK cutover was not verified.

# Done when

`src/state/hot-lock.mjs` (or its Rust successor) is read: the `finally` exists and a test proves the lock is released when the transaction throws, or a defect is filed; ledger row H23 closes.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
