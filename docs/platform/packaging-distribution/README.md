# Packaging-Distribution

```txt
Document type: Area portal
Audience: Human reviewer, maintainer, architecture collaborator, implementation agent
Purpose: Route readers through fgOS packaging, install, runtime activation, doctor/repair, and release docs
Design status: Draft
Implementation status: Implemented preview plus tracked partials
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted from docs/specs/distribution.md, docs/distribution-vision.md, and docs/architect/packaging-distribution/**
Last reviewed: 2026-09-18
Related:
- docs/platform/packaging-distribution/vision.md
- docs/platform/packaging-distribution/spec.md
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/contracts/repository-runtime-layout.md
- docs/platform/packaging-distribution/contracts/setup-doctor-registry.md
- docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md
- docs/platform/packaging-distribution/contracts/skill-package-distribution.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/platform/packaging-distribution/verification/source-preservation-audit.md
- docs/platform/packaging-distribution/code-panel-rollout-plan.md
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```

## 1. Purpose And Audience

Packaging-distribution explains how a developer obtains a trusted fgOS runtime, how that runtime is selected for a workspace, and how doctor/repair keeps the environment usable.

Use this area when the work touches:

- install channels and release artifacts;
- `fgctl` bootstrap, stage, init, upgrade, repair, or verify;
- workspace-local `.fgos/installation/` activation;
- legacy Node payload compatibility;
- `fgos doctor`, `fgos doctor --fix`, or legacy `fgos setup` compatibility;
- global/project/dev-checkout resolution;
- plugin/dev-skill packaging as a distributed surface;
- instruction composition and managed `AGENTS.md` projections;
- skill projections and host adapters for Codex/OpenAI, Claude, Gemini, or plugin-only consumers.

Do not use this area as the owner for ordinary workflow semantics after a runtime is already selected. Those belong to runner, work-state, agent coordination, host invocation, or gateway docs.

## 2. Read First

| Reader goal | Read |
| --- | --- |
| Understand the direction and why this area exists | [vision.md](vision.md) |
| Understand current user-visible behavior | [spec.md](spec.md) |
| Understand runtime identity and activation design | [architecture/runtime-identity-and-activation.md](architecture/runtime-identity-and-activation.md) |
| Understand repository/workspace/release-store layout | [contracts/repository-runtime-layout.md](contracts/repository-runtime-layout.md) |
| Verify design against implemented code/tests | [verification/implementation-alignment.md](verification/implementation-alignment.md) |
| Understand doctor/fix registry behavior and legacy setup compatibility | [contracts/setup-doctor-registry.md](contracts/setup-doctor-registry.md) |
| Understand instruction merge policy and `AGENTS.md` projection | [contracts/instruction-composition-and-projection.md](contracts/instruction-composition-and-projection.md) |
| Understand skill/plugin/extension packaging across agent hosts | [contracts/skill-package-distribution.md](contracts/skill-package-distribution.md) |
| See proof paths and test commands | [verification/install-and-release-proof.md](verification/install-and-release-proof.md) |
| See code-panel packet closeout and whole-track proof | [reports/track-closeout.md](reports/track-closeout.md) |
| Check whether legacy/history details were preserved | [verification/source-preservation-audit.md](verification/source-preservation-audit.md) |
| Coordinate implementation through code-panel packets | [code-panel-rollout-plan.md](code-panel-rollout-plan.md) |
| Understand historical context and supersession | [history/distribution-baseline.md](history/distribution-baseline.md) |

## 3. Authority And Conflict Rule

When sources disagree, read them in this order:

| Source class | Use for | Do not use for |
| --- | --- | --- |
| Architecture/vision in this area | Target direction and supersession of older vocabulary. | Claiming implementation without evidence. |
| Contracts in this area | Exact boundary and behavior promises for the target model. | Historical rationale unless linked. |
| Implementation alignment and proof docs | Whether a claim is implemented, partial, planned, legacy, or unknown. | Deciding the target direction by itself. |
| Current code/tests | What the repo does today. | Deciding that a legacy behavior remains the target. |
| Legacy specs such as `docs/specs/distribution.md` | Historical/current shipped facts during migration. | Final target vocabulary when a promoted architecture doc supersedes it. |

