---
id: p-sx2aps3heh
title: "Money and price tables (observe, priority low; deferred by the owner on 2026-11-18: no pricing infrastructure exists and most accounts are subscriptions)"
status: proposed
priority: P3
area: observe
created: 2026-11-18
---

# Why

Cost is measured in tokens per model, provider, account, plan and phase; nothing turns tokens into money, and most accounts are subscriptions. Some CLIs report a cost (`total_cost_usd`, pi `cost.total`) that is not recorded.

# Done when

A decision says which money figure is wanted (list price, reported cost, subscription share); a price table is declared and versioned where it is used; the money measure is a query or projection over the token records, never a second copy of usage.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
