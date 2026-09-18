# Verification: Implementation Alignment

```txt
Document type: Verification
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Track implementation status for host-invocation design claims
Design status: Draft
Implementation status: Preview installed/default proof plus current route-migration and R3 adapter snapshot
Canonical: Yes, after review
Owner: Host invocation
Source type: Created from documentation migration scan plus 2026-09-14 code scan of Rust host/runtime paths
Last reviewed: 2026-09-18
Related:
- docs/platform/host-invocation-routing/README.md
- docs/platform/host-invocation-routing/spec.md
- docs/platform/host-invocation-routing/intent-preservation-ledger.md
```

## 1. Purpose

This table prevents target architecture, current legacy behavior, and future planned work from collapsing into one truth.

## 2. Alignment Table

| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Existing Node CLI payload remains current compatibility behavior. | `legacy-current` | [../../../../bin/fgos.mjs](../../../../bin/fgos.mjs), [../../../../package.json](../../../../package.json) | Keep until Node removal gates pass. |
| `bin/fgos.mjs` is not relocated or renamed in source. | `legacy-current` | [../../../../bin/fgos.mjs](../../../../bin/fgos.mjs) | No action in docs migration. |
| Host invocation docs moved under platform area. | `current` | [../README.md](../README.md) | Old docs carry legacy/status notes for this migration pass. |
| No component-boundary change. | `current` | [../../component-boundary.md](../../component-boundary.md) | This migration does not change ownership or authority. |
| CLI and remote peer host model. | `current partial` | [../../../../packages/host-runtime/rust/tests/two_projectors.rs](../../../../packages/host-runtime/rust/tests/two_projectors.rs) | Test harness proves two projectors share `InvocationService`; production remote peer proof still required. |
| Chat peer host model. | `planned` | [../architecture/host-use-cases.md](../architecture/host-use-cases.md) | No chat adapter found in code scan. |
| Native `OperationRequest`/`ProviderOutcome` kernel. | `current partial` | [../../../../packages/host-runtime/rust/src/contracts.rs](../../../../packages/host-runtime/rust/src/contracts.rs), [../../../../packages/host-runtime/rust/src/invocation_service.rs](../../../../packages/host-runtime/rust/src/invocation_service.rs) | Current Rust slice exists; future providers may extend it. |
| Pure Router plus `InvocationService` pipeline. | `current partial` | [../../../../packages/host-runtime/rust/src/operation_provider_router.rs](../../../../packages/host-runtime/rust/src/operation_provider_router.rs), [../../../../packages/host-runtime/rust/src/invocation_service.rs](../../../../packages/host-runtime/rust/src/invocation_service.rs), [../../../../packages/host-runtime/rust/tests/module_graph.rs](../../../../packages/host-runtime/rust/tests/module_graph.rs) | Replacement resolution policy remains a documented R1 gap in registry/router code. |
| Two-stage authority. | `current partial` | [../../../../packages/host-runtime/rust/src/authority_gate.rs](../../../../packages/host-runtime/rust/src/authority_gate.rs), [../../../../packages/host-runtime/rust/src/invocation_service.rs](../../../../packages/host-runtime/rust/src/invocation_service.rs), [r2-external-process-proof.md](r2-external-process-proof.md) | R2-P5 proved the external process provider goes through the SAME unmodified caller-admission/selected-provider-grant pipeline as any built-in provider -- an ad-hoc synthetic-admission bypass was caught in review and deleted before merge, not shipped. Chat/remote-peer host authority proof remains future work. |
| `legacy-cli` bypasses semantic kernel and execs Node payload directly. | `implemented preview` | [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs), [../../../../apps/fgos/src/legacy_exec.rs](../../../../apps/fgos/src/legacy_exec.rs), [../../../../apps/fgos/tests/cli_tests.rs](../../../../apps/fgos/tests/cli_tests.rs), [../../packaging-distribution/verification/install-and-release-proof.md](../../packaging-distribution/verification/install-and-release-proof.md) | Preview installed/default proof is closed; route migration remains partial because 71 selectors still use the manifest-owned legacy CLI lane. |
| `CommandRouteDescriptor` exists for every selector. | `current partial` | [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json), [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs) | Current snapshot has 73 selectors: 71 `legacy-cli`, two native. Keep drift tests current. |
| External process provider protocol. | `implemented preview` | [../contracts/component-protocol.md](../contracts/component-protocol.md), [../../../../packages/host-runtime/rust/src/providers/external_process/frame_codec.rs](../../../../packages/host-runtime/rust/src/providers/external_process/frame_codec.rs), [../../../../packages/host-runtime/rust/src/providers/external_process/supervisor.rs](../../../../packages/host-runtime/rust/src/providers/external_process/supervisor.rs), [r2-external-process-proof.md](r2-external-process-proof.md) | R2-P3/P4 conformance suite passed (frame round-trip/reject cases, bounded supervision, crash/timeout/cancellation mapping); closed 2026-09-15. Production WASM and non-preview hardening remain future work. |
| Static external manifest discovery without execution. | `implemented preview` | [../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md), [../../../../packages/host-runtime/rust/src/providers/external_process/manifest.rs](../../../../packages/host-runtime/rust/src/providers/external_process/manifest.rs), [../../../../packages/host-runtime/rust/src/providers/external_process/registry.rs](../../../../packages/host-runtime/rust/src/providers/external_process/registry.rs), [r2-external-process-proof.md](r2-external-process-proof.md) | R2-P1/P2 fixture proof passed (fail-closed on malformed/missing/path-escaping/unsupported manifests; discovery proven not to execute provider code; duplicate/reserved/unknown-capability/incompatible-contract/built-in-replacement claims all refused); closed 2026-09-15. |
| Native `version` as `distribution.build.show`. | `implemented preview` | [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json), [../../../../apps/fgos/src/cli_projector.rs](../../../../apps/fgos/src/cli_projector.rs), [../../../../packages/distribution/rust/src/lib.rs](../../../../packages/distribution/rust/src/lib.rs), [../../../../apps/fgos/tests/cli_tests.rs](../../../../apps/fgos/tests/cli_tests.rs), [../../packaging-distribution/verification/install-and-release-proof.md](../../packaging-distribution/verification/install-and-release-proof.md), `cargo test -p fgos-host-runtime -p fgos --quiet` | Targeted Rust tests passed on 2026-09-14; preview external-consumer proof passed on 2026-09-15. Stable/default graduation remains a release-owner decision. |
| Production remote peer route. | `current partial` | [r3-remote-peer-proof.md](r3-remote-peer-proof.md), [../../../../herdr-plugin/src/remote_invocation.rs](../../../../herdr-plugin/src/remote_invocation.rs), `cargo test --manifest-path herdr-plugin/Cargo.toml remote_invocation --quiet` | R3-P1 adapter proof passed on 2026-09-18. R3-P2/R3-P3 still need `GET /v1/runtime` gateway wiring plus no-`VerbGateway`/no-`fgos.v1` route proof. |
| R1 route matrix. | `current partial` | [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json), `node --test test/rust-host/command-routes.test.mjs` | Code snapshot verified on 2026-09-14: 73 selectors, 71 legacy, two native. |
| Preview/stable and compatibility-window duration. | `preview settled; stable open; fallback window settled` | [../architecture/release-boundaries.md](../architecture/release-boundaries.md#2-open-release-decisions), [../../packaging-distribution/reports/track-closeout.md](../../packaging-distribution/reports/track-closeout.md) | Preview public posture is approved with Rust host as default installed runtime. Legacy Node fallback remains an explicit deprecated escape hatch for 30 calendar days after preview release publication. Stable/default graduation remains a product/release decision. |
| `gate-bypass` as next read proof. | `implemented local proof` | [../../../../packages/work-state/rust/src/lib.rs](../../../../packages/work-state/rust/src/lib.rs), [../../../../src/state/gate-bypass.mjs](../../../../src/state/gate-bypass.mjs), [../../../../src/setup/registrations.mjs](../../../../src/setup/registrations.mjs), [../../../../src/cli/command-registry.mjs](../../../../src/cli/command-registry.mjs), [../roadmap.md](../roadmap.md#7-phase-d-add-the-next-native-read-route) | No component-boundary change: read semantics belong to the existing work/state read core; setup/doctor readiness remains Packaging-Distribution. This proves only the read-only `work.gate-bypass.show` route, not full Work/State migration. |

## 3. Related Files

| Relationship | File |
| --- | --- |
| spec | [../spec.md](../spec.md) |
| ledger | [../intent-preservation-ledger.md](../intent-preservation-ledger.md) |
| compatibility harness | [compatibility-harness.md](compatibility-harness.md) |
| R1 proof | [r1-rust-host-proof.md](r1-rust-host-proof.md) |
| R2 proof | [r2-external-process-proof.md](r2-external-process-proof.md) |
| R3 proof | [r3-remote-peer-proof.md](r3-remote-peer-proof.md) |
