// Records the golden vectors of the Rust confinement cleanup (packages/execution/engine/src/confinement/cleanup/) by
// running the Node modules it ports: confinement/cleanup.mjs and the fingerprint half of probes/harness.mjs.
// Run: node test/golden-recorders/confinement-cleanup.recorder.mjs
// Writes packages/execution/contracts/confinement-cleanup/{cleanup,fingerprint}.v1.json.
//
// A cleanup vector is `{name, fixture, op, args, out, tree}`: `fixture` is the tree built under a scratch root,
// `op` runs on it, `out` is what the op returned (the scratch root written `<root>`), `tree` is what is left.
// Fixture contents may name `$SELF` (the pid of the process that built it, a live owner) and `$DEAD` (a pid no
// process has), so a vector is the same on every machine.

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const outDir = path.join(root, 'packages', 'execution', 'contracts', 'confinement-cleanup');
fs.mkdirSync(outDir, { recursive: true });

const DEAD_PID = 2000000000;

// The modes a vector holds (a directory a fixture made on the way, a file a marker write created) follow the umask,
// so the recording and the replay both run under the same one.
process.umask(0o022);

// The native door and the process-identity leaf need an installed addon a checkout does not have. The recorder runs
// the real modules and swaps those two leaves for what they do: a durable replace, and a liveness judged from the pid
// alone (`kill(pid, 0)`), which is all a marker's `{pid}` record carries.
{
  const door = [
    'import fs from "node:fs"; import path from "node:path";',
    'const sort = (v) => Array.isArray(v) ? v.map(sort) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sort(v[k])])) : v;',
    'export const canonicalJson = (value) => JSON.stringify(sort(JSON.parse(JSON.stringify(value))));',
    'export function replaceDurably(dir, name, bytes, mode) { fs.mkdirSync(dir, { recursive: true }); const tmp = path.join(dir, `.tmp-${process.pid}-${Math.random()}`); fs.writeFileSync(tmp, bytes, { mode }); fs.renameSync(tmp, path.join(dir, name)); }',
    'export const installOnce = replaceDurably; export const nativeDoor = () => { throw new Error("no addon in the recorder"); };',
    'export const nativeHelperExe = () => null; export const nativeError = (e) => ({ cause: e.message, stderr: [] }); export const loadNativeAddon = () => { throw new Error("no addon in the recorder"); };',
    'export const abiShortfall = () => null; export const combinedAbiMatches = () => true; export const fromDoorJson = (t) => JSON.parse(t);',
  ].join('\n');
  const identity = [
    'const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } };',
    'export const selfRecord = () => ({ host: "recorder", pid: 1, startTime: "1" });',
    'export const judge = (record) => (alive(record.pid) ? "alive" : "dead");',
    'export const resolveHolderLiveness = (record) => (judge(record) === "dead" ? "dead" : "held");',
    'export const observe = () => ({ kind: "absent" }); export const scan = () => []; export const signalByIdentity = () => "not-found";',
  ].join('\n');
  const swap = (url) => JSON.stringify('data:text/javascript,' + encodeURIComponent(url));
  const hooks = `export async function resolve(spec, ctx, next) { const r = await next(spec, ctx); if (r.url.endsWith("/src/native/door.mjs")) return { url: ${swap(door)}, shortCircuit: true }; if (r.url.endsWith("/src/native/process-identity.mjs")) return { url: ${swap(identity)}, shortCircuit: true }; return r; }`;
  (await import('node:module')).register(`data:text/javascript,${encodeURIComponent(hooks)}`);
}
const cleanup = await import('../../src/runner/dispatch/confinement/cleanup.mjs');
const harness = await import('../../src/runner/dispatch/confinement/probes/harness.mjs');

const attempt = (call) => {
  try {
    return { ok: call() };
  } catch (err) {
    return { error: err.message, ...(err.code ? { code: err.code } : {}) };
  }
};

const MARKER = '.fgos-confinement-owner.json';
const marker = (extra) => ({ contract: 'confinement-resource-ownership.v1', creator: 'fgos-confinement', resource: 'private-home', ...extra });
const attemptMarker = (extra) => ({ contract: 'confinement-resource-ownership.v2', creator: 'fgos-confinement', resource: 'private-home', ...extra });
const NOW = 1_700_000_000_000;

const fx = {
  dir: (p, extra = {}) => ({ path: p, kind: 'dir', ...extra }),
  file: (p, content, extra = {}) => ({ path: p, kind: 'file', content, ...extra }),
  json: (p, value, extra = {}) => ({ path: p, kind: 'file', json: value, ...extra }),
  link: (p, target) => ({ path: p, kind: 'symlink', target }),
};

