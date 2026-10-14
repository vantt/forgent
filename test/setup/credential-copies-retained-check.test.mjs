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

const run = (w, now = Date.now()) => checkCredentialCopiesRetained({ runtimeDir: w.runtimeDir, roots: [w.tempRoot], retriedRoots: [w.tempRoot], now });

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
    const result = fixCredentialCopiesRetained({ roots: [w.tempRoot], retriedRoots: [w.tempRoot], stagingRuntimeDir: w.runtimeDir });
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
    assert.match(result.message, /xai\/acct: 6 pending login copies waiting, over the limit of 5 \(the limit drops only copies identical to another/);
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

test('a half-written copy is reported at any age', () => {
  const w = workspace();
  try {
    const now = Date.now();
    const dir = path.join(w.runtimeDir, 'account-locks', 'xai', 'acct', 'torn', `${String(now - 1000).padStart(15, '0')}-abcd`);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'auth.json'), '{"refresh"');
    assert.match(run(w, now).message, /xai\/acct: 1 half-written login copy\(ies\) kept for hand recovery/);
  } finally { w.cleanup(); }
});

function addPendingIn(w, provider, accountId, storeSubdir, stagedAtMs) {
  const dir = path.join(w.runtimeDir, 'account-locks', provider, accountId, storeSubdir, 'pending', `${String(stagedAtMs).padStart(15, '0')}-abcd`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'auth.json'), JSON.stringify({ refresh: FAKE_TOKEN }));
}

const perCliAccount = { credentialSources: { codex: { kind: 'codex-home', home: '/x' }, pi: { kind: 'home-files', home: '/y' } } };
const singleAccount = { credentialSource: { kind: 'codex-home', home: '/x' } };
const runWith = (w, inventory, now = Date.now()) => checkCredentialCopiesRetained({ runtimeDir: w.runtimeDir, roots: [w.tempRoot], retriedRoots: [w.tempRoot], now, inventory });

test('copies left at the account root after the account moved to one login store per CLI are named for hand recovery, never as applied by a dispatch', () => {
  const w = workspace();
  try {
    const now = Date.now();
    addPendingIn(w, 'openai', 'acct', '.', now - 3 * 24 * HOUR);
    const result = runWith(w, { openai: { accounts: { acct: perCliAccount } } }, now);
    assert.equal(result.passed, false, 'no dispatch will ever apply them, so the owner has to act');
    const root = path.join(w.runtimeDir, 'account-locks', 'openai', 'acct');
    assert.match(result.message, /openai\/acct: 1 login copy\(ies\) that no dispatch applies/);
    assert.ok(result.message.includes(`at ${root} `), 'the stranded directory is named');
    assert.match(result.message, /recover the login from them by hand/);
    assert.equal(result.message.includes('a dispatch for that account applies them'), false);
    assert.equal(result.message.includes(FAKE_TOKEN), false);
  } finally { w.cleanup(); }
});

test('copies under stores/<cli> after the account went back to one login store are named for hand recovery', () => {
  const w = workspace();
  try {
    const now = Date.now();
    addPendingIn(w, 'openai', 'acct', 'stores/pi', now - 3 * 24 * HOUR);
    const result = runWith(w, { openai: { accounts: { acct: singleAccount } } }, now);
    assert.equal(result.passed, false);
    assert.ok(result.message.includes(`at ${path.join(w.runtimeDir, 'account-locks', 'openai', 'acct', 'stores', 'pi')} `));
    assert.equal(result.message.includes('a dispatch for that account applies them'), false);
  } finally { w.cleanup(); }
});

test('copies in a login store the inventory still uses keep the waiting-for-renewal wording', () => {
  const w = workspace();
  try {
    const now = Date.now();
    addPendingIn(w, 'openai', 'acct', 'stores/pi', now - 3 * 24 * HOUR);
    const result = runWith(w, { openai: { accounts: { acct: perCliAccount } } }, now);
    assert.equal(result.passed, true);
    assert.match(result.message, /openai\/acct: 1 pending login copy\(ies\) waiting for a renewal \(a dispatch for that account applies them\)/);
  } finally { w.cleanup(); }
});

test('copies of an account the inventory no longer lists are named for hand recovery', () => {
  const w = workspace();
  try {
    const now = Date.now();
    addPendingIn(w, 'openai', 'gone', '.', now - 3 * 24 * HOUR);
    const result = runWith(w, { openai: { accounts: { acct: singleAccount } } }, now);
    assert.equal(result.passed, false);
    assert.match(result.message, /openai\/gone: 1 login copy\(ies\) that no dispatch applies/);
  } finally { w.cleanup(); }
});

