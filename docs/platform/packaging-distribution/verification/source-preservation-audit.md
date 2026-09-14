# Verification: Source Preservation Audit

```txt
Document type: Verification
Audience: Human reviewer, maintainer, implementation agent
Purpose: Track whether legacy and history packaging-distribution details were preserved during promotion into platform docs
Design status: Draft
Implementation status: Current evidence snapshot
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Audit of docs/specs/distribution.md, docs/distribution-vision.md, docs/architect/packaging-distribution/**, and docs/platform/packaging-distribution/**
Last reviewed: 2026-09-14
Related:
- docs/platform/packaging-distribution/README.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/platform/packaging-distribution/contracts/repository-runtime-layout.md
```

## 1. Purpose

This audit prevents the packaging-distribution rewrite from losing settled design detail.

Each old or discussion-derived fact must land in exactly one place:

- a current platform contract, architecture doc, spec, or verification table;
- a history file that clearly says the fact is retained as context only;
- an implementation gap with a named follow-up;
- an explicit superseded note.

Do not delete or redirect old packaging-distribution sources until the relevant rows below are resolved.

## 2. Source Corpus

| Source | Role in this audit |
| --- | --- |
| `docs/specs/distribution.md` | Current/legacy shipped behavior for npm, setup, doctor, config, and CLI exposure. |
| `docs/distribution-vision.md` | Original install/setup/doctor direction and rationale. |
| `docs/architect/packaging-distribution/README.md` | Discussion-era portal and target outline. |
| `docs/architect/packaging-distribution/scope-map.md` | Concern map, ownership boundaries, and split plan. |
| `docs/architect/packaging-distribution/runtime-identity-and-activation.md` | Runtime identity, activation, release-store, layout, and command vocabulary target. |
| `docs/architect/packaging-distribution/future-constraints.md` | Shared gateway and future packaging constraints. |
| `docs/architect/packaging-distribution/history/distribution-baseline.md` | Legacy distribution baseline and supersession reminders. |
| `docs/architect/packaging-distribution/workspace-runtime-model.md` | Redirect to workspace topology and runtime activation split. |
| `docs/architect/packaging-distribution/migration-map.md` | Planned promotion map and implementation evidence checklist. |
| `docs/architect/packaging-distribution/rewrite-plan.md` | Rewrite sequencing and doc-shape intent. |
| `docs/platform/packaging-distribution/**` | Current promoted platform area. |
| `docs/architect/host-invocation-routing/host-invocation-provider-routing.md` | Cross-area touchpoint for command vocabulary and routing ownership. |

## 3. Preservation Matrix

