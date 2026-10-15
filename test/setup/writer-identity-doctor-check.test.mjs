// writer-identity-doctor-check.test.mjs -- doctor asks each door's host
// binary for the writer identity directly: the running host
// (FGOS_HOST_BIN) and the activation a plain `git commit` hook would use.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { checkWriterIdentityResolvable } from '../../src/setup/registrations.mjs';

const HOST = process.env.FGOS_HOST_BIN;

function workspace(releaseBinBody) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-identity-doctor-')));
  fs.mkdirSync(path.join(root, '.fgos', 'installation'), { recursive: true });
  if (releaseBinBody !== undefined) {
    const release = path.join(root, 'release');
    fs.mkdirSync(path.join(release, 'bin'), { recursive: true });
    fs.writeFileSync(path.join(release, 'bin', 'fgos'), `#!/bin/sh\n${releaseBinBody}\n`, { mode: 0o755 });
    fs.writeFileSync(
      path.join(root, '.fgos', 'installation', 'activation.json'),
      JSON.stringify({ status: 'ready', releasePath: release }),
    );
  }
  return root;
}

function withHostEnv(value, fn) {
  const saved = process.env.FGOS_HOST_BIN;
  if (value === undefined) delete process.env.FGOS_HOST_BIN;
  else process.env.FGOS_HOST_BIN = value;
  try {
    return fn();
  } finally {
    if (saved === undefined) delete process.env.FGOS_HOST_BIN;
    else process.env.FGOS_HOST_BIN = saved;
  }
}

test('passes when both the running host and the activated release answer', (t) => {
  if (process.platform === 'win32') return t.skip('stand-in release binary is a sh script');
  assert.ok(HOST && fs.existsSync(HOST), 'set FGOS_HOST_BIN to a host built from this checkout');
  const root = workspace(`exec "${HOST}" "$@"`);
  const result = withHostEnv(HOST, () => checkWriterIdentityResolvable(root));
  assert.equal(result.passed, true, result.message);
  assert.match(result.message, /current host: .*-> \{"id"/);
  assert.match(result.message, /activation \(git commit hook\): .*release\/bin\/fgos -> \{"id"/);
});

test('fails with a version mismatch when the activated release is older than the running host', (t) => {
  if (process.platform === 'win32') return t.skip('stand-in release binary is a sh script');
  const root = workspace('echo \'fgos: unknown verb "identity". Usage: fgos <command> [args...]\' >&2; exit 4');
  const result = withHostEnv(HOST, () => checkWriterIdentityResolvable(root));
  assert.equal(result.passed, false);
  assert.match(result.message, /activation \(git commit hook\).*host-version-mismatch/);
});

test('fails when no host binary can be found at all', () => {
  const root = workspace();
  const result = withHostEnv(undefined, () => checkWriterIdentityResolvable(root));
  assert.equal(result.passed, false);
  assert.match(result.message, /current host: no host binary/);
});
