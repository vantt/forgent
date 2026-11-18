# Phase 13 — Wake trigger and pace definitions

Detection is data: named query files the watcher runs (ops-metrics phase 7 grammar), no code per trigger. This phase
writes this plan's definitions and one fixture per definition. `head-gone` and `plan-no-progress` belong to
ops-metrics phase 14 and are not written here.

## Inputs
- Waits: ops-metrics phase 5 (query grammar), 7 (definition file shape `{name, requires, query, params, minSample,
  row}`, `--def`), 8 (`fgos.run.attempt`), 11 (`fgos.head.state`, `fgos.plan.status`). Step 0 reads their landed kind
  declarations for the exact attr names; do not guess them.
- Style reference for definitions and their tests: ops-metrics phase 7 step 5 and
  `plans/261118-0936-ops-metrics/phase-05-query-engine.md` step 4.
- Phase 3 `observe-kinds.json` (`fgos.watcher.tick`, `fgos.supervisor.wake`, `fgos.discussion.status`) and phase 14
  (the discussion kind's attrs).
- Phase 4 config keys the definitions read through `params.configKey` (the wake-failure limit).
- Row shape the watcher consumes (phase 11): `{kind, reason, nextCommand, subject, ts}`; `ts` is the instant of the
  underlying record, so a re-run over an overlapping window gives the same event id.

## Footprint
`core/watcher/**`, `packages/supervision/rust/tests/definitions.rs`,
`packages/supervision/rust/tests/fixtures/definitions/**`.

## Steps
0. Re-grep inputs; list the attr names each definition needs from the landed declarations.
1. Files in `core/watcher/definitions/` (`<name>.query.json`). `since` is never written in a file: the watcher passes it.
   - `plan-became-ready`: `fgos.plan.status` changes with the new status `ready`. Row subject = plan dir.
   - `plan-done`: the new status is `done`.
   - `plan-priority-changed`: attr `fgos.plan.change` = `priority`.
   - `lane-freed`: `fgos.run.attempt` spans that ended in the window, one row per `origin.host`.
   - `lead-ended`: `fgos.head.state` `retired` where the role starts `head:lead-`.
   - `discussion-settled`: `fgos.discussion.status` whose new state is `settled`.
   - `watcher-active` (pace): a row while any plan's latest status is `running` or any `head:lead-*` is `live`; no
     row means idle.
   - `supervisor-wake-failed` (notify-only): `fgos.supervisor.wake` with outcome `start-failed` or `identity-unknown`
     since the last `started`, with a `having` count above `params.limit <- <wake-failure key>`.
   Each carries `row: {kind, reason, nextCommand}`; `nextCommand` is the verb the supervisor runs next (for example
   `fgos supervisor plans`), written once here.
2. The directory holds only definition files, so the watcher runs it with one
   `--def core/watcher/definitions` call (ops-metrics phase 7: one host call returns every definition's rows).
3. `tests/definitions.rs`: for each definition, a fixture pair under `fixtures/definitions/<name>/`
   (`records.jsonl` over test-local sources, `expected.json`); the test runs the real Observe query over it.
   - each definition raises exactly one row on its matching fixture and none on its non-matching fixture;
   - a definition whose required kind is undeclared answers `unmeasured`, not zero rows;
   - the config-backed limit of `supervisor-wake-failed` is resolved from a test-local config value.

## Verify
- `cargo test -p fgos-supervision --test definitions` passes (plan acceptance 4).
- `npm run fgos:dev -- metrics query --def core/watcher/definitions --since -1h --dir <fixture project>` prints no
  `unmeasured` row on a project whose kinds are declared.

## Rollback
Revert the phase commit. The watcher then finds an empty definition directory and raises nothing.
