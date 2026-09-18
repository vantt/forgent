# Verification: R3 Remote Peer Proof

```txt
Document type: Verification
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Preserve the proof gate for production remote peer adoption
Design status: Draft
Implementation status: In progress (R3-P0 frozen; R3-P1 adapter implemented preview; route not wired)
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
- **Status:** contract frozen. R3-P1 adapter code exists in
  `herdr-plugin/src/remote_invocation.rs`; `herdr-plugin/src/gateway.rs` still
  has no `/runtime` route.
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

The run passed 9 tests on 2026-09-18. This proves the adapter surface exists,
but not the production gateway route. R3 remains incomplete until R3-P2/R3-P3
wire and harden `GET /v1/runtime`.

## 2. No-Shell / No-`fgos.v1`-Parse Proof Strategy (frozen at R3-P0, proven at R3-P3)

The route above must ship with, at minimum:

- a fake-`VerbGateway` regression test that panics if `distribution.build.show`
  ever reaches it through `GET /v1/runtime`, so the route is proven to bypass
  the legacy `run_verb_blocking` chokepoint (`herdr-plugin/src/gateway.rs`)
  rather than merely happening not to call it today; and
- a fixture/assertion test proving the `GET /v1/runtime` JSON response is
  built from `ProviderOutcome::Completed`'s typed `BuildShowOutcome` (via the
  remote presenter added in R3-P1), not from parsing CLI `fgos.v1` stdout —
  the two shapes are allowed to (and are expected to) differ so the assertion
  cannot pass by accident.

Both are R3-P3 work (see the rollout plan's packet queue); this section
records the strategy so R3-P1/P2 build the route in a way R3-P3 can prove
against, without re-deciding the strategy mid-implementation.

## 3. Remaining Legacy Routes

Untouched routes may stay on the old adapter during a named rollback window, but they must remain visible with a consumer list. Delete the `VerbGateway` chokepoint only after its consumer list is empty.

## 4. Related Files

| Relationship | File |
| --- | --- |
| rollout plan | [../r3-remote-peer-rollout-plan.md](../r3-remote-peer-rollout-plan.md) |
| host use cases | [../architecture/host-use-cases.md](../architecture/host-use-cases.md) |
| release boundaries | [../architecture/release-boundaries.md](../architecture/release-boundaries.md) |
| source migration | [../../../architect/host-invocation-routing/node-to-rust-component-migration.md](../../../architect/host-invocation-routing/node-to-rust-component-migration.md) |
