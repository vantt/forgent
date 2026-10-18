// The holder-lock doctor checks and setup fixes, run for real: the host
// route answers the guarantee, the probe hands a real description to a real
// child, `flock(1)` of util-linux plays a foreign holder, and the fence fix
// goes through the host's quiesce scan.
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
  checkLockFences,
  fixLockFences,
  checkLockPredecessorKillWait,
  checkStateRoot,
  fixLockDirs,
  twoProcessProbe,
  activatedHolderLockRelease,
  MAX_KILL_WAIT_MS,
} = await import('../../src/setup/holder-lock-checks.mjs');
const { checkStopped, ownPidChain, fenceStatus } = await import('../../src/holder-lock/fences.mjs');
const { descriptionHolders } = await import('../../src/holder-lock/driver.mjs');
const { getBootId, getPidNs, getProcessStartTime } = await import('../../src/runner/dispatch/process-identity.mjs');

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

function writeConfig(file, config) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(config)}\n`);
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
    const holders = descriptionHolders(file);
    if (holders.kind === 'list' && holders.pids.includes(child.pid)) return child;
    if (Date.now() > deadline) throw new Error('flock did not take the lock');
    await new Promise((resolve) => { setTimeout(resolve, 20); });
  }
}

// ─── lock-predecessor-kill-wait ─────────────────────────────────────────

test('lock-predecessor-kill-wait: absent passes with the default, valid values name their source', () => {
  const root = workspace('kill-wait');
  const globalConfigPath = path.join(scratch, 'kill-wait-home', '.fgos', 'config.json');
  let res = checkLockPredecessorKillWait(root, { globalConfigPath });
  assert.deepEqual(res, { passed: true, message: 'lock.predecessorKillWaitMs = 2000 (default)' });

  writeConfig(globalConfigPath, { lock: { predecessorKillWaitMs: 750 } });
  res = checkLockPredecessorKillWait(root, { globalConfigPath });
  assert.deepEqual(res, { passed: true, message: 'lock.predecessorKillWaitMs = 750 (global)' });

  writeConfig(path.join(root, '.fgos', 'config.json'), { lock: { predecessorKillWaitMs: 500 } });
  res = checkLockPredecessorKillWait(root, { globalConfigPath });
  assert.deepEqual(res, { passed: true, message: 'lock.predecessorKillWaitMs = 500 (project)' }, 'project overrides global');

  writeConfig(path.join(root, '.fgos', 'config.json'), { lock: { predecessorKillWaitMs: MAX_KILL_WAIT_MS } });
  assert.equal(checkLockPredecessorKillWait(root, { globalConfigPath }).passed, true, 'the upper bound itself is accepted');
});

test('lock-predecessor-kill-wait: negative, string, fractional and over-the-bound values fail by name', () => {
  const root = workspace('kill-wait-bad');
  const globalConfigPath = path.join(scratch, 'kill-wait-bad-home', '.fgos', 'config.json');
  for (const value of [-5, 0, '2000', 1.5, MAX_KILL_WAIT_MS + 1]) {
    writeConfig(path.join(root, '.fgos', 'config.json'), { lock: { predecessorKillWaitMs: value } });
    const res = checkLockPredecessorKillWait(root, { globalConfigPath });
    assert.equal(res.passed, false, `value ${JSON.stringify(value)}`);
    assert.match(res.message, /^lock\.predecessorKillWaitMs = .* \(project\) must be an integer from 1 to 60000$/);
  }
  fs.writeFileSync(path.join(root, '.fgos', 'config.json'), '{ not json');
  const res = checkLockPredecessorKillWait(root, { globalConfigPath });
  assert.equal(res.passed, false);
  assert.match(res.message, /unreadable: cannot parse shared config/);
});

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
  assert.match(res.message, /machine .*, two-process probe green$/);
  assert.deepEqual(fs.readdirSync(path.join(root, '.fgos', 'locks')), [], 'the probe file is removed');
});

test('the two-process probe passes on tmpfs as well', { skip: !fs.existsSync('/dev/shm') && 'no /dev/shm' }, async () => {
  const dir = fs.mkdtempSync(path.join('/dev/shm', 'fgos-semantics-probe-'));
  try {
    const ms = await twoProcessProbe(dir, HOST_BIN);
    assert.ok(ms < 2000, `probe took ${ms} ms`);
    assert.deepEqual(fs.readdirSync(dir), []);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the probe refuses a probe file another process already holds', async () => {
  const dir = path.join(scratch, 'probe-leak');
  fs.mkdirSync(dir);
  // A foreign process already holds the very file the probe will lock: the fresh probe file is not fresh.
  const file = path.join(dir, `.semantics-probe-${process.pid}.lock`);
  fs.writeFileSync(file, '');
  const holder = await holdWithFlock(file, foreignEnv());
  await assert.rejects(twoProcessProbe(dir, HOST_BIN), /a fresh probe file answered held/);
  await stop(holder);
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

test('lock-holders: a foreign flock holder warns with pid and cmdline; a borrowed child does not', { skip: !HAS_FLOCK && 'util-linux flock missing' }, async () => {
  const root = workspace('holders');
  fixLockDirs(root);
  const gateway = path.join(root, '.fgos', 'locks', 'gateway.lock');
  fs.writeFileSync(gateway, '');
  assert.match(checkLockHolders(root).message, /^\d+ lock file\(s\) of 18 locks, 0 held, every holder a fgOS process or a borrowed child$/);

  const foreign = await holdWithFlock(gateway, foreignEnv());
  const warned = checkLockHolders(root);
  assert.equal(warned.passed, true);
  assert.match(warned.message, new RegExp(`^warning: gateway ${gateway.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')} held by pid ${foreign.pid} \\(flock -o .*gateway\\.lock sleep 30\\), not a fgOS process nor a borrowed child`));
  await stop(foreign);

  const borrowed = await holdWithFlock(gateway, foreignEnv({ FGOS_LOCK_FD: 'gateway:3' }));
  const clean = checkLockHolders(root);
  assert.match(clean.message, /^\d+ lock file\(s\) of 18 locks, 1 held, every holder a fgOS process or a borrowed child$/, clean.message);
  await stop(borrowed);
});

