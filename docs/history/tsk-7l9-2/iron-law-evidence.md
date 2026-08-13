# Iron Law evidence — tsk-7l9-2

## Classification

`classifyIronLaw` re-run against the real committed diff (`git commit
90274891`, `docs/history/fgos-interface-daemon/CONTEXT.md`'s piece 2):

```json
{"required":true,"matchedFlags":["auth"],"matchedModules":[]}
```

The `auth` flag matches D4's per-machine token gate (`herdr-plugin/src/gateway.rs`'s
`require_token` middleware) — a security-adjacent surface, so the gate
requires failing-test-first proof rather than an assertion that the auth
check works.

`gateway.rs` is a brand-new file (no prior committed version to check out
as the "before" state), so the failing-before proof instead temporarily
neutered the real auth check in place — the equivalent demonstration for
new code: show the test that claims to catch "no/wrong token" actually
fails when the check it depends on is broken, then restore the real check
and show it passes again.

## Test command

```
cargo test --manifest-path herdr-plugin/Cargo.toml gateway
```

## Failing-before (`require_token` short-circuited to always let the request through)

`herdr-plugin/src/gateway.rs`'s `require_token` temporarily changed to:

```rust
async fn require_token(
    State(state): State<AppState>,
    headers: HeaderMap,
    request: axum::extract::Request,
    next: Next,
) -> Response {
    return next.run(request).await; // TEMP: iron-law-evidence.md failing-before proof
    let supplied = headers
    // ...unreachable code below, unchanged
```

Real output:

```
---- gateway::tests::unauthenticated_request_to_a_gated_route_is_rejected stdout ----

thread 'gateway::tests::unauthenticated_request_to_a_gated_route_is_rejected' (4162668) panicked at src/gateway.rs:798:9:
assertion `left == right` failed
  left: 200
 right: 400

test result: FAILED. 5 passed; 1 failed; 0 ignored; 0 measured; 104 filtered out; finished in 0.00s
```

Exactly the one test written for this item's own auth gate
(`unauthenticated_request_to_a_gated_route_is_rejected`) failed; the other
5 gateway tests (`error_category_round_trips_known_exit_codes`,
`constant_time_eq_matches_only_identical_bytes`,
`authenticated_request_reaches_the_verb_chokepoint`,
`gateway_error_maps_verb_failure_to_its_category_and_status`,
`contract_route_is_reachable_without_a_token`) stayed green against the
broken auth check, confirming the failing one genuinely exercises the auth
gate and nothing else.

## Passing-after (real check restored)

```
cargo test --manifest-path herdr-plugin/Cargo.toml gateway
test result: ok. 6 passed; 0 failed
```

```
cargo test --manifest-path herdr-plugin/Cargo.toml
test result: 152 passed (4 suites, 0.03s)
```

```
cargo build --release --manifest-path herdr-plugin/Cargo.toml
Finished `release` profile [optimized] target(s) in 21.14s
```

`git diff --stat herdr-plugin/src/gateway.rs` against the committed tree
is empty after restoring the real check — the working tree matches
`90274891` exactly, both confirmed clean before `fgos return`.
