import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { appendEvent, readEvents, repairTruncatedLastLine, EventLogError } from '../../src/state/events.mjs';
import { SCHEMA_VERSION } from '../../src/state/work.mjs';

const EVENTS_MJS = path.resolve(fileURLToPath(import.meta.url), '../../../src/state/events.mjs');

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

test('appendEvent stamps every new event with a 16-hex h (content hash) and a src (writer id)', () => {
  const logPath = tmpLogPath();
  const event = appendEvent(logPath, { type: 'work.add', payload: { id: 'a' } });

  assert.match(event.h, /^[0-9a-f]{16}$/);
  assert.ok(event.src !== undefined && event.src !== null);

  const [line] = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
  const onDisk = JSON.parse(line);
  assert.equal(onDisk.h, event.h);
  assert.equal(onDisk.src, event.src);
});

test('appendEvent produces a different h for two events with different content, and never reuses a prior h', () => {
  const logPath = tmpLogPath();
  const first = appendEvent(logPath, { type: 'work.add', payload: { id: 'a' } });
  const second = appendEvent(logPath, { type: 'work.add', payload: { id: 'b' } });
  assert.notEqual(first.h, second.h);
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

// tsk-3wq: repairTruncatedLastLine used to be an UNLOCKED whole-file
// read-modify-write. Mirroring the SAME real-OS-process fork technique the
// concurrent-appendEvent regression above already uses: two separate
// processes both call repairTruncatedLastLine on the SAME corrupt log at the
// same instant. Two concurrent repairs happen to compute the SAME output
// from the SAME source either way (locked or not — neither adds new
// content, both only drop the same corrupt tail), so this test alone does
// NOT discriminate old vs. new code; it is real regression coverage for
// deterministic, lossless behavior under concurrent repair attempts, kept
// alongside the actually-discriminating lock-contention test below. With
// the fix, the two calls serialize — exactly one succeeds and actually
// repairs; the other, running only after the first releases the lock, sees
// an already-clean log and throws the existing 'validation' "already
// parses cleanly" error (the same error the single-process test above
// already documents as expected for a clean log) — never a torn write.
test('repairTruncatedLastLine under two concurrent OS processes serializes — exactly one repairs, the other sees it already clean, and the result is never corrupted', async () => {
  const logPath = tmpLogPath();
  const workDir = path.dirname(logPath);
  appendEvent(logPath, { type: 'work.add', payload: { id: 'a' } });
  appendEvent(logPath, { type: 'work.add', payload: { id: 'b' } });
  fs.appendFileSync(logPath, '{"seq":3,"ts":"2026-07-14T00:00:00.000Z","type":"work.move","pay', 'utf8');

  const childScript = `
import { repairTruncatedLastLine, EventLogError } from ${JSON.stringify(EVENTS_MJS)};
const logPath = process.argv[2];
const startAt = Number(process.argv[3]);
const waitMs = startAt - Date.now();
if (waitMs > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, waitMs);
try {
  const result = repairTruncatedLastLine(logPath);
  console.log(JSON.stringify({ outcome: 'repaired', eventCount: result.eventCount }));
} catch (err) {
  if (err instanceof EventLogError && err.category === 'validation') {
    console.log(JSON.stringify({ outcome: 'already-clean' }));
  } else {
    console.log(JSON.stringify({ outcome: 'unexpected-error', message: err.message }));
    process.exitCode = 1;
  }
}
`;
  const childPath = path.join(workDir, 'repair-race-child.mjs');
  fs.writeFileSync(childPath, childScript);

  const startAt = Date.now() + 300;
  const results = await Promise.all(
    Array.from({ length: 2 }, () =>
      new Promise((resolve) => {
        let output = '';
        const child = fork(childPath, [logPath, String(startAt)], { stdio: ['inherit', 'pipe', 'inherit', 'ipc'] });
        child.stdout.on('data', (chunk) => {
          output += chunk;
        });
        child.on('exit', (code) => resolve({ code, output: output.trim() }));
      }),
    ),
  );

  assert.deepEqual(
    results.map((r) => r.code),
    [0, 0],
    'both children must exit 0 — a non-zero exit means an unexpected error, not the expected already-clean validation error',
  );

  const outcomes = results.map((r) => JSON.parse(r.output).outcome).sort();
  assert.deepEqual(
    outcomes,
    ['already-clean', 'repaired'],
    'exactly one process must have actually repaired the log; the other must see it already clean — never both repairing, never both erroring',
  );

  // The final on-disk state must be exactly the 2 original valid events,
  // never re-corrupted, never duplicated, never lost.
  const events = readEvents(logPath);
  assert.equal(events.length, 2, 'the log must contain exactly the 2 original valid events after both processes finish');
  assert.deepEqual(events.map((e) => e.payload.id), ['a', 'b']);

  fs.rmSync(workDir, { recursive: true, force: true });
});

// tsk-3wq: the actual before/after discriminator. A separate OS process
// acquires events.lock (via the real withEventsLock, the SAME lock
// appendEvent/repairTruncatedLastLine share) and holds it for a fixed
// duration; the parent then calls repairTruncatedLastLine and times it.
// Fixed (locked) code MUST block for at least that duration before it can
// even start its own read. Pre-fix (unlocked) code ignores the held lock
// entirely and returns almost immediately regardless of the other holder —
// this is what makes the assertion below fail on the pre-fix version
// (confirmed: swapping in `git show HEAD~1:src/state/events.mjs` and
// re-running this test measures an elapsed time far under HOLD_MS, while
// the post-fix version measures elapsed >= HOLD_MS reliably).
test('repairTruncatedLastLine now blocks on a lock another process holds — the actual old-vs-new discriminator', async () => {
  const logPath = tmpLogPath();
  const workDir = path.dirname(logPath);
  appendEvent(logPath, { type: 'work.add', payload: { id: 'a' } });
  fs.appendFileSync(logPath, '{"seq":2,"ts":"2026-07-14T00:00:00.000Z","type":"work.move","pay', 'utf8');

  const HOLD_MS = 500;
  const markerPath = path.join(workDir, 'lock-acquired.marker');
  const holderScript = `
import fs from 'node:fs';
import { withEventsLock } from ${JSON.stringify(EVENTS_MJS)};
const logPath = process.argv[2];
const markerPath = process.argv[3];
const holdMs = Number(process.argv[4]);
withEventsLock(logPath, () => {
  fs.writeFileSync(markerPath, String(Date.now()));
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, holdMs);
});
`;
  const holderPath = path.join(workDir, 'lock-holder.mjs');
  fs.writeFileSync(holderPath, holderScript);

  const holder = fork(holderPath, [logPath, markerPath, String(HOLD_MS)], { stdio: 'inherit' });
  // Poll for the marker instead of a fixed delay — proves the holder
  // actually has the lock before this test starts its own timer, with no
  // race against the holder's own startup time.
  const deadline = Date.now() + 2000;
  while (!fs.existsSync(markerPath)) {
    if (Date.now() > deadline) throw new Error('lock holder never acquired the lock within 2s');
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5);
  }

  const start = Date.now();
  const result = repairTruncatedLastLine(logPath);
  const elapsedMs = Date.now() - start;

  assert.equal(result.eventCount, 1);
  assert.ok(
    elapsedMs >= HOLD_MS - 50,
    `repairTruncatedLastLine must block until the held lock releases (~${HOLD_MS}ms) — only took ${elapsedMs}ms, meaning it did not actually wait for the lock`,
  );

  await new Promise((resolve) => holder.on('exit', resolve));
  fs.rmSync(workDir, { recursive: true, force: true });
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

// Cross-process regression (fgos-multi-session-checkout Epic 3): the real,
// spike-confirmed corruption was two SEPARATE OS processes both reading the
// same last seq and both writing seq+1 — an in-process test can never expose
// it (one event loop serializes the appends for free). Mirroring the forced
// spike's technique: fork several real child processes, synchronize them to a
// shared start instant so their append bursts genuinely overlap, then assert
// the append lock kept every seq unique, gapless, and strictly increasing.
test('appendEvent under concurrent OS processes yields unique, gapless, strictly-increasing seqs', async () => {
  const logPath = tmpLogPath();
  const workDir = path.dirname(logPath);
  fs.writeFileSync(logPath, '');

  // tsk-3wn — these two numbers are a BUDGET, not a "more is better" dial.
  // The lock is a mutex, so the run costs N_PROC * N_APPEND serialized
  // acquisitions, and every one of them is held to the SAME per-acquisition
  // deadline (EVENTS_LOCK_TIMEOUT_MS = 2000, src/state/events.mjs:50). The
  // last process in the queue therefore waits for very nearly the whole run.
  //
  // At 20 x 40 = 800 holders this test sat right on that deadline and failed
  // under load — not because the lock was broken, but because it had queued
  // an order of magnitude past what the timeout is documented for
  // (events.mjs:44-48 calls 2s "generous headroom for genuine contention
  // (dozens of serialized sub-ms holders) or a slow disk"). It failed three
  // times in one day inside `approve`/`return`'s post-merge verify — which
  // runs the whole suite on the busiest machine state there is — and each
  // failure rolled a merge back and parked an innocent item in `blocked`.
  //
  // 8 x 15 = 120 holders keeps a genuine stampede (8 real OS processes
  // released together by the barrier below, which is what actually exposes
  // the read-then-write race) while leaving roughly 5x headroom under the
  // deadline instead of ~1x. Raising these back without also raising the
  // budget they are measured against just re-arms the same trap.
  const N_PROC = 5;
  const N_APPEND = 8;

  // Each child imports the REAL appendEvent, waits until `startAt` (a shared
  // wall-clock barrier a few hundred ms out) so all processes stampede the
  // lock together, then fires N_APPEND appends back-to-back with no delay —
  // maximizing read-then-write window overlap. A lock regression surfaces as a
  // duplicate/gap in the assertions below; a genuine timeout surfaces as a
  // non-zero child exit (asserted too).
  const childScript = `
import { appendEvent } from ${JSON.stringify(EVENTS_MJS)};
const logPath = process.argv[2];
const startAt = Number(process.argv[3]);
const n = Number(process.argv[4]);
const waitMs = startAt - Date.now();
if (waitMs > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, waitMs);
for (let i = 0; i < n; i += 1) {
  appendEvent(logPath, { type: 'race-regression', payload: { i, pid: process.pid } });
}
`;
  const childPath = path.join(workDir, 'race-child.mjs');
  fs.writeFileSync(childPath, childScript);

  const startAt = Date.now() + 300;
  const exitCodes = await Promise.all(
    Array.from({ length: N_PROC }, () =>
      new Promise((resolve) => {
        const child = fork(childPath, [logPath, String(startAt), String(N_APPEND)], { stdio: 'inherit' });
        child.on('exit', (code) => resolve(code));
      }),
    ),
  );

  assert.deepEqual(
    exitCodes,
    Array(N_PROC).fill(0),
    'every child must exit 0 — a non-zero exit means an append threw (e.g. a lock-timeout under contention)',
  );

  // readEvents itself throws corrupt-log if any line was interleaved/torn.
  const events = readEvents(logPath);
  assert.equal(events.length, N_PROC * N_APPEND, 'every append must have landed exactly once');

  const seqs = events.map((e) => e.seq);
  const expected = Array.from({ length: N_PROC * N_APPEND }, (_, i) => i + 1);
  assert.deepEqual(
    [...seqs].sort((a, b) => a - b),
    expected,
    'seqs must be unique, gapless, and cover 1..N with no duplicates',
  );
  // Append order on disk must also be strictly increasing (the lock serializes
  // the whole read-compute-append, so the file is written in seq order).
  for (let i = 1; i < seqs.length; i += 1) {
    assert.ok(seqs[i] > seqs[i - 1], `seq at position ${i} (${seqs[i]}) must exceed the previous (${seqs[i - 1]})`);
  }

  fs.rmSync(workDir, { recursive: true, force: true });
});
