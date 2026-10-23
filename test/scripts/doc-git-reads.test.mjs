import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  resolveCommitSha, loadCommitTree, readBlobAtCommit, blobOidAtCommit,
  readCommitBlobMap, commitsMatchPaths,
} from '../../scripts/lib/doc-git-reads.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-git-reads-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', ...args], { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  const write = (file, body) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), body);
  };
  git('init', '-q');
  write('docs/ghi chú\tname.md', '# Byte-safe path\n');
  write('docs/runner.md', '# Runner\n');
  write('docs/runner.md.extra', 'not the exact path');
  git('add', '.'); git('commit', '-qm', 'fixture');
  return { root, git, write };
}

// Moved from the shipped generator's D3 test: pinned tooling is restored, while the
// non-pinned typed reader now owns byte paths and immutable reads for its callers.
test('typed commit reads preserve unusual paths, immutable text and exact blob identity', (t) => {
  const { root, git, write } = fixture(t);
  const commit = resolveCommitSha('HEAD', root);
  write('docs/runner.md', 'working tree drift');
  const tree = loadCommitTree(commit, root);
  assert.ok(tree.treeFiles.has('docs/ghi chú\tname.md'));
  assert.ok(tree.treeDirs.has('docs'));
  assert.equal(readBlobAtCommit(commit, 'docs/runner.md', root), '# Runner\n');
  assert.equal(blobOidAtCommit(commit, 'docs/runner.md', root), git('rev-parse', `${commit}:docs/runner.md`));
  for (const read of [readBlobAtCommit, blobOidAtCommit]) {
    assert.throws(() => read(commit, 'docs/runner', root));
    assert.throws(() => read('not-a-ref', 'docs/runner.md', root));
  }
  for (const ref of [undefined, '', ' ', 'not-a-ref']) assert.throws(() => resolveCommitSha(ref, root), /required|valid git commit/);
  assert.throws(() => resolveCommitSha(git('rev-parse', `${commit}:docs/runner.md`), root), /valid git commit/);
});

// The generator's original registry proof remains byte-frozen. This owns the
// extracted Inspect diff adapter, which gates use with the generator's scope data.
test('typed scope binding ignores outside changes and rejects scope changes or unresolved commits', (t) => {
  const { root, git, write } = fixture(t);
  const base = git('rev-parse', 'HEAD');
  write('outside.txt', 'outside'); git('add', '.'); git('commit', '-qm', 'outside');
  const outside = git('rev-parse', 'HEAD');
  const scope = ['docs', 'switchboard.json'];
  assert.equal(commitsMatchPaths(base, base, scope, root), true);
  assert.equal(commitsMatchPaths(base, outside, scope, root), true);
  write('docs/runner.md', 'changed'); git('add', '.'); git('commit', '-qm', 'inside');
  const inside = git('rev-parse', 'HEAD');
  assert.equal(commitsMatchPaths(base, inside, scope, root), false);
  write('switchboard.json', '{}'); git('add', '.'); git('commit', '-qm', 'switchboard');
  assert.equal(commitsMatchPaths(inside, git('rev-parse', 'HEAD'), scope, root), false);
  assert.equal(commitsMatchPaths(null, inside, scope, root), false);
  assert.equal(commitsMatchPaths('0'.repeat(40), inside, scope, root), false);
});

// Moved from the doc generator's D3 test: its original raw batch contract is
// restored; this separately owns the non-pinned reader's bounded typed batches.
test('typed blob batches preserve binary bytes, split bounds, filter sizes and reject missing objects', (t) => {
  const { root } = fixture(t);
  const hash = (bytes) => execFileSync('git', ['hash-object', '-w', '--stdin'], { cwd: root, input: bytes, encoding: 'utf8' }).trim();
  const bytes = Buffer.from([0, 255, 10, 13, 0, 128]);
  const blobSha = hash(bytes);
  const entries = Array.from({ length: 4097 }, (_, i) => ({ path: `payload-${i}`, blobSha, size: bytes.length }));
  const contents = readCommitBlobMap(root, entries);
  assert.equal(contents.size, entries.length);
  assert.deepEqual(contents.get('payload-0'), bytes);
  assert.deepEqual(contents.get('payload-4096'), bytes);
  assert.equal(readCommitBlobMap(root, entries, { maxSize: bytes.length - 1 }).size, 0);
  assert.throws(() => readCommitBlobMap(root, [{ path: 'missing', blobSha: '1'.repeat(40), size: 1 }]), /missing|blob/);
  const large = Buffer.alloc(17 * 1024 * 1024, 0x61);
  const largeSha = hash(large);
  const largeEntries = ['large-a', 'large-b'].map((path) => ({ path, blobSha: largeSha, size: large.length }));
  const splitByBytes = readCommitBlobMap(root, largeEntries);
  for (const entry of largeEntries) assert.ok(splitByBytes.get(entry.path).equals(large));
  const oversized = Buffer.alloc(33 * 1024 * 1024, 0x62);
  const oversizedSha = hash(oversized);
  const oversizedEntries = [{ path: 'explicit-large-limit', blobSha: oversizedSha, size: oversized.length }];
  assert.equal(readCommitBlobMap(root, oversizedEntries).size, 0);
  // The non-pinned adapter has only Inspect's bounded read contract; no
  // production caller needs the generator's historical raised-capacity path.
  assert.throws(() => readCommitBlobMap(root, oversizedEntries, { maxSize: oversized.length }), /object exceeds Inspect read bound/);
});