test('without a readable inventory the layout is not judged and the copies keep the waiting wording', () => {
  const w = workspace();
  try {
    const now = Date.now();
    addPendingIn(w, 'openai', 'acct', 'stores/pi', now - 3 * 24 * HOUR);
    const result = runWith(w, undefined, now);
    assert.equal(result.passed, true);
    assert.match(result.message, /a dispatch for that account applies them/);
  } finally { w.cleanup(); }
});

// A process id above the kernel's limit: signalling it always says "no such process".
function deadPid() {
  let max = 4194304;
  try { max = Number(fs.readFileSync('/proc/sys/kernel/pid_max', 'utf8')); } catch { /* the usual limit */ }
  return max + 1;
}

function addStaging(dir, name, content) {
  const target = path.join(dir, 'pending', name);
  fs.mkdirSync(target, { recursive: true });
  if (content !== undefined) fs.writeFileSync(path.join(target, 'auth.json'), content);
  const longAgo = (Date.now() - 3 * HOUR) / 1000;
  for (const entry of fs.readdirSync(target)) fs.utimesSync(path.join(target, entry), longAgo, longAgo);
  fs.utimesSync(target, longAgo, longAgo);
  return target;
}

test('an interrupted staging is reported with its own wording, and the fix removes only one that is provably not needed', () => {
  const w = workspace();
  try {
    const accountDir = path.join(w.runtimeDir, 'account-locks', 'xai', 'acct');
    addPendingIn(w, 'xai', 'acct', '.', Date.now() - 3 * HOUR);
    const pendingName = fs.readdirSync(path.join(accountDir, 'pending'))[0];
    fs.writeFileSync(path.join(accountDir, 'pending', pendingName, 'auth.json'), FAKE_TOKEN);
    const same = addStaging(accountDir, `.tmp-${deadPid()}-same`, FAKE_TOKEN);
    const only = addStaging(accountDir, `.tmp-${deadPid()}-only`, 'ONLY-COPY-BYTES');
    const before = run(w);
    assert.match(before.message, /xai\/acct: 2 interrupted staging\(s\)/);
    assert.equal(before.message.includes(FAKE_TOKEN), false);
    assert.equal(before.message.includes('ONLY-COPY-BYTES'), false);
    const fixed = fixCredentialCopiesRetained({ roots: [w.tempRoot], retriedRoots: [w.tempRoot], stagingRuntimeDir: w.runtimeDir });
    assert.equal(fixed.changed, true);
    assert.match(fixed.message, /interrupted staging\(s\): 1 removed, 1 kept/);
    assert.equal(fs.existsSync(same), false);
    assert.equal(fs.existsSync(only), true);
    assert.match(run(w).message, /xai\/acct: 1 interrupted staging\(s\)/);
  } finally { w.cleanup(); }
});

test('a staging in a store the account layout no longer reads is reported once, in the hand-recovery row, and the fix leaves it', () => {
  const w = workspace();
  try {
    const accountDir = path.join(w.runtimeDir, 'account-locks', 'openai', 'acct');
    const staging = addStaging(accountDir, `.tmp-${deadPid()}-stranded`);
    const inventory = { openai: { accounts: { acct: perCliAccount } } };
    const result = runWith(w, inventory);
    assert.equal(result.passed, false);
    assert.match(result.message, /openai\/acct: 1 login copy\(ies\) that no dispatch applies/);
    assert.equal(result.message.includes('interrupted staging'), false, 'not a second row for the same directory');
    assert.equal(result.message.split(';').filter((row) => row.includes('openai/acct')).length, 1);
    const fixed = fixCredentialCopiesRetained({ roots: [w.tempRoot], retriedRoots: [w.tempRoot], stagingRuntimeDir: w.runtimeDir, inventory });
    assert.equal(fixed.changed, false);
    assert.equal(fs.existsSync(staging), true);
  } finally { w.cleanup(); }
});

