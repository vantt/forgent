import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fixture, append } from './phase07-fixture.mjs';
import { exportUseCase } from '../../src/verbs/events/export.mjs';
const canonical = value => `${JSON.stringify(Object.fromEntries(Object.keys(value).sort().map(k => [k, value[k]])))}\n`;
function pin(f, files) {
  f.git('commit', '--allow-empty', '-qm', 'before migration');
  const fromCommit = f.git('rev-parse', 'HEAD');
  const git = (args, input) => execFileSync('git', ['-C', f.repo, ...args], { input, encoding: 'utf8' }).trim();
  const hash = bytes => git(['hash-object', '-w', '--stdin'], bytes);
  const tree = entries => git(['mktree'], entries.map(e => `${e.mode ?? '100644'} ${e.type ?? 'blob'} ${e.oid ?? hash(e.bytes)}\t${e.name}\n`).join(''));
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
  for (const kind of ['symlink', 'gitlink', 'dotdot']) {
    const f = fixture(t);
    let files;
    if (kind === 'symlink') files = [{ name: 'events.jsonl', mode: '120000', bytes: '/tmp/unrelated' }];
    else if (kind === 'gitlink') {
      f.git('commit', '--allow-empty', '-qm', 'gitlink target');
      files = [{ name: 'events.jsonl', mode: '160000', type: 'commit', oid: f.git('rev-parse', 'HEAD') }];
    } else files = [{ name: '..', bytes: 'hostile' }];
    pin(f, files);
    const out = path.join(f.temp, 'refused');
    assert.throws(() => exportUseCase(f.ctx, { out, format: 'legacy-layout' }));
    assert.equal(fs.existsSync(out), false);
  }
});
