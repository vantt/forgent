# Iron Law evidence: tsk-6arn

`classifyIronLaw` against the real committed diff (`a76bc884...a0a849fe`
on `fgw/tsk-6arn`) returned `required: true`, matched flag:

```
auth
```

No matched modules. Unlike `tsk-48w`'s tangential "secret" match (dead
scope text, not touched by the real diff), `auth` here is exactly this
item's real scope — a whole new authentication mechanism (Cloudflare
Access JWT verification) added as an additive second credential path
alongside the existing Bearer-token gate (`tsk-7l9`, `tsk-4qf`).

## Test command

```
cd herdr-plugin && cargo test --lib
cargo test --lib gateway::tests::cf_access_valid_assertion_is_accepted_when_bearer_is_absent
```

## Failing-before / passing-after

Captured live by restoring the working tree to the parent commit
(`a76bc884`, immediately before the `feat(tsk-6arn)` commit) with
`git checkout a76bc884 -- .`, running the real test commands, then
restoring the real committed tree with `git checkout a0a849fe -- .` and
re-running — `git status --short` confirmed a byte-identical, clean
restoration before trusting the after-run.

**Before** (`a76bc884`, `require_token` has no cf-access branch,
`cf_access.rs` not wired into `lib.rs`):

```
$ grep -c "Cf-Access-Jwt-Assertion\|cf_access" src/gateway.rs
0
$ cargo test --lib
cargo test: 157 passed (1 suite, 0.11s)
$ cargo test --lib gateway::tests::cf_access_valid_assertion_is_accepted_when_bearer_is_absent
cargo test: 0 passed, 157 filtered out (1 suite, 0.00s)
```

(The target test does not exist at this commit — the capability it
proves, "a request carrying only a valid `Cf-Access-Jwt-Assertion`
header, no Bearer, is authenticated," is real red: zero matches, zero
passes, because the code path does not exist yet.)

**After** (`a0a849fe`, the real committed diff):

```
$ cargo test --lib
cargo test: 179 passed (1 suite, 0.14s)
$ cargo test --lib gateway::tests::cf_access_valid_assertion_is_accepted_when_bearer_is_absent
cargo test: 1 passed, 178 filtered out (1 suite, 0.04s)
```

179 = 157 pre-existing (unchanged, confirms `require_token`'s Bearer path
and the other 156 tests are undisturbed — wrap-don't-touch, no
`build_router` signature change per plan.md's own reasoning) + 22 new:
4 middleware-wiring tests (`cf_access_valid_assertion_is_accepted_when_
bearer_is_absent`, `cf_access_invalid_assertion_still_returns_401_same_
as_missing_bearer`, `cf_access_header_is_ignored_entirely_when_not_
configured`, `bearer_still_works_when_cf_access_is_also_configured`) +
4 config-loading tests (`load_gateway_config_resolves_no_cf_access_when_
absent`, `load_gateway_config_resolves_cf_access_when_both_fields_
present`, `load_gateway_config_rejects_partial_cf_access_team_domain_
only`, `load_gateway_config_rejects_partial_cf_access_aud_only`) + 12
ported `cf_access` unit tests (tampered signature, wrong aud/iss,
expired, not-yet-valid, missing claim, `alg:none` bypass, HS256
key-confusion, JWKS cache behavior).

## Also real: the two dependency/build issues found and fixed during Execute

Not guessed, both found via a real `cargo test`/`cargo add --dry-run`
failure and fixed before this final green run:

- `reqwest` 0.13's TLS feature is named `rustls`, not the reference
  implementation's `rustls-tls` (real dry-run failure: "unrecognized
  feature for crate reqwest: rustls-tls").
- `jsonwebtoken` 11 ships neither crypto backend by default — 17 tests
  failed at runtime with "Could not automatically determine the
  process-level CryptoProvider" until `default-features = false,
  features = ["use_pem", "aws_lc_rs"]` was added explicitly
  (`aws_lc_rs` chosen to match the backend `reqwest`'s own `rustls`
  feature already links, avoiding a second competing provider in the
  same binary).

## Full suite at the final, returned state

`cargo test --lib` (herdr-plugin): **179 tests, 179 pass, 0 fail.**

## Not applicable here

No `build_router` signature change (29 call sites counted, all in this
file's own test module — plan.md's own risk map reasoned against
touching it, same class as `tsk-48w`'s smaller-count precedent). No
scope/architecture redesign — RESEARCH.md's open points (real dependency
versions, real HTTP-status convention, real blast radius) were all
resolved before Execute, none left open.
