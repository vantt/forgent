# Verification: R3 Remote Peer Proof

```txt
Document type: Verification
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Preserve the proof gate for production remote peer adoption
Design status: Draft
Implementation status: Implemented preview (R3-P0 frozen; R3-P1 adapter implemented preview; R3-P2/P3 route and proof closed; R3-P4 inventory recorded)
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/node-to-rust-component-migration.md and rust-cli-and-proof-components-plan.md
Last reviewed: 2026-09-18
Related:
- docs/platform/host-invocation-routing/r3-remote-peer-rollout-plan.md
- docs/platform/host-invocation-routing/architecture/host-use-cases.md
- docs/platform/host-invocation-routing/architecture/release-boundaries.md
```

## 1. Required Proof

R3 proves at least one production gateway route as a true peer invocation: remote projector/presenter calls the shared invocation service, preserves gateway auth and transport contracts, and neither shells through CLI/Node nor parses `fgos.v1` internally.

### 1.1 Selected Route (R3-P0, 2026-09-17)

- **Route:** `GET /v1/runtime`
- **Operation id:** `distribution.build.show`
- **Status:** Implemented preview (R3-P2 route wired, R3-P3 proof verified).
- **Full frozen fields** (auth, request projection, response shape, error
  mapping, deadline/disconnect, rationale): [r3-remote-peer-rollout-plan.md
  §6 R3-P0](../r3-remote-peer-rollout-plan.md#r3-p0-route-and-contract-freeze).

### 1.2 Adapter Status (R3-P1, 2026-09-18)

`herdr-plugin/src/remote_invocation.rs` implements the remote projector,
presenter, and `InvocationService` assembly for `distribution.build.show`.
Focused proof passed:

```sh
cargo test --manifest-path herdr-plugin/Cargo.toml remote_invocation --quiet
```

The run passed 9 tests on 2026-09-18.

### 1.3 Route Wiring And Hard Regression Proof (R3-P2 / R3-P3, 2026-09-18)

`GET /v1/runtime` is wired into `herdr-plugin/src/gateway.rs`:
- **Handler & Wiring:** Handler `get_runtime` calls `crate::remote_invocation::build_invocation_service()`, `project_remote_build_show_invocation()`, invokes `InvocationService`, and presents the outcome via `present_remote_outcome()`. Mounted as `.route("/runtime", get(get_runtime))` inside the existing `authenticated` router in `build_router`, nested under `/v1` (`GET /v1/runtime`).
- **Auth Behavior:** Sits behind the same `require_token` middleware as every other authenticated route (`Authorization: Bearer <token>` / Cf-Access). Unauthenticated and wrong-token requests are rejected with 401 Unauthorized (proven by `get_runtime_requires_authentication`).
- **Hard No-VerbGateway Proof:** `CountingGateway` regression test (`get_runtime_does_not_call_verb_gateway_and_has_no_envelope_wrapping`) implements `VerbGateway` with an atomic counter and asserts zero calls after `GET /v1/runtime` succeeds with HTTP 200, proving no `VerbGateway` call happened regardless of whether a regression would surface as an HTTP 500 or discarded Result.
- **Hard No-`fgos.v1`-Envelope Proof:** The JSON response is verified to have no `contract`, `data`, or `data_hash` keys. The response contains direct `BuildShowOutcome` fields (`packageVersion`, `verbs`, `runtime`) from the typed provider outcome (proven by `get_runtime_happy_path_contains_build_show_outcome_fields`).

Focused proof passed:

```sh
cargo test --manifest-path herdr-plugin/Cargo.toml --lib gateway --quiet
```

All 47 tests passed on 2026-09-18.

## 2. No-Shell / No-`fgos.v1`-Parse Proof Strategy (Proven at R3-P3)

The proof requirements frozen at R3-P0 are satisfied in `herdr-plugin/src/gateway.rs`:

- `CountingGateway` call-counting regression test proves `distribution.build.show` never reaches `VerbGateway` / `run_verb_blocking` through `GET /v1/runtime`;
- Assertion tests prove `GET /v1/runtime` returns the typed `BuildShowOutcome` structure rather than parsing CLI `fgos.v1` stdout (no `contract`, `data`, or `data_hash` envelope keys).

## 3. Remaining VerbGateway Consumers (R3-P4 Inventory)

R3 migrates only `GET /v1/runtime`. Every other existing route in the `authenticated` router's `.route(...)` list continues to call `run_verb_blocking` -> `VerbGateway::run_verb` -> (real implementation `FgosCliGateway`) `spawn_fgos_verb` -> shells the `fgos` CLI and parses its `fgos.v1` JSON envelope (`{contract, generated_at, data_hash, data}`). The authenticated router also nests `/mcp` (`.nest_service("/mcp", mcp_service)`), whose execute path calls `VerbGateway::run_verb` directly and reaches write verbs. `/runner/tick` shells `node bin/fgos-runner.mjs --once` directly (not through `VerbGateway`, but still a CLI/Node shell).

`/contract` (outside `authenticated`, serving OpenAPI YAML directly from disk) and the new `/runtime` are the only routes that do neither.

| Route | Method | Nature | Current Execution Mechanism | Shelling / Envelope Details | Scope / Migration Preconditions |
| --- | --- | --- | --- | --- | --- |
| `/v1/work` | GET | Read | `run_verb_blocking` -> `VerbGateway::run_verb` | Shells `fgos list --json`, parses `fgos.v1` | Out of R3 scope; requires native Work/State read provider |
| `/v1/work` | POST | Write | `run_verb_blocking` -> `VerbGateway::run_verb` | Shells `fgos submit`, parses `fgos.v1` | Out of R3 scope; writes stay out of peer-host path |
| `/v1/work/{id}` | GET | Read | `run_verb_blocking` -> `VerbGateway::run_verb` | Shells `fgos show`, parses `fgos.v1` | Out of R3 scope; requires native Work/State read provider |
| `/v1/work/{id}` | PATCH | Write | `run_verb_blocking` -> `VerbGateway::run_verb` | Shells `fgos edit`, parses `fgos.v1` | Out of R3 scope; writes stay out of peer-host path |
| `/v1/work/{id}/docs` | GET | Read | `run_verb_blocking` -> `VerbGateway::run_verb` | Shells `fgos show`, parses `fgos.v1`, reads fs | Out of R3 scope; requires native Work/State read provider |
| `/v1/work/{id}/move` | POST | Write | `run_verb_blocking` -> `VerbGateway::run_verb` | Shells `fgos move`, parses `fgos.v1` | Out of R3 scope; writes stay out of peer-host path |
| `/v1/work/{id}/ask` | POST | Write | `run_verb_blocking` -> `VerbGateway::run_verb` | Shells `fgos ask`, parses `fgos.v1` | Out of R3 scope; writes stay out of peer-host path |
| `/v1/work/{id}/answer` | POST | Write | `run_verb_blocking` -> `VerbGateway::run_verb` | Shells `fgos answer`, parses `fgos.v1` | Out of R3 scope; writes stay out of peer-host path |
| `/v1/work/{id}/take` | POST | Write | `run_verb_blocking` -> `VerbGateway::run_verb` | Shells `fgos take`, parses `fgos.v1` | Out of R3 scope; writes stay out of peer-host path |
| `/v1/work/{id}/return` | POST | Write | `run_verb_blocking` -> `VerbGateway::run_verb` | Shells `fgos return`, parses `fgos.v1` | Out of R3 scope; writes stay out of peer-host path |
| `/v1/work/{id}/approve` | POST | Write | `run_verb_blocking` -> `VerbGateway::run_verb` | Shells `fgos approve`, parses `fgos.v1` | Out of R3 scope; writes stay out of peer-host path |
| `/v1/work/{id}/reject` | POST | Write | `run_verb_blocking` -> `VerbGateway::run_verb` | Shells `fgos reject`, parses `fgos.v1` | Out of R3 scope; writes stay out of peer-host path |
| `/v1/ready` | GET | Read | `run_verb_blocking` -> `VerbGateway::run_verb` | Shells `fgos ready --json`, parses `fgos.v1` | Out of R3 scope; requires native ready provider |
| `/v1/rollup/{id}` | GET | Read | `run_verb_blocking` -> `VerbGateway::run_verb` | Shells `fgos rollup`, parses `fgos.v1` | Out of R3 scope; requires native rollup provider |
| `/v1/graph` | GET | Read | `run_verb_blocking` -> `VerbGateway::run_verb` | Shells `fgos graph --json`, parses `fgos.v1` | Out of R3 scope; requires native graph provider |
| `/v1/state/digest` | GET | Read | `run_verb_blocking` -> `VerbGateway::run_verb` | Shells `fgos list --json`, parses `fgos.v1` (discards `data`) | Out of R3 scope; requires native state digest provider |
| `/v1/sessions` | POST | Write | `run_verb_blocking` -> `VerbGateway::run_verb` | Shells `fgos session start`, parses `fgos.v1` | Out of R3 scope; writes stay out of peer-host path |
| `/v1/sessions/{sessionId}` | DELETE | Write | `run_verb_blocking` -> `VerbGateway::run_verb` | Shells `fgos session end`, parses `fgos.v1` | Out of R3 scope; writes stay out of peer-host path |
| `/v1/sessions/{sessionId}/slots` | GET | Read | `run_verb_blocking` -> `VerbGateway::run_verb` | Shells `fgos slots --json`, parses `fgos.v1` | Out of R3 scope; requires native slots provider |
| `/v1/mcp` | POST / GET | Write-capable | Direct `VerbGateway::run_verb` | Dispatches Rhai execute script to `VerbGateway::run_verb` (can reach write verbs like approve/take/reject/...), parses `fgos.v1` | Out of R3 scope; writes stay out of peer-host path; live `VerbGateway` consumer |
| `/v1/runner/tick` | POST | Write | `tokio::task::spawn_blocking` spawning `node` | Shells `node bin/fgos-runner.mjs --once` directly | Out of R3 scope; writes/runner stay out of peer-host path |
| `/v1/contract` | GET | Read | Static file read | Reads OpenAPI spec from disk directly | Outside `authenticated`; no VerbGateway, no CLI shell |
| `/v1/runtime` | GET | Read | Native `InvocationService::invoke` via `remote_invocation.rs` | Direct provider outcome; no CLI shell, no `fgos.v1` | **Implemented preview (R3-P2/P3)** |

Migrating any remaining routes is strictly out of R3 scope. Writes stay out of the peer-host path entirely per the plan's Non-Goals. The gateway as a whole has NOT migrated; only `GET /v1/runtime` has been converted to the native remote peer invocation path. Do not claim the table is exhaustive of every possible VerbGateway path without `/v1/mcp`, and do not claim `VerbGateway` can be deleted once the `.route(...)` list alone is empty — `/v1/mcp` must stay listed as a live consumer too until all consumers are retired in future milestones.

## 4. Related Files

| Relationship | File |
| --- | --- |
| rollout plan | [../r3-remote-peer-rollout-plan.md](../r3-remote-peer-rollout-plan.md) |
| host use cases | [../architecture/host-use-cases.md](../architecture/host-use-cases.md) |
| release boundaries | [../architecture/release-boundaries.md](../architecture/release-boundaries.md) |
| source migration | [../../../architect/host-invocation-routing/node-to-rust-component-migration.md](../../../architect/host-invocation-routing/node-to-rust-component-migration.md) |