If current code implements behavior that target architecture has already superseded, document it as `implemented legacy` or compatibility. Do not promote it as the active design merely because it still exists in code.

Example: current Node `fgos setup` still exists, but the target architecture routes onboarding through `fgctl init` plus local `fgos init` / `fgos doctor --fix` / `fgos doctor`.

## 4. Current Position

The area has two live runtime layers:

| Layer | Status | Meaning |
| --- | --- | --- |
| Legacy Node/npm compatibility | Implemented legacy deprecated | Legacy Node fallback still exists as an explicit escape hatch for 30 calendar days after preview release publication; it is not the public/default runtime posture. |
| Native `fgctl` + project-local runtime | Implemented preview | Release tree, install script, fgctl stage/init/upgrade/repair, and `.fgos/installation` activation have real implementation and tests. The preview public posture says external installs default `fgos` through the Rust host, and public docs may state Rust host is the default installed runtime. Stable/default graduation remains a release-owner decision. |

The old `docs/specs/distribution.md` remains a useful source for implemented legacy setup, doctor, and npm compatibility details. It is not the final human navigation shape.

### 4.1 Status Tracker

| Front | Status | What is done | What remains |
| --- | --- | --- | --- |
| Code-panel rollout | `done` | P1-P9 merged to `main`; whole-track proof is recorded in [reports/track-closeout.md](reports/track-closeout.md). | No active packet remains; use the closeout's remaining partial claims as the next tracker. |
| Release tree and Rust packaging records | `implemented` | Native `bin/fgos`, runner shim, `libexec/legacy-node`, manifest schemas, `artifactDigest`, activation binding, distribution pin, and topology root binding have tests and V1 contract docs. | Keep golden/schema tests current when manifest fields evolve. |
| `fgctl` stage/init/upgrade/repair | `implemented preview` | Staging, verification, activation publish, local runtime tail, no-op upgrade, repair, published `v0.1.0` release assets, and external-consumer proof are recorded. | Stable/default release graduation remains a release-owner decision. |
| Legacy Node/npm compatibility | `implemented legacy deprecated` | Legacy npm install and `fgos setup` remain reachable as compatibility surfaces with deprecation guidance. | Retire only after the preview fallback window and release-owner policy permit it. |
| Doctor/fix registry | `implemented` | Checks, fixes, config defaults, and legacy setup compatibility use the shared registry. | Keep new infra/config assumptions registered here instead of ad hoc checks. |
| Instruction composition/projection | `implemented for current portable path` | Canonical source registry, effective-set composition, portable `AGENTS.md` managed block, effective-set JSON, projection ledger entry, and doctor/fix repair exist. | Host-specific adapter expansion remains demand-driven; wider projection ledger coverage is partial. |
| Skill packaging | `implemented partial` | Canonical skill source discovery, Codex/OpenAI and Claude projections, plugin dev-skill mirroring, duplicate/collision checks, and Gemini package prototype exist. | Public intent alias metadata, full Gemini release/install/doctor integration, and skill projection ledger coverage remain open. |
| Repository/runtime layout | `partial` | Release tree, activation, root binding, and distribution pin are frozen/proven. | Worker capsule behavior and full projection ledger coverage still need focused proof. |
| Shared gateway/runtime adapter | `planned` | Future constraints are documented. | Revisit when gateway owns a project runtime adapter. |

## 5. Ownership Boundary

Packaging-distribution owns the question:

```txt
Which fgOS runtime is selected, trusted, activated, repaired, upgraded, and
allowed to mutate this workspace?
```

It does not own:

| Concern | Owner |
| --- | --- |
| Durable work-state topology | Workspace/work-state architecture |
| Command routing inside a selected runtime | Host invocation routing |
| Collaboration pattern & Workflow behavior | Execution core / Workflow |
| Shared gateway/dashboard runtime service | Gateway architecture |
| Confinement policy semantics | Confinement authority |

## 6. Main Concepts

