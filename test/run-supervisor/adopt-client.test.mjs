// The adopt client against a real host binary: it lists open attempt
// directories, calls `fgos internal adopt` and names what goes wrong.
// Needs FGOS_HOST_BIN pointing at a host built from this checkout.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { computeSha256Digest } from '../../src/runner/dispatch/proof-helpers.mjs';
import { adoptRun, adoptScan, listOpenAttemptDirs, RunSupervisorError } from '../../src/run-supervisor/client.mjs';

const HOST = process.env.FGOS_HOST_BIN;
const NEEDS_HOST = HOST && fs.existsSync(HOST) ? false : 'FGOS_HOST_BIN does not name a host built from this checkout';

function tmp(name) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `adopt-client-${name}-`));
}

/** An attempt directory a dead supervisor could leave: v3 envelope, free lock, no binding. */
function attemptDir(parent, name, { stepFile } = {}) {
  const dir = path.join(parent, name);
  fs.mkdirSync(dir, { recursive: true });
  const steps = stepFile ? [{
    stepId: 'settle-attempt',
    hostBin: '/bin/sh',
    payloadRoot: '/',
    argv: ['-c', `echo x >> ${stepFile}`],
    cwd: dir,
    env: { PATH: '/usr/local/bin:/usr/bin:/bin' },
    stepTimeoutMs: 10_000,
  }] : [];
  const envelope = {
    v: 3, attemptId: `att-${name}`, unitRunId: 'unit-1', runDir: dir, mode: 'direct', protocolId: 1,
    hostBin: HOST ?? '/bin/false', payloadRoot: '/', cwd: dir, mutation: 'read-only',
    launch: { command: '/bin/true', args: [], env: {}, stdinPolicy: 'null', briefPath: null, outboxDir: path.join(dir, 'outbox'), capture: { stdout: path.join(dir, 'o.log'), stderr: path.join(dir, 'e.log') } },
    containment: { preferred: 'linux-gate' },
    deadlines: { softAt: null, idleMs: null, hardCeiling: null, gateKillGraceMs: 1000 },
    agentProtocol: { cli: 'claude', mode: 'direct' },
    steps,
  };
  envelope.digest = computeSha256Digest(envelope);
  fs.writeFileSync(path.join(dir, 'envelope.json'), JSON.stringify(envelope));
  fs.writeFileSync(path.join(dir, 'attempt.lock'), '');
  return dir;
}

test('adoptRun drives an attempt to closed once and reports closed after that', { skip: NEEDS_HOST }, () => {
  const root = tmp('run');
  try {
    const stepFile = path.join(root, 'ran');
    const dir = attemptDir(root, 'a1', { stepFile });
    const first = adoptRun(dir);
    assert.equal(first.state, 'adopted');
    assert.equal(first.outcome, 'abandoned-not-started');
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'closed.json'), 'utf8')).closedBy, 'adopt');
    assert.equal(adoptRun(dir).state, 'closed');
    assert.equal(fs.readFileSync(stepFile, 'utf8').split('\n').filter(Boolean).length, 1, 'the step ran once');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('adoptRun with probeOnly changes nothing and a foreign run dir is legacy-run', { skip: NEEDS_HOST }, () => {
  const root = tmp('probe');
  try {
    const dir = attemptDir(root, 'a1');
    assert.equal(adoptRun(dir, { probeOnly: true }).state, 'needs-adopt');
    assert.deepEqual(fs.readdirSync(dir).sort(), ['attempt.lock', 'envelope.json']);
    const foreign = path.join(root, 'old');
    fs.mkdirSync(foreign);
    assert.equal(adoptRun(foreign).state, 'legacy-run');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('adoptScan lists open attempts under runs/, skips closed ones and answers in listing order', { skip: NEEDS_HOST }, () => {
  const root = tmp('scan');
  try {
    const open = [
      attemptDir(path.join(root, 'u1', 'runs'), '01'),
      attemptDir(path.join(root, 'u2', 'nested', 'runs'), '01'),
    ];
    const closed = attemptDir(path.join(root, 'u1', 'runs'), '00');
    fs.writeFileSync(path.join(closed, 'closed.json'), '{}');
    fs.mkdirSync(path.join(root, 'u3', 'not-runs', '01'), { recursive: true });
    assert.deepEqual(listOpenAttemptDirs(root), [...open].sort());

    const probed = adoptScan({ assignmentsRoot: root, probeOnly: true });
    assert.deepEqual(probed.map((l) => l.state), ['needs-adopt', 'needs-adopt']);
    const adopted = adoptScan({ assignmentsRoot: root });
    assert.deepEqual(adopted.map((l) => l.attemptDir), [...open].sort());
    assert.deepEqual(adopted.map((l) => l.state), ['adopted', 'adopted']);
    assert.deepEqual(adoptScan({ assignmentsRoot: root }), [], 'nothing open is left');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a route that fails is a named error, not a verdict', { skip: NEEDS_HOST }, () => {
  const root = tmp('fail');
  try {
    const script = path.join(root, 'bad-host.sh');
    fs.writeFileSync(script, '#!/bin/sh\necho "not json"\nexit 7\n', { mode: 0o755 });
    assert.throws(() => adoptRun(root, { hostBin: script }), (err) => err instanceof RunSupervisorError && err.code === 'adopt-route-failed' && err.status === 7);
    const old = path.join(root, 'old-host.sh');
    fs.writeFileSync(old, '#!/bin/sh\necho \'{"v":1,"protocol":1,"result":"error","code":"host-version-mismatch"}\'\nexit 3\n', { mode: 0o755 });
    assert.throws(() => adoptRun(root, { hostBin: old }), (err) => err.code === 'host-version-mismatch');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
