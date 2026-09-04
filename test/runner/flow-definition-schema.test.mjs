import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  API_VERSION,
  KIND,
  validateFlowDefinition,
  mergePolicyStack,
  activationModeOf,
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

// ─── contributions.allowedTypes[] (Step 09 MVP8, P08.3) ─────────────────────
// The Candidate Contract's per-operation declaration channel:
// "Operation results declare contributions.allowedTypes[]." Additive and
// optional, so every existing fixture/test with no `contributions` key on
// any operation keeps validating unchanged -- proven by every OTHER test in
// this file (none declares it) plus the two below that assert it explicitly.

test('accepts an operation declaring contributions.allowedTypes with real, deduplicated CONTRIBUTION_TYPES members', () => {
  const def = minimalProtocolDefinition();
  def.spec.operations[0].contributions = { allowedTypes: ['proposal', 'objection', 'response', 'clarification', 'rank', 'specialist-request'] };
  const validated = validateFlowDefinition(def);
  assert.deepEqual(validated.spec.operations[0].contributions.allowedTypes, [
    'proposal', 'objection', 'response', 'clarification', 'rank', 'specialist-request',
  ]);
});

test('an operation with no contributions key validates unchanged, and carries no contributions field at all', () => {
  const def = minimalProtocolDefinition();
  const validated = validateFlowDefinition(def);
  assert.equal('contributions' in validated.spec.operations[0], false);
});

test('accepts an explicit contributions.allowedTypes: [] -- a legal declaration, not an error', () => {
  const def = minimalProtocolDefinition();
  def.spec.operations[0].contributions = { allowedTypes: [] };
  const validated = validateFlowDefinition(def);
  assert.deepEqual(validated.spec.operations[0].contributions.allowedTypes, []);
});

test('rejects an unknown field on contributions', () => {
  const def = minimalProtocolDefinition();
  def.spec.operations[0].contributions = { allowedTypes: ['proposal'], extra: true };
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/operations\[0\]\.contributions has unknown field "extra"/),
  );
});

test('rejects contributions when it is not an object', () => {
  const def = minimalProtocolDefinition();
  def.spec.operations[0].contributions = ['proposal'];
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/operations\[0\]\.contributions must be an object when provided/),
  );
});

test('rejects contributions.allowedTypes when it is not an array of strings', () => {
  const def = minimalProtocolDefinition();
  def.spec.operations[0].contributions = { allowedTypes: 'proposal' };
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/operations\[0\]\.contributions\.allowedTypes must be an array of non-empty strings/),
  );
});

test('rejects a contributions.allowedTypes entry outside the closed MVP8 CONTRIBUTION_TYPES enum', () => {
  const def = minimalProtocolDefinition();
  def.spec.operations[0].contributions = { allowedTypes: ['proposal', 'vote'] };
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/operations\[0\]\.contributions\.allowedTypes carries "vote", which is not one of proposal \| objection \| response \| clarification \| rank \| specialist-request/),
  );
});

test('rejects a duplicate entry in contributions.allowedTypes', () => {
  const def = minimalProtocolDefinition();
  def.spec.operations[0].contributions = { allowedTypes: ['proposal', 'proposal'] };
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/operations\[0\]\.contributions\.allowedTypes carries a duplicate entry/),
  );
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
// Binding activation (node-operation binding scoped, never the shared
// spec.operations[] template)
// ---------------------------------------------------------------------------

test('accepts activation.mode "driver-authorized" with maxInvocations on a node-operation binding', () => {
  const def = minimalProtocolDefinition();
  def.spec.graph.nodes[0].operations[0].activation = { mode: 'driver-authorized', maxInvocations: 3 };
  const result = validateFlowDefinition(def);
  assert.deepEqual(result.spec.graph.nodes[0].operations[0].activation, { mode: 'driver-authorized', maxInvocations: 3 });
});

test('activation present without a mode key defaults to "required"', () => {
  const def = minimalProtocolDefinition();
  def.spec.graph.nodes[0].operations[0].activation = { maxInvocations: 2 };
  const result = validateFlowDefinition(def);
  assert.deepEqual(result.spec.graph.nodes[0].operations[0].activation, { mode: 'required', maxInvocations: 2 });
});

