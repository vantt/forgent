---
id: p-zpgzqdoy4z
title: "Requesting a pattern different from the activity's unit is not gated by admission: nothing records it as a route deviation"
status: done
priority: P2
area: collaboration-degree-part-b
created: 2026-10-24
---

# Why

The owner's decision on the second question was that a different pattern is a route deviation; admission must compare the requested pattern with the activity unit and record a difference as a deviation. This is the gap Part A leaves open (gap G1: Part A only requires a reason and carries the activity pattern's invariants). Optional in the advised order. Source: plans/261023-1619-collaboration-degree-spec/part-b-evidence-hardening.md B9; owner 2026-10-24 18:09 opened item by item. Dependencies: needs the proposal fields from p-shtdt7wpfh (effective pattern name, loop, effective params).

# Done when

A dispatch in a case that names a pattern different from the activity unit's pattern is admitted only as a recorded deviation, with the reason on the `route` event; a dispatch with the same pattern records none; both cases have a test at the admission layer

# Notes

Migrated from the legacy backlog table. Original status: done (main `fd939a3d0`: case admission decides a pattern swap as an unlisted route, reason required and the deviation charged; the same pattern records none; tests at the admission layer).
