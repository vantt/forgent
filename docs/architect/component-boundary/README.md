# Component Boundary Architecture

This folder collects vision-level architecture notes about how fgOS should name,
separate, and eventually place its high-level components.

These documents are not implementation plans. They are refactoring compass
documents: use them to keep new slices moving toward clearer boundaries without
forcing a large rebuild before the system proves the need.

## 1. How To Read This Folder

Read boundary before layout:

1. [Component Boundary Advisory](./component-boundary-advisory.md)
2. [Repo Layout Vision](./repo-layout-vision.md)
3. [Node To Rust Component Migration](./node-to-rust-component-migration.md)

The first document answers:

```txt
What components exist?
What responsibility does each component own?
Where are the bounded contexts?
Which component has authority over each state transition or decision?
Which behavior must stay domain-specific instead of moving into foundation?
```

The second document answers:

```txt
Where should those components live physically in the repo?
Which code should be a thin app entrypoint?
Which code should become a reusable package?
Which current paths are historical placement rather than architectural ownership?
```

The third document answers:

```txt
How can one component at a time move from Node to Rust?
Which parts of fgos are already thin, partly thin, or not thin yet?
How does fgos keep the same CLI and envelope while implementation changes?
Which Rust boundary should be preferred first: binary, service, or direct lib?
When does implementation movement become authority movement?
```

Do not invert that order. Folder layout should express component boundaries; it
should not create authority by convenience of file location.

## 2. Documents

### Component Boundary Advisory

[component-boundary-advisory.md](./component-boundary-advisory.md) is the
vision document for component responsibility, bounded context, and authority
boundary.

It asks whether current and planned Agent Coordination work is split at the
right conceptual boundaries: Work Lifecycle, Agent Coordination, Dispatch And
Execution, Run Result Evaluation, Domain Components, Host Surfaces, and the
additional boundaries already visible in code.

Use this document when deciding:

- whether a behavior belongs in foundation or a domain;
- whether Coding Domain is owning enough of its coding-specific behavior;
- whether Work Lifecycle remains domain-agnostic;
- whether Dispatch, RunResult evaluation, workflow driving, and domain harnesses
  are overlapping;
- whether a future refactor is clarifying an authority boundary or merely moving
  files.

### Repo Layout Vision

[repo-layout-vision.md](./repo-layout-vision.md) is the vision document for
physical source layout.

It describes the `apps/` plus `packages/` direction: apps are thin entrypoints
and packages hold reusable implementation logic. Its current concrete scope is
the Rust/web `herdr-plugin` split. The Node side is explicitly left for later
discussion.

Use this document when deciding:

- where a component should live once its boundary is agreed;
- whether a binary should be a thin app or a logic-owning package;
- how existing Rust gateway, MCP, TUI, port, and web-dashboard code should be
  separated physically;
- what mechanical blast radius a later layout refactor is likely to touch.

### Node To Rust Component Migration

[node-to-rust-component-migration.md](./node-to-rust-component-migration.md)
records the migration shape for replacing current Node harness internals with
Rust components one boundary at a time while preserving the existing `fgos`
surface.

Use this document when deciding:

- whether a Rust implementation should sit behind a Node facade;
- which `fgos` verb clusters should be thinned in Node before Rust migration;
- whether the first Rust boundary should be a binary, service, or direct
  library binding;
- how to preserve `fgos` CLI, envelope, error, and lifecycle contracts during a
  gradual migration;
- whether a proposed Rust slice is only moving implementation or is also trying
  to move authority.

## 3. Relationship Between The Two

`component-boundary-advisory.md` defines the conceptual map.
`repo-layout-vision.md` defines a possible physical map.

They are related but not interchangeable:

- a component boundary can exist before files move;
- a folder can contain implementation history that does not define ownership;
- some discovered boundaries may become subcomponents instead of top-level
  packages;
- coding-specific repository integration should be discussed as a subcomponent
  of Coding Domain Core, not as a generic foundation package;
- layout refactors should happen only after the component authority is clear.

## 4. Current Status

This folder is advisory. It can guide Step 08 Agent Coordination work and later
repo-layout cleanup, but canonical contracts still live under their owning
architecture, contract, spec, or ADR documents.

When a decision becomes settled, extract the stable fact into the appropriate
canonical document instead of treating this folder as the source of truth.

## 5. External Review Links

Use these outside documents as review material while shaping component
boundaries. They are not part of this folder's source-of-truth chain unless a
settled decision is later extracted into the owning canonical document.

### Canonical Architecture And Specs

- [Architecture Map](../../architecture-map.md) — structure/physics/authority
  map, component registry, and contract registry.
- [System Overview](../../specs/system-overview.md) — area map, shared
  entities, actors, and cross-area flows.
- [Platform Foundations](../../platform-foundations.md) — locked platform laws
  and durability/DoD doctrine.
- [Work Item Lifecycle Vision](../../work-item-lifecycle-vision.md) — base
  workflow and coding-specific lifecycle mapping.
- [Distribution Vision](../../distribution-vision.md) — install/setup/doctor
  direction and config/default registration posture.

### Agent Coordination Architecture

- [Agent Coordination Portal](../agent-coordination/README.md) — reading entry
  for the current accepted Agent Coordination architecture set.
- [Agent Coordination Foundation Vision](../agent-coordination/vision.md) —
  foundation/domain split, runtime contracts, and small-core constraints.
- [System Context](../agent-coordination/architecture/system-context.md) —
  boundaries, runtime profiles, and trust boundaries.
- [Runtime Model](../agent-coordination/architecture/runtime-model.md) —
  assignment execution chain, invariants, and failure domains.
- [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md)
  — executor/provider/model/tier/mechanism governance boundary.
- [Evidence And Results](../agent-coordination/architecture/evidence-and-results.md)
  — RunResult confidence and evidence boundary.
- [Work Integration](../agent-coordination/architecture/work-integration.md) —
  Work lifecycle integration boundary.
