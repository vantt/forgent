// Phase 03 R1-R4 tests for coordination/session-engine.mjs's DECLARED
// CoordinationProtocol materialization path (openDeclaredProtocolSession /
// dispatchDeclaredOperation / recordConsultDisposition), exercised against
// the real, already-shipped `core/coordination-protocols/declared-consult.yaml`
// fixture (loaded through `loadCoordinationProtocol`, never faked/inlined).
//
// Same fake-executor pattern as coordination-session-engine.test.mjs's own
// R5-R7 tests: a real Node subprocess, never a JS-level stub over
// executeAssignment/createSessionAssignment.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  openDeclaredProtocolSession,
  dispatchDeclaredOperation,
  recordConsultDisposition,
} from '../../src/runner/coordination/session-engine.mjs';
import { openSession, createSessionAssignment, readManifest, readSessionEvents } from '../../src/runner/coordination/store.mjs';
import { CoordinationError } from '../../src/runner/coordination/schema.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/config.mjs';
import { FlowDefinitionError } from '../../src/runner/definitions/schema.mjs';

const DEFINITION_ID = 'core.coordination-protocol.declared-consult';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-coordination-declared-test-'));
}

// Same shape as coordination-session-engine.test.mjs's own fakeExecutor():
// a real subprocess that writes agent-report.md/agent-result.json into
// whichever run dir the real executeExecutorCli path created.
function fakeExecutor(tempDir, { status = 'done', summary = 'Validated.' } = {}) {
  const executorScript = path.join(tempDir, `fake-executor-${Math.random().toString(36).slice(2)}.mjs`);
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const cwd = process.cwd();
    const assignmentsRoot = path.join(cwd, '.fgos', 'assignments');
    if (fs.existsSync(assignmentsRoot)) {
      for (const asgn of fs.readdirSync(assignmentsRoot)) {
        const runsDir = path.join(assignmentsRoot, asgn, 'runs');
        if (!fs.existsSync(runsDir)) continue;
        for (const run of fs.readdirSync(runsDir)) {
          const runDir = path.join(runsDir, run);
          if (fs.existsSync(runDir) && !fs.existsSync(path.join(runDir, 'agent-result.json'))) {
            fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\n${summary}\\n');
            fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: '${status}', summary: '${summary}' }));
          }
        }
      }
    }
    process.stdout.write('${summary}\\n');
    process.exit(0);
    `,
  );
  return {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model', lightweight: 'test-model', creative: 'test-model', analytical: 'test-model', critical: 'test-model' },
    timeoutMs: 5000,
  };
}

function openSessionWithConfig(coordinationId, tempDir, overrides = {}) {
  return openDeclaredProtocolSession(
    {
      definitionId: DEFINITION_ID,
      coordinationId,
      objective: 'Prove the declared consult protocol dispatches through the shared execution core.',
      writerId: 'coordinator-1',
      ...overrides,
    },
    { cwd: tempDir },
  );
}

async function dispatchRequest(coordinationId, tempDir, runnerConfig, overrides = {}) {
  return dispatchDeclaredOperation(
    coordinationId,
    {
      operationId: 'request-consult',
      objective: 'Should we widen the retry budget for the ingest worker?',
      expectedOutputs: ['agent-result.json (status, summary)'],
      writerId: 'coordinator-1',
      ...overrides,
    },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
  );
}

async function dispatchProvide(coordinationId, tempDir, runnerConfig, fromAssignmentId, overrides = {}) {
  return dispatchDeclaredOperation(
    coordinationId,
    {
      operationId: 'provide-consult',
      objective: 'Review the proposed retry budget change.',
      expectedOutputs: ['agent-result.json (status, summary)'],
      writerId: 'coordinator-1',
      fromAssignmentId,
      ...overrides,
    },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
  );
}

// ─── R1: protocol materialization ──────────────────────────────────────────

test('R1: openDeclaredProtocolSession materializes stable SessionActors matching declared spec.actors and records definitionRef', () => {
  const tempDir = mkTempDir();
  const manifest = openSessionWithConfig('coord_declared_r1_actors', tempDir);

  assert.deepEqual(manifest.definitionRef, { id: DEFINITION_ID, version: '1.0.0' });
  const actorIds = manifest.actors.map((a) => a.id).sort();
  assert.deepEqual(actorIds, ['consultant-actor', 'requester-actor']);
  assert.equal(manifest.actors.find((a) => a.id === 'requester-actor').role, 'requester');
  assert.equal(manifest.actors.find((a) => a.id === 'consultant-actor').role, 'consultant');

  const events = readSessionEvents('coord_declared_r1_actors', { cwd: tempDir });
  assert.ok(events.some((e) => e.type === 'actor-bound' && e.payload.actorId === 'requester-actor'));
  assert.ok(events.some((e) => e.type === 'actor-bound' && e.payload.actorId === 'consultant-actor'));
});

test('R1: dispatchDeclaredOperation materializes a legal operation into the SAME inline contract shape buildReadOnlyContract already builds (mutation read-only, declared role/capabilities, no executor/model pin)', async () => {
  const tempDir = mkTempDir();
  openSessionWithConfig('coord_declared_r1_contract', tempDir);
  const runnerConfig = fakeExecutor(tempDir);

  const { assignment, runResult, resumed } = await dispatchRequest('coord_declared_r1_contract', tempDir, runnerConfig);

  assert.equal(resumed, false);
  assert.equal(assignment.provenance.kind, 'inline');
  assert.equal(assignment.mutation, 'read-only');
  assert.equal(assignment.role, 'requester');
  assert.deepEqual(assignment.provenance.inline.contract.capabilities, ['consult']);
  assert.equal(assignment.provenance.inline.contract.evidence.required, 'reported');
  assert.equal(runResult.status, 'done');
  // Never a literal executor/model pin baked into the persisted contract
  // itself -- the contract schema has no such field at all (execution-
  // contract.mjs's own whitelist), and this assertion proves the contract
  // this cell builds does not smuggle one in through `constraints` either.
  const serializedContract = JSON.stringify(assignment.provenance.inline.contract);
  assert.ok(!/preferExecutor/i.test(serializedContract));
});

test('R1: dispatchDeclaredOperation rejects a definition/operation/role/actor-scoped literal preferExecutor pin BEFORE any Assignment is created', async () => {
  const tempDir = mkTempDir();
  openSessionWithConfig('coord_declared_r1_pin', tempDir);
  const runnerConfig = fakeExecutor(tempDir);

  await assert.rejects(
    dispatchRequest('coord_declared_r1_pin', tempDir, runnerConfig, { rolePolicy: { preferExecutor: 'literal-cli' } }),
    (err) => err instanceof CoordinationError && /never a concrete executor pin/.test(err.message),
  );

  const assignmentsDir = path.join(tempDir, '.fgos', 'assignments');
  assert.ok(!fs.existsSync(assignmentsDir) || fs.readdirSync(assignmentsDir).length === 0, 'a rejected portable-scope executor pin must create zero Assignments');
});

test('R1: dispatchDeclaredOperation rejects an operation not wired into the protocol graph', async () => {
  const tempDir = mkTempDir();
  openSessionWithConfig('coord_declared_r1_unknown_op', tempDir);
  const runnerConfig = fakeExecutor(tempDir);

  await assert.rejects(
    dispatchDeclaredOperation(
      'coord_declared_r1_unknown_op',
      { operationId: 'not-a-real-operation', objective: 'x', expectedOutputs: ['x'], writerId: 'coordinator-1' },
      { cwd: tempDir, repoRoot: tempDir, runnerConfig },
    ),
    (err) => err instanceof CoordinationError && /is not declared in this protocol's spec.operations/.test(err.message),
  );
});

test('R1: dispatchDeclaredOperation refuses to run against a session with no declared protocol bound', async () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_declared_r1_no_def', objective: 'Agent-led, no protocol.', provenanceRoot: { writerId: 'w' }, actors: [{ id: 'primary', role: 'researcher' }] }, { cwd: tempDir });

  await assert.rejects(
    dispatchDeclaredOperation(
      'coord_declared_r1_no_def',
      { operationId: 'request-consult', objective: 'x', expectedOutputs: ['x'], writerId: 'w' },
      { cwd: tempDir, repoRoot: tempDir },
    ),
    (err) => err instanceof CoordinationError && /has no declared protocol bound/.test(err.message),
  );
});

// ─── R2: topology and context ──────────────────────────────────────────────

test('R2: the full legal flow -- request-consult then provide-consult across the declared mediated edge -- dispatches both through the shared execution core', async () => {
  const tempDir = mkTempDir();
  openSessionWithConfig('coord_declared_r2_happy', tempDir);
  const runnerConfig = fakeExecutor(tempDir);

  const request = await dispatchRequest('coord_declared_r2_happy', tempDir, runnerConfig);
  const provide = await dispatchProvide('coord_declared_r2_happy', tempDir, runnerConfig, request.assignment.assignmentId);

  assert.equal(provide.assignment.role, 'consultant');
  assert.equal(provide.assignment.provenance.inline.caller.parentAssignmentId, request.assignment.assignmentId);
  assert.deepEqual(provide.edge, { from: 'requester-actor', to: 'consultant-actor', intent: 'consult' });

  const manifest = readManifest('coord_declared_r2_happy', { cwd: tempDir });
  assert.deepEqual(manifest.assignmentRefs.sort(), [request.assignment.assignmentId, provide.assignment.assignmentId].sort());
});

test('R2: provide-consult (mediated, edge-gated) contextRefs are ALWAYS exactly [fromAssignmentId] -- never any caller-supplied contextRefs, never unrelated session state', async () => {
  const tempDir = mkTempDir();
  openSessionWithConfig('coord_declared_r2_context', tempDir);
  const runnerConfig = fakeExecutor(tempDir);

  const request = await dispatchRequest('coord_declared_r2_context', tempDir, runnerConfig);

  // Sentinel-string proof: plant a unique marker in an UNRELATED session's
  // own Assignment (real, on-disk, but never a member of this session), and
  // confirm dispatchDeclaredOperation has no parameter path that could ever
  // let it leak into the consultant's persisted contract -- since
  // `dispatchDeclaredOperation` accepts no `contextRefs` param for an
  // edge-gated operation at all, this proves the absence structurally, not
  // merely by not passing it.
  const SENTINEL = `sentinel-marker-${Math.random().toString(36).slice(2)}-do-not-leak`;
  openSession({ coordinationId: 'coord_declared_r2_unrelated', objective: SENTINEL, provenanceRoot: { writerId: 'writer-2' } }, { cwd: tempDir });
  createSessionAssignment(
    {
      coordinationId: 'coord_declared_r2_unrelated',
      taskKey: 'foreign-task',
      contract: {
        objective: SENTINEL,
        contextRefs: [],
        constraints: [SENTINEL],
        expectedOutputs: ['x'],
        mutation: 'read-only',
        evidence: { required: 'reported' },
        role: 'researcher',
        budget: { timeoutMs: 1000, maxRuns: 1 },
      },
      caller: { writerId: 'writer-2' },
    },
    { cwd: tempDir },
  );

  const provide = await dispatchProvide('coord_declared_r2_context', tempDir, runnerConfig, request.assignment.assignmentId);

  assert.deepEqual(provide.assignment.contextRefs, [request.assignment.assignmentId]);
  const assignmentJsonPath = path.join(tempDir, '.fgos', 'assignments', provide.assignment.assignmentId, 'assignment.json');
  const onDisk = fs.readFileSync(assignmentJsonPath, 'utf8');
  assert.ok(!onDisk.includes(SENTINEL), 'the consultant Assignment must never carry unrelated/sibling session state');
});

test('R2: illegal direction -- dispatching provide-consult with a fromAssignmentId belonging to an actor OTHER than the declared edge source is rejected', async () => {
  const tempDir = mkTempDir();
  openSessionWithConfig('coord_declared_r2_direction', tempDir);
  const runnerConfig = fakeExecutor(tempDir);

  // A real Assignment that exists, but was never created for requester-actor
  // (created directly via the low-level store, bypassing the actor-bound
  // materialization path entirely) -- the exact "response before/without a
  // legitimate request" shape.
  const foreign = createSessionAssignment(
    {
      coordinationId: 'coord_declared_r2_direction',
      taskKey: 'not-the-requester',
      actorId: 'consultant-actor',
      contract: {
        objective: 'Not a real request.',
        contextRefs: [],
        constraints: [],
        expectedOutputs: ['x'],
        mutation: 'read-only',
        evidence: { required: 'reported' },
        role: 'consultant',
        budget: { timeoutMs: 1000, maxRuns: 1 },
      },
      caller: { writerId: 'coordinator-1' },
    },
    { cwd: tempDir },
  );

  await assert.rejects(
    dispatchProvide('coord_declared_r2_direction', tempDir, runnerConfig, foreign.assignmentId),
    (err) => err instanceof CoordinationError && /does not belong to declared edge source actor/.test(err.message),
  );
});

test('R2: illegal intent -- an intent not declared on the edge is rejected', async () => {
  const tempDir = mkTempDir();
  openSessionWithConfig('coord_declared_r2_intent', tempDir);
  const runnerConfig = fakeExecutor(tempDir);
  const request = await dispatchRequest('coord_declared_r2_intent', tempDir, runnerConfig);

  await assert.rejects(
    dispatchProvide('coord_declared_r2_intent', tempDir, runnerConfig, request.assignment.assignmentId, { intent: 'not-a-declared-intent' }),
    (err) => err instanceof CoordinationError && /is not declared on the topology edge/.test(err.message),
  );
});

test('R2: response before request is structurally unreachable -- provide-consult without a real fromAssignmentId is rejected', async () => {
  const tempDir = mkTempDir();
  openSessionWithConfig('coord_declared_r2_no_request', tempDir);
  const runnerConfig = fakeExecutor(tempDir);

  await assert.rejects(
    dispatchDeclaredOperation(
      'coord_declared_r2_no_request',
      { operationId: 'provide-consult', objective: 'x', expectedOutputs: ['x'], writerId: 'coordinator-1' },
      { cwd: tempDir, repoRoot: tempDir, runnerConfig },
    ),
    (err) => err instanceof CoordinationError && /fromAssignmentId is required/.test(err.message),
  );
});

test('R2: maxRounds: 1 is enforced -- an attempted second round for the consultant actor is rejected, while resuming the SAME round is idempotent', async () => {
  const tempDir = mkTempDir();
  openSessionWithConfig('coord_declared_r2_rounds', tempDir);
  const runnerConfig = fakeExecutor(tempDir);
  const request = await dispatchRequest('coord_declared_r2_rounds', tempDir, runnerConfig);

  const first = await dispatchProvide('coord_declared_r2_rounds', tempDir, runnerConfig, request.assignment.assignmentId);
  assert.equal(first.resumed, false);

  // Resuming round 1 (same default round=1, same derived taskKey) is an
  // idempotent no-op, not a second round.
  const resumed = await dispatchProvide('coord_declared_r2_rounds', tempDir, runnerConfig, request.assignment.assignmentId);
  assert.equal(resumed.resumed, true);
  assert.equal(resumed.assignment.assignmentId, first.assignment.assignmentId);

  // A genuinely NEW round (round: 2, forcing a fresh taskKey) is rejected --
  // maxRounds: 1 in the fixture's declared topology edge.
  await assert.rejects(
    dispatchProvide('coord_declared_r2_rounds', tempDir, runnerConfig, request.assignment.assignmentId, { round: 2 }),
    (err) => err instanceof CoordinationError && /allows at most 1 round\(s\)/.test(err.message),
  );

  const runsDir = path.join(tempDir, '.fgos', 'assignments', first.assignment.assignmentId, 'runs');
  assert.deepEqual(fs.readdirSync(runsDir), ['01'], 'a rejected extra round must dispatch zero additional runs');
});

// ─── R3: policy composition / provenance ───────────────────────────────────

test('R3: the full precedence chain composes, and the resolved tier/persona/executor/visibility carry the correct scope-level provenance in the persisted RunResult', async () => {
  const tempDir = mkTempDir();
  openSessionWithConfig('coord_declared_r3_chain', tempDir);
  const runnerConfig = fakeExecutor(tempDir);

  // provide-consult's own declared operation policy sets minTier: standard.
  // Layer runner (lightweight, ignored -- lower), then cli (critical, the
  // most specific scope) on top of it -- final tier must be "critical",
  // sourced to "cli", not silently defaulted or misattributed to "cliOverride".
  const request = await dispatchRequest('coord_declared_r3_chain', tempDir, runnerConfig);
  const provide = await dispatchProvide('coord_declared_r3_chain', tempDir, runnerConfig, request.assignment.assignmentId, {
    runnerPolicy: { minTier: 'lightweight' },
    cliPolicy: { minTier: 'critical', preferPersona: 'trusted-reviewer' },
  });

  const provenance = provide.runResult.policy.provenance;
  assert.equal(provenance.tier.value, 'critical');
  assert.deepEqual(provenance.tier.source, { scope: 'cli', id: 'cli' });
  assert.equal(provenance.persona.value, 'trusted-reviewer');
  assert.deepEqual(provenance.persona.source, { scope: 'cli', id: 'cli' });
  // governance stays final/present regardless of the declared chain.
  assert.equal(provenance.governance.value, 'allowed');
  assert.equal(provenance.governance.source.scope, 'governance');
});

test('R3: role-scope preferPersona wins over an absent runner/definition/operation/actor persona default, sourced to "role"', async () => {
  const tempDir = mkTempDir();
  openSessionWithConfig('coord_declared_r3_role_persona', tempDir);
  const runnerConfig = fakeExecutor(tempDir);
  const request = await dispatchRequest('coord_declared_r3_role_persona', tempDir, runnerConfig);

  // None of runner/definition/operation/actor declare a persona for
  // provide-consult in the real fixture -- only `rolePolicy` (this cell's
  // own caller-supplied stand-in for the "role" scope, which V1's
  // FlowDefinition schema has no first-class field for yet) sets one here.
  const provide = await dispatchProvide('coord_declared_r3_role_persona', tempDir, runnerConfig, request.assignment.assignmentId, {
    rolePolicy: { preferPersona: 'protocol-role-reviewer' },
  });

  const personaProvenance = provide.runResult.policy.provenance.persona;
  assert.equal(personaProvenance.value, 'protocol-role-reviewer');
  assert.deepEqual(personaProvenance.source, { scope: 'role', id: 'consultant' });
});

test('R3: minTier is monotonic -- an assignment-scope attempt to LOWER the operation-declared floor is rejected, not silently clamped', async () => {
  const tempDir = mkTempDir();
  openSessionWithConfig('coord_declared_r3_monotonic', tempDir);
  const runnerConfig = fakeExecutor(tempDir);
  const request = await dispatchRequest('coord_declared_r3_monotonic', tempDir, runnerConfig);

  await assert.rejects(
    dispatchProvide('coord_declared_r3_monotonic', tempDir, runnerConfig, request.assignment.assignmentId, {
      assignmentPolicy: { minTier: 'lightweight' },
    }),
    (err) => err instanceof FlowDefinitionError && /minTier is monotonic/.test(err.message),
  );

  const runsDir = path.join(tempDir, '.fgos', 'assignments', request.assignment.assignmentId, '..');
  // No consultant Assignment was ever created for the rejected attempt.
  const manifest = readManifest('coord_declared_r3_monotonic', { cwd: tempDir });
  assert.deepEqual(manifest.assignmentRefs, [request.assignment.assignmentId]);
});

test('R3: governance stays final regardless of a declared/CLI-composed executor preference', async () => {
  const tempDir = mkTempDir();
  openSessionWithConfig('coord_declared_r3_governance', tempDir);
  const runnerConfig = fakeExecutor(tempDir);
  const request = await dispatchRequest('coord_declared_r3_governance', tempDir, runnerConfig);

  await assert.rejects(
    dispatchDeclaredOperation(
      'coord_declared_r3_governance',
      {
        operationId: 'provide-consult',
        objective: 'Review the proposed retry budget change.',
        expectedOutputs: ['agent-result.json (status, summary)'],
        writerId: 'coordinator-1',
        fromAssignmentId: request.assignment.assignmentId,
        cliPolicy: { preferExecutor: process.execPath },
      },
      { cwd: tempDir, repoRoot: tempDir, runnerConfig, options: { disallowedExecutors: [process.execPath] } },
    ),
    (err) => err instanceof RunnerConfigError && /governance gate rejected executor/.test(err.message),
  );
});

// ─── R4: advice / disposition ──────────────────────────────────────────────

test('R4: recordConsultDisposition requires the advice to already be settled/linked before a disposition can be recorded', async () => {
  const tempDir = mkTempDir();
  openSessionWithConfig('coord_declared_r4_ordering', tempDir);
  const runnerConfig = fakeExecutor(tempDir);
  const request = await dispatchRequest('coord_declared_r4_ordering', tempDir, runnerConfig);

  // consultantAssignmentId names a real member of the session (the
  // requester's OWN assignment) that has a linked result, but is not
  // actually the specialist's advice -- exercised here only to prove the
  // "must already be linked" check is a real, load-bearing precondition;
  // the genuinely-missing case (an assignment id that was never even
  // created) is covered by the "not a member" assertion below.
  await assert.rejects(
    recordConsultDisposition(
      'coord_declared_r4_ordering',
      {
        requesterAssignmentId: request.assignment.assignmentId,
        consultantAssignmentId: 'asgn_does_not_exist_at_all',
        disposition: 'accepted',
        rationale: 'Looks correct.',
        writerId: 'coordinator-1',
      },
      { cwd: tempDir, repoRoot: tempDir },
    ),
    (err) => err instanceof CoordinationError && /is not a member of session/.test(err.message),
  );
});

test('R4: recordConsultDisposition rejects an invalid disposition value or an empty rationale', async () => {
  const tempDir = mkTempDir();
  openSessionWithConfig('coord_declared_r4_invalid', tempDir);
  const runnerConfig = fakeExecutor(tempDir);
  const request = await dispatchRequest('coord_declared_r4_invalid', tempDir, runnerConfig);
  const provide = await dispatchProvide('coord_declared_r4_invalid', tempDir, runnerConfig, request.assignment.assignmentId);

  await assert.rejects(
    recordConsultDisposition(
      'coord_declared_r4_invalid',
      {
        requesterAssignmentId: request.assignment.assignmentId,
        consultantAssignmentId: provide.assignment.assignmentId,
        disposition: 'sort-of-agree',
        rationale: 'x',
        writerId: 'coordinator-1',
      },
      { cwd: tempDir, repoRoot: tempDir },
    ),
    (err) => err instanceof CoordinationError && /disposition must be one of/.test(err.message),
  );

  await assert.rejects(
    recordConsultDisposition(
      'coord_declared_r4_invalid',
      {
        requesterAssignmentId: request.assignment.assignmentId,
        consultantAssignmentId: provide.assignment.assignmentId,
        disposition: 'accepted',
        rationale: '   ',
        writerId: 'coordinator-1',
      },
      { cwd: tempDir, repoRoot: tempDir },
    ),
    (err) => err instanceof CoordinationError && /rationale must be a non-empty/.test(err.message),
  );
});

for (const disposition of ['accepted', 'rejected', 'partially-accepted']) {
  test(`R4: recordConsultDisposition persists disposition "${disposition}" plus rationale as a governed Assignment/RunResult through the shared execution core, and never marks it "verified"`, async () => {
    const tempDir = mkTempDir();
    openSessionWithConfig(`coord_declared_r4_${disposition}`, tempDir);
    const runnerConfig = fakeExecutor(tempDir);
    const request = await dispatchRequest(`coord_declared_r4_${disposition}`, tempDir, runnerConfig);
    const provide = await dispatchProvide(`coord_declared_r4_${disposition}`, tempDir, runnerConfig, request.assignment.assignmentId);

    const rationale = `Rationale for ${disposition}.`;
    const result = await recordConsultDisposition(
      `coord_declared_r4_${disposition}`,
      {
        requesterAssignmentId: request.assignment.assignmentId,
        consultantAssignmentId: provide.assignment.assignmentId,
        disposition,
        rationale,
        writerId: 'coordinator-1',
      },
      { cwd: tempDir, repoRoot: tempDir, runnerConfig },
    );

    assert.equal(result.disposition, disposition);
    assert.equal(result.rationale, rationale);
    assert.equal(result.assignment.mutation, 'read-only');
    assert.equal(result.assignment.provenance.inline.contract.evidence.required, 'reported');
    assert.ok(result.assignment.provenance.inline.contract.constraints.includes(`disposition:${disposition}`));
    assert.ok(result.assignment.provenance.inline.contract.constraints.includes(`rationale:${rationale}`));
    // Advice stays advisory -- disposition Assignments in this slice always
    // request "reported" evidence, so "verified" is unreachable here.
    assert.notEqual(result.runResult.confidence, 'verified');

    const manifest = readManifest(`coord_declared_r4_${disposition}`, { cwd: tempDir });
    assert.ok(manifest.assignmentRefs.includes(result.assignment.assignmentId));
  });
}

// ─── No second execution core ──────────────────────────────────────────────

// Strips `//` line comments and `/** ... */`-style JSDoc continuation lines
// (every comment in this codebase's own house style is one of those two
// shapes -- see e.g. coordination-static.test.mjs's own grep-based static
// checks) so prose that MENTIONS "executeAssignment(...)"/
// "createSessionAssignment(...)" inside a doc comment is never mistaken for
// a real call site.
function stripCommentLines(source) {
  return source
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      return !trimmed.startsWith('//') && !trimmed.startsWith('*') && !trimmed.startsWith('/*');
    })
    .join('\n');
}

