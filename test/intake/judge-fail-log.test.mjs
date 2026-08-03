import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { appendJudgeFailLog } from '../../src/intake/judge-fail-log.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-judge-fail-log-'));
}

test('appendJudgeFailLog creates the logs dir on first write and writes a readable outer-exception block', () => {
  const dir = mkTempDir();
  const logPath = appendJudgeFailLog(dir, 'item-a', {
    reason: 'outer-exception',
    message: 'boom',
    stack: 'Error: boom\n    at somewhere',
  });

  assert.equal(logPath, path.join(dir, 'logs', 'item-a-judge-fail.log'));
  assert.ok(fs.existsSync(path.join(dir, 'logs')), 'logs dir created');
  const content = fs.readFileSync(logPath, 'utf8');
  assert.match(content, /item item-a/);
  assert.match(content, /reason outer-exception/);
  assert.match(content, /message: boom/);
  assert.match(content, /Error: boom/);
});

test('appendJudgeFailLog writes a readable non-parse-exit block with attempt/status/signal/stderr', () => {
  const dir = mkTempDir();
  const logPath = appendJudgeFailLog(dir, 'item-b', {
    reason: 'non-parse-exit',
    attempt: 1,
    status: 7,
    signal: null,
    error: undefined,
    stderr: 'stderr from the failing executor',
  });
  const content = fs.readFileSync(logPath, 'utf8');
  assert.match(content, /reason non-parse-exit/);
  assert.match(content, /attempt: 1/);
  assert.match(content, /exit status: 7/);
  assert.match(content, /stderr from the failing executor/);
});

test('appendJudgeFailLog writes a readable parse-exhausted block with every attempt\'s raw stdout', () => {
  const dir = mkTempDir();
  const logPath = appendJudgeFailLog(dir, 'item-c', {
    reason: 'parse-exhausted',
    attempts: [
      { attempt: 1, stdout: 'prose reply 1' },
      { attempt: 2, stdout: 'prose reply 2' },
      { attempt: 3, stdout: 'prose reply 3' },
    ],
  });
  const content = fs.readFileSync(logPath, 'utf8');
  assert.match(content, /reason parse-exhausted/);
  assert.match(content, /ATTEMPT 1 STDOUT/);
  assert.match(content, /prose reply 1/);
  assert.match(content, /ATTEMPT 3 STDOUT/);
  assert.match(content, /prose reply 3/);
});

test('appendJudgeFailLog writes a readable shape-invalid block with the parsed verdict', () => {
  const dir = mkTempDir();
  const logPath = appendJudgeFailLog(dir, 'item-d', {
    reason: 'shape-invalid',
    verdict: JSON.stringify({ clear: 'yes' }),
  });
  const content = fs.readFileSync(logPath, 'utf8');
  assert.match(content, /reason shape-invalid/);
  assert.match(content, /"clear":"yes"/);
});

test('appendJudgeFailLog appends a second fail-safe hit as a NEW block rather than overwriting the first', () => {
  const dir = mkTempDir();
  appendJudgeFailLog(dir, 'item-e', { reason: 'non-parse-exit', attempt: 1, status: 1 });
  appendJudgeFailLog(dir, 'item-e', { reason: 'parse-exhausted', attempts: [{ attempt: 1, stdout: 'later hit' }] });

  const content = fs.readFileSync(path.join(dir, 'logs', 'item-e-judge-fail.log'), 'utf8');
  assert.match(content, /reason non-parse-exit/, 'first entry survives');
  assert.match(content, /reason parse-exhausted/, 'second entry appended');
  assert.match(content, /later hit/);
});

test('appendJudgeFailLog never throws and returns null for a missing/blank id', () => {
  const dir = mkTempDir();
  assert.doesNotThrow(() => {
    assert.equal(appendJudgeFailLog(dir, undefined, { reason: 'outer-exception' }), null);
    assert.equal(appendJudgeFailLog(dir, '', { reason: 'outer-exception' }), null);
    assert.equal(appendJudgeFailLog(dir, '   ', { reason: 'outer-exception' }), null);
  });
  assert.equal(fs.existsSync(path.join(dir, 'logs')), false);
});

test('appendJudgeFailLog never throws and returns null when fgosDir is unwritable/invalid', () => {
  assert.doesNotThrow(() => {
    assert.equal(appendJudgeFailLog(undefined, 'item-f', { reason: 'outer-exception' }), null);
  });
});
