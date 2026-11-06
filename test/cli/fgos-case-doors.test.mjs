// test/cli/fgos-case-doors.test.mjs — the case flags of the two doors: `fgos run --case` and `fgos workflow start --case`

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import { spawnSync, execFileSync } from 'node:child_process';

import { createPendingBinding, commitBinding } from '../../src/workflow/case-bindings.mjs';
import { appendAll, openCase, settle, verifyReceipt } from '../helpers/workflow-case-fixture.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

function repo(t) {
  const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-case-doors-')));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  execFileSync('git', ['init', '-b', 'main'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '--allow-empty', '-m', 'fixture'], { cwd: tmp, stdio: 'ignore' });
  return tmp;
}
const fgos = (tmp, ...args) => spawnSync(process.execPath, [FGOS, ...args, '--dir', tmp], { cwd: tmp, encoding: 'utf8' });

test('fgos run: the case flags go together, and an unknown or foreign case is refused by name before anything runs', (t) => {
  const tmp = repo(t);
  const cases = [
    [['run', 'look', '--case', 'wf-x'], /--case needs --activity/],
    [['run', 'look', '--activity', 'scout'], /needs --case/],
    [['run', 'look', '--reason', 'because'], /needs --case/],
    [['run', 'look', '--case', 'wf-x', '--activity', 'scout', '--route', 'sideways'], /--route must be/],
    [['run', '--resume', 'unit-run-1', '--case', 'wf-x', '--activity', 'a'], /cannot change a resumed unit run/],
    [['run', 'look', '--case', 'wf-missing', '--activity', 'scout'], /authority-context-invalid.*wf-missing/s],
  ];
  for (const [args, expected] of cases) {
    const refused = fgos(tmp, ...args);
    assert.notEqual(refused.status, 0, args.join(' '));
    assert.match(refused.stderr, expected, args.join(' '));
  }
  assert.equal(fs.existsSync(path.join(tmp, '.fgos', 'assignments')) ? fs.readdirSync(path.join(tmp, '.fgos', 'assignments')).length : 0, 0, 'no unit run was created');
});

test('fgos run --writes into a worktree a case binds, naming no case, is refused with how to name it', (t) => {
  const tmp = repo(t);
  const wt = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-case-doors-wt-')), 'wt');
  t.after(() => fs.rmSync(path.dirname(wt), { recursive: true, force: true }));
  execFileSync('git', ['worktree', 'add', '-q', '-b', 'doors/wt', wt], { cwd: tmp });
  const made = createPendingBinding({ mainRoot: tmp, caseId: 'wf-owner', generation: 1, worktree: wt });
  commitBinding({ mainRoot: tmp, key: made.key, caseId: 'wf-owner', generation: 1 });
  const refused = fgos(tmp, 'run', 'edit the docs', '--writes', 'docs', '--worktree', wt);
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /bound-worktree-requires-case-authority/);
  assert.match(refused.stderr, /--case wf-owner --activity/);
});

test('fgos workflow start --case: a Playbook parent is refused by name, a missing one is invalid, and no run is created', (t) => {
  const tmp = repo(t);
  fs.mkdirSync(path.join(tmp, 'core', 'workflows'), { recursive: true });
  const define = (id) => fs.writeFileSync(path.join(tmp, 'core', 'workflows', `${id}.json`), JSON.stringify({ id, steps: [{ id: 'entry', gate: { kind: 'human', question: 'Start?' } }] }));
  define('parked-one');
  define('child-one');
  const parked = fgos(tmp, 'workflow', 'start', 'parked-one', '--foreground');
  assert.equal(parked.status, 0, parked.stderr);
  const parentId = JSON.parse(parked.stdout).data.workflowRunId;
  const runs = () => fs.readdirSync(path.join(tmp, '.fgos', 'workflow-runs')).filter((n) => !n.startsWith('.')).length;
  const before = runs();

  const underPlaybook = fgos(tmp, 'workflow', 'start', 'child-one', '--case', parentId, '--foreground');
  assert.notEqual(underPlaybook.status, 0);
  assert.match(underPlaybook.stderr, /playbook-case-admits-via-proposer-only/);
  const underMissing = fgos(tmp, 'workflow', 'start', 'child-one', '--case', 'wf-missing', '--foreground');
  assert.notEqual(underMissing.status, 0);
  assert.match(underMissing.stderr, /authority-context-invalid/);
  assert.equal(runs(), before, 'neither created a run');
});

test('fgos run --case with a request and no --reason refuses request-reason-required before admission', (t) => {
  const tmp = repo(t);
  const refusedParam = fgos(tmp, 'run', 'look', '--pattern', 'reviewed', '--case', 'wf-bogus', '--activity', 'scout', '--param', 'maxRounds=2');
  assert.notEqual(refusedParam.status, 0);
  assert.match(refusedParam.stderr, /request-reason-required/);
});

/** An open case that planned and built a child with a verify receipt: the gate is what it may run next. */
function builtCase(tmp) {
  const run = openCase({ repoRoot: tmp });
  appendAll(run, [
    { type: 'reservation', payload: { reservationId: 'r-plan', activity: 'plan', writes: [], counters: { dispatches: 1, mutatingDispatches: 0 } } },
    settle('r-plan', { milestone: 'plan-ready', subjectDigest: 'sha256:plan', activity: 'plan' }),
    { type: 'reservation', payload: { reservationId: 'r-build', activity: 'build-a', writes: ['src/a'], counters: { dispatches: 1, mutatingDispatches: 1 } } },
    settle('r-build', { milestone: 'child-built', subjectDigest: 'sha256:child', receipts: [verifyReceipt('child-built', 'sha256:child')], activity: 'build-a' }),
  ]);
  return run.caseId;
}
const nodeExit = (code) => `"${process.execPath}" -e "process.exit(${code})"`;
const gateArgs = (id, code) => ['workflow', 'gate', id, '--worktree', '.', '--writes', 'README.md', '--verify', nodeExit(code)];

// The settle events, the frame and the refusals by name are proved against `gateWorkflow` in
// test/workflow/case-verbs.test.mjs; what only the CLI can show is that the verb reaches it and prints the answer. A failed gate is a settled answer, not a CLI error, so the exit code stays 0.
test('fgos workflow gate: a passing command prints the pass outcome and a failing one prints findings with its exit status; both exit 0, the outcome field carries the verdict', (t) => {
  const tmp = repo(t);
  fs.writeFileSync(path.join(tmp, 'README.md'), '# gate\n');
  const id = builtCase(tmp);

  // boundary: the printed envelope and exit code are the CLI's own contract; no lower layer sees them.
  const failed = fgos(tmp, ...gateArgs(id, 3));
  assert.equal(failed.status, 0, failed.stdout + failed.stderr);
  const findings = JSON.parse(failed.stdout).data;
  assert.deepEqual({ outcome: findings.outcome, passed: findings.gate.passed, status: findings.gate.status }, { outcome: 'findings', passed: false, status: 3 });

  // boundary: same door, the passing half of the pair.
  const passed = fgos(tmp, ...gateArgs(id, 0));
  assert.equal(passed.status, 0, passed.stdout + passed.stderr);
  const pass = JSON.parse(passed.stdout).data;
  assert.deepEqual({ caseId: pass.caseId, activity: pass.activity, outcome: pass.outcome, passed: pass.gate.passed, status: pass.gate.status }, { caseId: id, activity: 'integrate', outcome: 'pass', passed: true, status: 0 });
});
