// dir-resolution.test.mjs -- tsk-2xj: `fgos doctor` used to pass raw process.cwd() to every check/fix instead of
// resolving the real main checkout, so running it bare (no --dir) from inside a linked worktree silently targeted
// the WRONG tree -- false "missing" diagnoses (docs/history/setup-doctor-uninstall-dir-resolution/RESEARCH.md round 1).
// These prove the fix: bare invocation from a linked worktree now resolves to the same main checkout an explicit
// --dir would.
import '../helpers/process-tmp-root.mjs';
import { initFixtureRepo } from '../helpers/git-fixture.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { FGOS, NO_CLAUDE_ENV, mkTemp, runHostDoctor } from './helpers/setup-checks-harness.mjs';
import { spawnFgos } from '../helpers/cli-entry.mjs';

function initGitWithWorktree(prefix) {
  const main = mkTemp(`${prefix}-main-`);
  initFixtureRepo(main, { branch: 'main' });
  fs.mkdirSync(path.join(main, '.githooks'));
  const wt = mkTemp(`${prefix}-wt-`);
  fs.rmSync(wt, { recursive: true, force: true });
  execFileSync('git', ['worktree', 'add', '-b', `wt-${path.basename(wt)}`, wt], { cwd: main });
  return { main, wt };
}

function cleanup(...dirs) {
  for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
}

function runFgos(cwd, args, homeDir) {
  const resolvedHome = homeDir ?? mkTemp('dir-resolution-home-');
  const options = { cwd, encoding: 'utf8', env: { ...NO_CLAUDE_ENV, HOME: resolvedHome, USERPROFILE: resolvedHome } };
  // `doctor` is the host's verb; the others are still served by the Node entry.
  return args[0] === 'doctor' ? runHostDoctor(args.slice(1), options) : spawnFgos(FGOS, args, options);
}

test('tsk-2xj: fgos doctor run bare from a linked worktree reports the same checks as running directly at the main checkout', () => {
  const { main, wt } = initGitWithWorktree('dir-resolution-doctor-cmp');
  try {
    // Same HOME for both calls -- config-awareness's own message embeds the
    // global config path, which must not differ between the two runs for
    // reasons unrelated to what this test actually checks (--dir resolution).
    const homeDir = mkTemp('dir-resolution-doctor-cmp-home-');
    // Populate main's config first (running with cwd=main directly, never
    // affected by any --dir/cwd resolution bug) so the two doctor runs
    // below have real config-family state to agree or disagree about --
    // comparing two runs against an unconfigured main would trivially
    // "match" (both report everything missing) regardless of whether the
    // worktree-cwd resolution bug is present.
    const initOnMain = runFgos(main, ['init'], homeDir);
    assert.equal(initOnMain.status, 0, initOnMain.stderr);

    // The comparison itself deliberately uses cwd=main directly, never
    // --dir: the old buggy `doctor` case ignored the parsed --dir flag
    // entirely, so a bare-vs-explicit-`--dir` comparison could never have
    // told a fixed doctor apart from a broken one (both would use
    // process.cwd() either way). cwd=main is the one invocation shape that
    // was always correct, bug or no bug, and so is a real baseline.
    const bare = runFgos(wt, ['doctor'], homeDir);
    assert.equal(bare.status, 0, bare.stderr);
    const atMain = runFgos(main, ['doctor'], homeDir);
    assert.equal(atMain.status, 0, atMain.stderr);
    assert.deepEqual(
      JSON.parse(bare.stdout).data.checks,
      JSON.parse(atMain.stdout).data.checks,
      'bare doctor run from inside a linked worktree must resolve to the same main checkout running doctor directly at that checkout does',
    );
  } finally {
    cleanup(main, wt);
  }
});


test('tsk-2xj: fgos doctor --fix run bare from a linked worktree never materializes .fgos/ inside the worktree', () => {
  const { main, wt } = initGitWithWorktree('dir-resolution-doctor-fix');
  try {
    assert.ok(!fs.existsSync(path.join(wt, '.fgos')), 'precondition: worktree starts with no .fgos/ (ADR0020)');
    const result = runFgos(wt, ['doctor', '--fix']);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(
      !fs.existsSync(path.join(wt, '.fgos')),
      'doctor --fix run bare from a worktree must never create .fgos/ INSIDE that worktree (ADR0020)',
    );
  } finally {
    cleanup(main, wt);
  }
});
