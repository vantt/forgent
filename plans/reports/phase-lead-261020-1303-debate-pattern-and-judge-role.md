# Phase lead report: pattern debate and role judge

## Result

Units 1-4 of `plans/261020-1250-debate-pattern-and-judge-role/plan.md` are implemented on this branch.

## What changed

- `src/runner/execution/patterns/debate.mjs` (new): `runDebate`, `resolveDebateRoles`, `debateSeatLaunches`, `debateHistoryOutcome`. Round 1: `thesis` and `antithesis` in parallel, blind, read-only, `preferIndependentOf` each other (soft). Round 2 (`params.rebuttal: false` skips it): each side gets only the other side's round-1 result in `inputs`. Then `judge`, read-only, `independentOf: [thesis, antithesis]` (hard), with every result as `inputs`. Resume reuses passed seats by (role, round) through the `history` hook, like `panel`.
- Reuse, nothing new in plumbing: `hooks.runRole`, `preferIndependentOf`, `independentOf`, the role ledger, `roleUnit`/`roleTasks` overrides. No new run.mjs or bind() path.
- Role classification in one place: `CHECKER_ROLES` in `src/runner/execution/bind.mjs` now lists `thesis`, `antithesis`, `judge` (out-of-process, not asked for the unit's skills). No new name-prefix guessing.
- Judge refusal: an unseatable judge is bind()'s named `independence` refusal (`policy-refusal` outcome), never a same-family judge. Verified end to end with a two-family pool.
- Registered in `patterns/index.mjs`, `case-admission-port.mjs` (seat launches: 5, or 3 without rebuttal), `unit-summary.mjs` (sides `producer`, judge `judge`, outcome from the judge), `workflow-pool-independence.mjs` (doctor `workflow-pools-satisfy-independence` evaluates debate), `capability-plan-lint.mjs` (known pattern), `command-registry.mjs` (help text). Pattern names are not validated anywhere else (definition.mjs and the guide schema take free strings), so nothing else needed to change. `blind-steps-proven-pools` drives the same pattern code through the dry-bind, so it covers debate without a change.
- Default seat tasks in `role-tasks.mjs`: `thesis`, `antithesis`, `thesis-rebuttal`, `antithesis-rebuttal`, `judge`; each overridable through `params.roleTasks`.
- `core/workflows/group-cognition.yaml`: step `dialectical-inquiry`, unit `dialectical-critique` (id kept) now `pattern: debate`; `action-synthesis` objective builds on the judge's ruling. The synthesis unit already receives every role of the earlier step, judge included.
- Specs: `docs/specs/workflow.md` (pattern paragraph + admission ceiling), `docs/specs/runner.md` (pattern list, skills note, independence bullet). `CHANGELOG.md` Unreleased line.

## Tests

- New: `test/runner/execution/patterns/debate.test.mjs` (12), `test/workflow/group-cognition-debate.test.mjs` (2, real workflow run with a fake worker: three-plus families, judge differs from both sides, rebuttal reads only the other side, synthesis receives the judge report; two-family pool refused by name with no synthesis).
- Extended: bind, run-case-admission, unit-summary, workflow-pool-independence-check.
- Changed for the new structure: group-cognition removed from the reviewed-findings loop in `advisory-m-contracts`; `discussion-workflows` asserts `debate`; the critique-checker text test keeps business-discussion only; `playbook-observable-order.json` regenerated for group-cognition only (the run showed no other playbook changed).

## Not done / notes

- Live proof with three real families is for the big lead (plan).
- Reversal trigger unchanged: add a ruling schema to the judge claim only if real runs show judges restating one side.
- `core/skills` text was not edited, so no `build:skills` render was needed.
