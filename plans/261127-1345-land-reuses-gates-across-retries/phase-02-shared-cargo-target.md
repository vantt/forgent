# Phase 2: Land commands build against one shared Cargo target

## Requirements

Gates and regeneration run with `CARGO_TARGET_DIR` set to `<main checkout>/.fgos/runtime/land/cargo-target`, unless
the caller already set it.

## Files

`packages/supervision/rust/src/land.rs` (`run_logged`, `LAND_CARGO_TARGET`), `packages/supervision/rust/tests/land.rs`.

## Risk

The shared target grows like any Cargo target and is never pruned by the land door. It lives under
`.fgos/runtime/`, which a person may delete at any time; the next land fills it again.

## Result (2026-11-27)

Done. A gate sees the shared target, or the caller's own target when the caller names one.
