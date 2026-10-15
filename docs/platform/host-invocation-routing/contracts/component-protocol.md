# Contract: Component Protocol

```txt
Document type: Contract
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Define the preview external process provider wire boundary and future component protocol rules
Design status: Draft
Canonical: Yes, after review
Owner: Host invocation
Last reviewed: 2026-09-18
Related:
- docs/platform/host-invocation-routing/architecture/external-provider-protocol.md
- docs/platform/host-invocation-routing/verification/r2-external-process-proof.md
Implementation: Implemented preview
Provenance: Promoted from docs/architect/host-invocation-routing/external-provider-protocol.md
Writer type: Original writer attribution not recorded; retained source provenance
Canonical for: Candidate scope: Define the preview external process provider wire boundary and future component protocol rules; authority follows transitional switchboard
Use this when: Define the preview external process provider wire boundary and future component protocol rules
Do not use this for: Authority beyond the declared scope or implementation truth without the cited verification
Supersedes: None; legacy sources remain in place during migration
Superseded by: None recorded
```

## 1. Contract

The semantic component protocol is versioned independently from CLI `fgos.v1` and remote API versions. External process v1 uses JSON-RPC 2.0 semantics over 4-byte big-endian length-prefixed UTF-8 JSON frames on stdio.

`EncodedMessage` is used only at this external boundary and carries contract id, version, content type, and bytes.

## 2. Lifecycle Rules

- Discovery does not depend on handshake.
- Handshake confirms provider identity, accepted manifest digest, protocol range, supported operation/contract pairs, and concurrency limit.
- Request IDs are unique per connection.
- Out-of-order responses require negotiated concurrency greater than one.
- Frames, queues, requests, and events are bounded.
- Cancellation sends notification, waits bounded grace, then may terminate provider process.
- Crash after dispatch yields completion-unknown unless the operation idempotency contract permits retry.

## 3. Implementation Alignment

| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Component protocol is distinct from public host protocols. | `implemented preview` | [source protocol §3](../../../architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol), [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md) | R2-P3 conformance proof closed 2026-09-15. |
| `EncodedMessage` never enters built-in kernel. | `implemented preview` | [invocation kernel](../architecture/invocation-kernel.md), [../../../../packages/host-runtime/rust/src/providers/external_process/adapter.rs](../../../../packages/host-runtime/rust/src/providers/external_process/adapter.rs) | R2-P5 defines `EncodedMessage` as a private struct fully contained in the external adapter module; confirmed by review not to appear in `contracts.rs`, the `OperationProvider` trait signature, or `builtin.rs`. Closed 2026-09-15. |

## 4. Related Files

| Relationship | File |
| --- | --- |
| external provider architecture | [../architecture/external-provider-protocol.md](../architecture/external-provider-protocol.md) |
| request/outcome contract | [operation-request-outcome.md](operation-request-outcome.md) |
| R2 proof | [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md) |

## Restored contract versioning

Added in candidate: verbatim restoration of `docs/architect/host-invocation-routing/host-invocation-provider-routing.md` at `83d757f4d693ae13d3fd50e0a454fb95c78f1ff4`; preservation is not a fresh implementation claim.

**Checked status:** Exact request/outcome version-pair matching is implemented; host/provider range intersection and registered transforms remain selected design, not an implemented promise here.

**Code evidence:** `packages/host-runtime/rust/src/operation_provider_router.rs:108-119`; `packages/host-runtime/rust/src/contracts.rs:174-203`.

````md
**Contract versioning:** request/outcome contracts version independently; linking picks one exact version pair from the host/provider range intersection — no runtime "best effort" coercion. An incompatible change gets a new operation variant or major contract version per the owning component's policy; adapters may perform an explicit registered upgrade/downgrade transform, recorded in diagnostics — the router never reshapes payloads implicitly.
````

````md
For idempotency-keyed operations the key lives in the owning operation contract and is stable across an authorized retry; the router never invents one. Read-only does not imply retry-safe when the provider has external effects — the catalog's declared idempotency decides.
````

## Restored lifecycle state chain received admitted refused selected refused granted refused dispatched te

Added in candidate: verbatim restoration of `docs/architect/host-invocation-routing/host-invocation-provider-routing.md` at `83d757f4d693ae13d3fd50e0a454fb95c78f1ff4`; preservation is not a fresh implementation claim.

**Checked status:** The runtime admits before selection, grants before dispatch and writes a terminal lifecycle record. The retained arrow chain is the design vocabulary, not an assertion that every arrow is a separately persisted state.

**Code evidence:** `packages/host-runtime/rust/src/invocation_service.rs:161-234`; `packages/host-runtime/rust/src/invocation_service.rs:494-570`.

````md
```txt
received -> admitted | admission-refused
         -> selected | selection-refused
         -> granted | grant-refused
         -> dispatched
         -> succeeded | semantic-failed | cancelled | deadline-exceeded
                       | provider-failed | completion-unknown
```
````

## Restored same process built ins vs runtime extensions and cross process cost

Added in candidate: verbatim restoration of `docs/architect/host-invocation-routing/external-provider-protocol.md` at `83d757f4d693ae13d3fd50e0a454fb95c78f1ff4`; preservation is not a fresh implementation claim.

