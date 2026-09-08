# Packaging And Distribution Architecture

**Status:** Architecture discussion package.
**Date:** 2026-09-04.
**Canonical V1 contract draft:** [Runtime Identity And Activation](./runtime-identity-and-activation.md).

This folder designs the new fgOS packaging/distribution mechanism. The current
delivery target is not shared web/gateway. The current target is a correct
project-local runtime model that can support:

- `fgctl` as global/machine bootstrap and control;
- local `fgos` as project workflow authority;
- Rust `fgos` CLI distribution;
- legacy Node compatibility payload;
- project-local version safety;
- skills, agents, prose, docs, runner, init/doctor, and projections as part of
  one runtime identity story.

## 1. Read Order

Read in this order:

1. [Workspace Topology Architecture](../workspace-topology.md) — root topology,
   state classes, worktree behavior, workspace activation binding, work-state
   writer compatibility, projection scope, locks, and dirty-tree rules.
2. [Runtime Identity And Activation](./runtime-identity-and-activation.md) —
   canonical V1 contract draft and first implementation target.
3. [Future Constraints](./future-constraints.md) — shared web/gateway, Project
   Runtime Adapter, and MCP/substrate constraints that packaging must not
   block, but does not deliver now.
4. [Distribution Baseline And Scattered Spec Fragments](./history/distribution-baseline.md)
   — old Node/npm distribution baseline and generated-spec fragments preserved
   as input/history.

The older generated specs under `docs/specs/*` are not edited during this
architecture churn. Once the design settles, update their generated source or
owning workflow and regenerate/check the spec projections.

## 2. Status / Supersession Table

| Topic | Current Source To Follow | Status |
|---|---|---|
| Runtime/workspace/work-state topology | [Workspace Topology Architecture](../workspace-topology.md) | Current architecture target. Supersedes any simpler "one project root / one runtime root" reading. Packaging must not own physical placement for config/event/coordination roots. |
| Release identity and activation | [Runtime Identity And Activation](./runtime-identity-and-activation.md) | Current architecture target. Uses per-workspace activation binding, not one repository-wide `active.json`. |
| Shared gateway/web | [Future Constraints](./future-constraints.md) | Future constraint only; not current delivery scope. |
| Old npm/global/setup install story | [Distribution Baseline And Scattered Spec Fragments](./history/distribution-baseline.md) | Historical input. Do not implement as target without explicit supersession. |
| `docs/specs/*` distribution wording | Generated specs | Read as current generated state plus historical constraints; not the target while this architecture stream is active. |

## 3. Boundary Rule

Use this rule to decide whether a detail belongs in packaging/distribution:

```txt
If the detail affects which fgOS runtime is selected, trusted, activated,
materialized, repaired, upgraded, or allowed to mutate a project, it belongs in
packaging/distribution.
```

Use this rule to route details elsewhere:

```txt
If the detail assumes the correct local runtime is already selected, then it
probably belongs in host invocation, runner, work-state, agent coordination,
domainization, or gateway architecture instead.
```

## 4. Vocabulary

| Term | Meaning |
|---|---|
| `fgctl` | Global/machine bootstrap and control command. Installs, stages, verifies, activates, repairs, upgrades, and later may control machine services. It does not own project workflow semantics. |
| local `fgos` | Project-local workflow/runtime command entered through the workspace installation shim, normally `.fgos/installation/bin/fgos`. Owns project semantics after an active runtime is selected. |
| release store root | Shared content-addressed machine/trust-domain store for immutable releases, installs, install lock, and quarantine. Multiple repositories may share one artifact by digest. |
| workspace installation root | Ignored per-workspace area for activation binding, stable shims, root binding, and projection ledger. |
| work-state root | Authoritative fgOS work-state home for durable workflow history. Its physical placement is owned by workspace topology / work-state architecture, not packaging. |
| workspace root | Checkout/worktree where fgOS drives work and where branch-local config/pin/projections are relative. |
| release | Immutable fgOS runtime payload under the release store root. |
| release tree manifest | Canonical logical file-tree manifest for a release. Its digest is the runtime artifact identity. |
| `artifactDigest` | Digest of the canonical release tree manifest, not an archive digest. |
| stable shim | Thin executable under `.fgos/installation/bin/` that reads active runtime identity and execs the active release entry. |
| activation binding | Per-workspace durable ready pointer, currently `activation.json`, written by `fgctl` after candidate runtime is prepared. |
| pin | Git-tracked project policy that says which fgOS runtime version/digest/channel the project wants. |
| projection ledger | Record of host-visible generated files such as `.agents/skills`, `.claude/skills`, or managed instruction blocks. |

## 5. Current Design Position

The current architecture position is:

```txt
fgctl
  -> acquire/stage/verify release into shared release store
  -> prepare workspace installation capsule
  -> install stable local shims
  -> publish per-workspace activation binding
  -> invoke active local fgos init / doctor --fix / doctor for projection/config repair

local fgos
  -> read workspace activation binding
  -> lease workspace/work-state/runtime identity
  -> enforce state-schema compatibility
  -> run project workflow semantics
  -> materialize projections through init/doctor --fix

release payload
  -> Rust host or Node host
  -> legacy Node compatibility payload when needed
  -> fgos-runner
  -> skills, agents, prose, docs
  -> init/doctor registries
```

Shared web/gateway remains a future constraint: the packaging model must not
make it impossible for one dashboard/gateway to serve many projects later, but
that implementation is outside the current delivery scope.

## 6. Do Not Collapse These Boundaries

| Boundary | Reason |
|---|---|
| `fgctl` vs local `fgos` | Machine bootstrap/service control is not project workflow authority. |
| release store root vs workspace installation root vs work-state root vs workspace root | Git worktrees share release content and explicitly bound work-state/coordination, but each workspace has its own branch-local policy, activation binding, projections, and dirty-tree surface. |
| tracked pin vs machine-local workspace activation | Team/project desired version must travel with the branch/repo; the ready activation binding is local to the workspace. |
| immutable release vs mutable project state | Release files are verified/quarantined; state/events/config/logs are runtime data. |
| stable shim vs active release entry | Callers need a stable path; active release may change atomically. |
| release manifest vs workspace activation binding vs projection ledger | Release identity, local ready binding, and host-visible generated files have different mutability and owners. |
| install/repair vs doctor fix | `fgctl` may change runtime identity; local `fgos doctor --fix` repairs only under the active identity. |
| distribution selection vs provider routing | Distribution selects the trusted runtime; Host Invocation routes inside that selected runtime. |

## 7. Current Delivery Spine

The first walking skeleton should prove:

```txt
fgctl obtains a release payload
fgctl stages it under the shared release store
fgctl verifies ReleaseManifest
fgctl prepares workspace installation capsule
fgctl atomically publishes workspace activation.json as ready
fgctl ensures stable local shim exists
.fgos/installation/bin/fgos version --runtime-json reports workspace + work-state + runtime identity
```

This can use the existing Node `fgos` payload first. Rust `fgctl` can arrive
before Rust replaces the local `fgos` host. That ships project-local version
safety earlier and lets the Rust host swap into the same release tree later.
