# Independent validation of the ops-metrics plan (2026-11-18)

An independent Plan subagent (opus, read-only) checked the first draft (commit `14aba36e3` and its follow-ups) against:

- `docs/discussions/ops-metrics/DISCUSSION.md`;
- the plan contract;
- the repository: about 30 citations, most of them accurate.

The owner asked for this check (option 1) because the shaper wrote the plan without a separate planner.

It found 9 must-fix, 8 should-fix and 2 nit findings. Each one, and what was done about it:

| # | Finding | Disposition |
|---|---|---|
| 1 | `contract.rs` and the v1 sources had no owner, so a second record shape appeared beside v1 | Phase 1 owns `contract.rs` and adds a v2 `RecordSource`. Phase 8 moves the run source and phase 10 moves the transcript source. Retiring `WorkSource`/v1 becomes a backlog row (phase 16). |
| 2 | New verbs were missing from `command-registry.mjs` and the generated routes | The registry and routes are hot files with one writer per wave: phases 3, 7, 9 and 13. |
| 3 | No Node door reached `fgos-execution` | The parsers move to `fgos-run-result` and are exposed through the existing addon namespace `runResult`, with an ABI bump in `src/native/door.mjs` (phase 6). |
| 4 | Phase 5's footprint missed the test and manifest files | Phase 6 now lists `test/runner/usage-parsers.test.mjs`, `run-result-source-scan.test.mjs`, `test/suite-baseline.json` and `docs/architecture-manifest.json`. |
| 5 | A driving test placed in the Observe crate broke the crate boundary and OM-D5 | The test moves to `apps/fgos/tests/driving_definitions.rs` (phase 15). |
| 6 | The query grammar could not express its own detections | Phase 5 adds `latest-per`, `age:ts`, a group filter against k × a measure, and an anti-join. It proves `head-gone`, `plan-no-progress`, `lane-freed`, `plan-became-ready`, the pace rows and owner wait as plain queries. |
| 7 | Observe cannot read config | The composition root (`apps/fgos/src/wiring/observe_query.rs`, phase 7) resolves `params.configKey`. |
| 8 | A new `attention` config section would miss the bundle | The key becomes `dispatch.attention.planNoProgressMinutes` in the existing `dispatch` section. The golden fixtures are in phase 14's footprint. |
| 9 | Declarations loaded from `packages/` cannot ship | Crates embed their declarations with `include_str!` and the composition root injects them. Globs are kept only for `core/`, `domains/` and `.fgos/observe/kinds`. |
| 10 | Measure 7 and the m2 re-check had no verify source | Phase 8 projects `fgos.unit.verify`. |
| 11 | The question kinds had no real declaration | Definitions carry `requires` and report `unmeasured` until the owner-question component declares the kinds (OM-D13, OM-D14). |
| 12 | Footprints missed files | Added: `settle-attempt.mjs` and `case-verbs.mjs` (phase 3), `agent-result-claim-contract.mjs` (phase 12), and the doctor wiring (phase 16). |
| 13 | Test files cited in the plan did not exist | Tests now go to the owning files: `dispatch-runtime-inspect.test.mjs`, `assignment-runresult.test.mjs`, and the inline tests in `friction.rs`. |
| 14 | `run-tests.mjs` was given a directory | Every verify now lists test files. |
| 15 | A doctor row was cited that does not exist | Phase 16 adds warn-only pointer rows only. |
| 16 | Two DISCUSSION items were dropped | Driving passes `--plan`/`--phase` (phase 12). Keeping measures after run-dir pruning becomes a backlog row (phase 16). |
| 17 | Phases were over two days of work | The plan is split from 12 phases into 16. |
| 18 | Measure 3 contradicted itself | The outcome and acceptance now say measure 3 is `unmeasured` until the question events exist. |
| 19 | The `rank` preset row was redundant, and `--def` took a single file | The row is dropped. `--def` is repeatable and takes a directory. |
