---
id: p-3ydqquajy2
title: "A milestone with two guards cannot hold both pieces of evidence: it has one digest and one receipt payload and `achieve()` overwrites it"
status: done
priority: P2
area: collaboration-degree-part-b
created: 2026-10-24
---

# Why

Consent first makes the milestone eligible with no verdict. The data model needs per-guard evidence slots, one digest that satisfies every guard, merge instead of replace, and the consumer-side switch in `case-admission.mjs` gaining a verdict case. Review findings: C-F1, packet F3, F8. Source: plans/261023-1619-collaboration-degree-spec/part-b-evidence-hardening.md B2; owner 2026-10-24 18:09 opened item by item. Dependencies: one change with p-djznnfrbbe; p-tqbcrown4m and p-3u7ntmlhyz come after this item.

# Done when

A milestone guarded by both consent and a verdict is achieved only when both pieces of evidence exist, in either order; one test per order (consent first, verdict first) shows the second write merges instead of overwriting the first, and a milestone with a single guard folds unchanged

# Notes

Migrated from the legacy backlog table. Original status: done (main `10cb74a28`: a milestone keeps the receipts and consent of every guard on the same subject digest, in either order; one test covers both orders in `test/workflow/case-projection.test.mjs`).
