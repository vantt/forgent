// The runner commits only what lies in a unit's write scope, refuses an index it did not stage,
// and proves after the commit that the commit holds exactly what it staged.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { changedPaths, commitOnBranch, commitUnitWork, gitContext } from '../../../src/runner/execution/commit-unit-work.mjs';

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

/** A repo with one commit holding `files` (path -> content). */
function makeRepo(files = { 'README.md': 'hi\n' }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-commit-unit-'));
  git(dir, 'init', '-q', '-b', 'main');
  git(dir, 'config', 'user.name', 't');
  git(dir, 'config', 'user.email', 't@t');
  git(dir, 'config', 'core.hooksPath', '.no-hooks');
  for (const [rel, content] of Object.entries(files)) write(dir, rel, content);
  git(dir, 'add', '-A');
  git(dir, 'commit', '-qm', 'init');
  return dir;
}

function write(dir, rel, content = 'x\n') {
  fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
  fs.writeFileSync(path.join(dir, rel), content);
}

const staged = (dir) => git(dir, 'diff', '--cached', '--name-only', '-z').split('\0').filter(Boolean).sort();
const committed = (dir) => git(dir, 'show', '--name-only', '--no-renames', '--format=', '-z', 'HEAD').split('\0').filter(Boolean).sort();
const subject = (dir) => git(dir, 'log', '-1', '--format=%s').trim();
const head = (dir) => git(dir, 'rev-parse', 'HEAD').trim();

