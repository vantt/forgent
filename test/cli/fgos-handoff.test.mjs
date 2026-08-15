// test/cli/fgos-handoff.test.mjs — the CLI surface for the multi-role
// handoff verb (tsk-2t9c D1/D4/D5/D8). Named under test/cli per repo
// convention for a new bin/fgos.mjs subcommand's own coverage, though it
// also exercises store.mjs's recordCall end to end (add -> handoff ->
// replay -> holder) since the CLI is a thin wrapper over it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { addWork, moveWork, StoreError, recordCall, recordCallReturn, listWork } from '../../src/state/store.mjs';

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-handoff-cli-'));
}

// Born directly at stage 'executing' (same shape a split child gets from
// normalizeChild/addWork, src/intake/plan.mjs:845-871) — no FSM stage
// transition needed, since this is item creation, not a move.
function seedExecutingItem(dir, id = 'implement-thing') {
  addWork(dir, {
    id,
    title: 'Implement thing',
    kind: 'feature',
    status: 'todo',
    stage: 'executing',
    deps: [],
    risk: 'light',
    refs: [],
    verify: 'npm test',
  });
  moveWork(dir, { id, to: 'doing', expectedStatus: 'todo' });
  return id;
}

test('async call: review changes holder, appends a full handoff event', () => {
  const dir = tmpDir();
  const id = seedExecutingItem(dir);
  recordCall(dir, { id, toRole: 'reviewer', reason: 'review' });
  const view = listWork(dir);
  assert.equal(view.work[id].holder, 'reviewer');
  assert.equal(view.callThreads[id].length, 1);
  assert.equal(view.callThreads[id][0].kind, 'handoff');
});

test('sync call: consult does NOT change holder, appends a call-summary event', () => {
  const dir = tmpDir();
  const id = seedExecutingItem(dir);
  recordCall(dir, { id, toRole: 'researcher', reason: 'consult', outcome: 'finding: use lib X' });
  const view = listWork(dir);
  assert.equal(view.work[id].holder, undefined);
  assert.equal(view.callThreads[id].length, 1);
  assert.equal(view.callThreads[id][0].kind, 'call-summary');
  assert.equal(view.callThreads[id][0].outcome, 'finding: use lib X');
});

test('off-graph call is refused; the error names the legal edges', () => {
  const dir = tmpDir();
  const id = seedExecutingItem(dir);
  assert.throws(
    () => recordCall(dir, { id, toRole: 'reviewer', reason: 'review' + '-typo', note: undefined }),
    (err) => {
      assert.ok(err instanceof StoreError);
      assert.match(err.message, /handoff refused/);
      assert.match(err.message, /legal edges/);
      return true;
    },
  );
  // Nothing was written — refusal never appends.
  const view = listWork(dir);
  assert.equal(view.work[id].holder, undefined);
  assert.equal(view.callThreads, undefined);
});

test('round trip: async call out, then recordCallReturn sends the ball back to the sender', () => {
  const dir = tmpDir();
  const id = seedExecutingItem(dir);
  recordCall(dir, { id, toRole: 'reviewer', reason: 'review' });
  assert.equal(listWork(dir).work[id].holder, 'reviewer');
  recordCallReturn(dir, { id });
  const view = listWork(dir);
  assert.equal(view.work[id].holder, 'implementer');
  assert.equal(view.callThreads[id].length, 2);
  assert.equal(view.callThreads[id][1].returning, true);
});

test('recordCallReturn refuses when there is no open call to close', () => {
  const dir = tmpDir();
  const id = seedExecutingItem(dir);
  assert.throws(() => recordCallReturn(dir, { id }), StoreError);
});

test('nested async calls (depth 2, the deepest this domain\'s roleGraph legally reaches) fold correctly, and a return decrements depth rather than resetting it', () => {
  const dir = tmpDir();
  const id = seedExecutingItem(dir);
  recordCall(dir, { id, toRole: 'reviewer', reason: 'review' }); // depth 0 -> 1
  recordCall(dir, { id, toRole: 'human-advisor', reason: 'advise' }); // depth 1 -> 2
  assert.equal(listWork(dir).work[id].holder, 'human-advisor');
  recordCallReturn(dir, { id }); // depth 2 -> 1, back to reviewer (NOT reset to implementer)
  assert.equal(listWork(dir).work[id].holder, 'reviewer');
  recordCallReturn(dir, { id }); // depth 1 -> 0, back to implementer
  const view = listWork(dir);
  assert.equal(view.work[id].holder, 'implementer');
  assert.equal(view.callThreads[id].length, 4);
});

// The cap itself (openCallDepth reaching handoff.mjs's own callstackCap) is
// proven directly at the pure-guard level in test/state/handoff.test.mjs,
// where depth is injected rather than built through real edges — this
// domain's roleGraph today has no legal edge past depth 2 (human-advisor
// has no outgoing edges), so a depth-3 refusal cannot be exercised through
// recordCall alone without inventing an edge nothing else uses.

test('a domain with no roleGraph refuses cleanly, never crashes', () => {
  const dir = tmpDir();
  addWork(dir, {
    id: 'synthetic-item',
    title: 'Synthetic item',
    kind: 'task',
    status: 'todo',
    stage: 'assembling',
    deps: [],
    risk: 'light',
    refs: [],
    verify: 'true',
    domain: 'synthetic',
  });
  moveWork(dir, { id: 'synthetic-item', to: 'doing', expectedStatus: 'todo' });
  assert.throws(
    () => recordCall(dir, { id: 'synthetic-item', toRole: 'reviewer', reason: 'review' }),
    StoreError,
  );
});

test('backward compat: replaying an existing production-shaped log with zero handoff/call-summary events is unaffected', () => {
  // test/fixtures/phase1-events.jsonl carries no callThreads/holder at all --
  // rebuildView must fold it exactly as before this feature existed. Reuses
  // the same immutable fixture backward-compat.test.mjs already proves
  // replay-from-zero against for schema fields; here we assert the two NEW
  // event cases are simply never hit and produce no callThreads key at all.
  const fixture = path.join(process.cwd(), 'test', 'fixtures', 'phase1-events.jsonl');
  const dir = tmpDir();
  fs.copyFileSync(fixture, path.join(dir, 'events.jsonl'));
  const view = listWork(dir);
  assert.equal(view.callThreads, undefined);
  for (const item of Object.values(view.work)) {
    assert.equal(item.holder, undefined);
  }
});