test('a binding with no activation at all resolves to activation mode "required"', () => {
  const result = validateFlowDefinition(minimalProtocolDefinition());
  assert.equal(result.spec.graph.nodes[0].operations[0].activation, undefined);
  assert.equal(activationModeOf(result.spec.graph.nodes[0].operations[0]), 'required');
});

test('activationModeOf resolves the contract default for every absent-mode shape', () => {
  assert.equal(activationModeOf({ ref: 'op' }), 'required');
  assert.equal(activationModeOf({ ref: 'op', activation: {} }), 'required');
  assert.equal(activationModeOf({ ref: 'op', activation: { maxInvocations: 4 } }), 'required');
  assert.equal(activationModeOf({ ref: 'op', activation: { mode: 'driver-authorized' } }), 'driver-authorized');
});

test('rejects an unknown activation.mode value', () => {
  const def = minimalProtocolDefinition();
  def.spec.graph.nodes[0].operations[0].activation = { mode: 'optional' };
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/nodes\[0\]\.operations\[0\]\.activation\.mode must be one of required \| driver-authorized/),
  );
});

test('rejects an unknown field inside activation', () => {
  const def = minimalProtocolDefinition();
  def.spec.graph.nodes[0].operations[0].activation = { mode: 'required', authorizedBy: 'driver' };
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/nodes\[0\]\.operations\[0\]\.activation has unknown field "authorizedBy"/),
  );
});

test('rejects a non-positive-integer activation.maxInvocations', () => {
  for (const bad of [0, -1, 1.5, '2']) {
    const def = minimalProtocolDefinition();
    def.spec.graph.nodes[0].operations[0].activation = { mode: 'driver-authorized', maxInvocations: bad };
    assert.throws(
      () => validateFlowDefinition(def),
      throwsFlowDefinitionError(/activation\.maxInvocations must be a positive integer when provided/),
      `expected maxInvocations ${JSON.stringify(bad)} to be rejected`,
    );
  }
});

test('rejects activation declared on a reusable spec.operations[] template -- activation is binding-scoped only', () => {
  const def = minimalProtocolDefinition();
  def.spec.operations[0].activation = { mode: 'driver-authorized' };
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/operations\[0\] declares "activation".*binding/s),
  );
});

test('the same operation id may be required at one graph position and driver-authorized at another', () => {
  const def = minimalProtocolDefinition();
  def.spec.graph.nodes = [
    { id: 'phase-research', operations: [{ ref: 'op-research', actor: 'actor-1' }], transitions: ['phase-recheck'] },
    {
      id: 'phase-recheck',
      operations: [{ ref: 'op-research', actor: 'actor-1', activation: { mode: 'driver-authorized' } }],
      transitions: [],
    },
  ];
  const result = validateFlowDefinition(def);
  assert.equal(activationModeOf(result.spec.graph.nodes[0].operations[0]), 'required');
  assert.equal(activationModeOf(result.spec.graph.nodes[1].operations[0]), 'driver-authorized');
});

// ---------------------------------------------------------------------------
// Visibility windows (Step 09 MVP6 P06.1 -- schema/validation only, no
// runtime enforcement; see docs/architect/agent-coordination/verification/
// step-09-mvp6-to-mvp9/P00.2.md §3 for the candidate-contract freeze).
// ---------------------------------------------------------------------------

function protocolDefinitionWithTwoOperations(overrides = {}) {
  const def = minimalProtocolDefinition(overrides);
  def.spec.roles = ['researcher'];
  def.spec.operations = [
    { id: 'op-research', role: 'researcher', result: { kind: 'advisory' } },
    { id: 'op-list-results', role: 'researcher', result: { kind: 'work-product' } },
  ];
  def.spec.graph.nodes[0].operations = [
    { ref: 'op-research', actor: 'actor-1' },
    { ref: 'op-list-results', actor: 'actor-1' },
  ];
  return def;
}

