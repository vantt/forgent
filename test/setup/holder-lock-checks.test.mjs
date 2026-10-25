// The holder-lock doctor checks and setup fixes, run for real: the in-process
// door answers the guarantee and the two-process probe, `flock(1)` of
// util-linux plays a foreign holder.
import '../helpers/process-tmp-root.mjs';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn, spawnSync } from 'node:child_process';

// Every machine lock of this file lives under a private state root; children inherit it.
process.env.FGOS_STATE_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-holder-lock-checks-state-root-'));

const {
  checkLockKernelSemantics,
  checkLockBorrowVectors,
  guaranteeRefusal,
  checkLockHolders,
  UNKNOWN_JUDGE_GRACE_MS,
  fixLockDirs,
  cutOverLockFiles,
} = await import('../../src/setup/holder-lock-checks.mjs');
const { fileHolders } = await import('../../src/holder-lock/index.mjs');
const { observe, selfRecord } = await import('../../src/runner/dispatch/process-identity.mjs');

const HOST_BIN = process.env.FGOS_HOST_BIN;
const STATE_ROOT = process.env.FGOS_STATE_ROOT;
const GIT_ENV = { ...process.env, GIT_AUTHOR_NAME: 'checks', GIT_AUTHOR_EMAIL: 'checks@test', GIT_COMMITTER_NAME: 'checks', GIT_COMMITTER_EMAIL: 'checks@test' };
const HAS_FLOCK = spawnSync('flock', ['--version'], { stdio: 'ignore' }).status === 0;

