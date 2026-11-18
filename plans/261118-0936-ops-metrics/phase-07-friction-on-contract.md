# Phase 7 — Friction on the contract

## Inputs
- DISCUSSION §6 D, OM-D9; backlog p-7nqygnztum.
- `packages/observe/rust/src/friction.rs` (`PUBLISHED_LAYERS` :13, record :222, resolve :255, rank :350-398) and
  `friction_cli.rs`.
- `packages/observe/contracts/observe.friction.v1.json`.
- `src/observe/friction-client.mjs` and its callers (`rg -l recordFriction src`).
- Doctor row `observe-friction-migrated` (`apps/fgos/src/wiring/doctor/observe.rs`).
- Live store `/home/vantt/projects/forgent/.fgos/observe/friction/` (762 records, 21 signatures).

## Footprint
`packages/observe/rust/src/friction.rs`, `packages/observe/rust/src/friction_cli.rs`,
`packages/observe/contracts/observe.friction.v1.json`, `packages/observe/contracts/friction-kinds.json`,
`packages/observe/rust/tests/friction_*.rs`, `src/observe/friction-client.mjs`, `test/observe/friction-client.test.mjs`,
`apps/fgos/src/wiring/doctor/observe.rs`.

## Steps
1. Declare `fgos.friction.recorded` and `fgos.friction.resolved` in `friction-kinds.json`, with these attrs:
   - `fgos.friction.kind`: bug | instability | missing | awkward | doc;
   - `fgos.friction.layer`: a list of today's components, including `skill`, `tool`, `runner`, `workflow`, `git`,
     `provider`, `config`, `docs`, `state`, `verification`, `environment`;
   - `fgos.friction.class`: the signature;
   - `fgos.friction.disposition`;
   - `fgos.friction.producer`.

   Refs cover any subject: run, session, plan, backlog, executor, case or work.
2. `friction record` writes through the phase-1 write door. Its flags gain `--kind` and `--ref <kind>:<id>`, which can
   be repeated. The Node client passes them through.
3. `friction resolve` gains `--class <slug>`, which settles every unsettled record carrying that signature, and
   `--reason filed:<backlog-id>`. Settle-by-instant is kept.
4. `friction rank` groups by signature: count, distinct refs, first and last seen, and `--bucket week`, using the
   query engine. Add `friction classes`, which lists the signatures. When a record introduces a new signature close
   to an existing one, it prints a warning naming the close one.
5. Migrate the existing shards explicitly. `friction migrate --to-records` uses deterministic ids, so it is
   idempotent, and reports counts before and after. Then the old write path is removed. The old shards stay untouched
   until phase 12 passes. The doctor row checks the migration marker.
6. Tests in the crate cover the new attrs, resolve by class, rank by signature with a bucket, migration idempotence,
   and the `skill` layer, which is refused today (`friction.rs:79`).

## Verify
- `cargo test -p fgos-observe` and `node scripts/run-tests.mjs test/observe` are green.
- A live dry run of migrate on a copy of the main checkout store shows 762 records in and 762 out.

## Rollback
Revert the phase commit. The old shards were not changed.
