# Component boundary source carriage (historical)

```txt
Document type: History
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve the literal component-boundary source units relocated from the earlier component-boundary document
Design status: Archived
Implementation: Historical source metadata; no current implementation assertion
Provenance: docs/architect/component-boundary/README.md at 69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539 and docs/architect/component-boundary/repo-layout-vision.md at 69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539
Writer type: Agent
Canonical for: Nothing; non-canonical conservation carrier
Use this when: Reviewing the retained component-boundary source text
Do not use this for: Current component-boundary authority or implementation claims
Last reviewed: No current review date recorded; retained source dates are historical
Related:
- docs/platform/README.md
- docs/platform/system-architecture/history/component-boundary-source-carriage.md#component-boundary-source-carriage-historical
Supersedes: None; no legacy source is edited
Superseded by: None
```

Literal source units relocated from `docs/platform/component-boundary.md`.
No current authority or implementation claim. Original headings, source-relative
links and retired names below are preserved as historical evidence, not live routes.

## README source carriage

Carriage from `docs/architect/component-boundary/README.md` at `69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539`; heading depth and live routes adapted to this holder. Full source text follows, with heading levels and physical link destinations adjusted only. Source metadata is provenance; this section makes no new implementation or authority claim.

### Component Boundary Architecture

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
[Domainization Architecture](../../domainization/architecture/domainization.md). This folder keeps the
whole-system component map; domainization is the deep dive for the Domain
Components And Extension Layer.

#### 1. How To Read This Folder

Read boundary before layout:

