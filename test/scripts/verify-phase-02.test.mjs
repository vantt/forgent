import { test } from 'node:test';
import assert from 'node:assert/strict';

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
