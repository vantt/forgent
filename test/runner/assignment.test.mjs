import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createAssignmentId,
  buildAssignment,
  renderAssignmentPrompt,
  isReadOnlyAssignment,
  validateAgentResultClaim,
} from '../../src/runner/dispatch/assignment.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/config.mjs';

test('createAssignmentId produces deterministic asgn_<safe-work>_<safe-op>_<seq> ids', () => {
  const id1 = createAssignmentId({ workId: 'tsk-abc', stage: 'planning', operation: 'validate-plan' });
  assert.equal(id1, 'asgn_tsk_abc_validate_plan_001');

  const id2 = createAssignmentId({
    workId: 'tsk-abc',
    stage: 'planning',
    operation: 'validate-plan',
    existingIds: ['asgn_tsk_abc_validate_plan_001', 'asgn_tsk_abc_validate_plan_002'],
  });
  assert.equal(id2, 'asgn_tsk_abc_validate_plan_003');

  const idNoWork = createAssignmentId({ operation: 'resolve-question' });
  assert.equal(idNoWork, 'asgn_nowork_resolve_question_001');
});

test('createAssignmentId scans assignmentsDir on filesystem and avoids collision without overwriting', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-asgn-collision-test-'));
  const assignmentsDir = path.join(tempDir, '.fgos', 'assignments');
  fs.mkdirSync(path.join(assignmentsDir, 'asgn_tsk_col_validate_plan_001'), { recursive: true });
  fs.mkdirSync(path.join(assignmentsDir, 'asgn_tsk_col_validate_plan_003'), { recursive: true });

  const id = createAssignmentId({
    workId: 'tsk-col',
    stage: 'planning',
    operation: 'validate-plan',
    assignmentsDir,
  });

  // max is 003, next should be 004
  assert.equal(id, 'asgn_tsk_col_validate_plan_004');
});

test('buildAssignment creates frozen Assignment from planning.validate-plan with role, taskSpec, skills, and policy', () => {
  const work = { id: 'tsk-123', domain: 'coding', title: 'Test item' };
  const assignment = buildAssignment({
    work,
    stage: 'planning',
    operation: 'validate-plan',
    objective: 'Validate the plan against repo reality',
    contextRefs: ['docs/history/tsk-123/plan.md'],
    expectedOutputs: ['verdict', 'findings if blocked'],
  });

  assert.equal(assignment.assignmentId, 'asgn_tsk_123_validate_plan_001');
  assert.equal(assignment.workId, 'tsk-123');
  assert.equal(assignment.domain, 'coding');
  assert.equal(assignment.workflow, 'feature');
  assert.equal(assignment.stage, 'planning');
  assert.equal(assignment.operation, 'validate-plan');
  assert.equal(assignment.role, 'reviewer');
  assert.equal(assignment.reason, 'review');
  assert.equal(assignment.taskSpec, 'validate-plan');
  assert.equal(assignment.dispatch, 'assignment');
  assert.deepEqual(assignment.skills, ['fgos-coding-validating']);
  assert.deepEqual(assignment.policy, {
    minTier: 'standard',
    preferPersona: 'code-reviewer',
    preferExecutor: 'claude',
  });
  assert.deepEqual(assignment.contextRefs, ['docs/history/tsk-123/plan.md']);
  assert.deepEqual(assignment.expectedOutputs, ['verdict', 'findings if blocked']);

  // Immutability checks
  assert.ok(Object.isFrozen(assignment));
  assert.ok(Object.isFrozen(assignment.skills));
  assert.ok(Object.isFrozen(assignment.policy));
  assert.ok(Object.isFrozen(assignment.contextRefs));
  assert.ok(Object.isFrozen(assignment.expectedOutputs));

  // Does not mutate work
  assert.deepEqual(work, { id: 'tsk-123', domain: 'coding', title: 'Test item' });
});

