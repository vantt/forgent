// The run supervisor doctor checks and fixes, run for real: the host binary answers `--probe`, adopt
// judges real attempt directories with real kernel locks, `flock(1)` plays a holder.
import '../helpers/process-tmp-root.mjs';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

import { DOCTOR_CHECKS, FIX_REGISTRATIONS } from '../../src/setup/checks.mjs';
import {
  checkRunSupervisorRoute,
  checkProcessContainment,
  checkRuntimeSocketDir,
  fixRuntimeSocketDir,
  checkRunAttemptsStuck,
  fixRunAttemptsStuck,
  checkGateKillGrace,
  checkLegacyAttemptsStuck,
  fixLegacyAttemptsStuck,
  checkUnitsAwaitingResume,
  checkCancelWait,
} from '../../src/setup/run-supervisor-checks.mjs';
import { readGateKillGraceMs, readCancelWaitMs, DEFAULT_GATE_KILL_GRACE_MS } from '../../src/run-supervisor/gate-kill-grace.mjs';
import { recoverApplyUseCase, recoverObserveUseCase } from '../../src/verbs/dispatch/recover.mjs';
import { descriptionHolders } from '../../src/holder-lock/driver.mjs';
import { getProcessStartTime } from '../../src/runner/dispatch/process-identity.mjs';

const HOST_BIN = process.env.FGOS_HOST_BIN;
const HAS_FLOCK = spawnSync('flock', ['--version'], { stdio: 'ignore' }).status === 0;
const UID = process.getuid?.();

let scratch;
const children = new Set();
before(() => {
  assert.ok(HOST_BIN && fs.existsSync(HOST_BIN), `set FGOS_HOST_BIN to a host built from this checkout (npm test does): ${HOST_BIN}`);
  // Short: the runtime-socket-dir cases build `<scratch>/xdg-*/fgos/<hash>.sock`, which must fit
  // SOCKET_PATH_MAX_BYTES under the runner's run directory and the process temp root.
  scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-rsc-'));
});
after(() => {
  for (const child of children) child.kill('SIGKILL');
  fs.rmSync(scratch, { recursive: true, force: true });
});

function workspace(name) {
  const root = path.join(scratch, name);
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  return root;
}

function writeConfig(file, config) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(config)}\n`);
}

/** A stand-in host binary that answers every route with `line` (and exits `status`). */
function fakeHost(name, line, status = 0) {
  const file = path.join(scratch, name);
  fs.writeFileSync(file, `#!/bin/sh\nroute="$2"\nprintf '%s\\n' '${line}' | sed "s/@ROUTE@/$route/"\nexit ${status}\n`, { mode: 0o755 });
  return file;
}

const probeLine = (containment) => JSON.stringify({ v: 1, protocol: 1, result: 'ok', route: '@ROUTE@', containment });

test('the run supervisor checks and fixes are registered', () => {
  const ids = DOCTOR_CHECKS.map((check) => check.id);
  for (const id of ['process-containment', 'run-supervisor-route', 'runtime-socket-dir', 'run-attempts-stuck', 'gate-kill-grace']) {
    assert.ok(ids.includes(id), `${id} is a doctor check`);
  }
  const fixIds = FIX_REGISTRATIONS.map((fix) => fix.id);
  assert.ok(fixIds.includes('runtime-socket-dir'));
  assert.ok(fixIds.includes('run-attempts-stuck'));
  for (const id of ['legacy-attempts-stuck', 'units-awaiting-resume', 'cancel-wait']) assert.ok(ids.includes(id), `${id} is a doctor check`);
  assert.ok(fixIds.includes('legacy-attempts-stuck'));
});

// ─── run-supervisor-route ───────────────────────────────────────────────

