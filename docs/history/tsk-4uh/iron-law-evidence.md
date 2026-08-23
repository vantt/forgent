# Iron Law evidence — tsk-4uh

`classifyIronLaw` result against the real committed diff (`bfc3a060`):
`{"required":true,"matchedFlags":["audit"],"matchedModules":[]}` — the item's
own description cites the audit report filename
(`plans/reports/gateway-audit-260814-2110-fable-hidden-bugs-report.md`),
tripping the `audit` flag.

Verify command: `cargo test --manifest-path herdr-plugin/Cargo.toml`.

## Failing-before

With the fix's 6 test-URI updates in place but `build_router`'s
`.nest("/v1", ...)` wrapper temporarily reverted (pre-fix routing), the same
suite:

```
$ cargo test --manifest-path herdr-plugin/Cargo.toml gateway::

thread 'gateway::tests::unauthenticated_request_to_a_gated_route_is_rejected' panicked at src/gateway.rs:805:9:
assertion `left == right` failed
  left: 404
 right: 400

thread 'gateway::tests::authenticated_request_reaches_the_verb_chokepoint' panicked at src/gateway.rs:827:9:
assertion `left == right` failed
  left: 404
 right: 200

thread 'gateway::tests::contract_route_is_reachable_without_a_token' panicked at src/gateway.rs:868:9:
assertion `left == right` failed
  left: 404
 right: 200

failures:
    gateway::tests::authenticated_request_reaches_the_verb_chokepoint
    gateway::tests::contract_route_is_reachable_without_a_token
    gateway::tests::gateway_error_maps_verb_failure_to_its_category_and_status
    gateway::tests::mcp_route_is_mounted_on_the_same_router_and_gated_by_the_same_token
    gateway::tests::unauthenticated_request_to_a_gated_route_is_rejected

test result: FAILED. 2 passed; 5 failed; 0 ignored; 0 measured; 113 filtered out; finished in 0.01s
```

## Passing-after

With `build_router`'s `.nest("/v1", ...)` wrapper restored (the real
committed state, `bfc3a060`):

```
$ cargo test --manifest-path herdr-plugin/Cargo.toml gateway::

running 7 tests
test gateway::tests::constant_time_eq_matches_only_identical_bytes ... ok
test gateway::tests::error_category_round_trips_known_exit_codes ... ok
test gateway::tests::unauthenticated_request_to_a_gated_route_is_rejected ... ok
test gateway::tests::contract_route_is_reachable_without_a_token ... ok
test gateway::tests::gateway_error_maps_verb_failure_to_its_category_and_status ... ok
test gateway::tests::mcp_route_is_mounted_on_the_same_router_and_gated_by_the_same_token ... ok
test gateway::tests::authenticated_request_reaches_the_verb_chokepoint ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 113 filtered out; finished in 0.00s
```

Full crate suite (`cargo test --manifest-path herdr-plugin/Cargo.toml`, no
filter): 162 passed, 0 failed.
