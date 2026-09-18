# Host Invocation Contracts

```txt
Document type: Contract index
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Route readers through host-invocation contracts and distinguish target contracts from current implementation
Design status: Draft
Implementation status: Current partial plus implemented preview provider protocol
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/**
Last reviewed: 2026-09-18
Related:
- docs/platform/host-invocation-routing/README.md
- docs/platform/host-invocation-routing/verification/implementation-alignment.md
```

## 1. Contracts

| Contract | Status | Owns |
| --- | --- | --- |
| [operation-catalog.md](operation-catalog.md) | `current partial` | `OperationId`, `OperationDescriptor`, `OperationCatalog`, version matching. |
| [operation-provider.md](operation-provider.md) | `current partial` | `OperationProvider`, `ProviderDescriptor`, `InvocationControl`, `EventSink`. |
| [operation-request-outcome.md](operation-request-outcome.md) | `current partial` | `HostInvocation`, `OperationRequest`, `ContractRef`, `ProviderOutcome`, `ProviderError`, lifecycle terminal families. |
| [command-route-descriptor.md](command-route-descriptor.md) | `current partial` | Per-selector `legacy-cli`/`native` routing and repair owner. |
| [legacy-payload.md](legacy-payload.md) | `legacy-current` plus `implemented preview` manifest identity | Node payload identity, location, and compatibility rules. |
| [external-provider-manifest.md](external-provider-manifest.md) | `implemented preview` | Static manifest discovery and namespace/capability claims. |
| [component-protocol.md](component-protocol.md) | `implemented preview` | External process/WASM wire boundary. |

## 2. Rule

Contracts here are target normative boundaries unless marked `legacy-current`. Do not treat them as implemented without proof from [../verification/implementation-alignment.md](../verification/implementation-alignment.md).

## 3. Related Files

| Relationship | File |
| --- | --- |
| area portal | [../README.md](../README.md) |
| alignment | [../verification/implementation-alignment.md](../verification/implementation-alignment.md) |
| architecture | [../architecture/README.md](../architecture/README.md) |