1. [Component Boundary Advisory](../../component-boundary.md)
2. [Repo Layout Vision](component-boundary-source-carriage.md#repo-layout-vision-apps-and-packages)
3. [Host Invocation And Provider Routing](../../host-invocation-routing/spec.md)
4. [Node To Rust Component Migration](../../host-invocation-routing/architecture/node-to-rust-migration.md)
5. [Packaging And Distribution Architecture](../../packaging-distribution/README.md)

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

The fifth document answers:

```txt
How is the project-local fgOS runtime payload selected, installed, verified,
repaired, and upgraded?
Where is the boundary between global bootstrap, shared web/gateway, project
runtime adapter, and local project fgOS semantics?
How do skills, agents, prose, runner, legacy Node payload, Rust host, and docs
fit into one distributable payload identity?
```

Do not invert that order. Folder layout should express component boundaries; it
should not create authority by convenience of file location.

#### 2. Documents

##### Component Boundary Advisory

[component-boundary.md](../../component-boundary.md) is the
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

For folder-level domain authoring shape, domain manifest/workflow files,
domain-scoped doctrine, task-spec placement, skill/agent authoring sources, and
domain-siloing enforcement, use
[Domainization Architecture](../../domainization/architecture/domainization.md).

##### Repo Layout Vision

[component-boundary.md](component-boundary-source-carriage.md#repo-layout-vision-apps-and-packages) is the vision document for
physical source layout.

It describes the `apps/` plus `packages/` direction: apps are thin entrypoints
and packages hold reusable implementation logic. Its concrete scope is the
Rust/web split of the former `herdr-plugin/` package (now `apps/fgos-gateway/`, `herdr-dashboard/` and `packages/herdr-fgos-common/rust/`; see its status note). The Node side is outside this document.

Use this document when deciding:

- where a component should live once its boundary is agreed;
- whether a binary should be a thin app or a logic-owning package;
- how existing Rust gateway, MCP, TUI, port, and web-dashboard code should be
  separated physically;
- what mechanical blast radius a layout refactor is likely to touch.

##### Host Invocation And Provider Routing

[spec.md](../../host-invocation-routing/spec.md)
defines the shared host invocation path and the Operation Provider Router.

Use this document when deciding:

- how `cli-host-use-case` and `remote-host-use-case` remain peer entry paths;
- where CLI/REST/MCP input becomes a transport-neutral semantic operation;
- how one operation selects a built-in, legacy, process, or WASM provider;
- how external plugins declare operations and requested capabilities;
- which layer owns authority checks, provider lifecycle, and error projection.

##### Node To Rust Component Migration

[node-to-rust-migration.md](../../host-invocation-routing/architecture/node-to-rust-migration.md)
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

#### 3. Relationship Between These Documents

`component-boundary-advisory.md` defines the conceptual map.
`repo-layout-vision.md` defines a possible physical map.
`host-invocation-provider-routing.md` defines the host/provider invocation map.
`node-to-rust-component-migration.md` defines an implementation migration map
from the legacy Node provider to built-in Rust providers.
`packaging-distribution/README.md` defines the emerging install/runtime
authority map that keeps global machine services separate from project-local
fgOS semantic authority.

They are related but not interchangeable:

- a component boundary can exist before files move;
- source placement can reflect old implementation choices instead of ownership;
- some discovered boundaries may become subcomponents instead of top-level
  packages;
- coding-specific repository integration should be discussed as a subcomponent
  of Coding Domain Core, not as a generic foundation package;
- runtime-language migration should happen behind component contracts, not by
  treating a Node file or Rust crate as authority;
- shared web/gateway can aggregate many projects, but must delegate mutating
  project semantics through the selected project's local runtime adapter and
  payload;
- global bootstrap/control and project workflow authority are different
  components: `fgctl` installs/manages; local `fgos` drives workspace
  semantics;
- layout refactors should happen only after the component authority is clear.

#### 4. Current Status

This folder is advisory. It can guide repo-layout cleanup, component
extraction, and authority-boundary review across fgOS, but canonical contracts
still live under their owning architecture, contract, spec, or ADR documents.

When a decision becomes settled, extract the stable fact into the appropriate
canonical document instead of treating this folder as the source of truth.

#### 5. External Review Links

Use these outside documents as review material while shaping component
boundaries. They are not part of this folder's source-of-truth chain unless a
settled decision is later extracted into the owning canonical document.

##### Canonical Architecture And Specs

- [Architecture Map](../../architecture-map.md) — structure/physics/authority
  map, component registry, and contract registry.
- [System Overview](../../system-overview/spec.md) — area map, shared
  entities, actors, and cross-area flows.
- [Platform Foundations](../../platform-foundations.md) — locked platform laws
  and durability/DoD doctrine.
- [Work Item Lifecycle Vision](../../vision.md) — base
  workflow and coding-specific lifecycle mapping.
- [Distribution Vision](../../packaging-distribution/history/distribution-vision.md) — install/setup/doctor
  direction and config/default registration posture.
- [Domainization Architecture](../../domainization/architecture/domainization.md) — core vs domain
  authoring, resolver, doctrine, workflow, skill, task-spec, knowledge, and
  agent boundaries.

##### Related Agent Coordination Contracts

- [Agent Coordination Portal](../../agent-coordination/README.md) — reading entry
  for the Agent Coordination architecture set.
- [Agent Coordination Foundation Vision](../../agent-coordination/vision.md) —
  foundation/domain split, runtime contracts, and small-core constraints.
- [System Context](../../agent-coordination/history/retired-engine/legacy/architecture/system-context.md) —
  boundaries, runtime profiles, and trust boundaries.
- [Runtime Model](../../agent-coordination/architecture/runtime-model.md) —
  assignment execution chain, invariants, and failure domains.
- [Dispatch Control Plane](../../agent-coordination/architecture/dispatch-control-plane.md)
  — executor/provider/model/tier/mechanism governance boundary.
- [Evidence And Results](../../agent-coordination/architecture/evidence-and-results.md)
  — RunResult confidence and evidence boundary.
- [Work Integration](../../agent-coordination/architecture/work-integration.md) —
  Work lifecycle integration boundary.

## repo-layout-vision source carriage

Carriage from `docs/architect/component-boundary/repo-layout-vision.md` at `69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539`; heading depth and live routes adapted to this holder. Full source text follows, with heading levels and physical link destinations adjusted only. Source metadata is provenance; this section makes no new implementation or authority claim.

### Repo Layout Vision: Apps And Packages

**Status:** Vision / direction, not a locked platform law and not a full spec.
**Date:** 2026-08-26.
**Source:** Product-owner direction.

This document records a physical repo-layout direction for separating thin
entrypoints from reusable implementation packages. It does not change runtime
behavior by itself.

The locked target in this document is the Rust/web slice around
`herdr-plugin/`. The Node side is intentionally left for a later discussion.

#### Implementation Status (2026-10-04)

A smaller slice of this vision is implemented. It is a pure move and rename,
with no change to behavior:

- the gateway is `apps/fgos-gateway/` (crate and binary `fgos-gateway`, no
  `gateway` argument); it keeps `gateway.rs`, `mcp.rs`, `cf_access.rs`,
  `remote_invocation.rs`, `web/` and the embedded `static/` together instead of
  the `packages/gateway`, `packages/mcp` and `packages/web-dashboard` split;
- the herdr plugin stays one crate at `herdr-dashboard/` (renamed from
  `herdr-plugin/`; binary `herdr-dashboard`, manifest `herdr-plugin.toml`)
  instead of `apps/herdr-tui` plus `packages/herdr-core` and
  `packages/herdr-ui`;
- the shared fgos CLI adapter, settings and `WorkItemSource` port are
  `packages/herdr-fgos-common/rust/`, standing in for `packages/fgos-ports`;
  the gateway's `VerbGateway` port moved next to its only users in the gateway
  crate;
- both Rust crates stay outside the root Cargo workspace with their own lock
  file and `target/`, because herdr loads the plugin binary from
  `$HERDR_PLUGIN_ROOT/target/release/`.

The finer `packages/*` split below remains the long-term direction and is not
yet done.

#### 1. Decision Summary

Move the current single `herdr-plugin/` package shape toward:

```txt
apps/       thin binaries and entrypoints
packages/   reusable implementation libraries
```

For the Rust/web slice:

- split the current `herdr-fgos` binary into two binaries with names that match
  their default behavior: `apps/gateway` and `apps/herdr-tui`;
- move real gateway, MCP, cockpit, UI, fgos-port, and web-dashboard logic into
  `packages/*`;
- keep the web dashboard served by the gateway from an embedded static bundle;
- keep `apps/*` thin: each app wires packages together and starts one runtime.

#### 2. Current Problem

`herdr-plugin/` is currently one Cargo package named `herdr-fgos`, with one
lib/bin shape serving two launch modes:

- no argument: TUI mode;
- `gateway` argument: daemon REST/MCP/web mode.

The current launch path confirms the mismatch:

```txt
src/runner/gateway-control.mjs:295
spawn(binaryPath, ['gateway'])
```

The binary name does not describe its default behavior, and gateway mode is a
separate launch path hidden behind an argument.

The code already has a cleaner hexagonal boundary than the folder layout shows:

- `ports.rs` defines the important ports: `WorkItemSource`, `PaneRegistry`,
  `PaneOrchestrator`, `VerbGateway`, and `TerminalUi`;
- `gateway.rs` and `mcp.rs` depend on `VerbGateway`, not on TUI internals;
- gateway logic is already separate from `app.rs`, `ui.rs`, `layout.rs`,
  `pane_scan.rs`, and `pick.rs`;
- the gateway already hosts static web assets through `rust_embed`.

The layout should make those existing boundaries visible.

#### 3. Target Layout

Scope of this target tree: Rust plus web only. Node packages are not decided in
this document.

```txt
forgentX/
  Cargo.toml
    # workspace members:
    # - apps/gateway
    # - apps/herdr-tui
    # - packages/gateway
    # - packages/mcp
    # - packages/herdr-core
    # - packages/herdr-ui
    # - packages/fgos-ports

  apps/
    gateway/
      Cargo.toml
      build.rs
      src/main.rs
      static/

    herdr-tui/
      Cargo.toml
      src/main.rs

  packages/
    gateway/
    mcp/
    herdr-core/
    herdr-ui/
    fgos-ports/
    web-dashboard/
```

#### 4. App Boundaries

`apps/gateway` is a thin binary:

- wires `packages/gateway` and `packages/mcp`;
- starts the Axum server;
- serves embedded static files from `static/`;
- runs as gateway by default, without a `gateway` argument.

`apps/herdr-tui` is a thin binary:

- wires `packages/herdr-core` and `packages/herdr-ui`;
- starts the terminal dashboard loop;
- runs as TUI by default.

App packages should not own reusable domain logic. They assemble ports,
adapters, config, and runtime startup.

#### 5. Package Boundaries

`packages/gateway`

- owns REST route handlers and gateway-specific middleware;
- includes `cf_access.rs` for now;
- mounts web serving behavior but does not own the web-dashboard source.

`packages/mcp`

- owns the MCP surface;
- is mounted by `apps/gateway` into the same Axum process;
- keeps the current "same process" contract.

`packages/herdr-core`

- owns cockpit application state and operation-pane logic;
- includes `app.rs`, `layout.rs`, `pane_scan.rs`, and `pick.rs`;
- keeps pane scanning and pick logic together unless a clearer split emerges.

`packages/herdr-ui`

- owns terminal rendering;
- keeps crossterm/TUI drawing separate from cockpit domain state.

`packages/fgos-ports`

- owns shared ports and the fgos CLI adapter;
- includes `ports.rs`, `fgos.rs`, and shared settings;
- is the place where gateway and TUI agree on their boundary to fgOS.

`packages/web-dashboard`

- owns the Vite/TypeScript/React/Tailwind dashboard source;
- is not a Cargo crate;
- builds into `apps/gateway/static` for embedding and serving.

#### 6. Execution Blast Radius

The following edits would be mechanical when this vision is implemented:

- `src/runner/gateway-control.mjs:240`: update the compiled binary path to the
  new `apps/gateway` binary;
- `src/runner/gateway-control.mjs:273`: change the release build command from
  `cargo build --release --bin herdr-fgos` to the new gateway package target;
- `src/runner/gateway-control.mjs:295`: remove the extra `gateway` argument
  from the spawned process;
- `herdr-plugin/web/package.json`: change the bundle output from `../static`
  to `../../apps/gateway/static`;
- `herdr-plugin.toml`: update any binary or package path assumptions;
- docs, tests, CI, and setup references to `herdr-plugin/`: update paths where
  they describe the physical layout;
- upstream Herdr plugin integration: update any path that loads the TUI binary.

This list describes known blast radius, not a complete implementation plan.

#### 7. Out Of Scope For This Document

The Node side is deliberately not designed here:

- `packages/core`;
- `packages/config`;
- `packages/state`;
- `packages/shared`;
- `packages/orchestrator`;
- the thin-entry location for Node CLI/orchestrator binaries.

`packages/orchestrator` is reserved vocabulary. It must continue to match the
existing fgOS meaning: the T0 composition layer around dispatch/runner. It must
not be confused with the unrelated Rust setting name `herdr_orchestrator`.

#### 8. Open Questions

- Should Node thin entries stay under root `bin/`, or move under an `apps/cli`
  shape when the Node side is designed?
- Should `cf_access.rs` remain inside `packages/gateway`, or become a separate
  `packages/cf-access` package if another consumer appears?
- Should `pane_scan.rs` and `pick.rs` remain inside `packages/herdr-core`, or
  split later if cockpit-core becomes too broad?
