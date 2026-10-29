import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fixture, append, installFetchMapping } from './phase07-fixture.mjs';
import { statusUseCase } from '../../src/verbs/events/status.mjs';
import { syncUseCase } from '../../src/verbs/events/sync.mjs';
import { exportUseCase } from '../../src/verbs/events/export.mjs';
import { rebuildStoreUseCase } from '../../src/verbs/events/rebuild.mjs';
import { eventStoreConfig, readEventStoreConfig } from '../../src/event-store/index.mjs';
import { readStandardValue } from '../../src/config/facade.mjs';
import { writeProjectConfig, writeRawProjectConfig } from '../helpers/config-fixture.mjs';

test('status exposes real open counts, receipt, refs, deferred fields and linked/subdir discovery', t => {
  const f = fixture(t); append(f.store, [{}]);
  let got = statusUseCase(f.ctx);
  assert.equal(got.streams.find(s => s.stream === 'project').unsealedCount, 1);
  assert.equal(got.machineId, 'phase-seven'); assert.deepEqual(got.missing, []);
  assert.ok(got.guarantee); assert.equal(got.remoteUrl, null);
  f.store.seal('project', []);
  got = statusUseCase(f.ctx);
  assert.ok(got.refs['refs/fgos/events/phase-seven']);
  assert.equal(got.streams.find(s => s.stream === 'project').lastReceipt.lastSeq, 1);
  f.git('commit', '--allow-empty', '-qm', 'initial');
  const linked = path.join(f.temp, 'linked'); f.git('worktree', 'add', '-qb', 'linked', linked);
  fs.mkdirSync(path.join(linked, 'sub'));
  assert.equal(statusUseCase({ ...f.ctx, cwd: path.join(linked, 'sub') }).storeId, got.storeId);
});
test('status never prints the credentials of a remote URL: Git redacts userinfo and query before any verb sees it', t => {
  const f = fixture(t, { remote: true });
  f.git('remote', 'set-url', 'origin', 'https://user:ghp_secret@example.test/repo.git?token=querysecret');
  const got = statusUseCase(f.ctx);
  assert.equal(got.remoteUrl, 'https://[redacted]@example.test/repo.git?[redacted]');
  assert.doesNotMatch(JSON.stringify(got), /ghp_secret|querysecret/, 'neither the status fields nor the whole facts carry the credential');
});
test('sync waits, seals and records actual fetch/push; no-push preserves last push', t => {
  const f = fixture(t, { remote: true }); installFetchMapping(f); append(f.store, [{}]);
  const got = syncUseCase(f.ctx);
  assert.equal(got.status.aheadBehind.ahead, 0); assert.ok(got.status.lastPush.time); assert.ok(got.status.lastFetch.time);
  const second = syncUseCase(f.ctx, { noPush: true });
  assert.deepEqual(second.status.lastPush, got.status.lastPush);
});
test('JSONL export writes canonical reader order, cursors and refuses existing output', t => {
  const f = fixture(t); const written = append(f.store, [{}, {}]);
  const out = path.join(f.temp, 'export'); const result = exportUseCase(f.ctx, { out });
  const lines = fs.readFileSync(path.join(out, 'events.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  assert.deepEqual(lines.map(e => e.h), written.events.map(e => e.h));
  assert.throws(() => exportUseCase(f.ctx, { out }), /exists|Exist/);
  const next = path.join(f.temp, 'delta'); exportUseCase(f.ctx, { out: next, since: result.cursor });
  assert.equal(fs.readFileSync(path.join(next, 'events.jsonl'), 'utf8'), '');
});
test('an unset eventStore key takes the bundled standard value', () => {
  assert.deepEqual(eventStoreConfig({}), JSON.parse(JSON.stringify(readStandardValue('eventStore').value)));
});
test('config merges project over global and validates integer boundaries; the Work consumer rebuilds its cache', async t => {
  const f = fixture(t);
  fs.writeFileSync(f.ctx.globalConfigPath, JSON.stringify({ eventStore: { seal: { intervalSec: 10 }, sync: { intervalSec: 20 }, remote: 'backup' } }));
  writeProjectConfig(f.repo, { eventStore: { seal: { intervalSec: 30 }, remote: 'origin' } });
  assert.deepEqual(readEventStoreConfig(f.repo, f.ctx.globalConfigPath), { seal: { intervalSec: 30, coalesceSec: 30 }, sync: { intervalSec: 20 }, rebuild: { maxAttempts: 5 }, remote: 'origin' });
  writeRawProjectConfig(f.repo, '{ unrelated: half-written');
  // A file that exists but does not parse never lends its defaults to a publish decision: the write path and the
  // triggers get a config that does not push, the verbs and doctor get the error.
  assert.equal(readEventStoreConfig(f.repo, f.ctx.globalConfigPath).sync.intervalSec, 0);
  assert.throws(() => readEventStoreConfig(f.repo, f.ctx.globalConfigPath, { strict: true }), /event-store-config: config-parse/);
  writeProjectConfig(f.repo, { unrelated: { broken: true }, eventStore: { sync: { intervalSec: -1 } } });
  assert.throws(() => readEventStoreConfig(f.repo, f.ctx.globalConfigPath), /event-store-config/);
  writeProjectConfig(f.repo, {});
  for (const eventStore of [{ seal: { intervalSec: 0 } }, { seal: { coalesceSec: 0 } }, { seal: { coalesceSec: 1.5 } }, { seal: { coalesceSec: '30' } }, { sync: { intervalSec: -1 } }, { rebuild: { maxAttempts: 1.5 } }, { remote: '' }]) assert.throws(() => eventStoreConfig({ eventStore }), /event-store-config/);
  const { rebuilt } = await rebuildStoreUseCase(f.ctx);
  // A summary, never the view: the size of each collection, the view's revision, and what its cache covers.
  assert.deepEqual(rebuilt.map(({ consumer, counts }) => ({ consumer, counts })), [{ consumer: 'work', counts: { work: 0, decisions: 0 } }, { consumer: 'porting', counts: { porting: 0 } }, { consumer: 'identity', counts: { entries: 0, dropped: 0 } }]);
  for (const entry of rebuilt) {
    assert.deepEqual(Object.keys(entry).sort(), ['consumer', 'counts', 'cover', 'revision']);
    assert.match(entry.revision, /^[0-9a-f]{64}$/);
    // The identity cache is dropped, not rebuilt: it carries no cursor to cover.
    if (entry.consumer === 'identity') assert.equal(entry.cover, null);
    else assert.deepEqual(Object.keys(entry.cover).sort(), ['covered', 'deferred', 'streams']);
  }
  const cache = JSON.parse(fs.readFileSync(path.join(f.repo, '.fgos/cache/state.json')));
  assert.equal(rebuilt[0].revision, cache.revision, 'the reported revision is the one the consumer installed');
  assert.deepEqual(cache.work, {});
  assert.equal(typeof cache.revision, 'string');
  assert.equal('snapshot' in cache, false);
});

test('status identifies deferred predecessors explicitly and exports no deferred event', t => {
  const f = fixture(t);
  const origin = 'a'.repeat(32);
  f.store.append('project', [{ eventType: 'work.add', schemaVersion: 1, payload: { id: 'deferred' }, ts: new Date().toISOString() }], { [`${origin}:project`]: 1 }, 'fixture', []);
  const got = statusUseCase(f.ctx);
  assert.equal(got.deferred.length, 1);
  assert.deepEqual(got.missing, [{ origin, stream: 'project', seq: 1 }]);
  const out = path.join(f.temp, 'deferred'); exportUseCase(f.ctx, { out });
  assert.equal(fs.readFileSync(path.join(out, 'events.jsonl'), 'utf8'), '');
});

test('rebuild resolves shipped consumer contracts, preserves caches until consumers replace them and refolds from real events', async t => {
  const { root } = await import('../../scripts/git-addon.mjs');
  const { execFileSync } = await import('node:child_process');
  const { pathToFileURL } = await import('node:url');
  const f = fixture(t); append(f.store, [{}]);
  const payload = path.join(f.temp, 'payload');
  fs.cpSync(path.join(root, 'src'), path.join(payload, 'src'), { recursive: true });
  const contracts = path.join(payload, 'packages/event-store/contracts'); fs.mkdirSync(contracts, { recursive: true });
  fs.writeFileSync(path.join(contracts, 'example.json'), JSON.stringify({ v: 1, types: [{ type: 'work.add', domain: 'work', schemaVersion: 1, scope: 'project', sealOnWrite: false }] }));
  const entries = ['first', 'second'].map(id => ({ id, contractFile: 'packages/event-store/contracts/example.json', cachePath: `.fgos/cache/${id}.json`, rebuildModule: `src/example-${id}.mjs` }));
  // Contracts are unique in the manifest, even when a consumer has no types yet.
  entries[1].contractFile = 'packages/event-store/contracts/second.json';
  fs.writeFileSync(path.join(contracts, 'second.json'), JSON.stringify({ v: 1, types: [] }));
  fs.writeFileSync(path.join(contracts, 'consumers.v1.json'), JSON.stringify({ v: 1, consumers: entries }));
  fs.mkdirSync(path.join(f.repo, '.fgos/cache'));
  for (const entry of entries) {
    fs.writeFileSync(path.join(f.repo, entry.cachePath), 'stale');
    fs.writeFileSync(path.join(payload, entry.rebuildModule), `import fs from 'node:fs'; export function rebuildFromStore(ctx) { const cache=${JSON.stringify(path.join(f.repo, entry.cachePath))}; if (fs.readFileSync(cache,'utf8') !== 'stale') throw new Error('old cache lost'); const events=ctx.store.read({streams:['project']},ctx.heldRanks).sequence; fs.writeFileSync(cache,JSON.stringify(events)); return {events,maxAttempts:ctx.maxAttempts}; }`);
  }
  const url = pathToFileURL(path.join(payload, 'src/verbs/events/rebuild.mjs')).href;
  const result = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', `const {rebuildStoreUseCase}=await import(${JSON.stringify(url)}); console.log(JSON.stringify(await rebuildStoreUseCase(${JSON.stringify(f.ctx)})));`], { encoding: 'utf8' }));
  assert.deepEqual(result.rebuilt.map(e => [e.consumer, e.counts, e.cover]), [['first', { events: 1 }, null], ['second', { events: 1 }, null]], 'a cache without a cursor reports no cover');
  for (const entry of entries) assert.equal(JSON.parse(fs.readFileSync(path.join(f.repo, entry.cachePath)))[0].payload.id, 'one');
});

test('ahead and behind count only commits outside the opposite tip ancestry', t => {
  const f = fixture(t);
  append(f.store, [{}]); f.store.seal('project', []);
  const first = f.git('rev-parse', 'refs/fgos/events/phase-seven');
  append(f.store, [{ payload: { id: 'two' } }]); f.store.seal('project', []);
  const second = f.git('rev-parse', 'refs/fgos/events/phase-seven');
  f.git('update-ref', 'refs/fgos/remotes/origin/events/phase-seven', first);
  assert.deepEqual(statusUseCase(f.ctx).aheadBehind, { ahead: 1, behind: 0 });
  f.git('update-ref', 'refs/fgos/remotes/origin/events/phase-seven', second);
  f.git('update-ref', 'refs/fgos/events/phase-seven', first);
  assert.deepEqual(statusUseCase(f.ctx).aheadBehind, { ahead: 0, behind: 1 });
  f.git('update-ref', 'refs/fgos/events/phase-seven', second);
  assert.deepEqual(statusUseCase(f.ctx).aheadBehind, { ahead: 0, behind: 0 });
});

test('failed real Work rebuild preserves the previous cache', async t => {
  const f = fixture(t);
  await rebuildStoreUseCase(f.ctx);
  const cache = path.join(f.repo, '.fgos/cache/state.json');
  const before = fs.readFileSync(cache);
  // A malformed durable cache is not the failure source: refuse a real store
  // read by corrupting the acknowledged open log, then rebuild through CLI.
  append(f.store, [{}]);
  const active = path.join(f.repo, '.git/fgos/events/project/active.jsonl');
  fs.writeFileSync(active, fs.readFileSync(active, 'utf8').replace('one', 'tampered'));
  await assert.rejects(rebuildStoreUseCase(f.ctx));
  assert.deepEqual(fs.readFileSync(cache), before);
});
