// test/cli/fgos-case-doors.test.mjs — the case flags of the two doors: `fgos run --case` and `fgos workflow start --case`

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import { spawn, spawnSync, execFileSync } from 'node:child_process';

import { createPendingBinding, commitBinding } from '../../src/workflow/case-bindings.mjs';
import { acquireAdvanceLock } from '../../src/workflow/case-lock.mjs';
import { readWorkflowEvents } from '../../src/workflow/index.mjs';
import { readProjectConfig, writeProjectConfig } from '../helpers/config-fixture.mjs';
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
const gateArgs = (id) => ['workflow', 'gate', id, '--worktree', '.', '--writes', 'README.md', '--capability', 'code:implement'];
/** The project declares the command its gate runs; the gate has no flag to name another. */
function declareGate(tmp, command) {
  const cfg = readProjectConfig(tmp);
  cfg.runner = { ...cfg.runner, capabilities: { ...cfg.runner?.capabilities, 'code:implement': { verify: command } } };
  writeProjectConfig(tmp, cfg);
}

// The settle events, the frame and the refusals by name are proved against `gateWorkflow` in
// test/workflow/case-verbs.test.mjs; what only the CLI can show is that the verb reaches it and prints the answer. A failed gate is a settled answer that still exits with the canonical code of its outcome (14 for findings), like `fgos run`, so a script can branch on it.
test('fgos workflow gate: a passing command prints the pass outcome and exits 0; a failing one prints findings and exits with the canonical findings code', (t) => {
  const tmp = repo(t);
  fs.writeFileSync(path.join(tmp, 'README.md'), '# gate\n');
  const id = builtCase(tmp);

  // boundary: the printed envelope and exit code are the CLI's own contract; no lower layer sees them.
  declareGate(tmp, nodeExit(3));
  const failed = fgos(tmp, ...gateArgs(id));
  assert.equal(failed.status, 14, failed.stdout + failed.stderr);
  const findings = JSON.parse(failed.stdout).data;
  assert.deepEqual({ outcome: findings.outcome, passed: findings.gate.passed, status: findings.gate.status }, { outcome: 'findings', passed: false, status: 3 });

  // boundary: same door, the passing half of the pair.
  declareGate(tmp, nodeExit(0));
  const passed = fgos(tmp, ...gateArgs(id));
  assert.equal(passed.status, 0, passed.stdout + passed.stderr);
  const pass = JSON.parse(passed.stdout).data;
  assert.deepEqual({ caseId: pass.caseId, activity: pass.activity, outcome: pass.outcome, passed: pass.gate.passed, status: pass.gate.status }, { caseId: id, activity: 'integrate', outcome: 'pass', passed: true, status: 0 });

  // boundary: a command named on the line is an unknown flag at the arg layer; the declared one is the only one that runs.
  const named = fgos(tmp, ...gateArgs(id), '--verify', nodeExit(0));
  assert.notEqual(named.status, 0);
  assert.match(named.stderr, /--verify/);
});

// boundary: only the real CLI process can be killed mid-gate; the release rules themselves are proved against the drain in test/workflow/case-runtime.test.mjs.
test('fgos workflow gate: a killed gate\'s command keeps the worktree custody, so its reservation stays until the command ends and is then given back as not-started', { skip: process.platform === 'win32' }, async (t) => {
  const tmp = repo(t);
  fs.writeFileSync(path.join(tmp, 'README.md'), '# gate\n');
  const id = builtCase(tmp);
  const pidFile = path.join(tmp, 'gate-command.pid');
  const script = path.join(tmp, 'linger.mjs');
  fs.writeFileSync(script, `import fs from 'node:fs'; fs.writeFileSync(${JSON.stringify(pidFile)}, String(process.pid)); setInterval(() => {}, 1000);`);
  declareGate(tmp, `"${process.execPath}" "${script}"`);
  const gate = spawn(process.execPath, [FGOS, ...gateArgs(id), '--dir', tmp], { cwd: tmp, stdio: 'ignore' });
  const exited = new Promise((resolve) => gate.once('exit', resolve));
  const alive = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };
  const until = async (condition) => { for (let i = 0; i < 150 && !condition(); i += 1) await new Promise((resolve) => setTimeout(resolve, 100)); };
  await until(() => fs.existsSync(pidFile) && fs.readFileSync(pidFile, 'utf8') !== '');
  const command = Number(fs.readFileSync(pidFile, 'utf8'));
  t.after(() => { if (alive(command)) process.kill(command, 'SIGKILL'); });
  const gateSettles = () => readWorkflowEvents({ repoRoot: tmp, workflowRunId: id }).filter((e) => e.type === 'settle' && e.payload.activity === 'integrate');

  gate.kill('SIGKILL');
  await exited;
  acquireAdvanceLock(tmp, id).release();
  assert.deepEqual(gateSettles(), [], 'the command still holds the custody, so the reservation is not proven dead');

  process.kill(command, 'SIGKILL');
  await until(() => !alive(command));
  acquireAdvanceLock(tmp, id).release();
  assert.deepEqual(gateSettles().map((e) => e.payload.outcome), ['not-started']);
});
