// Keeping a rotating provider login alive across throwaway private homes.
//
// Dispatch copies an account's credential files into a private home that is deleted afterwards. A login
// whose refresh token is single use (pi, omp and Codex all are) breaks if the renewal happens inside such
// a copy: the provider retires the source's refresh token and the new pair goes away with the home. Two
// halves keep the source usable:
//
//   refresh-ahead  Before a private home is built from an account whose login is close to expiry, renew it
//                  once inside a scratch copy that fgOS owns, under the account lock, and apply the new
//                  entry to the real store. The real store is never made to look expired, so the owner's
//                  own CLI does not renew because of us, and a failed renewal leaves it untouched.
//   write-back     When a private home is removed, a login a pane renewed inside it is applied to the
//                  source, or staged beside it for the next refresh-ahead when the account lock is busy.
//
// Applying is always compare-before-write: only an entry whose expiry is strictly later than the source's
// and whose refresh token is a different one replaces it (a fresh renewal result must also still be in the
// future), only that entry changes, and a copy that cannot be read, has an unexpected shape or lacks a
// refresh token the source has never touches the source. A copy is removed only when the source was read
// and proves the copy is not newer, or when the copy itself is unusable; when the source cannot be read or
// its entry cannot be identified, the copy is kept for the next holder of the account lock. Nothing here
// prints, logs or returns a token value; results carry fixed codes, and a parser's own message is never
// passed on because it quotes the input.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

import { acquireAccountLock, tryAcquireAccountLock, providerAccountDir } from './provider-capacity.mjs';
import {
  credentialProbeCommand,
  expandCredentialHome,
  runCredentialProbe,
  withKillTimeout,
  DEFAULT_CREDENTIAL_PROBE_TIMEOUT_MS,
} from './provider-credential-probe.mjs';

const require = createRequire(import.meta.url);

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

// Codex renews a login on its own when the access token is within five minutes of expiry, and falls back
// to the age of `last_refresh` when the token cannot be read. Source: openai/codex,
// codex-rs/login/src/auth/manager.rs: `TOKEN_REFRESH_INTERVAL: i64 = 8` (days) used by
// `should_refresh_proactively` as `last_refresh < now - 8 days`. A login is treated as due at whichever
// of the two comes first, so the answer holds for a Codex build that uses either rule.
export const CODEX_REFRESH_INTERVAL_MS = 8 * DAY_MS;

export const DEFAULT_REFRESH_AHEAD_MIN_THRESHOLD_MS = 60 * MINUTE_MS;
export const DEFAULT_RENEWAL_COOLDOWN_MS = 30 * MINUTE_MS;
const THRESHOLD_MARGIN_MS = 5 * MINUTE_MS;
const LOCK_MARGIN_MS = 30 * 1000;

const COOLDOWN_FILE = 'cooldown.json';
const PENDING_DIR = 'pending';
const SCRATCH_PREFIX = 'scratch-';
const MAX_PENDING_COPIES = 5;

const defaultLoadSqlite = () => {
  try {
    return require('node:sqlite');
  } catch {
    return null;
  }
};

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const fail = (code) => ({ ok: false, code });

/** The refresh-ahead window: at least an hour, and always longer than one renewal call plus a margin. */
export function defaultRefreshAheadThresholdMs(probeTimeoutMs = DEFAULT_CREDENTIAL_PROBE_TIMEOUT_MS) {
  return Math.max(DEFAULT_REFRESH_AHEAD_MIN_THRESHOLD_MS, probeTimeoutMs + THRESHOLD_MARGIN_MS);
}

// ---------------------------------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------------------------------

function readJsonFile(file) {
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (err) {
    // Only a file that is not there is proven empty; any other read error (EACCES, EIO, EMFILE) may pass.
    return fail(err?.code === 'ENOENT' ? 'missing-file' : 'unreadable-file');
  }
  try {
    return { ok: true, raw, doc: JSON.parse(raw) };
  } catch {
    // The parser's message quotes nearby input; only the code is reported.
    return fail('unreadable-json');
  }
}

function indentOf(raw) {
  return /^\s*\n\s+"/.test(raw) || /\{\n\s+"/.test(raw) ? 2 : 0;
}

function serializeJson(doc, raw) {
  const text = JSON.stringify(doc, null, indentOf(raw) || undefined);
  return raw.endsWith('\n') ? `${text}\n` : text;
}

