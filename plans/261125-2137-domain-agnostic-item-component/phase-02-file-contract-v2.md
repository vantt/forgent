# Phase 2: Portfolio file contract v2 and phase-size warning

Status: ready. Decisions: A5, A8 (task-file-contract and task-phase-size of the discussion).

## Inputs
- Discussion §6 "Item levels", "Initiative fields", and §3 I47 (lenient id).
- `packages/portfolio/contracts/portfolio-vocabulary.v1.json`, `backlog-item.schema.v1.json`, `discussion.schema.v1.json`.
- `core/skills/_shared/plan-contract.md`, `scripts/plan-contract-check.mjs`, `test/scripts/plan-contract-check.test.mjs`.

## Footprint
- `packages/portfolio/contracts/**`
- `core/skills/_shared/plan-contract.md`
- `scripts/plan-contract-check.mjs`, `test/scripts/plan-contract-check.test.mjs`
- generated renders `.agents/skills/**`, `plugins/fgOS/skills/**`, `.claude/skills/**`

## Steps
1. Write `portfolio-vocabulary.v2.json`: item levels initiative and phase; folders `plans/backlog/` (waiting) and `plans/initiatives/` (left Init, or closed before start); the source of each stage list (the pinned workflow; core default Init → Discover → Clarify (skippable) → Plan → Execute → Retrospective); the three fact kinds and who records each; the lenient id rule (unique lowercase kebab, starts with a letter; fgOS mints `p-`).
2. Write `initiative.schema.v2.json` with the A8 frontmatter (`id`, `title`, `domain` required, `kind`, `priority` P0–P3, `area`, `created`, `dependsOn`, `mergedInto`, `parkReason`, optional `discoveredFrom`), body sections Why, Done when, Notes, and the derived fields (`workflow` with digest, `stage`) marked never hand-written.
3. Add the phase done-evidence shape (landed commit, case outcome digest) and the plan frontmatter key `initiative:` (one id) to the vocabulary.
4. Delete the v1 files in the same change, since no live reader outside the dead Node twin uses them (phase 4 deletes the twin); if a live reader still loads v1, keep v1 until phase 4 and record that in this phase's report.
5. Update `core/skills/_shared/plan-contract.md`: plan frontmatter gains `initiative:`; `source` stays for discussion paths; the 8-step phase-size warning.
6. Extend `scripts/plan-contract-check.mjs` to accept `initiative:` and to warn, without failing, when a phase file has more than 8 numbered steps; add both fixtures to its test.
7. Run `npm run build:skills`.

## Verify
`node --test test/scripts/plan-contract-check.test.mjs` passes, with a 9-step fixture warned and an 8-step fixture silent; `node scripts/plan-contract-check.mjs --all` shows no new errors.

## Rollback
`git revert` the phase commit and rerun `npm run build:skills`.
