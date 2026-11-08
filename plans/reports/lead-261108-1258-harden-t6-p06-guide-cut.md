# HARDEN T6 guide cut: lead report

Branch `harden/t6-p06-guide-cut` (from origin/main `65894c4f9`), two commits: red test, then the cut.

## What changed

- `validateWorkflow`: 384 lines to 30. Composed of `normalizeStep`, `normalizeUnit`, `normalizeTemplate` (with `checkTemplateFields`, `checkTemplateShapes`, `normalizeWriteScope`, `normalizeStanceOptions`, `normalizeAcceptOutcomes`), `normalizeGate`, `checkStepRefs`. Longest helper 33 lines. `definition.mjs` 502 to 366 lines.
- `rejectInfraFields(object, subject, { allow, suffix })` replaces the five infrastructure-field loops; every message text is unchanged (one test pins the six places).
- Work step-machine residue grouped at the end of `definition.mjs` under one comment: `normalizeWorkStepFields` (phase, skill, operations), `normalizeOperation`, `normalizeTransitions`, `normalizeAliases`, `normalizeStatusSkills`. Isolated, not deleted.
- Vocabulary once in `guide-schema.mjs`: `RIGOR_ORDER`, `GATE_MODES`, `GUIDE_KINDS` exported. `VALID_RIGORS`, `RIGORS`, the second gate-mode check and `case-projection.mjs`'s `RIGOR_ORDER` are gone. Importers moved in this change: `propose.mjs`, `propose-classify.mjs`, `propose-frame.mjs`, `propose-validate.mjs`, `case-admission.mjs`, `case-start.mjs` (not listed in the phase file; it imported the old export), `test/workflow/propose-classify.test.mjs`.
- Dependency cycle: `dependencyOrder(nodes)` in `steps.mjs` (kernel) holds the topological loop; `checkStepRefs` refuses a step cycle by name at load (`Workflow "x" steps "a", "b" wait on each other`); `orderSlices` in `propose.mjs` is now a call to it (same `slice-cycle` refusal text).
- Loader: new exports `workflowDirs(root)` (core, then domains by name) and `parseWorkflowText`; `scanWorkflows` is one loop over `workflowDirs`; the doctor's definition reader (`workflow-definition-files.mjs`) uses both instead of walking tiers and parsing again. Row conditions unchanged (read and parse failures still named separately).
- `entryStep` deleted (no caller).
- CHANGELOG line for the cycle refusal; census regenerated.

## Red to green

Before: `validateWorkflow({id:'loop',steps:[{id:'a',dependsOn:['b']},{id:'b',dependsOn:['a']}]})` printed `ACCEPTED 2` on origin/main. First commit holds `test/workflow/definition.test.mjs` (fails on the missing `dependencyOrder` export and the accepted cycle). After the cut: 5 tests green.

## Tests

New owner for the cycle, `dependencyOrder`, the infrastructure-field message per place and the rigor/gate-mode refusals: `test/workflow/definition.test.mjs` (5 tests, 0 spawns). No test retired. Focused set from the phase file plus every test that names a changed symbol (423 tests across `test/workflow/*`, loader, checked, steps, domain-registry users): all pass except `test/rust-host/release-tree.test.mjs` (4 tests) which needs `cargo build --release --workspace` in this worktree's private target (environmental, covered by the full suite below). Architecture, doc-health, citation-drift: 128 of 128. One-door scan: 0 undeclared.

## Size

| | phase estimate | measured |
|---|---|---|
| Node (src) | -55 | net -146 (definition -136, doctor reader -9, propose -9, loader -4, steps +13, guide-schema +1) |
| tests | +10 | +48 lines, 5 tests |

Guide files total (`guide-schema`, `definition`, `steps`, `loader`, `checked`, `ref-digests`): 1 326 to 1 215 lines on `wc -l`, budget 1 290. No file over 500, no helper over 110.

## Deviations and items for others

- `src/runner/rigor.mjs` still holds a fourth copy of the rigor list (`RIGOR_VALUES`, runner T5 layer, canonical leaf with rank and compare helpers). The kernel cannot import it (guide-schema imports nothing; the compiled-registry test copies a fixed file list), so the Workflow side reads `guide-schema.mjs`. Folding the two is a layering call for the HARDEN lead, not done here.
- `test/suite-baseline.json` not touched (TEST's file).
- lead:ES could not be messaged: `SendMessage` to `claude-uygd` was unreachable. The normalizer names are in this report and the board line.
- Impact analysis: GitNexus not present on this machine; callers found by `rg`.

## Full suite

See the result line appended below.
