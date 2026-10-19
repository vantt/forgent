// test/workflow/case-authority.test.mjs — every signal a caller gives must name one open case, or the call is refused by name

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { validateWorkflow, createWorkflowRun } from '../../src/workflow/index.mjs';
import { createCaseAdmissionPort, nestedStartRefusal } from '../../src/workflow/case-admission-port.mjs';
import { createPendingBinding, commitBinding } from '../../src/workflow/case-bindings.mjs';
import { acquireAdvanceLock } from '../../src/workflow/case-lock.mjs';
import { appendAll, append, openCase, withHold } from '../helpers/workflow-case-fixture.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';

const proposal = (run, extra = {}) => ({
  unitRunId: 'unit-run-1',
  caseRef: { caseId: run.caseId, activity: 'scout' },
  activity: 'scout',
  writes: [],
  worktree: run.repoRoot,
  readOnly: true,
  pattern: 'solo',
  seatLaunches: 1,
  blind: false,
  handoffRefs: [],
  ...extra,
});
const ENV = (caseId, reservationId) => ({ FGOS_CASE_ID: caseId, FGOS_CASE_RESERVATION: reservationId });

/** Admit one dispatch into `run` and return its reservation id: what a worker of that dispatch would carry. */
function admitted(run) {
  const answer = createCaseAdmissionPort({ repoRoot: run.repoRoot, env: {} }).admit(proposal(run));
  assert.equal(answer.admitted, true, JSON.stringify(answer));
  return answer.reservationId;
}

function playbookCase(repoRoot) {
  const workflow = validateWorkflow({ id: 'a-playbook', steps: [{ id: 'one', units: [{ id: 'u', template: { capability: 'docs:write', pattern: 'solo', objective: 'x', writes: [] } }] }] });
  const { workflowRunId } = createWorkflowRun({ repoRoot, workflowId: workflow.id, workflow });
  const run = { repoRoot, caseId: workflowRunId };
  withHold(run, (hold) => append(run, hold, 'case.opened', { caseId: workflowRunId, kind: workflow.guide.kind, guide: { id: workflow.guide.id, sha256: 'sha256:g' }, frame: null, requestDigest: 'sha256:r' }));
  return run;
}

test('a case variable that names an unknown or a closed case, half a case, or a reservation that is not live is invalid, never standalone', () => {
  const run = openCase();
  const live = admitted(run);
  const ask = (env, extra) => createCaseAdmissionPort({ repoRoot: run.repoRoot, env }).admit(proposal(run, extra));

  assert.equal(ask(ENV(run.caseId, live), { unitRunId: 'u2' }).admitted, true, 'the case its own worker names is fine');
  assert.equal(ask(ENV('wf-nope', live)).refused.code, 'authority-context-invalid');
  assert.equal(ask({ FGOS_CASE_ID: run.caseId }).refused.code, 'authority-context-invalid', 'a case with no reservation is malformed');
  assert.equal(ask({ FGOS_CASE_ID: '../etc', FGOS_CASE_RESERVATION: 'x' }).refused.code, 'authority-context-invalid');
  assert.equal(ask(ENV(run.caseId, 'rsv-not-live')).refused.code, 'authority-context-invalid');

  const closed = openCase();
  const closedLive = admitted(closed);
  withHold(closed, (hold) => append(closed, hold, 'case.closed', { closedAt: '2026-10-19T00:00:00.000Z' }));
  assert.equal(createCaseAdmissionPort({ repoRoot: closed.repoRoot, env: ENV(closed.caseId, closedLive) }).admit(proposal(closed)).refused.code, 'authority-context-invalid');
  assert.equal(createCaseAdmissionPort({ repoRoot: closed.repoRoot, env: {} }).admit(proposal(closed)).refused.code, 'authority-context-invalid', 'naming a closed case never falls back to standalone');
});

