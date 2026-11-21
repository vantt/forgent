---
id: p-shtdt7wpfh
title: The closed guard catalog has no primitive for a reviewer's verdict, and a solo activity whose workflow requires a verify receipt can still pass with no verify command
status: proposed
priority: P2
area: collaboration-degree-part-b
created: 2026-10-24
---

# Why

Add a seventh closed-catalog primitive, `reviewer-verdict`: it amends RUL-WF-7 ("Primitive thứ bảy là một dòng ý tưởng tính năng"), N10 and RUL-WF-19, and adds the admission refusal `verdict-seat-required`. The same admission work covers the gap Part A leaves (`verify-command-required` for a solo activity whose workflow requires a verify receipt). Review findings: packet F3, F4, A-F2. Source: plans/261023-1619-collaboration-degree-spec/part-b-evidence-hardening.md B6; owner 2026-10-24 18:09 opened item by item. Dependencies: needs p-djznnfrbbe to be meaningful; relates to p-lwdpukgwhd (the assessor seat is the first user of the verdict); receives the proposal fields (effective pattern name, loop, effective params, seat postures, verify checkpoint presence, verify command presence) that p-uz3hc7gz37 also needs.

# Done when

A workflow can declare a `reviewer-verdict` guard and admission refuses with `verdict-seat-required` when no verdict seat is in the proposal; admission refuses with `verify-command-required` when a solo activity whose workflow requires a verify receipt has no verify command; the amended RUL-WF-7, N10 and RUL-WF-19 are superseded by a minted decision, not edited in place

# Notes

Migrated from the legacy backlog table. Original status: proposed.
