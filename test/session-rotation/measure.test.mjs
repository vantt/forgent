import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { measureContext, measureFromTranscript } from '../../src/session-rotation/measure.mjs';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rot-measure-'));
const write = (name, lines) => { const f = path.join(dir, name); fs.writeFileSync(f, lines.map((l) => JSON.stringify(l)).join('\n') + '\n'); return f; };
const usage = (i, c, r) => ({ input_tokens: i, cache_creation_input_tokens: c, cache_read_input_tokens: r, output_tokens: 999 });
const rec = (ts, sid, tokens, size = 1000000) => ({ ts, session_id: sid, context_window: { context_window_size: size, current_usage: usage(tokens, 0, 0) } });

test('a sidecar record newer than the Stop timestamp gives the fraction from its own window size', async () => {
  const sidecar = write('a.jsonl', [rec(100, 's', 1), rec(300, 's', 200000, 500000), rec(400, 'other', 9)]);
  const m = await measureContext({ sidecarPath: sidecar, sessionId: 's', afterTs: 200, windowSize: 1000000, waitMs: 0 });
  assert.deepEqual([m.source, m.stale, m.fraction, m.sidecarTs], ['sidecar', false, 0.4, 300]);
});

test('a sidecar record older than the Stop timestamp is not fresh and the stale transcript is used', async () => {
  const sidecar = write('b.jsonl', [rec(100, 's', 500000)]);
  const transcript = write('b-t.jsonl', [{ type: 'assistant', message: { id: 'm1', usage: usage(100000, 50000, 50000) } }]);
  const m = await measureContext({ sidecarPath: sidecar, transcriptPath: transcript, sessionId: 's', afterTs: 200, windowSize: 1000000, waitMs: 0 });
  assert.deepEqual([m.source, m.stale, m.fraction], ['transcript', true, 0.2]);
});

test('a sidecar record that lands while waiting is taken', async () => {
  const sidecar = path.join(dir, 'c.jsonl');
  setTimeout(() => fs.writeFileSync(sidecar, JSON.stringify(rec(Date.now() + 5, 's', 100000)) + '\n'), 50);
  const m = await measureContext({ sidecarPath: sidecar, sessionId: 's', afterTs: Date.now(), windowSize: 1000000, waitMs: 1500, pollMs: 20 });
  assert.equal(m.fraction, 0.1);
});

test('the transcript sum uses the last non-sidechain assistant entry once per message id', () => {
  const t = write('d.jsonl', [
    { type: 'assistant', message: { id: 'm1', usage: usage(10, 0, 0) } },
    { type: 'assistant', message: { id: 'm2', usage: usage(1000, 2000, 3000) } },
    { type: 'assistant', message: { id: 'm2', usage: usage(1000, 2000, 7000) } },
    { type: 'assistant', isSidechain: true, message: { id: 'm3', usage: usage(999999, 0, 0) } },
    { type: 'user', message: {} },
  ]);
  const m = measureFromTranscript(t, 10000);
  assert.deepEqual([m.tokens, m.fraction], [10000, 1]);
});

test('no data at all measures nothing', async () => {
  assert.equal(await measureContext({ sidecarPath: path.join(dir, 'none'), transcriptPath: path.join(dir, 'none2'), afterTs: 0, windowSize: 1, waitMs: 0 }), null);
});