export function writeFileAtomic(file, content) {
  const tmp = path.join(path.dirname(file), `.${path.basename(file)}.fgos-${process.pid}-${crypto.randomBytes(4).toString('hex')}`);
  try {
    const fd = fs.openSync(tmp, 'w', 0o600);
    try {
      fs.writeSync(fd, content);
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    fs.renameSync(tmp, file);
  } catch (err) {
    try { fs.rmSync(tmp, { force: true }); } catch { /* nothing left to do */ }
    throw err;
  }
}

/**
 * A consistent copy of a SQLite file, including what is still in its write-ahead log. Returns false (and
 * leaves nothing behind) when the module is unavailable or the snapshot cannot be taken.
 */
export function snapshotSqliteFile(source, destination, { loadSqlite = defaultLoadSqlite } = {}) {
  const sqlite = loadSqlite();
  if (!sqlite) return false;
  let db;
  try {
    db = new sqlite.DatabaseSync(source, { readOnly: true, timeout: 5000 });
    db.exec(`VACUUM INTO '${String(destination).replace(/'/g, "''")}'`);
    fs.chmodSync(destination, 0o600);
    return true;
  } catch {
    try { fs.rmSync(destination, { force: true }); } catch { /* nothing left to do */ }
    return false;
  } finally {
    try { db?.close(); } catch { /* already closed */ }
  }
}

/**
 * Copy an explicit allow-list of files from a credential home into `destinationRoot`, at the same
 * relative paths. A missing, escaping or non-regular entry throws `makeError(message)`. A listed
 * `agent.db` is copied as a SQLite snapshot (consistent, WAL included) when the module is available, and
 * as a plain file otherwise.
 */
export function copyCredentialFiles(destinationRoot, sourceHome, files, { makeError = (message) => new Error(message), ensureDir, loadSqlite } = {}) {
  let realHome;
  try {
    realHome = fs.realpathSync(sourceHome);
  } catch (err) {
    throw makeError(`selected credential home is not readable: ${err.message}`);
  }
  const mkdir = ensureDir ?? ((dir) => fs.mkdirSync(dir, { recursive: true, mode: 0o700 }));
  for (const rel of files) {
    if (typeof rel !== 'string' || !rel.trim() || path.isAbsolute(rel) || rel.split(/[\\/]/).includes('..')) {
      throw makeError(`credential file ${JSON.stringify(rel)} must be a relative path without "..".`);
    }
    let realSource;
    try {
      realSource = fs.realpathSync(path.join(realHome, rel));
    } catch {
      throw makeError(`selected credential file "${rel}" is missing`);
    }
    if (!realSource.startsWith(realHome + path.sep) || !fs.statSync(realSource).isFile()) {
      throw makeError(`selected credential file "${rel}" is not a regular file inside the credential home`);
    }
    const destination = path.join(destinationRoot, rel);
    try {
      mkdir(path.dirname(destination));
      const isStore = path.basename(rel) === 'agent.db';
      const snapshotted = isStore && snapshotSqliteFile(realSource, destination, { loadSqlite });
      if (!snapshotted) {
        // Without node:sqlite the plain copy is all there is. With it, a failed snapshot means the copy
        // may lack what is still in the write-ahead log: say so (the name only, no value) and go on.
        if (isStore && (loadSqlite ?? defaultLoadSqlite)()) {
          process.stderr.write('fgos: credential snapshot of agent.db failed (credential-snapshot-failed); copying the file as it is\n');
        }
        fs.copyFileSync(realSource, destination);
      }
      // Credentials stay owner-only; a listed helper binary keeps its exec bit.
      fs.chmodSync(destination, fs.statSync(realSource).mode & 0o100 ? 0o700 : 0o600);
    } catch (copyErr) {
      throw makeError(`selected credential file "${rel}" could not be copied: ${copyErr.message}`);
    }
  }
}

// ---------------------------------------------------------------------------------------------------
// Layouts. Each knows where its login lives, when it expires, how to make a copy look due, and how to
// merge a newer entry into the source. A read result is `{ok, entries}` where an entry is
// `{key, expiresMs, dueMs}`; `dueMs` is when the CLI itself would renew it.
// ---------------------------------------------------------------------------------------------------

function jwtPayload(token) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return isObject(payload) ? { parts, payload } : null;
  } catch {
    return null;
  }
}

function jwtExpiryMs(token) {
  const decoded = jwtPayload(token);
  return Number.isFinite(decoded?.payload.exp) ? decoded.payload.exp * 1000 : null;
}

const toMs = (expires) => (expires < 1e12 ? expires * 1000 : expires);

// The refresh token of an entry, only ever compared in memory, never returned or printed. A store whose
// refresh field cannot be found yields null; null on both sides lets the expiry rule alone decide, while a
// copy without a refresh token never replaces a source entry that has one.
function refreshOf(object) {
  for (const name of ['refresh', 'refresh_token', 'refreshToken']) {
    if (typeof object?.[name] === 'string') return object[name];
  }
  return null;
}
const refreshDiffers = (copy, source) => (copy === null ? source === null : source === null || copy !== source);

// A copy entry replaces the source's only when its expiry is strictly later and its refresh token is a
// different one (a copy that still holds the source's own refresh token has renewed nothing: a marked-due
// scratch copy whose call never ran looks "later" only by accident). `requireFuture` is for a fresh
// renewal, where an expiry already past means "not renewed"; a copy staged earlier (a pane's home, a
// leftover) is applied even when its access token has since expired, because its refresh token is the
// newer one and the source's is already spent.
function isReplacement(copyEntry, sourceEntry, { now, requireFuture }) {
  return copyEntry.expiresMs > sourceEntry.expiresMs
    && (!requireFuture || copyEntry.expiresMs > now)
    && refreshDiffers(copyEntry.refresh, sourceEntry.refresh);
}

// pi: `auth.json`, an object keyed by provider id; an `oauth` entry carries `expires` (ms, or seconds when
// below 1e12). An API key entry has no expiry and is not renewable here.
const piLayout = {
  name: 'pi-auth-json',
  files: ['auth.json'],
  read(home) {
    const parsed = readJsonFile(path.join(home, 'auth.json'));
    if (!parsed.ok) return parsed;
    if (!isObject(parsed.doc)) return fail('unexpected-shape');
    const entries = [];
    for (const [key, value] of Object.entries(parsed.doc)) {
      if (isObject(value) && value.type === 'oauth' && Number.isFinite(value.expires)) {
        const expiresMs = toMs(value.expires);
        entries.push({ key, owner: key, expiresMs, dueMs: expiresMs, refresh: refreshOf(value), value });
      }
    }
    return entries.length > 0 ? { ok: true, entries, doc: parsed.doc, raw: parsed.raw } : fail('unexpected-shape');
  },
  markDue(home, keys) {
    const file = path.join(home, 'auth.json');
    const parsed = readJsonFile(file);
    if (!parsed.ok) throw new Error(parsed.code);
    for (const key of keys) {
      const entry = parsed.doc[key];
      if (!isObject(entry)) continue;
      entry.expires = entry.expires < 1e12 ? Math.floor(Date.now() / 1000) - 3600 : Date.now() - 60 * MINUTE_MS;
    }
    fs.writeFileSync(file, serializeJson(parsed.doc, parsed.raw), { mode: 0o600 });
  },
  apply(sourceHome, copyRead, { now, key, requireFuture }) {
    const file = path.join(sourceHome, 'auth.json');
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const source = readJsonFile(file);
      if (!source.ok) throw new Error(source.code);
      if (!isObject(source.doc)) throw new Error('unexpected-shape');
      const applied = [];
      for (const entry of copyRead.entries) {
        if (key !== undefined && entry.key !== key) continue;
        const current = source.doc[entry.key];
        if (!isObject(current) || current.type !== 'oauth' || !Number.isFinite(current.expires)) {
          if (key !== undefined) throw new Error('entry-unidentified');
          continue;
        }
        if (isReplacement(entry, { expiresMs: toMs(current.expires), refresh: refreshOf(current) }, { now, requireFuture })) {
          source.doc[entry.key] = entry.value;
          applied.push(entry.key);
        }
      }
      if (applied.length === 0) return applied;
      if (writeIfUnchanged(file, source.raw, serializeJson(source.doc, source.raw))) return applied;
    }
    throw new Error('source-changing');
  },
  stage(copyHome, stagingDir) {
    fs.copyFileSync(path.join(copyHome, 'auth.json'), path.join(stagingDir, 'auth.json'));
    fs.chmodSync(path.join(stagingDir, 'auth.json'), 0o600);
  },
};

