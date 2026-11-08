---
phase: 06
title: "Guide cut: validateWorkflow becomes a composition of named normalizers, the vocabulary is defined once in the lowest file, a dependsOn cycle is refused, the doctor reads definitions through the loader, and the Work step-machine residue sits in named normalizers for T7"
status: pending
depends_on: [03]
parallel: "wave 2, with 04, 05, 07, 08, 09"
effort: ~1.5d
net_size: "Node −55 / Rust 0 / tests +10 (estimate)"
---

# Phase 06 — Guide cut (simplicity 2, R-8, simplicity 15, vocabulary, Work-machine isolation)

## Context

Arbitration §1 Guide ("`validateWorkflow` ≤ 80 lines as a composition of `normalizeStep`, `normalizeUnit`, `normalizeGate`, `checkStepRefs` and the three Work-machine normalizers; no helper over 110; no file over 500"; "the vocabulary is defined once in `guide-schema.mjs` … imported by `definition.mjs`, `case-projection.mjs`, `case-admission.mjs`, `propose*.mjs`"; "a `dependsOn` cycle is refused at validation, by the loop `orderSlices` already has, moved down into the kernel"; "the doctor's second tier walk … reuses `workflowDirs`/`parseWorkflowFile` from `loader.mjs`"). §3: Work residue is T7's, isolated not deleted.

