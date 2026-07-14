import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { appendEvent, readEvents, EventLogError } from '../../src/state/events.mjs';

// Every test gets its own mkdtemp dir — never touch the repo's .fgos/.
function tmpLogPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-events-'));
  return path.join(dir, 'events.jsonl');
}

test('readEvents returns [] for a log that has not been initialized yet', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-events-'));
  const events = readEvents(path.join(dir, 'missing.jsonl'));
  assert.deepEqual(events, []);
});

test('appendEvent writes exactly one JSON line with an increasing seq and ISO ts', () => {
  const logPath = tmpLogPath();
  const first = appendEvent(logPath, { type: 'work.add', payload: { id: 'a' } });
  const second = appendEvent(logPath, { type: 'work.add', payload: { id: 'b' } });

  assert.equal(first.seq, 1);
  assert.equal(second.seq, 2);
  assert.match(first.ts, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

  const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
  assert.equal(lines.length, 2);
  assert.deepEqual(JSON.parse(lines[0]), first);
  assert.deepEqual(JSON.parse(lines[1]), second);
});

test('readEvents replays events back in append order', () => {
  const logPath = tmpLogPath();
  appendEvent(logPath, { type: 'work.add', payload: { id: 'a' } });
  appendEvent(logPath, { type: 'work.move', payload: { id: 'a', to: 'doing' } });

  const events = readEvents(logPath);
  assert.equal(events.length, 2);
  assert.equal(events[0].type, 'work.add');
  assert.equal(events[1].type, 'work.move');
  assert.equal(events[1].seq, 2);
});

test('appendEvent never rewrites a previously appended line', () => {
  const logPath = tmpLogPath();
  appendEvent(logPath, { type: 'work.add', payload: { id: 'a' } });
  const before = fs.readFileSync(logPath, 'utf8');
  appendEvent(logPath, { type: 'work.add', payload: { id: 'b' } });
  const after = fs.readFileSync(logPath, 'utf8');
  assert.ok(after.startsWith(before), 'first line must be byte-identical after a second append');
});

test('readEvents detects a truncated last line as corrupt-log and does not swallow it', () => {
  const logPath = tmpLogPath();
  appendEvent(logPath, { type: 'work.add', payload: { id: 'a' } });
  // Simulate a crash mid-append: a partial JSON fragment with no trailing newline.
  fs.appendFileSync(logPath, '{"seq":2,"ts":"2026-07-14T00:00:00.000Z","type":"work.move","pay', 'utf8');

  assert.throws(
    () => readEvents(logPath),
    (err) => err instanceof EventLogError && err.category === 'corrupt-log',
  );
});

test('readEvents detects a corrupt line anywhere in the log, not only at the end', () => {
  const logPath = tmpLogPath();
  fs.writeFileSync(logPath, '{"seq":1,"ts":"2026-07-14T00:00:00.000Z","type":"work.add","payload":null}\nnot json\n', 'utf8');

  assert.throws(
    () => readEvents(logPath),
    (err) => err instanceof EventLogError && err.category === 'corrupt-log',
  );
});

test('readEvents detects a corrupt line in the middle of the log — valid, corrupt, valid', () => {
  const logPath = tmpLogPath();
  fs.writeFileSync(
    logPath,
    [
      '{"seq":1,"ts":"2026-07-14T00:00:00.000Z","type":"work.add","payload":null}',
      'not json either',
      '{"seq":3,"ts":"2026-07-14T00:00:01.000Z","type":"work.move","payload":null}',
      '',
    ].join('\n'),
    'utf8',
  );

  assert.throws(
    () => readEvents(logPath),
    (err) => err instanceof EventLogError && err.category === 'corrupt-log',
  );
});

test('appendEvent rejects a missing or blank type as a validation error', () => {
  const logPath = tmpLogPath();
  assert.throws(
    () => appendEvent(logPath, { type: '', payload: {} }),
    (err) => err instanceof EventLogError && err.category === 'validation',
  );
  assert.throws(
    () => appendEvent(logPath, {}),
    (err) => err instanceof EventLogError && err.category === 'validation',
  );
});

test('appendEvent refuses to append onto an already-corrupt log', () => {
  const logPath = tmpLogPath();
  fs.writeFileSync(logPath, 'not json at all\n', 'utf8');
  assert.throws(
    () => appendEvent(logPath, { type: 'work.add', payload: { id: 'a' } }),
    (err) => err instanceof EventLogError && err.category === 'corrupt-log',
  );
});
