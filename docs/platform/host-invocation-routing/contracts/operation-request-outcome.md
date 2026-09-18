# Contract: Operation Request And Outcome

```txt
Document type: Contract
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Define HostInvocation, OperationRequest, ContractRef, ProviderOutcome, ProviderError, and lifecycle outcomes
Design status: Draft
Implementation status: Current partial
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md
Last reviewed: 2026-09-18
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
| `ProviderOutcome` is presentation-neutral. | `current partial` | [../../../../packages/host-runtime/rust/src/contracts.rs](../../../../packages/host-runtime/rust/src/contracts.rs), [../../../../apps/fgos/src/cli_presenter.rs](../../../../apps/fgos/src/cli_presenter.rs), [../../../../herdr-plugin/src/remote_invocation.rs](../../../../herdr-plugin/src/remote_invocation.rs), [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md) | CLI and remote presenters prove separate presentation for selected routes; future hosts/routes must keep this boundary. |
| Legacy CLI bytes are not wrapped twice. | `implemented preview` | [../architecture/legacy-cli-transition.md](../architecture/legacy-cli-transition.md), [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md), [../../../../apps/fgos/src/legacy_exec.rs](../../../../apps/fgos/src/legacy_exec.rs) | Compatibility vectors still protect future repairs, but preview legacy lane avoids double wrapping. |

## 6. Related Files

| Relationship | File |
| --- | --- |
| kernel architecture | [../architecture/invocation-kernel.md](../architecture/invocation-kernel.md) |
| component protocol | [component-protocol.md](component-protocol.md) |
| source architecture | [../../../architect/host-invocation-routing/host-invocation-provider-routing.md](../../../architect/host-invocation-routing/host-invocation-provider-routing.md) |
