// The child-process guard: every way to start a child throws inside the hot
// critical section, including a named ESM import linked before hot-lock.mjs
// loaded, and nothing throws outside it.

import { execFileSync, spawnSync, fork, exec } from 'node:child_process';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { withStateTx, hotLockDepth } from '../../src/state/hot-lock.mjs';

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-hot-guard-'));
  const fgosDir = path.join(dir, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  return { fgosDir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

const prefetched = { writer: 'guard-test' };
const isExecUnderHotLock = (err) => err.code === 'exec-under-hot-lock' && /child_process\./.test(err.message);

test('a named execFileSync import throws inside the critical section and works outside', () => {
  const f = fixture();
  try {
    assert.equal(execFileSync(process.execPath, ['-e', 'process.stdout.write("out")'], { encoding: 'utf8' }), 'out');
    withStateTx(f.fgosDir, () => {
      assert.equal(hotLockDepth(), 1);
      assert.throws(() => execFileSync(process.execPath, ['-e', '0']), isExecUnderHotLock);
    }, { prefetched });
    assert.equal(hotLockDepth(), 0);
    assert.equal(execFileSync(process.execPath, ['-e', 'process.stdout.write("again")'], { encoding: 'utf8' }), 'again');
  } finally {
    f.cleanup();
  }
});

test('spawnSync, fork and exec throw inside the critical section', () => {
  const f = fixture();
  try {
    withStateTx(f.fgosDir, () => {
      assert.throws(() => spawnSync(process.execPath, ['-e', '0']), isExecUnderHotLock);
      assert.throws(() => fork(path.join(f.fgosDir, 'no-such-script.mjs')), isExecUnderHotLock);
      assert.throws(() => exec('true'), isExecUnderHotLock);
    }, { prefetched });
    const result = spawnSync(process.execPath, ['-e', '0']);
    assert.equal(result.status, 0);
  } finally {
    f.cleanup();
  }
});

test('the guard keeps util.promisify working on exec outside the critical section', async () => {
  const { stdout } = await promisify(exec)('printf ok');
  assert.equal(stdout, 'ok');
});

test('the error carries the call site stack', () => {
  const f = fixture();
  try {
    withStateTx(f.fgosDir, () => {
      try {
        execFileSync(process.execPath, ['-e', '0']);
        assert.fail('expected the guard to throw');
      } catch (err) {
        assert.match(err.stack, /hot-lock-guard\.test\.mjs/);
      }
    }, { prefetched });
  } finally {
    f.cleanup();
  }
});