test('run-supervisor-route: the real host serves all four routes; a host without them fails by name', () => {
  const root = workspace('route');
  const ok = checkRunSupervisorRoute(root, { bin: HOST_BIN });
  assert.equal(ok.passed, true, ok.message);
  assert.match(ok.message, /serves supervise, gate, adopt, attempt-step at protocol 1/);

  const silent = fakeHost('silent-host', '', 2);
  const bad = checkRunSupervisorRoute(root, { bin: silent });
  assert.equal(bad.passed, false);
  assert.match(bad.message, /does not serve the run supervisor at protocol 1 \(supervise: no answer \(exit 2\); gate:/);

  const old = fakeHost('mismatch-host', JSON.stringify({ v: 1, protocol: 1, result: 'error', code: 'host-version-mismatch' }), 3);
  assert.match(checkRunSupervisorRoute(root, { bin: old }).message, /host-version-mismatch/);
});

// ─── process-containment ────────────────────────────────────────────────

test('process-containment: the real host names its driver and level', () => {
  const res = checkProcessContainment(workspace('containment-real'), { bin: HOST_BIN });
  assert.equal(res.passed, true, res.message);
  assert.match(res.message, /(bwrap-pidns, level kernel|linux-pgroup, level best-effort|windows-job, level kernel|macos-tree, level best-effort)/);
});

test('process-containment: kernel passes; best-effort warns on Linux and informs elsewhere; no driver fails', () => {
  const root = workspace('containment-levels');
  const kernel = checkProcessContainment(root, { bin: fakeHost('h-kernel', probeLine({ driver: 'bwrap-pidns', level: 'kernel', escapes: ['a daemon outside the namespace'] })) });
  assert.deepEqual(kernel, { passed: true, message: 'bwrap-pidns, level kernel; escapes: a daemon outside the namespace' });

  const bestEffort = fakeHost('h-best', probeLine({ driver: 'linux-pgroup', level: 'best-effort', escapes: ['setsid descendants leave the process group'] }));
  const linux = checkProcessContainment(root, { bin: bestEffort, platform: 'linux' });
  assert.equal(linux.passed, true, 'no user namespace warns, never fails');
  assert.match(linux.message, /^warning: linux-pgroup, level best-effort: bwrap with a user namespace is unavailable here/);
  assert.match(linux.message, /escapes: setsid descendants/);
  assert.match(checkProcessContainment(root, { bin: bestEffort, platform: 'darwin' }).message, /^info: linux-pgroup, level best-effort/);

  const none = checkProcessContainment(root, { bin: fakeHost('h-none', probeLine({ driver: null, level: 'unsupported', escapes: [], error: 'unsupported-platform' })) });
  assert.equal(none.passed, false);
  assert.match(none.message, /no containment driver on this machine \(unsupported-platform\)/);
});

// ─── runtime-socket-dir ─────────────────────────────────────────────────

test('runtime-socket-dir: missing warns, fix creates 0700, a loose mode fails and the fix tightens it', { skip: UID === undefined && 'no uid on this platform' }, () => {
  const xdg = path.join(scratch, 'xdg');
  fs.mkdirSync(xdg, { mode: 0o700 });
  const env = { XDG_RUNTIME_DIR: xdg };
  const dir = path.join(xdg, 'fgos');

  assert.match(checkRuntimeSocketDir({ env }).message, /^warning: .* does not exist yet \(fgos setup creates it\)$/);
  const created = fixRuntimeSocketDir({ env });
  assert.equal(created.changed, true, created.message);
  assert.equal(fs.statSync(dir).mode & 0o777, 0o700);
  assert.deepEqual(checkRuntimeSocketDir({ env }), { passed: true, message: `${dir} is 0700 and owned by uid ${UID}` });
  assert.equal(fixRuntimeSocketDir({ env }).changed, false, 'a second run changes nothing');

  fs.chmodSync(dir, 0o755);
  const loose = checkRuntimeSocketDir({ env });
  assert.equal(loose.passed, false);
  assert.match(loose.message, /mode 755 allows group or other access/);
  assert.equal(fixRuntimeSocketDir({ env }).changed, true);
  assert.equal(checkRuntimeSocketDir({ env }).passed, true);
});

test('runtime-socket-dir: something that is not a directory fails and the fix leaves it alone', { skip: UID === undefined && 'no uid on this platform' }, () => {
  const xdg = path.join(scratch, 'xdg-file');
  fs.mkdirSync(xdg, { mode: 0o700 });
  fs.writeFileSync(path.join(xdg, 'fgos'), 'in the way');
  const env = { XDG_RUNTIME_DIR: xdg };
  const res = checkRuntimeSocketDir({ env });
  assert.equal(res.passed, false);
  assert.match(res.message, /is not a directory/);
  const fixed = fixRuntimeSocketDir({ env });
  assert.equal(fixed.changed, false);
  assert.equal(fs.readFileSync(path.join(xdg, 'fgos'), 'utf8'), 'in the way');
});

test('runtime-socket-dir: a directory too long for a socket name fails and is not called fixable', { skip: UID === undefined && 'no uid on this platform' }, () => {
  const xdg = path.join(scratch, 'x'.repeat(90));
  fs.mkdirSync(xdg, { mode: 0o700 });
  const res = checkRuntimeSocketDir({ env: { XDG_RUNTIME_DIR: xdg } });
  assert.equal(res.passed, false);
  assert.match(res.message, /leaves no room for a socket name/);
  assert.ok(!res.message.includes('--fix"'), res.message);
});

/** A node process that listens on `file`; killing it with SIGKILL leaves the path behind, as a killed supervisor does. */
async function listenerOn(file) {
  const child = spawn(process.execPath, ['-e', `require('net').createServer().listen(process.argv[1], () => process.stdout.write('up\\n'))`, file], { stdio: ['ignore', 'pipe', 'ignore'] });
  children.add(child);
  await new Promise((resolve, reject) => {
    child.stdout.once('data', resolve);
    child.once('exit', () => { reject(new Error('listener exited before it bound')); });
  });
  return child;
}

const exited = (child) => new Promise((resolve) => { if (child.exitCode !== null || child.signalCode !== null) resolve(); else child.once('exit', resolve); });

test('runtime-socket-dir: a socket whose supervisor was killed is reported and removed; a live one is left alone', { skip: (UID === undefined || process.platform !== 'linux') && 'needs the Linux socket table' }, async () => {
  const xdg = path.join(scratch, 'xdg-orphan');
  fs.mkdirSync(xdg, { mode: 0o700 });
  const env = { XDG_RUNTIME_DIR: xdg };
  const dir = path.join(xdg, 'fgos');
  assert.equal(fixRuntimeSocketDir({ env }).changed, true);

  const liveFile = path.join(dir, '0123456789abcdef.sock');
  const deadFile = path.join(dir, 'fedcba9876543210.sock');
  const live = await listenerOn(liveFile);
  const dead = await listenerOn(deadFile);
  dead.kill('SIGKILL');
  await exited(dead);
  fs.writeFileSync(path.join(dir, 'notes.txt'), 'not a socket');
  fs.writeFileSync(path.join(dir, 'aaaaaaaaaaaaaaaa.sock'), 'a plain file with a socket name');

  const res = checkRuntimeSocketDir({ env });
  assert.equal(res.passed, false, res.message);
  assert.match(res.message, /1 attempt socket\(s\) in .* have no supervisor: fedcba9876543210\.sock/);
  assert.doesNotMatch(res.message, /0123456789abcdef/);
  assert.match(res.message, /fgos doctor --fix/);

  const fixed = fixRuntimeSocketDir({ env });
  assert.equal(fixed.changed, true, fixed.message);
  assert.match(fixed.message, /removed 1 attempt socket\(s\) with no supervisor/);
  assert.ok(!fs.existsSync(deadFile), 'the orphan is gone');
  assert.ok(fs.existsSync(liveFile), 'the live socket stays');
  assert.ok(fs.existsSync(path.join(dir, 'notes.txt')) && fs.existsSync(path.join(dir, 'aaaaaaaaaaaaaaaa.sock')), 'only sockets are removed');
  assert.equal(checkRuntimeSocketDir({ env }).passed, true);
  live.kill('SIGKILL');
  await exited(live);
});

test('runtime-socket-dir: without a socket table nothing is judged or removed', { skip: UID === undefined && 'no uid on this platform' }, () => {
  const xdg = path.join(scratch, 'xdg-no-table');
  fs.mkdirSync(xdg, { mode: 0o700 });
  const env = { XDG_RUNTIME_DIR: xdg };
  fixRuntimeSocketDir({ env });
  const file = path.join(xdg, 'fgos', '0123456789abcdef.sock');
  fs.writeFileSync(file, '');
  const procFile = path.join(scratch, 'no-such-table');
  assert.match(checkRuntimeSocketDir({ env, procFile }).message, /attempt sockets are not judged on this platform/);
  assert.equal(fixRuntimeSocketDir({ env, procFile }).changed, false);
  assert.ok(fs.existsSync(file));
});

// ─── gate-kill-grace ────────────────────────────────────────────────────

test('gate-kill-grace: absent is the default, project overrides global, below 1000 or not an integer fails', () => {
  const root = workspace('grace');
  const globalConfigPath = path.join(scratch, 'grace-home', '.fgos', 'config.json');
  assert.deepEqual(checkGateKillGrace(root, { globalConfigPath }), { passed: true, message: 'dispatch.gateKillGraceMs = 10000 (default)' });

  writeConfig(globalConfigPath, { dispatch: { gateKillGraceMs: 4000 } });
  assert.deepEqual(checkGateKillGrace(root, { globalConfigPath }), { passed: true, message: 'dispatch.gateKillGraceMs = 4000 (global)' });

  writeConfig(path.join(root, '.fgos', 'config.json'), { dispatch: { gateKillGraceMs: 2500 } });
  assert.deepEqual(checkGateKillGrace(root, { globalConfigPath }), { passed: true, message: 'dispatch.gateKillGraceMs = 2500 (project)' });

  for (const bad of [999, 0, -5, 1500.5, '5000']) {
    writeConfig(path.join(root, '.fgos', 'config.json'), { dispatch: { gateKillGraceMs: bad } });
    const res = checkGateKillGrace(root, { globalConfigPath });
    assert.equal(res.passed, false, `${JSON.stringify(bad)} is refused`);
    assert.match(res.message, /must be an integer of at least 1000 ms/);
  }
});

test('the gate kill grace reader follows the same merge and refuses an unusable value', () => {
  const root = workspace('grace-reader');
  assert.equal(readGateKillGraceMs({ projectRoot: root }), DEFAULT_GATE_KILL_GRACE_MS);
  writeConfig(path.join(root, '.fgos', 'config.json'), { dispatch: { gateKillGraceMs: 3000 } });
  assert.equal(readGateKillGraceMs({ projectRoot: root }), 3000);
  writeConfig(path.join(root, '.fgos', 'config.json'), { dispatch: { gateKillGraceMs: 10 } });
  assert.throws(() => readGateKillGraceMs({ projectRoot: root }), { name: 'RunnerConfigError', category: 'validation', code: 'invalid-gate-kill-grace', message: /dispatch\.gateKillGraceMs must be an integer of at least 1000/ });
});

// ─── run-attempts-stuck ─────────────────────────────────────────────────

function attemptDir(root, name, { closed = false } = {}) {
  const dir = path.join(root, '.fgos', 'assignments', name, 'runs', '01');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'envelope.json'), JSON.stringify({ v: 3, attemptId: `att-${name}` }));
  fs.writeFileSync(path.join(dir, 'attempt.lock'), '');
  if (closed) fs.writeFileSync(path.join(dir, 'closed.json'), '{}');
  return dir;
}

