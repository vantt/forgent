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
Last reviewed: 2026-09-18
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

## 4. Latest Preview Release Proof

The preview installed/default runtime claim was locally re-proven on
2026-09-15 with release-shaped assets:

```bash
cargo build --release --workspace
node scripts/build-rust-distribution.mjs --out "$TMP_ASSETS/tree"
tar -czf "$TMP_ASSETS/fgos-v0.1.0-preview-proof-x86_64-unknown-linux-gnu.tar.gz" -C "$TMP_ASSETS/tree" .
tar -czf "$TMP_ASSETS/fgctl-v0.1.0-preview-proof-x86_64-unknown-linux-gnu.tar.gz" -C target/release fgctl
cp install.sh "$TMP_ASSETS/"
(cd "$TMP_ASSETS" && sha256sum fgos-*.tar.gz fgctl-*.tar.gz > SHA256SUMS)
scripts/ci-external-consumer.sh --assets "$TMP_ASSETS"
```

Result:

```txt
Release tree staged successfully.
artifactDigest: sha256:6c1aad61594b9c62ebc808a63418cbf3016f514a32e9889c2f2fa5af849176d5
All external consumer proof steps passed successfully.
```

The external consumer proof installs `fgctl` from the release-shaped assets,
runs `fgctl init --from <fgos tarball>` in a fresh project outside the source
checkout, asserts `.fgos/installation/bin/fgos version --runtime-json` reports
`host: "rust"` and an `artifactDigest` matching the verified release manifest,
then verifies `fgos ready --json`, no-op `fgctl upgrade --from <same asset>`,
and `fgctl repair`.

## 5. Evidence Rules

- Link evidence from docs instead of embedding long test explanations in specs.
- Treat a passing local unit test as local proof, not release proof.
- Treat external consumer CI as the strongest install/release proof.
- Re-scan code before changing claim status in `implementation-alignment.md`.

## 6. Settled Node Fallback Policy

Public/default release posture means the officially supported release stance
for users outside the source checkout: which release channel is published or
recommended, which installed `fgos` entrypoint is documented as the default,
and what compatibility/rollback promise the release owner makes for that
channel. It is broader than local proof that a workspace-installed path can
enter the Rust host.

The compatibility posture is now settled as:

- The public release posture is preview.
- External installs default `fgos` through the Rust host.
- Public docs may state that Rust host is the default installed runtime.
- Rust host is the default runtime path for activated workspace installs.
- Legacy Node fallback is deprecated immediately as a public/default runtime
  posture.
- Legacy Node fallback may remain only as an explicit escape hatch during a
  short compatibility window. It must require an intentional selector such as
  an environment variable, flag, or equivalent supported mechanism; it must not
  silently catch Rust-host failures.
- Any escape-hatch invocation must emit a warning, log entry, or proof marker
  that distinguishes deliberate legacy fallback use from default Rust-host use.
- The escape hatch remains supported for 30 calendar days after the preview
  release publication date. For the 2026-09-15 preview proof/public-posture
  decision, the earliest removal date is 2026-10-15; if the public preview tag
  is published later, use that publication date plus 30 calendar days.

This policy does not mean every component has moved to Rust. It means the
user-facing default entrypoint is Rust-host-owned; the Rust host may still
execute the legacy Node payload through the release manifest while that payload
remains a component behind the host boundary.

If the Rust host fails, support/rollback guidance follows the explicit
deprecated Node fallback escape-hatch policy above. Silent fallback is not part
of the support promise.
