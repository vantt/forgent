# Research — error envelope / auth category drift (tsk-4qf)

## Round 1 — 2026-08-14

**Asked:** for the finding's 3 sub-parts, what's the smallest honest fix
for each, respecting D7's locked "gateway adds no categories of its own"
constraint (already load-bearing for `tsk-4lf`'s own fix)?

**Checked:**

**(1) axum extractor rejections aren't ErrorEnvelope.** Vendored source
(`~/.cargo/registry/.../axum-0.8.9/src/json.rs`, `.../src/extract/query.rs`):
`Json<T>`/`Query<T>`'s own `FromRequest`/`FromRequestParts` impls set
`type Rejection = JsonRejection`/`QueryRejection` (`axum::extract::
rejection::{JsonRejection, QueryRejection}`), both composite enums whose
generated `Display` impl (`axum-core-0.5.6/src/macros.rs`'s
`composite_rejection!`) is a plain string — axum's own default
`IntoResponse` for them is plain text, never this gateway's JSON envelope.
`gateway.rs` currently has ~10 handlers taking `Json<T>`/`Query<T>`
directly. Fix: two small generic wrapper extractors (`AppJson<T>`,
`AppQuery<T>`) whose own `Rejection = GatewayError` (already
`IntoResponse`) — `FromRequest`/`FromRequestParts` trait signatures
(`axum-core-0.5.6/src/extract/mod.rs:79-88,53-62`) return `impl
Future<...> + Send`, satisfied by an ordinary `async fn` impl (stable
since Rust 1.75, already the MSRV this crate's other async code assumes).
Swapping each handler's `Json<T>`/`Query<T>` for `AppJson<T>`/`AppQuery<T>`
is a mechanical one-word-per-site change once the two wrappers exist.

**(2) auth failures indistinguishable from validation errors.** `gateway.
rs`'s `ErrorCategory` enum is D7's own closed CLI taxonomy mirror ("this
gateway adds no categories of its own") — the SAME constraint `tsk-4lf`'s
own fix respected by reusing `Busy` rather than inventing a category.
`require_token`'s current failure hardcodes `category: Validation`
AND (via `GatewayError`'s blanket `IntoResponse`) status 400, both from
the SAME `category → status` table every other error uses. The finding's
own suggested fix already names the way out: "a distinct auth signal
(401 ...) — the closed category enum belongs to the CLI taxonomy, so
either an explicit contract note that auth failures are HTTP-status-only
... or a documented gateway-layer category." Since `http_status()` is
THIS gateway's own mapping (not part of the CLI's exit-code contract),
nothing stops `require_token`'s own response from choosing status 401
directly while keeping `category: "validation"` in the body (no new
category value) — the HTTP layer carries the distinct signal, the closed
JSON taxonomy stays untouched.

**(3) yaml `securitySchemes` missing + contradictory top-level text.**
`docs/contracts/fgos-gateway-api-v1.yaml`'s top-level `info.description`
says "this gateway does not gate who may call it" (lines ~29-32) while its
own `/contract` operation description says "the one route NOT behind the
auth gate below" (implying every other route IS gated) — directly
contradicting D4 (`gateway.rs`'s own `require_token` middleware, real,
already enforced). No `securitySchemes`/`security` keys exist anywhere in
the document, so a client generator built from this spec never sends
`Authorization`. Fix: add a `bearerAuth` `securityScheme` + a top-level
`security` requirement (every operation inherits it; `/contract` alone
already sits outside `require_token`'s `route_layer`, so it needs an
explicit `security: []` override to match reality), and rewrite the
contradictory sentence.

**Still open:** none.