test('lock-holders covers the main checkout, merge slot and worktree-admin files: a foreign holder warns, a borrowed child does not', { skip: !HAS_FLOCK && 'util-linux flock missing' }, async () => {
  const root = workspace('holders-main-door');
  fixLockDirs(root);
  const locks = path.join(root, '.fgos', 'locks');
  const mainLock = path.join(locks, 'main-checkout.lock');
  const slot = path.join(locks, 'merge-slot--main.lock');
  const admin = path.join(locks, 'worktree-admin.lock');
  for (const file of [mainLock, slot, admin]) fs.writeFileSync(file, '');
  assert.match(checkLockHolders(root).message, /^3 lock file\(s\) of 18 locks, 0 held, every holder a fgOS process or a borrowed child$/);

  const foreign = await holdWithFlock(mainLock, foreignEnv());
  const warned = checkLockHolders(root);
  assert.equal(warned.passed, true);
  assert.match(warned.message, new RegExp(`^warning: main-checkout .*main-checkout\\.lock held by pid ${foreign.pid} .*not a fgOS process nor a borrowed child`));
  await stop(foreign);

  const borrowed = await holdWithFlock(mainLock, foreignEnv({ FGOS_LOCK_FD: 'main-checkout:3' }));
  const heldSlot = await holdWithFlock(slot, foreignEnv());
  const mixed = checkLockHolders(root);
  assert.match(mixed.message, new RegExp(`^warning: merge-slot .*merge-slot--main\\.lock held by pid ${heldSlot.pid} `));
  assert.ok(!mixed.message.includes('main-checkout.lock held'), 'a borrowed git child of the main checkout lock is a member');
  await stop(borrowed);
  await stop(heldSlot);
});

test('lock-holders: a monitor whose parent is the supervisor of the attempt is a member; once the parent is gone it is named', { skip: !HAS_FLOCK && 'util-linux flock missing' }, async () => {
  const root = workspace('holders-attempt');
  fixLockDirs(root);
  const dir = path.join(root, '.fgos', 'assignments', 'asgn-1', 'runs', '01');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'envelope.json'), JSON.stringify({ v: 3, attemptId: 'att-holders' }));
  const lock = path.join(dir, 'attempt.lock');
  fs.writeFileSync(lock, '');

  // The monitor is a copy of sleep named bwrap: only a process of that name can be a member.
  const bwrap = path.join(scratch, 'bwrap');
  fs.copyFileSync(execFileSync('sh', ['-c', 'command -v sleep'], { encoding: 'utf8' }).trim(), bwrap);
  fs.chmodSync(bwrap, 0o755);
  // The parent plays the supervisor (it carries the lock marker); its child keeps the same description
  // with no marker at all, as the bwrap monitor does.
  const supervisor = spawn('sh', ['-c', 'exec 9>>"$1"; flock -x 9; env -i "$2" 30 & wait', 'sh', lock, bwrap], { env: foreignEnv({ FGOS_LOCK_FD: 'attempt:9' }), stdio: 'ignore' });
  children.add(supervisor);
  let monitorPid;
  const deadline = Date.now() + 5000;
  for (;;) {
    const holders = descriptionHolders(lock);
    if (holders.kind === 'list' && holders.pids.length === 2 && holders.pids.includes(supervisor.pid)) {
      monitorPid = holders.pids.find((pid) => pid !== supervisor.pid);
      break;
    }
    assert.ok(Date.now() < deadline, 'supervisor and monitor did not both hold the lock');
    await new Promise((resolve) => { setTimeout(resolve, 20); });
  }
  const member = checkLockHolders(root);
  assert.match(member.message, /^1 lock file\(s\) of 18 locks, 1 held, every holder a fgOS process or a borrowed child$/, member.message);

  process.kill(supervisor.pid, 'SIGKILL');
  const named = await (async () => {
    for (;;) {
      const res = checkLockHolders(root);
      if (res.message.startsWith('warning:')) return res;
      assert.ok(Date.now() < deadline + 5000, `still clean: ${res.message}`);
      await new Promise((resolve) => { setTimeout(resolve, 20); });
    }
  })();
  assert.match(named.message, new RegExp(`^warning: attempt .*attempt\\.lock held by pid ${monitorPid} \\(${bwrap.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')} 30\\), not a fgOS process nor a borrowed child`));
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
  const domainId = { host: os.hostname(), bootId: getBootId(), pidNs: getPidNs(), pid: gate.pid, startTime: getProcessStartTime(gate.pid) };
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

