# Phase 09 report: `gateway start|stop|status` native

Branch `rust-verb-migration-program/s3-p09`, based on the integration head `8d6a07c4c` (unmoved at the last fetch).
Status: DONE_WITH_CONCERNS.

## What changed
- `apps/fgos/src/wiring/gateway_control.rs`: the whole lifecycle in the host (registry `.fgos/gateway.json` through Durable File, the `gateway` lock through the holder-lock registry, identity judge and signal by identity from `fgos-process`, the release build, the detached spawn without the recursion guard, a plain-HTTP `GET /v1/contract` probe with a 3 s bound, the shutdown seal through `EventStoreLifecycle::trigger` with `Policy { shutdown: true }` only, outside the lock and also when the stop failed). Operations `gateway.start|stop` (write), `gateway.status` (read); provider, projector arm (shared parser only), `NATIVE_SUBCOMMANDS`, catalog rows, annotation `{owner_path: apps/fgos}`, registry `native: true`, routes regenerated.
- Off Unix `start` refuses with a message saying so; `stop` and `status` build and run everywhere (msvc and darwin `cargo check` clean).
- Deleted: `src/runner/gateway-control.mjs`, the `bin/fgos.mjs` arm, `test/runner/gateway-control.test.mjs`, `test/cli/fgos-gateway.test.mjs`, their `manifest.files` entry and the two `suite-baseline.json` rows.
- `doors` row "control the gateway process" (allowed: `gateway_control.rs` only, no debt). Negative case: a scratch `src/scratch-door.mjs` naming `gateway.json` failed the row ("does the job outside its door"), then was removed.
- Cherry-picked `257e6d07c` (Node-grammar unknown-flag text, registry flag order) from `s2-p02` as the step lead asked; conflict in `routing.rs` resolved by taking it whole and re-adding the gateway line and one test. The routes and census were regenerated. Expect a trivial conflict with the same commit when `s2-p02` lands first.
- `Cargo.lock` is not staged: the new `fgos-durable-file` edge makes cargo add one line (the step lead commits it alone).

## Accepted differences (from base)
- Missing or unknown sub-command: the host's one text, exit 4 (as the plan lists).
- `gateway stop|status` where no project is found (no `.fgos` above the call): `status` and `stop` answer "not running" and create nothing (Node left an empty `.fgos/locks/gateway.lock`); `start` refuses with the not-in-project text, exit 4 (Node: the "no apps/fgos-gateway" text, also 4). Reason: the host seam hands a provider only the project, not the root of a missing store.
- A registry that does not parse: same prefix and exit 4; the parser's own reason differs (V8 text vs serde text). Parity compares everything up to it.
- The gateway log is created `0600` (the detached-spawn door), Node `0644`.
- `start` reads the port from the machine config before spawning, Node after; only a home-less caller sees the difference (now refused before a process exists).

