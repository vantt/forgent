// The judgments `fgos lock-status` reports as `problems`, run for real: the in-process door lists holders and
// `flock(1)` of util-linux plays a foreign holder.
import '../helpers/process-tmp-root.mjs';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn, spawnSync } from 'node:child_process';

// Every machine lock of this file lives under a private state root; children inherit it.
process.env.FGOS_STATE_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-lock-status-state-root-'));

const { collectLockStatus, cutOverLockFiles, UNKNOWN_JUDGE_GRACE_MS } = await import('../../src/runner/lock-status.mjs');
const { fixLockDirs } = await import('../../src/setup/holder-lock-checks.mjs');
const { fileHolders } = await import('../../src/holder-lock/index.mjs');
const { observe, selfRecord } = await import('../../src/native/process-identity.mjs');

const STATE_ROOT = process.env.FGOS_STATE_ROOT;
const GIT_ENV = { ...process.env, GIT_AUTHOR_NAME: 'checks', GIT_AUTHOR_EMAIL: 'checks@test', GIT_COMMITTER_NAME: 'checks', GIT_COMMITTER_EMAIL: 'checks@test' };
const HAS_FLOCK = spawnSync('flock', ['--version'], { stdio: 'ignore' }).status === 0;

let scratch;
const children = new Set();
before(() => {
  scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-lock-status-'));
});
after(async () => {
  for (const child of children) await stop(child);
  fs.rmSync(scratch, { recursive: true, force: true });
  fs.rmSync(STATE_ROOT, { recursive: true, force: true });
});

function workspace(name) {
  const root = path.join(scratch, name);
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  execFileSync('git', ['init', '-q'], { cwd: root, env: GIT_ENV });
  execFileSync('git', ['commit', '-q', '--allow-empty', '-m', 'init'], { cwd: root, env: GIT_ENV });
  return root;
}

/** The `problems` of one workspace's lock report. */
const problemsOf = (root, options = {}) => collectLockStatus({ fgosDir: path.join(root, '.fgos'), ...options }).problems;

async function stop(child) {
  children.delete(child);
  if (child.exitCode === null && child.signalCode === null) {
    const exited = new Promise((resolve) => { child.once('exit', resolve); });
    child.kill('SIGKILL');
    await exited;
  }
}

/** The environment of a process fgOS did not start: none of the variables that mark one. */
function foreignEnv(extra = {}) {
  return { PATH: process.env.PATH, ...extra };
}

/** `flock -o <file> sleep 30` (the sleep does not inherit the lock) and wait until the kernel lists it as a holder of `file`. */
async function holdWithFlock(file, env) {
  const child = spawn('flock', ['-o', file, 'sleep', '30'], { env, stdio: 'ignore' });
  children.add(child);
  const deadline = Date.now() + 5000;
  for (;;) {
    const holders = fileHolders('gateway', file);
    if (holders.kind === 'list' && holders.holders.some((h) => h.pid === child.pid)) return child;
    if (Date.now() > deadline) throw new Error('flock did not take the lock');
    await new Promise((resolve) => { setTimeout(resolve, 20); });
  }
}

// ─── foreign holders ────────────────────────────────────────────────────

