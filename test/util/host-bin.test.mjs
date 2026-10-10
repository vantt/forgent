import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveHostBin, invokeHost } from '../../src/util/host-bin.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const BUILT_HOST = process.env.FGOS_HOST_BIN || path.join(REPO_ROOT, 'target', 'debug', 'fgos');

test('resolveHostBin prioritizes process.env.FGOS_HOST_BIN', () => {
  const original = process.env.FGOS_HOST_BIN;
  try {
    process.env.FGOS_HOST_BIN = BUILT_HOST;
    const resolved = resolveHostBin(REPO_ROOT);
    assert.equal(resolved, BUILT_HOST);
  } finally {
    if (original !== undefined) {
      process.env.FGOS_HOST_BIN = original;
    } else {
      delete process.env.FGOS_HOST_BIN;
    }
  }
});

test('resolveHostBin returns null when no host is available in empty dir', () => {
  const original = process.env.FGOS_HOST_BIN;
  const originalPkgRoot = process.env.FGOS_PACKAGE_ROOT;
  try {
    delete process.env.FGOS_HOST_BIN;
    // An arbitrary temp directory has no .fgos/installation.
    // Hermetic: specify empty packageRoot via parameter or FGOS_PACKAGE_ROOT env
    // to prevent falling back to developer workstation's .fgos/installation.
    assert.equal(resolveHostBin('/tmp', { packageRoot: '/tmp' }), null);

    process.env.FGOS_PACKAGE_ROOT = '/tmp';
    assert.equal(resolveHostBin('/tmp'), null);
  } finally {
    if (original !== undefined) {
      process.env.FGOS_HOST_BIN = original;
    } else {
      delete process.env.FGOS_HOST_BIN;
    }
    if (originalPkgRoot !== undefined) {
      process.env.FGOS_PACKAGE_ROOT = originalPkgRoot;
    } else {
      delete process.env.FGOS_PACKAGE_ROOT;
    }
  }
});

test('invokeHost runs metrics ping and returns envelope data', () => {
  const original = process.env.FGOS_HOST_BIN;
  try {
    process.env.FGOS_HOST_BIN = BUILT_HOST;
    const data = invokeHost(['metrics', 'ping'], { dir: REPO_ROOT });
    assert.equal(data.ok, true);
    assert.ok(typeof data.root === 'string');
  } finally {
    if (original !== undefined) {
      process.env.FGOS_HOST_BIN = original;
    } else {
      delete process.env.FGOS_HOST_BIN;
    }
  }
});

test('invokeHost throws host-unavailable when host cannot be resolved', () => {
  const original = process.env.FGOS_HOST_BIN;
  const originalPkgRoot = process.env.FGOS_PACKAGE_ROOT;
  try {
    delete process.env.FGOS_HOST_BIN;
    process.env.FGOS_PACKAGE_ROOT = '/tmp';
    assert.throws(
      () => invokeHost(['metrics', 'ping'], { dir: '/tmp', packageRoot: '/tmp' }),
      (err) => err.code === 'host-unavailable'
    );
  } finally {
    if (original !== undefined) {
      process.env.FGOS_HOST_BIN = original;
    } else {
      delete process.env.FGOS_HOST_BIN;
    }
    if (originalPkgRoot !== undefined) {
      process.env.FGOS_PACKAGE_ROOT = originalPkgRoot;
    } else {
      delete process.env.FGOS_PACKAGE_ROOT;
    }
  }
});

test('invokeHost passes 64 KB payload with newlines and brackets through stdin intact', () => {
  const original = process.env.FGOS_HOST_BIN;
  try {
    process.env.FGOS_HOST_BIN = BUILT_HOST;
    // Generate 64 KB of text containing newlines, braces, brackets, quotes
    const chunk = 'Line with [brackets] and {braces} and "quotes"\n';
    const targetSize = 64 * 1024;
    const repeats = Math.ceil(targetSize / chunk.length);
    const payload = chunk.repeat(repeats).slice(0, targetSize);

    const data = invokeHost(['metrics', 'ping'], { input: payload, dir: REPO_ROOT });
    assert.equal(data.ok, true);
    assert.equal(data.stdin_len, targetSize);
    assert.equal(data.stdin_text, payload);
  } finally {
    if (original !== undefined) {
      process.env.FGOS_HOST_BIN = original;
    } else {
      delete process.env.FGOS_HOST_BIN;
    }
  }
});

test('invokeHost recognizes only supported old-host diagnostics', {
  skip: process.platform === 'win32',
}, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-host-bin-old-'));
  const host = path.join(root, 'fgos');
  const original = process.env.FGOS_HOST_BIN;
  try {
    fs.writeFileSync(host, '#!/bin/sh\nprintf \'%s\\n\' \'fgos: unknown verb "convention". Usage: fgos <command> [args...]\' >&2\nexit 4\n', { mode: 0o755 });
    process.env.FGOS_HOST_BIN = host;
    assert.throws(
      () => invokeHost(['convention', 'check', '--all'], { dir: root }),
      (error) => error.code === 'host-version-mismatch' && error.status === 4,
    );

    fs.writeFileSync(host, '#!/bin/sh\nprintf \'%s\\n\' \'fgos: unknown convention subcommand "wat"\' >&2\nexit 4\n', { mode: 0o755 });
    assert.throws(
      () => invokeHost(['convention', 'wat'], { dir: root }),
      (error) => error.code === 'host-exec-error' && error.status === 4,
    );

    fs.writeFileSync(host, '#!/bin/sh\nprintf \'%s\\n\' \'fgos: unknown metrics subcommand "coverage". Available: ping\' >&2\nexit 4\n', { mode: 0o755 });
    assert.throws(
      () => invokeHost(['metrics', 'coverage'], { dir: root }),
      (error) => error.code === 'host-version-mismatch' && error.status === 4,
    );

    fs.writeFileSync(host, '#!/bin/sh\nprintf \'%s\\n\' \'{}\'\n', { mode: 0o755 });
    assert.throws(
      () => invokeHost(['convention', 'check', '--all'], { dir: root }),
      (error) => error.code === 'host-invalid-envelope',
    );
  } finally {
    if (original === undefined) delete process.env.FGOS_HOST_BIN;
    else process.env.FGOS_HOST_BIN = original;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('invokeHost bounds a hung host at five seconds', {
  skip: process.platform === 'win32',
}, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-host-bin-timeout-'));
  const host = path.join(root, 'fgos');
  const original = process.env.FGOS_HOST_BIN;
  try {
    fs.writeFileSync(host, '#!/bin/sh\nexec sleep 10\n', { mode: 0o755 });
    process.env.FGOS_HOST_BIN = host;
    assert.throws(
      () => invokeHost(['convention', 'check', '--all'], { dir: root }),
      (error) => error.code === 'host-exec-error' && error.timedOut === true,
    );
  } finally {
    if (original === undefined) delete process.env.FGOS_HOST_BIN;
    else process.env.FGOS_HOST_BIN = original;
    fs.rmSync(root, { recursive: true, force: true });
  }
});