function withVisibilityWindow(overrides = {}) {
  const def = protocolDefinitionWithTwoOperations();
  def.spec.profile.topology.visibilityWindows = [
    {
      id: 'window-1',
      opensAfter: { milestone: 'listed-results-linked', operationRefs: ['op-list-results'] },
      permits: { sourceOperationRefs: ['op-research'], delivery: 'artifact-refs' },
      ...overrides,
    },
  ];
  return def;
}

test('a definition with no visibilityWindows validates byte/behavior-identical to before (regression)', () => {
  const def = minimalProtocolDefinition();
  const result = validateFlowDefinition(def);
  assert.equal(result.spec.profile.topology.visibilityWindows, undefined);
  assert.equal(result.spec.graph.nodes[0].operations[0].contextAccess, undefined);
});

test('accepts a well-formed CoordinationProtocol visibilityWindows[] definition and a matching contextAccess.visibilityWindowRef', () => {
  const def = withVisibilityWindow();
  def.spec.graph.nodes[0].operations[0].contextAccess = { visibilityWindowRef: 'window-1' };

  const result = validateFlowDefinition(def);
  assert.deepEqual(result.spec.profile.topology.visibilityWindows, [
    {
      id: 'window-1',
      opensAfter: { milestone: 'listed-results-linked', operationRefs: ['op-list-results'] },
      permits: { sourceOperationRefs: ['op-research'], delivery: 'artifact-refs' },
    },
  ]);
  assert.deepEqual(result.spec.graph.nodes[0].operations[0].contextAccess, { visibilityWindowRef: 'window-1' });
  assert.ok(Object.isFrozen(result.spec.profile.topology.visibilityWindows));
  assert.ok(Object.isFrozen(result.spec.profile.topology.visibilityWindows[0]));
});

test('rejects contextAccess declared on a reusable spec.operations[] template -- contextAccess is binding-scoped only', () => {
  const def = withVisibilityWindow();
  def.spec.operations[0].contextAccess = { visibilityWindowRef: 'window-1' };
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/operations\[0\] has unknown field "contextAccess"/),
  );
});

test('rejects an unknown contextAccess.visibilityWindowRef', () => {
  const def = withVisibilityWindow();
  def.spec.graph.nodes[0].operations[0].contextAccess = { visibilityWindowRef: 'no-such-window' };
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/contextAccess\.visibilityWindowRef "no-such-window" does not reference a declared spec\.profile\.topology\.visibilityWindows\[\] id/),
  );
});

test('rejects a dangling opensAfter.operationRefs[] entry', () => {
  const def = withVisibilityWindow({ opensAfter: { milestone: 'listed-results-linked', operationRefs: ['no-such-op'] } });
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/visibilityWindows\[0\]\.opensAfter\.operationRefs\[0\] "no-such-op" does not reference a declared spec\.operations\[\] id/),
  );
});

test('rejects a dangling permits.sourceOperationRefs[] entry', () => {
  const def = withVisibilityWindow({ permits: { sourceOperationRefs: ['no-such-op'], delivery: 'artifact-refs' } });
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/visibilityWindows\[0\]\.permits\.sourceOperationRefs\[0\] "no-such-op" does not reference a declared spec\.operations\[\] id/),
  );
});

test('rejects a duplicate visibilityWindows[] id', () => {
  const def = protocolDefinitionWithTwoOperations();
  const window = {
    opensAfter: { milestone: 'listed-results-linked', operationRefs: ['op-list-results'] },
    permits: { sourceOperationRefs: ['op-research'], delivery: 'artifact-refs' },
  };
  def.spec.profile.topology.visibilityWindows = [
    { id: 'window-1', ...window },
    { id: 'window-1', ...window },
  ];
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/visibilityWindows carries duplicate window id "window-1"/),
  );
});

test('rejects an illegal permits.delivery value', () => {
  const def = withVisibilityWindow({ permits: { sourceOperationRefs: ['op-research'], delivery: 'live-stream' } });
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/visibilityWindows\[0\]\.permits\.delivery must be one of artifact-refs/),
  );
});

