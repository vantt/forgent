// test/workflow/conductor-case.test.mjs — a conductor case admits what an agent proposes: reserve under advance, run outside it,
// settle under advance; a nested case or wave spends the parent's frame and gives it back when it cannot open

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { startWorkflow, statusWorkflow, readWorkflowEvents } from '../../src/workflow/index.mjs';
import { createCaseAdmissionPort } from '../../src/workflow/case-admission-port.mjs';
import { createPendingBinding, commitBinding } from '../../src/workflow/case-bindings.mjs';
import { runUnit } from '../../src/runner/execution/run.mjs';
import { CaseAdmissionRefusedError } from '../../src/runner/execution/case-admission-port.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { setupWorkflowFixtureRepo } from '../helpers/workflow-fixture-repo.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';
import { appendAll, conductorWorkflow, FRAME, openCase, projectionOf, eventsOf } from '../helpers/workflow-case-fixture.mjs';

seedFileLocalBwrapRegistry();

const WORKER_BODY = `
  for (const m of prompt.matchAll(/WRITE:(\\S+)/g)) { fs.mkdirSync(path.dirname(m[1]), { recursive: true }); fs.writeFileSync(m[1], m[1] + ' written\\n'); }
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nThe assigned work was carried out and checked in full detail.\\n');
  fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done' }));
`;

function setupRepo() {
  const tmp = setupWorkflowFixtureRepo({ prefix: 'fgos-conductor-', readme: '# Conductor', gitName: 'Conductor Test', capabilities: ['docs:write'], workerBody: WORKER_BODY });
  fs.appendFileSync(path.join(tmp, '.gitignore'), '.fgos/\n*.mjs\n');
  return tmp;
}
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const worktreeOf = (repoRoot, name) => {
  const dir = path.join(makeFixtureDir(`fgos-conductor-wt-${name}-`), name);
  git(repoRoot, 'worktree', 'add', '-q', '-b', `cond/${name}`, dir);
  return dir;
};
const opts = (tmp) => ({ repoRoot: tmp, cwd: tmp, worktree: tmp });
const planned = (options) => {
  const run = openCase(options);
  appendAll(run, [
    { type: 'reservation', payload: { reservationId: 'r-plan', activity: 'plan', writes: [], counters: { dispatches: 1, mutatingDispatches: 0 } } },
    { type: 'settle', payload: { reservationId: 'r-plan', outcome: 'pass', receipts: [], achieved: [{ milestone: 'plan-ready', subjectDigest: 'sha256:plan' }], seatLaunchesUsed: 1, activity: 'plan' } },
  ]);
  return run;
};
const unitOf = (writes) => ({ id: 'u-build', objective: 'Do the work', capability: 'docs:write', writes });
const asRef = (run, activity) => ({ caseId: run.caseId, activity });

test('two writing dispatches into one case with overlapping writes: the second is refused at reservation, before anything exists', async () => {
  const tmp = setupRepo();
  const run = planned({ repoRoot: tmp });
  const wtA = worktreeOf(tmp, 'a');
  const wtB = worktreeOf(tmp, 'b');
  const port = createCaseAdmissionPort({ repoRoot: tmp, env: {} });
  const first = port.admit({ unitRunId: 'unit-run-first', caseRef: asRef(run, 'build-a'), activity: 'build-a', writes: ['src/a/**'], worktree: wtA, readOnly: false, pattern: 'solo', seatLaunches: 1 });
  assert.equal(first.admitted, true, JSON.stringify(first));

  await assert.rejects(
    () => runUnit({ unitData: unitOf(['src/a/deep']), caseAdmission: port, caseRef: asRef(run, 'build-b'), repoRoot: tmp, cwd: wtB, worktree: wtB }),
    (err) => err instanceof CaseAdmissionRefusedError && err.code === 'writes-overlap',
  );
  assert.deepEqual(fs.existsSync(path.join(tmp, '.fgos', 'assignments')) ? fs.readdirSync(path.join(tmp, '.fgos', 'assignments')) : [], []);
  assert.equal(projectionOf(run).liveReservations.length, 1, 'only the first holds a reservation');
});

