# Git phase 01, Lane B step 8: release manifest

Implemented optional `components.nativeAddon` (Node-API 8, target, raw SHA-256 and the three locked napi crate checksums), runtime projection, release staging and per-invocation dev-host staging. Present addons are verified through the existing canonical file verifier and legacy admission door used by stage/activation/host readers; absent addons remain compatible. Git phase 05 (M10) is the documented linux-x64 mandatory-field switch. Added `git-wal-v1` capabilities to newly staged payloads. History contained no earlier distribution addon mechanism; reused step 7's loader record and the existing release target table. `impact-analysis: inactive` (zero registered providers).

Fixed `ensureGitAddon`: honors caller CARGO_TARGET_DIR (default checkout `target`) and CARGO_HOME, copies no registry, and publishes only the completed addon into the confined development payload. CI uses `--locked`, audits dependencies, and compares per-target shipped addon digests against independent full-workspace builds (same feature graph, deterministic Windows linker). CI auditor is pinned to 0.20.2; 0.18.4 could not parse the current advisory database. Upstream release reference: https://github.com/EmbarkStudios/cargo-deny/releases/tag/0.20.2.

Verification (logs under `.fgos/runtime/phase-target/manifest-*.log`; private Cargo target/home selected only by the worker shell):

- `cargo test --locked -p fgos-distribution -p fgos-node-addon -p fgos-git`: passed, 138 tests, one existing ignored subprocess harness. Initial run hit an existing fixture's transient `Text file busy`; subsequent complete runs passed.
- `cargo clippy --locked -p fgos-distribution -p fgos-node-addon -p fgos-git --all-targets -- -D warnings`: passed.
- `node --test test/git/*.test.mjs test/architecture.test.mjs test/distribution/*.test.mjs`: 37 passed. Real addon loads through staged-release and dev-host manifests; verifies Cargo env preservation and default output behavior. Explicit files replace directory selection because this Node version rejects directory arguments.
- Existing golden files unchanged; added fixed historical serialized digest assertions for both full/minimal manifests without addon. New Rust tests cover missing/tampered bytes, target/ABI/checksum/path mismatch, missing files entry, symlink file/directory and optional absence.
- Workflow YAML parses; `git diff --check` passes. `cargo deny check bans sources` passes (existing workspace path/duplicate-version warnings).
- `cargo deny check advisories bans sources` fails honestly on existing `unsafe-libyaml` via `serde_yaml`: RUSTSEC-2024-0449. No advisory suppression was added. Independent Linux/Windows release builds and digest comparison require CI and were not run here. No full npm-suite green is claimed.

Outside-scope follow-up: `.githooks/pre-commit` requires a separately landed main allowlist grant before adding root `deny.toml`. Existing `test/rust-host/dev-host.test.mjs` fixtures copy only a host and omit Cargo.lock/the addon, so must be refreshed for the expanded dev-host contract. Replacing the unmaintained YAML dependency requires host-runtime and observe manifests/callers/tests outside this scope. Coordinator must update CHANGELOG and the program board. No git add/commit was run. MDView preview failed because its database is read-only.

Status: BLOCKED
Summary: Implementation and required Rust/Node checks pass; landing needs outside-scope root-file admission, dependency-audit remediation and fixture/documentation follow-up.
Concerns/Blockers: The new audit intentionally blocks CI on the existing unmaintained YAML dependency; root deny.toml cannot pass the current commit hook until its separate main grant lands.
Context refs:
- (none)

Finishing-pass update: the blockers above are resolved by [the follow-up report](phase-lead-261018-1521-git-p01-u9b-manifest-release-finish.md); retain this report as the original attempt evidence.
