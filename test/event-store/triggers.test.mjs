// Owning proof of the Event Store lifecycle triggers (spec §16, §14): what a trigger seals, when it publishes, and
// that it reads maintenance facts instead of the integrity status. The runner, session and gateway wiring are proven
// in their own files; the CLI wiring is the last two tests here.
import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { maintainEventStore } from '../../src/event-store/maintenance.mjs';
import { loadNativeAddon } from '../../src/git/native.mjs';
import { prepareWorkStore } from '../../src/state/work-event-store.mjs';
import { fixEventStoreRefspec } from '../../src/setup/event-store-fixes.mjs';
import { writeRawProjectConfig } from '../helpers/config-fixture.mjs';
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

test('a shared config that exists but does not parse still seals and never publishes', (t) => {
  const { repo, store } = workRepo(t, { remote: true });
  addAt(store, 3600);
  writeRawProjectConfig(repo, '{ eventStore: { sync: half-written');
  assert.equal(maintainEventStore(repo, { trustedMain: repo, end: true }).error, null);
  assert.equal(projectAge(store), 0, 'the due stream is still sealed');
  assert.equal(store.maintenance([]).lastPush, null, 'the defaults of a file that cannot be read never decide a publish');
});

/** Run the real CLI with a preload that logs each native call a lifecycle trigger or a Land release makes. */
function cliWithNativeSpy(t) {
  const { temp, repo, dir } = workRepo(t);
  const spy = path.join(temp, 'native-calls.log');
  const preload = path.join(temp, 'spy.mjs');
  const root = path.resolve(import.meta.dirname, '../..');
  fs.writeFileSync(preload, `
    import fs from 'node:fs';
    import { loadNativeAddon } from ${JSON.stringify(path.join(root, 'src/git/native.mjs'))};
    const addon = loadNativeAddon();
    const log = (name) => fs.appendFileSync(${JSON.stringify(spy)}, name + '\\n');
    for (const name of ['status', 'maintenance']) {
      const original = addon.EventStore.prototype[name];
      addon.EventStore.prototype[name] = function (...args) { log(name); return original.apply(this, args); };
    }
    const call = addon.GitRecovery.prototype.call;
    addon.GitRecovery.prototype.call = function (method, ...args) { if (method === 'listRetainedLand') log(method); return call.call(this, method, ...args); };
  `);
  // The Land verbs derive the repository from the cwd; the read verbs take the store directory.
  return (args, { dispatched = true, storeDir = true } = {}) => {
    fs.rmSync(spy, { force: true });
    const env = { ...process.env };
    if (dispatched) env.FGOS_DISPATCH_DEPTH = '1'; else delete env.FGOS_DISPATCH_DEPTH;
    // boundary: the start and end triggers are called from the CLI's verb dispatcher in bin/fgos.mjs, so only a real verb run proves them.
    const result = spawnSync(process.execPath, ['--import', preload, path.join(root, 'bin/fgos.mjs'), ...args, ...(storeDir ? ['--dir', dir] : [])], { cwd: repo, encoding: 'utf8', env });
    return { ...result, calls: fs.existsSync(spy) ? fs.readFileSync(spy, 'utf8').trim().split('\n') : [] };
  };
}

test('a CLI verb that opens the store runs both triggers on maintenance facts, and `events migrate` opens it through none', (t) => {
  const cli = cliWithNativeSpy(t);
  const list = cli(['list']);
  assert.equal(JSON.parse(list.stdout).contract, 'fgos.v1');
  assert.deepEqual(list.calls, ['maintenance', 'maintenance'], 'one fact read at the start and one at the end, no integrity status');
  const status = cli(['events', 'status']);
  assert.equal(status.status, 0, status.stderr);
  assert.equal(JSON.parse(status.stdout).data.remote, 'origin');
  assert.deepEqual(status.calls.filter((call) => call === 'maintenance'), ['maintenance', 'maintenance'], 'one trigger at each end of the verb');
  // Whatever migrate answers in a fixture with nothing to import, no trigger opened the store around it.
  assert.deepEqual(cli(['events', 'migrate', '--check']).calls, []);
  assert.match(cli(['events', 'nonsense']).stderr, /events requires sync\|status\|seal\|export\|migrate/);
});

test('only a Land verb in a non-dispatched session sweeps retained Land candidates, at the end of the command', (t) => {
  const cli = cliWithNativeSpy(t);
  const sweeps = (args, options) => cli(args, { ...options, storeDir: false }).calls.filter((call) => call === 'listRetainedLand').length;
  // A refusal still ends the command, so the sweep is proven without building a landable item.
  for (const args of [['approve', 'tsk-absent'], ['sync-root', 'tsk-absent'], ['promote-to-component', 'tsk-a,tsk-b'], ['merge', 'next']]) {
    assert.equal(sweeps(args, { dispatched: false }), 1, `${args[0]} sweeps once at its end`);
    assert.equal(sweeps(args, { dispatched: true }), 0, `${args[0]} in a dispatched worker never sweeps`);
  }
  assert.equal(sweeps(['list'], { dispatched: false }), 0, 'a verb that does not land never sweeps');
  assert.equal(sweeps(['merge', 'list'], { dispatched: false }), 0, '`merge list` does not land');
});
