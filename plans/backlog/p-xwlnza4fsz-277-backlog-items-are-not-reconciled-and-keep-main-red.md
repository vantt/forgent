---
id: p-xwlnza4fsz
title: "277 backlog items are not reconciled, so the backlog reconciliation check stays red on main (backlog, priority P1; source: owner answer to q-tvhmli3fns, 2026-11-23)"
status: proposed
priority: P1
area: backlog
created: 2026-11-23
---

# Why

`scripts/check-backlog-reconciliation.mjs` is red on main for 278 reasons, not one. The owner chose to keep the rule "every proposed item is reconciled", fix the one id problem inside plan `261123-0726-contract-check-in-confined-heads` (phase 3, the fold of p-mtqil2rpyy), and file the other 277 unreconciled items as this separate row. Until this row is done, main stays red on that check.

# Done when

The 277 unreconciled items are each reconciled under the existing rule, without weakening the rule, and the reconciliation check is green on main.

# Notes

Source: the planner's question `q-tvhmli3fns`, answered by the owner (relayed by the supervisor and recorded by the secretary at 07:45 after the owner's own confirmation in this session). Related: p-b5jixi4mov, p-mtqil2rpyy.