// The classification itself is owned by the pure test in packages/holder-lock/rust/src/origin.rs; this is the wiring: the
// report lists real holders through the door and names only the origin Rust calls foreign.
test('lock problems: a foreign flock holder is named with pid and cmdline; a borrowed child and an attempt member are not', { skip: !HAS_FLOCK && 'util-linux flock missing' }, async () => {
  const root = workspace('holders');
  fixLockDirs(root);
  const gateway = path.join(root, '.fgos', 'locks', 'gateway.lock');
  fs.writeFileSync(gateway, '');
  assert.deepEqual(problemsOf(root), []);

  const foreign = await holdWithFlock(gateway, foreignEnv());
  const warned = problemsOf(root);
  assert.equal(warned.length, 1, warned.join('\n'));
  assert.match(warned[0], new RegExp(`^gateway ${gateway.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')} held by pid ${foreign.pid} \\(flock -o .*gateway\\.lock sleep 30\\), not a fgOS process nor a borrowed child`));
  await stop(foreign);

  const borrowed = await holdWithFlock(gateway, foreignEnv({ FGOS_LOCK_FD: 'gateway:3' }));
  assert.deepEqual(problemsOf(root), []);
  await stop(borrowed);

  // An attempt's monitor whose parent is the supervisor is a member; once the parent is gone it is named.
  const dir = path.join(root, '.fgos', 'assignments', 'asgn-1', 'runs', '01');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'envelope.json'), JSON.stringify({ v: 3, attemptId: 'att-holders' }));
  const lock = path.join(dir, 'attempt.lock');
  fs.writeFileSync(lock, '');

  // The monitor is a script named bwrap: only a process of that name can be a member. A copied
  // binary is not portable (a multi-call coreutils sleep picks its tool from argv[0]). Its sleep
  // child drops the lock descriptor, so the monitor is the only other holder.
  const bwrap = path.join(scratch, 'bwrap');
  fs.writeFileSync(bwrap, '#!/bin/sh\nsleep "$1" 9>&- &\nwait\n', { mode: 0o755 });
  // The parent plays the supervisor (it carries the lock marker); its child keeps the same description
  // with no marker at all, as the bwrap monitor does.
  const supervisor = spawn('sh', ['-c', 'exec 9>>"$1"; flock -x 9; env -i "$2" 30 & wait', 'sh', lock, bwrap], { env: foreignEnv({ FGOS_LOCK_FD: 'attempt:9' }), stdio: 'ignore' });
  children.add(supervisor);
  let monitorPid;
  const deadline = Date.now() + 5000;
  for (;;) {
    const holders = fileHolders('attempt', lock);
    if (holders.kind === 'list' && holders.holders.length === 2 && holders.holders.some((h) => h.pid === supervisor.pid)) {
      monitorPid = holders.holders.find((h) => h.pid !== supervisor.pid).pid;
      break;
    }
    assert.ok(Date.now() < deadline, 'supervisor and monitor did not both hold the lock');
    await new Promise((resolve) => { setTimeout(resolve, 20); });
  }
  const monitorCmdline = fs.readFileSync(`/proc/${monitorPid}/cmdline`, 'utf8').split('\0').filter(Boolean).join(' ');
  assert.deepEqual(problemsOf(root), []);

  process.kill(supervisor.pid, 'SIGKILL');
  const named = await (async () => {
    for (;;) {
      const res = problemsOf(root);
      if (res.length > 0) return res[0];
      assert.ok(Date.now() < deadline + 5000, 'still clean');
      await new Promise((resolve) => { setTimeout(resolve, 20); });
    }
  })();
  assert.match(named, new RegExp(`^attempt .*attempt\\.lock held by pid ${monitorPid} \\(${monitorCmdline.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}\\), not a fgOS process nor a borrowed child`));
  process.kill(monitorPid, 'SIGKILL');
});

test('lock problems: a predecessor domain that is still running is named with the domain; a dead one is not', async () => {
  const root = workspace('predecessor');
  fixLockDirs(root);
  const lockFile = path.join(root, '.fgos', 'locks', 'runner.lock');
  fs.writeFileSync(lockFile, '');
  const gate = spawn('sleep', ['30'], { stdio: 'ignore' });
  children.add(gate);
  await new Promise((resolve) => { gate.once('spawn', resolve); });
  const { kind: _kind, ...domainId } = observe(gate.pid);
  fs.writeFileSync(`${lockFile}.predecessor.json`, JSON.stringify({ v: 1, domainKind: 'linux-gate', domainId }));
  const [live] = problemsOf(root);
  assert.match(live, /^runner: .*runner\.lock\.predecessor\.json: linux-gate domain .* is not empty \(alive\)/);
  assert.ok(live.includes(`"pid":${gate.pid}`));
  await stop(gate);
  assert.deepEqual(problemsOf(root), [], 'a dead gate is an empty domain');

  fs.writeFileSync(`${lockFile}.predecessor.json`, JSON.stringify({ v: 2, domainKind: 'linux-gate' }));
  assert.match(problemsOf(root)[0], /^runner: .* has unknown version 2/);
});

test('lock problems: a windows-job record the host cannot judge here is named with the domain and the reason', () => {
  const root = workspace('predecessor-windows-job');
  fixLockDirs(root);
  const lockFile = path.join(root, '.fgos', 'locks', 'runner.lock');
  fs.writeFileSync(lockFile, '');
  const holder = { host: os.hostname(), pid: 4242, startTime: '133800000000000000' };
  const domainId = { job: 'Local\\fgos-borrow-runner-4242-1-1', sessionId: '1', declaredAt: '133800000000000001', holder, keeper: null };
  fs.writeFileSync(`${lockFile}.predecessor.json`, JSON.stringify({ v: 1, domainKind: 'windows-job', domainId }));
  const [res] = problemsOf(root);
  assert.match(res, /^runner: .*runner\.lock\.predecessor\.json: windows-job domain .* is unknown \(no-judge-on-this-platform\)/);
  assert.ok(res.includes('"pid":4242'));
  assert.ok(fs.existsSync(`${lockFile}.predecessor.json`), 'the read-only route leaves the record');

  fs.writeFileSync(`${lockFile}.predecessor.json`, JSON.stringify({ v: 1, domainKind: 'windows-job', domainId: 'Local\\old-string-shape' }));
  assert.match(problemsOf(root)[0], /^runner: .*is unknown \(record-unknown-shape\)/);
});

