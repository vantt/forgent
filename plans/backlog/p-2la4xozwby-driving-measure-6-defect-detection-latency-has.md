---
id: p-2la4xozwby
title: Driving measure 6 (defect detection latency) has no source (observe, coding driving; priority low; the owner chose one row per unmeasured driving measure)
status: proposed
priority: P3
area: observe
created: 2026-11-21
---

# Why

The definition `m6-detection-latency.query.json` requires `fgos.plan.defect.detected` as a span from the moment a defect entered to the moment it was found; no producer emits it, so the measure answers `unmeasured`.

# Done when

Whoever detects a defect (review, verify, validation) writes `fgos.plan.defect.detected` as a span with the entry instant as `ts` and the detection as `endTs`, declared at the place of use and ref'd to the plan; the m6 definition answers rows on a fixture plan; no Observe source file changes.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
