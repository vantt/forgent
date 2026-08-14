# Iron Law evidence — tsk-4lf

`classifyIronLaw` result against the real committed diff (`56b3177e`):
`{"required":true,"matchedFlags":["audit"],"matchedModules":[]}` — the
item's own description cites the audit report filename.

Verify command: `cargo test --manifest-path herdr-plugin/Cargo.toml`.

## Failing-before

With the deadline check in `wait_with_timeout` disabled (`if false &&
Instant::now() >= deadline`, simulating the pre-fix "wait forever on a
wedged subprocess" behavior — the pipe-draining structure stays identical,
only the kill-on-timeout branch is disabled):

```
$ cargo test --manifest-path herdr-plugin/Cargo.toml gateway::tests::wait_with_timeout_kills

running 1 test
test gateway::tests::wait_with_timeout_kills_a_process_that_outlives_the_deadline ... FAILED

thread 'gateway::tests::wait_with_timeout_kills_a_process_that_outlives_the_deadline' panicked at src/gateway.rs:834:9:
a process outliving the deadline must be reported as killed, not waited on forever

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 121 filtered out; finished in 30.01s
```

The 30.01s runtime is itself part of the evidence: with no deadline
enforced, the test thread genuinely blocked until the spawned `sleep 30`
child exited on its own — exactly the "one wedged subprocess pins a thread
forever" hazard Finding 3 describes, reproduced for real rather than
argued from the code alone.

## Passing-after

With the deadline check restored (the real committed state, `56b3177e`):

```
$ cargo test --manifest-path herdr-plugin/Cargo.toml gateway::

running 9 tests
test gateway::tests::error_category_round_trips_known_exit_codes ... ok
test gateway::tests::constant_time_eq_matches_only_identical_bytes ... ok
test gateway::tests::unauthenticated_request_to_a_gated_route_is_rejected ... ok
test gateway::tests::gateway_error_maps_verb_failure_to_its_category_and_status ... ok
test gateway::tests::authenticated_request_reaches_the_verb_chokepoint ... ok
test gateway::tests::mcp_route_is_mounted_on_the_same_router_and_gated_by_the_same_token ... ok
test gateway::tests::contract_route_is_reachable_without_a_token ... ok
test gateway::tests::wait_with_timeout_returns_real_output_when_the_process_finishes_in_time ... ok
test gateway::tests::wait_with_timeout_kills_a_process_that_outlives_the_deadline ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 113 filtered out; finished in 0.10s
```

The timeout-kill test now finishes in ~0.10s instead of blocking 30s,
directly showing the kill fires promptly instead of waiting out the
child's own real lifetime. Full crate suite (no filter): 162 passed, 0
failed.
