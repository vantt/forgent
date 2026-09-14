# Verification: R1 Rust Host Proof

```txt
Document type: Verification
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Preserve the proof gate for the distributable Rust CLI host
Design status: Draft
Implementation status: Current partial proof plus open release decisions
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md
Last reviewed: 2026-09-14
Related:
- docs/platform/host-invocation-routing/architecture/release-boundaries.md
- docs/platform/host-invocation-routing/verification/compatibility-harness.md
```

## 1. Required Proof

R1 is done only when the installed product entry is Rust, every unmigrated selector transparently reaches Node, `version` is native and creates no Node process, and install/init/doctor/upgrade/rollback/uninstall are reproducible through packaging-distribution's `fgctl` contracts. The current repo already contains a partial Rust-host proof, but that is not the same as proving the installed public release.

## 2. Code-Verified Snapshot

| Evidence | Status |
| --- | --- |
| Rust host binary source under [../../../../apps/fgos/](../../../../apps/fgos/) | `current partial` |
| Host runtime crate under [../../../../packages/host-runtime/rust/](../../../../packages/host-runtime/rust/) | `current partial` |
| Command route matrix in [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json) | `current partial`: 73 selectors total, 71 `legacy-cli`, two native |
| Native selectors | `current partial`: `version -> distribution.build.show`; local native read proof: `gate-bypass -> work.gate-bypass.show` |
| Production native descriptors beyond `distribution.build.show` | `current partial`: `gate-bypass -> work.gate-bypass.show`; `test.fixture.echo` is a test fixture |

## 3. Still-Open Release Decisions

| Decision | Status | Why code scan cannot close it |
| --- | --- | --- |
| Preview vs stable default | `unknown` | This is release posture, not implementation presence. |
| Compatibility-window duration | `unknown` | This is support policy, not implementation presence. |

## 4. Proof Commands From Source Plan

```sh
npm test
cargo test --workspace
node --test test/install-packaging.test.mjs
```

Current targeted proof commands run on 2026-09-14:

```sh
cargo test -p fgos-host-runtime -p fgos-work-state -p fgos --quiet
node --test test/rust-host/command-routes.test.mjs
```

Both passed during local proof refreshes. Full release proof still needs the source plan commands and packaging-distribution install/activation/rollback checks.

## 5. Related Files

| Relationship | File |
| --- | --- |
| release boundaries | [../architecture/release-boundaries.md](../architecture/release-boundaries.md) |
| compatibility harness | [compatibility-harness.md](compatibility-harness.md) |
| release manifest contract | [../../packaging-distribution/contracts/release-manifest.md](../../packaging-distribution/contracts/release-manifest.md) |
| source plan | [../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md) |