test('rejects an illegal opensAfter.milestone value', () => {
  const def = withVisibilityWindow({ opensAfter: { milestone: 'all-results-linked', operationRefs: ['op-list-results'] } });
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/visibilityWindows\[0\]\.opensAfter\.milestone must be one of listed-results-linked/),
  );
});

test('rejects a Workflow-profile definition carrying spec.profile.topology.visibilityWindows', () => {
  const def = minimalWorkflowDefinition({
    spec: {
      ...minimalWorkflowDefinition().spec,
      profile: {
        kind: 'Workflow',
        topology: {
          visibilityWindows: [
            {
              id: 'window-1',
              opensAfter: { milestone: 'listed-results-linked', operationRefs: ['op-implement'] },
              permits: { sourceOperationRefs: ['op-implement'], delivery: 'artifact-refs' },
            },
          ],
        },
      },
    },
  });
  assert.throws(() => validateFlowDefinition(def), throwsFlowDefinitionError(/spec\.profile has unknown field "topology"/));
});

test('rejects a Workflow-profile definition carrying graph.nodes[].operations[].contextAccess', () => {
  const def = minimalWorkflowDefinition();
  def.spec.graph.nodes[0].operations[0].contextAccess = { visibilityWindowRef: 'window-1' };
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/contextAccess is legal only under the CoordinationProtocol profile \(profile is "Workflow"\)/),
  );
});

// ---------------------------------------------------------------------------
// Specialist slots (Step 09 MVP9 P09.1 -- schema/static-legality only, no
// runtime authorization/binding; see docs/architect/agent-coordination/
// verification/step-09-mvp6-to-mvp9/phase-09-mvp9-bounded-specialist-binding.md
// for the candidate-contract freeze).
// ---------------------------------------------------------------------------

function withSpecialistSlot(overrides = {}) {
  const def = protocolDefinitionWithTwoOperations();
  def.spec.operations[1].capabilities = ['list-tool'];
  def.spec.profile.topology.visibilityWindows = [
    {
      id: 'window-1',
      opensAfter: { milestone: 'listed-results-linked', operationRefs: ['op-list-results'] },
      permits: { sourceOperationRefs: ['op-research'], delivery: 'artifact-refs' },
    },
  ];
  def.spec.profile.topology.specialistSlots = [
    {
      id: 'slot-1',
      role: 'researcher',
      operationRefs: ['op-list-results'],
      requiredCapabilities: ['list-tool'],
      allowedVisibilityWindows: ['window-1'],
      maxBindings: 1,
      maxAssignments: 3,
      ...overrides,
    },
  ];
  return def;
}

test('a definition with no specialistSlots stays byte/behavior-identical (regression)', () => {
  const def = protocolDefinitionWithTwoOperations();
  const result = validateFlowDefinition(def);
  assert.equal(result.spec.profile.topology.specialistSlots, undefined);
});

test('accepts a well-formed CoordinationProtocol specialistSlots[] definition', () => {
  const def = withSpecialistSlot();
  const result = validateFlowDefinition(def);
  assert.deepEqual(result.spec.profile.topology.specialistSlots, [
    {
      id: 'slot-1',
      role: 'researcher',
      operationRefs: ['op-list-results'],
      requiredCapabilities: ['list-tool'],
      allowedVisibilityWindows: ['window-1'],
      maxBindings: 1,
      maxAssignments: 3,
    },
  ]);
  assert.ok(Object.isFrozen(result.spec.profile.topology.specialistSlots));
  assert.ok(Object.isFrozen(result.spec.profile.topology.specialistSlots[0]));
});

test('rejects a specialistSlots[] entry with an unknown field', () => {
  const def = withSpecialistSlot({ authorizedBy: 'driver' });
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/specialistSlots\[0\] has unknown field "authorizedBy"/),
  );
});

test('rejects a duplicate specialistSlots[] id', () => {
  const def = protocolDefinitionWithTwoOperations();
  def.spec.operations[1].capabilities = ['list-tool'];
  const slot = {
    role: 'researcher',
    operationRefs: ['op-list-results'],
    requiredCapabilities: ['list-tool'],
    allowedVisibilityWindows: [],
    maxBindings: 1,
    maxAssignments: 1,
  };
  def.spec.profile.topology.specialistSlots = [
    { id: 'slot-1', ...slot },
    { id: 'slot-1', ...slot },
  ];
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/specialistSlots carries duplicate slot id "slot-1"/),
  );
});

