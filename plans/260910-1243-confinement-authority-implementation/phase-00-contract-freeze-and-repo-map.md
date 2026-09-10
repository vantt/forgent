# Phase 00 — Contract Freeze And Repo Map

Depends on: entry docs only. Runs before every implementation cell.

## Objective

Turn `docs/specs/confinement-authority.md` from proposal text into an executable
implementation baseline without changing runtime behavior yet. This phase
freezes the call-site inventory, architecture map impact, exact file leases, and
test targets so later cells do not rediscover boundaries while mutating shared
dispatch code.

## Requirements

- R1: Re-read the confinement spec and record the exact default-support subset
  being implemented first: local bwrap, `host-write-denied`,
  `workspace-write`, `required`, explicit `unconfined`, no default
  `preferred` config support unless a later phase deliberately adds it.
- R2: Inventory every production import/call of `EXECUTOR_ADAPTERS`,
  `cliSpawnAdapter`, `herdr-spawn`, `executeExecutorCli`, `spawnWorker`,
  `resolveExecutorCommand`, and any existing `confinement` field path.
- R3: Classify each call as runtime dispatch, config validation, test helper, or
  legacy lifecycle helper. Only runtime dispatch must move behind the Authority;
  config validation may read adapter metadata but not execute handles.
- R4: Identify every spec/doc index touched by a new component:
  `docs/architecture-map.md`, `docs/specs/reading-map.md` if needed,
  `docs/specs/distribution.md`, `docs/specs/runner.md`, and
  `docs/reference/dispatch-module-boundaries.md`.
- R5: Produce a short phase report under this plan's `reports/` directory with:
  call-site inventory, proposed file leases, risk classification, and focused
  test list.
- R6: Do not edit source runtime behavior in this phase.

## Files

May touch:

- `plans/260910-1243-confinement-authority-implementation/reports/**`
- documentation index/map files if they need a pure planning pointer

Do not touch:

- `src/**`
- `test/**`
- `.fgos/config.json`

## Verification

- `git diff --stat` shows documentation/report-only changes.
- `rg -n "EXECUTOR_ADAPTERS|executeExecutorCli|spawnWorker|resolveExecutorCommand|confinement" src test` output is captured in the phase report.
- Capability annotation for this cell: `code:review`.

