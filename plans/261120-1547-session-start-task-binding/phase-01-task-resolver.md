# Phase 1: Task resolver for head names

## Inputs
- `docs/backlog.md` row `p-l22vozecxg`
- `src/session-host/head-plan.mjs`
- `test/session-host/head-plan.test.mjs`

## Footprint
- `src/session-host/head-plan.mjs`
- `test/session-host/head-plan.test.mjs`

## Steps
1. In `src/session-host/head-plan.mjs`, update `planOfHead` or introduce `taskOfHead({ projectRoot, persona, name, ports })`:
   - Support `lead`: resolve to plan directory under `plans/` using existing trunk reader logic. Return `{ kind: 'plan', dir, path: \`plans/\${dir}/plan.md\`, footprint }`.
   - Support `planner` and `shaper`: resolve to discussion directory under `docs/discussions/` (and fallback `plans/discussions/` if present). Match name by stripping handle prefix if present, then finding the unique matching directory containing `DISCUSSION.md`. Return `{ kind: 'discussion', dir, path: \`docs/discussions/\${dir}/DISCUSSION.md\` }`.
   - On zero matches for task-bound personas (`lead`, `planner`, `shaper`), throw `HeadPlanError('task-not-found', ...)` naming the persona and name.
   - On multiple matches, throw `HeadPlanError('task-ambiguous', ...)`.
   - For non-task personas (`secretary`, `supervisor`), return `null`.
2. Update `test/session-host/head-plan.test.mjs`:
   - Test `planner` resolving to a discussion directory under `docs/discussions/`.
   - Test `shaper` resolving to a discussion directory under `docs/discussions/`.
   - Test unbound name throwing `task-not-found`.
   - Test ambiguous name throwing `task-ambiguous`.

## Verify
```bash
node --test test/session-host/head-plan.test.mjs
```
Pass condition: all tests pass, including resolution of discussions and plans and rejection of unbound names.

## Rollback
`git checkout HEAD -- src/session-host/head-plan.mjs test/session-host/head-plan.test.mjs`
