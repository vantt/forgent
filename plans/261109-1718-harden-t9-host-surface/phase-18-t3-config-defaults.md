---
phase: 18
title: "T3 fix: config defaults live only in the config door (dispatch section schema; maxRounds read from config)"
status: pending
depends_on: ["none inside T9 (T3 is closed; fix of a closed layer, decision 83)"]
parallel: "T3 slot, beside P04 (file-disjoint); must land before P20 (both touch loops/reviewed.mjs)"
effort: ~0.5d
net_size: "Node about -25; YAML about +15; JSON stop-gap entries -2; Rust 0; tests about 0 (estimate)"
---

# Phase 18 - T3 fix: config defaults in one door (authority audit AU-03 part)

**Authority moved:** every value a person may set has its default in the config door (T3, `core/config-standard` plus `core/config-schema`); the T4 and T5 readers read the value and keep no second default.

## Context

- `dispatch.gateKillGraceMs` and `dispatch.cancelWaitMs`: default `10000` and `gateKillGraceMs + 5000` in `packages/config/contracts/runtime-keys.v1.json:6-17` (a stop-gap list, `31734bc61`) and again as code in `src/run-supervisor/gate-kill-grace.mjs:14,42,67,80`.
- `maxRounds`: `core/config-standard/runner.yaml:812` and `src/runner/execution/loops/reviewed.mjs` (`DEFAULT_MAX_ROUNDS`, `:130`).
- Work, not here: the worker slot "recommended 8" (`src/state/worker-slots.mjs:81`) against `core/config-standard/workerSlots.yaml` `null` (Work later, decision 78).

## Requirements

1. A `dispatch` section schema with both defaults in `core/config-standard/dispatch.yaml` and `core/config-schema/dispatch.schema.yaml` (AGENTS.md install gate: config keys go there and nowhere else). The derived default (`gateKillGraceMs + 5000`) is expressed the way the schema vocabulary allows; if it cannot express a derived value, `cancelWaitMs` gets its own literal default and the reader keeps no arithmetic (step 1 decides with the config door's docs).
2. `gate-kill-grace.mjs` reads both values through the config facade only; its literals go. The two entries leave `runtime-keys.v1.json`.
3. `reviewed.mjs` reads `maxRounds` from the config and refuses by name when it is missing; `DEFAULT_MAX_ROUNDS` goes.
4. No value changes for any user (same numbers); `fgos config explain dispatch.gateKillGraceMs` names the standard file as the source.

## Files

**Create:** `core/config-standard/dispatch.yaml`, `core/config-schema/dispatch.schema.yaml`.

**Modify:** `packages/config/contracts/runtime-keys.v1.json`, `src/run-supervisor/gate-kill-grace.mjs`, `src/runner/execution/loops/reviewed.mjs`, their owning tests (`rg -l "gateKillGraceMs|cancelWaitMs|maxRounds" test`).

**Delete:** the code defaults above; the two stop-gap entries.

**Tests to retire:** a case that asserts the code default by itself is re-pointed at the config door's default (same number), not duplicated.

## Steps

1. `rg -n "gateKillGraceMs|cancelWaitMs|DEFAULT_MAX_ROUNDS|runtime-keys" src packages core test`; read the config door's section schema rules.
2. Red: `fgos config explain` reports the standard file as source (fails today: stop-gap list); `reviewed` with no `maxRounds` in its config refuses by name.
3. Schema, readers, deletions.

## Validation (focused)

FR `test/run-supervisor/*gate-kill*`, `test/runner/execution/loops/*reviewed*`, the config door's section tests; `fgos config check` on a built host. Land gate.

## Risks and rollback

| Risk | L x I | Mitigation |
|---|---|---|
| A project with no `dispatch` section loses a default | L x H | the standard file supplies it; a test with an empty project config |

Rollback: revert the merge commit.
