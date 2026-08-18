# Iron Law evidence — tsk-og6

`classifyIronLaw` result against the real committed diff (`60a67a38`):
`{"required":true,"matchedFlags":["audit"],"matchedModules":[]}` — the
item's own description cites the audit report filename
(`plans/reports/gateway-audit-260814-2110-fable-hidden-bugs-report.md`),
tripping the `audit` flag.

Verify command: `cargo test --manifest-path herdr-plugin/Cargo.toml`.

## Failing-before

With `build_fgos_command`'s `.current_dir(root)` call temporarily removed
(pre-fix behavior — the Command carries no explicit working directory):

```
$ cargo test --manifest-path herdr-plugin/Cargo.toml gateway::tests::build_fgos_command

thread 'gateway::tests::build_fgos_command_runs_in_root_not_the_ambient_process_cwd' panicked at src/gateway.rs:766:9:
assertion `left == right` failed
  left: None
 right: Some("/tmp/fgos-gateway-test-root")

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 120 filtered out; finished in 0.00s
```

## Passing-after

With `.current_dir(root)` restored (the real committed state, `60a67a38`):

```
$ cargo test --manifest-path herdr-plugin/Cargo.toml gateway::

running 8 tests
test gateway::tests::constant_time_eq_matches_only_identical_bytes ... ok
test gateway::tests::error_category_round_trips_known_exit_codes ... ok
test gateway::tests::build_fgos_command_runs_in_root_not_the_ambient_process_cwd ... ok
test gateway::tests::unauthenticated_request_to_a_gated_route_is_rejected ... ok
test gateway::tests::gateway_error_maps_verb_failure_to_its_category_and_status ... ok
test gateway::tests::mcp_route_is_mounted_on_the_same_router_and_gated_by_the_same_token ... ok
test gateway::tests::authenticated_request_reaches_the_verb_chokepoint ... ok
test gateway::tests::contract_route_is_reachable_without_a_token ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 113 filtered out; finished in 0.00s
```
