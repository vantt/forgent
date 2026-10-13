import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';

import {
  CODEX_REFRESH_INTERVAL_MS,
  applyRenewedCredential,
  copyCredentialFiles,
  credentialLayout,
  credentialWriteBackMarker,
  defaultRefreshAheadThresholdMs,
  readCredentialExpiry,
  refreshAhead,
  writeBackRenewedCredential,
} from '../../src/runner/dispatch/provider-credential-renewal.mjs';
import {
  providerAccountDir,
  tryAcquireAccountLock,
} from '../../src/runner/dispatch/provider-capacity.mjs';
import {
  OWNERSHIP_MARKER_FILE,
  cleanupConfinementResource,
  extendOwnershipMarker,
  reapOrphanedConfinementResources,
  writeOwnershipMarker,
} from '../../src/runner/dispatch/confinement/cleanup.mjs';
import { finalizeConfinementResources } from '../../src/runner/dispatch/confinement/authority.mjs';
import { prepareBwrap } from '../../src/runner/dispatch/confinement/drivers/bwrap.mjs';
import { resolveConfinementResources } from '../../src/runner/dispatch/confinement/resources.mjs';

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
const fakeJwt = (expMs, marker = 'x') => `${b64({ alg: 'none' })}.${b64({ exp: Math.floor(expMs / 1000), marker })}.FAKE-SIGNATURE`;