**Checked status:** OperationRequest uses typed input; the process codec is framed JSON-RPC. Cold-start and hot-loop discussion is qualitative design reasoning; no performance measurement is claimed.

**Code evidence:** `packages/host-runtime/rust/src/contracts.rs:205-220`; `packages/host-runtime/rust/src/providers/external_process/frame_codec.rs:1-16`.

````md
### Same-Process Built-Ins Versus Runtime Extensions
````

````md
The router presents one semantic interface without forcing one deployment mechanism on every provider. A built-in provider is the fastest path — no serialization, process startup, context switch, or runtime ABI — appropriate because host and foundation component release atomically. An external extension pays a runtime boundary in exchange for language neutrality, failure isolation, and no-recompile installation: a persistent process is the baseline for OS-capability plugins; WASM is the stronger sandbox for pure/capability-scoped ones. The architecture does not promise both hot replacement and direct function-call performance for the same provider — component class decides release ownership and authority posture, invocation mechanism decides the runtime calling path behind the semantic port.
````

````md
### Cross-Process Cost
````

````md
Cold process startup (runtime init, imports, configuration, protocol negotiation) is materially more expensive than talking to an already-running provider — acceptable for a coarse, infrequent operation, not for thousands of helper-sized calls. A persistent stdio connection or local socket removes repeated startup cost, but serialization, scheduling, and backpressure remain, so ports expose complete use-case operations and batch hot loops behind one request. For a normal one-shot CLI invocation, keeping a plugin process alive beyond the host lifetime adds daemon lifecycle without necessarily saving work; persistence is justified for the remote host, interactive sessions, or one invocation making repeated provider calls.
````

## Restored semantic contract stays transport neutral

Added in candidate: verbatim restoration of `docs/architect/host-invocation-routing/external-provider-protocol.md` at `83d757f4d693ae13d3fd50e0a454fb95c78f1ff4`; preservation is not a fresh implementation claim.

**Checked status:** The implemented process codec is length-prefixed JSON-RPC. A binary codec or local socket is retained future transport-neutral design, not implemented functionality.

**Code evidence:** `packages/host-runtime/rust/src/providers/external_process/frame_codec.rs:1-16`.

````md
The semantic contract stays transport-neutral: a future binary codec or local socket transport may replace framing without renaming the operation.
````

## Restored both adapters delegate a complete use case

Added in candidate: verbatim restoration of `docs/architect/host-invocation-routing/legacy-cli-transition.md` at `83d757f4d693ae13d3fd50e0a454fb95c78f1ff4`; preservation is not a fresh implementation claim.

**Checked status:** The CLI lane forwards the complete argument vector to the manifest-owned Node entry and inherits stdio. The semantic Node bridge is retained per-operation migration design; no existing whole state transaction is split by this documentation.

**Code evidence:** `apps/fgos/src/legacy_exec.rs:69-154`; `apps/fgos/src/legacy_exec.rs:242-253`.

````md
Both adapters delegate a complete use case. A host must not split one state transaction between native and legacy providers unless a component contract already defines locking, atomicity, recovery, and authority at that boundary.
````

````md
The router needs operation identity and provider metadata but does not need to parse every host's full input grammar. Metadata separates into: host-visible identity, summary, namespace, and provider mapping; host-owned projection from CLI/REST/MCP input to an operation request; provider-owned semantic validation; transitional provider-owned CLI parsing for legacy-cli selectors.
````

## Restored rust host first cost

Added in candidate: verbatim restoration of `docs/architect/host-invocation-routing/legacy-cli-transition.md` at `83d757f4d693ae13d3fd50e0a454fb95c78f1ff4`; preservation is not a fresh implementation claim.

**Checked status:** The legacy path launches Node from the Rust adapter, so the two-runtime cost is structural. No startup-latency benchmark or current distribution-size measurement is claimed.

**Code evidence:** `apps/fgos/src/legacy_exec.rs:242-253`.

````md
The cost is temporary: a legacy CLI call pays both the small Rust launcher and Node startup, distribution must ship both runtimes, and compatibility failures can occur before any command becomes faster. The architecture only pays off if the first Rust host remains thin and forwards legacy behavior rather than rewriting every parser and use case at once.
````

## Restored rejected options rationale

Added in candidate: verbatim restoration of `docs/architect/host-invocation-routing/node-to-rust-component-migration.md` at `83d757f4d693ae13d3fd50e0a454fb95c78f1ff4`; preservation is not a fresh implementation claim.

**Checked status:** These are dated selection/rejection reasons, not measured current-code performance. The present manifest-owned CLI delegation is consistent with host-first migration; no big-bang rewrite or repository-wide thinning is asserted.

**Code evidence:** `apps/fgos/src/legacy_exec.rs:69-154`; `apps/fgos/src/legacy_exec.rs:242-253`.

````md
```txt
large Node-thinning refactor
  -> stable Node component ports
  -> Rust implementations behind those ports
  -> replace the outer host last
```
````

