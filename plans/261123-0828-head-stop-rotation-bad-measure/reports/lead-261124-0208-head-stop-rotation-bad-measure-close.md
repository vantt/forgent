# Phase 1: reading the unconfined full gate on main 980d1276d

Time: 2026-11-24 02:10 (Asia/Saigon). Lead session `head:lead-forgent-261123-0828-head-s-62d31`.

## Outcome

Phase 1 and the plan are `done`, and `p-vbv57yc4d5` is `done`. Both gates are red on `main` `980d1276d`, but none of
the red tests is in this plan's rotation or stop-measure path. Owner answer `q-pcwf3slkfp`, relayed by the manual
supervisor at 02:10, closes phase 1 once this result is in `reports/`. That answer replaces the plan's Risks rule,
which would have kept the row `in-flight`. This plan changes no code.

## Sources

- `npm test` log: `.fgos/runtime/tmp/suite-npm.log`. It ends with `npm exit 1`, with 15 failing tests.
- `cargo test --workspace --no-fail-fast` log: `.fgos/runtime/tmp/suite-cargo2.log`. It ends with `cargo exit 101`, with 3
  failing targets. The earlier `suite-cargo.log` stopped at the first failing target and is superseded.
- Triage of the reds: `plans/reports/triage-261124-0200-main-red-triage.md`. Supervisor summary:
  `plans/reports/report-261124-0215-manual-supervisor-suite-and-release.md`.

## Criteria

| # | State | Evidence |
|---|---|---|
| 1 | green | `reports/planner-261123-0829-head-stop-rotation-bad-measure-cause.md` |
| 2 | green | In `suite-cargo2.log` line 6423, `a_rotation_frame_preserves_decimal_exponent_and_integer_numbers_for_the_route ... ok` |
| 3 | green | In `suite-cargo2.log` line 599, `a_stop_hook_that_fails_before_the_node_route_runs_leaves_one_incident_line_in_the_lineage ... ok` |
| 4 | green | The newest `bad-measure` line in any head `supervisor.log` is dated 2026-11-22 21:52, which is before activation. Current activation is at `2026-11-23T19:04:08Z` (release `9e5ae72c`). There are 15 `at-or-above-soft` stop-trace lines with outcome `started`. |
| 5 | red, but not caused by this plan; closed under the owner answer | See below. |
| 6 | green | The row is `done` in `plans/backlog.md` and in its row file. |

## Red tests on main, none in this plan's path

The cargo reds:
- `fgos-run-supervisor --test head_request`, test `the_contract_names_exactly_the_refusal_codes_and_verbs_the_server_speaks`
  (`packages/run-supervisor/rust/tests/head_request.rs:883`). The contract lists the verb `config patch`, but the
  test's expected list does not. That verb came from `31dcaab69` ("add config patch verb to supervisor grant and request
  route"). The test is about verb-list text. The rotation-frame test in the same target passes.
- `fgos-config --test registry_defaults` (`registry_defaults.rs:190`). The `docLocate.modelSource` doc line uses a colon
  where the schema text uses a comma. This came from `7106dbf78` (docos).
- `fgos --test cli_tests`, test `an_interrupt_of_the_host_ends_the_bridge_child_and_everything_it_started`
  (`cli_tests.rs:3666`). This one is not classified yet.

The `npm test` reds: 15 tests. They are classified in the triage report as a dirty tree, flaky under load, or real
regressions in terminal-groups, guide-schema, domain-registry, convention and mailbox-live-confined. None is in
session-rotation, the stop hook or the head-request measure path.

## Owners of the reds

The reds are owned outside this plan: mostly `p-4nmomwje7j`, plus the docos lane for `registry_defaults`. The supervisor
reports that every red has an owner.

## Unresolved questions

- Who owns the `head_request` contract verb-list mismatch from `31dcaab69`? It is not listed in the triage report.
- Who owns the unclassified `cli_tests` interrupt failure?
