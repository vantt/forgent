import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { sandboxGit } from '../../scripts/lib/sandbox-git.mjs';
import { initFixtureRepo } from '../helpers/git-fixture.mjs';
import { verifyMarkdownLinks, runPhase01Verification } from '../../scripts/verify-phase-01.mjs';

import {
  parseArgs,
  verifyForbiddenPhase02Diff,
  runPhase02Verification,
} from '../../scripts/verify-phase-02.mjs';

function withoutBaseEnv(fn) {
  const oldBase = process.env.BASE;
  const oldFixedEnd = process.env.FIXED_END;
  delete process.env.BASE;
  delete process.env.FIXED_END;
  try {
    return fn();
  } finally {
    if (oldBase === undefined) delete process.env.BASE;
    else process.env.BASE = oldBase;
    if (oldFixedEnd === undefined) delete process.env.FIXED_END;
    else process.env.FIXED_END = oldFixedEnd;
  }
}

test('parseArgs requires explicit base and fixed-end', () => withoutBaseEnv(() => {
  assert.throws(
    () => parseArgs(['--fixed-end', 'abc']),
    /--base <sha>.*must be explicitly provided/,
  );
  assert.throws(
    () => parseArgs(['--base', 'abc']),
    /--fixed-end <sha>.*must be explicitly provided/,
  );
}));

test('parseArgs binds immutable base/fixed-end and skip-full-suite flags', () => {
  assert.deepEqual(
    parseArgs(['--base', 'base-sha', '--fixed-end', 'fixed-sha', '--skip-full-suite', '--keep-worktree']),
    { base: 'base-sha', fixedEnd: 'fixed-sha', skipFullSuite: true, keepWorktree: true },
  );
});

test('parseArgs rejects unknown flags instead of silently ignoring moving-worktree input', () => {
  assert.throws(
    () => parseArgs(['--base', 'base', '--fixed-end', 'end', '--commit', 'HEAD']),
    /Unknown argument: --commit/,
  );
});

test('verifyForbiddenPhase02Diff allows exact Phase 02 footprint including shard directory', () => {
  const result = verifyForbiddenPhase02Diff('/repo', 'base', 'end', {
    run() {},
    diffNames() { return [
      'scripts/doc-inventory-artifact.mjs',
      'scripts/generate-doc-inventory.mjs',
      'plans/260925-documentation-authority-unification/phase-02-doc-inventory.json',
      'plans/260925-documentation-authority-unification/phase-02-doc-inventory.parts/part-0001.jsonl',
      'plans/260925-documentation-authority-unification/phase-02-doc-inventory.md',
      'plans/260925-documentation-authority-unification/phase-02-identity-registry.json',
      'CHANGELOG.md',
    ]; },
  });
  assert.equal(result.changedPathCount, 7);
});

