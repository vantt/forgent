// What names a dispatched seat in the terminal. The port builds the visible text (its own tests own the
// short id and the 24-character title cut); this file owns which facts a round hands it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slotDisplay, workLabelOf } from '../../src/runner/dispatch/terminal-slot.mjs';

test('a seat of a work item is named by the item id and its title when it has one, and a run without one by run and its random part, titled by its objective', () => {
  assert.deepEqual(workLabelOf({ workId: 'tsk-1lvxq7m2h9', objective: 'Execute implement.item operation' }), { id: 'tsk-1lvxq7m2h9' });
  assert.deepEqual(workLabelOf({ workId: 'tsk-1lvxq7m2h9', title: 'fix terminal layout', objective: 'Execute implement.item operation' }), { id: 'tsk-1lvxq7m2h9', title: 'fix terminal layout' });
  assert.deepEqual(
    workLabelOf({ unitRunId: 'unit-run-1792717350123-9f3a61c2', objective: 'rename the flag across the cli' }),
    { id: 'run-9f3a', title: 'rename the flag across the cli' },
  );
  assert.deepEqual(workLabelOf({ provenance: { unitRunId: 'unit-run-1792717350123-9f3a61c2' } }), { id: 'run-9f3a' });
  assert.deepEqual(workLabelOf({ objective: 'a plain dispatch' }), { title: 'a plain dispatch' });
});

test('the display of a slot carries structured facts and leaves out what is not known', () => {
  assert.deepEqual(
    slotDisplay({ id: 'tsk-1lvxq7m2h9', title: 'fix terminal layout', agent: '/usr/bin/claude', model: 'claude-sonnet', role: 'producer' }),
    { id: 'tsk-1lvxq7m2h9', title: 'fix terminal layout', role: 'producer', agent: 'claude', model: 'claude-sonnet' },
  );
  assert.deepEqual(slotDisplay({}), {});
});
