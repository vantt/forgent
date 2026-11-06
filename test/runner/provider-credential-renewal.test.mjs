import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';

import {
  CODEX_REFRESH_INTERVAL_MS,
  applyRenewedCredential,
  copyCredentialFiles,
  credentialLayout,
  credentialWriteBackTarget,
  defaultRefreshAheadThresholdMs,
  readCredentialExpiry,
  refreshAhead,
  writeBackRenewedCredential,
  inspectRetainedCredentialCopies,
  inspectPendingCopiesOverLimit,
  sweepInterruptedStagings,
  STAGING_MIN_AGE_MS,
} from '../../src/runner/dispatch/provider-credential-renewal.mjs';
import {
  providerAccountDir,
  tryAcquireAccountLock,
} from '../../src/runner/dispatch/provider-capacity.mjs';
import {
  removeConfinementDir,
  OWNERSHIP_MARKER_FILE,
  cleanupConfinementResource,
  writeOwnershipMarker,
} from '../../src/runner/dispatch/confinement/cleanup.mjs';
import { prepareBwrap, prepareBwrapSync } from '../../src/runner/dispatch/confinement/drivers/bwrap.mjs';
import { resolveConfinementResources } from '../../src/runner/dispatch/confinement/resources.mjs';
import { finalizeAttemptHome } from '../../src/runner/dispatch/confinement/authority.mjs';
import { CREDENTIAL_KEEP_MAX_ATTEMPTS, CREDENTIAL_KEEP_MIN_INTERVAL_MS } from '../../src/runner/dispatch/confinement/cleanup.mjs';
import { fixCredentialCopiesRetained } from '../../src/setup/registrations.mjs';
import { rewriteOwnershipMarker } from '../helpers/ownership-marker.mjs';

// The account lock is machine-scoped under the state root: a private root keeps this file's locks off
// the machine's real ones, and every child process started below inherits it.
process.env.FGOS_STATE_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-renewal-state-root-'));
const PROVIDER_CAPACITY_URL = pathToFileURL(path.resolve(import.meta.dirname, '../../src/runner/dispatch/provider-capacity.mjs')).href;

// Every token below is an obviously fake string. The tests never touch a real store or a real CLI: the
// call is an injected spawn that rewrites the scratch home the way a real CLI would after a renewal.

const HOUR = 60 * 60 * 1000;
const FAKE = {
  oldAccess: 'FAKE-OLD-ACCESS-TOKEN-0001',
  oldRefresh: 'FAKE-OLD-REFRESH-TOKEN-0001',
  newAccess: 'FAKE-NEW-ACCESS-TOKEN-0002',
  newRefresh: 'FAKE-NEW-REFRESH-TOKEN-0002',
  other: 'FAKE-OTHER-ENTRY-TOKEN-0003',
};
const FAKE_FRAGMENTS = Object.values(FAKE);

function workspace() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-renewal-'));
  const runtimeDir = path.join(tmp, 'runtime');
  const home = path.join(tmp, 'home');
  fs.mkdirSync(home, { recursive: true });
  return { tmp, runtimeDir, home, accountDir: providerAccountDir(runtimeDir, 'xai', 'acct'), cleanup: () => fs.rmSync(tmp, { recursive: true, force: true }) };
}

const b64 = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const fakeJwt = (expMs, marker = 'x', claims = {}) => `${b64({ alg: 'none' })}.${b64({ exp: Math.floor(expMs / 1000), marker, ...claims })}.FAKE-SIGNATURE`;
// The ChatGPT account claim a Codex access token carries.
const codexAccountClaim = (account) => ({ 'https://api.openai.com/auth': { chatgpt_account_id: account } });

// pi: auth.json keyed by provider id
const piDoc = (expiresMs, { access = FAKE.oldAccess, refresh = FAKE.oldRefresh, accountId } = {}) => ({
  xai: { type: 'oauth', access, refresh, expires: expiresMs, ...(accountId ? { accountId } : {}) },
  openrouter: { type: 'api_key', key: FAKE.other },
});
const writePi = (dir, doc) => { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'auth.json'), `${JSON.stringify(doc, null, 2)}\n`); };
const readPi = (dir) => JSON.parse(fs.readFileSync(path.join(dir, 'auth.json'), 'utf8'));
const piSource = (home) => ({ kind: 'home-files', home, files: ['auth.json'] });

// codex: auth.json with tokens + last_refresh
const codexDoc = (expMs, lastRefreshMs, tag = 'old') => ({
  auth_mode: 'chatgpt',
  tokens: { access_token: fakeJwt(expMs, tag), refresh_token: `FAKE-CODEX-REFRESH-${tag}`, id_token: 'FAKE-ID' },
  last_refresh: new Date(lastRefreshMs).toISOString(),
  extra: 'kept',
});
const writeCodex = (dir, doc) => { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'auth.json'), JSON.stringify(doc)); };
const readCodex = (dir) => JSON.parse(fs.readFileSync(path.join(dir, 'auth.json'), 'utf8'));
const codexSource = (home) => ({ kind: 'codex-home', home });

// omp: agent.db with auth_credentials
function writeOmp(dir, rows, { wal = false } = {}) {
  fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(path.join(dir, 'agent.db'));
  if (wal) db.exec('PRAGMA journal_mode = WAL');
  db.exec('CREATE TABLE IF NOT EXISTS auth_credentials (id INTEGER PRIMARY KEY, provider TEXT NOT NULL, credential_type TEXT NOT NULL, data TEXT NOT NULL, disabled_cause TEXT, updated_at INTEGER, note TEXT)');
  for (const row of rows) {
    db.prepare('INSERT INTO auth_credentials (id, provider, credential_type, data, disabled_cause, updated_at, note) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(row.id, row.provider ?? 'xai', row.type ?? 'oauth', JSON.stringify(row.data), row.disabled ?? null, row.updatedAt ?? 1, row.note ?? 'n');
  }
  return db;
}
const ompData = (expires, { access = FAKE.oldAccess, refresh = FAKE.oldRefresh } = {}) => ({ access, refresh, expires });
function readOmpRows(dir) {
  const db = new DatabaseSync(path.join(dir, 'agent.db'), { readOnly: true });
  try { return db.prepare('SELECT * FROM auth_credentials ORDER BY id').all().map((r) => ({ ...r })); } finally { db.close(); }
}
const ompSource = (home) => ({ kind: 'home-files', home, files: ['agent.db'] });

// claude: .claude/.credentials.json under the home, claudeAiOauth with expiresAt in ms
const CLAUDE_LOGIN = path.join('.claude', '.credentials.json');
const claudeDoc = (expiresMs, { access = FAKE.oldAccess, refresh = FAKE.oldRefresh } = {}) => ({
  claudeAiOauth: { accessToken: access, refreshToken: refresh, expiresAt: expiresMs, scopes: ['user:inference'], subscriptionType: 'max' },
  mcpOAuth: { kept: true },
});
const writeClaude = (dir, doc) => { fs.mkdirSync(path.join(dir, '.claude'), { recursive: true }); fs.writeFileSync(path.join(dir, CLAUDE_LOGIN), JSON.stringify(doc)); };
const readClaude = (dir) => JSON.parse(fs.readFileSync(path.join(dir, CLAUDE_LOGIN), 'utf8'));
const claudeSource = (home) => ({ kind: 'home-files', home, files: [CLAUDE_LOGIN] });

// What a real CLI does to the home it is pointed at once it decides the login is due: a new token pair
// and a later expiry, written back to the same store.
function renewHome(layoutName, dir, { expiresMs = Date.now() + 6 * HOUR } = {}) {
  if (layoutName === 'pi') {
    const doc = readPi(dir);
    doc.xai = { ...doc.xai, access: FAKE.newAccess, refresh: FAKE.newRefresh, expires: expiresMs };
    writePi(dir, doc);
  } else if (layoutName === 'codex') {
    writeCodex(dir, codexDoc(expiresMs, Date.now(), 'new'));
  } else if (layoutName === 'claude') {
    const doc = readClaude(dir);
    doc.claudeAiOauth = { ...doc.claudeAiOauth, accessToken: FAKE.newAccess, refreshToken: FAKE.newRefresh, expiresAt: expiresMs };
    writeClaude(dir, doc);
  } else {
    const db = new DatabaseSync(path.join(dir, 'agent.db'));
    db.prepare("UPDATE auth_credentials SET data = ? WHERE credential_type = 'oauth' AND id = 1").run(JSON.stringify(ompData(expiresMs, { access: FAKE.newAccess, refresh: FAKE.newRefresh })));
    db.close();
  }
}

// An injected spawn. `behaviour(plan, homeDir)` runs when the "CLI" starts; `delayMs` is how long the
// call takes. It records every start so a test can count the renewals.
function fakeSpawn({ layoutName, behaviour, output = 'OK', exitCode = 0, delayMs = 0, onStart } = {}) {
  const starts = [];
  const spawnFn = (command, args, options) => {
    const homeDir = options.env.PI_CODING_AGENT_DIR ?? options.env.CODEX_HOME ?? options.env.HOME;
    starts.push({ command, args, homeDir, pid: 424242 + starts.length });
    onStart?.(homeDir);
    const child = new EventEmitter();
    child.pid = 424242 + starts.length - 1;
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    setTimeout(() => {
      if (behaviour) behaviour(homeDir);
      else renewHome(layoutName, homeDir);
      child.stdout.emit('data', output);
      child.emit('close', exitCode);
    }, delayMs);
    return child;
  };
  return { spawnFn, starts };
}

const siblings = (dir) => fs.readdirSync(dir).sort();
const sha = (file) => fs.readFileSync(file, 'utf8');

// ---------------------------------------------------------------------------------------------------
// Expiry per layout
// ---------------------------------------------------------------------------------------------------

test('the layout is named from the credential source, omp before pi', () => {
  assert.equal(credentialLayout({ kind: 'codex-home', home: '/h' }), 'codex-auth-json');
  assert.equal(credentialLayout({ kind: 'home-files', home: '/h', files: ['auth.json'] }), 'pi-auth-json');
  assert.equal(credentialLayout({ kind: 'home-files', home: '/h', files: ['auth.json', 'agent.db'] }), 'omp-agent-db');
  assert.equal(credentialLayout({ kind: 'home-files', home: '/h', files: ['.gemini/token'] }), null);
});

test('pi expiry: oauth entries only, seconds are read as seconds, an API key alone is unreadable', () => {
  const w = workspace();
  try {
    const now = Date.now();
    writePi(w.home, { ...piDoc(now + HOUR), second: { type: 'oauth', access: 'x', refresh: 'y', expires: Math.floor((now + 2 * HOUR) / 1000) } });
    const read = readCredentialExpiry('pi-auth-json', w.home);
    assert.equal(read.ok, true);
    assert.deepEqual(read.entries.map((e) => e.key).sort(), ['second', 'xai']);
    assert.equal(read.entries.find((e) => e.key === 'second').expiresMs, Math.floor((now + 2 * HOUR) / 1000) * 1000);
    assert.equal(read.entries.some((e) => 'value' in e), false, 'no entry value leaves the reader');

    writePi(w.home, { openrouter: { type: 'api_key', key: FAKE.other } });
    assert.deepEqual(readCredentialExpiry('pi-auth-json', w.home), { ok: false, code: 'unexpected-shape' });
  } finally { w.cleanup(); }
});

test('omp expiry: one row per oauth credential, disabled and non-oauth rows are ignored, no module is a fixed code', () => {
  const w = workspace();
  try {
    const now = Date.now();
    writeOmp(w.home, [
      { id: 1, data: ompData(now + HOUR) },
      { id: 2, provider: 'other', data: ompData(now + 3 * HOUR) },
      { id: 3, data: ompData(now + 9 * HOUR), disabled: 'revoked' },
      { id: 4, type: 'api_key', data: { key: FAKE.other } },
    ]).close();
    const read = readCredentialExpiry('omp-agent-db', w.home);
    assert.equal(read.ok, true);
    assert.equal(read.entries.length, 2);
    assert.equal(Math.min(...read.entries.map((e) => e.expiresMs)), now + HOUR);

    assert.deepEqual(readCredentialExpiry('omp-agent-db', w.home, { loadSqlite: () => null }), { ok: false, code: 'sqlite-unavailable' });

    const empty = path.join(w.tmp, 'empty');
    writeOmp(empty, [{ id: 1, data: ompData(now), disabled: 'x' }]).close();
    assert.deepEqual(readCredentialExpiry('omp-agent-db', empty), { ok: false, code: 'unexpected-shape' });
  } finally { w.cleanup(); }
});

test('codex expiry is due at the earlier of the token expiry and the refresh interval; an unreadable token falls back to the interval', () => {
  const w = workspace();
  try {
    const now = Date.now();
    writeCodex(w.home, codexDoc(now + 100 * HOUR, now - 7 * 24 * HOUR));
    const byAge = readCredentialExpiry('codex-auth-json', w.home);
    assert.equal(byAge.entries[0].dueMs, now - 7 * 24 * HOUR + CODEX_REFRESH_INTERVAL_MS);
    assert.equal(byAge.entries[0].expiresMs, Math.floor((now + 100 * HOUR) / 1000) * 1000);

    writeCodex(w.home, codexDoc(now + HOUR, now));
    const byExp = readCredentialExpiry('codex-auth-json', w.home);
    assert.equal(byExp.entries[0].dueMs, byExp.entries[0].expiresMs);

    const doc = codexDoc(now + HOUR, now);
    doc.tokens.access_token = 'FAKE-NOT-A-JWT';
    writeCodex(w.home, doc);
    assert.equal(readCredentialExpiry('codex-auth-json', w.home).entries[0].dueMs, now + CODEX_REFRESH_INTERVAL_MS);
  } finally { w.cleanup(); }
});

test('claude expiry is read from the login file, never quoted, and the layout is named from that file', () => {
  const w = workspace();
  try {
    const now = Date.now();
    const file = path.join(w.home, '.claude', '.credentials.json');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ claudeAiOauth: { accessToken: FAKE.oldAccess, refreshToken: FAKE.other, expiresAt: now + HOUR } }));
    const read = readCredentialExpiry('claude-credentials-json', w.home);
    assert.deepEqual(read, { ok: true, entries: [{ key: 'claudeAiOauth', expiresMs: now + HOUR, dueMs: now + HOUR }] });
    assert.equal(JSON.stringify(read).includes('FAKE'), false);

    fs.writeFileSync(file, JSON.stringify({ claudeAiOauth: { accessToken: FAKE.oldAccess } }));
    assert.deepEqual(readCredentialExpiry('claude-credentials-json', w.home), { ok: false, code: 'unexpected-shape' });
    assert.equal(credentialLayout({ kind: 'home-files', home: w.home, files: ['.claude/.credentials.json'] }), 'claude-credentials-json');
  } finally { w.cleanup(); }
});

test('an unknown layout, a missing store and malformed JSON give fixed codes that never quote the input', () => {
  const w = workspace();
  try {
    assert.deepEqual(readCredentialExpiry('mystery', w.home), { ok: false, code: 'unknown-layout' });
    assert.deepEqual(readCredentialExpiry('pi-auth-json', w.home), { ok: false, code: 'missing-file' });
    fs.writeFileSync(path.join(w.home, 'auth.json'), `{"xai": {"access": "${FAKE.oldAccess}", `);
    const bad = readCredentialExpiry('pi-auth-json', w.home);
    assert.deepEqual(bad, { ok: false, code: 'unreadable-json' });
    assert.equal(JSON.stringify(bad).includes('FAKE'), false);
    fs.writeFileSync(path.join(w.home, 'auth.json'), '[1,2]');
    assert.deepEqual(readCredentialExpiry('pi-auth-json', w.home), { ok: false, code: 'unexpected-shape' });
  } finally { w.cleanup(); }
});

test('the refresh-ahead window is never shorter than one call plus a margin', () => {
  assert.equal(defaultRefreshAheadThresholdMs(90_000), HOUR);
  assert.equal(defaultRefreshAheadThresholdMs(2 * HOUR), 2 * HOUR + 5 * 60 * 1000);
});

// ---------------------------------------------------------------------------------------------------
// Refresh-ahead
// ---------------------------------------------------------------------------------------------------

const LAYOUT_CASES = [
  { name: 'pi', write: (dir, expiresMs) => writePi(dir, piDoc(expiresMs)), source: piSource, token: (dir) => readPi(dir).xai.access },
  { name: 'omp', write: (dir, expiresMs) => writeOmp(dir, [{ id: 1, data: ompData(expiresMs) }, { id: 2, provider: 'other', data: ompData(expiresMs + 20 * HOUR, { access: FAKE.other }) }], { wal: true }).close(), source: ompSource, token: (dir) => JSON.parse(readOmpRows(dir)[0].data).access },
  { name: 'codex', write: (dir, expiresMs) => writeCodex(dir, codexDoc(expiresMs, Date.now())), source: codexSource, token: (dir) => readCodex(dir).tokens.refresh_token },
  { name: 'claude', write: (dir, expiresMs) => writeClaude(dir, claudeDoc(expiresMs)), source: claudeSource, token: (dir) => readClaude(dir).claudeAiOauth.refreshToken },
];

