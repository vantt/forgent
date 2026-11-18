# Phase 9 — Friction on the contract: kinds, flags, rank

In wave 4 this phase is the only writer of `command-registry.mjs`.

## Inputs
- DISCUSSION §6 D, OM-D9; backlog p-7nqygnztum.
- `packages/observe/rust/src/friction.rs`. Key lines: `PUBLISHED_LAYERS` :13, the `skill` refusal :79, record :222,
  resolve :255, rank :350-398, inline tests from :412. Also `friction_cli.rs`.
- `packages/observe/contracts/observe.friction.v1.json`.
- `src/observe/friction-client.mjs` and its callers (`rg -l recordFriction src`).
- `src/cli/command-registry.mjs:287` (`friction`).

## Footprint
`packages/observe/rust/src/friction.rs`, `packages/observe/rust/src/friction_cli.rs`,
`packages/observe/rust/friction-kinds.json`, `packages/observe/contracts/observe.friction.v1.json`,
`src/observe/friction-client.mjs`, `test/observe/friction-client.test.mjs`, `src/cli/command-registry.mjs`,
`packages/host-runtime/contracts/command-routes.json` (regenerated).

## Steps
1. Declare `fgos.friction.recorded` and `fgos.friction.resolved`. Observe owns friction, so the declaration is embedded
   in the crate. The attrs are:
   - `fgos.friction.kind`: bug | instability | missing | awkward | doc;
   - `fgos.friction.layer`: the component layer (skill, tool, runner, workflow, git, provider, config, docs, state,
     verification, environment);
   - `fgos.friction.class`: the signature;
   - `fgos.friction.disposition`;
   - `fgos.friction.producer`.

   Refs cover run, session, plan, backlog, executor, case and work.
2. `friction record` writes new records through the phase-4 door. It gains `--kind`, plus `--ref <kind>:<id>`, which
   can be repeated. The Node client passes both through.
3. `friction resolve` gains:
   - `--class <slug>`, which settles every unsettled record with that signature;
   - `--reason filed:<backlog-id>`.

   Settle-by-instant stays.
4. `friction rank` groups by signature: count, distinct refs, first seen and last seen, with `--bucket week`. It runs
   on the query engine. `friction classes` lists the signatures. Recording a signature close to an existing one prints
   a warning that names it.
5. Reading covers both the v2 records and the old shards, until phase 13 migrates them. `list` and `rank` on a store
   that is not migrated still show every record.
6. Tests stay inline in `friction.rs`, its owning file. They cover the new attrs, resolve by class, rank by signature
   with a bucket, the `skill` layer, and a mixed old and new store.

## Verify
- `cargo test -p fgos-observe` passes.
- `node scripts/run-tests.mjs test/observe/friction-client.test.mjs` passes.

## Rollback
Revert the phase commit. Old shards are untouched.
