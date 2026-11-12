// The build's own version record (package version, commit, verb set) is what the `cli-version-visible` doctor check
// and the host's `version` verb read. The `fgos version` verb itself is a native route (apps/fgos/tests/cli_tests.rs
// owns its output through the host); this file owns the record's contents.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { resolveCliVersionInfo } from '../../src/cli/version.mjs';

const REAL_REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('the version record carries this build\'s package version without reading a .fgos/ store', () => {
  const info = resolveCliVersionInfo();
  assert.equal(typeof info.packageVersion, 'string');
  assert.ok(info.packageVersion.length > 0);
});

test('the version record lists the current verb set, including "plan" but never "decompose" (tsk-403 rename retired the verb, only the stage alias survives)', () => {
  const { verbs } = resolveCliVersionInfo();
  assert.ok(Array.isArray(verbs));
  assert.ok(verbs.includes('plan'));
  assert.ok(verbs.includes('version'));
  assert.ok(!verbs.includes('decompose'));
});

test('the version record reports this checkout\'s own real git commit', () => {
  const realHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REAL_REPO_ROOT, encoding: 'utf8' }).trim();
  assert.equal(resolveCliVersionInfo().gitCommit, realHead.slice(0, 12), 'the first 12 hex digits of the full commit id');
});
