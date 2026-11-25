# Phase 10: Docs and decision record

Status: draft. Decisions: all (A1–A8).

## Inputs
- The discussion §4 and §6; phases 1–8 as landed.
- `docs/platform/governance.md#decision-scope-to-holder-table`; `docs/platform/runner/decisions/h-36d872fbb0e5.md` (D-ADR0079, D-ADR0082).

## Footprint
- `docs/platform/portfolio/**`, `docs/platform/work-state/spec.md`, `docs/platform/supervision/spec.md`, `docs/platform/workflow/spec.md`
- `docs/platform/runner/decisions/**`, `docs/decisions/index.md`, `docs/reading-map.md`, `CHANGELOG.md`

## Steps
1. Write `docs/platform/portfolio/spec.md`: scope, item levels, fields, fact kinds and recorders, door checks, ports, board definition, Shared Entities, and a "Lịch sử quyết định" section.
2. Update the work-state spec (status board is a view; human gates belong to questions), the supervision spec (portfolio status left; reads and records through ports) and the workflow spec (caller reference, milestone stage tags).
3. Mint one D-ADR with `fgos identity mint d-adr` and record it in the holder named by the governance table; regenerate `docs/decisions/index.md` with `fgos decision-index`.
4. Add the spec to `docs/reading-map.md`.
5. Add one line under `## [Unreleased]` in `CHANGELOG.md` (new `fgos portfolio` verbs, `plans/initiatives/`).

## Verify
The doc checks in `npm test` pass (`node --test test/scripts/doc-health.test.mjs`).

## Rollback
`git revert` the phase commit.
