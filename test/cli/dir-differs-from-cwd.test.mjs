// test/cli/dir-differs-from-cwd.test.mjs — a `--dir` naming another project than the working directory

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

import { dirDiffersFromCwdWarning } from '../../src/workflow/dir-guard.mjs';

const BIN_FGOS = path.resolve('bin/fgos.mjs');
import { FIXTURE_ROOT, makeFixtureDir } from '../helpers/fixture-dir.mjs';

const made = [];
after(() => {
  for (const dir of made) fs.rmSync(dir, { recursive: true, force: true });
});

function makeRepo(prefix) {
  const dir = fs.realpathSync(makeFixtureDir(prefix));
  made.push(dir);
  execFileSync('git', ['init', '-b', 'main'], { cwd: dir, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'Dir Test'], { cwd: dir, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'dir@test.local'], { cwd: dir, stdio: 'ignore' });
  fs.writeFileSync(path.join(dir, 'README.md'), '# project\n');
  execFileSync('git', ['add', 'README.md'], { cwd: dir, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', 'initial commit'], { cwd: dir, stdio: 'ignore' });
  return dir;
}

function makePlan(root) {
  const planDir = path.join(root, 'plan');
  fs.mkdirSync(planDir);
  fs.writeFileSync(path.join(planDir, 'plan.md'), '---\ntitle: "Dir Plan"\n---\n');
  fs.writeFileSync(path.join(planDir, 'phase-01-start.md'), '---\nphase: 1\ntitle: "Start Phase"\ndependencies: []\n---\n');
  return planDir;
}

function fgos(args, cwd) {
  const env = { ...process.env };
  delete env.CLAUDE_CODE_SESSION_ID;
  delete env.FGOS_WORKFLOW_ADVANCE_DETACHED;
  return spawnSync(process.execPath, [BIN_FGOS, ...args], { cwd, encoding: 'utf8', env });
}

test('a --dir in another repository than the working directory is reported with a fix', () => {
  const here = makeRepo('fgos-dir-here-');
  const there = makeRepo('fgos-dir-there-');
  const warning = dirDiffersFromCwdWarning({ dir: there, cwd: here, env: {} });
  assert.equal(warning.code, 'dir-differs-from-cwd');
  assert.ok(warning.message.includes(there) && warning.message.includes(here), warning.message);
  assert.ok(warning.fix.includes(`cd ${there}`), warning.fix);
});

test('no warning when the project is the working directory, a linked worktree of it, or nested in it', () => {
  const here = makeRepo('fgos-dir-same-');
  const linked = path.join(FIXTURE_ROOT, `fgos-dir-linked-${process.pid}`);
  made.push(linked);
  execFileSync('git', ['worktree', 'add', '-b', 'side', linked], { cwd: here, stdio: 'ignore' });
  const nested = path.join(here, 'inner');
  fs.mkdirSync(nested);
  execFileSync('git', ['init', '-b', 'main'], { cwd: nested, stdio: 'ignore' });

  const check = (dir, cwd) => dirDiffersFromCwdWarning({ dir, cwd, env: {} });
  assert.equal(check(here, here), null);
  assert.equal(check(here, linked), null);
  assert.equal(check(linked, here), null);
  assert.equal(check(nested, here), null);
  assert.equal(check(here, nested), null);
});

test('no warning without --dir, with an explicit --worktree, outside a repository, or in a detached child', () => {
  const here = makeRepo('fgos-dir-quiet-here-');
  const there = makeRepo('fgos-dir-quiet-there-');
  const plain = makeFixtureDir('fgos-dir-plain-');
  made.push(plain);

  assert.equal(dirDiffersFromCwdWarning({ cwd: here, env: {} }), null);
  assert.equal(dirDiffersFromCwdWarning({ dir: there, worktree: there, cwd: here, env: {} }), null);
  assert.equal(dirDiffersFromCwdWarning({ dir: plain, cwd: here, env: {} }), null);
  assert.equal(dirDiffersFromCwdWarning({ dir: there, cwd: plain, env: {} }), null);
  assert.equal(dirDiffersFromCwdWarning({ dir: there, cwd: here, env: { FGOS_WORKFLOW_ADVANCE_DETACHED: '1' } }), null);
});

test('workflow start from another project warns on stderr and in the output, and still runs', () => {
  const here = makeRepo('fgos-dir-start-here-');
  const there = makeRepo('fgos-dir-start-there-');
  const planDir = makePlan(there);

  const result = fgos(['workflow', 'start', '--plan', planDir, '--dir', there, '--foreground'], here);
  assert.equal(result.status, 0, result.stderr);
  const warningLines = result.stderr.split('\n').filter((line) => line.includes('dir-differs-from-cwd'));
  assert.equal(warningLines.length, 1, result.stderr);
  assert.ok(warningLines[0].includes(`cd ${there}`), warningLines[0]);

  const { data } = JSON.parse(result.stdout);
  assert.notEqual(data.status, 'running');
  assert.equal(data.warnings.length, 1);
  assert.equal(data.warnings[0].code, 'dir-differs-from-cwd');
  assert.ok(data.warnings[0].message && data.warnings[0].fix);
  assert.ok(fs.existsSync(path.join(there, '.fgos', 'workflow-runs', data.workflowRunId)), 'state is stored under --dir');
});

test('workflow start from inside the project says nothing about --dir', () => {
  const there = makeRepo('fgos-dir-inside-');
  const planDir = makePlan(there);

  const result = fgos(['workflow', 'start', '--plan', planDir, '--dir', there, '--foreground'], there);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(!result.stderr.includes('dir-differs-from-cwd'), result.stderr);
  assert.equal(JSON.parse(result.stdout).data.warnings, undefined);
});

test('a detached start warns once and its resume child does not warn again', async () => {
  const here = makeRepo('fgos-dir-detach-here-');
  const there = makeRepo('fgos-dir-detach-there-');
  const planDir = makePlan(there);

  const started = fgos(['workflow', 'start', '--plan', planDir, '--dir', there], here);
  assert.equal(started.status, 0, started.stderr);
  assert.equal(started.stderr.split('\n').filter((line) => line.includes('dir-differs-from-cwd')).length, 1, started.stderr);
  const { data } = JSON.parse(started.stdout);
  assert.equal(data.warnings[0].code, 'dir-differs-from-cwd');

  const logPath = data.detached.logPath;
  const deadline = Date.now() + 30_000;
  let status;
  while (Date.now() < deadline) {
    status = JSON.parse(fgos(['workflow', 'status', data.workflowRunId, '--dir', there], there).stdout).data.status;
    if (status !== 'running') break;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert.notEqual(status, 'running');
  assert.ok(!fs.readFileSync(logPath, 'utf8').includes('dir-differs-from-cwd'));
});

test('workflow resume and answer warn before they act', () => {
  const here = makeRepo('fgos-dir-resume-here-');
  const there = makeRepo('fgos-dir-resume-there-');

  const resume = fgos(['workflow', 'resume', 'wf-run-missing', '--dir', there, '--foreground'], here);
  assert.notEqual(resume.status, 0);
  assert.ok(resume.stderr.includes('dir-differs-from-cwd'), resume.stderr);

  const answer = fgos(['workflow', 'answer', 'wf-run-missing', '--step', 's', '--answer', 'a', '--dir', there, '--foreground'], here);
  assert.notEqual(answer.status, 0);
  assert.ok(answer.stderr.includes('dir-differs-from-cwd'), answer.stderr);
});

test('fgos run warns for another project but not for run record or status', () => {
  const here = makeRepo('fgos-dir-run-here-');
  const there = makeRepo('fgos-dir-run-there-');

  const run = fgos(['run', '--unit', path.join(there, 'missing-unit.yaml'), '--dir', there], here);
  assert.ok(run.stderr.includes('dir-differs-from-cwd'), run.stderr);

  const record = fgos(['run', 'record', '--dir', there], here);
  assert.ok(!record.stderr.includes('dir-differs-from-cwd'), record.stderr);

  const status = fgos(['workflow', 'status', 'wf-run-missing', '--dir', there], here);
  assert.ok(!status.stderr.includes('dir-differs-from-cwd'), status.stderr);
});
