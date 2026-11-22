# Phase 4: Config bundle lists secretary and the rotation comment passes the scrub

Capability: `code:implement`.

## Inputs

- `packages/config/rust/tests/golden_schema.rs` `bundle_lists_match_the_files_under_core`. It fails because
  e345b8974 added `core/config-schema/secretary.schema.yaml` and `core/config-standard/secretary.yaml` but not the
  `secretary` entry in `bundle::SCHEMAS` and `bundle::STANDARD` (`packages/config/rust/src/bundle.rs`).
- `packages/config/rust/tests/authoring_equivalence.rs` `no_machine_or_owner_specific_string_is_in_the_standard_files`.
  The scrub needles in `packages/config/contracts/fixtures/repo-differences.v1.json` include `token`, and the
  comment in `core/config-standard/sessionRotation.yaml` (about line 19, "about 150k tokens of 1M", added by
  5ed9aee58) contains it.

## Footprint

`core/config-standard/sessionRotation.yaml`, `packages/config/rust/src/bundle.rs`.

## Steps

1. Add `secretary` in sorted position to both `sections!` lists in `bundle.rs`.
2. Reword the rotation comment so it keeps its meaning without the needle, for example "about 150k of a 1M
   context window". Do not add an allowed string to the fixture and do not drop the needle.
3. Run `cargo test -p fgos-config`. If a snapshot or digest test fails because the bundle grew, fix it by
   regenerating through that test's own recorder, never by hand. Name the recorder in the commit.

## Verify

`cargo test -p fgos-config` passes.

## Rollback

Revert the phase commit.
