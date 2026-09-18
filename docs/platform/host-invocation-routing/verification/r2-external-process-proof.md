# Verification: R2 External Process Proof

```txt
Document type: Verification
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Preserve the proof gate for external process provider preview
Design status: Draft
Implementation status: Implemented preview (R2-P0 through R2-P5 closed 2026-09-15; R3, marketplace, signatures, and production WASM remain future work)
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md
Last reviewed: 2026-09-15
Related:
- plans/260915-host-invocation-r2-external-process/plan.md
- docs/platform/host-invocation-routing/contracts/component-protocol.md
- docs/platform/host-invocation-routing/contracts/external-provider-manifest.md
```

## 1. Required Proof

R2 proves framed process protocol, static manifest validation without execution, bounded supervision, handshake, cancellation, backpressure, crash/completion-unknown mapping, namespace refusal, duplicate refusal, unknown capability refusal, and one vendor-scoped fixture operation through the common router.

## 2. Fixture Contract (Frozen At R2-P0)

| Field | Value |
| --- | --- |
| Provider id | `fixture.echo.process` |
| Operation id | `fixture.echo.echo` |
| Request contract | `fixture.echo.echo.request@1.0.0` |
| Outcome contract | `fixture.echo.echo.outcome@1.0.0` |
| Manifest filename | `manifest.yaml` |
| Manifest fields used | `manifestVersion`, `id`, `version`, `runtime.kind: process`, `runtime.command` (manifest-relative), `provides.operations[]` (operation id, request contract, outcome contract, protocol), `capabilities` (declared only, not an authority grant) |
| Fixture location | `packages/host-runtime/rust/tests/fixtures/external-provider/` |

The fixture echoes the request payload plus the round-tripped request id and
negotiated protocol version, proving the response came from a real
length-prefixed stdio decode, not an in-memory mock. This freeze is a
docs/contract decision only: no row in this file or in
[../contracts/component-protocol.md](../contracts/component-protocol.md) or
[../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md)
moves above `planned` as a result. R2-P1 onward implement against these fixed
ids.

## 3. Suggested Packet Shape (closed, kept for history)

Open R2 as a host-invocation packet, not as packaging-distribution work:

1. Static manifest schema and validator for one fixture provider. -- closed, R2-P1.
2. Derived registry/linker that refuses duplicate, reserved, unknown, and incompatible claims. -- closed, R2-P2.
3. Stdio frame codec using 4-byte big-endian length-prefixed JSON-RPC 2.0 messages. -- closed, R2-P3.
4. Process supervisor with bounded queues, timeout, cancellation, crash, and completion-unknown behavior. -- closed, R2-P4.
5. Router integration for one vendor-scoped fixture operation. -- closed, R2-P5.
6. Conformance suite and negative tests that prove discovery does not execute provider code. -- closed, distributed across R2-P1/P2/P5's own test suites (see §4).

Packaging-distribution is needed only if the fixture provider becomes a shipped
release artifact. A test fixture provider can stay fully inside
host-invocation proof -- it did: no packaging-distribution work was needed.

## 4. Conformance Evidence (R2-P0 through R2-P5, closed 2026-09-15)

All packets ran through `fgos-code-panel` (real doer/reviewer/red-team cycles,
never a mock review). Every merge commit landed on `main` only after the
Lead independently re-ran the target tests/lints itself, not on a worker's
own claim alone.

