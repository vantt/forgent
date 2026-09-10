# Phase 06 — Invocation Service And Authority

Depends on: Phase 05 merged.

## Objective

Give `fgos-host-runtime` the only thing that ever calls a provider: the
`InvocationService` pipeline (`received -> admit -> select -> grant -> invoke
-> normalize -> record`), the two-stage authority gate, the async
`OperationProvider` trait, and one in-memory fixture provider proving the
whole path end to end. The Router built in Phase 05 is called but never
edited — if it looks wrong here, that is a blocker to raise, not a silent
fix.

## Requirements

- R1: `src/invocation_service.rs` implements the six-stage pipeline as an
  async fn/struct method taking a `HostInvocation` and `OperationRequest`,
  calling `operation_provider_router::select` (Phase 05, read-only) for the
  `select` stage, and ending in exactly one lifecycle-record write.
- R2: `src/authority_gate.rs` implements `CallerAdmission` (runs before
  `select`; principal/operation/policy/host — deny by default) and
  `ProviderGrant` (runs after `select`; intersects the admitted action with
  the operation's capability policy and the selected provider's requested
  capabilities — deny by default, least-privilege only).
- R3: `OperationProvider` trait is defined here (not in `contracts.rs`)
  exactly per kernel §6's sketch: `descriptor()` plus an async `invoke()`
  returning `Pin<Box<dyn Future<Output = Result<ProviderOutcome,
  ProviderError>> + Send + 'a>>`, taking `&HostInvocation`,
  `OperationRequest`, `InvocationControl`, `&dyn EventSink`.
- R4: `InvocationControl` (deadline + a cancellation token + the granted
  capability set from R2) and `EventSink` (progress/event/diagnostic sink)
  are defined here and passed into every `invoke()` call.
- R5: Extend `contracts.rs`'s `ProviderOutcome` (Phase 05 lease, narrow
  addition only) with the `parked` variant from kernel §8, and extend
  `ProviderError` with `provider-failed` / `completion-unknown` if Phase 05
  left them out of the closed set. A lifecycle record type enforces exactly
  one terminal state per invocation (`succeeded | semantic-failed |
  cancelled | deadline-exceeded | provider-failed | completion-unknown`);
  `dispatched` marks the point past which a transport loss becomes
  `completion-unknown`, never a fabricated second terminal.
- R6: `src/providers/builtin.rs` implements one in-memory
  `test.fixture.echo` `OperationProvider` used only by this crate's tests.
- R7: Tests (each independently runnable, named after the case): deadline
  exceeded, cancellation mid-invoke, admission refused before `select` (never
  reaches it — assert the Router is not called), grant refused after
  `select` (never invokes — assert the provider is not called), provider
  panic/crash normalizes to `provider-failed` (never a semantic failure), a
  response arriving after cancellation/deadline is recorded as diagnostic
  evidence and never a second terminal record, and two projector-shaped test
  harnesses (a CLI-shaped one and an in-memory remote-shaped one, both
  thin test-only structs in this crate — real CLI/remote adapters are Phase
  07/R3) drive the same `OperationId` through `InvocationService` and reach
  the same fixture provider with the same outcome.
- R8: A module-graph assertion proves no host-runtime module imports
  another host-adapter-shaped module inappropriately: an integration test
  (`tests/module_graph.rs`) reads each `src/*.rs` file via `include_str!`
  and asserts, by scanning `use` lines, that `contracts.rs`/`catalog.rs`/
  `registry.rs`/`operation_provider_router.rs` never `use` anything from
  `invocation_service.rs`/`authority_gate.rs`/`providers::*`, and that the
  two Phase 06/R7 test-only projector shims never `use` each other.

## Files

Likely touch:

- `packages/host-runtime/rust/src/invocation_service.rs`
- `packages/host-runtime/rust/src/authority_gate.rs`
- `packages/host-runtime/rust/src/providers/builtin.rs`
- `packages/host-runtime/rust/src/contracts.rs` (only the `parked`/error
  additions in R5 — no other edits)
- `packages/host-runtime/rust/src/lib.rs` (module wiring)
- `packages/host-runtime/rust/tests/module_graph.rs`
- `packages/host-runtime/rust/tests/two_projectors.rs`
- `packages/host-runtime/rust/Cargo.toml` (enabling the `tokio` features this
  phase needs, within Phase 04's pinned version)

Do not touch:

- `packages/host-runtime/rust/src/catalog.rs`,
  `operation_provider_router.rs`, `registry.rs` selection logic (Phase 05
  lease — read/call only)
- `apps/fgos/**`, `packages/distribution/rust/**`
- `src/**`, `bin/**`, `test/**`

## Verification

```sh
cargo test -p fgos-host-runtime
cargo test -p fgos-host-runtime --test module_graph
cargo test -p fgos-host-runtime --test two_projectors
cargo clippy -p fgos-host-runtime --all-targets -- -D warnings
```

- `cargo test -p fgos-host-runtime -- --list` shows one test per R7 case by
  name (deadline, cancellation, admission-refused, grant-refused,
  provider-crash, late-response-after-cancel, two-projectors-same-outcome).
- The alias-ban grep from `plan.md`'s Constraints, run over
  `packages/host-runtime/rust`, returns nothing.

Capability annotation for this cell: `code:implement`.
