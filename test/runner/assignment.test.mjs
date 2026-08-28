import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createAssignmentId,
  buildAssignment,
  renderAssignmentPrompt,
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
    fallbackExecutors: ['pi'],
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
});