test('run-attempts-stuck: nothing open and a closed attempt pass', () => {
  const root = workspace('stuck-none');
  assert.equal(checkRunAttemptsStuck(root).message, 'no attempt waits to be closed');
  attemptDir(root, 'done', { closed: true });
  assert.equal(checkRunAttemptsStuck(root).message, 'no attempt waits to be closed');
  assert.equal(fixRunAttemptsStuck(root).changed, false);
});

test('run-attempts-stuck: an unclosed attempt with a free lock fails with the reason the supervisor named; probing writes nothing', () => {
  process.env.FGOS_HOST_BIN = HOST_BIN;
  const root = workspace('stuck-free');
  const dir = attemptDir(root, 'free');
  const before = fs.readdirSync(dir).sort();
  const res = checkRunAttemptsStuck(root);
  assert.equal(res.passed, false, res.message);
  assert.match(res.message, /1 attempt\(s\) have no holder and no closed\.json: .*runs\/01/);
  assert.match(res.message, /fgos doctor --fix/);
  assert.deepEqual(fs.readdirSync(dir).sort(), before, 'the probe wrote nothing');

  fs.writeFileSync(path.join(dir, 'start-refused.json'), JSON.stringify({ v: 1, attemptId: 'att-free', code: 'lock-held', why: 'attempt: kernel-lock-held', at: '2026-10-18T00:00:00.000Z' }));
  assert.match(checkRunAttemptsStuck(root).message, /runs\/01 \(start-refused:lock-held\)/);
});

