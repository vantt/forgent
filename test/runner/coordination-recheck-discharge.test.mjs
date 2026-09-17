// Coordination quorum-close recheck-discharge fix: a required gating operation
// (`actorGatingOperationIds`'s multi-operation-aware path,
// `classifySessionQuorum`, session-engine.mjs) that settles `failed` (e.g. a
// review/red-team `findings` verdict, `run-result.mjs`'s
// `assessment.findings -> legacy status "failed"`) used to fail that gating
// slot PERMANENTLY -- no later driver-authorized recheck of a DIFFERENT
// operation id could ever un-stick it, so a fix-round loop
// (`revise-candidate`/`reviewer-recheck`/`red-team-recheck`, exactly
// `standalone-master-coordination-loop.yaml`'s own shape) could never reach a
// closed session once the required first pass reported ANY finding.
//
// `rechecks` (a graph-binding field, definitions/schema.mjs) plus
// `resolveRecheckDischarge` (session-engine.mjs) let a LATER, driver-authorized,
// satisfied recheck of the SAME actor discharge a failed gating slot -- but
// only when the driver has ALSO recorded an explicit
// `driver-disposition-recorded` event against the specific failed assignment.
// Same project-tier-fixture-at-the-quorum-mechanism-level harness as
// P10-KERNEL-FIX's `multiOpQuorumDefinition`/`setupMultiOpQuorumFixture` in
// coordination-recovery-and-quorum.test.mjs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  openDeclaredProtocolSession,
  dispatchDeclaredOperation,
  authorizeDeclaredOperation,
  evaluateSessionQuorum,
  closeSessionByQuorum,
} from '../../src/runner/coordination/session-engine.mjs';
import { recordDriverDisposition } from '../../src/runner/coordination/store.mjs';
import { CoordinationError } from '../../src/runner/coordination/schema.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-recheck-discharge-test-'));
}

// Same real-subprocess-executor pattern every coordination test in this repo
// uses -- never a JS-level stub of executeAssignment -- but this one's
// `status` is CONTROLLABLE per call, since these tests need a genuinely
// `failed` first-pass attempt.
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
    models: { standard: 'test-model', flagship: 'test-model' },
    timeoutMs: 5000,
  };
}

// `declareRechecks: true` mirrors `red-team-recheck`'s real
// `rechecks: red-team-candidate` binding; `false` mirrors a plain,
// undeclared driver-authorized recheck (this repo's shape BEFORE this fix,
// and still the shape for any protocol that never opts in).
function rechecksFixtureDefinition({ declareRechecks }) {
  const rechecksField = declareRechecks ? { rechecks: 'candidate' } : {};
  return {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: `test.coordination-protocol.recheck-discharge-${declareRechecks ? 'declared' : 'undeclared'}`, version: '1.0.0' },
    spec: {
      profile: { kind: 'CoordinationProtocol' },
      roles: ['red-team'],
      actors: [{ id: 'red-team', role: 'red-team' }],
      operations: [
        { id: 'candidate', role: 'red-team', result: { kind: 'advisory', evidenceRequired: 'reported' } },
        { id: 'recheck', role: 'red-team', result: { kind: 'advisory', evidenceRequired: 'reported' } },
      ],
      graph: {
        entry: 'phase-first-pass',
        nodes: [
          { id: 'phase-first-pass', operations: [{ ref: 'candidate', actor: 'red-team' }], transitions: ['phase-recheck'] },
          {
            id: 'phase-recheck',
            operations: [{ ref: 'recheck', actor: 'red-team', activation: { mode: 'driver-authorized' }, ...rechecksField }],
            transitions: [],
          },
        ],
      },
    },
  };
}

function setupFixture(coordinationId, { declareRechecks = true } = {}) {
  const tempDir = mkTempDir();
  const dir = path.join(tempDir, '.fgos', 'coordination-protocols');
  fs.mkdirSync(dir, { recursive: true });
  const definition = rechecksFixtureDefinition({ declareRechecks });
  fs.writeFileSync(path.join(dir, `recheck-discharge-${declareRechecks ? 'declared' : 'undeclared'}.json`), `${JSON.stringify(definition, null, 2)}\n`);
  openDeclaredProtocolSession(
    { definitionId: definition.metadata.id, coordinationId, objective: 'Recheck-discharge quorum fixture.', writerId: 'writer-1' },
    { cwd: tempDir },
  );
  return { tempDir, opts: { cwd: tempDir, repoRoot: tempDir } };
}

