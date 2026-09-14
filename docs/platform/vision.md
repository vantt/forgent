# Platform Vision

```txt
Document type: Platform vision
Audience: Human reviewer, architect, maintainer, agent
Purpose: State the whole-platform mission, direction, and non-scope for fgOS
Design status: Draft
Implementation status: Partial
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted anchor from platform foundations, work-item lifecycle vision, and mission decisions
Last reviewed: 2026-09-13
Related:
- docs/platform/README.md
- docs/platform/platform-foundations.md
- docs/work-item-lifecycle-vision.md
- docs/platform-foundations.md
```

## 1. Purpose

fgOS exists to make agent applications and business-base workflows faster, safer, more reusable, and less dependent on a human sitting in the loop.

This document is the whole-platform north star. Area visions, such as `docs/platform/packaging-distribution/vision.md`, should align with it.

The companion [intent-preservation-ledger.md](intent-preservation-ledger.md)
tracks parts of this direction that are only partially implemented or
deliberately deferred. A simplified implementation slice does not shrink this
vision unless an explicit decision says so.

## 2. Mission

fgOS exists to:

- develop other projects;
- run business-base workflows;
- provide reusable platform infrastructure for agent applications.

fgOS does not exist primarily to develop itself. Dogfooding inside this repo is necessary, but it is not the mission.

## 3. Product Priority

When trade-offs collide, use this order:

1. Ship faster for projects using fgOS.
2. Release humans from waiting, babysitting, and repetitive coordination.
3. Produce reproducibly verifiable results with evidence-linked documentation.
4. Polish after the definition of done is satisfied.

Lower priorities do not override higher priorities.

## 4. Operating Shape

The platform direction is:

```txt
human intent
  -> durable work/state
  -> domain-aware shaping and planning
  -> governed agent execution
  -> verifiable result
  -> retained learning
```

Humans should stay present for judgment, review, and direction. They should not need to manually preserve every useful design point or monitor every execution step.

## 5. Design Commitments

- Keep boundaries clear: component ownership, contract authority, and state writes must be explicit.
- Keep docs useful to humans: reading paths, implementation status, proof, and related links are part of system quality.
- Prefer extensible registries and contracts over hidden one-off behavior.
- Treat generated docs as projections, not new authority.
- Keep work restartable by a stranger agent with no chat history.

## 6. Related Anchors

| Need | Read |
| --- | --- |
| Preserved platform intent | [intent-preservation-ledger.md](intent-preservation-ledger.md) |
| Platform laws | [platform-foundations.md](platform-foundations.md) |
| Whole-system architecture | [architecture-map.md](architecture-map.md) |
| Component authority map | [component-boundary.md](component-boundary.md) |
| Documentation governance | [../doc-governance.md](../doc-governance.md) |
| Legacy full law source | [../platform-foundations.md](../platform-foundations.md) |
