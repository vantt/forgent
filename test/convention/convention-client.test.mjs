import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { conventionCheck } from '../../src/convention/convention-client.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BUILT_HOST = process.env.FGOS_HOST_BIN || path.join(REPO_ROOT, 'target', 'debug', 'fgos');

function withHost(host, run) {
  const original = process.env.FGOS_HOST_BIN;
  process.env.FGOS_HOST_BIN = host;
  try {
    return run();
  } finally {
    if (original === undefined) delete process.env.FGOS_HOST_BIN;
    else process.env.FGOS_HOST_BIN = original;
  }
}

test('conventionCheck sends explicit paths to the real native host', () => {
  const data = withHost(BUILT_HOST, () => conventionCheck(
    ['plans/reports/report-261006-x.md'],
    { dir: REPO_ROOT },
  ));
  assert.deepEqual(data, {
    checked: 1,
    violations: [{
      path: 'plans/reports/report-261006-x.md',
      code: 'pattern-mismatch',
      message: 'name does not match an accepted template',
    }],
  });
});

test('conventionCheck all scans only rule-declared scopes through the real host', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-convention-client-'));
  try {
    fs.mkdirSync(path.join(root, 'plans', 'reports'), { recursive: true });
    fs.writeFileSync(path.join(root, 'plans', 'reports', 'report-261006-1415-valid.md'), 'ok');
    fs.writeFileSync(path.join(root, 'plans', 'reports', 'bad.md'), 'bad');
    const data = withHost(BUILT_HOST, () => conventionCheck({ all: true }, { dir: root }));
    assert.equal(data.checked, 2);
    assert.deepEqual(data.violations.map((item) => item.path), ['plans/reports/bad.md']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('conventionCheck maps the exact old-host diagnostic to host-version-mismatch', {
  skip: process.platform === 'win32',
}, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-convention-old-host-'));
  const host = path.join(root, 'fgos');
  try {
    fs.writeFileSync(host, '#!/bin/sh\nprintf \'%s\\n\' \'fgos: unknown verb "convention". Usage: fgos <command> [args...]\' >&2\nexit 4\n', { mode: 0o755 });
    assert.throws(
      () => withHost(host, () => conventionCheck({ all: true }, { dir: root })),
      (error) => error.code === 'host-version-mismatch' && error.status === 4,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
