# Vision: Packaging-Distribution

```txt
Document type: Vision
Audience: Human reviewer, maintainer, architect, implementation agent
Purpose: State the living direction for fgOS packaging, install, doctor/fix readiness, and runtime activation
Design status: Draft
Implementation status: Partial
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted and reconciled from docs/distribution-vision.md
Last reviewed: 2026-09-13
Related:
- docs/platform/packaging-distribution/README.md
- docs/platform/packaging-distribution/spec.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/distribution-vision.md
```

## 1. Purpose

Packaging-distribution exists so fgOS can be reused outside its own source repo without making humans babysit install, runtime selection, or environment repair.

This vision is the north star for the area. Current behavior belongs in `spec.md`; exact contracts belong in `contracts/`; proof belongs in `verification/`.

## 2. Direction

The area should make this true:

```txt
A developer can install or activate fgOS for a project, trust which runtime is
selected, repair common environment drift automatically, and verify the result
without cloning or understanding the fgOS source repo internals.
```

## 3. Living Pillars

| Pillar | Direction | Current status |
| --- | --- | --- |
| Install without cloning | Users should obtain `fgctl`/`fgos` without manually cloning the source repo. | Partial: `install.sh`, release assets, and legacy npm/git install paths exist. |
| Project-local runtime safety | A workspace should use its selected runtime, not an accidental global `PATH` binary. | Partial: workspace activation and tier-zero resolution exist; schema/contracts still need hardening. |
| Global/project/dev contexts coexist | Global install, project-local install, and dev-checkout self-hosting must not break each other. | Implemented/partial: resolver tiers and config precedence exist; continue guarding drift. |
| Doctor/fix self-repair | Environment readiness should be repairable through named fixes, not just reported. | Implemented for the current registry model. |
| Extensible readiness/config registry | New modules should register checks, fixes, and config defaults through the shared registry. | Implemented; avoid ad hoc setup logic. |
| Composable agent instructions | Rules should originate under the authority that owns them, compose into an effective instruction set, and render to `AGENTS.md` or host adapters without semantic drift. | Partial: source registry and composition engine are implemented; projection rendering and health checks remain planned. |
| Portable skill distribution | A skill should be authored once under the owning component/domain and rendered into host-native adapter surfaces. | Partial: Codex/OpenAI, Claude wrapper, and plugin skill projections exist; Gemini extension target is planned. |
| CI as install/readiness confidence | CI/release proof should catch install/distribution failures before users do. | Partial: CI/release workflows and external-consumer proof exist; keep expanding with release promises. |
| Human-readable trust | Humans should be able to read docs and know what is implemented, partial, planned, or historical. | Implemented in the new docs through `Implementation Alignment`; must be maintained. |

## 4. Mission Boundary

Packaging-distribution is not an installer side quest. It is a platform capability:

- it lets fgOS serve other projects;
- it reduces environment friction;
- it prevents invisible runtime drift;
- it gives maintainers a repair path;
- it lets reviewers verify install/runtime claims.

It should optimize for the project using fgOS, not only for convenience while developing fgOS itself.

## 5. Strategic Shape

The intended shape is:

```txt
fgctl
  installs / stages / verifies / activates / upgrades / repairs runtime identity

workspace-local fgos
  runs workflow semantics under the selected runtime

doctor / doctor --fix
  reports or repairs readiness under the active runtime through shared registries

canonical instructions
  compose by authority/specificity before rendering to AGENTS.md or adapters

canonical skills
  live under component/domain authority and render into host adapters
```

This keeps bootstrap authority, runtime identity, workflow semantics, and environment repair legible.

## 6. Superseded Vision Notes

The source document `docs/distribution-vision.md` recorded several things as not yet implemented on 2026-08-01. Some are now done or partially done:

| Old concern | Current reading |
| --- | --- |
| `doctor --fix` was deferred | Superseded; `doctor --fix` exists through registered fixes. |
| Doctor checks were a fixed list | Superseded; checks/fixes/defaults use registries. |
| Global/project precedence was not designed | Superseded/implemented; project config wins and awareness checks exist. |
| CI workflow was absent | Superseded/partial; CI/release workflows and external-consumer proof exist. |
| Dev-checkout/global shadowing needed handling | Partly addressed through resolver tiering; continue verifying shell and runtime paths. |

## 7. What Must Stay True

- Install and activation failures should be explicit and repair-oriented.
- Doctor/fix paths must not silently mutate runtime identity.
- A release identity must be content-based, not path-based.
- Compatibility paths may exist, but docs must label them as compatibility when they are no longer the target architecture.
- Every new packaging-distribution claim must update `verification/implementation-alignment.md`.

## 8. Related Docs

| Need | Read |
| --- | --- |
| Current behavior | `spec.md` |
| Runtime design | `architecture/runtime-identity-and-activation.md` |
| fgctl/local fgos boundary | `architecture/fgctl-and-local-fgos.md` |
| Doctor/fix registry and legacy setup compatibility | `contracts/setup-doctor-registry.md` |
| Implementation status | `verification/implementation-alignment.md` |
| Historical baseline | `history/distribution-baseline.md` |
