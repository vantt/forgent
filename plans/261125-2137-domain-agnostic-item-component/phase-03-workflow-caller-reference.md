# Phase 3: Workflow takes a caller reference

Status: ready. Decision: A4 (Workflow runs cases with an opaque caller reference and knows no portfolio).

## Inputs
- Discussion §6 "Who records what" (Workflow records nothing in the portfolio; milestones may carry stage tags).
- `src/workflow/case-start.mjs:152-164`, `src/workflow/propose.mjs:47` (`planCaseSlug`), `:451`, `:615`.
- `test/workflow/propose.test.mjs`; callers in `src/cli/command-registry.mjs`, `bin/fgos.mjs`, `core/skills/fgos-cook/**`, `domains/coding/skills/fgos-coding-driving/SKILL.md`, `domains/coding/skills/fgos-coding-planning/references/approach-and-shape.md`.

## Footprint
- `src/workflow/case-start.mjs`, `src/workflow/propose.mjs`, `test/workflow/**`
- `src/cli/command-registry.mjs`, `bin/fgos.mjs`
- `core/skills/fgos-cook/**`, `domains/coding/skills/fgos-coding-driving/**`, `domains/coding/skills/fgos-coding-planning/**`
- generated renders `.agents/skills/**`, `plugins/fgOS/skills/**`, `.claude/skills/**`

## Steps
1. Replace `--plan`/`--phase` on case start and propose with `--caller-ref <opaque string>` and `--name <caller-given case name>`; Workflow stores the reference verbatim and never parses it.
2. Replace `planCaseSlug(plan)` with the caller-given name, keeping the request slug fallback.
3. Allow an optional `stageTag` on a milestone in the guide schema read path; Workflow carries it, never acts on it.
4. Move every caller (CLI registry, `bin/fgos.mjs`, the three skills) to the new flags and delete the old flags in the same change (L10).
5. Update `test/workflow/propose.test.mjs` and the case-start tests: the reference round-trips unchanged; a milestone stage tag is carried.
6. Run `npm run build:skills`.

## Verify
`node --test test/workflow/` passes; `rg -n "planCaseSlug|propose --plan" src core domains bin` finds nothing.

## Rollback
`git revert` the phase commit and rerun `npm run build:skills`.
