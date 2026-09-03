# Component Boundary Architecture

This folder collects vision-level architecture notes about how fgOS should name,
separate, and eventually place its high-level components across the whole
system.

These documents are not implementation plans. They are refactoring compass
documents: use them to keep slices moving toward clearer boundaries without
forcing a large rebuild.

The scope is all of forgentX: Work Lifecycle, domain components,
dispatch/execution, result evaluation, host surfaces, setup/doctor/distribution,
gateway/Herdr, learning, and runtime implementation boundaries.

For the domain-specific split itself, read
[Domainization Architecture](../domainization/README.md). This folder keeps the
whole-system component map; domainization is the deep dive for the Domain
Components And Extension Layer.

## 1. How To Read This Folder

Read boundary before layout:

1. [Component Boundary Advisory](./component-boundary-advisory.md)
2. [Repo Layout Vision](./repo-layout-vision.md)
3. [Host Invocation And Provider Routing](./host-invocation-provider-routing.md)
4. [Node To Rust Component Migration](./node-to-rust-component-migration.md)

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
Which source paths are placement, not architectural ownership?
```

The third document answers:

```txt
How do CLI and remote host use cases enter the same semantic operation path?
How does one router select built-in, legacy, process-plugin, or WASM providers?
Where do provider discovery, capability grants, and failure normalization live?
```

The fourth document answers:

```txt
How can one component at a time move from Node to Rust?
Which parts of fgos are already thin, partly thin, or not thin yet?
How does fgos keep the same CLI and envelope while implementation changes?
How does the Rust host delegate whole operations to the legacy Node provider?
When does implementation movement become authority movement?
```

Do not invert that order. Folder layout should express component boundaries; it
should not create authority by convenience of file location.

## 2. Documents

### Component Boundary Advisory

[component-boundary-advisory.md](./component-boundary-advisory.md) is the
vision document for component responsibility, bounded context, and authority
boundary.

It asks whether fgOS is split at the right conceptual boundaries: Work
Lifecycle, Agent Coordination, Dispatch And Execution, Run Result Evaluation,
Domain Components, Host Surfaces, setup/doctor/distribution, gateway/Herdr,
learning, and the additional boundaries already visible in code.

Use this document when deciding:

- whether a behavior belongs in foundation or a domain;
- whether Coding Domain is owning enough of its coding-specific behavior;
- whether Work Lifecycle remains domain-agnostic;
- whether Dispatch, RunResult evaluation, workflow driving, and domain harnesses
  are overlapping;
- whether a refactor is clarifying an authority boundary or merely moving
  files.

For folder-level domain authoring shape, domain registry/workflow files,
domain-scoped doctrine, task-spec placement, skill/agent authoring sources, and
domain-siloing enforcement, use
[Domainization Architecture](../domainization/README.md).

### Repo Layout Vision

[repo-layout-vision.md](./repo-layout-vision.md) is the vision document for
physical source layout.

It describes the `apps/` plus `packages/` direction: apps are thin entrypoints
and packages hold reusable implementation logic. Its concrete scope is the
Rust/web `herdr-plugin` split. The Node side is outside this document.

Use this document when deciding:

- where a component should live once its boundary is agreed;
- whether a binary should be a thin app or a logic-owning package;
- how existing Rust gateway, MCP, TUI, port, and web-dashboard code should be
  separated physically;
- what mechanical blast radius a layout refactor is likely to touch.

### Host Invocation And Provider Routing

[host-invocation-provider-routing.md](./host-invocation-provider-routing.md)
defines the shared host invocation path and the Operation Provider Router.

Use this document when deciding:

- how `cli-host-use-case` and `remote-host-use-case` remain peer entry paths;
- where CLI/REST/MCP input becomes a transport-neutral semantic operation;
- how one operation selects a built-in, legacy, process, or WASM provider;
- how external plugins declare operations and requested capabilities;
- which layer owns authority checks, provider lifecycle, and error projection.

### Node To Rust Component Migration

[node-to-rust-component-migration.md](./node-to-rust-component-migration.md)
records the migration shape for replacing Node harness internals with
Rust components one boundary at a time while preserving the existing `fgos`
surface.

Use this document when deciding:

- how the Rust CLI delegates unmigrated operations to the legacy Node provider;
- which `fgos` verb clusters are ready to become native Rust providers;
- how to avoid double parsing and split transactions during migration;
- how to preserve `fgos` CLI, envelope, error, and lifecycle contracts during a
  gradual migration;
- when a Node implementation and rollback path can be removed.

## 3. Relationship Between These Documents

`component-boundary-advisory.md` defines the conceptual map.
`repo-layout-vision.md` defines a possible physical map.
`host-invocation-provider-routing.md` defines the host/provider invocation map.
`node-to-rust-component-migration.md` defines an implementation migration map
from the legacy Node provider to built-in Rust providers.

They are related but not interchangeable:

- a component boundary can exist before files move;
- source placement can reflect old implementation choices instead of ownership;
- some discovered boundaries may become subcomponents instead of top-level
  packages;
- coding-specific repository integration should be discussed as a subcomponent
  of Coding Domain Core, not as a generic foundation package;
- runtime-language migration should happen behind component contracts, not by
  treating a Node file or Rust crate as authority;
- layout refactors should happen only after the component authority is clear.

## 4. Current Status

This folder is advisory. It can guide repo-layout cleanup, component
extraction, and authority-boundary review across fgOS, but canonical contracts
still live under their owning architecture, contract, spec, or ADR documents.

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
- [Domainization Architecture](../domainization/README.md) — core vs domain
  authoring, resolver, doctrine, workflow, skill, task-spec, knowledge, and
  agent boundaries.

### Related Agent Coordination Contracts

- [Agent Coordination Portal](../agent-coordination/README.md) — reading entry
  for the Agent Coordination architecture set.
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
