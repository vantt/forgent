// Real Windows helper, nested job, supervisor and gate. No emulated LockFileEx.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { createLockScope, probe } from '../../src/holder-lock/index.mjs';
import { admitSuccessor } from '../../src/runner/dispatch/cwd-lock.mjs';
import { acquireAttemptLocks, buildEnvelope, prepareAttemptFiles, resolveAttemptHost, startSupervisor, waitForBinding, writeAttemptFiles } from '../../src/run-supervisor/direct-launch.mjs';
import { mintAttemptWriterId } from '../../src/util/session-identity.mjs';

test('Windows retains controller custody while its supervisor declares the producer job', { skip: process.platform !== 'win32' && 'requires real Windows jobs and LockFileEx', timeout: 60000 }, async (t) => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-windows-custody-'));
  const fgosDir = path.join(cwd, '.fgos');
  const assignmentDir = path.join(fgosDir, 'assignments', 'custody');
  const runDir = path.join(assignmentDir, 'runs', '01');
  const attemptId = `windows-custody-${process.pid}`;
  const host = resolveAttemptHost();
  const custody = admitSuccessor(createLockScope('unit'), fgosDir, cwd);
  const locks = acquireAttemptLocks({ fgosDir, assignmentDir, attemptStr: '01', cwd, mutating: true, custody });
  let child;
  t.after(() => { child?.kill(); locks.release(); if (!custody.released) custody.release(); fs.rmSync(cwd, { recursive: true, force: true }); });
  prepareAttemptFiles(runDir, attemptId);
  const stepEnv = { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, FGOS_HOST_BIN: host.hostBin };
  const body = buildEnvelope({ attemptId, unitRunId: 'unit-custody', runDir, host, cwd, mutating: true,
    cwdLeaseFile: custody.path, cwdLeaseOwner: custody.domainEndpoint(),
    attempt: { command: process.execPath, args: ['-e', 'setTimeout(() => {}, 1000)'], env: stepEnv },
    timeoutMs: 10000, gateKillGraceMs: 1000, killWaitMs: 2000, cli: 'claude', stepEnv,
    identity: { writerId: mintAttemptWriterId(attemptId, { bin: host.hostBin }), parentWriterId: null },
  });
  body.steps = [];
  const envelope = writeAttemptFiles({ runDir, body, secretEnv: {}, controlEpoch: 1, controlToken: 'test' });
  ({ child } = startSupervisor({ envelope, locks, stepEnv }));
  const ended = once(child, 'exit');
  locks.releaseAttempt();
  assert.equal((await waitForBinding(runDir, child)).state, 'bound');
  const record = JSON.parse(fs.readFileSync(`${custody.path}.predecessor.json`, 'utf8'));
  assert.equal(record.domainKind, 'windows-job');
  assert.equal(probe('dispatch-cwd', { fgosDir, cwd }).result, 'held');
  await ended;
  assert.ok(fs.existsSync(path.join(runDir, 'receipt.json')));
  assert.equal(probe('dispatch-cwd', { fgosDir, cwd }).result, 'held', 'the unit still owns custody after the supervisor exits');
  custody.clearDomain(); custody.release();
  assert.equal(probe('dispatch-cwd', { fgosDir, cwd }).result, 'free');
});
