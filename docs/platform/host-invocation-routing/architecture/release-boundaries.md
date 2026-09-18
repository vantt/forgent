# Architecture: Release Boundaries

```txt
Document type: Architecture
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Define R1, R2, R3, and later proof boundaries for host invocation
Design status: Draft
Implementation status: R1 preview installed/default proof plus current partial route migration
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md and rust-cli-and-proof-components-plan.md
Last reviewed: 2026-09-15
Related:
- docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md
- docs/platform/host-invocation-routing/verification/r2-external-process-proof.md
- docs/platform/host-invocation-routing/verification/r3-remote-peer-proof.md
```

## 1. Release Boundaries

| Release | Required slice | Explicitly not a gate |
| --- | --- | --- |
| R1 | Distributable Rust CLI host, invocation kernel, const catalog/snapshot, two-stage authority, transitional CLI lane, native `distribution.build.show`, `fgctl` install/activation/rollback proof. | External ecosystem discovery, WASM, chat, production gateway migration, separate `setup` verb. |
| R2 | External process preview: framed protocol, supervision, fixture conformance, static manifest validation. `implemented preview`, closed 2026-09-15 -- see [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md). Derived cache by fingerprint stayed in-memory only (R2-P2's own scope decision); persisted cache/lock is future work. | Core replacement, signatures/marketplace, WASM. |
| R3 | Production remote peer: at least one project-local gateway route calls shared invocation service directly. | Parsing `fgos.v1` as internal API; future shared multi-project gateway. |

## 2. Open Release Decisions

| Decision | Status | Owner |
| --- | --- | --- |
| Current R1 route matrix | `current partial` | Code snapshot: 73 selectors, 71 `legacy-cli`, two native routes: `version -> distribution.build.show` and `gate-bypass -> work.gate-bypass.show`. |
| First public R1 preview vs stable default | `preview approved; stable undecided` | Packaging-distribution stream. |
| Compatibility-window duration for R1 Node fallback | `explicit escape hatch approved; 30 calendar days after preview release publication` | Packaging-distribution stream plus host invocation. |

## 3. Implementation Alignment

| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| R1 Rust host code path exists. | `implemented preview` | [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs), [../../../../packages/host-runtime/rust/src/lib.rs](../../../../packages/host-runtime/rust/src/lib.rs), [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json), [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md) | Route migration remains partial: 71 selectors still use the manifest-owned legacy CLI lane. |
| R1 is a shipped host only with reproducible install/activation/rollback proof. | `implemented preview` | [source plan §18](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#18-definition-of-done), [../../packaging-distribution/reports/track-closeout.md](../../packaging-distribution/reports/track-closeout.md), [../../packaging-distribution/verification/install-and-release-proof.md](../../packaging-distribution/verification/install-and-release-proof.md) | Stable/default release graduation remains a release-owner decision. |
| R2 and R3 do not delay R1 installed-entry flip. | `confirmed` | [source plan §1](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#1-outcome), [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md)#6, [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md) | Every R2 merge re-ran and passed the full R1 proof (`cargo test -p fgos-host-runtime -p fgos --quiet`, `node --test test/rust-host/command-routes.test.mjs`) with `apps/fgos` composition-root wiring untouched. R3 is a separate implemented-preview gateway peer proof for `GET /v1/runtime`; it does not change the R1 installed-entry flip. |
| `fgctl` owns rollback; runtime provider selection does not. | `accepted-not-implemented` | [packaging runtime activation](../../packaging-distribution/architecture/runtime-identity-and-activation.md) | Packaging proof required. |

## 4. Related Files

| Relationship | File |
| --- | --- |
| R1 proof | [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md) |
| R2 proof | [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md) |
| R3 proof | [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md) |
| compatibility harness | [../verification/compatibility-harness.md](../verification/compatibility-harness.md) |
| source plan | [../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md) |
