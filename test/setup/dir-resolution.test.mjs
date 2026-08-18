// dir-resolution.test.mjs -- tsk-2xj: `fgos doctor`/`setup`/`uninstall` used
// to pass raw process.cwd() to every check/fix/write instead of resolving
// the real main checkout, so running any of them bare (no --dir) from
// inside a linked worktree silently targeted the WRONG tree -- false
// "missing" diagnoses from doctor, and setup/uninstall reading or writing
// .fgos/config.json and core.hooksPath against the worktree instead of the
// shared store (an ADR0020 violation for setup, since its writes are
// unconditional, docs/history/setup-doctor-uninstall-dir-resolution/
// RESEARCH.md round 1). These prove the fix: bare invocation from a linked
// worktree now resolves to the same main checkout an explicit --dir would.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

import { FGOS, NO_CLAUDE_ENV, mkTemp } from './helpers/setup-checks-harness.mjs';

function initGitWithWorktree(prefix) {
  const main = mkTemp(`${prefix}-main-`);
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: main });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: main });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: main });
  fs.writeFileSync(path.join(main, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: main });
  execFileSync('git', ['commit', '-q', '-m', 'seed'], { cwd: main });
  const wt = mkTemp(`${prefix}-wt-`);
  fs.rmSync(wt, { recursive: true, force: true });
  execFileSync('git', ['worktree', 'add', '-b', `wt-${path.basename(wt)}`, wt], { cwd: main });
  return { main, wt };
}

function cleanup(...dirs) {
  for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
}

function runFgos(cwd, args, homeDir) {
  return spawnSync(process.execPath, [FGOS, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...NO_CLAUDE_ENV, HOME: homeDir ?? mkTemp('dir-resolution-home-') },
  });
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
    const setupOnMain = runFgos(main, ['setup'], homeDir);
    assert.equal(setupOnMain.status, 0, setupOnMain.stderr);

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
    assert.ok(
      fs.existsSync(path.join(main, '.fgos', 'config.json')),
      'doctor --fix must have written the shared config at the main checkout instead',
    );
  } finally {
    cleanup(main, wt);
  }
});

test('tsk-2xj: fgos setup run bare from a linked worktree writes to the main checkout, never the worktree', () => {
  const { main, wt } = initGitWithWorktree('dir-resolution-setup');
  try {
    const homeDir = mkTemp('dir-resolution-setup-home-');
    const result = runFgos(wt, ['setup'], homeDir);
    assert.equal(result.status, 0, result.stderr);
    const data = JSON.parse(result.stdout).data;

    assert.ok(
      !fs.existsSync(path.join(wt, '.fgos')),
      'setup run bare from a worktree must never materialize .fgos/ INSIDE that worktree (ADR0020) -- setup writes unconditionally, so this is the live violation RESEARCH.md round 1 confirmed',
    );
    assert.equal(data.configPath, path.join(main, '.fgos', 'config.json'), 'reported configPath must be the main checkout\'s, not the worktree\'s');
    assert.ok(fs.existsSync(path.join(main, '.fgos', 'config.json')), 'the shared config must actually exist at the main checkout');

    const hooksPath = execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd: main, encoding: 'utf8' }).trim();
    assert.equal(
      hooksPath,
      path.join(main, '.githooks'),
      'core.hooksPath wired by a bare worktree-cwd setup must still be the MAIN checkout\'s absolute .githooks path, not the worktree\'s (a relative or worktree-anchored value resolves per-worktree, tsk-2u5 D4)',
    );
    cleanup(homeDir);
  } finally {
    cleanup(main, wt);
  }
});

test('tsk-2xj: fgos uninstall --yes run bare from a linked worktree unwires the main checkout\'s git hooks, not the worktree\'s', () => {
  const { main, wt } = initGitWithWorktree('dir-resolution-uninstall');
  try {
    const homeDir = mkTemp('dir-resolution-uninstall-home-');
    const setupResult = runFgos(wt, ['setup'], homeDir);
    assert.equal(setupResult.status, 0, setupResult.stderr);
    assert.equal(
      execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd: main, encoding: 'utf8' }).trim(),
      path.join(main, '.githooks'),
      'precondition: setup wired the main checkout\'s hooksPath',
    );

    const uninstallResult = runFgos(wt, ['uninstall', '--yes'], homeDir);
    assert.equal(uninstallResult.status, 0, uninstallResult.stderr);
    const data = JSON.parse(uninstallResult.stdout).data;
    assert.equal(
      data.hooksUnwired,
      true,
      'uninstall run bare from a worktree must recognize and unwire the MAIN checkout\'s wired hooksPath, not compare against the worktree\'s own (unwired-by-construction) path',
    );
    const hooksPathAfter = spawnSync('git', ['config', '--get', 'core.hooksPath'], { cwd: main, encoding: 'utf8' });
    assert.notEqual(hooksPathAfter.status, 0, 'core.hooksPath must be unset on the main checkout after a real unwire');
    cleanup(homeDir);
  } finally {
    cleanup(main, wt);
  }
});
