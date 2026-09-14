# Platform Documentation

```txt
Document type: Platform portal
Audience: Human reviewer, architect, maintainer, agent
Purpose: Route readers through platform-wide and area-specific fgOS docs
Design status: Accepted
Implementation: Partial
Provenance: Promoted from documentation-system redesign
Writer type: Human + agent coauthor
Canonical for: Platform documentation entry and area registry
Use this when: You need to understand or change fgOS platform behavior or design
Do not use this for: User-facing task guidance or generated indexes
Last reviewed: 2026-09-13
Related:
- `docs/doc-governance.md`
- `docs/reading-map.md`
```

This is the portal for fgOS platform documentation.

## 1. Platform-wide Anchors

These docs are cross-area authority and live directly under `docs/platform/` in
the target structure.

| Target doc | Role | Current source during migration |
|---|---|---|
| [vision.md](vision.md) | Whole-platform mission, scope, non-scope, direction | [../platform-foundations.md](../platform-foundations.md), [../work-item-lifecycle-vision.md](../work-item-lifecycle-vision.md), design discussions |
| [intent-preservation-ledger.md](intent-preservation-ledger.md) | Whole-platform preserved intent across simplified implementation slices | Documentation-system discussion, [../architect/agent-coordination/intent-preservation-ledger.md](../architect/agent-coordination/intent-preservation-ledger.md) |
| [platform-foundations.md](platform-foundations.md) | Platform laws and durable constraints | [../platform-foundations.md](../platform-foundations.md), [../specs/platform-foundations.md](../specs/platform-foundations.md) |
| [architecture-map.md](architecture-map.md) | Whole-system architecture map | [../architecture-map.md](../architecture-map.md) |
| [component-boundary.md](component-boundary.md) | Layers, parent/child components, responsibilities, authority boundaries | [../architect/component-boundary/](../architect/component-boundary/) |
| [../contracts/](../contracts/) | Cross-area contracts during migration | [../routing-handoff-contract.md](../routing-handoff-contract.md), [../contracts/](../contracts/) |

## 2. Area Registry

Target area docs live at `docs/platform/<area>/`.

| Area | Current source during migration |
|---|---|
| `runner` | [../specs/runner.md](../specs/runner.md), runner architecture docs |
| `work-state` | [../specs/work-state.md](../specs/work-state.md) |
| [packaging-distribution](packaging-distribution/README.md) | [packaging-distribution/README.md](packaging-distribution/README.md), [../specs/distribution.md](../specs/distribution.md), [../distribution-vision.md](../distribution-vision.md), [../architect/packaging-distribution/](../architect/packaging-distribution/) |
| [host-invocation-routing](host-invocation-routing/README.md) | [host-invocation-routing/README.md](host-invocation-routing/README.md), [../architect/host-invocation-routing/](../architect/host-invocation-routing/) |
| `agent-coordination` | [../architect/agent-coordination/](../architect/agent-coordination/), runner coordination specs |
| `skills` | domain and skill docs under [../../domains/](../../domains/), [../../.agents/skills/](../../.agents/skills/), [../../plugins/fgOS/skills/](../../plugins/fgOS/skills/) |
| `ui-spec` | [../ui-spec/](../ui-spec/) |

## 3. Decision Surface

| Status | Question | Where |
|---|---|---|
| Settled | Platform-wide docs live directly under `docs/platform/`; area docs live under `docs/platform/<area>/` | `docs/doc-governance.md` |
| Settled | No `docs/platform/system/` and no `docs/platform/areas/` | `docs/doc-governance.md` |
| Open | Exact migration order for existing areas | Future migration plan |
| Open | Final area list and naming | Future platform area registry update |

## 4. How To Change Platform Docs

1. Read `docs/doc-governance.md`.
2. Read this portal and the relevant area portal/spec.
3. Read the relevant vision and intent-preservation ledger when the change
   narrows, stages, or simplifies the full design.
4. Use a discussion scratchpad for multi-round shaping.
5. Promote settled content into the right canonical doc.
6. Update links and verification pointers.

## 5. Related Files

| Relationship | File |
|---|---|
| governs docs | [../doc-governance.md](../doc-governance.md) |
| routes readers | [../reading-map.md](../reading-map.md) |
| defines platform direction | [vision.md](vision.md) |
| preserves platform intent | [intent-preservation-ledger.md](intent-preservation-ledger.md) |
| defines durable laws | [platform-foundations.md](platform-foundations.md) |
| maps architecture | [architecture-map.md](architecture-map.md) |
| maps component boundaries | [component-boundary.md](component-boundary.md) |
