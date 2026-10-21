---
phase: 04
title: "Domain AGENTS.md + decision record scheme"
status: draft
depends_on: [00, "owner answer OQ-1"]
---

# Phase 04 — Domains + decision scheme

## Requirements
- `domains/<d>/AGENTS.md` singleton (`placement-glob`, cardinality 1, canonical).
- Decision records under `docs/platform/<area>/decisions/`: one `name-template` for the scheme the
  owner chooses (OQ-1); the other scheme accepted below the cutoff; `README.md` allowed.
- Do not touch decision content or the decision index generator (doc-health / `fgos decision-index`).

## Files likely touched
- `packages/convention/contracts/convention.rules.v1.json`, golden tests, spec

## Proof
- Golden tests for each rule; `convention check --all` output recorded.

## Risk / rollback
- Wrong scheme chosen → rule entry revert; no files renamed in this phase.
