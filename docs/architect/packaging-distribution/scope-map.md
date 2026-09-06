# Packaging Distribution Scope Map

**Status:** Architecture discussion map.
**Date:** 2026-09-04.
**Purpose:** Separate the many concerns currently being discussed under
packaging/distribution so the new mechanism can be designed without collapsing
unrelated authority boundaries into one installer story.

Packaging distribution is not one component. It cuts across bootstrap,
runtime payload, project semantics, host surfaces, state authority, skill/prose
materialization, runner autonomy, Rust migration, and product packaging
cleanliness.

This document maps those concerns to the architecture documents that should own
or reference them.

## 1. Concern Map

| Concern | Core Question | Primary Architecture Home | Notes |
|---|---|---|---|
| Global bootstrap/control | What can the machine-level command install, repair, upgrade, or start? | `packaging-distribution/README.md` | `fgctl` owns bootstrap and machine services. It must not own project workflow semantics. |
| Project-local runtime payload | What exactly is installed into a project and how is it identified? | `packaging-distribution/README.md` | Includes CLI, host/runtime, legacy Node payload, Rust artifacts, runner, adapter, skills, agents, prose, docs, manifest, ledger. |
| Workspace/runtime/work-state topology | How do worktrees share release content and work-state authority without forcing one active runtime or dirtying/racing each other? | `../workspace-topology.md` | Critical for coding-domain worktree isolation. Release store, workspace activation, work-state coordination, and projections have different scopes. |
| Runtime identity records | How does a project prove which fgOS runtime it is running? | `runtime-identity-and-activation.md` | Central contract for version safety, activation, drift detection, downgrade refusal, rollback, and provider identity. |
| Init/doctor/repair | Which layer may create workspace state, materialize projections, repair config, or repair runtime files? | `packaging-distribution/README.md` | Public `setup` concept is removed. `fgctl init/repair/upgrade` may change runtime identity; local `fgos init` and `fgos doctor --fix` operate under the installed identity. |
| Host-visible skills/agents/prose | Where does canonical workshop material live, and how does the host discover it? | `packaging-distribution/README.md`, `component-boundary/README.md` | Canonical source belongs to the local runtime payload; host-visible files are projections with ownership/fingerprint records. |
| Shared web dashboard | Is the web UI one shared surface or one per project? | `future-constraints.md`, later gateway/herdr architecture | Architecture constraint only for now; not current delivery scope. |
| Shared gateway front door | Is the gateway shared or per-project? | `future-constraints.md`, later gateway architecture | Architecture constraint only for now; not current delivery scope. |
| Project Runtime Adapter | Who translates stable web/chat command context into local project semantics? | `future-constraints.md`, `host-invocation-routing/*`, `component-boundary/README.md` | Adapter is versioned with the local project payload. Design enough now so packaging can carry it later; do not implement shared gateway/web now. |
| Host invocation/provider routing | How does a selected payload route an operation to Rust, legacy Node, runner, plugin, or external provider? | `host-invocation-routing/*` | Distribution selects the payload/adapter first; host invocation routes inside that payload. |
| Runner/autonomy payload | Which runner version drives a project? | `packaging-distribution/README.md`, runner architecture/spec later | A runner that mutates project state must come from the selected project's local payload/version. |
| Global daemon/MCP substrate | Which services may be global without owning project semantics? | `future-constraints.md`, later gateway/substrate architecture | Allowed direction: project registry, read-model cache, event/signal/mailbox/bus, process supervision. Not all fgOS verbs as MCP. |
| Rust host release | What artifact shape is needed before Rust becomes the installed public `fgos` entry? | `host-invocation-routing/*`, `packaging-distribution/README.md` | Rust R1 requires install/upgrade/rollback, compatibility payload placement, and payload identity. |
| fgOS self-development cleanliness | How does fgOS dogfood itself without dirtying the product package surface? | `packaging-distribution/README.md`, possibly later self-hosting note | This is a special case of local workshop files coexisting with product source in the same workspace. |
| Coexistence with other harnesses | How does install avoid overwriting another tool's hooks/skills/host files? | `packaging-distribution/README.md`, `component-boundary/README.md` | Preserve D-ADR0009: detect, yield, and require explicit ownership before writing shared host-visible paths. |