test('buildAssignment creates frozen Assignment from executing.review-item with reviewer role', () => {
  const work = { id: 'tsk-exec-1', domain: 'coding', title: 'Execute item' };
  const assignment = buildAssignment({
    work,
    stage: 'executing',
    operation: 'review-item',
    objective: 'Review the item implementation',
    contextRefs: ['src/state/store.mjs'],
    expectedOutputs: ['review-verdict'],
  });

  assert.equal(assignment.assignmentId, 'asgn_tsk_exec_1_review_item_001');
  assert.equal(assignment.workId, 'tsk-exec-1');
  assert.equal(assignment.stage, 'executing');
  assert.equal(assignment.operation, 'review-item');
  assert.equal(assignment.role, 'reviewer');
  assert.equal(assignment.reason, 'review');
  assert.equal(assignment.taskSpec, 'review-item');
  assert.deepEqual(assignment.skills, ['fgos-coding-validating']);
  assert.deepEqual(assignment.contextRefs, ['src/state/store.mjs']);
  assert.deepEqual(assignment.expectedOutputs, ['review-verdict']);
});

test('buildAssignment preserves dispatch: human-only for exploring.answer-question', () => {
  const assignment = buildAssignment({
    stage: 'exploring',
    operation: 'answer-question',
  });
  assert.equal(assignment.operation, 'answer-question');
  assert.equal(assignment.role, 'advisor');
  assert.equal(assignment.reason, 'advise');
  assert.equal(assignment.dispatch, 'human-only');
});

test('buildAssignment throws RunnerConfigError for unknown stage or unknown operation', () => {
  assert.throws(
    () => buildAssignment({ stage: 'nonexistent-stage', operation: 'validate-plan' }),
    (err) => err instanceof RunnerConfigError && /unknown operation/i.test(err.message),
  );

  assert.throws(
    () => buildAssignment({ stage: 'planning', operation: 'nonexistent-op' }),
    (err) => err instanceof RunnerConfigError && /unknown operation/i.test(err.message),
  );

  assert.throws(
    () => buildAssignment({ stage: '', operation: 'validate-plan' }),
    (err) => err instanceof RunnerConfigError && /requires a non-empty stage/i.test(err.message),
  );
});

test('renderAssignmentPrompt formats prompt with references and outputs without embedding large file content', () => {
  const assignment = buildAssignment({
    workId: 'tsk-456',
    stage: 'planning',
    operation: 'validate-plan',
    objective: 'Validate the plan against repo reality',
    contextRefs: ['docs/history/tsk-456/plan.md', 'src/state/store.mjs'],
    expectedOutputs: ['verdict', 'findings if blocked'],
  });

  const prompt = renderAssignmentPrompt(assignment);
  assert.match(prompt, /^Assignment: asgn_tsk_456_validate_plan_001/m);
  assert.match(prompt, /^Work: tsk-456/m);
  assert.match(prompt, /^Stage operation: planning\.validate-plan/m);
  assert.match(prompt, /^Role: reviewer/m);
  assert.match(prompt, /^Task-spec: domains\/coding\/task-specs\/validate-plan\.md/m);
  assert.match(prompt, /^Objective: Validate the plan against repo reality/m);
  assert.match(prompt, /- docs\/history\/tsk-456\/plan\.md/);
  assert.match(prompt, /- src\/state\/store\.mjs/);
  assert.match(prompt, /- verdict/);
  assert.match(prompt, /- findings if blocked/);
  // Without runDir, result artifact section should not appear
  assert.doesNotMatch(prompt, /Result artifact/);
});

// ─── Step 04 Tests ───────────────────────────────────────────────────────────

test('renderAssignmentPrompt includes concrete result artifact paths when runDir is supplied (Step 04 §5.1)', () => {
  const assignment = buildAssignment({
    workId: 'tsk-rd-test',
    stage: 'planning',
    operation: 'validate-plan',
  });

  const runDir = '/tmp/fgos-asgn-rd-test/runs/01';
  const prompt = renderAssignmentPrompt(assignment, { runDir });

  assert.match(prompt, /Result artifact:/m);
  assert.match(prompt, /Write structured JSON to .*agent-result\.json/m);
  assert.match(prompt, /Optional human-readable report: .*agent-report\.md/m);
  assert.match(prompt, /Do not call Work lifecycle verbs/m);
  // Both artifact paths must include the runDir
  assert.ok(prompt.includes(path.join(runDir, 'agent-result.json')), 'prompt must contain absolute agent-result.json path');
  assert.ok(prompt.includes(path.join(runDir, 'agent-report.md')), 'prompt must contain absolute agent-report.md path');
});

