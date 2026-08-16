# RESEARCH — tsk-6arn: Cloudflare Access as auth layer 2

## Round 1 — 2026-08-15 (discovery stage)

**Asked:** does a verified, working reference implementation exist to port
(per D8's own instruction to copy a proven idiom rather than design from
scratch)? What exact crates/versions does it need, and do they resolve
against herdr-plugin's real dependency graph? Where does layer 1 (Bearer)
currently live, and what is the real integration point for an additive
layer 2? Does the "404 câm" framing in tsk-18to's original description
(carried over from the pre-realignment D8) still apply to THIS codebase's
Bearer layer?

**Checked — reference implementation
`/home/vantt/projects/herdr-gateway/src/web/cf_access.rs`** (595 lines,
read in full): `CfAccessVerifier` holds a `reqwest::Client`, the team
domain, the expected `aud`, and a `Mutex<JwksCache>` (keys by `kid` +
`fetched_at`). `verify(assertion)` decodes the JWT header for `kid`,
resolves (or fetches + caches, TTL 3600s) the matching RSA public key from
`{team_domain}/cdn-cgi/access/certs`, then `verify_with_key` runs
`jsonwebtoken::decode` with `Algorithm::RS256` pinned, `issuer`/`audience`
set, `validate_nbf: true`, and `set_required_spec_claims(&["exp","iss",
"aud"])` so a token that merely OMITS one of those claims is rejected, not
silently passed. Identity is `email` if present else `sub`. 12 real tests
cover: valid (email + sub-fallback), tampered signature, wrong
aud/iss, expired, not-yet-valid, missing aud/iss claim, `alg: none`
bypass, HS256 key-confusion, trailing-slash team domain, fresh-cache-miss
(no network), and cache-hit-skips-fetch.

**Checked — live `cargo add --dry-run` against herdr-plugin's real
dependency graph** (not assumed from the reference's own `Cargo.toml`,
whose pins are older): `jsonwebtoken` resolves to `11.0.0` (reference
pins `9`). `reqwest --no-default-features --features json,rustls-tls`
FAILS — real error: `unrecognized feature for crate reqwest: rustls-tls`.
`cargo add reqwest --no-default-features --dry-run`'s own feature list
shows the real available names in this resolved version (`0.13.4` here vs
the reference's `0.12`): the TLS feature was renamed to plain `rustls`
(no `-tls` suffix). Corrected probe — `cargo add reqwest --no-default-
features --features json,rustls --dry-run` — resolves cleanly. `base64`
resolves to `0.23.1` (reference pins `0.22`, already used elsewhere in
this crate's own dependency tree per `tsk-54y`'s and `tsk-41h`'s own
work, no new conflict).

**Checked — layer 1's real, current shape**
(`herdr-plugin/src/gateway.rs:443-468`, `require_token` middleware, read
directly): checks `Authorization: Bearer <token>` via
`constant_time_eq`; on failure returns **401** (not 404) with category
`validation` — a DELIBERATE decision, `tsk-4qf`'s own comment: "gives a
client a distinct HTTP-layer auth signal (D7 forbids a new `category`
value...)". This directly contradicts my own submit text, which carried
forward the ORIGINAL (pre-realignment) D8's "mọi thất bại trả 404 câm"
framing — that framing was specific to the OLD P2 cookie-session design
(`tsk-k4v`, closed) and was never adopted for the Bearer layer that
actually shipped (`tsk-7l9`). **Correction: this item follows the
CURRENT, real, already-locked 401 convention — not the stale 404 framing
from an item description that itself already carries a self-correction
note.**

**Checked — integration point.** `require_token` is the sole gate
(`route_layer(middleware::from_fn_with_state(state.clone(),
require_token))` on the `authenticated` sub-router,
`herdr-plugin/src/gateway.rs`). `AppState` (`gateway, config: Arc<
GatewayConfig>, root`) is what the middleware reads `state.config.token`
from — the natural, zero-new-surface place to also read a
`cf_access: Arc<Option<CfAccessVerifier>>` field.

**Checked — blast radius of a `build_router` signature change**: `grep -c
"build_router("` → **29** call sites, all within `herdr-plugin/src/
gateway.rs`'s own test module (`tsk-48w`'s own plan.md already reasoned
against exactly this shape of change for a smaller, 9-site count).
Avoided: `cf_access` becomes a new field ON `GatewayConfig` (already
`Arc`-wrapped on `AppState`, already `#[derive(Clone)]`), constructed
once inside `load_gateway_config` — `build_router`'s own signature
(`gateway, config: GatewayConfig, root`) does not change at all. Every
one of the 29 existing call sites keeps compiling unchanged; only
`test_config()` (the ONE shared helper all 29 call) needs one new field
set to `Arc::new(None)`.

**Checked — partial config (only one of team_domain/aud set)**: no
existing precedent in this file for "half-configured" optional features
(`gateway.token`/`port`/`bind` are each independently optional). Decided:
exactly one of `cf_access_team_domain`/`cf_access_aud` present is a
config error (`GatewayConfigError`, new variant) — a person who set one
but not the other almost certainly meant to configure both, and silently
treating it as "not configured" would leave a note-worthy misconfiguration
invisible.

**Open:** none — reference implementation ported wholesale where correct
(the crypto/JWT verification core, unmodified), corrected where reality
differs (dependency versions, HTTP status code convention, integration
shape to avoid the 29-site blast radius).

**Verdict:** `clear`. Verify: no real existing verify to reuse (this is a
brand-new module) — designing the real command at planning per this
skill's own convention (discovery does not invent one from nothing;
`fgos-coding-planning`'s own sync step covers it).
