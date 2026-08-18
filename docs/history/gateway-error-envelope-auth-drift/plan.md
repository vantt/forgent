# Plan — error envelope / auth category drift (tsk-4qf)

Mode: **standard** (2 flags — public contracts (yaml `securitySchemes` +
description fix), existing covered behavior (the 8 gateway tests all
exercise real request/response shapes and must keep passing under new
extractor types) — real cross-cutting change across ~10 handlers plus the
contract).

## Approach

**Chosen path, 3 independent sub-fixes** (`RESEARCH.md` round 1):

1. Two small generic wrapper extractors, `AppJson<T>`/`AppQuery<T>`, whose
   `Rejection = GatewayError` — swapped in for every handler's `Json<T>`/
   `Query<T>`, so a malformed request body/query now gets the same
   `ErrorEnvelope` shape every other error already uses, instead of axum's
   own plain-text rejection body.
2. `require_token`'s failure response uses HTTP status 401 directly
   (`http_status()`'s own category→status table stays untouched; this ONE
   call site picks its own status), while keeping `category: "validation"`
   in the body — D7's closed CLI taxonomy gains no new value, but a client
   branching on HTTP status (not just the body's `category` field) can now
   tell "your token is wrong" (401) from "your request body is bad" (400).
3. Add a `bearerAuth` `securityScheme` + top-level `security` requirement
   to the contract (with `/contract`'s own operation overriding to
   `security: []`, matching its real unauthenticated status), and rewrite
   the contradictory top-level sentence ("this gateway does not gate who
   may call it") to match D4 and the `/contract` operation's own existing
   note.

**Why not invent a new `ErrorCategory` for auth** (`RESEARCH.md` round 1):
D7 pins the enum as a verbatim mirror of the CLI's own closed
`EXIT_CODES` taxonomy — the same constraint `tsk-4lf`'s own fix respected.
Distinguishing auth failures at the HTTP-status layer (401 vs 400) is the
finding's own named alternative and needs no new category value.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `AppJson`/`AppQuery` wrapper extractors | medium — new generic trait impls, must not change the success path's shape for any existing passing request | full `cargo test` (8 existing `gateway::tests`, all built on `FakeGateway` + real request bodies) stays green with zero test changes needed for the success path; new tests assert a malformed JSON body / bad query now returns `ErrorEnvelope` JSON, not plain text |
| `require_token`'s 401 status | low — one status-code literal change at one call site, `category` field unchanged | new test: unauthenticated request to a gated route returns 401 (updates the one existing test that asserted 400 for this exact case, since that assertion is what's being fixed) |
| Contract `securitySchemes` + description fix | low — additive schema + one rewritten sentence | item's own verify: parses the yaml, asserts `openapi`/`paths`/`info` present; direct read confirms `security`/`securitySchemes` keys exist and `/contract`'s own override is `security: []` |

**Impact-analysis posture: degraded** (same GitNexus gap as prior gateway-
audit items for `gateway.rs`; YAML portion carries no code blast radius,
not queried).

## Files touched

- `herdr-plugin/src/gateway.rs`
- `docs/contracts/fgos-gateway-api-v1.yaml`

## Split decision

**No split.** Three sub-fixes, one coherent theme (response-shape
correctness), touching the same two files a split would not meaningfully
separate. `fgos graph --json`'s `criticalPath`/`topUnblock` do not include
`tsk-4qf` or any gateway-audit sibling; taken after Finding 8 this pass for
pacing, matching Finding 7's own medium-low severity in the audit report's
ranking.

## Outstanding questions

None
