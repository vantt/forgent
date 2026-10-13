import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { checkCredentialCopiesRetained, fixCredentialCopiesRetained, checkConfinementOrphanedResourcesReaped } from '../../src/setup/registrations.mjs';
import { extendOwnershipMarker, writeOwnershipMarker, CREDENTIAL_KEEP_MAX_ATTEMPTS } from '../../src/runner/dispatch/confinement/cleanup.mjs';

const HOUR = 60 * 60 * 1000;
const FAKE_TOKEN = 'FAKE-REFRESH-TOKEN-DO-NOT-PRINT';

function workspace() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-cred-doctor-'));
  const runtimeDir = path.join(tmp, 'runtime');
  const tempRoot = path.join(tmp, 'fgos-confinement');
  fs.mkdirSync(runtimeDir, { recursive: true });
  fs.mkdirSync(tempRoot, { recursive: true });
  return { tmp, runtimeDir, tempRoot, cleanup: () => fs.rmSync(tmp, { recursive: true, force: true }) };
}

function addPending(w, provider, accountId, stagedAtMs) {
  const dir = path.join(w.runtimeDir, 'account-locks', provider, accountId, 'pending', `${String(stagedAtMs).padStart(15, '0')}-abcd`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'auth.json'), JSON.stringify({ refresh: FAKE_TOKEN }));
}

function addKeptHome(w, dispatchId, attempts, { provider = 'xai', accountId = 'acct' } = {}) {
  const dir = path.join(w.tempRoot, dispatchId, 'home');
  fs.mkdirSync(dir, { recursive: true });
  writeOwnershipMarker(dir, { dispatchId });
  extendOwnershipMarker(dir, {
    credentialWriteBack: { provider, accountId, home: path.join(w.tmp, 'secret-source-home'), layout: 'pi-auth-json', runtimeDir: w.runtimeDir },
    credentialKept: { attempts, since: new Date(Date.now() - 50 * HOUR).toISOString() },
  });
  return dir;
}

const run = (w, now = Date.now()) => checkCredentialCopiesRetained({ runtimeDir: w.runtimeDir, roots: [w.tempRoot], now });

test('a clean machine passes', () => {
  const w = workspace();
  try {
    assert.equal(run(w).passed, true);
  } finally { w.cleanup(); }
});

test('a pending copy that has sat for a day is reported by provider, account and age, and a young one is not', () => {
  const w = workspace();
  try {
    const now = Date.now();
    addPending(w, 'xai', 'acct', now - 3 * 24 * HOUR);
    addPending(w, 'xai', 'acct', now - 30 * 24 * HOUR);
    addPending(w, 'codex', 'young', now - HOUR);
    const result = run(w, now);
    assert.equal(result.passed, true, 'copies waiting for a renewal only warn');
    assert.match(result.message, /^warning: /);
    assert.match(result.message, /xai\/acct: 2 pending login copy\(ies\) waiting for a renewal \(a dispatch for that account applies them\), oldest 30d/);
    assert.equal(result.message.includes('young'), false);
  } finally { w.cleanup(); }
});

test('a held home fails the check, a home still being retried is only noted, and nothing leaks a path or a value', () => {
  const w = workspace();
  try {
    addKeptHome(w, 'disp_held', CREDENTIAL_KEEP_MAX_ATTEMPTS);
    const held = run(w);
    assert.equal(held.passed, false);
    assert.match(held.message, /xai\/acct: private home held after repeated staging failures, 2d old, at /);
    assert.equal(held.message.includes(path.join(w.tempRoot, 'disp_held', 'home')), true, 'the home is named');
    assert.match(held.message, /doctor --fix/);
    for (const secret of [FAKE_TOKEN, 'secret-source-home']) assert.equal(held.message.includes(secret), false);

    fs.rmSync(path.join(w.tempRoot, 'disp_held'), { recursive: true, force: true });
    addKeptHome(w, 'disp_retry', 1);
    const retrying = run(w);
    assert.equal(retrying.passed, true);
    assert.match(retrying.message, /^warning: /);
    assert.match(retrying.message, /1 private home\(s\) kept after a staging failure, retried by the reaper/);
  } finally { w.cleanup(); }
});