test('run-attempts-stuck: an unclosed terminal attempt is judged like any other', () => {
  process.env.FGOS_HOST_BIN = HOST_BIN;
  const root = workspace('stuck-terminal');
  const dir = attemptDir(root, 'pane');
  fs.writeFileSync(path.join(dir, 'envelope.json'), JSON.stringify({ v: 3, attemptId: 'att-pane', mode: 'terminal', terminal: { socketPath: '/nonexistent/x.sock' } }));
  const res = checkRunAttemptsStuck(root);
  assert.equal(res.passed, false, res.message);
  assert.match(res.message, /1 attempt\(s\) have no holder and no closed\.json: .*runs\/01/);
});

test('run-attempts-stuck: the fix sends the attempt through adopt and names what stays open', () => {
  process.env.FGOS_HOST_BIN = HOST_BIN;
  const root = workspace('stuck-fix');
  attemptDir(root, 'unadoptable'); // an envelope without a digest cannot be adopted
  const fixed = fixRunAttemptsStuck(root);
  assert.equal(fixed.changed, false);
  assert.match(fixed.message, /adopted 0 attempt\(s\); 1 still open: .*runs\/01/);
});

test('run-attempts-stuck: an attempt whose release was removed is named with the remedy, by the check and by the fix', () => {
  process.env.FGOS_HOST_BIN = HOST_BIN;
  const root = workspace('stuck-release-gone');
  const gone = path.join(scratch, 'pruned-release', 'fgos');
  const dir = attemptDir(root, 'gone');
  fs.writeFileSync(path.join(dir, 'envelope.json'), JSON.stringify({ v: 3, attemptId: 'att-gone', hostBin: gone }));
  const res = checkRunAttemptsStuck(root);
  assert.equal(res.passed, false, res.message);
  assert.match(res.message, new RegExp(`runs/01 \\(the release that wrote it was removed \\(${gone} is gone\\)`));
  assert.match(res.message, /restore them at those paths, then run "fgos doctor --fix" again/);
  assert.match(fixRunAttemptsStuck(root).message, /1 still open: .*the release that wrote it was removed/);

  // A dev-door host lives in a checkout: the payload it names is gone with it, and both are named.
  const checkout = path.join(scratch, 'removed-checkout');
  fs.writeFileSync(path.join(dir, 'envelope.json'), JSON.stringify({ v: 3, attemptId: 'att-gone', hostBin: HOST_BIN, payloadRoot: checkout }));
  assert.match(checkRunAttemptsStuck(root).message, new RegExp(`\\(${path.join(checkout, 'src', 'run-supervisor', 'attempt-step.mjs')} is gone\\)`));

  // A release that is still there is not blamed: adopt's own reason stands.
  fs.writeFileSync(path.join(dir, 'envelope.json'), JSON.stringify({ v: 3, attemptId: 'att-gone', hostBin: HOST_BIN }));
  assert.doesNotMatch(checkRunAttemptsStuck(root).message, /was removed/);
});

