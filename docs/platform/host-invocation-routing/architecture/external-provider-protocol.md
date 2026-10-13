# Architecture: External Provider Protocol

```txt
Document type: Architecture
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Define the preview architecture for external process providers and future WASM/provider-ecosystem work
Design status: Draft
Implementation status: External process implemented preview; WASM/provider ecosystem planned
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/external-provider-protocol.md
Last reviewed: 2026-09-18
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
| Marketplace, signatures, and production WASM are out of R2. | `planned` | [release boundaries](release-boundaries.md), [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md) | Still future ecosystem decision -- unaffected by R2 closing. |

## 4. Related Files

| Relationship | File |
| --- | --- |
| component protocol contract | [../contracts/component-protocol.md](../contracts/component-protocol.md) |
| manifest contract | [../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md) |
| R2 proof | [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md) |
| source protocol | [../../../architect/host-invocation-routing/external-provider-protocol.md](../../../architect/host-invocation-routing/external-provider-protocol.md) |

## Retained selected source material

Added in candidate: the following is the pinned September design/migration source, not a fresh certification of current code, route counts, release posture or measured performance. Prior status labels remain dated provenance. Registered details split to their mapped owners are linked below; the separate restore notes state the checked implementation limits. Source: `docs/architect/host-invocation-routing/external-provider-protocol.md` at `83d757f4d693ae13d3fd50e0a454fb95c78f1ff4`.

### External Provider Protocol

**Status:** Vision / architecture advisory, not a locked platform law and not an implementation plan.
**Date:** 2026-09-10.
**Revised:** per [architecture-review-260910-1537-host-invocation-provider-routing-design-review.md](../../../../plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).

This document depends on the kernel contract in [Host Invocation And Provider Routing](../spec.md) — read it first for `OperationId`, `OperationRequest`, `ProviderOutcome`, `ProviderDescriptor`, `OperationProvider`, `RegistrySnapshot`, the Router, and `InvocationService`. This document covers everything specific to a provider that lives outside a statically linked Rust crate: component classes (who owns/releases it), invocation mechanisms (how it is reached), the wire protocol, and the plugin registry linker that turns manifests into a `RegistrySnapshot`.

#### Historical Migration Status Note

Added in candidate: superseded migration bookkeeping. The legacy source was
legacy-current during the 2026-09-14 promotion pass. That dated status applies
to the legacy input, not this candidate. The recorded platform destinations are
[architecture/external-provider-protocol.md](external-provider-protocol.md),
[contracts/component-protocol.md](../contracts/component-protocol.md),
and [contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md).
See the [intent preservation ledger](../intent-preservation-ledger.md)
for disposition by preserved claim.

#### 1. Component Classes

Invocation mechanism describes how an implementation is invoked. It does not describe the product nature, release ownership, or authority posture of the component being invoked — that is a separate axis, **component class**:

```txt
component class    -> who owns/releases/configures the component
invocation mechanism -> how the selected provider is invoked at runtime
```

A `ProviderDescriptor` therefore declares both: component class (core, packaged extension, or user plugin) and invocation mechanism (built-in, legacy node, external process, or external WASM).


Added in candidate: this retained source detail is carried verbatim in [the dropped-005 restoration](release-boundaries.md#restored-class-definitions).



**User plugin** — supplied, installed, upgraded, removed outside the fgOS release train; never assumed present, never compiled into the host. Discovered from manifests, linked into the derived registry, granted only explicit capabilities. May add vendor-scoped operations or implement published extension points; owns no core namespace, authority, init/doctor invariant, or ambient access merely by manifest claim.



#### 2. Invocation Mechanisms


Added in candidate: this retained source detail is carried verbatim in [the dropped-005 restoration](release-boundaries.md#restored-class-definitions).


This enum covers semantic providers and is an illustrative host-implementation detail, not the public ABI (the transitional `LegacyCliPassthrough` binding is CLI-only and lives outside this set — see [Legacy CLI Transition](legacy-cli-transition.md)).






Added in candidate: this retained source detail is carried verbatim in [the dropped-006 restoration](../contracts/component-protocol.md#restored-same-process-built-ins-vs-runtime-extensions-and-cross-process-cost).



Added in candidate: this retained source detail is carried verbatim in [the dropped-006 restoration](../contracts/component-protocol.md#restored-same-process-built-ins-vs-runtime-extensions-and-cross-process-cost).




Added in candidate: this retained source detail is carried verbatim in [the dropped-006 restoration](../contracts/component-protocol.md#restored-same-process-built-ins-vs-runtime-extensions-and-cross-process-cost).


#### 3. Component Protocol

The semantic component protocol is versioned independently from public host protocols — `fgos.component.v1`, distinct from CLI `fgos.v1` and any remote API version. It carries: operation identity and protocol/schema version range; request ID and optional parent/correlation ID; typed request, result, and error payloads; deadline, cancellation, progress, and events where supported; capability context granted by the host; provider identity and diagnostics needed for tracing.

For process plugins, version one uses JSON-RPC 2.0 semantics over 4-byte big-endian length-prefixed UTF-8 JSON frames on stdio. Newline-delimited JSON is not the contract: a length prefix gives one enforceable maximum-frame boundary and does not make embedded or future formatted content ambiguous. Stdout is protocol only; logs go to stderr or a declared log notification.

The host starts a process only after static manifest selection. Its first exchange confirms provider identity, accepted manifest digest, component protocol range, supported operation/contract pairs, and concurrency limit. Discovery never depends on this handshake; a mismatch terminates the provider and fails closed.

One connection obeys these lifecycle rules:

- request IDs are unique per connection;
- responses may complete out of order only when concurrency greater than one was negotiated;
- requests, frames, and event queues are bounded to provide backpressure;
- cancellation sends a protocol notification, waits a bounded grace period, then terminates the provider process if necessary;
- cancellation acknowledgement does not claim semantic side effects were rolled back;
- a crash after dispatch yields completion-unknown unless the operation's idempotency contract and key explicitly permit retry;
- a one-shot CLI may own one process for its lifetime; a gateway may pool or persist connections under the adapter's health/restart policy.


Added in candidate: this retained source detail is carried verbatim in [the dropped-007 restoration](../contracts/component-protocol.md#restored-semantic-contract-stays-transport-neutral).


`EncodedMessage` is the wire representation used only at this boundary — never inside the kernel:

```rust
pub struct EncodedMessage {
    pub contract_id: ContractId,
    pub version: ContractVersion,
    pub content_type: ContentType,
    pub bytes: Bytes,
}
```

#### 4. Plugin Registry Linker

External discovery is data-first: the host scans a static manifest and never executes unknown provider code merely to discover what it claims.

A `manifest.yaml` provider declaration declares at least: plugin ID, version, publisher, and component protocol range; provided `OperationId` values or named extension points; request/result schema references; invocation mechanism and executable/module location; requested host capabilities; platform compatibility and integrity metadata; health and post-selection `describe` operations.

`manifest.yaml` is the one canonical filename for authored, static provider declarations. Its `kind` field distinguishes the declaration shape (`fgos.component`, `fgos.plugin`, `fgos.domain`, ...); every kind shares `manifestVersion`, `id`, `version`, `provides`, `requires`, `capabilities` before kind-specific fields are validated.

**Registry** names only the host's derived runtime index (and its lock/cache), never another authored file. Discovery scans `manifest.yaml`, validates by `kind`, then links accepted claims into the provider registry.


Added in candidate: this retained source detail is carried verbatim in [the dropped-008 restoration](../verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula).




Authored catalogs, manifests, and policy are durable inputs; the linked registry lock/cache is rebuildable derived state — it records host version and source fingerprint, is replaced atomically, and is ignored/rebuilt when stale or corrupt. A cache never outranks its authored sources. This is a compiler only in the linking/validation sense; it does not compile plugin source or the `fgos` host binary.

Project configuration overrides global configuration values, but duplicate operation claims do not silently use last-writer-wins — override precedence is not authority precedence. Ambiguity fails closed unless an explicit replacement policy names both the selected provider and the provider being replaced. Configuration can never replace a **built-in** provider (see the kernel contract's Authority section); a replacement policy only ever governs the external/plugin surface this linker discovers.

#### 5. Namespace Rules

The safe ecosystem default: core operation and command namespaces are reserved; plugins add vendor-scoped operations, e.g. `acme.deploy.release`; plugins may implement extension points explicitly published by a built-in component; `.fgos` writes, Git mutation, process execution, network, secrets, and host callbacks require explicit capability grants; unknown capability requests and ambiguous claims fail closed. The provider manifest is never an authority source — caller admission and selected-provider grant (kernel contract §7) apply identically here.

#### Related Documents

- [Host Invocation And Provider Routing](../spec.md) — kernel contract this document depends on.
- [Legacy CLI Transition](legacy-cli-transition.md)