for (const layout of LAYOUT_CASES) {
  test(`${layout.name}: a login inside the window is renewed once in a scratch copy and the new entry applied; the real store never looks expired`, async () => {
    const w = workspace();
    try {
      layout.write(w.home, Date.now() + 20 * 60 * 1000);
      const before = layout.token(w.home);
      const seenDuringCall = [];
      const scratchDue = [];
      const { spawnFn, starts } = fakeSpawn({
        layoutName: layout.name,
        onStart: (scratchHome) => {
          assert.notEqual(scratchHome, w.home, 'the call runs on the scratch copy, never on the real home');
          assert.equal(path.dirname(scratchHome), w.accountDir);
          const read = readCredentialExpiry(credentialLayout(layout.source(w.home)), w.home);
          seenDuringCall.push(Math.min(...read.entries.map((e) => e.expiresMs)));
          const scratchRead = readCredentialExpiry(credentialLayout(layout.source(w.home)), scratchHome);
          scratchDue.push(scratchRead.entries.some((e) => e.dueMs < Date.now()));
        },
      });

      const result = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: layout.source(w.home), runtimeDir: w.runtimeDir, spawnFn });

      assert.deepEqual(result, { status: 'renewed', reason: 'applied' });
      assert.equal(starts.length, 1);
      assert.ok(seenDuringCall.every((ms) => ms > Date.now()), 'the real store kept a future expiry during the renewal');
      assert.deepEqual(scratchDue, [true], 'the scratch copy was made to look due so the CLI renews');
      assert.notEqual(layout.token(w.home), before, 'the real store holds the renewed entry');
      assert.deepEqual(siblings(w.accountDir).filter((n) => n.startsWith('scratch-')), [], 'the scratch home is removed');
      assert.equal(fs.existsSync(path.join(w.accountDir, 'cooldown.json')), false);
      if (layout.name === 'omp') {
        const rows = readOmpRows(w.home);
        assert.equal(JSON.parse(rows[1].data).access, FAKE.other, 'the other row is untouched');
        assert.equal(rows[1].note, 'n');
      }
      if (layout.name === 'pi') assert.deepEqual(readPi(w.home).openrouter, { type: 'api_key', key: FAKE.other });
      if (layout.name === 'claude') assert.deepEqual(readClaude(w.home).mcpOAuth, { kept: true }, 'the rest of the login file is kept');
    } finally { w.cleanup(); }
  });
}

test('a login outside the window starts nothing and takes no lock', async () => {
  const w = workspace();
  try {
    writePi(w.home, piDoc(Date.now() + 5 * HOUR));
    const { spawnFn, starts } = fakeSpawn({ layoutName: 'pi' });
    const result = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn });
    assert.equal(result.status, 'fresh');
    assert.equal(starts.length, 0);
    assert.equal(fs.existsSync(w.accountDir), false);
  } finally { w.cleanup(); }
});

test('a layout that cannot be read or named is skipped with a code, not an error', async () => {
  const w = workspace();
  try {
    const { spawnFn, starts } = fakeSpawn({ layoutName: 'pi' });
    assert.deepEqual(
      await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: { kind: 'home-files', home: w.home, files: ['.gemini/token'] }, runtimeDir: w.runtimeDir, spawnFn }),
      { status: 'skipped', reason: 'unsupported-layout' },
    );
    fs.writeFileSync(path.join(w.home, 'auth.json'), '{ nope');
    assert.deepEqual(
      await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn }),
      { status: 'skipped', reason: 'unreadable-json' },
    );
    assert.equal(starts.length, 0);
  } finally { w.cleanup(); }
});

test('two refreshes started together on one account cause one renewal, and the event loop keeps running meanwhile', async () => {
  const w = workspace();
  try {
    writePi(w.home, piDoc(Date.now() + 10 * 60 * 1000));
    const { spawnFn, starts } = fakeSpawn({ layoutName: 'pi', delayMs: 200 });
    let ticks = 0;
    const timer = setInterval(() => { ticks += 1; }, 10);
    const run = () => refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn });
    const [a, b] = await Promise.all([run(), run()]);
    clearInterval(timer);

    assert.equal(starts.length, 1, 'exactly one renewal');
    assert.deepEqual([a.status, b.status].sort(), ['fresh', 'renewed']);
    assert.ok(ticks >= 10, `timers kept firing while the second caller waited (${ticks} ticks)`);
    assert.ok(readPi(w.home).xai.expires > Date.now() + HOUR, 'both callers see a login good for hours');
  } finally { w.cleanup(); }
});

test('a dead runner whose renewal child still runs keeps the lock: no second renewal starts', { timeout: 30_000 }, async (t) => {
  const w = workspace();
  try {
    writePi(w.home, piDoc(Date.now() + 10 * 60 * 1000));
    // A real runner process: it takes the account lock, starts its renewal call (a `node` that sleeps)
    // through the lock, and is then killed while the call still runs.
    const CHILD_MS = 1500;
    const holder = spawn(process.execPath, ['--input-type=module', '-e', `
import fs from 'node:fs';
import { tryAcquireAccountLock } from ${JSON.stringify(PROVIDER_CAPACITY_URL)};
const lock = tryAcquireAccountLock({ runtimeDir: ${JSON.stringify(w.runtimeDir)}, provider: 'xai', accountId: 'acct' });
const child = lock.spawnHolding(process.execPath, ['-e', 'setTimeout(() => {}, ${CHILD_MS})'], { stdio: ['ignore', 'pipe', 'pipe'] });
fs.writeSync(1, String(child.pid) + '\\n');
setInterval(() => {}, 1000);
`], { stdio: ['ignore', 'pipe', 'inherit'] });
    t.after(() => holder.kill('SIGKILL'));
    const childPid = await new Promise((resolve, reject) => {
      holder.stdout.once('data', (chunk) => resolve(Number(String(chunk).trim())));
      holder.once('exit', (code) => reject(new Error(`holder exited (code ${code}) before starting its call`)));
    });
    t.after(() => { try { process.kill(childPid, 'SIGKILL'); } catch { /* already gone */ } });
    const holderExited = new Promise((resolve) => holder.once('exit', resolve));
    holder.kill('SIGKILL');
    await holderExited;

    const { spawnFn, starts } = fakeSpawn({ layoutName: 'pi' });
    const result = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn, lockWaitMs: 150 });
    assert.deepEqual(result, { status: 'skipped', reason: 'lock-busy' });
    assert.equal(starts.length, 0);

    // Once the call has ended, the lock is free and the renewal runs.
    const again = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn, lockWaitMs: CHILD_MS + 5000 });
    assert.equal(again.status, 'renewed');
  } finally { w.cleanup(); }
});

