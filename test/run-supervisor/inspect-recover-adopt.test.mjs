// inspect, show-run and recover over attempts of the run supervisor: the adopt probe names the attempt, a
// unit whose controller is gone reads `awaiting-resume`, and `dispatch recover` finishes an orphaned attempt
// through the adopt door instead of parking on its outbox. Real host binary (FGOS_HOST_BIN), synthetic
// attempt directories the way a dead supervisor leaves them.
import '../helpers/process-tmp-root.mjs';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';
import { computeSha256Digest } from '../../src/runner/dispatch/proof-helpers.mjs';
import { inspectDispatchUseCase } from '../../src/verbs/dispatch/inspect.mjs';
import { showRunUseCase } from '../../src/verbs/dispatch/show-run.mjs';
import { recoverApplyUseCase, recoverObserveUseCase } from '../../src/verbs/dispatch/recover.mjs';
import { acquireUnitControl } from '../../src/runner/execution/unit-control.mjs';

const HOST = process.env.FGOS_HOST_BIN;
const skip = HOST && fs.existsSync(HOST) ? false : 'FGOS_HOST_BIN does not name a host built from this checkout';
const holders = [];
after(() => { for (const child of holders) child.kill('SIGKILL'); });

const write = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value));
};

/** A project root holding one attempt of `assignmentId`; `supervised: false` leaves it as a run from before the supervisor. */
function project({ assignmentId = 'unit-run-1/producer/1', runId = 'run-1', supervised = true, attempt = '01', extraRun = {} } = {}) {
  const root = makeFixtureDir('inspect-recover-');
  const assignments = path.join(root, '.fgos', 'assignments');
  const dir = path.join(assignments, assignmentId, 'runs', attempt);
  write(path.join(dir, 'run.json'), { runId, assignmentId, status: 'running', cwd: root, ...extraRun });
  if (supervised) {
    const envelope = {
      v: 3, attemptId: `att-${runId}`, unitRunId: 'unit-run-1', runDir: dir, mode: 'direct', protocolId: 1,
      hostBin: HOST ?? '/bin/false', payloadRoot: '/', cwd: dir, mutation: 'read-only',
      launch: { command: '/bin/true', args: [], env: {}, stdinPolicy: 'null', briefPath: null, outboxDir: path.join(dir, 'outbox'), capture: { stdout: path.join(dir, 'o.log'), stderr: path.join(dir, 'e.log') } },
      containment: { preferred: 'linux-gate' },
      deadlines: { softAt: null, idleMs: null, hardCeiling: null, gateKillGraceMs: 1000 },
      agentProtocol: { cli: 'claude', mode: 'direct' },
      steps: [],
    };
    envelope.digest = computeSha256Digest(envelope);
    write(path.join(dir, 'envelope.json'), envelope);
    write(path.join(dir, 'attempt.lock'), '');
  }
  write(path.join(assignments, assignmentId, 'admission', 'generations', '0000000001.json'), { runId, attempt: Number(attempt), attemptStr: attempt });
  return { root, assignments, dir, ctx: { cwd: root, repoRoot: root } };
}

/** A unit run directory that recorded `assignmentId` as the attempt of its only seat. */
function unitOf(p, assignmentId = 'unit-run-1/producer/1', unitRunId = 'unit-run-1') {
  const unitDir = path.join(p.assignments, unitRunId);
  write(path.join(unitDir, 'unit.json'), { execution: { status: 'running' }, bindings: { 'producer/1': [{ role: 'producer', assignmentId }] } });
  return unitDir;
}

const adoptable = (p, outcome) => {
  write(path.join(p.dir, 'outbox', 'result-1.json'), { claim: outcome ?? 'done' });
  return p;
};

test('an orphaned attempt with an outbox result recovers as adopt, and applying it closes the attempt', { skip }, () => {
  const p = adoptable(project());
  const rec = recoverObserveUseCase(p.ctx, { runId: 'run-1' });
  assert.equal(rec.kind, 'recommendation', rec.reason);
  assert.deepEqual(rec.action, { type: 'adopt', attemptId: 'att-run-1' });
  assert.ok(rec.evidenceIds.includes('result-1.json'));

  const applied = recoverApplyUseCase(p.ctx, {
    runId: 'run-1', action: rec.action, expectedSnapshot: rec.snapshotHash, expectedControlEpoch: rec.expectedControlEpoch,
    expectedExpiresAt: rec.expiresAt, actionKey: rec.actionKey,
  });
  assert.equal(applied.outcome, 'applied', applied.reason);
  assert.ok(fs.existsSync(path.join(p.dir, 'closed.json')));
  assert.equal(JSON.parse(fs.readFileSync(path.join(p.dir, 'recovery-commands.jsonl'), 'utf8').trim()).action.type, 'adopt');

  const again = recoverObserveUseCase(p.ctx, { runId: 'run-1' });
  assert.equal(again.kind, 'park');
  assert.match(again.reason, /closed/);
});

