// The holder-lock doctor checks on Windows, against a temp workspace and the
// real host binary (FGOS_HOST_BIN): the guarantee reads lockfileex/kernel, the
// two-process probe runs over the lock-hold transport, and the borrow vectors
// run. Needs win32.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveActiveHostBin } from '../../src/util/host-bin-path.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { bin: HOST_BIN } = resolveActiveHostBin({ fgosDir: path.join(root, '.fgos') });
const SKIP = process.platform !== 'win32'
  ? 'the Windows doctor path runs on win32 only'
  : (HOST_BIN ? false : 'no fgos host binary: set FGOS_HOST_BIN to a host built from this checkout');

// Every machine lock lives under a private state root; children inherit it.
const stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-windows-doctor-state-'));
process.env.FGOS_STATE_ROOT = stateRoot;
const { checkLockKernelSemantics, checkLockBorrowVectors, checkLockHolders, fixLockDirs } = await import('../../src/setup/holder-lock-checks.mjs');

function workspace() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-windows-doctor-'));
  fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
  return dir;
}

test('lock-kernel-semantics reports lockfileex/kernel with a green probe', { skip: SKIP }, async () => {
  const dir = workspace();
  try {
    fixLockDirs(dir);
    const res = await checkLockKernelSemantics(dir);
    assert.equal(res.passed, true, res.message);
    assert.doesNotMatch(res.message, /^warning:/);
    assert.match(res.message, /"driver":"lockfileex","exclusion":"kernel"/);
    assert.match(res.message, /two-process probe green/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('lock-borrow-vectors runs on Windows and passes', { skip: SKIP }, () => {
  const dir = workspace();
  try {
    const res = checkLockBorrowVectors(dir);
    assert.equal(res.passed, true, res.message);
    assert.match(res.message, /^all 4 vectors and the sibling check green/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('lock-holders passes on a fresh workspace', { skip: SKIP }, () => {
  const dir = workspace();
  try {
    fixLockDirs(dir);
    const res = checkLockHolders(dir);
    assert.equal(res.passed, true, res.message);
    assert.doesNotMatch(res.message, /^warning:/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