test("rejects a specialistSlots[] entry's role not declared in spec.roles", () => {
  const def = withSpecialistSlot({ role: 'ghost-role' });
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/specialistSlots\[0\]\.role "ghost-role" is not declared in spec\.roles/),
  );
});

test('rejects a dangling specialistSlots[].operationRefs[] entry', () => {
  const def = withSpecialistSlot({ operationRefs: ['no-such-op'] });
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/specialistSlots\[0\]\.operationRefs\[0\] "no-such-op" does not reference a declared spec\.operations\[\] id/),
  );
});

test('rejects a dangling specialistSlots[].requiredCapabilities[] entry', () => {
  const def = withSpecialistSlot({ requiredCapabilities: ['no-such-capability'] });
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/specialistSlots\[0\]\.requiredCapabilities\[0\] "no-such-capability" does not reference a capability declared on any spec\.operations\[\] entry/),
  );
});

test('rejects a dangling specialistSlots[].allowedVisibilityWindows[] entry', () => {
  const def = withSpecialistSlot({ allowedVisibilityWindows: ['no-such-window'] });
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/specialistSlots\[0\]\.allowedVisibilityWindows\[0\] "no-such-window" does not reference a declared spec\.profile\.topology\.visibilityWindows\[\] id/),
  );
});

test('rejects a non-positive-integer specialistSlots[].maxBindings', () => {
  for (const bad of [0, -1, 1.5, '2']) {
    const def = withSpecialistSlot({ maxBindings: bad });
    assert.throws(
      () => validateFlowDefinition(def),
      throwsFlowDefinitionError(/specialistSlots\[0\]\.maxBindings must be a positive integer/),
      `expected maxBindings ${JSON.stringify(bad)} to be rejected`,
    );
  }
});

test('rejects a non-positive-integer specialistSlots[].maxAssignments', () => {
  for (const bad of [0, -1, 1.5, '2']) {
    const def = withSpecialistSlot({ maxAssignments: bad });
    assert.throws(
      () => validateFlowDefinition(def),
      throwsFlowDefinitionError(/specialistSlots\[0\]\.maxAssignments must be a positive integer/),
      `expected maxAssignments ${JSON.stringify(bad)} to be rejected`,
    );
  }
});

test('rejects a Workflow-profile definition carrying spec.profile.topology.specialistSlots', () => {
  const def = minimalWorkflowDefinition({
    spec: {
      ...minimalWorkflowDefinition().spec,
      profile: {
        kind: 'Workflow',
        topology: {
          specialistSlots: [
            {
              id: 'slot-1',
              role: 'implementer',
              operationRefs: ['op-implement'],
              requiredCapabilities: [],
              allowedVisibilityWindows: [],
              maxBindings: 1,
              maxAssignments: 1,
            },
          ],
        },
      },
    },
  });
  assert.throws(() => validateFlowDefinition(def), throwsFlowDefinitionError(/spec\.profile has unknown field "topology"/));
});

test('rejects an explicit topology.edges[] entry naming a declared specialist slot id', () => {
  const fromDef = withSpecialistSlot();
  fromDef.spec.profile.topology.edges = [{ from: 'slot-1', to: 'actor-1' }];
  assert.throws(
    () => validateFlowDefinition(fromDef),
    throwsFlowDefinitionError(/topology\.edges\[0\]\.from "slot-1" references a declared specialist slot id -- slots are declarative capacity, never a routable topology edge endpoint/),
  );

  const toDef = withSpecialistSlot();
  toDef.spec.profile.topology.edges = [{ from: 'actor-1', to: 'slot-1' }];
  assert.throws(
    () => validateFlowDefinition(toDef),
    throwsFlowDefinitionError(/topology\.edges\[0\]\.to "slot-1" references a declared specialist slot id -- slots are declarative capacity, never a routable topology edge endpoint/),
  );
});

