// fgos-version.test.mjs -- tsk-2ej: `fgos version` is a hook-safe,
// scriptable way to tell an old globally-installed build apart from a
// current checkout (no node_modules read required), closing the friction
// found while researching the global-install stage/verb skew. Same
// lightweight tmpCwd()/run() harness as fgos-help.test.mjs -- this verb
// needs no `.fgos/` store (requiresExistingStore: false).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REAL_REPO_ROOT = path.resolve(__dirname, '../..');
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

function tmpCwd() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-version-cli-'));
}

function run(cwd, args) {
  return spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8' });
}

test('fgos version works from a fresh cwd with no .fgos/ store at all', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['version']);
  assert.equal(result.status, 0, result.stderr);
  const envelope = JSON.parse(result.stdout);
  assert.equal(typeof envelope.data.packageVersion, 'string');
  assert.ok(envelope.data.packageVersion.length > 0);
});

test('fgos version reports the current build\'s own verb set, including "plan" but never "decompose" (tsk-403 rename retired the verb, only the stage alias survives)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['version']);
  const { data } = JSON.parse(result.stdout);
  assert.ok(Array.isArray(data.verbs));
  assert.ok(data.verbs.includes('plan'));
  assert.ok(data.verbs.includes('version'));
  assert.ok(!data.verbs.includes('decompose'));
});

test('fgos version reports this checkout\'s own real git commit, not the tmp cwd\'s', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['version']);
  const { data } = JSON.parse(result.stdout);
  const realHead = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
    cwd: REAL_REPO_ROOT,
    encoding: 'utf8',
  }).trim();
  assert.equal(data.gitCommit, realHead);
});