test('without an injected spawn the renewal call runs through the account lock and holds it', { timeout: 30_000 }, async () => {
  const w = workspace();
  try {
    writePi(w.home, piDoc(Date.now() + 10 * 60 * 1000));
    // A stand-in `pi` on PATH: it records whether it was handed the lock's description, then renews the
    // home it is pointed at the way the real CLI does.
    const bin = path.join(w.tmp, 'bin');
    fs.mkdirSync(bin);
    const seenPath = path.join(w.tmp, 'seen.json');
    fs.writeFileSync(path.join(bin, 'pi'), `#!${process.execPath}
const fs = require('node:fs');
const path = require('node:path');
let fd3 = false;
try { fd3 = fs.fstatSync(3).isFile(); } catch {}
fs.writeFileSync(${JSON.stringify(seenPath)}, JSON.stringify({ lockFd: process.env.FGOS_LOCK_FD ?? null, fd3 }));
const file = path.join(process.env.PI_CODING_AGENT_DIR, 'auth.json');
const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
doc.xai = { ...doc.xai, access: ${JSON.stringify(FAKE.newAccess)}, refresh: ${JSON.stringify(FAKE.newRefresh)}, expires: Date.now() + 6 * 3600 * 1000 };
fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\\n');
process.stdout.write('OK');
`, { mode: 0o755 });
    const env = { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}` };
    const result = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, env });
    assert.equal(result.status, 'renewed');
    assert.deepEqual(JSON.parse(fs.readFileSync(seenPath, 'utf8')), { lockFd: 'provider-account:3', fd3: true });
    const free = tryAcquireAccountLock({ runtimeDir: w.runtimeDir, provider: 'xai', accountId: 'acct' });
    assert.ok(free, 'released once the call ended');
    free.release();
  } finally { w.cleanup(); }
});

test('a failed call leaves the source byte-equal, records a cooldown, and no further call starts inside it', async () => {
  const w = workspace();
  try {
    writePi(w.home, piDoc(Date.now() + 10 * 60 * 1000));
    const original = sha(path.join(w.home, 'auth.json'));
    const failing = fakeSpawn({ layoutName: 'pi', behaviour: () => {}, output: 'Error: OAuth refresh failed for xai', exitCode: 1 });
    const first = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn: failing.spawnFn });
    assert.deepEqual(first, { status: 'failed', reason: 'probe-failed' });
    assert.equal(sha(path.join(w.home, 'auth.json')), original);
    assert.ok(fs.existsSync(path.join(w.accountDir, 'cooldown.json')));
    assert.deepEqual(siblings(w.accountDir).filter((n) => n.startsWith('scratch-')), []);

    const ok = fakeSpawn({ layoutName: 'pi' });
    const second = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn: ok.spawnFn });
    assert.deepEqual(second, { status: 'cooldown', reason: 'recent-failure' });
    assert.equal(ok.starts.length, 0);

    const third = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn: ok.spawnFn, cooldownMs: 0 });
    assert.equal(third.status, 'renewed');
    assert.equal(fs.existsSync(path.join(w.accountDir, 'cooldown.json')), false, 'a renewal clears the cooldown');
  } finally { w.cleanup(); }
});

test('a call that answers but renews nothing, and a spawn that throws, are failures that leave the source alone', async () => {
  const w = workspace();
  try {
    writePi(w.home, piDoc(Date.now() + 10 * 60 * 1000));
    const original = sha(path.join(w.home, 'auth.json'));
    const quiet = fakeSpawn({ layoutName: 'pi', behaviour: () => {} });
    assert.deepEqual(
      await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn: quiet.spawnFn }),
      { status: 'failed', reason: 'not-renewed' },
    );
    const throwing = () => { throw new Error(`boom ${FAKE.oldRefresh}`); };
    const result = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn: throwing, cooldownMs: 0 });
    assert.equal(result.status, 'failed');
    assert.equal(JSON.stringify(result).includes('FAKE'), false);
    assert.equal(sha(path.join(w.home, 'auth.json')), original);
  } finally { w.cleanup(); }
});

test('a call killed at its limit that already renewed is still applied: the scratch copy holds the only good pair', async () => {
  const w = workspace();
  try {
    writePi(w.home, piDoc(Date.now() + 10 * 60 * 1000));
    const { spawnFn } = fakeSpawn({ layoutName: 'pi', exitCode: 1, output: 'killed' });
    const result = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn });
    assert.equal(result.status, 'renewed');
    assert.equal(readPi(w.home).xai.refresh, FAKE.newRefresh);
  } finally { w.cleanup(); }
});

test('a scratch copy left by a dead runner, and a pending copy, are applied by the next holder, then removed', async () => {
  const w = workspace();
  try {
    const now = Date.now();
    writePi(w.home, piDoc(now + 5 * HOUR)); // fresh: refresh-ahead itself would do nothing
    const leftover = path.join(w.accountDir, 'scratch-1-1');
    writePi(leftover, piDoc(now + 6 * HOUR, { access: FAKE.newAccess, refresh: FAKE.newRefresh }));
    const pending = path.join(w.accountDir, 'pending', '000000000000001-0000000a');
    writePi(pending, piDoc(now + 4 * HOUR, { access: 'FAKE-STALE-PENDING', refresh: 'FAKE-STALE-PENDING' }));
    const { spawnFn, starts } = fakeSpawn({ layoutName: 'pi' });

    const result = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn });

    assert.equal(result.status, 'fresh');
    assert.equal(starts.length, 0);
    assert.equal(readPi(w.home).xai.refresh, FAKE.newRefresh, 'the newer leftover won; the older pending copy did not roll it back');
    assert.equal(fs.existsSync(leftover), false);
    assert.equal(fs.existsSync(pending), false);
  } finally { w.cleanup(); }
});

test('when the source cannot be written after a renewal, the scratch copy stays for the next holder', async (t) => {
  if (typeof process.getuid === 'function' && process.getuid() === 0) { t.skip('root ignores directory permissions'); return; }
  const w = workspace();
  try {
    writePi(w.home, piDoc(Date.now() + 10 * 60 * 1000));
    const { spawnFn } = fakeSpawn({ layoutName: 'pi', onStart: () => fs.chmodSync(w.home, 0o500) });
    const result = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn });
    fs.chmodSync(w.home, 0o700);
    assert.deepEqual(result, { status: 'failed', reason: 'apply-failed' });
    const kept = siblings(w.accountDir).filter((n) => n.startsWith('scratch-'));
    assert.equal(kept.length, 1);
    assert.equal(readPi(path.join(w.accountDir, kept[0])).xai.refresh, FAKE.newRefresh);

    const ok = fakeSpawn({ layoutName: 'pi' });
    const next = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn: ok.spawnFn });
    assert.equal(next.status, 'fresh', 'the kept copy was applied');
    assert.equal(readPi(w.home).xai.refresh, FAKE.newRefresh);
    assert.equal(ok.starts.length, 0);
  } finally { fs.chmodSync(w.home, 0o700); w.cleanup(); }
});

// ---------------------------------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------------------------------

test('pi apply replaces only the entry whose expiry is strictly later and leaves every other entry as it was', () => {
  const w = workspace();
  try {
    const now = Date.now();
    const source = { a: { type: 'oauth', access: FAKE.oldAccess, refresh: FAKE.oldRefresh, expires: now + HOUR }, b: { type: 'oauth', access: FAKE.other, refresh: FAKE.other, expires: now + 2 * HOUR }, key: { type: 'api_key', key: FAKE.other } };
    writePi(w.home, source);
    const copy = path.join(w.tmp, 'copy');
    writePi(copy, { a: { ...source.a, access: FAKE.newAccess, refresh: FAKE.newRefresh, expires: now + 6 * HOUR }, b: { ...source.b, refresh: 'FAKE-ROLLED-BACK', expires: now + HOUR } });

    const result = applyRenewedCredential({ layoutName: 'pi-auth-json', sourceHome: w.home, copyHome: copy });

    assert.deepEqual(result, { status: 'applied', keys: ['a'] });
    const merged = readPi(w.home);
    assert.equal(merged.a.refresh, FAKE.newRefresh);
    assert.deepEqual(merged.b, source.b);
    assert.deepEqual(merged.key, source.key);
    assert.equal(fs.statSync(path.join(w.home, 'auth.json')).mode & 0o777, 0o600);
  } finally { w.cleanup(); }
});

test('apply leaves the source byte-equal for an older, equal, past-expiry, unreadable or malformed copy', () => {
  const w = workspace();
  try {
    const now = Date.now();
    writePi(w.home, piDoc(now + 2 * HOUR));
    const original = sha(path.join(w.home, 'auth.json'));
    const cases = {
      older: () => writePi(path.join(w.tmp, 'c'), piDoc(now + HOUR, { refresh: 'FAKE-OLDER' })),
      equal: () => writePi(path.join(w.tmp, 'c'), piDoc(now + 2 * HOUR, { refresh: 'FAKE-EQUAL' })),
      malformed: () => { fs.mkdirSync(path.join(w.tmp, 'c'), { recursive: true }); fs.writeFileSync(path.join(w.tmp, 'c', 'auth.json'), `{"xai": {"refresh": "${FAKE.newRefresh}"`); },
      wrongShape: () => writePi(path.join(w.tmp, 'c'), [1, 2]),
      missing: () => fs.mkdirSync(path.join(w.tmp, 'c'), { recursive: true }),
    };
    for (const [name, build] of Object.entries(cases)) {
      fs.rmSync(path.join(w.tmp, 'c'), { recursive: true, force: true });
      build();
      const result = applyRenewedCredential({ layoutName: 'pi-auth-json', sourceHome: w.home, copyHome: path.join(w.tmp, 'c') });
      assert.notEqual(result.status, 'applied', name);
      assert.equal(JSON.stringify(result).includes('FAKE'), false, `${name}: no value in the result`);
      assert.equal(sha(path.join(w.home, 'auth.json')), original, name);
    }
    // A copy whose expiry is already past is never written, even if it is "later" than a staler source.
    writePi(w.home, piDoc(now - 3 * HOUR));
    const stale = sha(path.join(w.home, 'auth.json'));
    writePi(path.join(w.tmp, 'c'), piDoc(now - HOUR, { refresh: 'FAKE-PAST' }));
    fs.rmSync(path.join(w.tmp, 'c'), { recursive: true, force: true });
    writePi(path.join(w.tmp, 'c'), piDoc(now - HOUR, { refresh: 'FAKE-PAST' }));
    assert.equal(applyRenewedCredential({ layoutName: 'pi-auth-json', sourceHome: w.home, copyHome: path.join(w.tmp, 'c') }).status, 'unchanged');
    assert.equal(sha(path.join(w.home, 'auth.json')), stale);
  } finally { w.cleanup(); }
});

test('omp apply updates only the matching row inside a transaction; other rows, columns and the open database survive', () => {
  const w = workspace();
  try {
    const now = Date.now();
    const holder = writeOmp(w.home, [
      { id: 1, data: ompData(now + HOUR), updatedAt: 10, note: 'keep-1' },
      { id: 2, provider: 'other', data: ompData(now + 2 * HOUR, { access: FAKE.other }), updatedAt: 20, note: 'keep-2' },
    ], { wal: true });
    const copy = path.join(w.tmp, 'copy');
    writeOmp(copy, [
      { id: 1, data: ompData(now + 6 * HOUR, { access: FAKE.newAccess, refresh: FAKE.newRefresh }), updatedAt: 99, note: 'copy-note' },
      { id: 2, provider: 'other', data: ompData(now + 30 * 60 * 1000, { access: 'FAKE-ROLLED-BACK' }), updatedAt: 98 },
    ]).close();

    const result = applyRenewedCredential({ layoutName: 'omp-agent-db', sourceHome: w.home, copyHome: copy });

    assert.equal(result.status, 'applied');
    const rows = holder.prepare('SELECT * FROM auth_credentials ORDER BY id').all().map((r) => ({ ...r }));
    assert.equal(JSON.parse(rows[0].data).refresh, FAKE.newRefresh);
    assert.equal(rows[0].updated_at, 99);
    assert.equal(rows[0].note, 'keep-1', 'a column the renewal does not own is not copied over');
    assert.equal(JSON.parse(rows[1].data).access, FAKE.other);
    assert.equal(rows[1].updated_at, 20);
    holder.close();

    // Applying the same copy again changes nothing.
    assert.equal(applyRenewedCredential({ layoutName: 'omp-agent-db', sourceHome: w.home, copyHome: copy }).status, 'unchanged');
  } finally { w.cleanup(); }
});

test('codex apply replaces the tokens and last_refresh together and keeps every other field', () => {
  const w = workspace();
  try {
    const now = Date.now();
    writeCodex(w.home, codexDoc(now + HOUR, now - HOUR, 'old'));
    const copy = path.join(w.tmp, 'copy');
    writeCodex(copy, codexDoc(now + 200 * HOUR, now, 'new'));
    assert.equal(applyRenewedCredential({ layoutName: 'codex-auth-json', sourceHome: w.home, copyHome: copy }).status, 'applied');
    const merged = readCodex(w.home);
    assert.equal(merged.tokens.refresh_token, 'FAKE-CODEX-REFRESH-new');
    assert.equal(merged.extra, 'kept');
    assert.equal(merged.last_refresh, new Date(now).toISOString());
    // An older copy never rolls it back.
    assert.equal(applyRenewedCredential({ layoutName: 'codex-auth-json', sourceHome: w.home, copyHome: path.join(w.tmp, 'copy') }).status, 'unchanged');
  } finally { w.cleanup(); }
});

// ---------------------------------------------------------------------------------------------------
// Provisioning copy
// ---------------------------------------------------------------------------------------------------

test('a copied agent.db carries a row that was committed only in the write-ahead log', () => {
  const w = workspace();
  try {
    const holder = writeOmp(w.home, [{ id: 1, data: ompData(Date.now() + HOUR) }], { wal: true });
    holder.prepare('INSERT INTO auth_credentials (id, provider, credential_type, data) VALUES (7, ?, ?, ?)').run('xai', 'oauth', JSON.stringify(ompData(Date.now() + 2 * HOUR, { access: FAKE.newAccess })));
    assert.ok(fs.existsSync(path.join(w.home, 'agent.db-wal')) && fs.statSync(path.join(w.home, 'agent.db-wal')).size > 0, 'the row sits in the WAL');

    const destination = path.join(w.tmp, 'private-home');
    copyCredentialFiles(destination, w.home, ['agent.db']);
    holder.close();

    assert.equal(fs.existsSync(path.join(destination, 'agent.db-wal')), false);
    assert.deepEqual(readOmpRows(destination).map((r) => r.id), [1, 7]);
    assert.equal(fs.statSync(path.join(destination, 'agent.db')).mode & 0o777, 0o600);
  } finally { w.cleanup(); }
});

test('without node:sqlite agent.db is copied as a plain file, as before', () => {
  const w = workspace();
  try {
    writeOmp(w.home, [{ id: 1, data: ompData(Date.now() + HOUR) }]).close();
    const destination = path.join(w.tmp, 'private-home');
    copyCredentialFiles(destination, w.home, ['agent.db'], { loadSqlite: () => null });
    assert.deepEqual(fs.readFileSync(path.join(destination, 'agent.db')), fs.readFileSync(path.join(w.home, 'agent.db')));
  } finally { w.cleanup(); }
});

test('the credential copy refuses an escaping or missing entry with the caller\'s error', () => {
  const w = workspace();
  try {
    writePi(w.home, piDoc(Date.now() + HOUR));
    const makeError = (message) => Object.assign(new Error(message), { code: 'credential-provisioning' });
    assert.throws(() => copyCredentialFiles(path.join(w.tmp, 'd'), w.home, ['../x'], { makeError }), { code: 'credential-provisioning' });
    assert.throws(() => copyCredentialFiles(path.join(w.tmp, 'd'), w.home, ['missing.json'], { makeError }), /is missing/);
  } finally { w.cleanup(); }
});

test('with skipMissing the credential copy leaves out a path that does not exist and still refuses a dangling or escaping one', () => {
  const w = workspace();
  try {
    writePi(w.home, piDoc(Date.now() + HOUR));
    const makeError = (message) => Object.assign(new Error(message), { code: 'credential-provisioning' });
    const destination = path.join(w.tmp, 'd');
    assert.deepEqual(copyCredentialFiles(destination, w.home, ['auth.json', 'missing.json', 'bin/fd'], { makeError, skipMissing: true }), ['auth.json']);
    assert.equal(fs.existsSync(path.join(destination, 'missing.json')), false);
    assert.deepEqual(copyCredentialFiles(path.join(w.tmp, 'e'), w.home, ['missing.json'], { makeError, skipMissing: true }), []);
    fs.symlinkSync('no-such-target', path.join(w.home, 'dangling'));
    assert.throws(() => copyCredentialFiles(path.join(w.tmp, 'f'), w.home, ['dangling'], { makeError, skipMissing: true }), /"dangling" is missing/);
    assert.throws(() => copyCredentialFiles(path.join(w.tmp, 'g'), w.home, ['../x'], { makeError, skipMissing: true }), { code: 'credential-provisioning' });
  } finally { w.cleanup(); }
});

test('prepare hands the write-back target of an opted-in attempt home to the host and never writes it into the home', async () => {
  const w = workspace();
  try {
    writePi(w.home, piDoc(Date.now() + HOUR));
    const tempRoot = path.join(w.tmp, 'fgos-confinement');
    const make = (dispatchId, { withWriteBack, attemptId }) => {
      const resources = resolveConfinementResources({ dispatchId, context: {}, grants: [{ resource: 'private-home', access: 'read-write', scope: 'dispatch' }], backendConfig: { tempRoot } });
      const plan = { contract: 'confinement-plan.v1', dispatchId, decision: 'execute', coverage: {}, resources };
      const request = {
        dispatchId,
        ...(attemptId ? { attemptId } : {}),
        executorId: 'omp-bwrap',
        invocation: { command: 'agent-cli', args: [], env: {}, credentialStore: { use: 'agent-cli', homeEnv: 'AGENT_HOME' } },
        providerCapacity: {
          provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home),
          ...(withWriteBack ? { credentialWriteBack: { runtimeDir: w.runtimeDir } } : {}),
        },
        context: { cwd: os.tmpdir(), runDir: path.join(w.tmp, 'run') },
      };
      return { plan, request, home: resources[0].hostTarget };
    };
    const backend = { id: 'bwrap', type: 'bwrap', config: {} };
    const markerHasNoTarget = (home) => {
      const text = fs.readFileSync(path.join(home, OWNERSHIP_MARKER_FILE), 'utf8');
      assert.equal('credentialWriteBack' in JSON.parse(text), false);
      assert.equal(text.includes(w.home), false, 'the marker names no login store');
    };

    const plain = make('disp_plain', { withWriteBack: false, attemptId: 'att-plain' });
    const preparedPlain = prepareBwrapSync(plain.plan, plain.request, backend);
    assert.equal(preparedPlain.credentialWriteBack, undefined);
    markerHasNoTarget(plain.home);

    // A dispatch outside the assignment door is never written back, even when its capacity asks.
    const doorless = make('disp_doorless', { withWriteBack: true });
    const preparedDoorless = prepareBwrapSync(doorless.plan, doorless.request, backend);
    assert.equal(preparedDoorless.credentialWriteBack, undefined);
    markerHasNoTarget(doorless.home);
    await preparedDoorless.cleanup();

    const opted = make('disp_opted', { withWriteBack: true, attemptId: 'att-opted' });
    const preparedOpted = prepareBwrapSync(opted.plan, opted.request, backend);
    assert.deepEqual(preparedOpted.credentialWriteBack, {
      provider: 'xai', accountId: 'acct', kind: 'home-files', home: w.home, layout: 'pi-auth-json', runtimeDir: w.runtimeDir,
    });
    assert.equal(FAKE_FRAGMENTS.some((f) => JSON.stringify(preparedOpted.credentialWriteBack).includes(f)), false);
    markerHasNoTarget(opted.home);
    // The host's own record of the attempt home sits beside it, outside the home, and names the same target.
    // It names where the attempt's descriptor is, never the target itself: that stays in the descriptor alone.
    const record = JSON.parse(fs.readFileSync(path.join(path.dirname(opted.home), 'attempt-home.json'), 'utf8'));
    assert.deepEqual({ attemptId: record.attemptId, home: record.home, launchCommandId: record.launchCommandId }, { attemptId: 'att-opted', home: opted.home, launchCommandId: 'att-opted' });
    assert.equal(JSON.stringify(record).includes(w.home), false, 'the record names no login store');
    assert.equal(fs.statSync(path.join(path.dirname(opted.home), 'attempt-home.json')).mode & 0o777, 0o600);
  } finally { w.cleanup(); }
});

// ---------------------------------------------------------------------------------------------------
// Write-back at removal, through every removal path
// ---------------------------------------------------------------------------------------------------

const markerOf = (dir) => JSON.parse(fs.readFileSync(path.join(dir, OWNERSHIP_MARKER_FILE), 'utf8'));
// The write-back target the host records for a home (in production, the attempt's finalization descriptor).
const targets = new Map();
const targetOf = (dir) => targets.get(dir);

function privateHomeWithRenewedLogin(w, { writeBack = true, dispatchId = 'disp_wb', accountHomeExpiryMs = Date.now() + 10 * 60 * 1000, accountId } = {}) {
  writePi(w.home, piDoc(accountHomeExpiryMs, { accountId }));
  const dir = path.join(w.tmp, 'fgos-confinement', dispatchId, 'home');
  fs.mkdirSync(dir, { recursive: true });
  writeOwnershipMarker(dir, { dispatchId });
  copyCredentialFiles(dir, w.home, ['auth.json']);
  if (writeBack) {
    targets.set(dir, credentialWriteBackTarget({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir }));
  }
  renewHome('pi', dir); // the pane renewed inside its copy
  return dir;
}

test('a dispatch home outside the assignment door is removed without write-back, whatever its marker names', () => {
  const w = workspace();
  try {
    for (const writeBack of [false, true]) {
      const dir = privateHomeWithRenewedLogin(w, { writeBack });
      // What a confined agent could plant: its home's marker naming a login store.
      if (writeBack) rewriteOwnershipMarker(dir, { credentialWriteBack: targetOf(dir) });
      const original = sha(path.join(w.home, 'auth.json'));
      assert.equal(cleanupConfinementResource(dir, 'disp_wb').cleaned, true);
      assert.equal(fs.existsSync(dir), false);
      assert.equal(sha(path.join(w.home, 'auth.json')), original, 'the source is untouched');
      assert.equal(fs.existsSync(w.accountDir), false, 'no account directory was even created');
    }
  } finally { w.cleanup(); }
});

const SCRATCH = 'scratch-';
const agentCopies = (w) => fs.readdirSync(path.join(w.accountDir, 'pending')).filter((n) => /^\d{15}-agent-/.test(n));

// A Codex private home whose pane renewed the login; every access token names its account the way OpenAI signs it.
function codexAgentHome(w, { account = 'FAKE-ACCOUNT-LEASED', dispatchId = 'disp_codex' } = {}) {
  const now = Date.now();
  const leased = codexDoc(now + 10 * 60 * 1000, now - HOUR, 'old');
  leased.tokens.access_token = fakeJwt(now + 10 * 60 * 1000, 'old', codexAccountClaim('FAKE-ACCOUNT-LEASED'));
  writeCodex(w.home, leased);
  const dir = path.join(w.tmp, 'fgos-confinement', dispatchId, 'home');
  const renewed = codexDoc(now + 6 * HOUR, now, 'pane');
  renewed.tokens.access_token = fakeJwt(now + 6 * HOUR, 'pane', codexAccountClaim(account));
  writeCodex(dir, renewed);
  return { dir, target: credentialWriteBackTarget({ provider: 'xai', accountId: 'acct', credentialSource: codexSource(w.home), runtimeDir: w.runtimeDir }) };
}

// What the CLI does when the probe makes it redeem the copy's refresh token: a new pair for the account that token
// belongs to.
const renewCodexAs = (account) => (dir) => {
  const doc = codexDoc(Date.now() + 8 * HOUR, Date.now(), 'probe');
  doc.tokens.access_token = fakeJwt(Date.now() + 8 * HOUR, 'probe', codexAccountClaim(account));
  writeCodex(dir, doc);
};

// A login renewed inside a private home is the agent's word: write-back stages it and never applies it, and only
// the next refresh-ahead does, once a renewal made with the copy's own refresh token returns a token the provider
// signed for the leased account. The probe sees an isolated copy of the login file, a scratch cwd and a minimal env.
test('a login renewed in a private home is staged at write-back without waiting for the lock, and applied only once a renewal with its own refresh token returns a token of the leased account', async () => {
  const w = workspace();
  try {
    const { dir, target } = codexAgentHome(w);
    const held = tryAcquireAccountLock({ runtimeDir: w.runtimeDir, provider: 'xai', accountId: 'acct' });
    const started = Date.now();
    try { assert.deepEqual(writeBackRenewedCredential(dir, target), { status: 'staged' }); } finally { held.release(); }
    assert.ok(Date.now() - started < 1000, 'the write-back did not wait for the account lock');
    assert.equal(readCodex(w.home).tokens.refresh_token, 'FAKE-CODEX-REFRESH-old', 'nothing is applied at write-back');
    assert.equal(agentCopies(w).length, 1);

    const seen = [];
    const inner = fakeSpawn({ layoutName: 'codex', behaviour: (home) => { seen.push(fs.readdirSync(home)); renewCodexAs('FAKE-ACCOUNT-LEASED')(home); } });
    const spawnFn = (command, args, options) => { seen.push(options); return inner.spawnFn(command, args, options); };
    const result = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: codexSource(w.home), runtimeDir: w.runtimeDir, spawnFn });
    const [options, files] = seen;
    assert.deepEqual(files, ['auth.json'], 'the probe ran once, on an isolated copy of the login file alone');
    assert.equal(options.cwd, options.env.CODEX_HOME, 'its working directory is that copy');
    assert.match(path.relative(w.accountDir, options.cwd), /^pending\/\.tmp-\d+-/, 'a staging the interrupted-staging sweep finds if the runner dies');
    assert.equal(options.env.HOME, options.env.CODEX_HOME);
    assert.deepEqual(Object.keys(options.env).filter((name) => !['PATH', 'LANG', 'LC_ALL', 'TZ', 'TERM'].includes(name)).sort(), ['CODEX_HOME', 'HOME'], 'nothing else of the runner\'s env');
    assert.equal(result.status, 'fresh');
    assert.equal(readCodex(w.home).tokens.refresh_token, 'FAKE-CODEX-REFRESH-probe', 'the pair the renewal returned is applied');
    assert.deepEqual(agentCopies(w), []);
  } finally { w.cleanup(); }
});

test('a renewed login is never applied while its tokens name no account the provider signs, whatever label it carries, nor while its renewal returns nothing', async () => {
  // pi's xai login: opaque tokens and a plain `accountId` label the agent can write.
  const w = workspace();
  try {
    const dir = privateHomeWithRenewedLogin(w, { accountId: 'FAKE-ACCOUNT-LEASED' });
    writeBackRenewedCredential(dir, targetOf(dir));
    const { spawnFn, starts } = fakeSpawn({ layoutName: 'pi', behaviour: () => {} });
    await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn });
    assert.equal(starts.filter((s) => !path.basename(s.homeDir).startsWith('scratch-')).length, 0, 'a copy whose tokens name no account is never probed');
    assert.equal(readPi(w.home).xai.refresh, FAKE.oldRefresh, 'a forged label is not an account');
    assert.equal(agentCopies(w).length, 1, 'it is kept for the owner');
  } finally { w.cleanup(); }

  // A Claude Code login: its tokens are opaque, so a pane's renewal is staged and listed for the owner, never applied.
  const c = workspace();
  try {
    writeClaude(c.home, claudeDoc(Date.now() + 10 * 60 * 1000));
    const dir = path.join(c.tmp, 'fgos-confinement', 'disp_claude', 'home');
    copyCredentialFiles(dir, c.home, [CLAUDE_LOGIN]);
    renewHome('claude', dir);
    const target = credentialWriteBackTarget({ provider: 'xai', accountId: 'acct', credentialSource: claudeSource(c.home), runtimeDir: c.runtimeDir });
    assert.equal(target.layout, 'claude-credentials-json');
    assert.deepEqual(writeBackRenewedCredential(dir, target), { status: 'staged' });
    const { spawnFn, starts } = fakeSpawn({ layoutName: 'claude', behaviour: () => {} });
    await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: claudeSource(c.home), runtimeDir: c.runtimeDir, spawnFn });
    assert.equal(starts.filter((s) => !path.basename(s.homeDir).startsWith('scratch-')).length, 0, 'a copy whose tokens name no account is never probed');
    assert.equal(readClaude(c.home).claudeAiOauth.refreshToken, FAKE.oldRefresh, 'the source login is not replaced');
    assert.equal(agentCopies(c).length, 1, 'the renewed login is kept for hand recovery');
    assert.deepEqual(inspectRetainedCredentialCopies({ runtimeDir: c.runtimeDir }).map(({ kind }) => kind), ['agent'], 'doctor lists it');
  } finally { c.cleanup(); }
});

// A copy's token claim is unverified until it renews: one that never renews must not stop the account's own
// renewal, and must not be called again and again.
// The CLI may redeem the copy's refresh token and the runner die before the renewed pair is kept: the copy is
// marked spent before the call, so no later holder redeems the same token again (OpenAI may revoke the whole family).
test('an agent\'s copy is marked spent before the call, and one found still marked is dropped without a call', async () => {
  const w = workspace();
  try {
    const { dir, target } = codexAgentHome(w);
    writeBackRenewedCredential(dir, target);
    const [copy] = agentCopies(w);
    let markedDuringCall = null;
    const { spawnFn } = fakeSpawn({ layoutName: 'codex', behaviour: (home) => {
      if (path.basename(home).startsWith('.tmp-')) markedDuringCall = fs.existsSync(path.join(w.accountDir, 'pending', copy, '.gate-spent'));
    } });
    await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: codexSource(w.home), runtimeDir: w.runtimeDir, spawnFn });
    assert.equal(markedDuringCall, true, 'the copy carries the spent mark while the CLI may redeem its token');
    assert.equal(fs.existsSync(path.join(w.accountDir, 'pending', copy, '.gate-spent')), false, 'a call that renewed nothing clears it');

    // What a runner that died during the call leaves: the mark is still there.
    fs.writeFileSync(path.join(w.accountDir, 'pending', copy, '.gate-spent'), '');
    const realWrite = process.stderr.write;
    process.stderr.write = () => true;
    let again;
    try {
      again = fakeSpawn({ layoutName: 'codex', behaviour: () => {} });
      await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: codexSource(w.home), runtimeDir: w.runtimeDir, spawnFn: again.spawnFn, cooldownMs: 0 });
    } finally { process.stderr.write = realWrite; }
    assert.equal(again.starts.filter((s) => path.basename(s.homeDir).startsWith('.tmp-')).length, 0, 'its spent token is never redeemed again');
    assert.deepEqual(agentCopies(w), []);
  } finally { w.cleanup(); }
});

// A copy the gate cannot even prepare (its isolated copy cannot be written) must not stay forever.
test('an agent\'s copy whose preparation fails counts its tries and is set aside after two', async () => {
  const w = workspace();
  try {
    const now = Date.now();
    const token = (exp, tag) => fakeJwt(exp, tag, codexAccountClaim('FAKE-ACCOUNT-LEASED'));
    writeOmp(w.home, [{ id: 1, data: ompData(now + 10 * 60 * 1000, { access: token(now + 10 * 60 * 1000, 'old') }) }]).close();
    const dir = path.join(w.tmp, 'fgos-confinement', 'disp_prep', 'home');
    writeOmp(dir, [{ id: 1, data: ompData(now + 6 * HOUR, { access: token(now + 6 * HOUR, 'pane'), refresh: 'FAKE-OMP-REFRESH-PANE' }) }]).close();
    writeBackRenewedCredential(dir, credentialWriteBackTarget({ provider: 'xai', accountId: 'acct', credentialSource: ompSource(w.home), runtimeDir: w.runtimeDir }));
    // SQLite that cannot write the isolated copy, and works everywhere else.
    const loadSqlite = () => ({ DatabaseSync: class extends DatabaseSync {
      constructor(file, options) { if (!options?.readOnly && path.basename(path.dirname(file)).startsWith('.tmp-')) throw new Error('isolated copy not writable'); super(file, options); }
    } });
    for (const run of [1, 2]) {
      const { spawnFn, starts } = fakeSpawn({ layoutName: 'omp', behaviour: () => {} });
      await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: ompSource(w.home), runtimeDir: w.runtimeDir, spawnFn, loadSqlite, cooldownMs: 0 });
      assert.equal(starts.filter((s) => path.basename(s.homeDir).startsWith('.tmp-')).length, 0, `no call is made on a copy that was not prepared (${run})`);
      assert.equal(agentCopies(w).length, run === 1 ? 1 : 0, `after ${run} failed preparation(s)`);
    }
    assert.equal(fs.readdirSync(path.join(w.accountDir, 'torn')).length, 1, 'it is set aside for the owner');
  } finally { w.cleanup(); }
});

test('an agent\'s copy whose renewal returns nothing never cools the account: its own renewal still runs, and after two calls the copy is set aside for the owner', async () => {
  const w = workspace();
  try {
    const { dir, target } = codexAgentHome(w);
    writeBackRenewedCredential(dir, target);
    const kinds = (starts) => starts.map((s) => (path.basename(s.homeDir).startsWith(SCRATCH) ? 'account' : 'copy'));
    const first = fakeSpawn({ layoutName: 'codex', behaviour: () => {}, output: 'Error: 401 Unauthorized', exitCode: 1 });
    await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: codexSource(w.home), runtimeDir: w.runtimeDir, spawnFn: first.spawnFn });
    assert.deepEqual(kinds(first.starts), ['copy', 'account'], 'the account\'s own renewal ran after the copy\'s call');
    assert.equal(agentCopies(w).length, 1, 'one failed call keeps the copy');
    const second = fakeSpawn({ layoutName: 'codex', behaviour: () => {}, output: 'Error: 401 Unauthorized', exitCode: 1 });
    await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: codexSource(w.home), runtimeDir: w.runtimeDir, spawnFn: second.spawnFn, cooldownMs: 0 });
    assert.deepEqual(agentCopies(w), [], 'after the second call the copy leaves the pending copies');
    assert.equal(fs.readdirSync(path.join(w.accountDir, 'torn')).length, 1, 'it is kept under torn/ for the owner');
    assert.deepEqual(inspectRetainedCredentialCopies({ runtimeDir: w.runtimeDir }).map((c) => c.kind), ['set-aside'], 'doctor tells it from a half-written copy');
    assert.equal(readCodex(w.home).tokens.refresh_token, 'FAKE-CODEX-REFRESH-old');
  } finally { w.cleanup(); }
});

// A copy an older release staged from a private home has no origin in its name: only fgOS's own names skip the gate.
test('a pending copy named the way an older release staged a private home goes through the probe gate', async () => {
  const w = workspace();
  try {
    writePi(w.home, piDoc(Date.now() + 10 * 60 * 1000));
    const copy = path.join(w.accountDir, 'pending', `${String(Date.now()).padStart(15, '0')}-4242-abcdef01`);
    writePi(copy, piDoc(Date.now() + 6 * HOUR, { access: FAKE.newAccess, refresh: FAKE.newRefresh }));
    const { spawnFn } = fakeSpawn({ layoutName: 'pi', behaviour: () => {} });
    await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn });
    assert.equal(readPi(w.home).xai.refresh, FAKE.oldRefresh, 'an unproven copy was applied without the gate');
    assert.equal(fs.existsSync(copy), true, 'it is kept for the owner');
  } finally { w.cleanup(); }
});

// The access token in a copy may be one the leased account really issued, beside the refresh token of another
// account: only what that refresh token yields says whose login the copy is.
test('a copy holding the leased account\'s access token and another account\'s refresh token is never applied', async () => {
  const w = workspace();
  const realWrite = process.stderr.write;
  try {
    const { dir, target } = codexAgentHome(w);
    writeBackRenewedCredential(dir, target);
    process.stderr.write = () => true;
    // Only the copy's own refresh token belongs to another account; the leased store renews nothing here.
    const { spawnFn } = fakeSpawn({ layoutName: 'codex', behaviour: (home) => { if (path.basename(home).startsWith('.tmp-')) renewCodexAs('FAKE-ACCOUNT-OTHER')(home); } });
    await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: codexSource(w.home), runtimeDir: w.runtimeDir, spawnFn });
    process.stderr.write = realWrite;
    assert.equal(readCodex(w.home).tokens.refresh_token, 'FAKE-CODEX-REFRESH-old', 'the login of another account reached the leased store');
    assert.deepEqual(fs.readdirSync(path.join(w.accountDir, 'pending')), [], 'neither the copy nor what it renewed is kept');
  } finally { process.stderr.write = realWrite; w.cleanup(); }
});

test('an omp copy reaches the probe as a fresh database with its login rows alone, and is applied once it renews as the leased account', async () => {
  const w = workspace();
  try {
    const now = Date.now();
    const token = (exp, tag) => fakeJwt(exp, tag, codexAccountClaim('FAKE-ACCOUNT-LEASED'));
    writeOmp(w.home, [{ id: 1, data: ompData(now + 10 * 60 * 1000, { access: token(now + 10 * 60 * 1000, 'old') }) }]).close();
    const dir = path.join(w.tmp, 'fgos-confinement', 'disp_omp_gate', 'home');
    const agentDb = writeOmp(dir, [{ id: 1, data: ompData(now + 6 * HOUR, { access: token(now + 6 * HOUR, 'pane'), refresh: 'FAKE-OMP-REFRESH-PANE' }) }]);
    agentDb.exec("CREATE TABLE settings (k TEXT, v TEXT); INSERT INTO settings VALUES ('hook', 'PLANTED')");
    agentDb.close();
    const target = credentialWriteBackTarget({ provider: 'xai', accountId: 'acct', credentialSource: ompSource(w.home), runtimeDir: w.runtimeDir });
    assert.equal(writeBackRenewedCredential(dir, target).status, 'staged');

    let tables;
    const inner = fakeSpawn({ layoutName: 'omp', behaviour: (home) => {
      const db = new DatabaseSync(path.join(home, 'agent.db'));
      tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => row.name);
      db.prepare('UPDATE auth_credentials SET data = ? WHERE id = 1').run(JSON.stringify(ompData(Date.now() + 8 * HOUR, { access: token(Date.now() + 8 * HOUR, 'probe'), refresh: 'FAKE-OMP-REFRESH-PROBE' })));
      db.close();
    } });
    let probeArgs = [];
    const spawnFn = (command, args, options) => { probeArgs = args; return inner.spawnFn(command, args, options); };
    await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: ompSource(w.home), runtimeDir: w.runtimeDir, spawnFn });
    assert.deepEqual(tables, ['auth_credentials'], 'the agent\'s other tables never reach the CLI');
    assert.ok(probeArgs.includes('--no-tools') && !probeArgs.includes('--tools'), 'the renewal call gets no tools');
    assert.equal(JSON.parse(readOmpRows(w.home)[0].data).refresh, 'FAKE-OMP-REFRESH-PROBE');
  } finally { w.cleanup(); }
});

test('a home that holds nothing newer, or an unreadable copy, writes nothing and stages nothing', () => {
  const w = workspace();
  try {
    writePi(w.home, piDoc(Date.now() + HOUR));
    const dir = path.join(w.tmp, 'h');
    copyCredentialFiles(dir, w.home, ['auth.json']);
    const marker = credentialWriteBackTarget({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir });
    assert.deepEqual(writeBackRenewedCredential(dir, marker), { status: 'unchanged' });
    fs.writeFileSync(path.join(dir, 'auth.json'), `{"xai": {"refresh": "${FAKE.newRefresh}"`);
    assert.deepEqual(writeBackRenewedCredential(dir, marker), { status: 'unchanged' });
    assert.deepEqual(writeBackRenewedCredential(dir, undefined), { status: 'none' });
    assert.equal(fs.existsSync(w.accountDir), false);
  } finally { w.cleanup(); }
});

// ---------------------------------------------------------------------------------------------------
// No credential value anywhere it should not be
// ---------------------------------------------------------------------------------------------------

test('no token string appears in any result, cooldown record, lock record, marker or stderr a renewal produces', async () => {
  const w = workspace();
  const captured = [];
  const realWrite = process.stderr.write;
  try {
    process.stderr.write = (chunk) => { captured.push(String(chunk)); return true; };
    writePi(w.home, piDoc(Date.now() + 10 * 60 * 1000));
    const results = [];
    const failing = fakeSpawn({ layoutName: 'pi', behaviour: () => {}, output: `Error: OAuth refresh failed ${FAKE.oldRefresh}`, exitCode: 1 });
    results.push(await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn: failing.spawnFn }));
    const ok = fakeSpawn({ layoutName: 'pi' });
    results.push(await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn: ok.spawnFn, cooldownMs: 0 }));
    const dir = privateHomeWithRenewedLogin(w, { dispatchId: 'disp_scan', accountHomeExpiryMs: Date.now() + 10 * 60 * 1000 });
    results.push(writeBackRenewedCredential(dir, targetOf(dir)));
    process.stderr.write = realWrite;

    const everything = [JSON.stringify(results), captured.join('')];
    const walk = (d) => {
      for (const name of fs.readdirSync(d)) {
        const full = path.join(d, name);
        // The account's store and the pending copies of it are logins by design; everything else must name none.
        if (fs.statSync(full).isDirectory()) { if (name !== 'pending') walk(full); } else if (!full.startsWith(w.home)) everything.push(fs.readFileSync(full, 'utf8'));
      }
    };
    walk(w.runtimeDir);
    for (const text of everything) {
      for (const fragment of FAKE_FRAGMENTS) assert.equal(text.includes(fragment), false, `a token fragment leaked: ${fragment}`);
    }
  } finally { process.stderr.write = realWrite; w.cleanup(); }
});

// ---------------------------------------------------------------------------------------------------
// A copy renewed earlier is applied by its refresh token, not by whether its access token is still good
// ---------------------------------------------------------------------------------------------------

test('a staged copy applied after its access token expired is applied, while a fresh renewal result must still be in the future', () => {
  const w = workspace();
  try {
    const now = Date.now();
    writePi(w.home, piDoc(now - 5 * HOUR));
    const copy = path.join(w.tmp, 'copy');
    writePi(copy, piDoc(now - 2 * HOUR, { refresh: FAKE.newRefresh }));
    const base = { layoutName: 'pi-auth-json', sourceHome: w.home, copyHome: copy, provider: 'xai' };
    assert.equal(applyRenewedCredential({ ...base }).status, 'unchanged', 'a fresh renewal that is already expired renewed nothing');
    assert.equal(applyRenewedCredential({ ...base, requireFuture: false }).status, 'applied');
    assert.equal(readPi(w.home).xai.refresh, FAKE.newRefresh);
  } finally { w.cleanup(); }
});

test('a leftover scratch copy whose call never ran (same refresh token, expiry that merely looks later) is never applied', async () => {
  const w = workspace();
  try {
    const now = Date.now();
    writePi(w.home, piDoc(now + 5 * HOUR));
    const original = sha(path.join(w.home, 'auth.json'));
    writePi(path.join(w.accountDir, 'scratch-1-1'), piDoc(now + 8 * HOUR)); // same refresh token as the source
    const { spawnFn, starts } = fakeSpawn({ layoutName: 'pi' });
    const result = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn });
    assert.equal(result.status, 'fresh');
    assert.equal(starts.length, 0);
    assert.equal(sha(path.join(w.home, 'auth.json')), original);
    assert.equal(fs.existsSync(path.join(w.accountDir, 'scratch-1-1')), false, 'the useless copy is removed');
  } finally { w.cleanup(); }
});

test('a call that leaves the refresh token as it was renewed nothing, whatever the expiry says', async () => {
  const w = workspace();
  try {
    writePi(w.home, piDoc(Date.now() + 10 * 60 * 1000));
    const original = sha(path.join(w.home, 'auth.json'));
    const { spawnFn } = fakeSpawn({
      behaviour: (dir) => { const doc = readPi(dir); doc.xai.expires = Date.now() + 6 * HOUR; writePi(dir, doc); },
    });
    const result = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn });
    assert.deepEqual(result, { status: 'failed', reason: 'not-renewed' });
    assert.equal(sha(path.join(w.home, 'auth.json')), original);
  } finally { w.cleanup(); }
});

// ---------------------------------------------------------------------------------------------------
// Only the dispatched provider's entry counts
// ---------------------------------------------------------------------------------------------------

test('an expired login of an unrelated provider in the same store never starts a renewal', async () => {
  const w = workspace();
  try {
    const now = Date.now();
    writePi(w.home, { ...piDoc(now + 6 * HOUR), 'github-copilot': { type: 'oauth', access: 'x', refresh: 'y', expires: now - 30 * 24 * HOUR } });
    const piStarts = fakeSpawn({ layoutName: 'pi' });
    const piResult = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn: piStarts.spawnFn });
    assert.deepEqual(piResult, { status: 'fresh', reason: 'outside-window' });
    assert.equal(piStarts.starts.length, 0);

    const omp = path.join(w.tmp, 'omp');
    writeOmp(omp, [
      { id: 1, provider: 'xai-oauth', data: ompData(now + 6 * HOUR) },
      { id: 2, provider: 'github-copilot', data: ompData(now - 30 * 24 * HOUR, { access: FAKE.other }) },
    ]).close();
    const ompStarts = fakeSpawn({ layoutName: 'omp' });
    const ompResult = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: ompSource(omp), runtimeDir: w.runtimeDir, spawnFn: ompStarts.spawnFn });
    assert.equal(ompResult.status, 'fresh');
    assert.equal(ompStarts.starts.length, 0);
  } finally { w.cleanup(); }
});

test('only the dispatched provider\'s entry is made due in the scratch copy and applied; the prefixed omp row is matched', async () => {
  const w = workspace();
  try {
    const now = Date.now();
    writeOmp(w.home, [
      { id: 1, provider: 'xai-oauth', data: ompData(now + 10 * 60 * 1000) },
      { id: 2, provider: 'github-copilot', data: ompData(now + 20 * 60 * 1000, { access: FAKE.other }) },
    ]).close();
    const otherBefore = readOmpRows(w.home)[1].data;
    let otherInScratch = null;
    const { spawnFn, starts } = fakeSpawn({
      layoutName: 'omp',
      onStart: (dir) => { otherInScratch = readOmpRows(dir)[1].data; },
    });
    const result = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: ompSource(w.home), runtimeDir: w.runtimeDir, spawnFn });
    assert.equal(result.status, 'renewed');
    assert.equal(starts.length, 1);
    assert.equal(otherInScratch, otherBefore, 'the unrelated row was not made due');
    assert.equal(readOmpRows(w.home)[1].data, otherBefore, 'and was not applied over');
    assert.equal(JSON.parse(readOmpRows(w.home)[0].data).refresh, FAKE.newRefresh);
  } finally { w.cleanup(); }
});

test('a store whose entry cannot be told apart is skipped, and a lone oauth entry is the one only when it belongs to the dispatched provider', async () => {
  const w = workspace();
  try {
    const now = Date.now();
    const { spawnFn, starts } = fakeSpawn({ layoutName: 'pi' });
    const run = () => refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn });

    writePi(w.home, { xai: piDoc(now + 10 * 60 * 1000).xai, 'xai-extra': { type: 'oauth', access: 'a', refresh: 'b', expires: now + 10 * 60 * 1000 } });
    assert.deepEqual(await run(), { status: 'skipped', reason: 'entry-unidentified' }, 'several matches');
    writePi(w.home, { 'github-copilot': { type: 'oauth', access: 'a', refresh: 'b', expires: now + 10 * 60 * 1000 }, other: { type: 'oauth', access: 'a', refresh: 'b', expires: now + 10 * 60 * 1000 } });
    assert.deepEqual(await run(), { status: 'skipped', reason: 'entry-unidentified' }, 'no match');
    assert.equal(starts.length, 0);

    writePi(w.home, { 'xai-team': { type: 'oauth', access: FAKE.oldAccess, refresh: FAKE.oldRefresh, expires: now + 10 * 60 * 1000 } });
    const solo = fakeSpawn({
      behaviour: (dir) => { const doc = readPi(dir); doc['xai-team'] = { ...doc['xai-team'], refresh: FAKE.newRefresh, expires: now + 6 * HOUR }; writePi(dir, doc); },
    });
    const result = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn: solo.spawnFn });
    assert.equal(result.status, 'renewed');
    assert.equal(readPi(w.home)['xai-team'].refresh, FAKE.newRefresh);
  } finally { w.cleanup(); }
});

// ---------------------------------------------------------------------------------------------------
// The call ends on its own; a failed snapshot is said
// ---------------------------------------------------------------------------------------------------

test('the renewal call is wrapped in coreutils timeout, and runs unwrapped when timeout is not on PATH', async (t) => {
  const onPath = (process.env.PATH ?? '').split(path.delimiter).some((d) => fs.existsSync(path.join(d, 'timeout')));
  const w = workspace();
  try {
    writePi(w.home, piDoc(Date.now() + 10 * 60 * 1000));
    if (onPath) {
      const wrapped = fakeSpawn({ layoutName: 'pi' });
      await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn: wrapped.spawnFn, probeTimeoutMs: 90_000 });
      assert.match(path.basename(wrapped.starts[0].command), /^timeout$/);
      assert.deepEqual(wrapped.starts[0].args.slice(0, 3), ['--kill-after=5', '90', 'pi']);
    } else t.diagnostic('timeout is not on PATH here');

    writePi(w.home, piDoc(Date.now() + 10 * 60 * 1000));
    const bare = fakeSpawn({ layoutName: 'pi' });
    await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn: bare.spawnFn, env: { PATH: '/nonexistent-dir' }, cooldownMs: 0 });
    assert.equal(bare.starts[0].command, 'pi');
  } finally { w.cleanup(); }
});

test('a failed snapshot with node:sqlite present copies the file as it is and says so by code, without a path or a value', () => {
  const w = workspace();
  const captured = [];
  const realWrite = process.stderr.write;
  try {
    writeOmp(w.home, [{ id: 1, data: ompData(Date.now() + HOUR) }]).close();
    const brokenSqlite = { DatabaseSync: class { constructor() { throw new Error(`cannot open ${w.home}`); } } };
    process.stderr.write = (chunk) => { captured.push(String(chunk)); return true; };
    copyCredentialFiles(path.join(w.tmp, 'private-home'), w.home, ['agent.db'], { loadSqlite: () => brokenSqlite });
    process.stderr.write = realWrite;
    assert.deepEqual(fs.readFileSync(path.join(w.tmp, 'private-home', 'agent.db')), fs.readFileSync(path.join(w.home, 'agent.db')));
    assert.equal(captured.length, 1);
    assert.match(captured[0], /credential-snapshot-failed/);
    assert.equal(captured[0].includes(w.home), false);
  } finally { process.stderr.write = realWrite; w.cleanup(); }
});

// ---------------------------------------------------------------------------------------------------
// A copy is removed only when the source proves it is not newer
// ---------------------------------------------------------------------------------------------------

const TORN = '{"xai": {"ty';
const pendingCopies = (w) => {
  const dir = path.join(w.accountDir, 'pending');
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((n) => !n.startsWith('.')).map((n) => path.join(dir, n)) : [];
};
const scratchCopies = (w) => (fs.existsSync(w.accountDir) ? fs.readdirSync(w.accountDir).filter((n) => n.startsWith('scratch-')) : []);

test('a lone oauth entry of another provider is not the dispatched provider\'s: nothing is spawned', async () => {
  const w = workspace();
  try {
    writePi(w.home, { 'github-copilot': { type: 'oauth', access: 'a', refresh: 'b', expires: Date.now() - 30 * 24 * HOUR } });
    const { spawnFn, starts } = fakeSpawn({ layoutName: 'pi' });
    const result = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn });
    assert.deepEqual(result, { status: 'skipped', reason: 'entry-unidentified' });
    assert.equal(starts.length, 0);
  } finally { w.cleanup(); }
});

test('a renewal whose source is half-written afterwards keeps the renewed copy in pending and reports it as deferred', async () => {
  const w = workspace();
  try {
    writePi(w.home, piDoc(Date.now() + 10 * 60 * 1000));
    const { spawnFn } = fakeSpawn({
      layoutName: 'pi',
      behaviour: (dir) => { renewHome('pi', dir); fs.writeFileSync(path.join(w.home, 'auth.json'), TORN); },
    });
    const result = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn });
    assert.deepEqual(result, { status: 'failed', reason: 'apply-deferred' });
    assert.deepEqual(scratchCopies(w), []);
    const kept = pendingCopies(w);
    assert.equal(kept.length, 1);
    assert.equal(readPi(kept[0]).xai.refresh, FAKE.newRefresh);
    assert.equal(sha(path.join(w.home, 'auth.json')), TORN, 'the source is untouched');

    // The owner's CLI finishes its write; the next holder applies the kept copy.
    writePi(w.home, piDoc(Date.now() + 10 * 60 * 1000));
    const next = fakeSpawn({ layoutName: 'pi' });
    const again = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn: next.spawnFn, cooldownMs: 0 });
    assert.equal(again.status, 'fresh');
    assert.equal(readPi(w.home).xai.refresh, FAKE.newRefresh);
    assert.deepEqual(pendingCopies(w), []);
  } finally { w.cleanup(); }
});

test('a renewal whose provider entry vanishes from the source keeps the renewed copy', async () => {
  const w = workspace();
  try {
    writePi(w.home, piDoc(Date.now() + 10 * 60 * 1000));
    const { spawnFn } = fakeSpawn({
      layoutName: 'pi',
      behaviour: (dir) => { renewHome('pi', dir); writePi(w.home, { 'github-copilot': { type: 'oauth', access: 'a', refresh: 'b', expires: Date.now() + HOUR } }); },
    });
    const result = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn });
    assert.deepEqual(result, { status: 'failed', reason: 'apply-deferred' });
    assert.equal(pendingCopies(w).length, 1);
  } finally { w.cleanup(); }
});

test('an omp store that cannot be opened after the call keeps the renewed copy', async () => {
  const w = workspace();
  try {
    writeOmp(w.home, [{ id: 1, data: ompData(Date.now() + 10 * 60 * 1000) }]).close();
    const { spawnFn } = fakeSpawn({
      layoutName: 'omp',
      behaviour: (dir) => { renewHome('omp', dir); fs.writeFileSync(path.join(w.home, 'agent.db'), 'not a database'); },
    });
    const result = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: ompSource(w.home), runtimeDir: w.runtimeDir, spawnFn });
    assert.deepEqual(result, { status: 'failed', reason: 'apply-deferred' });
    const kept = pendingCopies(w);
    assert.equal(kept.length, 1);
    assert.match(readOmpRows(kept[0])[0].data, new RegExp(FAKE.newRefresh));
  } finally { w.cleanup(); }
});

test('a leftover copy is kept while the source cannot be read or identified, and removed once the source proves it is not newer', () => {
  const w = workspace();
  try {
    const now = Date.now();
    const copy = path.join(w.accountDir, 'pending', '000000000000001-0000000a');
    writePi(copy, piDoc(now + 6 * HOUR, { access: FAKE.newAccess, refresh: FAKE.newRefresh }));
    const apply = () => applyRenewedCredential({ layoutName: 'pi-auth-json', sourceHome: w.home, copyHome: copy, provider: 'xai', requireFuture: false });

    fs.writeFileSync(path.join(w.home, 'auth.json'), TORN);
    assert.deepEqual(apply(), { status: 'apply-deferred', code: 'unreadable-json' });
    fs.rmSync(path.join(w.home, 'auth.json'));
    assert.deepEqual(apply(), { status: 'apply-deferred', code: 'missing-file' });
    writePi(w.home, { 'github-copilot': { type: 'oauth', access: 'a', refresh: 'b', expires: now + HOUR } });
    assert.deepEqual(apply(), { status: 'apply-deferred', code: 'entry-unidentified' });

    writePi(w.home, piDoc(now + 10 * HOUR, { access: 'FAKE-NEWER', refresh: 'FAKE-NEWER-REFRESH' }));
    assert.equal(apply().status, 'unchanged');
    fs.writeFileSync(path.join(copy, 'auth.json'), TORN);
    assert.equal(apply().status, 'unreadable', 'a copy that is itself malformed is unusable');
  } finally { w.cleanup(); }
});

test('a copy whose store hits an operating-system read error is kept; only a copy with no store is unusable', () => {
  const w = workspace();
  try {
    writePi(w.home, piDoc(Date.now() + HOUR));
    const apply = (copy) => applyRenewedCredential({ layoutName: 'pi-auth-json', sourceHome: w.home, copyHome: copy, provider: 'xai', requireFuture: false });

    // Reading a directory as the store fails with EISDIR, an error that is not "no such file".
    const unreadable = path.join(w.tmp, 'copy-unreadable');
    fs.mkdirSync(path.join(unreadable, 'auth.json'), { recursive: true });
    assert.deepEqual(apply(unreadable), { status: 'apply-deferred', code: 'unreadable-file' });

    const empty = path.join(w.tmp, 'copy-empty');
    fs.mkdirSync(empty, { recursive: true });
    assert.deepEqual(apply(empty), { status: 'unreadable', code: 'missing-file' });
  } finally { w.cleanup(); }
});

test('write-back stages a renewed home when the source is half-written, and the leftover stays pending', () => {
  const w = workspace();
  try {
    const dir = privateHomeWithRenewedLogin(w);
    fs.writeFileSync(path.join(w.home, 'auth.json'), TORN);
    const result = writeBackRenewedCredential(dir, targetOf(dir));
    assert.deepEqual(result, { status: 'staged' });
    const kept = pendingCopies(w);
    assert.equal(kept.length, 1);
    assert.equal(readPi(kept[0]).xai.refresh, FAKE.newRefresh);
    assert.equal(sha(path.join(w.home, 'auth.json')), TORN);
  } finally { w.cleanup(); }
});

test('a copy without a refresh token never replaces a source entry that has one', async () => {
  const w = workspace();
  try {
    writePi(w.home, piDoc(Date.now() + HOUR));
    const original = sha(path.join(w.home, 'auth.json'));
    const copy = path.join(w.tmp, 'copy');
    writePi(copy, { xai: { type: 'oauth', access: FAKE.newAccess, expires: Date.now() + 6 * HOUR } });
    const result = applyRenewedCredential({ layoutName: 'pi-auth-json', sourceHome: w.home, copyHome: copy, provider: 'xai' });
    assert.equal(result.status, 'unchanged');
    assert.equal(sha(path.join(w.home, 'auth.json')), original);
  } finally { w.cleanup(); }
});

test('a write-back target with an unsafe provider or account id is refused, not trusted', () => {
  const w = workspace();
  try {
    for (const bad of ['../x', 'a/b', '', '-a', 'a b', undefined, 7]) {
      assert.equal(credentialWriteBackTarget({ provider: bad, accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir }), null, String(bad));
      assert.equal(credentialWriteBackTarget({ provider: 'xai', accountId: bad, credentialSource: piSource(w.home), runtimeDir: w.runtimeDir }), null, String(bad));
    }
    const good = credentialWriteBackTarget({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir });
    for (const bad of ['../x', 'a/b', '']) {
      const marker = { ...good, accountId: bad };
      assert.deepEqual(writeBackRenewedCredential(w.tmp, marker), { status: 'failed', code: 'invalid-target' }, bad);
    }
  } finally { w.cleanup(); }
});

// ---------------------------------------------------------------------------------------------------
// A copy that cannot be read for a reason that may pass is kept, never dropped
// ---------------------------------------------------------------------------------------------------

function privateOmpHomeWithRenewedLogin(w, dispatchId = 'disp_omp_keep') {
  const holder = writeOmp(w.home, [{ id: 1, data: ompData(Date.now() + 10 * 60 * 1000) }], { wal: true });
  const dir = path.join(w.tmp, 'fgos-confinement', dispatchId, 'home');
  fs.mkdirSync(dir, { recursive: true });
  writeOwnershipMarker(dir, { dispatchId });
  copyCredentialFiles(dir, w.home, ['agent.db']);
  targets.set(dir, credentialWriteBackTarget({ provider: 'xai', accountId: 'acct', credentialSource: ompSource(w.home), runtimeDir: w.runtimeDir }));
  renewHome('omp', dir);
  holder.close();
  return dir;
}

test('an omp copy that cannot be read because node:sqlite is unavailable is staged, not dropped', () => {
  const w = workspace();
  try {
    const dir = privateOmpHomeWithRenewedLogin(w);
    const marker = targetOf(dir);
    const result = writeBackRenewedCredential(dir, marker, { loadSqlite: () => null });
    assert.deepEqual(result, { status: 'staged' });
    const kept = pendingCopies(w);
    assert.equal(kept.length, 1);
    // Read back with the module available: the staged files hold the renewed login.
    assert.match(readOmpRows(kept[0])[0].data, new RegExp(FAKE.newRefresh));
  } finally { w.cleanup(); }
});

test('a copy that parses but holds no usable entry, or is corrupt, is still dropped as proven malformed', () => {
  const w = workspace();
  try {
    writePi(w.home, piDoc(Date.now() + HOUR));
    const dir = path.join(w.tmp, 'h');
    copyCredentialFiles(dir, w.home, ['auth.json']);
    const marker = credentialWriteBackTarget({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir });
    fs.writeFileSync(path.join(dir, 'auth.json'), '[]');
    assert.deepEqual(writeBackRenewedCredential(dir, marker), { status: 'unchanged' });
    fs.writeFileSync(path.join(dir, 'auth.json'), TORN);
    assert.deepEqual(writeBackRenewedCredential(dir, marker), { status: 'unchanged' });
    assert.deepEqual(pendingCopies(w), []);
  } finally { w.cleanup(); }
});

// Write-back runs once the attempt's processes are gone: a login file the agent made unreadable cannot keep its
// home forever.
test('a login file that cannot be read once its attempt is over is no login: the home is not kept for it', () => {
  const w = workspace();
  try {
    const dir = privateHomeWithRenewedLogin(w);
    const marker = targetOf(dir);
    fs.chmodSync(path.join(dir, 'auth.json'), 0o000);
    if (process.getuid?.() === 0) { fs.chmodSync(path.join(dir, 'auth.json'), 0o600); return; } // root reads anything
    const result = writeBackRenewedCredential(dir, marker);
    fs.chmodSync(path.join(dir, 'auth.json'), 0o600);
    assert.deepEqual(result, { status: 'failed', code: 'home-unreadable' });
  } finally { w.cleanup(); }
});

test('a link or a pipe planted as the home\'s login is never followed or waited on: the write-back takes it for no login', () => {
  const w = workspace();
  try {
    // A newer login the agent can point at but not write: a link to it must not be staged as the home's.
    const elsewhere = path.join(w.tmp, 'elsewhere');
    writePi(elsewhere, piDoc(Date.now() + 9 * HOUR, { access: 'FAKE-ELSEWHERE', refresh: 'FAKE-ELSEWHERE-REFRESH' }));
    const linked = privateHomeWithRenewedLogin(w, { dispatchId: 'disp_link' });
    fs.rmSync(path.join(linked, 'auth.json'));
    fs.symlinkSync(path.join(elsewhere, 'auth.json'), path.join(linked, 'auth.json'));
    assert.deepEqual(writeBackRenewedCredential(linked, targetOf(linked)), { status: 'unchanged' });

    const piped = privateHomeWithRenewedLogin(w, { dispatchId: 'disp_fifo' });
    fs.rmSync(path.join(piped, 'auth.json'));
    let made = true;
    try { execFileSync('mkfifo', [path.join(piped, 'auth.json')]); } catch { made = false; }
    if (made) {
      const started = Date.now();
      assert.deepEqual(writeBackRenewedCredential(piped, targetOf(piped)), { status: 'unchanged' });
      assert.ok(Date.now() - started < 2000, 'the read did not wait on the pipe');
    }
    assert.equal(readPi(w.home).xai.refresh, FAKE.oldRefresh, 'the source is untouched');
    assert.equal(fs.existsSync(path.join(w.accountDir, 'pending')) ? fs.readdirSync(path.join(w.accountDir, 'pending')).length : 0, 0, 'nothing was staged');
  } finally { w.cleanup(); }
});

test('an omp store or sidecar planted as a link is never opened by SQLite: the write-back takes the copy for no login', () => {
  const w = workspace();
  try {
    writeOmp(w.home, [{ id: 1, data: ompData(Date.now() + 10 * 60 * 1000) }], { wal: true }).close();
    const outside = path.join(w.tmp, 'outside-file');
    fs.writeFileSync(outside, 'HOST-BYTES');
    for (const name of ['agent.db', 'agent.db-wal', 'agent.db-shm']) {
      const dir = ompPaneHome(w, `disp_link_${name}`, 'FAKE-WAL-BYTES');
      fs.rmSync(path.join(dir, name), { force: true });
      fs.symlinkSync(outside, path.join(dir, name));
      // The store itself is no login; a log that cannot be read is no login once the attempt is over.
      assert.deepEqual(writeBackRenewedCredential(dir, targetOf(dir)), name === 'agent.db-wal' ? { status: 'failed', code: 'home-unreadable' } : { status: 'unchanged' }, name);
    }
    assert.equal(fs.readFileSync(outside, 'utf8'), 'HOST-BYTES', 'the linked host file is untouched');
  } finally { w.cleanup(); }
});

test('the marker is rewritten whole, and a marker that cannot be read stops the removal', () => {
  const w = workspace();
  try {
    const dir = privateHomeWithRenewedLogin(w);
    const marker = path.join(dir, OWNERSHIP_MARKER_FILE);
    rewriteOwnershipMarker(dir, { credentialKept: { attempts: 1 } });
    assert.equal(markerOf(dir).credentialKept.attempts, 1);
    assert.deepEqual(fs.readdirSync(dir).filter((n) => /\.tmp$/.test(n)), [], 'no temp file is left behind');

    // A torn marker (a writer died half-way) does not prove the home holds no login.
    fs.writeFileSync(marker, '{"contract": "');
    assert.throws(() => removeConfinementDir(dir), /ownership-marker-unreadable/);
    assert.equal(fs.existsSync(path.join(dir, 'auth.json')), true, 'the renewed login is still in the home');
  } finally { w.cleanup(); }
});



test('staging a login syncs the staged file, its directory and the pending directory, each on its own', () => {
  const w = workspace();
  try {
    const dir = privateHomeWithRenewedLogin(w);
    fs.writeFileSync(path.join(w.home, 'auth.json'), TORN);
    const opened = new Map();
    const synced = [];
    const realOpen = fs.openSync;
    const realSync = fs.fsyncSync;
    fs.openSync = (file, ...rest) => { const fd = realOpen(file, ...rest); opened.set(fd, String(file)); return fd; };
    fs.fsyncSync = (fd) => { synced.push(opened.get(fd)); return realSync(fd); };
    let result;
    // The lock is busy, so no lock bookkeeping adds syncs of its own.
    try { result = writeBackRenewedCredential(dir, targetOf(dir), { tryLock: () => null }); } finally { fs.openSync = realOpen; fs.fsyncSync = realSync; }
    assert.equal(result.status, 'staged');
    const pendingDir = path.join(w.accountDir, 'pending');
    assert.equal(synced.filter((f) => /\/\.tmp-[^/]+\/auth\.json$/.test(f)).length, 1, 'the staged file');
    assert.equal(synced.filter((f) => /\/\.tmp-[^/]+$/.test(f)).length, 1, 'the staging directory');
    assert.equal(synced.filter((f) => f === pendingDir).length, 1, 'the pending directory');
  } finally { w.cleanup(); }
});

test('a pipe or a link in place of the home marker stops the removal at once, never waited on or followed', () => {
  const w = workspace();
  try {
    const cleanupUrl = pathToFileURL(path.resolve('src/runner/dispatch/confinement/cleanup.mjs')).href;
    for (const plant of [(file) => execFileSync('mkfifo', [file]), (file) => fs.symlinkSync(path.join(w.home, 'auth.json'), file)]) {
      const dir = privateHomeWithRenewedLogin(w);
      const marker = path.join(dir, OWNERSHIP_MARKER_FILE);
      fs.rmSync(marker, { force: true });
      plant(marker);
      const script = `import { removeConfinementDir } from ${JSON.stringify(cleanupUrl)}; try { removeConfinementDir(${JSON.stringify(dir)}); } catch (err) { process.stdout.write(err.message); }`;
      const said = execFileSync(process.execPath, ['--input-type=module', '-e', script], { timeout: 5000, encoding: 'utf8' });
      assert.match(said, /ownership-marker-unreadable/);
      assert.equal(fs.existsSync(path.join(dir, 'auth.json')), true, 'the renewed login is still in the home');
      fs.rmSync(dir, { recursive: true, force: true });
    }
  } finally { w.cleanup(); }
});

test('a marker file that is no fgOS marker at all stops the removal; one that names a contract is the caller\'s question', () => {
  const w = workspace();
  try {
    for (const content of ['{}', 'null', '{"dispatchId":"x"}', '[]', '']) {
      const dir = privateHomeWithRenewedLogin(w);
      fs.writeFileSync(path.join(dir, OWNERSHIP_MARKER_FILE), content);
      assert.throws(() => removeConfinementDir(dir), /ownership-marker-unreadable/, JSON.stringify(content));
      assert.equal(fs.existsSync(path.join(dir, 'auth.json')), true);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  } finally { w.cleanup(); }
});

const IMPORT_INTO_CONFINEMENT = /(?:from\s*|import\s*\(\s*|import\s+)['"`][^'"`]*confinement\//;

test('no provider module reaches into confinement, by a static or a dynamic import', () => {
  for (const sample of ["import x from './confinement/a.mjs'", "await import('./confinement/a.mjs')", 'await import(`./confinement/a.mjs`)']) {
    assert.match(sample, IMPORT_INTO_CONFINEMENT);
  }
  const dir = path.join(path.dirname(new URL(import.meta.url).pathname), '../../src/runner/dispatch');
  const offenders = fs.readdirSync(dir)
    .filter((name) => /^provider-.*\.mjs$/.test(name))
    .filter((name) => IMPORT_INTO_CONFINEMENT.test(fs.readFileSync(path.join(dir, name), 'utf8')));
  assert.deepEqual(offenders, []);
});

// ---------------------------------------------------------------------------------------------------
// Pending copies stay bounded and are cleared when they can be identified
// ---------------------------------------------------------------------------------------------------

const pendingNames = (w) => fs.readdirSync(path.join(w.accountDir, 'pending')).filter((n) => !n.startsWith('.')).sort();

test('staging while the account lock is busy never drops a pending copy, however many there are', () => {
  const w = workspace();
  const captured = [];
  const realWrite = process.stderr.write;
  try {
    const dir = privateHomeWithRenewedLogin(w);
    const marker = targetOf(dir);
    fs.writeFileSync(path.join(w.home, 'auth.json'), TORN);
    let clock = 1_000_000;
    process.stderr.write = (chunk) => { captured.push(String(chunk)); return true; };
    for (let i = 0; i < 7; i += 1) {
      clock += 1000;
      const stagedAt = clock;
      assert.deepEqual(writeBackRenewedCredential(dir, marker, { tryLock: () => null, now: () => stagedAt }), { status: 'staged' });
    }
    process.stderr.write = realWrite;
    assert.equal(pendingNames(w).length, 7);
    assert.deepEqual(captured, []);
  } finally { process.stderr.write = realWrite; w.cleanup(); }
});

test('over the limit, identical copies are dropped first, under the lock', () => {
  const w = workspace();
  const captured = [];
  const realWrite = process.stderr.write;
  try {
    const dir = privateHomeWithRenewedLogin(w);
    const marker = targetOf(dir);
    fs.writeFileSync(path.join(w.home, 'auth.json'), TORN); // the source cannot judge any copy
    let clock = 1_000_000;
    for (let i = 0; i < 7; i += 1) { clock += 1000; const at = clock; writeBackRenewedCredential(dir, marker, { tryLock: () => null, now: () => at }); }
    process.stderr.write = (chunk) => { captured.push(String(chunk)); return true; };
    clock += 1000;
    const at = clock;
    assert.deepEqual(writeBackRenewedCredential(dir, marker, { now: () => at }), { status: 'staged' });
    process.stderr.write = realWrite;
    const names = pendingNames(w);
    assert.equal(names.length, 5, 'eight identical copies are cut to the limit');
    assert.equal(names.at(-1).slice(0, 15), String(at).padStart(15, '0'), 'the newest stays');
    assert.deepEqual(captured, ['fgos: credential-pending-dropped (3)\n']);
    assert.equal(readPi(path.join(w.accountDir, 'pending', names[0])).xai.refresh, FAKE.newRefresh);
  } finally { process.stderr.write = realWrite; w.cleanup(); }
});

function fillPendingWithOnlyValidOldest(w) {
  const pending = path.join(w.accountDir, 'pending');
  const names = ['1', '2', '3', '4', '5'].map((n) => path.join(pending, `00000000000000${n}-0000000a`));
  names.forEach((copy, i) => writePi(copy, piDoc(Date.now() + 6 * HOUR, i === 0
    ? { access: 'FAKE-ONLY-VALID-ACCESS', refresh: 'FAKE-ONLY-VALID-REFRESH' }
    : { access: `FAKE-STALE-${i}`, refresh: `FAKE-STALE-REFRESH-${i}` })));
  return names;
}

test('a normal write-back into full pending copies keeps the oldest, the only valid one, and nothing is dropped', () => {
  const w = workspace();
  try {
    const dir = privateHomeWithRenewedLogin(w);
    fs.writeFileSync(path.join(w.home, 'auth.json'), TORN); // nothing can be judged
    const names = fillPendingWithOnlyValidOldest(w);
    assert.equal(writeBackRenewedCredential(dir, targetOf(dir)).status, 'staged');
    assert.equal(pendingNames(w).length, 6, 'the limit gives way: no copy could be shown redundant');
    assert.equal(readPi(names[0]).xai.refresh, 'FAKE-ONLY-VALID-REFRESH');
  } finally { w.cleanup(); }
});

test('without node:sqlite, a pane home whose store is byte for byte the source\'s is not staged, however many dispatches ran', () => {
  const w = workspace();
  try {
    writeOmp(w.home, [{ id: 1, data: ompData(Date.now() + 10 * 60 * 1000) }], { wal: true }).close();
    for (let i = 0; i < 12; i += 1) {
      const dir = path.join(w.tmp, 'fgos-confinement', `disp_same_${i}`, 'home');
      fs.mkdirSync(dir, { recursive: true });
      writeOwnershipMarker(dir, { dispatchId: `disp_same_${i}` });
      copyCredentialFiles(dir, w.home, ['agent.db'], { loadSqlite: () => null });
      targets.set(dir, credentialWriteBackTarget({ provider: 'xai', accountId: 'acct', credentialSource: ompSource(w.home), runtimeDir: w.runtimeDir }));
      assert.deepEqual(writeBackRenewedCredential(dir, targetOf(dir), { loadSqlite: () => null }), { status: 'unchanged' });
    }
    assert.deepEqual(fs.existsSync(path.join(w.accountDir, 'pending')) ? pendingNames(w) : [], []);
  } finally { w.cleanup(); }
});

test('copies that cannot be parsed are compared by their bytes: an identical one is dropped over the limit, a different one never is', () => {
  const w = workspace();
  try {
    const dir = privateOmpHomeWithRenewedLogin(w);
    const pending = path.join(w.accountDir, 'pending');
    const bytes = ['SAME', 'SAME', 'DIFF-1', 'DIFF-2', 'DIFF-3', 'DIFF-4', 'DIFF-5'];
    bytes.forEach((content, i) => {
      const copy = path.join(pending, `00000000000000${i + 1}-0000000a`);
      fs.mkdirSync(copy, { recursive: true });
      fs.writeFileSync(path.join(copy, 'agent.db'), content);
    });
    // Seven copies plus the one staged now is eight; nothing parses without node:sqlite.
    assert.equal(writeBackRenewedCredential(dir, targetOf(dir), { loadSqlite: () => null }).status, 'staged');
    const left = pendingNames(w);
    assert.equal(left.length, 7, 'only the byte-identical copy went');
    assert.equal(left.includes('000000000000001-0000000a'), false, 'the older of the identical pair');
    assert.equal(left.includes('000000000000002-0000000a'), true, 'the newest of the pair stays');
    for (const n of [3, 4, 5, 6, 7]) assert.equal(left.includes(`00000000000000${n}-0000000a`), true, `the different copy ${n} stays`);
  } finally { w.cleanup(); }
});

// An omp pane killed before a checkpoint leaves its renewed login only in the write-ahead log, beside a main file
// that still equals the source's.
function ompPaneHome(w, dispatchId, wal) {
  const dir = path.join(w.tmp, 'fgos-confinement', dispatchId, 'home');
  fs.mkdirSync(dir, { recursive: true });
  writeOwnershipMarker(dir, { dispatchId });
  copyCredentialFiles(dir, w.home, ['agent.db'], { loadSqlite: () => null });
  targets.set(dir, credentialWriteBackTarget({ provider: 'xai', accountId: 'acct', credentialSource: ompSource(w.home), runtimeDir: w.runtimeDir }));
  if (wal !== undefined) fs.writeFileSync(path.join(dir, 'agent.db-wal'), wal);
  return dir;
}

test('without node:sqlite, a store equal to the source\'s but with a non-empty write-ahead log is staged, and an empty log counts as none', () => {
  const w = workspace();
  try {
    writeOmp(w.home, [{ id: 1, data: ompData(Date.now() + 10 * 60 * 1000) }], { wal: true }).close();
    const withLog = ompPaneHome(w, 'disp_wal', 'FAKE-WAL-BYTES');
    assert.equal(writeBackRenewedCredential(withLog, targetOf(withLog), { loadSqlite: () => null }).status, 'staged');
    const staged = pendingNames(w);
    assert.equal(staged.length, 1);
    assert.equal(fs.readFileSync(path.join(w.accountDir, 'pending', staged[0], 'agent.db-wal'), 'utf8'), 'FAKE-WAL-BYTES', 'the log was kept with it');

    const emptyLog = ompPaneHome(w, 'disp_empty_wal', '');
    assert.deepEqual(writeBackRenewedCredential(emptyLog, targetOf(emptyLog), { loadSqlite: () => null }), { status: 'unchanged' });
    const noLog = ompPaneHome(w, 'disp_no_wal');
    assert.deepEqual(writeBackRenewedCredential(noLog, targetOf(noLog), { loadSqlite: () => null }), { status: 'unchanged' });
    assert.equal(pendingNames(w).length, 1);
  } finally { w.cleanup(); }
});

test('unparsable pending copies are identical only when the write-ahead log is identical too', () => {
  const run = (specs) => {
    const w = workspace();
    try {
      const dir = privateOmpHomeWithRenewedLogin(w);
      const pending = path.join(w.accountDir, 'pending');
      specs.forEach(({ db, wal }, i) => {
        const copy = path.join(pending, `00000000000000${i + 1}-0000000a`);
        fs.mkdirSync(copy, { recursive: true });
        fs.writeFileSync(path.join(copy, 'agent.db'), db);
        if (wal !== undefined) fs.writeFileSync(path.join(copy, 'agent.db-wal'), wal);
      });
      assert.equal(writeBackRenewedCredential(dir, targetOf(dir), { loadSqlite: () => null }).status, 'staged');
      return pendingNames(w).length;
    } finally { w.cleanup(); }
  };
  const padding = ['D1', 'D2', 'D3', 'D4', 'D5'].map((db) => ({ db }));
  assert.equal(run([{ db: 'SAME', wal: 'W1' }, { db: 'SAME', wal: 'W2' }, ...padding]), 8, 'same main file, different logs: both stay');
  assert.equal(run([{ db: 'SAME', wal: 'W1' }, { db: 'SAME', wal: 'W1' }, ...padding]), 7, 'identical in both: one goes');
  assert.equal(run([{ db: 'SAME', wal: '' }, { db: 'SAME' }, ...padding]), 7, 'an empty log is no log');
  assert.equal(run([{ db: 'SAME', wal: 'W1' }, { db: 'SAME' }, ...padding]), 8, 'a log against none: both stay');
});

// Files beside a store: bytes, or the marker DIR for a directory of that name (a read error that is not
// "no such file", whoever runs the test).
function putSidecar(dir, name, content) {
  const target = path.join(dir, name);
  if (content === 'DIR') fs.mkdirSync(target, { recursive: true });
  else fs.writeFileSync(target, content);
}

test('a sidecar that cannot be read is never taken for an absent one, and keeps no home once its attempt is over', () => {
  const w = workspace();
  try {
    writeOmp(w.home, [{ id: 1, data: ompData(Date.now() + 10 * 60 * 1000) }], { wal: true }).close();
    for (const name of ['agent.db-wal', 'agent.db-journal']) {
      const dir = ompPaneHome(w, `disp_unreadable_${name}`);
      putSidecar(dir, name, 'DIR');
      const result = writeBackRenewedCredential(dir, targetOf(dir), { loadSqlite: () => null });
      assert.deepEqual(result, { status: 'failed', code: 'home-unreadable' }, name);
    }
    if (typeof process.getuid === 'function' && process.getuid() !== 0) {
      const dir = ompPaneHome(w, 'disp_unreadable_mode', 'FAKE-WAL-BYTES');
      fs.chmodSync(path.join(dir, 'agent.db-wal'), 0o000);
      const result = writeBackRenewedCredential(dir, targetOf(dir), { loadSqlite: () => null });
      assert.deepEqual(result, { status: 'failed', code: 'home-unreadable' }, 'a log that cannot be read is no login');
    }
  } finally { w.cleanup(); }
});

test('pending copies with a sidecar that cannot be read are never taken for identical', () => {
  const run = (sidecar) => {
    const w = workspace();
    try {
      const dir = privateOmpHomeWithRenewedLogin(w);
      const pending = path.join(w.accountDir, 'pending');
      ['SAME', 'SAME', 'D1', 'D2', 'D3', 'D4', 'D5'].forEach((db, i) => {
        const copy = path.join(pending, `00000000000000${i + 1}-0000000a`);
        fs.mkdirSync(copy, { recursive: true });
        fs.writeFileSync(path.join(copy, 'agent.db'), db);
        if (i < 2) putSidecar(copy, sidecar, 'DIR');
      });
      assert.equal(writeBackRenewedCredential(dir, targetOf(dir), { loadSqlite: () => null }).status, 'staged');
      return pendingNames(w).length;
    } finally { w.cleanup(); }
  };
  assert.equal(run('agent.db-wal'), 8);
  assert.equal(run('agent.db-journal'), 8);
});

test('a rollback journal counts like a write-ahead log, and the shared-memory index counts for nothing', () => {
  const w = workspace();
  try {
    writeOmp(w.home, [{ id: 1, data: ompData(Date.now() + 10 * 60 * 1000) }], { wal: true }).close();
    const withJournal = ompPaneHome(w, 'disp_journal');
    putSidecar(withJournal, 'agent.db-journal', 'FAKE-JOURNAL-BYTES');
    assert.equal(writeBackRenewedCredential(withJournal, targetOf(withJournal), { loadSqlite: () => null }).status, 'staged');
    const staged = pendingNames(w);
    assert.equal(staged.length, 1);
    assert.equal(fs.readFileSync(path.join(w.accountDir, 'pending', staged[0], 'agent.db-journal'), 'utf8'), 'FAKE-JOURNAL-BYTES', 'staging keeps the journal');

    const withIndex = ompPaneHome(w, 'disp_shm');
    putSidecar(withIndex, 'agent.db-shm', 'FAKE-SHM-BYTES');
    assert.deepEqual(writeBackRenewedCredential(withIndex, targetOf(withIndex), { loadSqlite: () => null }), { status: 'unchanged' }, 'an index file changes nothing');
    assert.equal(pendingNames(w).length, 1);
  } finally { w.cleanup(); }
});

test('pending copies differ by journal but not by shared-memory index', () => {
  const run = (specs) => {
    const w = workspace();
    try {
      const dir = privateOmpHomeWithRenewedLogin(w);
      const pending = path.join(w.accountDir, 'pending');
      specs.forEach(({ db, files }, i) => {
        const copy = path.join(pending, `00000000000000${i + 1}-0000000a`);
        fs.mkdirSync(copy, { recursive: true });
        fs.writeFileSync(path.join(copy, 'agent.db'), db);
        for (const [name, content] of Object.entries(files ?? {})) putSidecar(copy, name, content);
      });
      assert.equal(writeBackRenewedCredential(dir, targetOf(dir), { loadSqlite: () => null }).status, 'staged');
      return pendingNames(w).length;
    } finally { w.cleanup(); }
  };
  const padding = ['D1', 'D2', 'D3', 'D4', 'D5'].map((db) => ({ db }));
  assert.equal(run([{ db: 'SAME', files: { 'agent.db-journal': 'J1' } }, { db: 'SAME', files: { 'agent.db-journal': 'J2' } }, ...padding]), 8, 'different journals: both stay');
  assert.equal(run([{ db: 'SAME', files: { 'agent.db-journal': 'J1' } }, { db: 'SAME', files: { 'agent.db-journal': 'J1' } }, ...padding]), 7, 'same journal: one goes');
  assert.equal(run([{ db: 'SAME', files: { 'agent.db-shm': 'S1' } }, { db: 'SAME', files: { 'agent.db-shm': 'S2' } }, ...padding]), 7, 'different index files: still identical');
  assert.equal(run([{ db: 'SAME', files: { 'agent.db-shm': 'S1' } }, { db: 'SAME' }, ...padding]), 7, 'an index file against none: still identical');
});

test('a half-written copy left by a probe is kept for hand recovery, outside the copies applied or dropped automatically', async () => {
  const w = workspace();
  try {
    writePi(w.home, piDoc(Date.now() + 10 * 60 * 1000));
    const { spawnFn } = fakeSpawn({ layoutName: 'pi', behaviour: (dir) => fs.writeFileSync(path.join(dir, 'auth.json'), TORN) });
    const result = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn });
    assert.deepEqual(result, { status: 'failed', reason: 'torn-copy-kept' });
    const tornDir = path.join(w.accountDir, 'torn');
    const kept = fs.readdirSync(tornDir);
    assert.equal(kept.length, 1);
    assert.equal(fs.readFileSync(path.join(tornDir, kept[0], 'auth.json'), 'utf8'), TORN, 'the half-written file is untouched');
    assert.deepEqual(scratchCopies(w), []);
    assert.deepEqual(inspectRetainedCredentialCopies({ runtimeDir: w.runtimeDir }).map((c) => c.kind), ['torn']);
    // A later renewal of the account neither applies nor drops it.
    await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn: fakeSpawn({ layoutName: 'pi' }).spawnFn, cooldownMs: 0 });
    assert.equal(fs.readdirSync(tornDir).length, 1);
  } finally { w.cleanup(); }
});


test('a refresh-ahead that skips because the entry is unidentified still clears the leftovers it can identify', async () => {
  const w = workspace();
  try {
    const now = Date.now();
    // The source holds no entry of the dispatched provider, so the run is skipped; one leftover is a
    // copy of a login the source already superseded and another cannot be told apart yet.
    writePi(w.home, { 'github-copilot': { type: 'oauth', access: 'a', refresh: 'b', expires: now + HOUR } });
    const copy = path.join(w.accountDir, 'pending', '000000000000001-0000000a');
    fs.mkdirSync(copy, { recursive: true });
    fs.writeFileSync(path.join(copy, 'auth.json'), TORN); // proven malformed: nothing to keep
    const { spawnFn, starts } = fakeSpawn({ layoutName: 'pi' });
    const result = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn });
    assert.deepEqual(result, { status: 'skipped', reason: 'entry-unidentified' });
    assert.equal(starts.length, 0);
    assert.deepEqual(pendingCopies(w), [], 'the malformed leftover was cleared on the skipped run');
  } finally { w.cleanup(); }
});

// ---------------------------------------------------------------------------------------------------
// Codex provisioning fails closed
// ---------------------------------------------------------------------------------------------------

async function prepareCodexHome(codexHome, dispatchId) {
  const tempRoot = path.join(os.tmpdir(), `fgos-codex-prov-${process.pid}`);
  const resources = resolveConfinementResources({ dispatchId, context: {}, grants: [{ resource: 'private-home', access: 'read-write', scope: 'dispatch' }], backendConfig: { tempRoot } });
  const plan = { contract: 'confinement-plan.v1', dispatchId, decision: 'execute', coverage: {}, resources };
  const request = {
    dispatchId,
    executorId: 'codex-bwrap',
    invocation: { command: 'agent-cli', args: [], env: {}, credentialStore: { use: 'agent-cli', homeEnv: 'AGENT_HOME' } },
    providerCapacity: { provider: 'openai', accountId: 'acct', credentialSource: { kind: 'codex-home', home: codexHome } },
    context: { cwd: os.tmpdir(), runDir: os.tmpdir() },
  };
  try {
    const prepared = await prepareBwrap(plan, request, { id: 'bwrap', type: 'bwrap', config: {} });
    await prepared.cleanup();
    return null;
  } catch (err) {
    return err;
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

test('a Codex auth.json that is a symlink leaving the home fails provisioning closed', async () => {
  const w = workspace();
  try {
    const outside = path.join(w.tmp, 'outside.json');
    fs.writeFileSync(outside, JSON.stringify(codexDoc(Date.now() + HOUR, Date.now())));
    fs.symlinkSync(outside, path.join(w.home, 'auth.json'));
    const err = await prepareCodexHome(w.home, 'disp_codex_link');
    assert.equal(err?.code, 'credential-provisioning');
    assert.match(err.message, /not a regular file inside the credential home/);
  } finally { w.cleanup(); }
});

test('a relative Codex home fails provisioning closed', async () => {
  const err = await prepareCodexHome('relative/codex-home', 'disp_codex_rel');
  assert.equal(err?.code, 'credential-provisioning');
  assert.match(err.message, /needs an absolute "home"/);
});

test('retained-copy inspection reports torn and over-limit pending copies kept per CLI store', () => {
  const runtimeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-per-cli-retained-'));
  try {
    const storeDir = path.join(runtimeDir, 'account-locks', 'openai', 'acct', 'stores', 'codex');
    fs.mkdirSync(path.join(storeDir, 'torn', 'scratch-1'), { recursive: true });
    for (let i = 0; i < 6; i += 1) {
      fs.mkdirSync(path.join(storeDir, 'pending', `${String(1000 + i).padStart(15, '0')}-0000000${i}`), { recursive: true });
    }
    const kinds = inspectRetainedCredentialCopies({ runtimeDir, now: Date.now() }).map((c) => c.kind);
    assert.ok(kinds.includes('torn'), 'a torn copy under stores/<cli> is reported');
    assert.equal(kinds.filter((k) => k === 'pending').length, 6, 'pending copies under stores/<cli> are listed');
    assert.deepEqual(inspectPendingCopiesOverLimit({ runtimeDir }).map(({ provider, accountId, count, stranded }) => ({ provider, accountId, count, stranded })), [{ provider: 'openai', accountId: 'acct', count: 6, stranded: false }]);
  } finally {
    fs.rmSync(runtimeDir, { recursive: true, force: true });
  }
});

test('an over-limit single store names no CLI store, and each CLI store of an account is named on its own', () => {
  const runtimeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-over-limit-store-'));
  try {
    const accountDir = path.join(runtimeDir, 'account-locks', 'openai', 'acct');
    for (const dir of [accountDir, path.join(accountDir, 'stores', 'codex'), path.join(accountDir, 'stores', 'pi')]) {
      for (let i = 0; i < 6; i += 1) fs.mkdirSync(path.join(dir, 'pending', `${String(1000 + i).padStart(15, '0')}-copy`), { recursive: true });
    }
    const rows = inspectPendingCopiesOverLimit({ runtimeDir });
    assert.deepEqual(rows.map((r) => r.store).sort((a, b) => String(a).localeCompare(String(b))), ['codex', null, 'pi']);
  } finally {
    fs.rmSync(runtimeDir, { recursive: true, force: true });
  }
});

test('staging a renewed omp login does not copy the shared-memory index, so an unreadable one no longer keeps the home', () => {
  const w = workspace();
  try {
    writeOmp(w.home, [{ id: 1, data: ompData(Date.now() + 10 * 60 * 1000) }], { wal: true }).close();
    const dir = ompPaneHome(w, 'disp_shm_unreadable', 'FAKE-WAL-BYTES');
    putSidecar(dir, 'agent.db-shm', 'DIR');
    const result = writeBackRenewedCredential(dir, targetOf(dir), { loadSqlite: () => null });
    assert.equal(result.status, 'staged');
    const [name] = pendingNames(w);
    assert.equal(fs.existsSync(path.join(w.accountDir, 'pending', name, 'agent.db-wal')), true, 'the log is kept');
    assert.equal(fs.existsSync(path.join(w.accountDir, 'pending', name, 'agent.db-shm')), false, 'the index is not');
  } finally { w.cleanup(); }
});

// A process id no process can hold: above the kernel's limit, so signalling it always says "no such process".
function deadPid() {
  let max = 4194304;
  try { max = Number(fs.readFileSync('/proc/sys/kernel/pid_max', 'utf8')); } catch { /* the usual limit */ }
  for (let pid = max + 1; pid < max + 50; pid += 1) {
    try { process.kill(pid, 0); } catch (err) { if (err?.code === 'ESRCH') return pid; }
  }
  throw new Error('no unused process id found');
}

const LONG_AGO_S = (Date.now() - 3 * STAGING_MIN_AGE_MS) / 1000;
const age = (dir) => {
  for (const name of fs.readdirSync(dir)) fs.utimesSync(path.join(dir, name), LONG_AGO_S, LONG_AGO_S);
  fs.utimesSync(dir, LONG_AGO_S, LONG_AGO_S);
};

function interruptedStagingWorkspace() {
  const w = workspace();
  const pendingDir = path.join(w.accountDir, 'pending');
  fs.mkdirSync(pendingDir, { recursive: true });
  const put = (name, files, { old = true, dir = pendingDir } = {}) => {
    const target = path.join(dir, name);
    fs.mkdirSync(target, { recursive: true });
    for (const [file, bytes] of Object.entries(files)) fs.writeFileSync(path.join(target, file), bytes);
    if (old) age(target);
    return target;
  };
  return { ...w, pendingDir, put };
}

test('an interrupted staging is reported once its writer is gone and it has sat for a while, and not before', () => {
  const w = interruptedStagingWorkspace();
  try {
    w.put(`.tmp-${deadPid()}-aaaa`, { 'auth.json': 'PART' });
    w.put(`.tmp-${deadPid()}-young`, { 'auth.json': 'PART' }, { old: false });
    w.put(`.tmp-${process.pid}-bbbb`, { 'auth.json': 'LIVE' });
    const found = inspectRetainedCredentialCopies({ runtimeDir: w.runtimeDir, now: Date.now() });
    assert.deepEqual(found.map((c) => [c.provider, c.accountId, c.kind]), [['xai', 'acct', 'staging']]);
  } finally { w.cleanup(); }
});

test('a staging whose writer is a zombie is reported: a writer that has exited is gone even before its parent reaps it', () => {
  if (process.platform !== 'linux') return;
  const w = interruptedStagingWorkspace();
  const files = path.join(w.runtimeDir, 'zombie-fixture');
  fs.mkdirSync(files, { recursive: true });
  const zombieFile = path.join(files, 'zombie.pid');
  const parentFile = path.join(files, 'parent.pid');
  // `sleep` never reaps: it is the parent of a child that exited at once, which stays a zombie.
  execFileSync('sh', ['-c', `setsid sh -c 'sh -c "exit 0" & echo $! > "$0"; echo $$ > "$1"; exec sleep 300' "$0" "$1" </dev/null >/dev/null 2>&1 &`, zombieFile, parentFile]);
  let parentPid = null;
  try {
    const deadline = Date.now() + 5000;
    let zombiePid;
    for (;;) {
      try {
        zombiePid = Number(fs.readFileSync(zombieFile, 'utf8').trim());
        parentPid = Number(fs.readFileSync(parentFile, 'utf8').trim());
        const stat = fs.readFileSync(`/proc/${zombiePid}/stat`, 'utf8');
        if (stat.slice(stat.lastIndexOf(')') + 2, stat.lastIndexOf(')') + 3) === 'Z') break;
      } catch { /* not written yet */ }
      assert.ok(Date.now() < deadline, 'the fixture never produced a zombie');
      execFileSync('sleep', ['0.05']);
    }
    w.put(`.tmp-${zombiePid}-zzzz`, { 'auth.json': 'PART' });
    const found = inspectRetainedCredentialCopies({ runtimeDir: w.runtimeDir, now: Date.now() });
    assert.deepEqual(found.map((c) => c.kind), ['staging']);
  } finally {
    if (parentPid) { try { process.kill(parentPid, 'SIGKILL'); } catch { /* gone */ } }
    w.cleanup();
  }
});

test('a staging that holds a leftover durable-file temporary still digests equal to its kept twin and is reaped', () => {
  const w = interruptedStagingWorkspace();
  try {
    const dead = deadPid();
    w.put('000000000001000-aaaa', { 'auth.json': 'KEPT' });
    const leftover = w.put(`.tmp-${dead}-leftover`, { 'auth.json': 'KEPT', [`.durable-file-${dead}-3.tmp`]: 'KEPT' });
    assert.deepEqual(sweepInterruptedStagings({ runtimeDir: w.runtimeDir }), { removed: 1, kept: 0 });
    assert.equal(fs.existsSync(leftover), false);
  } finally { w.cleanup(); }
});

test('the sweep removes an interrupted staging only when it is empty or identical to a kept copy, and never one that is young or has a live writer', () => {
  const w = interruptedStagingWorkspace();
  try {
    const dead = deadPid();
    w.put('000000000001000-aaaa', { 'auth.json': 'KEPT' });
    const empty = w.put(`.tmp-${dead}-empty`, {});
    const same = w.put(`.tmp-${dead}-same`, { 'auth.json': 'KEPT' });
    const different = w.put(`.tmp-${dead}-diff`, { 'auth.json': 'ONLY-COPY' });
    const young = w.put(`.tmp-${dead}-young`, { 'auth.json': 'KEPT' }, { old: false });
    const live = w.put(`.tmp-${process.pid}-live`, { 'auth.json': 'KEPT' });
    assert.deepEqual(sweepInterruptedStagings({ runtimeDir: w.runtimeDir }), { removed: 2, kept: 1 });
    assert.equal(fs.existsSync(empty), false);
    assert.equal(fs.existsSync(same), false);
    assert.equal(fs.existsSync(different), true, 'a staging that may hold the only copy stays under its own name');
    assert.equal(fs.readFileSync(path.join(different, 'auth.json'), 'utf8'), 'ONLY-COPY');
    assert.equal(fs.existsSync(young), true, 'a staging that changed a moment ago is not touched');
    assert.equal(fs.existsSync(live), true, 'a staging whose writer runs is not touched');
    assert.equal(fs.existsSync(path.join(w.pendingDir, '000000000001000-aaaa')), true, 'the kept copy stays');
  } finally { w.cleanup(); }
});

test('the sweep claims a staging by renaming it before it judges it, so a writer that is still running loses its rename instead of its login', () => {
  const w = interruptedStagingWorkspace();
  try {
    writePi(w.home, piDoc(Date.now() + 6 * HOUR));
    const original = w.put(`.tmp-${deadPid()}-claimed`, { 'auth.json': JSON.stringify(piDoc(Date.now() + 12 * HOUR, { refresh: 'FAKE-NEWER-REFRESH' })) });
    let seenDuringJudgement;
    const result = sweepInterruptedStagings({
      runtimeDir: w.runtimeDir,
      resolveStore: () => ({ layoutName: 'pi-auth-json', sourceHome: w.home }),
      tryLock: () => { seenDuringJudgement = fs.existsSync(original); return { release() {} }; },
    });
    assert.equal(seenDuringJudgement, false, 'the staging is under the sweep\'s own name while it is judged');
    assert.deepEqual(result, { removed: 0, kept: 1 }, 'a newer login stays');
    assert.equal(fs.existsSync(original), true, 'and goes back under its own name');
  } finally { w.cleanup(); }
});

test('the sweep removes a staging the source login proves is not newer, or that is malformed, and keeps one that is newer or cannot be judged', () => {
  const w = interruptedStagingWorkspace();
  try {
    const source = piDoc(Date.now() + 6 * HOUR);
    writePi(w.home, source);
    const dead = deadPid();
    const same = w.put(`.tmp-${dead}-same`, { 'auth.json': JSON.stringify(source), extra: '1' });
    const older = w.put(`.tmp-${dead}-older`, { 'auth.json': JSON.stringify(piDoc(Date.now() + 1 * HOUR)) });
    const malformed = w.put(`.tmp-${dead}-malformed`, { 'auth.json': '{not json' });
    const newer = w.put(`.tmp-${dead}-newer`, { 'auth.json': JSON.stringify(piDoc(Date.now() + 12 * HOUR, { refresh: 'FAKE-NEWER-REFRESH' })) });
    const result = sweepInterruptedStagings({ runtimeDir: w.runtimeDir, resolveStore: () => ({ layoutName: 'pi-auth-json', sourceHome: w.home }), tryLock: () => ({ release() {} }) });
    assert.deepEqual(result, { removed: 3, kept: 1 });
    for (const dir of [same, older, malformed]) assert.equal(fs.existsSync(dir), false);
    assert.equal(fs.existsSync(newer), true);
    // The same sweep without a resolver judges nothing by the source.
    const w2 = interruptedStagingWorkspace();
    try {
      const only = w2.put(`.tmp-${deadPid()}-older`, { 'auth.json': JSON.stringify(piDoc(Date.now() + 1 * HOUR)) });
      assert.deepEqual(sweepInterruptedStagings({ runtimeDir: w2.runtimeDir }), { removed: 0, kept: 1 });
      assert.equal(fs.existsSync(only), true);
    } finally { w2.cleanup(); }
  } finally { w.cleanup(); }
});

test('a busy account lock leaves a staging that only the source could clear', () => {
  const w = interruptedStagingWorkspace();
  try {
    writePi(w.home, piDoc(Date.now() + 6 * HOUR));
    const older = w.put(`.tmp-${deadPid()}-older`, { 'auth.json': JSON.stringify(piDoc(Date.now() + 1 * HOUR)) });
    const result = sweepInterruptedStagings({ runtimeDir: w.runtimeDir, resolveStore: () => ({ layoutName: 'pi-auth-json', sourceHome: w.home }), tryLock: () => null });
    assert.deepEqual(result, { removed: 0, kept: 1 });
    assert.equal(fs.existsSync(older), true);
  } finally { w.cleanup(); }
});

test('the sweep compares an omp staging to a kept copy without the shared-memory index, and also to a half-written copy under torn/', () => {
  const w = interruptedStagingWorkspace();
  try {
    const dead = deadPid();
    w.put('000000000001000-aaaa', { 'agent.db': 'SAME-DB', 'agent.db-shm': 'INDEX-MADE-BY-A-READ' });
    const sameAsKept = w.put(`.tmp-${dead}-omp`, { 'agent.db': 'SAME-DB' });
    const tornDir = path.join(w.accountDir, 'torn');
    w.put('scratch-torn', { 'auth.json': 'HALF-WRITTEN' }, { dir: tornDir });
    const sameAsTorn = w.put(`.tmp-${dead}-torn`, { 'auth.json': 'HALF-WRITTEN' });
    assert.deepEqual(sweepInterruptedStagings({ runtimeDir: w.runtimeDir }), { removed: 2, kept: 0 });
    assert.equal(fs.existsSync(sameAsKept), false);
    assert.equal(fs.existsSync(sameAsTorn), false);
    assert.equal(fs.existsSync(path.join(tornDir, 'scratch-torn')), true, 'the torn copy itself is never touched');
  } finally { w.cleanup(); }
});

test('a store the account layout no longer reads is never swept, and a symlink is never followed', () => {
  const w = interruptedStagingWorkspace();
  try {
    const dead = deadPid();
    const empty = w.put(`.tmp-${dead}-empty`, {});
    assert.deepEqual(sweepInterruptedStagings({ runtimeDir: w.runtimeDir, resolveStore: () => 'stranded' }), { removed: 0, kept: 0 });
    assert.equal(fs.existsSync(empty), true, 'stranded stores are left to hand recovery');

    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-sweep-outside-'));
    try {
      fs.writeFileSync(path.join(outside, 'auth.json'), 'MUST-SURVIVE');
      fs.rmSync(empty, { recursive: true });
      const link = path.join(w.pendingDir, `.tmp-${dead}-link`);
      fs.symlinkSync(outside, link);
      const linked = w.put(`.tmp-${dead}-childlink`, {});
      fs.symlinkSync(path.join(outside, 'auth.json'), path.join(linked, 'auth.json'));
      age(linked);
      sweepInterruptedStagings({ runtimeDir: w.runtimeDir, minAgeMs: -Infinity });
      assert.equal(fs.readFileSync(path.join(outside, 'auth.json'), 'utf8'), 'MUST-SURVIVE', 'the target of a link is never deleted');
      assert.equal(fs.existsSync(linked), true, 'a staging holding a link is not a plain copy and stays');
    } finally { fs.rmSync(outside, { recursive: true, force: true }); }
  } finally { w.cleanup(); }
});

test('a staging a crashed sweep left under its own name is reported, and is not deleted unless it is provably not needed', () => {
  const w = interruptedStagingWorkspace();
  try {
    const dead = deadPid();
    const leftover = w.put(`.sweep-${dead}-crashed`, { 'auth.json': 'ONLY-COPY' });
    const found = inspectRetainedCredentialCopies({ runtimeDir: w.runtimeDir, now: Date.now() });
    assert.deepEqual(found.map((c) => c.kind), ['staging'], 'it is reported like any interrupted staging');
    assert.deepEqual(sweepInterruptedStagings({ runtimeDir: w.runtimeDir }), { removed: 0, kept: 1 });
    const names = fs.readdirSync(w.pendingDir);
    assert.equal(names.length, 1, 'still there');
    assert.equal(fs.readFileSync(path.join(w.pendingDir, names[0], 'auth.json'), 'utf8'), 'ONLY-COPY');
    assert.equal(/^\.(tmp|sweep)-\d+-/.test(names[0]), true, 'and still listed as a staging');
    assert.equal(fs.existsSync(leftover) || names[0].startsWith('.sweep-'), true);
  } finally { w.cleanup(); }
});

test('when the staging cannot be given back its own name, it stays under the sweep\'s name and is still reported', () => {
  const w = interruptedStagingWorkspace();
  try {
    writePi(w.home, piDoc(Date.now() + 6 * HOUR));
    const original = w.put(`.tmp-${deadPid()}-blocked`, { 'auth.json': JSON.stringify(piDoc(Date.now() + 12 * HOUR, { refresh: 'FAKE-NEWER-REFRESH' })) });
    const result = sweepInterruptedStagings({
      runtimeDir: w.runtimeDir,
      resolveStore: () => ({ layoutName: 'pi-auth-json', sourceHome: w.home }),
      // While the sweep judges the staging, something else takes its original name: the rename back must fail.
      tryLock: () => { fs.mkdirSync(original); fs.writeFileSync(path.join(original, 'taken'), 'x'); return { release() {} }; },
    });
    assert.deepEqual(result, { removed: 0, kept: 1 });
    const swept = fs.readdirSync(w.pendingDir).filter((n) => n.startsWith('.sweep-'));
    assert.equal(swept.length, 1, 'the login is kept under the sweep\'s name');
    assert.match(fs.readFileSync(path.join(w.pendingDir, swept[0], 'auth.json'), 'utf8'), /FAKE-NEWER-REFRESH/);
    fs.rmSync(original, { recursive: true });
    // Once the sweeping process has exited (its id is in the name), the next report names the leftover.
    fs.renameSync(path.join(w.pendingDir, swept[0]), path.join(w.pendingDir, `.sweep-${deadPid()}-left`));
    const found = inspectRetainedCredentialCopies({ runtimeDir: w.runtimeDir, now: Date.now() });
    assert.deepEqual(found.map((c) => c.kind), ['staging'], 'and the next report names it');
  } finally { w.cleanup(); }
});

test('a writer whose staging was claimed by the sweep fails its own rename and keeps its private home', () => {
  const w = workspace();
  try {
    writeOmp(w.home, [{ id: 1, data: ompData(Date.now() + 10 * 60 * 1000) }], { wal: true }).close();
    const dir = ompPaneHome(w, 'disp_claimed', 'FAKE-WAL-BYTES');
    const pendingDir = path.join(w.accountDir, 'pending');
    let claimed = false;
    // The staging step reaches for SQLite while the copy is being written: at that moment the sweep claims it.
    const loadSqlite = () => {
      const staging = claimed ? undefined : (fs.existsSync(pendingDir) ? fs.readdirSync(pendingDir).find((n) => n.startsWith('.tmp-')) : undefined);
      if (staging) {
        claimed = true;
        fs.renameSync(path.join(pendingDir, staging), path.join(pendingDir, '.sweep-1-claimed'));
      }
      return null;
    };
    const result = writeBackRenewedCredential(dir, targetOf(dir), { loadSqlite });
    assert.equal(claimed, true);
    assert.equal(result.status, 'failed');
    assert.equal(result.keepHome, true, 'the home stays: its login is not safe anywhere else');
    assert.equal(fs.existsSync(dir), true);
  } finally { w.cleanup(); }
});

// ---------------------------------------------------------------------------------------------------
// What a login written back from an agent's private home must prove before it replaces the account's own
// ---------------------------------------------------------------------------------------------------

// The cases above prove that a newer copy is applied; none of them gives the copy an identity of its own.
// A confined agent can log its home in as someone else and, in the same stroke, make that login look newer,
// so a copy is applied only when it is the login of the account that was leased.
test('a renewed login whose account differs from the leased account is never applied', async () => {
  const w = workspace();
  try {
    const now = Date.now();
    const leased = codexDoc(now + 10 * 60 * 1000, now - HOUR, 'old');
    leased.tokens.access_token = fakeJwt(now + 10 * 60 * 1000, 'old', codexAccountClaim('FAKE-ACCOUNT-LEASED'));
    writeCodex(w.home, leased);
    const dir = path.join(w.tmp, 'fgos-confinement', 'disp_other_account', 'home');
    fs.mkdirSync(dir, { recursive: true });
    writeOwnershipMarker(dir, { dispatchId: 'disp_other_account' });
    copyCredentialFiles(dir, w.home, ['auth.json']);
    // Inside the home the agent logged in as another account; the login is newer than the leased one.
    const other = codexDoc(now + 6 * HOUR, now, 'new');
    other.tokens.access_token = fakeJwt(now + 6 * HOUR, 'new', codexAccountClaim('FAKE-ACCOUNT-OTHER'));
    writeCodex(dir, other);
    const target = credentialWriteBackTarget({ provider: 'xai', accountId: 'acct', credentialSource: codexSource(w.home), runtimeDir: w.runtimeDir });
    const before = sha(path.join(w.home, 'auth.json'));

    writeBackRenewedCredential(dir, target);
    // The next refresh-ahead is where an unproven copy would be applied; its renewal call changes nothing.
    const { spawnFn } = fakeSpawn({ layoutName: 'codex', behaviour: () => {} });
    await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: codexSource(w.home), runtimeDir: w.runtimeDir, spawnFn, cooldownMs: 0 });

    assert.equal(sha(path.join(w.home, 'auth.json')), before, 'the leased account\'s login was replaced by the login of another account');
    assert.deepEqual(agentCopies(w), [], 'the login of another account is not kept either');
  } finally { w.cleanup(); }
});

// The only case that kept a held home forbids settling it (the owner recovers it by hand). A home is held only
// because staging failed while its login was the only good pair; once the login can be staged and applied
// there is nothing left to hold it for, so a repair settles it instead of leaving the owner a chore.
test('a held home settles by itself once its login is safe', () => {
  const w = workspace();
  const realNow = Date.now;
  const realHome = process.env.HOME;
  const realWrite = process.stderr.write;
  const dispatchId = 'disp_held';
  // A temp root of the test's own: the machine's real held homes are never looked at.
  const tempRoot = path.join(w.tmp, 'fgos-confinement');
  try {
    // The resolver reads the machine's config and backend registry from HOME: a scratch home keeps it off the real one.
    process.env.HOME = w.tmp;
    writePi(w.home, piDoc(Date.now() + 10 * 60 * 1000));
    const runDir = path.join(w.tmp, 'run');
    fs.mkdirSync(runDir, { recursive: true });
    const resources = resolveConfinementResources({ dispatchId, context: {}, grants: [{ resource: 'private-home', access: 'read-write', scope: 'dispatch' }], backendConfig: { tempRoot } });
    const plan = { contract: 'confinement-plan.v1', dispatchId, decision: 'execute', coverage: {}, resources };
    const request = {
      dispatchId,
      attemptId: 'att-held',
      executorId: 'omp-bwrap',
      invocation: { command: 'agent-cli', args: [], env: {}, credentialStore: { use: 'agent-cli', homeEnv: 'AGENT_HOME' } },
      providerCapacity: { provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), credentialWriteBack: { runtimeDir: w.runtimeDir } },
      context: { cwd: os.tmpdir(), runDir },
    };
    const prepared = prepareBwrapSync(plan, request, { id: 'bwrap', type: 'bwrap', config: {} });
    const home = resources[0].hostTarget;
    assert.ok(prepared.credentialWriteBack, 'the attempt home opted in to write-back');
    const descriptors = path.join(runDir, 'protected', 'confinement-finalization');
    fs.mkdirSync(descriptors, { recursive: true });
    fs.writeFileSync(path.join(descriptors, 'att-held.json'), JSON.stringify({
      contract: 'confinement-finalization.v1', launchCommandId: 'att-held', resources: [{ pathRef: home, resourceId: 'private-home', credentialWriteBack: prepared.credentialWriteBack }], cleanupState: 'pending', cleanupResult: null,
    }));
    renewHome('pi', home);

    // Staging is impossible (a file where the pending directory belongs) until the budget of retries is spent.
    fs.mkdirSync(w.accountDir, { recursive: true });
    fs.writeFileSync(path.join(w.accountDir, 'pending'), 'in the way');
    process.stderr.write = () => true;
    const start = realNow();
    let state;
    for (let attempt = 1; attempt <= CREDENTIAL_KEEP_MAX_ATTEMPTS; attempt += 1) {
      Date.now = () => start + attempt * 2 * CREDENTIAL_KEEP_MIN_INTERVAL_MS;
      state = finalizeAttemptHome({ runDir, attemptId: 'att-held' }).state;
    }
    Date.now = realNow;
    process.stderr.write = realWrite;
    assert.equal(state, 'credential-home-held', 'the home is held after the retry budget');
    assert.equal(fs.existsSync(path.join(home, 'auth.json')), true);

    // The obstacle is gone: the login can be staged, so the repair settles the home; the staged login waits for
    // the probe gate of the next refresh-ahead.
    fs.rmSync(path.join(w.accountDir, 'pending'));
    fixCredentialCopiesRetained({ roots: [tempRoot], retriedRoots: [tempRoot], stagingRuntimeDir: w.runtimeDir });
    assert.equal(fs.existsSync(home), false, 'the held home is still there although its login can now be written back');
    assert.deepEqual(agentCopies(w).map((name) => readPi(path.join(w.accountDir, 'pending', name)).xai.refresh), [FAKE.newRefresh], 'the renewed login waits beside the account');
  } finally {
    Date.now = realNow;
    process.stderr.write = realWrite;
    if (realHome === undefined) delete process.env.HOME; else process.env.HOME = realHome;
    fs.rmSync(path.join(tempRoot, dispatchId), { recursive: true, force: true });
    w.cleanup();
  }
});
