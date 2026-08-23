// test/state/workflow-multiplicity.test.mjs -- tsk-2t9c D7/D7a: the
// domain -> N workflow -> item hierarchy, mechanism-first. Only `feature`
// is registered on coding today; these tests prove the mechanism runs for
// real (the selector resolves, folds unknowns, and a domain with no
// `workflows` field degrades cleanly) without asserting anything about a
// second workflow shape, which does not exist yet by design (D7a).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DOMAINS, resolveWorkflow } from '../../src/state/workflow-stage-graphs.mjs';

const coding = DOMAINS.coding;
const synthetic = DOMAINS.synthetic;

test('coding declares exactly one workflow, feature, as the default', () => {
  assert.deepEqual(Object.keys(coding.workflows), ['feature']);
  assert.equal(coding.defaultWorkflow, 'feature');
  assert.deepEqual(coding.workflowFor, {});
});

test('identity proof: workflows.feature.{stages,stepMap,transitions} are the SAME references as the domain-level fields, not a copy', () => {
  assert.equal(coding.workflows.feature.stages, coding.stages);
  assert.equal(coding.workflows.feature.stepMap, coding.stepMap);
  assert.equal(coding.workflows.feature.transitions, coding.transitions);
});

test('resolveWorkflow(coding, "bug") resolves to feature -- workflowFor is empty today, every kind folds to the default', () => {
  const workflow = resolveWorkflow(coding, 'bug');
  assert.equal(workflow, coding.workflows.feature);
});

test('resolveWorkflow folds an unrecognized or absent kind to the default, never throws', () => {
  assert.equal(resolveWorkflow(coding, 'not-a-real-kind'), coding.workflows.feature);
  assert.equal(resolveWorkflow(coding, undefined), coding.workflows.feature);
  assert.doesNotThrow(() => resolveWorkflow(coding));
});

test('resolveWorkflow returns undefined for a domain with no workflows declared (synthetic) -- no throw, no crash', () => {
  assert.equal(resolveWorkflow(synthetic, 'anything'), undefined);
});

test('resolveWorkflow never throws on a null/undefined domain', () => {
  assert.doesNotThrow(() => resolveWorkflow(null, 'feature'));
  assert.doesNotThrow(() => resolveWorkflow(undefined, 'feature'));
  assert.equal(resolveWorkflow(null, 'feature'), undefined);
});

test('the whole coding domain, including workflows, stays deeply frozen', () => {
  assert.throws(() => { coding.workflows.feature.stages = []; });
  assert.throws(() => { coding.workflowFor.bug = 'bugfix'; });
});
