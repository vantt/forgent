---
phase: 03
title: "Contracts naming"
status: draft
depends_on: [00]
---

# Phase 03 — Contracts naming

## Requirements
- One versioned `name-template` for machine contracts under `**/contracts/`:
  `<name>.v<N>.json` and `<name>.v<N>.schema.json`.
- Existing unversioned files (`command-routes.json`, `domain-entry-steps.json`, …) are below the
  cutoff (warn), not renamed here unless Phase 00 shows renames are cheap and callers are few;
  any rename moves every caller in the same change (L10).
- Markdown/YAML contract documents: answer OQ-3 (placement-only vs excluded via
  `metadataExempt`/glob scope).

## Files likely touched
- `packages/convention/contracts/convention.rules.v1.json`, golden tests, spec
- Possibly renamed contract files + their loaders (only if chosen)

## Proof
- Golden tests: versioned JSON/schema pass; unversioned new file after cutoff warns.
- `convention check --all` count of legacy violations recorded.

## Risk / rollback
- Renames break loaders → none in this phase by default; revert rule only.
