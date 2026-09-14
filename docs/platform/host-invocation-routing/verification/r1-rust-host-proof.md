# Verification: R1 Rust Host Proof

```txt
Document type: Verification
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Preserve the proof gate for the distributable Rust CLI host
Design status: Draft
Implementation status: Preview installed/default proof plus open stable/fallback-removal decisions
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md
Last reviewed: 2026-09-14
Related:
- docs/platform/host-invocation-routing/architecture/release-boundaries.md
- docs/platform/host-invocation-routing/verification/compatibility-harness.md
```

## 1. Required Proof

R1 preview installed/default proof is done when the installed product entry is
Rust-host-owned, every unmigrated selector transparently reaches Node through
the release manifest, `version` is native and creates no Node process, and
install/init/doctor/upgrade/rollback/uninstall are reproducible through
packaging-distribution's `fgctl` contracts. Stable/default release graduation
remains a release-owner decision. The legacy Node fallback escape hatch remains
supported for 30 calendar days after preview release publication.

## 2. Code-Verified Snapshot

| Evidence | Status |
| --- | --- |
| Rust host binary source under [../../../../apps/fgos/](../../../../apps/fgos/) | `implemented preview` |
| Host runtime crate under [../../../../packages/host-runtime/rust/](../../../../packages/host-runtime/rust/) | `implemented preview` |
| Command route matrix in [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json) | `current partial`: 73 selectors total, 71 `legacy-cli`, two native |
| Native selectors | `current partial`: `version -> distribution.build.show`; local native read proof: `gate-bypass -> work.gate-bypass.show` |
| Production native descriptors beyond `distribution.build.show` | `current partial`: `gate-bypass -> work.gate-bypass.show`; `test.fixture.echo` is a test fixture |
| Installed/default runtime claim for preview public posture | `implemented preview`: external installs default `fgos` through the Rust host; public docs may state Rust host is the default installed runtime. |

## 3. Still-Open Release Decisions

| Decision | Status | Why code scan cannot close it |
| --- | --- | --- |
| Preview vs stable default | `preview approved; stable undecided` | Stable/default graduation is release posture, not implementation presence. |
| Compatibility-window duration | `30 calendar days after preview release publication` | The concrete calendar date derives from the public preview publication date; for the 2026-09-15 preview proof/public-posture decision, earliest removal is 2026-10-15 unless the public preview tag is published later. |

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

Both passed during local proof refreshes. Packaging-distribution P6/P7 and
whole-track closeout add preview installed/default proof that
`.fgos/installation/bin/fgos version --runtime-json` enters the Rust host and
reports the activated `artifactDigest`.

## 5. Related Files

| Relationship | File |
| --- | --- |
| release boundaries | [../architecture/release-boundaries.md](../architecture/release-boundaries.md) |
| compatibility harness | [compatibility-harness.md](compatibility-harness.md) |
| release manifest contract | [../../packaging-distribution/contracts/release-manifest.md](../../packaging-distribution/contracts/release-manifest.md) |
| source plan | [../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md) |