// Phase 02 consumes Phase 01's link reader. The scope stubs do not prove immutable link reads.
test('Markdown verification reads the end commit and ignores deleted documents', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-links-'));
  const git = (args) => sandboxGit(root)(args, { cwd: root });
  const commit = () => { git(['add', '.']); git(['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'fixture']); return git(['rev-parse', 'HEAD']); };
  try {
    git(['init', '-q']);
    fs.writeFileSync(path.join(root, 'deleted.md'), '[old](absent.md)');
    const base = commit();
    fs.unlinkSync(path.join(root, 'deleted.md'));
    fs.writeFileSync(path.join(root, 'ghi chú.md'), '[ok](target.md)\n');
    fs.writeFileSync(path.join(root, 'target.md'), '# target\n');
    const end = commit();
    fs.writeFileSync(path.join(root, 'ghi chú.md'), '[dirty](absent.md)');
    assert.equal(verifyMarkdownLinks(root, base, end).checkedBlobsCount, 3);
    const broken = commit();
    assert.throws(() => verifyMarkdownLinks(root, base, broken), /missing link target/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

// Argument/scope/link proofs never execute either verifier's finally block.
// Real Git fixture ports own registration/removal here; only npm is a local
// fixture executable, so no network install or full-suite command is needed.
for (const [phase, verify] of [['01', runPhase01Verification], ['02', runPhase02Verification]]) {
  for (const scenario of ['check failure', 'partial install', 'keep worktree', 'unrelated ignored bytes', 'committed dependencies']) {
    test(`verifier ${phase} cleans its setup after ${scenario} without forcing removal`, (t) => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-cleanup-'));
      const repo = path.join(root, 'repo');
      const bin = path.join(root, 'bin');
      fs.mkdirSync(repo);
      fs.mkdirSync(bin);
      initFixtureRepo(repo, { ignore: '.fgos/\nnode_modules/\ntarget/\nforeign/\n' });
      const git = (args) => sandboxGit(root)(args, { cwd: repo });
      const installReceipt = path.join(root, 'install.json');
      const partial = scenario === 'partial install';
      const keep = scenario === 'keep worktree';
      const foreign = scenario === 'unrelated ignored bytes';
      const committedDeps = scenario === 'committed dependencies';
      if (committedDeps) {
        fs.mkdirSync(path.join(repo, 'node_modules'));
        fs.writeFileSync(path.join(repo, 'node_modules/committed'), 'preserve committed bytes');
        git(['add', '-f', 'node_modules/committed']);
      }
      fs.mkdirSync(path.join(repo, 'target'));
      fs.writeFileSync(path.join(repo, 'target', 'shared-cache'), 'preserve host bytes');
      fs.writeFileSync(path.join(repo, 'package-lock.json'), '{}\n');
      git(['add', 'package-lock.json']);
      git(['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'lockfile']);
      fs.writeFileSync(path.join(bin, 'npm'), `#!${process.execPath}
const fs = require('node:fs');
fs.mkdirSync('node_modules', { recursive: true });
fs.writeFileSync('node_modules/installed', 'regenerable');
${foreign ? "fs.mkdirSync('foreign'); fs.writeFileSync('foreign/valuable', 'preserve');" : ''}
fs.writeFileSync(${JSON.stringify(installReceipt)}, JSON.stringify({ cwd: process.cwd(), args: process.argv.slice(2) }));
process.exit(${partial ? 23 : 0});
`, { mode: 0o755 });
      const oldTmpdir = process.env.TMPDIR;
      process.env.TMPDIR = root;
      const oldPath = process.env.PATH;
      process.env.PATH = `${bin}${path.delimiter}${oldPath}`;
      const warnings = [];
      t.mock.method(console, 'log', () => {});
      t.mock.method(console, 'warn', (message) => warnings.push(message));
      let worktree;
      try {
        assert.throws(() => verify({ base: 'HEAD', fixedEnd: 'HEAD', keepWorktree: keep }, repo),
          partial ? /npm.*failed|Command failed/ : /Focused tests failed|--test.*failed/);
        const installed = JSON.parse(fs.readFileSync(installReceipt, 'utf8'));
        worktree = installed.cwd;
        assert.deepEqual(installed.args, phase === '01' ? ['install'] : ['ci']);
        const registrations = git(['worktree', 'list', '--porcelain']);
        if (keep || foreign || committedDeps) {
          assert.ok(registrations.includes(worktree));
          assert.equal(fs.existsSync(path.join(worktree, 'node_modules')), keep || committedDeps);
          assert.equal(warnings.length, keep ? 0 : 1);
          if (!keep) assert.match(warnings[0], /ignored-bytes-preserved/);
          if (foreign) assert.equal(fs.readFileSync(path.join(worktree, 'foreign/valuable'), 'utf8'), 'preserve');
          if (committedDeps) assert.equal(fs.readFileSync(path.join(worktree, 'node_modules/committed'), 'utf8'), 'preserve committed bytes');
          if (phase === '01') assert.equal(fs.existsSync(path.join(worktree, 'target')), keep);
        } else {
          assert.equal(fs.existsSync(worktree), false, 'owned dependency bytes must not block cleanup');
          assert.equal(registrations.includes(worktree), false, 'no dangling worktree registration');
          assert.deepEqual(warnings, []);
        }
        assert.equal(fs.readFileSync(path.join(repo, 'target/shared-cache'), 'utf8'), 'preserve host bytes');
      } finally {
        if (oldTmpdir === undefined) delete process.env.TMPDIR;
        else process.env.TMPDIR = oldTmpdir;
        if (oldPath === undefined) delete process.env.PATH;
        else process.env.PATH = oldPath;
        // Destructive teardown is confined to this disposable fixture repository.
        if (worktree && fs.existsSync(worktree)) git(['worktree', 'remove', '--force', worktree]);
        fs.rmSync(root, { recursive: true, force: true });
      }
    });
  }
}

test('verifyForbiddenPhase02Diff rejects unrelated edits', () => {
  const calls = [];
  assert.throws(
    () => verifyForbiddenPhase02Diff('/repo', 'base', 'end', {
      run(command, args) { calls.push([command, args]); },
      diffNames() { return ['docs/specs/runner.md', 'plans/260925-documentation-authority-unification/phase-02-verification.md']; },
    }),
    /Forbidden unrelated edit/,
  );
});
