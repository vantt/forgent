# Phase 03 — Retire `--plan` and the dead `feature.yaml` runner fields (F9)

## Context

- Spec RUL-WF-22 (plan is input; `--plan` machine translation retired), N16 (`feature.yaml` keeps its lifecycle part until coding cutover, drops only dead runner fields), §8 row `--plan`, §9 rows `plan-source.mjs` and `feature.yaml`, §10.2 "Reader phải đi theo khi bỏ trường runner", battery 15 (first half).
- L10: delete the old path and move every consumer in the same change.
- Code (phase 00 facts 9, 10): `src/workflow/plan-source.mjs` (134), `src/workflow/runner.mjs:25` import, `resolveStart` `:966-990` (`params.planPath`), `startWorkflow` JSDoc `:1126`; `bin/fgos.mjs` workflow start source check (~`:2291`, "exactly one of <workflowId>, --plan <path> or --units <file>"); `src/cli/command-registry.mjs:2195`, `:2225`; `core/skills/fgos-run/SKILL.md:43-55` (Mode B); `domains/coding/workflows/feature.yaml:10,27,37,55,61,68,92,107,138,144-149`; `domains/coding/compiled.json`.

## Requirements

- `fgos workflow start --plan` removed: flag rejected as unknown by the CLI's unknown-flag handling; usage text and examples lose it; `plan-source.mjs` and its tests deleted; `manifest` entry `src/workflow/plan-source.mjs` removed.
- `fgos-run` skill Mode B rewritten: read the ak plan as an artifact; run each phase's units as `fgos run` / `fgos workflow start --units <file>` (bounded wave the agent chose); no machine translation. Note in the skill that `fgos-cook` (COOK P5) will own plan execution on a conductor case.
- `feature.yaml`: drop `units`, `dependsOn`, `gate` on the four kept steps, delete runner-only steps `integrate` and `approval`, and the header comment at `:10` saying the runner schedules units. Keep `phase`, `skill`, `operations`, `transitions`, `aliases`, `statusSkills` byte-identical.
- Rebuild `domains/coding/compiled.json` (`npm run build:domains`); diff it: only removed runner keys and the two runner-only steps.
- Readers move: `test/workflow/advisory-m-contracts.test.mjs:174` takes the validate-plan and implement-item unit templates from a test fixture (`test/fixtures/workflow/coding-advisory-unit-templates.json`, copied once from today's YAML), not from `feature.yaml`.
- Kernel isolation test `test/state/domain-registry-compiled.test.mjs:26-41` still prints `discovery,exploring,planning,executing`; doctor compiled-domain check and `src/setup/registrations.mjs:1054-1100` (step operations) stay green.
- CHANGELOG `[Unreleased]`: `--plan` removed, use `fgos run`/`--units`.

## Files

- Delete `src/workflow/plan-source.mjs`; its tests (phase 00 lists them, inside `test/workflow/workflow-runner.test.mjs` and any dedicated file).
- Modify `src/workflow/runner.mjs` (import + `resolveStart` + JSDoc), `src/workflow/index.mjs` (exports, if any), `bin/fgos.mjs` (workflow start), `src/cli/command-registry.mjs`, `core/skills/fgos-run/SKILL.md` (+ `npm run build:skills` renders `.agents/skills/…`, `plugins/fgOS/skills/…`; never hand-edit them), `domains/coding/workflows/feature.yaml`, `domains/coding/compiled.json` (generated), `docs/architecture-manifest.json`, `test/workflow/advisory-m-contracts.test.mjs`, new fixture, `CHANGELOG.md`.
- `docs/specs/runner.md` lines teaching `--plan` (phase 00 greps) — move to past tense with a pointer to D-ADR0070.

## Steps

1. `rg -n -- '--plan|planPath|translatePlanToWorkflow|plan-source' src bin core domains docs/specs test` — list every hit; each is moved or deleted in this phase.
2. Delete/move as above; build skills and domains; diff generated output before staging.
3. Run kernel isolation, domain-registry, advisory, registrations, workflow-runner tests.

## Tests

- 15 (first half): `feature.yaml` compiles; `domainSteps` returns four steps; kernel isolation passes; advisory test runs the two templates from the fixture.
- `fgos workflow start --plan x` → unknown-flag refusal (CLI test in `test/cli/fgos-workflow.test.mjs`).
- Guard (phase 01) unchanged.

## Risks / rollback

- Risk (L×M): an operator script still calls `--plan`. Mitigation: CHANGELOG line + skill rewrite; refusal is explicit.
- Risk: `compiled.json` drift from hand edits — always regenerate.
- Rollback: revert the single commit (plan-source comes back with its tests).

## Done when

No `--plan`/`plan-source` reference left outside history docs; tests above + full `npm test` green.
