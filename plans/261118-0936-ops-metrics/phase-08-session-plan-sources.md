# Phase 8 — Session, head and plan sources

These are new sources, written in Rust, and they are projections of truth owned elsewhere: Observe stores none of it.

## Inputs
- DISCUSSION §6 C and §6 E (signals that `head-gone`, `plan-no-progress` and pace need).
- `packages/observe/rust/src/sources/claude_transcripts.rs`, which already reads `model` but never groups by it.
- Identity: `fgos identity list --json` (roles `head:<persona>-<name>`, `lead:<LANE>`, liveness) and
  `docs/platform/identity/spec.md`.
- Session Host `alive(placement)`: `docs/platform/session-host/spec.md:49` and the crate `packages/session-host/rust`.
- Head placement and rotation lineage files, under `.fgos/runtime/session-rotation/<persona>-<name>/`
  (`docs/platform/session-host/spec.md:117-134`, `src/session-host/head-start.mjs`).
- Statusline sidecar format: `plans/261117-1856-secretary-session-spine/reports/spike-rotation.md`.
- Plan status vocabulary: `core/skills/_shared/plan-contract.md` §2.
- The Git component door (`packages/git`) for history reads.
- Board log `plans/261017-1313-fgos-platform-program-board/log.md`. Never read it whole; scan only for lines naming a
  plan dir.

## Footprint
`packages/observe/rust/src/sources/**`, `apps/fgos/src/wiring/metrics_sources.rs`,
`apps/fgos/src/wiring/observe_sources/**`, `apps/fgos/src/wiring/mod.rs`, `apps/fgos/observe-kinds.json`.

## Steps
1. **Transcript source.** It emits `fgos.session.usage`, one per session and model per hour bucket, with a ref to the
   session plus the model and token measures. It also emits `fgos.session.activity`, holding the last activity
   instant per session, taken from the transcript or the sidecar. Observe owns the transcript source, so these kinds
   are declared in `packages/observe/contracts/` next to it.
2. **Composition root sources** (`apps/fgos/src/wiring/observe_sources/`, declared in `apps/fgos/observe-kinds.json`):
   - `fgos.head.state`: a live projection of each placed head or lead. It joins the placement, Identity role and
     liveness with Session Host `alive`. `gone` and `unknown` stay distinct, because unknown is never turned into
     gone.
   - `fgos.plan.status`: the transitions of `status` in each `plans/*/plan.md`, read from git history through the Git
     door, with deterministic ids.
   - `fgos.plan.activity`: commits touching `plans/<dir>/` on any branch, and board log lines naming the dir.
3. Register them in `metrics_sources.rs`.
4. Tests:
   - a transcript fixture with two models gives two groups;
   - a fixture repo with a plan moved draft→ready→running→done gives three transitions;
   - a placement whose host reports gone gives a state record `gone`.

## Verify
- `cargo test -p fgos-observe` and the `apps/fgos` tests are green.
- Live:
  - `npm run fgos:dev -- metrics query --kind fgos.plan.status --since -7d --dir /home/vantt/projects/forgent`;
  - `... --kind fgos.session.usage --by gen_ai.request.model --agg sum:gen_ai.usage.input_tokens`.

## Rollback
Revert the phase commit.