// The file is replaced only when it still holds what the merge was based on; the owner's own CLI does not
// take the account lock, so a change in between means the merge is recomputed from the new content.
function writeIfUnchanged(file, expectedRaw, content) {
  if (fs.readFileSync(file, 'utf8') !== expectedRaw) return false;
  writeFileAtomic(file, content);
  return true;
}

// Codex: `auth.json` with `tokens.access_token` (a JWT whose `exp` says when it expires) and
// `last_refresh`. Renewal replaces `tokens` and `last_refresh` together.
const codexLayout = {
  name: 'codex-auth-json',
  files: ['auth.json'],
  read(home) {
    const parsed = readJsonFile(path.join(home, 'auth.json'));
    if (!parsed.ok) return parsed;
    const tokens = parsed.doc?.tokens;
    if (!isObject(parsed.doc) || !isObject(tokens) || typeof tokens.access_token !== 'string') return fail('unexpected-shape');
    const exp = jwtExpiryMs(tokens.access_token);
    const lastRefresh = Date.parse(parsed.doc.last_refresh ?? '');
    const byAge = Number.isFinite(lastRefresh) ? lastRefresh + CODEX_REFRESH_INTERVAL_MS : null;
    if (exp === null && byAge === null) return fail('unexpected-shape');
    const dueMs = Math.min(exp ?? Infinity, byAge ?? Infinity);
    return {
      ok: true,
      entries: [{ key: 'codex', owner: null, expiresMs: exp ?? byAge, dueMs, refresh: refreshOf(tokens), value: { tokens, last_refresh: parsed.doc.last_refresh } }],
      doc: parsed.doc,
      raw: parsed.raw,
    };
  },
  // Both rules are made to say "due": `last_refresh` is set long ago and the access token's `exp` claim is
  // moved into the past. Only this scratch copy is edited, and only its payload segment (Codex reads the
  // claim without verifying the signature), so the refresh token is untouched.
  markDue(home) {
    const file = path.join(home, 'auth.json');
    const parsed = readJsonFile(file);
    if (!parsed.ok) throw new Error(parsed.code);
    parsed.doc.last_refresh = '2000-01-01T00:00:00Z';
    const decoded = jwtPayload(parsed.doc.tokens?.access_token);
    if (decoded) {
      decoded.payload.exp = Math.floor(Date.now() / 1000) - 3600;
      decoded.parts[1] = Buffer.from(JSON.stringify(decoded.payload), 'utf8').toString('base64url');
      parsed.doc.tokens.access_token = decoded.parts.join('.');
    }
    fs.writeFileSync(file, serializeJson(parsed.doc, parsed.raw), { mode: 0o600 });
  },
  apply(sourceHome, copyRead, { now, requireFuture }) {
    const file = path.join(sourceHome, 'auth.json');
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const source = codexLayout.read(sourceHome);
      if (!source.ok) throw new Error(source.code);
      const current = source.entries[0];
      const next = copyRead.entries[0];
      if (!next || !isReplacement(next, current, { now, requireFuture })) return [];
      source.doc.tokens = next.value.tokens;
      if (next.value.last_refresh !== undefined) source.doc.last_refresh = next.value.last_refresh;
      if (writeIfUnchanged(file, source.raw, serializeJson(source.doc, source.raw))) return ['codex'];
    }
    throw new Error('source-changing');
  },
  stage(copyHome, stagingDir) {
    fs.copyFileSync(path.join(copyHome, 'auth.json'), path.join(stagingDir, 'auth.json'));
    fs.chmodSync(path.join(stagingDir, 'auth.json'), 0o600);
  },
};

// omp: `agent.db`, a SQLite file; table `auth_credentials`, one row per credential, `data` a JSON text
// with `expires` (ms). A row is renewable when `credential_type = 'oauth'` and it is not disabled.
const OMP_SELECT = "SELECT * FROM auth_credentials WHERE credential_type = 'oauth' AND disabled_cause IS NULL";
const ompKey = (row) => `${row.id}\u0000${row.provider}`;

function withDatabase(file, { loadSqlite, readOnly }, fn) {
  const sqlite = loadSqlite();
  if (!sqlite) throw Object.assign(new Error('sqlite-unavailable'), { code: 'sqlite-unavailable' });
  const db = new sqlite.DatabaseSync(file, readOnly ? { readOnly: true, timeout: 5000 } : { timeout: 5000 });
  try {
    if (!readOnly) db.exec('PRAGMA busy_timeout = 5000');
    return fn(db);
  } finally {
    try { db.close(); } catch { /* already closed */ }
  }
}

function ompEntries(db) {
  const entries = [];
  for (const row of db.prepare(OMP_SELECT).all()) {
    let data;
    try {
      data = JSON.parse(String(row.data));
    } catch {
      continue;
    }
    if (isObject(data) && Number.isFinite(data.expires)) {
      entries.push({ key: ompKey(row), owner: String(row.provider), expiresMs: data.expires, dueMs: data.expires, refresh: refreshOf(data), value: { id: row.id, provider: row.provider, data: String(row.data), row } });
    }
  }
  return entries;
}

