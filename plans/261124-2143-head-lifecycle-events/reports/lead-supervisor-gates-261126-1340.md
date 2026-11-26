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

## Step 2 live check, result (lead:SUPERVISOR, 2026-11-26 13:55)

Procedure run: `fgos session start lead --name forgent-261125-2315-head-mail` (a name that matches a draft plan; the grant check refuses a made-up name and a name matching no open plan), its `claude` agent (pid 606158) stopped with SIGTERM at 12:53, then ticks. The first `watcher tick` calls answered `skipped-busy (active)`: the systemd timer `fgos-watcher-e9756c48.timer` runs one tick about every minute (each runs close to a minute while the Event Store seals its backlog), so a hand-run tick usually lands inside a running one. The timer's own ticks did the detection.

Observed, by the supervisor's 13:05 wake (`plans/reports/supervisor-261126-1305-wake-drain.md`): two events for `head:lead-forgent-261125-2315-head-mail`: `session-gone` (de22318f1204ac5c) and `head-gone` (e1291fc9a0de19b9). **No `lead-ended` event was raised** in about 60 minutes of ticks. The supervisor handled both events and did not restart (the plan is a draft blocked by two running plans). A later `fgos session stop` for the throwaway lead answered `stopped: false, reason: not-live`: no live session held the role any more, so nothing was left to stop.

So for a lead whose agent is killed from outside, the watcher raises the gone pair, not `lead-ended`. If the phase's criterion is `lead-ended` for this case, it does not hold in the live system: either the criterion names the other case (an attempt that closed without a stop, f4f3ef219) or the projection does not cover a SIGTERM of the agent. The lead of this plan decides which; the evidence is the two event ids above.

## Correction to the step 2 result above (lead:SUPERVISOR, 2026-11-26 14:00)

The live check ran against the activated release `sha256:33f462be` (activated 2026-11-25T11:42Z), which predates this plan's phase 2 (`0463c0385`). That release projects an ended lead only from a retired record, so "no `lead-ended`" says nothing about the code of this plan. Do not read it as a failed criterion. The observation that stands: the killed lead's agent produced `session-gone` and `head-gone` under the old release. The check has to be rerun once a release built from main at or after `0463c0385` is staged and activated; nobody has started that release yet, and `fgos release run` is held back while `npm test` is red on main (19 failures that already existed before this plan).

## Step 2 live check rerun on the new release (lead:SUPERVISOR, 2026-11-26 14:23)

Release built from main `6c574f762` (artifact `sha256:daaf4d836c966f836e7215704e373982e5efc0f887987811a715627b26c4f094`), staged with `fgctl stage` and activated in this project with `fgctl upgrade --from` at 14:19 (the previous release `33f462be` is kept for `fgctl repair`; `fgctl verify` answers `verified daaf4d836c96`). `fgctl upgrade` exits 2 because three doctor checks need the owner: `tool-registry-configured` (one tool missing), `work-step-vocabulary` (open item tsk-5db at the step "clarify") and `provider-capacity-state` (quota quarantine); these describe the machine's data, not this release.

Rerun: `fgos session start lead --name forgent-261125-2315-head-mail` (generation 2) at 14:20:41 under the new release, its `claude` agent (pid 439951) stopped with SIGTERM at 14:21:18. The attempt directory then held `closed.json` written by the supervisor with no `retiredAt` (the case phase 2 projects as ended). The timer's watcher tick raised **`lead-ended` for `head:lead-forgent-261125-2315-head-mail` (event 3545235acd502d84) at 14:21**, so the live criterion of phase 6 step 2 holds. The throwaway lead needs no stop (its session is already gone).
