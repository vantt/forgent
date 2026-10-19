import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fixture, append } from './phase07-fixture.mjs';
import { readAllEventsFromDir, foldEvents } from '../../src/state/replay.mjs';
import { listPorting } from '../../src/state/porting-store.mjs';
import { exportUseCase } from '../../src/verbs/events/export.mjs';
const canonical = value => `${JSON.stringify(Object.fromEntries(Object.keys(value).sort().map(k => [k, value[k]])))}\n`;
function pin(f, files) {
  f.git('commit', '--allow-empty', '-qm', 'before migration');
  const fromCommit = f.git('rev-parse', 'HEAD');
  const git = (args, input) => execFileSync('git', ['-C', f.repo, ...args], { input, encoding: 'utf8' }).trim();
  const hash = bytes => git(['hash-object', '-w', '--stdin'], bytes);
  const flatTree = entries => git(['mktree'], entries.map(e => `${e.mode ?? '100644'} ${e.type ?? 'blob'} ${e.oid ?? hash(e.bytes)}\t${e.name}\n`).join(''));
  const tree = entries => {
    const direct = [], directories = new Map();
    for (const entry of entries) {
      const slash = entry.name.indexOf('/');
      if (slash < 0) direct.push(entry);
      else {
        const dir = entry.name.slice(0, slash);
        if (!directories.has(dir)) directories.set(dir, []);
        directories.get(dir).push({ ...entry, name: entry.name.slice(slash + 1) });
      }
    }
    for (const [name, children] of directories) direct.push({ name, mode: '040000', type: 'tree', oid: tree(children) });
    return flatTree(direct);
  };
  const seal = { kind: 'legacy', fromCommit, treeOfFgosEvents: 'a'.repeat(40) };
  const bytes = canonical(seal);
  const oid = git(['commit-tree', tree([...files.map(e => ({ ...e })), { name: 'seal.json', bytes }])], 'legacy\n');
  f.git('update-ref', 'refs/fgos/legacy', oid);
  fs.writeFileSync(path.join(f.repo, '.fgos/events'), JSON.stringify({ legacyRefOid: oid, fromCommit, sealDigest: createHash('sha256').update(bytes).digest('hex') }));
  f.git('add', '.fgos/events'); f.git('commit', '-qm', 'fence');
  return { oid, tree, hash };
}
test('rollback preserves pinned bytes, drops markers and reports causal versus legacy order differences', t => {
  const f = fixture(t);
  const historical = '{"seq":1,"ts":"2020-01-01T00:00:00.000Z","type":"work.add","payload":{"id":"one","title":"historical"}}\r\n';
  pin(f, [{ name: 'events.jsonl', bytes: historical }]);
  append(f.store, [
    { type: 'work.edit', ts: '2026-10-19T01:00:00.000Z', payload: { id: 'one', patch: { title: 'first causal' } } },
    { type: 'work.edit', ts: '2026-10-19T00:00:00.000Z', payload: { id: 'one', patch: { title: 'second causal' } } },
  ]);
  const out = path.join(f.temp, 'rollback'); const got = exportUseCase(f.ctx, { format: 'legacy-layout', out });
  assert.equal(fs.readFileSync(path.join(out, 'events.jsonl'), 'utf8'), historical);
  const exported = fs.readFileSync(path.join(out, 'events/v4-project.jsonl'), 'utf8');
  assert.equal(exported.includes('batch-commit'), false);
  assert.equal(JSON.parse(exported.split('\n')[0]).h, undefined);
  assert.equal(got.parity.equal, false);
  assert.ok(got.parity.differences.some(d => d.collection === 'work' && d.id === 'one'));
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(out, 'parity-report.json'))), got.parity);
  assert.throws(() => exportUseCase(f.ctx, { format: 'legacy-layout', out }), /Exist|exists/);
});
test('rollback without clock inversion has parity and rejects an output symlink', t => {
  const f = fixture(t); append(f.store, [{}]);
  const out = path.join(f.temp, 'ok');
  assert.equal(exportUseCase(f.ctx, { out, format: 'legacy-layout' }).parity.equal, true);
  fs.symlinkSync(out, path.join(f.temp, 'symlink'));
  assert.throws(() => exportUseCase(f.ctx, { out: path.join(f.temp, 'symlink'), format: 'legacy-layout' }), /Exist|exists/);
});
test('rollback rejects symlink and gitlink tree entries before creating output', t => {
  for (const kind of ['symlink', 'gitlink', 'dotdot', 'unrelated-tree']) {
    const f = fixture(t);
    let files;
    if (kind === 'symlink') files = [{ name: 'events.jsonl', mode: '120000', bytes: '/tmp/unrelated' }];
    else if (kind === 'gitlink') {
      f.git('commit', '--allow-empty', '-qm', 'gitlink target');
      files = [{ name: 'events.jsonl', mode: '160000', type: 'commit', oid: f.git('rev-parse', 'HEAD') }];
    } else if (kind === 'unrelated-tree') files = [{ name: 'unrelated/events.jsonl', bytes: 'hostile' }];
    else files = [{ name: '..', bytes: 'hostile' }];
    pin(f, files);
    const out = path.join(f.temp, 'refused');
    assert.throws(() => exportUseCase(f.ctx, { out, format: 'legacy-layout' }));
    assert.equal(fs.existsSync(out), false);
  }
});