const ompLayout = {
  name: 'omp-agent-db',
  files: ['agent.db'],
  read(home, { loadSqlite }) {
    const file = path.join(home, 'agent.db');
    try {
      fs.statSync(file);
    } catch (err) {
      return fail(err?.code === 'ENOENT' ? 'missing-file' : 'unreadable-file');
    }
    try {
      const entries = withDatabase(file, { loadSqlite, readOnly: true }, ompEntries);
      return entries.length > 0 ? { ok: true, entries } : fail('unexpected-shape');
    } catch (err) {
      return fail(err?.code === 'sqlite-unavailable' ? 'sqlite-unavailable' : 'unreadable-db');
    }
  },
  markDue(home, keys, { loadSqlite }) {
    withDatabase(path.join(home, 'agent.db'), { loadSqlite, readOnly: false }, (db) => {
      const past = Date.now() - 60 * MINUTE_MS;
      for (const entry of ompEntries(db)) {
        if (!keys.includes(entry.key)) continue;
        const data = JSON.parse(entry.value.data);
        data.expires = past;
        db.prepare('UPDATE auth_credentials SET data = ? WHERE id = ? AND provider = ?').run(JSON.stringify(data), entry.value.id, entry.value.provider);
      }
    });
  },
  apply(sourceHome, copyRead, { now, loadSqlite, key, requireFuture }) {
    // A row update in one transaction, never a replacement of the file: the owner's omp may hold the
    // database open, and every other row and column must stay as it is.
    return withDatabase(path.join(sourceHome, 'agent.db'), { loadSqlite, readOnly: false }, (db) => {
      const hasUpdatedAt = db.prepare('PRAGMA table_info(auth_credentials)').all().some((column) => column.name === 'updated_at');
      const applied = [];
      db.exec('BEGIN IMMEDIATE');
      try {
        const current = new Map(ompEntries(db).map((entry) => [entry.key, entry]));
        for (const entry of copyRead.entries) {
          if (key !== undefined && entry.key !== key) continue;
          const target = current.get(entry.key);
          if (!target && key !== undefined) throw new Error('entry-unidentified');
          if (!target || !isReplacement(entry, target, { now, requireFuture })) continue;
          if (hasUpdatedAt) {
            db.prepare('UPDATE auth_credentials SET data = ?, updated_at = ? WHERE id = ? AND provider = ?')
              .run(entry.value.data, entry.value.row.updated_at ?? null, entry.value.id, entry.value.provider);
          } else {
            db.prepare('UPDATE auth_credentials SET data = ? WHERE id = ? AND provider = ?').run(entry.value.data, entry.value.id, entry.value.provider);
          }
          applied.push(entry.key);
        }
        db.exec('COMMIT');
      } catch (err) {
        try { db.exec('ROLLBACK'); } catch { /* the transaction is already gone */ }
        throw err;
      }
      if (applied.length > 0) {
        try { db.exec('PRAGMA wal_checkpoint(PASSIVE)'); } catch { /* best effort */ }
      }
      return applied;
    });
  },
  stage(copyHome, stagingDir, { loadSqlite }) {
    const destination = path.join(stagingDir, 'agent.db');
    if (snapshotSqliteFile(path.join(copyHome, 'agent.db'), destination, { loadSqlite })) return;
    // No snapshot (the module is unavailable, or the file cannot be opened): the files as they are, write-ahead
    // log included. The pane's processes are already stopped, so nothing is writing to them.
    for (const suffix of ['', '-wal', '-shm']) {
      const from = path.join(copyHome, `agent.db${suffix}`);
      if (!fs.existsSync(from)) {
        if (suffix === '') throw new Error('stage-failed');
        continue;
      }
      fs.copyFileSync(from, `${destination}${suffix}`);
      fs.chmodSync(`${destination}${suffix}`, 0o600);
    }
  },
};

const LAYOUTS = Object.freeze({ [piLayout.name]: piLayout, [codexLayout.name]: codexLayout, [ompLayout.name]: ompLayout });

/** The layout name of a credential source (the same order the probe command uses), or null. */
export function credentialLayout(source) {
  if (source?.kind === 'codex-home') return codexLayout.name;
  if (source?.kind === 'home-files' && Array.isArray(source.files)) {
    if (source.files.includes('agent.db')) return ompLayout.name;
    if (source.files.includes('auth.json')) return piLayout.name;
  }
  return null;
}

/**
 * Read the expiry entries of a credential home. `{ok: true, entries: [{key, expiresMs, dueMs}]}` or
 * `{ok: false, code}` with a fixed code (`missing-file`, `unreadable-file`, `unreadable-json`, `unreadable-db`,
 * `unexpected-shape`, `sqlite-unavailable`, `unknown-layout`); values are never part of the result.
 */
export function readCredentialExpiry(layoutName, home, { loadSqlite = defaultLoadSqlite } = {}) {
  const layout = LAYOUTS[layoutName];
  if (!layout) return fail('unknown-layout');
  const read = layout.read(home, { loadSqlite });
  if (!read.ok) return read;
  return { ok: true, entries: read.entries.map(({ key, expiresMs, dueMs }) => ({ key, expiresMs, dueMs })) };
}

const earliestDue = (entries) => Math.min(...entries.map((entry) => entry.dueMs));

// The one entry that belongs to the dispatched fgOS provider: a store may hold logins of other providers
// (an abandoned one must not make every dispatch renew, and a renewal of another provider's entry would
// not give this dispatch a fresh login). An entry belongs when its owner (pi: the key, omp: the row's
// provider) is the provider id or starts with `<provider>-`; a Codex login has no owner because its store
// holds one provider only. Zero or several matches cannot be told apart.
function selectProviderEntry(entries, provider) {
  const matches = entries.filter((entry) => entry.owner === null || entry.owner === provider || entry.owner.startsWith(`${provider}-`));
  return matches.length === 1 ? { ok: true, entry: matches[0] } : fail('entry-unidentified');
}

