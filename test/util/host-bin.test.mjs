import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveHostBin, invokeHost } from '../../src/util/host-bin.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const BUILT_HOST = path.join(REPO_ROOT, 'target', 'debug', 'fgos');

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
