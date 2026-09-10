# External Provider Protocol

**Status:** Vision / architecture advisory, not a locked platform law and not an implementation plan.
**Date:** 2026-09-10.
**Revised:** per [architecture-review-260910-1537-host-invocation-provider-routing-design-review.md](../../../plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).

This document depends on the kernel contract in [Host Invocation And Provider Routing](./host-invocation-provider-routing.md) — read it first for `OperationId`, `OperationRequest`, `ProviderOutcome`, `ProviderDescriptor`, `OperationProvider`, `RegistrySnapshot`, the Router, and `InvocationService`. This document covers everything specific to a provider that lives outside a statically linked Rust crate: component classes (who owns/releases it), invocation mechanisms (how it is reached), the wire protocol, and the plugin registry linker that turns manifests into a `RegistrySnapshot`.

## 1. Component Classes

Invocation mechanism describes how an implementation is invoked. It does not describe the product nature, release ownership, or authority posture of the component being invoked — that is a separate axis, **component class**:

```txt
component class    -> who owns/releases/configures the component
invocation mechanism -> how the selected provider is invoked at runtime
```

A `ProviderDescriptor` therefore declares both: component class (core, packaged extension, or user plugin) and invocation mechanism (built-in, legacy node, external process, or external WASM).

**Core component** — required for a useful fgOS release; owned by fgOS, released atomically with the host, normally statically linked once migrated. Not optional and not replaceable by default; may expose extension points, but a plugin implementing one does not become the authority owner of the core component. Examples: Work Lifecycle, Host Invocation, authority gating, provider routing, DispatchPlan selection, Assignment/Run/RunResult contracts, init/doctor health.

**Packaged extension** — owned and shipped by fgOS but not required for a minimum useful release; may be enabled/disabled/omitted by configuration, edition, or environment. Follows fgOS release discipline, compatibility policy, init/doctor registration, docs, tests. More trustworthy than a user plugin because fgOS ships it, but disabling it must not corrupt core state or block boot. Examples: optional domain packages, optional coordination protocol packs, optional Herdr/dashboard surfaces.

**User plugin** — supplied, installed, upgraded, removed outside the fgOS release train; never assumed present, never compiled into the host. Discovered from manifests, linked into the derived registry, granted only explicit capabilities. May add vendor-scoped operations or implement published extension points; owns no core namespace, authority, init/doctor invariant, or ambient access merely by manifest claim.

| Component class | Common invocation mechanism | Notes |
|---|---|---|
| Core component | Built-in after migration; LegacyNode during transition | Required, fgOS-owned, atomically released. |
| Packaged extension | Built-in, ExternalProcess, or ExternalWasm | fgOS-owned but optional; install/init/doctor aware. |
| User plugin | ExternalProcess or ExternalWasm | User-owned, independently installed; manifest-linked and capability-gated. |

This classification blocks two mistakes: treating every statically linked implementation as architecturally core, and treating every out-of-process implementation as a user plugin. Packaging and authority follow component class; runtime calling details follow invocation mechanism.

## 2. Invocation Mechanisms

```rust
enum Provider {
    BuiltIn(Arc<dyn OperationProvider>),
    ExternalProcess(ProcessRpcClient),
    ExternalWasm(WasmComponent),
}
```

This enum covers semantic providers and is an illustrative host-implementation detail, not the public ABI (the transitional `LegacyCliPassthrough` binding is CLI-only and lives outside this set — see [Legacy CLI Transition](./legacy-cli-transition.md)).

**Built-In** — a trusted Rust crate statically linked into the host binary, called through the `OperationProvider` trait. No serialization or cross-process cost; still obeys the owning port and authority boundary. Normal mechanism for core components, and may serve packaged extensions fgOS chooses to compile in.

**External Process** — an independently installed, language-neutral plugin reached through persistent framed RPC (§3). Fits extensions needing filesystem, Git, network, subprocess, or other OS capabilities. Crash/restart and resource isolation are part of the adapter contract.

**External WebAssembly** — a sandboxed plugin reached through a typed component interface such as WIT. Fits pure or tightly capability-scoped extensions. Required host functions are explicit capabilities, not ambient access.

Native Rust dynamic libraries are not the default external mechanism: Rust has no stable ABI, and in-process third-party native code loses the crash/memory isolation process or WASM boundaries give.

### Same-Process Built-Ins Versus Runtime Extensions

The router presents one semantic interface without forcing one deployment mechanism on every provider. A built-in provider is the fastest path — no serialization, process startup, context switch, or runtime ABI — appropriate because host and foundation component release atomically. An external extension pays a runtime boundary in exchange for language neutrality, failure isolation, and no-recompile installation: a persistent process is the baseline for OS-capability plugins; WASM is the stronger sandbox for pure/capability-scoped ones. The architecture does not promise both hot replacement and direct function-call performance for the same provider — component class decides release ownership and authority posture, invocation mechanism decides the runtime calling path behind the semantic port.

### Cross-Process Cost

