// The controller half of a direct attempt, piece by piece: what the envelope and side file carry, how the
// locks travel to the supervisor, what the controller does when the supervisor never binds, and that no
// trace of the removed Node supervisor is left in src/.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { acquireSync, createLockScope, spawnWithLocks } from '../../src/holder-lock/index.mjs';
import { computeSha256Digest } from '../../src/runner/dispatch/proof-helpers.mjs';
import { attemptGateCommand, attemptPaths, attemptStepEnv, awaitSettledResult, buildEnvelope, prepareAttemptFiles, waitForBinding, writeAttemptFiles } from '../../src/run-supervisor/direct-launch.mjs';
import { BIN_FGOS, bwrapUsable, createProject, killToken, readJson, startRun, waitUntil } from './support/direct-harness.mjs';

seedFileLocalBwrapRegistry();

const skip = !bwrapUsable() && 'bwrap with a pid namespace is not usable on this machine';
const SRC = path.resolve('src');

function walk(dir, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, found);
    else if (/\.(mjs|js|cjs)$/.test(entry.name)) found.push(full);
  }
  return found;
}

test('the Node supervisor, its IPC channel and the writers of the old bindings are gone from src', () => {
  const forbidden = /startDetachedRunSupervisorProcess|runDetachedRunSupervisor|bindConfinedHomesToSupervisor|legacySpawn|useSupervisorRecovery|process\.send\b|reconcileCliSpawnRun|readDetachedRun/;
  const hits = [];
  for (const file of walk(SRC)) {
    const text = fs.readFileSync(file, 'utf8');
    text.split('\n').forEach((line, index) => { if (forbidden.test(line)) hits.push(`${path.relative(SRC, file)}:${index + 1}: ${line.trim()}`); });
  }
  assert.deepEqual(hits, []);
  assert.equal(fs.existsSync(path.join(SRC, 'runner/dispatch/detached-run-supervisor.mjs')), false);
  assert.equal(fs.existsSync(path.join(SRC, 'runner/dispatch/reconcile-cli-spawn.mjs')), false);
});

test('spawnWithLocks gives the child the lock descriptions at 3 and 4 and nothing else of this process', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-spawn-locks-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const fgosDir = path.join(dir, '.fgos');
  fs.mkdirSync(fgosDir);
  const scope = createLockScope('test');
  const attempt = acquireSync(scope, 'attempt', { fgosDir, runDir: path.join(dir, 'asg'), NN: '01' });
  const lease = acquireSync(scope, 'dispatch-cwd', { fgosDir, cwd: dir });
  assert.equal(attempt.result, 'acquired');
  assert.equal(lease.result, 'acquired');
  const out = path.join(dir, 'out.txt');
  const outFd = fs.openSync(out, 'w');
  // A node child lists what its descriptors point at; only files under `dir` matter (its own runtime
  // keeps anonymous descriptors of its own).
  const listing = `const fs=require('fs');const o=[];for(const e of fs.readdirSync('/proc/self/fd')){try{o.push(e+'='+fs.readlinkSync('/proc/self/fd/'+e))}catch{}}process.stdout.write(o.join('\\n'))`;
  const child = spawnWithLocks([attempt.handle, lease.handle], {
    command: process.execPath,
    args: ['-e', listing],
    env: { PATH: process.env.PATH },
    stdout: outFd,
    stderr: outFd,
  });
  fs.closeSync(outFd);
  await new Promise((resolve) => child.on('exit', resolve));
  const lines = Object.fromEntries(fs.readFileSync(out, 'utf8').trim().split('\n').map((l) => l.split('=')));
  assert.match(lines['3'], /attempt\.lock$/);
  assert.match(lines['4'], /dispatch-cwd--.*\.lock$/);
  const mine = Object.entries(lines).filter(([n, target]) => target.startsWith(dir) && !['1', '2', '3', '4'].includes(n));
  assert.deepEqual(mine, [], 'no other file of this process reaches the child');
  attempt.handle.release();
  lease.handle.release();
});

test('waitForBinding names a supervisor that ended without binding and one that is still silent', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-wait-binding-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  assert.deepEqual(await waitForBinding(dir, { exitCode: 70, signalCode: null }, { timeoutMs: 500 }), { state: 'exited', exit: 70, signal: null });
  assert.deepEqual(await waitForBinding(dir, { exitCode: null, signalCode: null }, { timeoutMs: 120 }), { state: 'unknown' });
  fs.writeFileSync(path.join(dir, 'supervisor-binding.json'), '{}');
  assert.deepEqual(await waitForBinding(dir, { exitCode: null, signalCode: null }, { timeoutMs: 500 }), { state: 'bound' });
});

test('the step environment carries the state root and PATH and never a lock description', () => {
  const env = attemptStepEnv({
    env: { PATH: '/usr/bin', HOME: '/home/x', FGOS_STATE_ROOT: '/state', FGOS_LOCK_FD: 'attempt:3', FGOS_LOCK_JOB: 'x:y', FGOS_RUST_HOST_RECURSION_GUARD: '1', SECRET_API_KEY: 'sk-1', FGOS_HOST_BIN: '/bin/fgos' },
  });
  assert.equal(env.PATH, '/usr/bin');
  assert.equal(env.HOME, '/home/x');
  assert.equal(env.FGOS_STATE_ROOT, '/state');
  assert.equal(env.FGOS_HOST_BIN, '/bin/fgos');
  for (const name of ['FGOS_LOCK_FD', 'FGOS_LOCK_JOB', 'FGOS_RUST_HOST_RECURSION_GUARD', 'SECRET_API_KEY']) assert.equal(name in env, false, name);
});

