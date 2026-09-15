import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repo = path.resolve(new URL('../..', import.meta.url).pathname);
function run(args) { return spawnSync(process.execPath, ['bin/fgos.mjs', ...args], { cwd: repo, encoding: 'utf8' }); }
function assignment(root, id) { const dir = path.join(root, '.fgos', 'assignments', id); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'assignment.json'), JSON.stringify({ assignmentId: id })); return dir; }
function admission(root, id, runId) { const dir = path.join(root, '.fgos', 'assignments', id, 'admission', 'generations'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, '0000000001.json'), JSON.stringify({ runId, attempt: 1 })); }
function materialize(root, id, runId, cwd, settled = false, attempt = '01') { const dir = path.join(root, '.fgos', 'assignments', id, 'runs', attempt); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'run.json'), JSON.stringify({ assignmentId: id, runId, ...(cwd ? { cwd } : {}) })); if (settled) fs.writeFileSync(path.join(dir, 'result.json'), JSON.stringify({ assignmentId: id, runId, status: 'done', confidence: 'reported' })); }
const cliRoot = (root) => ['--dir', root];

test('dispatch inspect projects only its typed selector and rejects zero or multiple selectors', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-inspect-cli-'));
  const zero = run(['dispatch', 'inspect', '--dir', root]);
  assert.equal(zero.status, 4); assert.match(zero.stderr, /exactly one selector/);
  const many = run(['dispatch', 'inspect', '--dir', root, '--run', 'run_a', '--assignment', 'asgn_a']);
  assert.equal(many.status, 4); assert.match(many.stderr, /exactly one selector/);
  const one = run(['dispatch', 'inspect', '--dir', root, '--run', 'run_a']);
  assert.equal(one.status, 0); assert.equal(JSON.parse(one.stdout).data.inspectionStatus, 'not-found');
});

test('public CLI routes run, assignment, and cwd selectors into the operation envelope', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-inspect-cli-')), cwd = path.join(root, 'cwd'); fs.mkdirSync(cwd); assignment(root, 'a'); materialize(root, 'a', 'resolved', cwd, true); admission(root, 'a', 'resolved'); fs.mkdirSync(path.join(root, '.fgos', 'dispatch'), { recursive: true }); fs.writeFileSync(path.join(root, '.fgos', 'dispatch.lock'), '{}'); fs.writeFileSync(path.join(root, '.fgos', 'workspace-evidence.json'), '{}'); fs.writeFileSync(path.join(root, '.fgos', 'dispatch', 'projection-conflicts.json'), '[]');
  for (const selector of [['--run', 'resolved'], ['--assignment', 'a'], ['--cwd', cwd]]) { const answer = run(['dispatch', 'inspect', ...cliRoot(root), ...selector]); assert.equal(answer.status, 0, answer.stderr); const envelope = JSON.parse(answer.stdout); assert.ok(envelope.data); assert.equal(envelope.data.inspectionStatus, 'resolved'); }
});

test('public CLI fail-closes unadmitted and malformed Assignment materializations', () => {
  const unadmitted = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-inspect-cli-')); assignment(unadmitted, 'a'); materialize(unadmitted, 'a', 'unadmitted'); let answer = run(['dispatch', 'inspect', ...cliRoot(unadmitted), '--run', 'unadmitted']); assert.equal(answer.status, 0, answer.stderr); let data = JSON.parse(answer.stdout).data; assert.equal(data.inspectionStatus, 'partial'); assert.equal(data.recoveryAuthority, undefined);
  const malformed = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-inspect-cli-')); assignment(malformed, 'a'); materialize(malformed, 'a', 'valid'); admission(malformed, 'a', 'valid'); const bad = path.join(malformed, '.fgos', 'assignments', 'a', 'runs', '02'); fs.mkdirSync(bad, { recursive: true }); fs.writeFileSync(path.join(bad, 'run.json'), '{broken'); answer = run(['dispatch', 'inspect', ...cliRoot(malformed), '--assignment', 'a']); assert.equal(answer.status, 0, answer.stderr); data = JSON.parse(answer.stdout).data; assert.equal(data.inspectionStatus, 'partial'); assert.equal(data.reconciliation.state, 'manual-required'); assert.equal(data.recoveryAuthority, undefined);
});

test('public CLI fail-closes duplicate admitted materializations and composite Run/cwd evidence', () => {
  const duplicate = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-inspect-cli-')); assignment(duplicate, 'a'); materialize(duplicate, 'a', 'same', undefined, true); materialize(duplicate, 'a', 'same', undefined, true, '02'); admission(duplicate, 'a', 'same'); let answer = run(['dispatch', 'inspect', ...cliRoot(duplicate), '--assignment', 'a']); assert.equal(answer.status, 0, answer.stderr); let data = JSON.parse(answer.stdout).data; assert.equal(data.inspectionStatus, 'conflicting'); assert.equal(data.subject.locations.length, 2); assert.equal(data.runObservation, null); assert.equal(data.recoveryAuthority, undefined);
  const malformed = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-inspect-cli-')); assignment(malformed, 'a'); materialize(malformed, 'a', 'good', undefined, true); admission(malformed, 'a', 'good'); const bad = path.join(malformed, '.fgos', 'assignments', 'a', 'runs', '02'); fs.mkdirSync(bad, { recursive: true }); fs.writeFileSync(path.join(bad, 'run.json'), '{broken'); answer = run(['dispatch', 'inspect', ...cliRoot(malformed), '--run', 'good']); assert.equal(answer.status, 0, answer.stderr); data = JSON.parse(answer.stdout).data; assert.equal(data.inspectionStatus, 'partial'); assert.equal(data.recoveryAuthority, undefined);
  const cwdRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-inspect-cli-')), cwd = path.join(cwdRoot, 'cwd'); fs.mkdirSync(cwd); assignment(cwdRoot, 'a'); assignment(cwdRoot, 'b'); materialize(cwdRoot, 'a', 'good', cwd, true); materialize(cwdRoot, 'b', 'bad', cwd, true); admission(cwdRoot, 'a', 'good'); fs.mkdirSync(path.join(cwdRoot, '.fgos', 'dispatch'), { recursive: true }); fs.writeFileSync(path.join(cwdRoot, '.fgos', 'dispatch.lock'), '{}'); fs.writeFileSync(path.join(cwdRoot, '.fgos', 'workspace-evidence.json'), '{}'); fs.writeFileSync(path.join(cwdRoot, '.fgos', 'dispatch', 'projection-conflicts.json'), '[]'); answer = run(['dispatch', 'inspect', ...cliRoot(cwdRoot), '--cwd', cwd]); assert.equal(answer.status, 0, answer.stderr); data = JSON.parse(answer.stdout).data; assert.equal(data.inspectionStatus, 'partial'); assert.equal(data.recoveryAuthority, undefined);
});