async function dispatchCandidate(coordinationId, ctx, { status }) {
  return dispatchDeclaredOperation(
    coordinationId,
    { operationId: 'candidate', targetActorId: 'red-team', objective: 'The required first pass.', expectedOutputs: ['agent-result.json (status, summary)'], writerId: 'writer-1' },
    { ...ctx.opts, runnerConfig: fakeExecutor(ctx.tempDir, { status }) },
  );
}

async function authorizeAndDispatchRecheck(coordinationId, ctx, { authorizationId, invocationKey, status }) {
  await authorizeDeclaredOperation(
    coordinationId,
    { operationId: 'recheck', targetActorId: 'red-team', authorizationId, invocationKey, authorizedBy: { type: 'driver', id: 'writer-1' }, reason: 'Recheck the accepted finding.', grantedContextRefs: [] },
    ctx.opts,
  );
  return dispatchDeclaredOperation(
    coordinationId,
    { operationId: 'recheck', targetActorId: 'red-team', objective: 'The recheck.', expectedOutputs: ['agent-result.json (status, summary)'], writerId: 'writer-1' },
    { ...ctx.opts, runnerConfig: fakeExecutor(ctx.tempDir, { status }) },
  );
}

// ─── Happy path ─────────────────────────────────────────────────────────────

test('a failed required first pass, dispositioned then satisfied-recheck, discharges the gating slot and closes the session', async () => {
  const coordinationId = 'coord_recheck_discharge_happy';
  const ctx = setupFixture(coordinationId);

  const candidate = await dispatchCandidate(coordinationId, ctx, { status: 'failed' });

  const beforeDisposition = evaluateSessionQuorum(coordinationId, ctx.opts);
  assert.deepEqual(beforeDisposition.failed.map((x) => x.actorId), ['red-team'], 'a failed first pass with no disposition and no recheck yet must report failed, not completed');

  recordDriverDisposition(
    coordinationId,
    { targetRef: candidate.assignment.assignmentId, disposition: 'accepted', rationale: 'Finding accepted; fixed and rechecked.', evidenceRefs: [], authorizedBy: { type: 'driver', id: 'writer-1' } },
    ctx.opts,
  );
  const rechecked = await authorizeAndDispatchRecheck(coordinationId, ctx, { authorizationId: 'auth_recheck_1', invocationKey: 'recheck:1', status: 'done' });

  const afterRecheck = evaluateSessionQuorum(coordinationId, ctx.opts);
  assert.deepEqual(afterRecheck.failed, [], 'a satisfied, dispositioned recheck must discharge the failed slot');
  assert.deepEqual(afterRecheck.completed, [
    { actorId: 'red-team', assignmentId: rechecked.assignment.assignmentId, runId: rechecked.runResult.runId, supersededAssignmentId: candidate.assignment.assignmentId },
  ]);

  const closed = closeSessionByQuorum(coordinationId, {}, ctx.opts);
  assert.equal(closed.status, 'completed');
});

// ─── No disposition -- a satisfied recheck alone never discharges anything ─

test('a satisfied recheck with NO recorded disposition against the failed attempt does not discharge the slot', async () => {
  const coordinationId = 'coord_recheck_discharge_no_disposition';
  const ctx = setupFixture(coordinationId);

  const candidate = await dispatchCandidate(coordinationId, ctx, { status: 'failed' });
  await authorizeAndDispatchRecheck(coordinationId, ctx, { authorizationId: 'auth_recheck_1', invocationKey: 'recheck:1', status: 'done' });

  const quorum = evaluateSessionQuorum(coordinationId, ctx.opts);
  assert.deepEqual(quorum.failed, [{ actorId: 'red-team', assignmentId: candidate.assignment.assignmentId, runId: candidate.runResult.runId }], 'no driver-disposition-recorded event against the failed attempt means the recheck, however clean, never counts');
  assert.throws(
    () => closeSessionByQuorum(coordinationId, {}, ctx.opts),
    (err) => err instanceof CoordinationError && /missing required actor\(s\) \[red-team\]/.test(err.message),
  );
});

// ─── Undeclared rechecks link -- laundering by an unrelated driver-authorized op ─

