# Phase 05 — Kernel Contracts And Pure Router

Depends on: Phase 04 merged.

## Objective

Give `fgos-host-runtime` every canonical kernel type (kernel §3/§5) and a
pure, synchronous selection function. No `InvocationService`, no authority
gates, no async, no I/O — those are Phase 06. This phase's `RegistrySnapshot`
exists only to make the Router testable in isolation; the production
snapshot (which also binds `fgos-distribution`'s provider) is assembled later
at the composition root (`apps/fgos`, Phase 08), because the kernel crate
must never depend on a leaf provider crate.

## Requirements

- R1: `src/contracts.rs` defines every canonical type from kernel §3/§5:
  `OperationId` (validated `<component>.<object-type>.<action>[.<variant>]`
  newtype), `HostInvocation` (host kind as an open `String`, plus
  deadline/cancellation/tracing placeholders), `ContractRef {id, version}`,
  `OperationRequest {operation, contract, input: Box<dyn Any + Send>}`,
  `ProviderOutcome`, `ProviderError` (closed enum covering every failure
  family in kernel §8 except the two that only exist inside the pipeline —
  `provider-failed` normalization and `parked` outcome extension stay a
  Phase 06 addition to this same file), `ProviderDescriptor` (`lifecycle:
  singleton | per-invocation | pooled`, mechanism as an open `String`,
  allowed hosts/modes, capabilities, replacement, concurrency, health),
  `OperationDescriptor` (effect `read | write | external`, idempotency `none
  | keyed | safe`, authority policy id, allowed host kinds, streaming mode),
  `OperationCatalog` (`&'static [OperationDescriptor]`), `RegistrySnapshot`
  (catalog + `&'static [&'static dyn OperationProvider]` + a fixed
  `&'static str` fingerprint — no runtime hashing; R1 never relinks, so a
  fixed literal is honest, not a placeholder).
- R2: `src/catalog.rs` defines `pub const CATALOG: &[OperationDescriptor]`
  holding exactly `distribution.build.show` and one fixture operation
  `test.fixture.echo`.
- R3: `src/registry.rs` defines `RegistrySnapshot`'s public constructor —
  `pub fn build_snapshot(catalog: OperationCatalog, providers: &'static
  [&'static dyn OperationProvider], fingerprint: &'static str) ->
  RegistrySnapshot` — plus a crate-private `SNAPSHOT_FOR_TESTS` built only
  from in-crate fixture providers, for this phase's own tests. It never
  references `fgos-distribution`. Document in a doc comment that the
  production snapshot is assembled once at the `apps/fgos` composition root
  (Phase 08) by calling this same constructor with the real provider list —
  `fgos-host-runtime` never depends downward on a provider crate.
- R4: `src/operation_provider_router.rs` defines `pub fn select(input:
  SelectionInput, snapshot: &RegistrySnapshot) -> Result<&ProviderDescriptor,
  SelectionRefused>` — pure, no I/O, no async, no panic on invalid input.
  `SelectionInput` carries `operation: OperationId`, request/outcome contract
  versions, `host_kind: &str`, `invocation_mode: &str`, and an empty-in-R1
  `RouterPolicy` placeholder struct (extensible, never referenced by
  selection logic yet).
- R5: `select` performs exact binding only — no priority, no registration
  order, no last-writer-wins.
- R6: Negative and edge tests (inline `#[cfg(test)]` modules, one per case,
  named after the case): missing binding, duplicate binding fails linking,
  incompatible contract version, disallowed host kind, wrong invocation
  mode, exact-version-pair selection succeeds, and a shuffled provider table
  produces the identical selection (proves no order dependence).
- R7: `OperationProvider` is declared only as a forward name (a doc comment
  in `contracts.rs` pointing at Phase 06, which owns the trait definition
  and its `invoke()` signature); this phase never defines `invoke()` or pulls
  in `tokio`.

## Files

Likely touch:

- `packages/host-runtime/rust/src/lib.rs` (module wiring only)
- `packages/host-runtime/rust/src/contracts.rs`
- `packages/host-runtime/rust/src/catalog.rs`
- `packages/host-runtime/rust/src/registry.rs`
- `packages/host-runtime/rust/src/operation_provider_router.rs`

Do not touch:

- `packages/host-runtime/rust/src/invocation_service.rs`,
  `authority_gate.rs`, `providers/**` (do not create — Phase 06 lease)
- `apps/fgos/**`, `packages/distribution/rust/**`
- `src/**`, `bin/**`, `test/**`
- `packages/host-runtime/rust/Cargo.toml`'s dependency list beyond what
  Phase 04 already pinned (no `tokio` usage here)

## Verification

```sh
cargo test -p fgos-host-runtime --lib
cargo clippy -p fgos-host-runtime --all-targets -- -D warnings
```

- `cargo test -p fgos-host-runtime --lib -- --list` shows one test per R6
  case by name (missing binding, duplicate binding, incompatible contract,
  disallowed host, wrong mode, exact-version-pair selection, shuffle-order
  stability).
- `grep -n "async\|tokio\|std::fs\|std::net\|std::process" packages/host-runtime/rust/src/operation_provider_router.rs` returns nothing — proves the Router stays pure.
- The alias-ban grep from `plan.md`'s Constraints, run over
  `packages/host-runtime/rust`, returns nothing.

Capability annotation for this cell: `code:implement`.
