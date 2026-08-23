# Iron Law evidence — tsk-1qe

`classifyIronLaw` result against the real committed diff (`99b0de2e`):
`{"required":true,"matchedFlags":["audit"],"matchedModules":[]}` — the
item's own description cites the audit report filename.

Verify command: `cargo test --manifest-path herdr-plugin/Cargo.toml`.

## Failing-before

**Output byte cap** (`push_capped_output`'s cap check disabled,
`if false && used >= MCP_EXECUTE_MAX_OUTPUT_BYTES`):

```
$ cargo test --manifest-path herdr-plugin/Cargo.toml mcp::tests::execute_a_print_flood

test mcp::tests::execute_a_print_flood_does_not_grow_the_captured_output_past_the_byte_cap ... FAILED

thread '...' panicked at src/mcp.rs:559:9:
captured output (512499 bytes) should stay near the 262144-byte cap, not grow with every print call

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 121 filtered out; finished in 0.03s
```

**Operation limit** (`engine.set_max_operations(500_000)` commented out —
`Engine::new()`'s real default, unlimited):

```
$ timeout 8 cargo test --manifest-path herdr-plugin/Cargo.toml mcp::tests::execute_an_infinite_loop -- --test-threads=1

running 1 test
test mcp::tests::execute_an_infinite_loop_fails_fast_instead_of_hanging_forever ... <killed by the 8s wrapper, never reached ok/FAILED>
```

The test process never printed a result line before the external 8-second
`timeout` wrapper killed it — reproducing Finding 4's own "one wedged
blocking thread forever" hazard for real (an actual thread genuinely
running `let x = 0; loop { x += 1; }` unbounded), not argued from the code
alone.

## Passing-after

With both caps restored (the real committed state, `99b0de2e`):

```
$ cargo test --manifest-path herdr-plugin/Cargo.toml mcp::

running 11 tests
test mcp::tests::tool_router_advertises_exactly_search_and_execute ... ok
test mcp::tests::search_with_a_query_matching_nothing_returns_an_empty_result_not_an_error ... ok
test mcp::tests::search_with_no_query_returns_every_operation ... ok
test mcp::tests::execute_empty_script_returns_cleanly_rather_than_hanging ... ok
test mcp::tests::search_query_matches_case_insensitively_on_path_and_summary ... ok
test mcp::tests::execute_a_failing_verb_call_surfaces_as_a_tool_error_not_a_panic ... ok
test mcp::tests::execute_script_outside_the_bound_function_allowlist_fails_cleanly_not_a_panic ... ok
test mcp::tests::execute_bound_function_call_matches_the_same_verb_call_the_gateway_makes_directly ... ok
test mcp::tests::concurrent_execute_calls_do_not_interfere_with_each_other ... ok
test mcp::tests::execute_a_print_flood_does_not_grow_the_captured_output_past_the_byte_cap ... ok
test mcp::tests::execute_an_infinite_loop_fails_fast_instead_of_hanging_forever ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 111 filtered out; finished in 0.07s
```

The infinite-loop test now completes in ~0.07s (part of the full 11-test
run) instead of hanging indefinitely. Full crate suite (no filter): 165
passed, 0 failed.