test('real legacy subtrees export with exact production Work and porting reader parity', t => {
  const f = fixture(t);
  const event = (type, payload, seq = 1) => JSON.stringify({ seq, ts: '2020-01-01T00:00:00.000Z', type, payload }) + '\n';
  const historical = event('porting.add', { id: 'p', title: 'historical', status: 'candidate' });
  pin(f, [
    { name: 'events/a.jsonl', bytes: event('work.add', { id: 'one', title: 'A' }) },
    { name: 'events/b.jsonl', bytes: event('work.edit', { id: 'one', patch: { title: 'B' } }) },
    { name: 'porting/events.jsonl', bytes: historical },
    { name: 'porting/workspace/events.jsonl', bytes: event('porting.add', { id: 'nested' }) },
  ]);
  append(f.store, [{ type: 'work.edit', payload: { id: 'one', patch: { title: 'C' } } }]);
  f.store.append('project:porting', [{ eventType: 'porting.move', schemaVersion: 1, payload: { id: 'p', to: 'accepted' }, ts: '2026-10-19T01:00:00.000Z' }], {}, 'fixture', []);
  const out = path.join(f.temp, 'subtrees');
  const result = exportUseCase(f.ctx, { out, format: 'legacy-layout' });
  assert.equal(result.parity.equal, true, JSON.stringify(result.parity));
  const raw = f.store.exportLegacyLayout({ streams: ['project', 'project:porting'], out: path.join(f.temp, 'raw-orders') }, []);
  assert.deepEqual(raw.legacyOrder, readAllEventsFromDir(out));
  assert.equal(fs.readFileSync(path.join(out, 'events/a.jsonl'), 'utf8'), event('work.add', { id: 'one', title: 'A' }));
  assert.equal(foldEvents(readAllEventsFromDir(out)).work.one.title, 'C');
  assert.equal(readAllEventsFromDir(out).some(e => e.type.startsWith('porting.')), false);
  assert.equal(listPorting(out).porting.p.status, 'accepted');
  assert.equal(fs.readFileSync(path.join(out, 'porting/events.jsonl'), 'utf8').startsWith(historical), true);
  assert.equal(fs.existsSync(path.join(out, 'events/v4-project-porting.jsonl')), false);
  assert.ok(fs.existsSync(path.join(out, 'porting/workspace/events.jsonl')));
});
test('legacy export excludes private streams by default and rejects explicit private streams', t => {
  const f = fixture(t);
  for (const [scope, stream] of [['local', 'local'], ['branch', 'branch:private']]) {
    f.store.append(stream, [{ eventType: `private.${scope}`, schemaVersion: 1, payload: { secret: scope }, ts: '2026-10-19T01:00:00.000Z' }], {}, 'fixture', []);
  }
  const out = path.join(f.temp, 'public');
  exportUseCase(f.ctx, { out, format: 'legacy-layout' });
  assert.equal(fs.readdirSync(out).some(name => /local|private/.test(name)), false);
  assert.equal(JSON.stringify(fs.readdirSync(out)).includes('events'), false);
  for (const stream of ['local', 'branch:private']) {
    const refused = path.join(f.temp, stream.replace(':', '-'));
    assert.throws(() => exportUseCase(f.ctx, { out: refused, format: 'legacy-layout', stream }), /only project streams/);
    assert.equal(fs.existsSync(refused), false);
  }
});

test('porting parity reports a historical log-order difference using its own reducer', t => {
  const f = fixture(t);
  const lines = [
    { seq: 1, ts: '2020-01-02T00:00:00.000Z', type: 'porting.add', payload: { id: 'p', status: 'candidate' } },
    { seq: 2, ts: '2020-01-01T00:00:00.000Z', type: 'porting.move', payload: { id: 'p', to: 'accepted' } },
  ].map(e => JSON.stringify(e) + '\n').join('');
  pin(f, [{ name: 'porting/events.jsonl', bytes: lines }]);
  const out = path.join(f.temp, 'porting-difference');
  const result = exportUseCase(f.ctx, { out, format: 'legacy-layout' });
  assert.equal(listPorting(out).porting.p.status, 'accepted');
  assert.equal(result.parity.equal, false);
  assert.ok(result.parity.differences.some(d => d.collection === 'porting' && d.id === 'p' && d.v4.status === 'candidate'));
});
