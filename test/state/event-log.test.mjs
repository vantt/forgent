import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEventLines, EventLogError } from '../../src/state/event-log.mjs';
test('an explicit legacy inventory parses exactly and corruption is refused', () => {
  assert.deepEqual(parseEventLines('{"seq":1}\n', 'inventory'), [{ seq: 1 }]);
  for (const raw of ['{', '{}\n\n', '{}\n{"partial":']) assert.throws(() => parseEventLines(raw, 'inventory'), EventLogError);
});
