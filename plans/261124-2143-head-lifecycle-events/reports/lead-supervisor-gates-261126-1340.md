# Phase 6 full gates on main, run by the unconfined lead:SUPERVISOR session

Main at `4780cdb2e` (after the head-lifecycle-events phase 5 land `8afaaba50` and the head-communication phase 5 land `2acb6007c`), run 2026-11-26 13:12 to 13:35 (+07), one suite at a time, a writable session, no code fix and no land.

| Gate | Exit | Result |
|---|---|---|
| `npm test` (11 min) | 1 | 6621 tests, 6575 pass, 19 fail, 27 skipped |
| `cargo test --workspace --no-fail-fast` (11 min) | 101 | 4502 pass, 3 fail, 13 ignored, 444 test binaries |

The earlier run of 11:05 on `c5459cba8` had 17 npm failures and 2 cargo failures.

## cargo failures (3)
- `every_top_level_package_contract_file_and_every_prose_contract_has_exactly_one_row` (component-authority `model_checks`): `head-permissions.v1.json` has no row. Failed on 2026-11-25 as well; not this plan's.
- `an_interrupt_of_the_host_ends_the_bridge_child_and_everything_it_started` (apps/fgos/tests/cli_tests.rs:3666): fails only inside the full run, passed 3 of 3 alone. Load-sensitive, not this plan's.
- `every_section_and_placeholder_of_the_frame_contract_is_present` (packages/mailbox/rust/core/tests/frame.rs:493, left 44 right 40): NEW since 11:05. It belongs to plan 261125-2313 (its phase 5 added four placeholders to `frame.v1.txt`); the lead of that plan was told.

The `routing::tests::git_refuses_an_unknown_flag_in_the_node_cli_text` failure your unit saw did not fail on main in this run.

## npm failures (19)
- Same files as the 11:05 run: `test/run-supervisor/terminal-cutover.test.mjs` (8), `test/runner/provider-per-cli-credential-sources.test.mjs` (3), `test/workflow/guide-schema.test.mjs` (2), `test/install-packaging.test.mjs` (1), `test/scripts/convention-conformance.test.mjs` (1), `test/git/one-door.test.mjs` (the static scan of Git spawn shapes).
- NEW since 11:05: the decision-citation drift gate (`test/scripts/check-decision-citation-drift.test.mjs`, three findings) failed because two backlog rows cited D-local ids (p-5iq6tnsjdl line 20, p-lfsc4czpgh line 22). Fixed in `b79b357e2` (the ids are replaced by their content); not this plan's code.
- The `case-close` prune test that failed at 11:05 passed this time (load-sensitive).
- The suite witness again reports one deleted `.fgos/runtime/dev-host/run-*` directory (known, backlog p-pbebee63t6).

## Read for phase 6
None of the failing files is in this plan's footprint. Steps 1 and 4 (the full gates) are done; step 2 (the live check with a throwaway lead) is not: a throwaway lead was started on a draft plan name (`forgent-261125-2315-head-mail`) and its agent killed, but `watcher tick` answered `skipped-busy (active)` for several minutes because the Event Store was sealing a week of backlog after an old Git transfer was recovered, so no `lead-ended` event could be observed yet.
