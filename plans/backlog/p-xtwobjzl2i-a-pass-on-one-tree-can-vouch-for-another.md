---
id: p-xtwobjzl2i
title: A pass on one tree can vouch for another, because the tested-subject digest is computed at settle and copied onto receipts
status: proposed
priority: P2
area: collaboration-degree-part-b
created: 2026-10-24
---

# Why

The digest is computed at settle in `case-admission-port.mjs`; the verify checkpoint must record the tested digest in its durable result and the adapter must read it, not recompute it. This closes the gap that the collaboration-degree spec (Part A, section 11, "Not claimed") states for the receipt digest. Review findings: C-F3, packet F1, F3. Source: plans/261023-1619-collaboration-degree-spec/part-b-evidence-hardening.md B3; owner 2026-10-24 18:09 opened item by item. Dependencies: can go with p-djznnfrbbe and p-3ydqquajy2; p-3u7ntmlhyz (freshness) needs a digest recorded at test time.

# Done when

The verify checkpoint's durable result carries the digest of the tree it tested and the adapter copies it onto the receipt without recomputing; a test edits the tree between verify and settle and shows the receipt keeps the tested digest and the milestone is stale, not achieved

# Notes

Migrated from the legacy backlog table. Original status: proposed.