test('conflicting signals: the environment names one case and the call another, or the worktree belongs to a third', () => {
  const a = openCase();
  const b = openCase({ repoRoot: a.repoRoot });
  const reservationOfA = admitted(a);
  const port = createCaseAdmissionPort({ repoRoot: a.repoRoot, env: ENV(a.caseId, reservationOfA) });
  const conflict = port.admit(proposal(b, { caseRef: { caseId: b.caseId, activity: 'scout' } }));
  assert.equal(conflict.refused.code, 'authority-context-conflict');
  assert.match(conflict.refused.condition, new RegExp(`${a.caseId}.*${b.caseId}`));

  // The worktree a call writes is bound to another case: that is a signal too.
  const planned = openCase({ repoRoot: a.repoRoot });
  appendAll(planned, [
    { type: 'reservation', payload: { reservationId: 'r-plan', activity: 'plan', writes: [], counters: { dispatches: 1, mutatingDispatches: 0 } } },
    { type: 'settle', payload: { reservationId: 'r-plan', outcome: 'pass', receipts: [], achieved: [{ milestone: 'plan-ready', subjectDigest: 'sha256:p' }], seatLaunchesUsed: 1, activity: 'plan' } },
  ]);
  const wt = makeFixtureDir('fgos-authority-wt-');
  const made = createPendingBinding({ mainRoot: a.repoRoot, caseId: b.caseId, generation: 1, worktree: wt });
  commitBinding({ mainRoot: a.repoRoot, key: made.key, caseId: b.caseId, generation: 1 });
  const write = createCaseAdmissionPort({ repoRoot: a.repoRoot, env: {} }).admit(proposal(planned, {
    activity: 'build-a', caseRef: { caseId: planned.caseId, activity: 'build-a' }, writes: ['src/a'], worktree: wt, readOnly: false,
  }));
  assert.equal(write.refused.code, 'authority-context-conflict');
  assert.match(write.refused.condition, new RegExp(b.caseId));
});

test('a case opened under a reservation of another is explained: the worker of the parent may name its child', () => {
  const parent = openCase();
  const reservation = admitted(parent);
  const child = openCase({ repoRoot: parent.repoRoot });
  // Not yet a child of anything: the same call conflicts.
  const env = ENV(parent.caseId, reservation);
  assert.equal(createCaseAdmissionPort({ repoRoot: parent.repoRoot, env }).admit(proposal(child, { caseRef: { caseId: child.caseId, activity: 'scout' } })).refused.code, 'authority-context-conflict');

  // A child's own ledger names its parent in `case.opened`; that, not precedence, explains the second case.
  const explained = openChild(parent);
  const answer = createCaseAdmissionPort({ repoRoot: parent.repoRoot, env }).admit(proposal(explained, { caseRef: { caseId: explained.caseId, activity: 'scout' } }));
  assert.equal(answer.admitted, true, JSON.stringify(answer));
});

function openChild(parent) {
  const run = openCase({ repoRoot: parent.repoRoot });
  // Replace its opening with one that names the parent, the way a nested start records it.
  const file = path.join(parent.repoRoot, '.fgos', 'workflow-runs', run.caseId, 'events.jsonl');
  const lines = fs.readFileSync(file, 'utf8').trimEnd().split('\n').map((l) => JSON.parse(l));
  for (const event of lines) if (event.type === 'case.opened') event.payload.parent = { caseId: parent.caseId, reservationId: 'rsv-nested-x' };
  fs.writeFileSync(file, `${lines.map((l) => JSON.stringify(l)).join('\n')}\n`);
  return run;
}

test('a writing call into a worktree a case binds, with no case named, is refused before bind() by the binding alone', () => {
  const run = openCase();
  const wt = makeFixtureDir('fgos-authority-bound-');
  const made = createPendingBinding({ mainRoot: run.repoRoot, caseId: run.caseId, generation: 1, worktree: wt });
  commitBinding({ mainRoot: run.repoRoot, key: made.key, caseId: run.caseId, generation: 1 });
  const answer = createCaseAdmissionPort({ repoRoot: run.repoRoot, env: {} }).resolveBinding({ worktree: wt });
  assert.equal(answer.answer, 'bound-worktree-requires-case-authority');
  assert.match(answer.condition, new RegExp(`--case ${run.caseId}`), 'the refusal says how to name it');
  // The owner session and a worker whose shell unset every variable get the same answer.
  assert.equal(createCaseAdmissionPort({ repoRoot: run.repoRoot, env: ENV(run.caseId, 'rsv-x') }).resolveBinding({ worktree: wt }).answer, 'authority-context-invalid', 'a call that carries case variables but names no case is not standalone');
  // A free worktree is standalone only without any case signal.
  const free = makeFixtureDir('fgos-authority-free-');
  assert.equal(createCaseAdmissionPort({ repoRoot: run.repoRoot, env: {} }).resolveBinding({ worktree: free }).answer, 'unbound');
});

