# Architecture: External Provider Protocol

```txt
Document type: Architecture
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Define the planned architecture for external process and WASM providers
Design status: Draft
Implementation status: Planned
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/external-provider-protocol.md
Last reviewed: 2026-09-15
Related:
- docs/platform/host-invocation-routing/contracts/component-protocol.md
- docs/platform/host-invocation-routing/contracts/external-provider-manifest.md
- docs/platform/host-invocation-routing/verification/r2-external-process-proof.md
```

## 1. Claim

Component class and invocation mechanism are separate axes. Core component, packaged extension, and user plugin describe ownership and authority posture. Built-in, external process, external WASM, and legacy Node describe runtime invocation mechanism.

## 2. Preserved Details

- Static manifest discovery never executes unknown provider code.
- Process providers use framed JSON-RPC 2.0 semantics over stdio for v1.
- `manifest.yaml` is the canonical authored static provider declaration filename.
- The registry is a derived runtime index/cache and never outranks authored catalogs, manifests, or policy.
- External providers may add vendor-scoped operations or implement published extension points, but never own core namespaces or ambient host access.

## 3. Implementation Alignment

| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Process protocol framing is length-prefixed JSON-RPC over stdio. | `implemented preview` | [source protocol §3](../../../architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol), [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md) | R2-P3 conformance tests closed 2026-09-15. |
| Static manifest discovery does not execute provider code. | `implemented preview` | [source protocol §4](../../../architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker), [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md) | R2-P1 discovery proof closed 2026-09-15. |
| Marketplace, signatures, and production WASM are out of R2. | `planned` | [release boundaries](release-boundaries.md) | Still future ecosystem decision -- unaffected by R2 closing. |

## 4. Related Files

| Relationship | File |
| --- | --- |
| component protocol contract | [../contracts/component-protocol.md](../contracts/component-protocol.md) |
| manifest contract | [../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md) |
| R2 proof | [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md) |
| source protocol | [../../../architect/host-invocation-routing/external-provider-protocol.md](../../../architect/host-invocation-routing/external-provider-protocol.md) |
