import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ensureGitAddon, root } from '../../scripts/git-addon.mjs';
import { loadNativeAddon } from '../../src/git/native.mjs';
import { prepareStore, openStore } from '../../src/event-store/index.mjs';
import { withStateTx } from '../../src/state/hot-lock.mjs';
import { pinLegacyHistory } from '../helpers/legacy-fence-fixture.mjs';
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
  return { temp, repo, git, hot, store, stateRoot, resolved, contracts };
}
const event = { eventType: 'example.created', schemaVersion: 1, payload: { n: 1 }, ts: '2026-10-19T00:00:00.000Z' };

test('real facade append, full read, seal, and published read retain the same envelope', { skip: process.platform !== 'linux' }, t => {
  const { store } = fixture(t);
  const result = store.append('project', [event], {}, 'fixture', []);
  assert.equal(result.ack.lastSeq, 1);
  const query = { streams: ['project'] };
  const before = store.read(query, []);
  assert.equal(before.events[0].h, result.events[0].h);
  const scope = createLockScope('main-checkout'); scope.track({ name: 'main-checkout', rank: 50 });
  assert.equal(store.seal('project', scope).segments, 1);
  const after = store.read(query, []);
  assert.equal(after.events[0].h, result.events[0].h);
  assert.equal(store.status([]).v, 1);
  assert.equal(store.sealIfDue('project', 60, []).segments, 0);
  assert.equal(store.sealAll(['project'], [50])[0].segments, 0);
});

test('seal-like operations require held ranks and reject ranks 58 and 80 before native work', { skip: process.platform !== 'linux' }, t => {
  const { store } = fixture(t);
  for (const invoke of [r => store.seal('project', r), r => store.sealAll(['project'], r), r => store.sealIfDue('project', 60, r), r => store.sync({}, r), r => store.read({ streams: ['project'] }, r), r => store.status(r)]) {
    assert.throws(() => invoke(undefined), { code: 'event-store-held-ranks-required' });
    for (const rank of [58, 70, 80]) assert.throws(() => invoke([rank]), { code: 'lock-order-violation' });
  }
  const scope = createLockScope('sessions'); scope.track({ name: 'sessions', rank: 80 });
  assert.throws(() => store.seal('project', scope), { code: 'lock-order-violation' });
});

test('prefetched store survives a hot transaction while every Git route refuses by name', { skip: process.platform !== 'linux' }, t => {
  const { store, hot } = fixture(t);
  store.admitWrites([]);
  withStateTx(hot, tx => {
    const result = store.append('project', [event], {}, 'fixture', [60]);
    assert.equal(store.readInGate(result.ack.origin, 'project', 0).events.length, 1);
    for (const invoke of [() => store.seal('project', []), () => store.sealIfDue('project', 60, []), () => store.sealAll(['project'], []), () => store.read({ streams: ['project'] }, []), () => store.sync({}, []), () => store.status([])]) {
      assert.throws(invoke, { code: 'event-store-seal-under-state' });
    }
  }, { prefetched: { writer: 'fixture' } });
});

test('preparation caches resolution, honors Git machine config, and rejects non-repositories', { skip: process.platform !== 'linux' }, t => {
  const { repo, stateRoot, temp } = fixture(t);
  const options = { stateRoot, trustedMain: repo, loaderOptions };
  const first = prepareStore(repo, options);
  assert.equal(first.machineId, 'facade-machine');
  assert.equal(first.commonDir, path.join(repo, '.git'));
  assert.equal(prepareStore(repo, options), first);
  assert.throws(() => prepareStore(temp, { ...options, trustedMain: temp }), { code: 'event-store-no-repository' });
});