test('an attempt whose lock is held offers no action and reads running', { skip }, async () => {
  const p = adoptable(project());
  const holder = spawn('flock', ['-x', path.join(p.dir, 'attempt.lock'), 'sleep', '60'], { stdio: 'ignore' });
  holders.push(holder);
  await new Promise((resolve) => setTimeout(resolve, 300));
  const rec = recoverObserveUseCase(p.ctx, { runId: 'run-1' });
  assert.equal(rec.kind, 'park');
  assert.match(rec.reason, /running/);
  assert.equal(showRunUseCase(p.ctx, { runId: 'run-1' }).attemptState, 'running');
  assert.equal(inspectDispatchUseCase(p.ctx, { run: 'run-1' }).attemptState, 'running');
});

test('a recommendation goes stale when the run changes between observe and apply', { skip }, () => {
  const p = adoptable(project());
  const rec = recoverObserveUseCase(p.ctx, { runId: 'run-1' });
  write(path.join(p.dir, 'outbox', 'result-2.json'), {});
  const applied = recoverApplyUseCase(p.ctx, {
    runId: 'run-1', action: rec.action, expectedSnapshot: rec.snapshotHash, expectedControlEpoch: rec.expectedControlEpoch,
    expectedExpiresAt: rec.expiresAt, actionKey: rec.actionKey,
  });
  assert.equal(applied.outcome, 'plan-stale');
  assert.equal(fs.existsSync(path.join(p.dir, 'closed.json')), false);
});

test('inspect and show-run: a unit with a closed attempt, no summary and no controller awaits resume and names the command; a live controller keeps it running', { skip }, () => {
  const p = project();
  const unitDir = unitOf(p);
  const rec = recoverObserveUseCase(p.ctx, { runId: 'run-1' });
  recoverApplyUseCase(p.ctx, {
    runId: 'run-1', action: rec.action, expectedSnapshot: rec.snapshotHash, expectedControlEpoch: rec.expectedControlEpoch,
    expectedExpiresAt: rec.expiresAt, actionKey: rec.actionKey,
  });
  for (const view of [inspectDispatchUseCase(p.ctx, { run: 'run-1' }), showRunUseCase(p.ctx, { runId: 'run-1' })]) {
    assert.equal(view.attemptState, 'abandoned-not-started');
    assert.equal(view.unitState, 'awaiting-resume');
    assert.equal(view.resumeCommand, 'fgos run --resume unit-run-1');
  }
  const control = acquireUnitControl(unitDir, 'unit-run-1');
  assert.equal(control.status, 'acquired');
  try {
    assert.equal(showRunUseCase(p.ctx, { runId: 'run-1' }).unitState, 'running');
  } finally {
    control.release();
  }
  assert.equal(showRunUseCase(p.ctx, { runId: 'run-1' }).unitState, 'awaiting-resume');
});

test('a unit whose attempt is not closed stays running, and one with a summary reads its verdict', { skip }, () => {
  const p = project();
  const unitDir = unitOf(p);
  assert.equal(showRunUseCase(p.ctx, { runId: 'run-1' }).unitState, 'running');
  write(path.join(unitDir, 'unit-summary.json'), { outcome: 'pass' });
  assert.equal(showRunUseCase(p.ctx, { runId: 'run-1' }).unitState, 'completed');
  write(path.join(unitDir, 'unit-summary.json'), { outcome: 'fail' });
  assert.equal(showRunUseCase(p.ctx, { runId: 'run-1' }).unitState, 'failed');
});

test('a closed attempt a later resume replaced reads superseded', { skip }, () => {
  const p = project();
  write(path.join(p.dir, 'closed.json'), { v: 1, closedBy: 'supervisor' });
  write(path.join(p.dir, 'receipt.json'), { outcome: 'cancelled' });
  const second = path.join(p.assignments, 'unit-run-1/producer/1', 'runs', '02');
  write(path.join(second, 'run.json'), { runId: 'run-2', assignmentId: 'unit-run-1/producer/1', status: 'running', supersedesRunId: 'run-1' });
  const view = showRunUseCase(p.ctx, { runId: 'run-1' });
  assert.equal(view.attemptState, 'superseded');
  assert.equal(view.supersededBy, 'run-2');
  assert.equal(view.attemptOutcome, 'closed');
});