test('run-attempts-stuck: a held lock is a running attempt, not a finding', { skip: !HAS_FLOCK && 'util-linux flock missing' }, async () => {
  process.env.FGOS_HOST_BIN = HOST_BIN;
  const root = workspace('stuck-held');
  const dir = attemptDir(root, 'held');
  const lock = path.join(dir, 'attempt.lock');
  const holder = spawn('flock', ['-o', lock, 'sleep', '30'], { env: { PATH: process.env.PATH }, stdio: 'ignore' });
  children.add(holder);
  const deadline = Date.now() + 5000;
  for (;;) {
    const holders = descriptionHolders(lock);
    if (holders.kind === 'list' && holders.pids.includes(holder.pid)) break;
    assert.ok(Date.now() < deadline, 'flock did not take the lock');
    await new Promise((resolve) => { setTimeout(resolve, 20); });
  }
  const res = checkRunAttemptsStuck(root);
  assert.equal(res.passed, true, res.message);
  assert.match(res.message, /1 open attempt\(s\), none stuck \(1 running\)/);
  holder.kill('SIGKILL');
});

// ─── legacy-attempts-stuck ──────────────────────────────────────────────

const LEGACY_FIXTURE = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'fixtures', 'run-layout', 'legacy-stuck', 'assignments');
const door = { observe: recoverObserveUseCase, apply: recoverApplyUseCase };

