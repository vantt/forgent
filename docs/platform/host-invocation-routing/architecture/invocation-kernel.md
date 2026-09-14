# Architecture: Invocation Kernel

```txt
Document type: Architecture
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Define the target semantic invocation kernel and lifecycle shape
Design status: Draft
Implementation status: Accepted-not-implemented
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md
Last reviewed: 2026-09-14
Related:
- docs/platform/host-invocation-routing/contracts/operation-request-outcome.md
- docs/platform/host-invocation-routing/contracts/operation-provider.md
- docs/platform/host-invocation-routing/verification/implementation-alignment.md
```

## 1. Claim

The native kernel has exactly one semantic input/output boundary: `OperationRequest` enters and `ProviderOutcome` or `ProviderError` exits. `InvocationService` owns admission, router call, selected-provider grant, invocation, failure normalization, lifecycle recording, and presenter handoff.

## 2. Preserved Details

- Built-in providers receive typed Rust inputs and never decode `EncodedMessage`.
- Raw CLI `OsString` is never a semantic request.
- `ProviderOutcome` is not `fgos.v1`, HTTP, MCP, or chat presentation.
- Failure families are closed and presenter-specific mapping happens after provider outcome.
- Exactly one terminal lifecycle record exists per invocation.
- Human input returns `parked`; providers never block waiting for a person.

## 3. Implementation Alignment

| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Native routes use `OperationRequest` to `ProviderOutcome`. | `accepted-not-implemented` | Source design: [old architecture](../../../architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts) | Implement P3 kernel and prove with host projector tests. |
| Legacy CLI routes bypass the kernel. | `accepted-not-implemented` | [legacy-cli-transition.md](legacy-cli-transition.md) | Implement P4 CLI adapter route. |
| No component-boundary change. | `current` | [component-boundary.md](../../component-boundary.md) | No action for documentation migration. |

## 4. Related Files

| Relationship | File |
| --- | --- |
| operation request/outcome contract | [../contracts/operation-request-outcome.md](../contracts/operation-request-outcome.md) |
| provider contract | [../contracts/operation-provider.md](../contracts/operation-provider.md) |
| alignment | [../verification/implementation-alignment.md](../verification/implementation-alignment.md) |
| source architecture | [../../../architect/host-invocation-routing/host-invocation-provider-routing.md](../../../architect/host-invocation-routing/host-invocation-provider-routing.md) |

