import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { root } from '../helpers/git-addon.mjs';
import { fixture, addon, loaderOptions } from './phase07-fixture.mjs';
import { openStore } from '../../src/event-store/index.mjs';
import { migrationParity, migrateUseCase } from '../../src/verbs/events/migrate.mjs';
import { readAllEventsFromDir, foldEvents, buildSnapshotFromDir, serializeView } from '../../src/state/replay.mjs';
import { checkEventStore } from '../../src/setup/event-store-checks.mjs';
const ts = '2026-01-01T00:00:00.000Z';
import { trackedLegacy } from './phase08-fixture.mjs';
const snapshot = f => f.store.readLegacyFromHead({ check: true }, []);

test('HEAD inventory, check-only parity, anchored cache and explicit baseline use real tracked bytes', t => {
  const f = fixture(t); const files = trackedLegacy(f);
  const before = snapshot(f);
  assert.deepEqual(Object.keys(before.inventory.files).sort(), Object.keys(files).sort());
  assert.equal(before.inventory.portingLog, 'docs/distillery/state/porting/events.jsonl');
  const view = foldEvents(readAllEventsFromDir(path.join(f.repo, '.fgos')));
  const baseline = path.join(f.temp, 'baseline.json'); fs.writeFileSync(baseline, JSON.stringify({ ...view, revision: serializeView(view).revision }));
  const cache = path.join(f.temp, 'cache.json'); fs.writeFileSync(cache, JSON.stringify({ ...view, snapshot: buildSnapshotFromDir(path.join(f.repo, '.fgos')) }));
  const parity = migrationParity(before, { baseline, cache });
  assert.equal(parity.equal, true, JSON.stringify(parity)); assert.equal(parity.cacheCompared, true); assert.equal(parity.portingEntities, 1);
  assert.equal(f.git('for-each-ref', 'refs/fgos/legacy'), '');
  fs.writeFileSync(baseline, JSON.stringify({ ...view, work: { ...view.work, one: { title: 'wrong' } } }));
  assert.equal(migrationParity(before, { baseline }).equal, false);
  fs.writeFileSync(path.join(f.repo, '.fgos/events.jsonl'), 'dirty');
  assert.deepEqual(f.store.readLegacyFromHead({}, []).inventory.files, before.inventory.files);
  assert.throws(() => snapshot(f), /dirty or untracked/);
  fs.writeFileSync(path.join(f.repo, '.fgos/events.jsonl'), files['.fgos/events.jsonl']);
  fs.writeFileSync(path.join(f.repo, '.fgos/events/untracked.jsonl'), '{}\n');
  assert.throws(() => snapshot(f), /dirty or untracked/);
});

test('real import is deterministic, preserves nested bytes, rejects foreign legacy ref and does not cut over main', t => {
  const f = fixture(t); trackedLegacy(f); const before = snapshot(f);
  const pin = f.store.importLegacy({ expectedHead: before.inventory.fromCommit }, []);
  assert.deepEqual(f.store.importLegacy({ expectedHead: before.inventory.fromCommit }, []), pin);
  assert.equal(f.git('rev-parse', 'HEAD'), before.inventory.fromCommit);
  for (const [p, bytes] of Object.entries(before.inventory.files)) {
    const target = p.startsWith('.fgos/events/') || p === '.fgos/events.jsonl' ? p.slice(6) : p === before.inventory.portingLog ? `porting/${p}` : null;
    if (target) assert.equal(f.git('show', `${pin.legacyRefOid}:${target}`) + '\n', Buffer.from(bytes).toString());
  }
  assert.equal(f.git('rev-list', '--count', pin.legacyRefOid), '1');
  const read = f.store.read({ streams: ['project', 'project:porting'] }, []);
  assert.equal(read.legacy.length, 3);
  for (const record of read.legacy) assert.equal(JSON.stringify(record.event), JSON.stringify(JSON.parse(record.raw)));
  f.git('update-ref', 'refs/fgos/legacy', before.inventory.fromCommit);
  assert.throws(() => f.store.importLegacy({ expectedHead: before.inventory.fromCommit }, []), /existing legacy ref differs/);
});

test('baseline-only project, multiple porting refusal, migration write admission and missing pinned ref', t => {
  const f = fixture(t); trackedLegacy(f, { porting: false, shards: false });
  assert.equal(migrationParity(snapshot(f)).equal, true);
  const reopened = openStore(addon.resolveEventStore(f.repo, f.stateRoot, f.repo), 'phase-seven', [path.join(f.temp, 'contract.json')], loaderOptions);
  assert.throws(() => reopened.append('project', [{ eventType: 'work.add', schemaVersion: 1, payload: {}, ts }], {}, 'fixture', []), /event-store-migration-required.*fgos events migrate/);
  const dir = path.join(f.repo, 'other/porting'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'events.jsonl'), '');
  const dir2 = path.join(f.repo, 'another/porting'); fs.mkdirSync(dir2, { recursive: true }); fs.writeFileSync(path.join(dir2, 'events.jsonl'), '');
  f.git('add', 'other', 'another'); f.git('commit', '-qm', 'two porting roots');
  assert.throws(() => snapshot(f), /multiple porting/);
});

test('legacy-layout doctor fails on pre-migration inventory', t => {
  const f = fixture(t); trackedLegacy(f);
  const result = checkEventStore(f.repo, 'event-store-legacy-layout', f.ctx);
  assert.equal(result.passed, false); assert.match(result.message, /events|legacy/);
});

test('current checkout tracked Work history reproduces its legacy fold in a temporary repository', t => {
  const f = fixture(t);
  const source = (...args) => execFileSync('git', ['-C', root, ...args], { maxBuffer: 64 * 1024 * 1024 });
  const paths = source('ls-tree', '-r', '--name-only', '-z', 'HEAD', '--', '.fgos').toString().split('\0').filter(p => p === '.fgos/events.jsonl' || /^\.fgos\/events\/[^/]+\.jsonl$/.test(p));
  assert.ok(paths.length > 0);
  for (const p of paths) {
    fs.mkdirSync(path.dirname(path.join(f.repo, p)), { recursive: true });
    fs.writeFileSync(path.join(f.repo, p), source('show', `HEAD:${p}`));
  }
  f.git('add', ...paths); f.git('commit', '-qm', 'copy tracked Work history');
  const before = snapshot(f);
  const parity = migrationParity(before);
  assert.equal(parity.equal, true, JSON.stringify(parity.differences));
  const pin = f.store.importLegacy({ expectedHead: before.inventory.fromCommit }, []);
  const got = f.store.read({ streams: ['project'] }, []);
  assert.equal(migrationParity({ inventory: before.inventory, events: got.legacy }).equal, true);
  assert.equal(f.git('rev-parse', 'refs/fgos/legacy'), pin.legacyRefOid);
  t.diagnostic(`Copied ${paths.length} tracked event files; ${parity.workEvents} unique Work records`);
});
