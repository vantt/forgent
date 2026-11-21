---
id: p-lwdpukgwhd
title: "The owner's chosen assessor seat (option (a): one read-only, out-of-process assessor issuing a verdict) exists only as advice, with no defined provenance or independence proof"
status: proposed
priority: P2
area: collaboration-degree-part-b
created: 2026-10-24
---

# Why

The design still has to settle: role `assessor`, the posture set, solo as the loop, author-independence where provenance exists and otherwise unsupported. "Provenance" must be defined, and the independence proof must sit at the layer that sees `inputs`, not in the seat resolver. RT-6 and RR6 have to be rewritten for a decision already made, and the design must not be labeled owner-approved. Review findings: C-F4 (milestone binding), C-F10 (S17 layer), A-F9, red-team F4, F5 (rev.3), packet F9. Source: plans/261023-1619-collaboration-degree-spec/part-b-evidence-hardening.md B7; owner 2026-10-24 18:09 opened item by item. Dependencies: needs p-djznnfrbbe to be meaningful; relates to p-shtdt7wpfh.

# Done when

A written definition of provenance exists in the area spec; one test at the layer that sees `inputs` shows an assessor that authored the subject refused where provenance exists and reported unsupported where it does not; the assessor seat is read-only and out-of-process, and its verdict binds to a named milestone

# Notes

Migrated from the legacy backlog table. Original status: proposed.
