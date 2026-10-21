---
phase: 05
title: "Optional: plan phases/reports and knowledge entries"
status: draft
depends_on: [00]
---

# Phase 05 — Plan and knowledge families (low priority, optional)

## Requirements
- Extend the existing `plan` kind: `phase-NN-<slug>.md` and `reports/` inside a plan dir.
- Knowledge entries: `docs/knowledge/<slug>/<file>.md` placement.
- Skip entirely if Phase 00 finds no real drift (RUL104).

## Files likely touched
- `packages/convention/contracts/convention.rules.v1.json`, golden tests, spec

## Proof
- Golden tests; `convention check --all` on `plans/` and `docs/knowledge/` recorded.

## Risk / rollback
- Archived plans with old shapes → cutoff keeps them warn-only; revert rule entries.
