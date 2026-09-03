# Phase 02 — Assignment Provenance And Stamped Snapshot (ADR-006)

Context: `buildAssignment()` (`src/runner/dispatch/assignment.mjs:122-266`)
only builds from `domain+workflow+stage+operation`; mutation and evidence
requirements are implicit (`assignment.mjs:348-371`,
`operation-choice.mjs:1600-1990`). This phase adds the inline class and makes
interpretation field-driven while keeping declared behavior byte-for-byte.

## Requirements

- R1 Provenance. Every Assignment gains
  `provenance: { kind: 'declared'|'inline', contractPolicyVersion, normalizerVersion, validators: [...] }`.
  Declared: `{ domain, workflow, stage, operation, taskSpec }` under
  `provenance.declared`. Inline: `{ contract, caller: { writerId, parentAssignmentId? } }`
  under `provenance.inline`. `writerId` from `src/util/session-identity.mjs`.
  P02.1 validates `writerId`'s FORMAT only (charset/length floor in
  `execution-contract.mjs`), not real identity; wiring an actual
  `resolveWriterIdentity()` call at a live caller is R8's job.
- R2 Normalizer. New pure module `src/runner/dispatch/assignment-normalizer.mjs`
  stamps `mutation` and `evidence.required`:
  - declared: from `READ_ONLY_ROLES`/`KNOWN_MUTATING_OPS` (moved here) and a
    per-operation requirement table lifted from the existing branches
    (`validate-plan`, `review-item`, `scout-blast-radius` -> `reported`;
    `scoped-subtask`, `implement-item`, `fix-verify-red` -> `verified`;
    default per role). Also `resultKind` (`gate-verdict` for validate-plan,
    `review-verdict` for review-item, `advisory` for scout/consult,
    `work-product` for mutating ops) and `onAdvance`
    (`derive-plan-verdict-from-plan-md` for validate-plan).
  - inline: from the contract; missing `mutation` or `evidence.required` ->
    `RunnerConfigError`.
- R3 Inline validator. New pure module `src/runner/dispatch/execution-contract.mjs`
  validating the ADR-006 minimum fields; rejects unknown fields; rejects
  `mutation: 'mutating'` (first slice); rejects any `coordinationId`/session
  field; budget = `timeoutMs`, `maxRuns` only (tokens recorded, not enforced).
- R4 `buildAssignment()` accepts either `{ stage, operation, ... }` (unchanged)
  or `{ provenance: { kind: 'inline', contract, caller } }`; both produce the
  same frozen shape. `createAssignmentId` uses `caller.writerId` token when no
  `workId`.
- R5 Interpretation. `interpretAssignmentRunResult` and
  `findLatestAssignmentRunResult` (`operation-choice.mjs`) read
  `assignment.evidence.required`, `assignment.mutation`, `assignment.resultKind`
  instead of `operation === ...`. `executeDriverOperationChoice` replaces the
  `validate-plan` branch with `onAdvance` dispatch to Phase 01's derive
  function. Result-ladder confidence checks reference the stamped requirement.
- R6 (G3) `hasDirtyBeforeMutation` hardcoded `false` in
  `findLatestAssignmentRunResult` (`operation-choice.mjs:361`): persist the
  dirty-before set in `evidence.json` at run time and re-derive from it.
- R7 Remove heuristic. Delete `assignment.missionId || assignment.workId === null`
  read-only clauses (`assignment.mjs:367`, `assignment-runner.mjs:480`); the
  single pre-execute check is `assignment.mutation === 'read-only'` where
  read-only is required. Keep `READ_ONLY_ROLES`/`KNOWN_MUTATING_OPS` as the
  declared mapping only.
- R8 Mission-lite migration (retain the module).
  `createMissionAssignment` builds an inline contract (role from the mission
  role, `mutation: 'read-only'`, `evidence.required: 'reported'`, objective
  and context refs from the mission) — no `stage`, no `operation`.
  Stop copying `assignment.json`/result JSON into `.fgos/missions/<id>/`;
  store assignment and run ids as references. `thread.jsonl`/`mission.json`
  unchanged (they become the ledger prototype later).

## Files

Modify: `src/runner/dispatch/assignment.mjs`, `assignment-runner.mjs`,
`operation-choice.mjs`, `result-ladder.mjs`, `mission-lite.mjs`,
`src/runner/dispatch.mjs` (exports).
Create: `src/runner/dispatch/assignment-normalizer.mjs`,
`src/runner/dispatch/execution-contract.mjs`, tests for both.
Do not modify: `src/state/workflow-stage-graphs.mjs`, `domains/coding/workflows/feature.yaml`,
any TaskSpec.

## Tests

- Golden: run the Step 02–06 batteries (`test/runner/`, `test/state/`) before
  and after; the only permitted diff in snapshots is the added
  `provenance`/`mutation`/`evidence`/`resultKind` fields.
- Contract negative tests: missing mutation; mutating; unknown field;
  coordinationId present; missing evidence.required; missing caller.
- Declared negative: undeclared operation still rejected with the same error;
  declared op with `workId: null` and a mutating op is rejected by the stamp
  (guards R7).
- G3: dirty-before re-derivation matches the persisted set across a cross-pass.
- Mission-lite: port the four one-shot tests
  (`test/runner/mission-lite.test.mjs:21,51,144,176`) onto the inline path;
  assert no `stage`/`operation` on the Assignment. Mark the two debate/synthesis
  tests (`:261,:370`) as the multi-step slice's pending spec (skip with reason,
  do not delete).
- Run: full `npm test`; failures limited to the pre-existing G2/G4/G7 set.

## Risks / Rollback

- Largest-blast-radius phase (`operation-choice.mjs` is 79K). Land R1–R4
  first in one commit with the declared path only, prove goldens, then R5–R8.
- Any executor mismatch between stamped `mutation` and the old heuristic will
  show up as a Step 06 golden failure — treat as a mapping bug, not as a
  reason to keep the heuristic.
- Rollback: revert; no persisted-format migration needed (new fields are additive).
