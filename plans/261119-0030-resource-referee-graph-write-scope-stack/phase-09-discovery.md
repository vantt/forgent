# Phase 9: Discovery in the contract and skills

A planner only uses the door if the document it already reads tells it to. The same applies to a
developer about to write a new path or graph helper: the previous copies were written by people
who did not know the existing door.

## Inputs

- `core/skills/_shared/plan-contract.md` sections 4 and 5.
- `core/skills/fgos-coding-planning/SKILL.md` and its `references/approach-and-shape.md`, `references/split-and-child-specs.md`; `core/skills/fgos-cook/references/reading-ak-plans.md`.
- The door's help text from phase 7; `CHANGELOG.md` `## [Unreleased]`.

## Files it may write

`core/skills/**`, the generated surfaces `plugins/fgOS/skills/**` and `.agents/skills/**` only through `npm run build:skills`, and `CHANGELOG.md`, `docs/reading-map.md`.

## Steps

1. In `plan-contract.md` section 4 add the step: before fixing the phase table, run the door on the draft (`--units` before the files exist, `--plan` after); in a project without fgOS the planner applies the same rule by hand as section 4 already states.
2. In the planning skill's split guidance and in `reading-ak-plans.md` add one pointer line each, next to the existing `fgos graph` references; no duplicated rule text.
3. Run `npm run build:skills`; never edit generated files by hand.
4. Add the three packages to `docs/reading-map.md`, one line each pointing to their specs; this is the index a developer reads before writing a new path or graph helper.
5. Add the CHANGELOG lines: the new door, and Work advisories now seeing containment and globs.

## Verify

`npm run build:skills` leaves a clean second run (`git diff --exit-code` after a second build) and the plan-contract check still passes on every plan.

## Rollback

Revert the commit and rebuild the skills.