test('the fix reads each store through the inventory: a staging the source login proves no newer is removed, one whose store has no source stays', () => {
  const w = workspace();
  try {
    const source = path.join(w.tmp, 'source-home');
    fs.mkdirSync(source, { recursive: true });
    const doc = (expires, refresh) => JSON.stringify({ 'x-ai': { type: 'oauth', access: 'FAKE-ACCESS', refresh, expires } });
    fs.writeFileSync(path.join(source, 'auth.json'), doc(Date.now() + 6 * HOUR, 'FAKE-REFRESH-A'));
    const accountDir = path.join(w.runtimeDir, 'account-locks', 'xai', 'acct');
    const older = addStaging(accountDir, `.tmp-${deadPid()}-older`, doc(Date.now() + HOUR, 'FAKE-REFRESH-A'));
    const inventory = { xai: { accounts: { acct: { credentialSource: { kind: 'home-files', home: source, files: ['auth.json'] } } } } };
    // A second account whose store has no source login the sweep can read (an unknown layout): the same
    // staging, judged by nothing, stays.
    const otherDir = path.join(w.runtimeDir, 'account-locks', 'xai', 'other');
    const noSource = addStaging(otherDir, `.tmp-${deadPid()}-older`, doc(Date.now() + HOUR, 'FAKE-REFRESH-A'));
    inventory.xai.accounts.other = { credentialSource: { kind: 'home-files', home: source, files: ['other.json'] } };
    const fixed = fixCredentialCopiesRetained({ roots: [w.tempRoot], retriedRoots: [w.tempRoot], stagingRuntimeDir: w.runtimeDir, inventory });
    assert.equal(fs.existsSync(older), false, fixed.message);
    assert.equal(fs.existsSync(noSource), true, 'a store with no source login to judge by keeps its staging');
  } finally { w.cleanup(); }
});

test('an over-limit store is named by its CLI in the doctor line', () => {
  const w = workspace();
  try {
    const storeDir = path.join(w.runtimeDir, 'account-locks', 'openai', 'acct', 'stores', 'codex', 'pending');
    for (let i = 0; i < 6; i += 1) fs.mkdirSync(path.join(storeDir, `${String(1000 + i).padStart(15, '0')}-copy`), { recursive: true });
    assert.match(run(w).message, /openai\/acct \(store codex\): 6 pending login copies waiting, over the limit/);
  } finally { w.cleanup(); }
});

test('a kept home under a root nothing retries is held at once: doctor fails naming it, never says it is retried, and the fix settles it', () => {
  const w = workspace();
  try {
    const scanOnly = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-scan-only-root-'));
    try {
      const retried = addKeptHome(w, 'disp_retried', 1);
      const dir = path.join(scanOnly, 'disp_scan_only', 'home');
      fs.mkdirSync(dir, { recursive: true });
      writeOwnershipMarker(dir, { dispatchId: 'disp_scan_only' });
      extendOwnershipMarker(dir, {
        credentialWriteBack: { provider: 'xai', accountId: 'acct', home: path.join(w.tmp, 'secret-source-home'), layout: 'pi-auth-json', runtimeDir: w.runtimeDir },
        credentialKept: { attempts: 1, since: new Date(Date.now() - HOUR).toISOString() },
      });
      const args = { runtimeDir: w.runtimeDir, roots: [w.tempRoot, scanOnly], retriedRoots: [w.tempRoot] };
      const result = checkCredentialCopiesRetained(args);
      assert.equal(result.passed, false);
      assert.ok(result.message.includes(dir), 'the home under the scan-only root is named');
      assert.match(result.message, /under a root that nothing retries by itself/);
      assert.equal(result.message.includes(retried), false, 'the home a reaper retries is still only a note');
      assert.equal(result.message.split('retried by the reaper').length - 1, 1, 'the wording is kept for the one home a reaper does retry');
      const fixed = fixCredentialCopiesRetained({ ...args, stagingRuntimeDir: w.runtimeDir });
      assert.equal(fs.existsSync(dir), false, 'the fix settles it (no store file inside: nothing to keep)');
      assert.equal(fs.existsSync(retried), true, 'a home that is only being retried is left to its reaper');
      assert.equal(fixed.changed, true);
    } finally { fs.rmSync(scanOnly, { recursive: true, force: true }); }
  } finally { w.cleanup(); }
});

test('a home reachable through two spellings of one root is counted once', () => {
  const w = workspace();
  try {
    addKeptHome(w, 'disp_twice', CREDENTIAL_KEEP_MAX_ATTEMPTS);
    const result = checkCredentialCopiesRetained({ runtimeDir: w.runtimeDir, roots: [w.tempRoot, `${w.tempRoot}/`], retriedRoots: [w.tempRoot] });
    assert.equal(result.message.split('private home held').length - 1, 1);
    const fixed = fixCredentialCopiesRetained({ roots: [w.tempRoot, `${w.tempRoot}/`], retriedRoots: [w.tempRoot], stagingRuntimeDir: w.runtimeDir });
    assert.match(fixed.message, /re-checked 1 held private home/);
  } finally { w.cleanup(); }
});