test('a satisfied, dispositioned recheck of an UNDECLARED driver-authorized operation (no `rechecks` field) never discharges the slot -- same refusal as before this fix', async () => {
  const coordinationId = 'coord_recheck_discharge_undeclared';
  const ctx = setupFixture(coordinationId, { declareRechecks: false });

  const candidate = await dispatchCandidate(coordinationId, ctx, { status: 'failed' });
  recordDriverDisposition(
    coordinationId,
    { targetRef: candidate.assignment.assignmentId, disposition: 'accepted', rationale: 'Accepted anyway.', evidenceRefs: [], authorizedBy: { type: 'driver', id: 'writer-1' } },
    ctx.opts,
  );
  await authorizeAndDispatchRecheck(coordinationId, ctx, { authorizationId: 'auth_recheck_1', invocationKey: 'recheck:1', status: 'done' });

  const quorum = evaluateSessionQuorum(coordinationId, ctx.opts);
  assert.deepEqual(quorum.failed, [{ actorId: 'red-team', assignmentId: candidate.assignment.assignmentId, runId: candidate.runResult.runId }], 'without a declared rechecks: binding, a driver-authorized op is just an ordinary ungated branch (excluded from gating entirely) -- it cannot discharge a DIFFERENT operation\'s failed gating slot regardless of disposition or its own verdict');
});

// ─── Missing/late stay untouched -- discharge is only ever consulted for `failed` ─

test('a required first pass that was never dispatched at all stays `missing`, even when its recheck is authorized and satisfied', async () => {
  const coordinationId = 'coord_recheck_discharge_missing_untouched';
  const ctx = setupFixture(coordinationId);

  // `candidate` is deliberately never dispatched -- only its recheck is.
  await authorizeAndDispatchRecheck(coordinationId, ctx, { authorizationId: 'auth_recheck_1', invocationKey: 'recheck:1', status: 'done' });

  const quorum = evaluateSessionQuorum(coordinationId, ctx.opts);
  assert.deepEqual(quorum.missing, [{ actorId: 'red-team' }], 'a driver can never skip the required first pass itself by authorizing a recheck alone -- discharge is only ever consulted for a settled `failed` outcome, never `missing`');
  assert.deepEqual(quorum.completed, []);
  assert.deepEqual(quorum.failed, []);
});

// ─── Fix-2: the recheck itself can fail once and still be satisfied on a later attempt ─

test('a recheck that itself fails once, then a SECOND authorized attempt that succeeds, still discharges the slot (first-satisfied-wins, same as an ordinary same-op retry)', async () => {
  const coordinationId = 'coord_recheck_discharge_fix2';
  const ctx = setupFixture(coordinationId);

  const candidate = await dispatchCandidate(coordinationId, ctx, { status: 'failed' });
  recordDriverDisposition(
    coordinationId,
    { targetRef: candidate.assignment.assignmentId, disposition: 'accepted', rationale: 'Accepted; first recheck attempt.', evidenceRefs: [], authorizedBy: { type: 'driver', id: 'writer-1' } },
    ctx.opts,
  );
  await authorizeAndDispatchRecheck(coordinationId, ctx, { authorizationId: 'auth_recheck_1', invocationKey: 'recheck:1', status: 'failed' });

  const afterFirstRecheck = evaluateSessionQuorum(coordinationId, ctx.opts);
  assert.deepEqual(afterFirstRecheck.failed, [{ actorId: 'red-team', assignmentId: candidate.assignment.assignmentId, runId: candidate.runResult.runId }], 'a recheck that itself fails does not discharge anything');

  const secondRecheck = await authorizeAndDispatchRecheck(coordinationId, ctx, { authorizationId: 'auth_recheck_2', invocationKey: 'recheck:2', status: 'done' });

  const afterSecondRecheck = evaluateSessionQuorum(coordinationId, ctx.opts);
  assert.deepEqual(afterSecondRecheck.failed, []);
  assert.deepEqual(afterSecondRecheck.completed, [
    { actorId: 'red-team', assignmentId: secondRecheck.assignment.assignmentId, runId: secondRecheck.runResult.runId, supersededAssignmentId: candidate.assignment.assignmentId },
  ]);

  const closed = closeSessionByQuorum(coordinationId, {}, ctx.opts);
  assert.equal(closed.status, 'completed');
});