// ---------------------------------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------------------------------

// Codes that say the copy itself is unusable (it can never be applied); every other failure code, and every
// failure to read the source, is a reason that may pass and leaves the copy where it is.
// `unreadable-file` is an operating-system read error and is deliberately absent: it may pass.
const COPY_UNUSABLE_CODES = new Set(['missing-file', 'unreadable-json', 'unexpected-shape', 'unknown-layout']);
const SOURCE_SIDE_THROWS = new Set(['missing-file', 'unreadable-file', 'unreadable-json', 'unexpected-shape', 'unreadable-db', 'sqlite-unavailable', 'entry-unidentified']);

/**
 * Apply the entry of `copyHome` that is strictly newer than the source's and carries a different refresh
 * token. With `provider`, only that provider's entry is considered (see selectProviderEntry); without it,
 * every entry. `requireFuture` (default true) also demands an expiry still ahead, which is what a fresh
 * renewal result must satisfy; a copy staged earlier is applied with `requireFuture: false`. The caller
 * holds the account lock. Returns `{status, keys}` with `applied`, or `unchanged` when the source was read
 * and the copy is not newer; or `{status: 'unreadable', code}` when the copy itself is unusable; or
 * `{status: 'apply-deferred', code}` when the source could not be read, its entry could not be identified,
 * or the copy could not be read for a reason that may pass. Only `applied`, `unchanged` and `unreadable`
 * allow the caller to remove the copy; the source is untouched unless `applied`. Throws only when writing
 * the source itself fails.
 */
export function applyRenewedCredential({ layoutName, sourceHome, copyHome, provider, requireFuture = true, now = Date.now(), loadSqlite = defaultLoadSqlite }) {
  const layout = LAYOUTS[layoutName];
  if (!layout) return { status: 'unreadable', code: 'unknown-layout' };
  const copy = layout.read(copyHome, { loadSqlite });
  if (!copy.ok) return { status: COPY_UNUSABLE_CODES.has(copy.code) ? 'unreadable' : 'apply-deferred', code: copy.code };
  const source = layout.read(sourceHome, { loadSqlite });
  if (!source.ok) return { status: 'apply-deferred', code: source.code };
  let key;
  if (provider !== undefined) {
    const selected = selectProviderEntry(source.entries, provider);
    if (!selected.ok) return { status: 'apply-deferred', code: selected.code };
    key = selected.entry.key;
  }
  let keys;
  try {
    keys = layout.apply(sourceHome, copy, { now, loadSqlite, key, requireFuture });
  } catch (err) {
    // The source changed between the read above and the write: still a source-side reason, not a verdict
    // on the copy.
    if (SOURCE_SIDE_THROWS.has(err?.message)) return { status: 'apply-deferred', code: err.message };
    throw err;
  }
  return { status: keys.length > 0 ? 'applied' : 'unchanged', keys };
}

// Codes that prove a copy holds nothing usable: its store file is not there, its JSON is corrupt, or it
// parses to no usable entry. A read error or a database that cannot be opened may pass, so such a copy is
// not proven malformed.
const COPY_MALFORMED_CODES = new Set(['missing-file', 'unreadable-json', 'unexpected-shape', 'unknown-layout']);

// Whether the copy holds a login newer than the source's: 'newer', 'not-newer' (the source was read and
// proves it, or the copy is proven malformed), or 'undetermined' when nothing proves it: the copy cannot
// be read for a reason that may pass, or the source cannot say (it cannot be read, or its entry cannot be
// identified and the copy holds a refresh token the source does not). Undetermined copies are staged
// rather than dropped.
function copyIsNewer({ layout, provider, sourceHome, copyHome, now, loadSqlite }) {
  const copy = layout.read(copyHome, { loadSqlite });
  if (!copy.ok) {
    if (COPY_MALFORMED_CODES.has(copy.code)) return 'not-newer';
    return 'undetermined';
  }
  const source = layout.read(sourceHome, { loadSqlite });
  if (!source.ok) return 'undetermined';
  const selected = selectProviderEntry(source.entries, provider);
  if (!selected.ok) {
    const held = new Set(source.entries.map((entry) => entry.refresh).filter((refresh) => refresh !== null));
    return copy.entries.some((entry) => entry.refresh !== null && !held.has(entry.refresh)) ? 'undetermined' : 'not-newer';
  }
  const next = copy.entries.find((entry) => entry.key === selected.entry.key);
  return next !== undefined && isReplacement(next, selected.entry, { now, requireFuture: false }) ? 'newer' : 'not-newer';
}

// ---------------------------------------------------------------------------------------------------
// Leftovers: copies renewed elsewhere and waiting for the account lock, and a scratch home a dead runner
// left behind. Both hold a login that may be the only good pair, so they are applied before anything else.
// ---------------------------------------------------------------------------------------------------

function listLeftovers(accountDir) {
  const found = [];
  let names = [];
  try { names = fs.readdirSync(accountDir); } catch { return found; }
  for (const name of names.filter((n) => n.startsWith(SCRATCH_PREFIX)).sort()) found.push(path.join(accountDir, name));
  const pendingDir = path.join(accountDir, PENDING_DIR);
  let pending = [];
  try { pending = fs.readdirSync(pendingDir); } catch { /* none */ }
  for (const name of pending.filter((n) => !n.startsWith('.')).sort()) found.push(path.join(pendingDir, name));
  return found;
}

const hasLeftovers = (accountDir) => listLeftovers(accountDir).length > 0;

/**
 * Login copies an account is holding for its next renewal: staged `pending/` copies (their name starts
 * with the staging time) and scratch homes a dead runner left (age by modification time). Read-only;
 * names, kinds and ages only. Only copies at least `minAgeMs` old are listed: a younger one is simply
 * waiting for the next renewal.
 */
