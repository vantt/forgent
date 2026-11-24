# Phase 2a fix result: `doctor --fix --only` judges only the named rows

- `packages/distribution/rust/src/doctor.rs` `run()`: with `fix` and a non-empty `only`, the judged rows are the registry rows whose id is named, in registry order. The per-owner call grouping is unchanged, so a run naming only native rows makes no bridge judge call. Without `--only` nothing changes.
- Test `only_runs_just_the_named_fixes_in_registry_order_and_refuses_what_it_cannot_honour` now asserts the judged ids, the exact native and bridge calls, and that a native-only `--only` never calls the bridge to judge. No new test.
- `apps/fgos/src/wiring/doctor/mod.rs`: `--only` help text states the new meaning.
- `setup-doctor-registry.md`: the contract had no `--only` sentence; added one after the `--fix` line.

## Not verified
The sandbox refused `cargo test -p fgos-distribution` (approval needed), so neither the Rust build nor the tests were run. The lead must run it, plus the timing and `mailbox-live-confined` checks from the brief.

Status: DONE_WITH_CONCERNS
Summary: `--fix --only` now judges only the named rows (code, test, help, contract updated), but cargo could not be run in this sandbox so it is unverified.
