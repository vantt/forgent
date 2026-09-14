# Verification: Implementation Alignment

```txt
Document type: Verification
Audience: Human reviewer, maintainer, implementation agent
Purpose: Track how far packaging-distribution implementation matches the design
Design status: Draft
Implementation status: Current evidence snapshot
Canonical: Yes, after review
Owner: Platform documentation
Source type: Code/test/doc scan
Last reviewed: 2026-09-13
Related:
- docs/platform/packaging-distribution/spec.md
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/contracts/repository-runtime-layout.md
- docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md
- docs/platform/packaging-distribution/contracts/skill-package-distribution.md
- docs/platform/packaging-distribution/verification/source-preservation-audit.md
```

## 1. Purpose

This is the tracking surface for “mức độ triển khai so với thiết kế”.

Every important packaging-distribution design claim should appear here with status, evidence, and the next gap.

## 2. Status Legend

| Status | Meaning |
| --- | --- |
| `implemented` | Code/tests currently prove the claim. |
| `partial` | Some implementation exists, but coverage, contract extraction, or release validation is incomplete. |
| `planned` | Accepted target without implementation proof. |
| `superseded` | Retained as history only. |
| `unknown` | Needs a fresh scan before use. |

## 3. Alignment Table

| Design claim | Status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| `fgctl` is the recommended install/bootstrap entry. | partial | `README.md`, `install.sh`, `test/install/install-sh.test.mjs`, `scripts/ci-external-consumer.sh`, `.github/workflows/release.yml` | Verify a current GitHub release asset path before calling the whole channel fully implemented. |
| Release tree includes native `bin/fgos`, runner shim, legacy Node payload, and manifest. | implemented | `scripts/build-rust-distribution.mjs`, `test/rust-host/release-tree.test.mjs` | Keep manifest schema contract in sync with Rust distribution implementation. |
| `artifactDigest` is manifest/tree identity, not archive checksum. | implemented | `scripts/build-rust-distribution.mjs`, `test/rust-host/release-tree.test.mjs`, `scripts/ci-external-consumer.sh` | Extract exact digest contract into a schema doc if needed. |
| Repository/workspace/release-store layout boundaries are explicit. | partial | `docs/platform/packaging-distribution/contracts/repository-runtime-layout.md`, `docs/architect/packaging-distribution/runtime-identity-and-activation.md`, `docs/architect/packaging-distribution/scope-map.md` | Verify worker capsule and projection ledger implementation before marking full. |
| `fgctl stage` verifies candidate release content before trust. | implemented | `test/rust-host/fgctl-stage.test.mjs`, `packages/distribution/rust/src/verify.rs`, `packages/distribution/rust/src/store.rs` | Add human-readable contract if external release-store docs grow. |
| Workspace activation is per-workspace through `.fgos/installation/activation.json`. | partial | `test/rust-host/fgctl-init.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs`, `scripts/ci-external-consumer.sh`, `src/setup/bin-discovery.mjs` | Extract exact activation schema before freezing contract. |
| Workspace command resolution prefers activated workspace installation before other tiers. | implemented | `src/setup/bin-discovery.mjs`, `scripts/fgos-shell-integration.sh`, `test/scripts/fgos-shell-integration.test.mjs` | Ensure any Rust/Herdr resolver keeps the same tier order. |
| Legacy npm/Node install remains compatibility path. | implemented | `package.json`, `bin/fgos.mjs`, `bin/fgos-runner.mjs`, `test/install-packaging.test.mjs`, `README.md` | Keep wording as compatibility, not target architecture. |
| `fgos doctor` default path is read-only. | implemented | `docs/specs/distribution.md`, `bin/fgos.mjs`, `test/setup/*.test.mjs` | Keep future checks from writing in check-only mode. |
| `fgos doctor --fix` runs registered fixes then reports. | implemented | `src/setup/registrations.mjs`, `bin/fgos.mjs`, `test/setup/registrations.test.mjs`, `test/setup/*.test.mjs` | Avoid copying a stale full fix list into prose. |
| `fgos setup` also runs registered fixes as legacy compatibility. | implemented legacy | `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `docs/history/setup-runs-registered-fixes/CONTEXT.md`, `test/setup/*.test.mjs` | Target architecture supersedes this with `fgctl init` plus local `fgos init`/`doctor --fix`/`doctor`; do not add new design obligations to setup. |
| Project config overrides global config. | implemented | `src/config/global-config.mjs`, `test/config/global-config.test.mjs` | Keep doctor/fix and legacy setup docs clear that global fills, project wins. |
| Instruction rules compose into a machine-readable effective instruction set before rendering. | planned | `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` | Implement instruction registry, composition engine, effective-set output, and conflict tests. |
| `AGENTS.md` is the primary portable instruction projection; host-specific instruction files are adapters only when needed. | planned | `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` | Implement projection renderer and doctor/fix stale checks before treating as shipped. |
| Canonical skill authoring is split by component/domain source. | implemented | `core/skills/`, `domains/*/skills/`, `src/setup/skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs`, `docs/architect/domainization/README.md` | Keep duplicate-name protection active as domains add skills. |
| `.agents/skills` and `.claude/skills` are generated projections, not canonical source. | implemented | `src/setup/skill-wrappers.mjs`, `scripts/build-skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` | Add projection-ledger evidence before claiming runtime-owned projection repair is complete. |
| Plugin-only consumers receive required dev skills. | implemented | `plugins/fgOS/skills/`, `test/skills/fgos-mirror.test.mjs`, `src/setup/skill-wrappers.mjs` | Keep in sync with `contracts/skill-package-distribution.md`. |
| Host-neutral skill intent ids map to host-native triggers. | planned | `docs/platform/packaging-distribution/contracts/skill-package-distribution.md` | Implement or document concrete Claude/Gemini/Codex adapter manifests before treating this as shipped. |
| Gemini receives a native extension/package target for fgOS skills. | planned | `docs/platform/packaging-distribution/contracts/skill-package-distribution.md` | Add generator, doctor/fix registration, and tests for `gemini-extension.json` plus command files. |
| Shared skill fragments cannot collide across component-owned sources. | partial | `src/setup/skill-wrappers.mjs` currently flattens shared fragments; contract defines namespaced target | Add collision tests or namespaced fragment rendering before marking implemented. |
| `fgos-code-panel` is a coding-domain application surface over coordination/group-thinking, not a group-thinking special case. | planned | `docs/platform/packaging-distribution/contracts/skill-package-distribution.md`, current source `core/skills/fgos-code-panel/` | Move canonical source to `domains/coding/skills/fgos-code-panel/` with compatibility triggers and mirror tests. |
| Packaging-distribution is the platform-support component for packaging, install, activation, and doctor/fix readiness. | partial | `docs/platform/packaging-distribution/README.md`, `docs/platform/component-boundary.md`, `docs/architect/component-boundary/component-boundary-advisory.md` | Promote the detailed component-boundary source into `docs/platform/component-boundary.md` before marking final. |
| `fgctl` never writes host-visible projections directly. | unknown | Architecture source docs | Do a focused projection materialization scan before marking this implemented. |
| Shared gateway/web remains future-only. | planned | `docs/platform/packaging-distribution/architecture/future-constraints.md` | Revisit when gateway owns a project runtime adapter. |

## 4. Fresh Scan Requirement

Before changing factual implementation claims in this area:

1. scan docs for related current/historical claims;
2. scan code/tests for current behavior;
3. update this table before promoting prose elsewhere.

When the edit promotes, retires, or contradicts a detail from older packaging-distribution sources, also update `source-preservation-audit.md`.