test('the orphan count skips a held home owned by a dead process but still counts a home that is only being retried', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-cred-orphan-'));
  const previousTmp = process.env.TMPDIR;
  process.env.TMPDIR = base;
  try {
    const w = { tmp: base, runtimeDir: path.join(base, 'runtime'), tempRoot: path.join(base, 'fgos-confinement') };
    fs.mkdirSync(w.tempRoot, { recursive: true, mode: 0o700 });
    const deadPid = 2 ** 22 + 12345;
    const held = addKeptHome(w, 'disp_held', CREDENTIAL_KEEP_MAX_ATTEMPTS);
    extendOwnershipMarker(held, { pid: deadPid });
    assert.equal(checkConfinementOrphanedResourcesReaped().passed, true, 'a held home is reported by its own check, not as an orphan');

    const retrying = addKeptHome(w, 'disp_retry', 1);
    extendOwnershipMarker(retrying, { pid: deadPid });
    const result = checkConfinementOrphanedResourcesReaped();
    assert.equal(result.passed, false);
    assert.match(result.message, /1 confinement resource dir\(s\) owned by a dead process/);
  } finally {
    if (previousTmp === undefined) delete process.env.TMPDIR; else process.env.TMPDIR = previousTmp;
    fs.rmSync(base, { recursive: true, force: true });
  }
});

test('the fix re-checks held homes: one whose login is gone is removed, one that cannot be judged stays', () => {
  const w = workspace();
  try {
    const gone = addKeptHome(w, 'disp_gone', CREDENTIAL_KEEP_MAX_ATTEMPTS); // no store file inside: nothing to keep
    const stuck = addKeptHome(w, 'disp_stuck', CREDENTIAL_KEEP_MAX_ATTEMPTS);
    extendOwnershipMarker(stuck, { credentialWriteBack: { provider: '../bad', accountId: 'acct' } });
    const result = fixCredentialCopiesRetained({ roots: [w.tempRoot] });
    assert.equal(result.changed, true);
    assert.match(result.message, /1 removed, 1 still held/);
    assert.equal(fs.existsSync(gone), false);
    assert.equal(fs.existsSync(stuck), true);
  } finally { w.cleanup(); }
});

test('an account with more pending copies than the limit is reported, even when they are young', () => {
  const w = workspace();
  try {
    const now = Date.now();
    for (let i = 0; i < 6; i += 1) addPending(w, 'xai', 'acct', now - i * 1000);
    addPending(w, 'codex', 'other', now - 1000);
    const result = run(w, now);
    assert.equal(result.passed, true, 'a warning, not a failure');
    assert.match(result.message, /^warning: /);
    assert.match(result.message, /xai\/acct: 6 pending login copies, over the limit of 5: none could be shown redundant or obsolete, so none was dropped/);
    assert.equal(result.message.includes('codex/other'), false);
    assert.equal(result.message.includes(FAKE_TOKEN), false);
  } finally { w.cleanup(); }
});

test('a half-written copy kept for hand recovery is reported as such', () => {
  const w = workspace();
  try {
    const now = Date.now();
    const dir = path.join(w.runtimeDir, 'account-locks', 'xai', 'acct', 'torn', `${String(now - 3 * 24 * HOUR).padStart(15, '0')}-abcd`);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'auth.json'), `{"refresh": "${FAKE_TOKEN}`);
    const result = run(w, now);
    assert.equal(result.passed, true);
    assert.match(result.message, /xai\/acct: 1 half-written login copy\(ies\) kept for hand recovery \(never applied or dropped automatically\), oldest 3d/);
    assert.equal(result.message.includes(FAKE_TOKEN), false);
  } finally { w.cleanup(); }
});
