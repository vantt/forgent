---
phase: 06
title: "Flip postures to block where clean"
status: draft
depends_on: [01, 02, 03, 04, 05]
---

# Phase 06 — Flip postures to block

## Requirements
- Per family: run `convention check --all`; flip `posture` to `block` only when clean above cutoff.
- Families still dirty stay `warn`; list them with counts.
- Doctor reports through its existing convention check (`src/setup/checks.mjs`); no new check row.
- CHANGELOG `## [Unreleased]` line naming the families now blocking.

## Files likely touched
- `packages/convention/contracts/convention.rules.v1.json`, golden tests, `CHANGELOG.md`, spec

## Proof
- `npm test` and `cargo test --workspace` green; `convention check --all` output attached;
  `fgos doctor` via the dev host shows the convention check passing.

## Risk / rollback
- Block stalls other sessions' commits → flip the family back to `warn` (one-line revert).
