import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fixture, addon, loaderOptions } from './phase07-fixture.mjs';
import { openStore, eventStoreConfig } from '../../src/event-store/index.mjs';
import { withWorkState, readWorkState } from '../../src/state/work-event-store.mjs';
import { hotLockDepth } from '../../src/state/hot-lock.mjs';
import { readRawEvents, currentEffectiveView } from '../../src/state/store.mjs';
import { releaseClaimTx, readClaim, readClaims } from '../../src/state/runtime-coordination.mjs';
import { viewRevision, VIEW_SCHEMA_VERSION } from '../../src/state/replay.mjs';

const contract = path.resolve('packages/work-state/contracts/event-streams.v1.json');
const config = eventStoreConfig({ eventStore: { seal: { intervalSec: 86400 }, rebuild: { maxAttempts: 3 } } });
function workFixture(t) {
  const f = fixture(t);
  f.hot = path.join(f.repo, '.fgos');
  f.cache = path.join(f.hot, 'cache/state.json');
  f.store = openStore(addon.resolveEventStore(f.repo, f.stateRoot, f.repo), 'phase-seven', [contract], loaderOptions);
  f.run = (fn, options = {}) => withWorkState(f.hot, f.hot, 'work-test', fn, { store: f.store, config, ...options });
  f.append = (type, payload) => f.store.append('project', [{ eventType: type, schemaVersion: 1, payload, ts: new Date().toISOString() }], {}, 'outside', []);
  return f;
}
function cache(f) { return JSON.parse(fs.readFileSync(f.cache, 'utf8')); }