export function inspectRetainedCredentialCopies({ runtimeDir, now = Date.now(), minAgeMs = 0 }) {
  const found = [];
  const root = path.join(runtimeDir, 'account-locks');
  const subdirs = (dir) => {
    try { return fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name); } catch { return []; }
  };
  for (const provider of subdirs(root)) {
    for (const accountId of subdirs(path.join(root, provider))) {
      const accountDir = path.join(root, provider, accountId);
      for (const dir of listLeftovers(accountDir)) {
        const name = path.basename(dir);
        const staged = /^(\d{15})-/.exec(name);
        let at;
        if (staged) at = Number(staged[1]);
        else { try { at = fs.statSync(dir).mtimeMs; } catch { continue; } }
        const ageMs = now - at;
        if (ageMs >= minAgeMs) found.push({ provider, accountId, kind: staged ? 'pending' : 'scratch', ageMs });
      }
    }
  }
  return found;
}

/**
 * Keep the newest MAX_PENDING_COPIES pending copies of an account (names sort by staging time) and drop the
 * rest, so an account whose entry can never be identified does not grow without bound. One stderr line
 * with the count; never a path or a value.
 */
function capPendingCopies(accountDir) {
  const pendingDir = path.join(accountDir, PENDING_DIR);
  let names;
  try { names = fs.readdirSync(pendingDir).filter((n) => !n.startsWith('.')).sort(); } catch { return; }
  const surplus = names.slice(0, Math.max(0, names.length - MAX_PENDING_COPIES));
  let dropped = 0;
  for (const name of surplus) {
    try { fs.rmSync(path.join(pendingDir, name), { recursive: true, force: true }); dropped += 1; } catch { /* the next cap retries */ }
  }
  if (dropped > 0) process.stderr.write(`fgos: credential-pending-dropped (${dropped})\n`);
}

/**
 * Apply (see applyRenewedCredential, without the future-expiry rule) and remove every leftover that the
 * source proves is not newer or that is unusable itself. A leftover is kept when the source could not
 * answer (unreadable, entry unidentified, busy, SQLite unavailable). Returns `[{dir, status}]`.
 */
function applyLeftovers({ accountDir, layoutName, provider, sourceHome, now, loadSqlite }) {
  const outcomes = [];
  for (const dir of listLeftovers(accountDir)) {
    let keep = false;
    let status;
    try {
      status = applyRenewedCredential({ layoutName, sourceHome, copyHome: dir, provider, requireFuture: false, now, loadSqlite }).status;
      keep = status === 'apply-deferred';
    } catch {
      keep = true;
      status = 'failed';
    }
    outcomes.push({ dir, status });
    if (!keep) {
      try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* retried by the next holder */ }
    }
  }
  return outcomes;
}

// ---------------------------------------------------------------------------------------------------
// Cooldown
// ---------------------------------------------------------------------------------------------------

function inCooldown(accountDir, cooldownMs, now) {
  const parsed = readJsonFile(path.join(accountDir, COOLDOWN_FILE));
  const failedAt = parsed.ok ? Date.parse(parsed.doc?.failedAt ?? '') : NaN;
  return Number.isFinite(failedAt) && now - failedAt < cooldownMs;
}

function recordFailure(accountDir, reason, now) {
  try {
    writeFileAtomic(path.join(accountDir, COOLDOWN_FILE), `${JSON.stringify({ failedAt: new Date(now).toISOString(), reason })}\n`);
  } catch { /* a missing cooldown only means an earlier retry */ }
}

function clearFailure(accountDir) {
  try { fs.rmSync(path.join(accountDir, COOLDOWN_FILE), { force: true }); } catch { /* nothing to clear */ }
}

// ---------------------------------------------------------------------------------------------------
// Refresh-ahead
// ---------------------------------------------------------------------------------------------------

/**
 * Renew the login of `credentialSource` once, in an fgOS-held scratch copy, when it is closer to expiry
 * than `thresholdMs`; apply the renewed entry to the real store. Never throws and never returns a value
 * of a credential: `{status: 'fresh'|'renewed'|'failed'|'cooldown'|'skipped', reason}`.
 */
