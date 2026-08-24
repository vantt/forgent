import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, cpSync, writeFileSync, readFileSync, appendFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..', '..');

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' });
}

test('tsk-1wk: .gitattributes merge=union covers sharded .fgos/events/*.jsonl, so concurrent appends to the same shard auto-merge instead of conflicting', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'events-shard-union-'));
  git(dir, 'init', '-q');
  git(dir, 'config', 'user.email', 'test@example.com');
  git(dir, 'config', 'user.name', 'Test');

  cpSync(path.join(repoRoot, '.gitattributes'), path.join(dir, '.gitattributes'));
  const shardDir = path.join(dir, '.fgos', 'events');
  mkdirSync(shardDir, { recursive: true });
  const shardPath = path.join(shardDir, 'writer-a.jsonl');
  writeFileSync(shardPath, '{"seq":1}\n');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'base');

  git(dir, 'checkout', '-q', '-b', 'branch-a');
  appendFileSync(shardPath, '{"seq":2}\n');
  git(dir, 'commit', '-aq', '-m', 'branch-a appends');

  git(dir, 'checkout', '-q', '-');
  appendFileSync(shardPath, '{"seq":3}\n');
  git(dir, 'commit', '-aq', '-m', 'main appends');

  // Before tsk-1wk's fix, this would fail with a real merge conflict
  // (git's default line-based 3-way merge on a two-sided append).
  git(dir, 'merge', 'branch-a', '--no-edit', '-q');

  const merged = readFileSync(shardPath, 'utf8');
  assert.match(merged, /"seq":1/);
  assert.match(merged, /"seq":2/);
  assert.match(merged, /"seq":3/);
});
