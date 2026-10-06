// test/state/workflow-multiplicity.test.mjs -- tsk-2t9c D7/D7a: the
// domain -> N workflow -> item hierarchy, mechanism-first. Only `feature`
// is registered on coding today; these tests prove the mechanism runs for
// real (the selector resolves, folds unknowns, and a domain with no
// `workflows` field degrades cleanly) without asserting anything about a
// second workflow shape, which does not exist yet by design (D7a).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DOMAINS, resolveWorkflow } from '../../src/state/domain-registry.mjs';

const coding = DOMAINS.coding;
const synthetic = DOMAINS.synthetic;

test('coding declares exactly one workflow, feature, as the default', () => {
  assert.deepEqual(Object.keys(coding.workflows), ['feature']);
  assert.equal(coding.defaultWorkflow, 'feature');
  assert.deepEqual(coding.workflowFor, {});
});

test('the Workflow is the only home of a domain\'s steps and transitions: the domain entry holds neither', () => {
  assert.equal(Object.hasOwn(coding, 'stages'), false);
  assert.equal(Object.hasOwn(coding, 'transitions'), false);
  assert.ok(coding.workflows.feature.steps.length > 0);
  assert.ok(coding.workflows.feature.transitions.length > 0);
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

test('a fixture domain declares one workflow and every kind folds to it', () => {
  assert.equal(resolveWorkflow(synthetic, 'anything'), synthetic.workflows.main);
});

test('resolveWorkflow never throws on a null/undefined domain', () => {
  assert.doesNotThrow(() => resolveWorkflow(null, 'feature'));
  assert.doesNotThrow(() => resolveWorkflow(undefined, 'feature'));
  assert.equal(resolveWorkflow(null, 'feature'), undefined);
});

test('the whole coding domain, including workflows, stays deeply frozen', () => {
  assert.throws(() => { coding.workflows.feature.steps = []; });
  assert.throws(() => { coding.workflowFor.bug = 'bugfix'; });
});