test('empty stores read before the first append and linked worktrees share the prepared common directory', { skip: process.platform !== 'linux' }, t => {
  const { repo, store, git, temp, stateRoot } = fixture(t);
  assert.deepEqual(store.read({ streams: ['project'] }, []).events, []);
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
  const hostile = { GIT_DIR: '/missing/hostile/git', GIT_COMMON_DIR: '/missing/common', GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'fgos.machineId', GIT_CONFIG_VALUE_0: 'hostile-machine' };
  const previous = Object.fromEntries(Object.keys(hostile).map(key => [key, process.env[key]]));
  Object.assign(process.env, hostile);
  try {
    const resolved = addon.resolveEventStore(repo, stateRoot, repo);
    assert.equal(resolved.machineId, 'fallback-machine');
    assert.equal(resolved.commonDir, path.join(repo, '.git'));
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test('sync marshals a real local bare-remote round trip through Publication authority', { skip: process.platform !== 'linux' }, t => {
  const { store, repo, temp, stateRoot, git } = fixture(t);
  const remote = path.join(temp, 'remote.git');
  execFileSync('git', ['init', '-q', '--bare', remote]);
  git('remote', 'add', 'origin', remote);
  addon.ensureGitFetchMapping(stateRoot, repo, repo, 'origin', addon.gitFetchMappings('origin'), 'facade-fetch-mapping');
  store.append('project', [event], {}, 'fixture', []);
  assert.deepEqual(store.sync({ remote: 'origin' }, []).warnings, []);
  assert.match(execFileSync('git', ['--git-dir', remote, 'rev-parse', 'refs/fgos/events/facade-machine'], { encoding: 'utf8' }).trim(), /^[a-f0-9]{40}$/);
});


test('native prepared authority binds append identity and has no raw constructor', { skip: process.platform !== 'linux' }, t => {
  const { resolved, contracts } = fixture(t);
  assert.throws(() => new addon.EventStore('/tmp', []));
  assert.throws(() => openStore(resolved, 'other-machine', [contracts], loaderOptions), { code: 'event-store-machine-id' });
  assert.throws(() => openStore(resolved, resolved.machineId, [contracts], loaderOptions, '../bad'), /invalid-fetch-mapping-remote/);
  const native = addon.openStore(resolved, resolved.machineId, [contracts]);
  const facade = openStore(resolved, resolved.machineId, [contracts], loaderOptions);
  assert.throws(() => facade.append('project', '/x/fgos-event-store-foo', {}, 'fixture', []), error => {
    assert.equal(error.code, 'GenericFailure');
    return true;
  });
  assert.throws(() => native.append('project', [event], {}, 'fixture', 'other-machine', []));
  const result = native.append('project', [event], {}, 'fixture', []);
  assert.equal(result.ack.lastSeq, 1);
});

test('preparation requires trusted main and validates each loader descriptor before cache reuse', { skip: process.platform !== 'linux' }, t => {
  const { repo, stateRoot } = fixture(t);
  assert.throws(() => prepareStore(repo, { stateRoot, loaderOptions }), { code: 'event-store-trusted-main-required' });
  const first = prepareStore(repo, { stateRoot, trustedMain: repo, loaderOptions });
  const other = prepareStore(repo, { stateRoot, trustedMain: repo, loaderOptions: { ...loaderOptions, hostBin: null } });
  assert.notEqual(first, other);
  assert.throws(() => prepareStore(repo, { stateRoot, trustedMain: repo, loaderOptions: { descriptor: { manifest: {}, releaseRoot: root } } }), { code: 'git-addon-unavailable' });
  const nested = path.join(repo, 'nested'); fs.mkdirSync(nested);
  // Git resolves a subdirectory of the trusted main checkout to that same repository.
  assert.ok(prepareStore(nested, { stateRoot, trustedMain: repo, loaderOptions }));
});

test('hot-section release is one-shot and nested sections preserve the process guard', async () => {
  const { enterHotLock, hotLockDepth } = await import('../../src/holder-lock/hot-guard.mjs');
  const outer = enterHotLock();
  const inner = enterHotLock();
  try {
    inner(); inner();
    assert.equal(hotLockDepth(), 1);
    assert.throws(() => execFileSync(process.execPath, ['-e', '']), { code: 'exec-under-hot-lock' });
  } finally { inner(); outer(); outer(); }
  assert.equal(hotLockDepth(), 0);
});

test('ownOrigin is explicitly absent until the first local append', t => {
  const { store, hot } = fixture(t);
  assert.equal(store.ownOrigin, null);
  store.admitWrites([]);
  withStateTx(hot, () => store.append('project', [event], {}, 'fixture', [60]), { prefetched: { writer: 'fixture' } });
  assert.equal(typeof store.ownOrigin, 'string');
  assert.ok(store.ownOrigin.length > 0);
});

test('write admission is asked of Git outside the gate and never by a read; a gate write that skipped it is refused', t => {
  const { store, hot } = fixture(t);
  const inGate = () => withStateTx(hot, () => store.append('project', [event], {}, 'fixture', [60]), { prefetched: { writer: 'fixture' } });
  // A read never settles admission, so the gate (rank 60) still has to be told first.
  store.read({ streams: ['project'] }, []);
  assert.throws(inGate, { code: 'event-store-admission-required' });
  assert.equal(store.ownOrigin, null, 'a refused write left no trace');
  store.admitWrites([]);
  inGate();
  assert.equal(typeof store.ownOrigin, 'string');
  assert.throws(() => store.admitWrites([60]), { code: 'event-store-seal-under-state' });
  // Outside the gate the first write settles admission itself.
  const fresh = fixture(t);
  assert.equal(fresh.store.append('project', [event], {}, 'fixture', []).events.length, 1);
});

// No other test makes the first admission fail and then lets the failure clear.
test('a write refused by a transient Git failure is admitted once the failure clears', { skip: process.platform !== 'linux' }, t => {
  const { store, repo } = fixture(t);
  const refs = path.join(repo, '.git/refs');
  const original = fs.statSync(refs).mode & 0o7777;
  fs.chmodSync(refs, 0o000);
  try {
    assert.throws(() => store.append('project', [event], {}, 'fixture', []), 'unreadable refs refuse the first write');
  } finally { fs.chmodSync(refs, original); }
  assert.equal(store.append('project', [event], {}, 'fixture', []).events.length, 1, 'the refusal outlived the failure that caused it');
});

test('a repeat read is not sent the legacy history it already holds, and each read still gets its own events', { skip: process.platform !== 'linux' }, t => {
  const { store, repo } = fixture(t);
  const line = (seq) => JSON.stringify({ ts: '2026-01-01T00:00:00.000Z', seq, type: 'work.add', payload: { id: `item-${seq}`, title: 'legacy' }, v: 4 }) + '\n';
  fs.writeFileSync(path.join(repo, '.fgos/events.jsonl'), line(1) + line(2));
  pinLegacyHistory(repo);
  const sent = [];
  const original = addon.EventStore.prototype.read;
  addon.EventStore.prototype.read = function spiedRead(...args) {
    const response = original.apply(this, args);
    sent.push({ records: response.result.legacy.length, unchanged: response.result.legacyUnchanged });
    return response;
  };
  t.after(() => { addon.EventStore.prototype.read = original; });

  const first = store.read({ streams: ['project'] }, []);
  const second = store.read({ streams: ['project'], cursor: first.cursor, folded: first.sequence }, []);
  assert.deepEqual(sent, [{ records: 2, unchanged: false }, { records: 0, unchanged: true }]);
  assert.deepEqual(second.legacy, first.legacy, 'the caller sees the same legacy history');
  assert.notEqual(second.legacy[0].event, first.legacy[0].event, 'and gets events of its own');
  second.legacy[0].event.payload.title = 'changed by a caller';
  second.legacy[0].provenance.line = 99;
  const third = store.read({ streams: ['project'], cursor: second.cursor, folded: second.sequence }, []);
  assert.equal(third.legacy[0].event.payload.title, 'legacy', 'a caller that edits its copy never alters a later read');
  assert.equal(third.legacy[0].provenance.line, 1);
});
