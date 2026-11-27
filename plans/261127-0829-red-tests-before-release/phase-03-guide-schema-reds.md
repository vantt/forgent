# Phase 3: Workflow guide schema reds

## Inputs

- `reports/phase-01/verdict.md` (the rows owned by phase 3).
- `test/workflow/guide-schema.test.mjs`, `src/workflow/guide-schema.mjs`, `src/workflow/loader.mjs`,
  `src/workflow/definition.mjs`, `domains/*/workflows/*.yaml`.
- Commits `410f9ab4af` (the test counts ten workflows and lists `coding/bugfix` as guide form), `d44b2fb196` and
  `cc9cb43c5a` (the bugfix workflow).
- Workflow spec under `docs/platform/` (resolve the path through `docs/reading-map.md`).

## Footprint

- `src/workflow/guide-schema.mjs`
- `src/workflow/loader.mjs`
- `src/workflow/definition.mjs`
- `domains/coding/workflows/bugfix.yaml`
- `test/workflow/guide-schema.test.mjs`
- `plans/261127-0829-red-tests-before-release/reports/phase-03/**`

## Steps

1. If phase 1 shows this file green, write `reports/phase-03/result.md` ("green at <tip>, no change", citing
   `reports/phase-01/listed-files.log`) and stop.
2. Find each failing case's cause. Known before `410f9ab4af`: 10 registered workflows where 9 were expected, and
   `coding/bugfix` read as `guide` where `playbook` was expected. Decide from the workflow spec and the bugfix
   workflow's own form which side is right. If the test's expectation is out of date with a settled change, updating
   it is a fixture fix. If the workflow or the loader is wrong, fix that.
3. Never delete an assertion, add a skip or add an env switch.
4. Write `reports/phase-03/result.md`: cause, fix, and the commit.

## Verify

Unconfined: `node scripts/run-tests.mjs test/workflow/guide-schema.test.mjs` exits 0, and so does every
`test/workflow/` file that imports a changed module.

## Rollback

Revert the phase commit.
