# Host Invocation Source Preservation Audit

```txt
Document type: Verification audit
Audience: Human reviewer, architect, maintainer, documentation agent
Purpose: Prove that old host-invocation source details were classified and preserved during migration
Design status: Draft
Implementation status: Current migration snapshot
Canonical: Yes, after review
Owner: Host invocation
Source type: Audit over docs/architect/host-invocation-routing/** and docs/platform/host-invocation-routing/**
Last reviewed: 2026-09-14
Related:
- docs/platform/host-invocation-routing/intent-preservation-ledger.md
- docs/platform/host-invocation-routing/history/source-inventory.md
- docs/platform/host-invocation-routing/verification/implementation-alignment.md
```

## 1. Audit Result

Every old host-invocation source named by the migration plan is classified in [../history/source-inventory.md](../history/source-inventory.md), and every settled design or migration claim found during this pass has a row in [../intent-preservation-ledger.md](../intent-preservation-ledger.md).

No settled source detail was intentionally dropped. Open decisions remain marked as `unknown`, `planned`, `deferred`, or proof gaps instead of being silently promoted to current behavior.

No component-boundary change. This migration creates canonical platform documentation under [../README.md](../README.md) and keeps the existing high-level owner as [Host And Surface Layer](../../component-boundary.md#4-current-high-level-components).

## 2. Source Coverage Matrix

| Legacy source | Source content audited | Preservation target |
| --- | --- | --- |
| [documentation-standardization-plan.md](../../../architect/host-invocation-routing/documentation-standardization-plan.md) | Goal, non-goals, hard rules, source inventory requirement, target tree, status vocabulary, phase order, ledger requirement, old-doc redirect requirement, component-boundary check, validation requirement. | [../README.md](../README.md), [../intent-preservation-ledger.md](../intent-preservation-ledger.md), [../history/source-inventory.md](../history/source-inventory.md), this audit. |
| [host-invocation-provider-routing.md](../../../architect/host-invocation-routing/host-invocation-provider-routing.md) | Architecture name, problem statement, canonical names, peer host use cases, core contracts, pure Router, `InvocationService`, two-stage authority, failure families, lifecycle record, human-input parking, physical placement, release boundaries, open questions. | [../vision.md](../vision.md), [../architecture/invocation-kernel.md](../architecture/invocation-kernel.md), [../architecture/host-use-cases.md](../architecture/host-use-cases.md), [../architecture/provider-routing.md](../architecture/provider-routing.md), [../contracts/operation-catalog.md](../contracts/operation-catalog.md), [../contracts/operation-provider.md](../contracts/operation-provider.md), [../contracts/operation-request-outcome.md](../contracts/operation-request-outcome.md), [implementation-alignment.md](implementation-alignment.md), ledger rows HI-I001 through HI-I019. |
| [external-provider-protocol.md](../../../architect/host-invocation-routing/external-provider-protocol.md) | Component class versus invocation mechanism, built-in/process/WASM protocol placement, JSON-RPC 2.0 semantics over length-prefixed stdio frames, static manifest discovery, registry/linker meaning, namespace and replacement rules. | [../architecture/external-provider-protocol.md](../architecture/external-provider-protocol.md), [../contracts/component-protocol.md](../contracts/component-protocol.md), [../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md), [../architecture/provider-routing.md](../architecture/provider-routing.md), [r2-external-process-proof.md](r2-external-process-proof.md), ledger rows HI-I020 through HI-I024. |
| [legacy-cli-transition.md](../../../architect/host-invocation-routing/legacy-cli-transition.md) | Separate `LegacyCliPassthroughProvider` and `LegacySemanticProvider`, `legacy-node` identity, `bin/fgos.mjs` immovability, activation-manifest resolution, caller inventory, `CommandRouteDescriptor`, Rust parser ownership, `fgos.v1` presentation boundary, Rust host benefit/cost. | [../architecture/legacy-cli-transition.md](../architecture/legacy-cli-transition.md), [../contracts/legacy-payload.md](../contracts/legacy-payload.md), [../contracts/command-route-descriptor.md](../contracts/command-route-descriptor.md), [compatibility-harness.md](compatibility-harness.md), [../history/host-invocation-baseline.md](../history/host-invocation-baseline.md), ledger rows HI-I025 through HI-I033. |
| [node-to-rust-component-migration.md](../../../architect/host-invocation-routing/node-to-rust-component-migration.md) | Chosen migration strategy, rejected migration options, R1/R2/R3 sequence, release readiness categories, component-boundary repetition rule, read-model-before-writer rule, writer migration constraints, Node removal gate, rollback rules, verification gate, remaining decisions. | [../architecture/node-to-rust-migration.md](../architecture/node-to-rust-migration.md), [../architecture/release-boundaries.md](../architecture/release-boundaries.md), [r1-rust-host-proof.md](r1-rust-host-proof.md), [r2-external-process-proof.md](r2-external-process-proof.md), [r3-remote-peer-proof.md](r3-remote-peer-proof.md), [../history/host-invocation-baseline.md](../history/host-invocation-baseline.md), ledger rows HI-I034 through HI-I038. |
| [rust-cli-and-proof-components-plan.md](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md) | Outcome, non-goals, settled choices, P0-P9 proof graph, test gates, rollback gates, risk controls, done criteria, remaining choices for target matrix, compatibility window, and preview versus stable. | [../architecture/release-boundaries.md](../architecture/release-boundaries.md), [compatibility-harness.md](compatibility-harness.md), [r1-rust-host-proof.md](r1-rust-host-proof.md), [r2-external-process-proof.md](r2-external-process-proof.md), [r3-remote-peer-proof.md](r3-remote-peer-proof.md), [implementation-alignment.md](implementation-alignment.md), ledger rows HI-I016 through HI-I019 and HI-I034 through HI-I038. |

## 3. Disposition Coverage

| Required disposition | Coverage in this migration |
| --- | --- |
| `promote` | Canonical target claims are promoted into [../vision.md](../vision.md), [../spec.md](../spec.md), [../architecture/](../architecture/README.md), [../contracts/](../contracts/README.md), and [../verification/](README.md). |
| `split` | Cross-cutting source docs are split across architecture, contract, verification, and history docs, with target locations recorded in [../intent-preservation-ledger.md](../intent-preservation-ledger.md). |
| `keep legacy` | Old docs remain under [../../../architect/host-invocation-routing/](../../../architect/host-invocation-routing/) with legacy/status notes while the transition remains active. |
| `redirect` | Old docs now point readers to the promoted platform docs, and [../history/source-inventory.md](../history/source-inventory.md) records the destination set. |
| `archive` | The standardization plan and agent-coordination references are retained as historical/pattern sources, not current host-invocation authority. |
| `deferred` | R2/R3 protocol work, future chat host, marketplace/signature/WASM expansion, and open release-policy decisions stay deferred or planned. |
| `superseded` | Rejected migration routes and old location authority are superseded by the promoted area structure and selected Rust-host-first sequence. |
| `rejected` | Node-thinning-first, big-bang rewrite, semantic write dual-run, fake gate-policy component, and config-based replacement of built-ins are preserved as rejected choices in the ledger and migration docs. |
| `unknown` | Stable/default graduation, first external provider set, and chat admission/interruption details remain unknown where the old sources left them open. Preview public posture and the 30-day legacy fallback escape-hatch window are now settled by packaging-distribution/release-owner decision. |

## 4. Alignment Rule Check

The migration plan required every design claim to carry implementation alignment or a proof gap. The main alignment table is [implementation-alignment.md](implementation-alignment.md). Proof-specific gaps are split into [compatibility-harness.md](compatibility-harness.md), [r1-rust-host-proof.md](r1-rust-host-proof.md), [r2-external-process-proof.md](r2-external-process-proof.md), and [r3-remote-peer-proof.md](r3-remote-peer-proof.md).

Claims without implementation proof are labelled `accepted-not-implemented`, `planned`, or `unknown`; they are not labelled `current`.

## 5. Remaining Unknowns

After the code scan, some former unknowns became code-verified current snapshots. The remaining unknowns are preserved decisions, not omitted documentation. They remain open because closing them would require product/release ownership, component-boundary ownership, or implementation work outside this documentation migration.

| Unknown | Kind | Why it is unknown | Where tracked |
| --- | --- | --- | --- |
| Current R1 route matrix. | Code-verified current snapshot | `packages/host-runtime/contracts/command-routes.json` contains 73 selectors: 71 `legacy-cli`, two native routes: `version -> distribution.build.show` and `gate-bypass -> work.gate-bypass.show`. | [r1-rust-host-proof.md](r1-rust-host-proof.md), [../spec.md](../spec.md#6-unknowns) |
| Preview versus stable public contract split. | Product / release decision | The old plan names it as a remaining decision before R1, and code presence cannot decide public release posture. | [../architecture/release-boundaries.md](../architecture/release-boundaries.md), [../intent-preservation-ledger.md](../intent-preservation-ledger.md) |
| Legacy compatibility support window. | Product / support decision | The support duration affects rollback and Node-removal policy, and was not settled in the source docs. | [compatibility-harness.md](compatibility-harness.md), [../intent-preservation-ledger.md](../intent-preservation-ledger.md) |
| Production native descriptors beyond `distribution.build.show`. | Code-verified current snapshot | `gate-bypass -> work.gate-bypass.show` is the second production native route; `test.fixture.echo` is a host-runtime test fixture. | [../spec.md](../spec.md#6-unknowns), [../contracts/command-route-descriptor.md](../contracts/command-route-descriptor.md) |
| `gate-bypass` component ownership. | Code-verified local native proof | Code location is clear: read semantics live in `src/state/gate-bypass.mjs`, setup/doctor readiness lives in `src/setup/registrations.mjs`, and CLI grammar lives in `src/cli/command-registry.mjs`. Native migration uses existing work/state read ownership with no new component-boundary change. | [../roadmap.md](../roadmap.md#7-phase-d-add-the-next-native-read-route), [implementation-alignment.md](implementation-alignment.md) |
| First external provider preview set and conformance fixture set. | Product / conformance decision | Scan found no current external process provider implementation or manifest set beyond planned protocol docs. | [r2-external-process-proof.md](r2-external-process-proof.md), [../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md) |
| Chat host admission, interruption, presentation, and lifecycle semantics. | Future host contract decision | Scan found no current chat host adapter implementation. | [../architecture/host-use-cases.md](../architecture/host-use-cases.md), [../intent-preservation-ledger.md](../intent-preservation-ledger.md) |

## 6. Code Scan Evidence

| Check | Evidence | Result |
| --- | --- | --- |
| Route matrix count | [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json) | 73 selectors: 71 `legacy-cli`, two native. |
| Native production operations | [../../../../apps/fgos/src/cli_projector.rs](../../../../apps/fgos/src/cli_projector.rs), [../../../../packages/distribution/rust/src/lib.rs](../../../../packages/distribution/rust/src/lib.rs), [../../../../packages/work-state/rust/src/lib.rs](../../../../packages/work-state/rust/src/lib.rs) | `version` projects to `distribution.build.show`; `gate-bypass` projects to `work.gate-bypass.show`. |
| Rust host/runtime proof | [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs), [../../../../packages/host-runtime/rust/src/invocation_service.rs](../../../../packages/host-runtime/rust/src/invocation_service.rs) | Current partial code path exists. |
| External provider implementation | `rg` over `src`, `bin`, `packages`, `apps`, `herdr-plugin` | No current external provider implementation/manifest set found. |
| Chat adapter implementation | `rg` over `src`, `bin`, `packages`, `apps`, `herdr-plugin` | No current chat host adapter found. |
| Targeted tests | `cargo test -p fgos-host-runtime -p fgos --quiet` | Passed on 2026-09-14. |

## 7. Related Files

| Relationship | File |
| --- | --- |
| preservation ledger | [../intent-preservation-ledger.md](../intent-preservation-ledger.md) |
| source inventory | [../history/source-inventory.md](../history/source-inventory.md) |
| implementation alignment | [implementation-alignment.md](implementation-alignment.md) |
| area portal | [../README.md](../README.md) |
| decisions index | [../decisions/README.md](../decisions/README.md) |
