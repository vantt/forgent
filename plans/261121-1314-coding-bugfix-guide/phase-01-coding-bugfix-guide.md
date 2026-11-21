# Phase 1: Coding bugfix workflow guide and tests

## Inputs
- `docs/discussions/workflow-engine/DISCUSSION.md` section 7 anchor `#task-bugfix-guide`, decisions D1-D4.
- `domains/coding/workflows/feature.yaml` (guide part lines 127-176).
- `test/state/workflow-multiplicity.test.mjs`.

## Files it may write
- `domains/coding/workflows/bugfix.yaml`
- `domains/coding/compiled.json`
- `test/state/workflow-multiplicity.test.mjs`

## Steps
1. Create `domains/coding/workflows/bugfix.yaml` copying the guide structure from `domains/coding/workflows/feature.yaml:127-176` with the changes settled in D3/D4:
   - `kind: guide`
   - `purpose`: "Take one coding item from one bug to an approved, integrated fix, cause shown before the edit, with proof at each step that matters."
   - Milestones: same seven (`request-received`, `decisions-locked`, `plan-validated`, `child-verified`, `integrated`, `approved`, `merged`).
   - Activities: same eleven activities including `implement-item`, `validate-plan`, and `judge-ambiguity`.
   - Decisions:
     - `request-received`: `should: judge-ambiguity`, `mayInstead: [lock-decisions]`.
     - `decisions-locked`: `should: validate-plan`, `reason: a validated plan is the frame the children run under`, `mayInstead: [scout-blast-radius, shape-plan]`.
     - `plan-validated`: `should: implement-item for each child with disjoint writes`, `reason: the cause is shown first and the reviewed pattern catches regressions before integration`, `mayInstead: [fix-verify-red, scoped-subtask, review-item]`.
     - `approved`: `listedRoutesOnly: true`.
   - Must guards: five guards unchanged (`no-writes-outside-unit`, `child-receipt`, `integration-receipt`, `consent-before-merge`, `merge-at-approve-door`).
   - Closure: `[approved]`.
2. Recompile domain registry by running `npm run build:domains`.
3. Verify compilation with `npm run build:domains -- --check`.
4. Update `test/state/workflow-multiplicity.test.mjs`:
   - Update the test asserting coding workflows: verify `Object.keys(coding.workflows).sort()` contains both `'bugfix'` and `'feature'`.
   - Verify that `coding.defaultWorkflow` remains `'feature'` and `coding.workflowFor` remains `{}`.
   - Verify that `resolveWorkflow(coding, 'bug')` still resolves to `coding.workflows.feature`.
5. Run tests:
   - `node --test test/state/workflow-multiplicity.test.mjs`
   - `node --test test/state/domain-registry-compiled.test.mjs`
6. Verify propose with `--guide coding/bugfix`:
   - Run `fgos workflow propose --guide coding/bugfix` on a one-slice fixture to ensure no `guide-activity-missing` refusal is returned.

## Verify
`node --test test/state/workflow-multiplicity.test.mjs` && `npm run build:domains -- --check`

## Rollback
Revert the commit; removes `bugfix.yaml` and restores `compiled.json` and `test/state/workflow-multiplicity.test.mjs`.
