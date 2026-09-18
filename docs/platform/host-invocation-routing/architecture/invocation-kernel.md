# Architecture: Invocation Kernel

```txt
Document type: Architecture
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Define the target semantic invocation kernel and lifecycle shape
Design status: Draft
Implementation status: Current partial
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md
Last reviewed: 2026-09-18
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
| Native routes use `OperationRequest` to `ProviderOutcome`. | `implemented preview` | [../../../../packages/host-runtime/rust/src/contracts.rs](../../../../packages/host-runtime/rust/src/contracts.rs), [../../../../packages/host-runtime/rust/src/invocation_service.rs](../../../../packages/host-runtime/rust/src/invocation_service.rs), [../../../../apps/fgos/src/cli_projector.rs](../../../../apps/fgos/src/cli_projector.rs), [../../../../herdr-plugin/src/remote_invocation.rs](../../../../herdr-plugin/src/remote_invocation.rs), [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md) | Proven for `distribution.build.show`, `work.gate-bypass.show`, and the R2 fixture operation. Additional operations need their own route/provider proof. |
| Legacy CLI routes bypass the kernel. | `implemented preview` | [legacy-cli-transition.md](legacy-cli-transition.md), [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs), [../../../../apps/fgos/src/legacy_exec.rs](../../../../apps/fgos/src/legacy_exec.rs), [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md) | Current route matrix still has 71 `legacy-cli` selectors; keep bypass behavior until each selector migrates. |
| No component-boundary change. | `current` | [component-boundary.md](../../component-boundary.md) | No action for documentation migration. |

## 4. Related Files

| Relationship | File |
| --- | --- |
| operation request/outcome contract | [../contracts/operation-request-outcome.md](../contracts/operation-request-outcome.md) |
| provider contract | [../contracts/operation-provider.md](../contracts/operation-provider.md) |
| alignment | [../verification/implementation-alignment.md](../verification/implementation-alignment.md) |
| source architecture | [../../../architect/host-invocation-routing/host-invocation-provider-routing.md](../../../architect/host-invocation-routing/host-invocation-provider-routing.md) |
