import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fixture, addon, loaderOptions } from './phase07-fixture.mjs';
import { openStore } from '../../src/event-store/index.mjs';
import { readWorkState } from '../../src/state/work-event-store.mjs';
import { foldEvents } from '../../src/state/replay.mjs';

const contracts = [path.resolve('packages/work-state/contracts/event-streams.v1.json')];
test('two real stores with crossing moves replay the same winner and conflict', t => {
  const a = fixture(t), b = fixture(t);
  for (const f of [a, b]) {
    f.git('commit', '--allow-empty', '-qm', 'initial');
    f.store = openStore(addon.resolveEventStore(f.repo, f.stateRoot, f.repo), 'phase-seven', contracts, loaderOptions);
  }
  const add = a.store.append('project', [{ eventType: 'work.add', schemaVersion: 1, ts: '2026-10-20T00:00:00.000Z', payload: { id: 'one', status: 'todo', precondition: { exists: false } } }], {}, 'a', []);
  a.store.seal('project', []);
  b.git('fetch', a.repo, '+refs/fgos/events/*:refs/fgos/remotes/a/events/*');
  const seen = readWorkState(b.store).cursor.cover;
  for (const [f, to] of [[a, 'blocked'], [b, 'awaiting-human']]) {
    f.store.append('project', [{ eventType: 'work.move', schemaVersion: 1, ts: '2026-10-20T00:01:00.000Z', payload: { id: 'one', from: 'todo', to, precondition: { exists: true, expectedStatus: 'todo' } } }], seen, 'writer', []);
    f.store.seal('project', []);
  }
  a.git('fetch', b.repo, '+refs/fgos/events/*:refs/fgos/remotes/b/events/*');
  b.git('fetch', a.repo, '+refs/fgos/events/*:refs/fgos/remotes/a/events/*');
  const av = readWorkState(a.store).view, bv = readWorkState(b.store).view;
  assert.deepEqual(av, bv);
  assert.equal(av.conflicts.length, 1);
  assert.equal(av.conflicts[0].reason, 'expected-status');
  assert.notEqual(av.conflicts[0].against, add.events[0].h);
  assert.deepEqual(readWorkState(a.store).view.conflicts, av.conflicts);
});

test('causally observed false preconditions fail closed', () => {
  const events = [
    { type: 'work.add', h: 'add', origin: 'a', stream: 'project', seq: 1, payload: { id: 'one', status: 'todo', precondition: { exists: false } } },
    { type: 'work.move', h: 'move', origin: 'b', stream: 'project', seq: 1, seen: { 'a:project': 1 }, payload: { id: 'one', to: 'doing', precondition: { expectedStatus: 'blocked' } } },
  ];
  assert.throws(() => foldEvents(events), { code: 'work-replay-precondition' });
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