````md
This makes each later port explicit, but invests heavily in a composition root
that is scheduled for removal. It also delays the final Rust plugin/host seam
until after substantial Node restructuring.
````

````md
```txt
reimplement parser + use cases + state + distribution
  -> switch everything at once
```
````

````md
This has no safe parity or rollback gradient. It mixes host replacement,
component redesign, authority movement, and distribution into one release and
is rejected.
````

````md
## 3. Why The Sequence Is Selected
````

````md
The sequence provides a monotonic migration:
````

````md
- the final host exists before component replacement begins;
- each completed slice removes one Node dependency;
- untouched operations continue on their current execution path;
- rollback is a release rollback through `fgctl`, not a rebuild of the outer
  host;
- external extension work can target the permanent host boundary;
- Node cleanup follows demonstrated removal rather than forecasted ownership.
````

````md
Its temporary cost is accepted: legacy operations may start slightly slower
because Rust delegates to Node, and the installed product carries both runtimes
until migration completes. The detailed technical consequences belong to the
host architecture document.
````

## Restored per component repeat procedure

Added in candidate: verbatim restoration of `docs/architect/host-invocation-routing/node-to-rust-component-migration.md` at `83d757f4d693ae13d3fd50e0a454fb95c78f1ff4`; preservation is not a fresh implementation claim.

**Checked status:** The ten-step sequence is manual migration guidance, not a newly registered automation. Parked is represented distinctly from success in the runtime terminal enum; no provider-side human wait or reinvocation smoke is claimed.

**Code evidence:** `packages/host-runtime/rust/src/invocation_service.rs:161-209`; `package.json:27-35`.

````md
For each subsequent component:
````

````md
1. Read
   [fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md)
   and name responsibility, semantic operations, authority, state, side
   effects, component class, and physical placement.
2. Select a complete operation/use-case boundary rather than private helpers.
3. Capture current Node behavior as shared fixtures.
4. Extract only the Node boundary needed for this migration slice.
5. Implement the corresponding native Rust provider.
6. Run both providers against the same semantic fixtures.
7. Shadow only side-effect-free reads.
8. Switch the operation from legacy to native after parity proof.
9. Observe the rollback window.
10. Remove the Node implementation in a later cleanup change.
````

````md
Sequence it internally:
````

````md
1. event/schema decode fixtures;
2. deterministic replay fixtures;
3. domain/stage projection fixtures;
4. frontier calculation fixtures;
5. effective claim overlay;
6. CLI `ready` parity and pagination;
7. remote semantic parity.
````

## Restored rollback bullets

Added in candidate: verbatim restoration of `docs/architect/host-invocation-routing/node-to-rust-component-migration.md` at `83d757f4d693ae13d3fd50e0a454fb95c78f1ff4`; preservation is not a fresh implementation claim.

**Checked status:** The observation-window and writer-recovery obligations remain manual selected policy. Selection reads immutable bindings, not a runtime provider-selection override; this pass does not execute or certify release rollback.

**Code evidence:** `packages/host-runtime/rust/src/operation_provider_router.rs:74-119`; `packages/host-runtime/rust/src/registry.rs:41-69`.

````md
- Keep legacy and native implementations side by side only for the observation
  window of their operation.
- Never delete a Node writer before proving it can read/recover state last
  written by the Rust implementation, or explicitly declaring the cutover
  irreversible with migration evidence.
- Remove rollback code per component after its window; do not accumulate a
  permanent second implementation tree.
````

## Restored p1 compatibility harness

Added in candidate: verbatim restoration of `docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md` at `83d757f4d693ae13d3fd50e0a454fb95c78f1ff4`; preservation is not a fresh implementation claim.

**Checked status:** The source itself labels 25 ms and 10 ms budgets as placeholders to confirm. They are retained unexecuted performance acceptance requirements, UNPROVEN as measurements. package.json names the current test entry; no all-suite pass or injected-difference run is inferred.

**Code evidence:** `package.json:27-35`; `apps/fgos/src/legacy_exec.rs:242-253`.

````md
### Changed areas
````

````md
```txt
test/rust-host/
packages/component-protocol/contracts/
scripts/export-command-selectors.mjs
scripts/explain-command-route.mjs
```
````

````md
### Performance gates
````

````md
- Legacy exec overhead: wall time of `fgos <legacy selector>` through the Rust
  CLI minus direct `node <payload> <selector>` on the same machine, both warm.
  Threshold placeholder `≤ 25 ms p50 on the reference target` — initial
  budget, confirm in P0.
- Native `version` latency budget placeholder `≤ 10 ms p50`.
- Both become regression gates in P6 (§11 exit gate).
````

````md
### Exit gate and verify
````

````md
The harness fails on every injected difference and passes Node-against-Node.
````

````md
```sh
node --test test/rust-host/envelope-contract.test.mjs
node scripts/export-command-selectors.mjs --check
```
````

## Source-relative Navigation Mappings

Added in candidate — source-relative link destination: the literal restored excerpt retains `../component-boundary/component-boundary-advisory.md`; its live destination is [the retained component-boundary advisory](../../../architect/component-boundary/component-boundary-advisory.md). This navigation mapping does not revise the restored text.