test('rejects a specialistSlots[].id colliding with a declared actor, role, operation, or graph node id', () => {
  const collisions = [
    ['actor-1', /specialistSlots\[0\]\.id "actor-1" collides with a declared spec\.actors\[\]\.id/],
    ['researcher', /specialistSlots\[0\]\.id "researcher" collides with a declared spec\.roles\[\]/],
    ['op-research', /specialistSlots\[0\]\.id "op-research" collides with a declared spec\.operations\[\]\.id/],
    ['phase-research', /specialistSlots\[0\]\.id "phase-research" collides with a declared spec\.graph\.nodes\[\]\.id/],
    ['window-1', /specialistSlots\[0\]\.id "window-1" collides with a declared spec\.profile\.topology\.visibilityWindows\[\]\.id/],
  ];
  for (const [id, pattern] of collisions) {
    const def = withSpecialistSlot({ id });
    assert.throws(() => validateFlowDefinition(def), throwsFlowDefinitionError(pattern), `expected slot id "${id}" to be rejected`);
  }
});

test('a legal edge between two real actors is NOT rejected as a slot reference -- slot ids are disjoint from the actor id space', () => {
  const def = withSpecialistSlot();
  def.spec.actors.push({ id: 'actor-2', role: 'researcher' });
  def.spec.profile.topology.edges = [{ from: 'actor-1', to: 'actor-2' }];
  const result = validateFlowDefinition(def);
  assert.deepEqual(result.spec.profile.topology.edges, [{ from: 'actor-1', to: 'actor-2' }]);
});

test("rejects a specialistSlots[] entry whose role differs from an operationRefs[] entry's own declared role", () => {
  const def = withSpecialistSlot();
  def.spec.roles.push('coordinator');
  def.spec.operations.push({ id: 'op-review', role: 'coordinator', result: { kind: 'advisory' } });
  def.spec.profile.topology.specialistSlots[0].operationRefs = ['op-review'];
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(
      /specialistSlots\[0\]\.operationRefs\[0\] "op-review" is declared for role "coordinator", but the slot declares role "researcher" -- a specialist of the slot's role could never be dispatched for it/,
    ),
  );
});

test('rejects an empty specialistSlots[].operationRefs -- a slot that may perform nothing bounds nothing', () => {
  const def = withSpecialistSlot({ operationRefs: [] });
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/specialistSlots\[0\]\.operationRefs must name at least one operation -- a slot that may perform nothing bounds nothing/),
  );
});

test('rejects a duplicate entry within one specialistSlots[].operationRefs', () => {
  const def = withSpecialistSlot({ operationRefs: ['op-list-results', 'op-list-results'] });
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/specialistSlots\[0\]\.operationRefs carries a duplicate entry -- each operation may appear at most once in one slot/),
  );
});

test('accepts empty requiredCapabilities[]/allowedVisibilityWindows[] -- an empty gate list means "no gate on that dimension", a decision distinct from operationRefs', () => {
  const def = withSpecialistSlot({ requiredCapabilities: [], allowedVisibilityWindows: [] });
  const result = validateFlowDefinition(def);
  assert.deepEqual(result.spec.profile.topology.specialistSlots[0].requiredCapabilities, []);
  assert.deepEqual(result.spec.profile.topology.specialistSlots[0].allowedVisibilityWindows, []);
});

test('a graph node operation binding referencing an undeclared specialist slot id as its actor stays statically closed (rejected as an unknown actor, no slot-expansion path)', () => {
  const def = protocolDefinitionWithTwoOperations();
  def.spec.graph.nodes[0].operations[0].actor = 'slot-ghost';
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/operations\[0\]\.actor "slot-ghost" does not reference a declared spec\.actors\[\] id/),
  );
});

// ---------------------------------------------------------------------------
// specialistSlotRef node-operation binding (Step 09 MVP9 P09.2 -- wiring a
// declared slot into the graph as an ALTERNATIVE to a static actor; runtime
// resolution is session-engine.mjs's job, this section is schema-shape only).
// ---------------------------------------------------------------------------

