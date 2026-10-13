// A release install is not a git checkout: resolving its version must report no
// commit and print nothing, so `fgos version` and `fgos doctor` do not show
// git's "fatal: not a git repository" to the person running them.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const VERSION_MODULE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'cli', 'version.mjs');

test('resolving the version of an install that is not a git checkout prints nothing and reports no commit', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-version-nogit-'));
  try {
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'x', version: '9.9.9' }));
    const script = `import { resolveCliVersionInfo } from ${JSON.stringify(VERSION_MODULE)};
      const info = resolveCliVersionInfo({ packageRoot: ${JSON.stringify(root)} });
      process.stdout.write(JSON.stringify({ v: info.packageVersion, c: info.gitCommit }));`;
    const result = spawnSync(process.execPath, ['--input-type=module', '--eval', script], {
      encoding: 'utf8',
      env: { ...process.env, GIT_CEILING_DIRECTORIES: path.dirname(root) },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, '');
    assert.deepEqual(JSON.parse(result.stdout), { v: '9.9.9', c: null });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
