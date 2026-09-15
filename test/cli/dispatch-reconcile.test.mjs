import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const repo = path.resolve(new URL('../..', import.meta.url).pathname);
const run = (root, args) => spawnSync(process.execPath, ['bin/fgos.mjs', ...args, '--dir', root], { cwd: repo, encoding: 'utf8' });
test('CLI exposes only the narrow reconcile plan and refuses forbidden actions', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-reconcile-cli-')); fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(root, '.fgos', 'dispatch.lock'), JSON.stringify({ pid: 99999999, startTime: '1' }));
  const planned = run(root, ['dispatch', 'reconcile', 'plan']); assert.equal(planned.status, 0, planned.stderr); assert.equal(JSON.parse(planned.stdout).data.outcome, 'planned');
  const refused = run(root, ['dispatch', 'reconcile', 'plan', '--action', 'resume-driver']); assert.equal(refused.status, 0, refused.stderr); assert.equal(JSON.parse(refused.stdout).data.outcome, 'refused');
});

test('CLI plans collect-result through --action and --run, and refuses it without a runId', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-reconcile-cli-'));
  const assignmentDir = path.join(root, '.fgos', 'assignments', 'a');
  fs.mkdirSync(assignmentDir, { recursive: true });
  fs.writeFileSync(path.join(assignmentDir, 'assignment.json'), JSON.stringify({ assignmentId: 'a' }));
  const runDir = path.join(assignmentDir, 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify({ assignmentId: 'a', runId: 'run-1' }));
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({ runId: 'run-1', assignmentId: 'a', status: 'done', confidence: 'reported' }));
  const admissionDir = path.join(assignmentDir, 'admission', 'generations');
  fs.mkdirSync(admissionDir, { recursive: true });
  fs.writeFileSync(path.join(admissionDir, '0000000001.json'), JSON.stringify({ runId: 'run-1', attempt: 1 }));
  const planned = run(root, ['dispatch', 'reconcile', 'plan', '--action', 'collect-result', '--run', 'run-1']);
  assert.equal(planned.status, 0, planned.stderr);
  assert.equal(JSON.parse(planned.stdout).data.outcome, 'planned');
  const missingRunId = run(root, ['dispatch', 'reconcile', 'plan', '--action', 'collect-result']);
  assert.equal(missingRunId.status, 0, missingRunId.stderr);
  assert.equal(JSON.parse(missingRunId.stdout).data.outcome, 'refused');
});

test('CLI plans repair-projection through --action and --run, and refuses it without a runId', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-reconcile-cli-'));
  const assignmentDir = path.join(root, '.fgos', 'assignments', 'a');
  fs.mkdirSync(assignmentDir, { recursive: true });
  fs.writeFileSync(path.join(assignmentDir, 'assignment.json'), JSON.stringify({ assignmentId: 'a' }));
  const runDir = path.join(assignmentDir, 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify({ assignmentId: 'a', runId: 'run-1', status: 'running' }));
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({ runId: 'run-1', assignmentId: 'a', status: 'done', confidence: 'reported' }));
  const admissionDir = path.join(assignmentDir, 'admission', 'generations');
  fs.mkdirSync(admissionDir, { recursive: true });
  fs.writeFileSync(path.join(admissionDir, '0000000001.json'), JSON.stringify({ runId: 'run-1', attempt: 1 }));
  const planned = run(root, ['dispatch', 'reconcile', 'plan', '--action', 'repair-projection', '--run', 'run-1']);
  assert.equal(planned.status, 0, planned.stderr);
  const plan = JSON.parse(planned.stdout).data;
  assert.equal(plan.outcome, 'planned');
  const applied = run(root, ['dispatch', 'reconcile', 'apply', '--plan', JSON.stringify(plan)]);
  assert.equal(applied.status, 0, applied.stderr);
  assert.equal(JSON.parse(applied.stdout).data.outcome, 'applied');
  const runJson = JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8'));
  assert.equal(runJson.status, 'settled');
  const missingRunId = run(root, ['dispatch', 'reconcile', 'plan', '--action', 'repair-projection']);
  assert.equal(missingRunId.status, 0, missingRunId.stderr);
  assert.equal(JSON.parse(missingRunId.stdout).data.outcome, 'refused');
});

test('CLI apply refuses a same-byte outside-root target tampered into a plan', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-reconcile-cli-')); fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  const bytes = JSON.stringify({ pid: 99999999, startTime: '1' });
  const guard = path.join(root, '.fgos', 'dispatch.lock'); fs.writeFileSync(guard, bytes);
  const outside = path.join(path.dirname(root), `${path.basename(root)}-outside-lock`); fs.writeFileSync(outside, bytes);
  const planned = run(root, ['dispatch', 'reconcile', 'plan']); assert.equal(planned.status, 0, planned.stderr);
  const plan = JSON.parse(planned.stdout).data; plan.proposedAction.path = outside;
  const applied = run(root, ['dispatch', 'reconcile', 'apply', '--plan', JSON.stringify(plan)]);
  assert.equal(applied.status, 0, applied.stderr);
  assert.equal(JSON.parse(applied.stdout).data.outcome, 'plan-stale');
  assert.equal(fs.existsSync(outside), true, 'outside same-byte file must never be unlinked');
  assert.equal(fs.existsSync(guard), true, 'canonical guard must remain after refusal');
});
