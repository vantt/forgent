import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  API_VERSION,
  KIND,
  validateFlowDefinition,
  mergePolicyStack,
  FlowDefinitionError,
} from '../../src/runner/definitions/schema.mjs';

function minimalWorkflowDefinition(overrides = {}) {
  return {
    apiVersion: API_VERSION,
    kind: KIND,
    metadata: { id: 'wf-def-feature', version: '1.0.0' },
    spec: {
      profile: { kind: 'Workflow' },
      roles: ['implementer'],
      operations: [
        { id: 'op-implement', role: 'implementer', result: { kind: 'work-product' } },
      ],
      graph: {
        entry: 'executing',
        nodes: [
          { id: 'executing', operations: [{ ref: 'op-implement' }], transitions: [] },
        ],
      },
    },
    ...overrides,
  };
}

function minimalProtocolDefinition(overrides = {}) {
  return {
    apiVersion: API_VERSION,
    kind: KIND,
    metadata: { id: 'proto-consult', version: '1.0.0' },
    spec: {
      profile: {
        kind: 'CoordinationProtocol',
        completion: { mode: 'synthesize' },
        topology: { contextVisibility: 'mediated', edges: [] },
        cohort: { count: 1, requiredRoles: ['researcher'], independence: 'isolated-until-fan-in' },
      },
      roles: ['researcher'],
      actors: [{ id: 'actor-1', role: 'researcher' }],
      operations: [
        { id: 'op-research', role: 'researcher', result: { kind: 'advisory' } },
      ],
      graph: {
        entry: 'phase-research',
        nodes: [
          { id: 'phase-research', operations: [{ ref: 'op-research', actor: 'actor-1' }], transitions: [] },
        ],
      },
    },
    ...overrides,
  };
}

function throwsFlowDefinitionError(pattern) {
  return (err) => err instanceof FlowDefinitionError && pattern.test(err.message);
}

// ---------------------------------------------------------------------------
// Positive fixtures
// ---------------------------------------------------------------------------

test('validateFlowDefinition accepts a minimal valid Workflow FlowDefinition and returns a frozen object', () => {
  const result = validateFlowDefinition(minimalWorkflowDefinition());
  assert.equal(result.spec.profile.kind, 'Workflow');
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.spec));
  assert.ok(Object.isFrozen(result.spec.graph));
  assert.ok(Object.isFrozen(result.spec.graph.nodes));
  assert.ok(Object.isFrozen(result.spec.operations));
});

test('validateFlowDefinition accepts a minimal valid CoordinationProtocol FlowDefinition (topology/cohort/completion) and returns a frozen object', () => {
  const result = validateFlowDefinition(minimalProtocolDefinition());
  assert.equal(result.spec.profile.kind, 'CoordinationProtocol');
  assert.equal(result.spec.profile.completion.mode, 'synthesize');
  assert.equal(result.spec.profile.topology.contextVisibility, 'mediated');
  assert.equal(result.spec.profile.cohort.count, 1);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.spec.actors));
});

// ---------------------------------------------------------------------------
// Required Negative Tests (contract's own list)
// ---------------------------------------------------------------------------

test('rejects a node declaring its own kind field regardless of value', () => {
  const def = minimalWorkflowDefinition();
  def.spec.graph.nodes[0].kind = 'Stage';
  assert.throws(() => validateFlowDefinition(def), throwsFlowDefinitionError(/nodes\[0\] has unknown field "kind"/));
});

test('preserves a "__proto__" baseStepMap key as a real own property instead of silently dropping it', () => {
  // Built via JSON.parse, not an object literal: an object-literal
  // `{ "__proto__": "Execute" }` never creates an own "__proto__"
  // property in the first place (the literal syntax special-cases it as
  // a prototype assignment and silently discards a non-object value), so
  // it would not exercise the validator's own-property handling at all.
  // JSON.parse has no such special case and produces a genuine own key --
  // matching what a real FlowDefinition document loaded from JSON/YAML
  // would contain.
  const def = minimalWorkflowDefinition();
  def.spec.profile = {
    kind: 'Workflow',
    work: { baseStepMap: JSON.parse('{"__proto__": "Execute"}') },
  };

  const result = validateFlowDefinition(def);
  const baseStepMap = result.spec.profile.work.baseStepMap;

  assert.deepEqual(Object.keys(baseStepMap), ['__proto__']);
  assert.equal(baseStepMap['__proto__'], 'Execute');
  assert.equal(Object.getPrototypeOf(baseStepMap), null);
  assert.ok(Object.isFrozen(baseStepMap));
});

