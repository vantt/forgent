# Phase 3: rules, docs and integration

## Inputs

- `plan.md` (all of it), the landed results of phases 1 and 2 (run by Keeper's lead, plan `261122-0056-orchestration-skeleton`), and plan
  `plans/261126-2324-changelog-fragments-and-skill-surface-regeneration/` (must be `done` before this phase starts;
  its `changelog.d/README.md` and `reports/land-regenerate-skill-surfaces.md` say what the land-side half built).
- Discussion `plans/discussions/ds-yf3vnbidi6-plan-footprint-overlap/DISCUSSION.md` §4 (D1) and §6.
- `AGENTS.md` ("Install/setup/doctor gate", last bullet: "add a line to `## [Unreleased]` in `CHANGELOG.md`").
- `core/skills/_shared/plan-contract.md` §2 (footprint row mentions CHANGELOG), §4 (Hot files), §5 (cross-plan
  overlap rule).
- `core/skills/fgos-supervisor/SKILL.md` (`supervisor plans --json` read view fields, near line 48).
- `docs/platform/supervision/spec.md`: Shared Entities "Plan" row (`:73`), "Lead to land" (`:137`), §8
  "Lịch sử quyết định" (`:199`).
- `docs/platform/governance.md#decision-scope-to-holder-table` for where the decision narrative goes.

## Files this phase may write

- `AGENTS.md`, `core/skills/_shared/plan-contract.md`, `core/skills/fgos-supervisor/SKILL.md`,
  `docs/platform/supervision/spec.md`
- the generated surfaces rebuilt by `npm run build:skills`: `.agents/skills/**`, `.claude/skills/**`,
  `plugins/fgOS/skills/**`, `.fgos/instructions/effective/rules.json`
- `changelog.d/261126-2318-plans-that-share-a-path-both-run.md` (new)
- `plans/261126-2318-plan-footprint-overlap-warns/reports/**`

## Steps

1. `AGENTS.md`: the gate bullet becomes "add one file under `changelog.d/` (`changelog.d/README.md` names the
   scheme); never edit `CHANGELOG.md` directly".
2. `plan-contract.md`: §2 footprint example says `changelog.d/<fragment>` instead of CHANGELOG; §4 hot files drops
   CHANGELOG and says generated files declared in `land.regenerate` are rebuilt at land; §5 cross-plan rule
   becomes: overlap with another `ready` or `running` plan is a warning naming the plan and paths, never an error,
   and conflicts are met at land; `blockedBy` is for a real ordering, never a workaround for a shared file. The
   same-wave rule wording stays.
3. `fgos-supervisor/SKILL.md`: the read view lists `overlaps` as advice; the supervisor admits regardless and may
   mention the overlap to the lead of the newly admitted plan.
4. `supervision/spec.md`: the Plan row says admissible needs `ready` and `blockedBy` done (overlap is advice);
   "Lead to land" says `land.regenerate.files` takes globs; §8 records the change with D1 and the evidence (353
   merges, 38 conflicts, 3 on hand-written source) and names the retired hold `held-footprint-overlap`.
5. Run `npm run build:skills` and keep its output.
6. Write this plan's fragment, for example: `- Changed: plans whose footprints overlap are both admitted; the plan
   contract check and `fgos supervisor plans` report the overlap as a warning naming the other plan and the shared
   paths, and conflicts are met at land.`
7. Integration: in a fresh linked worktree at the trunk tip run `npm test` and `cargo test --workspace`; write the
   result (commands, counts, any failure with its cause) to `reports/integration.md`. A failure caused by this plan
   goes back to the phase that owns it; an unrelated failure is named with its owner and does not block.

## Verify

`node scripts/run-tests.mjs test/scripts/doc-health.test.mjs test/architecture.test.mjs` passes, a second
`npm run build:skills` leaves `git status` clean, and both full suites are green in `reports/integration.md`.

## Rollback

`git revert` the phase commit and run `npm run build:skills`.
