# Architecture: Provider Routing

```txt
Document type: Architecture
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Define provider selection, registry snapshot, replacement, and authority gates
Design status: Draft
Implementation status: Current partial
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md and external-provider-protocol.md
Last reviewed: 2026-09-15
Related:
- docs/platform/host-invocation-routing/contracts/operation-catalog.md
- docs/platform/host-invocation-routing/contracts/operation-provider.md
- docs/platform/host-invocation-routing/contracts/external-provider-manifest.md
```

## 1. Claim

The Router is a pure selection function over `OperationId`, contract versions, host kind, invocation mode, project policy, and an immutable `RegistrySnapshot`. `InvocationService` calls it and owns everything that is not selection.

## 2. Selection Rules

- Numeric priority, registration order, and last-writer-wins are not selection policy.
- Duplicate bindings fail closed unless an explicit replacement policy names the selected provider and provider being replaced.
- Configuration can never replace a built-in provider.
- Project-over-global config precedence is not authority precedence.
- Provider manifests request capabilities; they never grant authority.

## 3. Authority

Authority is two-stage:

1. caller admission before routing;
2. selected-provider grant after routing.

The selected provider receives only the least-privilege grant through `InvocationControl`.

## 4. Implementation Alignment

| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Router is pure and fail-closed. | `current partial` | [old architecture §6](../../../architect/host-invocation-routing/host-invocation-provider-routing.md#6-router-pure-and-invocationservice-pipeline), [../../../../packages/host-runtime/rust/src/operation_provider_router.rs](../../../../packages/host-runtime/rust/src/operation_provider_router.rs), [../../../../packages/host-runtime/rust/tests/module_graph.rs](../../../../packages/host-runtime/rust/tests/module_graph.rs), [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md) | R2-P5 proved duplicate, reserved-namespace, and incompatible-contract refusal for external providers through the real `ExternalProcessLinker` (closed 2026-09-15). Denied-host/denied-capability tests for external providers remain future work. |
| Provider manifest never grants authority. | `implemented preview` | [external provider protocol §5](../../../architect/host-invocation-routing/external-provider-protocol.md#5-namespace-rules), [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md) | R2-P5 caught and deleted a synthetic-admission fallback that would have let a provider's own descriptor metadata fabricate an authority policy id; the merged code has no such path -- `fixture.echo.echo` is admitted only through an authored `OperationDescriptor` and the real `CallerAdmission` gate, same as any operation. |
| Config cannot replace built-in provider. | `current partial` | [old architecture §7](../../../architect/host-invocation-routing/host-invocation-provider-routing.md#7-authority-two-stage), [../../../../packages/host-runtime/rust/src/authority_gate.rs](../../../../packages/host-runtime/rust/src/authority_gate.rs), [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md) | R2-P5 proved `distribution.build.show`/`work.gate-bypass.show` cannot be claimed by an external manifest (`LinkerError::ReservedNamespace`). Declared-replacement resolution at `select()` time (`registry.rs`'s known R1 gap) remains unimplemented for both built-in and external providers. |

## 5. Related Files

| Relationship | File |
| --- | --- |
| operation catalog | [../contracts/operation-catalog.md](../contracts/operation-catalog.md) |
| provider contract | [../contracts/operation-provider.md](../contracts/operation-provider.md) |
| manifest contract | [../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md) |
| source architecture | [../../../architect/host-invocation-routing/host-invocation-provider-routing.md](../../../architect/host-invocation-routing/host-invocation-provider-routing.md) |