## Gates
- `cargo fmt --all --check`, `cargo clippy -p fgos -p fgos-host-runtime --all-targets -- -D warnings`: clean.
- `cargo test -p fgos -p fgos-host-runtime`: green (fgos bin 123 incl. 27 gateway, cli_tests 53 incl. the new wiring case).
- msvc and darwin `cargo check -p fgos -p fgos-host-runtime`: no gateway warnings or errors.
- `cargo test --locked` in `apps/fgos-gateway` (own target): green.
- Census regenerated: 0 undeclared (`argv-runner` 16 -> 19; `Command::new("cargo")` is a literal, the spawned gateway an argv runner).
- `node scripts/run-tests.mjs` over fgos-manifest, command-routes, subcommand-flag-drift (now lists gateway as native, shared projector), architecture, git-mutation-census, unknown-flag-rejection: green. `test/rust-host/verb-parity.test.mjs` does not exist on the integration branch (the step lead adds it), so parity ran through an ad hoc driver (scratchpad `p09-parity.mjs`) that implements the call order of the table header (`prepare`, entry, `evidence`, `cleanup`), entry A = `node <base>/bin/fgos.mjs` with the staged env of `rvm-s23-base` (main `8d6a07c4c`), entry B = this tree's staged host. **39/39 cases green**: status (fresh, flag before the sub, named dir from elsewhere, extra positional, no project, linked and frozen worktree, stale, no identity, live not reachable, live reachable, corrupt, unknown flag, several unknown flags, `--dir=`, bare and empty `--dir`), stop (fresh, from elsewhere, no project, linked, frozen refused, stale, live process, reused pid, a process ignoring TERM (about 5 s), no identity, corrupt, unknown flag), start refused before any build (no crate, already running, no identity, corrupt, frozen, unknown flag, no project), and the three sub-command refusals.
- Manual, fg-server2, staged host: real `gateway start` (cold build 70 s; the crate's `Cargo.lock` stayed clean), `status` running+reachable, `/proc/<pid>/environ` has no `FGOS_RUST_HOST_RECURSION_GUARD` although the caller had it set, `POST /v1/sessions` answered HTTP 200 with a session row, a second `start` refused (`already running (pid 1965679, port 4199)`), `stop` -> `{alreadyStopped:false,pid,port}`, port free, no process left.

## Proposed `## [Unreleased]` lines (the step lead writes them)
- `fgos gateway start` is refused off Unix with a message saying so; it never worked there.
- `fgos gateway stop` and `fgos gateway status` outside a project create nothing.
- `fgos gateway stop` from a linked worktree answers `alreadyStopped` and runs no shutdown seal (it used to create the worktree's `.fgos` and seal the main checkout).

## Retired test -> owner now
| retired test (`test/runner/gateway-control.test.mjs`) | owner now (`gateway_control.rs` unless noted) |
|---|---|
| status: no registry | `status_with_no_registry_is_not_running` |
| status: corrupt registry fails closed | `a_registry_that_does_not_parse_fails_closed_and_is_kept` (+ falsy values: `a_registry_that_holds_a_falsy_value_means_nothing_is_running`) |
| status: dead pid is stale | `a_recorded_process_that_is_gone_is_a_stale_registry` |
| status: live and serving | `a_live_process_whose_port_serves_the_contract_is_running_and_reachable` |
| status: live, nothing listening | `a_live_process_with_nothing_listening_or_a_failing_answer_is_running_but_not_reachable` (+ hung: `a_hung_gateway_makes_status_return_within_the_probe_timeout`) |
| stop: no registry | `stop_with_no_registry_is_already_stopped_and_seals_what_is_open` |
| stop seals after releasing the lock | same test (lock free at the trigger) and `the_shutdown_seal_also_runs_when_the_stop_failed_and_never_where_the_store_does_not_run` |
| stop from a linked worktree seals the main checkout's events | **removed, a disclosed behaviour change**: from a linked worktree no project is found, so the CLI never reaches the trigger. `stop` answers `alreadyStopped`, creates nothing and runs no shutdown seal (Node created `<linked>/.fgos` and sealed main). What the trigger does with a project root is owned by `the_shutdown_seal_*` tests; main-root resolution by the `fgos-git` `main_checkout_root` tests |
| stop: dead pid cleared | `a_dead_process_is_cleared_and_reported_already_stopped_with_its_pid` |
| stop: live pid TERM-ed | `a_live_process_is_sent_term_and_the_registry_is_cleared` |
| stop: escalates to KILL | `a_process_that_ignores_term_is_killed_after_its_window_and_the_registry_is_cleared` |
| no verifiable identity (status, stop, start) | `an_entry_with_no_verifiable_identity_is_never_signalled_and_every_call_refuses_by_name` |
| reused pid cleared, nothing signalled | `a_recorded_identity_whose_start_time_is_not_the_live_pids_is_cleared_and_nothing_is_signalled` |
| start: immediate exit within one poll | `a_gateway_that_exits_at_once_is_reported_within_one_poll_with_its_log` |
| start: refuses with a live registry, no side effects | `a_start_with_a_live_registry_refuses_before_touching_the_crate` |
| start: no gateway crate | `a_project_with_no_gateway_crate_is_refused_by_name` |
| lock: a live holder blocks and is named | `a_held_lock_blocks_a_contender_until_its_timeout_and_names_the_holder` (+ `the_lock_path_is_the_one_the_lock_registry_names`) |
| lock: a SIGKILLed holder releases at once | behaviour of the kernel lock primitive, owned by `packages/holder-lock/rust` (drain/release tests); nothing gateway-specific remains |
| start: two concurrent starts build and spawn once | `two_concurrent_starts_build_and_spawn_exactly_once` |
| start: `--locked` build, no guard, rest of env | `the_release_build_runs_cargo_in_the_crate_with_a_locked_release_build_of_the_gateway`, `the_gateway_is_spawned_without_the_recursion_guard_but_with_the_rest_of_the_environment` |

| retired test (`test/cli/fgos-gateway.test.mjs`) | owner now |
|---|---|
| no sub-verb, unknown sub-verb | `routing.rs` `a_missing_or_unknown_sub_command_is_an_arg_parse_fault_naming_what_is_available` (generic) |
| status and stop on a fresh repo | `cli_tests.rs` `gateway_status_and_stop_of_a_fresh_project_start_no_node_and_answer_not_running` (also the no-Node proof) |
| start without a gateway crate | `a_project_with_no_gateway_crate_is_refused_by_name` |
| manifest lists the sub enum | `fgos-manifest.test.mjs` (enum equals registry keys) and, new, `routing.rs` `a_native_verb_serves_exactly_the_sub_commands_its_route_lists` plus the `subcommand-flag-drift` native entry |

New tests with no old owner: build argv and failure shapes (`run_build` pair), spawn mechanics (registry bytes and mode, `a_start_records_the_gateway_once_it_says_it_is_listening`), the project-less call, the sub-verb projection.

## Concerns
1. The manual run showed a gateway started in a throwaway project whose `apps/fgos-gateway` is a symlink resolves its verb calls to the real checkout: its `POST /v1/sessions` wrote a session into the main checkout's `.fgos/sessions.json` and a worktree under `/tmp/fgos-sessions`. I removed the worktree (`git worktree remove`) and my one row; the main checkout `git status` is as before. Not a product bug.
2. The Rust fault writer reduces a `--k=v` value inside a recorded message to its length (`--dir=<20>`); the Node writer keeps the text. Pre-existing writer twin difference; the one gateway case that shows it ignores the fault evidence.
3. `tuple_of` (record to process tuple) now exists in three places (node addon, run-supervisor, here). Folding it into `fgos-process` was out of this phase's file set.
4. `packages/holder-lock/contracts/lock-registry.v1.json` still says "v1 source: src/runner/gateway-control.mjs"; docs naming the deleted module (`docs/explanation/fgos-gateway-lifecycle-verb.md`, `docs/platform/component-boundary.md`, backlog row p-265qfonr5w about the guard "in five places") are left for the close phase.
5. `subcommand-flag-drift.test.mjs` edits two array lines (`MULTI`, `NATIVE`) that other S3/S2 phases edit too: expect a one-line rebase conflict.
6. The gateway build inherits `CARGO_TARGET_DIR`; a caller that sets it gets "no binary found" (as Node did). Unchanged, not fixed here.
7. Follow-up fix: a gateway that is spawned and then never prints `listening on` within the startup timeout is now stopped by identity (TERM, then KILL) before `start` returns; test `a_gateway_that_never_says_it_is_listening_is_stopped_by_identity_and_not_recorded` (the timeout is a `StartParts` field). The identity-unreadable path cannot be stopped by identity (no identity to name) and still leaves the process running; its message names the log.
8. The gateway crate's `target` under the worktree (about 1 GB) remains until the worktree is removed; a shell hook blocked deleting a path named `target`.

## Follow-ups after the OPC verdict
- Guard test no longer sets the process environment; it pins `GATEWAY_ENV_REMOVE`, and `spawn_mapped.rs` owns the removal.
- The test reaper signals by the recorded tuple (`signal_by_identity`), not a bare `kill -9`.
- `status-equals-flag` compares the fault record's class, verb and sub-command; only the message is masked.
- Doors row gains `['"]fgos-gateway['"]` (allowed: `gateway_control.rs`, and `holder-lock/.../origin.rs`, whose binary list only recognises a lock holder). The gateway crate is not listed: it has no match, and an unmatched allowed path is stale. Negative case: a scratch `src/scratch-door.mjs` containing `"fgos-gateway"` fails the row.
