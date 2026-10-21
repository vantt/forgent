---
phase: 02
title: "Generated render targets + skill layout"
status: draft
depends_on: [00]
---

# Phase 02 — Generated render targets + skill layout

## Requirements
- Mark `.agents/skills/**` and `plugins/fgOS/skills/**` (and `.claude/skills` thin wrappers if they
  are build output) `generated: true`; a staged hand edit reports a violation pointing at
  `core/skills/<name>/` and `npm run build:skills`.
- Confirm how the checker tells a build-produced change from a hand edit using only existing
  `generated` semantics (spec); if it cannot, report-only warning and record the gap — no new mechanism.
- Skill layout under `core/skills/`: `<name>/SKILL.md` singleton (cardinality 1), allowed subdirs
  `references/`, `scripts/`, plus `_shared/` as the one shared dir.

## Files likely touched
- `packages/convention/contracts/convention.rules.v1.json`, golden tests
- `docs/platform/convention/spec.md`; maybe `CHANGELOG.md`

## Proof
- Golden tests: edit under render target flagged with pointer; skill missing/duplicate `SKILL.md`
  flagged; unknown subdir flagged; `_shared/` accepted.
- `convention check --all` output recorded for both families.

## Risk / rollback
- False positives on every `build:skills` run → keep warn; revert rule entries.
