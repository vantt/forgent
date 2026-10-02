import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickNextPlanItem } from '../../src/state/plan-pool.mjs';
import { foldEvents } from '../../src/state/replay.mjs';

// Pure lib — every view here is a literal; no fs, no mkdtemp, no `.fgos/`
// writes anywhere in this file (same convention as discover-pool.test.mjs).
function item(id, stage, status, extra = {}) {
  return { id, title: id, kind: 'task', workflowStep: stage, status, deps: [], risk: 'light', refs: [], verify: 'true', ...extra };
}

test('pickNextPlanItem on an empty view returns null', () => {
  assert.equal(pickNextPlanItem({ work: {} }), null);
});

test('pickNextPlanItem on a view with no work key returns null', () => {
  assert.equal(pickNextPlanItem({}), null);
});

test('a stage:clarify item is never picked here, even as the only candidate', () => {
  const view = { work: { a: item('a', 'clarify', 'todo') } };
  assert.equal(pickNextPlanItem(view), null);
});

test('planning pool orders by priority ASCENDING (lower value = higher priority)', () => {
  const view = {
    work: {
      a: item('a', 'planning', 'todo', { priority: 5 }),
      b: item('b', 'planning', 'todo', { priority: 1 }),
    },
  };
  assert.deepEqual(pickNextPlanItem(view), { id: 'b', workflowStep: 'planning' });
});

test('planning pool: an item WITH a priority sorts before one with no priority at all', () => {
  const view = {
    work: {
      a: item('a', 'planning', 'todo'),
      b: item('b', 'planning', 'todo', { priority: 99 }),
    },
  };
  assert.deepEqual(pickNextPlanItem(view), { id: 'b', workflowStep: 'planning' });
});

test('planning pool ties (both absent priority): FIFO (declaration order) wins', () => {
  const view = {
    work: {
      first: item('first', 'planning', 'todo'),
      second: item('second', 'planning', 'todo'),
    },
  };
  assert.deepEqual(pickNextPlanItem(view), { id: 'first', workflowStep: 'planning' });
});

// The older step name `decompose` is mapped onto `planning` by replay (the Workflow's
// aliases), so an item that reached it before the rename is a plan candidate like any other.
test('an item recorded at the older step name "decompose" is picked as a planning item once folded', () => {
  const view = foldEvents([
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true', stage: 'decompose' } },
  ]);
  assert.deepEqual(pickNextPlanItem(view), { id: 'a', workflowStep: 'planning' });
});

test('older-named and current planning items share ONE pool, ordered by priority together', () => {
  const view = foldEvents([
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'legacyItem', title: 'L', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true', stage: 'decompose', priority: 5 } },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.add', payload: { id: 'currentItem', title: 'C', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true', workflowStep: 'planning', priority: 1 } },
  ]);
  assert.deepEqual(pickNextPlanItem(view), { id: 'currentItem', workflowStep: 'planning' });
});

test('an item with an unmet dep is never picked, even as the only candidate', () => {
  const view = {
    work: {
      blocker: item('blocker', 'planning', 'todo'),
      dependent: item('dependent', 'planning', 'todo', { deps: ['blocker'] }),
    },
  };
  assert.deepEqual(pickNextPlanItem(view), { id: 'blocker', workflowStep: 'planning' });
});

test('an item anchored by an open decomposed child is never picked, even with status:todo and no unmet deps', () => {
  const view = {
    work: {
      // child is stage:executing (not itself a candidate-stage item) so
      // the only thing this test proves is the anchor exclusion on
      // `parent`.
      parent: item('parent', 'planning', 'todo'),
      child: item('child', 'executing', 'todo', { parent: 'parent' }),
    },
  };
  assert.equal(pickNextPlanItem(view), null);
});
