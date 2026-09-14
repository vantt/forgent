# Verification: R2 External Process Proof

```txt
Document type: Verification
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Preserve the proof gate for external process provider preview
Design status: Draft
Implementation status: Planned
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md
Last reviewed: 2026-09-14
Related:
- docs/platform/host-invocation-routing/contracts/component-protocol.md
- docs/platform/host-invocation-routing/contracts/external-provider-manifest.md
```

## 1. Required Proof

R2 proves framed process protocol, static manifest validation without execution, bounded supervision, handshake, cancellation, backpressure, crash/completion-unknown mapping, namespace refusal, duplicate refusal, unknown capability refusal, and one vendor-scoped fixture operation through the common router.

## 2. Non-Gates

Marketplace, publisher trust, signature system, production WASM, and core-provider replacement do not gate R2.

## 3. Related Files

| Relationship | File |
| --- | --- |
| component protocol | [../contracts/component-protocol.md](../contracts/component-protocol.md) |
| provider manifest | [../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md) |
| source plan | [../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md) |

