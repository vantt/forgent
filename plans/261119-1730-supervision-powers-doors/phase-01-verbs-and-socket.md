# Phase 1: Verbs and socket entries

## Inputs
Part 1 landed (queue raise, drone definitions, prune, bounded read and type). `src/session-host/head-request.mjs`,
`head-request-client.mjs`, `packages/run-supervisor/contracts/head-request.v1.json`, `src/cli/command-registry.mjs`,
`packages/host-runtime/contracts/command-manifest.json`, `apps/fgos/src/wiring/supervision.rs`; discussion section 6 grant
table and SP-D4, SP-D5, SP-D6, SP-D8 (rows 18, 20, 21).

## Files it may write
Its footprint in the plan table.

## Steps
1. `fgos supervisor raise --kind <coordination-*> --ref <ref> --reason <text> [--next <cmd>]` calling the phase-1 core.
2. `fgos session read <role|key> [--lines N]` (read-only, calls bounded read) and `fgos session type <role|key> --text`
   (calls `type_text`; refused `target-not-stuck` unless an open event names the target session; the target must resolve
   through Identity). Neither takes a raw herdr id.
3. `fgos watcher tune <definition> [--arm|--disarm] [--set key=value]` writes the project's config through the config door,
   bounded by the schema min and max from part 1 phase 2, and records a coordination event.
4. `fgos metrics prune [--apply]` exposing the Observe prune core (dry-run default); and the socket entry `metrics record`
   refuses any kind that is not `fgos.coordination.*`.
5. Register every verb once in the command registry and manifest; add each socket verb to `head-request.v1.json` with args
   and refusal codes, and to the client constants; the stop door refuses a non-head target (`stop-target-not-head`) for the
   supervisor (row 21).
6. Register `secretary.run.maxMinutes` (15), `secretary.run.tier` (`standard`) in `core/config-standard` and `core/config-schema`.
   The `run` socket entry for the secretary refuses a longer ceiling, more than one unit, and `--writes` outside a linked worktree.
7. One wiring test per verb (principle 8: the cores own the cases).

## Verify
`cargo test -p fgos --test supervision_verbs`; `node --test test/session-host/head-request.test.mjs`; the registry and
manifest consistency tests in `npm test`.

## Rollback
Revert the commit; no grant exposes a verb until phase 2.