/** A workspace holding the two legacy runs of the spike fixture; `confinementRoot` is empty (no v1 home left). */
function legacyWorkspace(name) {
  const root = workspace(name);
  fs.cpSync(LEGACY_FIXTURE, path.join(root, '.fgos', 'assignments'), { recursive: true });
  const confinementRoot = path.join(root, 'confinement');
  fs.mkdirSync(confinementRoot);
  return { root, confinementRoot, herdr: path.join(root, '.fgos', 'assignments', 'unit-run-herdr/producer/1/runs/01'), cli: path.join(root, '.fgos', 'assignments', 'unit-run-cli/producer/1/runs/01') };
}

test('legacy-attempts-stuck: nothing left running passes', () => {
  const root = workspace('legacy-none');
  assert.equal(checkLegacyAttemptsStuck(root).passed, true);
  assert.equal(fixLegacyAttemptsStuck(root, { door }).changed, false);
});

test('legacy-attempts-stuck: runs whose processes are all dead fail, the fix settles them and the check then passes', () => {
  process.env.FGOS_HOST_BIN = HOST_BIN;
  const w = legacyWorkspace('legacy-dead');
  const before = checkLegacyAttemptsStuck(w.root, { confinementRoot: w.confinementRoot });
  assert.equal(before.passed, false, before.message);
  assert.match(before.message, /2 run\(s\) from before the run supervisor are left running and every process they recorded is dead/);
  assert.match(before.message, /fgos doctor --fix/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(w.cli, 'run.json'), 'utf8')).status, 'running', 'the check wrote nothing');

  const fixed = fixLegacyAttemptsStuck(w.root, { door, confinementRoot: w.confinementRoot });
  assert.equal(fixed.changed, true);
  assert.match(fixed.message, /settled 2 run\(s\) as abandoned-legacy/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(w.cli, 'run.json'), 'utf8')).settlement, 'abandoned-legacy');
  assert.equal(checkLegacyAttemptsStuck(w.root, { confinementRoot: w.confinementRoot }).passed, true);
});

