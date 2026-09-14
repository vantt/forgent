# Contract: Operation Provider

```txt
Document type: Contract
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Define provider descriptors, provider invocation, control, and events
Design status: Draft
Implementation status: Accepted-not-implemented
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md
Last reviewed: 2026-09-14
Related:
- docs/platform/host-invocation-routing/architecture/invocation-kernel.md
- docs/platform/host-invocation-routing/architecture/provider-routing.md
```

## 1. Contract

`OperationProvider` exposes `descriptor()` and asynchronous `invoke(...)`. `ProviderDescriptor` declares identity, component class, invocation mechanism, contract versions, allowed hosts/modes, capabilities, lifecycle, replacement, concurrency, and health.

`InvocationControl` carries deadline, cancellation token, and granted capabilities. `EventSink` carries progress, events, and diagnostics.

## 2. Rules

- A provider receives resolved configuration/context through `ConfigPort`; it does not read another global config file.
- Invocation mechanism is open string: built-in, legacy-node semantic provider, external process, WASM, or future mechanism.
- Provider selection never silently transfers state-write authority.

## 3. Implementation Alignment

| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Provider port is async from v1. | `accepted-not-implemented` | [source architecture §8](../../../architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input) | P3 implementation. |
| Providers receive least-privilege grant. | `accepted-not-implemented` | [provider routing](../architecture/provider-routing.md) | Two-stage authority tests. |

## 4. Related Files

| Relationship | File |
| --- | --- |
| kernel architecture | [../architecture/invocation-kernel.md](../architecture/invocation-kernel.md) |
| provider routing | [../architecture/provider-routing.md](../architecture/provider-routing.md) |
| request/outcome | [operation-request-outcome.md](operation-request-outcome.md) |