let scratch;
const children = new Set();
before(() => {
  assert.ok(HOST_BIN && fs.existsSync(HOST_BIN), `set FGOS_HOST_BIN to a host built from this checkout (npm test does): ${HOST_BIN}`);
  scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-holder-lock-checks-'));
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
  const env = { PATH: process.env.PATH, ...extra };
  return env;
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

// ─── lock-dirs fix + lock-kernel-semantics ──────────────────────────────

test('lock-dirs creates both lock directories with mode 0700, and only once', () => {
  const root = workspace('dirs');
  const lockRoot = path.join(STATE_ROOT, 'locks');
  fs.rmSync(lockRoot, { recursive: true, force: true });
  const first = fixLockDirs(root);
  assert.equal(first.changed, true, first.message);
  for (const dir of [path.join(root, '.fgos', 'locks'), lockRoot]) {
    assert.equal(fs.statSync(dir).mode & 0o777, 0o700, dir);
  }
  assert.deepEqual(fixLockDirs(root), { changed: false, message: 'lock directories present' });

  // A directory an acquire created before setup ran, with the umask's mode, is tightened.
  fs.chmodSync(lockRoot, 0o775);
  const tightened = fixLockDirs(root);
  assert.equal(tightened.changed, true);
  assert.match(tightened.message, /mode tightened to 0700/);
  assert.equal(fs.statSync(lockRoot).mode & 0o777, 0o700);
});

test('lock-kernel-semantics warns for a missing lock directory, then passes on the real mount once setup created it', async () => {
  const root = workspace('semantics');
  const missing = await checkLockKernelSemantics(root);
  assert.equal(missing.passed, true);
  assert.match(missing.message, /^warning: .*workspace .*\.fgos\/locks does not exist yet, not measured \(fgos setup creates it\)/);
  fixLockDirs(root);
  const res = await checkLockKernelSemantics(root);
  assert.equal(res.passed, true, res.message);
  assert.doesNotMatch(res.message, /^warning:/);
  assert.match(res.message, /workspace .*"driver":"flock","exclusion":"kernel","borrow":"kernel","holders":"kernel"}, two-process probe green/);
  assert.match(res.message, /machine .*, two-process probe green/);
  assert.ok(res.message.endsWith(`; stateRoot ${STATE_ROOT} (pinned); killWaitMs 2000 (fixed)`), res.message);
  assert.deepEqual(fs.readdirSync(path.join(root, '.fgos', 'locks')), [], 'the probe file is removed');
});

test('a guarantee of unsupported fails by name, a network filesystem too, a kernel one passes', () => {
  const shape = { driver: 'none', borrow: 'unsupported', holders: 'unsupported' };
  const unsupported = guaranteeRefusal('workspace', '/x/locks', { ...shape, exclusion: 'unsupported', platform: 'plan9' });
  assert.match(unsupported, /^workspace \/x\/locks .*"exclusion":"unsupported".*: holder-lock has no driver on plan9;/);
  assert.match(guaranteeRefusal('machine', '/x/locks', { ...shape, exclusion: 'none', notes: ['nfs'] }), /no lock exclusion \(nfs\)/);
  assert.equal(guaranteeRefusal('machine', '/x/locks', { driver: 'flock', exclusion: 'kernel', borrow: 'kernel', holders: 'kernel' }), null);
});

// ─── lock-borrow-vectors ────────────────────────────────────────────────

test('lock-borrow-vectors passes with the real host and real git', () => {
  const root = workspace('vectors');
  const res = checkLockBorrowVectors(root);
  assert.equal(res.passed, true, res.message);
  assert.match(res.message, /^all 4 vectors and the sibling check green \(git version /);
});

// ─── lock-holders ───────────────────────────────────────────────────────

// The classification itself is owned by the pure test in packages/holder-lock/rust/src/origin.rs; this is the wiring: the
// doctor row lists real holders through the door and warns only for the origin Rust calls foreign.
test('lock-holders: a foreign flock holder warns with pid and cmdline; a borrowed child and an attempt member do not', { skip: !HAS_FLOCK && 'util-linux flock missing' }, async () => {
  const root = workspace('holders');
  fixLockDirs(root);
  const gateway = path.join(root, '.fgos', 'locks', 'gateway.lock');
  fs.writeFileSync(gateway, '');
  assert.match(checkLockHolders(root).message, /^\d+ lock file\(s\) of 23 locks, 0 held, every holder a fgOS process or a borrowed child$/);

  const foreign = await holdWithFlock(gateway, foreignEnv());
  const warned = checkLockHolders(root);
  assert.equal(warned.passed, true);
  assert.match(warned.message, new RegExp(`^warning: gateway ${gateway.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')} held by pid ${foreign.pid} \\(flock -o .*gateway\\.lock sleep 30\\), not a fgOS process nor a borrowed child`));
  await stop(foreign);

  const borrowed = await holdWithFlock(gateway, foreignEnv({ FGOS_LOCK_FD: 'gateway:3' }));
  const clean = checkLockHolders(root);
  assert.match(clean.message, /^\d+ lock file\(s\) of 23 locks, 1 held, every holder a fgOS process or a borrowed child$/, clean.message);
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
  const member = checkLockHolders(root);
  assert.match(member.message, /^\d+ lock file\(s\) of 23 locks, 1 held, every holder a fgOS process or a borrowed child$/, member.message);

  process.kill(supervisor.pid, 'SIGKILL');
  const named = await (async () => {
    for (;;) {
      const res = checkLockHolders(root);
      if (res.message.startsWith('warning:')) return res;
      assert.ok(Date.now() < deadline + 5000, `still clean: ${res.message}`);
      await new Promise((resolve) => { setTimeout(resolve, 20); });
    }
  })();
  assert.match(named.message, new RegExp(`^warning: attempt .*attempt\\.lock held by pid ${monitorPid} \\(${monitorCmdline.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}\\), not a fgOS process nor a borrowed child`));
  process.kill(monitorPid, 'SIGKILL');
});

test('lock-holders: a predecessor domain that is still running warns with the domain; a dead one does not', async () => {
  const root = workspace('predecessor');
  fixLockDirs(root);
  const lockFile = path.join(root, '.fgos', 'locks', 'runner.lock');
  fs.writeFileSync(lockFile, '');
  const gate = spawn('sleep', ['30'], { stdio: 'ignore' });
  children.add(gate);
  await new Promise((resolve) => { gate.once('spawn', resolve); });
  const { kind: _kind, ...domainId } = observe(gate.pid);
  fs.writeFileSync(`${lockFile}.predecessor.json`, JSON.stringify({ v: 1, domainKind: 'linux-gate', domainId }));
  const live = checkLockHolders(root);
  assert.match(live.message, /^warning: runner: .*runner\.lock\.predecessor\.json: linux-gate domain .* is not empty \(alive\)/);
  assert.ok(live.message.includes(`"pid":${gate.pid}`));
  await stop(gate);
  assert.doesNotMatch(checkLockHolders(root).message, /^warning:/, 'a dead gate is an empty domain');

  fs.writeFileSync(`${lockFile}.predecessor.json`, JSON.stringify({ v: 2, domainKind: 'linux-gate' }));
  assert.match(checkLockHolders(root).message, /^warning: runner: .* has unknown version 2/);
});

test('lock-holders: a windows-job record the host cannot judge here warns with the domain and the reason', () => {
  const root = workspace('predecessor-windows-job');
  fixLockDirs(root);
  const lockFile = path.join(root, '.fgos', 'locks', 'runner.lock');
  fs.writeFileSync(lockFile, '');
  const holder = { host: os.hostname(), pid: 4242, startTime: '133800000000000000' };
  const domainId = { job: 'Local\\fgos-borrow-runner-4242-1-1', sessionId: '1', declaredAt: '133800000000000001', holder, keeper: null };
  fs.writeFileSync(`${lockFile}.predecessor.json`, JSON.stringify({ v: 1, domainKind: 'windows-job', domainId }));
  const res = checkLockHolders(root);
  assert.match(res.message, /^warning: runner: .*runner\.lock\.predecessor\.json: windows-job domain .* is unknown \(no-judge-on-this-platform\)/);
  assert.ok(res.message.includes('"pid":4242'));
  assert.ok(fs.existsSync(`${lockFile}.predecessor.json`), 'the read-only route leaves the record');

  fs.writeFileSync(`${lockFile}.predecessor.json`, JSON.stringify({ v: 1, domainKind: 'windows-job', domainId: 'Local\\old-string-shape' }));
  assert.match(checkLockHolders(root).message, /^warning: runner: .*is unknown \(record-unknown-shape\)/);
});

test('lock-holders scans every registry row that has a lock file, repo-config included, and skips rows with none', () => {
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

// ─── hot records, judged by lock-holders ────────────────────────────────

const hotRecord = (root, resource) => path.join(root, '.fgos', 'locks', `${resource}.hot`);

function hotWorkspace(name) {
  const root = workspace(name);
  fs.mkdirSync(path.join(root, '.fgos', 'locks'), { recursive: true });
  return root;
}

test('lock-holders: no hot record passes', () => {
  const result = checkLockHolders(hotWorkspace('hot-none'));
  assert.equal(result.passed, true);
  assert.doesNotMatch(result.message, /^warning:/);
});

test('lock-holders: a hot record of a live process with its full tuple passes', () => {
  const root = hotWorkspace('hot-live');
  const me = selfRecord();
  fs.writeFileSync(hotRecord(root, 'state'), JSON.stringify({ v: 1, pid: process.pid, startTime: me.startTime, bootId: me.bootId, pidNs: me.pidNs }));
  assert.doesNotMatch(checkLockHolders(root).message, /^warning:/);
});

test('lock-holders: a hot record that does not parse warns with its path and the fence command, for the right resource only', () => {
  const root = hotWorkspace('hot-garbage');
  fs.writeFileSync(hotRecord(root, 'porting-events'), '{"v":1,"pid":');
  const result = checkLockHolders(root);
  assert.equal(result.passed, true);
  assert.match(result.message, /^warning: /);
  assert.ok(result.message.includes(hotRecord(root, 'porting-events')), result.message);
  assert.match(result.message, /fgos lock fence porting-events/);
  assert.doesNotMatch(result.message, /fgos lock fence state/);
});

test('lock-holders: a hot record without a pid is unreadable', () => {
  const root = hotWorkspace('hot-no-pid');
  fs.writeFileSync(hotRecord(root, 'state'), JSON.stringify({ v: 1 }));
  assert.match(checkLockHolders(root).message, /fgos lock fence state/);
});

test('lock-holders: a hot record naming a live pid in a foreign namespace warns only after the grace', () => {
  const root = hotWorkspace('hot-foreign-ns');
  const me = selfRecord();
  // The recorded namespace differs from ours, so the judge cannot place the live pid.
  fs.writeFileSync(hotRecord(root, 'state'), JSON.stringify({ v: 1, pid: process.pid, startTime: me.startTime, bootId: me.bootId, pidNs: 'pid:[0]' }));
  const young = checkLockHolders(root);
  const old = checkLockHolders(root, { now: Date.now() + UNKNOWN_JUDGE_GRACE_MS + 60_000 });
  assert.doesNotMatch(young.message, /^warning:/);
  assert.match(old.message, /cannot be judged here/);
  assert.match(old.message, /fgos lock fence state/);
});
