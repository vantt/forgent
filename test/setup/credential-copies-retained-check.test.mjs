import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { checkCredentialCopiesRetained } from '../../src/setup/registrations.mjs';
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
    assert.equal(result.passed, false);
    assert.match(result.message, /xai\/acct: 2 pending login copy\(ies\) waiting for a renewal, oldest 30d/);
    assert.equal(result.message.includes('young'), false);
  } finally { w.cleanup(); }
});

test('a held home fails the check, a home still being retried is only noted, and nothing leaks a path or a value', () => {
  const w = workspace();
  try {
    addKeptHome(w, 'disp_held', CREDENTIAL_KEEP_MAX_ATTEMPTS);
    const held = run(w);
    assert.equal(held.passed, false);
    assert.match(held.message, /xai\/acct: 1 private home\(s\) held after repeated staging failures/);
    assert.match(held.message, /oldest 2d/);
    for (const secret of [FAKE_TOKEN, w.tmp, 'secret-source-home']) assert.equal(held.message.includes(secret), false);

    fs.rmSync(path.join(w.tempRoot, 'disp_held'), { recursive: true, force: true });
    addKeptHome(w, 'disp_retry', 1);
    const retrying = run(w);
    assert.equal(retrying.passed, true);
    assert.match(retrying.message, /1 private home\(s\) kept after a staging failure, retried by the reaper/);
  } finally { w.cleanup(); }
});
