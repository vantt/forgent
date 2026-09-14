# Packaging-Distribution

```txt
Document type: Area portal
Audience: Human reviewer, maintainer, architecture collaborator, implementation agent
Purpose: Route readers through fgOS packaging, install, runtime activation, doctor/repair, and release docs
Design status: Draft
Implementation status: Partial
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted from docs/specs/distribution.md, docs/distribution-vision.md, and docs/architect/packaging-distribution/**
Last reviewed: 2026-09-13
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

The area has two live layers:

| Layer | Status | Meaning |
| --- | --- | --- |
| Legacy Node/npm compatibility | Implemented | `fgos` and `fgos-runner` still exist through the Node payload and npm/git install path. |
| Native `fgctl` + project-local runtime | Partial | Release tree, install script, fgctl stage/init/upgrade/repair, and `.fgos/installation` activation have real implementation and tests, but the docs must still label incomplete design claims explicitly. |

The old `docs/specs/distribution.md` remains a useful source for implemented legacy setup, doctor, and npm compatibility details. It is not the final human navigation shape.

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
| Agent coordination protocol behavior | Agent coordination |
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