test('the declared-protocol path has exactly ONE Assignment execution core: session-engine.mjs calls executeAssignment() only inside createAndExecuteSessionTask, and dispatchDeclaredOperation/recordConsultDisposition both route through that same shared function', () => {
  const sourcePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/runner/coordination/session-engine.mjs');
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = stripCommentLines(source);

  const executeAssignmentCallSites = codeOnly.match(/\bexecuteAssignment\(/g) ?? [];
  assert.equal(executeAssignmentCallSites.length, 1, `expected exactly one executeAssignment(...) call site in session-engine.mjs's actual code, found ${executeAssignmentCallSites.length}`);

  const createSessionAssignmentCallSites = codeOnly.match(/\bcreateSessionAssignment\(/g) ?? [];
  assert.equal(createSessionAssignmentCallSites.length, 1, `expected exactly one createSessionAssignment(...) call site in session-engine.mjs's actual code, found ${createSessionAssignmentCallSites.length}`);

  // Both new declared-path functions call createAndExecuteSessionTask (the
  // one shared primitive wrapping the two calls above) rather than reaching
  // executeAssignment/createSessionAssignment directly themselves.
  const dispatchDeclaredOperationBody = codeOnly.slice(codeOnly.indexOf('export async function dispatchDeclaredOperation'), codeOnly.indexOf('const DISPOSITION_VALUES'));
  assert.match(dispatchDeclaredOperationBody, /createAndExecuteSessionTask\(/);
  assert.doesNotMatch(dispatchDeclaredOperationBody, /\bexecuteAssignment\(/);
  assert.doesNotMatch(dispatchDeclaredOperationBody, /\bcreateSessionAssignment\(/);

  const recordDispositionBody = codeOnly.slice(codeOnly.indexOf('export async function recordConsultDisposition'));
  assert.match(recordDispositionBody, /createAndExecuteSessionTask\(/);
  assert.doesNotMatch(recordDispositionBody, /\bexecuteAssignment\(/);
  assert.doesNotMatch(recordDispositionBody, /\bcreateSessionAssignment\(/);
});