## 2. Recommended Document Split

The architecture should not stay as one large narrative forever. The minimal
split should be:

```txt
docs/architect/
  workspace-topology.md
    repository/workspace/work-state identities, state classes, modes,
    operation-to-root matrix, lifecycle/failure modes, dirty-tree rules

docs/architect/packaging-distribution/
  README.md
    discussion spine and current target model

  scope-map.md
    this file; concern map and document routing

  runtime-identity-and-activation.md
    immutable release manifest, workspace activation binding, pin, projection
    ledger, migration journal outline, invocation lease, drift, rollback,
    quarantine

  future-constraints.md
    future shared web/gateway constraint, Project Runtime Adapter,
    out-of-process protocol, global substrate boundary

  history/distribution-baseline.md
    old Node/npm baseline and generated-spec fragments preserved as input

future optional splits, only when they outgrow runtime identity:
  fgctl-and-local-fgos-contract.md
  workshop-materialization.md
```

[Workspace Topology Architecture](../workspace-topology.md) must be read before
runtime identity, because packaging consumes topology rather than owning it.
[Runtime Identity And Activation](./runtime-identity-and-activation.md) is the
first packaging-specific contract draft. Gateway/web itself is not current
delivery scope; its constraints live in [Future Constraints](./future-constraints.md).

## 3. Boundary Rule

Use this rule to decide whether a detail belongs in packaging/distribution:

```txt
If the detail affects which fgOS payload is selected, trusted, materialized,
started, repaired, upgraded, or allowed to mutate a project, it belongs in
packaging/distribution.
```

Use this rule to decide whether it belongs elsewhere:

```txt
If the detail assumes the correct local payload is already selected, then it
probably belongs in host invocation, runner, work-state, agent coordination,
domainization, or gateway architecture instead.
```

Examples:

- "Where is `.fgos/runtime/bin/fgos` installed?" belongs to distribution.
- "Which provider handles `work.pick` after the local payload is selected?"
  belongs to host invocation/provider routing.
- "Can shared gateway accept a remote chat command for a project?" belongs to
  gateway/host surface later. For now, distribution only records the boundary
  so local payload shape does not make that impossible.
- "How does shared gateway translate that command into this project's semantic
  verb?" belongs to Project Runtime Adapter, currently recorded under
  distribution because it affects package shape.
- "Which event schema version is valid for this project?" belongs to
  work-state semantically, but distribution must record which local payload
  owns that schema.
- "Where do generated `.agents/skills` files come from?" belongs to
  workshop materialization under distribution.

## 4. Current Architecture Position

The current direction is:

```txt
fgctl
  machine/global bootstrap and service control

shared web/dashboard
  future one human-visible surface for many projects
  not current delivery scope

shared gateway front door
  future stable remote/chat/UI command contract and project selection
  not current delivery scope

Project Runtime Adapter
  versioned with each project-local fgOS payload
  translates shared UI command context into local project semantics

project-local fgOS payload
  owns workflow semantics, state schema, runner version, skills/prose,
  doctor/init behavior, and provider routing for that project
```

The unresolved future deployment question is behind the shared gateway:

```txt
shared gateway front door
  -> per-request local process
  -> per-project worker process
  -> future project-local daemon
```

That execution choice should remain open until payload identity, adapter
contract, and repair semantics are clearer. Current delivery should focus on
project-local packaging/distribution and Rust `fgos` CLI correctness.

## 5. Activation Boundary

The immediate design should name this lifecycle explicitly:

```txt
acquire artifact
  -> stage immutable release in shared release store
  -> verify release manifest
  -> prepare workspace with candidate runtime
  -> publish ready workspace activation binding atomically
  -> allow project-state mutation
```

No project workflow command should run from a payload that has not crossed the
activation boundary. `fgctl` owns acquisition, staging, verification,
workspace binding publication, repair, upgrade, rollback, and quarantine.
Local `fgos` owns project semantics only after this workspace has a ready
activation binding and the runtime is write-compatible with the selected
work-state root.
