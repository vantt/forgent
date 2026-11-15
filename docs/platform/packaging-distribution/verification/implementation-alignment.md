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
Last reviewed: 2026-11-12 (packaging hardening rows)
Related:
- docs/platform/packaging-distribution/spec.md
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/contracts/repository-runtime-layout.md
- docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md
- docs/platform/packaging-distribution/contracts/skill-package-distribution.md
- docs/platform/packaging-distribution/verification/source-preservation-audit.md
Implementation: Original section-specific implementation statements retained; provenance does not certify current implementation
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
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
| Legacy npm/Node install remains compatibility path. | superseded | `README.md` (no npm section), `docs/platform/packaging-distribution/spec.md` 3.2, `test/cli/first-run-guide.test.mjs` (refuses the npm install in the README) | The channel is retired: it ships no native addon. Only the dev checkout and the legacy-node payload a release stages keep the Node entry points. |
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
| The render, the plugin mirror and `fgos setup` write only skill names fgOS owns, refuse a same-name directory with no generated stamp and any link, and the render is a fixed point. | implemented | `src/setup/skill-wrappers.mjs` (`renderSkillSurfaces`, `ownedSkillNames`), `test/setup/skill-wrappers.test.mjs` | Limit: a foreign directory that carries fgOS's own marker is treated as fgOS's until `fgos setup` retires (T9). `contracts/skill-package-distribution.md` section 3.1. |
| A `.claude/skills/<skill>/` directory holds only its generated `SKILL.md`; references are read from `.agents/skills`. | implemented | `src/setup/skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs`, `plans/reports/research-261109-1317-harden-t8-reference-copy-probe.md` | Probe: one skill, one seat shape; re-probe if a host that resolves paths against the wrapper directory is added. |
| A new worktree receives every skill directory the main checkout git-ignores under the agent skill roots, naming no kit. | implemented | `src/runner/worktree.mjs` (`provisionSkillRoots`), `src/util/agent-skill-dirs.mjs`, `test/runner/worktree.test.mjs` | Real copy (a hardlink write alters the source); cost is the size of the machine's foreign skill directories. |
| Host-neutral skill intent ids map to host-native triggers. | planned | vocabulary only: `contracts/skill-package-distribution.md` section 6 (no code derives it; the derivation lived in the removed Gemini generator) | A trigger works from the skill directory name or a hand-authored plugin command. Compatibility vocabulary (`/fgOS:pick`, `/fgOS:submit`) needs public-intent metadata or an explicit alias contract before it is code. |
| Gemini receives a native extension/package target for fgOS skills. | not provided | removed with the unused prototype generator (`git log -S generateGeminiSkillPackage`) | Add through the common render (`renderSkillSurfaces`) if a Gemini consumer appears. |
| Shared skill fragments cannot collide across component-owned sources. | implemented | `src/setup/skill-wrappers.mjs` (`discoverSharedFragments`, `assembleSkills`), `test/setup/skill-wrappers.test.mjs` | Move toward namespaced fragment layout (_shared/<owner>/) as multi-domain fragments expand. |
| `fgos-code-panel` is a coding-domain application surface over coordination/group-thinking, not a group-thinking special case. | implemented | `domains/coding/skills/fgos-code-panel/`, `test/setup/skill-wrappers.test.mjs`, `test/skills/fgos-mirror.test.mjs` | Proved via canonical source in coding domain with generated projections in `.agents/skills`, `.claude/skills`, and `plugins/fgOS/skills`. |
| Packaging-distribution is the platform-support component for packaging, install, activation, and doctor/fix readiness. | partial | `docs/platform/packaging-distribution/README.md`, `docs/platform/component-boundary.md`, `docs/architect/component-boundary/component-boundary-advisory.md` | Promote the detailed component-boundary source into `docs/platform/component-boundary.md` before marking final. |
| `fgctl` never writes host-visible projections directly. | implemented | `apps/fgctl/src/main.rs`, `packages/distribution/rust/src/init.rs` (`publish_and_tail`, `preflight_candidate`), `test/rust-host/fgctl-init.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs` | Proved in P7: fgctl stages releases, creates stable shims/root/activation records, and invokes local runtime tail without writing host-visible projections directly; candidate preflight writes nothing. |
| `fgctl init`, `upgrade` and `repair` end on one result: `Ready` plus `Next`, `nothing to do`, or a numbered list of checks that need the person with exit 2. | implemented | `packages/distribution/rust/src/init.rs` (`closing_block`, `noop_block`, `doctor_is_clean`), `test/rust-host/closing-block.test.mjs`, spec 6.2 | A clean no-op costs `fgos init` plus one doctor run (about 4 s, from about 9 s); measured in `plans/reports/closing-261112-1817-harden-packaging-distribution.md`. |
| `fgctl uninstall` removes what fgOS installed in the project, keeps config and data, and `--purge` also removes the release store entries. | implemented | `packages/distribution/rust/src/uninstall.rs`, `apps/fgctl/tests/uninstall_surface.rs`, `src/setup/uninstall-project.mjs`, `test/setup/uninstall-project.test.mjs`, consumer proof step in `scripts/ci-external-consumer.sh`, spec 6.1 | The binary, the launcher, a shell-rc line and global agent wiring are named, never removed (`install.sh --uninstall` is an owner idea). |
| Every `fgctl` verb and the five guided `fgos` verbs answer `--help` with changes, prerequisites, options, examples, exit codes and next step; both binaries answer `--version`. | implemented | `apps/fgctl/src/help.rs`, `apps/fgctl/tests/cli_surface.rs`, `src/cli/command-registry.mjs` (`guide`), `apps/fgos/src/help.rs` (unit tests), `test/rust-host/help-routes.test.mjs`, `apps/fgos/tests/cli_tests.rs`, spec 6.2 | `fgctl --help` lists exit codes 0, 1 and 2 only, while `init` can exit 4 on an unreadable pin; `fgos` usage errors exit 4 by owner choice. |
| Doctor reports each row with `status` and a failing row with `fix`, and the envelope carries `ok` and `next`. | implemented | `src/setup/registrations.mjs` (`runDoctor`), `test/setup/registrations.test.mjs`, `test/setup/doctor-strict-exit.test.mjs`, `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` | Exit code stays 0 whatever the checks say; `--strict` exits 1. The how-to's check tables lag the live doctor (backlog row). |
| Doctor warns when the active release is not the one the pin names. | implemented | `packages/distribution/rust/src/init.rs` (`pin_drift`), `src/setup/registrations.mjs` (`checkActivationMatchesPin`), `packages/distribution/rust/tests/pin_drift.rs`, `test/setup/pin-drift-check.test.mjs`, spec 6.3 | One golden ties the Rust and Node readers; the pin moves by a release how-to step, not a command. |
| Release defaults route only to agent CLIs found on the machine, and `fgos run` with none says so and names the fix. | implemented | `src/runner/paths.mjs` (`isCommandAvailable`), `src/runner/execution/bind.mjs`, `packages/seat-binding/rust/src/rank.rs`, `test/cli/run-verb.test.mjs`, spec 6.4 | The doctor rows that judge a CLI skip an absent one. A machine's own routing (six `thehive` cells, `ak:cook` skill lines, claude seat login) is declared in that machine's config. |
| A JSON-era config (`v0.2.0-rc.5` and earlier) is moved when a Config-era release is activated, and the gateway token is kept. | implemented | `src/verbs/state/settle-legacy-config.mjs`, `test/verbs/settle-legacy-config.test.mjs`, consumer proof upgrade step | Another project on the same machine still pinned to an older release refuses until it is upgraded. |
| `install.sh` runs nothing until its last line, refuses `http://` (loopback aside), caps downloads, needs exactly one checksum entry and runs the candidate before replacing `fgctl`. | implemented | `install.sh`, `test/install/install-sh.test.mjs`, `packages/distribution/rust/src/fetch.rs`, `scripts/install.ps1`, `test/install/install-ps1.test.mjs` | `FGCTL_ASSET_BASE_URL` still means a repository for "latest" in `fgctl` and `install.ps1` (backlog `p-g3erqtmmib`). The PowerShell consumer proof has not run. |
| A release needs the whole suite, the plugin manifest versions equal the product version, and the consumer proof upgrades from the previous published release. | implemented | `.github/workflows/release.yml` (`suite`), `scripts/prepare-release.mjs`, `test/scripts/prepare-release.test.mjs`, `scripts/previous-release-tag.mjs`, `scripts/ci-external-consumer.sh` | The workflow has not run end to end on a real tag; the first release run is its proof. |
| Building from source uses one compiler: Rust 1.99.0. | implemented | `rust-toolchain.toml`, `[workspace.package] rust-version` in `Cargo.toml` | The CI toolchain step (`rustup toolchain install`) is unproven until the first CI run. |
| Shared gateway/web remains future-only. | planned | `docs/platform/packaging-distribution/architecture/future-constraints.md` | Revisit when gateway owns a project runtime adapter. |

## 4. Fresh Scan Requirement

Before changing factual implementation claims in this area:

1. scan docs for related current/historical claims;
2. scan code/tests for current behavior;
3. update this table before promoting prose elsewhere.

When the edit promotes, retires, or contradicts a detail from older packaging-distribution sources, also update `source-preservation-audit.md`.
