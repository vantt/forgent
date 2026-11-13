// The record of the running version (package version, commit) is what the `cli-version-visible` doctor check reads.
// The `fgos version` verb is a native route: apps/fgos/tests/cli_tests.rs owns its output and its verb list
// through the host; this file owns the record's contents.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { resolveCliVersionInfo } from '../../src/setup/version-info.mjs';

const REAL_REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('the version record carries this build\'s package version without reading a .fgos/ store', () => {
  const info = resolveCliVersionInfo();
  assert.equal(typeof info.packageVersion, 'string');
  assert.ok(info.packageVersion.length > 0);
});

test('the version record reports this checkout\'s own real git commit', () => {
  const realHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REAL_REPO_ROOT, encoding: 'utf8' }).trim();
  assert.equal(resolveCliVersionInfo().gitCommit, realHead.slice(0, 12), 'the first 12 hex digits of the full commit id');
});