test('one real batch acknowledges staged events before file effects, then writes the cursor cache', t => {
  const f = workFixture(t);
  const first = path.join(f.hot, 'runtime/first.json');
  const moved = path.join(f.hot, 'runtime/moved.json');
  let txRef;
  const events = f.run(tx => {
    txRef = tx;
    assert.equal(hotLockDepth(), 1);
    const added = tx.append({ type: 'work.add', payload: { id: 'one', title: 'one' } });
    tx.writeJson(first, { phase: 1 });
    tx.rename(first, moved);
    tx.writeJson(first, { phase: 2 });
    tx.unlink(moved);
    const edited = tx.append({ type: 'work.edit', payload: { id: 'one', patch: { title: 'two' } } });
    assert.equal(added.seq, undefined);
    assert.equal(edited.h, undefined);
    assert.equal(fs.existsSync(first), false);
    assert.equal(fs.existsSync(moved), false);
    assert.equal(fs.existsSync(f.cache), false);
    return [added, edited];
  });
  assert.deepEqual(events.map(e => e.seq), [1, 2]);
  assert.ok(events.every(e => e.origin === events[0].origin && /^[a-f0-9]{64}$/.test(e.h)));
  assert.deepEqual(JSON.parse(fs.readFileSync(first)), { phase: 2 });
  assert.equal(fs.existsSync(moved), false);
  const saved = cache(f);
  assert.equal(saved.work.one.title, 'two');
  assert.equal(saved.cursor.cover[`${events[0].origin}:project`], 2);
  assert.equal(saved.viewSchemaVersion, VIEW_SCHEMA_VERSION);
  assert.equal('snapshot' in saved, false);
  const { revision, viewSchemaVersion, cursor, ...view } = saved;
  assert.equal(revision, viewRevision(view));
  assert.throws(() => txRef.append({ type: 'work.add' }), { code: 'state-tx-revoked' });
  const open = path.join(f.repo, '.git/fgos/events/project/active.jsonl');
  const lines = fs.readFileSync(open, 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(lines.filter(line => line.kind === 'batch-commit').length, 1);
  assert.equal(lines.at(-1).count, 2);
});

test('a real stale-cursor refusal leaves staged claim unlink, writes, rename and cache untouched', t => {
  const f = workFixture(t);
  f.run(tx => tx.append({ type: 'work.add', payload: { id: 'one', title: 'one' } }));
  const oldCache = fs.readFileSync(f.cache, 'utf8');
  const claimPath = path.join(f.hot, 'runtime/claims/one.json');
  fs.mkdirSync(path.dirname(claimPath), { recursive: true });
  fs.writeFileSync(claimPath, JSON.stringify({ id: 'one', claimId: 'claim-one' }));
  const effect = path.join(f.hot, 'runtime/effect');
  const existing = path.join(f.hot, 'runtime/existing');
  fs.writeFileSync(existing, 'original');
  assert.throws(() => f.run(tx => {
    tx.writeText(effect, 'should never appear');
    tx.rename(existing, existing + '-moved');
    releaseClaimTx(tx, { id: 'one', claimId: 'claim-one' });
    tx.append({ type: 'work.edit', payload: { id: 'one', patch: { title: 'refused' } } });
    // A writer bypassing the Work gate makes this transaction's cursor stale.
    // The actual native append refuses it; the store is never mocked.
    f.append('work.attempt', { id: 'other' });
  }), { code: 'stale-cursor' });
  assert.equal(fs.existsSync(claimPath), true);
  assert.equal(fs.existsSync(effect), false);
  assert.equal(fs.readFileSync(existing, 'utf8'), 'original');
  assert.equal(fs.existsSync(existing + '-moved'), false);
  assert.equal(fs.readFileSync(f.cache, 'utf8'), oldCache);
  assert.equal(readWorkState(f.store).view.work.one.title, 'one');
});

test('unregistered batch and callback errors apply no effects; async callbacks cannot commit', t => {
  const f = workFixture(t);
  const effect = path.join(f.hot, 'runtime/effect');
  assert.throws(() => f.run(tx => {
    tx.writeText(effect, 'bad');
    tx.append({ type: 'missing.type', payload: {} });
  }), { code: 'event-store-unregistered-type' });
  assert.throws(() => f.run(tx => { tx.writeText(effect, 'bad'); throw new Error('precondition'); }), /precondition/);
  assert.throws(() => f.run(async tx => { tx.writeText(effect, 'bad'); }), { code: 'state-tx-async' });
  assert.equal(fs.existsSync(effect), false);
  assert.equal(fs.existsSync(f.cache), false);
  assert.deepEqual(readWorkState(f.store).events, []);
});

test('in-gate tail is folded before preconditions and all full Work readers refuse under the mutex', t => {
  const f = workFixture(t);
  let first = true;
  f.run(tx => {
    assert.equal(tx.view.work.outside.title, 'outside');
    assert.throws(() => readRawEvents(f.hot), /inside state gate/);
    assert.throws(() => currentEffectiveView(f.hot), /inside state gate/);
    assert.throws(() => readWorkState(f.store), { code: 'event-store-full-read-under-state' });
    tx.append({ type: 'work.edit', payload: { id: 'outside', patch: { title: 'inside' } } });
  }, { beforeGate() { if (first) { first = false; f.append('work.add', { id: 'outside', title: 'outside' }); } } });
  assert.equal(cache(f).work.outside.title, 'inside');
});

test('catch-up-required exits the gate before the full reader retries', t => {
  const f = workFixture(t);
  let preparations = 0;
  let callbacks = 0;
  f.run(tx => {
    callbacks += 1;
    assert.equal(tx.view.work.outside.title, 'sealed');
    tx.append({ type: 'work.edit', payload: { id: 'outside', patch: { title: 'after' } } });
  }, { beforeGate() {
    assert.equal(hotLockDepth(), 0);
    if (++preparations === 1) { f.append('work.add', { id: 'outside', title: 'sealed' }); f.store.seal('project', []); }
  } });
  assert.equal(preparations, 2);
  assert.equal(callbacks, 1);
  assert.equal(cache(f).work.outside.title, 'after');
});

test('rebuild installs only a current own-stream candidate and stops at maxAttempts keeping the old cache', t => {
  const f = workFixture(t);
  f.run(tx => tx.append({ type: 'work.add', payload: { id: 'one', title: 'one' } }));
  const oldCache = fs.readFileSync(f.cache, 'utf8');
  let attempts = 0;
  assert.throws(() => f.run(() => assert.fail('stale rebuild must not install'), {
    rebuild: true,
    beforeGate() { attempts += 1; f.append('work.attempt', { id: 'one', result: 'racing' }); },
  }), { code: 'event-store-rebuild-busy' });
  assert.equal(attempts, config.rebuild.maxAttempts);
  assert.equal(fs.readFileSync(f.cache, 'utf8'), oldCache);
  f.run(() => {}, { rebuild: true });
  assert.equal(Object.values(cache(f).cursor.cover)[0], 1 + attempts);
});

test('sequence recovery conflict leaves the gate, attempts a real seal and preserves staged effects on corruption', t => {
  const f = workFixture(t);
  f.run(tx => tx.append({ type: 'work.add', payload: { id: 'one', title: 'one' } }));
  const oldCache = fs.readFileSync(f.cache, 'utf8');
  const hwm = path.join(f.repo, '.git/fgos/events/project/hwm.json');
  fs.writeFileSync(hwm, JSON.stringify({ lastSeq: 1000 }));
  const effect = path.join(f.hot, 'runtime/effect');
  assert.throws(() => f.run(tx => {
    tx.writeText(effect, 'bad');
    tx.append({ type: 'work.edit', payload: { id: 'one', patch: { title: 'bad' } } });
  }), { code: 'event-store-seq-recovery-conflict' });
  assert.equal(fs.existsSync(effect), false);
  assert.equal(fs.readFileSync(f.cache, 'utf8'), oldCache);
  assert.equal(hotLockDepth(), 0);
});

test('a lost receipt is recovered by sealing outside the gate before retrying the staged batch', t => {
  const f = workFixture(t);
  f.run(tx => tx.append({ type: 'work.add', payload: { id: 'one', title: 'one' } }));
  f.store.seal('project', []);
  let preparations = 0;
  let callbacks = 0;
  const effect = path.join(f.hot, 'runtime/effect');
  const event = f.run(tx => {
    callbacks += 1;
    assert.equal(fs.existsSync(effect), false);
    tx.writeText(effect, 'acknowledged');
    return tx.append({ type: 'work.edit', payload: { id: 'one', patch: { title: 'recovered' } } });
  }, { beforeGate() {
    if (++preparations === 1) fs.unlinkSync(path.join(f.repo, '.git/fgos/events/project/sealed.json'));
  } });
  assert.equal(preparations, 2);
  assert.equal(callbacks, 2);
  assert.equal(event.seq, 2);
  assert.equal(fs.readFileSync(effect, 'utf8'), 'acknowledged');
  assert.equal(cache(f).work.one.title, 'recovered');
});

test('missing, corrupt, old-schema and old-snapshot caches are replaced by a verified store fold', t => {
  const f = workFixture(t);
  const event = f.run(tx => tx.append({ type: 'work.add', payload: { id: 'one', title: 'source' } }));
  const valid = cache(f);
  for (const damaged of [
    '{broken',
    JSON.stringify({ ...valid, viewSchemaVersion: -1 }),
    JSON.stringify({ ...valid, snapshot: { files: {} } }),
    JSON.stringify({ ...valid, work: { one: { title: 'forged' } } }),
    JSON.stringify({ ...valid, cursor: {} }),
  ]) {
    fs.writeFileSync(f.cache, damaged);
    f.run(tx => assert.equal(tx.view.work.one.title, 'source'));
    assert.equal(cache(f).work.one.title, 'source');
    assert.equal(cache(f).cursor.cover[`${event.origin}:project`], 1);
    assert.equal(cache(f).revision, valid.revision);
    assert.equal('snapshot' in cache(f), false);
  }
  fs.unlinkSync(f.cache);
  f.run(tx => assert.equal(tx.view.work.one.title, 'source'));
  assert.equal(cache(f).revision, valid.revision);
});

test('lifecycle events seal after release with the native opportunistic route', t => {
  const f = workFixture(t);
  const event = f.run(tx => tx.append({ type: 'decision', payload: { text: 'seal this decision' } }));
  assert.equal(hotLockDepth(), 0);
  const receipt = JSON.parse(fs.readFileSync(path.join(f.repo, '.git/fgos/events/project/sealed.json')));
  assert.equal(receipt.lastSeq, event.seq);
  assert.equal(f.store.read({ streams: ['project'] }, []).events[0].h, event.h);
});

test('two real processes sharing a gate fold both acknowledged batches into the cache', async t => {
  const f = workFixture(t);
  const moduleUrl = new URL('../../src/state/work-event-store.mjs', import.meta.url).href;
  const storeUrl = new URL('../../src/event-store/index.mjs', import.meta.url).href;
  const nativeUrl = new URL('../../src/git/native.mjs', import.meta.url).href;
  const source = `
    import fs from 'node:fs';
    import { withWorkState } from ${JSON.stringify(moduleUrl)};
    import { openStore } from ${JSON.stringify(storeUrl)};
    import { loadNativeAddon } from ${JSON.stringify(nativeUrl)};
    const [id, repo, stateRoot, hot, contract, loader, settings] = process.argv.slice(1);
    const options = JSON.parse(loader);
    const addon = loadNativeAddon(options);
    const store = openStore(addon.resolveEventStore(repo, stateRoot, repo), 'phase-seven', [contract], options);
    const event = withWorkState(hot, hot, id, tx => {
      if (tx.view.work[id]) throw new Error('already exists');
      return tx.append({type:'work.add',payload:{id,title:id}});
    }, {store, config:JSON.parse(settings), beforeGate() {
      fs.writeFileSync(hot + '/' + id + '.ready', 'ready');
      const until = Date.now() + 10000;
      while (!fs.existsSync(hot + '/one.ready') || !fs.existsSync(hot + '/two.ready')) {
        if (Date.now() > until) throw new Error('barrier timeout');
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5);
      }
    }});
    console.log(JSON.stringify(event));
  `;
  function child(id) {
    return new Promise((resolve, reject) => {
      const p = spawn(process.execPath, ['--input-type=module', '-e', source, id, f.repo, f.stateRoot, f.hot, contract, JSON.stringify(loaderOptions), JSON.stringify(config)]);
      let stdout = '', stderr = '';
      p.stdout.on('data', b => { stdout += b; }); p.stderr.on('data', b => { stderr += b; });
      p.on('error', reject);
      p.on('exit', code => code === 0 ? resolve(JSON.parse(stdout)) : reject(new Error(stderr)));
    });
  }
  const events = await Promise.all([child('one'), child('two')]);
  assert.deepEqual(events.map(e => e.seq).sort(), [1, 2]);
  assert.deepEqual(Object.keys(cache(f).work).sort(), ['one', 'two']);
  assert.equal(Object.values(cache(f).cursor.cover)[0], 2);
  assert.equal(readWorkState(f.store).events.length, 2);
});

test('staged file reads observe unlink, write and rename before acknowledgement', t => {
  const f = workFixture(t);
  const first = path.join(f.hot, 'runtime/first.json');
  const moved = path.join(f.hot, 'runtime/moved.json');
  fs.mkdirSync(path.dirname(first), { recursive: true });
  fs.writeFileSync(first, '{"old":true}');
  f.run(tx => {
    assert.throws(() => readClaim(f.hot, 'claim'), { category: 'state-tx-read-required' });
    assert.throws(() => readClaims(f.hot), { category: 'state-tx-read-required' });
    assert.equal(tx.unlink(first), true);
    assert.equal(tx.exists(first), false);
    assert.equal(tx.readJson(first), null);
    assert.throws(() => tx.readText(first), { code: 'ENOENT' });
    assert.deepEqual(tx.list(path.dirname(first)), []);
    tx.writeJson(first, { next: true });
    assert.deepEqual(tx.readJson(first), { next: true });
    tx.rename(first, moved);
    assert.equal(tx.exists(first), false);
    assert.deepEqual(tx.readJson(moved), { next: true });
    assert.deepEqual(tx.list(path.dirname(first)), ['moved.json']);
    assert.deepEqual(JSON.parse(fs.readFileSync(first)), { old: true });
    assert.equal(fs.existsSync(moved), false);
    tx.append({ type: 'work.add', payload: { id: 'visible', title: 'visible' } });
  });
  assert.equal(fs.existsSync(first), false);
  assert.deepEqual(JSON.parse(fs.readFileSync(moved)), { next: true });
});