// ─── lock-fences ────────────────────────────────────────────────────────

/** A ready activation of a release whose payload ships the lock registry (or not). */
function activate(root, { withRegistry }) {
  const release = path.join(scratch, `release-${path.basename(root)}-${withRegistry ? 'v3' : 'v1'}`);
  const payload = path.join(release, 'libexec', 'legacy-node');
  fs.mkdirSync(payload, { recursive: true });
  writeConfig(path.join(release, 'manifest.json'), { schemaVersion: 1, components: { legacyNode: { root: 'libexec/legacy-node', entry: 'bin/fgos.mjs' } } });
  if (withRegistry) {
    const registry = path.join(payload, 'packages', 'holder-lock', 'contracts', 'lock-registry.v1.json');
    fs.mkdirSync(path.dirname(registry), { recursive: true });
    fs.copyFileSync(new URL('../../packages/holder-lock/contracts/lock-registry.v1.json', import.meta.url), registry);
  }
  writeConfig(path.join(root, '.fgos', 'installation', 'activation.json'), { schemaVersion: 1, status: 'ready', releasePath: release });
}

/** fgOS processes of other sessions match every workspace through their argv; name the ones running now (fences-stop-check does the same). */
function otherSessionPids() {
  const probe = path.join(scratch, 'foreign-probe');
  fs.mkdirSync(probe, { recursive: true });
  const scan = checkStopped({ workspaces: [probe], hostBin: HOST_BIN });
  return [...ownPidChain(), ...scan.blockers.filter((b) => b.kind === 'process').map((b) => b.pid)];
}

test('lock-fences sees the missing fences, and the fix places them only under an activated holder-lock release', () => {
  const root = workspace('fences');
  const providerRuntimeDir = path.join(scratch, 'fences-provider-capacity');
  const before = checkLockFences(root, { providerRuntimeDir });
  assert.equal(before.passed, true);
  assert.match(before.message, /^warning: 14 of 14 legacy lock path\(s\) not fenced: .*gateway\.lock.* -- the fix waits for this release to be activated here \(no readable activation at .*\)$/);

  const noActivation = fixLockFences(root, { providerRuntimeDir, hostBin: HOST_BIN });
  assert.equal(noActivation.changed, false);
  assert.match(noActivation.message, /^fences not placed: no readable activation at /);

  activate(root, { withRegistry: false });
  assert.match(activatedHolderLockRelease(root).reason, /still runs the old lock code/);
  assert.match(fixLockFences(root, { providerRuntimeDir, hostBin: HOST_BIN }).message, /^fences not placed: the activated release .* still runs the old lock code/);
  assert.equal(fenceStatus({ fgosDir: path.join(root, '.fgos'), workspaceRoot: root, providerRuntimeDir }).complete, false, 'nothing was written');

  activate(root, { withRegistry: true });
  assert.match(checkLockFences(root, { providerRuntimeDir }).message, / -- stop every fgOS process of this workspace, then run fgos doctor --fix$/);
  let fixed;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    fixed = fixLockFences(root, { providerRuntimeDir, hostBin: HOST_BIN, excludePids: otherSessionPids() });
    if (fixed.changed || !/still running/.test(fixed.message)) break;
  }
  assert.equal(fixed.changed, true, fixed.message);
  assert.match(fixed.message, /^placed 13 fence\(s\)/);
  assert.equal(checkLockFences(root, { providerRuntimeDir }).passed, false);
  assert.match(checkLockFences(root, { providerRuntimeDir }).message, /^git-fence-missing:/);
  assert.equal(fs.existsSync(path.join(root, '.fgos/locks/activation.lock')), false, 'doctor never places the controller fence');
  assert.match(fixLockFences(root, { providerRuntimeDir, hostBin: HOST_BIN }).message, /only the new fgctl/);
});