| Term | Meaning |
| --- | --- |
| `fgctl` | Machine/global bootstrap command. Installs, stages, verifies, activates, repairs, and upgrades fgOS runtimes. |
| local `fgos` | Workspace runtime command entered through `.fgos/installation/bin/fgos` when present. |
| release tree | Immutable runtime payload with `bin/fgos`, `bin/fgos-runner`, `libexec/legacy-node/`, and `manifest.json`. |
| repository runtime layout | Boundary between source checkout, workspace `.fgos/installation`, work-history roots, runtime-coordination roots, machine release store, worker capsules, and host-visible projections. |
| `artifactDigest` | Canonical digest of the release manifest/tree identity, not the compressed tarball checksum. |
| activation binding | Workspace-local `.fgos/installation/activation.json` selecting the active release. |
| legacy Node payload | Compatibility payload under `libexec/legacy-node/`, still carrying existing Node CLI behavior. |
| doctor/fix registry | Open registry of checks, fixes, and config defaults used by `fgos doctor` and `fgos doctor --fix`; current legacy `fgos setup` also consumes it until retired. |
| effective instruction set | Machine-readable composed rules after authority, specificity, override, and conflict policy are resolved. |
| instruction projection | Generated host/workspace instruction file such as root or scoped `AGENTS.md`; host-specific files exist only as adapters when needed. |
| skill adapter projection | Generated host-specific skill surface, such as `.agents/skills`, `.claude/skills`, plugin skills, or a future Gemini extension package. |

## 7. Component Boundary Impact

Packaging-distribution owns a platform-support component in the whole-system boundary map:

| Boundary question | Answer |
| --- | --- |
| Component affected | `Packaging-Distribution` / former `Setup, Doctor, And Distribution Health` |
| Parent layer | Platform support |
| Authority owned | Runtime packaging, install, activation, upgrade/repair, doctor/fix readiness |
| Authority not owned | Work lifecycle, agent coordination, selected-runtime command routing, shared gateway semantics, confinement policy semantics |
| Boundary anchor | `docs/platform/component-boundary.md` |
| Current detailed source | `docs/architect/component-boundary/component-boundary-advisory.md` |

This area rewrite changes the boundary map by naming `Packaging-Distribution` as the active area/component name and by keeping doctor/fix readiness as a contract inside that component rather than a separate top-level area.

## 8. Implementation Alignment

Any maintained doc in this area that states a design claim must identify its implementation status:

| Status | Meaning |
| --- | --- |
| `implemented` | Code/tests currently prove the claim. |
| `partial` | Some implementation exists, but contract, coverage, or release path is incomplete. |
| `planned` | Accepted target without current implementation proof. |
| `superseded` | Historical claim retained only for context. |
| `unknown` | Needs a fresh scan before use. |

The active tracking table lives in `verification/implementation-alignment.md`.

## 9. Migration Notes

The old sources are preserved during migration:

- `docs/specs/distribution.md` remains the legacy/generated-curated spec source.
- `docs/distribution-vision.md` is promoted into `vision.md`; the old path remains historical source material until redirected.
- `docs/architect/packaging-distribution/**` now carries historical redirect/status notes; read it only as discussion-derived source context.

Old paths keep their bodies for source preservation, but the active navigation
surface is this platform area.

## 10. Related Files

| Relationship | File |
| --- | --- |
| area vision | [vision.md](vision.md) |
| current behavior | [spec.md](spec.md) |
| runtime architecture | [architecture/runtime-identity-and-activation.md](architecture/runtime-identity-and-activation.md) |
| repository/runtime layout contract | [contracts/repository-runtime-layout.md](contracts/repository-runtime-layout.md) |
| doctor/fix registry contract | [contracts/setup-doctor-registry.md](contracts/setup-doctor-registry.md) |
| instruction projection contract | [contracts/instruction-composition-and-projection.md](contracts/instruction-composition-and-projection.md) |
| skill packaging contract | [contracts/skill-package-distribution.md](contracts/skill-package-distribution.md) |
| implementation evidence | [verification/implementation-alignment.md](verification/implementation-alignment.md) |
| proof commands | [verification/install-and-release-proof.md](verification/install-and-release-proof.md) |
| code-panel closeout | [reports/track-closeout.md](reports/track-closeout.md) |
| preservation audit | [verification/source-preservation-audit.md](verification/source-preservation-audit.md) |
| code-panel rollout plan | [code-panel-rollout-plan.md](code-panel-rollout-plan.md) |
| historical source | [history/distribution-baseline.md](history/distribution-baseline.md) |
| platform boundary map | [../../architect/component-boundary/README.md](../../architect/component-boundary/README.md) |


