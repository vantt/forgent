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

// wontfix-terminal-status-filter-consistency D2: a wontfix item is RESOLVED
// the same as done -- nothing further will ever happen to it, so it must
// not count on either side of the ranking.
test('rankImpact excludes wontfix items from the denominator: a wontfix item is never ranked', () => {
  const view = {
    work: {
      closed: item('closed', 'wontfix'),
      open: item('open', 'todo', ['closed']),
    },
  };
  assert.deepEqual(rankImpact(view).map((r) => r.id), ['open']);
});

test('rankImpact excludes wontfix items from the numerator: a wontfix dependent does not count as blocked', () => {
  const view = {
    work: {
      base: item('base', 'todo'),
      closedDependent: item('closedDependent', 'wontfix', ['base']),
    },
  };
  const [ranked] = rankImpact(view);
  assert.equal(ranked.id, 'base');
  assert.equal(ranked.blocks, 0);
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

test('rankImpact emits every human-facing field: id, title, status, blocks, blockedBy, stage, goalTier, priority, componentId, componentSize, isIsolated', () => {
  const view = { work: { a: item('a', 'blocked', []) } };
  assert.deepEqual(rankImpact(view), [{
    id: 'a', title: 'title-a', status: 'blocked', blocks: 0, blockedBy: [],
    stage: 'executing', goalTier: null, priority: null, componentId: 0, componentSize: 1, isIsolated: true,
  }]);
});

test('rankImpact reads priority as-is when the item carries one, null when absent', () => {
  const view = { work: { a: item('a', 'todo', [], { priority: 2 }), b: item('b', 'todo') } };
  const [aRow, bRow] = rankImpact(view).sort((x, y) => (x.id < y.id ? -1 : 1));
  assert.equal(aRow.priority, 2);
  assert.equal(bRow.priority, null);
});

test('rankImpact reads stage as-is when the item carries one, defaulting to executing when absent', () => {
  const view = { work: { a: item('a', 'todo', [], { stage: 'clarify' }), b: item('b', 'todo') } };
  const [aRow, bRow] = rankImpact(view).sort((x, y) => (x.id < y.id ? -1 : 1));
  assert.equal(aRow.stage, 'clarify');
  assert.equal(bRow.stage, 'executing');
});

test('rankImpact reads goalTier as-is when the item carries one, null when absent', () => {
  const view = { work: { a: item('a', 'todo', [], { goalTier: 'mvp' }), b: item('b', 'todo') } };
  const [aRow, bRow] = rankImpact(view).sort((x, y) => (x.id < y.id ? -1 : 1));
  assert.equal(aRow.goalTier, 'mvp');
  assert.equal(bRow.goalTier, null);
});

test('rankImpact sorts declared goals ahead of ungrouped work: mvp, then milestone, then no tier', () => {
  const view = {
    work: {
      plain: item('plain', 'todo'),
      goal: item('goal', 'todo', [], { goalTier: 'milestone' }),
      top: item('top', 'todo', [], { goalTier: 'mvp' }),
    },
  };
  assert.deepEqual(rankImpact(view).map((r) => r.id), ['top', 'goal', 'plain']);
});

test('rankImpact groups items sharing a deps or parent edge into the same component, size counted correctly', () => {
  const view = {
    work: {
      base: item('base', 'todo'),
      dep1: item('dep1', 'todo', ['base']),
      lonely: item('lonely', 'todo'),
    },
  };
  const [baseRow, dep1Row, lonelyRow] = rankImpact(view).sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0));
  assert.equal(baseRow.componentId, dep1Row.componentId);
  assert.equal(baseRow.componentSize, 2);
  assert.equal(baseRow.isIsolated, false);
  assert.equal(lonelyRow.componentSize, 1);
  assert.equal(lonelyRow.isIsolated, true);
});

test('rankImpact credits a child with unblocking its open parent, the same way a deps target is credited by its dependent', () => {
  // A parent stays gated on an open child (frontier.mjs's hasOpenDescendant) —
  // so finishing the CHILD is what moves the parent closer to unblocked, and
  // the child is the one that earns the blocks credit, not the parent.
  const view = {
    work: {
      root: item('root', 'todo'),
      child: item('child', 'todo', [], { parent: 'root' }),
    },
  };
  const [childRow] = rankImpact(view).filter((r) => r.id === 'child');
  assert.equal(childRow.blocks, 1);
});