| Packet | What it proved | Merge commit | Fix rounds |
| --- | --- | --- | --- |
| R2-P0 | Froze the fixture contract (§2) in docs only; no code. | `5f4e0ee9` | none (docs) |
| R2-P1+P2 | Static `manifest.yaml` parser/validator (fail-closed on malformed/missing/path-escaping/unsupported); derived in-memory registry/linker refusing duplicate, reserved-namespace, unknown-capability, incompatible-contract, and built-in-replacement claims, each with its own test; discovery proven to never execute provider code. | `bc989a66` | 1 (manifest validation not enforced at the `link()` boundary; fixture contract seed hard-coded into a production constructor; dead unreachable branch; contract-version compatibility checked by major version only instead of exact match, which the router requires) |
| R2-P3+P4 | Length-prefixed JSON-RPC 2.0 frame codec (round-trip plus reject-oversized/truncated/invalid-UTF8/invalid-JSON/non-JSON-RPC-2.0); process supervisor spawning the fixture only at invocation time, with bounded startup/handshake/request deadlines, bounded stdout/stderr capture, cooperative-cancel-then-forced-kill, and crash/timeout/protocol-violation lifecycle mapping. | `4d625bc5` | 3 -- caught a real HIGH-severity unbounded stdout-frame queue (hostile-provider memory exhaustion), a `try_wait`/channel-drain race, a cancellation test that didn't exercise what it claimed, unsurfaced stderr capture, a silent contract-version default, a real `cargo clippy -D warnings` failure, an unbounded post-exit drain loop, and (round 3) a genuine ~80% test flake introduced by round 2's own fix -- de-flaked by design (not loosened) and confirmed over 40+30+10 independent repeated runs. Two low-severity residuals documented and deferred (§5). |
| R2-P5 | `ExternalProcessProviderAdapter` (`OperationProvider`) routes `fixture.echo.echo` through the real `InvocationService` pipeline; `EncodedMessage` fully contained inside the adapter module; `test.fixture.echo` still resolves only to the built-in `EchoProvider`; `distribution.build.show`/`work.gate-bypass.show` cannot be claimed by an external manifest (`LinkerError::ReservedNamespace`, exercised through the real R2-P1/P2 linker, not a fake duplicate-descriptor test); `apps/fgos` composition-root wiring untouched. | `60cbd111` | 1 -- caught a CRITICAL-class defect: an ad-hoc synthetic-admission fallback that, for any operation absent from the real catalog, hand-built an `OperationDescriptor`/`AdmittedCall` from the provider's own metadata and invented its own authority-policy id, bypassing the real `CallerAdmission` gate entirely -- not scoped to the fixture, it would have applied to any future non-catalog operation with a matching provider. Deleted outright; `fixture.echo.echo` now reaches admission through an authored `OperationDescriptor` the same way every other operation does. Re-verified clean by an independent reviewer recheck plus the Lead's own four-command run. |

Closing proof, run on `main` after every merge: `cargo test -p fgos-host-runtime --quiet`, `cargo test -p fgos --quiet`, `cargo clippy -p fgos-host-runtime -- -D warnings` (0 warnings), `node --test test/rust-host/command-routes.test.mjs` (14/14, R1's 73-selector route matrix unchanged).

## 5. Documented Residuals (non-blocking for preview)

- R2-P3/P4: a sub-microsecond race in the supervisor's `Disconnected`-channel arms could rarely misclassify a crash as `CompletionUnknown`/`ProviderCrash` instead of the more specific outcome; both are still defined, closed lifecycle outcomes, not a hang. Stdout capture is bounded by the configured max single-frame size (4 MiB) rather than exactly the 64 KiB capture budget for one transient frame -- still a fixed, finite ceiling, just coarser than ideal.
- R2-P5: commit `c4b5ac9f`'s own subject line names finding codes (HIGH-1/HIGH-2), which the repo's own stable-code-artifacts rule discourages; cosmetic, confined to one intermediate feature-branch commit, not repeated in this document or in source comments.
- Both R2-P3/P4's and R2-P5's `fgos-code-panel` coordination sessions never reached a technical `status: completed` in `fgos coordination show`: their first-pass `red-team` runs are permanently recorded `failed` (one found a real bug; the other hit an external executor usage-limit error twice), and this engine has no supported path to close a session after recovery via recheck rounds (`partialPolicy` must be declared at session open, before any actor could have failed; recheck operations do not gate quorum by design). Each session's own disposition/event-log trail (`.fgos/coordination/sessions/code-panel--r2-p3-p4-frame-codec-supervisor/`, `.fgos/coordination/sessions/code-panel--r2-p5-router-integration/`) is complete regardless; the Lead merged on independent re-verification rather than the session's own status field. Reported upstream as a tooling gap.

## 6. R1 Preview Proof Unaffected

Every R2 merge re-ran and passed `cargo test -p fgos-host-runtime -p fgos --quiet` and `node --test test/rust-host/command-routes.test.mjs` on `main`. The 73-selector route matrix (71 `legacy-cli`, two native: `version -> distribution.build.show`, `gate-bypass -> work.gate-bypass.show`) and `apps/fgos`'s composition-root wiring were never touched by any R2 packet -- confirmed by diff review on every merge, not only by the test suite staying green. R1's preview installed/default proof stands exactly as recorded in [r1-rust-host-proof.md](r1-rust-host-proof.md).

## 7. Non-Gates

Marketplace, publisher trust, signature system, production WASM, and core-provider replacement do not gate R2. These remain future work for R3 or later, per the [R2 execution record](../../../../plans/260915-host-invocation-r2-external-process/plan.md)'s own non-goals.

## 8. Related Files

| Relationship | File |
| --- | --- |
| execution record | [../../../../plans/260915-host-invocation-r2-external-process/plan.md](../../../../plans/260915-host-invocation-r2-external-process/plan.md) |
| component protocol | [../contracts/component-protocol.md](../contracts/component-protocol.md) |
| provider manifest | [../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md) |
| implementation alignment | [implementation-alignment.md](implementation-alignment.md) |
| R1 proof | [r1-rust-host-proof.md](r1-rust-host-proof.md) |
| source plan | [../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md) |