function withSpecialistSlotRefBinding(overrides = {}) {
  const def = withSpecialistSlot();
  // `withSpecialistSlot()`'s slot names `op-list-results` in its own
  // operationRefs[] -- bind exactly that operation, at the SAME node it is
  // already wired to, to a specialist slot instead of the static actor.
  def.spec.graph.nodes[0].operations[1] = {
    ref: 'op-list-results',
    specialistSlotRef: 'slot-1',
    activation: { mode: 'driver-authorized' },
    ...overrides,
  };
  return def;
}

test('accepts a node-operation binding filled by specialistSlotRef instead of actor', () => {
  const def = withSpecialistSlotRefBinding();
  const result = validateFlowDefinition(def);
  const binding = result.spec.graph.nodes[0].operations[1];
  assert.equal(binding.specialistSlotRef, 'slot-1');
  assert.equal(binding.actor, undefined);
  assert.equal(binding.activation.mode, 'driver-authorized');
});

test('rejects a node-operation binding declaring both actor and specialistSlotRef', () => {
  const def = withSpecialistSlot();
  def.spec.graph.nodes[0].operations[1] = {
    ref: 'op-list-results',
    actor: 'actor-1',
    specialistSlotRef: 'slot-1',
    activation: { mode: 'driver-authorized' },
  };
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(
      /operations\[1\] declares both "actor" and "specialistSlotRef" -- a binding is filled by a static actor OR an authorized specialist slot occupant, never both/,
    ),
  );
});

test('rejects a specialistSlotRef binding naming an undeclared specialist slot id', () => {
  const def = withSpecialistSlotRefBinding({ specialistSlotRef: 'ghost-slot' });
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/operations\[1\]\.specialistSlotRef "ghost-slot" does not reference a declared spec\.profile\.topology\.specialistSlots\[\] id/),
  );
});

test("rejects a specialistSlotRef binding naming an operation not among the slot's own operationRefs[]", () => {
  const def = withSpecialistSlot();
  // `op-research` is real, but "slot-1" only declares `op-list-results` in
  // its own operationRefs[] -- a specialist may act only on the slot's own
  // declared operations.
  def.spec.graph.nodes[0].operations[0] = {
    ref: 'op-research',
    specialistSlotRef: 'slot-1',
    activation: { mode: 'driver-authorized' },
  };
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(
      /operations\[0\]\.specialistSlotRef "slot-1" does not declare operation "op-research" among its own operationRefs\[\] -- a specialist may act only on the slot's own declared operations/,
    ),
  );
});

test('rejects a specialistSlotRef binding whose activation.mode is not driver-authorized (default omitted)', () => {
  const def = withSpecialistSlot();
  def.spec.graph.nodes[0].operations[1] = { ref: 'op-list-results', specialistSlotRef: 'slot-1' };
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(
      /operations\[1\] declares specialistSlotRef "slot-1" but activation\.mode is not "driver-authorized" -- an unknown specialist identity may only fill a binding a driver explicitly authorizes, never one materialized by default/,
    ),
  );
});

test('rejects a specialistSlotRef binding whose activation.mode is explicitly "required"', () => {
  const def = withSpecialistSlotRefBinding({ activation: { mode: 'required' } });
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/operations\[1\] declares specialistSlotRef "slot-1" but activation\.mode is not "driver-authorized"/),
  );
});

test('rejects specialistSlotRef under the Workflow profile', () => {
  const def = minimalWorkflowDefinition();
  def.spec.graph.nodes[0].operations[0] = { ref: 'op-implement', specialistSlotRef: 'slot-1', activation: { mode: 'driver-authorized' } };
  assert.throws(
    () => validateFlowDefinition(def),
    throwsFlowDefinitionError(/operations\[0\]\.specialistSlotRef is legal only under the CoordinationProtocol profile \(profile is "Workflow"\)/),
  );
});

test('a definition with no specialistSlotRef binding stays byte/behavior-identical (regression)', () => {
  const def = protocolDefinitionWithTwoOperations();
  const result = validateFlowDefinition(def);
  assert.equal(result.spec.graph.nodes[0].operations[1].specialistSlotRef, undefined);
  assert.equal(result.spec.graph.nodes[0].operations[1].actor, 'actor-1');
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