test('rejects a CoordinationProtocol definition declaring profile.work / baseStepMap', () => {
  const def = minimalProtocolDefinition({
    spec: {
      ...minimalProtocolDefinition().spec,
      profile: { kind: 'CoordinationProtocol', work: { baseStepMap: { 'phase-research': 'Execute' } } },
    },
  });
  assert.throws(() => validateFlowDefinition(def), throwsFlowDefinitionError(/spec\.profile has unknown field "work"/));
});

test('rejects a Workflow definition declaring topology', () => {
  const def = minimalWorkflowDefinition({
    spec: {
      ...minimalWorkflowDefinition().spec,
      profile: { kind: 'Workflow', topology: { contextVisibility: 'mediated' } },
    },
  });
  assert.throws(() => validateFlowDefinition(def), throwsFlowDefinitionError(/spec\.profile has unknown field "topology"/));
});

test('rejects a Workflow definition declaring cohort', () => {
  const def = minimalWorkflowDefinition({
    spec: {
      ...minimalWorkflowDefinition().spec,
      profile: { kind: 'Workflow', cohort: { count: 1 } },
    },
  });
  assert.throws(() => validateFlowDefinition(def), throwsFlowDefinitionError(/spec\.profile has unknown field "cohort"/));
});

test('rejects an operation declaring purpose', () => {
  const def = minimalWorkflowDefinition();
  def.spec.operations[0].purpose = 'diverge';
  assert.throws(() => validateFlowDefinition(def), throwsFlowDefinitionError(/operations\[0\] has unknown field "purpose"/));
});

test("rejects an operation's role not present in spec.roles", () => {
  const def = minimalWorkflowDefinition();
  def.spec.operations[0].role = 'ghost-role';
  assert.throws(() => validateFlowDefinition(def), throwsFlowDefinitionError(/operations\[0\]\.role "ghost-role" is not declared in spec\.roles/));
});

test('rejects a graph.nodes[].operations[].actor not present in spec.actors', () => {
  const def = minimalProtocolDefinition();
  def.spec.graph.nodes[0].operations[0].actor = 'ghost-actor';
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/nodes\[0\]\.operations\[0\]\.actor "ghost-actor" does not reference a declared spec\.actors\[\] id/),
  );
});

test('rejects a more-specific-scope minTier that lowers a less-specific scope floor (operation-scope monotonicity)', () => {
  const def = minimalWorkflowDefinition();
  def.spec.policy = { minTier: 'critical' };
  def.spec.operations[0].policy = { minTier: 'standard' };
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/spec\.operations\[0\]\.policy\.minTier \("standard"\) would lower the floor already set by a less specific scope \("critical"\)/),
  );
});

test('rejects a more-specific-scope minTier that lowers a less-specific scope floor (actor-scope monotonicity)', () => {
  const def = minimalProtocolDefinition();
  def.spec.policy = { minTier: 'analytical' };
  def.spec.actors[0].policy = { minTier: 'lightweight' };
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/spec\.actors\[0\]\.policy\.minTier \("lightweight"\) would lower the floor already set by a less specific scope \("analytical"\)/),
  );
});

// ---------------------------------------------------------------------------
// Other contract MUST rules
// ---------------------------------------------------------------------------

test('rejects a dangling spec.graph.entry reference', () => {
  const def = minimalWorkflowDefinition();
  def.spec.graph.entry = 'no-such-node';
  assert.throws(() => validateFlowDefinition(def), throwsFlowDefinitionError(/spec\.graph\.entry "no-such-node" does not reference a declared node id/));
});

test('rejects a dangling graph.nodes[].transitions[] reference', () => {
  const def = minimalWorkflowDefinition();
  def.spec.graph.nodes[0].transitions = ['no-such-node'];
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/nodes\[0\]\.transitions\[0\] "no-such-node" does not reference a declared node id/),
  );
});

test('rejects an unknown top-level field on an operation', () => {
  const def = minimalWorkflowDefinition();
  def.spec.operations[0].extraField = 'nope';
  assert.throws(() => validateFlowDefinition(def), throwsFlowDefinitionError(/operations\[0\] has unknown field "extraField"/));
});

