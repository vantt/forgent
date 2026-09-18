# Contract: Operation Catalog

```txt
Document type: Contract
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Define operation identity, descriptors, catalog authorship, and version matching
Design status: Draft
Implementation status: Current partial
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md
Last reviewed: 2026-09-18
Related:
- docs/platform/host-invocation-routing/architecture/provider-routing.md
- docs/platform/host-invocation-routing/verification/implementation-alignment.md
```

## 1. Contract

`OperationId` is stable semantic identity with shape `<component>.<object-type>.<action>[.<variant>]`. Host spellings are projections and do not create operations by themselves.

`OperationDescriptor` records operation id, owning component, request/outcome contracts, effect, idempotency, authority policy, allowed host kinds, and streaming mode.

`OperationCatalog` is authored by owning components. It is not inferred from CLI command registry entries or provider manifests.

## 2. Implementation Alignment

| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| R1 uses const catalog and snapshot at composition root. | `current partial` | [../../../../packages/host-runtime/rust/src/catalog.rs](../../../../packages/host-runtime/rust/src/catalog.rs), [../../../../packages/host-runtime/rust/src/registry.rs](../../../../packages/host-runtime/rust/src/registry.rs), [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs) | Current Rust host and R2 fixture use authored catalog/snapshot; future operation owners must keep this path current. |
| First native operation is `distribution.build.show`. | `implemented preview` | [../../../../packages/distribution/rust/src/lib.rs](../../../../packages/distribution/rust/src/lib.rs), [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json), [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md), [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md) | Proven for CLI `version` and remote `GET /v1/runtime`; stable/default graduation remains release-owner decision. |

## 3. Related Files

| Relationship | File |
| --- | --- |
| provider routing | [../architecture/provider-routing.md](../architecture/provider-routing.md) |
| operation provider | [operation-provider.md](operation-provider.md) |
| source architecture | [../../../architect/host-invocation-routing/host-invocation-provider-routing.md](../../../architect/host-invocation-routing/host-invocation-provider-routing.md) |
