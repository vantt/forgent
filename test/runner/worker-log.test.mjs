import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { appendWorkerLog, appendWorkerLogChunk } from '../../src/runner/worker-log.mjs';

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

test('appendWorkerLog never throws when the write fails (review finding F-P1-1) -- pure observability must not crash dispatch', () => {
  const dir = mkTempDir();
  // Blocking 'logs' with a plain file makes mkdirSync throw (EEXIST/ENOTDIR)
  // exactly the class of I/O failure (disk full, EACCES, read-only .fgos)
  // this fix isolates.
  fs.writeFileSync(path.join(dir, 'logs'), 'not a directory');

  let result;
  assert.doesNotThrow(() => {
    result = appendWorkerLog(dir, 'item-d', { attempt: 1, stdout: 'would have logged' });
  });
  assert.equal(result, null, 'a failed write degrades to null, never throws');
});

// --- appendWorkerLogChunk: live per-chunk tee (P39) -------------------

test('appendWorkerLogChunk creates the logs dir on first write and writes the chunk unwrapped (no header)', () => {
  const dir = mkTempDir();
  const logPath = appendWorkerLogChunk(dir, 'item-e', 'partial output as it arrives');

  assert.equal(logPath, path.join(dir, 'logs', 'item-e.log'));
  const content = fs.readFileSync(logPath, 'utf8');
  assert.equal(content, 'partial output as it arrives', 'raw chunk, no timestamp/header wrapping');
});

test('appendWorkerLogChunk appends successive chunks in order onto the same file, live-tee style', () => {
  const dir = mkTempDir();
  appendWorkerLogChunk(dir, 'item-f', 'first chunk\n');
  appendWorkerLogChunk(dir, 'item-f', 'second chunk\n');
  appendWorkerLogChunk(dir, 'item-f', 'third chunk\n');

  const content = fs.readFileSync(path.join(dir, 'logs', 'item-f.log'), 'utf8');
  assert.equal(content, 'first chunk\nsecond chunk\nthird chunk\n');
});

test('appendWorkerLogChunk followed by appendWorkerLog: live-teed chunks are still there, then the terminal block appends after (both through the same door)', () => {
  const dir = mkTempDir();
  appendWorkerLogChunk(dir, 'item-g', 'streamed while running\n');
  appendWorkerLog(dir, 'item-g', { attempt: 1, status: 0, stdout: 'streamed while running\n' });

  const content = fs.readFileSync(path.join(dir, 'logs', 'item-g.log'), 'utf8');
  const liveIndex = content.indexOf('streamed while running');
  const blockIndex = content.indexOf('=== ');
  assert.ok(liveIndex >= 0 && blockIndex > liveIndex, 'live chunk appears before the terminal block');
  assert.match(content, /exit 0/, 'terminal block still records the outcome as before');
});

test('appendWorkerLogChunk is a no-op for an empty/falsy chunk (never creates the dir for nothing)', () => {
  const dir = mkTempDir();
  assert.equal(appendWorkerLogChunk(dir, 'item-h', ''), null);
  assert.equal(appendWorkerLogChunk(dir, 'item-h', undefined), null);
  assert.ok(!fs.existsSync(path.join(dir, 'logs')));
});

test('appendWorkerLogChunk never throws when the write fails (same F-P1-1 discipline as appendWorkerLog)', () => {
  const dir = mkTempDir();
  fs.writeFileSync(path.join(dir, 'logs'), 'not a directory');

  let result;
  assert.doesNotThrow(() => {
    result = appendWorkerLogChunk(dir, 'item-i', 'would have streamed');
  });
  assert.equal(result, null, 'a failed write degrades to null, never throws');
});