| Detail to preserve | Original source | Current preserved location | Status | Gap / next action |
| --- | --- | --- | --- | --- |
| Packaging-distribution is the owner for install, release, activation, upgrade/repair, and doctor/fix readiness. | `scope-map.md`, `migration-map.md`, component-boundary advisory | `README.md` section 5 and 7; `verification/implementation-alignment.md` | preserved partial | Promote the detailed component-boundary source into `docs/platform/component-boundary.md`. |
| Old and new sources need an explicit authority order. | Gap found during this rewrite | `README.md` section 3 | preserved | Keep this rule when old paths receive redirects/status notes. |
| Current code may implement legacy behavior even after target architecture supersedes it. | `runtime-identity-and-activation.md`, `migration-map.md`, `docs/specs/distribution.md` | `README.md` section 3; `verification/implementation-alignment.md` | preserved | Maintain `implemented legacy` status for compatibility behavior such as `fgos setup`. |
| Target onboarding vocabulary has no separate `fgos setup` verb. | `runtime-identity-and-activation.md`, host-invocation routing doc | `architecture/runtime-identity-and-activation.md`; `contracts/setup-doctor-registry.md`; `spec.md`; host-invocation routing now points back here | preserved | When retiring legacy setup, update command registry docs and tests in the same phase. |
| `fgctl init`, `fgctl repair`, and `fgctl upgrade` publish a ready binding, then invoke the active local runtime tail. | `runtime-identity-and-activation.md` | `architecture/runtime-identity-and-activation.md`; `contracts/setup-doctor-registry.md`; `architecture/fgctl-and-local-fgos.md` | preserved partial | Implementation should prove the exact tail: local `fgos init`, `fgos doctor --fix`, then `fgos doctor`. |
| Local `fgos init` owns workspace adoption and host-visible projections after activation. | `runtime-identity-and-activation.md` | `architecture/runtime-identity-and-activation.md`; `contracts/projection-ledger.md`; `contracts/instruction-composition-and-projection.md` | preserved planned | Do a focused projection materialization scan before claiming implementation. |
| Repository, workspace, work-history, runtime-coordination, release-store, worker capsule, and host-projection roots must stay separate. | `runtime-identity-and-activation.md`, `scope-map.md` | `contracts/repository-runtime-layout.md`; `verification/implementation-alignment.md` | preserved partial | Verify worker capsule and projection ledger implementation before marking full. |
| Workspace `.fgos/config.json` is tracked workspace policy; global config fills only missing values. | `docs/specs/distribution.md`, `docs/distribution-vision.md`, `migration-map.md` | `spec.md`; `contracts/setup-doctor-registry.md`; `verification/implementation-alignment.md` | preserved implemented | Keep any future Rust or Node config writer from reversing precedence. |
| Workspace `.fgos/distribution.json` is the tracked team/project runtime pin. | `runtime-identity-and-activation.md`, `scope-map.md` | `contracts/distribution-pin.md`; `contracts/repository-runtime-layout.md` | preserved implemented | Exact schema frozen at V1 with golden tests in `packages/distribution/rust/tests/schema_golden.rs`. |
| Workspace `.fgos/installation/activation.json` is the ignored per-workspace ready binding. | `runtime-identity-and-activation.md`, `migration-map.md` | `contracts/activation-binding.md`; `contracts/repository-runtime-layout.md`; `verification/implementation-alignment.md` | preserved implemented | Exact schema extracted and frozen at V1 with golden tests in `packages/distribution/rust/tests/schema_golden.rs`. |
| Stable local shims live under `.fgos/installation/bin/`. | `runtime-identity-and-activation.md` | `contracts/repository-runtime-layout.md`; `architecture/runtime-identity-and-activation.md` | preserved partial | Confirm shell helper and Rust init agree on path and repair semantics. |
| Machine release store contains immutable release trees, install records, lock, and quarantine. | `runtime-identity-and-activation.md` | `contracts/repository-runtime-layout.md`; `architecture/runtime-identity-and-activation.md` | preserved partial | Add exact release-store path encoding once `TopologyContext` is frozen. |
| Release manifest identity is `artifactDigest`, not archive checksum. | `runtime-identity-and-activation.md`, `migration-map.md` | `contracts/release-manifest.md`; `verification/implementation-alignment.md` | preserved implemented | Exact schema frozen at V1 with golden tests in `packages/distribution/rust/tests/schema_golden.rs`. |
| Release tree includes native binary entrypoints and `libexec/legacy-node/`. | `runtime-identity-and-activation.md`, `migration-map.md` | `contracts/release-manifest.md`; `spec.md`; `verification/implementation-alignment.md` | preserved implemented | Keep `components.legacyNode.root` and `components.legacyNode.entry` as the only legacy payload locator. |
| Release/stage safety rejects symlink, escape, corrupt digest, and unsafe extraction cases. | `runtime-identity-and-activation.md` | `contracts/release-manifest.md`; `verification/install-and-release-proof.md` | preserved implemented | Keep proof tests with release tree changes. |
| npm/Node install remains a compatibility channel, not target architecture. | `docs/specs/distribution.md`, `history/distribution-baseline.md` | `history/distribution-baseline.md`; `spec.md`; `verification/implementation-alignment.md` | preserved implemented | Avoid adding new target obligations to global npm `bin.fgos`. |
| Package allowlist, end-user docs packaging, no lifecycle install script, and dev checkout helper remain traceable. | `docs/specs/distribution.md`, `history/distribution-baseline.md` | `history/distribution-baseline.md`; `spec.md`; `verification/install-and-release-proof.md` | preserved | Recheck `package.json` allowlist before release packaging changes. |
| `fgos doctor` default path is read-only. | `docs/specs/distribution.md`, `docs/distribution-vision.md` | `contracts/setup-doctor-registry.md`; `verification/implementation-alignment.md` | preserved implemented | Keep new doctor checks from writing in check-only mode. |
| `fgos doctor --fix` runs registered fixes and reports. | `docs/specs/distribution.md`, `docs/distribution-vision.md` | `contracts/setup-doctor-registry.md`; `verification/implementation-alignment.md` | preserved implemented | Avoid stale prose lists of every check/fix; point to registry evidence. |
| Legacy `fgos setup` runs registered fixes. | `docs/specs/distribution.md`, setup history note | `contracts/setup-doctor-registry.md`; `verification/implementation-alignment.md`; `history/distribution-baseline.md` | preserved implemented legacy | Retire only after replacement path has equivalent proof. |
| Adding config defaults, env assumptions, or infra dependencies must register with doctor/fix. | `docs/distribution-vision.md`, repo `AGENTS.md` | `contracts/setup-doctor-registry.md`; `vision.md` | preserved | Keep this as a packaging-distribution DoD gate. |
| Canonical skill source lives under component/domain authority; host skill folders are projections/adapters. | Current skill-source scan and distribution discussion | `contracts/skill-package-distribution.md`; `verification/implementation-alignment.md` | preserved implemented | Executable source discovery, duplicate checks (skill names, canonical intent IDs, and derived host command paths/triggers), shared-fragment collision protection, and precise adapter target classification implemented in P2; Gemini CLI extension adapter target and legacy trigger compatibility mapping remain partial. |
| `fgos-code-panel` is a coding-domain application surface over coordination/group-thinking, not a group-thinking special case. | Current design discussion | `domains/coding/skills/fgos-code-panel/`; `contracts/skill-package-distribution.md`; `verification/implementation-alignment.md` | preserved implemented | Proved by moving canonical source to `domains/coding/skills/fgos-code-panel/` and retaining host-visible projections. |
| `AGENTS.md` is the portable instruction projection; Claude/Gemini/Codex-specific files are adapters when host features require them. | Current design discussion | `contracts/instruction-composition-and-projection.md`; `verification/implementation-alignment.md` | preserved planned | Implement instruction source registry, effective-set renderer, and stale projection checks. |
| Merge policy is the hard logic; renderer syntax is host-adapter technology. | Current design discussion | `contracts/instruction-composition-and-projection.md` | preserved planned | Add conflict tests for authority, specificity, and ordered effect. |
| Shared gateway, shared projection service, and remote runtime provider remain future constraints, not current implementation claims. | `future-constraints.md` | `architecture/future-constraints.md`; `verification/implementation-alignment.md` | preserved planned | Revisit only when gateway grows runtime-adapter authority. |

