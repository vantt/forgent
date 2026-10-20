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
Supersedes: None; legacy sources remain in place during migration
Superseded by: None recorded
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
| [runner](runner/README.md) | [../specs/runner.md](../specs/runner.md), runner architecture docs |
| [work-state](work-state/README.md) | [../specs/work-state.md](../specs/work-state.md) |
| [packaging-distribution](packaging-distribution/README.md) | [packaging-distribution/README.md](packaging-distribution/README.md), [../specs/distribution.md](../specs/distribution.md), [../distribution-vision.md](../distribution-vision.md), [../architect/packaging-distribution/](../architect/packaging-distribution/) |
| [host-invocation-routing](host-invocation-routing/README.md) | [host-invocation-routing/README.md](host-invocation-routing/README.md), [../architect/host-invocation-routing/](../architect/host-invocation-routing/) |
| [convention](convention/spec.md) | [convention/spec.md](convention/spec.md) — implemented executable naming and placement authority; no document-body health rules |
| [agent-mailbox](agent-mailbox/spec.md) | [agent-mailbox/spec.md](agent-mailbox/spec.md) — draft proposal, not signed: first slice is delivery of a message into a live agent session (Claude Code, Codex, agy, one machine, same project; the recipient is an independently started head, never a runner Unit attempt); acknowledgement, expiry and cross-machine are recorded as later parts; V-011 narrowed by V-013 (2026-10-20); revised after a second architecture panel; G0 waits for one measurement and a re-read |
| [secrets](secrets/spec.md) | [secrets/spec.md](secrets/spec.md) — draft proposal, not signed: where a secret lives, one resolver and one `${VAR}` expansion that fails loud, a `SecretSource` port (first adapter a 0600 file), login-store writers per agent CLI, and trust rules for loading a secret into the one process that needs it; config loading depends on it later |
| [agent-coordination](agent-coordination/README.md) | [agent-coordination/README.md](agent-coordination/README.md), [../architect/agent-coordination/](../architect/agent-coordination/), runner coordination specs |
| system-architecture | Candidate routes: [architecture intent](system-architecture/architecture/architecture-intent.md), [roadmap](system-architecture/architecture/roadmap.md), [workspace topology](system-architecture/architecture/workspace-topology.md), [topology audit](system-architecture/architecture/workspace-topology-audit.md); related [topology roadmap](system-architecture/architecture/workspace-topology-roadmap.md) and [system vision](system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md) |
| [system-overview](system-overview/spec.md) | Candidate overview; use [component boundaries](component-boundary.md#4-current-high-level-components) for current ownership routes |
| [holder-lock](holder-lock/spec.md) | Kernel lock port, registry, predecessor-domain rules and guarantee levels |
| [process](process/spec.md) | Process facts and control; shared judge vectors and platform limits |
| [event-store](event-store/spec.md) | Signed durability design ([D-ADR0055, 2026-10-17](event-store/spec.md#26-decision-record)); implementation not started, acceptance under the [proof gates](event-store/spec.md#23-proof-gates); navigation does not implement it |
| [agent-confinement](agent-confinement/README.md) | Candidate area portal; retained sources are identified there |
| [claude-plugin](claude-plugin/README.md) | Candidate area portal; retained sources are identified there |
| [decision-citation-drift](decision-citation-drift/README.md) | Candidate area portal; retained sources are identified there |
| [distillery](distillery/README.md) | Candidate area portal; retained sources are identified there |
| [herdr-web-dashboard](herdr-web-dashboard/README.md) | Candidate area portal; retained sources are identified there |
| [observe](observe/README.md) | Candidate area portal; retained sources are identified there |
| `skills` | domain and skill docs under [../../domains/](../../domains/), [../../.agents/skills/](../../.agents/skills/), [../../plugins/fgOS/skills/](../../plugins/fgOS/skills/) |
| [ui-spec](ui-spec/README.md) | [../ui-spec/](../ui-spec/) |
| `documentation-system` | Full-horizon proposal: [proposals/documentation-system-unification.md](proposals/documentation-system-unification.md); proposed active H1 migration plan: `plans/260925-documentation-authority-unification/plan.md`; implemented end-user registry foundation: `archive/plans/260825-1841-knowledge-registry/plan.md` |

## 3. Decision Surface

| Status | Question | Where |
|---|---|---|
| Settled | Platform-wide docs live directly under `docs/platform/`; area docs live under `docs/platform/<area>/` | `docs/doc-governance.md` |
| Settled | No `docs/platform/system/` and no `docs/platform/areas/` | `docs/doc-governance.md` |
| Proposed | Exact migration order for existing areas | `plans/260925-documentation-authority-unification/plan.md`; Phases 00–04 are completed, Phase 05 is authorized and in progress, Phases 06–09 remain unauthorized |
| Open | Final area list and naming | Inventory and minimum constitution in the active H1 plan |
| Preserved | Full multi-profile Knowledge and Documentation Engine and separate Agent Context Engine | [proposals/documentation-system-unification.md](proposals/documentation-system-unification.md) and [intent-preservation-ledger.md](intent-preservation-ledger.md) |

## 4. How To Change Platform Docs

1. Open the candidate [governance](governance.md) for document types, metadata and links; its header records the retained source during migration.
2. Read [migration-authoring-rules.md](migration-authoring-rules.md) and [documentation/switchboard.md](documentation/switchboard.md).
3. Read this portal and the relevant area portal/spec.
4. Read the relevant vision and intent-preservation ledger when the change
   narrows, stages, or simplifies the full design.
5. Use a discussion scratchpad for multi-round shaping.
6. Promote settled content into the right canonical doc.
7. Update links and verification pointers. For cross-area changes, follow the
   [map registration and verification ritual](architecture-map.md#9-luật-vận-hành-bản-đồ),
   [boundary change rule](component-boundary.md#5-how-to-change) and
   [six-question acceptance test](platform-foundations.md#l5-definition-of-done-sáu-câu-hỏi).

Candidate authoring routes: [types](governance.md#3-document-types),
[metadata](governance.md#5-metadata), [links and boundary checks](governance.md#11-linking-discipline),
[cross-area proposal collection](proposals/README.md), and
[proposal shape](documentation/architecture/documentation-system-design.md#67-proposal).
These are reading links; migration authority and document status remain unchanged.

## 5. Related Files

| Relationship | File |
|---|---|
| governs docs | [governance.md](governance.md) |
| operative transitional switchboard | [documentation/switchboard.md](documentation/switchboard.md) |
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