export async function refreshAhead({
  provider,
  accountId,
  credentialSource,
  runtimeDir,
  probeTimeoutMs = DEFAULT_CREDENTIAL_PROBE_TIMEOUT_MS,
  thresholdMs = defaultRefreshAheadThresholdMs(probeTimeoutMs),
  cooldownMs = DEFAULT_RENEWAL_COOLDOWN_MS,
  lockWaitMs = probeTimeoutMs + LOCK_MARGIN_MS,
  spawnFn,
  env,
  loadSqlite = defaultLoadSqlite,
  now = Date.now,
  confinementTempRoots,
} = {}) {
  try {
    const layoutName = credentialLayout(credentialSource);
    const home = expandCredentialHome(credentialSource?.home);
    const accountDir = providerAccountDir(runtimeDir, provider, accountId);
    if (!layoutName || !home || !accountDir) return { status: 'skipped', reason: 'unsupported-layout' };
    const layout = LAYOUTS[layoutName];

    // Only the dispatched provider's entry counts, both for the window and for "was it renewed".
    const entryOf = (read) => selectProviderEntry(read.entries, provider);
    const inWindow = (entry) => entry.dueMs - now() < thresholdMs;
    // Private homes held after repeated staging failures are looked at again whenever this account is
    // renewed; the confinement module is loaded on demand because it depends on this one.
    const settleHeld = async () => {
      try {
        const { settleHeldCredentialHomes } = await import('./confinement/cleanup.mjs');
        settleHeldCredentialHomes({ tempRoots: confinementTempRoots, provider, accountId, lockHeld: true, loadSqlite, now });
      } catch { /* a held home stays held */ }
    };
    const hasHeldHomes = async () => {
      try {
        const { listKeptCredentialHomes, resolveConfinementTempRoot } = await import('./confinement/cleanup.mjs');
        return (confinementTempRoots ?? [resolveConfinementTempRoot()])
          .some((root) => listKeptCredentialHomes(root).some((h) => h.held && h.provider === provider && h.accountId === accountId));
      } catch { return false; }
    };
    const before = layout.read(home, { loadSqlite });
    if (!before.ok) return { status: 'skipped', reason: before.code };
    const beforeEntry = entryOf(before);
    if (!beforeEntry.ok) {
      // Nothing is renewed here, but a copy kept earlier may be identifiable by now.
      if (hasLeftovers(accountDir) || await hasHeldHomes()) {
        let held;
        try { held = await acquireAccountLock({ runtimeDir, provider, accountId, waitMs: lockWaitMs }); } catch { held = null; }
        if (held) {
          try {
            applyLeftovers({ accountDir, layoutName, provider, sourceHome: home, now: now(), loadSqlite });
            await settleHeld();
          } finally {
            try { held.release(); } catch { /* a release problem must not fail the dispatch */ }
          }
        }
      }
      return { status: 'skipped', reason: beforeEntry.code };
    }
    // A copy renewed in a pane may hold the only good pair even while the source still looks fresh.
    if (!inWindow(beforeEntry.entry) && !hasLeftovers(accountDir) && !(await hasHeldHomes())) return { status: 'fresh', reason: 'outside-window' };

    let lock;
    try {
      lock = await acquireAccountLock({ runtimeDir, provider, accountId, waitMs: lockWaitMs });
    } catch {
      return { status: 'skipped', reason: 'lock-busy' };
    }
    try {
      applyLeftovers({ accountDir, layoutName, provider, sourceHome: home, now: now(), loadSqlite });
      await settleHeld();
      const source = layout.read(home, { loadSqlite });
      if (!source.ok) return { status: 'skipped', reason: source.code };
      const entry = entryOf(source);
      if (!entry.ok) return { status: 'skipped', reason: entry.code };
      if (!inWindow(entry.entry)) return { status: 'fresh', reason: 'outside-window' };
      if (inCooldown(accountDir, cooldownMs, now())) return { status: 'cooldown', reason: 'recent-failure' };
      return await renewInScratch({
        layout, layoutName, provider, credentialSource, home, accountDir, key: entry.entry.key, lock, probeTimeoutMs, spawnFn, env, loadSqlite, now,
      });
    } finally {
      try { lock.release(); } catch { /* a release problem must not fail the dispatch */ }
    }
  } catch {
    return { status: 'failed', reason: 'unexpected-error' };
  }
}

async function renewInScratch({ layout, layoutName, provider, credentialSource, home, accountDir, key, lock, probeTimeoutMs, spawnFn, env, loadSqlite, now }) {
  const scratch = path.join(accountDir, `${SCRATCH_PREFIX}${process.pid}-${now()}`);
  const files = credentialSource.kind === 'codex-home' ? layout.files : credentialSource.files;
  try {
    fs.mkdirSync(scratch, { recursive: true, mode: 0o700 });
    copyCredentialFiles(scratch, home, files, { loadSqlite });
    layout.markDue(scratch, [key], { loadSqlite });
  } catch {
    try { fs.rmSync(scratch, { recursive: true, force: true }); } catch { /* the next holder removes it */ }
    return { status: 'failed', reason: 'scratch-copy-failed' };
  }

  const plan = withKillTimeout(credentialProbeCommand({ ...credentialSource, home: scratch }), probeTimeoutMs, env);
  const probe = plan
    ? await runCredentialProbe(plan, { spawnFn, timeoutMs: probeTimeoutMs, env, onSpawn: (child) => lock.recordChild(child?.pid) })
    : { ok: false, detail: 'no probe exists for this credential layout' };

  // Applied even when the call was judged a failure: a call killed at its time limit may already have
  // redeemed the refresh token, and the scratch copy then holds the only good pair.
  let applied;
  try {
    applied = applyRenewedCredential({ layoutName, sourceHome: home, copyHome: scratch, provider, requireFuture: true, now: now(), loadSqlite });
  } catch {
    // The scratch copy may be the only good pair: it stays for the next holder of the lock.
    return { status: 'failed', reason: 'apply-failed' };
  }
  if (applied.status === 'apply-deferred') {
    // The source could not say whether the copy is newer: it may hold the only good pair, so it moves to
    // the pending copies and the next holder of the account lock decides.
    try {
      const pendingDir = path.join(accountDir, PENDING_DIR);
      fs.mkdirSync(pendingDir, { recursive: true, mode: 0o700 });
      fs.renameSync(scratch, path.join(pendingDir, `${String(now()).padStart(15, '0')}-${crypto.randomBytes(4).toString('hex')}`));
      capPendingCopies(accountDir);
    } catch { /* the copy stays where it is, and is found there */ }
    recordFailure(accountDir, 'apply-deferred', now());
    return { status: 'failed', reason: 'apply-deferred' };
  }
  try { fs.rmSync(scratch, { recursive: true, force: true }); } catch { /* the next holder removes it */ }

  if (applied.status === 'applied') {
    clearFailure(accountDir);
    return { status: 'renewed', reason: 'applied' };
  }
  const reason = !probe.ok ? 'probe-failed' : 'not-renewed';
  recordFailure(accountDir, reason, now());
  return { status: 'failed', reason };
}

/**
 * The renewal function a dispatch is opted in with. Passing it turns on refresh-ahead before a private
 * home is built and write-back when one is removed; without it neither runs.
 */
export function createCredentialRenewal(options = {}) {
  return function renewCredential({ provider, accountId, credentialSource, runtimeDir }) {
    return refreshAhead({ ...options, provider, accountId, credentialSource, runtimeDir });
  };
}

// ---------------------------------------------------------------------------------------------------
// Write-back at private-home removal
// ---------------------------------------------------------------------------------------------------

