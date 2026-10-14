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
Last reviewed: 2026-09-25
Related:
- `docs/doc-governance.md`
- `docs/transitional-switchboard.md`
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
| [convention](convention/spec.md) | [convention/spec.md](convention/spec.md) — implemented executable naming and placement authority; no document-body health rules |
| [agent-coordination](agent-coordination/README.md) | [agent-coordination/README.md](agent-coordination/README.md), [../architect/agent-coordination/](../architect/agent-coordination/), runner coordination specs |
| `skills` | domain and skill docs under [../../domains/](../../domains/), [../../.agents/skills/](../../.agents/skills/), [../../plugins/fgOS/skills/](../../plugins/fgOS/skills/) |
| `ui-spec` | [../ui-spec/](../ui-spec/) |
| `documentation-system` | Full-horizon proposal: [proposals/documentation-system-unification.md](proposals/documentation-system-unification.md); proposed active H1 migration plan: `plans/260925-documentation-authority-unification/plan.md`; implemented end-user registry foundation: `plans/260825-1841-knowledge-registry/plan.md` |

## 3. Decision Surface

| Status | Question | Where |
|---|---|---|
| Settled | Platform-wide docs live directly under `docs/platform/`; area docs live under `docs/platform/<area>/` | `docs/doc-governance.md` |
| Settled | No `docs/platform/system/` and no `docs/platform/areas/` | `docs/doc-governance.md` |
| Proposed | Exact migration order for existing areas | `plans/260925-documentation-authority-unification/plan.md`; Phases 00–02 are completed, Phases 03–09 remain unauthorized |
| Open | Final area list and naming | Inventory and minimum constitution in the active H1 plan |
| Preserved | Full multi-profile Knowledge and Documentation Engine and separate Agent Context Engine | [proposals/documentation-system-unification.md](proposals/documentation-system-unification.md) and [intent-preservation-ledger.md](intent-preservation-ledger.md) |

## 4. How To Change Platform Docs

1. Read `docs/doc-governance.md`.
2. Read [migration-authoring-rules.md](migration-authoring-rules.md) and [../transitional-switchboard.md](../transitional-switchboard.md).
3. Read this portal and the relevant area portal/spec.
4. Read the relevant vision and intent-preservation ledger when the change
   narrows, stages, or simplifies the full design.
5. Use a discussion scratchpad for multi-round shaping.
6. Promote settled content into the right canonical doc.
7. Update links and verification pointers.

## 5. Related Files

| Relationship | File |
|---|---|
| governs docs | [../doc-governance.md](../doc-governance.md) |
| operative transitional switchboard | [../transitional-switchboard.md](../transitional-switchboard.md) |
| migration authoring rules | [migration-authoring-rules.md](migration-authoring-rules.md) |
| routes readers | [../reading-map.md](../reading-map.md) |
| defines platform direction | [vision.md](vision.md) |
| preserves platform intent | [intent-preservation-ledger.md](intent-preservation-ledger.md) |
| defines durable laws | [platform-foundations.md](platform-foundations.md) |
| maps architecture | [architecture-map.md](architecture-map.md) |
| maps component boundaries | [component-boundary.md](component-boundary.md) |
| preserves deferred documentation-system architecture | [intent-preservation-ledger.md](intent-preservation-ledger.md) |
| proposes full documentation operating system | [proposals/documentation-system-unification.md](proposals/documentation-system-unification.md) |
| plans near-term authority unification | `plans/260925-documentation-authority-unification/plan.md` |

## Added in candidate: README source carriage

Carriage from `docs/architect/README.md` at `69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539`; pending independent conservation review. Full source text follows, with heading levels and physical link destinations adjusted only. Source metadata is provenance; this section makes no new implementation or authority claim.

### Architect-Level Design

Document type: Index
Design status: Discussion
Implementation: Partial
Last reviewed: 2026-09-04

This directory holds architecture-wide intention and redesign documents whose
scope crosses one component area. Area-specific canonical documents still live
inside their own subtrees, such as `agent-coordination/` and
`component-boundary/`.

#### Cross-Area Intentions

- [Architect Roadmap](../architect/roadmap.md) keeps the high-level sequencing and delivery
  plan across active architecture streams: agent coordination, coding domain,
  component boundary, host invocation, Node-to-Rust migration, and packaging
  distribution.
- [Architecture Intent](../architect/architecture-intent.md) preserves architecture-wide
  design intent across deferred capabilities. Its first active thread covers
  widening fgOS from strict fan-out/fan-in and artifact-mediated coordination
  toward richer group-thinking/problem-solving capability, while keeping
  isolation-heavy fixtures intact.
- [System Vision: Trong Mem Ngoai Cung](../architect/system-vision-trong-mem-ngoai-cung.md)
  records the cross-system direction that fgOS must combine hard outer
  contracts with soft inner soul/prose/skill, so architecture slices do not
  become either unverifiable prose or rigid harness without living operating
  intelligence.
- [Workspace Topology Architecture](../architect/workspace-topology.md) defines
  repository/workspace/work-state/runtime identities, state classes, root
  ownership, worktree mode invariants, and mutation topology used by
  packaging, work-state, coding-domain, coordination, and config/init/doctor.
  Read this contract before packaging activation, work-state relocation,
  coding-domain worktree changes, or runtime coordination changes.
- [Workspace Topology Audit](../architect/workspace-topology-audit.md) records current
  codebase evidence and gaps behind the topology contract.
- [Workspace Topology Roadmap](../architect/workspace-topology-roadmap.md) sequences the
  decisions and migration slices needed to make the contract enforceable.

#### Area Portals

- [Agent Coordination](../architect/agent-coordination/README.md)
- [Component Boundary](../architect/component-boundary/README.md)
- [Domainization](../architect/domainization/README.md)
- [Host Invocation And Provider Routing](../architect/host-invocation-routing/host-invocation-provider-routing.md)
- [Packaging And Distribution](../architect/packaging-distribution/README.md)

#### Cross-Area Proposals

- [Architect-Level Proposals](../architect/proposals/README.md) holds discussion drafts
  whose scope crosses one architecture area. These are not accepted design
  until extracted into canonical architect-level or area-specific documents.

#### Other Architecture Drafts

- [Dispatch Control Plane Redesign](../architect/dispatch-control-plane-redesign.md)
- [Doing Coordination Redesign](../architect/doing-coordination-redesign.md)
- [Knowledge Registry Redesign](../architect/knowledge-registry-redesign.md)