test('a writing dispatch of a conductor case runs, settles once, and a disjoint one runs while another is still reserved', async () => {
  const tmp = setupRepo();
  const run = planned({ repoRoot: tmp });
  const wtA = worktreeOf(tmp, 'a');
  const wtB = worktreeOf(tmp, 'b');
  const port = createCaseAdmissionPort({ repoRoot: tmp, env: {} });
  const hold = port.admit({ unitRunId: 'unit-run-held', caseRef: asRef(run, 'build-a'), activity: 'build-a', writes: ['src/a/**'], worktree: wtA, readOnly: false, pattern: 'solo', seatLaunches: 1 });
  assert.equal(hold.admitted, true);

  // The disjoint dispatch is admitted, executed outside advance, and settled; the first reservation stays live.
  let result;
  for (let attempt = 0; attempt < 20 && !result; attempt += 1) {
    try {
      result = await runUnit({ unitData: { ...unitOf(['docs/b']), objective: 'WRITE:docs/b/x.md' }, caseAdmission: port, caseRef: asRef(run, 'build-b'), repoRoot: tmp, cwd: wtB, worktree: wtB });
    } catch (err) {
      if (err.code !== 'case-admission-busy') throw err;
    }
  }
  assert.equal(result.outcome, 'pass');
  const projection = projectionOf(run);
  assert.deepEqual(projection.liveReservations.map((r) => r.reservationId), [hold.reservationId]);
  const settles = eventsOf(run).filter((e) => e.type === 'settle' && e.payload.activity === 'build-b');
  assert.equal(settles.length, 1);
  assert.equal(statusWorkflow(run.caseId, { repoRoot: tmp }).advance.running, true, 'a live reservation means running, with no resume hint');
  assert.equal(statusWorkflow(run.caseId, { repoRoot: tmp }).advance.hint, undefined);
});

test('a parked consent gate on one branch of a conductor case does not stop another eligible activity', () => {
  const run = planned({ workflow: conductorWorkflow({ steps: [{ id: 'approve-gate', gate: { kind: 'human', question: 'Approve the integrated tree?' } }] }) });
  appendAll(run, [{ type: 'gate.park', payload: { stepId: 'approve-gate', question: 'Approve the integrated tree?', parkedAt: '2026-10-19T00:00:00.000Z' } }]);
  const port = createCaseAdmissionPort({ repoRoot: run.repoRoot, env: {} });
  const scout = port.admit({ unitRunId: 'u-scout', caseRef: asRef(run, 'scout'), activity: 'scout', writes: [], worktree: run.repoRoot, readOnly: true, pattern: 'solo', seatLaunches: 1 });
  assert.equal(scout.admitted, true, JSON.stringify(scout));
  assert.equal(projectionOf(run).openGates.length, 1);
});

test('a child case that cannot open gives the parent its frame back, exactly once, and no scope holds two advance', async () => {
  const tmp = setupRepo();
  const parent = openCase({ repoRoot: tmp, frame: { ...FRAME, dispatches: 8, mutatingDispatches: 4 } });
  const wt = worktreeOf(tmp, 'child');
  // Another case already binds the worktree the child would write in, so the child cannot open.
  const made = createPendingBinding({ mainRoot: tmp, caseId: 'wf-other', generation: 1, worktree: wt });
  commitBinding({ mainRoot: tmp, key: made.key, caseId: 'wf-other', generation: 1 });

  for (let round = 0; round < 2; round += 1) {
    await assert.rejects(
      () => startWorkflow({ workflow: conductorWorkflow({ id: 'nested-guide' }), parentCase: parent.caseId, repoRoot: tmp, cwd: tmp, worktree: wt, env: {} }),
      (err) => /cannot be bound/.test(err.message),
    );
    const projection = projectionOf(parent);
    assert.equal(projection.frameRemaining.dispatches, 8, `the charge came back after attempt ${round + 1}`);
    assert.equal(projection.frameRemaining.mutatingDispatches, 4);
  }
  const events = eventsOf(parent);
  const nested = events.filter((e) => e.type === 'reservation' && e.payload.nested);
  assert.equal(nested.length, 2, 'each attempt charged once');
  for (const charge of nested) {
    assert.equal(events.filter((e) => e.type === 'settle' && e.payload.reservationId === charge.payload.reservationId && e.payload.outcome === 'refunded').length, 1, 'and refunded exactly once');
  }
});

