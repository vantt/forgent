import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readEvents, parseEventLines, EventLogError } from '../../src/state/events.mjs';
test('explicit legacy inventories parse exactly and refuse corruption', () => {
  assert.deepEqual(parseEventLines('{"seq":1}\n', 'inventory'), [{ seq: 1 }]);
  for (const raw of ['{', '{}\n\n', '{}\n{"partial":']) assert.throws(() => parseEventLines(raw, 'inventory'), EventLogError);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'legacy-parse-'));
  try {
    assert.deepEqual(readEvents(path.join(root, 'absent')), []);
    fs.writeFileSync(path.join(root, 'log'), '{}\n');
    assert.deepEqual(readEvents(path.join(root, 'log')), [{}]);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
