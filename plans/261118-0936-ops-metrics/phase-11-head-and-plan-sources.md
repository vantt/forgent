# Phase 11 — Head state and plan sources

These are projections of truth owned elsewhere, so Observe stores none of it. Rust, in the composition root.

## Inputs
- Identity: `docs/platform/identity/spec.md`, in-process `directory::resolve`, and roles `head:<persona>-<name>` and
  `lead:<LANE>`.
- Session Host `alive(placement)`: `docs/platform/session-host/spec.md:49` and the crate `packages/session-host/rust`.
- Head placement and lineage files under `.fgos/runtime/session-rotation/<persona>-<name>/`. See
  `docs/platform/session-host/spec.md:117-134` and `src/session-host/head-start.mjs`.
- `core/skills/_shared/plan-contract.md` §2 (status and priority).
- The Git component door (`packages/git`).
- Board log `plans/261017-1313-fgos-platform-program-board/log.md`. Scan it only for lines that name a plan dir; never
  read it whole.

## Footprint
`apps/fgos/src/wiring/observe_sources/**`, `apps/fgos/src/wiring/metrics_sources.rs`,
`apps/fgos/src/wiring/observe_declarations.rs`, `apps/fgos/src/wiring/mod.rs`, `apps/fgos/observe-kinds.json`,
`apps/fgos/tests/observe_sources_*.rs`.

## Steps
1. `fgos.head.state` is a live projection per placed head or lead. It joins the placement, the Identity role and
   liveness, and Session Host `alive`.
   - States: `live`, `gone`, `unknown`, `retired`.
   - Unknown is never turned into gone.
   - `retired` is the supervisor plan's signal that a lead ended.
2. `fgos.plan.status` records the transitions of `status` and `priority` in each `plans/*/plan.md`, read from git
   history through the Git door. Attr `fgos.plan.change` is `status` or `priority`. Ids are deterministic.
3. `fgos.plan.activity` records commits that touch `plans/<dir>/` on any branch, and board log lines that name the
   dir.
4. Declare the three kinds in `apps/fgos/observe-kinds.json`, embedded. Register the sources in `metrics_sources.rs`.
5. Tests in `apps/fgos/tests/`:
   - a fixture repo with a plan going draft→ready→running→done, plus one priority change, gives four transitions;
   - a placement whose host reports gone gives `gone`;
   - an unknown host gives `unknown`.

## Verify
- `cargo test -p fgos` passes.
- Live: `npm run fgos:dev -- metrics query --kind fgos.plan.status --since -7d --dir /home/vantt/projects/forgent`.

## Rollback
Revert the phase commit.
