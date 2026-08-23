// test/state/status-category.test.mjs — decision record 0027 (D2/D3):
// `statusCategory` is frozen onto the `work.move`/`work.add` event payload
// at WRITE time (store.mjs), never derived on read (docs/platform-
// foundations.md's L3 replay-from-zero law). This file proves the schema
// exists (STATUS_CATEGORIES, work.mjs) and that the write door stamps it
// correctly for the six front-segment statuses (DOMAINS.coding.statusLabels,
// workflow-stage-graphs.mjs) while leaving the four tail-segment statuses
// (delivered/retrospective/cleanup/done) untouched, and that replay of an
// event predating this field neither throws nor invents a category.
//
// coding's own 10-status FSM behavior is unchanged by this cell (D1's
// explicit promise) — every assertion here is purely additive: a new field
// appearing/not-appearing on the event payload, never a changed transition
// or a changed existing field.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { addWork, moveWork } from '../../src/state/store.mjs';
import { STATUS_CATEGORIES } from '../../src/state/work.mjs';
import { foldEvents } from '../../src/state/replay.mjs';

// Every test gets its own mkdtemp dir — never touch the repo's .fgos/.
function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-status-category-'));
}

function addSampleWork(dir, id, overrides = {}) {
  addWork(dir, {
    id,
    title: `Title ${id}`,
    kind: 'task',
    status: 'todo',
    deps: [],
    risk: 'light',
    refs: [],
    verify: 'npm test',
    ...overrides,
  });
}

test('STATUS_CATEGORIES is exported, frozen, and contains exactly the six pinned category names', () => {
  assert.ok(Object.isFrozen(STATUS_CATEGORIES));
  assert.deepEqual(
    [...STATUS_CATEGORIES].sort(),
    ['backlog', 'canceled', 'completed', 'in-progress', 'review', 'todo'].sort(),
  );
});

const VALID_ASK = `## Context

We need a decision regarding the deployment configuration for this service.

## Why this matters

The deployment configuration impacts system availability and resource allocation.`;

// D2/D3's exact map for the six front-segment statuses. Each case walks the
// item through a real, legal status-fsm.mjs edge to reach `to`, so this also
// pins that the schema task made zero changes to which edges are legal.
const FRONT_SEGMENT_CASES = [
  {
    to: 'doing',
    category: 'in-progress',
    move: (dir, id) => moveWork(dir, { id, to: 'doing', expectedStatus: 'todo' }),
  },
  {
    to: 'blocked',
    category: 'in-progress',
    move: (dir, id) => moveWork(dir, { id, to: 'blocked', expectedStatus: 'todo' }),
  },
  {
    to: 'awaiting-human',
    category: 'in-progress',
    move: (dir, id) => moveWork(dir, { id, to: 'awaiting-human', expectedStatus: 'todo', ask: VALID_ASK }),
  },
  {
    to: 'awaiting-approval',
    category: 'review',
    move: (dir, id) => {
      moveWork(dir, { id, to: 'doing', expectedStatus: 'todo' });
      return moveWork(dir, { id, to: 'awaiting-approval', expectedStatus: 'doing' });
    },
  },
  {
    to: 'wontfix',
    category: 'canceled',
    move: (dir, id) => moveWork(dir, { id, to: 'wontfix', expectedStatus: 'todo' }),
  },
  {
    // `todo` itself is reached by moving BACK to it — the claim-release edge
    // (`doing -> todo`) needs no reason/ask, the cheapest legal round trip.
    to: 'todo',
    category: 'todo',
    move: (dir, id) => {
      moveWork(dir, { id, to: 'doing', expectedStatus: 'todo' });
      return moveWork(dir, { id, to: 'todo', expectedStatus: 'doing' });
    },
  },
];

for (const { to, category } of FRONT_SEGMENT_CASES) {
  test(`moveWork to front-segment status "${to}" writes statusCategory "${category}" on the event payload and the folded item`, () => {
    const dir = tmpDir();
    const id = `front-${to}`;
    addSampleWork(dir, id);
    const { event, view } = FRONT_SEGMENT_CASES.find((c) => c.to === to).move(dir, id);
    assert.equal(event.payload.statusCategory, category);
    assert.equal(view.work[id].statusCategory, category);
  });
}

