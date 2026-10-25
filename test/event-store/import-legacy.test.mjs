import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { initializeWorkRepository } from '../helpers/work-store-release.mjs';
import { addWork, listWork } from '../../src/state/store.mjs';
import { prepareWorkStore, readWorkState } from '../../src/state/work-event-store.mjs';
import { importLegacyUseCase, planLegacyImport } from '../../src/verbs/events/import-legacy.mjs';

const add = (id, ts) => ({ ts, type: 'work.add', payload: { id, title: id, kind: 'feature', status: 'todo', deps: [], refs: [], risk: 'standard', verify: 'node -e 0', description: id } });

test('a legacy line already in history, a work.add of an existing item and a repeated add in the file are skipped by reason', () => {
  const inLegacy = { seq: 1, ts: '2026-10-20T00:00:00.000Z', type: 'decision', payload: { id: 'a', decision: 'x' }, h: 'aaaa' };
  const history = { events: [inLegacy], view: { work: { old: { id: 'old' } } } };
  const entries = [
    { ...inLegacy },
    add('old', '2026-10-21T00:00:00.000Z'),
    add('new', '2026-10-22T00:00:00.000Z'),
    add('new', '2026-10-22T00:00:01.000Z'),
    { ts: '2026-10-22T00:00:02.000Z', type: 'decision', payload: { id: 'new', decision: 'y' }, h: 'bbbb' },
  ].map((event, index) => ({ line: index + 1, event }));
  const { kept, skipped } = planLegacyImport(entries, history);
  assert.deepEqual(kept.map(entry => entry.line), [3, 5]);
  assert.deepEqual(skipped.map(({ line, reason }) => [line, reason]), [[1, 'already-in-history'], [2, 'item-exists'], [4, 'item-exists']]);
});

test('import-legacy replays an untracked shard through the Work door with its original times, once', t => {
  const fgosDir = initializeWorkRepository(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-import-legacy-')));
  const repo = path.dirname(fgosDir);
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
  addWork(fgosDir, add('kept', '').payload);
  const shard = path.join(fgosDir, 'runtime', 'tmp', 'untracked-events', 'writer-20261021.jsonl');
  fs.mkdirSync(path.dirname(shard), { recursive: true });
  fs.writeFileSync(shard, [
    add('stray', '2026-10-21T16:42:06.810Z'),
    { ts: '2026-10-21T16:43:00.000Z', type: 'work.move', payload: { id: 'stray', from: 'todo', to: 'doing' } },
    add('kept', '2026-10-21T16:44:00.000Z'),
  ].map(event => JSON.stringify({ seq: 1, v: 3, src: 'writer', ...event })).join('\n') + '\n');
  const ctx = { cwd: repo, trustedMain: repo };

  const check = importLegacyUseCase(ctx, { file: shard, check: true });
  assert.equal(check.imported, 2);
  assert.deepEqual(check.skipped.map(s => s.reason), ['item-exists']);
  assert.equal(Boolean(listWork(fgosDir).work.stray), false, '--check writes nothing');
  assert.equal(fs.existsSync(`${shard}.imported.json`), false);

  const done = importLegacyUseCase(ctx, { file: shard });
  assert.equal(done.imported, 2);
  assert.equal(listWork(fgosDir).work.stray?.status, 'doing');
  const { store } = prepareWorkStore(fgosDir, fgosDir);
  const replayed = readWorkState(store, { rebuild: true }).events.filter(event => event.payload?.id === 'stray');
  assert.deepEqual(replayed.map(event => [event.type, event.ts]), [['work.add', '2026-10-21T16:42:06.810Z'], ['work.move', '2026-10-21T16:43:00.000Z']]);
  assert.equal(JSON.parse(fs.readFileSync(`${shard}.imported.json`, 'utf8')).sha256, done.sha256);
  assert.throws(() => importLegacyUseCase(ctx, { file: shard }), /already imported/);
});