Code read on `595faa273` (`definition.mjs` after P02's deletion; the lead re-reads):
- `validateWorkflow` `definition.mjs:131-514` (384 lines); G2 infrastructure-field loop five times (`:138-144`, `:170-176`, `:269-273`, `:276-281`, `normalizeOperation` `:81-85,98-102`); `VALID_RIGORS` `:29`; units inner loop `:258-393`; refs `:412-450` (existence and self-reference only, R-8); `transitions`/`aliases`/`statusSkills` `:452-494`.
- Vocabulary: `RIGOR_ORDER` `case-projection.mjs:21` (infra) imported by `propose-classify.mjs:19`, `propose-frame.mjs:10`, `propose.mjs:20`, `propose-validate.mjs:18`, `case-admission.mjs:10`; copies `RIGORS` `guide-schema.mjs:48`, `VALID_RIGORS` `definition.mjs:29`; gate modes `guide-schema.mjs:47` and a second set in `definition.mjs` (`:222` at baseline).
- R-8 reproduced: `validateWorkflow({ steps: [{id:'a',dependsOn:['b']},{id:'b',dependsOn:['a']}] })` is accepted and the run stays `running`. `orderSlices` `propose.mjs:125-140` holds the topological loop.
- Loader: `parseFile` `loader.mjs:13`, `workflowFilesIn` `:28`, `scanWorkflows` `:50`; doctor reader `src/setup/workflow-definition-files.mjs:14-55` walks the same tiers again.
- Dead: `entryStep` `steps.mjs:45` (no user). Kernel isolation test: `test/state/domain-registry-compiled.test.mjs` (six-file list); importers outside: `src/state/domain-registry.mjs`, `src/state/replay.mjs`, `src/runner/work-compat.mjs`.

## Requirements

1. `rejectInfraFields(object, label, { allow })` replaces the five G2 loops (messages unchanged).
2. `validateWorkflow` ≤ 80 lines composing `normalizeStep`, `normalizeUnit`, `normalizeGate`, `checkStepRefs` and three Work-machine normalizers (`normalizeTransitions`, `normalizeAliases`, `normalizeStatusSkills`, names final at the lead's choice) grouped at the end of the file under one comment that they serve the Work step machine until T7's cutover; no helper over 110; `definition.mjs` ≤ 500.
3. Vocabulary (rigor order, gate modes, step and guide kinds) defined once in `guide-schema.mjs`; `case-projection.mjs` stops exporting `RIGOR_ORDER`; every importer switches in this commit (one-liners); `VALID_RIGORS`, `RIGORS` and the second gate-mode set go.
4. R-8: the topological loop moves into the kernel (beside `checkStepRefs`) and refuses a cycle by name; `propose.mjs` `orderSlices` calls it (its body goes; one-liner touch, P07 rebases).
5. Simplicity 15: `loader.mjs` exports the tier walk and file parse it already has (`workflowFilesIn`, `parseFile` under exported names); `workflow-definition-files.mjs` uses them and drops its own walk; the `workflow-capabilities-configured` row's conditions unchanged.
6. `entryStep` deleted. Kernel files import nothing above them (architecture test green).

## Files

**Create:** `test/workflow/definition.test.mjs` (R-8 case and the helper cases this phase adds; `definition.mjs` has no test file today; P13 moves nine more cases in).

**Modify:** `src/workflow/definition.mjs`, `guide-schema.mjs`, `steps.mjs`, `loader.mjs`, `checked.mjs` (only if it imports a moved name), `src/setup/workflow-definition-files.mjs`, `case-projection.mjs` (export removed, import added), census, `docs/architecture-manifest.json` (test file rows if the manifest lists tests; else none).

**Cross-lane one-liners (this commit, other lanes rebase):** import line of `RIGOR_ORDER` in `propose-classify.mjs`, `propose-frame.mjs`, `propose.mjs`, `propose-validate.mjs` (P07) and `case-admission.mjs` (P08); `orderSlices` body in `propose.mjs:125-140` replaced by a kernel call (P07).

**Delete:** five G2 loops, `VALID_RIGORS`, `RIGORS`, second gate-mode set, `entryStep`, the doctor's tier walk.

**Tests to retire:** none; message texts are unchanged, so existing definition and guide cases stay green.

## Net size

Node: G2 −22, vocabulary −10, cut 0 (moves), doctor walk −28 (setup side), R-8 +3 net, `entryStep` −3 → about −55 (setup −28 counts toward the Doctor-side budget). Tests: +10.

## Steps

1. Red: R-8 cycle accepted (definition.test.mjs).
2. `rejectInfraFields`; vocabulary with the one-liners; architecture test.
3. Normalizer cut; function-length scan.
4. R-8 kernel loop; `orderSlices` call.
5. Loader exports; doctor reader.
6. Message lead:ES the Work-machine normalizer names (cross-lane table).

## Validation (focused)

- FR `test/workflow/definition.test.mjs test/workflow/guide-schema.test.mjs test/workflow/workflow-loader-persona-scope.test.mjs test/workflow/core-workflow-seats.test.mjs test/workflow/propose.test.mjs test/workflow/propose-classify.test.mjs test/workflow/case-admission.test.mjs test/state/domain-registry-compiled.test.mjs test/state/workflow-multiplicity.test.mjs test/architecture.test.mjs test/setup/seat-binding-dry-bind.test.mjs test/setup/checks-doctor-config.test.mjs test/setup/yaml-parse-failures.test.mjs` (the `workflow-capabilities-configured` row's cases).
- `rg -n "VALID_RIGORS|RIGORS\b|entryStep" src` → nothing.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A definition error message changes and a consumer greps it | L × L | Messages unchanged (requirement 1) |
| Kernel imports the cycle loop from an infra file | L × M | The loop lives in the kernel; `propose.mjs` imports down |
| Touching P07/P08 files mid-wave | M × L | One-liners only, named above; land order free |

## Rollback

Revert; no on-disk change.

## Done when

Budgets met (`validateWorkflow` ≤ 80, `definition.mjs` ≤ 500); R-8 refused; doctor row unchanged; lead:ES messaged; landed with smoke `fgos workflow start council-lite` in a scratch project and `fgos doctor` row `workflow-capabilities-configured` pass; guide section written.

## Lead brief essentials

Refactor only besides R-8; keep every message; Work residue isolated, never deleted. All plan.md lead rules apply.