test('isReadOnlyAssignment reads the stamped mutation field directly, not role/operation (ADR-006 R7)', () => {
  // Same role/operation pairs the pre-R7 heuristic classified from directly,
  // now passed with the `mutation` field a real buildAssignment() call would
  // have stamped for that pair (assignment-normalizer.mjs's
  // classifyDeclaredMutation). isReadOnlyAssignment must key off `mutation`
  // alone and reach the identical outcome for every pair.
  const cases = [
    { role: 'reviewer', operation: 'validate-plan', mutation: 'read-only', expected: true },
    { role: 'reviewer', operation: 'review-item', mutation: 'read-only', expected: true },
    { role: 'researcher', operation: 'resolve-question', mutation: 'read-only', expected: true },
    { role: 'researcher', operation: 'scout-blast-radius', mutation: 'read-only', expected: true },
    { role: 'advisor', operation: 'answer-question', mutation: 'read-only', expected: true },
    { role: 'implementer', operation: 'implement-item', mutation: 'mutating', expected: false },
    { role: 'implementer', operation: 'fix-verify-red', mutation: 'mutating', expected: false },
    { role: 'helper', operation: 'scoped-subtask', mutation: 'mutating', expected: false },
  ];

  for (const { role, operation, mutation, expected } of cases) {
    const result = isReadOnlyAssignment({ role, operation, mutation });
    assert.equal(
      result,
      expected,
      `isReadOnlyAssignment({role:'${role}', operation:'${operation}', mutation:'${mutation}'}) should be ${expected}`,
    );
  }
});

test('isReadOnlyAssignment no longer re-derives classification from role/operation alone (ADR-006 R7)', () => {
  // Before R7, role alone (READ_ONLY_ROLES) was enough to classify this as
  // read-only. After R7, isReadOnlyAssignment only reads the stamped
  // `mutation` field; an Assignment-shaped object missing that stamp is not
  // read-only regardless of role/operation.
  assert.equal(isReadOnlyAssignment({ role: 'reviewer', operation: 'validate-plan' }), false);
  assert.equal(isReadOnlyAssignment({ role: 'researcher', operation: 'resolve-question' }), false);
});

test('isReadOnlyAssignment returns false for unknown/null assignment (Step 04 §5.4)', () => {
  assert.equal(isReadOnlyAssignment(null), false);
  assert.equal(isReadOnlyAssignment(undefined), false);
  assert.equal(isReadOnlyAssignment({}), false); // defaults to 'implementer'
});

test('isReadOnlyAssignment no longer infers read-only from missionId/workId:null (ADR-006 R7 heuristic removed)', () => {
  // Before R7: `assignment.missionId || assignment.workId === null` alone was
  // sufficient to classify as read-only, regardless of the mutation stamp.
  // After R7: only `mutation === 'read-only'` counts; a mission-shaped
  // Assignment stamped mutating is correctly refused as mutating.
  assert.equal(isReadOnlyAssignment({ workId: null, mutation: 'mutating' }), false);
  assert.equal(isReadOnlyAssignment({ missionId: 'mission_001', mutation: 'mutating' }), false);
  // The stamp is still authoritative for the mission-shaped case that IS read-only.
  assert.equal(isReadOnlyAssignment({ workId: null, missionId: 'mission_001', mutation: 'read-only' }), true);
});

test('validateAgentResultClaim accepts valid done/blocked/failed/no-evidence claims (Step 04 §5.2)', () => {
  // done with evidenceRefs
  const doneClaim = { status: 'done', summary: 'Plan is valid.', evidenceRefs: ['plan.md'] };
  assert.deepEqual(validateAgentResultClaim(doneClaim), { valid: true });

  // done with minimal fields (evidenceRefs not required at validator level; caller checks artifact)
  const doneMinimal = { status: 'done', summary: 'All good.' };
  assert.deepEqual(validateAgentResultClaim(doneMinimal), { valid: true });

  // blocked with blocker
  const blockedClaim = { status: 'blocked', summary: 'Blocked by missing test.', blocker: 'test/missing.test.mjs does not exist' };
  assert.deepEqual(validateAgentResultClaim(blockedClaim), { valid: true });

  // failed with error
  const failedClaim = { status: 'failed', summary: 'Validation errored.', error: 'Cannot parse plan.md' };
  assert.deepEqual(validateAgentResultClaim(failedClaim), { valid: true });

  // no-evidence
  const noEvClaim = { status: 'no-evidence', summary: 'No output produced.' };
  assert.deepEqual(validateAgentResultClaim(noEvClaim), { valid: true });
});

