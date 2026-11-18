# Phase 9: Discovery in the contract and skills

> This phase belongs to the door plan `plans/261119-0528-resource-check-door-and-adapters`. Phases 1 to 7 and 7c are in plan A (`plans/261119-0030-resource-referee-graph-write-scope-stack`), whose decisions 1 to 31 apply.

A planner only uses the door if the document it already reads tells it to. The same applies to a
developer about to write a new path or graph helper: the previous copies were written by people who did
not know the existing door.

## Inputs

- `core/skills/_shared/plan-contract.md` sections 4 and 5.
- `domains/coding/skills/fgos-coding-planning/SKILL.md` (the `fgos graph` lines at 97) and its `references/approach-and-shape.md` (line 10) and `references/split-and-child-specs.md` (line 7); `core/skills/fgos-cook/references/reading-ak-plans.md`, which has no `fgos graph` line.
- The door's help text and final name from phase 7b; the divergence list from phase 8b and the differences recorded in phase 8; `CHANGELOG.md` `## [Unreleased]`.

## Files it may write

`core/skills/**`, `domains/coding/skills/**`, the generated surfaces `plugins/fgOS/skills/**`, `.agents/skills/**` and `.claude/skills/**` only through `npm run build:skills`, `CHANGELOG.md`, `docs/reading-map.md`. If the build also rewrites the managed block of `AGENTS.md`, list that file in the commit and in `reports/`; otherwise it must stay byte-identical.

## Steps

1. In `plan-contract.md` section 4 add the step: before fixing the phase table, run the door on the draft (`--units` before the files exist, `--plan` after); in a project without fgOS the planner applies the same rule by hand as section 4 already states.
2. In the planning skill's split guidance (`domains/coding/skills/fgos-coding-planning/references/split-and-child-specs.md` and `approach-and-shape.md`) add one pointer line next to the existing `fgos graph` references, and one line in `reading-ak-plans.md` in the section that explains phase footprints; each line says which tool it means; no duplicated rule text.
3. Run `npm run build:skills`; never edit generated files by hand.
4. Add the three packages to `docs/reading-map.md`, one line each pointing to their specs, and say how the package `graph` differs from the Work verb; this is the index a developer reads before writing a new path or graph helper.
5. Add the CHANGELOG lines: the new door; Work advisories now seeing containment and globs; the decompose gate staying advisory with its new findings; merge readiness no longer auto-merging items whose footprints contain one another; the fan-out verifier reporting new conflicts; the supervisor admission divergences listed in phase 8b, saying that admission is not wired to a running door; the plan-check script now keeping globs in phase tables.

## Verify

`npm run build:skills` leaves a clean second run (`git diff --exit-code` after a second build). The plan-contract check runs in phase 10, after phases 8 and 8b have changed it.

## Rollback

Revert the commit and rebuild the skills.
