# Architect-Level Design

```txt
Document type: History
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve the complete architect portal source snapshot
Design status: Archived
Implementation: Historical source metadata; no current implementation assertion
Provenance: docs/architect/README.md at 69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539; blob 454d688de0c306679b0f3ed2b5b51c0c7c82dc9f
Writer type: Agent
Canonical for: Nothing; non-canonical conservation carrier
Use this when: Reviewing the retained architect README source
Do not use this for: Current platform navigation or authority
Last reviewed: No current review date recorded; retained source dates are historical
Related:
- docs/platform/README.md
- docs/platform/system-architecture/history/architect-readme.md#architect-level-design
Supersedes: None; no legacy source is edited
Superseded by: None
```

Carriage note: metadata above identifies a non-canonical history carrier. The complete previously reviewed source carriage follows.

# Architect-Level Design

Carriage from `docs/architect/README.md` at `69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539`; heading depth and live routes adapted to this holder. Full source text follows, with heading levels and physical link destinations adjusted only. Source metadata is provenance; this section makes no new implementation or authority claim.

# Architect-Level Design

Document type: Index
Design status: Discussion
Implementation: Partial
Last reviewed: 2026-09-04

This directory holds architecture-wide intention and redesign documents whose
scope crosses one component area. Area-specific canonical documents still live
inside their own subtrees, such as `agent-coordination/` and
`component-boundary/`.

## Cross-Area Intentions

- [Architect Roadmap](../architecture/roadmap.md) keeps the high-level sequencing and delivery
  plan across active architecture streams: agent coordination, coding domain,
  component boundary, host invocation, Node-to-Rust migration, and packaging
  distribution.
- [Architecture Intent](../architecture/architecture-intent.md) preserves architecture-wide
  design intent across deferred capabilities. Its first active thread covers
  widening fgOS from strict fan-out/fan-in and artifact-mediated coordination
  toward richer group-thinking/problem-solving capability, while keeping
  isolation-heavy fixtures intact.
- [System Vision: Trong Mem Ngoai Cung](../architecture/system-vision-trong-mem-ngoai-cung.md)
  records the cross-system direction that fgOS must combine hard outer
  contracts with soft inner soul/prose/skill, so architecture slices do not
  become either unverifiable prose or rigid harness without living operating
  intelligence.
- [Workspace Topology Architecture](../architecture/workspace-topology.md) defines
  repository/workspace/work-state/runtime identities, state classes, root
  ownership, worktree mode invariants, and mutation topology used by
  packaging, work-state, coding-domain, coordination, and config/init/doctor.
  Read this contract before packaging activation, work-state relocation,
  coding-domain worktree changes, or runtime coordination changes.
- [Workspace Topology Audit](../architecture/workspace-topology-audit.md) records current
  codebase evidence and gaps behind the topology contract.
- [Workspace Topology Roadmap](../architecture/workspace-topology-roadmap.md) sequences the
  decisions and migration slices needed to make the contract enforceable.

## Area Portals

- Agent Coordination
- [Component Boundary](../../component-boundary.md)
- [Domainization](../../domainization/architecture/domainization.md)
- Host Invocation And Provider Routing
- [Packaging And Distribution](../../packaging-distribution/README.md)

## Cross-Area Proposals

- [Architect-Level Proposals](../../proposals/README.md) holds discussion drafts
  whose scope crosses one architecture area. These are not accepted design
  until extracted into canonical architect-level or area-specific documents.

## Other Architecture Drafts

- [Dispatch Control Plane Redesign](../../proposals/dispatch-control-plane-redesign.md)
- [Doing Coordination Redesign](../../proposals/doing-coordination-redesign.md)
- [Knowledge Registry Redesign](../../proposals/knowledge-registry-redesign.md)
