# Contract: Operation Request And Outcome

```txt
Document type: Contract
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Define HostInvocation, OperationRequest, ContractRef, ProviderOutcome, ProviderError, and lifecycle outcomes
Design status: Draft
Implementation status: Accepted-not-implemented
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md
Last reviewed: 2026-09-14
Related:
- docs/platform/host-invocation-routing/architecture/invocation-kernel.md
- docs/platform/host-invocation-routing/contracts/component-protocol.md
```

## 1. Contract

`HostInvocation` carries host/caller context such as identity, deadline, cancellation, and tracing. Host kind is an open string.

`OperationRequest` carries `OperationId`, `ContractRef`, and typed semantic input.

`ProviderOutcome` carries typed result, typed semantic error when applicable, events, evidence, and diagnostics. It is not a CLI envelope, HTTP response, MCP result, or chat text.

## 2. Failure Families

Closed failure families include semantic validation, precondition, conflict, not-found, caller admission denied, selected-provider capability denied, no binding, ambiguous binding, incompatible contract, provider unavailable, protocol violation, provider crash, deadline exceeded, caller cancelled, and completion unknown.

## 3. Lifecycle

The lifecycle has exactly one terminal record per invocation. `dispatched` is the point after which transport loss may become `completion-unknown`. Late provider responses after cancellation or deadline become diagnostics, not a second terminal truth.

## 4. Human Input

Providers never block waiting for a person. If human input is required, the provider returns a parked outcome and the host or Work Lifecycle re-invokes later.

## 5. Implementation Alignment

| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| `ProviderOutcome` is presentation-neutral. | `accepted-not-implemented` | [source architecture §5](../../../architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts) | P3/P5 presenter proof. |
| Legacy CLI bytes are not wrapped twice. | `accepted-not-implemented` | [legacy transition §4](../../../architect/host-invocation-routing/legacy-cli-transition.md#4-public-presentation-versus-semantic-outcome) | Compatibility harness vectors. |

## 6. Related Files

| Relationship | File |
| --- | --- |
| kernel architecture | [../architecture/invocation-kernel.md](../architecture/invocation-kernel.md) |
| component protocol | [component-protocol.md](component-protocol.md) |
| source architecture | [../../../architect/host-invocation-routing/host-invocation-provider-routing.md](../../../architect/host-invocation-routing/host-invocation-provider-routing.md) |