test('rankImpact combines deps-credit and parent-credit on the same item rather than only counting one relation', () => {
  const view = {
    work: {
      hub: item('hub', 'todo'),
      dependent: item('dependent', 'todo', ['hub']),
      child: item('child', 'todo', [], { parent: 'hub' }),
    },
  };
  const hubRow = rankImpact(view).find((r) => r.id === 'hub');
  const childRow = rankImpact(view).find((r) => r.id === 'child');
  assert.equal(hubRow.blocks, 1); // credited by `dependent`'s deps entry
  assert.equal(childRow.blocks, 1); // credited for unblocking `hub` once done
});

test('rankImpact breaks an equal-blocks tie by component size before falling back to id', () => {
  // `inCluster` and `alone` both sit at blocks:0, so id order alone (the
  // pre-existing tiebreak) would put `alone` first — component size now
  // takes priority over id, so the item with a real (still-open) cluster
  // around it sorts first instead.
  const view = {
    work: {
      alone: item('alone', 'todo'),
      inCluster: item('inCluster', 'todo'),
      clusterMate: item('clusterMate', 'todo', ['inCluster']),
    },
  };
  const ids = rankImpact(view).map((r) => r.id);
  assert.ok(ids.indexOf('inCluster') < ids.indexOf('alone'));
});

test('rankImpact excludes a done member from componentSize/isIsolated: a finished dependency leaves the item isolated', () => {
  const view = {
    work: {
      openItem: item('openItem', 'todo', ['finishedDep']),
      finishedDep: item('finishedDep', 'done'),
    },
  };
  const [openRow] = rankImpact(view);
  assert.equal(openRow.componentSize, 1);
  assert.equal(openRow.isIsolated, true);
});

// --- blockedBy (tsk-dus D1/D2) ---------------------------------------------

test('rankImpact.blockedBy lists a deps-only item\'s unmet deps', () => {
  const view = {
    work: {
      base: item('base', 'todo'),
      dep1: item('dep1', 'todo', ['base']),
      dep2: item('dep2', 'todo', ['base']),
    },
  };
  const rows = Object.fromEntries(rankImpact(view).map((r) => [r.id, r.blockedBy]));
  assert.deepEqual(rows, { base: [], dep1: ['base'], dep2: ['base'] });
});

test('rankImpact.blockedBy lists a parent\'s still-open child, not the other way around', () => {
  const view = {
    work: {
      root: item('root', 'todo'),
      child: item('child', 'todo', [], { parent: 'root' }),
    },
  };
  const rows = Object.fromEntries(rankImpact(view).map((r) => [r.id, r.blockedBy]));
  assert.deepEqual(rows, { root: ['child'], child: [] });
});

test('rankImpact.blockedBy combines deps-credit and parent-credit on the same item', () => {
  const view = {
    work: {
      hub: item('hub', 'todo'),
      dependent: item('dependent', 'todo', ['hub']),
      child: item('child', 'todo', [], { parent: 'hub' }),
    },
  };
  const rows = Object.fromEntries(rankImpact(view).map((r) => [r.id, r.blockedBy]));
  assert.deepEqual(rows, { hub: ['child'], dependent: ['hub'], child: [] });
});

test('rankImpact.blockedBy excludes a done dependency: a finished dep never appears', () => {
  const view = {
    work: {
      openItem: item('openItem', 'todo', ['finishedDep']),
      finishedDep: item('finishedDep', 'done'),
    },
  };
  const [openRow] = rankImpact(view);
  assert.deepEqual(openRow.blockedBy, []);
});

test('rankImpact({includeDone: true}).blockedBy is always [] for a done row', () => {
  const view = {
    work: {
      base: item('base', 'todo', ['finished']),
      finished: item('finished', 'done'),
    },
  };
  const [doneRow] = rankImpact(view, { includeDone: true }).filter((r) => r.id === 'finished');
  assert.deepEqual(doneRow.blockedBy, []);
});