test('a payload registry without the Rust callers\' locks fences only the locks it owns, leaving the paths an older fgctl still uses', () => {
  const root = workspace('fences-owners');
  const providerRuntimeDir = path.join(scratch, 'fences-owners-provider-capacity');
  activate(root, { withRegistry: true });
  const activation = JSON.parse(fs.readFileSync(path.join(root, '.fgos', 'installation', 'activation.json'), 'utf8'));
  const registryPath = path.join(activation.releasePath, 'libexec', 'legacy-node', 'packages', 'holder-lock', 'contracts', 'lock-registry.v1.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  registry.locks = registry.locks.filter((lock) => lock.owner !== '4.4');
  writeConfig(registryPath, registry);
  const owners = activatedHolderLockRelease(root).owners;
  assert.ok(owners.includes('4.2') && !owners.includes('4.4'), owners.join(','));
  let fixed;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    fixed = fixLockFences(root, { providerRuntimeDir, hostBin: HOST_BIN, excludePids: otherSessionPids() });
    if (fixed.changed || !/still running/.test(fixed.message)) break;
  }
  assert.equal(fixed.changed, true, fixed.message);
  assert.match(fixed.message, /^placed 10 fence\(s\)/);
  const left = fenceStatus({ fgosDir: path.join(root, '.fgos'), workspaceRoot: root, providerRuntimeDir }).missing;
  // The install tombstone is machine-wide and an earlier test already placed it under the shared state root.
  assert.deepEqual(left.map((file) => path.relative(path.join(root, '.fgos'), file)).sort(), [path.join('installation', 'activation.lock'), path.join('locks', 'activation.lock'), path.join('observe', '.lock')]);
  assert.deepEqual(fixLockFences(root, { providerRuntimeDir, hostBin: HOST_BIN }), {
    changed: false,
    message: 'fences not placed: the activated release does not yet take the locks still missing a fence; activate the release that ships them first',
  });
  assert.match(checkLockFences(root, { providerRuntimeDir }).message, /^warning: 3 of 14 legacy lock path\(s\) not fenced: .* -- the fix waits for this release to be activated here/);
});

test('the fence fix refuses while an fgOS payload of the workspace runs, and names it', async () => {
  const root = workspace('fences-blocked');
  activate(root, { withRegistry: true });
  fs.mkdirSync(path.join(root, 'bin'));
  fs.writeFileSync(path.join(root, 'bin', 'fgos.mjs'), 'setInterval(() => {}, 1000);\n');
  const payload = spawn(process.execPath, ['bin/fgos.mjs'], { cwd: root, stdio: 'ignore' });
  children.add(payload);
  await new Promise((resolve) => { payload.once('spawn', resolve); });
  const providerRuntimeDir = path.join(scratch, 'fences-blocked-provider-capacity');
  const res = fixLockFences(root, { providerRuntimeDir, hostBin: HOST_BIN, excludePids: otherSessionPids().filter((pid) => pid !== payload.pid) });
  assert.equal(res.changed, false);
  assert.match(res.message, new RegExp(`^fences not placed: fgOS processes still running, stop them first: .*pid ${payload.pid} `));
  assert.equal(fenceStatus({ fgosDir: path.join(root, '.fgos'), workspaceRoot: root, providerRuntimeDir }).complete, false);
  await stop(payload);
});

// ─── state-root ─────────────────────────────────────────────────────────

test('state-root: Node and the host agree; a pinned root also shows the unpinned answer', () => {
  const root = workspace('state-root');
  const pinned = checkStateRoot(root);
  assert.equal(pinned.passed, true, pinned.message);
  assert.ok(pinned.message.startsWith(`stateRoot ${STATE_ROOT}, lockRoot ${path.join(STATE_ROOT, 'locks')} (pinned); without the pin the host resolves stateRoot `), pinned.message);

  const home = path.join(scratch, 'state-root-home');
  const { FGOS_STATE_ROOT: _pin, FGOS_STATE_HOME: _home, XDG_STATE_HOME: _xdg, ...rest } = process.env;
  const unpinned = checkStateRoot(root, { env: { ...rest, HOME: home } });
  // Node asks the route once per process and keeps the answer; the host answers the same environment.
  assert.equal(unpinned.passed, true, unpinned.message);
});