test('validateAgentResultClaim rejects invalid schema and unknown status (Step 04 §5.2)', () => {
  // Not an object
  assert.equal(validateAgentResultClaim(null).valid, false);
  assert.equal(validateAgentResultClaim('done').valid, false);
  assert.equal(validateAgentResultClaim([]).valid, false);
  assert.equal(validateAgentResultClaim(42).valid, false);

  // Unknown status
  const unknownStatus = validateAgentResultClaim({ status: 'success', summary: 'Done' });
  assert.equal(unknownStatus.valid, false);
  assert.match(unknownStatus.reason, /status must be one of/i);

  // Missing summary
  const noSummary = validateAgentResultClaim({ status: 'done' });
  assert.equal(noSummary.valid, false);
  assert.match(noSummary.reason, /non-empty summary/i);

  // Empty summary
  const emptySummary = validateAgentResultClaim({ status: 'done', summary: '   ' });
  assert.equal(emptySummary.valid, false);

  // blocked without blocker
  const blockedNoBlocker = validateAgentResultClaim({ status: 'blocked', summary: 'Stuck.' });
  assert.equal(blockedNoBlocker.valid, false);
  assert.match(blockedNoBlocker.reason, /blocker/i);

  // failed without error
  const failedNoError = validateAgentResultClaim({ status: 'failed', summary: 'Crashed.' });
  assert.equal(failedNoError.valid, false);
  assert.match(failedNoError.reason, /error/i);

  // evidenceRefs not an array
  const evidenceRefsNotArray = validateAgentResultClaim({ status: 'done', summary: 'Done', evidenceRefs: 'file.md' });
  assert.equal(evidenceRefsNotArray.valid, false);
  assert.match(evidenceRefsNotArray.reason, /array/i);

  // evidenceRefs contains empty string
  const evidenceRefsEmptyString = validateAgentResultClaim({ status: 'done', summary: 'Done', evidenceRefs: [''] });
  assert.equal(evidenceRefsEmptyString.valid, false);
  assert.match(evidenceRefsEmptyString.reason, /non-empty strings/i);
});

test('buildAssignment refuses missing taskSpec file when repoRoot is supplied (Step 04 §5.6)', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-asgn-taskspec-guard-'));

  // No task-spec files exist in tempDir — buildAssignment must refuse
  assert.throws(
    () => buildAssignment({
      workId: 'tsk-ts-guard',
      stage: 'planning',
      operation: 'validate-plan',
      options: { repoRoot: tempDir },
    }),
    (err) => err instanceof RunnerConfigError && /taskSpec file does not exist/i.test(err.message),
    'buildAssignment must throw when taskSpec file is missing and repoRoot is given',
  );
});

test('buildAssignment succeeds when taskSpec file exists on disk (Step 04 §5.6)', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-asgn-taskspec-present-'));
  // Create the task-spec file at the expected location
  const taskSpecDir = path.join(tempDir, 'domains', 'coding', 'task-specs');
  fs.mkdirSync(taskSpecDir, { recursive: true });
  fs.writeFileSync(path.join(taskSpecDir, 'validate-plan.md'), '# validate-plan\n');

  const assignment = buildAssignment({
    workId: 'tsk-ts-present',
    stage: 'planning',
    operation: 'validate-plan',
    options: { repoRoot: tempDir },
  });

  assert.equal(assignment.taskSpec, 'validate-plan');
  assert.ok(Object.isFrozen(assignment));
});

test('buildAssignment({ stage: "decompose", operation: "decompose" }) refuses missing taskSpec by default (Step 04 §5.6)', () => {
  assert.throws(
    () => buildAssignment({ stage: 'decompose', operation: 'decompose' }),
    (err) => err instanceof RunnerConfigError && /taskSpec file does not exist/i.test(err.message),
    'buildAssignment must refuse missing taskSpec operation even without explicit options',
  );
});
