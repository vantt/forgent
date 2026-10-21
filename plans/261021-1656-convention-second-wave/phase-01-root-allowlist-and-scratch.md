---
phase: 01
title: "Root allowlist + scratch location into convention"
status: draft
depends_on: [00]
---

# Phase 01 — Root allowlist + scratch into convention

## Requirements
- Express the repo-root file allowlist as `placement-glob` rule(s) in `convention.rules.v1.json`
  (root-level files outside the list → violation).
- Express scratch location: draft scripts/logs/dumps belong under `.fgos/runtime/tmp/`
  (message points there; `${TMPDIR:-/tmp}/fgos-work/` fallback stays prose).
- Delete `ROOT_FILE_ALLOWLIST` and its root guard from `.githooks/pre-commit`; the hook only calls
  `convention check` (one door, L10: move the consumer and delete the old path in the same change).
- Preserve existing behaviour: linked worktrees covered, `MERGE_HEAD` skip only for the root guard,
  data-loss guards untouched. Resolve OQ-2 (separate-landing rule) before deleting its check.
- Posture: current hook blocks; keep the root rule at `block` from the start only if
  `convention check --all` is already clean for it, else warn+cutoff — decide in Phase 00.
- Update AGENTS.md "Scratch artifacts" wording with RULE lane.

## Files likely touched
- `packages/convention/contracts/convention.rules.v1.json`, convention crate golden tests
- `.githooks/pre-commit`
- `AGENTS.md` (Scratch artifacts paragraph), `docs/platform/convention/spec.md`, `CHANGELOG.md`

## Proof
- Golden tests: allowed root file passes, new unlisted root file fails, scratch-looking file at
  root fails with pointer to `.fgos/runtime/tmp/`.
- One wiring proof that pre-commit refuses an unlisted root file via `convention check`
  (retire the old hook test that owned this; name the new owner).

## Risk / rollback
- Hook regression blocks every commit → revert the single commit; old hook returns.
