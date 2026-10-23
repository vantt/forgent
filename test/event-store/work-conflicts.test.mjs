import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fixture, addon, loaderOptions } from './phase07-fixture.mjs';
import { openStore } from '../../src/event-store/index.mjs';
import { readWorkState } from '../../src/state/work-event-store.mjs';
import { foldEvents, appliedEvents, conflictsFor, viewRevision, VIEW_SCHEMA_VERSION } from '../../src/state/replay.mjs';

const contracts = [path.resolve('packages/work-state/contracts/event-streams.v1.json')];
// Independent clones of one repository, each with its own machine id and event store.
function cloneMachines(t, count) {
  const first = fixture(t, { machine: false });
  first.git('commit', '--allow-empty', '-qm', 'shared project');
  const machines = [first];
  for (let i = 1; i < count; i += 1) {
    const f = fixture(t, { machine: false });
    fs.rmSync(f.repo, { recursive: true, force: true });
    execFileSync('git', ['clone', '-q', first.repo, f.repo]);
    fs.mkdirSync(f.locks, { recursive: true, mode: 0o700 });
    const fence = path.join(f.repo, '.fgos/locks/activation.lock');
    fs.mkdirSync(fence, { recursive: true });
    fs.writeFileSync(path.join(fence, 'TOMBSTONE'), JSON.stringify({ lock: 'activation', by: 'fgos git', at: 'fixture' }));
    machines.push(f);
  }
  for (const [i, f] of machines.entries()) {
    const machine = `proof-machine-${i}`;
    f.git('config', 'fgos.machineId', machine);
    f.store = openStore(addon.resolveEventStore(f.repo, f.stateRoot, f.repo), machine, contracts, loaderOptions);
  }
  return machines;
}
const pull = (to, from, name) => to.git('fetch', from.repo, `+refs/fgos/events/*:refs/fgos/remotes/${name}/events/*`);
const move = (f, id, from, to, ts, expectedStatus, seen) => f.store.append('project', [{ eventType: 'work.move', schemaVersion: 1, ts,
  payload: { id, from, to, precondition: { exists: true, expectedStatus } } }], seen, 'writer', []);

test('three independent machine stores with crossing moves replay the same winner and recorded conflict', t => {
  const [a, b, c] = cloneMachines(t, 3);
  const add = a.store.append('project', [{ eventType: 'work.add', schemaVersion: 1, ts: '2026-10-20T00:00:00.000Z', payload: { id: 'one', status: 'todo', precondition: { exists: false } } }], {}, 'a', []);
  a.store.seal('project', []);
  pull(b, a, 'a');
  const seen = readWorkState(b.store).cursor.cover;
  for (const [f, to] of [[a, 'blocked'], [b, 'awaiting-human']]) {
    move(f, 'one', 'todo', to, '2026-10-20T00:01:00.000Z', 'todo', seen);
    f.store.seal('project', []);
  }
  pull(a, b, 'b'); pull(b, a, 'a'); pull(c, a, 'a'); pull(c, b, 'b');
  const av = readWorkState(a.store).view, bv = readWorkState(b.store).view;
  assert.deepEqual(av, readWorkState(c.store).view);
  assert.deepEqual(av, bv);
  assert.equal(av.conflicts.length, 1);
  assert.equal(av.conflicts[0].reason, 'expected-status');
  assert.notEqual(av.conflicts[0].against, add.events[0].h);
  assert.deepEqual(readWorkState(a.store).view.conflicts, av.conflicts);
});

