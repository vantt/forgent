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

- [Architect Roadmap](roadmap.md) keeps the high-level sequencing and delivery
  plan across active architecture streams: agent coordination, coding domain,
  component boundary, host invocation, Node-to-Rust migration, and packaging
  distribution.
- [Architecture Intent](architecture-intent.md) preserves architecture-wide
  design intent across deferred capabilities. Its first active thread covers
  widening fgOS from strict fan-out/fan-in and artifact-mediated coordination
  toward richer group-thinking/problem-solving capability, while keeping
  isolation-heavy fixtures intact.
- [System Vision: Trong Mem Ngoai Cung](system-vision-trong-mem-ngoai-cung.md)
  records the cross-system direction that fgOS must combine hard outer
  contracts with soft inner soul/prose/skill, so architecture slices do not
  become either unverifiable prose or rigid harness without living operating
  intelligence.
- [Workspace Topology Architecture](workspace-topology.md) defines
  repository/workspace/work-state/runtime identities, state classes, root
  ownership, worktree mode invariants, and mutation topology used by
  packaging, work-state, coding-domain, coordination, and config/init/doctor.
  Read this contract before packaging activation, work-state relocation,
  coding-domain worktree changes, or runtime coordination changes.
- [Workspace Topology Audit](workspace-topology-audit.md) records current
  codebase evidence and gaps behind the topology contract.
- [Workspace Topology Roadmap](workspace-topology-roadmap.md) sequences the
  decisions and migration slices needed to make the contract enforceable.

## Area Portals

- [Agent Coordination](agent-coordination/README.md)
- [Component Boundary](component-boundary/README.md)
- [Domainization](domainization/README.md)
- [Host Invocation And Provider Routing](host-invocation-routing/host-invocation-provider-routing.md)
- [Packaging And Distribution](packaging-distribution/README.md)

## Cross-Area Proposals

- [Architect-Level Proposals](proposals/README.md) holds discussion drafts
  whose scope crosses one architecture area. These are not accepted design
  until extracted into canonical architect-level or area-specific documents.

## Other Architecture Drafts

- [Dispatch Control Plane Redesign](dispatch-control-plane-redesign.md)
- [Doing Coordination Redesign](doing-coordination-redesign.md)
- [Knowledge Registry Redesign](knowledge-registry-redesign.md)
