import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fixture } from './land-fixture.mjs';
import { createGitSafeRestore } from '../../src/git/index.mjs';
import { acquireSync, createLockScope } from '../../src/holder-lock/index.mjs';
for (const linked of [false, true]) test(`SafeRestore preserves binary, staged/unstaged, untracked, symlink and mode state under ${linked ? 'producer custody' : 'main 50'}`, () => {
  const f = fixture(); let lease;
  try {
    const repo = linked ? path.join(f.temp, 'producer') : f.repo;
    if (linked) {
      f.git('worktree', 'add', '-qb', 'producer', repo);
      lease = acquireSync(createLockScope(), 'dispatch-cwd', { fgosDir: path.join(f.repo, '.fgos'), cwd: repo });
      assert.equal(lease.result, 'acquired');
    }
    const git = (...args) => execFileSync('git', ['-C', repo, ...args]);
    const port = createGitSafeRestore({ ...f.options, repoPath: repo }, f.loader);
    const held = linked ? [lease.handle] : [];
    const request = { expectedHead: f.request.target, target: f.request.source, reason: 'carry local producer delta', reapplyLocalDelta: true };
    fs.writeFileSync(path.join(repo, 'b'), Buffer.from([0, 1, 255])); git('add', 'b');
    fs.writeFileSync(path.join(repo, 'b'), Buffer.from([0, 2, 254])); fs.chmodSync(path.join(repo, 'b'), 0o751);
    fs.writeFileSync(path.join(repo, 'untracked'), Buffer.from([0, 250])); fs.symlinkSync('b', path.join(repo, 'link'));
    const indexPath = git('rev-parse', '--absolute-git-dir').toString().trim();
    const index = fs.readFileSync(path.join(indexPath, 'index'));
    const preview = port.preview({ request }, held); assert.equal(preview.head, request.expectedHead);
    assert.deepEqual(fs.readFileSync(path.join(indexPath, 'index')), index);
    if (linked) assert.throws(() => port.apply({ request, operationId: 'missing-custody' }), /custody/);
    const out = port.apply({ request, operationId: 'restore' }, held);
    assert.equal(out.outcome.state, 'restored');
    assert.deepEqual(git('show', ':b'), Buffer.from([0, 1, 255]));
    assert.deepEqual(fs.readFileSync(path.join(repo, 'b')), Buffer.from([0, 2, 254]));
    assert.equal(fs.statSync(path.join(repo, 'b')).mode & 0o777, 0o751);
    assert.deepEqual(fs.readFileSync(path.join(repo, 'untracked')), Buffer.from([0, 250]));
    assert.equal(fs.readlinkSync(path.join(repo, 'link')), 'b');
    assert.equal(fs.readFileSync(path.join(repo, 'a'), 'utf8'), 'incoming\n');
    assert.deepEqual(port.recover({ operationId: 'restore' }, held), out);
    assert.deepEqual(port.apply({ request, operationId: 'restore' }, held), out);
    assert.throws(() => port.apply({ request: { ...request, reason: 'different' }, operationId: 'restore' }, held), /operation-id-conflict/);
  } finally { lease?.handle.release(); f.close(); }
});
test('SafeRestore refuses stale HEAD, backward ancestry, native residue and unsafe config without changing bytes', () => {
  const f = fixture();
  try {
    const port = createGitSafeRestore(f.options, f.loader);
    const request = { expectedHead: f.request.target, target: f.request.source, reason: 'restore' };
    assert.throws(() => port.preview({ request: { ...request, expectedHead: f.request.source } }), /head-mismatch/);
    fs.writeFileSync(path.join(f.repo, '.git/index.lock'), 'external');
    assert.throws(() => port.apply({ request, operationId: 'native' }), /native-state/);
    assert.equal(fs.readFileSync(path.join(f.repo, '.git/index.lock'), 'utf8'), 'external');
    fs.unlinkSync(path.join(f.repo, '.git/index.lock'));
    f.git('config', 'filter.unsafe.smudge', 'touch /should-never-execute');
    assert.throws(() => port.preview({ request }), /repository-config-untrusted/);
    f.git('config', '--unset', 'filter.unsafe.smudge');
    f.git('reset', '--hard', f.request.source);
    assert.throws(() => port.preview({ request: { ...request, expectedHead: f.request.source, target: f.request.target } }), /not-descendant/);
  } finally { f.close(); }
});
test('SafeRestore snapshots an ignored incoming collision and refuses to guess a reapply over it', () => {
  const f = fixture();
  try {
    f.git('checkout', '-q', 'source'); fs.writeFileSync(path.join(f.repo, 'collision'), 'incoming');
    f.git('add', 'collision'); f.git('commit', '-qm', 'incoming addition'); const target = f.git('rev-parse', 'HEAD');
    f.git('checkout', '-q', 'trunk');
    fs.writeFileSync(path.join(f.repo, '.git/info/exclude'), 'collision\n');
    const bytes = Buffer.from([0, 255, 42]); fs.writeFileSync(path.join(f.repo, 'collision'), bytes);
    const port = createGitSafeRestore(f.options, f.loader);
    const request = { expectedHead: f.request.target, target, reason: 'explicit snapshot-backed replacement', reapplyLocalDelta: true };
    assert.throws(() => port.apply({ request, operationId: 'collision-reapply' }), /untracked-target-collision/);
    assert.deepEqual(fs.readFileSync(path.join(f.repo, 'collision')), bytes);
    const out = port.apply({ request: { ...request, reapplyLocalDelta: false }, operationId: 'collision-snapshot' });
    const saved = JSON.parse(fs.readFileSync(path.join(f.repo, '.git/fgos/git/restore-snapshots', out.snapshot)));
    assert.deepEqual(Buffer.from(saved.paths.collision.File[0]), bytes);
    assert.equal(fs.readFileSync(path.join(f.repo, 'collision'), 'utf8'), 'incoming');
  } finally { f.close(); }
});