test('legacy-attempts-stuck: a run with a live recorded process is kept and the reason is printed, by the check and by the fix', () => {
  process.env.FGOS_HOST_BIN = HOST_BIN;
  const w = legacyWorkspace('legacy-alive');
  const generation = path.join(w.herdr, 'control', 'generations', '0000000001.json');
  const record = JSON.parse(fs.readFileSync(generation, 'utf8'));
  record.holder = { id: 'live', pid: process.pid, processStartTime: getProcessStartTime(process.pid) };
  fs.writeFileSync(generation, JSON.stringify(record));

  const res = checkLegacyAttemptsStuck(w.root, { confinementRoot: w.confinementRoot });
  assert.equal(res.passed, false, 'one run can still be settled');
  assert.match(res.message, /kept: .*unit-run-herdr.*pid-alive \(controller \d+\)/);

  const fixed = fixLegacyAttemptsStuck(w.root, { door, confinementRoot: w.confinementRoot });
  assert.match(fixed.message, /settled 1 run\(s\) as abandoned-legacy; kept: .*unit-run-herdr.*pid-alive/);
  const after = checkLegacyAttemptsStuck(w.root, { confinementRoot: w.confinementRoot });
  assert.equal(after.passed, true, 'nothing left to fix: the kept run only warns');
  assert.match(after.message, /^warning: 1 run\(s\) from before the run supervisor are left running and stay open: .*pid-alive/);
});

// ─── units-awaiting-resume ──────────────────────────────────────────────

/** A unit run whose only attempt is closed (no controller, no summary): it awaits resume. */
function unitWithAttempt(root, unitRunId, { closed }) {
  const assignmentId = `${unitRunId}/producer/1`;
  const unitDir = path.join(root, '.fgos', 'assignments', unitRunId);
  fs.mkdirSync(unitDir, { recursive: true });
  fs.writeFileSync(path.join(unitDir, 'unit.json'), JSON.stringify({ bindings: { 'producer/1': [{ role: 'producer', assignmentId }] } }));
  const run = path.join(root, '.fgos', 'assignments', assignmentId, 'runs', '01');
  fs.mkdirSync(run, { recursive: true });
  fs.writeFileSync(path.join(run, 'run.json'), JSON.stringify({ runId: `run-${unitRunId}`, assignmentId, status: 'running' }));
  if (closed) fs.writeFileSync(path.join(run, 'closed.json'), '{}');
  fs.mkdirSync(path.join(root, '.fgos', 'assignments', assignmentId, 'admission', 'generations'), { recursive: true });
  fs.writeFileSync(path.join(root, '.fgos', 'assignments', assignmentId, 'admission', 'generations', '0000000001.json'), JSON.stringify({ runId: `run-${unitRunId}`, attempt: 1, attemptStr: '01' }));
  return unitDir;
}

test('units-awaiting-resume: no unit passes; a unit with a closed attempt warns with the resume command and never fails', () => {
  process.env.FGOS_HOST_BIN = HOST_BIN;
  const root = workspace('units-awaiting');
  assert.equal(checkUnitsAwaitingResume(root).message, 'no unit run to resume');
  const unitDir = unitWithAttempt(root, 'unit-closed', { closed: true });
  const res = checkUnitsAwaitingResume(root);
  assert.equal(res.passed, true, 'information, not a failure');
  assert.match(res.message, /^warning: 1 unit run\(s\) await resume: "fgos run --resume unit-closed"/);

  fs.writeFileSync(path.join(unitDir, 'unit-summary.json'), JSON.stringify({ outcome: 'pass' }));
  assert.match(checkUnitsAwaitingResume(root).message, /1 unit run\(s\), none awaiting resume/);
});

