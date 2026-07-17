import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rankImpact } from '../../src/state/impact.mjs';

// rankImpact is pure over a hand-built view (same shape replay.mjs's
// foldEvents produces: view.work[id] = { id, title, status, deps, ... }).

function item(id, status, deps = [], extra = {}) {
  return { id, title: `title-${id}`, status, deps, ...extra };
}

test('rankImpact on an empty view returns an empty list, not an error', () => {
  assert.deepEqual(rankImpact({ work: {} }), []);
});

test('rankImpact on a view with no deps ranks every open item at blocks:0', () => {
  const view = { work: { a: item('a', 'todo'), b: item('b', 'todo') } };
  assert.deepEqual(rankImpact(view).map((r) => [r.id, r.blocks]), [['a', 0], ['b', 0]]);
});

test('rankImpact counts an item once per other open item that depends on it', () => {
  const view = {
    work: {
      base: item('base', 'todo'),
      dep1: item('dep1', 'todo', ['base']),
      dep2: item('dep2', 'todo', ['base']),
    },
  };
  const [ranked] = rankImpact(view);
  assert.equal(ranked.id, 'base');
  assert.equal(ranked.blocks, 2);
});

test('rankImpact excludes done items from the denominator: a done item is never ranked', () => {
  const view = {
    work: {
      done: item('done', 'done'),
      open: item('open', 'todo', ['done']),
    },
  };
  assert.deepEqual(rankImpact(view).map((r) => r.id), ['open']);
});

test('rankImpact excludes done items from the numerator: a done dependent does not count as blocked', () => {
  const view = {
    work: {
      base: item('base', 'todo'),
      finishedDependent: item('finishedDependent', 'done', ['base']),
    },
  };
  const [ranked] = rankImpact(view);
  assert.equal(ranked.id, 'base');
  assert.equal(ranked.blocks, 0);
});

test('rankImpact orders by blocks descending', () => {
  const view = {
    work: {
      low: item('low', 'todo'),
      high: item('high', 'todo'),
      dep1: item('dep1', 'todo', ['high']),
      dep2: item('dep2', 'todo', ['high']),
      dep3: item('dep3', 'todo', ['high']),
    },
  };
  assert.deepEqual(rankImpact(view).map((r) => r.id), ['high', 'dep1', 'dep2', 'dep3', 'low']);
});

test('rankImpact breaks equal-blocks ties by ascending id', () => {
  const view = { work: { zed: item('zed', 'todo'), alpha: item('alpha', 'todo'), mid: item('mid', 'todo') } };
  assert.deepEqual(rankImpact(view).map((r) => r.id), ['alpha', 'mid', 'zed']);
});

test('rankImpact is deterministic: same view always yields the same ordered output', () => {
  const view = {
    work: {
      base: item('base', 'todo'),
      dep1: item('dep1', 'todo', ['base']),
      other: item('other', 'doing'),
    },
  };
  assert.deepEqual(rankImpact(view), rankImpact(view));
});

test('rankImpact emits every human-facing field: id, title, status, blocks', () => {
  const view = { work: { a: item('a', 'blocked', []) } };
  assert.deepEqual(rankImpact(view), [{ id: 'a', title: 'title-a', status: 'blocked', blocks: 0 }]);
});