## Retained Readme Source Detail

Added in candidate — complete source units from `docs/architect/packaging-distribution/README.md` at `77830ba77eb05991d95b005919776ee6254e833b`. Source design, dated status and obligations are preserved here; this carriage does not certify current implementation. Relative links retain their destination.

### Packaging And Distribution Architecture

```txt
Legacy status: Promoted architecture source
Promoted to: docs/platform/packaging-distribution/README.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy folder for: Source rationale until redirects are finalized
Do not use this legacy folder for: Current canonical navigation
Last reviewed: 2026-09-13
```

> Status: historical redirect. The active packaging-distribution portal is
> [docs/platform/packaging-distribution/README.md](README.md).
> Keep this file only as discussion-era source context; do not add new target
> claims here.

**Status:** Historical architecture discussion package.
**Date:** 2026-09-04.
**Canonical source now:** [docs/platform/packaging-distribution/README.md](README.md).
**Historical draft superseded by:** [Runtime Identity And Activation](architecture/runtime-identity-and-activation.md).

This folder preserved the discussion that shaped the promoted fgOS
packaging/distribution mechanism. The promoted delivery target is not shared
web/gateway. The promoted target is a correct
project-local runtime model that can support:

- `fgctl` as global/machine bootstrap and control;
- local `fgos` as project workflow authority;
- Rust `fgos` CLI distribution;
- legacy Node compatibility payload;
- project-local version safety;
- skills, agents, prose, docs, runner, init/doctor, and projections as part of
  one runtime identity story.

#### 1. Historical Read Order

For current work, start at
[docs/platform/packaging-distribution/README.md](README.md).
The older discussion order was:

1. [Workspace Topology Architecture](../../architect/workspace-topology.md) — root topology,
   state classes, worktree behavior, workspace activation binding, work-state
   writer compatibility, projection scope, locks, and dirty-tree rules.
2. [Promoted Runtime Identity And Activation](architecture/runtime-identity-and-activation.md)
   — active promoted runtime architecture and first implementation target.
3. [Promoted Future Constraints](architecture/future-constraints.md)
   — shared web/gateway, Project Runtime Adapter, and MCP/substrate constraints
   that packaging must not block, but does not deliver now.
4. [Distribution Baseline And Scattered Spec Fragments](../../architect/packaging-distribution/history/distribution-baseline.md)
   — old Node/npm distribution baseline and generated-spec fragments preserved
   as input/history.

The older generated specs under `docs/specs/*` are not edited during this
architecture churn. Once the design settles, update their generated source or
owning workflow and regenerate/check the spec projections.

#### 2. Historical Supersession Table

| Topic | Active source to follow | Status |
|---|---|---|
| Runtime/workspace/work-state topology | [Workspace Topology Architecture](../../architect/workspace-topology.md) | Active architecture target. Supersedes any simpler "one project root / one runtime root" reading. Packaging must not own physical placement for config/event/coordination roots. |
| Release identity and activation | [Promoted Runtime Identity And Activation](architecture/runtime-identity-and-activation.md) | Active architecture target. Uses per-workspace activation binding, not one repository-wide `active.json`. |
| Shared gateway/web | [Promoted Future Constraints](architecture/future-constraints.md) | Future constraint only; not active delivery scope. |
| Old npm/global/setup install story | [Distribution Baseline And Scattered Spec Fragments](../../architect/packaging-distribution/history/distribution-baseline.md) | Historical input. Do not implement as target without explicit supersession. |
| `docs/specs/*` distribution wording | Generated specs | Read as current generated state plus historical constraints; not the target while this architecture stream is active. |

#### 3. Boundary Rule

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

#### 4. Vocabulary

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

#### 5. Historical Design Position

The promoted architecture position captured from this discussion is:

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
that implementation is outside the active delivery scope.

#### 6. Do Not Collapse These Boundaries

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

#### 7. Historical Delivery Spine

The first walking skeleton target captured here was promoted into the platform
proof docs:

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
