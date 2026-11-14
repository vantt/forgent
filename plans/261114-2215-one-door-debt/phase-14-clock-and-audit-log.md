---
phase: 14
title: "The event store parses timestamps with the identity helper; build.rs and the reconciliation log are named"
status: pending
effort: 0.5d
leak: "census rank 10 (clock copies, reconciliation append log)"
startAfter: ["F0 wave A on main"]
landAfter: ["capability plan on main, only if requirement 3 edits src/state/fgos-file-registry.mjs"]
---

# Phase 14: Clock copies and the reconciliation log

<!-- Red team 2026-11-14: build.rs stays (a build-dependency on fgos-identity changes Cargo.lock and compiles its graph into
fgctl's build script to replace ten lines); the row's limits are stated. -->

Rules: `phase-lead-rules.md`. pNN = `p14`; report slug `odd-p14-clock-and-audit-log`; crate `fgos-event-store`.
Facts: `phase-00-facts.md` "Leak 10". Owner decision kept (identity spec :273): two ISO helpers, no clock crate.

## Requirements

1. `packages/event-store/rust/src/publish.rs:122` `timestamp_seconds` (callers `seal.rs:542`, `publish.rs:74`): use
   `fgos_identity::text::iso_utc_secs` (event-store already depends on `fgos-identity`, `Cargo.toml:17`). First prove it accepts
   and refuses the same inputs (`envelope.rs` `valid_timestamp` forms): a table test in `publish.rs`; if the forms differ, stop
   and report (do not widen identity's parser here). Mind the `i64`/`u64` difference at the call sites.
2. `apps/fgctl/build.rs:31-40` (civil date at build time): stays. A build script cannot reach the runtime crates without a new
   `[build-dependencies]` edge (a `Cargo.lock` change and identity's graph in fgctl's build) for ten lines. Allowed with that reason.
3. `src/runner/dispatch/reconciliation-planner.mjs:64,265,328`: an append-only audit log under the `reconcile` lock, not an event
   stream; no code change. If `src/state/fgos-file-registry.mjs` claims to list every `.fgos` file (read its header and test),
   add the entry; else nothing.
4. `doors` row (new, `kind: door`): `{ job: "civil date arithmetic", patterns: ["719_?468", "\\bfn (?:civil_from_days|days_from_civil)\\b"], allowed: [{path:"packages/host-runtime/rust/src/civil_time.rs", reason:"owner-kept pair (identity spec)"}, {path:"packages/identity/rust/src/text.rs", reason:"owner-kept pair (identity spec)"}, {path:"apps/fgctl/build.rs", reason:"build script; reaching the runtime crates would add a build edge"}], reason: "dates are computed by the two helpers the owner kept" }`.
   Limit, stated in the row reason and the report: these patterns catch the days-from-civil algorithm, not a year-by-year loop
   like the removed `publish.rs` copy.

## Files

- Modify: `packages/event-store/rust/src/publish.rs`, `docs/architecture-manifest.json`, `src/state/fgos-file-registry.mjs` (only per requirement 3).
- Tests: the timestamp table test in `publish.rs` (why new: the parser source changes); seal/publish tests stay owners.
- Cargo.lock: unchanged. Net size: Rust about -15.

## Gates

`cargo fmt --all --check`; `cargo clippy -p fgos-event-store --all-targets -- -D warnings`; `cargo test -p fgos-event-store`;
`cargo check -p fgos-event-store --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`;
`node scripts/run-tests.mjs test/runner/dispatch-reconciliation.test.mjs test/runner/dispatch-reconciliation-concurrency.test.mjs test/architecture.test.mjs test/scripts/doc-health.test.mjs test/setup/git-mutation-census.test.mjs`.

## Risk and rollback

- A timestamp the old parser accepted is refused (L x H: seals fail): requirement 1's table blocks it. Rollback: revert the phase.
