# Phase 1: Declare the component and move owners

Status: draft (waits on q-s4oy6tinfr). Decisions: A7, A4, I6 of the discussion.

## Inputs
- `plans/discussions/ds-ubqlutna6r-domain-agnostic-item-component/DISCUSSION.md` §4 A7, §6 "Layers and tiers", §3 I6 and I43.
- This plan's Authority map (`plan.md`).
- `packages/component-authority/model/components.yaml` rows `supervision`, `work-state`, `questions`, `workflow`; `layers.yaml`.
- `fgos authority declare --help`.

## Footprint
- `packages/component-authority/model/**`

## Steps
1. Confirm q-s4oy6tinfr is answered (`fgos questions`); if not, stop and leave the phase `draft`.
2. Run `fgos authority declare --kind component portfolio --approved-by q-s4oy6tinfr` with a tier below Workflow (tier 6), paths `packages/portfolio/`, contracts `packages/portfolio/contracts/`, spec `docs/platform/portfolio/spec.md`, and `--move` the "portfolio status" entry and `src/portfolio/` path from `supervision`.
3. Leave Supervision's `owns` with "project supervisor orchestration" and the plan lane pool only; add `portfolio` to Supervision's dependencies (reads and records only through its ports).
4. In `work-state`, reword "status board" as a view and remove "human gates" from `owns`, leaving them with `questions` (I6).
5. Move the contract rows `portfolio/portfolio-vocabulary.v1`, `portfolio/backlog-item.schema.v1` and `portfolio/discussion.schema.v1` to provider `portfolio`; add rows for the `portfolio-item-write-door` door and the `portfolio-cards` and `portfolio-requests` contracts named in the Authority map.
6. Run `fgos authority model` and the architecture test.

## Verify
`fgos authority model --json` shows `portfolio` at a tier below `workflow`, and `node --test test/architecture.test.mjs` passes.

## Rollback
`git revert` the phase commit; the model files return to their previous rows.
