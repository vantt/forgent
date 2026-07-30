// working-tree-clean-unified.test.mjs — proves choke-point #2 from
// docs/decisions/0022-fgos-choke-point-survey.md is actually fixed:
// `return` (subtree scope) and `approve` (whole-repo scope) now share ONE
// isWorkingTreeClean implementation (src/runner/merge.mjs), parameterized by
// `scope`, instead of two independently-written functions. test/runner/merge.test.mjs
// already covers the whole-repo (default) scope end to end — this file only
// adds the 'subtree' scope's own behavior and confirms both scopes still
// share the same prefix computation and .fgos/ exclusion.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { isWorkingTreeClean } from '../../src/runner/merge.mjs';

function initRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-clean-unified-test-repo-'));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'seed'], { cwd: repoRoot });
  return repoRoot;
}

function git(repoRoot, args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' });
}

test("isWorkingTreeClean scope:'subtree' ignores a dirty file OUTSIDE the given subtree — return's per-item gate must not see another item's mess", () => {
  const topLevel = initRepo();
  const sub = path.join(topLevel, 'sub');
  fs.mkdirSync(sub, { recursive: true });
  fs.writeFileSync(path.join(topLevel, 'elsewhere.txt'), 'uncommitted\n');
  assert.equal(isWorkingTreeClean(sub, null, { scope: 'subtree' }), true);
});

test("isWorkingTreeClean scope:'subtree' still blocks on a dirty file INSIDE the given subtree", () => {
  const topLevel = initRepo();
  const sub = path.join(topLevel, 'sub');
  fs.mkdirSync(sub, { recursive: true });
  fs.writeFileSync(path.join(sub, 'own.txt'), 'uncommitted\n');
  assert.equal(isWorkingTreeClean(sub, null, { scope: 'subtree' }), false);
});

test("isWorkingTreeClean scope:'whole-repo' (the default, unchanged) still blocks on the SAME dirty file outside the subtree — same repo, opposite scope, opposite answer", () => {
  const topLevel = initRepo();
  const sub = path.join(topLevel, 'sub');
  fs.mkdirSync(sub, { recursive: true });
  fs.writeFileSync(path.join(topLevel, 'elsewhere.txt'), 'uncommitted\n');
  assert.equal(isWorkingTreeClean(sub), false);
});

test("isWorkingTreeClean scope:'subtree' shares the same .fgos/ exclusion + top-level-relative prefix as scope:'whole-repo'", () => {
  const topLevel = initRepo();
  const sub = path.join(topLevel, 'sub');
  fs.mkdirSync(path.join(sub, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(sub, '.fgos', 'events.jsonl'), '{"seq":1}\n');
  git(topLevel, ['add', 'sub/.fgos/events.jsonl']);
  git(topLevel, ['commit', '-q', '-m', 'seed sub/.fgos/events.jsonl']);

  fs.appendFileSync(path.join(sub, '.fgos', 'events.jsonl'), '{"seq":2}\n');
  assert.equal(isWorkingTreeClean(sub, null, { scope: 'subtree' }), true);
  assert.equal(isWorkingTreeClean(sub), true);
});

test("isWorkingTreeClean scope:'subtree' still threads ownFileSet through exactly like scope:'whole-repo' (tsk-598)", () => {
  const topLevel = initRepo();
  const sub = path.join(topLevel, 'sub');
  // `sub` must already be a TRACKED directory before adding a loose file:
  // an entirely-untracked directory collapses to one "?? sub/" porcelain
  // line (verified empirically) instead of one line per file, which would
  // never match an exact-path ownFileSet entry.
  fs.mkdirSync(sub, { recursive: true });
  fs.writeFileSync(path.join(sub, 'tracked.txt'), 'tracked\n');
  git(topLevel, ['add', 'sub/tracked.txt']);
  git(topLevel, ['commit', '-q', '-m', 'track sub/']);
  fs.writeFileSync(path.join(sub, 'unrelated.txt'), 'uncommitted\n');
  assert.equal(isWorkingTreeClean(sub, new Set(['src/a.mjs']), { scope: 'subtree' }), true);
  fs.writeFileSync(path.join(sub, 'own.txt'), 'uncommitted\n');
  assert.equal(isWorkingTreeClean(sub, new Set(['sub/own.txt']), { scope: 'subtree' }), false);
});

test('isWorkingTreeClean omitting the options object entirely still defaults to whole-repo scope (byte-identical to every pre-unification caller)', () => {
  const repoRoot = initRepo();
  fs.writeFileSync(path.join(repoRoot, 'scratch.txt'), 'uncommitted\n');
  assert.equal(isWorkingTreeClean(repoRoot), false);
  assert.equal(isWorkingTreeClean(repoRoot, null), false);
});
