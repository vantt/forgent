# Phase 14 report: clock copies and the reconciliation log

## Done

- `packages/event-store/rust/src/publish.rs`: `timestamp_seconds` keeps the envelope's `valid_timestamp` guard, then calls
  `fgos_identity::text::iso_utc_secs`. The year-by-year loop is gone (about -20 lines Rust, +30 test).
- Form comparison: after `valid_timestamp`, the two parsers agree on every shape (milliseconds, `Z`, field ranges). The guard
  stays first because `iso_utc_secs` is looser (day 31 in any month, second 60). One difference: a year before 1970 has no
  unsigned form in identity, the old code returned a negative number. Identity's parser is not widened; `None` reads as 0,
  the value `event_commit_input` clamps to (`seconds.max(0)`). Only `seal.rs:542` (age of the oldest unsealed event) sees
  the difference, and only for an event dated before 1970.
- Table test `publish.rs::tests` names the behaviour; why new: the parser source changed and no test pinned the arithmetic.
  Seal/publish tests stay the owners of their behaviour.
- `apps/fgctl/build.rs`: unchanged (allowed with a reason in the row).
- `reconciliation-planner.mjs`: no code change. `fgos-file-registry.mjs` header says "well-known FILE paths", not every
  `.fgos` file, so no entry was added.
- `docs/architecture-manifest.json`: new `doors` row "civil date arithmetic", no debt. Final `allowed`: host-runtime
  `civil_time.rs`, identity `text.rs`, `apps/fgctl/build.rs`. Limit stated in the row reason: it catches the days-from-civil
  algorithm, not a year-by-year loop.

## Gates (all green, base 3cd0b8c41)

fmt; clippy `-D warnings`; `cargo test -p fgos-event-store`; check on msvc and aarch64-apple-darwin; run-tests on the five
listed files (84 pass); decision-citation drift 0; git-one-door scan 0 undeclared (census unchanged). `Cargo.lock` unchanged.

CHANGELOG: no user-visible line.

Status: DONE

## Lessons

- A guard owned by one crate (the envelope's date validity) can stay in front of a shared helper that is looser; reuse the
  arithmetic, not the rules.
- State the one input class where a shared helper differs (pre-1970 here) instead of widening the helper.
- A `doors` row for an algorithm constant (`719_468`) finds the copies a name pattern would miss.