test('the problem scan covers every registry row that has a lock file, repo-config included, and skips rows with none', () => {
  const root = workspace('scanned-rows');
  fixLockDirs(root);
  const repoConfig = path.join(root, '.fgos', 'locks', 'repo-config.lock');
  fs.writeFileSync(repoConfig, '');
  const projectConfig = path.join(root, '.fgos', 'locks', 'project-config.lock');
  fs.writeFileSync(projectConfig, '');
  const lockRoot = path.join(root, 'lock-root');
  fs.mkdirSync(lockRoot);
  const globalConfig = path.join(lockRoot, 'global-config.lock');
  fs.writeFileSync(globalConfig, '');
  const rows = cutOverLockFiles({ fgosDir: path.join(root, '.fgos'), lockRoot });
  assert.deepEqual(rows.find((row) => row.lock === 'repo-config').files, [repoConfig]);
  assert.deepEqual(rows.find((row) => row.lock === 'project-config').files, [projectConfig]);
  assert.deepEqual(rows.find((row) => row.lock === 'global-config').files, [globalConfig]);
  // Every registry row but the three without a lock file is scanned: a new row without an entry fails here.
  const withoutFile = ['attempt', 'event-seal', 'event-append'];
  assert.deepEqual(rows.map((row) => row.lock).filter((name) => withoutFile.includes(name)), []);
  const registry = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, '../../packages/holder-lock/contracts/lock-registry.v1.json'), 'utf8')).locks;
  assert.deepEqual(rows.map((row) => row.lock).sort(), registry.map((lock) => lock.name).filter((name) => !withoutFile.includes(name)).sort());
});

// ─── hot records ────────────────────────────────

const hotRecord = (root, resource) => path.join(root, '.fgos', 'locks', `${resource}.hot`);

function hotWorkspace(name) {
  const root = workspace(name);
  fs.mkdirSync(path.join(root, '.fgos', 'locks'), { recursive: true });
  return root;
}

test('lock problems: a fresh workspace and a missing hot record report nothing', () => {
  assert.deepEqual(problemsOf(hotWorkspace('hot-none')), []);
});

test('lock problems: a hot record of a live process with its full tuple is no problem', () => {
  const root = hotWorkspace('hot-live');
  const me = selfRecord();
  fs.writeFileSync(hotRecord(root, 'state'), JSON.stringify({ v: 1, pid: process.pid, startTime: me.startTime, bootId: me.bootId, pidNs: me.pidNs }));
  assert.deepEqual(problemsOf(root), []);
});

test('lock problems: a hot record that does not parse is named with its path and the fence command, for the right resource only', () => {
  const root = hotWorkspace('hot-garbage');
  fs.writeFileSync(hotRecord(root, 'porting-events'), '{"v":1,"pid":');
  const problems = problemsOf(root);
  assert.equal(problems.length, 1, problems.join('\n'));
  assert.ok(problems[0].includes(hotRecord(root, 'porting-events')), problems[0]);
  assert.match(problems[0], /fgos lock fence porting-events/);
  assert.doesNotMatch(problems[0], /fgos lock fence state/);
});

test('lock problems: a hot record without a pid is unreadable', () => {
  const root = hotWorkspace('hot-no-pid');
  fs.writeFileSync(hotRecord(root, 'state'), JSON.stringify({ v: 1 }));
  assert.match(problemsOf(root)[0], /fgos lock fence state/);
});

test('lock problems: a hot record naming a live pid in a foreign namespace is named only after the grace', () => {
  const root = hotWorkspace('hot-foreign-ns');
  const me = selfRecord();
  // The recorded namespace differs from ours, so the judge cannot place the live pid.
  fs.writeFileSync(hotRecord(root, 'state'), JSON.stringify({ v: 1, pid: process.pid, startTime: me.startTime, bootId: me.bootId, pidNs: 'pid:[0]' }));
  const young = problemsOf(root);
  const old = problemsOf(root, { now: Date.now() + UNKNOWN_JUDGE_GRACE_MS + 60_000 });
  assert.deepEqual(young, []);
  assert.match(old[0], /cannot be judged here/);
  assert.match(old[0], /fgos lock fence state/);
});
