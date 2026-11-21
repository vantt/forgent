---
id: p-tqbcrown4m
title: Consent for a milestone has no defined writer, subject or digest rule
status: proposed
priority: P2
area: collaboration-degree-part-b
created: 2026-10-24
---

# Why

The consent writer and drain must carry `milestones` and a `subjectRef`; the writer, not the caller, computes the digest; it accepts only milestone ids that have a `human-consent` row; only the owner door may call it; and a new digest can be re-approved when a workflow case has no `gate.park`. It must reconcile the existing stale-approval re-park path in `src/workflow/runner.mjs` (~448-457). Review findings: C-F8, A-F2, red-team F1 (rev.3), packet F3, F8, gaps G2 and G3 of the earlier draft. Source: plans/261023-1619-collaboration-degree-spec/part-b-evidence-hardening.md B4; owner 2026-10-24 18:09 opened item by item. Dependencies: after p-3ydqquajy2.

# Done when

A consent write for a milestone id with no `human-consent` row is refused; a call that is not from the owner door is refused; the stored digest is the one the writer computed even when the caller passes another; one test shows re-approval of a changed digest on a case with no `gate.park`, and the stale-approval re-park path in `src/workflow/runner.mjs` still has exactly one owning proof

# Notes

Migrated from the legacy backlog table. Original status: proposed.
