# P1: stale facts and the deliver rename

## Requirements

1. `core/skills/_shared/coordination-driver.md`: remove or correct every line that teaches `fgos coordination …` (verb removed). Point to the two doors (`fgos run`, `fgos workflow start`) only where a sentence needs a replacement. Do NOT rewrite the doctrine. Rebuild renders with `npm run build:skills`.
2. `plans/261014-1400-two-doors-one-rununit/plan.md`: frontmatter `status: completed` (closed by `cb0acb254`).
3. `docs/specs/runner.md`: the old sentence saying Workflow integrates the Work lifecycle (roadmap cited ~1474; find it by text, line moved) — correct it to current fact (Workflow does not know Work; Work is a consumer). One history line if the spec's convention needs it.
4. Rename the hand-owned skill `plugins/fgOS/skills/cook/` → `plugins/fgOS/skills/deliver/` (`name: deliver`). Update every live reference to `/fgOS:cook` meaning this skill (`git grep -n "fgOS:cook"`; skip `archive/`, `docs/history/`, `plans/`, generated renders which come from their source). Remove the "stage" wording the skill still uses (stages were removed by decision 0049): describe the current state machine in the words the current `fgos-coding-driving` uses. Fix the self-contradicting sentence in `fgos-coding-driving` (edit its source under `core/skills`, then rebuild).
5. Update guards/baselines that list the old path (e.g. `scripts/check-decision-citation-drift.baseline.json`) by regenerating with the real command, never by hand; diff before staging.
6. `CHANGELOG.md` `[Unreleased]`: one line for the rename.

## Validation

`git grep -n "fgOS:cook"` outside history/archive/plans is empty; `npm run build:skills` clean; tests importing touched files pass (skills render tests, doc guards).
