# Architect-Level Design

Document type: Index
Design status: Discussion
Implementation: Partial
Last reviewed: 2026-09-02

This directory holds architecture-wide intention and redesign documents whose
scope crosses one component area. Area-specific canonical documents still live
inside their own subtrees, such as `agent-coordination/` and
`component-boundary/`.

## Cross-Area Intentions

- [Architecture Intent](architecture-intent.md) preserves architecture-wide
  design intent across deferred capabilities. Its first active thread covers
  widening fgOS from strict fan-out/fan-in and artifact-mediated coordination
  toward richer group-thinking/problem-solving capability, while keeping
  isolation-heavy fixtures intact.

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
