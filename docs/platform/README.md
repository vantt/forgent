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
- `docs/platform/governance.md`
- `docs/platform/documentation/history/switchboard.md`
- `docs/reading-map.md`
Supersedes: Transitional legacy-source delegations; preserved provenance does not establish current authority
Superseded by: None recorded
```

This is the portal for fgOS platform documentation.

## 1. Platform-wide Anchors

These docs are cross-area authority and live directly under `docs/platform/` in
the target structure.

| Entry | Role | Current exact owner / retained scope |
|---|---|---|
| [vision.md](vision.md) | Whole-platform mission and direction | [vision.md](vision.md); retained [binding laws](platform-foundations.md) and [original lifecycle direction](vision.md) keep their scopes |
| [intent-preservation-ledger.md](intent-preservation-ledger.md) | Whole-platform preserved intent | [intent-preservation-ledger.md](intent-preservation-ledger.md), with exact design/evidence distinctions |
| [platform-foundations.md](platform-foundations.md) | Orientation, non-law rules and carried decision narratives | [platform-foundations.md](platform-foundations.md) exclusively owns complete binding laws |
| [architecture-map.md](architecture-map.md) | Architecture entry | Retained [full map](architecture-map.md); exact boundary owner [component-boundary.md](component-boundary.md) |
| [component-boundary.md](component-boundary.md) | Component boundaries and responsibilities | [component-boundary.md](component-boundary.md), no retiring-tree delegation |
| [herdr-web-dashboard/contracts/](herdr-web-dashboard/contracts/) | Cross-area contracts | Retained [handoff contract](runner/contracts/routing-handoff.md) and explicit contract-level owners |

## 2. Area Registry

Target area docs live at `docs/platform/<area>/`.

| Area | Current exact owner / retained scope |
|---|---|
| [runner](runner/README.md) | [runner/spec.md](runner/spec.md), exact contracts/rules/decisions linked there; retained root handoff contract |
| [work-state](work-state/README.md) | [work-state/spec.md](work-state/spec.md), exact area contracts; retained root CLI I/O authority |
| [packaging-distribution](packaging-distribution/README.md) | [Area spec](packaging-distribution/spec.md), exact contracts and implementation alignment, not legacy-source fallback |
| [host-invocation-routing](host-invocation-routing/README.md) | Exact area contracts/architecture/decisions linked by the portal |
| [convention](convention/spec.md) | [convention/spec.md](convention/spec.md) — implemented executable naming and placement authority; no document-body health rules |
| [agent-mailbox](agent-mailbox/spec.md) | [agent-mailbox/spec.md](agent-mailbox/spec.md) — first slice signed at G0 on 2026-10-20 (numeric values and later parts stay proposals; implementation not started): first slice is delivery of a message into a live agent session (Claude Code, Codex, agy, one machine, same project; the recipient is an independently started head, never a runner Unit attempt); acknowledgement, expiry and cross-machine are recorded as later parts; V-011 narrowed by V-013 (2026-10-20); revised after a second architecture panel before signing |
| [secrets](secrets/spec.md) | [secrets/spec.md](secrets/spec.md) — draft proposal, not signed: where a secret lives, one resolver and one `${VAR}` expansion that fails loud, a `SecretSource` port (first adapter a 0600 file), login-store writers per agent CLI, and trust rules for loading a secret into the one process that needs it; config loading depends on it later |
| [agent-coordination](agent-coordination/README.md) | Surviving current contracts and qualified design; retired-engine records are history, execution uses runner/Workflow |
| system-architecture | Architecture routes: [architecture intent](system-architecture/architecture/architecture-intent.md), [roadmap](system-architecture/architecture/roadmap.md), [workspace topology](system-architecture/architecture/workspace-topology.md), [topology audit](system-architecture/architecture/workspace-topology-audit.md); related [topology roadmap](system-architecture/architecture/workspace-topology-roadmap.md) and [system vision](system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md) |
| [system-overview](system-overview/spec.md) | System overview; use [component boundaries](component-boundary.md#4-current-high-level-components) for current ownership routes |
| [holder-lock](holder-lock/spec.md) | Kernel lock port, registry, predecessor-domain rules and guarantee levels |
| [process](process/spec.md) | Process facts and control; shared judge vectors and platform limits |
| [event-store](event-store/spec.md) | Signed durability design ([D-ADR0055, 2026-10-17](event-store/spec.md#26-decision-record)); implementation not started, acceptance under the [proof gates](event-store/spec.md#23-proof-gates); navigation does not implement it |
| [agent-confinement](agent-confinement/README.md) | Area portal; retained sources are identified there |
| [claude-plugin](claude-plugin/README.md) | Area portal; retained sources are identified there |
| [decision-citation-drift](decision-citation-drift/README.md) | Area portal; retained sources are identified there |
| [distillery](distillery/README.md) | Area portal; retained sources are identified there |
| [herdr-web-dashboard](herdr-web-dashboard/README.md) | Area portal; retained sources are identified there |
| [observe](observe/README.md) | Area portal; retained sources are identified there |
| `skills` | domain and skill docs under [../../domains/](../../domains/), [../../.agents/skills/](../../.agents/skills/), [../../plugins/fgOS/skills/](../../plugins/fgOS/skills/) |
| [ui-spec](ui-spec/README.md) | Retained [../ui-spec/](../ui-spec/) for visual contracts; functional behavior remains area-owned |
| `documentation-system` | Full-horizon proposal: [proposals/documentation-system-unification.md](proposals/documentation-system-unification.md); historical documentation migration plan: `plans/260925-documentation-authority-unification/plan.md`; implemented end-user registry foundation: `archive/plans/260825-1841-knowledge-registry/plan.md` |

## 3. Decision Surface

| Status | Question | Where |
|---|---|---|
| Settled | Platform-wide docs live directly under `docs/platform/`; area docs live under `docs/platform/<area>/` | `docs/platform/governance.md` |
| Settled | No `system` folder and no `areas` layer under `docs/platform/` | `docs/platform/governance.md` |
| Historical migration record | Authority-unification execution order | `plans/260925-documentation-authority-unification/plan.md`; this portal does not certify implementation or authorize a further phase |
| Open | Final area list and naming | Inventory and minimum constitution in the historical H1 migration plan |
| Preserved | Full multi-profile Knowledge and Documentation Engine and separate Agent Context Engine | [proposals/documentation-system-unification.md](proposals/documentation-system-unification.md) and [intent-preservation-ledger.md](intent-preservation-ledger.md) |

## 4. How To Change Platform Docs

1. Open [governance](governance.md) for document types, metadata and links; its header records source provenance.
2. Follow governance sections 5 and 8 for the one-owner rule. [The former switchboard](documentation/history/switchboard.md) and [migration authoring rules](documentation/history/migration-authoring-rules.md) are transition evidence, not operative routers.
3. Read this portal and the relevant area portal/spec.
4. Read the relevant vision and intent-preservation ledger when the change
   narrows, stages, or simplifies the full design.
5. Use a discussion scratchpad for multi-round shaping.
6. Promote settled content into the right canonical doc.
7. Update links and verification pointers. For cross-area changes, follow the
   [map registration and verification ritual](architecture-map.md#9-luật-vận-hành-bản-đồ),
   [boundary change rule](component-boundary.md#5-how-to-change) and
   [six-question acceptance test](platform-foundations.md#l5-definition-of-done-sáu-câu-hỏi).

Documentation authoring routes: [types](governance.md#3-document-types),
[metadata](governance.md#5-metadata), [links and boundary checks](governance.md#11-linking-discipline),
[cross-area proposal collection](proposals/README.md), and
[proposal shape](documentation/architecture/documentation-system-design.md#67-proposal).
These are reading links; each linked document states its authority and implementation limits.

## 5. Related Files

| Relationship | File |
|---|---|
| governs docs | [governance.md](governance.md) |
| historical transition evidence, not current routing | [documentation/history/switchboard.md](documentation/history/switchboard.md) |
| migration authoring rules (history) | [documentation/history/migration-authoring-rules.md](documentation/history/migration-authoring-rules.md) |
| routes readers | [../reading-map.md](../reading-map.md) |
| defines platform direction | [vision.md](vision.md) |
| preserves platform intent | [intent-preservation-ledger.md](intent-preservation-ledger.md) |
| defines durable laws | [platform-foundations.md](platform-foundations.md) |
| maps architecture | [architecture-map.md](architecture-map.md) |
| maps component boundaries | [component-boundary.md](component-boundary.md) |
| preserves deferred documentation-system architecture | [intent-preservation-ledger.md](intent-preservation-ledger.md) |
| proposes full documentation operating system | [proposals/documentation-system-unification.md](proposals/documentation-system-unification.md) |
| plans near-term authority unification | `plans/260925-documentation-authority-unification/plan.md` |
