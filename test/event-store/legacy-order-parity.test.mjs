import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readAllEventsFromDir } from '../../src/state/replay.mjs';
const vectors = JSON.parse(fs.readFileSync(new URL('../../packages/event-store/contracts/vectors/legacy-order.v1.json', import.meta.url)));
test('frozen legacy vectors equal the production Node reader', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'event-store-parity-'));
  try {
    fs.mkdirSync(path.join(dir, 'events'));
    for (const { file, lines } of vectors.files) {
      fs.writeFileSync(file ? path.join(dir, 'events', file) : path.join(dir, 'events.jsonl'), lines.join('\n') + '\n');
    }
    assert.deepEqual(readAllEventsFromDir(dir), vectors.expected.map(e => e.event));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
