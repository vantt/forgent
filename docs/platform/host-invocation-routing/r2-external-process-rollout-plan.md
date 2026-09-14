# R2 External Process Provider Rollout Plan

```txt
Document type: Implementation plan
Audience: Code-panel coordinator, implementation agent, reviewer, red-team
Purpose: Break R2 external process provider preview into independently reviewable packets
Design status: Draft
Implementation status: Planned
Canonical: Yes, after review
Owner: Host invocation
Source type: Derived from host-invocation R2 architecture, contracts, and proof gate
Last reviewed: 2026-09-15
Related:
- docs/platform/host-invocation-routing/roadmap.md
- docs/platform/host-invocation-routing/verification/r2-external-process-proof.md
- docs/platform/host-invocation-routing/contracts/component-protocol.md
- docs/platform/host-invocation-routing/contracts/external-provider-manifest.md
- docs/platform/host-invocation-routing/architecture/external-provider-protocol.md
```

## 1. Goal

R2 proves the external process provider mechanism, not a real component
migration. The proof uses mock semantics over a real out-of-process transport:
a fixture provider process with a static manifest, framed JSON-RPC over stdio,
bounded supervision, fail-closed linking, and one vendor-scoped fixture
operation invoked through the common host invocation router.

The intended result is:

```txt
static manifest -> derived registry -> router selects external provider
  -> supervisor spawns fixture process
  -> length-prefixed JSON-RPC request/response
  -> ProviderOutcome through InvocationService
```

## 2. Non-Goals

- Do not migrate a real Node component in R2.
- Do not introduce marketplace, publisher trust, signatures, or production WASM.
- Do not allow external providers to replace built-in providers.
- Do not add public plugin installation UX.
- Do not migrate more CLI selectors merely to prove R2.
- Do not put `EncodedMessage` into built-in Rust providers.
- Do not make discovery execute provider code.

## 3. Fixture Provider

Use a test-only external process fixture. It should be real as a process and
transport, but intentionally boring in business semantics.

Suggested operation:

```txt
OperationId: fixture.echo.echo
ProviderId: fixture.echo.process
Request contract: fixture.echo.echo.request@1.0.0
Outcome contract: fixture.echo.echo.outcome@1.0.0
```

The fixture echoes a JSON payload and metadata that prove:

- the manifest-selected provider was invoked;
- the request id round-tripped;
- the negotiated protocol version was used;
- the response was decoded from a framed stdio message, not an in-memory mock.

The fixture may live under a test-support path, for example
`packages/host-runtime/rust/tests/fixtures/external-provider/`, unless the
implementation needs a reusable helper crate. It is not a shipped provider.

## 4. Packet Queue

| Packet | Goal | Likely surfaces | Depends on |
| --- | --- | --- | --- |
| R2-P0 | Lock fixture operation and manifest shape in docs/tests | R2 proof doc, manifest contract, test fixtures | none |
| R2-P1 | Static manifest parser and validator | host-runtime Rust module or external-provider module, manifest tests | R2-P0 |
| R2-P2 | Derived registry/linker and claim refusal | registry snapshot/linker code, negative tests | R2-P1 |
| R2-P3 | Frame codec for component protocol | frame codec module, codec tests | R2-P0 |
| R2-P4 | Process supervisor and lifecycle mapping | supervisor module, fixture process, timeout/crash tests | R2-P3 |
| R2-P5 | Router integration and fixture invocation | provider adapter, InvocationService tests | R2-P2, R2-P4 |
| R2-P6 | Conformance suite and docs closeout | R2 proof, implementation alignment, source audit if needed | R2-P5 |

Packets may be combined only if the resulting review still has one clear proof
surface. R2-P1/R2-P2 and R2-P3/R2-P4 are the natural combine candidates; R2-P5
should stay separate if the adapter touches core routing.

## 5. Packet Details

### R2-P0: Fixture Contract Freeze

Decide and record the fixture provider id, operation id, request/outcome
contract ids, manifest fields, and where test fixtures live.

Proof:

- R2 proof doc names the fixture operation and non-goals.
- Manifest contract includes only the fields needed for preview proof.
- No implementation claims move from `planned`.

### R2-P1: Static Manifest Parser And Validator

Implement manifest loading without executing provider code.

Minimum validation:

