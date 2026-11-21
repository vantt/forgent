# Phase 1: Crate and `fgos authority locate`

## Inputs
- `docs/platform/component-authority/spec.md` and `packages/component-authority/contracts/model.v1.json` (sibling plan).
- `packages/component-authority/model/*.json` and `doors/*.json`.
- The wiring pattern: `packages/convention/rust/` (lib, operations, provider), `apps/fgos/src/routing.rs:89`,
  `apps/fgos/Cargo.toml:12`, `apps/fgos/src/invocation_doors.rs`, `apps/fgos/src/cli_projector.rs`, and
  `packages/host-runtime/contracts/command-manifest.json`, `command-routes.json`, `command-route-annotations.json`.

## Files it may write
packages/component-authority/rust/ (new crate `fgos-component-authority`), Cargo.toml (workspace member), Cargo.lock, apps/fgos/Cargo.toml, apps/fgos/src/routing.rs, apps/fgos/src/invocation_doors.rs, apps/fgos/src/cli_projector.rs, apps/fgos/src/wiring/mod.rs, apps/fgos/src/wiring/authority.rs, apps/fgos/tests/authority.rs, the three host-runtime command contracts

## Steps
1. Create the crate. `model.rs` loads every model file from `<repo>/packages/component-authority/model/` into typed
   rows that follow `model.v1.json`. Unknown fields are refused. `locate.rs` exposes
   `locate(model, sentence) -> Vec<Match>`. Each match is `{kind, id, canonical, matchedOn: canonical|alias|meaning, score}`.
   Matching: lowercase and fold Vietnamese diacritics, tokenise, then score an exact canonical or alias phrase hit
   above token overlap with the meaning sentence. Ties break by kind, then id. Do nothing beyond this until H2
   search exists; the spec names that reuse point.
2. Add the verb `fgos authority locate "<sentence>" [--json] [--limit N]`, wired like `convention`: read-only, served
   natively, and returning the `fgos.v1` envelope. Write its help line in the host command manifest.
3. Crate tests cover the loader (a valid model loads; an unknown field and a missing file are refused) and the
   ranking (a canonical hit beats an alias hit, which beats meaning overlap; diacritic folding works).
   `apps/fgos/tests/authority.rs` runs the verb once on the real model:
   `locate "ghi file nguyên tử"` and `locate "atomic file write"` both return `durable-file` first.

## Verify
`cargo test -p fgos-component-authority` and `cargo test -p fgos --test authority` are green.
`npm run fgos:dev -- authority locate "atomic file write" --json` shows `durable-file` first.

## Rollback
Revert the phase commit. Nothing else calls the verb yet.
