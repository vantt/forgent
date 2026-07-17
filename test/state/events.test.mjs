import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { appendEvent, readEvents, repairTruncatedLastLine, EventLogError } from '../../src/state/events.mjs';
import { SCHEMA_VERSION } from '../../src/state/work.mjs';

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

test('appendEvent stamps every new event with v: SCHEMA_VERSION, from the single source in work.mjs (per D7c)', () => {
  const logPath = tmpLogPath();
  const event = appendEvent(logPath, { type: 'work.add', payload: { id: 'a' } });
  assert.equal(event.v, SCHEMA_VERSION);

  const [line] = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
  assert.equal(JSON.parse(line).v, SCHEMA_VERSION);
});

test('repairTruncatedLastLine repairs a log with only a truncated final line, and the log becomes readable again', () => {
  const logPath = tmpLogPath();
  appendEvent(logPath, { type: 'work.add', payload: { id: 'a' } });
  fs.appendFileSync(logPath, '{"seq":2,"ts":"2026-07-14T00:00:00.000Z","type":"work.move","pay', 'utf8');

  const result = repairTruncatedLastLine(logPath);
  assert.equal(result.eventCount, 1);
  assert.ok(fs.existsSync(result.backupPath));

  const events = readEvents(logPath);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'work.add');
});

test('repairTruncatedLastLine backs up the original (unrepaired) log before truncating', () => {
  const logPath = tmpLogPath();
  appendEvent(logPath, { type: 'work.add', payload: { id: 'a' } });
  const originalRaw = fs.readFileSync(logPath, 'utf8');
  fs.appendFileSync(logPath, '{"seq":2,"broken', 'utf8');
  const beforeRepair = fs.readFileSync(logPath, 'utf8');

  const { backupPath } = repairTruncatedLastLine(logPath);

  assert.equal(fs.readFileSync(backupPath, 'utf8'), beforeRepair);
  assert.notEqual(beforeRepair, originalRaw);
});

test('repairTruncatedLastLine refuses mid-file corruption (valid, corrupt, valid) — does not silently accept it', () => {
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
    () => repairTruncatedLastLine(logPath),
    (err) => err instanceof EventLogError && err.category === 'corrupt-log',
  );
  // Refusing must never touch the file on disk.
  assert.ok(fs.readFileSync(logPath, 'utf8').includes('not json either'));
});

test('repairTruncatedLastLine refuses multiple bad lines, including two truncated-looking lines', () => {
  const logPath = tmpLogPath();
  fs.writeFileSync(
    logPath,
    ['{"seq":1,"ts":"2026-07-14T00:00:00.000Z","type":"work.add","payload":null}', 'trunc-one', 'trunc-two'].join('\n'),
    'utf8',
  );

  assert.throws(
    () => repairTruncatedLastLine(logPath),
    (err) => err instanceof EventLogError && err.category === 'corrupt-log',
  );
});

test('repairTruncatedLastLine refuses a log that already parses cleanly — nothing to repair', () => {
  const logPath = tmpLogPath();
  appendEvent(logPath, { type: 'work.add', payload: { id: 'a' } });

  assert.throws(
    () => repairTruncatedLastLine(logPath),
    (err) => err instanceof EventLogError && err.category === 'validation',
  );
});

test('readEvents reads a pre-Phase-2 event with no v field at all, unmodified (per D7a: never rewritten)', () => {
  const logPath = tmpLogPath();
  fs.writeFileSync(
    logPath,
    `${JSON.stringify({ seq: 1, ts: '2026-07-13T00:00:00.000Z', type: 'work.add', payload: { id: 'legacy' } })}\n`,
    'utf8',
  );

  const [event] = readEvents(logPath);
  assert.equal(event.v, undefined);
  assert.equal(event.type, 'work.add');
  assert.equal(event.payload.id, 'legacy');
});
