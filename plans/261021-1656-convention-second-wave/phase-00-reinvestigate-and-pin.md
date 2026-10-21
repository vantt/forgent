---
phase: 00
title: "Re-investigate and pin"
status: draft
depends_on: [260925 Phase 9 cutover landed]
---

# Phase 00 — Re-investigate and pin

## Requirements
- Prior art: `git log -S` / `-G` on `ROOT_FILE_ALLOWLIST`, `generated`, `placement-glob`,
  `metadataExempt`; read convention spec "Lịch sử quyết định" and the archived plan's phase-05
  (enforcement) for what was deferred and why.
- Pin current main SHA; re-measure evidence rows 1-8 in plan.md (counts, names, file lists).
- Check board collisions: rows DOC, DOCOS, RULE, HARDEN; who else edits `.githooks/pre-commit`,
  `src/setup/checks.mjs`, `scripts/build-skills*`, convention crate.
- Confirm each family fits an existing rule shape; any that does not is dropped or becomes an
  idea in the report (RUL104), never a new shape.
- Prepare OQ-1 options with evidence for the owner.

## Files likely touched
- This plan only (update evidence table, pins, open questions).

## Proof
- Evidence table re-measured with commands recorded; collisions listed.

## Risk / rollback
- None (read-only). If the cutover has not landed, stop.
