# Phase 13 — Friction store migration

In wave 5 this phase is the only writer of `command-registry.mjs`.

## Inputs
- Phase 9.
- The live store `/home/vantt/projects/forgent/.fgos/observe/friction/`: 762 records and 21 signatures.
- The existing `friction migrate` (legacy `work.friction` import) pattern, in spec § Friction.

## Footprint
`packages/observe/rust/src/friction.rs`, `packages/observe/rust/src/friction_cli.rs`, `src/cli/command-registry.mjs`,
`packages/host-runtime/contracts/command-routes.json` (regenerated).

## Steps
1. Add `friction migrate --to-records`. It is explicit and runs under the store lock. Deterministic ids make it
   idempotent. It reports the counts before and after.
   - Each old record maps to the new attrs: `layer` → `fgos.friction.layer`, `errorClass` → `fgos.friction.class`,
     and `subject` → a ref.
   - `fgos.friction.kind` stays unset, because the old records never had it. `coverage` counts them.
2. After migration, `record` writes only v2 records. The v1 write path is removed (L10). Reading old shards stays
   possible until phase 16 deletes them.
3. Inline tests:
   - migrate twice gives the same count;
   - the mapping;
   - the v1 write path is gone.

## Verify
- `cargo test -p fgos-observe` passes.
- A dry run of migrate on a copy of the main checkout store shows 762 records in and 762 out.

## Rollback
Revert the phase commit. Old shards are untouched until phase 16.