// `$HOME` is the `home` directory beside the file that names it, as the host record of an attempt home does.
function pidTokens(value, home) {
  return JSON.parse(JSON.stringify(value, (key, v) => (v === '$SELF' ? process.pid : v === '$DEAD' ? DEAD_PID : v === '$HOME' ? home : v)));
}

function build(base, entries) {
  for (const entry of entries) {
    const target = path.join(base, entry.path);
    if (entry.kind === 'dir') fs.mkdirSync(target, { recursive: true, mode: entry.mode ?? 0o755 });
    else if (entry.kind === 'age') continue;
    else if (entry.kind === 'hardlink') fs.linkSync(path.join(base, entry.of), target);
    else if (entry.kind === 'symlink') {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.symlinkSync(entry.target.startsWith('/') ? entry.target : entry.target, target);
    } else {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      const text = entry.json !== undefined ? JSON.stringify(pidTokens(entry.json, path.join(base, path.dirname(entry.path), 'home')), null, entry.compact ? 0 : 2) : entry.content;
      fs.writeFileSync(target, text, { mode: entry.mode ?? 0o644 });
    }
    if (entry.mode !== undefined && entry.kind !== 'symlink' && entry.kind !== 'hardlink') fs.chmodSync(target, entry.mode);
  }
  // Ages last: a child written after its parent would move the parent's mtime again.
  for (const entry of entries) {
    if (entry.mtimeAgoMs !== undefined) {
      const when = new Date(NOW - entry.mtimeAgoMs);
      fs.utimesSync(path.join(base, entry.path), when, when);
    }
  }
}

function normalise(text, base) {
  return text
    .replaceAll(base, '<root>')
    .replace(/"createdAt": "[^"]+"/g, '"createdAt": "<iso>"')
    .replace(/"since": "[^"]+"/g, '"since": "<iso>"')
    .replace(new RegExp(`"pid":( ?)${process.pid}\\b`, 'g'), '"pid":$1"$SELF"')
    .replace(new RegExp(`"pid":( ?)${DEAD_PID}\\b`, 'g'), '"pid":$1"$DEAD"');
}

function dump(base, dir = base, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full);
    const stat = fs.lstatSync(full);
    if (entry.isSymbolicLink()) out.push({ path: rel, kind: 'symlink', target: normalise(fs.readlinkSync(full), base) });
    else if (entry.isDirectory()) {
      out.push({ path: rel, kind: 'dir', mode: stat.mode & 0o777 });
      dump(base, full, out);
    } else out.push({ path: rel, kind: 'file', mode: stat.mode & 0o777, content: normalise(fs.readFileSync(full, 'utf8'), base) });
  }
  return out;
}

const abs = (base, rel) => path.join(base, rel);
const OPS = {
  'judge-orphans': (b, a) => cleanup.judgeConfinementOrphans(a.roots.map((r) => abs(b, r)), { now: NOW }),
  'remove-orphans': (b, a) => cleanup.removeConfinementOrphans(cleanup.judgeConfinementOrphans(a.roots.map((r) => abs(b, r)), { now: NOW })),
  'cleanup-resource': (b, a) => cleanup.cleanupConfinementResource(abs(b, a.dir), a.dispatchId),
  'remove-dir': (b, a) => { cleanup.removeConfinementDir(abs(b, a.dir)); return true; },
  'list-kept': (b, a) => cleanup.listKeptCredentialHomes(abs(b, a.root)),
  'settle-held': (b, a) => cleanup.settleHeldCredentialHomes({ tempRoots: a.roots.map((r) => abs(b, r)), unretriedRoots: (a.unretried ?? []).map((r) => abs(b, r)) }),
  'write-marker': (b, a) => cleanup.writeOwnershipMarker(abs(b, a.dir), a.fields),
  'write-marker-v2': (b, a) => cleanup.writeOwnershipMarkerV2(abs(b, a.dir), { ...a.fields, runDir: a.fields.runDir }),
  'read-marker': (b, a) => cleanup.readOwnershipMarker(abs(b, a.dir)),
  'read-attempt-marker': (b, a) => cleanup.readAttemptOwnershipMarker(abs(b, a.dir)),
  'write-record': (b, a) => cleanup.writeAttemptHomeRecord(abs(b, a.home), a.fields),
  'read-record': (b, a) => cleanup.readAttemptHomeRecord(abs(b, a.home), a.match),
  'count-keep': (b, a) => cleanup.countCredentialKeep(abs(b, a.home), a.fields, () => a.at),
  'remove-attempt-home': (b, a) => { cleanup.removeAttemptHome(abs(b, a.home), a.dispatchId); return true; },
  'describe-home': (b, a) => cleanup.describeAttemptHome(abs(b, a.home)),
  'keep-transcript': (b, a) => cleanup.keepSessionTranscript({ homeDir: abs(b, a.home), sessionDir: a.sessionDir, destDir: abs(b, a.dest) }),
  'ensure-private-dir': (b, a) => cleanup.ensurePrivateDir(abs(b, a.dir), { root: abs(b, a.root) }),
  'remove-empty-parent': (b, a) => { cleanup.removeEmptyDispatchParent(abs(b, a.removed), a.dispatchId); return true; },
  'temp-root': (b, a) => cleanup.resolveConfinementTempRoot(abs(b, a.base)),
  'canonical-root': (b, a) => cleanup.canonicalRoot(abs(b, a.root)),
};