// A and S disagree about item X while G, offline, changes it twice. A writes after it synced S, so its
// precondition holds in A's view; once G's events arrive they sort first, flip which of E and S applies,
// and A's precondition fails against an event A had seen. Every clone must still fold, to the same view.
test('a cascade across three machines records the late failure as a conflict and every clone folds the same view', t => {
  const [a, s, g] = cloneMachines(t, 3);
  const ts = n => `2026-10-20T00:00:0${n}.000Z`;
  const added = a.store.append('project', [{ eventType: 'work.add', schemaVersion: 1, ts: ts(0), payload: { id: 'x', status: 'todo', precondition: { exists: false } } }], {}, 'a', []);
  a.store.seal('project', []);
  pull(s, a, 'a'); pull(g, a, 'a');
  const seenAdd = readWorkState(s.store).cursor.cover;
  move(g, 'x', 'todo', 'blocked', ts(1), 'todo', seenAdd);
  move(g, 'x', 'blocked', 'todo', '2026-10-20T00:00:02.500Z', 'blocked', seenAdd);
  move(a, 'x', 'todo', 'doing', ts(2), 'todo', seenAdd);
  move(s, 'x', 'todo', 'parked', ts(3), 'todo', seenAdd);
  for (const f of [a, s, g]) f.store.seal('project', []);
  pull(a, s, 's');
  const seenBoth = readWorkState(a.store).cursor.cover;
  assert.equal(readWorkState(a.store).view.work.x.status, 'doing', 'A alone sees E applied and S in conflict');
  move(a, 'x', 'doing', 'done', ts(4), 'doing', seenBoth);
  a.store.seal('project', []);
  // Three different arrival orders.
  pull(g, s, 's'); pull(g, a, 'a');
  pull(s, g, 'g'); pull(s, a, 'a');
  // A cache A wrote before G's history was fetched must not be served once it has been.
  const beforeG = readWorkState(a.store);
  const cachePath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'es-cache-')), 'state.json');
  fs.writeFileSync(cachePath, JSON.stringify({ ...beforeG.view, revision: viewRevision(beforeG.view), viewSchemaVersion: VIEW_SCHEMA_VERSION, cursor: beforeG.cursor }));
  assert.deepEqual(readWorkState(a.store, { cachePath }).view, beforeG.view, 'the cache is served while the history it covers is unchanged');
  pull(a, g, 'g');
  const fromCache = readWorkState(a.store, { cachePath }).view;
  assert.deepEqual(fromCache, readWorkState(a.store).view, 'a fetched foreign ref invalidates the cache');
  assert.equal(fromCache.work.x.status, 'parked');
  const views = [a, s, g].map(f => readWorkState(f.store).view);
  assert.deepEqual(views[1], views[0]);
  assert.deepEqual(views[2], views[0]);
  assert.equal(views[0].work.x.status, 'parked');
  assert.deepEqual(views[0].conflicts.map(c => [c.origin, c.reason]), [[added.events[0].origin, 'expected-status'], [added.events[0].origin, 'expected-status']]);
  assert.equal(new Set(views[0].conflicts.map(c => c.h)).size, 2, 'E and A\'s own later move are the two recorded conflicts');
});

test('a failed precondition in a history of one clone is a local bug that stops the fold', () => {
  const events = [
    { type: 'work.add', h: 'add', origin: 'a', stream: 'project', seq: 1, payload: { id: 'one', status: 'todo', precondition: { exists: false } } },
    { type: 'work.move', h: 'move', origin: 'a', stream: 'project', seq: 2, seen: {}, payload: { id: 'one', to: 'doing', precondition: { expectedStatus: 'blocked' } } },
  ];
  assert.throws(() => foldEvents(events), { code: 'work-replay-precondition' });
});

// Another clone's event is in the history in both cases below; what separates them is whether the writer had seen it.
const addOne = { type: 'work.add', h: 'add', origin: 'a', stream: 'project', seq: 1, payload: { id: 'one', status: 'todo', precondition: { exists: false } } };
const failingMove = seen => ({ type: 'work.move', h: 'move', origin: 'b', stream: 'project', seq: 1, seen, payload: { id: 'one', to: 'doing', precondition: { expectedStatus: 'blocked' } } });

test('a failed precondition whose writer had seen every earlier event stops the fold, even when other clones are in the history', () => {
  assert.throws(() => foldEvents([addOne, failingMove({ 'a:project': 1 })]), { code: 'work-replay-precondition' });
});

