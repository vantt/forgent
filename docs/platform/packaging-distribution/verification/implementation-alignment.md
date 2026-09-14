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
Last reviewed: 2026-09-15
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
| Release tree includes native `bin/fgos`, runner shim, legacy Node payload, and manifest. | implemented | `scripts/build-rust-distribution.mjs`, `test/rust-host/release-tree.test.mjs`, `packages/distribution/rust/src/manifest.rs`, `packages/distribution/rust/tests/schema_golden.rs` | Frozen V1 schema in `contracts/release-manifest.md` with legacyNode locator invariant and golden tests. |
| `artifactDigest` is manifest/tree identity, not archive checksum. | implemented | `scripts/build-rust-distribution.mjs`, `test/rust-host/release-tree.test.mjs`, `scripts/ci-external-consumer.sh` | Extract exact digest contract into a schema doc if needed. |
| Repository/workspace/release-store layout boundaries are explicit. | partial | `docs/platform/packaging-distribution/contracts/repository-runtime-layout.md`, `docs/architect/packaging-distribution/runtime-identity-and-activation.md`, `docs/architect/packaging-distribution/scope-map.md` | Verify worker capsule and projection ledger implementation before marking full. |
| Workspace root binding snapshot lives under `.fgos/installation/root.json`. | implemented | `packages/distribution/rust/src/init.rs`, `packages/distribution/rust/tests/schema_golden.rs`, `test/rust-host/fgctl-init.test.mjs` | Frozen V1 schema in `contracts/repository-runtime-layout.md` with golden tests. |
| Workspace `.fgos/distribution.json` is the tracked runtime pin. | implemented | `packages/distribution/rust/src/init.rs`, `packages/distribution/rust/tests/schema_golden.rs`, `test/rust-host/fgctl-init.test.mjs`, `docs/platform/packaging-distribution/contracts/distribution-pin.md` | Frozen V1 schema in `contracts/distribution-pin.md` with golden tests. |
| `fgctl stage` verifies candidate release content before trust. | implemented | `packages/distribution/rust/src/verify.rs` (`verify_release_files`, `verify_legacy_node`), `packages/distribution/rust/src/store.rs`, `apps/fgos/src/legacy_exec.rs`, `test/rust-host/fgctl-stage.test.mjs`, `apps/fgos/tests/cli_tests.rs` (commits 19000200, 3b3a95fc) | Staging, preflight, and host admission enforce `verify_release_files` and `verify_legacy_node`, refusing symlink components (files and intermediate directories), path traversal, and payload digest mismatches before trust/execution. |
| Workspace activation is per-workspace through `.fgos/installation/activation.json`. | implemented | `packages/distribution/rust/src/init.rs`, `packages/distribution/rust/tests/schema_golden.rs`, `test/rust-host/fgctl-init.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs`, `src/setup/bin-discovery.mjs` | Frozen V1 schema in `contracts/activation-binding.md` with golden tests. |
| Workspace local `fgos` can enter the Rust host through activation. | implemented preview | `test/rust-host/fgctl-init.test.mjs`, `scripts/ci-external-consumer.sh`, `docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md`, `docs/platform/packaging-distribution/verification/install-and-release-proof.md` | Public preview posture is settled: external installs default `fgos` through the Rust host, public docs may state Rust host is the default installed runtime, and proof covers local fixture plus external-consumer asset flow where `version --runtime-json` reports `host: "rust"` and the activated `artifactDigest`. Stable/default release posture remains a separate release-owner decision. |
| Workspace command resolution prefers activated workspace installation before other tiers. | implemented | `src/setup/bin-discovery.mjs`, `scripts/fgos-shell-integration.sh`, `test/scripts/fgos-shell-integration.test.mjs` | Ensure any Rust/Herdr resolver keeps the same tier order. |
| Legacy npm/Node install remains compatibility path. | implemented legacy deprecated | `package.json`, `bin/fgos.mjs`, `bin/fgos-runner.mjs`, `test/install-packaging.test.mjs`, `README.md`, `docs/platform/packaging-distribution/verification/install-and-release-proof.md` | Coordinator decision (2026-09-15) confirms this posture for the preview release: Rust host is the default runtime path for activated workspace installs and external installs. Legacy Node fallback is deprecated immediately as public/default posture and remains only as the settled, explicit escape hatch with warning/log/proof marker for 30 calendar days after preview release publication. |
| `fgos doctor` default path is read-only. | implemented | `docs/specs/distribution.md`, `bin/fgos.mjs`, `test/setup/*.test.mjs` | Keep future checks from writing in check-only mode. |
| `fgos doctor --fix` runs registered fixes then reports. | implemented | `src/setup/registrations.mjs`, `bin/fgos.mjs`, `test/setup/registrations.test.mjs`, `test/setup/*.test.mjs` | Avoid copying a stale full fix list into prose. |
| `fgos setup` also runs registered fixes as deprecated legacy compatibility. | implemented legacy deprecated | `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `docs/history/setup-runs-registered-fixes/CONTEXT.md`, `test/cli/fgos-manifest.test.mjs`, `test/setup/checks-setup-rc-line.test.mjs`, `test/setup/*.test.mjs` | P8 keeps old behavior reachable while command surfaces and setup payload point workspace onboarding to `fgctl init` plus local `fgos doctor --fix`/`fgos doctor`; shell/global integration remains legacy setup compatibility under the 30-day preview fallback window unless superseded by a later release decision. |
| Project config overrides global config. | implemented | `src/config/global-config.mjs`, `test/config/global-config.test.mjs` | Keep doctor/fix and legacy setup docs clear that global fills, project wins. |
| Canonical instruction sources are registered and discovered from `core/instructions/`, `components/<component>/instructions/`, and `domains/<domain>/instructions/`. | implemented | `src/setup/instruction-registry.mjs`, `test/setup/instruction-registry.test.mjs`, `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` | P3 complete: source discovery, rule force classification, authority/specificity/applicability metadata, and registry tests implemented; merge policy composition engine planned in P4. |
| Instruction rules compose into a machine-readable effective instruction set before rendering. | implemented | `src/setup/instruction-composition.mjs`, `test/setup/instruction-composition.test.mjs`, `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` | P4 complete: composition emits stable effective-set IR, applies law/boundary/procedure/preference/host-adapter order, and fails explicit conflicts instead of last-write-wins. P5 still owns host-visible rendering/projection repair. |
| `AGENTS.md` is the primary portable instruction projection; host-specific instruction files are adapters only when needed. | implemented | `src/setup/instruction-projections.mjs`, `test/setup/instruction-projections.test.mjs`, `src/setup/registrations.mjs`, `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` | P5 implements the portable `AGENTS.md` managed-block renderer, effective-set JSON materialization, projection ledger entry, and doctor check/fix repair path. No host-specific duplicate file is generated without an adapter need. |
| Canonical skill authoring is split by component/domain source. | implemented | `core/skills/`, `domains/*/skills/`, `src/setup/skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs`, `docs/architect/domainization/README.md` | Keep duplicate-name protection active as domains add skills. |
| `.agents/skills` and `.claude/skills` are generated projections, not canonical source. | implemented | `src/setup/skill-wrappers.mjs`, `scripts/build-skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` | Instruction projection ledger evidence exists for P5; skill projection ledger coverage remains a separate follow-up. |
| Plugin-only consumers receive required dev skills. | implemented | `plugins/fgOS/skills/`, `test/skills/fgos-mirror.test.mjs`, `src/setup/skill-wrappers.mjs` | Mirrored `fgos-*` dev skills and `_shared/` distinguished from hand-authored plugin skills in `plugins/fgOS/skills/` (`contracts/skill-package-distribution.md`). |
| Host-neutral skill intent ids map to host-native triggers. | partial | `src/setup/skill-wrappers.mjs` (`mapSkillIntentToHostTriggers`, `discoverCanonicalSkills`), `test/setup/skill-wrappers.test.mjs` | Direct 1:1 intent-to-trigger mapping implemented for canonical skills; routing/pick and shipped Claude compatibility vocabulary (`/fgOS:pick`, `/fgOS:submit`) marked partial pending public-intent metadata or explicit alias contract (P3-P5). |
| Gemini receives a native extension/package target for fgOS skills. | partial | `src/setup/skill-wrappers.mjs` (`generateGeminiSkillPackage`), `test/setup/skill-wrappers.test.mjs` | Extension package layout and prototype generator implemented in P2; full build/release packaging, install pipeline, and doctor check integration planned for subsequent phase. |
| Shared skill fragments cannot collide across component-owned sources. | implemented | `src/setup/skill-wrappers.mjs` (`discoverSharedFragments`, `assembleSkills`), `test/setup/skill-wrappers.test.mjs` | Move toward namespaced fragment layout (_shared/<owner>/) as multi-domain fragments expand. |
| `fgos-code-panel` is a coding-domain application surface over coordination/group-thinking, not a group-thinking special case. | implemented | `domains/coding/skills/fgos-code-panel/`, `test/setup/skill-wrappers.test.mjs`, `test/skills/fgos-mirror.test.mjs` | Proved via canonical source in coding domain with generated projections in `.agents/skills`, `.claude/skills`, and `plugins/fgOS/skills`. |
| Packaging-distribution is the platform-support component for packaging, install, activation, and doctor/fix readiness. | partial | `docs/platform/packaging-distribution/README.md`, `docs/platform/component-boundary.md`, `docs/architect/component-boundary/component-boundary-advisory.md` | Promote the detailed component-boundary source into `docs/platform/component-boundary.md` before marking final. |
| `fgctl` never writes host-visible projections directly. | implemented | `apps/fgctl/src/main.rs`, `packages/distribution/rust/src/init.rs` (`publish_and_tail`, `preflight_candidate`), `test/rust-host/fgctl-init.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs` | Proved in P7: fgctl stages releases, creates stable shims/root/activation records, and invokes local runtime tail without writing host-visible projections directly; candidate preflight writes nothing. |
| Shared gateway/web remains future-only. | planned | `docs/platform/packaging-distribution/architecture/future-constraints.md` | Revisit when gateway owns a project runtime adapter. |

## 4. Fresh Scan Requirement

Before changing factual implementation claims in this area:

1. scan docs for related current/historical claims;
2. scan code/tests for current behavior;
3. update this table before promoting prose elsewhere.

When the edit promotes, retires, or contradicts a detail from older packaging-distribution sources, also update `source-preservation-audit.md`.
