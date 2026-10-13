# Packaging independent review: candidate-unverified 4

Content pin: `baef3a075899f83d515a28ab66abd6c3d55201c5`

Author: `codex-session:8@2026-10-13`; assembler: `codex-session:9@2026-10-13`. All proposals remain pending.

## claim_11f23048b77d94c92e87a0c993469b53

```json
{
  "claimId": "claim_11f23048b77d94c92e87a0c993469b53",
  "path": "docs/platform/packaging-distribution/verification/implementation-alignment.md",
  "anchor": "unheaded-block-2",
  "unitDigest": "a1a96341f4eb6a17437b92a267acb8c223714ec148c6238140a339bd04daa43a",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `a1a96341f4eb6a17437b92a267acb8c223714ec148c6238140a339bd04daa43a`

```text
This is the tracking surface for “mức độ triển khai so với thiết kế”.
```
## claim_ee119328a8053719691d29625c39dc7f

```json
{
  "claimId": "claim_ee119328a8053719691d29625c39dc7f",
  "path": "docs/platform/packaging-distribution/verification/implementation-alignment.md",
  "anchor": "unheaded-block-3",
  "unitDigest": "06bcd663ceefd6e8cce04bb4cb564a49e518b52d9bf78f40d5edeb75dd57fe27",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `06bcd663ceefd6e8cce04bb4cb564a49e518b52d9bf78f40d5edeb75dd57fe27`

```text
Every important packaging-distribution design claim should appear here with status, evidence, and the next gap.
```
## claim_f3368413713d845e1babf4dd7b06b40e

```json
{
  "claimId": "claim_f3368413713d845e1babf4dd7b06b40e",
  "path": "docs/platform/packaging-distribution/verification/implementation-alignment.md",
  "anchor": "2-status-legend",
  "unitDigest": "c62253ac65f6c9a88a7b1fa65f831516fc144cc061419403f3444c7e37a6726b",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `55e643a939d80e5e5e2d27d30b30ee123119be4640e6d6a16eb4ef2bc188163a`

```text
## 2. Status Legend

| Status | Meaning |
| --- | --- |
| `implemented` | Code/tests currently prove the claim. |
| `partial` | Some implementation exists, but coverage, contract extraction, or release validation is incomplete. |
| `planned` | Accepted target without implementation proof. |
| `superseded` | Retained as history only. |
| `unknown` | Needs a fresh scan before use. |
```
## claim_782e27814f8b6d29465cf8dba88a066c

```json
{
  "claimId": "claim_782e27814f8b6d29465cf8dba88a066c",
  "path": "docs/platform/packaging-distribution/verification/implementation-alignment.md",
  "anchor": "unheaded-block-4",
  "unitDigest": "cd2f95e5d89b0f08fae9d987679e7d95f3a2ca8085f67bbf88c52b9ee80cf035",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `cd2f95e5d89b0f08fae9d987679e7d95f3a2ca8085f67bbf88c52b9ee80cf035`

```text
| Status | Meaning |
| --- | --- |
| `implemented` | Code/tests currently prove the claim. |
| `partial` | Some implementation exists, but coverage, contract extraction, or release validation is incomplete. |
| `planned` | Accepted target without implementation proof. |
| `superseded` | Retained as history only. |
| `unknown` | Needs a fresh scan before use. |
```
## claim_095d9f70331b803e8fdfa59bbda82d0c

```json
{
  "claimId": "claim_095d9f70331b803e8fdfa59bbda82d0c",
  "path": "docs/platform/packaging-distribution/verification/implementation-alignment.md",
  "anchor": "3-alignment-table",
  "unitDigest": "34771c42ba42aea9b74bf36110de97211b1fc60a9c6d45652134b01bb8abaf7e",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `e05531d1bb8d2d77393f9620717e85883ddf7f765f9af46a6bc733ecb77c515b`

```text
## 3. Alignment Table

| Design claim | Status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| `fgctl` is the recommended install/bootstrap entry. | implemented preview | `README.md`, `install.sh`, `test/install/install-sh.test.mjs`, `scripts/ci-external-consumer.sh`, `.github/workflows/release.yml`, GitHub release `v0.1.0` published 2026-09-18 with `fgctl-v0.1.0-x86_64-unknown-linux-gnu.tar.gz`, `fgos-v0.1.0-x86_64-unknown-linux-gnu.tar.gz`, `SHA256SUMS`, and `install.sh` | Stable/default graduation remains a release-owner decision; preview install channel is proven by release workflow 35317876419 and post-release CI/external-consumer proof 35498322149. |
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
| Canonical instruction sources are registered and discovered from `core/instructions/`, `components/<component>/instructions/`, and `domains/<domain>/instructions/`. | implemented | `src/setup/instruction-registry.mjs`, `test/setup/instruction-registry.test.mjs`, `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` | P3 complete: source discovery, rule force classification, authority/specificity/applicability metadata, and registry tests implemented. Keep new instruction owners registered rather than discovered from docs prose. |
| Instruction rules compose into a machine-readable effective instruction set before rendering. | implemented | `src/setup/instruction-composition.mjs`, `test/setup/instruction-composition.test.mjs`, `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` | P4 complete: composition emits stable effective-set IR, applies law/boundary/procedure/preference/host-adapter order, and fails explicit conflicts instead of last-write-wins. Portable projection repair is implemented in P5; host-specific adapter expansion remains demand-driven. |
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
```
## claim_23aa9eddbe0a401a9d68aa29470f2618

```json
{
  "claimId": "claim_23aa9eddbe0a401a9d68aa29470f2618",
  "path": "docs/platform/packaging-distribution/verification/implementation-alignment.md",
  "anchor": "unheaded-block-5",
  "unitDigest": "75a79276b3c2305221a561a733259f29f4c76ea5bacdc6754b26547e37722c7d",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `75a79276b3c2305221a561a733259f29f4c76ea5bacdc6754b26547e37722c7d`

```text
| Design claim | Status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| `fgctl` is the recommended install/bootstrap entry. | implemented preview | `README.md`, `install.sh`, `test/install/install-sh.test.mjs`, `scripts/ci-external-consumer.sh`, `.github/workflows/release.yml`, GitHub release `v0.1.0` published 2026-09-18 with `fgctl-v0.1.0-x86_64-unknown-linux-gnu.tar.gz`, `fgos-v0.1.0-x86_64-unknown-linux-gnu.tar.gz`, `SHA256SUMS`, and `install.sh` | Stable/default graduation remains a release-owner decision; preview install channel is proven by release workflow 35317876419 and post-release CI/external-consumer proof 35498322149. |
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
| Canonical instruction sources are registered and discovered from `core/instructions/`, `components/<component>/instructions/`, and `domains/<domain>/instructions/`. | implemented | `src/setup/instruction-registry.mjs`, `test/setup/instruction-registry.test.mjs`, `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` | P3 complete: source discovery, rule force classification, authority/specificity/applicability metadata, and registry tests implemented. Keep new instruction owners registered rather than discovered from docs prose. |
| Instruction rules compose into a machine-readable effective instruction set before rendering. | implemented | `src/setup/instruction-composition.mjs`, `test/setup/instruction-composition.test.mjs`, `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` | P4 complete: composition emits stable effective-set IR, applies law/boundary/procedure/preference/host-adapter order, and fails explicit conflicts instead of last-write-wins. Portable projection repair is implemented in P5; host-specific adapter expansion remains demand-driven. |
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
```
## claim_532f2647b73b24955f72625b64178c04

```json
{
  "claimId": "claim_532f2647b73b24955f72625b64178c04",
  "path": "docs/platform/packaging-distribution/verification/implementation-alignment.md",
  "anchor": "4-fresh-scan-requirement",
  "unitDigest": "c36844f9ac3e4020468b11b1767162dd105cd5a5dd7e77f84ce8157cdcea0bf9",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `dd5c061499e89a3328cd963f001d304360a6d455f1d7b1682a21168b14ac561d`

```text
## 4. Fresh Scan Requirement

Before changing factual implementation claims in this area:

1. scan docs for related current/historical claims;
2. scan code/tests for current behavior;
3. update this table before promoting prose elsewhere.

When the edit promotes, retires, or contradicts a detail from older packaging-distribution sources, also update `source-preservation-audit.md`.
```
## claim_f8ef05dac738bc50f7153db6c65f8f3b

```json
{
  "claimId": "claim_f8ef05dac738bc50f7153db6c65f8f3b",
  "path": "docs/platform/packaging-distribution/verification/implementation-alignment.md",
  "anchor": "unheaded-block-6",
  "unitDigest": "64d56221ca8ad76f726899ee2ec197db52f3d089e417ba1c922434009beb42ee",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `64d56221ca8ad76f726899ee2ec197db52f3d089e417ba1c922434009beb42ee`

```text
Before changing factual implementation claims in this area:
```
## claim_ffdbac552f2bd238d56bb5905cac39e7

```json
{
  "claimId": "claim_ffdbac552f2bd238d56bb5905cac39e7",
  "path": "docs/platform/packaging-distribution/verification/implementation-alignment.md",
  "anchor": "unheaded-block-7",
  "unitDigest": "eef37e1fb0d7670a20a75f9f664e87a204e5dab0beeec03eab64c5ed45ff083c",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `eef37e1fb0d7670a20a75f9f664e87a204e5dab0beeec03eab64c5ed45ff083c`

```text
1. scan docs for related current/historical claims;
2. scan code/tests for current behavior;
3. update this table before promoting prose elsewhere.
```
## claim_39486f1e49439fa42d14c9d871846e49

```json
{
  "claimId": "claim_39486f1e49439fa42d14c9d871846e49",
  "path": "docs/platform/packaging-distribution/verification/implementation-alignment.md",
  "anchor": "unheaded-block-8",
  "unitDigest": "4be96762ba61bb8cb4348bf1b0ff4df23da17eac26ff47b2b65aef21413739e1",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `4be96762ba61bb8cb4348bf1b0ff4df23da17eac26ff47b2b65aef21413739e1`

```text
When the edit promotes, retires, or contradicts a detail from older packaging-distribution sources, also update `source-preservation-audit.md`.
```
## claim_3990ab03a5ae3863d109e1620b08342f

```json
{
  "claimId": "claim_3990ab03a5ae3863d109e1620b08342f",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "verification-install-and-release-proof",
  "unitDigest": "b536df35579fdec9aa3e707668bc304c05b1ba8179c9d607652b03167251f07d",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `f5216596b7fd152f218084260e687347268fc26264d60ed33765b821e2e89452`

````text
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
Last reviewed: 2026-09-21
Related:
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/platform/packaging-distribution/contracts/skill-package-distribution.md
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````
## claim_ef36d81c9eb0c5ae1f39a0fe02c607b0

```json
{
  "claimId": "claim_ef36d81c9eb0c5ae1f39a0fe02c607b0",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "unheaded-block-1",
  "unitDigest": "941e3a3deb6ae7ddf24248a0773765c11f3ae0f9a05798b4db30a087c7736bb5",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `941e3a3deb6ae7ddf24248a0773765c11f3ae0f9a05798b4db30a087c7736bb5`

````text
```txt
Document type: Verification
Audience: Reviewer, maintainer, release engineer, implementation agent
Purpose: List proof paths for packaging, install, release, activation, doctor/fix behavior, and legacy setup compatibility
Design status: Draft
Implementation status: Current evidence snapshot
Canonical: Yes, after review
Owner: Platform documentation
Source type: Code/test scan
Last reviewed: 2026-09-21
Related:
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/platform/packaging-distribution/contracts/skill-package-distribution.md
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````
## claim_b5bf2e91cffc29ddea8787b8851c2465

```json
{
  "claimId": "claim_b5bf2e91cffc29ddea8787b8851c2465",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "1-purpose",
  "unitDigest": "3495fb28bd2769a7d2020511167b124af881ea89256231c3d1f4c3cb165fbd9f",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `200946bd7d24882e69d4d88e6500ec03c111317d8ecd453c5531f5dca35a89f0`

```text
## 1. Purpose

This document points to evidence. It is not the design authority.
```
## claim_d99ae09fc82f8fd1ec94bfc9aa59bd32

```json
{
  "claimId": "claim_d99ae09fc82f8fd1ec94bfc9aa59bd32",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "unheaded-block-2",
  "unitDigest": "1996100141dc9de2d0048c191dd0e56b04e116358b617b558709c55ea200a204",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `1996100141dc9de2d0048c191dd0e56b04e116358b617b558709c55ea200a204`

```text
This document points to evidence. It is not the design authority.
```
## claim_cc691c67cb574a032d13c0ead02324d7

```json
{
  "claimId": "claim_cc691c67cb574a032d13c0ead02324d7",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "2-proof-surfaces",
  "unitDigest": "69e7af233b462338b90897b36371e8155fcc6910718e32ddd26d54e700fc1f91",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `1c7402964b2fbb98aa5ec97b476a0b6f76789c5ba291b44ad7c7232e08e1a566`

```text
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
```
## claim_05845829294e08426b2f9395aab26d05

```json
{
  "claimId": "claim_05845829294e08426b2f9395aab26d05",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "unheaded-block-3",
  "unitDigest": "cb0caffcb9a4ef54e92d58e2667b1b56728c347c771ad0122ddec7336ef00717",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `cb0caffcb9a4ef54e92d58e2667b1b56728c347c771ad0122ddec7336ef00717`

```text
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
```
## claim_82d9eb761fd3a3a44c1982ea2e55f2ba

```json
{
  "claimId": "claim_82d9eb761fd3a3a44c1982ea2e55f2ba",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "3-suggested-verification-commands",
  "unitDigest": "333a814cc91185b2987665adcf3fda44c54d40cabcd44cc11cf01ad95bb969cd",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `3640e4f11474f0f203775e397798811c22bf75f29e199528e62e6a8fb8351c8d`

````text
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
````
## claim_c6727e7676601664acaa302b24428c74

```json
{
  "claimId": "claim_c6727e7676601664acaa302b24428c74",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "unheaded-block-4",
  "unitDigest": "403c5b6a14400466ed72d8c494ba4c601c757350f163fa646ad7e0d2a67792ef",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `403c5b6a14400466ed72d8c494ba4c601c757350f163fa646ad7e0d2a67792ef`

```text
Use targeted commands when editing docs only:
```
## claim_8e98d801bec98373306633c016311e24

```json
{
  "claimId": "claim_8e98d801bec98373306633c016311e24",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "unheaded-block-5",
  "unitDigest": "e047506458192942e1af0334697f9d4ea5db02a4dc5f34992a3817f6432151aa",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `e047506458192942e1af0334697f9d4ea5db02a4dc5f34992a3817f6432151aa`

````text
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
````
## claim_e3e4f90ee4aa8851169b31733d37f553

```json
{
  "claimId": "claim_e3e4f90ee4aa8851169b31733d37f553",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "unheaded-block-6",
  "unitDigest": "29049f090c713699c3843051e5476f73c17a41ff68fcc77adb4020678b74ab8c",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `29049f090c713699c3843051e5476f73c17a41ff68fcc77adb4020678b74ab8c`

```text
Run broader suites when implementation changes, release paths change, or a doc claim becomes a release promise.
```
## claim_e5e4cc639a5688cc7b5834d4d7b20acc

```json
{
  "claimId": "claim_e5e4cc639a5688cc7b5834d4d7b20acc",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "4-latest-preview-release-proof",
  "unitDigest": "931aa55b2031bd1784e3b3d903f357f28f43cdc2d6ab50f1691d09d84ad90373",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `498340f94d797881eb443922ea7c4d208754ec73ac64a549ba68e7be51f3d021`

```text
## 4. Latest Preview Release Proof
```
## claim_de0a63af6ad00c9b7a993cb27e43759e

```json
{
  "claimId": "claim_de0a63af6ad00c9b7a993cb27e43759e",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "41-published-preview-release",
  "unitDigest": "ff0ef4e6064da38e4181233f6fade2eb6fdaeeb116df354aee8b13fdd8d53206",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `52cb441212862a18224839696e652e52f7e44c5701196740fbe9b8b86035528c`

```text
### 4.1 Published Preview Release

GitHub release `v0.1.0` is the first published preview release proof:

| Item | Evidence |
| --- | --- |
| Release tag | `v0.1.0` |
| Release URL | `https://github.com/vantt/forgent/releases/tag/v0.1.0` |
| Published | 2026-09-18 07:07:51 UTC |
| Release workflow | GitHub Actions run `35317876419`, conclusion `success`, commit `40fd80ef73092be1af96410211e770f20546a836` |
| Published assets | `fgctl-v0.1.0-x86_64-unknown-linux-gnu.tar.gz`, `fgos-v0.1.0-x86_64-unknown-linux-gnu.tar.gz`, `SHA256SUMS`, `install.sh` |
| Post-release CI proof | GitHub Actions run `35498322149`, conclusion `success`, commit `7853e4d7d6881665fb57e2a5d730428ae4e96486` |
| Post-release external consumer proof | Job `external consumer proof` in run `35498322149`, conclusion `success` |

This proves the preview release channel exists as published assets, not only
as local release-shaped files. The preview claim remains deliberately narrower
than stable/default graduation: release-owner approval is still required before
this status becomes stable/default.
```
## claim_3a2213be21a035976fab9103927deddf

```json
{
  "claimId": "claim_3a2213be21a035976fab9103927deddf",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "unheaded-block-7",
  "unitDigest": "ef5ce252a6c62e90fe2623a62f01a2ab2c636850c1f6bd693e0805fe9f3cefa2",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `ef5ce252a6c62e90fe2623a62f01a2ab2c636850c1f6bd693e0805fe9f3cefa2`

```text
GitHub release `v0.1.0` is the first published preview release proof:
```
## claim_e35bb8419ac8efe2c32eb739408c1c08

```json
{
  "claimId": "claim_e35bb8419ac8efe2c32eb739408c1c08",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "unheaded-block-8",
  "unitDigest": "15ba3b86796e8a62c8580f0d6587478b7dd5f536d1e20c9b9b1f0d60e62f8dd0",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `15ba3b86796e8a62c8580f0d6587478b7dd5f536d1e20c9b9b1f0d60e62f8dd0`

```text
| Item | Evidence |
| --- | --- |
| Release tag | `v0.1.0` |
| Release URL | `https://github.com/vantt/forgent/releases/tag/v0.1.0` |
| Published | 2026-09-18 07:07:51 UTC |
| Release workflow | GitHub Actions run `35317876419`, conclusion `success`, commit `40fd80ef73092be1af96410211e770f20546a836` |
| Published assets | `fgctl-v0.1.0-x86_64-unknown-linux-gnu.tar.gz`, `fgos-v0.1.0-x86_64-unknown-linux-gnu.tar.gz`, `SHA256SUMS`, `install.sh` |
| Post-release CI proof | GitHub Actions run `35498322149`, conclusion `success`, commit `7853e4d7d6881665fb57e2a5d730428ae4e96486` |
| Post-release external consumer proof | Job `external consumer proof` in run `35498322149`, conclusion `success` |
```
## claim_d4cf890b4f59082b8036e248682e9978

```json
{
  "claimId": "claim_d4cf890b4f59082b8036e248682e9978",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "unheaded-block-9",
  "unitDigest": "5436a95c42be8bcb624f6f896d0230c3a36200060b23ce19ae75449784271aa8",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `5436a95c42be8bcb624f6f896d0230c3a36200060b23ce19ae75449784271aa8`

```text
This proves the preview release channel exists as published assets, not only
as local release-shaped files. The preview claim remains deliberately narrower
than stable/default graduation: release-owner approval is still required before
this status becomes stable/default.
```
## claim_009f1ded9ed1336a1fb79989b14d8eaf

```json
{
  "claimId": "claim_009f1ded9ed1336a1fb79989b14d8eaf",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "42-local-release-shaped-proof",
  "unitDigest": "29664e6be504796ac0bd5fb477ea653a5d1038d0e1c5fea0a4400756f67d86e7",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `039288f7b1611c181995defddeaae8f73bde35d567166d6038d6fcfc12deb72f`

````text
### 4.2 Local Release-Shaped Proof

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
````
## claim_7aecd49148fe5dbc3c12ee70af0cf5e5

```json
{
  "claimId": "claim_7aecd49148fe5dbc3c12ee70af0cf5e5",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "unheaded-block-10",
  "unitDigest": "74fa81e5075b3aae7a3bba51ce52c9ddc9e42d125a6e803a340813a9aebb02f6",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `74fa81e5075b3aae7a3bba51ce52c9ddc9e42d125a6e803a340813a9aebb02f6`

```text
The preview installed/default runtime claim was locally re-proven on
2026-09-15 with release-shaped assets:
```
## claim_e0ae920678e12916fdba6d66228106b0

```json
{
  "claimId": "claim_e0ae920678e12916fdba6d66228106b0",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "unheaded-block-11",
  "unitDigest": "313b0a6dfcb2da43a1728653ae038c95b7340db127e9d9533f5ac603e2c39909",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `313b0a6dfcb2da43a1728653ae038c95b7340db127e9d9533f5ac603e2c39909`

````text
```bash
cargo build --release --workspace
node scripts/build-rust-distribution.mjs --out "$TMP_ASSETS/tree"
tar -czf "$TMP_ASSETS/fgos-v0.1.0-preview-proof-x86_64-unknown-linux-gnu.tar.gz" -C "$TMP_ASSETS/tree" .
tar -czf "$TMP_ASSETS/fgctl-v0.1.0-preview-proof-x86_64-unknown-linux-gnu.tar.gz" -C target/release fgctl
cp install.sh "$TMP_ASSETS/"
(cd "$TMP_ASSETS" && sha256sum fgos-*.tar.gz fgctl-*.tar.gz > SHA256SUMS)
scripts/ci-external-consumer.sh --assets "$TMP_ASSETS"
```
````
## claim_7b284c8c3be56eeb4471c26650ff17a1

```json
{
  "claimId": "claim_7b284c8c3be56eeb4471c26650ff17a1",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "unheaded-block-12",
  "unitDigest": "2cfeb1ee6c01af5844416dd5d17d2d06ee58f746fb98e52031ffb8d5cd8fc525",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `2cfeb1ee6c01af5844416dd5d17d2d06ee58f746fb98e52031ffb8d5cd8fc525`

````text
Result:

```txt
Release tree staged successfully.
artifactDigest: sha256:6c1aad61594b9c62ebc808a63418cbf3016f514a32e9889c2f2fa5af849176d5
All external consumer proof steps passed successfully.
```
````
## claim_6958d47f311793b5a2dc980ba13ca4e9

```json
{
  "claimId": "claim_6958d47f311793b5a2dc980ba13ca4e9",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "unheaded-block-13",
  "unitDigest": "d82ba73817d06d01fb4ba4bb51fdfc92bed44b9c7882eca2301fb811b953f1a9",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `d82ba73817d06d01fb4ba4bb51fdfc92bed44b9c7882eca2301fb811b953f1a9`

```text
The external consumer proof installs `fgctl` from the release-shaped assets,
runs `fgctl init --from <fgos tarball>` in a fresh project outside the source
checkout, asserts `.fgos/installation/bin/fgos version --runtime-json` reports
`host: "rust"` and an `artifactDigest` matching the verified release manifest,
then verifies `fgos ready --json`, no-op `fgctl upgrade --from <same asset>`,
and `fgctl repair`.
```
## claim_8b63dd88a1dd1de4bebc974477a1c902

```json
{
  "claimId": "claim_8b63dd88a1dd1de4bebc974477a1c902",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "5-evidence-rules",
  "unitDigest": "7fb3e9077d229c40a12e30fd46167092434e247727b9391bd5c50264c671d2f4",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `d15b4034ec0eee0c2c29c37bc6a7c3629700d4428c1c797ad76a167a2d6937e4`

```text
## 5. Evidence Rules

- Link evidence from docs instead of embedding long test explanations in specs.
- Treat a passing local unit test as local proof, not release proof.
- Treat external consumer CI as the strongest install/release proof.
- Re-scan code before changing claim status in `implementation-alignment.md`.
```
## claim_41d0ddaf9ecbc12e81910bd6ac9f53b9

```json
{
  "claimId": "claim_41d0ddaf9ecbc12e81910bd6ac9f53b9",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "unheaded-block-14",
  "unitDigest": "380d5cb658fe03b6cf908339c07a1e1c2134d7690c364550c9e6dc6c00c4572e",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `380d5cb658fe03b6cf908339c07a1e1c2134d7690c364550c9e6dc6c00c4572e`

```text
- Link evidence from docs instead of embedding long test explanations in specs.
- Treat a passing local unit test as local proof, not release proof.
- Treat external consumer CI as the strongest install/release proof.
- Re-scan code before changing claim status in `implementation-alignment.md`.
```
## claim_51b8e85b394738184789d7d5e5082c9d

```json
{
  "claimId": "claim_51b8e85b394738184789d7d5e5082c9d",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "6-settled-node-fallback-policy",
  "unitDigest": "e6d01264c4854a3eea5840c631cb7a62ebec91b3e42648654bc74238ec36bb7e",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `7f11572f69dd74b662b8ada8f866f2bf96738ec6a29aa66cc795c15707cf47cd`

```text
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
  release publication date. The public preview tag `v0.1.0` was published on
  2026-09-18, so the earliest removal date for this preview release is
  2026-10-18 unless a later release decision replaces that support promise.

This policy does not mean every component has moved to Rust. It means the
user-facing default entrypoint is Rust-host-owned; the Rust host may still
execute the legacy Node payload through the release manifest while that payload
remains a component behind the host boundary.

If the Rust host fails, support/rollback guidance follows the explicit
deprecated Node fallback escape-hatch policy above. Silent fallback is not part
of the support promise.
```
## claim_74987b32405a083fa26241b83a1cae6d

```json
{
  "claimId": "claim_74987b32405a083fa26241b83a1cae6d",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "unheaded-block-15",
  "unitDigest": "efc2d20524d1a1ea23cfbac8e8996cb51b880a0a86d29b98921dd863498b551a",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `efc2d20524d1a1ea23cfbac8e8996cb51b880a0a86d29b98921dd863498b551a`

```text
Public/default release posture means the officially supported release stance
for users outside the source checkout: which release channel is published or
recommended, which installed `fgos` entrypoint is documented as the default,
and what compatibility/rollback promise the release owner makes for that
channel. It is broader than local proof that a workspace-installed path can
enter the Rust host.
```
## claim_03b1f3fa7044a35ff3fe3ad061b46fcc

```json
{
  "claimId": "claim_03b1f3fa7044a35ff3fe3ad061b46fcc",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "unheaded-block-16",
  "unitDigest": "c38d993ff7d98fa101594a6bf6758521f5b51ed0fbaa235df287fdf414297f50",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `c38d993ff7d98fa101594a6bf6758521f5b51ed0fbaa235df287fdf414297f50`

```text
The compatibility posture is now settled as:
```
## claim_5f74e7c956ad4a546af303d9f15fb8e2

```json
{
  "claimId": "claim_5f74e7c956ad4a546af303d9f15fb8e2",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "unheaded-block-17",
  "unitDigest": "6a838503d80c838c649167ceff151326e6f7a7a7c6e4f3b6f63d7157d5d337ed",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `6a838503d80c838c649167ceff151326e6f7a7a7c6e4f3b6f63d7157d5d337ed`

```text
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
  release publication date. The public preview tag `v0.1.0` was published on
  2026-09-18, so the earliest removal date for this preview release is
  2026-10-18 unless a later release decision replaces that support promise.
```
## claim_8ef4499c7d0b970775a6db5541d4d9ab

```json
{
  "claimId": "claim_8ef4499c7d0b970775a6db5541d4d9ab",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "unheaded-block-18",
  "unitDigest": "4a2a41d4b95b4fc9ee0e9e509935bf7a46fcc1f8caff77a6380e64fbeb61287e",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `4a2a41d4b95b4fc9ee0e9e509935bf7a46fcc1f8caff77a6380e64fbeb61287e`

```text
This policy does not mean every component has moved to Rust. It means the
user-facing default entrypoint is Rust-host-owned; the Rust host may still
execute the legacy Node payload through the release manifest while that payload
remains a component behind the host boundary.
```
## claim_7d5019538f03df03670d01a104278f9d

```json
{
  "claimId": "claim_7d5019538f03df03670d01a104278f9d",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "unheaded-block-19",
  "unitDigest": "6f8c44f5c3ed0487680d38f502e537b6ccc8b8c8464b92efca90d35dae40449c",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `6f8c44f5c3ed0487680d38f502e537b6ccc8b8c8464b92efca90d35dae40449c`

```text
If the Rust host fails, support/rollback guidance follows the explicit
deprecated Node fallback escape-hatch policy above. Silent fallback is not part
of the support promise.
```
## claim_eb945163c0239deaa6c6170e39d9e4ef

```json
{
  "claimId": "claim_eb945163c0239deaa6c6170e39d9e4ef",
  "path": "docs/platform/packaging-distribution/verification/source-preservation-audit.md",
  "anchor": "verification-source-preservation-audit",
  "unitDigest": "656f2d125f093f0876577455016ddc2d8405150ab4a6f1013f35102200cf404e",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `442cd49b1d89f4f3d4c9078c051574044bf7d54f11ed3b88e49c4673ac9c7133`

````text
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
Last reviewed: 2026-09-18
Related:
- docs/platform/packaging-distribution/README.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/platform/packaging-distribution/contracts/repository-runtime-layout.md
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````
## claim_bc9d2207f88853c7bbb8f8422a57a625

```json
{
  "claimId": "claim_bc9d2207f88853c7bbb8f8422a57a625",
  "path": "docs/platform/packaging-distribution/verification/source-preservation-audit.md",
  "anchor": "unheaded-block-1",
  "unitDigest": "46e51dd42c941934f7224151333b7c1eaaeab5645a9d86daaf1d9659484300eb",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `46e51dd42c941934f7224151333b7c1eaaeab5645a9d86daaf1d9659484300eb`

````text
```txt
Document type: Verification
Audience: Human reviewer, maintainer, implementation agent
Purpose: Track whether legacy and history packaging-distribution details were preserved during promotion into platform docs
Design status: Draft
Implementation status: Current evidence snapshot
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Audit of docs/specs/distribution.md, docs/distribution-vision.md, docs/architect/packaging-distribution/**, and docs/platform/packaging-distribution/**
Last reviewed: 2026-09-18
Related:
- docs/platform/packaging-distribution/README.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/platform/packaging-distribution/contracts/repository-runtime-layout.md
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````
## claim_e09c3c81feed6a9bcc689973272b527c

```json
{
  "claimId": "claim_e09c3c81feed6a9bcc689973272b527c",
  "path": "docs/platform/packaging-distribution/verification/source-preservation-audit.md",
  "anchor": "1-purpose",
  "unitDigest": "af53692ca91c1ae5896ad776233cc2cd0307b2a09f5fffc2515250b73ddd6ce7",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `82487b4330412bc489bebc4c38b9f74d246596a4c74bd851b0cfa8edec39f2e5`

```text
## 1. Purpose

This audit prevents the packaging-distribution rewrite from losing settled design detail.

Each old or discussion-derived fact must land in exactly one place:

- a current platform contract, architecture doc, spec, or verification table;
- a history file that clearly says the fact is retained as context only;
- an implementation gap with a named follow-up;
- an explicit superseded note.

Do not delete or redirect old packaging-distribution sources until the relevant rows below are resolved.
```
## claim_7582974731ad781b1b104bf81924370d

```json
{
  "claimId": "claim_7582974731ad781b1b104bf81924370d",
  "path": "docs/platform/packaging-distribution/verification/source-preservation-audit.md",
  "anchor": "unheaded-block-2",
  "unitDigest": "056ce64c7397bf78ece18404be5b268a703e7f6fa7a987903508bef5c40eeb4f",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `056ce64c7397bf78ece18404be5b268a703e7f6fa7a987903508bef5c40eeb4f`

```text
This audit prevents the packaging-distribution rewrite from losing settled design detail.
```
## claim_7fa986d168fb3755e48ed7a278c7fb47

```json
{
  "claimId": "claim_7fa986d168fb3755e48ed7a278c7fb47",
  "path": "docs/platform/packaging-distribution/verification/source-preservation-audit.md",
  "anchor": "unheaded-block-3",
  "unitDigest": "a8aedf00c1cd5b65f8f687ff7ec701c27cf5fe50a83e7a36101cea0bc4e33c0c",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `a8aedf00c1cd5b65f8f687ff7ec701c27cf5fe50a83e7a36101cea0bc4e33c0c`

```text
Each old or discussion-derived fact must land in exactly one place:
```
## claim_194271ffd80ecb84c2e278da6201b26d

```json
{
  "claimId": "claim_194271ffd80ecb84c2e278da6201b26d",
  "path": "docs/platform/packaging-distribution/verification/source-preservation-audit.md",
  "anchor": "unheaded-block-4",
  "unitDigest": "334e24b0280aaa1a6d55595e79b30aaff58ff79a3274dd8f109c1452174aeb53",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `334e24b0280aaa1a6d55595e79b30aaff58ff79a3274dd8f109c1452174aeb53`

```text
- a current platform contract, architecture doc, spec, or verification table;
- a history file that clearly says the fact is retained as context only;
- an implementation gap with a named follow-up;
- an explicit superseded note.
```
## claim_9e39c122ff0c48e486a889a1207f0d43

```json
{
  "claimId": "claim_9e39c122ff0c48e486a889a1207f0d43",
  "path": "docs/platform/packaging-distribution/verification/source-preservation-audit.md",
  "anchor": "unheaded-block-5",
  "unitDigest": "7a73343d52956e3d58ca6b0133c0c25102cc9ff283e27b3c019edd8cd7b42d9b",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `7a73343d52956e3d58ca6b0133c0c25102cc9ff283e27b3c019edd8cd7b42d9b`

```text
Do not delete or redirect old packaging-distribution sources until the relevant rows below are resolved.
```
## claim_6c824e8a097a3255032ac2d07b7cca19

```json
{
  "claimId": "claim_6c824e8a097a3255032ac2d07b7cca19",
  "path": "docs/platform/packaging-distribution/verification/source-preservation-audit.md",
  "anchor": "2-source-corpus",
  "unitDigest": "e64e6c59c653b7232d83d518045ed624071a828cdd9836ff59234e338952dc03",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `3bcadaa31d8becae784163c4f34fcf0bf74360322c8f964d3224e05ef50e5f47`

```text
## 2. Source Corpus

| Source | Role in this audit |
| --- | --- |
| `docs/specs/distribution.md` | Current/legacy shipped behavior for npm, setup, doctor, config, and CLI exposure. |
| `docs/distribution-vision.md` | Original install/setup/doctor direction and rationale. |
| `docs/architect/packaging-distribution/README.md` | Historical redirect to the promoted platform portal; body retained as discussion-era target outline. |
| `docs/architect/packaging-distribution/scope-map.md` | Historical redirect to promoted area boundary and this audit; body retained as concern map and split plan. |
| `docs/architect/packaging-distribution/runtime-identity-and-activation.md` | Historical redirect to promoted runtime architecture and contracts; body retained as detailed source context. |
| `docs/architect/packaging-distribution/future-constraints.md` | Historical redirect to promoted future-constraints architecture; body retained as source context. |
| `docs/architect/packaging-distribution/history/distribution-baseline.md` | Historical source ledger; active condensed history lives in the platform history file. |
| `docs/architect/packaging-distribution/workspace-runtime-model.md` | Historical redirect to workspace topology plus promoted packaging-distribution runtime docs. |
| `docs/platform/packaging-distribution/**` | Current promoted platform area. |
| `docs/architect/host-invocation-routing/host-invocation-provider-routing.md` | Cross-area touchpoint for command vocabulary and routing ownership. |

Audit erratum: earlier revisions named
`docs/architect/packaging-distribution/migration-map.md` and
`docs/architect/packaging-distribution/rewrite-plan.md` as sources. P9 removed
them from the source corpus because both paths are absent from the current tree
and `git log --all -- <path>` has no history for either path in this
repository. They are not provenance evidence unless an archived source appears.
```
## claim_0d356c1482bd664ee50a97520c12e1ec

```json
{
  "claimId": "claim_0d356c1482bd664ee50a97520c12e1ec",
  "path": "docs/platform/packaging-distribution/verification/source-preservation-audit.md",
  "anchor": "unheaded-block-6",
  "unitDigest": "e5caea5299f6cbb6de642f9f2a51def082caac431041944717d2231a5e1cddf6",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `e5caea5299f6cbb6de642f9f2a51def082caac431041944717d2231a5e1cddf6`

```text
| Source | Role in this audit |
| --- | --- |
| `docs/specs/distribution.md` | Current/legacy shipped behavior for npm, setup, doctor, config, and CLI exposure. |
| `docs/distribution-vision.md` | Original install/setup/doctor direction and rationale. |
| `docs/architect/packaging-distribution/README.md` | Historical redirect to the promoted platform portal; body retained as discussion-era target outline. |
| `docs/architect/packaging-distribution/scope-map.md` | Historical redirect to promoted area boundary and this audit; body retained as concern map and split plan. |
| `docs/architect/packaging-distribution/runtime-identity-and-activation.md` | Historical redirect to promoted runtime architecture and contracts; body retained as detailed source context. |
| `docs/architect/packaging-distribution/future-constraints.md` | Historical redirect to promoted future-constraints architecture; body retained as source context. |
| `docs/architect/packaging-distribution/history/distribution-baseline.md` | Historical source ledger; active condensed history lives in the platform history file. |
| `docs/architect/packaging-distribution/workspace-runtime-model.md` | Historical redirect to workspace topology plus promoted packaging-distribution runtime docs. |
| `docs/platform/packaging-distribution/**` | Current promoted platform area. |
| `docs/architect/host-invocation-routing/host-invocation-provider-routing.md` | Cross-area touchpoint for command vocabulary and routing ownership. |
```
## claim_f0d647000773070b3ab63142c75e5655

```json
{
  "claimId": "claim_f0d647000773070b3ab63142c75e5655",
  "path": "docs/platform/packaging-distribution/verification/source-preservation-audit.md",
  "anchor": "unheaded-block-7",
  "unitDigest": "273090f25df712e4b88946063659e8c5d87e71470c3baccdbc9cc6676b6252be",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `273090f25df712e4b88946063659e8c5d87e71470c3baccdbc9cc6676b6252be`

```text
Audit erratum: earlier revisions named
`docs/architect/packaging-distribution/migration-map.md` and
`docs/architect/packaging-distribution/rewrite-plan.md` as sources. P9 removed
them from the source corpus because both paths are absent from the current tree
and `git log --all -- <path>` has no history for either path in this
repository. They are not provenance evidence unless an archived source appears.
```
## claim_88556bf3cd155d29bf14747e4d1f4272

```json
{
  "claimId": "claim_88556bf3cd155d29bf14747e4d1f4272",
  "path": "docs/platform/packaging-distribution/verification/source-preservation-audit.md",
  "anchor": "3-preservation-matrix",
  "unitDigest": "532fad875feb20742dadd17288c98d9b0bf7d173b664819e1b9ac697fcb84646",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `08fb52598c0fbe87443da2df56bcb98d71087ded8aa19846ac0d666d37d077d7`

```text
## 3. Preservation Matrix

| Detail to preserve | Original source | Current preserved location | Status | Gap / next action |
| --- | --- | --- | --- | --- |
| Packaging-distribution is the owner for install, release, activation, upgrade/repair, and doctor/fix readiness. | `scope-map.md`, component-boundary advisory | `README.md` section 5 and 7; `verification/implementation-alignment.md` | preserved partial | Promote the detailed component-boundary source into `docs/platform/component-boundary.md`. |
| Old and new sources need an explicit authority order. | Gap found during this rewrite | `README.md` section 3 | preserved | Keep this rule when old paths receive redirects/status notes. |
| Current code may implement legacy behavior even after target architecture supersedes it. | `runtime-identity-and-activation.md`, `docs/specs/distribution.md` | `README.md` section 3; `verification/implementation-alignment.md` | preserved | Maintain explicit legacy/deprecated status for compatibility behavior such as `fgos setup`. |
| Target workspace-onboarding vocabulary has no separate `fgos setup` verb. | `runtime-identity-and-activation.md`, host-invocation routing doc | `architecture/runtime-identity-and-activation.md`; `contracts/setup-doctor-registry.md`; `spec.md`; host-invocation routing now points back here | preserved implemented legacy deprecated | P8 marks `fgos setup` deprecated in command registry/help/setup payload and points workspace onboarding to `fgctl init` plus local `fgos doctor --fix`/`fgos doctor`; shell/global integration remains legacy setup compatibility through the 30-day preview fallback window unless a later release decision replaces it. |
| `fgctl init`, `fgctl repair`, and `fgctl upgrade` publish a ready binding, then invoke the active local runtime tail. | `runtime-identity-and-activation.md` | `architecture/runtime-identity-and-activation.md`; `contracts/setup-doctor-registry.md`; `architecture/fgctl-and-local-fgos.md` | preserved implemented | Proved in P7 via `packages/distribution/rust/src/init.rs`, `test/rust-host/fgctl-init.test.mjs`, and `test/rust-host/fgctl-upgrade.test.mjs`: publish atomic binding, run tail (`fgos init`, `fgos doctor --fix`, `fgos doctor`), and record transaction status. |
| Local `fgos init` owns workspace adoption and host-visible projections after activation. | `runtime-identity-and-activation.md` | `architecture/runtime-identity-and-activation.md`; `contracts/projection-ledger.md`; `contracts/instruction-composition-and-projection.md` | preserved planned | Do a focused projection materialization scan before claiming implementation. |
| Repository, workspace, work-history, runtime-coordination, release-store, worker capsule, and host-projection roots must stay separate. | `runtime-identity-and-activation.md`, `scope-map.md` | `contracts/repository-runtime-layout.md`; `verification/implementation-alignment.md`; historical redirects in old architecture docs | preserved partial | Verify worker capsule and projection ledger implementation before marking full. |
| Workspace `.fgos/config.json` is tracked workspace policy; global config fills only missing values. | `docs/specs/distribution.md`, `docs/distribution-vision.md` | `spec.md`; `contracts/setup-doctor-registry.md`; `verification/implementation-alignment.md` | preserved implemented | Keep any future Rust or Node config writer from reversing precedence. |
| Workspace `.fgos/distribution.json` is the tracked team/project runtime pin. | `runtime-identity-and-activation.md`, `scope-map.md` | `contracts/distribution-pin.md`; `contracts/repository-runtime-layout.md` | preserved implemented | Exact schema frozen at V1 with golden tests in `packages/distribution/rust/tests/schema_golden.rs`. |
| Workspace `.fgos/installation/activation.json` is the ignored per-workspace ready binding. | `runtime-identity-and-activation.md` | `contracts/activation-binding.md`; `contracts/repository-runtime-layout.md`; `verification/implementation-alignment.md` | preserved implemented | Exact schema extracted and frozen at V1 with golden tests in `packages/distribution/rust/tests/schema_golden.rs`. |
| Stable local shims live under `.fgos/installation/bin/`. | `runtime-identity-and-activation.md` | `contracts/repository-runtime-layout.md`; `architecture/runtime-identity-and-activation.md` | preserved partial | Confirm shell helper and Rust init agree on path and repair semantics. |
| Machine release store contains immutable release trees, install records, lock, and quarantine. | `runtime-identity-and-activation.md` | `contracts/repository-runtime-layout.md`; `architecture/runtime-identity-and-activation.md` | preserved partial | Add exact release-store path encoding once `TopologyContext` is frozen. |
| Release manifest identity is `artifactDigest`, not archive checksum. | `runtime-identity-and-activation.md` | `contracts/release-manifest.md`; `verification/implementation-alignment.md` | preserved implemented | Exact schema frozen at V1 with golden tests in `packages/distribution/rust/tests/schema_golden.rs`. |
| Release tree includes native binary entrypoints and `libexec/legacy-node/`. | `runtime-identity-and-activation.md` | `contracts/release-manifest.md`; `spec.md`; `verification/implementation-alignment.md` | preserved implemented | Keep `components.legacyNode.root` and `components.legacyNode.entry` as the only legacy payload locator. |
| Release/stage safety rejects symlink, escape, corrupt digest, and unsafe extraction cases. | `runtime-identity-and-activation.md` | `contracts/release-manifest.md`; `verification/install-and-release-proof.md` | preserved implemented | Keep proof tests with release tree changes. |
| npm/Node install remains a compatibility channel, not target architecture. | `docs/specs/distribution.md`, `history/distribution-baseline.md` | `history/distribution-baseline.md`; `spec.md`; `verification/implementation-alignment.md` | preserved implemented | Avoid adding new target obligations to global npm `bin.fgos`. |
| Package allowlist, end-user docs packaging, no lifecycle install script, and dev checkout helper remain traceable. | `docs/specs/distribution.md`, `history/distribution-baseline.md` | `history/distribution-baseline.md`; `spec.md`; `verification/install-and-release-proof.md` | preserved | Recheck `package.json` allowlist before release packaging changes. |
| `fgos doctor` default path is read-only. | `docs/specs/distribution.md`, `docs/distribution-vision.md` | `contracts/setup-doctor-registry.md`; `verification/implementation-alignment.md` | preserved implemented | Keep new doctor checks from writing in check-only mode. |
| `fgos doctor --fix` runs registered fixes and reports. | `docs/specs/distribution.md`, `docs/distribution-vision.md` | `contracts/setup-doctor-registry.md`; `verification/implementation-alignment.md` | preserved implemented | Avoid stale prose lists of every check/fix; point to registry evidence. |
| Legacy `fgos setup` runs registered fixes. | `docs/specs/distribution.md`, setup history note | `contracts/setup-doctor-registry.md`; `verification/implementation-alignment.md`; `history/distribution-baseline.md` | preserved implemented legacy deprecated | Workspace onboarding path has P7 proof; P8 deprecates and exposes migration guidance without claiming shell/global replacement, and final removal follows the 30-day preview fallback window unless superseded by a later release decision. |
| Adding config defaults, env assumptions, or infra dependencies must register with doctor/fix. | `docs/distribution-vision.md`, repo `AGENTS.md` | `contracts/setup-doctor-registry.md`; `vision.md` | preserved | Keep this as a packaging-distribution DoD gate. |
| Canonical skill source lives under component/domain authority; host skill folders are projections/adapters. | Current skill-source scan and distribution discussion | `contracts/skill-package-distribution.md`; `verification/implementation-alignment.md` | preserved implemented | Executable source discovery, duplicate checks (skill names, canonical intent IDs, and derived host command paths/triggers), shared-fragment collision protection, and precise adapter target classification implemented in P2; Gemini CLI extension adapter target and legacy trigger compatibility mapping remain partial. |
| `fgos-code-panel` is a coding-domain application surface over coordination/group-thinking, not a group-thinking special case. | Current design discussion | `domains/coding/skills/fgos-code-panel/`; `contracts/skill-package-distribution.md`; `verification/implementation-alignment.md` | preserved implemented | Proved by moving canonical source to `domains/coding/skills/fgos-code-panel/` and retaining host-visible projections. |
| `AGENTS.md` is the portable instruction projection; Claude/Gemini/Codex-specific files are adapters when host features require them. | Current design discussion | `contracts/instruction-composition-and-projection.md`; `verification/implementation-alignment.md` | preserved implemented partial | P3 instruction source registry, P4 effective-set composition, and P5 portable `AGENTS.md` rendering/stale projection repair are implemented. Host-specific adapter expansion and full projection-ledger coverage remain partial/future. |
| Merge policy is the hard logic; renderer syntax is host-adapter technology. | Current design discussion | `contracts/instruction-composition-and-projection.md` | preserved implemented | P4 implements explicit merge/conflict behavior in `src/setup/instruction-composition.mjs` with ordering, equal-authority/specificity, and high-authority effect regression tests. |
| Shared gateway, shared projection service, and remote runtime provider remain future constraints, not current implementation claims. | `future-constraints.md` | `architecture/future-constraints.md`; `verification/implementation-alignment.md`; historical redirect in old future-constraints doc | preserved planned | Revisit only when gateway grows runtime-adapter authority. |
| Legacy architecture docs must not compete with the promoted platform area. | P9 read-through of `docs/architect/packaging-distribution/**` | Status notes in all six current legacy architecture docs; `README.md` section 9; this audit | preserved historical redirected | Keep bodies for source preservation; write new target claims only under `docs/platform/packaging-distribution/**` or the owning non-packaging architecture area. |
```
## claim_1a5fa914c7e1b3a78888eb91b96238ca

```json
{
  "claimId": "claim_1a5fa914c7e1b3a78888eb91b96238ca",
  "path": "docs/platform/packaging-distribution/verification/source-preservation-audit.md",
  "anchor": "unheaded-block-8",
  "unitDigest": "a96cea1f93523ddc3e8498a8b5f3a2aa99a5d9429c34f1978df736381e340fae",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `a96cea1f93523ddc3e8498a8b5f3a2aa99a5d9429c34f1978df736381e340fae`

```text
| Detail to preserve | Original source | Current preserved location | Status | Gap / next action |
| --- | --- | --- | --- | --- |
| Packaging-distribution is the owner for install, release, activation, upgrade/repair, and doctor/fix readiness. | `scope-map.md`, component-boundary advisory | `README.md` section 5 and 7; `verification/implementation-alignment.md` | preserved partial | Promote the detailed component-boundary source into `docs/platform/component-boundary.md`. |
| Old and new sources need an explicit authority order. | Gap found during this rewrite | `README.md` section 3 | preserved | Keep this rule when old paths receive redirects/status notes. |
| Current code may implement legacy behavior even after target architecture supersedes it. | `runtime-identity-and-activation.md`, `docs/specs/distribution.md` | `README.md` section 3; `verification/implementation-alignment.md` | preserved | Maintain explicit legacy/deprecated status for compatibility behavior such as `fgos setup`. |
| Target workspace-onboarding vocabulary has no separate `fgos setup` verb. | `runtime-identity-and-activation.md`, host-invocation routing doc | `architecture/runtime-identity-and-activation.md`; `contracts/setup-doctor-registry.md`; `spec.md`; host-invocation routing now points back here | preserved implemented legacy deprecated | P8 marks `fgos setup` deprecated in command registry/help/setup payload and points workspace onboarding to `fgctl init` plus local `fgos doctor --fix`/`fgos doctor`; shell/global integration remains legacy setup compatibility through the 30-day preview fallback window unless a later release decision replaces it. |
| `fgctl init`, `fgctl repair`, and `fgctl upgrade` publish a ready binding, then invoke the active local runtime tail. | `runtime-identity-and-activation.md` | `architecture/runtime-identity-and-activation.md`; `contracts/setup-doctor-registry.md`; `architecture/fgctl-and-local-fgos.md` | preserved implemented | Proved in P7 via `packages/distribution/rust/src/init.rs`, `test/rust-host/fgctl-init.test.mjs`, and `test/rust-host/fgctl-upgrade.test.mjs`: publish atomic binding, run tail (`fgos init`, `fgos doctor --fix`, `fgos doctor`), and record transaction status. |
| Local `fgos init` owns workspace adoption and host-visible projections after activation. | `runtime-identity-and-activation.md` | `architecture/runtime-identity-and-activation.md`; `contracts/projection-ledger.md`; `contracts/instruction-composition-and-projection.md` | preserved planned | Do a focused projection materialization scan before claiming implementation. |
| Repository, workspace, work-history, runtime-coordination, release-store, worker capsule, and host-projection roots must stay separate. | `runtime-identity-and-activation.md`, `scope-map.md` | `contracts/repository-runtime-layout.md`; `verification/implementation-alignment.md`; historical redirects in old architecture docs | preserved partial | Verify worker capsule and projection ledger implementation before marking full. |
| Workspace `.fgos/config.json` is tracked workspace policy; global config fills only missing values. | `docs/specs/distribution.md`, `docs/distribution-vision.md` | `spec.md`; `contracts/setup-doctor-registry.md`; `verification/implementation-alignment.md` | preserved implemented | Keep any future Rust or Node config writer from reversing precedence. |
| Workspace `.fgos/distribution.json` is the tracked team/project runtime pin. | `runtime-identity-and-activation.md`, `scope-map.md` | `contracts/distribution-pin.md`; `contracts/repository-runtime-layout.md` | preserved implemented | Exact schema frozen at V1 with golden tests in `packages/distribution/rust/tests/schema_golden.rs`. |
| Workspace `.fgos/installation/activation.json` is the ignored per-workspace ready binding. | `runtime-identity-and-activation.md` | `contracts/activation-binding.md`; `contracts/repository-runtime-layout.md`; `verification/implementation-alignment.md` | preserved implemented | Exact schema extracted and frozen at V1 with golden tests in `packages/distribution/rust/tests/schema_golden.rs`. |
| Stable local shims live under `.fgos/installation/bin/`. | `runtime-identity-and-activation.md` | `contracts/repository-runtime-layout.md`; `architecture/runtime-identity-and-activation.md` | preserved partial | Confirm shell helper and Rust init agree on path and repair semantics. |
| Machine release store contains immutable release trees, install records, lock, and quarantine. | `runtime-identity-and-activation.md` | `contracts/repository-runtime-layout.md`; `architecture/runtime-identity-and-activation.md` | preserved partial | Add exact release-store path encoding once `TopologyContext` is frozen. |
| Release manifest identity is `artifactDigest`, not archive checksum. | `runtime-identity-and-activation.md` | `contracts/release-manifest.md`; `verification/implementation-alignment.md` | preserved implemented | Exact schema frozen at V1 with golden tests in `packages/distribution/rust/tests/schema_golden.rs`. |
| Release tree includes native binary entrypoints and `libexec/legacy-node/`. | `runtime-identity-and-activation.md` | `contracts/release-manifest.md`; `spec.md`; `verification/implementation-alignment.md` | preserved implemented | Keep `components.legacyNode.root` and `components.legacyNode.entry` as the only legacy payload locator. |
| Release/stage safety rejects symlink, escape, corrupt digest, and unsafe extraction cases. | `runtime-identity-and-activation.md` | `contracts/release-manifest.md`; `verification/install-and-release-proof.md` | preserved implemented | Keep proof tests with release tree changes. |
| npm/Node install remains a compatibility channel, not target architecture. | `docs/specs/distribution.md`, `history/distribution-baseline.md` | `history/distribution-baseline.md`; `spec.md`; `verification/implementation-alignment.md` | preserved implemented | Avoid adding new target obligations to global npm `bin.fgos`. |
| Package allowlist, end-user docs packaging, no lifecycle install script, and dev checkout helper remain traceable. | `docs/specs/distribution.md`, `history/distribution-baseline.md` | `history/distribution-baseline.md`; `spec.md`; `verification/install-and-release-proof.md` | preserved | Recheck `package.json` allowlist before release packaging changes. |
| `fgos doctor` default path is read-only. | `docs/specs/distribution.md`, `docs/distribution-vision.md` | `contracts/setup-doctor-registry.md`; `verification/implementation-alignment.md` | preserved implemented | Keep new doctor checks from writing in check-only mode. |
| `fgos doctor --fix` runs registered fixes and reports. | `docs/specs/distribution.md`, `docs/distribution-vision.md` | `contracts/setup-doctor-registry.md`; `verification/implementation-alignment.md` | preserved implemented | Avoid stale prose lists of every check/fix; point to registry evidence. |
| Legacy `fgos setup` runs registered fixes. | `docs/specs/distribution.md`, setup history note | `contracts/setup-doctor-registry.md`; `verification/implementation-alignment.md`; `history/distribution-baseline.md` | preserved implemented legacy deprecated | Workspace onboarding path has P7 proof; P8 deprecates and exposes migration guidance without claiming shell/global replacement, and final removal follows the 30-day preview fallback window unless superseded by a later release decision. |
| Adding config defaults, env assumptions, or infra dependencies must register with doctor/fix. | `docs/distribution-vision.md`, repo `AGENTS.md` | `contracts/setup-doctor-registry.md`; `vision.md` | preserved | Keep this as a packaging-distribution DoD gate. |
| Canonical skill source lives under component/domain authority; host skill folders are projections/adapters. | Current skill-source scan and distribution discussion | `contracts/skill-package-distribution.md`; `verification/implementation-alignment.md` | preserved implemented | Executable source discovery, duplicate checks (skill names, canonical intent IDs, and derived host command paths/triggers), shared-fragment collision protection, and precise adapter target classification implemented in P2; Gemini CLI extension adapter target and legacy trigger compatibility mapping remain partial. |
| `fgos-code-panel` is a coding-domain application surface over coordination/group-thinking, not a group-thinking special case. | Current design discussion | `domains/coding/skills/fgos-code-panel/`; `contracts/skill-package-distribution.md`; `verification/implementation-alignment.md` | preserved implemented | Proved by moving canonical source to `domains/coding/skills/fgos-code-panel/` and retaining host-visible projections. |
| `AGENTS.md` is the portable instruction projection; Claude/Gemini/Codex-specific files are adapters when host features require them. | Current design discussion | `contracts/instruction-composition-and-projection.md`; `verification/implementation-alignment.md` | preserved implemented partial | P3 instruction source registry, P4 effective-set composition, and P5 portable `AGENTS.md` rendering/stale projection repair are implemented. Host-specific adapter expansion and full projection-ledger coverage remain partial/future. |
| Merge policy is the hard logic; renderer syntax is host-adapter technology. | Current design discussion | `contracts/instruction-composition-and-projection.md` | preserved implemented | P4 implements explicit merge/conflict behavior in `src/setup/instruction-composition.mjs` with ordering, equal-authority/specificity, and high-authority effect regression tests. |
| Shared gateway, shared projection service, and remote runtime provider remain future constraints, not current implementation claims. | `future-constraints.md` | `architecture/future-constraints.md`; `verification/implementation-alignment.md`; historical redirect in old future-constraints doc | preserved planned | Revisit only when gateway grows runtime-adapter authority. |
| Legacy architecture docs must not compete with the promoted platform area. | P9 read-through of `docs/architect/packaging-distribution/**` | Status notes in all six current legacy architecture docs; `README.md` section 9; this audit | preserved historical redirected | Keep bodies for source preservation; write new target claims only under `docs/platform/packaging-distribution/**` or the owning non-packaging architecture area. |
```
## claim_d49ded772378614bfee7accdb98e1b67

```json
{
  "claimId": "claim_d49ded772378614bfee7accdb98e1b67",
  "path": "docs/platform/packaging-distribution/verification/source-preservation-audit.md",
  "anchor": "4-open-preservation-gaps",
  "unitDigest": "12759764bd84226565aec83783c69cd199f5be65f6a52f54b363292ed8a0de71",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `b35a4fb7382154716f2b2158abc51bbd14eb4a2803ec83deff675e2c1cd6af33`

```text
## 4. Open Preservation Gaps

| Gap | Why it matters | Proposed owner |
| --- | --- | --- |
| Worker capsule layout and worktree projection behavior need an implementation scan. | Future code-panel/fanout worktrees must not race shared runtime or projection state. | Packaging-distribution plus workspace topology. |
| Projection ledger implementation evidence is incomplete. | Generated host files must be repairable and conflict-aware. | Packaging-distribution projection contract. |
| `docs/platform/component-boundary.md` still needs the detailed Packaging-Distribution boundary promotion. | Area authority should not depend only on an advisory source. | Component-boundary doc owner. |
```
## claim_c642dd4d1d451849783d01dce0ec1cc6

```json
{
  "claimId": "claim_c642dd4d1d451849783d01dce0ec1cc6",
  "path": "docs/platform/packaging-distribution/verification/source-preservation-audit.md",
  "anchor": "unheaded-block-9",
  "unitDigest": "cb97c7066798b55f5039ca3ce1b3e5fedec78d732f3a5171faab6b0c55a0ac14",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `cb97c7066798b55f5039ca3ce1b3e5fedec78d732f3a5171faab6b0c55a0ac14`

```text
| Gap | Why it matters | Proposed owner |
| --- | --- | --- |
| Worker capsule layout and worktree projection behavior need an implementation scan. | Future code-panel/fanout worktrees must not race shared runtime or projection state. | Packaging-distribution plus workspace topology. |
| Projection ledger implementation evidence is incomplete. | Generated host files must be repairable and conflict-aware. | Packaging-distribution projection contract. |
| `docs/platform/component-boundary.md` still needs the detailed Packaging-Distribution boundary promotion. | Area authority should not depend only on an advisory source. | Component-boundary doc owner. |
```
## claim_fafb73b5ea707b55eb86bf21014f4b9c

```json
{
  "claimId": "claim_fafb73b5ea707b55eb86bf21014f4b9c",
  "path": "docs/platform/packaging-distribution/verification/source-preservation-audit.md",
  "anchor": "41-p9-legacy-doc-read-through",
  "unitDigest": "4d4fbe7346bc3dca3be4fe3fbbc54307e7baef95f0f7578d6579fd14ea7e7a00",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `28eab104014eca705dc674291ee8a4ae3acb7e80a9e6c606e63e5518cbdc1d7d`

```text
## 4.1 P9 Legacy Doc Read-Through

P9 manually read the current legacy architecture corpus and left each file with
an explicit status note:

| Legacy file | P9 disposition |
| --- | --- |
| `docs/architect/packaging-distribution/README.md` | Historical redirect to `docs/platform/packaging-distribution/README.md`. |
| `docs/architect/packaging-distribution/scope-map.md` | Historical redirect to the promoted area boundary and this audit. |
| `docs/architect/packaging-distribution/runtime-identity-and-activation.md` | Historical redirect to promoted runtime architecture and V1 contracts. |
| `docs/architect/packaging-distribution/future-constraints.md` | Historical redirect to promoted future-constraints architecture. |
| `docs/architect/packaging-distribution/workspace-runtime-model.md` | Historical redirect to workspace topology and promoted packaging-distribution runtime docs. |
| `docs/architect/packaging-distribution/history/distribution-baseline.md` | Historical source ledger; active condensed history remains in `docs/platform/packaging-distribution/history/distribution-baseline.md`. |

`migration-map.md` and `rewrite-plan.md` were earlier audit placeholders, not
legacy source rows, after P9 verified they are absent from the current tree and
have no `git log --all -- <path>` history. No current file was deleted by P9
for those paths.
```
## claim_bc6eac84b86755b77a6a0b2d4aeb64af

```json
{
  "claimId": "claim_bc6eac84b86755b77a6a0b2d4aeb64af",
  "path": "docs/platform/packaging-distribution/verification/source-preservation-audit.md",
  "anchor": "unheaded-block-10",
  "unitDigest": "0de472b60df57deec92e00c06e6eef1c87e0ee69881b53e6f5f1f9dcc1fc5333",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `0de472b60df57deec92e00c06e6eef1c87e0ee69881b53e6f5f1f9dcc1fc5333`

```text
P9 manually read the current legacy architecture corpus and left each file with
an explicit status note:
```
## claim_e999f8a84ba6dfa49f16a00d257f4b33

```json
{
  "claimId": "claim_e999f8a84ba6dfa49f16a00d257f4b33",
  "path": "docs/platform/packaging-distribution/verification/source-preservation-audit.md",
  "anchor": "unheaded-block-11",
  "unitDigest": "43c93400ac51633b181197a37b6f50d9a4358d026049d02b3af4cdfe9acba97a",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `43c93400ac51633b181197a37b6f50d9a4358d026049d02b3af4cdfe9acba97a`

```text
| Legacy file | P9 disposition |
| --- | --- |
| `docs/architect/packaging-distribution/README.md` | Historical redirect to `docs/platform/packaging-distribution/README.md`. |
| `docs/architect/packaging-distribution/scope-map.md` | Historical redirect to the promoted area boundary and this audit. |
| `docs/architect/packaging-distribution/runtime-identity-and-activation.md` | Historical redirect to promoted runtime architecture and V1 contracts. |
| `docs/architect/packaging-distribution/future-constraints.md` | Historical redirect to promoted future-constraints architecture. |
| `docs/architect/packaging-distribution/workspace-runtime-model.md` | Historical redirect to workspace topology and promoted packaging-distribution runtime docs. |
| `docs/architect/packaging-distribution/history/distribution-baseline.md` | Historical source ledger; active condensed history remains in `docs/platform/packaging-distribution/history/distribution-baseline.md`. |
```
## claim_e8a482f2dfe2df7a3e21f848e16743fd

```json
{
  "claimId": "claim_e8a482f2dfe2df7a3e21f848e16743fd",
  "path": "docs/platform/packaging-distribution/verification/source-preservation-audit.md",
  "anchor": "unheaded-block-12",
  "unitDigest": "3aab723fc166e88f6ffea1f3bb812838d50a207e61aaa3f36b7ba71c66aeb92f",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `3aab723fc166e88f6ffea1f3bb812838d50a207e61aaa3f36b7ba71c66aeb92f`

```text
`migration-map.md` and `rewrite-plan.md` were earlier audit placeholders, not
legacy source rows, after P9 verified they are absent from the current tree and
have no `git log --all -- <path>` history. No current file was deleted by P9
for those paths.
```
## claim_51bb238d82a1fef4af6f3df2d4b6065d

```json
{
  "claimId": "claim_51bb238d82a1fef4af6f3df2d4b6065d",
  "path": "docs/platform/packaging-distribution/verification/source-preservation-audit.md",
  "anchor": "5-future-promotion-rule",
  "unitDigest": "91424a73f4bcfcb198e908fd3bd39e22bd0fde3c77e693efe9f1a9364fcf77e5",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `7e2a42daae6501290906106cef5657e0a68dd915a42de8246f2ea24a97d8c22c`

```text
## 5. Future Promotion Rule

Every future packaging-distribution doc edit should update one of these audit surfaces:

- `verification/implementation-alignment.md` when implementation status changes;
- this file when a legacy/history/source detail is promoted, superseded, or found missing;
- `history/distribution-baseline.md` when a legacy fact remains useful but no longer belongs in target design;
- the exact contract doc when a shape or boundary is frozen.

This is intentionally stricter than ordinary prose editing. The component has enough old sources that undocumented promotion is the main risk.
```
## claim_e84d671e0018054f98115ad6de7d222b

```json
{
  "claimId": "claim_e84d671e0018054f98115ad6de7d222b",
  "path": "docs/platform/packaging-distribution/verification/source-preservation-audit.md",
  "anchor": "unheaded-block-13",
  "unitDigest": "caffdab563c951626e810e07c98a45f427dbcd48b1211ad594560b4bc96334ce",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `caffdab563c951626e810e07c98a45f427dbcd48b1211ad594560b4bc96334ce`

```text
Every future packaging-distribution doc edit should update one of these audit surfaces:
```
## claim_a8146296d0603a96f02860628275f332

```json
{
  "claimId": "claim_a8146296d0603a96f02860628275f332",
  "path": "docs/platform/packaging-distribution/verification/source-preservation-audit.md",
  "anchor": "unheaded-block-14",
  "unitDigest": "a6d1be72665f9fda22624951471144eb3f67a132be49b1dbaa961c1011fc57e7",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `a6d1be72665f9fda22624951471144eb3f67a132be49b1dbaa961c1011fc57e7`

```text
- `verification/implementation-alignment.md` when implementation status changes;
- this file when a legacy/history/source detail is promoted, superseded, or found missing;
- `history/distribution-baseline.md` when a legacy fact remains useful but no longer belongs in target design;
- the exact contract doc when a shape or boundary is frozen.
```
## claim_ba13a1c288860d839211dd7eacbd04cf

```json
{
  "claimId": "claim_ba13a1c288860d839211dd7eacbd04cf",
  "path": "docs/platform/packaging-distribution/verification/source-preservation-audit.md",
  "anchor": "unheaded-block-15",
  "unitDigest": "6071f034cb3a009c44283ae44d49492fa112c36a782fa56808beeff9517a534a",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `6071f034cb3a009c44283ae44d49492fa112c36a782fa56808beeff9517a534a`

```text
This is intentionally stricter than ordinary prose editing. The component has enough old sources that undocumented promotion is the main risk.
```
## claim_b74a2f239da2dd9a018b60e3895498e8

```json
{
  "claimId": "claim_b74a2f239da2dd9a018b60e3895498e8",
  "path": "docs/platform/packaging-distribution/verification/source-preservation-audit.md",
  "anchor": "6-phase-isolation-rule",
  "unitDigest": "8f84c1400014f37511e2449b807a6243a5d4b417c54d00e2f69dc8b4a41df6b0",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `e904251ed0f0a60ec5decdada14c8e467514a3c717eb86e269eb257dd08516fc`

```text
## 6. Phase Isolation Rule

After this preservation audit, each implementation phase for packaging-distribution must run on its own branch/worktree.

That includes:

- moving `fgos-code-panel` into the coding domain;
- implementing instruction composition or projection renderers;
- changing skill distribution layout;
- changing `fgctl`, release-store, activation, setup, doctor, or legacy setup behavior.

The main checkout may be used to read, audit, and coordinate. It must not be the mutation workspace for the next implementation phase.
```
## claim_ec380e527a95178526ba9ddeff08b2d0

```json
{
  "claimId": "claim_ec380e527a95178526ba9ddeff08b2d0",
  "path": "docs/platform/packaging-distribution/verification/source-preservation-audit.md",
  "anchor": "unheaded-block-16",
  "unitDigest": "245a5f6c0a43b164ed2262f710aa44d88bc8c2ebb4d05757733ef3529a134915",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `245a5f6c0a43b164ed2262f710aa44d88bc8c2ebb4d05757733ef3529a134915`

```text
After this preservation audit, each implementation phase for packaging-distribution must run on its own branch/worktree.
```
## claim_fed44f9bbf488cb9d9398b9bcf5ef240

```json
{
  "claimId": "claim_fed44f9bbf488cb9d9398b9bcf5ef240",
  "path": "docs/platform/packaging-distribution/verification/source-preservation-audit.md",
  "anchor": "unheaded-block-17",
  "unitDigest": "f28a5dee65be8e994ba02f5e653f0526794945ab6b8fb10746adf5ffcf1b4071",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `f28a5dee65be8e994ba02f5e653f0526794945ab6b8fb10746adf5ffcf1b4071`

```text
That includes:

- moving `fgos-code-panel` into the coding domain;
- implementing instruction composition or projection renderers;
- changing skill distribution layout;
- changing `fgctl`, release-store, activation, setup, doctor, or legacy setup behavior.
```
## claim_8e4d67a64428ebf0a39517158a6e8f14

```json
{
  "claimId": "claim_8e4d67a64428ebf0a39517158a6e8f14",
  "path": "docs/platform/packaging-distribution/verification/source-preservation-audit.md",
  "anchor": "unheaded-block-18",
  "unitDigest": "a721c0f66b28baabf8268bc8c73334f7bc80e3e1c73e80cad1c5a500783ecbaf",
  "fileStatus": {
    "kind": "verification",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `a721c0f66b28baabf8268bc8c73334f7bc80e3e1c73e80cad1c5a500783ecbaf`

```text
The main checkout may be used to read, audit, and coordinate. It must not be the mutation workspace for the next implementation phase.
```
## claim_20fe0ac3d62c50bf718792466734d0a7

```json
{
  "claimId": "claim_20fe0ac3d62c50bf718792466734d0a7",
  "path": "docs/platform/packaging-distribution/vision.md",
  "anchor": "vision-packaging-distribution",
  "unitDigest": "b5eb2b54f66e628baaf779c84d48806d17155a69ffd9fcbc909d9a62bd2f05a9",
  "fileStatus": {
    "kind": "vision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `ed62e36adcdec0f2ce792fb8c35b1aed6d71c8284752a407524298109697b4c2`

````text
# Vision: Packaging-Distribution

```txt
Document type: Vision
Audience: Human reviewer, maintainer, architect, implementation agent
Purpose: State the living direction for fgOS packaging, install, doctor/fix readiness, and runtime activation
Design status: Draft
Implementation status: Implemented preview plus tracked partials
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted and reconciled from docs/distribution-vision.md
Last reviewed: 2026-09-18
Related:
- docs/platform/packaging-distribution/README.md
- docs/platform/packaging-distribution/spec.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/distribution-vision.md
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````
## claim_ea4010a6212e2e4f1cf0cf2679d96ccb

```json
{
  "claimId": "claim_ea4010a6212e2e4f1cf0cf2679d96ccb",
  "path": "docs/platform/packaging-distribution/vision.md",
  "anchor": "unheaded-block-1",
  "unitDigest": "1fd8bf579ea5e42ddf71266ca19bb9b63fa33d902bbf20acc4186706ca07a080",
  "fileStatus": {
    "kind": "vision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `1fd8bf579ea5e42ddf71266ca19bb9b63fa33d902bbf20acc4186706ca07a080`

````text
```txt
Document type: Vision
Audience: Human reviewer, maintainer, architect, implementation agent
Purpose: State the living direction for fgOS packaging, install, doctor/fix readiness, and runtime activation
Design status: Draft
Implementation status: Implemented preview plus tracked partials
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted and reconciled from docs/distribution-vision.md
Last reviewed: 2026-09-18
Related:
- docs/platform/packaging-distribution/README.md
- docs/platform/packaging-distribution/spec.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/distribution-vision.md
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````
## claim_328b9bf105bd20866bfda14001d859ea

```json
{
  "claimId": "claim_328b9bf105bd20866bfda14001d859ea",
  "path": "docs/platform/packaging-distribution/vision.md",
  "anchor": "1-purpose",
  "unitDigest": "80d64a114571aba5776a54699630f3db8f9273706c15e96eb0eb811e4e9a9619",
  "fileStatus": {
    "kind": "vision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `8ba89251bd0cf79d87f8a96f726832d92c75ebb3048eadb758442f6bca401859`

```text
## 1. Purpose

Packaging-distribution exists so fgOS can be reused outside its own source repo without making humans babysit install, runtime selection, or environment repair.

This vision is the north star for the area. Current behavior belongs in `spec.md`; exact contracts belong in `contracts/`; proof belongs in `verification/`.
```
## claim_a6bc6c969934b0524a575e3343ad223b

```json
{
  "claimId": "claim_a6bc6c969934b0524a575e3343ad223b",
  "path": "docs/platform/packaging-distribution/vision.md",
  "anchor": "unheaded-block-2",
  "unitDigest": "4d23ac9501024803cc8a2f79b62f5d27147ce5f72a963c2886d4e1b6e09001aa",
  "fileStatus": {
    "kind": "vision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `4d23ac9501024803cc8a2f79b62f5d27147ce5f72a963c2886d4e1b6e09001aa`

```text
Packaging-distribution exists so fgOS can be reused outside its own source repo without making humans babysit install, runtime selection, or environment repair.
```
## claim_6074ea7e1657b3313f14f949ab3c4c5d

```json
{
  "claimId": "claim_6074ea7e1657b3313f14f949ab3c4c5d",
  "path": "docs/platform/packaging-distribution/vision.md",
  "anchor": "unheaded-block-3",
  "unitDigest": "578ad2851cc42f523f195955ac313ce654f237838a3e698fc64aa9f23ed43211",
  "fileStatus": {
    "kind": "vision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `578ad2851cc42f523f195955ac313ce654f237838a3e698fc64aa9f23ed43211`

```text
This vision is the north star for the area. Current behavior belongs in `spec.md`; exact contracts belong in `contracts/`; proof belongs in `verification/`.
```
## claim_056d24e5269471159176f19da1641ff1

```json
{
  "claimId": "claim_056d24e5269471159176f19da1641ff1",
  "path": "docs/platform/packaging-distribution/vision.md",
  "anchor": "2-direction",
  "unitDigest": "df5016952b929495f79c0af830c13c201907e1ec5b5085f310087ad48924accc",
  "fileStatus": {
    "kind": "vision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `6bb7c13ea5214788279e87689a1bc8dbbfd4d7ce0e45340e3c612208bcb97b82`

````text
## 2. Direction

The area should make this true:

```txt
A developer can install or activate fgOS for a project, trust which runtime is
selected, repair common environment drift automatically, and verify the result
without cloning or understanding the fgOS source repo internals.
```
````
## claim_3ec48ba4321fad6466074fe0a51ffee0

```json
{
  "claimId": "claim_3ec48ba4321fad6466074fe0a51ffee0",
  "path": "docs/platform/packaging-distribution/vision.md",
  "anchor": "unheaded-block-4",
  "unitDigest": "ed313f7a0aa132d884d1e874b6e8c47527f128d3fa289ab75bee04218eb4a0f1",
  "fileStatus": {
    "kind": "vision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `ed313f7a0aa132d884d1e874b6e8c47527f128d3fa289ab75bee04218eb4a0f1`

```text
The area should make this true:
```
## claim_91727535b4087dddbf538c394ad17d20

```json
{
  "claimId": "claim_91727535b4087dddbf538c394ad17d20",
  "path": "docs/platform/packaging-distribution/vision.md",
  "anchor": "unheaded-block-5",
  "unitDigest": "5c852ff1845a6fcacf95de6e5a0d4e70c4161d7619be6a60ceaf22529ff70456",
  "fileStatus": {
    "kind": "vision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `5c852ff1845a6fcacf95de6e5a0d4e70c4161d7619be6a60ceaf22529ff70456`

````text
```txt
A developer can install or activate fgOS for a project, trust which runtime is
selected, repair common environment drift automatically, and verify the result
without cloning or understanding the fgOS source repo internals.
```
````
## claim_361048eda0a4765048b5a4a37c7121cb

```json
{
  "claimId": "claim_361048eda0a4765048b5a4a37c7121cb",
  "path": "docs/platform/packaging-distribution/vision.md",
  "anchor": "3-living-pillars",
  "unitDigest": "0d7f8191391e9145b3211d9c4475b14ff59dd2455326b1dbc0b33770bf7ba2c1",
  "fileStatus": {
    "kind": "vision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `c9d6119d4164c75d70e8ae39ccb48d94a3460031c5d25581d1a546f8e87a59c3`

```text
## 3. Living Pillars

| Pillar | Direction | Current status |
| --- | --- | --- |
| Install without cloning | Users should obtain `fgctl`/`fgos` without manually cloning the source repo. | Partial: `install.sh`, release assets, and legacy npm/git install paths exist. |
| Project-local runtime safety | A workspace should use its selected runtime, not an accidental global `PATH` binary. | Implemented preview: activation, tier-zero resolution, V1 schemas, and external-consumer Rust-host proof exist; stable/default graduation remains release-owned. |
| Global/project/dev contexts coexist | Global install, project-local install, and dev-checkout self-hosting must not break each other. | Implemented/partial: resolver tiers and config precedence exist; continue guarding drift. |
| Doctor/fix self-repair | Environment readiness should be repairable through named fixes, not just reported. | Implemented for the current registry model. |
| Extensible readiness/config registry | New modules should register checks, fixes, and config defaults through the shared registry. | Implemented; avoid ad hoc setup logic. |
| Composable agent instructions | Rules should originate under the authority that owns them, compose into an effective instruction set, and render to `AGENTS.md` or host adapters without semantic drift. | Implemented for canonical sources, composition, portable `AGENTS.md` managed-block rendering, and instruction projection health checks; host-specific adapter expansion remains demand-driven. |
| Portable skill distribution | A skill should be authored once under the owning component/domain and rendered into host-native adapter surfaces. | Partial: Codex/OpenAI, Claude wrapper, and plugin skill projections exist; Gemini extension target is planned. |
| CI as install/readiness confidence | CI/release proof should catch install/distribution failures before users do. | Implemented preview for the current release-shaped external-consumer proof; keep expanding as release promises grow. |
| Human-readable trust | Humans should be able to read docs and know what is implemented, partial, planned, or historical. | Implemented in the new docs through `Implementation Alignment`; must be maintained. |
```
## claim_06243b2dbfe4c6f7e577247592a938b5

```json
{
  "claimId": "claim_06243b2dbfe4c6f7e577247592a938b5",
  "path": "docs/platform/packaging-distribution/vision.md",
  "anchor": "unheaded-block-6",
  "unitDigest": "b1fddc62a3cb9e94e52354a9d13af2634716b24c5c058fbf618e5d01438459c3",
  "fileStatus": {
    "kind": "vision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `b1fddc62a3cb9e94e52354a9d13af2634716b24c5c058fbf618e5d01438459c3`

```text
| Pillar | Direction | Current status |
| --- | --- | --- |
| Install without cloning | Users should obtain `fgctl`/`fgos` without manually cloning the source repo. | Partial: `install.sh`, release assets, and legacy npm/git install paths exist. |
| Project-local runtime safety | A workspace should use its selected runtime, not an accidental global `PATH` binary. | Implemented preview: activation, tier-zero resolution, V1 schemas, and external-consumer Rust-host proof exist; stable/default graduation remains release-owned. |
| Global/project/dev contexts coexist | Global install, project-local install, and dev-checkout self-hosting must not break each other. | Implemented/partial: resolver tiers and config precedence exist; continue guarding drift. |
| Doctor/fix self-repair | Environment readiness should be repairable through named fixes, not just reported. | Implemented for the current registry model. |
| Extensible readiness/config registry | New modules should register checks, fixes, and config defaults through the shared registry. | Implemented; avoid ad hoc setup logic. |
| Composable agent instructions | Rules should originate under the authority that owns them, compose into an effective instruction set, and render to `AGENTS.md` or host adapters without semantic drift. | Implemented for canonical sources, composition, portable `AGENTS.md` managed-block rendering, and instruction projection health checks; host-specific adapter expansion remains demand-driven. |
| Portable skill distribution | A skill should be authored once under the owning component/domain and rendered into host-native adapter surfaces. | Partial: Codex/OpenAI, Claude wrapper, and plugin skill projections exist; Gemini extension target is planned. |
| CI as install/readiness confidence | CI/release proof should catch install/distribution failures before users do. | Implemented preview for the current release-shaped external-consumer proof; keep expanding as release promises grow. |
| Human-readable trust | Humans should be able to read docs and know what is implemented, partial, planned, or historical. | Implemented in the new docs through `Implementation Alignment`; must be maintained. |
```
## claim_3ff7da80e191986bd4a95ca11166ca1d

```json
{
  "claimId": "claim_3ff7da80e191986bd4a95ca11166ca1d",
  "path": "docs/platform/packaging-distribution/vision.md",
  "anchor": "4-mission-boundary",
  "unitDigest": "c851679171ac0213b83f4b2956a7578d0f8721dafbbbf5d88a69aa38b2b8f413",
  "fileStatus": {
    "kind": "vision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `7511eddebca2003991c2c49024a21b5b4af2a8b07b59b3ef349ae57189739955`

```text
## 4. Mission Boundary

Packaging-distribution is not an installer side quest. It is a platform capability:

- it lets fgOS serve other projects;
- it reduces environment friction;
- it prevents invisible runtime drift;
- it gives maintainers a repair path;
- it lets reviewers verify install/runtime claims.

It should optimize for the project using fgOS, not only for convenience while developing fgOS itself.
```
## claim_3084ab83499f38b77cfef461e8af8b0d

```json
{
  "claimId": "claim_3084ab83499f38b77cfef461e8af8b0d",
  "path": "docs/platform/packaging-distribution/vision.md",
  "anchor": "unheaded-block-7",
  "unitDigest": "f0ee1c56bc29234b360a942c6f86794deb05ea4b0edabec0164aadaf52df5681",
  "fileStatus": {
    "kind": "vision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `f0ee1c56bc29234b360a942c6f86794deb05ea4b0edabec0164aadaf52df5681`

```text
Packaging-distribution is not an installer side quest. It is a platform capability:
```
## claim_e814f6b6984ba20fe712dd02fd5f8f31

```json
{
  "claimId": "claim_e814f6b6984ba20fe712dd02fd5f8f31",
  "path": "docs/platform/packaging-distribution/vision.md",
  "anchor": "unheaded-block-8",
  "unitDigest": "6553422f0d19fab31fd2c23047fd96de9f5d0367bf86bcb301af3a0e17ed4908",
  "fileStatus": {
    "kind": "vision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `6553422f0d19fab31fd2c23047fd96de9f5d0367bf86bcb301af3a0e17ed4908`

```text
- it lets fgOS serve other projects;
- it reduces environment friction;
- it prevents invisible runtime drift;
- it gives maintainers a repair path;
- it lets reviewers verify install/runtime claims.
```
## claim_ee307fa88ef350a5823ed9d2cd5a816a

```json
{
  "claimId": "claim_ee307fa88ef350a5823ed9d2cd5a816a",
  "path": "docs/platform/packaging-distribution/vision.md",
  "anchor": "unheaded-block-9",
  "unitDigest": "f82808fb56932f3b1a71f841bf03a7a7b6cf159936aa0bfa41de8b6d260bc3d7",
  "fileStatus": {
    "kind": "vision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `f82808fb56932f3b1a71f841bf03a7a7b6cf159936aa0bfa41de8b6d260bc3d7`

```text
It should optimize for the project using fgOS, not only for convenience while developing fgOS itself.
```
## claim_e34260afc6a82e58944834d28048797f

```json
{
  "claimId": "claim_e34260afc6a82e58944834d28048797f",
  "path": "docs/platform/packaging-distribution/vision.md",
  "anchor": "5-strategic-shape",
  "unitDigest": "d6b7f674b6ed8d02ed8e03c00fdc8016b995c02674aa45afdffa32775e09d604",
  "fileStatus": {
    "kind": "vision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `fec35a1e6d99069a2cb7b35dac53e7a4aa9a2c661bff1d9c06d2d80cebcd3448`

````text
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
````
## claim_5ef583dd98814cb4c0dfc674d9d4e99b

```json
{
  "claimId": "claim_5ef583dd98814cb4c0dfc674d9d4e99b",
  "path": "docs/platform/packaging-distribution/vision.md",
  "anchor": "unheaded-block-10",
  "unitDigest": "e8304b25f89731c55ffab5c896921f827690431829dc8855c2409af2932db6df",
  "fileStatus": {
    "kind": "vision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `e8304b25f89731c55ffab5c896921f827690431829dc8855c2409af2932db6df`

````text
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
````
## claim_b0cd1cb4b3e14edac4fe5c75c9f93a45

```json
{
  "claimId": "claim_b0cd1cb4b3e14edac4fe5c75c9f93a45",
  "path": "docs/platform/packaging-distribution/vision.md",
  "anchor": "unheaded-block-11",
  "unitDigest": "02482e3ae1d9be5cd62782b5c61196e5610fec886596d970602950200fd59fdf",
  "fileStatus": {
    "kind": "vision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `02482e3ae1d9be5cd62782b5c61196e5610fec886596d970602950200fd59fdf`

```text
This keeps bootstrap authority, runtime identity, workflow semantics, and environment repair legible.
```
## claim_e732220a438345c0738b6448049c8917

```json
{
  "claimId": "claim_e732220a438345c0738b6448049c8917",
  "path": "docs/platform/packaging-distribution/vision.md",
  "anchor": "6-superseded-vision-notes",
  "unitDigest": "b1a9cfe0a65a2daee3d0705ad7d1a6f5c92c749cb35dea71144d1ec11a7d1abf",
  "fileStatus": {
    "kind": "vision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `c5c324ae14ca64c03838c502eabbcbf4dbe11182711c6d65bebbc8babe4a83dc`

```text
## 6. Superseded Vision Notes

The source document `docs/distribution-vision.md` recorded several things as not yet implemented on 2026-08-01. Some are now done or partially done:

| Old concern | Current reading |
| --- | --- |
| `doctor --fix` was deferred | Superseded; `doctor --fix` exists through registered fixes. |
| Doctor checks were a fixed list | Superseded; checks/fixes/defaults use registries. |
| Global/project precedence was not designed | Superseded/implemented; project config wins and awareness checks exist. |
| CI workflow was absent | Superseded/partial; CI/release workflows and external-consumer proof exist. |
| Dev-checkout/global shadowing needed handling | Partly addressed through resolver tiering; continue verifying shell and runtime paths. |
```
## claim_6dbf6cdde0cbd854a15d9bd34ca8ef5f

```json
{
  "claimId": "claim_6dbf6cdde0cbd854a15d9bd34ca8ef5f",
  "path": "docs/platform/packaging-distribution/vision.md",
  "anchor": "unheaded-block-12",
  "unitDigest": "87bf49b4d4ea060dc1c4161f12a20ba8c0f448c6eb813e27b5e76e4af83e19aa",
  "fileStatus": {
    "kind": "vision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `87bf49b4d4ea060dc1c4161f12a20ba8c0f448c6eb813e27b5e76e4af83e19aa`

```text
The source document `docs/distribution-vision.md` recorded several things as not yet implemented on 2026-08-01. Some are now done or partially done:
```
## claim_0cfd25adeb47b9b23e303584d9141254

```json
{
  "claimId": "claim_0cfd25adeb47b9b23e303584d9141254",
  "path": "docs/platform/packaging-distribution/vision.md",
  "anchor": "unheaded-block-13",
  "unitDigest": "8bc352ab16908242f7b305b460339413ef81dcaa873a7c84040532a84323bde3",
  "fileStatus": {
    "kind": "vision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `8bc352ab16908242f7b305b460339413ef81dcaa873a7c84040532a84323bde3`

```text
| Old concern | Current reading |
| --- | --- |
| `doctor --fix` was deferred | Superseded; `doctor --fix` exists through registered fixes. |
| Doctor checks were a fixed list | Superseded; checks/fixes/defaults use registries. |
| Global/project precedence was not designed | Superseded/implemented; project config wins and awareness checks exist. |
| CI workflow was absent | Superseded/partial; CI/release workflows and external-consumer proof exist. |
| Dev-checkout/global shadowing needed handling | Partly addressed through resolver tiering; continue verifying shell and runtime paths. |
```
## claim_c90e81459adb50a0afada2606874fa7b

```json
{
  "claimId": "claim_c90e81459adb50a0afada2606874fa7b",
  "path": "docs/platform/packaging-distribution/vision.md",
  "anchor": "7-what-must-stay-true",
  "unitDigest": "0b8943ab8e4945c526748b1f4745cadcb811a89c2754089ce19ba8170e63b957",
  "fileStatus": {
    "kind": "vision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `9fbfc208c5100128e90c8c784ed98159d25e7b587fa0a00127eb2614e3428969`

```text
## 7. What Must Stay True

- Install and activation failures should be explicit and repair-oriented.
- Doctor/fix paths must not silently mutate runtime identity.
- A release identity must be content-based, not path-based.
- Compatibility paths may exist, but docs must label them as compatibility when they are no longer the target architecture.
- Every new packaging-distribution claim must update `verification/implementation-alignment.md`.
```
## claim_1b8d7b56cb55fc504e069bff33e214eb

```json
{
  "claimId": "claim_1b8d7b56cb55fc504e069bff33e214eb",
  "path": "docs/platform/packaging-distribution/vision.md",
  "anchor": "unheaded-block-14",
  "unitDigest": "bcbf13d9201941dd21b3e9914f74b47af81aae9129ce35af5c72fcfd805ef3ce",
  "fileStatus": {
    "kind": "vision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `bcbf13d9201941dd21b3e9914f74b47af81aae9129ce35af5c72fcfd805ef3ce`

```text
- Install and activation failures should be explicit and repair-oriented.
- Doctor/fix paths must not silently mutate runtime identity.
- A release identity must be content-based, not path-based.
- Compatibility paths may exist, but docs must label them as compatibility when they are no longer the target architecture.
- Every new packaging-distribution claim must update `verification/implementation-alignment.md`.
```
## claim_863df64619a85df92e90e22859bda001

```json
{
  "claimId": "claim_863df64619a85df92e90e22859bda001",
  "path": "docs/platform/packaging-distribution/vision.md",
  "anchor": "8-related-docs",
  "unitDigest": "0f1043735aa5e248e824f1e9eb8aa21e76b2e179a7a53acdeeb43e1bbda703a6",
  "fileStatus": {
    "kind": "vision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `69d0232ee85bdd48258f4f72476fe3bd3fea1c92c0de0a883256f0cd91ff607e`

```text
## 8. Related Docs

| Need | Read |
| --- | --- |
| Current behavior | `spec.md` |
| Runtime design | `architecture/runtime-identity-and-activation.md` |
| fgctl/local fgos boundary | `architecture/fgctl-and-local-fgos.md` |
| Doctor/fix registry and legacy setup compatibility | `contracts/setup-doctor-registry.md` |
| Implementation status | `verification/implementation-alignment.md` |
| Historical baseline | `history/distribution-baseline.md` |
```
## claim_7fbb129f845689c212803611d4cd894f

```json
{
  "claimId": "claim_7fbb129f845689c212803611d4cd894f",
  "path": "docs/platform/packaging-distribution/vision.md",
  "anchor": "unheaded-block-15",
  "unitDigest": "9da43df4dfe4365ea6329c06e5a240ba336482b0b5562cf96a7adbfe946b6716",
  "fileStatus": {
    "kind": "vision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `9da43df4dfe4365ea6329c06e5a240ba336482b0b5562cf96a7adbfe946b6716`

```text
| Need | Read |
| --- | --- |
| Current behavior | `spec.md` |
| Runtime design | `architecture/runtime-identity-and-activation.md` |
| fgctl/local fgos boundary | `architecture/fgctl-and-local-fgos.md` |
| Doctor/fix registry and legacy setup compatibility | `contracts/setup-doctor-registry.md` |
| Implementation status | `verification/implementation-alignment.md` |
| Historical baseline | `history/distribution-baseline.md` |
```
