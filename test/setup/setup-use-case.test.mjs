// setup-use-case.test.mjs -- what `fgos setup` does to a project, called in process with its own HOME.
// The CLI arm keeps its wiring proofs (envelope shape, --pretty, the non-checkout copy) in
// checks-setup-envelope and checks-setup-rc-line.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { initFixtureRepo } from '../helpers/git-fixture.mjs';
import { setupUseCase } from '../../src/setup/setup-use-case.mjs';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function tmp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

/** Runs the use case with `homeDir` as the home, so no fix or rc write reaches the real one. */
function setupIn(cwd, homeDir) {
  const saved = { HOME: process.env.HOME, USERPROFILE: process.env.USERPROFILE };
  process.env.HOME = homeDir;
  process.env.USERPROFILE = homeDir;
  try {
    return setupUseCase(cwd, { packageRoot: PACKAGE_ROOT, homeDir });
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
}

function cleanup(...dirs) {
  for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
}

test('setup wires core.hooksPath to the checkout\'s absolute .githooks path and says so', () => {
  const cwd = initFixtureRepo(tmp('setup-uc-hooks-'), { branch: 'main' });
  const home = tmp('setup-uc-hooks-home-');
  fs.mkdirSync(path.join(cwd, '.githooks'));
  const data = setupIn(cwd, home);
  assert.equal(data.hooksWired, true);
  const hooksPath = execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd, encoding: 'utf8' }).trim();
  assert.equal(hooksPath, path.join(cwd, '.githooks'), 'absolute: a relative value resolves per worktree, not to this root');
  cleanup(cwd, home);
});

test('setup in a directory with no .git reports hooksWired false and does not throw', () => {
  const cwd = tmp('setup-uc-no-git-');
  const home = tmp('setup-uc-no-git-home-');
  assert.equal(setupIn(cwd, home).hooksWired, false);
  cleanup(cwd, home);
});

test('setup leaves a custom core.hooksPath alone: fill-only, never repointing someone else\'s hooks', () => {
  const cwd = tmp('setup-uc-custom-hooks-');
  const home = tmp('setup-uc-custom-hooks-home-');
  execFileSync('git', ['init', '-q'], { cwd });
  execFileSync('git', ['config', 'core.hooksPath', 'my-own-hooks'], { cwd });
  const data = setupIn(cwd, home);
  assert.equal(data.hooksWired, false);
  assert.equal(data.hooksSkippedExisting, 'my-own-hooks');
  assert.equal(execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd, encoding: 'utf8' }).trim(), 'my-own-hooks');
  cleanup(cwd, home);
});

test('setup from a real checkout writes the shell-integration line once and states no declined reason', { skip: process.platform === 'win32' }, () => {
  const home = tmp('setup-uc-rc-home-');
  fs.writeFileSync(path.join(home, '.bashrc'), 'echo hi\n');
  const cwd = initFixtureRepo(tmp('setup-uc-rc-cwd-'), { branch: 'main' });
  const data = setupIn(cwd, home);
  assert.equal(data.rcWriteDeclinedReason, undefined);
  assert.deepEqual(data.rcFilesInserted, [path.join(home, '.bashrc')]);
  assert.ok(fs.readFileSync(path.join(home, '.bashrc'), 'utf8').includes('fgos-shell-integration.sh'));
  assert.deepEqual(setupIn(cwd, home).rcFilesAlreadyConfigured, [path.join(home, '.bashrc')], 'a second run adds nothing');
  cleanup(cwd, home);
});

test('setup runs every registered fix and reports each under fixed', () => {
  const cwd = tmp('setup-uc-fixes-');
  const home = tmp('setup-uc-fixes-home-');
  const { fixed } = setupIn(cwd, home);
  assert.ok(Array.isArray(fixed));
  assert.ok(fixed.some((entry) => entry.id === 'gateway-token-configured'), 'the gateway-token-configured fix ran');
  cleanup(cwd, home);
});
