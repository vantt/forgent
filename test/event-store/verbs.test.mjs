import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fixture, append } from './phase07-fixture.mjs';
import { statusUseCase } from '../../src/verbs/events/status.mjs';
import { syncUseCase } from '../../src/verbs/events/sync.mjs';
import { exportUseCase } from '../../src/verbs/events/export.mjs';
import { rebuildStoreUseCase } from '../../src/verbs/events/rebuild.mjs';
import { eventStoreConfig, readEventStoreConfig } from '../../src/event-store/index.mjs';
import { fixEventStoreRefspec } from '../../src/setup/event-store-fixes.mjs';

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
test('sync waits, seals and records actual fetch/push; no-push preserves last push', t => {
  const f = fixture(t, { remote: true }); fixEventStoreRefspec(f.repo, f.ctx); append(f.store, [{}]);
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
  assert.throws(() => exportUseCase(f.ctx, { out: path.join(f.temp, 'bad'), format: 'other' }), /format/);
});
test('config merges project over global and validates integer boundaries; dormant rebuild has no consumers', async t => {
  const f = fixture(t);
  fs.writeFileSync(f.ctx.globalConfigPath, JSON.stringify({ eventStore: { seal: { intervalSec: 10 }, sync: { intervalSec: 20 }, remote: 'backup' } }));
  fs.writeFileSync(path.join(f.repo, '.fgos/config.json'), JSON.stringify({ eventStore: { seal: { intervalSec: 30 }, remote: 'origin' } }));
  assert.deepEqual(readEventStoreConfig(f.repo, f.ctx.globalConfigPath), { seal: { intervalSec: 30 }, sync: { intervalSec: 20 }, rebuild: { maxAttempts: 5 }, remote: 'origin' });
  for (const eventStore of [{ seal: { intervalSec: 0 } }, { sync: { intervalSec: -1 } }, { rebuild: { maxAttempts: 1.5 } }, { remote: '../bad' }]) assert.throws(() => eventStoreConfig({ eventStore }), /event-store-config/);
  assert.deepEqual(await rebuildStoreUseCase(f.ctx), { rebuilt: [] });
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

test('rebuild resolves shipped consumer contracts, removes both caches and refolds from real events', async t => {
  const { root } = await import('../helpers/git-addon.mjs');
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
    fs.writeFileSync(path.join(payload, entry.rebuildModule), `import fs from 'node:fs'; export function rebuildFromStore(ctx) { const cache=${JSON.stringify(path.join(f.repo, entry.cachePath))}; if (fs.existsSync(cache)) throw new Error('cache not removed'); const events=ctx.store.read({streams:['project']},ctx.heldRanks).sequence; fs.writeFileSync(cache,JSON.stringify(events)); return {count:events.length,maxAttempts:ctx.maxAttempts}; }`);
  }
  const url = pathToFileURL(path.join(payload, 'src/verbs/events/rebuild.mjs')).href;
  const result = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', `const {rebuildStoreUseCase}=await import(${JSON.stringify(url)}); console.log(JSON.stringify(await rebuildStoreUseCase(${JSON.stringify(f.ctx)})));`], { encoding: 'utf8' }));
  assert.deepEqual(result.rebuilt.map(e => e.result), [{ count: 1, maxAttempts: 5 }, { count: 1, maxAttempts: 5 }]);
  for (const entry of entries) assert.equal(JSON.parse(fs.readFileSync(path.join(f.repo, entry.cachePath)))[0].payload.id, 'one');
});