test('units-awaiting-resume: a unit whose attempt is not closed is not awaiting resume', () => {
  process.env.FGOS_HOST_BIN = HOST_BIN;
  const root = workspace('units-running');
  unitWithAttempt(root, 'unit-open', { closed: false });
  const run = path.join(root, '.fgos', 'assignments', 'unit-open/producer/1/runs/01');
  fs.writeFileSync(path.join(run, 'attempt.lock'), '');
  fs.writeFileSync(path.join(run, 'envelope.json'), JSON.stringify({ v: 3 }));
  assert.match(checkUnitsAwaitingResume(root).message, /none awaiting resume/);
});

// ─── cancel-wait ────────────────────────────────────────────────────────

test('cancel-wait: absent is the grace plus five seconds, project overrides global, unusable or shorter than the grace fails', () => {
  const root = workspace('cancel-wait');
  const globalConfigPath = path.join(scratch, 'cancel-home', '.fgos', 'config.json');
  assert.deepEqual(checkCancelWait(root, { globalConfigPath }), { passed: true, message: 'dispatch.cancelWaitMs = 15000 (default)' });

  writeConfig(globalConfigPath, { dispatch: { gateKillGraceMs: 2000 } });
  assert.deepEqual(checkCancelWait(root, { globalConfigPath }), { passed: true, message: 'dispatch.cancelWaitMs = 7000 (default)' });

  writeConfig(globalConfigPath, { dispatch: { cancelWaitMs: 20000 } });
  assert.deepEqual(checkCancelWait(root, { globalConfigPath }), { passed: true, message: 'dispatch.cancelWaitMs = 20000 (global)' });

  writeConfig(path.join(root, '.fgos', 'config.json'), { dispatch: { cancelWaitMs: 12000 } });
  assert.deepEqual(checkCancelWait(root, { globalConfigPath }), { passed: true, message: 'dispatch.cancelWaitMs = 12000 (project)' });

  for (const bad of [999, 0, 1500.5, '9000']) {
    writeConfig(path.join(root, '.fgos', 'config.json'), { dispatch: { cancelWaitMs: bad } });
    const res = checkCancelWait(root, { globalConfigPath });
    assert.equal(res.passed, false, `${JSON.stringify(bad)} is refused`);
    assert.match(res.message, /must be an integer of at least 1000 ms/);
  }
  writeConfig(path.join(root, '.fgos', 'config.json'), { dispatch: { cancelWaitMs: 5000 } });
  const short = checkCancelWait(root, { globalConfigPath: path.join(scratch, 'cancel-home-empty', 'config.json') });
  assert.equal(short.passed, false);
  assert.match(short.message, /shorter than dispatch\.gateKillGraceMs = 10000/);
});

test('the cancel wait reader shares the gate kill grace merge and refuses an unusable value', () => {
  const root = workspace('cancel-wait-reader');
  assert.equal(readCancelWaitMs({ projectRoot: root }), DEFAULT_GATE_KILL_GRACE_MS + 5000);
  writeConfig(path.join(root, '.fgos', 'config.json'), { dispatch: { gateKillGraceMs: 3000 } });
  assert.equal(readCancelWaitMs({ projectRoot: root }), 8000);
  writeConfig(path.join(root, '.fgos', 'config.json'), { dispatch: { cancelWaitMs: 10 } });
  assert.throws(() => readCancelWaitMs({ projectRoot: root }), { name: 'RunnerConfigError', category: 'validation', code: 'invalid-cancel-wait', message: /dispatch\.cancelWaitMs must be an integer of at least 1000/ });
  // The doctor check names the same key with the same words.
  assert.match(checkCancelWait(root, { globalConfigPath: path.join(scratch, 'no-global-config.json') }).message, /dispatch\.cancelWaitMs must be an integer of at least 1000/);
});
