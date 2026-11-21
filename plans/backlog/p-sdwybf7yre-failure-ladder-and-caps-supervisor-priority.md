---
id: p-sdwybf7yre
title: "Failure ladder and caps (supervisor, priority medium; source: supervisor-review §7 T4)"
status: proposed
priority: P2
area: supervisor
created: 2026-11-21
---

# Why

L0 self-heal (auto `git recover`), L1 attempt cap N, L2 events (cap, gone, cross-plan, red trunk freezes the queue, stuck X), L3 only through supervisor questions; the same cap for lead restarts. Open: N, X, and the L2 fixer session. Goes with p-r3qqgwtcai.

# Done when

One owning test per ladder transition; N, X and the fixer session are decided first.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
