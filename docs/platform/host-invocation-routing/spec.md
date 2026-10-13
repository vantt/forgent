# Spec: Host Invocation

```txt
Document type: Area spec
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: State current and transition-state behavior for fgOS host invocation
Design status: Draft
Implementation status: R1/R2/R3 implemented preview plus partial route migration
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/**
Last reviewed: 2026-09-18
Related:
- docs/platform/host-invocation-routing/README.md
- docs/platform/host-invocation-routing/intent-preservation-ledger.md
- docs/platform/host-invocation-routing/verification/implementation-alignment.md
```

Added in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.

## 1. Purpose

This spec separates what is current from what is accepted target, planned, legacy-current, superseded, or unknown for host invocation.

## 2. Current And Transition Status

| Concern | Status | Spec statement | Alignment |
| --- | --- | --- | --- |
| Existing Node CLI payload | `legacy-current` | Existing commands still run through the Node payload. `bin/fgos.mjs` remains in the source tree and must not be renamed or moved while the legacy payload exists. | [verification/implementation-alignment.md](verification/implementation-alignment.md#2-alignment-table) |
| Legacy Node payload identity | `accepted-not-implemented` target over `legacy-current` file | R1 names the payload `legacy-node` in the release manifest and locates it through `components.legacyNode.root` and `components.legacyNode.entry`. | [contracts/legacy-payload.md](contracts/legacy-payload.md) |
| Rust host code path | `implemented preview` | `apps/fgos` exists as a Rust CLI host, embeds `command-routes.json`, routes `version` natively to `distribution.build.show`, routes `gate-bypass` natively to `work.gate-bypass.show`, also routes `convention`, `metrics` and `friction` natively, and routes the remaining 70 selectors through `legacy-cli`. Packaging-distribution preview proof shows external/default installed `fgos` enters the Rust host. | [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md) |
| Native invocation kernel | `current partial` | `packages/host-runtime/rust` implements `OperationId`, `OperationRequest`, `ProviderOutcome`, `OperationProvider`, pure router, registry snapshot, authority gates, and `InvocationService` for the current Rust-host slice. | [architecture/invocation-kernel.md](architecture/invocation-kernel.md) |
| Transitional `legacy-cli` route | `current partial` | `command-routes.json` currently contains 70 `legacy-cli` selectors, and `apps/fgos/src/legacy_exec.rs` resolves the legacy Node payload from release/dev manifest fields before spawning Node. | [architecture/legacy-cli-transition.md](architecture/legacy-cli-transition.md) |
| External process providers | `implemented preview` | R2 proves static manifest discovery, derived linker/registry, framed JSON-RPC-over-stdio component protocol, bounded supervision, fail-closed negative cases, and an end-to-end `fixture.echo.echo` invocation through `InvocationService`. | [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) |
| Production remote peer | `implemented preview` | `GET /v1/runtime` calls shared `InvocationService` directly through the remote projector/presenter for `distribution.build.show`, without `VerbGateway`, CLI shelling, Node spawn, or `fgos.v1` parsing. Other gateway routes remain legacy. | [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md) |
| Chat peer | `planned` | Chat is a valid future host, but no current adapter or contract is claimed. | [architecture/host-use-cases.md](architecture/host-use-cases.md) |

## 3. Entry Paths

| Entry path | Status | Rule |
| --- | --- | --- |
| `node bin/fgos.mjs ...` | `legacy-current` | Valid for current Node payload behavior and Node payload tests. It is not the target public runtime entry after R1. |
| `apps/fgos` Rust host binary | `implemented preview` | Code, tests, and packaging-distribution preview release proof show the external/default installed `fgos` enters the Rust host. |
| `GET /v1/runtime` remote gateway route | `implemented preview` | Project-local gateway peer route for `distribution.build.show`; uses existing gateway auth and projects to `InvocationService` without CLI shelling or `fgos.v1` parsing. |
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

This is implemented preview behavior for the native `version -> distribution.build.show` route, the native `gate-bypass -> work.gate-bypass.show` route, the R2 external process fixture, and the R3 `GET /v1/runtime` remote gateway route. Installed/default preview release proof is recorded in [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md) and packaging-distribution proof docs.

## 5. Legacy Compatibility Rule

While a selector is `legacy-cli`, the Rust CLI adapter may recognize only the checked selector and must preserve provider-owned arguments as `OsString`. It must not parse provider-owned flags, mint implementation-shaped `legacy.<verb>` operation IDs, wrap legacy output in a second `fgos.v1` envelope, or route the invocation through `InvocationService`.

## 6. Unknowns

These are not missing migration work. They are deliberately preserved as `unknown` because the old sources left them undecided or because they require fresh implementation proof before the docs may label them current.

| Unknown | Kind | What is unclear | Blocking scope | Closure condition |
| --- | --- | --- | --- | --- |
| R1 command route matrix | Code-verified current snapshot | The checked-in route matrix exists: 75 selectors total, 70 `legacy-cli` selectors and five native selectors: `convention`, `friction`, `gate-bypass`, `metrics`, `version`. | Does not by itself prove installed-default release. | Keep `packages/host-runtime/contracts/command-routes.json` as the source snapshot and rerun drift tests when selectors change. |
| Preview vs stable default | Product / release decision | Preview public posture is approved; stable/default graduation remains undecided. | Blocks only stable/default graduation, not preview installed/default proof. | Release owner approves stable/default graduation after any additional release proof required. |
| Node fallback compatibility-window duration | Product / support decision | Explicit deprecated fallback escape hatch is approved for 30 calendar days after preview release publication. | Blocks only removal before the 30-day window closes, not Rust-host default preview posture. | Public preview tag `v0.1.0` was published on 2026-09-18; earliest removal for this preview release is 2026-10-18 unless a later release decision replaces that support promise. |
| Exact native descriptors beyond `distribution.build.show` | Code-verified current snapshot | Added in candidate: the current native selector set is `convention`, `friction`, `gate-bypass`, `metrics`, `version`; `test.fixture.echo` remains a test fixture in the host-runtime catalog/provider. | Blocks only future expansion, not the current docs migration. | Reopen when another production native selector is proposed. |
| `gate-bypass` component ownership | Closed; local native proof implemented | Current code places gate-bypass read behavior in `src/state/gate-bypass.mjs`, exposes CLI descriptors in `src/cli/command-registry.mjs`, and setup/doctor config readiness in `src/setup/registrations.mjs`. The Rust route implements the read-only surface as `work.gate-bypass.show`, using existing work/state read ownership; setup/doctor config readiness remains Packaging-Distribution. | Does not prove full Work/State migration or installed-default release posture. | Keep `work.gate-bypass.show` as a local native read proof and record no component-boundary change. |
| First external provider preview set | Closed preview conformance decision | R2 selected the `fixture.echo.echo` provider and closed manifest, linker, frame codec, supervisor, and integration proof. | Blocks only future production ecosystem hardening, not R2 preview. | Keep [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) current when provider protocol behavior changes. |
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

## Retained selected source material

Added in candidate: the following is the pinned September design/migration source, not a fresh certification of current code, route counts, release posture or measured performance. Prior status labels remain dated provenance. Registered details split to their mapped owners are linked below; the separate restore notes state the checked implementation limits. Source: `docs/architect/host-invocation-routing/host-invocation-provider-routing.md` at `83d757f4d693ae13d3fd50e0a454fb95c78f1ff4`.

### Host Invocation And Provider Routing Architecture

**Status:** Vision / architecture advisory, not a locked platform law and not an implementation plan.
**Date:** 2026-09-10.
**Revised:** per [architecture-review-260910-1537-host-invocation-provider-routing-design-review.md](../../../plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).
**Source:** Product-owner component-boundary and Node-to-Rust migration discussion.

This is the **kernel contract**: the permanent invocation/routing boundary every fgOS host uses, independent of transport (CLI, remote, chat) and provider mechanism (built-in, legacy Node, external process, WASM). Ecosystem plugin mechanics: [External Provider Protocol](architecture/external-provider-protocol.md). Transitional Node CLI lane: [Legacy CLI Transition](architecture/legacy-cli-transition.md). Both depend on this document. Migration staging and first proof: [Node To Rust Component Migration](architecture/node-to-rust-migration.md), [Rust Host And Proof Providers Implementation Plan](roadmap.md).

#### Historical Migration Status Note

Added in candidate: superseded migration bookkeeping. The legacy source was
legacy-current during the 2026-09-14 promotion pass. That dated status applies
to the legacy input, not this candidate. The recorded platform entry is
[docs/platform/host-invocation-routing/README.md](README.md).
Its details are split across
[vision.md](vision.md),
[invocation-kernel.md](architecture/invocation-kernel.md),
[host-use-cases.md](architecture/host-use-cases.md),
[provider-routing.md](architecture/provider-routing.md),
and [contracts/](contracts/README.md).
See the [intent preservation ledger](intent-preservation-ledger.md)
for disposition by preserved claim.

#### 1. Architecture Name

Named **Host Invocation And Provider Routing**; central component the **Operation Provider Router**. `Component Router` is avoided — not every component is a dispatchable provider. `Command Router` is avoided — commands are only a CLI projection of semantic operations.

```txt
host invocation  -> a transport-specific host use case admits/normalizes a request
provider routing -> the Operation Provider Router selects an implementation
```

#### 2. Problem And Scope

fgOS has more than one entry surface (local CLI, remote REST/MCP, chat) that may request the same semantic operation but differ in parsing, auth context, streaming, and response projection. Provider choice is a separate dimension — built-in Rust, transitional legacy Node, external process, or WASM. Host transport and provider mechanism must not form a Cartesian product of special paths: one normalized invocation path, one provider router.

#### 3. Canonical Names

One name per concept; no alias appears anywhere in this document or its two companions.

| Name | What it is |
|---|---|
| `OperationId` | Stable semantic identifier, independent of CLI/REST/MCP spelling (§5). |
| `HostInvocation` | Host/caller context (identity, deadline, cancellation, tracing) admitted before routing (§5). |
| `OperationRequest` | `OperationId` + `ContractRef` + typed semantic input (§5). |
| `ContractRef` | `{id, version}` that always travels with a request/outcome (§5). |
| `ProviderOutcome` | Typed, `ContractRef`-identified result plus typed error, events, evidence, diagnostics (§5). |
| `ProviderError` | Closed failure family a provider call can terminate with (§7). |
| `OperationProvider` | Trait: `descriptor()` + `invoke(...)` (§6). |
| `ProviderDescriptor` | Identity, component class, mechanism, contract versions, allowed hosts/modes, capabilities, `lifecycle`, replacement, concurrency, health (§5). |
| `OperationDescriptor` | One catalog entry: operation id, owning component, contracts, effect, idempotency, authority policy, allowed hosts, streaming (§5). |
| `OperationCatalog` | Authority-bearing inventory of `OperationDescriptor`s, authored by owning components (§5). |
| `RegistrySnapshot` | Immutable linked provider registry for one invocation (§5, §6). |
| Router | Pure selection function: inputs -> one `ProviderDescriptor` or a refusal (§6). |
| `InvocationService` | Pipeline: admit -> select -> grant -> invoke -> normalize -> record (§6). |
| `InvocationControl` | Deadline, cancellation token, granted capabilities passed to a provider call (§6). |
| `EventSink` | Progress/event/diagnostic sink passed to a provider call (§6). |
| `CommandRouteDescriptor` | Per-CLI-selector `legacy-cli`/`native` record, owned by the CLI adapter — [Legacy CLI Transition](architecture/legacy-cli-transition.md). |
| `ConfigPort` | Port a provider receives resolved configuration/context through; never a second global file read (§5). |

#### 4. Peer Host Use Cases

`cli-host-use-case`, `remote-host-use-case`, and `chat-host-use-case` are peers; none wraps, shells out to, or calls through another.

```mermaid
flowchart LR
    CLI[CLI adapter] --> LOOKUP[CommandRouteDescriptor lookup]
    LOOKUP -. legacy-cli: exec Node payload .-> NODE[Node payload]
    LOOKUP --> CH[cli-host-use-case]
    REM[REST / MCP adapter] --> RH[remote-host-use-case]
    CHAT[Chat adapter] --> HH[chat-host-use-case]
    CH --> REQ[OperationRequest]
    RH --> REQ
    HH --> REQ
    REQ --> INV[InvocationService: admit]
    INV --> ROUTER[Router: select]
    ROUTER --> GRANT[InvocationService: grant + invoke]
    GRANT --> PROV[BuiltIn / LegacySemantic / External process / WASM]
    PROV --> OUT[ProviderOutcome]
    OUT --> PRES[CLI / Remote / Chat presenter]
```

The dashed lookup/direct-exec arrow to "Node payload" is the only non-`OperationRequest`/`ProviderOutcome` path and never touches `InvocationService` or the router — see "Transitional CLI Lane" below.

| Host use case | Owns | Never does |
|---|---|---|
| `cli-host-use-case` | CLI options; verb -> `OperationId`; terminal stdio; `fgos.v1`/exit-code presentation; `CommandRouteDescriptor` lookup. | Own an operation's implementation; define the plugin ABI. |
| `remote-host-use-case` | Remote caller context; REST/MCP method -> `OperationId`; deadlines/disconnect/stream lifecycle; response projection. | Invoke the CLI; parse argv; treat `fgos.v1`/HTTP as an internal API; spawn `bin/fgos.mjs`. |
| `chat-host-use-case` | Chat caller/session context; intent -> `OperationId`; clarification/progress/interruption; response projection. | Invoke the CLI/remote host; parse argv; treat `fgos.v1`/HTTP as an internal API. |

R3's remote peer is the project-local gateway (current herdr, same release) — §10 has the future shared-gateway constraint.

**Shared boundary:** all three projectors build the same `HostInvocation`/`OperationRequest` and call one `InvocationService` — deliberate reuse, not wrapping; presenters stay separate per transport. Peer status does not require one OS process — separate binaries each compose the same host-runtime crate rather than calling another host.

**Transitional CLI lane:** the legacy Node lane lives in the CLI adapter, not the kernel — the kernel has exactly one input/output pair. The CLI adapter looks up `CommandRouteDescriptor[selector]`: `legacy-cli` execs the Node payload directly (argv preserved, inherited stdin/cwd/env, signal forwarding, one invocation record) without building an `OperationRequest`; `native` builds one and calls `InvocationService`. Mechanics: [Legacy CLI Transition](architecture/legacy-cli-transition.md).

#### 5. Core Contracts

The name table (§3) says what each type is; this adds the rules it has no room for.

**`OperationId`** — `<component>.<object-type>.<action>[.<variant>]`. `<component>` owns authority; `<object-type>` is singular (`work.item.list` still names `WorkItem`); `<action>` is a small verb set (`create`, `submit`, `show`, `claim`, `approve`, `run`, ...). E.g. `work.item.submit`, `distribution.build.show`. Each host owns its own projection — CLI verbs, REST paths, MCP names, chat intents are not `OperationId`s unless explicitly mapped; REST may keep plural URLs (`GET /work-items` -> `work.item.list`). Not suffixed for a compatible field addition (see versioning below).

**`HostInvocation`** — host kind is an **open string** (`"cli" | "remote" | "chat"`, not a closed enum every future host must exist in R1).

**`OperationRequest`** = `{ operation: OperationId, contract: ContractRef, input: Box<dyn Any + Send> }` — typed per contract; a built-in downcasts `input` directly, never through a decode step.

**No serialization for built-in providers** — the semantic contract is schema + version (`ContractRef`), but in-process representation is typed Rust through `OperationProvider`. `EncodedMessage` (contract id, version, content type, bytes) exists only at the external-process/WASM boundary ([External Provider Protocol](architecture/external-provider-protocol.md)), never as a kernel type. Raw `OsString` argv is never a semantic `OperationRequest` — it stays inside the CLI adapter's transitional lane.

**`ProviderOutcome`** — not a nested `fgos.v1` envelope or HTTP response; the presenter owns public projection; diagnostics travel through the trace/evidence sink, never silently on compatibility stdout/stderr. Human-in-the-loop rule: §8.

**`ProviderDescriptor` / `ConfigPort`** — `lifecycle` is `singleton | per-invocation | pooled`. Invocation mechanism is an **open string** (`"builtin" | "legacy-node" | "external-process" | "wasm"`), not a closed enum. `"legacy-node"` names `LegacySemanticProvider`: a normal `OperationProvider` whose implementation still calls an extracted Node use case, introduced per operation only when a non-CLI host needs it before the native provider exists ([Legacy CLI Transition](architecture/legacy-cli-transition.md) §1) — distinct from the CLI adapter's exec lane, which is not a provider at all. A provider receives resolved config/context through `ConfigPort` and never reads a second global config file itself.

**`OperationDescriptor` / `OperationCatalog`** — authored by owning components, never inferred from CLI commands or provider manifests. Fields: operation id, owning component id, request/outcome contracts, effect (`read | write | external`), idempotency (`none | keyed | safe`), authority policy id, allowed host kinds, streaming mode. The CLI command registry stays authority for CLI help/grammar and maps selectors into catalogued operations; a registry entry alone cannot create an operation. **R1 simplicity:** one native operation (`distribution.build.show`), so `OperationCatalog` is a `const` array and `RegistrySnapshot` is assembled once at the host's composition root (`apps/fgos`) from const tables via a pure `build_snapshot(catalog, providers, fingerprint)` — the kernel crate never depends on a provider crate, and there is no catalog system, linker, cache, or manifest scan in R1 (§10).


Added in candidate: this retained source detail is carried verbatim in [the dropped-002 restoration](contracts/component-protocol.md#restored-contract-versioning).


#### 6. Router (Pure) And InvocationService (Pipeline)

**Router** — no I/O, no async, no invocation, no failure normalization, no reporting:

```txt
Router: (OperationId, request/outcome contract versions, host kind,
         invocation mode, project policy, RegistrySnapshot)
        -> Result<ProviderDescriptor, SelectionRefused>
```

It reads the `RegistrySnapshot`, matches operation/mode/host/compatible contract versions, applies an explicit binding or named replacement policy, and fails closed on ambiguity or incompatibility. It never parses CLI/HTTP input, admits, grants, holds domain policy, lets a provider reach another by recursively spawning `fgos`, or renders a response.

**`InvocationService`** owns the pipeline and is the only thing that invokes a provider:

```txt
received -> admit -> Router.select -> grant -> invoke(adapter)
         -> normalize transport failure -> record lifecycle
```

`admit`/`grant` are the two authority stages (§7); `invoke` calls the granted `OperationProvider` with deadline/cancellation/trace context; `normalize` maps adapter-specific transport failures onto the closed `ProviderError` families (§8) without changing semantic errors; `record` emits the lifecycle record (§8) and reports which provider/registry fingerprint served the call.

Numeric priority, registration order, and last-writer-wins are not selection policy — a binding names one provider, a replacement names the provider it replaces plus the authorizing policy; otherwise duplicates are ambiguous and linking fails. `RegistrySnapshot` is immutable per invocation: assembled once at the composition root from const tables in R1; from R2 a long-running host may build and atomically publish a new snapshot between invocations, never half-relinked.

```rust
pub trait OperationProvider: Send + Sync {
    fn descriptor(&self) -> &ProviderDescriptor;
    fn invoke<'a>(
        &'a self, invocation: &'a HostInvocation, request: OperationRequest,
        control: InvocationControl, events: &'a dyn EventSink,
    ) -> Pin<Box<dyn Future<Output = Result<ProviderOutcome, ProviderError>> + Send + 'a>>;
}
```

#### 7. Authority (Two-Stage)

Core operation/command namespaces are reserved; plugins add vendor-scoped operations (`acme.deploy.release`) and implement published extension points only; `.fgos` writes, Git mutation, process/network/secret access require explicit capability grants; unknown or ambiguous claims fail closed. **Configuration can never replace a built-in provider** — closed as "prohibit," not open. Rollback of a native operation in R1–R2 is a release rollback through `fgctl` (the previous release still ships both the native provider and the Node payload during the observation window), never a runtime provider-selection swap.

The provider manifest is never an authority source:

1. **Caller admission** (before routing): principal, operation, project policy, requested context, host surface.
2. **Selected-provider grant** (after routing): intersects the admitted action with the operation's capability policy and the provider's requested capabilities.

The provider receives only the resulting least-privilege grant via `InvocationControl`, identically for every host — a single pre-selection gate cannot evaluate the selected provider's identity, trust, or capability request.

Selecting a different provider never silently transfers authority — a replacement returns a result or proof; the existing authority owner still applies transitions and writes state, for built-in, legacy, and external providers alike. Work Lifecycle remains the only owner of Work transitions; Run Result Evaluation may compute confidence without choosing the next status; Dispatch may execute an approved assignment without inventing its operation; an external manifest claim never grants `.fgos`, Git, process, network, or secret access.

#### 8. Failure, Cancellation, Lifecycle, And Human Input

Closed failure families, common across every invocation mechanism:

- semantic validation, precondition, conflict, not-found;
- caller admission denied, selected-provider capability denied;
- no binding, ambiguous binding, incompatible contract;
- provider unavailable, protocol violation, provider crash;
- deadline exceeded, caller cancelled, completion unknown.

Each host presenter maps these onto its own contract (`fgos.v1`/exit codes, REST/MCP response, chat result); `InvocationService` preserves invocation/provider IDs so projections correlate without scraping output. Transport adapters never turn a provider crash into a semantic failure or infer success from partial output. A remote disconnect cancels through the same invocation context as a CLI interrupt; a crash never authorizes an automatic replay of a non-idempotent operation. The provider port is asynchronous from v1 — deadlines, cancellation, progress, and backpressure are already runtime requirements, so deferring async would change the ABI at the first real remote/process integration.


Added in candidate: this retained source detail is carried verbatim in [the dropped-003 restoration](contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te).


Exactly one terminal record is emitted; `dispatched` is the point after which a transport loss may be completion-unknown, and a late response after cancellation/deadline is diagnostic evidence, not a second terminal truth. Records carry invocation/parent-correlation ID, contract versions, registry fingerprint, provider ID, host kind, timing, terminal family, evidence references — never secrets or capability material.


Added in candidate: this retained source detail is carried verbatim in [the dropped-002 restoration](contracts/component-protocol.md#restored-contract-versioning).


**Human input:** a provider never blocks waiting for a person. It returns a `parked` `ProviderOutcome`; the host or work lifecycle re-invokes later. No provider is ever given a mid-invocation callback to solicit input.

#### 9. Physical Placement

The public command name stays `fgos` — runtime identity is the release digest, not the name, and every skill, hook, plugin, and Herdr call already targets `fgos <verb>`. `fgctl` is a separate bootstrap binary, not a renamed `fgos`. Crate names are kebab-case with an `fgos-` prefix; modules are snake_case.


Added in candidate: this retained source detail is carried verbatim in [the dropped-004 restoration](architecture/release-boundaries.md#restored-physical-placement-layout-tree).


R1 is three crates: `fgos`, `fgos-host-runtime`, `fgos-distribution`. The legacy exec lane is a module inside `apps/fgos`, not a crate, because it is CLI-adapter-local (§4). `component-protocol` waits for R2 (only an external-process adapter needs `EncodedMessage`). Extract further crates only when pressure is real. Neither app owns provider selection; neither host use case imports another; every host feeds the shared authority/router/contracts layer, and provider adapters depend on component protocols, not host presentation. A component is not created merely because one proof verb is convenient (`gate-bypass` stays under its settled authority, not a manufactured `gate-policy` component).

Distribution selects and activates the trusted runtime (`fgctl`: acquire/stage/verify/activate/upgrade/rollback); host invocation routes inside the activated runtime. Packaging-distribution owns the onboarding command vocabulary: local `fgos init` adopts a workspace under the active identity on first use, `fgos doctor --fix` performs every later registered repair, and the target architecture has no separate `setup` verb. See [Runtime Identity And Activation](../../architect/packaging-distribution/runtime-identity-and-activation.md).

#### 10. Release Boundaries

| Release | Required architecture slice | Explicitly not a gate |
|---|---|---|
| R1 — distributable Rust CLI host | Invocation kernel; `const` `OperationCatalog` / `RegistrySnapshot` assembled once at the composition root; two-stage authority; transitional CLI lane in the CLI adapter; native `distribution.build.show`; `fgctl`-driven install/activate/rollback proof. | External ecosystem discovery, WASM, chat, production gateway migration, a `setup` verb. |
| R2 — external process preview | Process protocol, supervision, fixture conformance, static manifest validation; one-shot CLI loads the derived cache by fingerprint, rebuilds only on mismatch; explicit test/dev roots. | Core replacement, signatures/marketplace, WASM. |
| R3 — production remote peer | Remote projector/presenter, native route adoption, per-operation Node semantic bridge only where needed; remote peer is the **project-local gateway** (current herdr, same release) composing the host-runtime crate in-process. | Parsing CLI envelopes as internal API; a future **shared multi-project gateway**, which never links a project runtime in-process and instead reaches it through the out-of-process Project Runtime Adapter ([Future Constraints](../../architect/packaging-distribution/future-constraints.md) §2) — itself a `remote-host-use-case` adapter inside the project runtime. |

Chat is a valid future peer but does not gate R1/R2 until a real chat adapter and its admission/interruption/presentation contracts exist. "Ship the Rust host" means a reproducible artifact, target matrix, `fgctl` install/activation coverage, external-project install test, and named rollback channel — passing repository tests alone is a candidate, not a shipped host.

#### 11. Open Questions

1. Which fgOS-owned capabilities should ship as packaged extensions rather than core components?
2. What are the exact `OperationId` descriptors and CLI/REST/MCP projections for the first native operations?
3. Which extension points are public in the first ecosystem release?
4. Does a later protocol version add a local socket transport after framed stdio has production evidence?
5. What integrity/signature policy separates local development plugins from distributable ecosystem plugins?

Target matrix, install/upgrade mechanism, and R1 definition are owned by packaging — see [Runtime Identity And Activation](../../architect/packaging-distribution/runtime-identity-and-activation.md).

#### Related Documents

- [External Provider Protocol](architecture/external-provider-protocol.md)
- [Legacy CLI Transition](architecture/legacy-cli-transition.md)
- [Node To Rust Component Migration](architecture/node-to-rust-migration.md)
- [Rust Host And Proof Providers Implementation Plan](roadmap.md)
- [Component Boundary Advisory](../../architect/component-boundary/component-boundary-advisory.md)
- [Runtime Identity And Activation](../../architect/packaging-distribution/runtime-identity-and-activation.md)
