# Verification: R2 External Process Proof

```txt
Document type: Verification
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Preserve the proof gate for external process provider preview
Design status: Draft
Implementation status: Next implementation frontier
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md
Last reviewed: 2026-09-15
Related:
- docs/platform/host-invocation-routing/r2-external-process-rollout-plan.md
- docs/platform/host-invocation-routing/contracts/component-protocol.md
- docs/platform/host-invocation-routing/contracts/external-provider-manifest.md
```

## 1. Required Proof

R2 proves framed process protocol, static manifest validation without execution, bounded supervision, handshake, cancellation, backpressure, crash/completion-unknown mapping, namespace refusal, duplicate refusal, unknown capability refusal, and one vendor-scoped fixture operation through the common router.

## 2. Fixture Contract (Frozen At R2-P0)

| Field | Value |
| --- | --- |
| Provider id | `fixture.echo.process` |
| Operation id | `fixture.echo.echo` |
| Request contract | `fixture.echo.echo.request@1.0.0` |
| Outcome contract | `fixture.echo.echo.outcome@1.0.0` |
| Manifest filename | `manifest.yaml` |
| Manifest fields used | `manifestVersion`, `id`, `version`, `runtime.kind: process`, `runtime.command` (manifest-relative), `provides.operations[]` (operation id, request contract, outcome contract, protocol), `capabilities` (declared only, not an authority grant) |
| Fixture location | `packages/host-runtime/rust/tests/fixtures/external-provider/` |

The fixture echoes the request payload plus the round-tripped request id and
negotiated protocol version, proving the response came from a real
length-prefixed stdio decode, not an in-memory mock. This freeze is a
docs/contract decision only: no row in this file or in
[../contracts/component-protocol.md](../contracts/component-protocol.md) or
[../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md)
moves above `planned` as a result. R2-P1 onward implement against these fixed
ids.

## 3. Suggested Packet Shape

Open R2 as a host-invocation packet, not as packaging-distribution work:

1. Static manifest schema and validator for one fixture provider.
2. Derived registry/linker that refuses duplicate, reserved, unknown, and incompatible claims.
3. Stdio frame codec using 4-byte big-endian length-prefixed JSON-RPC 2.0 messages.
4. Process supervisor with bounded queues, timeout, cancellation, crash, and completion-unknown behavior.
5. Router integration for one vendor-scoped fixture operation.
6. Conformance suite and negative tests that prove discovery does not execute provider code.

Packaging-distribution is needed only if the fixture provider becomes a shipped
release artifact. A test fixture provider can stay fully inside
host-invocation proof.

## 4. Non-Gates

Marketplace, publisher trust, signature system, production WASM, and core-provider replacement do not gate R2.

## 5. Related Files

| Relationship | File |
| --- | --- |
| rollout plan | [../r2-external-process-rollout-plan.md](../r2-external-process-rollout-plan.md) |
| component protocol | [../contracts/component-protocol.md](../contracts/component-protocol.md) |
| provider manifest | [../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md) |
| source plan | [../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md) |
