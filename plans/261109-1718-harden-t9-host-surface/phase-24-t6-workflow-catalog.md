---
phase: 24
title: "T6 fix: one workflowCatalog({projectRoot}), project first then payload, source per id; setup and doctor read it; workflowRoots and the setup reader deleted"
status: pending
depends_on: ["owner decision 83 (AU-21 a)", "21 landed (registrations.mjs chain)"]
parallel: "T6 slot, beside P08 and P09 (file-disjoint); must land before P10 and P25 (registrations.mjs, loader.mjs)"
effort: ~0.75d
net_size: "Node about -60; Rust 0; tests: owning test in test/workflow/loader*, doctor keeps one wiring proof, about -20 (estimate)"
---

# Phase 24 - T6 fix: workflow catalog (authority audit AU-21 High; owner decision 83)

**Authority moved:** "which workflow definition an id names" is answered once, by the Workflow loader (T6). Setup and doctor read the loader's catalog; their own reader with the opposite precedence goes.

## Context

- Runtime: `src/workflow/loader.mjs:121-136` (`loadWorkflowWithSource`) uses the project's definitions first and falls back to the running payload's (`f16e2e983`).
- Setup: `src/setup/workflow-definition-files.mjs:60-79` (`workflowRoots`, `loadWorkflowDefinitions`) puts the package root first and the project second, "first definition of an id wins", so the payload wins. Doctor rows pass different "package" roots: `src/setup/registrations.mjs:582` (main checkout root), `:1875` and `src/setup/seat-binding-checks.mjs:99` (payload), `src/setup/blind-steps-proven-pools.mjs:101` likewise.
- Effect: when a project defines an id the payload also ships, `fgos workflow start <id>` runs the project's definition, but dry-bind, pool-coverage, blind-step and capability rows check the payload's. Doctor can pass on a definition that never runs.
- Owner 83 (AU-21 a): a project may override shipped ids and add new ones; project first, payload second, source recorded per id; setup and doctor read the catalog; `workflowRoots` and the setup reader are deleted. Domain doctrine stays payload-only (decision 79 Q4; P25).

## Requirements

1. `workflowCatalog({ projectRoot })` in `src/workflow/loader.mjs` returns `{ id -> { workflow, source: { root: 'project' | 'payload', path } } }`, project first; the payload root comes from the running release (the same resolution `loadWorkflowWithSource` uses today). `loadWorkflowWithSource` becomes a lookup in the catalog (one precedence, one walk).
2. Every setup and doctor reader moves to the catalog in this change (L10): `registrations.mjs` (`:582`, `:1875`), `seat-binding-checks.mjs`, `blind-steps-proven-pools.mjs`, and any other caller of `workflowRoots`/`loadWorkflowDefinitions` found by `rg`. A doctor message that names a definition names its source.
3. `src/setup/workflow-definition-files.mjs` is deleted (or reduced to nothing the catalog does not cover; step 1 checks for non-loader helpers in it).
4. Doctor row ids and count unchanged; every warn/fail condition kept.

## Files

**Modify:** `src/workflow/loader.mjs`, `src/setup/registrations.mjs` (two call sites; board chain), `src/setup/seat-binding-checks.mjs`, `src/setup/blind-steps-proven-pools.mjs`, `test/workflow/loader*.test.mjs` (owner), the doctor rows' tests (one wiring case each), `docs/architecture-manifest.json` (row of the deleted file), `CHANGELOG.md` (one line: doctor checks the workflow definition that actually runs; a project's own definition wins over the shipped one).

**Delete:** `src/setup/workflow-definition-files.mjs` and its test cases that only asserted the payload-first order (behaviour removed by owner 83; the new order is owned by `test/workflow/loader*`).

## Steps

1. `rg -n "workflowRoots|loadWorkflowDefinitions|loadWorkflowWithSource|workflow-definition-files" src scripts test`; list every caller with `file:line`.
2. Red: a project that overrides a shipped id and adds a new one; the catalog returns the project's for the first with `source.root: 'project'`, the payload's for the rest; the dry-bind row checks the project's definition (fails today).
3. Catalog; callers; deletion.

## Validation (focused)

FR `test/workflow/loader*`, `test/setup/*seat-binding*`, `*blind-steps*`, the doctor rows' wiring cases; `fgos doctor` on a built host in a project with an override. Land gate.

## Risks and rollback

| Risk | L x I | Mitigation |
|---|---|---|
| A project carries a stale copy of a shipped id that doctor silently passed before | M x M | the doctor row now names the source; guide line for the owner machines |

Rollback: revert the merge commit.