/** What a private home's ownership marker records so its removal can write a renewed login back. */
export function credentialWriteBackMarker({ provider, accountId, credentialSource, runtimeDir }) {
  const layoutName = credentialLayout(credentialSource);
  const home = expandCredentialHome(credentialSource?.home);
  if (!layoutName || !home || typeof runtimeDir !== 'string' || !path.isAbsolute(runtimeDir)) return null;
  if (!providerAccountDir(runtimeDir, provider, accountId)) return null;
  return { provider, accountId, kind: credentialSource.kind, home, layout: layoutName, runtimeDir };
}

function validWriteBack(value) {
  return isObject(value)
    && typeof value.home === 'string' && path.isAbsolute(value.home)
    && typeof value.runtimeDir === 'string' && path.isAbsolute(value.runtimeDir)
    && Object.hasOwn(LAYOUTS, value.layout);
}

/**
 * Re-check a private home that was held after repeated staging failures. Under the account lock (taken
 * here without waiting, unless the caller already holds it with `lockHeld`): when the source is readable
 * and proves the home's login is not newer, or when the login can now be staged beside the source, the
 * home is settled and the caller may remove it; when neither can be shown it stays held. Never throws.
 * Returns `{status: 'settled'|'held', code?}`; `code` is a fixed word.
 */
export function settleHeldCredentialHome(homeDir, marker, { loadSqlite = defaultLoadSqlite, now = Date.now, tryLock = tryAcquireAccountLock, lockHeld = false } = {}) {
  const writeBack = marker?.credentialWriteBack;
  if (!validWriteBack(writeBack)) return { status: 'held', code: 'invalid-marker' };
  const layout = LAYOUTS[writeBack.layout];
  const accountDir = providerAccountDir(writeBack.runtimeDir, writeBack.provider, writeBack.accountId);
  if (!accountDir) return { status: 'held', code: 'invalid-marker' };
  let lock = null;
  if (!lockHeld) {
    lock = tryLock({ runtimeDir: writeBack.runtimeDir, provider: writeBack.provider, accountId: writeBack.accountId });
    if (!lock) return { status: 'held', code: 'lock-busy' };
  }
  try {
    // The staging step is the write-back's own; the lock is already ours, so it must not try for it again.
    const result = writeBackRenewedCredential(homeDir, marker, { loadSqlite, now, tryLock: () => null });
    if (result.status === 'failed') return { status: 'held', code: result.code };
    if (result.status === 'staged') {
      applyLeftovers({ accountDir, layoutName: writeBack.layout, provider: writeBack.provider, sourceHome: writeBack.home, now: now(), loadSqlite });
    }
    return { status: 'settled' };
  } catch {
    return { status: 'held', code: 'write-back-failed' };
  } finally {
    try { lock?.release(); } catch { /* the copy is already safe */ }
  }
}

/**
 * Called just before a private home is deleted. When its marker asks for it and the home holds a login
 * newer than the source's, stage a copy beside the source and apply it under the account lock (tried
 * once, never waited for; if busy, the next refresh-ahead applies it). Never throws. Returns
 * `{status: 'none'|'unchanged'|'applied'|'staged'|'failed', code?, keepHome?}` (`keepHome`: no copy is safe in the pending copies yet and the home may hold the only good pair, so it must not be removed; `staged`: the copy is kept for the next holder of the account lock, because the lock was busy or the source could not say whether the copy is newer); `code` is a fixed word.
 */
export function writeBackRenewedCredential(homeDir, marker, { loadSqlite = defaultLoadSqlite, now = Date.now, tryLock = tryAcquireAccountLock } = {}) {
  const writeBack = marker?.credentialWriteBack;
  if (writeBack === undefined) return { status: 'none' };
  if (!validWriteBack(writeBack)) return { status: 'failed', code: 'invalid-marker' };
  const layout = LAYOUTS[writeBack.layout];
  const accountDir = providerAccountDir(writeBack.runtimeDir, writeBack.provider, writeBack.accountId);
  if (!accountDir) return { status: 'failed', code: 'invalid-marker' };
  // Until a copy is safe in pending/, the private home may hold the only good pair: a failure before that
  // says `keepHome`, and the caller must not remove it.
  let safe = false;
  try {
    if (copyIsNewer({ layout, provider: writeBack.provider, sourceHome: writeBack.home, copyHome: homeDir, now: now(), loadSqlite }) === 'not-newer') return { status: 'unchanged' };

    const pendingDir = path.join(accountDir, PENDING_DIR);
    const staging = path.join(pendingDir, `.tmp-${process.pid}-${crypto.randomBytes(4).toString('hex')}`);
    fs.mkdirSync(staging, { recursive: true, mode: 0o700 });
    const final = path.join(pendingDir, `${String(now()).padStart(15, '0')}-${path.basename(staging).slice(5)}`);
    try {
      layout.stage(homeDir, staging, { loadSqlite });
      fs.renameSync(staging, final);
    } catch (err) {
      try { fs.rmSync(staging, { recursive: true, force: true }); } catch { /* nothing left to do */ }
      return { status: 'failed', code: err?.message === 'sqlite-unavailable' ? 'sqlite-unavailable' : 'stage-failed', keepHome: true };
    }
    safe = true;
    capPendingCopies(accountDir);

    const lock = tryLock({ runtimeDir: writeBack.runtimeDir, provider: writeBack.provider, accountId: writeBack.accountId });
    if (!lock) return { status: 'staged' };
    let outcomes;
    try {
      outcomes = applyLeftovers({ accountDir, layoutName: writeBack.layout, provider: writeBack.provider, sourceHome: writeBack.home, now: now(), loadSqlite });
    } finally {
      try { lock.release(); } catch { /* the staged copy is already safe */ }
    }
    if (fs.existsSync(final)) return { status: 'staged' };
    return { status: outcomes.find((outcome) => outcome.dir === final)?.status === 'applied' ? 'applied' : 'unchanged' };
  } catch {
    return safe ? { status: 'failed', code: 'write-back-failed' } : { status: 'failed', code: 'write-back-failed', keepHome: true };
  }
}