test('rejects an unknown field on a profile object', () => {
  const def = minimalWorkflowDefinition();
  def.spec.profile = { kind: 'Workflow', extraField: 'nope' };
  assert.throws(() => validateFlowDefinition(def), throwsFlowDefinitionError(/spec\.profile has unknown field "extraField"/));
});

test('rejects result.kind "gate-verdict" under CoordinationProtocol', () => {
  const def = minimalProtocolDefinition();
  def.spec.operations[0].result = { kind: 'gate-verdict' };
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/result\.kind "gate-verdict" is legal only under the Workflow profile/),
  );
});

test('accepts result.kind "gate-verdict" under Workflow', () => {
  const def = minimalWorkflowDefinition();
  def.spec.operations[0].result = { kind: 'gate-verdict' };
  assert.doesNotThrow(() => validateFlowDefinition(def));
});

test('rejects completion.mode "synthesize" with no reachable advisory operation', () => {
  const def = minimalProtocolDefinition();
  def.spec.operations[0].result = { kind: 'work-product' };
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/completion\.mode "synthesize" requires at least one operation with result\.kind "advisory" reachable from spec\.graph\.entry/),
  );
});

test('rejects missionId anywhere in the document (ADR-008 Decision 5)', () => {
  const shallow = minimalWorkflowDefinition();
  shallow.spec.graph.missionId = 'mission_001';
  assert.throws(() => validateFlowDefinition(shallow), throwsFlowDefinitionError(/carries a forbidden field "missionId"/));

  // A second, more deeply nested planting point -- inside
  // spec.actors[0].policy -- to actually demonstrate "at any nesting
  // depth" rather than only the one shallow spec.graph location above.
  const deep = minimalProtocolDefinition();
  deep.spec.actors[0].policy = { visibility: 'headless', missionId: 'mission_001' };
  assert.throws(() => validateFlowDefinition(deep), throwsFlowDefinitionError(/carries a forbidden field "missionId"/));
});

test("rejects a spec.actors[] entry whose role is not declared in spec.roles", () => {
  const def = minimalProtocolDefinition();
  def.spec.actors[0].role = 'ghost-role';
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/actors\[0\]\.role "ghost-role" is not declared in spec\.roles/),
  );
});

// ---------------------------------------------------------------------------
// Determinism / immutability
// ---------------------------------------------------------------------------

test('validating the same input twice produces deep-equal output and does not mutate the input', () => {
  const input = minimalWorkflowDefinition();
  const snapshot = JSON.parse(JSON.stringify(input));

  const first = validateFlowDefinition(input);
  const second = validateFlowDefinition(input);

  assert.deepEqual(JSON.parse(JSON.stringify(first)), JSON.parse(JSON.stringify(second)));
  assert.deepEqual(input, snapshot, 'input object must not be mutated by validation');
  assert.equal(Object.isFrozen(input), false, 'validation must not freeze the caller-owned input object');
  assert.notEqual(first.spec.roles, input.spec.roles, 'returned structure must be a fresh copy, not a reference into input');
});

// ---------------------------------------------------------------------------
// mergePolicyStack (standalone helper, exported for future reuse)
// ---------------------------------------------------------------------------

test('mergePolicyStack resolves most-specific-wins for non-minTier fields and allows minTier to rise', () => {
  const resolved = mergePolicyStack([
    { scope: 'definition', source: 'def-1', policy: { minTier: 'standard', visibility: 'headless' } },
    { scope: 'operation', source: 'op-1', policy: { minTier: 'critical', preferExecutor: 'codex-cli' } },
  ]);
  assert.equal(resolved.minTier, 'critical');
  assert.equal(resolved.visibility, 'headless');
  assert.equal(resolved.preferExecutor, 'codex-cli');
});

test('mergePolicyStack rejects a stack entry that lowers the already-resolved minTier floor', () => {
  assert.throws(
    () => mergePolicyStack([
      { scope: 'definition', source: 'def-1', policy: { minTier: 'critical' } },
      { scope: 'actor', source: 'actor-1', policy: { minTier: 'standard' } },
    ]),
    throwsFlowDefinitionError(/sets minTier "standard", lower than the floor "critical" already set by/),
  );
});
