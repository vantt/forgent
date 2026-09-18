# Contract: Operation Provider

```txt
Document type: Contract
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Define provider descriptors, provider invocation, control, and events
Design status: Draft
Implementation status: Current partial
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md
Last reviewed: 2026-09-18
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
| Provider port is async from v1. | `current partial` | [../../../../packages/host-runtime/rust/src/invocation_service.rs](../../../../packages/host-runtime/rust/src/invocation_service.rs), [../../../../packages/distribution/rust/src/lib.rs](../../../../packages/distribution/rust/src/lib.rs), [../../../../packages/work-state/rust/src/lib.rs](../../../../packages/work-state/rust/src/lib.rs) | Current built-in and fixture providers use the Rust `OperationProvider` path; future provider mechanisms must preserve the port. |
| Providers receive least-privilege grant. | `current partial` | [provider routing](../architecture/provider-routing.md), [../../../../packages/host-runtime/rust/src/authority_gate.rs](../../../../packages/host-runtime/rust/src/authority_gate.rs), [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md) | R2 proved external process providers go through the same admission/grant path; replacement-resolution policy remains partial. |

## 4. Related Files

| Relationship | File |
| --- | --- |
| kernel architecture | [../architecture/invocation-kernel.md](../architecture/invocation-kernel.md) |
| provider routing | [../architecture/provider-routing.md](../architecture/provider-routing.md) |
| request/outcome | [operation-request-outcome.md](operation-request-outcome.md) |
