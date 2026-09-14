# Contract: Operation Catalog

```txt
Document type: Contract
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Define operation identity, descriptors, catalog authorship, and version matching
Design status: Draft
Implementation status: Accepted-not-implemented
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md
Last reviewed: 2026-09-14
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
| R1 uses const catalog and snapshot at composition root. | `planned` | [source architecture §5](../../../architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts) | P3 implementation. |
| First native operation is `distribution.build.show`. | `planned` | [source plan §10](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#10-p5-native-version) | Confirm descriptor and component owner. |

## 3. Related Files

| Relationship | File |
| --- | --- |
| provider routing | [../architecture/provider-routing.md](../architecture/provider-routing.md) |
| operation provider | [operation-provider.md](operation-provider.md) |
| source architecture | [../../../architect/host-invocation-routing/host-invocation-provider-routing.md](../../../architect/host-invocation-routing/host-invocation-provider-routing.md) |

