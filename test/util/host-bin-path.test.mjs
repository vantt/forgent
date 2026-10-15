// host-bin-path.test.mjs -- the one Node rule for which host binary an
// activated workspace runs (same as the fgctl shim), and the order the
// identity facade looks in.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { hostBinFromActivation, resolveActiveHostBin } from '../../src/util/host-bin-path.mjs';

function tmp(prefix) {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
}

function exe(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, '#!/bin/sh\n', { mode: 0o755 });
  return file;
}

/** A workspace root with a ready activation of a fresh release. */
function workspace(prefix, activation = {}) {
  const root = tmp(prefix);
  const release = path.join(root, 'release');
  const bin = exe(path.join(release, 'bin', 'fgos'));
  fs.mkdirSync(path.join(root, '.fgos', 'installation'), { recursive: true });
  fs.writeFileSync(
    path.join(root, '.fgos', 'installation', 'activation.json'),
    JSON.stringify({ status: 'ready', releasePath: release, ...activation }),
  );
  return { root, bin };
}

function withoutHostEnv(fn) {
  const saved = process.env.FGOS_HOST_BIN;
  delete process.env.FGOS_HOST_BIN;
  try {
    return fn();
  } finally {
    if (saved !== undefined) process.env.FGOS_HOST_BIN = saved;
  }
}

test('hostBinFromActivation follows the shim: ready status, releasePath, bin/fgos', () => {
  const { root, bin } = workspace('fgos-hbp-ready-');
  assert.equal(hostBinFromActivation(path.join(root, '.fgos', 'installation')), bin);
  assert.equal(hostBinFromActivation(path.join(tmp('fgos-hbp-none-'), '.fgos', 'installation')), null);
  const staging = workspace('fgos-hbp-staging-', { status: 'staging' });
  assert.equal(hostBinFromActivation(path.join(staging.root, '.fgos', 'installation')), null);
  const noRelease = workspace('fgos-hbp-norelease-', { releasePath: '' });
  assert.equal(hostBinFromActivation(path.join(noRelease.root, '.fgos', 'installation')), null);
});

test('hostBinFromActivation refuses a binary that escapes the release or is not executable', (t) => {
  if (process.platform === 'win32') return t.skip('symlinks and execute bits are POSIX');
  const escaped = workspace('fgos-hbp-escape-');
  fs.rmSync(escaped.bin);
  fs.symlinkSync(exe(path.join(tmp('fgos-hbp-outside-'), 'sh')), escaped.bin);
  assert.equal(hostBinFromActivation(path.join(escaped.root, '.fgos', 'installation')), null);

  const plain = workspace('fgos-hbp-noexec-');
  fs.chmodSync(plain.bin, 0o644);
  assert.equal(hostBinFromActivation(path.join(plain.root, '.fgos', 'installation')), null);
});

test('resolveActiveHostBin order: FGOS_HOST_BIN, then the activation next to fgosDir, then the nearest above cwd', () => {
  const near = workspace('fgos-hbp-near-');
  const byDir = workspace('fgos-hbp-bydir-');
  const override = exe(path.join(tmp('fgos-hbp-env-'), 'fgos'));
  const cwd = path.join(near.root, 'deep', 'er');
  fs.mkdirSync(cwd, { recursive: true });
  const fgosDir = path.join(byDir.root, '.fgos');

  const saved = process.env.FGOS_HOST_BIN;
  process.env.FGOS_HOST_BIN = override;
  try {
    assert.equal(resolveActiveHostBin({ fgosDir, cwd }).bin, override);
    assert.equal(resolveActiveHostBin({ fgosDir, cwd, ignoreEnv: true }).bin, byDir.bin);
  } finally {
    if (saved === undefined) delete process.env.FGOS_HOST_BIN;
    else process.env.FGOS_HOST_BIN = saved;
  }
  withoutHostEnv(() => {
    assert.equal(resolveActiveHostBin({ fgosDir, cwd }).bin, byDir.bin);
    assert.equal(resolveActiveHostBin({ cwd }).bin, near.bin);
  });
});

test('resolveActiveHostBin reports where it looked when nothing resolves', () => {
  withoutHostEnv(() => {
    const empty = tmp('fgos-hbp-empty-');
    const { bin, tried } = resolveActiveHostBin({ fgosDir: path.join(empty, '.fgos'), cwd: empty });
    assert.equal(bin, null);
    assert.ok(tried.some((entry) => entry.includes(path.join(empty, '.fgos', 'installation', 'activation.json'))), tried.join('\n'));
  });
});
