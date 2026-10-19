import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ensureGitAddon, root } from '../helpers/git-addon.mjs';
import { loadNativeAddon } from '../../src/git/native.mjs';
import { prepareStore, openStore } from '../../src/event-store/index.mjs';
import { withStateTx } from '../../src/state/hot-lock.mjs';
import { createLockScope } from '../../src/holder-lock/lock-scope.mjs';

const built = ensureGitAddon();
const loaderOptions = { descriptor: { manifest: JSON.parse(fs.readFileSync(built.manifest)), releaseRoot: root } };
const addon = loadNativeAddon(loaderOptions);
function fixture(t) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-es-facade-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const repo = path.join(temp, 'repo');
  execFileSync('git', ['init', '-q', repo]);
  const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim();
  git('config', 'fgos.machineId', 'facade-machine');
  const stateRoot = path.join(temp, 'state'); fs.mkdirSync(stateRoot, { mode: 0o700 });
  fs.mkdirSync(path.join(repo, '.git/fgos/events/locks'), { recursive: true, mode: 0o700 });
  const hot = path.join(repo, '.fgos'); fs.mkdirSync(hot);
  fs.mkdirSync(path.join(repo, '.fgos/locks/activation.lock'), { recursive: true });
  fs.writeFileSync(path.join(repo, '.fgos/locks/activation.lock/TOMBSTONE'), JSON.stringify({ lock: 'activation', by: 'fgos git', at: 'fixture' }));
  const contracts = path.join(temp, 'contract.json');
  fs.writeFileSync(contracts, JSON.stringify({ v: 1, types: [{ type: 'example.created', domain: 'example', schemaVersion: 1, scope: 'project', sealOnWrite: false }] }));
  const resolved = addon.resolveEventStore(repo, stateRoot, repo);
  const store = openStore(resolved, resolved.machineId, [contracts], loaderOptions);
  return { temp, repo, git, hot, store, stateRoot };
}
const event = { eventType: 'example.created', schemaVersion: 1, payload: { n: 1 }, ts: '2026-10-19T00:00:00.000Z' };

test('real facade append, full read, seal, and published read retain the same envelope', { skip: process.platform !== 'linux' }, t => {
  const { store } = fixture(t);
  const result = store.append('project', [event], {}, 'fixture', []);
  assert.equal(result.ack.lastSeq, 1);
  const query = { streams: ['project'] };
  const before = store.read(query, []);
  assert.equal(before.events[0].h, result.events[0].h);
  assert.equal(store.seal('project', [50]).segments, 1);
  const after = store.read(query, []);
  assert.equal(after.events[0].h, result.events[0].h);
  assert.equal(store.unpublishedSummary('origin', [])[0].sealedPushed, false);
  assert.equal(store.status([]).v, 1);
  assert.equal(store.sealIfDue('project', 60, []).segments, 0);
  assert.equal(store.sealAll(['project'], [50])[0].segments, 0);
});

test('seal-like operations require held ranks and reject ranks 58 and 80 before native work', { skip: process.platform !== 'linux' }, t => {
  const { store } = fixture(t);
  for (const invoke of [r => store.seal('project', r), r => store.sealAll(['project'], r), r => store.sealIfDue('project', 60, r), r => store.sync({}, r), r => store.read({ streams: ['project'] }, r), r => store.status(r), r => store.unpublishedSummary('origin', r)]) {
    assert.throws(() => invoke(undefined), { code: 'event-store-held-ranks-required' });
    for (const rank of [58, 70, 80]) assert.throws(() => invoke([rank]), { code: 'lock-order-violation' });
  }
  const scope = createLockScope('sessions'); scope.track({ name: 'sessions', rank: 80 });
  assert.throws(() => store.seal('project', scope), { code: 'lock-order-violation' });
});

test('prefetched store survives a hot transaction while every Git route refuses by name', { skip: process.platform !== 'linux' }, t => {
  const { store, hot } = fixture(t);
  withStateTx(hot, tx => {
    assert.equal(tx.eventStore, store);
    const result = store.append('project', [event], {}, 'fixture', [60]);
    assert.equal(store.readInGate(result.ack.origin, 'project', 0).events.length, 1);
    for (const invoke of [() => store.seal('project', []), () => store.sealIfDue('project', 60, []), () => store.sealAll(['project'], []), () => store.read({ streams: ['project'] }, []), () => store.sync({}, [])]) {
      assert.throws(invoke, { code: 'event-store-seal-under-state' });
    }
  }, { prefetched: { writer: 'fixture', eventStore: store } });
});

test('preparation caches resolution, honors Git machine config, and rejects non-repositories', { skip: process.platform !== 'linux' }, t => {
  const { repo, stateRoot, temp } = fixture(t);
  const options = { stateRoot, loaderOptions };
  const first = prepareStore(repo, options);
  assert.equal(first.machineId, 'facade-machine');
  assert.equal(first.commonDir, path.join(repo, '.git'));
  assert.equal(prepareStore(repo, options), first);
  assert.throws(() => prepareStore(temp, options), { code: 'event-store-no-repository' });
});

test('empty stores read before the first append and linked worktrees share the prepared common directory', { skip: process.platform !== 'linux' }, t => {
  const { repo, store, git, temp, stateRoot } = fixture(t);
  assert.deepEqual(store.read({ streams: ['project'] }, []).events, []);
  assert.deepEqual(store.unpublishedSummary('origin', []), []);
  git('-c', 'user.name=fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--allow-empty', '-qm', 'fixture');
  const linked = path.join(temp, 'linked');
  git('worktree', 'add', '--detach', '-q', linked);
  const prepared = prepareStore(linked, { stateRoot, trustedMain: repo, loaderOptions });
  assert.equal(prepared.commonDir, path.join(repo, '.git'));
});

test('machine fallback and Git environment scrubbing use the real config-read port', { skip: process.platform !== 'linux' }, t => {
  const { repo, git, stateRoot } = fixture(t);
  git('config', '--unset', 'fgos.machineId');
  fs.writeFileSync(path.join(stateRoot, 'machine-id'), 'fallback-machine\n');
  const previous = process.env.GIT_DIR;
  process.env.GIT_DIR = '/missing/hostile/git';
  try {
    assert.equal(addon.resolveEventStore(repo, stateRoot, repo).machineId, 'fallback-machine');
  } finally {
    if (previous === undefined) delete process.env.GIT_DIR; else process.env.GIT_DIR = previous;
  }
});

test('sync marshals a real local bare-remote round trip through Publication authority', { skip: process.platform !== 'linux' }, t => {
  const { store, repo, temp, stateRoot, git } = fixture(t);
  const remote = path.join(temp, 'remote.git');
  execFileSync('git', ['init', '-q', '--bare', remote]);
  git('remote', 'add', 'origin', remote);
  addon.ensureGitFetchMapping(stateRoot, repo, repo, 'origin', ['+refs/fgos/events/*:refs/fgos/remotes/origin/events/*', '+refs/fgos/legacy:refs/fgos/remotes/origin/legacy'], 'facade-fetch-mapping');
  store.append('project', [event], {}, 'fixture', []);
  assert.deepEqual(store.sync({ remote: 'origin' }, []).warnings, []);
  assert.match(execFileSync('git', ['--git-dir', remote, 'rev-parse', 'refs/fgos/events/facade-machine'], { encoding: 'utf8' }).trim(), /^[a-f0-9]{40}$/);
});
