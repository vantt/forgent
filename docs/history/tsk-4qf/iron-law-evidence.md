# Iron Law evidence — tsk-4qf

`classifyIronLaw` result against the real committed diff (`315c4221`):
`{"required":true,"matchedFlags":["security","auth","audit"],"matchedModules":[]}`.

Verify command: `cargo test --manifest-path herdr-plugin/Cargo.toml`.

## Failing-before (Rust sub-fixes 1 and 2)

With `require_token`'s status override reverted to the old
`.into_response()` (400) and two handlers (`post_work`, `get_work`)
temporarily reverted from `AppJson`/`AppQuery` back to bare `Json`/`Query`:

```
$ cargo test --manifest-path herdr-plugin/Cargo.toml gateway::

test gateway::tests::unauthenticated_request_to_a_gated_route_is_rejected ... FAILED
test gateway::tests::mcp_route_is_mounted_on_the_same_router_and_gated_by_the_same_token ... FAILED
test gateway::tests::a_malformed_json_body_returns_the_same_error_envelope_every_other_error_uses ... FAILED
test gateway::tests::a_malformed_query_string_returns_the_same_error_envelope_every_other_error_uses ... FAILED

thread 'gateway::tests::unauthenticated_request_to_a_gated_route_is_rejected' panicked at src/gateway.rs:871:9:
assertion `left == right` failed
  left: 400
 right: 401

thread 'gateway::tests::mcp_route_is_mounted_on_the_same_router_and_gated_by_the_same_token' panicked at src/gateway.rs:1014:9:
assertion `left == right` failed: unauthenticated /mcp must be blocked by the same require_token gate as every other route
  left: 400
 right: 401

thread 'gateway::tests::a_malformed_json_body_returns_the_same_error_envelope_every_other_error_uses' panicked at src/gateway.rs:942:59:
a malformed request body must still get the JSON ErrorEnvelope, never axum's own plain-text rejection: Error("expected value", line: 1, column: 1)

thread 'gateway::tests::a_malformed_query_string_returns_the_same_error_envelope_every_other_error_uses' panicked at src/gateway.rs:972:59:
a malformed query string must still get the JSON ErrorEnvelope, never axum's own plain-text rejection: Error("expected value", line: 1, column: 1)

test result: FAILED. 5 passed; 4 failed; 0 ignored; 0 measured; 113 filtered out; finished in 0.00s
```

The last two panics are the sharpest evidence for sub-fix 1: `serde_json`
tried to parse axum's own plain-text rejection body as JSON and got
`"expected value" at line 1, column 1` — proving the pre-fix response
really was plain text, not the contract's `ErrorEnvelope`.

## Failing-before (contract sub-fix 3)

```
$ git show HEAD~1:docs/contracts/fgos-gateway-api-v1.yaml | node -e "..."
security: undefined
securitySchemes: none
```

No `security`/`securitySchemes` existed anywhere in the pre-fix contract —
a client generator built from that spec would never send `Authorization`.

## Passing-after

With all reverts undone (the real committed state, `315c4221`):

```
$ cargo test --manifest-path herdr-plugin/Cargo.toml

test result: ok. 122 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s
test result: ok. 41 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s
```

Full crate suite (no filter): 164 passed, 0 failed.

```
$ node -e "... doc.security ..."
top-level security: [{"bearerAuth":[]}]
securitySchemes: ["bearerAuth"]
/contract security override: []
```
