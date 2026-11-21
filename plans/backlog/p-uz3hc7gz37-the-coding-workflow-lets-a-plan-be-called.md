---
id: p-uz3hc7gz37
title: The coding workflow lets a plan be called validated without a validation step, and its consent subject is documented wrongly
status: proposed
priority: P2
area: collaboration-degree-part-b
created: 2026-10-24
---

# Why

Restructure: split `plan-shaped` from `plan-validated`; `validate-plan` on `rfc`; declared units for `fix-verify-red`; `integrate` with a verify requirement; decide which milestone a light `review-item` verdict binds to (today `produces: []`); the two MUST rows on `plan-validated` and their in-flight effect (no `plan.md`-bound consent exists until the cutover, which blocks `implement-item` on in-flight coding cases); and correct `workflow.md:428` (consent subject is `plan.md`, not the decisions artifact) as a superseding decision. Review findings: C-F4, A-F2, packet F8, red-team F5 (consent subject), unresolved question 2 of the contracts reviewer. Owner question: accept that `plan-validated` cannot be achieved with consent on in-flight coding cases until the coding cutover? Source: plans/261023-1619-collaboration-degree-spec/part-b-evidence-hardening.md B8; owner 2026-10-24 18:09 opened item by item. Dependencies: last, because it is the consumer of p-djznnfrbbe, p-3ydqquajy2, p-tqbcrown4m and p-shtdt7wpfh; relates to `wf-coding-cutover`.

# Done when

The coding workflow declares `plan-shaped` and `plan-validated` as separate milestones with their MUST rows, `rfc` runs `validate-plan`, `integrate` requires a verify receipt, and a light `review-item` verdict binds to a named milestone; a test shows the in-flight effect on an existing coding case as the owner accepted it; `workflow.md:428` is corrected by a superseding decision

# Notes

Migrated from the legacy backlog table. Original status: proposed.