test('a run from before the supervisor reads legacy-run and recovers as it always did', { skip }, () => {
  const p = project({ supervised: false, extraRun: { visibility: null } });
  assert.equal(showRunUseCase(p.ctx, { runId: 'run-1' }).attemptState, 'legacy-run');
  const rec = recoverObserveUseCase(p.ctx, { runId: 'run-1' });
  assert.equal(rec.kind, 'recommendation');
  assert.deepEqual(rec.action, { type: 'resume-driver' });
});

test('abandon-legacy settles a legacy run only on proof that every recorded process is dead', { skip }, () => {
  const p = project({ supervised: false });
  const noProof = recoverObserveUseCase(p.ctx, { runId: 'run-1', intent: 'abandon-legacy' });
  assert.equal(noProof.kind, 'needs-input');

  const alive = { ...p.ctx, judgeLegacyHolders: () => ({ allDead: false, reason: 'pid-alive' }) };
  const refused = recoverObserveUseCase(alive, { runId: 'run-1', intent: 'abandon-legacy' });
  assert.equal(refused.kind, 'park');
  assert.match(refused.reason, /pid-alive/);

  const dead = { ...p.ctx, judgeLegacyHolders: () => ({ allDead: true }) };
  const rec = recoverObserveUseCase(dead, { runId: 'run-1', intent: 'abandon-legacy' });
  assert.deepEqual(rec.action, { type: 'abandon-legacy' });
  const applied = recoverApplyUseCase(dead, {
    runId: 'run-1', action: rec.action, expectedSnapshot: rec.snapshotHash, expectedControlEpoch: rec.expectedControlEpoch,
    expectedExpiresAt: rec.expiresAt, actionKey: rec.actionKey,
  });
  assert.equal(applied.outcome, 'applied', applied.reason);
  assert.equal(showRunUseCase(p.ctx, { runId: 'run-1' }).attemptState, 'abandoned-legacy');
  assert.equal(recoverObserveUseCase(dead, { runId: 'run-1', intent: 'abandon-legacy' }).kind, 'park');
});

test('abandon-legacy settles a legacy run whose worker result nobody read, and the other intents still treat it as settled', { skip }, () => {
  const p = project({ supervised: false });
  write(path.join(p.dir, 'outbox', 'result-1.json'), { claim: 'done' });
  const dead = { ...p.ctx, judgeLegacyHolders: () => ({ allDead: true }) };
  const rec = recoverObserveUseCase(dead, { runId: 'run-1', intent: 'abandon-legacy' });
  assert.equal(rec.kind, 'recommendation', rec.reason);
  assert.deepEqual(rec.action, { type: 'abandon-legacy' });
  const applied = recoverApplyUseCase(dead, {
    runId: 'run-1', action: rec.action, expectedSnapshot: rec.snapshotHash, expectedControlEpoch: rec.expectedControlEpoch,
    expectedExpiresAt: rec.expiresAt, actionKey: rec.actionKey,
  });
  assert.equal(applied.outcome, 'applied', applied.reason);
  assert.equal(showRunUseCase(p.ctx, { runId: 'run-1' }).attemptState, 'abandoned-legacy');
  const other = project({ supervised: false, runId: 'run-2', assignmentId: 'unit-run-2/producer/1' });
  write(path.join(other.dir, 'outbox', 'result-1.json'), { claim: 'done' });
  const resume = recoverObserveUseCase(other.ctx, { runId: 'run-2' });
  assert.equal(resume.kind, 'park');
  assert.match(resume.reason, /already settled/);
});

test('a unit whose only attempt the legacy sweep settled is terminal for the unit and awaits resume', { skip }, () => {
  const p = project({ supervised: false, extraRun: { status: 'died', settlement: 'abandoned-legacy', settledAt: '2026-10-18T00:00:00.000Z' } });
  unitOf(p);
  const view = showRunUseCase(p.ctx, { runId: 'run-1' });
  assert.equal(view.attemptState, 'abandoned-legacy');
  assert.equal(view.unitState, 'awaiting-resume');
  assert.equal(view.resumeCommand, 'fgos run --resume unit-run-1');
});
