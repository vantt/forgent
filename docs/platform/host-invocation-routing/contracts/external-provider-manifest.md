# Contract: External Provider Manifest

```txt
Document type: Contract
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Define static provider manifest discovery, namespace rules, and replacement policy
Design status: Draft
Implementation status: Planned
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/external-provider-protocol.md
Last reviewed: 2026-09-14
Related:
- docs/platform/host-invocation-routing/architecture/external-provider-protocol.md
- docs/platform/host-invocation-routing/contracts/component-protocol.md
```

## 1. Contract

`manifest.yaml` is the canonical authored static provider declaration filename. Its `kind` field distinguishes declaration shape. Common fields include `manifestVersion`, `id`, `version`, `provides`, `requires`, and `capabilities`.

Discovery scans static manifests and does not execute provider code. The derived registry cache/lock records accepted claims but never outranks authored catalog, manifest, or policy sources.

## 2. Rules

- Core operation and command namespaces are reserved.
- Plugins add vendor-scoped operations or implement published extension points.
- Unknown capabilities, ambiguous operation claims, and duplicate claims without explicit replacement fail closed.
- Replacement policy must name both selected and replaced providers.
- Configuration can never replace a built-in provider.

## 3. Implementation Alignment

| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Static discovery does not execute code. | `planned` | [source protocol §4](../../../architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker) | P7 manifest fixture. |
| Registry is derived rebuildable state. | `planned` | [source protocol §4](../../../architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker) | R2 linker/cache proof. |

## 4. Related Files

| Relationship | File |
| --- | --- |
| external provider architecture | [../architecture/external-provider-protocol.md](../architecture/external-provider-protocol.md) |
| component protocol | [component-protocol.md](component-protocol.md) |
| R2 proof | [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md) |

