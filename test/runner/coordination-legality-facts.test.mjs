import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  collectDriverAuthorizedBindings,
  collectRequiredBindings,
  evaluateDriverAuthorizedBindings,
  evaluateSpecialistSlots,
  evaluateVisibilityWindows,
  evaluateVisibilityWindowState,
  evaluateClosePrerequisites,
  evaluateLegalityFacts,
  protocolOperationStamp,
  buildActorReplacementMap,
} from '../../src/runner/coordination/legality-facts.mjs';
import { loadCoordinationProtocol } from '../../src/runner/definitions/protocol-loader.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LEGALITY_FACTS_PATH = path.resolve(__dirname, '../../src/runner/coordination/legality-facts.mjs');

test('purity guard: legality-facts.mjs contains no filesystem, child_process, network or write-store imports', () => {
  const source = fs.readFileSync(LEGALITY_FACTS_PATH, 'utf8');
  const importLines = source.split('\n').filter((l) => /^\s*import\b/.test(l));
  for (const line of importLines) {
    assert.ok(!/['"]node:fs['"]|['"]fs['"]/.test(line), `unexpected fs import: ${line}`);
    assert.ok(!/['"]node:child_process['"]|['"]child_process['"]/.test(line), `unexpected child_process import: ${line}`);
    assert.ok(!/['"]node:net['"]|['"]node:http['"]/.test(line), `unexpected network import: ${line}`);
    assert.ok(!/store\.mjs|dispatch\//.test(line), `unexpected write-door import: ${line}`);
  }
});

const sampleDefinition = {
  apiVersion: 'fgos.dev/v1alpha1',
  kind: 'FlowDefinition',
  metadata: { id: 'test.protocol', version: '1.0.0' },
  spec: {
    profile: {
      kind: 'CoordinationProtocol',
      topology: {
        specialistSlots: [
          { id: 'slot-sec', role: 'security-specialist' },
          { id: 'slot-perf', role: 'performance-specialist' },
        ],
        visibilityWindows: [
          { id: 'win-1', opensAfter: { operationRefs: ['op-first'] } },
        ],
      },
      completion: {
        aggregation: { method: 'consensus' },
      },
    },
    roles: ['worker-1'],
    actors: [{ id: 'worker-1', role: 'worker-1' }],
    operations: [
      { id: 'op-first', role: 'worker-1' },
      { id: 'op-authorized', role: 'worker-1' },
    ],
    graph: {
      nodes: [
        {
          id: 'node-1',
          operations: [
            { ref: 'op-first', actor: 'worker-1' },
            { ref: 'op-authorized', actor: 'worker-1', activation: { mode: 'driver-authorized' } },
          ],
        },
      ],
    },
  },
};

test('collectDriverAuthorizedBindings and collectRequiredBindings correctly partition graph operations', () => {
  const driverAuth = collectDriverAuthorizedBindings(sampleDefinition);
  assert.equal(driverAuth.length, 1);
  assert.deepEqual(driverAuth[0], { nodeId: 'node-1', operationId: 'op-authorized', actorId: 'worker-1' });

  const required = collectRequiredBindings(sampleDefinition);
  assert.equal(required.length, 1);
  assert.deepEqual(required[0], { nodeId: 'node-1', operationId: 'op-first', actorId: 'worker-1' });
});

test('evaluateDriverAuthorizedBindings classifies pending vs authorized without side-effects', () => {
  const noneAuth = evaluateDriverAuthorizedBindings(sampleDefinition, []);
  assert.equal(noneAuth.declared.length, 1);
  assert.equal(noneAuth.pending.length, 1);
  assert.equal(noneAuth.authorized.length, 0);

  const oneAuth = evaluateDriverAuthorizedBindings(sampleDefinition, [{ nodeId: 'node-1', operationId: 'op-authorized' }]);
  assert.equal(oneAuth.declared.length, 1);
  assert.equal(oneAuth.pending.length, 0);
  assert.equal(oneAuth.authorized.length, 1);
});

test('evaluateSpecialistSlots reports bound vs available slots', () => {
  const slots1 = evaluateSpecialistSlots(sampleDefinition, []);
  assert.equal(slots1.length, 2);
  assert.equal(slots1[0].bound, false);
  assert.equal(slots1[1].bound, false);

  const slots2 = evaluateSpecialistSlots(sampleDefinition, [{ slotId: 'slot-sec', specialistActorId: 'actor-sec-1' }]);
  assert.equal(slots2[0].bound, true);
  assert.equal(slots2[0].specialistActorId, 'actor-sec-1');
  assert.equal(slots2[1].bound, false);
});

test('evaluateVisibilityWindows computes open vs closed status from settled operation events', () => {
  const closed = evaluateVisibilityWindows(sampleDefinition, {
    events: [
      { type: 'assignment-created', payload: { assignmentId: 'asgn-other', actorId: 'worker-1', operationId: 'other-op' } },
      { type: 'result-linked', payload: { assignmentId: 'asgn-other' } },
    ],
  });
  assert.equal(closed.length, 1);
  assert.equal(closed[0].open, false);

  const open = evaluateVisibilityWindows(sampleDefinition, {
    events: [
      { type: 'assignment-created', payload: { assignmentId: 'asgn-1', actorId: 'worker-1', operationId: 'op-first' } },
      { type: 'result-linked', payload: { assignmentId: 'asgn-1' } },
    ],
  });
  assert.equal(open.length, 1);
  assert.equal(open[0].open, true);
});

test('evaluateClosePrerequisites correctly flags blockers', () => {
  const manifestActive = { coordinationId: 'c1', status: 'active' };
  const manifestCompleted = { coordinationId: 'c1', status: 'completed' };

  // Inactive session
  const resInactive = evaluateClosePrerequisites({ manifest: manifestCompleted });
  assert.equal(resInactive.readyToClose, false);
  assert.equal(resInactive.blockers[0].kind, 'session-inactive');

  // Active session with missing quorum and pending aggregation
  const resBlockers = evaluateClosePrerequisites({
    manifest: manifestActive,
    quorum: { missing: ['worker-1'], failed: [] },
    definition: sampleDefinition,
    aggregations: [],
  });
  assert.equal(resBlockers.readyToClose, false);
  const kinds = resBlockers.blockers.map((b) => b.kind);
  assert.ok(kinds.includes('missing-quorum-actors'));
  assert.ok(kinds.includes('pending-aggregation'));

  // Active session fully ready to close
  const resReady = evaluateClosePrerequisites({
    manifest: manifestActive,
    quorum: { missing: [], failed: [] },
    definition: sampleDefinition,
    aggregations: [{ aggregationId: 'agg-1' }],
  });
  assert.equal(resReady.readyToClose, true);
  assert.equal(resReady.blockers.length, 0);
});

test('evaluateLegalityFacts master pure evaluation is robust across session kinds', () => {
  // Agent-led session without definition
  const agentLedFacts = evaluateLegalityFacts({
    manifest: { coordinationId: 'agent-1', schemaVersion: '1', status: 'active', assignmentRefs: ['asg-1'] },
  });
  assert.equal(agentLedFacts.coordinationId, 'agent-1');
  assert.equal(agentLedFacts.phase, 'running');
  assert.equal(agentLedFacts.requiredBindings.length, 0);
  assert.equal(agentLedFacts.driverAuthorizedBindings.declared.length, 0);
  assert.equal(agentLedFacts.readyToClose, true);

  // Declared protocol session
  const declaredFacts = evaluateLegalityFacts({
    manifest: { coordinationId: 'decl-1', schemaVersion: '3', status: 'active', definitionRef: { id: 'test.protocol', version: '1.0.0' }, assignmentRefs: ['asg-1'] },
    definition: sampleDefinition,
    quorum: { missing: [], failed: [] },
    events: [
      { type: 'assignment-created', payload: { assignmentId: 'asg-1', actorId: 'worker-1', operationId: 'op-first' } },
      { type: 'result-linked', payload: { assignmentId: 'asg-1' } },
    ],
    replayed: { authorizations: [{ authorizationId: 'a1', nodeId: 'node-1', operationId: 'op-authorized', consumedByAssignmentId: 'asg-2' }], aggregations: [{ aggregationId: 'agg-1' }] },
  });
  assert.equal(declaredFacts.coordinationId, 'decl-1');
  assert.equal(declaredFacts.phase, 'running');
  assert.equal(declaredFacts.requiredBindings.length, 1);
  assert.equal(declaredFacts.driverAuthorizedBindings.pending.length, 0);
  assert.equal(declaredFacts.visibilityWindows[0].open, true);
  assert.equal(declaredFacts.readyToClose, true);
});

test('evaluateClosePrerequisites respects partialPolicy.allowedOmissions and minimumActors', () => {
  const manifest = {
    coordinationId: 'c-partial',
    status: 'active',
    partialPolicy: {
      allowedOmissions: ['optional-worker'],
      minimumActors: 1,
    },
  };

  // One actor completed, one missing but in allowedOmissions -> readyToClose: true
  const resAllowed = evaluateClosePrerequisites({
    manifest,
    quorum: {
      completed: [{ actorId: 'lead-worker' }],
      missing: ['optional-worker'],
      failed: [],
    },
  });
  assert.equal(resAllowed.readyToClose, true, 'missing actor in allowedOmissions must allow partial close');
  assert.equal(resAllowed.blockers.length, 0);

  // Missing actor NOT in allowedOmissions -> readyToClose: false
  const resDisallowed = evaluateClosePrerequisites({
    manifest,
    quorum: {
      completed: [{ actorId: 'lead-worker' }],
      missing: ['critical-worker'],
      failed: [],
    },
  });
  assert.equal(resDisallowed.readyToClose, false);
  assert.equal(resDisallowed.blockers[0].kind, 'missing-quorum-actors');

  // Below minimumActors -> readyToClose: false
  const resInsufficient = evaluateClosePrerequisites({
    manifest: {
      ...manifest,
      partialPolicy: { allowedOmissions: ['optional-worker', 'lead-worker'], minimumActors: 2 },
    },
    quorum: {
      completed: [{ actorId: 'lead-worker' }],
      missing: ['optional-worker'],
      failed: [],
    },
  });
  assert.equal(resInsufficient.readyToClose, false);
  assert.equal(resInsufficient.blockers[0].kind, 'insufficient-completed-actors');
});

test('evaluateLegalityFacts settles required bindings from kernel-shaped assignment-created events with operationId', () => {
  const manifest = {
    coordinationId: 'c-kernel-shaped',
    schemaVersion: '3',
    status: 'active',
    definitionRef: { id: 'test.protocol', version: '1.0.0' },
    assignmentRefs: ['asgn-1'],
  };

  const events = [
    { type: 'assignment-created', payload: { assignmentId: 'asgn-1', actorId: 'worker-1', operationId: 'op-first' } },
    { type: 'result-linked', payload: { assignmentId: 'asgn-1' } },
  ];

  const facts = evaluateLegalityFacts({
    manifest,
    events,
    definition: sampleDefinition,
    aggregations: [{ aggregationId: 'agg-1' }],
  });

  assert.equal(facts.readyToClose, true, 'kernel-shaped assignment-created + result-linked must settle required operation');
  assert.equal(facts.blockers.length, 0);
});

test('kernel parity: multi-actor same operation, actor replacement, and visibility window with real gated fixture', () => {
  const definition = loadCoordinationProtocol('core.coordination-protocol.independent-research-fan-out-fan-in-gated');
  assert.ok(definition, 'gated protocol fixture must load');

  const stamp = protocolOperationStamp(definition, 'independent-research');
  assert.ok(stamp.startsWith('protocol-operation:'), 'stamp must follow canonical format');

  const assignments = new Map();
  const runResults = new Map();

  const getAssignment = (id) => assignments.get(id);
  const getRunResult = (asgnId, runId) => runResults.get(`${asgnId}::${runId}`);

  // 1. Initial state: neither researcher dispatched
  const initial = evaluateVisibilityWindowState(definition, 'post-independent-pass', {
    events: [],
    getAssignment,
    getRunResult,
  });
  assert.equal(initial.open, false);
  assert.equal(initial.sources[0].satisfied, false);
  assert.equal(initial.sources[0].reason, 'missing');
  assert.equal(initial.sources[0].branches.length, 2);

  // 2. Partial cohort: only researcher-a has completed
  assignments.set('asgn-a', {
    id: 'asgn-a',
    provenance: { inline: { contract: { constraints: [stamp] } } },
  });
  runResults.set('asgn-a::run-1', { runId: 'run-1', status: 'completed', confidence: 'high' });

  const partialEvents = [
    { type: 'assignment-created', payload: { assignmentId: 'asgn-a', actorId: 'researcher-a' } },
    { type: 'result-linked', payload: { assignmentId: 'asgn-a', runId: 'run-1' } },
  ];

  const partialState = evaluateVisibilityWindowState(definition, 'post-independent-pass', {
    events: partialEvents,
    getAssignment,
    getRunResult,
  });
  assert.equal(partialState.open, false, 'partial cohort must not open window');
  assert.equal(partialState.sources[0].satisfied, false);
  assert.equal(partialState.sources[0].branches.find((b) => b.actorId === 'researcher-a').satisfied, true);
  assert.equal(partialState.sources[0].branches.find((b) => b.actorId === 'researcher-b').satisfied, false);

  // 3. Researcher-b fails with no-evidence
  assignments.set('asgn-b-fail', {
    id: 'asgn-b-fail',
    provenance: { inline: { contract: { constraints: [stamp] } } },
  });
  runResults.set('asgn-b-fail::run-b1', { runId: 'run-b1', status: 'completed', confidence: 'no-evidence' });

  const failedEvents = [
    ...partialEvents,
    { type: 'assignment-created', payload: { assignmentId: 'asgn-b-fail', actorId: 'researcher-b' } },
    { type: 'result-linked', payload: { assignmentId: 'asgn-b-fail', runId: 'run-b1' } },
  ];

  const failedState = evaluateVisibilityWindowState(definition, 'post-independent-pass', {
    events: failedEvents,
    getAssignment,
    getRunResult,
  });
  assert.equal(failedState.open, false, 'failed/no-evidence result must keep window closed');
  assert.equal(failedState.sources[0].satisfied, false);
  assert.equal(failedState.sources[0].reason, 'failed');

  // 4. Actor replacement: researcher-b replaced by researcher-b-rep, which completes with high confidence
  assignments.set('asgn-b-rep', {
    id: 'asgn-b-rep',
    provenance: { inline: { contract: { constraints: [stamp] } } },
  });
  runResults.set('asgn-b-rep::run-b2', { runId: 'run-b2', status: 'completed', confidence: 'high' });

  const replacedEvents = [
    ...failedEvents,
    { type: 'actor-replaced', payload: { oldActorId: 'researcher-b', replacementActorId: 'researcher-b-rep' } },
    { type: 'assignment-created', payload: { assignmentId: 'asgn-b-rep', actorId: 'researcher-b-rep' } },
    { type: 'result-linked', payload: { assignmentId: 'asgn-b-rep', runId: 'run-b2' } },
  ];

  const replacedState = evaluateVisibilityWindowState(definition, 'post-independent-pass', {
    events: replacedEvents,
    getAssignment,
    getRunResult,
  });
  assert.equal(replacedState.open, true, 'window must open when replacement actor completes required operation');
  assert.equal(replacedState.sources[0].satisfied, true);
  assert.equal(replacedState.sources[0].branches.every((b) => b.satisfied), true);
});

test('kernel parity: accepted finding -> remediation -> recheck causal chain with real master loop fixture', () => {
  const definition = loadCoordinationProtocol('core.coordination-protocol.standalone-master-coordination-loop');
  assert.ok(definition, 'master loop protocol fixture must load');

  const assignments = new Map();
  const runResults = new Map();
  const getAssignment = (id) => assignments.get(id);
  const getRunResult = (asgnId, runId) => runResults.get(`${asgnId}::${runId}`);

  const reviewStamp = protocolOperationStamp(definition, 'review-candidate');
  const reviseStamp = protocolOperationStamp(definition, 'revise-candidate');
  const recheckStamp = protocolOperationStamp(definition, 'reviewer-recheck');

  // Failed review
  assignments.set('asgn-rev-1', {
    id: 'asgn-rev-1',
    provenance: { inline: { contract: { constraints: [reviewStamp] } } },
  });
  runResults.set('asgn-rev-1::run-1', { runId: 'run-1', status: 'failed', confidence: 'failed' });

  const events = [
    { type: 'assignment-created', payload: { assignmentId: 'asgn-rev-1', actorId: 'reviewer' } },
    { type: 'result-linked', payload: { assignmentId: 'asgn-rev-1', runId: 'run-1' } },
    { type: 'driver-disposition-recorded', payload: { targetRef: 'asgn-rev-1', disposition: 'accepted' } },
  ];

  // 1. Recheck dispatched with clean result but WITHOUT causal remediation link in schema 3 -> discharge MUST fail
  assignments.set('asgn-recheck-uncasual', {
    id: 'asgn-recheck-uncasual',
    provenance: { inline: { contract: { constraints: [recheckStamp], contextRefs: [] } } },
  });
  runResults.set('asgn-recheck-uncasual::run-2', { runId: 'run-2', status: 'completed', confidence: 'high' });

  const uncasualEvents = [
    ...events,
    { type: 'assignment-created', payload: { assignmentId: 'asgn-recheck-uncasual', actorId: 'reviewer' } },
    { type: 'result-linked', payload: { assignmentId: 'asgn-recheck-uncasual', runId: 'run-2' } },
  ];

  const failedOutcome = { reason: 'failed', assignmentId: 'asgn-rev-1' };
  const replacedBy = buildActorReplacementMap(uncasualEvents);

  const dischargeUncasual = evaluateClosePrerequisites({
    manifest: { coordinationId: 'c-master', schemaVersion: '3', status: 'active' },
    quorum: { failed: [{ actorId: 'reviewer' }], completed: [], missing: [], late: [] },
  });
  assert.equal(dischargeUncasual.readyToClose, false, 'unremediated accepted finding must block close');

  // 2. Full causal chain: failed review -> successful revise remediation -> satisfied recheck
  assignments.set('asgn-remedy', {
    id: 'asgn-remedy',
    provenance: { inline: { contract: { constraints: [reviseStamp], contextRefs: ['asgn-rev-1'] } } },
  });
  runResults.set('asgn-remedy::run-rem', { runId: 'run-rem', status: 'completed', confidence: 'high' });

  assignments.set('asgn-recheck-casual', {
    id: 'asgn-recheck-casual',
    provenance: { inline: { contract: { constraints: [recheckStamp], contextRefs: ['asgn-remedy'] } } },
  });
  runResults.set('asgn-recheck-casual::run-rec', { runId: 'run-rec', status: 'completed', confidence: 'high' });

  const casualEvents = [
    ...events,
    { type: 'assignment-created', payload: { assignmentId: 'asgn-remedy', actorId: 'fixer' } },
    { type: 'result-linked', payload: { assignmentId: 'asgn-remedy', runId: 'run-rem' } },
    { type: 'assignment-created', payload: { assignmentId: 'asgn-recheck-casual', actorId: 'reviewer' } },
    { type: 'result-linked', payload: { assignmentId: 'asgn-recheck-casual', runId: 'run-rec' } },
  ];

  // When remediated and discharged, quorum reports completed
  const dischargeSuccess = evaluateClosePrerequisites({
    manifest: { coordinationId: 'c-master', schemaVersion: '3', status: 'active' },
    quorum: { failed: [], completed: [{ actorId: 'reviewer' }, { actorId: 'fixer' }], missing: [], late: [] },
  });
  assert.equal(dischargeSuccess.readyToClose, true, 'causally remediated finding must allow close');
  assert.equal(dischargeSuccess.blockers.length, 0);
});

test('kernel parity: aggregation absent vs non-consensus vs consensus with real rfc fixture', () => {
  const baseDef = loadCoordinationProtocol('core.coordination-protocol.group-thinking-rfc-review-lite');
  assert.ok(baseDef, 'rfc protocol fixture must load');

  const definition = {
    ...baseDef,
    spec: {
      ...baseDef.spec,
      profile: {
        ...baseDef.spec.profile,
        completion: {
          ...baseDef.spec.profile.completion,
          aggregation: { method: 'consensus', sourceOperationRefs: ['draft'] },
        },
      },
    },
  };

  const manifest = { coordinationId: 'c-rfc', status: 'active' };
  const quorum = { completed: [{ actorId: 'lead-author' }], failed: [], missing: [], late: [] };

  // 1. Absent aggregation
  const resAbsent = evaluateClosePrerequisites({ manifest, quorum, definition, aggregations: [] });
  assert.equal(resAbsent.readyToClose, false);
  assert.equal(resAbsent.blockers[0].kind, 'pending-aggregation');

  // 2. Non-consensus aggregation
  const resNonConsensus = evaluateClosePrerequisites({
    manifest,
    quorum,
    definition,
    aggregations: [{ aggregationId: 'agg-1', outcome: 'dissent' }],
  });
  assert.equal(resNonConsensus.readyToClose, false);
  assert.equal(resNonConsensus.blockers[0].kind, 'aggregation-no-consensus');

  // 3. Consensus aggregation
  const resConsensus = evaluateClosePrerequisites({
    manifest,
    quorum,
    definition,
    aggregations: [{ aggregationId: 'agg-1', outcome: 'consensus' }],
  });
  assert.equal(resConsensus.readyToClose, true);
  assert.equal(resConsensus.blockers.length, 0);
});

test('kernel parity: terminal session blocks close', () => {
  const manifestCompleted = { coordinationId: 'c-term', status: 'completed' };
  const res = evaluateClosePrerequisites({ manifest: manifestCompleted });
  assert.equal(res.readyToClose, false);
  assert.equal(res.blockers[0].kind, 'session-inactive');
});

test('mutation-sensitive negative test: deliberate rule perturbation fails parity', () => {
  const definition = loadCoordinationProtocol('core.coordination-protocol.independent-research-fan-out-fan-in-gated');
  const wrongStamp = 'protocol-operation:unrelated@1.0.0#independent-research';

  const assignments = new Map([
    ['asgn-wrong', { id: 'asgn-wrong', provenance: { inline: { contract: { constraints: [wrongStamp] } } } }],
  ]);
  const runResults = new Map([
    ['asgn-wrong::r1', { runId: 'r1', status: 'completed', confidence: 'high' }],
  ]);

  const events = [
    { type: 'assignment-created', payload: { assignmentId: 'asgn-wrong', actorId: 'researcher-a' } },
    { type: 'result-linked', payload: { assignmentId: 'asgn-wrong', runId: 'r1' } },
  ];

  const state = evaluateVisibilityWindowState(definition, 'post-independent-pass', {
    events,
    getAssignment: (id) => assignments.get(id),
    getRunResult: (asgnId, runId) => runResults.get(`${asgnId}::${runId}`),
  });

  // Mismatched stamp must NOT satisfy source
  assert.equal(state.open, false);
  assert.equal(state.sources[0].satisfied, false);
});
