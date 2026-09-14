# Verification: Install And Release Proof

```txt
Document type: Verification
Audience: Reviewer, maintainer, release engineer, implementation agent
Purpose: List proof paths for packaging, install, release, activation, doctor/fix behavior, and legacy setup compatibility
Design status: Draft
Implementation status: Current evidence snapshot
Canonical: Yes, after review
Owner: Platform documentation
Source type: Code/test scan
Last reviewed: 2026-09-13
Related:
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/platform/packaging-distribution/contracts/skill-package-distribution.md
```

## 1. Purpose

This document points to evidence. It is not the design authority.

## 2. Proof Surfaces

| Proof surface | Evidence |
| --- | --- |
| Release tree build | `scripts/build-rust-distribution.mjs`, `test/rust-host/release-tree.test.mjs` |
| Repository/runtime layout boundaries | `docs/platform/packaging-distribution/contracts/repository-runtime-layout.md`, `packages/distribution/rust/src/init.rs`, `src/setup/bin-discovery.mjs`, worker/worktree tests before promotion |
| `fgctl stage` and release store verification | `test/rust-host/fgctl-stage.test.mjs`, `packages/distribution/rust/src/store.rs`, `packages/distribution/rust/src/verify.rs` |
| `fgctl init` and activation | `test/rust-host/fgctl-init.test.mjs`, `packages/distribution/rust/src/init.rs`, `packages/distribution/rust/src/workspace.rs` |
| Workspace local `fgos` enters Rust host | `test/rust-host/fgctl-init.test.mjs` asserts `.fgos/installation/bin/fgos version --runtime-json` reports `host: "rust"` and the activated `artifactDigest`; `scripts/ci-external-consumer.sh` repeats the same assertion against installed release assets |
| `fgctl upgrade` and repair path | `test/rust-host/fgctl-upgrade.test.mjs`, `apps/fgctl/src/main.rs` |
| External consumer flow | `scripts/ci-external-consumer.sh`, `.github/workflows/ci.yml`, `.github/workflows/release.yml` |
| Install script behavior | `install.sh`, `test/install/install-sh.test.mjs` |
| Legacy Node packaging | `package.json`, `bin/fgos.mjs`, `bin/fgos-runner.mjs`, `test/install-packaging.test.mjs` |
| Shell helper resolution | `scripts/fgos-shell-integration.sh`, `test/scripts/fgos-shell-integration.test.mjs` |
| Doctor/fix registry and legacy setup compatibility | `src/setup/checks.mjs`, `src/setup/registrations.mjs`, `test/setup/registrations.test.mjs` |
| Config precedence | `src/config/global-config.mjs`, `test/config/global-config.test.mjs` |
| Skill projection generation | `core/skills/`, `domains/*/skills/`, `.agents/skills/`, `.claude/skills/`, `src/setup/skill-wrappers.mjs`, `scripts/build-skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` |
| Plugin/dev-skill packaging | `plugins/fgOS/skills/`, `src/setup/skill-wrappers.mjs`, `test/skills/fgos-mirror.test.mjs` |

## 3. Suggested Verification Commands

Use targeted commands when editing docs only:

```bash
npm test -- test/rust-host/release-tree.test.mjs
npm test -- test/rust-host/fgctl-stage.test.mjs
npm test -- test/rust-host/fgctl-init.test.mjs
npm test -- test/rust-host/fgctl-upgrade.test.mjs
npm test -- test/install/install-sh.test.mjs
npm test -- test/install-packaging.test.mjs
npm test -- test/setup/registrations.test.mjs
npm test -- test/config/global-config.test.mjs
npm test -- test/setup/skill-wrappers.test.mjs
npm test -- test/skills/fgos-mirror.test.mjs
```

Run broader suites when implementation changes, release paths change, or a doc claim becomes a release promise.

## 4. Evidence Rules

- Link evidence from docs instead of embedding long test explanations in specs.
- Treat a passing local unit test as local proof, not release proof.
- Treat external consumer CI as the strongest install/release proof.
- Re-scan code before changing claim status in `implementation-alignment.md`.
