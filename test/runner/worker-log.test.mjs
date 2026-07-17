import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { appendWorkerLog } from '../../src/runner/worker-log.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-worker-log-'));
}

test('appendWorkerLog creates the logs dir on first write and writes a readable block', () => {
  const dir = mkTempDir();
  const logPath = appendWorkerLog(dir, 'item-a', {
    attempt: 1,
    tier: 'standard',
    model: 'sonnet',
    status: 0,
    stdout: 'hello from stdout',
    stderr: 'hello from stderr',
  });

  assert.equal(logPath, path.join(dir, 'logs', 'item-a.log'));
  assert.ok(fs.existsSync(path.join(dir, 'logs')), 'logs dir created');
  const content = fs.readFileSync(logPath, 'utf8');
  assert.match(content, /work item-a/);
  assert.match(content, /attempt 1/);
  assert.match(content, /tier standard -> sonnet/);
  assert.match(content, /exit 0/);
  assert.match(content, /hello from stdout/);
  assert.match(content, /hello from stderr/);
});

test('appendWorkerLog appends a second attempt as a NEW block rather than overwriting the first', () => {
  const dir = mkTempDir();
  appendWorkerLog(dir, 'item-b', { attempt: 1, stdout: 'first-run-output' });
  appendWorkerLog(dir, 'item-b', { attempt: 2, stdout: 'second-run-output' });

  const content = fs.readFileSync(path.join(dir, 'logs', 'item-b.log'), 'utf8');
  assert.match(content, /first-run-output/, 'first attempt survives');
  assert.match(content, /second-run-output/, 'second attempt appended');
  assert.match(content, /attempt 1/);
  assert.match(content, /attempt 2/);
});

test('appendWorkerLog degrades gracefully: only errorClass + message present (WorktreeError has no tier/model/stdout/stderr)', () => {
  const dir = mkTempDir();
  // Passing undefined for every rich field must not throw and must still
  // produce a readable entry carrying the errorClass and message.
  assert.doesNotThrow(() =>
    appendWorkerLog(dir, 'item-c', {
      attempt: 1,
      errorClass: 'worktree-fail',
      message: 'branch fgw/item-c already checked out elsewhere',
    }),
  );

  const content = fs.readFileSync(path.join(dir, 'logs', 'item-c.log'), 'utf8');
  assert.match(content, /worktree-fail/);
  assert.match(content, /branch fgw\/item-c already checked out elsewhere/);
  // the STDOUT/STDERR sections still render, degraded to (empty)
  assert.match(content, /--- STDOUT ---\n\(empty\)/);
  assert.match(content, /--- STDERR ---\n\(empty\)/);
});
