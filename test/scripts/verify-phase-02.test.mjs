import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { sandboxGit } from '../../scripts/lib/sandbox-git.mjs';
import { verifyMarkdownLinks } from '../../scripts/verify-phase-01.mjs';

import {
  parseArgs,
  verifyForbiddenPhase02Diff,
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
