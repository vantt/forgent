# Spec: Host Invocation

```txt
Document type: Area spec
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: State current and transition-state behavior for fgOS host invocation
Design status: Draft
Implementation status: Preview installed/default proof plus partial route migration
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/**
Last reviewed: 2026-09-14
Related:
- docs/platform/host-invocation-routing/README.md
- docs/platform/host-invocation-routing/intent-preservation-ledger.md
- docs/platform/host-invocation-routing/verification/implementation-alignment.md
```

## 1. Purpose

This spec separates what is current from what is accepted target, planned, legacy-current, superseded, or unknown for host invocation.

## 2. Current And Transition Status

| Concern | Status | Spec statement | Alignment |
| --- | --- | --- | --- |
| Existing Node CLI payload | `legacy-current` | Existing commands still run through the Node payload. `bin/fgos.mjs` remains in the source tree and must not be renamed or moved while the legacy payload exists. | [verification/implementation-alignment.md](verification/implementation-alignment.md#2-alignment-table) |
| Legacy Node payload identity | `accepted-not-implemented` target over `legacy-current` file | R1 names the payload `legacy-node` in the release manifest and locates it through `components.legacyNode.root` and `components.legacyNode.entry`. | [contracts/legacy-payload.md](contracts/legacy-payload.md) |
| Rust host code path | `implemented preview` | `apps/fgos` exists as a Rust CLI host, embeds `command-routes.json`, routes `version` natively to `distribution.build.show`, routes `gate-bypass` natively to `work.gate-bypass.show`, and routes other selectors through `legacy-cli`. Packaging-distribution preview proof shows external/default installed `fgos` enters the Rust host. | [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md) |
| Native invocation kernel | `current partial` | `packages/host-runtime/rust` implements `OperationId`, `OperationRequest`, `ProviderOutcome`, `OperationProvider`, pure router, registry snapshot, authority gates, and `InvocationService` for the current Rust-host slice. | [architecture/invocation-kernel.md](architecture/invocation-kernel.md) |
| Transitional `legacy-cli` route | `current partial` | `command-routes.json` currently contains 71 `legacy-cli` selectors, and `apps/fgos/src/legacy_exec.rs` resolves the legacy Node payload from release/dev manifest fields before spawning Node. | [architecture/legacy-cli-transition.md](architecture/legacy-cli-transition.md) |
| External process providers | `planned` | External providers use static manifest discovery and framed component protocol after R1. | [contracts/component-protocol.md](contracts/component-protocol.md) |
| Production remote peer | `planned` | At least one gateway route should call shared invocation service directly in R3. | [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md) |
| Chat peer | `planned` | Chat is a valid future host, but no current adapter or contract is claimed. | [architecture/host-use-cases.md](architecture/host-use-cases.md) |

## 3. Entry Paths

| Entry path | Status | Rule |
| --- | --- | --- |
| `node bin/fgos.mjs ...` | `legacy-current` | Valid for current Node payload behavior and Node payload tests. It is not the target public runtime entry after R1. |
| `apps/fgos` Rust host binary | `implemented preview` | Code, tests, and packaging-distribution preview release proof show the external/default installed `fgos` enters the Rust host. |
| remote gateway route | `planned` | Planned peer host route after a route is migrated. It must not shell through CLI or parse `fgos.v1` internally. |
| chat adapter | `planned` | Future host surface after contracts exist. |

## 4. Native Invocation Contract Summary

Native host routes use the same shape:

```txt
HostInvocation + OperationRequest
  -> InvocationService
  -> Router.select
  -> selected-provider grant
  -> OperationProvider.invoke
  -> ProviderOutcome or ProviderError
  -> host presenter
```

This is implemented preview behavior for the native `version -> distribution.build.show` route, the native `gate-bypass -> work.gate-bypass.show` route, and the host-runtime test fixture. Installed/default preview release proof is recorded in [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md) and packaging-distribution proof docs.

## 5. Legacy Compatibility Rule

While a selector is `legacy-cli`, the Rust CLI adapter may recognize only the checked selector and must preserve provider-owned arguments as `OsString`. It must not parse provider-owned flags, mint implementation-shaped `legacy.<verb>` operation IDs, wrap legacy output in a second `fgos.v1` envelope, or route the invocation through `InvocationService`.

## 6. Unknowns

These are not missing migration work. They are deliberately preserved as `unknown` because the old sources left them undecided or because they require fresh implementation proof before the docs may label them current.

| Unknown | Kind | What is unclear | Blocking scope | Closure condition |
| --- | --- | --- | --- | --- |
| R1 command route matrix | Code-verified current snapshot | The checked-in route matrix exists: 73 selectors total, 71 `legacy-cli` selectors and two native selectors: `version -> distribution.build.show` and `gate-bypass -> work.gate-bypass.show`. | Does not by itself prove installed-default release. | Keep `packages/host-runtime/contracts/command-routes.json` as the source snapshot and rerun drift tests when selectors change. |
| Preview vs stable default | Product / release decision | Preview public posture is approved; stable/default graduation remains undecided. | Blocks only stable/default graduation, not preview installed/default proof. | Release owner approves stable/default graduation after any additional release proof required. |
| Node fallback compatibility-window duration | Product / support decision | Explicit deprecated fallback escape hatch is approved, but exact removal release/date is undecided. | Blocks fallback removal, not Rust-host default preview posture. | Support-until release/date is written into release policy and compatibility proof docs. |
| Exact native descriptors beyond `distribution.build.show` | Code-verified current snapshot | `gate-bypass -> work.gate-bypass.show` is now the second production native selector; `test.fixture.echo` remains a test fixture in the host-runtime catalog/provider. | Blocks only future expansion, not the current docs migration. | Reopen when another production native selector is proposed. |
| `gate-bypass` component ownership | Closed; local native proof implemented | Current code places gate-bypass read behavior in `src/state/gate-bypass.mjs`, exposes CLI descriptors in `src/cli/command-registry.mjs`, and setup/doctor config readiness in `src/setup/registrations.mjs`. The Rust route implements the read-only surface as `work.gate-bypass.show`, using existing work/state read ownership; setup/doctor config readiness remains Packaging-Distribution. | Does not prove full Work/State migration or installed-default release posture. | Keep `work.gate-bypass.show` as a local native read proof and record no component-boundary change. |
| First external provider preview set | Product / conformance decision | Scan found no current external process provider implementation or manifest set beyond docs/planned protocol language. | Blocks R2 conformance fixture finalization. | R2 proof doc names the fixture provider, operations, manifest, and negative tests. |
| Chat host admission, interruption, and presentation semantics | Future host contract decision | Scan found no current chat host adapter implementation. Chat remains only a planned peer-host concept. | Blocks chat from being treated as more than planned/future. | A chat-host contract and proof plan are added before any chat host is called current. |

## 7. Component Boundary

No component-boundary change. This spec documents the existing Host And Surface Layer concern and links to [component-boundary.md](../component-boundary.md).

## 8. Related Files

| Relationship | File |
| --- | --- |
| area portal | [README.md](README.md) |
| vision | [vision.md](vision.md) |
| ledger | [intent-preservation-ledger.md](intent-preservation-ledger.md) |
| implementation alignment | [verification/implementation-alignment.md](verification/implementation-alignment.md) |
| command route contract | [contracts/command-route-descriptor.md](contracts/command-route-descriptor.md) |
| legacy payload contract | [contracts/legacy-payload.md](contracts/legacy-payload.md) |
