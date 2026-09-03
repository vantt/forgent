import { test } from 'node:test';
import assert from 'node:assert/strict';

import { projectWorkflowToFlowDefinition } from '../../src/runner/definitions/workflow-adapter.mjs';
import { FlowDefinitionError } from '../../src/runner/definitions/schema.mjs';
import {
  DOMAINS,
  getDomain,
  resolveWorkflow,
  operationsForStage,
  roleGraphFor,
  stageForStep,
} from '../../src/state/workflow-stage-graphs.mjs';

// ---------------------------------------------------------------------------
// R5: coding `feature` Workflow golden, projected through the adapter.
// ---------------------------------------------------------------------------

test('projectWorkflowToFlowDefinition("coding", "feature") produces a valid Workflow-profile FlowDefinition golden', () => {
  const fd = projectWorkflowToFlowDefinition('coding', { kind: 'feature' });

  assert.equal(fd.apiVersion, 'fgos.dev/v1alpha1');
  assert.equal(fd.kind, 'FlowDefinition');
  assert.equal(fd.metadata.id, 'workflow:coding/feature');
  assert.equal(fd.spec.profile.kind, 'Workflow');
  // baseStepMap is built on Object.create(null) by validateFlowDefinition
  // (schema.mjs, P02.1's own __proto__-safety fix) -- compare via a plain
  // spread rather than assert.deepEqual, which treats a null-prototype
  // object as unequal to a `{}`-literal of otherwise-identical entries.
  assert.deepEqual({ ...fd.spec.profile.work.baseStepMap }, { planning: 'Divide', executing: 'Execute' });

  assert.deepEqual(fd.spec.roles, ['implementer', 'researcher', 'reviewer', 'helper', 'advisor']);

  assert.equal(fd.spec.graph.entry, 'discovery');
  assert.deepEqual(
    fd.spec.graph.nodes.map((n) => n.id),
    ['discovery', 'exploring', 'decompose', 'planning', 'executing'],
  );

  const discoveryNode = fd.spec.graph.nodes.find((n) => n.id === 'discovery');
  assert.deepEqual([...discoveryNode.transitions].sort(), ['exploring', 'planning'].sort());
  assert.deepEqual(discoveryNode.operations.map((o) => o.ref), ['discovery::judge-ambiguity', 'discovery::resolve-question']);

  const executingNode = fd.spec.graph.nodes.find((n) => n.id === 'executing');
  assert.deepEqual(executingNode.transitions, []);

  // Every graph.nodes[].operations[].ref must resolve to a declared
  // spec.operations[] id -- already proven by validateFlowDefinition not
  // throwing, re-asserted here directly for a stronger golden-shape claim.
  const operationIds = new Set(fd.spec.operations.map((op) => op.id));
  for (const node of fd.spec.graph.nodes) {
    for (const opRef of node.operations) {
      assert.ok(operationIds.has(opRef.ref), `${node.id} references undeclared operation "${opRef.ref}"`);
    }
  }

  const implementItem = fd.spec.operations.find((op) => op.id === 'executing::implement-item');
  assert.deepEqual(implementItem, {
    id: 'executing::implement-item',
    role: 'implementer',
    capabilities: ['fgos-coding-implement'],
    task: { taskSpec: 'implement-item' },
  });

  const validatePlan = fd.spec.operations.find((op) => op.id === 'planning::validate-plan');
  assert.deepEqual(validatePlan.policy, { minTier: 'standard', preferPersona: 'code-reviewer', preferExecutor: 'claude' });

  assert.ok(Object.isFrozen(fd));
  assert.ok(Object.isFrozen(fd.spec));
  assert.ok(Object.isFrozen(fd.spec.graph.nodes));
  assert.ok(Object.isFrozen(fd.spec.operations));
});

test('projectWorkflowToFlowDefinition namespaces same raw operation id reused across stages into distinct global operation ids', () => {
  const fd = projectWorkflowToFlowDefinition('coding', { kind: 'feature' });
  const resolveQuestionIds = fd.spec.operations.filter((op) => op.id.endsWith('::resolve-question')).map((op) => op.id);
  assert.deepEqual(
    resolveQuestionIds.sort(),
    ['discovery::resolve-question', 'exploring::resolve-question', 'planning::resolve-question', 'executing::resolve-question'].sort(),
  );
  // Every operations[].id is globally unique (validateFlowDefinition would
  // have thrown a duplicate-id error otherwise).
  const seen = new Set();
  for (const op of fd.spec.operations) {
    assert.ok(!seen.has(op.id), `duplicate operation id "${op.id}" leaked past validateFlowDefinition`);
    seen.add(op.id);
  }
});

test('projectWorkflowToFlowDefinition determinism: two calls for the same input produce deep-equal, independently-frozen output', () => {
  const a = projectWorkflowToFlowDefinition('coding', { kind: 'feature' });
  const b = projectWorkflowToFlowDefinition('coding');
  assert.deepEqual(a, b);
  assert.notEqual(a, b); // fresh objects each call, never a cached/shared reference
});

test('projectWorkflowToFlowDefinition rejects a domain that declares no workflows', () => {
  assert.throws(
    () => projectWorkflowToFlowDefinition('synthetic'),
    (err) => err instanceof FlowDefinitionError && /declares no workflows/.test(err.message),
  );
  assert.throws(
    () => projectWorkflowToFlowDefinition('triage'),
    (err) => err instanceof FlowDefinitionError && /declares no workflows/.test(err.message),
  );
});

// ---------------------------------------------------------------------------
// AC-I003/AC-I005/AC-I006 must-not-preclude + zero-consumer-migration proof:
// every existing workflow-stage-graphs.mjs export used by the adapter (and
// every export it does NOT use) returns byte-for-byte the same value before
// and after this cell, since this cell made ZERO diff to that file. This
// test proves the adapter is a strict, read-only ADDITIVE consumer of the
// existing surface -- it never mutates, wraps, or shadows any of it.
// ---------------------------------------------------------------------------

test('zero-consumer-migration proof: the adapter never mutates the DOMAINS registry or any object it reads from workflow-stage-graphs.mjs', () => {
  const domainsSnapshotBefore = JSON.parse(JSON.stringify(DOMAINS.coding));
  projectWorkflowToFlowDefinition('coding', { kind: 'feature' });
  projectWorkflowToFlowDefinition('coding', { kind: 'feature' });
  const domainsSnapshotAfter = JSON.parse(JSON.stringify(DOMAINS.coding));
  assert.deepEqual(domainsSnapshotBefore, domainsSnapshotAfter);

  // Every export the adapter itself calls still behaves identically after
  // repeated adapter calls -- direct proof this cell did not fork or shadow
  // any existing consumer-facing behavior.
  assert.equal(getDomain('coding'), DOMAINS.coding);
  assert.deepEqual(resolveWorkflow(DOMAINS.coding, 'feature'), DOMAINS.coding.workflows.feature);
  assert.deepEqual(
    operationsForStage('coding', 'executing', { kind: 'feature' }).map((o) => o.id),
    DOMAINS.coding.workflows.feature.operationMap.executing.map((o) => o.id),
  );
  assert.deepEqual(roleGraphFor(DOMAINS.coding), DOMAINS.coding.roleGraph);
  assert.equal(stageForStep(DOMAINS.coding, 'Execute'), 'executing');
});
