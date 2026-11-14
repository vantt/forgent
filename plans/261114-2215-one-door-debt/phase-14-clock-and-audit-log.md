---
phase: 14
title: "Clock copies reuse the identity time helpers; the reconciliation log is named"
status: pending
effort: 0.5d
leak: "census rank 10 (clock copies, reconciliation append log)"
startAfter: ["F0 wave A on main"]
landAfter: ["capability plan on main, only if requirement 3 edits src/state/fgos-file-registry.mjs"]
cargoLock: "only if fgctl does not already depend on fgos-identity; then stop and ask the big lead"
---

# Phase 14: Clock copies and the reconciliation log

Rules: `phase-lead-rules.md`. pNN = `p14`; report slug `odd-p14-clock-and-audit-log`; crates `fgos-event-store`, `fgctl`.
Facts: `phase-00-facts.md` "Leak 10". Owner decision kept (identity spec :273): two ISO helpers, no clock crate.

## Requirements

1. `packages/event-store/rust/src/publish.rs:122` `timestamp_seconds`: use `fgos_identity::text::iso_utc_secs` (event-store
   already depends on `fgos-identity`). First prove it accepts every timestamp form the event store writes or reads
   (`envelope.rs` `valid_timestamp`): table test in `publish.rs` with today's accepted and refused inputs; if the forms differ,
   stop and report (do not widen identity's parser here).
2. `apps/fgctl/build.rs:~31-33` (civil date at build time): use `fgos_identity::text::iso_utc(secs, 0)` through a
   `[build-dependencies]` entry. If `Cargo.lock` changes (fgctl not already depending on `fgos-identity`), stop and ask the big lead.
3. `src/runner/dispatch/reconciliation-planner.mjs:64,265,328`: the append-only audit log under the `reconcile` lock is a
   legitimate log, not an event stream. No code change. If `src/state/fgos-file-registry.mjs` is meant to list every `.fgos`
   file (read its header and test), add the entry; else nothing.
4. `doors` row (new, `kind: door`): `{ job: "civil date arithmetic", patterns: ["719_?468", "\\bfn (?:civil_from_days|days_from_civil)\\b"], allowed: [{path:"packages/host-runtime/rust/src/civil_time.rs", reason:"owner-kept pair (identity spec)"}, {path:"packages/identity/rust/src/text.rs", reason:"owner-kept pair (identity spec)"}], reason: "dates are computed by the two helpers the owner kept; no third copy" }`
   (adjust patterns to what both helpers and the removed copies actually contain; `apps/fgctl/build.rs` and `publish.rs` must not match).

## Files

- Modify: `packages/event-store/rust/src/publish.rs`, `apps/fgctl/build.rs`, `apps/fgctl/Cargo.toml`, `docs/architecture-manifest.json`,
  `src/state/fgos-file-registry.mjs` (only per requirement 3).
- Tests: the timestamp table test (why new: the parser source changes); seal/publish tests stay owners.
- Net size: Rust about -30.

## Gates

`cargo fmt --all --check`; `cargo clippy -p fgos-event-store -p fgctl --all-targets -- -D warnings`; `cargo test -p fgos-event-store -p fgctl`;
`cargo check -p fgos-event-store -p fgctl --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`;
`node scripts/run-tests.mjs test/runner/dispatch-reconciliation.test.mjs test/runner/dispatch-reconciliation-concurrency.test.mjs test/architecture.test.mjs test/scripts/doc-health.test.mjs test/setup/git-mutation-census.test.mjs`.

## Risk and rollback

- A timestamp the old parser accepted is refused (L x H: seals fail): requirement 1's table blocks it. Rollback: revert the phase.