## 4. Open Preservation Gaps

| Gap | Why it matters | Proposed owner |
| --- | --- | --- |
| Worker capsule layout and worktree projection behavior need an implementation scan. | Future code-panel/fanout worktrees must not race shared runtime or projection state. | Packaging-distribution plus workspace topology. |
| Projection ledger implementation evidence is incomplete. | Generated host files must be repairable and conflict-aware. | Packaging-distribution projection contract. |
| Legacy architecture docs still contain stale setup vocabulary in historical context. | Readers may confuse old current-state prose with target architecture. | Documentation migration phase. |
| `docs/platform/component-boundary.md` still needs the detailed Packaging-Distribution boundary promotion. | Area authority should not depend only on an advisory source. | Component-boundary doc owner. |

## 5. Future Promotion Rule

Every future packaging-distribution doc edit should update one of these audit surfaces:

- `verification/implementation-alignment.md` when implementation status changes;
- this file when a legacy/history/source detail is promoted, superseded, or found missing;
- `history/distribution-baseline.md` when a legacy fact remains useful but no longer belongs in target design;
- the exact contract doc when a shape or boundary is frozen.

This is intentionally stricter than ordinary prose editing. The component has enough old sources that undocumented promotion is the main risk.

## 6. Phase Isolation Rule

After this preservation audit, each implementation phase for packaging-distribution must run on its own branch/worktree.

That includes:

- moving `fgos-code-panel` into the coding domain;
- implementing instruction composition or projection renderers;
- changing skill distribution layout;
- changing `fgctl`, release-store, activation, setup, doctor, or legacy setup behavior.

The main checkout may be used to read, audit, and coordinate. It must not be the mutation workspace for the next implementation phase.
