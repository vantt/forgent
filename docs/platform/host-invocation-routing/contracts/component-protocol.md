# Contract: Component Protocol

```txt
Document type: Contract
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Define the preview external process provider wire boundary and future component protocol rules
Design status: Draft
Implementation status: Implemented preview
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/external-provider-protocol.md
Last reviewed: 2026-09-18
Related:
- docs/platform/host-invocation-routing/architecture/external-provider-protocol.md
- docs/platform/host-invocation-routing/verification/r2-external-process-proof.md
```

## 1. Contract

The semantic component protocol is versioned independently from CLI `fgos.v1` and remote API versions. External process v1 uses JSON-RPC 2.0 semantics over 4-byte big-endian length-prefixed UTF-8 JSON frames on stdio.

`EncodedMessage` is used only at this external boundary and carries contract id, version, content type, and bytes.

## 2. Lifecycle Rules

- Discovery does not depend on handshake.
- Handshake confirms provider identity, accepted manifest digest, protocol range, supported operation/contract pairs, and concurrency limit.
- Request IDs are unique per connection.
- Out-of-order responses require negotiated concurrency greater than one.
- Frames, queues, requests, and events are bounded.
- Cancellation sends notification, waits bounded grace, then may terminate provider process.
- Crash after dispatch yields completion-unknown unless the operation idempotency contract permits retry.

## 3. Implementation Alignment

| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Component protocol is distinct from public host protocols. | `implemented preview` | [source protocol §3](../../../architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol), [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md) | R2-P3 conformance proof closed 2026-09-15. |
| `EncodedMessage` never enters built-in kernel. | `implemented preview` | [invocation kernel](../architecture/invocation-kernel.md), [../../../../packages/host-runtime/rust/src/providers/external_process/adapter.rs](../../../../packages/host-runtime/rust/src/providers/external_process/adapter.rs) | R2-P5 defines `EncodedMessage` as a private struct fully contained in the external adapter module; confirmed by review not to appear in `contracts.rs`, the `OperationProvider` trait signature, or `builtin.rs`. Closed 2026-09-15. |

## 4. Related Files

| Relationship | File |
| --- | --- |
| external provider architecture | [../architecture/external-provider-protocol.md](../architecture/external-provider-protocol.md) |
| request/outcome contract | [operation-request-outcome.md](operation-request-outcome.md) |
| R2 proof | [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md) |