- `manifestVersion` is supported.
- `id` is stable and provider-scoped.
- `runtime.kind` is `process`.
- command path is manifest-relative or otherwise explicitly bounded.
- `provides.operations[]` names operation id, request contract, outcome contract, and protocol.
- capabilities are declared but not treated as authority grants.
- malformed, missing, path-escaping, and unsupported manifests fail closed.

Proof:

- positive fixture manifest parses;
- malformed and unsupported manifests fail;
- a discovery test proves provider executable is not run during discovery.

### R2-P2: Derived Registry And Claim Refusal

Build an in-memory derived registry for preview. Do not persist cache/lock until
a later packet needs it.

Refuse:

- duplicate operation claims;
- reserved/core namespace claims;
- unknown capability claims;
- incompatible request/outcome contract claims;
- replacement of built-in providers by config or manifest.

Proof:

- linker tests cover each refusal;
- registry output is deterministic;
- authored manifests remain the source of truth.

### R2-P3: Frame Codec

Implement the external process v1 frame codec:

```txt
4-byte big-endian length prefix
UTF-8 JSON payload
JSON-RPC 2.0 request/response/notification semantics
```

Proof:

- round-trip request, response, and notification frames;
- reject oversized frame;
- reject truncated frame;
- reject invalid UTF-8 or invalid JSON;
- reject protocol messages that are not valid JSON-RPC 2.0 shapes.

### R2-P4: Process Supervisor

Spawn and supervise the fixture process only when invoking, not during
discovery.

Minimum behavior:

- bounded startup/handshake deadline;
- bounded request deadline;
- bounded stdout/stderr capture;
- cancellation notification with bounded grace;
- hard termination after grace;
- crash maps to provider crash or completion-unknown depending on dispatch point;
- protocol violation maps to provider protocol error.

Proof:

- happy-path fixture invocation through the supervisor;
- startup failure;
- bad handshake;
- timeout;
- crash before dispatch;
- crash after dispatch;
- malformed frame;
- cancellation path.

### R2-P5: Router Integration

Add an external process provider adapter that presents as an
`OperationProvider` to the existing Rust host runtime.

Rules:

- built-in providers stay typed;
- external provider adapter owns `EncodedMessage`;
- host projection stays separate from provider protocol;
- provider manifest does not grant authority;
- selected provider still passes through caller admission and selected-provider grant.

Proof:

- fixture operation goes through `InvocationService`;
- selected provider id is the fixture process provider;
- built-in `version` and `gate-bypass` still route natively;
- legacy selectors still use `legacy-cli`;
- no external provider can claim `distribution.build.show` or `work.gate-bypass.show`.

### R2-P6: Conformance And Closeout

Record the R2 evidence and keep claims scoped to preview.

Proof:

- R2 conformance suite passes;
- route/registry tests pass;
- R1 preview proof still passes;
- docs update `verification/implementation-alignment.md`;
- docs update `verification/r2-external-process-proof.md`;
- docs leave R3, marketplace, signatures, production WASM, and component
  migration as future work.

## 6. Suggested Test Commands

The exact commands may change with implementation shape. Start with:

```sh
cargo test -p fgos-host-runtime --quiet
cargo test -p fgos --quiet
node --test test/rust-host/command-routes.test.mjs
```

Add focused Rust tests for manifest parsing, registry/linking, frame codec,
supervisor behavior, and fixture invocation. If the fixture uses a helper binary
or script, add tests that assert discovery did not execute it.

## 7. Close Criteria

R2 is done when:

- one fixture external process provider is discovered from a static manifest;
- discovery does not execute provider code;
- the fixture operation is invoked through `InvocationService`;
- stdio frames are length-prefixed JSON-RPC 2.0, not newline JSON;
- crash, timeout, cancellation, malformed protocol, duplicate claim, reserved
  namespace, unknown capability, and incompatible contract cases fail closed;
- built-in providers remain typed and do not use `EncodedMessage`;
- R1 preview installed/default proof remains true;
- docs label R2 as `implemented preview`, not stable plugin ecosystem.

## 8. Handoff Note

Use code-panel for implementation. The coordinator should open R2-P0 first as a
planning/contract packet, then decide whether R2-P1/R2-P2 and R2-P3/R2-P4 can
run in parallel. R2-P5 should wait until the manifest/linker and supervisor
proofs are both available.
