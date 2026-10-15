# Architecture: Release Boundaries

```txt
Document type: Architecture
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Define R1, R2, R3, and later proof boundaries for host invocation
Design status: Draft
Implementation status: R1/R2/R3 implemented preview plus current partial route migration
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md and rust-cli-and-proof-components-plan.md
Last reviewed: 2026-09-21
Related:
- docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md
- docs/platform/host-invocation-routing/verification/r2-external-process-proof.md
- docs/platform/host-invocation-routing/verification/r3-remote-peer-proof.md
Implementation: R1/R2/R3 implemented preview plus current partial route migration
Provenance: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md and rust-cli-and-proof-components-plan.md
Writer type: Original writer attribution not recorded; retained source provenance
Canonical for: Candidate scope: Define R1, R2, R3, and later proof boundaries for host invocation; authority follows transitional switchboard
Use this when: Define R1, R2, R3, and later proof boundaries for host invocation
Do not use this for: Authority beyond the declared scope or implementation truth without the cited verification
Supersedes: None; legacy sources remain in place during migration
Superseded by: None recorded
```

Added in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.

## 1. Release Boundaries

| Release | Required slice | Explicitly not a gate |
| --- | --- | --- |
| R1 | Distributable Rust CLI host, invocation kernel, const catalog/snapshot, two-stage authority, transitional CLI lane, native `distribution.build.show`, `fgctl` install/activation/rollback proof. | External ecosystem discovery, WASM, chat, production gateway migration, separate `setup` verb. |
| R2 | External process preview: framed protocol, supervision, fixture conformance, static manifest validation. `implemented preview`, closed 2026-09-15 -- see [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md). Derived cache by fingerprint stayed in-memory only (R2-P2's own scope decision); persisted cache/lock is future work. | Core replacement, signatures/marketplace, WASM. |
| R3 | Production remote peer: `GET /v1/runtime` calls shared invocation service directly for `distribution.build.show`. `implemented preview`, closed 2026-09-18 -- see [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md). | Whole-gateway migration, parsing `fgos.v1` as internal API, deleting `VerbGateway`, future shared multi-project gateway. |

## 2. Open Release Decisions

| Decision | Status | Owner |
| --- | --- | --- |
| Current R1 route matrix | `current partial` | Code snapshot: 75 selectors, 70 `legacy-cli`, five native selectors: `convention`, `friction`, `gate-bypass`, `metrics`, `version`. |
| First public R1 preview vs stable default | `preview approved; stable undecided` | Packaging-distribution stream. |
| Compatibility-window duration for R1 Node fallback | explicit escape hatch approved; 30 calendar days after preview release publication; for `v0.1.0`, earliest removal is 2026-10-18 | Packaging-distribution stream plus host invocation. |

## 3. Implementation Alignment

| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| R1 Rust host code path exists. | `implemented preview` | [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs), [../../../../packages/host-runtime/rust/src/lib.rs](../../../../packages/host-runtime/rust/src/lib.rs), [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json), [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md) | Route migration remains partial: 70 selectors still use the manifest-owned legacy CLI lane. |
| R1 is a shipped host only with reproducible install/activation/rollback proof. | `implemented preview` | [source plan §18](../roadmap.md#18-definition-of-done), [../../packaging-distribution/reports/track-closeout.md](../../packaging-distribution/reports/track-closeout.md), [../../packaging-distribution/verification/install-and-release-proof.md](../../packaging-distribution/verification/install-and-release-proof.md), release `v0.1.0` workflow `35317876419`, post-release CI/external-consumer proof `35498322149` | Stable/default release graduation remains a release-owner decision. |
| R2 and R3 do not delay R1 installed-entry flip. | `confirmed` | [source plan §1](../roadmap.md#1-outcome), [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md)#6, [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md) | Every R2 merge re-ran and passed the full R1 proof (`cargo test -p fgos-host-runtime -p fgos --quiet`, `node --test test/rust-host/command-routes.test.mjs`) with `apps/fgos` composition-root wiring untouched. R3 is a separate implemented-preview gateway peer proof for `GET /v1/runtime`; it does not change the R1 installed-entry flip. |
| `fgctl` owns rollback; runtime provider selection does not. | `implemented preview` | [packaging runtime activation](../../packaging-distribution/architecture/runtime-identity-and-activation.md), [../../packaging-distribution/verification/install-and-release-proof.md](../../packaging-distribution/verification/install-and-release-proof.md) | Preview install/activation/repair proof is recorded. Stable/default graduation remains a release-owner decision. |

## 4. Related Files

| Relationship | File |
| --- | --- |
| R1 proof | [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md) |
| R2 proof | [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md) |
| R3 proof | [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md) |
| compatibility harness | [../verification/compatibility-harness.md](../verification/compatibility-harness.md) |
| source plan | [../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md](../README.md) |

## Restored physical placement layout tree

Added in candidate: verbatim restoration of `docs/architect/host-invocation-routing/host-invocation-provider-routing.md` at `83d757f4d693ae13d3fd50e0a454fb95c78f1ff4`; preservation is not a fresh implementation claim.

**Checked status:** This is the selected illustrative layout, not a current directory listing: the workspace uses apps/fgos and packages/host-runtime/rust and excludes apps/fgos-gateway; the actual snapshot constructor is registry.rs, not the proposed registry_linker.rs filename.

**Code evidence:** `Cargo.toml:1-17`; `packages/host-runtime/rust/src/registry.rs:19-69`.

````md
```txt
Cargo.toml                           # workspace root; herdr-plugin/ excluded in R1
apps/
  fgos/                              # crate `fgos`, binary `fgos` — thin CLI adapter
    src/cli_projector.rs             # argv -> OperationRequest
    src/cli_presenter.rs             # ProviderOutcome -> fgos.v1 / exit code
    src/legacy_exec.rs               # CommandRouteDescriptor lookup + Node payload exec
  gateway/                           # later: thin REST/MCP/remote adapter (repo-layout-vision)

packages/
  host-runtime/rust/                 # crate `fgos-host-runtime` — the kernel
    src/contracts.rs                 # OperationId, HostInvocation, OperationRequest, ProviderOutcome, ...
    src/operation_provider_router.rs
    src/invocation_service.rs
    src/authority_gate.rs
    src/providers/builtin.rs
    src/remote_host_use_case.rs      # R3
    src/chat_host_use_case.rs        # later
    src/registry_linker.rs           # R2
    src/providers/{external_process,external_wasm}.rs   # R2+
  distribution/rust/                 # crate `fgos-distribution` — owns distribution.build.show
  component-protocol/{rust,node}/    # R2: EncodedMessage, framed protocol

bin/fgos.mjs, src/, scripts/, core/ ...   # the Node payload, unmoved (Legacy CLI Transition §2)
```
````

## Restored class definitions

Added in candidate: verbatim restoration of `docs/architect/host-invocation-routing/external-provider-protocol.md` at `83d757f4d693ae13d3fd50e0a454fb95c78f1ff4`; preservation is not a fresh implementation claim.

**Checked status:** The class/mechanism axes are preserved as design policy. ProviderDescriptor stores open string metadata; this citation does not prove every release/authority policy or example pack is enforced or shipped.

**Code evidence:** `packages/host-runtime/rust/src/contracts.rs:377-393`.

````md
**Core component** — required for a useful fgOS release; owned by fgOS, released atomically with the host, normally statically linked once migrated. Not optional and not replaceable by default; may expose extension points, but a plugin implementing one does not become the authority owner of the core component. Examples: Work Lifecycle, Host Invocation, authority gating, provider routing, DispatchPlan selection, Assignment/Run/RunResult contracts, init/doctor health.
````

````md
**Packaged extension** — owned and shipped by fgOS but not required for a minimum useful release; may be enabled/disabled/omitted by configuration, edition, or environment. Follows fgOS release discipline, compatibility policy, init/doctor registration, docs, tests. More trustworthy than a user plugin because fgOS ships it, but disabling it must not corrupt core state or block boot. Examples: optional domain packages, optional coordination protocol packs, optional Herdr/dashboard surfaces.
````

````md
| Component class | Common invocation mechanism | Notes |
|---|---|---|
| Core component | Built-in after migration; LegacyNode during transition | Required, fgOS-owned, atomically released. |
| Packaged extension | Built-in, ExternalProcess, or ExternalWasm | fgOS-owned but optional; install/init/doctor aware. |
| User plugin | ExternalProcess or ExternalWasm | User-owned, independently installed; manifest-linked and capability-gated. |
````

````md
This classification blocks two mistakes: treating every statically linked implementation as architecturally core, and treating every out-of-process implementation as a user plugin. Packaging and authority follow component class; runtime calling details follow invocation mechanism.
````

````md
```rust
enum Provider {
    BuiltIn(Arc<dyn OperationProvider>),
    ExternalProcess(ProcessRpcClient),
    ExternalWasm(WasmComponent),
}
```
````

````md
**Built-In** — a trusted Rust crate statically linked into the host binary, called through the `OperationProvider` trait. No serialization or cross-process cost; still obeys the owning port and authority boundary. Normal mechanism for core components, and may serve packaged extensions fgOS chooses to compile in.
````

````md
**External Process** — an independently installed, language-neutral plugin reached through persistent framed RPC (§3). Fits extensions needing filesystem, Git, network, subprocess, or other OS capabilities. Crash/restart and resource isolation are part of the adapter contract.
````

````md
**External WebAssembly** — a sandboxed plugin reached through a typed component interface such as WIT. Fits pure or tightly capability-scoped extensions. Required host functions are explicit capabilities, not ambient access.
````

````md
Native Rust dynamic libraries are not the default external mechanism: Rust has no stable ABI, and in-process third-party native code loses the crash/memory isolation process or WASM boundaries give.
````

## Restored package json bin fgos removed pointed at workspace shim at default flip bin fgos runner stays ownership hea

Added in candidate: verbatim restoration of `docs/architect/host-invocation-routing/legacy-cli-transition.md` at `83d757f4d693ae13d3fd50e0a454fb95c78f1ff4`; preservation is not a fresh implementation claim.

**Checked status:** Superseded by decision (owner F6 resolution, 2026-10-14): the installed-default npm `bin.fgos` removal trigger has the 2026-09-15 coordinator 30-day window as successor (`docs/platform/packaging-distribution/code-panel-rollout-plan.md:72`; compatibility-window row above, originally line 35). The Rust host is the installed default from preview; the deprecated Node fallback is supported for 30 calendar days after preview publication, earliest removal 2026-10-18. Removing or redirecting `bin.fgos` after the window remains owed to Packaging-distribution (release-owner decision). The original clause below is retained verbatim as dated design. The runner mapping and source-entry ownership header stay; nothing is removed now.

**Code evidence:** `package.json:9-12`; `bin/fgos.mjs:1-10`.

````md
`package.json` `bin.fgos` is removed (or pointed at the workspace shim) when the Rust host becomes the installed default; `bin.fgos-runner` stays until the runner migrates. A header in `bin/fgos.mjs` and the root `AGENTS.md` state the ownership rule for editors already at that path.
````

## Restored scope

Added in candidate: verbatim restoration of `docs/architect/host-invocation-routing/node-to-rust-component-migration.md` at `83d757f4d693ae13d3fd50e0a454fb95c78f1ff4`; preservation is not a fresh implementation claim.

**Checked status:** The scope and advisory-reading obligation are selected engineering guidance, not an automated runtime gate. The cited workspace records the actual current component placement.

**Code evidence:** `Cargo.toml:1-17`.

````md
This document discusses only migration options, ordering, transition stages,
cutover, and rollback. The stable host model, peer CLI/remote host use cases,
Operation Provider Router, provider mechanics, protocols, plugin registry,
authority, and technical tradeoffs live in
[Host Invocation And Provider Routing Architecture](./host-invocation-provider-routing.md).
Component ownership, authority boundaries, and the physical placement compass
for files/crates/components live in
[fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md);
every native migration slice must read it before choosing where a provider or
component module lives.
The executable work breakdown lives in
[Rust Host And Proof Providers Implementation Plan](./rust-cli-and-proof-components-plan.md).
````

## Source-relative Navigation Mappings

Added in candidate — source-relative link destinations: the literal restored excerpts retain their original link bytes. `./host-invocation-provider-routing.md` maps to [the area spec](../spec.md); `./rust-cli-and-proof-components-plan.md` maps to [the area roadmap](../roadmap.md); `../component-boundary/component-boundary-advisory.md` maps to [the retained component-boundary advisory](../../component-boundary.md). These are navigation mappings, not revised restored text.
