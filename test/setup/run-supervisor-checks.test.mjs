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
  checkRuntimeSocketDir,
  fixRuntimeSocketDir,
  checkRunAttemptsStuck,
  checkRunSupervisorConfig,
} from '../../src/setup/run-supervisor-checks.mjs';
import { readGateKillGraceMs, readCancelWaitMs, DEFAULT_GATE_KILL_GRACE_MS } from '../../src/run-supervisor/gate-kill-grace.mjs';
import { fileHolders } from '../../src/holder-lock/index.mjs';
import { writeProjectConfig, writeGlobalConfig, globalConfigPath as globalConfigFile } from '../helpers/config-fixture.mjs';

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

/** A stand-in host binary that answers every route with `line` (and exits `status`). */
function fakeHost(name, line, status = 0) {
  const file = path.join(scratch, name);
  const escaped = line.replaceAll("'", "'\\''");
  fs.writeFileSync(file, `#!/bin/sh\nroute="$2"\nprintf '%s\\n' '${escaped}' | sed "s/@ROUTE@/$route/"\nexit ${status}\n`, { mode: 0o755 });
  return file;
}

const probeLine = (containment) => JSON.stringify({ v: 1, protocol: 1, result: 'ok', route: '@ROUTE@', containment });

test('the run supervisor checks and fixes are registered', () => {
  const ids = DOCTOR_CHECKS.map((check) => check.id);
  for (const id of ['run-supervisor-route', 'runtime-socket-dir', 'run-attempts-stuck', 'run-supervisor-config']) {
    assert.ok(ids.includes(id), `${id} is a doctor check`);
  }
  for (const id of ['process-containment', 'gate-kill-grace', 'units-awaiting-resume', 'cancel-wait']) assert.ok(!ids.includes(id), `${id} is folded into another row`);
  const fixIds = FIX_REGISTRATIONS.map((fix) => fix.id);
  assert.ok(fixIds.includes('runtime-socket-dir'), 'runtime-socket-dir has a fix');
  assert.ok(!fixIds.includes('run-attempts-stuck'), 'run-attempts-stuck is a pointer: adopt runs on the next fgos run');
});

// ─── run-supervisor-route ───────────────────────────────────────────────