const cases = [];
function record(name, fixture, op, args = {}) {
  const base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cc-cleanup-')));
  try {
    build(base, fixture);
    const result = attempt(() => OPS[op](base, args));
    const out = JSON.parse(normalise(JSON.stringify(result), base));
    cases.push({ name, fixture, op, args, out, tree: dump(base).map((e) => ({ ...e })) });
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
}

// ---- markers ---------------------------------------------------------------------------------------------------
record('write-marker-defaults', [fx.dir('home')], 'write-marker', { dir: 'home', fields: { dispatchId: 'd1', pid: '$SELF' } });
record('write-marker-resource', [fx.dir('home')], 'write-marker', { dir: 'home', fields: { dispatchId: 'd1', resource: 'scratch', pid: '$DEAD' } });
record('write-marker-no-dispatch', [fx.dir('home')], 'write-marker', { dir: 'home', fields: {} });
record('write-marker-v2', [fx.dir('home')], 'write-marker-v2', { dir: 'home', fields: { attemptId: 'a1', runDir: '/run/a1', dispatchId: 'd1' } });
record('write-marker-v2-no-dispatch', [fx.dir('home')], 'write-marker-v2', { dir: 'home', fields: { attemptId: 'a1', runDir: '/run/a1' } });
record('write-marker-v2-no-attempt', [fx.dir('home')], 'write-marker-v2', { dir: 'home', fields: { runDir: '/run/a1' } });
record('write-marker-v2-no-run-dir', [fx.dir('home')], 'write-marker-v2', { dir: 'home', fields: { attemptId: 'a1', runDir: '' } });
record('read-marker-valid', [fx.json(`home/${MARKER}`, marker({ dispatchId: 'd1', pid: '$SELF' }))], 'read-marker', { dir: 'home' });
record('read-marker-absent', [fx.dir('home')], 'read-marker', { dir: 'home' });
record('read-marker-other-creator', [fx.json(`home/${MARKER}`, { ...marker({ dispatchId: 'd1' }), creator: 'someone' })], 'read-marker', { dir: 'home' });
record('read-marker-v2-is-not-v1', [fx.json(`home/${MARKER}`, attemptMarker({ attemptId: 'a', runDir: '/r' }))], 'read-marker', { dir: 'home' });
record('read-marker-malformed', [fx.file(`home/${MARKER}`, '{nope')], 'read-marker', { dir: 'home' });
record('read-marker-symlink', [fx.file('elsewhere.json', JSON.stringify(marker({ dispatchId: 'd1' }))), fx.dir('home'), fx.link(`home/${MARKER}`, '../elsewhere.json')], 'read-marker', { dir: 'home' });
record('read-marker-oversized', [fx.file(`home/${MARKER}`, ' '.repeat(65 * 1024 + 1))], 'read-marker', { dir: 'home' });
record('read-attempt-marker-valid', [fx.json(`home/${MARKER}`, attemptMarker({ attemptId: 'a1', runDir: '/r' }))], 'read-attempt-marker', { dir: 'home' });
record('read-attempt-marker-v1', [fx.json(`home/${MARKER}`, marker({ dispatchId: 'd1' }))], 'read-attempt-marker', { dir: 'home' });
record('read-attempt-marker-absent', [fx.dir('home')], 'read-attempt-marker', { dir: 'home' });

// ---- private directories and parents ---------------------------------------------------------------------------
record('ensure-private-dir-nested', [fx.dir('r', { mode: 0o755 })], 'ensure-private-dir', { dir: 'r/a/b', root: 'r' });
record('ensure-private-dir-is-root', [fx.dir('r', { mode: 0o755 })], 'ensure-private-dir', { dir: 'r', root: 'r' });
record('ensure-private-dir-tightens-existing', [fx.dir('r', { mode: 0o755 }), fx.dir('r/a', { mode: 0o777 })], 'ensure-private-dir', { dir: 'r/a/b', root: 'r' });
record('ensure-private-dir-outside-root', [fx.dir('r'), fx.dir('o')], 'ensure-private-dir', { dir: 'o/x', root: 'r' });
record('remove-empty-parent-removes-shell', [fx.dir('t/d1/home-gone')], 'remove-empty-parent', { removed: 't/d1/home', dispatchId: 'd1' });
record('remove-empty-parent-keeps-sibling', [fx.dir('t/d1/other')], 'remove-empty-parent', { removed: 't/d1/home', dispatchId: 'd1' });
record('remove-empty-parent-other-name', [fx.dir('t/x')], 'remove-empty-parent', { removed: 't/x/home', dispatchId: 'd1' });
record('temp-root-absent-base-is-shared', [fx.dir('tmp')], 'temp-root', { base: 'tmp' });
record('temp-root-existing-own', [fx.dir('tmp/fgos-confinement')], 'temp-root', { base: 'tmp' });
record('canonical-root-existing', [fx.dir('real'), fx.link('alias', 'real')], 'canonical-root', { root: 'alias' });
record('canonical-root-absent', [fx.dir('x')], 'canonical-root', { root: 'x/missing/../gone' });

// ---- host record of an attempt home -----------------------------------------------------------------------------
const recFields = { attemptId: 'a1', runDir: '/run/a1', dispatchId: 'd1', launchCommandId: 'launch-1' };
record('write-record', [fx.dir('t/d1/home')], 'write-record', { home: 't/d1/home', fields: recFields });
record('write-record-kept', [fx.dir('t/d1/home')], 'write-record', { home: 't/d1/home', fields: { ...recFields, credentialKept: { attempts: 2, since: 'S', lastCountedAt: 5 } } });
const goodRecord = (extra = {}) => ({ contract: 'confinement-attempt-home-record.v2', attemptId: 'a1', runDir: '/run/a1', dispatchId: 'd1', launchCommandId: 'launch-1', home: '<root>/t/d1/home', ...extra });
record('read-record-valid', [fx.json('t/d1/attempt-home.json', goodRecord({ home: '$HOME' }), { mode: 0o600 }), fx.dir('t/d1/home')], 'read-record', { home: 't/d1/home' });
record('read-record-absent', [fx.dir('t/d1/home')], 'read-record', { home: 't/d1/home' });
record('read-record-wrong-home', [fx.json('t/d1/attempt-home.json', goodRecord({ home: '/elsewhere' }), { mode: 0o600 }), fx.dir('t/d1/home')], 'read-record', { home: 't/d1/home' });
record('read-record-wrong-dispatch-dir', [fx.json('t/d1/attempt-home.json', goodRecord({ home: '$HOME', dispatchId: 'other' }), { mode: 0o600 }), fx.dir('t/d1/home')], 'read-record', { home: 't/d1/home' });
record('read-record-relative-run-dir', [fx.json('t/d1/attempt-home.json', goodRecord({ home: '$HOME', runDir: 'rel' }), { mode: 0o600 }), fx.dir('t/d1/home')], 'read-record', { home: 't/d1/home' });
record('read-record-bad-launch-id', [fx.json('t/d1/attempt-home.json', goodRecord({ home: '$HOME', launchCommandId: '../x' }), { mode: 0o600 }), fx.dir('t/d1/home')], 'read-record', { home: 't/d1/home' });
record('read-record-other-attempt', [fx.json('t/d1/attempt-home.json', goodRecord({ home: '$HOME' }), { mode: 0o600 }), fx.dir('t/d1/home')], 'read-record', { home: 't/d1/home', match: { attemptId: 'a2' } });
record('read-record-other-run-dir', [fx.json('t/d1/attempt-home.json', goodRecord({ home: '$HOME' }), { mode: 0o600 }), fx.dir('t/d1/home')], 'read-record', { home: 't/d1/home', match: { runDir: '/run/other' } });
record('read-record-same-attempt', [fx.json('t/d1/attempt-home.json', goodRecord({ home: '$HOME' }), { mode: 0o600 }), fx.dir('t/d1/home')], 'read-record', { home: 't/d1/home', match: { attemptId: 'a1', runDir: '/run/a1' } });
record('read-record-symlink', [fx.json('real.json', goodRecord({ home: '$HOME' }), { mode: 0o600 }), fx.dir('t/d1/home'), fx.link('t/d1/attempt-home.json', '../../real.json')], 'read-record', { home: 't/d1/home' });
record('read-record-hard-linked', [fx.json('t/d1/attempt-home.json', goodRecord({ home: '$HOME' }), { mode: 0o600 }), fx.dir('t/d1/home'), { path: 't/d1/second', kind: 'hardlink', of: 't/d1/attempt-home.json' }], 'read-record', { home: 't/d1/home' });

// ---- credential keep counting ---------------------------------------------------------------------------------
const keepFields = { ...recFields };
record('count-keep-first', [fx.dir('t/d1/home')], 'count-keep', { home: 't/d1/home', fields: keepFields, at: NOW });
record('count-keep-spaced', [fx.dir('t/d1/home'), fx.json('t/d1/attempt-home.json', goodRecord({ home: '$HOME', credentialKept: { attempts: 2, since: '2026-01-01T00:00:00.000Z', lastCountedAt: NOW - 16 * 60 * 1000 } }), { mode: 0o600 })], 'count-keep', { home: 't/d1/home', fields: keepFields, at: NOW });
record('count-keep-too-close', [fx.dir('t/d1/home'), fx.json('t/d1/attempt-home.json', goodRecord({ home: '$HOME', credentialKept: { attempts: 2, since: '2026-01-01T00:00:00.000Z', lastCountedAt: NOW - 60 * 1000 } }), { mode: 0o600 })], 'count-keep', { home: 't/d1/home', fields: keepFields, at: NOW });
record('count-keep-other-attempts-record-is-ignored', [fx.dir('t/d1/home'), fx.json('t/d1/attempt-home.json', goodRecord({ home: '$HOME', attemptId: 'a9', credentialKept: { attempts: 4, since: 'S', lastCountedAt: 1 } }), { mode: 0o600 })], 'count-keep', { home: 't/d1/home', fields: keepFields, at: NOW });

// ---- removal ---------------------------------------------------------------------------------------------------
record('remove-attempt-home-whole', [fx.json('t/d1/attempt-home.json', goodRecord({ home: '$HOME' }), { mode: 0o600 }), fx.file('t/d1/home/auth.json', 'x'), fx.dir('t/d2')], 'remove-attempt-home', { home: 't/d1/home', dispatchId: 'd1' });
record('remove-attempt-home-keeps-sibling', [fx.file('t/d1/home/auth.json', 'x'), fx.file('t/d1/scratch/f', 'y')], 'remove-attempt-home', { home: 't/d1/home', dispatchId: 'd1' });
record('remove-dir-owned', [fx.json(`t/d1/home/${MARKER}`, marker({ dispatchId: 'd1', pid: '$DEAD' })), fx.file('t/d1/home/auth.json', 'x')], 'remove-dir', { dir: 't/d1/home' });
record('remove-dir-attempt-home-refused', [fx.json(`t/d1/home/${MARKER}`, attemptMarker({ attemptId: 'a', runDir: '/r' })), fx.file('t/d1/home/auth.json', 'x')], 'remove-dir', { dir: 't/d1/home' });
record('remove-dir-unreadable-marker-refused', [fx.file(`t/d1/home/${MARKER}`, '{half'), fx.file('t/d1/home/auth.json', 'x')], 'remove-dir', { dir: 't/d1/home' });
record('remove-dir-marker-of-other-contract-removed', [fx.json(`t/d1/home/${MARKER}`, { contract: 'something-else.v1' }), fx.file('t/d1/home/auth.json', 'x')], 'remove-dir', { dir: 't/d1/home' });
record('remove-dir-marker-is-link-refused', [fx.file('elsewhere', 'x'), fx.file('t/d1/home/auth.json', 'x'), fx.link(`t/d1/home/${MARKER}`, '../../../elsewhere')], 'remove-dir', { dir: 't/d1/home' });
record('remove-dir-no-marker-removed', [fx.file('t/d1/home/auth.json', 'x')], 'remove-dir', { dir: 't/d1/home' });
record('cleanup-resource-absent', [fx.dir('t')], 'cleanup-resource', { dir: 't/d1/home', dispatchId: 'd1' });
record('cleanup-resource-no-marker', [fx.file('t/d1/home/auth.json', 'x')], 'cleanup-resource', { dir: 't/d1/home', dispatchId: 'd1' });
record('cleanup-resource-other-dispatch', [fx.json(`t/d1/home/${MARKER}`, marker({ dispatchId: 'd1', pid: '$DEAD' }))], 'cleanup-resource', { dir: 't/d1/home', dispatchId: 'd2' });
record('cleanup-resource-removes-and-tidies-parent', [fx.json(`t/d1/home/${MARKER}`, marker({ dispatchId: 'd1', pid: '$DEAD' })), fx.file('t/d1/home/auth.json', 'x')], 'cleanup-resource', { dir: 't/d1/home', dispatchId: 'd1' });
record('cleanup-resource-keeps-parent-with-sibling', [fx.json(`t/d1/home/${MARKER}`, marker({ dispatchId: 'd1', pid: '$DEAD' })), fx.dir('t/d1/run')], 'cleanup-resource', { dir: 't/d1/home', dispatchId: 'd1' });
record('cleanup-resource-no-dispatch-given', [fx.json(`t/d1/home/${MARKER}`, marker({ dispatchId: 'd1', pid: '$DEAD' }))], 'cleanup-resource', { dir: 't/d1/home' });
record('cleanup-resource-attempt-home-not-removed', [fx.json(`t/d1/home/${MARKER}`, attemptMarker({ attemptId: 'a', runDir: '/r' }))], 'cleanup-resource', { dir: 't/d1/home', dispatchId: 'd1' });

// ---- orphans: the judgement, with a live owner -----------------------------------------------------------------
const owned = (id, extra = {}) => fx.json(`t/${id}/home/${MARKER}`, marker({ dispatchId: id, ...extra }));
record('judge-dead-owner', [fx.dir('t', { mode: 0o700 }), owned('d1', { pid: '$DEAD' })], 'judge-orphans', { roots: ['t'] });
record('judge-live-owner-is-kept', [fx.dir('t', { mode: 0o700 }), owned('d1', { pid: '$SELF' })], 'judge-orphans', { roots: ['t'] });
record('judge-live-and-dead-together', [fx.dir('t', { mode: 0o700 }), owned('live', { pid: '$SELF' }), owned('dead', { pid: '$DEAD' })], 'judge-orphans', { roots: ['t'] });
record('judge-marker-without-pid-is-dead', [fx.dir('t', { mode: 0o700 }), owned('d1', {})], 'judge-orphans', { roots: ['t'] });
record('judge-pid-zero-is-dead', [fx.dir('t', { mode: 0o700 }), owned('d1', { pid: 0 })], 'judge-orphans', { roots: ['t'] });
record('judge-held-credential-home-is-not-an-orphan', [fx.dir('t', { mode: 0o700 }), owned('d1', { pid: '$DEAD', credentialKept: { attempts: 5 } })], 'judge-orphans', { roots: ['t'] });
record('judge-kept-below-limit-is-an-orphan', [fx.dir('t', { mode: 0o700 }), owned('d1', { pid: '$DEAD', credentialKept: { attempts: 4 } })], 'judge-orphans', { roots: ['t'] });
record('judge-attempt-home-is-adopts', [fx.dir('t', { mode: 0o700 }), fx.json(`t/d1/home/${MARKER}`, attemptMarker({ attemptId: 'a', runDir: '/r' }))], 'judge-orphans', { roots: ['t'] });
record('judge-marker-in-dispatch-dir-itself', [fx.dir('t', { mode: 0o700 }), fx.json(`t/d1/${MARKER}`, marker({ dispatchId: 'd1', pid: '$DEAD' }))], 'judge-orphans', { roots: ['t'] });
record('judge-empty-shell-old', [fx.dir('t', { mode: 0o700 }), fx.dir('t/d1', { mtimeAgoMs: 700000 })], 'judge-orphans', { roots: ['t'] });
record('judge-empty-shell-young', [fx.dir('t', { mode: 0o700 }), fx.dir('t/d1', { mtimeAgoMs: 1000 })], 'judge-orphans', { roots: ['t'] });
record('judge-dir-with-file-is-not-a-shell', [fx.dir('t', { mode: 0o700 }), fx.file('t/d1/x', 'x'), { path: 't/d1', kind: 'age', mtimeAgoMs: 700000 }], 'judge-orphans', { roots: ['t'] });
record('judge-loose-root', [fx.dir('t', { mode: 0o755 })], 'judge-orphans', { roots: ['t'] });
record('judge-group-readable-root-is-loose', [fx.dir('t', { mode: 0o740 })], 'judge-orphans', { roots: ['t'] });
record('judge-absent-root', [fx.dir('x')], 'judge-orphans', { roots: ['t'] });
record('judge-file-in-root-is-skipped', [fx.dir('t', { mode: 0o700 }), fx.file('t/stray', 'x')], 'judge-orphans', { roots: ['t'] });
record('judge-two-roots', [fx.dir('a', { mode: 0o700 }), fx.dir('b', { mode: 0o755 }), fx.json(`a/d1/home/${MARKER}`, marker({ dispatchId: 'd1', pid: '$DEAD' })), fx.json(`b/d2/home/${MARKER}`, marker({ dispatchId: 'd2', pid: '$DEAD' }))], 'judge-orphans', { roots: ['a', 'b'] });

// ---- orphans: removal, never a live home -----------------------------------------------------------------------
record('remove-orphans-dead-owner-gone-live-owner-stays', [fx.dir('t', { mode: 0o700 }), owned('live', { pid: '$SELF' }), owned('dead', { pid: '$DEAD' }), fx.file('t/dead/home/auth.json', 'x'), fx.file('t/live/home/auth.json', 'y')], 'remove-orphans', { roots: ['t'] });
record('remove-orphans-tightens-and-sweeps-shell', [fx.dir('t', { mode: 0o755 }), fx.dir('t/shell', { mtimeAgoMs: 700000 }), owned('dead', { pid: '$DEAD' })], 'remove-orphans', { roots: ['t'] });
record('remove-orphans-keeps-held-home', [fx.dir('t', { mode: 0o700 }), owned('held', { pid: '$DEAD', credentialKept: { attempts: 5 } }), fx.file('t/held/home/auth.json', 'x')], 'remove-orphans', { roots: ['t'] });
record('remove-orphans-keeps-attempt-home', [fx.dir('t', { mode: 0o700 }), fx.json(`t/a1/home/${MARKER}`, attemptMarker({ attemptId: 'a', runDir: '/r' })), fx.file('t/a1/home/auth.json', 'x')], 'remove-orphans', { roots: ['t'] });
record('remove-orphans-nothing-to-do', [fx.dir('t', { mode: 0o700 })], 'remove-orphans', { roots: ['t'] });

// ---- kept credential homes -------------------------------------------------------------------------------------
const keptRecord = (id, kept) => fx.json(`t/${id}/attempt-home.json`, { ...goodRecord({ home: '$HOME', dispatchId: id }), ...(kept ? { credentialKept: kept } : {}) }, { mode: 0o600 });
record('list-kept-below-and-at-limit', [fx.dir('t/d1/home'), keptRecord('d1', { attempts: 2, since: '2026-01-01T00:00:00.000Z', lastCountedAt: 1 }), fx.dir('t/d2/home'), keptRecord('d2', { attempts: 5, since: '2026-01-02T00:00:00.000Z', lastCountedAt: 1 })], 'list-kept', { root: 't' });
record('list-kept-skips-unkept', [fx.dir('t/d1/home'), keptRecord('d1', null)], 'list-kept', { root: 't' });
record('list-kept-old-marker-count', [fx.json(`t/d1/home/${MARKER}`, marker({ dispatchId: 'd1', credentialKept: { attempts: 3, since: '2026-01-03T00:00:00.000Z' } }))], 'list-kept', { root: 't' });
record('list-kept-absent-root', [fx.dir('x')], 'list-kept', { root: 't' });
record('list-kept-zero-attempts-skipped', [fx.dir('t/d1/home'), keptRecord('d1', { attempts: 0 })], 'list-kept', { root: 't' });
record('settle-held-no-record-stays', [fx.json(`t/d1/home/${MARKER}`, marker({ dispatchId: 'd1', credentialKept: { attempts: 5 } })), fx.file('t/d1/home/auth.json', 'x')], 'settle-held', { roots: ['t'] });
record('settle-held-no-descriptor-stays', [fx.dir('t/d1/home'), keptRecord('d1', { attempts: 5, since: 'S', lastCountedAt: 1 }), fx.file('t/d1/home/auth.json', 'x')], 'settle-held', { roots: ['t'] });
record('settle-held-below-limit-not-retried', [fx.dir('t/d1/home'), keptRecord('d1', { attempts: 2, since: 'S', lastCountedAt: 1 }), fx.file('t/d1/home/auth.json', 'x')], 'settle-held', { roots: ['t'] });
record('settle-held-nothing-kept', [fx.dir('t')], 'settle-held', { roots: ['t'] });

// ---- session transcript and home layout ------------------------------------------------------------------------
record('keep-transcript-copies', [fx.file('h/sess/a.jsonl', 'one'), fx.file('h/sess/sub/b.jsonl', 'three'), fx.dir('dest', { mode: 0o755 })], 'keep-transcript', { home: 'h', sessionDir: 'sess', dest: 'dest/out' });
record('keep-transcript-absent', [fx.dir('h'), fx.dir('dest')], 'keep-transcript', { home: 'h', sessionDir: 'sess', dest: 'dest/out' });
record('keep-transcript-absolute-refused', [fx.dir('h'), fx.dir('dest')], 'keep-transcript', { home: 'h', sessionDir: '/sess', dest: 'dest/out' });
record('keep-transcript-parent-refused', [fx.dir('h'), fx.dir('dest')], 'keep-transcript', { home: 'h', sessionDir: 'a/../b', dest: 'dest/out' });
record('keep-transcript-empty-refused', [fx.dir('h'), fx.dir('dest')], 'keep-transcript', { home: 'h', sessionDir: '', dest: 'dest/out' });
record('keep-transcript-link-dir-refused', [fx.file('secret/x', 'S'), fx.dir('h'), fx.link('h/sess', '../secret'), fx.dir('dest')], 'keep-transcript', { home: 'h', sessionDir: 'sess', dest: 'dest/out' });
record('keep-transcript-link-entry-rolled-back', [fx.file('secret', 'S'), fx.file('h/sess/a.jsonl', 'one'), fx.link('h/sess/z.jsonl', '../../secret'), fx.dir('dest')], 'keep-transcript', { home: 'h', sessionDir: 'sess', dest: 'dest/out' });
record('keep-transcript-file-not-dir', [fx.file('h/sess', 'x'), fx.dir('dest')], 'keep-transcript', { home: 'h', sessionDir: 'sess', dest: 'dest/out' });
record('keep-transcript-never-overwrites', [fx.file('h/sess/a.jsonl', 'new'), fx.file('dest/out/a.jsonl', 'old'), fx.dir('dest', { mode: 0o755 })], 'keep-transcript', { home: 'h', sessionDir: 'sess', dest: 'dest/out' });
record('describe-home-layout', [fx.json(`h/${MARKER}`, marker({ dispatchId: 'd' })), fx.file('h/.codex/auth.json', '1234'), fx.file('h/.codex/sessions/2026/s.jsonl', '12'), fx.file('h/.zshrc', 'z'), fx.link('h/link', 'x')], 'describe-home', { home: 'h' });
record('describe-home-empty', [fx.dir('h')], 'describe-home', { home: 'h' });
record('describe-home-absent', [fx.dir('x')], 'describe-home', { home: 'h' });
record('describe-home-limit', [...Array.from({ length: 70 }, (_, i) => fx.file(`h/f${String(i).padStart(2, '0')}`, 'x'))], 'describe-home', { home: 'h' });

fs.writeFileSync(path.join(outDir, 'cleanup.v1.json'), `${JSON.stringify({ contract: 'confinement-cleanup-vectors.v1', now: NOW, deadPid: DEAD_PID, cases }, null, 2)}\n`);

// ---- probe fingerprint -----------------------------------------------------------------------------------------
const sha = (text) => crypto.createHash('sha256').update(text).digest('hex');
const fingerprints = [
  ['default', {}],
  ['blind', { blind: true }],
  ['policy-and-config', { policy: 'workspace-write', backendConfig: { tempRoot: '/srv/t' }, driverVersion: 'local-bwrap-v9' }],
].map(([name, input]) => {
  const fp = harness.computeProbeFingerprint({ ...input, bwrapExecutable: '/nonexistent/bwrap' });
  const { platformDigest, ...rest } = fp;
  return { name, input, out: rest, platformDigestIsHex: /^[0-9a-f]{64}$/.test(platformDigest) };
});
const platformPayload = 'linux:6.1.0:x64:bubblewrap 0.8.0';
fs.writeFileSync(path.join(outDir, 'fingerprint.v1.json'), `${JSON.stringify({
  contract: 'confinement-probe-fingerprint-vectors.v1',
  proofProfile: harness.PROOF_PROFILE,
  platform: { payload: platformPayload, digest: sha(platformPayload) },
  fingerprints,
  falsifiers: harness.MACHINE_PRIVATE_FALSIFIERS,
}, null, 2)}\n`);
console.log(`recorded ${cases.length} cleanup vectors and ${fingerprints.length} fingerprints`);
