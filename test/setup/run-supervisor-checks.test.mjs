// The run supervisor doctor checks and fixes, run for real: the host binary answers `--probe`, adopt
// judges real attempt directories with real kernel locks, `flock(1)` plays a holder.
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
} from '../../src/setup/run-supervisor-checks.mjs';
import { readGateKillGraceMs, DEFAULT_GATE_KILL_GRACE_MS } from '../../src/run-supervisor/gate-kill-grace.mjs';
import { descriptionHolders } from '../../src/holder-lock/driver.mjs';

const HOST_BIN = process.env.FGOS_HOST_BIN;
const HAS_FLOCK = spawnSync('flock', ['--version'], { stdio: 'ignore' }).status === 0;
const UID = process.getuid?.();

let scratch;
const children = new Set();
before(() => {
  assert.ok(HOST_BIN && fs.existsSync(HOST_BIN), `set FGOS_HOST_BIN to a host built from this checkout (npm test does): ${HOST_BIN}`);
  scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-run-supervisor-checks-'));
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
  assert.throws(() => readGateKillGraceMs({ projectRoot: root }), /at least 1000/);
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

test('run-attempts-stuck: the fix sends the attempt through adopt and names what stays open', () => {
  process.env.FGOS_HOST_BIN = HOST_BIN;
  const root = workspace('stuck-fix');
  attemptDir(root, 'unadoptable'); // an envelope without a digest cannot be adopted
  const fixed = fixRunAttemptsStuck(root);
  assert.equal(fixed.changed, false);
  assert.match(fixed.message, /adopted 0 attempt\(s\); 1 still open: .*runs\/01/);
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
