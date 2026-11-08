import '../helpers/process-tmp-root.mjs';
import { initializeWorkRepository } from '../helpers/work-store-release.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import {
  DOCTOR_CHECKS,
  checkObserveDirWritable,
  checkObserveHostResolvable,
} from '../../src/setup/registrations.mjs';
function mkTempDir() {
  const dir = path.join(tmpdir(), 'fgos-doctor-observe-test-' + Math.random().toString(36).slice(2));
  fs.mkdirSync(dir, { recursive: true });
  initializeWorkRepository(dir);
  return dir;
}

test('observe doctor checks are registered in DOCTOR_CHECKS', () => {
  const ids = DOCTOR_CHECKS.map((c) => c.id);
  assert.ok(ids.includes('observe-dir-writable'));
  assert.ok(ids.includes('observe-host-resolvable'));
});

test('observe-dir-writable passes on an existing directory and on an absent one without creating it', () => {
  const cwd = mkTempDir();
  try {
    const observeDir = path.join(cwd, '.fgos', 'observe');
    fs.rmSync(observeDir, { recursive: true, force: true });
    const absent = checkObserveDirWritable(cwd);
    assert.equal(absent.passed, true);
    assert.match(absent.message, /^info: .*does not exist yet/);
    assert.equal(fs.existsSync(observeDir), false, 'a read-only check never creates the directory');
    fs.mkdirSync(observeDir, { recursive: true });
    const present = checkObserveDirWritable(cwd);
    assert.equal(present.passed, true);
    assert.match(present.message, /is writable/);
    assert.deepEqual(fs.readdirSync(observeDir), [], 'the probe file is removed');
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('observe-host-resolvable verifies host binary status', () => {
  const originalHostBin = process.env.FGOS_HOST_BIN;
  try {
    // 1. Invalid/failing host binary fails
    const dummyScript = path.join(tmpdir(), 'failing-host-bin-' + Math.random().toString(36).slice(2) + '.sh');
    fs.writeFileSync(dummyScript, '#!/bin/sh\nexit 1\n', { mode: 0o755 });
    try {
      process.env.FGOS_HOST_BIN = dummyScript;
      const resUnavailable = checkObserveHostResolvable('/tmp');
      assert.equal(resUnavailable.passed, false);
    } finally {
      if (fs.existsSync(dummyScript)) fs.unlinkSync(dummyScript);
    }

    // 2. Built host binary passes
    const builtHost = path.resolve('target', 'debug', 'fgos');
    if (fs.existsSync(builtHost)) {
      process.env.FGOS_HOST_BIN = builtHost;
      const resPass = checkObserveHostResolvable(process.cwd());
      assert.equal(resPass.passed, true);
      assert.match(resPass.message, /resolved and verified/);
    }
  } finally {
    if (originalHostBin !== undefined) {
      process.env.FGOS_HOST_BIN = originalHostBin;
    } else {
      delete process.env.FGOS_HOST_BIN;
    }
  }
});

test('observe-host-resolvable fails when the host refuses to read the friction store', { skip: !process.env.FGOS_HOST_BIN }, () => {
  const root = fs.mkdtempSync(path.join(tmpdir(), 'fgos-observe-probe-'));
  try {
    assert.equal(checkObserveHostResolvable(root).passed, true);
    const frictionDir = path.join(root, '.fgos', 'observe', 'friction');
    fs.mkdirSync(frictionDir, { recursive: true });
    fs.writeFileSync(path.join(root, 'outside.jsonl'), '{}\n');
    fs.symlinkSync(path.join(root, 'outside.jsonl'), path.join(frictionDir, 'planted.jsonl'));
    const refused = checkObserveHostResolvable(root);
    assert.equal(refused.passed, false);
    assert.match(refused.message, /regular file/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