test('a failed precondition after an event its writer had not seen is recorded, never thrown', () => {
  const view = foldEvents([addOne, failingMove({})]);
  assert.deepEqual(view.conflicts, [{ h: 'move', id: 'one', origin: 'b', reason: 'expected-status', against: 'add' }]);
  assert.equal(view.work.one.status, 'todo');
});

test('a conflicted event is not among the applied events, so no retry or release treats it as a durable record', () => {
  const delivery = { type: 'work.move', h: 'delivery', origin: 'a', stream: 'project', seq: 2, seen: {}, payload: { id: 'one', to: 'delivered', landSettlement: { repoIdentity: 'r', operationId: 'op', settlementKind: 'delivered' }, precondition: { expectedStatus: 'awaiting-approval' } } };
  const parked = { type: 'work.move', h: 'parked', origin: 'b', stream: 'project', seq: 1, seen: { 'a:project': 1 }, payload: { id: 'one', to: 'parked', precondition: { expectedStatus: 'todo' } } };
  const events = [addOne, parked, delivery];
  const view = foldEvents(events);
  assert.deepEqual(view.conflicts.map(conflict => conflict.h), ['delivery']);
  assert.deepEqual(appliedEvents(events, view).map(event => event.h), ['add', 'parked']);
  assert.deepEqual(conflictsFor(view, 'one').map(conflict => conflict.h), ['delivery']);
  assert.deepEqual(conflictsFor(view, 'other'), []);
});

test('a write-time precondition never appears in a folded outcome, discovery or park resolution', () => {
  const precondition = { exists: true };
  const view = foldEvents([
    { type: 'work.add', payload: { id: 'one', status: 'todo' } },
    { type: 'work.outcome', ts: 't', payload: { id: 'one', actual: { ok: true }, precondition } },
    { type: 'work.discovery', ts: 't', payload: { id: 'one', clear: true, precondition } },
    { type: 'work.resolve-park-reason', ts: 't', payload: { id: 'one', note: 'done', precondition } },
  ]);
  assert.equal(JSON.stringify(view).includes('precondition'), false);
  assert.equal(view.outcomes.one.actual.ok, true);
});

for (const kind of ['existence', 'capacity']) test(`real foreign ${kind} precondition conflicts converge`, t => {
  const a = fixture(t), b = fixture(t);
  for (const f of [a, b]) {
    f.git('commit', '--allow-empty', '-qm', 'initial');
    f.store = openStore(addon.resolveEventStore(f.repo, f.stateRoot, f.repo), 'phase-seven', contracts, loaderOptions);
  }
  let seen = {};
  if (kind === 'capacity') {
    a.store.append('project', ['one', 'two'].map(id => ({ eventType: 'work.add', schemaVersion: 1, ts: '2026-10-20T00:00:00.000Z', payload: { id, status: 'todo', precondition: { exists: false } } })), {}, 'a', []);
    a.store.seal('project', []);
    b.git('fetch', a.repo, '+refs/fgos/events/*:refs/fgos/remotes/a/events/*');
    seen = readWorkState(b.store).cursor.cover;
  }
  for (const [f, id] of [[a, 'one'], [b, kind === 'capacity' ? 'two' : 'one']]) {
    const payload = kind === 'existence'
      ? { id, status: 'todo', precondition: { exists: false } }
      : { id, from: 'todo', to: 'doing', precondition: { exists: true, expectedStatus: 'todo', capacity: { status: 'doing', max: 1 } } };
    f.store.append('project', [{ eventType: kind === 'existence' ? 'work.add' : 'work.move', schemaVersion: 1, ts: '2026-10-20T00:01:00.000Z', payload }], seen, 'writer', []);
    f.store.seal('project', []);
  }
  a.git('fetch', b.repo, '+refs/fgos/events/*:refs/fgos/remotes/b/events/*');
  b.git('fetch', a.repo, '+refs/fgos/events/*:refs/fgos/remotes/a/events/*');
  const av = readWorkState(a.store).view;
  assert.deepEqual(av, readWorkState(b.store).view);
  assert.equal(av.conflicts.length, 1);
  assert.equal(av.conflicts[0].reason, kind);
});
