# Phase 3: Docs, changelog and integration

Capability: `code:implement` for the text, then `code:test` for the gate. Starts after phase 2 is on main.

## Inputs

- `plans/261127-1224-release-checks-clean-tip/plan.md`: Outcome, "Decisions settled inside the frame", acceptance
  criteria 4, 5 and 6.
- `core/config-standard/release.yaml` and `core/config-schema/release.schema.yaml`: the `checks` doc and
  description ("run with no shell from the project root").
- `docs/platform/run-supervisor/spec.md`: its "Lịch sử quyết định" section (newest entries near the 2026-11-25
  `release run` entry).
- `changelog.d/` existing fragments for the one-line format.
- The `release run` entry of `packages/run-supervisor/contracts/head-request.v1.json` as phase 2 left it.

## Files this phase may write

`core/config-standard/release.yaml`, `core/config-schema/release.schema.yaml`, `docs/platform/run-supervisor/spec.md`,
`changelog.d/261127-1224-release-checks-run-on-a-clean-checkout.md`,
`plans/261127-1224-release-checks-clean-tip/reports/**`.

## Steps

1. `release.yaml` and `release.schema.yaml`, `checks` only: say the commands run with no shell in a clean checkout
   of the trunk tip being released (made and removed by the release run), not from the project root. Leave
   `apply`, `probe`, `rollback` text as is. Do not edit `.fgos/config.yaml` (its doc lines are rendered; the main
   checkout copy also holds the owner's uncommitted edits).
2. `docs/platform/run-supervisor/spec.md`, "Lịch sử quyết định": one dated entry (2026-11-27), in the section's
   language, stating: release checks run in an exact detached checkout of the trunk tip under
   `<project>-worktrees/release-check-<id>`, made and removed through the worktree door; the checkout holds the tip's
   committed `.fgos` through the one Git method that Land's candidate also uses; a refused removal is reported, not
   fatal; `check-checkout-failed` when the checkout cannot be made; why (four `checks-failed` runs on 2026-11-27 from
   live-checkout causes, backlog p-sqppgb2jhq; owner order P0). Point to the contract entry instead of restating it.
3. `changelog.d/261127-1224-release-checks-run-on-a-clean-checkout.md`: one `- Changed:` line, user-visible wording.
4. Integration gate. Hand both commands to lead:SUPERVISOR as one job on the combined tree at the trunk tip:

   ```bash
   npm test
   cargo test --workspace
   ```

   Record the commit, both results and durations in `reports/integration.md`.
5. Live check (acceptance criterion 6), after a release containing phase 2 is active: ask lead:SUPERVISOR for the
   next `fgos release run` ticket and its `<id>.log`; record in `reports/integration.md` the checkout path the checks
   ran in, the cargo check's duration against the 30-minute step bound, and whether the checkout was removed (or the
   report line that says why not). If the cargo duration is above 20 minutes, file a backlog row for a shared build
   cache of the check checkout (`fgos identity mint backlog`), and name it in the report.

## Verify

`npm test` and `cargo test --workspace` green on the combined tree (lead:SUPERVISOR job); `reports/integration.md`
holds both results and the live-run evidence; `node scripts/plan-contract-check.mjs --plan
plans/261127-1224-release-checks-clean-tip` passes.

Pass: both gates green, the live run's checks ran under `forgent-worktrees/release-check-<id>`.

## Rollback

Revert this phase's commit: the doc and changelog text go back; behaviour is unchanged.