function withRepo(files, fn) {
  const dir = makeRepo(files);
  try { return fn(dir); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

test('a. a staged path outside the scope is refused and the index is left untouched', () => withRepo(undefined, (dir) => {
  write(dir, 'other/a.txt');
  git(dir, 'add', 'other/a.txt');
  write(dir, 'docs/x.md');
  const before = head(dir);
  const r = commitUnitWork({ worktree: dir, repoRoot: dir, unitId: 'u1', summary: 's', scope: ['docs'] });
  assert.equal(r.status, 'failed');
  assert.equal(r.reason, 'foreign-staged-index');
  assert.deepEqual(r.stagedPaths, ['other/a.txt']);
  assert.deepEqual(staged(dir), ['other/a.txt']);
  assert.equal(head(dir), before);
}));

test('b. a staged path inside the scope is refused too: the runner stages only what it chose', () => withRepo(undefined, (dir) => {
  write(dir, 'docs/x.md');
  git(dir, 'add', 'docs/x.md');
  const r = commitUnitWork({ worktree: dir, repoRoot: dir, unitId: 'u1', summary: 's', scope: ['docs'] });
  assert.equal(r.status, 'failed');
  assert.equal(r.reason, 'foreign-staged-index');
  assert.deepEqual(staged(dir), ['docs/x.md']);
}));

test('c. a dirty path outside the scope is reported only when the agent changed it', () => withRepo(undefined, (dir) => {
  write(dir, 'docs/x.md');
  write(dir, 'src/a.mjs');
  write(dir, 'src/b.mjs');
  const r = commitUnitWork({ worktree: dir, repoRoot: dir, unitId: 'u1', summary: 's', scope: ['docs'], changedFiles: ['docs/x.md', 'src/a.mjs'] });
  assert.equal(r.status, 'committed');
  assert.deepEqual(r.files, ['docs/x.md']);
  assert.deepEqual(r.outOfScope, ['src/a.mjs']);
  assert.deepEqual(committed(dir), ['docs/x.md']);
  assert.match(git(dir, 'status', '--porcelain'), /\?\? src\//, 'out-of-scope files stay in the worktree, uncommitted');
}));

test('d. a deleted file inside the scope is committed as a deletion', () => withRepo({ 'docs/old.md': 'o\n', 'src/keep.mjs': 'k\n' }, (dir) => {
  fs.rmSync(path.join(dir, 'docs/old.md'));
  fs.rmSync(path.join(dir, 'src/keep.mjs'));
  const r = commitUnitWork({ worktree: dir, repoRoot: dir, unitId: 'u1', summary: 's', scope: ['docs'], changedFiles: [] });
  assert.equal(r.status, 'committed');
  assert.deepEqual(r.files, ['docs/old.md']);
  assert.equal(git(dir, 'show', '--name-status', '--format=', 'HEAD').trim(), 'D\tdocs/old.md');
  assert.match(git(dir, 'status', '--porcelain'), /^ D src\/keep\.mjs/m, 'the out-of-scope deletion is left unstaged');
}));

test('e. a rename across the scope boundary is judged as one deletion and one addition', () => withRepo({ 'src/moved.mjs': 'm\n'.repeat(20) }, (dir) => {
  fs.mkdirSync(path.join(dir, 'docs'), { recursive: true });
  fs.renameSync(path.join(dir, 'src/moved.mjs'), path.join(dir, 'docs/moved.mjs'));
  const r = commitUnitWork({ worktree: dir, repoRoot: dir, unitId: 'u1', summary: 's', scope: ['docs'], changedFiles: ['src/moved.mjs', 'docs/moved.mjs'] });
  assert.equal(r.status, 'committed');
  assert.deepEqual(r.files, ['docs/moved.mjs']);
  assert.deepEqual(r.outOfScope, ['src/moved.mjs']);
  assert.deepEqual(committed(dir), ['docs/moved.mjs']);
  assert.ok(git(dir, 'ls-files', 'src/moved.mjs').trim(), 'the source half stays tracked: its deletion was out of scope');
}));

test('f. a directory entry covers everything beneath it and nothing beside it', () => withRepo(undefined, (dir) => {
  write(dir, 'docs/a/b/c.md');
  write(dir, 'docs-old/x.md');
  const r = commitUnitWork({ worktree: dir, repoRoot: dir, unitId: 'u1', summary: 's', scope: ['docs'], changedFiles: ['docs/a/b/c.md', 'docs-old/x.md'] });
  assert.deepEqual(r.files, ['docs/a/b/c.md']);
  assert.deepEqual(r.outOfScope, ['docs-old/x.md']);
}));

test('g. odd path names are staged literally, never as git pathspec magic', () => withRepo(undefined, (dir) => {
  const names = ['app/[slug]/page.tsx', 'app/*star.md', 'app/with space.md', 'app/new\nline.md', 'app/tab\tq"uote.md', 'app/café.md', 'app/é.md'];
  for (const name of names) write(dir, name);
  write(dir, 'app/s/page.tsx'); // `[slug]` read as a character class would match `app/s`
  const r = commitUnitWork({ worktree: dir, repoRoot: dir, unitId: 'u1', summary: 's', scope: ['app/[slug]', 'app/*star.md', 'app/with space.md', 'app/new\nline.md', 'app/tab\tq"uote.md', 'app/café.md', 'app/é.md'] });
  assert.equal(r.status, 'committed', r.error);
  assert.deepEqual([...r.files].sort(), [...names].sort());
  assert.deepEqual(committed(dir), [...names].sort());
  assert.match(git(dir, 'status', '--porcelain', '-z', '--untracked-files=all'), /app\/s\/page\.tsx/);
}));

test('h. .fgos is never committed, even under a bare ** scope', () => withRepo(undefined, (dir) => {
  write(dir, '.fgos/x');
  write(dir, 'a.txt');
  const r = commitUnitWork({ worktree: dir, repoRoot: dir, unitId: 'u1', summary: 's', scope: ['**'], changedFiles: ['.fgos/x', 'a.txt'] });
  assert.deepEqual(r.files, ['a.txt']);
  assert.deepEqual(r.outOfScope, []);
  assert.deepEqual(committed(dir), ['a.txt']);
}));

test('i. a pre-commit hook that adds a file is caught after the commit', () => withRepo(undefined, (dir) => {
  fs.mkdirSync(path.join(dir, '.hooks'));
  fs.writeFileSync(path.join(dir, '.hooks/pre-commit'), '#!/bin/sh\necho sneaky > sneaky.txt\ngit add sneaky.txt\n', { mode: 0o755 });
  git(dir, 'config', 'core.hooksPath', '.hooks');
  write(dir, 'docs/x.md');
  const r = commitUnitWork({ worktree: dir, repoRoot: dir, unitId: 'u1', summary: 's', scope: ['docs'], changedFiles: [] });
  assert.equal(r.status, 'failed');
  assert.equal(r.reason, 'committed-set-mismatch');
  assert.equal(r.sha, head(dir), 'the commit stays on the branch and is named');
  assert.deepEqual(r.unexpected, ['sneaky.txt']);
  assert.deepEqual(r.missing, []);
}));

test('j. subject: a conventional first line is kept, anything else gets chore(<unitId>)', () => {
  const cases = [
    ['feat(runner): add the thing\nbody', 'feat(runner): add the thing'],
    ['fix!: break it', 'fix!: break it'],
    ['u1: Added the feature file', 'chore(u1): Added the feature file'],
    ['Added the feature file', 'chore(u1): Added the feature file'],
    ['', 'chore(u1): producer changes'],
    [undefined, 'chore(u1): producer changes'],
    ['feature: not a type', 'chore(u1): feature: not a type'],
  ];
  for (const [summary, expected] of cases) {
    withRepo(undefined, (dir) => {
      write(dir, 'a.txt');
      const r = commitUnitWork({ worktree: dir, repoRoot: dir, unitId: 'u1', summary, scope: ['**'] });
      assert.equal(r.subject, expected, `summary ${JSON.stringify(summary)}`);
      assert.equal(subject(dir), expected);
    });
  }
  withRepo(undefined, (dir) => {
    write(dir, 'a.txt');
    const long = `feat: ${'y'.repeat(200)}`;
    assert.equal(commitUnitWork({ worktree: dir, repoRoot: dir, unitId: 'u1', summary: long, scope: ['**'] }).subject.length, 100);
  });
});

test('j2. subject: without a summary the first line of the objective names the change', () => {
  const cases = [
    [{ objective: 'Write the docs for the lane\nmore detail' }, 'chore(u1): Write the docs for the lane'],
    [{ objective: '# Task: refresh the guide' }, 'chore(u1): Task: refresh the guide'],
    [{ objective: 'docs(rununit): add the lane notes' }, 'docs(rununit): add the lane notes'],
    [{ summary: 'Added the file', objective: 'Write the docs' }, 'chore(u1): Added the file'],
    [{ objective: '' }, 'chore(u1): producer changes'],
  ];
  for (const [args, expected] of cases) {
    withRepo(undefined, (dir) => {
      write(dir, 'a.txt');
      const r = commitUnitWork({ worktree: dir, repoRoot: dir, unitId: 'u1', scope: ['**'], ...args });
      assert.equal(r.subject, expected, JSON.stringify(args));
      assert.equal(subject(dir), expected);
    });
  }
});

test('j3. subject: a long line is cut at a sentence, else a word, never with a trailing or stray ellipsis', () => {
  const sentence = 'docs(rununit): Wrote the lane guide. Created the scoped file list for every lane in the plan and checked each link twice before the release';
  const words = `chore(u1): ${'Created the scoped file list for every lane '.repeat(4)}`;
  const stray = 'docs(rununit): ... Created the scoped ...';
  const unbroken = `feat: ${'y'.repeat(200)}`;
  for (const [summary, check] of [
    [sentence, (s) => assert.equal(s, 'docs(rununit): Wrote the lane guide')],
    [words, (s) => { assert.ok(s.length <= 100); assert.ok(words.startsWith(s)); assert.match(s, /\w$/); assert.ok(/ /.test(words[s.length])); }],
    [stray, (s) => assert.equal(s, 'docs(rununit): Created the scoped')],
    [unbroken, (s) => assert.equal(s.length, 100)],
  ]) {
    withRepo(undefined, (dir) => {
      write(dir, 'a.txt');
      const r = commitUnitWork({ worktree: dir, repoRoot: dir, unitId: 'u1', summary, scope: ['**'] });
      assert.doesNotMatch(r.subject, /\.\.\.|\u2026/, r.subject);
      check(r.subject);
    });
  }
});

test('k. two thousand files commit in one go', () => withRepo(undefined, (dir) => {
  for (let i = 0; i < 2000; i += 1) write(dir, `docs/many/f-${i}.md`, `${i}\n`);
  const r = commitUnitWork({ worktree: dir, repoRoot: dir, unitId: 'u1', summary: 's', scope: ['docs'] });
  assert.equal(r.status, 'committed', r.error);
  assert.equal(r.files.length, 2000);
  assert.equal(committed(dir).length, 2000);
}));

test('l. scope ** keeps the old behaviour: every change outside .fgos is committed', () => withRepo({ 'gone.txt': 'g\n' }, (dir) => {
  write(dir, 'a/b.txt');
  write(dir, 'c.txt');
  fs.rmSync(path.join(dir, 'gone.txt'));
  const r = commitUnitWork({ worktree: dir, repoRoot: dir, unitId: 'u1', summary: 's', scope: ['**'], changedFiles: null, excludePaths: [] });
  assert.equal(r.status, 'committed');
  assert.deepEqual(committed(dir), ['a/b.txt', 'c.txt', 'gone.txt']);
  assert.deepEqual(r.outOfScope, []);
}));

test('m. excludePaths are never committed and are echoed as preExistingInScope', () => withRepo({ 'docs/wip.md': 'old\n' }, (dir) => {
  write(dir, 'docs/wip.md', 'half-written by a person\n');
  write(dir, 'docs/new.md');
  const r = commitUnitWork({ worktree: dir, repoRoot: dir, unitId: 'u1', summary: 's', scope: ['docs'], changedFiles: [], excludePaths: ['docs/wip.md'] });
  assert.deepEqual(r.files, ['docs/new.md']);
  assert.deepEqual(r.preExistingInScope, ['docs/wip.md']);
  assert.match(git(dir, 'status', '--porcelain'), /^ M docs\/wip\.md/m);
}));

test('nothing in scope is no-changes, and still names what changed out of scope', () => withRepo(undefined, (dir) => {
  write(dir, 'src/a.mjs');
  const r = commitUnitWork({ worktree: dir, repoRoot: dir, unitId: 'u1', summary: 's', scope: ['docs'], changedFiles: ['src/a.mjs'], needsWrites: ['src'] });
  assert.equal(r.status, 'no-changes');
  assert.deepEqual(r.outOfScope, ['src/a.mjs']);
  assert.deepEqual(r.needsWrites, ['src']);
}));

test('a missing scope is a caller bug, not "commit everything"', () => withRepo(undefined, (dir) => {
  assert.throws(() => commitUnitWork({ worktree: dir, repoRoot: dir, unitId: 'u1', summary: 's' }), /scope/);
}));

test('a commit a hook rejects takes back what the runner staged, so the next try is not refused as foreign', () => withRepo(undefined, (dir) => {
  const hooks = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-commit-unit-hooks-'));
  fs.writeFileSync(path.join(hooks, 'pre-commit'), '#!/bin/sh\nexit 1\n', { mode: 0o755 });
  git(dir, 'config', 'core.hooksPath', hooks);
  write(dir, 'a.txt');
  const r = commitUnitWork({ worktree: dir, repoRoot: dir, unitId: 'u1', summary: 's', scope: ['**'] });
  assert.equal(r.status, 'failed');
  assert.equal(r.reason, 'git-error');
  assert.deepEqual(staged(dir), [], 'the index is as it was before the call');
  git(dir, 'config', 'core.hooksPath', '.no-hooks');
  fs.rmSync(hooks, { recursive: true, force: true });
  assert.equal(commitUnitWork({ worktree: dir, repoRoot: dir, unitId: 'u1', summary: 's', scope: ['**'] }).status, 'committed');
}));

test('a submodule with only dirty content is not a change to commit, and does not block the rest', () => withRepo(undefined, (dir) => {
  const sub = makeRepo({ 'inner.txt': 'i\n' });
  try {
    git(dir, '-c', 'protocol.file.allow=always', 'submodule', 'add', '-q', sub, 'sm');
    git(dir, 'commit', '-qm', 'add submodule');
    fs.writeFileSync(path.join(dir, 'sm', 'inner.txt'), 'dirty\n');
    write(dir, 'top.txt');
    const r = commitUnitWork({ worktree: dir, repoRoot: dir, unitId: 'u1', summary: 's', scope: ['**'] });
    assert.equal(r.status, 'committed', r.error);
    assert.deepEqual(committed(dir), ['top.txt']);
  } finally {
    fs.rmSync(sub, { recursive: true, force: true });
  }
}));

test('an untracked nested repository is staged under its own name, as add -A always did', () => withRepo(undefined, (dir) => {
  const nested = path.join(dir, 'nested');
  fs.mkdirSync(nested);
  git(nested, 'init', '-q', '-b', 'main');
  fs.writeFileSync(path.join(nested, 'n.txt'), 'n\n');
  git(nested, '-c', 'user.name=t', '-c', 'user.email=t@t', 'add', '-A');
  git(nested, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'n');
  const r = commitUnitWork({ worktree: dir, repoRoot: dir, unitId: 'u1', summary: 's', scope: ['**'] });
  assert.equal(r.status, 'committed', r.error);
  assert.deepEqual(committed(dir), ['nested']);
}));

test('an intent-to-add rename in the worktree column yields both halves, not a garbled path', () => withRepo({ 'old.txt': 'o\n'.repeat(20) }, (dir) => {
  fs.renameSync(path.join(dir, 'old.txt'), path.join(dir, 'new.txt'));
  git(dir, 'add', '-N', 'new.txt');
  assert.deepEqual(changedPaths(gitContext({ worktree: dir, repoRoot: dir })).sort(), ['new.txt', 'old.txt']);
}));

/** A main repo with one linked worktree, as the runner sees a unit's worktree. */
function withLinkedWorktree(fn) {
  const main = makeRepo();
  const wt = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-commit-unit-wt-'));
  fs.rmSync(wt, { recursive: true });
  git(main, 'worktree', 'add', '-q', '-b', 'unit', wt);
  try { return fn({ main, wt }); } finally {
    fs.rmSync(wt, { recursive: true, force: true });
    fs.rmSync(main, { recursive: true, force: true });
  }
}

/** A repo the worker builds and points the worktree's .git file at; its config runs a command on git status. */
function fakeRepoWithFsmonitor(dir, marker) {
  const fake = path.join(dir, '.fake-git');
  git(dir, 'init', '-q', '--separate-git-dir', fake, path.join(dir, '.fake-wt'));
  fs.writeFileSync(path.join(fake, 'config'), `[core]\n\tfsmonitor = touch ${marker}; false\n[user]\n\tname = w\n\temail = w@w\n`, { flag: 'a' });
  return fake;
}

test('a .git pointer the worker rewrote is ignored when repoRoot names the trusted repository', () => withLinkedWorktree(({ main, wt }) => {
  const marker = path.join(os.tmpdir(), `fgos-pwned-${process.pid}-${Date.now()}`);
  const fake = fakeRepoWithFsmonitor(wt, marker);
  fs.writeFileSync(path.join(wt, '.git'), `gitdir: ${fake}\n`);
  write(wt, 'docs/x.md');
  const branchBefore = git(main, 'rev-parse', 'unit').trim();
  const r = commitUnitWork({ worktree: wt, repoRoot: main, unitId: 'u1', summary: 's', scope: ['docs'] });
  assert.equal(fs.existsSync(marker), false, 'no command from the worker-built config ran');
  assert.equal(r.status, 'committed', r.error);
  assert.notEqual(git(main, 'rev-parse', 'unit').trim(), branchBefore, 'the real unit branch moved');
  assert.equal(git(main, 'show', '--name-only', '--format=', 'unit').trim(), 'docs/x.md');
  fs.rmSync(marker, { force: true });
}));

test('a relative hooksPath runs the main checkout copy of the hook, never the worktree copy', () => withLinkedWorktree(({ main, wt }) => {
  const marker = path.join(os.tmpdir(), `fgos-hook-${process.pid}-${Date.now()}`);
  fs.mkdirSync(path.join(main, '.githooks'));
  fs.writeFileSync(path.join(main, '.githooks/pre-commit'), `#!/bin/sh\necho trusted >> ${marker}\n`, { mode: 0o755 });
  git(main, 'config', 'core.hooksPath', '.githooks');
  fs.mkdirSync(path.join(wt, '.githooks'));
  fs.writeFileSync(path.join(wt, '.githooks/pre-commit'), `#!/bin/sh\necho worker >> ${marker}\n`, { mode: 0o755 });
  write(wt, 'docs/x.md');
  const r = commitUnitWork({ worktree: wt, repoRoot: main, unitId: 'u1', summary: 's', scope: ['docs'] });
  assert.equal(r.status, 'committed', r.error);
  assert.equal(fs.readFileSync(marker, 'utf8'), 'trusted\n');
  fs.rmSync(marker, { force: true });
}));

test('a worktree that is not a worktree of repoRoot is refused, not committed somewhere else', () => withLinkedWorktree(({ main }) => withRepo(undefined, (stranger) => {
  write(stranger, 'docs/x.md');
  const r = commitUnitWork({ worktree: stranger, repoRoot: main, unitId: 'u1', summary: 's', scope: ['docs'] });
  assert.equal(r.status, 'failed');
  assert.equal(r.reason, 'untrusted-worktree');
})));

test('GIT_DIR, GIT_WORK_TREE and GIT_INDEX_FILE inherited by the runner do not redirect the commit', () => withRepo(undefined, (dir) => withRepo(undefined, (other) => {
  write(dir, 'a.txt');
  const saved = { GIT_DIR: process.env.GIT_DIR, GIT_WORK_TREE: process.env.GIT_WORK_TREE, GIT_INDEX_FILE: process.env.GIT_INDEX_FILE };
  const otherHead = head(other);
  const otherGitDir = path.join(other, '.git');
  Object.assign(process.env, { GIT_DIR: otherGitDir, GIT_WORK_TREE: other, GIT_INDEX_FILE: path.join(otherGitDir, 'index') });
  let r;
  try {
    r = commitUnitWork({ worktree: dir, repoRoot: dir, unitId: 'u1', summary: 's', scope: ['**'] });
  } finally {
    for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
  assert.equal(r.status, 'committed', r.error);
  assert.equal(head(other), otherHead);
  assert.deepEqual(committed(dir), ['a.txt']);
})));

test('a linked worktree passed as repoRoot is refused: the trusted root must be the main checkout', () => withLinkedWorktree(({ main, wt }) => {
  write(wt, 'docs/x.md');
  const mainBefore = git(main, 'rev-parse', 'main').trim();
  const r = commitUnitWork({ worktree: wt, repoRoot: wt, unitId: 'u1', summary: 's', scope: ['docs'] });
  assert.equal(r.status, 'failed');
  assert.equal(r.reason, 'untrusted-worktree');
  assert.equal(git(main, 'rev-parse', 'main').trim(), mainBefore, 'main did not move');
}));

test('a missing repoRoot is a caller bug: the gitdir is never taken from the worktree', () => withRepo(undefined, (dir) => {
  assert.throws(() => commitUnitWork({ worktree: dir, unitId: 'u1', summary: 's', scope: ['**'] }), /repoRoot/);
}));

test('commitOnBranch fails closed on a worktree it cannot trust', () => withLinkedWorktree(({ main }) => withRepo(undefined, (stranger) => {
  assert.throws(() => commitOnBranch(stranger, head(stranger), main), /not a working tree/);
})));

test('author identity and global config variables still reach the runner commit', () => withRepo(undefined, (dir) => {
  write(dir, 'a.txt');
  const saved = process.env.GIT_AUTHOR_NAME;
  process.env.GIT_AUTHOR_NAME = 'Env Author';
  try {
    assert.equal(commitUnitWork({ worktree: dir, repoRoot: dir, unitId: 'u1', summary: 's', scope: ['**'] }).status, 'committed');
  } finally {
    if (saved === undefined) delete process.env.GIT_AUTHOR_NAME; else process.env.GIT_AUTHOR_NAME = saved;
  }
  assert.equal(git(dir, 'log', '-1', '--format=%an').trim(), 'Env Author');
}));
