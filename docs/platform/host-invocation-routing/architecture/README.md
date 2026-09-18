# Host Invocation Architecture

```txt
Document type: Architecture index
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Route readers through accepted and planned host-invocation architecture
Design status: Draft
Implementation status: R1/R2/R3 implemented preview plus future host/component migrations
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/**
Last reviewed: 2026-09-18
Related:
- docs/platform/host-invocation-routing/README.md
- docs/platform/host-invocation-routing/vision.md
- docs/platform/host-invocation-routing/verification/implementation-alignment.md
```

## 1. Documents

| Document | Status | Owns |
| --- | --- | --- |
| [invocation-kernel.md](invocation-kernel.md) | `current partial` | `OperationRequest` to `ProviderOutcome`, `InvocationService`, failure lifecycle. |
| [host-use-cases.md](host-use-cases.md) | `current partial` | CLI and remote peer proof exist for selected operations; chat remains planned. |
| [provider-routing.md](provider-routing.md) | `current partial` | Pure router, registry snapshot, binding, replacement, authority gates. |
| [external-provider-protocol.md](external-provider-protocol.md) | `implemented preview` | Component class vs mechanism, manifest discovery, external process protocol; WASM/marketplace remain future. |
| [legacy-cli-transition.md](legacy-cli-transition.md) | `accepted-not-implemented` with `legacy-current` payload behavior | CLI-local Node passthrough and semantic bridge distinction. |
| [node-to-rust-migration.md](node-to-rust-migration.md) | `planned` | Migration ordering and component-boundary rules. |
| [release-boundaries.md](release-boundaries.md) | `implemented preview plus open release decisions` | R1/R2/R3 gates and non-gates. |

## 2. Rule

Architecture docs may describe accepted target shape before implementation exists, but each claim must point to [../verification/implementation-alignment.md](../verification/implementation-alignment.md) or a phase proof gap.

## 3. Related Files

| Relationship | File |
| --- | --- |
| area portal | [../README.md](../README.md) |
| vision | [../vision.md](../vision.md) |
| ledger | [../intent-preservation-ledger.md](../intent-preservation-ledger.md) |
| contracts | [../contracts/README.md](../contracts/README.md) |
| verification | [../verification/implementation-alignment.md](../verification/implementation-alignment.md) |