// The sequential tail chain (D1): delivered -> retrospective -> cleanup ->
// done. None of the four carries a statusLabels entry in DOMAINS.coding
// (workflow-stage-graphs.mjs), so none of these moves should ever stamp
// statusCategory — literal status stays sufficient for them forever.
test('moveWork into the four tail-segment statuses never writes statusCategory on the event payload', () => {
  const dir = tmpDir();
  const id = 'tail-chain';
  addSampleWork(dir, id);
  moveWork(dir, { id, to: 'doing', expectedStatus: 'todo' });

  const delivered = moveWork(dir, { id, to: 'delivered', expectedStatus: 'doing' });
  assert.equal(delivered.event.payload.statusCategory, undefined);
  assert.ok(!('statusCategory' in delivered.event.payload));

  const retrospective = moveWork(dir, { id, to: 'retrospective', expectedStatus: 'delivered' });
  assert.equal(retrospective.event.payload.statusCategory, undefined);
  assert.ok(!('statusCategory' in retrospective.event.payload));

  const cleanup = moveWork(dir, { id, to: 'cleanup', expectedStatus: 'retrospective' });
  assert.equal(cleanup.event.payload.statusCategory, undefined);
  assert.ok(!('statusCategory' in cleanup.event.payload));

  const done = moveWork(dir, { id, to: 'done', expectedStatus: 'cleanup' });
  assert.equal(done.event.payload.statusCategory, undefined);
  assert.ok(!('statusCategory' in done.event.payload));
});

// Documented judgment call (this cell's own reasoning, replay.mjs's
// work.move case comment): the fold never CLEARS a stale statusCategory on
// a tail-segment move — it only ever adds/overwrites when the event itself
// carries one. This pins that choice: an item's category from its last
// front-segment move stays on the folded view even after it moves into the
// (category-less) tail chain, rather than disappearing or being
// recalculated. Nothing reads this field yet (tsk-38t-4's own scope), so
// this is inert today, not a live behavior a consumer depends on.
test('a stale statusCategory from the last front-segment move survives (uncleared) into the tail chain', () => {
  const dir = tmpDir();
  const id = 'stale-category';
  addSampleWork(dir, id);
  moveWork(dir, { id, to: 'doing', expectedStatus: 'todo' });
  const { view: afterDelivered } = moveWork(dir, { id, to: 'delivered', expectedStatus: 'doing' });
  // 'doing' mapped to 'in-progress' on the earlier move; delivered's own
  // move carried no statusCategory at all, so the fold left it untouched.
  assert.equal(afterDelivered.work[id].statusCategory, 'in-progress');
});

test('addWork stamps statusCategory for the initial status ("todo" -> "todo") on both the event payload and the folded item', () => {
  const dir = tmpDir();
  const { event, view } = addWork(dir, {
    id: 'add-stamped',
    title: 'Add stamped',
    kind: 'task',
    status: 'todo',
    deps: [],
    risk: 'light',
    refs: [],
    verify: 'npm test',
  });
  assert.equal(event.payload.statusCategory, 'todo');
  assert.equal(view.work['add-stamped'].statusCategory, 'todo');
});

// Replay-from-zero (docs/platform-foundations.md L3): an event written
// before this field existed carries no statusCategory at all — folding it
// must not throw, and must not retroactively compute one (that would be
// derive-on-read, which L3 forbids; see STATUS_CATEGORIES's own doc
// comment, work.mjs, and replay.mjs's work.move case comment).
test('foldEvents replays a pre-statusCategory work.add + work.move without throwing and without inventing a category', () => {
  const events = [
    {
      seq: 1,
      ts: '2026-07-14T00:00:00.000Z',
      type: 'work.add',
      payload: { id: 'legacy-a', title: 'Legacy A', status: 'todo', kind: 'task', deps: [], risk: 'light', refs: [], verify: 'npm test' },
    },
    {
      seq: 2,
      ts: '2026-07-14T00:00:01.000Z',
      type: 'work.move',
      payload: { id: 'legacy-a', from: 'todo', to: 'doing' },
    },
  ];
  const view = foldEvents(events);
  assert.equal(view.work['legacy-a'].status, 'doing');
  assert.equal(view.work['legacy-a'].statusCategory, undefined);
  assert.ok(!('statusCategory' in view.work['legacy-a']));
});