// --- opts.includeDone (tsk-5oa D1) ----------------------------------------

test('rankImpact with no second argument (or includeDone falsy) is byte-identical to today\'s single-arg behavior', () => {
  const view = {
    work: {
      base: item('base', 'todo'),
      dep1: item('dep1', 'todo', ['base']),
      finished: item('finished', 'done'),
    },
  };
  assert.deepEqual(rankImpact(view), rankImpact(view, {}));
  assert.deepEqual(rankImpact(view), rankImpact(view, { includeDone: false }));
});

test('rankImpact({includeDone: true}) appends done items after every ranked open row', () => {
  const view = {
    work: {
      base: item('base', 'todo'),
      dep1: item('dep1', 'todo', ['base']),
      finished: item('finished', 'done'),
    },
  };
  const withDone = rankImpact(view, { includeDone: true });
  const withoutDone = rankImpact(view);
  assert.deepEqual(withDone.slice(0, withoutDone.length), withoutDone);
  assert.deepEqual(withDone.map((r) => r.id).slice(-1), ['finished']);
});

// wontfix-terminal-status-filter-consistency D2: includeDone's name stays
// (the pre-existing public flag) but its done-tail now also appends
// wontfix rows, same shape as a done row.
test('rankImpact({includeDone: true}) appends wontfix items after every ranked open row, same as done', () => {
  const view = {
    work: {
      base: item('base', 'todo'),
      dep1: item('dep1', 'todo', ['base']),
      closed: item('closed', 'wontfix'),
    },
  };
  const withDone = rankImpact(view, { includeDone: true });
  const withoutDone = rankImpact(view);
  assert.deepEqual(withDone.slice(0, withoutDone.length), withoutDone);
  assert.deepEqual(withDone.map((r) => r.id).slice(-1), ['closed']);
});

test('rankImpact({includeDone: true}) always gives a wontfix row blocks:0, componentSize:0, isIsolated:true, componentId:null', () => {
  const view = {
    work: {
      base: item('base', 'todo'),
      dependent: item('dependent', 'todo', ['base']),
      closed: item('closed', 'wontfix', ['base']),
    },
  };
  const [closedRow] = rankImpact(view, { includeDone: true }).filter((r) => r.id === 'closed');
  assert.deepEqual(closedRow, {
    id: 'closed', title: 'title-closed', status: 'wontfix', blocks: 0, blockedBy: [],
    stage: 'executing', goalTier: null, priority: null, componentId: null, componentSize: 0, isIsolated: true,
  });
});

test('rankImpact({includeDone: true}) always gives a done row blocks:0, componentSize:0, isIsolated:true, componentId:null', () => {
  const view = {
    work: {
      base: item('base', 'todo'),
      dependent: item('dependent', 'todo', ['base']),
      finished: item('finished', 'done', ['base']),
    },
  };
  const [doneRow] = rankImpact(view, { includeDone: true }).filter((r) => r.id === 'finished');
  assert.deepEqual(doneRow, {
    id: 'finished', title: 'title-finished', status: 'done', blocks: 0, blockedBy: [],
    stage: 'executing', goalTier: null, priority: null, componentId: null, componentSize: 0, isIsolated: true,
  });
});

test('rankImpact({includeDone: true}) sorts multiple done rows by goalTier then ascending id, never interleaved with open rows', () => {
  const view = {
    work: {
      open: item('open', 'todo'),
      zed: item('zed', 'done'),
      alpha: item('alpha', 'done', [], { goalTier: 'mvp' }),
      mid: item('mid', 'done'),
    },
  };
  const ids = rankImpact(view, { includeDone: true }).map((r) => r.id);
  assert.deepEqual(ids, ['open', 'alpha', 'mid', 'zed']);
});

test('rankImpact({includeDone: true}) on a view with only done items returns just the done rows, in tier/id order', () => {
  const view = { work: { b: item('b', 'done'), a: item('a', 'done') } };
  assert.deepEqual(rankImpact(view, { includeDone: true }).map((r) => r.id), ['a', 'b']);
});