// pi: auth.json keyed by provider id
const piDoc = (expiresMs, { access = FAKE.oldAccess, refresh = FAKE.oldRefresh } = {}) => ({
  xai: { type: 'oauth', access, refresh, expires: expiresMs },
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

// What a real CLI does to the home it is pointed at once it decides the login is due: a new token pair
// and a later expiry, written back to the same store.
function renewHome(layoutName, dir, { expiresMs = Date.now() + 6 * HOUR } = {}) {
  if (layoutName === 'pi') {
    const doc = readPi(dir);
    doc.xai = { ...doc.xai, access: FAKE.newAccess, refresh: FAKE.newRefresh, expires: expiresMs };
    writePi(dir, doc);
  } else if (layoutName === 'codex') {
    writeCodex(dir, codexDoc(expiresMs, Date.now(), 'new'));
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
    const homeDir = options.env.PI_CODING_AGENT_DIR ?? options.env.CODEX_HOME;
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

test('an unknown layout, a missing store and malformed JSON give fixed codes that never quote the input', () => {
  const w = workspace();
  try {
    assert.deepEqual(readCredentialExpiry('mystery', w.home), { ok: false, code: 'unknown-layout' });
    assert.deepEqual(readCredentialExpiry('pi-auth-json', w.home), { ok: false, code: 'unreadable-file' });
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

test('a dead runner whose renewal child still runs keeps the lock: no second renewal starts', async () => {
  const w = workspace();
  try {
    writePi(w.home, piDoc(Date.now() + 10 * 60 * 1000));
    const dead = spawnSync(process.execPath, ['-e', '']);
    const lockDir = path.join(w.accountDir, 'lock');
    fs.mkdirSync(lockDir, { recursive: true });
    fs.writeFileSync(path.join(lockDir, '0000000001.json'), JSON.stringify({
      holder: { pid: dead.pid, processStartTime: null },
      child: { pid: process.pid, processStartTime: null },
      acquiredAt: new Date().toISOString(),
    }));
    const { spawnFn, starts } = fakeSpawn({ layoutName: 'pi' });
    const result = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn, lockWaitMs: 150 });
    assert.deepEqual(result, { status: 'skipped', reason: 'lock-busy' });
    assert.equal(starts.length, 0);

    // Once the child is gone the dead holder is reclaimed as usual.
    fs.writeFileSync(path.join(lockDir, '0000000001.json'), JSON.stringify({ holder: { pid: dead.pid }, child: { pid: dead.pid }, acquiredAt: new Date().toISOString() }));
    const again = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn, lockWaitMs: 150 });
    assert.equal(again.status, 'renewed');
  } finally { w.cleanup(); }
});

test('the renewal child pid is recorded in the lock record while the call runs', async () => {
  const w = workspace();
  try {
    writePi(w.home, piDoc(Date.now() + 10 * 60 * 1000));
    let recorded = null;
    const { spawnFn } = fakeSpawn({
      layoutName: 'pi',
      delayMs: 30,
      onStart: () => {
        setTimeout(() => {
          const lockDir = path.join(w.accountDir, 'lock');
          const file = fs.readdirSync(lockDir).filter((n) => /^\d+\.json$/.test(n)).sort().pop();
          recorded = JSON.parse(fs.readFileSync(path.join(lockDir, file), 'utf8')).child ?? null;
        }, 10);
      },
    });
    await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn });
    assert.equal(recorded?.pid, 424242);
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
    const pending = path.join(w.accountDir, 'pending', '000000000000001-a');
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

test('the ownership marker records the write-back account only when asked, and only names and paths', async () => {
  const w = workspace();
  try {
    writePi(w.home, piDoc(Date.now() + HOUR));
    const tempRoot = path.join(w.tmp, 'fgos-confinement');
    const make = (dispatchId, withWriteBack) => {
      const resources = resolveConfinementResources({ dispatchId, context: {}, grants: [{ resource: 'private-home', access: 'read-write', scope: 'dispatch' }], backendConfig: { tempRoot } });
      const plan = { contract: 'confinement-plan.v1', dispatchId, decision: 'execute', coverage: {}, resources };
      const request = {
        dispatchId,
        executorId: 'omp-bwrap',
        invocation: { command: 'agent-cli', args: [], env: {}, resourceBindings: [] },
        providerCapacity: {
          provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home),
          ...(withWriteBack ? { credentialWriteBack: { runtimeDir: w.runtimeDir } } : {}),
        },
        context: { cwd: os.tmpdir(), runDir: os.tmpdir() },
      };
      return { plan, request, home: resources[0].hostTarget };
    };

    const plain = make('disp_plain', false);
    const preparedPlain = await prepareBwrap(plain.plan, plain.request, { id: 'bwrap', type: 'bwrap', config: {} });
    assert.equal('credentialWriteBack' in JSON.parse(fs.readFileSync(path.join(plain.home, OWNERSHIP_MARKER_FILE), 'utf8')), false);
    await preparedPlain.cleanup();

    const opted = make('disp_opted', true);
    const preparedOpted = await prepareBwrap(opted.plan, opted.request, { id: 'bwrap', type: 'bwrap', config: {} });
    const markerText = fs.readFileSync(path.join(opted.home, OWNERSHIP_MARKER_FILE), 'utf8');
    assert.deepEqual(JSON.parse(markerText).credentialWriteBack, {
      provider: 'xai', accountId: 'acct', kind: 'home-files', home: w.home, layout: 'pi-auth-json', runtimeDir: w.runtimeDir,
    });
    assert.equal(FAKE_FRAGMENTS.some((f) => markerText.includes(f)), false);
    await preparedOpted.cleanup();
  } finally { w.cleanup(); }
});

// ---------------------------------------------------------------------------------------------------
// Write-back at removal, through every removal path
// ---------------------------------------------------------------------------------------------------

function privateHomeWithRenewedLogin(w, { writeBack = true, dispatchId = 'disp_wb', accountHomeExpiryMs = Date.now() + 10 * 60 * 1000 } = {}) {
  writePi(w.home, piDoc(accountHomeExpiryMs));
  const dir = path.join(w.tmp, 'fgos-confinement', dispatchId, 'home');
  fs.mkdirSync(dir, { recursive: true });
  writeOwnershipMarker(dir, { dispatchId });
  copyCredentialFiles(dir, w.home, ['auth.json']);
  if (writeBack) {
    extendOwnershipMarker(dir, { credentialWriteBack: credentialWriteBackMarker({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir }) });
  }
  renewHome('pi', dir); // the pane renewed inside its copy
  return dir;
}

test('driver cleanup writes a login renewed inside the home back to its source, then removes the home', () => {
  const w = workspace();
  try {
    const dir = privateHomeWithRenewedLogin(w);
    const result = cleanupConfinementResource(dir, 'disp_wb');
    assert.equal(result.cleaned, true);
    assert.equal(fs.existsSync(dir), false);
    assert.equal(readPi(w.home).xai.refresh, FAKE.newRefresh);
    assert.deepEqual(fs.existsSync(path.join(w.accountDir, 'pending')) ? fs.readdirSync(path.join(w.accountDir, 'pending')) : [], []);
  } finally { w.cleanup(); }
});

test('a home whose marker does not ask for write-back is removed exactly as before, source untouched', () => {
  const w = workspace();
  try {
    const dir = privateHomeWithRenewedLogin(w, { writeBack: false });
    const original = sha(path.join(w.home, 'auth.json'));
    assert.equal(cleanupConfinementResource(dir, 'disp_wb').cleaned, true);
    assert.equal(fs.existsSync(dir), false);
    assert.equal(sha(path.join(w.home, 'auth.json')), original);
    assert.equal(fs.existsSync(w.accountDir), false, 'no account directory was even created');
  } finally { w.cleanup(); }
});

test('the finalizer of a settled dispatch writes back before it removes the home', async () => {
  const w = workspace();
  try {
    const dir = privateHomeWithRenewedLogin(w);
    const runDir = path.join(w.tmp, 'run');
    fs.mkdirSync(runDir, { recursive: true });
    const result = await finalizeConfinementResources({
      runDir,
      launchCommandId: 'launch_1',
      receipt: { completion: { kind: 'exited' } },
      descriptor: { resources: [{ kind: 'temporary-directory', pathRef: dir }] },
    });
    assert.equal(result.cleanupState, 'cleaned');
    assert.equal(fs.existsSync(dir), false);
    assert.equal(readPi(w.home).xai.refresh, FAKE.newRefresh);
  } finally { w.cleanup(); }
});

test('the orphan reaper writes back before it removes a home whose owner is gone', () => {
  const w = workspace();
  try {
    const dir = privateHomeWithRenewedLogin(w);
    const result = reapOrphanedConfinementResources({ tempRoot: path.join(w.tmp, 'fgos-confinement'), checkLiveness: () => false });
    assert.equal(result.reaped.length, 1);
    assert.equal(fs.existsSync(dir), false);
    assert.equal(readPi(w.home).xai.refresh, FAKE.newRefresh);
  } finally { w.cleanup(); }
});

test('a busy account lock stages the copy instead of waiting; the next refresh-ahead applies it', async () => {
  const w = workspace();
  try {
    const dir = privateHomeWithRenewedLogin(w);
    const held = tryAcquireAccountLock({ runtimeDir: w.runtimeDir, provider: 'xai', accountId: 'acct' });
    assert.ok(held);
    const started = Date.now();
    assert.equal(cleanupConfinementResource(dir, 'disp_wb').cleaned, true);
    assert.ok(Date.now() - started < 1000, 'the removal did not wait for the lock');
    assert.equal(fs.existsSync(dir), false);
    assert.equal(readPi(w.home).xai.refresh, FAKE.oldRefresh, 'not applied while the lock is held');
    const pending = fs.readdirSync(path.join(w.accountDir, 'pending'));
    assert.equal(pending.length, 1);
    held.release();

    const { spawnFn, starts } = fakeSpawn({ layoutName: 'pi' });
    const result = await refreshAhead({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir, spawnFn });
    assert.equal(result.status, 'fresh');
    assert.equal(starts.length, 0);
    assert.equal(readPi(w.home).xai.refresh, FAKE.newRefresh);
    assert.deepEqual(fs.readdirSync(path.join(w.accountDir, 'pending')), []);
  } finally { w.cleanup(); }
});

test('a write-back that cannot be done is reported by code on stderr and still removes the home', () => {
  const w = workspace();
  const captured = [];
  const realWrite = process.stderr.write;
  try {
    const dir = privateHomeWithRenewedLogin(w);
    extendOwnershipMarker(dir, { credentialWriteBack: { provider: 'xai', accountId: '../escape', home: w.home, layout: 'pi-auth-json', runtimeDir: w.runtimeDir } });
    process.stderr.write = (chunk) => { captured.push(String(chunk)); return true; };
    const result = cleanupConfinementResource(dir, 'disp_wb');
    process.stderr.write = realWrite;
    assert.equal(result.cleaned, true);
    assert.equal(fs.existsSync(dir), false);
    assert.match(captured.join(''), /credential write-back not done \(invalid-marker\)/);
    assert.equal(FAKE_FRAGMENTS.some((f) => captured.join('').includes(f)), false);
    assert.equal(readPi(w.home).xai.refresh, FAKE.oldRefresh);
  } finally { process.stderr.write = realWrite; w.cleanup(); }
});

test('a home that holds nothing newer, or an unreadable copy, writes nothing and stages nothing', () => {
  const w = workspace();
  try {
    writePi(w.home, piDoc(Date.now() + HOUR));
    const dir = path.join(w.tmp, 'h');
    copyCredentialFiles(dir, w.home, ['auth.json']);
    const marker = { credentialWriteBack: credentialWriteBackMarker({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir }) };
    assert.deepEqual(writeBackRenewedCredential(dir, marker), { status: 'unchanged' });
    fs.writeFileSync(path.join(dir, 'auth.json'), `{"xai": {"refresh": "${FAKE.newRefresh}"`);
    assert.deepEqual(writeBackRenewedCredential(dir, marker), { status: 'unchanged' });
    assert.deepEqual(writeBackRenewedCredential(dir, {}), { status: 'none' });
    assert.equal(fs.existsSync(w.accountDir), false);
  } finally { w.cleanup(); }
});

test('an omp copy renewed inside a pane is written back as a row update', () => {
  const w = workspace();
  try {
    const holder = writeOmp(w.home, [{ id: 1, data: ompData(Date.now() + 10 * 60 * 1000) }], { wal: true });
    const dir = path.join(w.tmp, 'fgos-confinement', 'disp_omp', 'home');
    fs.mkdirSync(dir, { recursive: true });
    writeOwnershipMarker(dir, { dispatchId: 'disp_omp' });
    copyCredentialFiles(dir, w.home, ['agent.db']);
    extendOwnershipMarker(dir, { credentialWriteBack: credentialWriteBackMarker({ provider: 'xai', accountId: 'acct', credentialSource: ompSource(w.home), runtimeDir: w.runtimeDir }) });
    renewHome('omp', dir);

    assert.equal(cleanupConfinementResource(dir, 'disp_omp').cleaned, true);
    assert.equal(JSON.parse(holder.prepare('SELECT data FROM auth_credentials WHERE id = 1').get().data).refresh, FAKE.newRefresh);
    holder.close();
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
    cleanupConfinementResource(dir, 'disp_scan');
    process.stderr.write = realWrite;

    const everything = [JSON.stringify(results), captured.join('')];
    const walk = (d) => {
      for (const name of fs.readdirSync(d)) {
        const full = path.join(d, name);
        if (fs.statSync(full).isDirectory()) walk(full); else if (!full.startsWith(w.home)) everything.push(fs.readFileSync(full, 'utf8'));
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

test('a retained home removed after its renewed access token expired still writes the newer refresh token back', () => {
  const w = workspace();
  try {
    const now = Date.now();
    const dir = privateHomeWithRenewedLogin(w, { accountHomeExpiryMs: now - 3 * HOUR });
    renewHome('pi', dir, { expiresMs: now - 10 * 60 * 1000 }); // renewed in the pane, and expired again since
    assert.equal(cleanupConfinementResource(dir, 'disp_wb').cleaned, true);
    assert.equal(readPi(w.home).xai.refresh, FAKE.newRefresh, 'the source no longer holds the spent token');
  } finally { w.cleanup(); }
});

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
    const copy = path.join(w.accountDir, 'pending', '000000000000001-a');
    writePi(copy, piDoc(now + 6 * HOUR, { access: FAKE.newAccess, refresh: FAKE.newRefresh }));
    const apply = () => applyRenewedCredential({ layoutName: 'pi-auth-json', sourceHome: w.home, copyHome: copy, provider: 'xai', requireFuture: false });

    fs.writeFileSync(path.join(w.home, 'auth.json'), TORN);
    assert.deepEqual(apply(), { status: 'apply-deferred', code: 'unreadable-json' });
    fs.rmSync(path.join(w.home, 'auth.json'));
    assert.deepEqual(apply(), { status: 'apply-deferred', code: 'unreadable-file' });
    writePi(w.home, { 'github-copilot': { type: 'oauth', access: 'a', refresh: 'b', expires: now + HOUR } });
    assert.deepEqual(apply(), { status: 'apply-deferred', code: 'entry-unidentified' });

    writePi(w.home, piDoc(now + 10 * HOUR, { access: 'FAKE-NEWER', refresh: 'FAKE-NEWER-REFRESH' }));
    assert.equal(apply().status, 'unchanged');
    fs.writeFileSync(path.join(copy, 'auth.json'), TORN);
    assert.equal(apply().status, 'unreadable', 'a copy that is itself malformed is unusable');
  } finally { w.cleanup(); }
});

test('write-back stages a renewed home when the source is half-written, and the leftover stays pending', () => {
  const w = workspace();
  try {
    const dir = privateHomeWithRenewedLogin(w);
    fs.writeFileSync(path.join(w.home, 'auth.json'), TORN);
    const result = writeBackRenewedCredential(dir, JSON.parse(fs.readFileSync(path.join(dir, OWNERSHIP_MARKER_FILE), 'utf8')));
    assert.deepEqual(result, { status: 'staged' });
    const kept = pendingCopies(w);
    assert.equal(kept.length, 1);
    assert.equal(readPi(kept[0]).xai.refresh, FAKE.newRefresh);
    assert.equal(sha(path.join(w.home, 'auth.json')), TORN);
  } finally { w.cleanup(); }
});

test('write-back reports applied only when the copy was applied, and unchanged when it was dropped as not newer', () => {
  const w = workspace();
  try {
    const dir = privateHomeWithRenewedLogin(w);
    const marker = JSON.parse(fs.readFileSync(path.join(dir, OWNERSHIP_MARKER_FILE), 'utf8'));
    assert.deepEqual(writeBackRenewedCredential(dir, marker), { status: 'applied' });
    assert.equal(readPi(w.home).xai.refresh, FAKE.newRefresh);
    assert.deepEqual(pendingCopies(w), []);
    assert.deepEqual(writeBackRenewedCredential(dir, marker), { status: 'unchanged' });
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

test('a write-back marker with an unsafe provider or account id is refused, not trusted', () => {
  const w = workspace();
  try {
    for (const bad of ['../x', 'a/b', '', '-a', 'a b', undefined, 7]) {
      assert.equal(credentialWriteBackMarker({ provider: bad, accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir }), null, String(bad));
      assert.equal(credentialWriteBackMarker({ provider: 'xai', accountId: bad, credentialSource: piSource(w.home), runtimeDir: w.runtimeDir }), null, String(bad));
    }
    const good = credentialWriteBackMarker({ provider: 'xai', accountId: 'acct', credentialSource: piSource(w.home), runtimeDir: w.runtimeDir });
    for (const bad of ['../x', 'a/b', '']) {
      const marker = { credentialWriteBack: { ...good, accountId: bad } };
      assert.deepEqual(writeBackRenewedCredential(w.tmp, marker), { status: 'failed', code: 'invalid-marker' }, bad);
    }
  } finally { w.cleanup(); }
});
