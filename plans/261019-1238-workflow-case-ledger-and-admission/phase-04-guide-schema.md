# Phase 04 — Guide schema (F5, guide half of F1)

## Context

- Spec RUL-WF-2..7 (milestones, numbered-list trap, MUST/SHOULD/MAY instead, unlisted + `listedRoutesOnly` on decision points only (N9), no guard → no MUST + unenforced list, closed catalog of six primitives (N10)), RUL-WF-9 (case pins the guide snapshot), RUL-WF-13 (subject = declared artifact set, N2), RUL-WF-25 (no rule DSL), RUL-WF-26 (minimum guide content), §2.2 vocabulary, §5.3 (schema at kernel; every new kernel import joins the six-file isolation list), §9 row "schema guide", §10 sketches (illustrative, layout not locked).
- Code: `src/workflow/definition.mjs` (499, kernel; `validateWorkflow` `:130`, step kinds `:29`), `src/workflow/steps.mjs` (86, kernel), `src/workflow/loader.mjs` (141, infra); playbooks `core/workflows/*.yaml` (7); `domains/coding/workflows/feature.yaml`; `domains/marketing/workflows/content-publish.yaml`; kernel isolation `test/state/domain-registry-compiled.test.mjs:30`; setup readers `src/setup/registrations.mjs:1054-1100`, `src/setup/workflow-pool-independence.mjs`, `src/setup/blind-steps-proven-pools.mjs`.

## Requirements

- **One guide model** (kernel, pure): `{ id, kind: 'playbook'|'guide', purpose, roles, milestones[{id, subject, evidence, acceptedBy}], activities[{id, entry[], produces[], effects: 'none'|'writes', unit?, operation?}], decisions[{at, should, reason, mayInstead[], listedRoutesOnly}], must[{id, guard, subject?, reason}], unenforced[{id, becomes?, note}], frameDefaults{dispatches, mutatingDispatches, seatLaunchesPerDispatch?, fallbackPerSeat, deviationsBeforeAsk, rigorFloor}, closure[] }`. Field spelling is this plan's choice; spec locks behaviour only.
- `must[].guard` must be one of the six primitives (`milestone-reached`, `human-consent`, `verify-receipt`, `write-scope-isolation`, `independence-blind`, `frame-allowance`) or a named platform guard reference (G2, bind floor/persona lock, harness `writes`+commit, linked-worktree mutation gate, confinement, consent gate / `human-only` op, approve door, lifecycle transition) — referenced, not re-implemented. Anything else is a load error naming the line and suggesting `unenforced`.
- No expression fields anywhere (`when`, `if`, `expr` …) — rejected by name (RUL-WF-25).
- `listedRoutesOnly` accepted only on a decision point; on a milestone or route-table row it is a load error (N9).
- `frameDefaults` has `rigorFloor`, never `rigorCeiling` (N7) — the latter is a load error.
- **Playbook sugar:** a guide with `steps` (all 7 playbooks, content-publish) is normalised by the kernel into the model: each step → one activity per unit-set (`unit` template unchanged), `dependsOn` → entry milestones `<step>.settled`, produces `<step>.settled` (subject = that step's unit reports), each step gate → consent decision point; `kind` defaults to `playbook` for step-form files and every decision point is `listedRoutesOnly`. The YAML of the 7 playbooks only gains a short head: `must` (e.g. `independence-blind` where a step is blind, `human-consent` where a gate is consent) and `frameDefaults`. No step, unit, template, posture file or roleTask changes (spec §9, §10.1 "Không đổi").
- `content-publish.yaml`: head per §10.3 (milestones `brief-ready`, `draft-reviewed`, `copy-approved`, `publish-recorded`; SHOULD brief→draft with reason, MAY instead straight to draft; MUST `human-consent` bound to the copy digest before publish; MUST `write-scope-isolation` on publish; unenforced "published on the external channel"). Step form stays; observable order unchanged (guard).
- `feature.yaml`: add the guide part beside the lifecycle part per §10.2 (`kind: guide`, milestones, activities naming the operation each will replace, decisions, must, unenforced, frameDefaults with values "set at approval", closure). No reader uses it until coding cutover; the compiled registry and `domainSteps()` stay four steps (compiled.json must not change unless the build copies the new keys — if it does, diff and keep `domainSteps` output identical).
- Kernel isolation: if the model lives in a new kernel file (`src/workflow/guide-schema.mjs`), add it to the six-file list in `test/state/domain-registry-compiled.test.mjs:30` in this change; register it `kernel` in `docs/architecture-manifest.json`.

## Files

- Create `src/workflow/guide-schema.mjs` (kernel: model, catalog constant, normaliser, validation). Modify `src/workflow/definition.mjs` (call it from `validateWorkflow`), `src/workflow/loader.mjs` only if discovery needs `kind`.
- Modify the 7 `core/workflows/*.yaml` (head only), `domains/marketing/workflows/content-publish.yaml`, `domains/coding/workflows/feature.yaml`, regenerated `domains/coding/compiled.json` (only if changed), `docs/architecture-manifest.json`, `test/state/domain-registry-compiled.test.mjs`.
- Tests: `test/workflow/guide-schema.test.mjs` (new).

## Steps

1. Write the model + catalog + validation + step-form normaliser with tests first (pure).
2. Hook into `validateWorkflow`; every existing workflow file and the `--units` file form (`units-source.mjs`) must still load.
3. Add heads to the 9 YAML files; run setup readers' tests (registrations, pool independence, blind-steps) — they read `steps`, which are unchanged.
4. Rebuild domains/skills if any generated output is affected; diff before staging.

## Tests

- 15 (second half): `feature.yaml` with both parts compiles; `domainSteps` four steps; kernel isolation passes with the new file in the list.
- 10 (schema half): `createWorkflowRun` snapshot carries the normalised model (projection test arrives in 06).
- Load errors: unknown guard → suggests `unenforced`; expression field; `listedRoutesOnly` on milestone; `rigorCeiling`; activity entry naming an unknown milestone; MUST without guard.
- Normaliser: each playbook yields activities in today's step order; guard (phase 01) unchanged.

## Risks / rollback

- Risk (M×M): normaliser misreads a playbook with fan-in `dependsOn` (architecture-advisory). Mitigation: per-playbook normaliser snapshot test; guard catches order drift once the proposer uses it (06).
- Risk: kernel file count grows the isolation list — spec-mandated, keep it to one new file.
- Rollback: revert; YAML heads are ignored by nothing else yet.

## Done when

All workflow files load with the model; new schema tests, kernel isolation, setup readers, guard and full `npm test` green.