test('a call naming a live Playbook case from outside its proposer is refused at once, and a nested start under it too', () => {
  const tmp = makeFixtureDir('fgos-shape-c-');
  const run = playbookCase(tmp);
  const outside = createCaseAdmissionPort({ repoRoot: tmp, env: {} });
  const started = Date.now();
  const refused = outside.admit(proposal(run, { activity: 'one', caseRef: { caseId: run.caseId, activity: 'one' } }));
  assert.equal(refused.refused.code, 'playbook-case-admits-via-proposer-only');
  assert.ok(Date.now() - started < 2000, 'no waiting');
  // Even while the proposer holds advance the answer is the same to anyone else.
  const hold = acquireAdvanceLock(tmp, run.caseId);
  try {
    assert.equal(outside.admit(proposal(run, { activity: 'one', caseRef: { caseId: run.caseId, activity: 'one' } })).refused.code, 'playbook-case-admits-via-proposer-only');
    const own = createCaseAdmissionPort({ repoRoot: tmp, caseId: run.caseId, heldAdvance: hold, env: {} });
    assert.equal(own.admit(proposal(run, { activity: 'one', caseRef: { caseId: run.caseId, activity: 'one' } })).admitted, true, 'the proposer itself is admitted');
  } finally {
    hold.release();
  }
  assert.equal(nestedStartRefusal({ repoRoot: tmp, parentCaseId: run.caseId, env: {} }).code, 'playbook-case-admits-via-proposer-only');
});

test('a confined caller never gets to write: a masked bindings view or a read-only case directory is nested-write-from-confined-worker', () => {
  const run = openCase();
  const wt = makeFixtureDir('fgos-confined-wt-');
  const before = process.env.FGOS_DISPATCH_DEPTH;
  const write = (port) => port.admit(proposal(run, { activity: 'rogue-write', caseRef: { caseId: run.caseId, activity: 'rogue-write' }, writes: ['src/x'], worktree: wt, readOnly: false }));
  try {
    // The host made the real view; a nested process of depth 1 that cannot see its marker is looking at a mask.
    const hostPort = createCaseAdmissionPort({ repoRoot: run.repoRoot, env: {} });
    fs.rmSync(path.join(run.repoRoot, '.fgos', 'workflow-runs', '.bindings', '.root'));
    process.env.FGOS_DISPATCH_DEPTH = '1';
    const masked = createCaseAdmissionPort({ repoRoot: run.repoRoot, env: {} });
    assert.equal(write(masked).refused.code, 'nested-write-from-confined-worker');
    assert.equal(masked.resolveBinding({ worktree: wt }).answer, 'nested-write-from-confined-worker');
    // A read-only nested dispatch is unaffected.
    assert.equal(masked.admit(proposal(run)).admitted, true);
    delete process.env.FGOS_DISPATCH_DEPTH;
    assert.equal(hostPort.resolveBinding({ worktree: wt }).answer, 'unbound', 'the host marks the real view again');

    // The real view, but a read-only case directory.
    process.env.FGOS_DISPATCH_DEPTH = '1';
    const dir = path.join(run.repoRoot, '.fgos', 'workflow-runs', run.caseId);
    fs.chmodSync(dir, 0o500);
    try {
      assert.equal(write(createCaseAdmissionPort({ repoRoot: run.repoRoot, env: {} })).refused.code, 'nested-write-from-confined-worker');
    } finally {
      fs.chmodSync(dir, 0o700);
    }
  } finally {
    if (before === undefined) delete process.env.FGOS_DISPATCH_DEPTH; else process.env.FGOS_DISPATCH_DEPTH = before;
  }
});