test('the envelope is immutable, digest-checked and secret-free; the side file is 0600 and holds the secrets and the control token', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-envelope-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const runDir = path.join(dir, 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  prepareAttemptFiles(runDir, 'att-1');
  const body = buildEnvelope({
    attemptId: 'att-1', unitRunId: 'unit-1', runDir, host: { hostBin: '/h/fgos', payloadRoot: '/h/payload' }, cwd: dir, mutating: false,
    attempt: { command: '/bin/agent', args: ['--x'], env: { PATH: '/bin' }, bwrapPrefix: ['--unshare-pid', '--as-pid-1', '--proc', '/proc', '--'], bwrapExecutable: '/usr/bin/bwrap' },
    timeoutMs: 60_000, idleTimeoutMs: null, cli: 'claude', stepEnv: { PATH: '/bin', FGOS_STATE_ROOT: '/state', HOME: '/h' },
    gateKillGraceMs: 2345, killWaitMs: 3456,
  });
  const envelope = writeAttemptFiles({ runDir, body, secretEnv: { PATH: '/bin', API_KEY: 'sk-secret-1' }, controlEpoch: 3, controlToken: 'token-3' });
  const { digest, ...rest } = envelope;
  assert.equal(digest, computeSha256Digest(rest));
  assert.equal(envelope.v, 3);
  assert.equal(envelope.mode, 'direct');
  assert.equal(envelope.containment.bwrapPrefix[0], '/usr/bin/bwrap', 'the sandbox program leads the prefix');
  assert.equal(envelope.deadlines.gateKillGraceMs, 2345);
  assert.equal(envelope.deadlines.killWaitMs, 3456);
  assert.ok(envelope.deadlines.hardCeiling.boottimeNs > envelope.deadlines.softAt.boottimeNs);
  assert.equal(envelope.createdAt.bootId, envelope.deadlines.softAt.bootId);
  assert.deepEqual(envelope.steps.map((s) => s.stepId), ['settle-attempt', 'finalize-home']);
  for (const step of envelope.steps) assert.equal(step.env.FGOS_STATE_ROOT, '/state');
  assert.doesNotMatch(fs.readFileSync(path.join(runDir, 'envelope.json'), 'utf8'), /sk-secret-1|token-3/);
  const side = JSON.parse(fs.readFileSync(envelope.sideFile, 'utf8'));
  assert.deepEqual({ epoch: side.controlEpoch, token: side.controlToken, key: side.env.API_KEY }, { epoch: 3, token: 'token-3', key: 'sk-secret-1' });
  assert.equal(fs.statSync(envelope.sideFile).mode & 0o777, 0o600);
  assert.throws(() => writeAttemptFiles({ runDir, body, secretEnv: {}, controlEpoch: 1, controlToken: 't' }), /already|EEXIST/, 'the envelope and side file are written once');
  const paths = attemptPaths(runDir, 'att-1');
  for (const file of [paths.stdout, paths.stderr, paths.gateExit]) assert.equal(fs.statSync(file).size, 0, `${file} is created empty for the sandbox to bind`);
  assert.deepEqual(attemptGateCommand('/h/fgos', runDir), ['/h/fgos', 'internal', 'gate', '--protocol', '1', '--envelope', path.join(runDir, 'envelope.json'), '--go-fd', '5']);
});

test('awaitSettledResult returns null for a supervisor that is gone and an attempt the adopt door cannot finish', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-await-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  // No envelope: the adopt door answers legacy-run, nothing will ever settle this directory.
  const capture = { stdout: path.join(dir, 'o'), stderr: path.join(dir, 'e') };
  const result = await awaitSettledResult({ runDir: dir, runId: 'run-x', child: { exitCode: 1, signalCode: null }, capture, onChunk: null, ceilingMs: 1000 });
  assert.equal(result, null);
});

test('a real run carries the configured kill grace and kill wait in its envelope and keeps the secrets in the side file only', { skip, timeout: 60_000 }, async () => {
  const project = createProject({ agent: { runMs: 300 }, dispatch: { gateKillGraceMs: 2345 } });
  const config = JSON.parse(fs.readFileSync(path.join(project.repoDir, '.fgos', 'config.json'), 'utf8'));
  config.lock = { predecessorKillWaitMs: 3456 };
  config.runner.executors.noisy.invocations[0].env.API_KEY = 'sk-live-secret-9';
  fs.writeFileSync(path.join(project.repoDir, '.fgos', 'config.json'), JSON.stringify(config));
  const run = startRun(project, project.unitFile('envelope-real'));
  const { code } = await run.exited;
  assert.equal(code, 0, run.output().stderr);
  const [dir] = project.attemptDirs();
  const envelope = readJson(path.join(dir, 'envelope.json'));
  assert.equal(envelope.deadlines.gateKillGraceMs, 2345);
  assert.equal(envelope.deadlines.killWaitMs, 3456);
  assert.ok(envelope.steps.every((s) => s.env.PATH && s.env.FGOS_STATE_ROOT && s.env.HOME), 'every step starts with the variables the Node payload reads');
  assert.doesNotMatch(fs.readFileSync(path.join(dir, 'envelope.json'), 'utf8'), /sk-live-secret-9/);
  assert.equal(readJson(path.join(dir, 'protected', 'attempt-secrets.json')).env.API_KEY, 'sk-live-secret-9');
  assert.ok(readJson(path.join(dir, 'supervisor-binding.json')).supervisor.pid > 0);
});
