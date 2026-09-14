# Host Invocation Source Inventory

```txt
Document type: History
Audience: Human reviewer, architect, maintainer, documentation agent
Purpose: Classify old host-invocation source docs and record migration disposition
Design status: Draft
Implementation status: Current migration snapshot
Canonical: Yes, after review, for source disposition only
Owner: Host invocation
Source type: Inventory of docs/architect/host-invocation-routing/**
Last reviewed: 2026-09-14
Related:
- docs/platform/host-invocation-routing/intent-preservation-ledger.md
- docs/platform/host-invocation-routing/history/host-invocation-baseline.md
- docs/platform/host-invocation-routing/verification/source-preservation-audit.md
```

## 1. Inventory

| Source | Legacy role | Status after migration | Disposition | New destinations |
| --- | --- | --- | --- | --- |
| [documentation-standardization-plan.md](../../../architect/host-invocation-routing/documentation-standardization-plan.md) | Migration plan | `current` as migration plan until this pass is reviewed | `archive` after review | [intent-preservation-ledger.md](../intent-preservation-ledger.md), this inventory |
| [host-invocation-provider-routing.md](../../../architect/host-invocation-routing/host-invocation-provider-routing.md) | Main architecture / kernel contract | `legacy-current source` until redirected | `split` | [vision.md](../vision.md), [architecture/invocation-kernel.md](../architecture/invocation-kernel.md), [architecture/host-use-cases.md](../architecture/host-use-cases.md), [architecture/provider-routing.md](../architecture/provider-routing.md), [contracts/](../contracts/README.md), [verification/implementation-alignment.md](../verification/implementation-alignment.md) |
| [external-provider-protocol.md](../../../architect/host-invocation-routing/external-provider-protocol.md) | External provider / plugin protocol | `legacy-current source` until redirected | `split` | [architecture/external-provider-protocol.md](../architecture/external-provider-protocol.md), [contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md), [contracts/component-protocol.md](../contracts/component-protocol.md), [verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md) |
| [legacy-cli-transition.md](../../../architect/host-invocation-routing/legacy-cli-transition.md) | Transitional CLI lane | `legacy-current source` until redirected | `split` and `keep legacy` | [architecture/legacy-cli-transition.md](../architecture/legacy-cli-transition.md), [contracts/command-route-descriptor.md](../contracts/command-route-descriptor.md), [contracts/legacy-payload.md](../contracts/legacy-payload.md), [verification/compatibility-harness.md](../verification/compatibility-harness.md) |
| [node-to-rust-component-migration.md](../../../architect/host-invocation-routing/node-to-rust-component-migration.md) | Selected migration direction | `legacy-current source` until redirected | `split` | [architecture/node-to-rust-migration.md](../architecture/node-to-rust-migration.md), [architecture/release-boundaries.md](../architecture/release-boundaries.md), [verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md), [history/host-invocation-baseline.md](host-invocation-baseline.md) |
| [rust-cli-and-proof-components-plan.md](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md) | Execution plan | `legacy-current source` until redirected | `split` and `deferred` for open decisions | [architecture/release-boundaries.md](../architecture/release-boundaries.md), [verification/compatibility-harness.md](../verification/compatibility-harness.md), [verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md), [verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md), [verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md) |

## 2. Cross-Area Sources

| Source | Role | Disposition |
| --- | --- | --- |
| [../packaging-distribution/README.md](../../packaging-distribution/README.md) | Packaging-distribution area boundary and runtime selection owner. | `redirect` as dependency, not host-invocation authority. |
| [../component-boundary.md](../../component-boundary.md) | Whole-system component boundary anchor. | `keep current`; no component-boundary change. |
| [../../architect/agent-coordination/README.md](../../../architect/agent-coordination/README.md) | Documentation pattern reference. | `archive` as reference pattern only. |
| [../../architect/agent-coordination/intent-preservation-ledger.md](../../../architect/agent-coordination/intent-preservation-ledger.md) | Ledger pattern reference. | `archive` as reference pattern only. |

## 3. Phase 0 Result

No source document is unclassified. Old docs remain in place during this pass. Old docs now carry legacy/status notes that point readers to the promoted platform docs. Future cleanup may turn those notes into pure redirects after review.

## 4. Related Files

| Relationship | File |
| --- | --- |
| preservation ledger | [../intent-preservation-ledger.md](../intent-preservation-ledger.md) |
| baseline summary | [host-invocation-baseline.md](host-invocation-baseline.md) |
| source preservation audit | [../verification/source-preservation-audit.md](../verification/source-preservation-audit.md) |
| area portal | [../README.md](../README.md) |

