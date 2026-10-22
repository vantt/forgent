// Owning proof of the Event Store lifecycle triggers (spec §16, §14): what a trigger seals, when it publishes, and
// that it reads maintenance facts instead of the integrity status. The runner, session and gateway wiring are proven
// in their own files; the CLI wiring is the last test here.
import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { maintainEventStore } from '../../src/event-store/maintenance.mjs';
import { loadNativeAddon } from '../../src/git/native.mjs';
import { prepareWorkStore } from '../../src/state/work-event-store.mjs';
import { fixEventStoreRefspec } from '../../src/setup/event-store-fixes.mjs';
import { initializeWorkRepository } from '../helpers/work-store-release.mjs';

function workRepo(t, { remote = false } = {}) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-triggers-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const repo = path.join(temp, 'repo');
  const dir = initializeWorkRepository(repo);
  if (remote) {
    execFileSync('git', ['init', '--bare', '-q', path.join(temp, 'remote')]);
    execFileSync('git', ['-C', repo, 'remote', 'add', 'origin', path.join(temp, 'remote')]);
    fixEventStoreRefspec(repo);
  }
  return { temp, repo, dir, store: prepareWorkStore(dir, dir).store };
}
const addAt = (store, ageSec) => store.append('project', [{
  eventType: 'work.add', schemaVersion: 1, payload: { id: `item-${ageSec}` }, ts: new Date(Date.now() - ageSec * 1000).toISOString(),
}], {}, 'fixture', []);
/** Count the calls the native store receives while `fn` runs; the facade is frozen, so the native class is wrapped. */
function countNativeCalls(names, fn) {
  const proto = loadNativeAddon().EventStore.prototype;
  const counts = Object.fromEntries(names.map((name) => [name, 0]));
  const originals = names.map((name) => [name, proto[name]]);
  for (const [name, original] of originals) proto[name] = function (...args) { counts[name] += 1; return original.apply(this, args); };
  try { fn(); } finally { for (const [name, original] of originals) proto[name] = original; }
  return counts;
}
const projectAge = (store) => store.maintenance([]).streams.find((row) => row.stream === 'project').oldestUnsealedAgeSec;

test('a trigger seals only streams older than the seal interval and everything on shutdown', (t) => {
  const { repo, store } = workRepo(t);
  addAt(store, 60);
  assert.deepEqual(maintainEventStore(repo, { trustedMain: repo }), { error: null });
  assert.ok(projectAge(store) >= 59, 'an event younger than the interval stays open');
  assert.deepEqual(maintainEventStore(repo, { trustedMain: repo, shutdown: true }), { error: null });
  assert.equal(projectAge(store), 0, 'shutdown seals every open stream');
  addAt(store, 3600);
  maintainEventStore(repo, { trustedMain: repo });
  assert.equal(projectAge(store), 0, 'an event older than the interval is sealed by the next trigger');
});

test('every trigger mode reads maintenance facts and never the integrity status', (t) => {
  const { repo, store } = workRepo(t, { remote: true });
  addAt(store, 3600);
  const calls = countNativeCalls(['status', 'maintenance'], () => {
    for (const policy of [{}, { shutdown: true }, { end: true }]) maintainEventStore(repo, { trustedMain: repo, ...policy });
  });
  assert.deepEqual(calls, { status: 0, maintenance: 3 });
});

test('the end trigger publishes from an owner session once per interval and never from a dispatched worker', (t) => {
  const { repo, store } = workRepo(t, { remote: true });
  addAt(store, 3600);
  assert.equal(maintainEventStore(repo, { trustedMain: repo }).error, null);
  assert.equal(store.maintenance([]).lastPush, null, 'a start trigger never publishes');
  maintainEventStore(repo, { trustedMain: repo, end: true, dispatched: true });
  assert.equal(store.maintenance([]).lastPush, null, 'a dispatched worker never publishes');
  assert.equal(maintainEventStore(repo, { trustedMain: repo, end: true }).error, null);
  const first = store.maintenance([]).lastPush;
  assert.equal(first.error, null);
  assert.equal(first.remote, 'origin');
  maintainEventStore(repo, { trustedMain: repo, end: true });
  assert.deepEqual(store.maintenance([]).lastPush, first, 'a push inside the interval is not repeated');
});

test('a store that cannot be opened is reported as a code, never thrown at the command that triggered it', (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-triggers-none-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const { error } = maintainEventStore(temp, { trustedMain: temp, end: true });
  assert.equal(typeof error, 'string');
});

test('a CLI verb that opens the store runs both triggers on maintenance facts and makes no status call', (t) => {
  const { temp, repo, dir } = workRepo(t);
  const spy = path.join(temp, 'native-calls.log');
  const preload = path.join(temp, 'spy.mjs');
  const root = path.resolve(import.meta.dirname, '../..');
  fs.writeFileSync(preload, `
    import fs from 'node:fs';
    import { loadNativeAddon } from ${JSON.stringify(path.join(root, 'src/git/native.mjs'))};
    const proto = loadNativeAddon().EventStore.prototype;
    for (const name of ['status', 'maintenance']) {
      const original = proto[name];
      proto[name] = function (...args) { fs.appendFileSync(${JSON.stringify(spy)}, name + '\\n'); return original.apply(this, args); };
    }
  `);
  const out = execFileSync(process.execPath, ['--import', preload, path.join(root, 'bin/fgos.mjs'), 'list', '--dir', dir], {
    cwd: repo, encoding: 'utf8', env: { ...process.env, FGOS_DISPATCH_DEPTH: '1' },
  });
  assert.equal(JSON.parse(out).contract, 'fgos.v1');
  const calls = fs.readFileSync(spy, 'utf8').trim().split('\n');
  assert.deepEqual(calls, ['maintenance', 'maintenance'], 'one fact read at the start and one at the end, nothing else');
});