test('run-supervisor-route: the real host serves all four routes and names its driver and level; a host without them fails by name', () => {
  const root = workspace('route');
  const ok = checkRunSupervisorRoute(root, { bin: HOST_BIN });
  assert.equal(ok.passed, true, ok.message);
  assert.match(ok.message, /serves supervise, gate, adopt, attempt-step at protocol 1; containment: (bwrap-pidns, level kernel|linux-pgroup, level best-effort|windows-job, level kernel|macos-tree, level best-effort)/);

  const silent = fakeHost('silent-host', '', 2);
  const bad = checkRunSupervisorRoute(root, { bin: silent });
  assert.equal(bad.passed, false);
  assert.match(bad.message, /does not serve the run supervisor at protocol 1 \(supervise: no answer \(exit 2\); gate:/);

  const old = fakeHost('mismatch-host', JSON.stringify({ v: 1, protocol: 1, result: 'error', code: 'host-version-mismatch' }), 3);
  assert.match(checkRunSupervisorRoute(root, { bin: old }).message, /host-version-mismatch/);
});

test('run-supervisor-route: containment kernel passes; best-effort warns on Linux and informs elsewhere; no driver fails', () => {
  const root = workspace('containment-levels');
  const served = (bin) => `${bin} serves supervise, gate, adopt, attempt-step at protocol 1; containment: `;
  const kernelBin = fakeHost('h-kernel', probeLine({ driver: 'bwrap-pidns', level: 'kernel', escapes: ['a daemon outside the namespace'] }));
  assert.deepEqual(checkRunSupervisorRoute(root, { bin: kernelBin }), { passed: true, message: `${served(kernelBin)}bwrap-pidns, level kernel; escapes: a daemon outside the namespace` });

  const bestEffort = fakeHost('h-best', probeLine({ driver: 'linux-pgroup', level: 'best-effort', escapes: ['setsid descendants leave the process group'] }));
  const linux = checkRunSupervisorRoute(root, { bin: bestEffort, platform: 'linux' });
  assert.equal(linux.passed, true, 'no user namespace warns, never fails');
  assert.ok(linux.message.startsWith(`warning: ${served(bestEffort)}linux-pgroup, level best-effort: bwrap with a user namespace is unavailable here`), linux.message);
  assert.match(linux.message, /escapes: setsid descendants/);
  assert.match(linux.message, /Install bwrap and enable unprivileged user namespaces/);
  assert.ok(checkRunSupervisorRoute(root, { bin: bestEffort, platform: 'darwin' }).message.startsWith(`info: ${served(bestEffort)}linux-pgroup, level best-effort`));

  const mountRefused = fakeHost('h-mount', probeLine({
    driver: 'linux-pgroup',
    level: 'best-effort',
    selectedBecause: "containment-mount-refused: bwrap: Can't bind mount /oldroot/var/tmp/x on /newroot/var/tmp/x: Invalid argument",
    escapes: ['setsid descendants leave the process group'],
  }));
  const mountRes = checkRunSupervisorRoute(root, { bin: mountRefused, platform: 'linux' });
  assert.equal(mountRes.passed, true);
  assert.match(mountRes.message, /^warning: .*containment: linux-pgroup, level best-effort: a host mount cannot be remounted \(bwrap: Can't bind mount \/oldroot\/var\/tmp\/x on \/newroot\/var\/tmp\/x: Invalid argument\); unmount or fix it, then restart long-running fgOS processes \(gateway, supervisors\), which keep the answer they probed at start, to get kernel containment/);
  assert.doesNotMatch(mountRes.message, /user namespaces are disabled/);
  const none = checkRunSupervisorRoute(root, { bin: fakeHost('h-none', probeLine({ driver: null, level: 'unsupported', escapes: [], error: 'unsupported-platform' })) });
  assert.equal(none.passed, false);
  assert.match(none.message, /no containment driver on this machine \(unsupported-platform\)/);
  assert.match(none.message, /Rebuild the host from this checkout/);
});

// ─── runtime-socket-dir ─────────────────────────────────────────────────

test('runtime-socket-dir: missing warns, fix creates 0700, a loose mode fails and the fix tightens it', { skip: UID === undefined && 'no uid on this platform' }, () => {
  const xdg = path.join(scratch, 'xdg');
  fs.mkdirSync(xdg, { mode: 0o700 });
  const env = { XDG_RUNTIME_DIR: xdg };
  const dir = path.join(xdg, 'fgos');

  assert.match(checkRuntimeSocketDir({ env }).message, /^warning: .* does not exist yet \(fgos doctor --fix creates it\)$/);
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

// ─── run-supervisor-config ──────────────────────────────────────────────

test('run-supervisor-config: absent is the defaults, project overrides global, an unusable grace or cancel wait, or a wait shorter than the grace, fails', () => {
  const root = workspace('config');
  const globalHome = path.join(scratch, 'config-home');
  const globalConfigPath = globalConfigFile(globalHome);
  const grace = (value, source) => `dispatch.gateKillGraceMs = ${value} (${source})`;
  const wait = (value, source) => `dispatch.cancelWaitMs = ${value} (${source})`;
  assert.deepEqual(checkRunSupervisorConfig(root, { globalConfigPath }), { passed: true, message: `${grace(10000, 'default')}; ${wait(15000, 'default')}` });

  writeGlobalConfig(globalHome, { dispatch: { gateKillGraceMs: 4000 } });
  assert.deepEqual(checkRunSupervisorConfig(root, { globalConfigPath }), { passed: true, message: `${grace(4000, 'global')}; ${wait(9000, 'default')}` });

  writeProjectConfig(root, { dispatch: { gateKillGraceMs: 2500 } });
  assert.deepEqual(checkRunSupervisorConfig(root, { globalConfigPath }), { passed: true, message: `${grace(2500, 'project')}; ${wait(7500, 'default')}` });

  for (const bad of [999, 0, -5, 1500.5, '5000']) {
    writeProjectConfig(root, { dispatch: { gateKillGraceMs: bad } });
    const res = checkRunSupervisorConfig(root, { globalConfigPath });
    assert.equal(res.passed, false, `${JSON.stringify(bad)} is refused`);
    assert.match(res.message, /dispatch\.gateKillGraceMs must be an integer of at least 1000 ms/);
  }

  writeGlobalConfig(globalHome, { dispatch: { cancelWaitMs: 20000 } });
  writeProjectConfig(root, {});
  assert.deepEqual(checkRunSupervisorConfig(root, { globalConfigPath }), { passed: true, message: `${grace(10000, 'default')}; ${wait(20000, 'global')}` });
  writeProjectConfig(root, { dispatch: { cancelWaitMs: 12000 } });
  assert.deepEqual(checkRunSupervisorConfig(root, { globalConfigPath }), { passed: true, message: `${grace(10000, 'default')}; ${wait(12000, 'project')}` });

  for (const bad of [999, 0, 1500.5, '9000']) {
    writeProjectConfig(root, { dispatch: { cancelWaitMs: bad } });
    const res = checkRunSupervisorConfig(root, { globalConfigPath });
    assert.equal(res.passed, false, `${JSON.stringify(bad)} is refused`);
    assert.match(res.message, /dispatch\.cancelWaitMs must be an integer of at least 1000 ms/);
  }
  writeProjectConfig(root, { dispatch: { cancelWaitMs: 5000 } });
  const short = checkRunSupervisorConfig(root, { globalConfigPath: path.join(scratch, 'config-home-empty', 'config.json') });
  assert.equal(short.passed, false);
  assert.match(short.message, /shorter than dispatch\.gateKillGraceMs = 10000/);

  writeProjectConfig(root, { dispatch: { gateKillGraceMs: 10, cancelWaitMs: 10 } });
  const both = checkRunSupervisorConfig(root, { globalConfigPath: path.join(scratch, 'config-home-empty', 'config.json') });
  assert.match(both.message, /dispatch\.gateKillGraceMs must be an integer.*; dispatch\.cancelWaitMs must be an integer/, 'one snapshot reports both keys');
});

test('the gate kill grace reader follows the same merge and refuses an unusable value', () => {
  const root = workspace('grace-reader');
  assert.equal(readGateKillGraceMs({ projectRoot: root }), DEFAULT_GATE_KILL_GRACE_MS);
  writeProjectConfig(root, { dispatch: { gateKillGraceMs: 3000 } });
  assert.equal(readGateKillGraceMs({ projectRoot: root }), 3000);
  writeProjectConfig(root, { dispatch: { gateKillGraceMs: 10 } });
  assert.throws(() => readGateKillGraceMs({ projectRoot: root }), { code: 'invalid-gate-kill-grace', message: /dispatch\.gateKillGraceMs must be an integer of at least 1000/ });
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
});

test('run-attempts-stuck: an unclosed attempt with a free lock is a warning that names the doors, never a failure; nothing is written', () => {
  const root = workspace('stuck-free');
  const dir = attemptDir(root, 'free');
  const before = fs.readdirSync(dir).sort();
  const res = checkRunAttemptsStuck(root);
  assert.equal(res.passed, true, res.message);
  assert.match(res.message, /^warning: 1 attempt\(s\) have no holder and no closed\.json; the next `fgos run` adopts them, or run `fgos dispatch recover`$/);
  assert.deepEqual(fs.readdirSync(dir).sort(), before, 'the pointer wrote nothing');
});

test('run-attempts-stuck: an attempt whose release was removed is named with what to restore, and an intact release is not blamed', () => {
  const root = workspace('stuck-release-gone');
  const gone = path.join(scratch, 'pruned-release', 'fgos');
  const dir = attemptDir(root, 'gone');
  fs.writeFileSync(path.join(dir, 'envelope.json'), JSON.stringify({ v: 3, attemptId: 'att-gone', hostBin: gone }));
  const res = checkRunAttemptsStuck(root);
  assert.equal(res.passed, true);
  assert.match(res.message, /^warning: 1 attempt\(s\) have no holder and no closed\.json;/);
  assert.match(res.message, new RegExp(`1 cannot be closed by adopt: .*runs/01 \\(the release that wrote it was removed \\(${gone} is gone\\)`));
  assert.match(res.message, /restore them at those paths, then run "fgos run" again/);
  const checkout = path.join(scratch, 'removed-checkout');
  fs.writeFileSync(path.join(dir, 'envelope.json'), JSON.stringify({ v: 3, attemptId: 'att-gone', hostBin: HOST_BIN, payloadRoot: checkout }));
  assert.match(checkRunAttemptsStuck(root).message, new RegExp(`${path.join(checkout, 'src', 'run-supervisor', 'attempt-step.mjs')} is gone`));
  fs.writeFileSync(path.join(dir, 'envelope.json'), JSON.stringify({ v: 3, attemptId: 'att-gone', hostBin: HOST_BIN }));
  assert.doesNotMatch(checkRunAttemptsStuck(root).message, /was removed/);
});

test('run-attempts-stuck: a run from before the supervisor has no envelope or intent and is nothing to adopt', () => {
  const root = workspace('stuck-legacy');
  const dir = path.join(root, '.fgos', 'assignments', 'legacy', 'runs', '01');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'run.json'), '{}');
  assert.equal(checkRunAttemptsStuck(root).message, 'no attempt waits to be closed');
  fs.writeFileSync(path.join(dir, 'attempt-intent.json'), '{}');
  assert.match(checkRunAttemptsStuck(root).message, /^warning: 1 attempt\(s\) have no holder/, 'the intent a controller left when it died before writing an envelope counts');
});

test('run-attempts-stuck: a held lock is a running attempt, not a finding', { skip: !HAS_FLOCK && 'util-linux flock missing' }, async () => {
  const root = workspace('stuck-held');
  const dir = attemptDir(root, 'held');
  const lock = path.join(dir, 'attempt.lock');
  const holder = spawn('flock', ['-o', lock, 'sleep', '30'], { env: { PATH: process.env.PATH }, stdio: 'ignore' });
  children.add(holder);
  const deadline = Date.now() + 5000;
  for (;;) {
    const holders = fileHolders('attempt', lock);
    if (holders.kind === 'list' && holders.holders.some((h) => h.pid === holder.pid)) break;
    assert.ok(Date.now() < deadline, 'flock did not take the lock');
    await new Promise((resolve) => { setTimeout(resolve, 20); });
  }
  const res = checkRunAttemptsStuck(root);
  assert.equal(res.passed, true, res.message);
  assert.equal(res.message, '1 open attempt(s), all running');
  holder.kill('SIGKILL');
});

test('the cancel wait reader shares the gate kill grace merge and refuses an unusable value', () => {
  const root = workspace('cancel-wait-reader');
  assert.equal(readCancelWaitMs({ projectRoot: root }), DEFAULT_GATE_KILL_GRACE_MS + 5000);
  writeProjectConfig(root, { dispatch: { gateKillGraceMs: 3000 } });
  assert.equal(readCancelWaitMs({ projectRoot: root }), 8000);
  writeProjectConfig(root, { dispatch: { cancelWaitMs: 10 } });
  assert.throws(() => readCancelWaitMs({ projectRoot: root }), { code: 'invalid-cancel-wait', message: /dispatch\.cancelWaitMs must be an integer of at least 1000/ });
  // The doctor check names the same key with the same words.
  assert.match(checkRunSupervisorConfig(root, { globalConfigPath: path.join(scratch, 'no-global-config.json') }).message, /dispatch\.cancelWaitMs must be an integer of at least 1000/);
});