Cold process startup (runtime init, imports, configuration, protocol negotiation) is materially more expensive than talking to an already-running provider — acceptable for a coarse, infrequent operation, not for thousands of helper-sized calls. A persistent stdio connection or local socket removes repeated startup cost, but serialization, scheduling, and backpressure remain, so ports expose complete use-case operations and batch hot loops behind one request. For a normal one-shot CLI invocation, keeping a plugin process alive beyond the host lifetime adds daemon lifecycle without necessarily saving work; persistence is justified for the remote host, interactive sessions, or one invocation making repeated provider calls.

## 3. Component Protocol

The semantic component protocol is versioned independently from public host protocols — `fgos.component.v1`, distinct from CLI `fgos.v1` and any remote API version. It carries: operation identity and protocol/schema version range; request ID and optional parent/correlation ID; typed request, result, and error payloads; deadline, cancellation, progress, and events where supported; capability context granted by the host; provider identity and diagnostics needed for tracing.

For process plugins, version one uses JSON-RPC 2.0 semantics over 4-byte big-endian length-prefixed UTF-8 JSON frames on stdio. Newline-delimited JSON is not the contract: a length prefix gives one enforceable maximum-frame boundary and does not make embedded or future formatted content ambiguous. Stdout is protocol only; logs go to stderr or a declared log notification.

The host starts a process only after static manifest selection. Its first exchange confirms provider identity, accepted manifest digest, component protocol range, supported operation/contract pairs, and concurrency limit. Discovery never depends on this handshake; a mismatch terminates the provider and fails closed.

One connection obeys these lifecycle rules:

- request IDs are unique per connection;
- responses may complete out of order only when concurrency greater than one was negotiated;
- requests, frames, and event queues are bounded to provide backpressure;
- cancellation sends a protocol notification, waits a bounded grace period, then terminates the provider process if necessary;
- cancellation acknowledgement does not claim semantic side effects were rolled back;
- a crash after dispatch yields completion-unknown unless the operation's idempotency contract and key explicitly permit retry;
- a one-shot CLI may own one process for its lifetime; a gateway may pool or persist connections under the adapter's health/restart policy.

The semantic contract stays transport-neutral: a future binary codec or local socket transport may replace framing without renaming the operation.

`EncodedMessage` is the wire representation used only at this boundary — never inside the kernel:

```rust
pub struct EncodedMessage {
    pub contract_id: ContractId,
    pub version: ContractVersion,
    pub content_type: ContentType,
    pub bytes: Bytes,
}
```

## 4. Plugin Registry Linker

External discovery is data-first: the host scans a static manifest and never executes unknown provider code merely to discover what it claims.

A `manifest.yaml` provider declaration declares at least: plugin ID, version, publisher, and component protocol range; provided `OperationId` values or named extension points; request/result schema references; invocation mechanism and executable/module location; requested host capabilities; platform compatibility and integrity metadata; health and post-selection `describe` operations.

`manifest.yaml` is the one canonical filename for authored, static provider declarations. Its `kind` field distinguishes the declaration shape (`fgos.component`, `fgos.plugin`, `fgos.domain`, ...); every kind shares `manifestVersion`, `id`, `version`, `provides`, `requires`, `capabilities` before kind-specific fields are validated.

**Registry** names only the host's derived runtime index (and its lock/cache), never another authored file. Discovery scans `manifest.yaml`, validates by `kind`, then links accepted claims into the provider registry.

The registry linker: scans configured global and project plugin locations; parses and validates manifests without running the provider; verifies compatibility, provider presence, and integrity policy; resolves IDs, namespace claims, precedence, and explicit replacements; emits a deterministic derived lock/cache for help, introspection, dispatch, init, and doctor; starts a selected provider and uses `describe` only to confirm it matches the accepted manifest.

Its complete input/output physics:

```txt
authored OperationCatalog
+ built-in provider descriptors
+ transitional CLI-compatibility bindings
+ validated external manifest declarations
+ explicit global/project enable-disable-replacement policy
  -> immutable RegistrySnapshot + source fingerprint
```

Authored catalogs, manifests, and policy are durable inputs; the linked registry lock/cache is rebuildable derived state — it records host version and source fingerprint, is replaced atomically, and is ignored/rebuilt when stale or corrupt. A cache never outranks its authored sources. This is a compiler only in the linking/validation sense; it does not compile plugin source or the `fgos` host binary.

Project configuration overrides global configuration values, but duplicate operation claims do not silently use last-writer-wins — override precedence is not authority precedence. Ambiguity fails closed unless an explicit replacement policy names both the selected provider and the provider being replaced. Configuration can never replace a **built-in** provider (see the kernel contract's Authority section); a replacement policy only ever governs the external/plugin surface this linker discovers.

## 5. Namespace Rules

The safe ecosystem default: core operation and command namespaces are reserved; plugins add vendor-scoped operations, e.g. `acme.deploy.release`; plugins may implement extension points explicitly published by a built-in component; `.fgos` writes, Git mutation, process execution, network, secrets, and host callbacks require explicit capability grants; unknown capability requests and ambiguous claims fail closed. The provider manifest is never an authority source — caller admission and selected-provider grant (kernel contract §7) apply identically here.

## Related Documents

- [Host Invocation And Provider Routing](./host-invocation-provider-routing.md) — kernel contract this document depends on.
- [Legacy CLI Transition](./legacy-cli-transition.md)
