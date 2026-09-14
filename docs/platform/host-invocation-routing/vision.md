# Host Invocation Vision

```txt
Document type: Vision
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Preserve the durable direction for fgOS host invocation and provider routing
Design status: Draft
Implementation status: Partial
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md and node-to-rust-component-migration.md
Last reviewed: 2026-09-14
Related:
- docs/platform/host-invocation-routing/README.md
- docs/platform/host-invocation-routing/intent-preservation-ledger.md
- docs/platform/host-invocation-routing/spec.md
- docs/platform/host-invocation-routing/architecture/invocation-kernel.md
```

## 1. Authority And Reading Rule

Read this Vision before narrowing host invocation into an implementation phase. Then read the [Intent Preservation Ledger](intent-preservation-ledger.md). The Vision states the full intended direction; the ledger records which parts are implemented, deferred, legacy-current, superseded, or unknown.

This document does not claim current implementation. Current state and proof gaps belong to [spec.md](spec.md) and [verification/implementation-alignment.md](verification/implementation-alignment.md).

## 2. Vision

Host invocation is the runtime foundation that lets CLI, remote, chat, and future hosts request the same semantic fgOS operation without wrapping one host surface inside another. A host admits and normalizes caller context; the Operation Provider Router selects an implementation; the invocation service grants capability, invokes the provider, records lifecycle evidence, and lets the host presenter project the result.

The long-term model separates three axes:

- host surface: CLI, remote, chat, or future host;
- semantic operation: stable `OperationId` plus versioned request/outcome contract;
- provider mechanism: built-in Rust, transitional legacy Node, external process, or WASM.

This avoids a special-path matrix where CLI, REST, MCP, chat, plugins, and legacy compatibility each grow their own private invocation and authority rules.

## 3. Mission Fit

Host invocation serves fgOS mission #1 and #2 by making the runtime easier to embed, distribute, extend, and operate for consuming projects and business workflows. It is not a Rust rewrite for its own sake. Rust becomes the host first because it establishes the permanent composition root and plugin seam while legacy Node behavior remains available until each component boundary is ready.

## 4. Non-Scope

Host invocation does not own:

- release acquisition, activation, upgrade, repair, or rollback; see [Packaging-Distribution](../packaging-distribution/README.md);
- Work Lifecycle state transitions;
- Dispatch authority to execute approved assignments;
- Run Result Evaluation confidence policy;
- gateway authentication or transport-specific public API shape;
- marketplace, publisher trust, or signature policy.

## 5. Design Direction

| Direction | Status | Alignment |
| --- | --- | --- |
| CLI, remote, and chat are peer hosts that feed one semantic invocation service. | `accepted-not-implemented` | Preserved from [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md); proof gap in [verification/implementation-alignment.md](verification/implementation-alignment.md). |
| Legacy Node compatibility is transitional and CLI-local unless a per-operation semantic bridge is needed. | `accepted-not-implemented` with `legacy-current` behavior | Preserved from [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md). |
| Provider manifests describe capability requests and operation claims but never grant authority. | `accepted-not-implemented` | Preserved from [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md). |
| Rust host migration proceeds by complete component/use-case boundaries, reads before writers, and no write dual-run. | `planned` | Preserved from [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md). |
| Rollback of native R1/R2 behavior is a release rollback through `fgctl`, not a runtime provider-selection toggle. | `accepted-not-implemented` | Depends on packaging-distribution contracts. |

## 6. Related Files

| Relationship | File |
| --- | --- |
| area portal | [README.md](README.md) |
| preserved intent | [intent-preservation-ledger.md](intent-preservation-ledger.md) |
| current state | [spec.md](spec.md) |
| implementation alignment | [verification/implementation-alignment.md](verification/implementation-alignment.md) |
| source architecture | [../../architect/host-invocation-routing/host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md) |
| source migration strategy | [../../architect/host-invocation-routing/node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md) |