test('a nested wave consumes the parent frame and an unknown remainder refuses the next write', async () => {
  const tmp = setupRepo();
  const parent = openCase({ repoRoot: tmp, frame: { ...FRAME, dispatches: 8, mutatingDispatches: 4 } });
  const unitsFile = path.join(makeFixtureDir('fgos-conductor-units-'), 'wave.yaml');
  fs.writeFileSync(unitsFile, JSON.stringify({ id: 'wave', units: [
    { id: 'look-a', objective: 'Look at a', capability: 'docs:write', writes: [] },
    { id: 'look-b', objective: 'Look at b', capability: 'docs:write', writes: [] },
  ] }));
  const state = await startWorkflow({ unitsPath: unitsFile, parentCase: parent.caseId, ...opts(tmp), env: {} });
  assert.equal(state.status, 'completed', JSON.stringify(state.steps));
  assert.equal(projectionOf(parent).frameRemaining.dispatches, 6, 'two Units of the wave spent two dispatches of the parent');
  const child = readWorkflowEvents({ repoRoot: tmp, workflowRunId: state.workflowRunId }).find((e) => e.type === 'case.opened');
  assert.equal(child.payload.parent.caseId, parent.caseId);

  // A parent whose writing allowance is still unknown refuses a nested wave that writes, and creates no run.
  const unknown = openCase({ repoRoot: tmp, frame: { ...FRAME, mutatingDispatches: 'set-at-approval' } });
  const writing = path.join(makeFixtureDir('fgos-conductor-units-'), 'writes.yaml');
  fs.writeFileSync(writing, JSON.stringify({ id: 'writes', units: [{ id: 'w', objective: 'Write', capability: 'docs:write', writes: ['docs'] }] }));
  const before = fs.readdirSync(path.join(tmp, '.fgos', 'workflow-runs')).length;
  await assert.rejects(
    () => startWorkflow({ unitsPath: writing, parentCase: unknown.caseId, ...opts(tmp), env: {} }),
    (err) => err.code === 'frame-remaining-unknown',
  );
  assert.equal(fs.readdirSync(path.join(tmp, '.fgos', 'workflow-runs')).length, before, 'refused before the child existed');
});

test('a nested start under a case that does not exist is invalid', async () => {
  const tmp = setupRepo();
  await assert.rejects(
    () => startWorkflow({ workflow: conductorWorkflow({ id: 'orphan' }), parentCase: 'wf-missing', ...opts(tmp), env: {} }),
    (err) => err.code === 'authority-context-invalid',
  );
});

test('a conductor case moves past its entry milestone on what its own settle records, with no achieved written by hand', async () => {
  const tmp = setupRepo();
  const run = openCase({ repoRoot: tmp });
  const port = createCaseAdmissionPort({ repoRoot: tmp, env: {} });
  const wt = worktreeOf(tmp, 'build');
  const build = (unitRunId) => port.admit({ unitRunId, caseRef: asRef(run, 'build-a'), activity: 'build-a', writes: ['src/a/**'], worktree: wt, readOnly: false, pattern: 'solo', seatLaunches: 1 });

  assert.equal(build('unit-run-early').refused?.code, 'entry-milestone-unmet', 'plan-ready is not reached before the plan activity settles');

  const planned = await runUnit({ unitData: { ...unitOf([]), objective: 'Plan the work' }, caseAdmission: port, caseRef: asRef(run, 'plan'), repoRoot: tmp, cwd: tmp, worktree: tmp });
  assert.equal(planned.outcome, 'pass');
  const milestone = projectionOf(run).milestones['plan-ready'];
  assert.equal(milestone.state, 'achieved');
  assert.match(milestone.digest, /^sha256:[0-9a-f]{64}$/);
  assert.equal(build('unit-run-late').admitted, true, 'the activity that needed plan-ready is admitted now');
});

test('a delivery milestone is achieved only with a verify receipt for the paths the Unit wrote', () => {
  const tmp = setupRepo();
  const run = planned({ repoRoot: tmp });
  const wt = worktreeOf(tmp, 'deliver');
  fs.mkdirSync(path.join(wt, 'src', 'a'), { recursive: true });
  fs.writeFileSync(path.join(wt, 'src', 'a', 'x.txt'), 'built\n');
  const port = createCaseAdmissionPort({ repoRoot: tmp, env: {} });
  const attempt = (unitRunId, results) => {
    const admitted = port.admit({ unitRunId, caseRef: asRef(run, 'build-a'), activity: 'build-a', writes: ['src/a/**'], worktree: wt, readOnly: false, pattern: 'solo', seatLaunches: 1 });
    assert.equal(admitted.admitted, true, JSON.stringify(admitted));
    port.settle(admitted.reservationId, { caseId: run.caseId, outcome: 'pass', unitRunId, results, seatLaunchesUsed: 1 });
    return projectionOf(run);
  };

  const unproven = attempt('unit-run-claim', [{ role: 'implementer', outcome: 'pass', runResult: {} }]);
  assert.equal(unproven.milestones['child-built'].state, 'unreached');
  assert.deepEqual(unproven.refusedAchievements.map((r) => [r.milestone, r.reason]), [['child-built', 'receipt-missing']]);

  const proven = attempt('unit-run-proof', [{ role: 'implementer', outcome: 'pass', runResult: {} }, { role: 'verifier', outcome: 'pass' }]);
  assert.equal(proven.milestones['child-built'].state, 'achieved');
});
