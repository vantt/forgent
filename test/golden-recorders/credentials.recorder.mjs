#!/usr/bin/env node
// Records the golden vectors of credential renewal (expiry parsing, layout choice, write-back target choice,
// compare-before-write apply, retained-copy judgement and the staged copy a write-back leaves) from the Node
// module that owns them today. The Rust module `fgos-execution-engine::credentials` replays them
// (packages/execution/engine/tests/credentials.rs). Every login value is synthetic.
// The vectors are written, never hand-edited: rerun this recorder to change one.
//
// Usage: node test/golden-recorders/credentials.recorder.mjs [--out <dir>]
// Output: <out>/{expiry,apply,write-back}.v1.json (default packages/execution/contracts/credentials).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// provider-credential-renewal.mjs writes through the native addon (src/native/door.mjs), which a checkout does
// not ship. The recorder runs the real module and swaps that one import for what it does (a temporary written
// in the directory and renamed over the name) through a resolve hook, for that module only.
{
  const shim = 'import fs from "node:fs"; import path from "node:path"; export function replaceDurably(dir, name, bytes, mode) { const tmp = path.join(dir, `.durable-file-${process.pid}-0.tmp`); fs.writeFileSync(tmp, bytes, { mode }); fs.renameSync(tmp, path.join(dir, name)); }';
  const hooks = `export async function resolve(spec, ctx, next) { if (spec.endsWith("/native/door.mjs") && ctx.parentURL?.endsWith("/provider-credential-renewal.mjs")) return { url: ${JSON.stringify('data:text/javascript,' + encodeURIComponent(shim))}, shortCircuit: true }; return next(spec, ctx); }`;
  const { register } = await import('node:module');
  register(`data:text/javascript,${encodeURIComponent(hooks)}`);
}
const renewal = await import('../../src/runner/dispatch/provider-credential-renewal.mjs');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const argOut = process.argv.indexOf('--out');
const outDir = argOut > 0 ? path.resolve(process.argv[argOut + 1]) : path.join(root, 'packages/execution/contracts/credentials');

const NOW = Date.parse('2026-06-01T12:00:00Z');
const HOUR = 3600 * 1000;

const b64 = (value) => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url');
const jwt = (payload) => `${b64({ alg: 'none' })}.${b64(payload)}.${b64('sig')}`;
const codexToken = (expMs, account) => jwt({ exp: Math.floor(expMs / 1000), 'https://api.openai.com/auth': account ? { chatgpt_account_id: account } : {} });

const piAuth = (entries, indent = 2) => `${JSON.stringify(entries, null, indent || undefined)}\n`;
const piEntry = (expires, refresh, access = 'access') => ({ type: 'oauth', access, refresh, expires });
const codexAuth = (expMs, refresh, account = 'acct-1', lastRefresh = '2026-06-01T11:00:00Z') => `${JSON.stringify({ tokens: { access_token: codexToken(expMs, account), refresh_token: refresh }, last_refresh: lastRefresh }, null, 2)}\n`;
const claudeAuth = (expiresAt, refresh) => `${JSON.stringify({ claudeAiOauth: { accessToken: 'a', refreshToken: refresh, expiresAt } })}`;

const LAYOUT_FILES = {
  'pi-auth-json': 'auth.json',
  'codex-auth-json': 'auth.json',
  'claude-config-credentials-json': '.credentials.json',
  'claude-credentials-json': '.claude/.credentials.json',
};

function lay(dir, files) {
  for (const [rel, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), content);
  }
}
function readTree(dir) {
  const out = {};
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else out[path.relative(dir, full)] = fs.readFileSync(full, 'utf8');
    }
  };
  walk(dir);
  return out;
}
const scratchDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-credential-recorder-'));
const write = (name, about, body) => {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `${name}.v1.json`), `${JSON.stringify({ version: `credentials-${name}.v1`, about, ...body }, null, 1)}\n`);
};

// ---------------------------------------------------------------------------------------------------- expiry
{
  const cases = [];
  const expiry = (id, layout, files) => {
    const dir = scratchDir();
    try {
      lay(dir, files);
      cases.push({ id, layout, files, expected: JSON.parse(JSON.stringify(renewal.readCredentialExpiry(layout, dir, { loadSqlite: () => null }))) });
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  };
  expiry('pi-ms-and-seconds', 'pi-auth-json', { 'auth.json': piAuth({ 'openai-codex': piEntry(NOW + HOUR, 'r1'), xai: piEntry(Math.floor((NOW + 2 * HOUR) / 1000), 'r2'), manual: { type: 'api_key', key: 'k' } }) });
  expiry('pi-no-oauth-entry', 'pi-auth-json', { 'auth.json': piAuth({ manual: { type: 'api_key', key: 'k' } }) });
  expiry('pi-array-shape', 'pi-auth-json', { 'auth.json': '[1,2]' });
  expiry('pi-corrupt-json', 'pi-auth-json', { 'auth.json': '{"openai-codex": {' });
  expiry('pi-missing-file', 'pi-auth-json', {});
  expiry('codex-token-exp-earlier-than-age', 'codex-auth-json', { 'auth.json': codexAuth(NOW + HOUR, 'cr1') });
  expiry('codex-age-earlier-than-token-exp', 'codex-auth-json', { 'auth.json': codexAuth(NOW + 30 * 24 * HOUR, 'cr1', 'acct-1', '2026-05-20T00:00:00Z') });
  expiry('codex-opaque-token-uses-age', 'codex-auth-json', { 'auth.json': `${JSON.stringify({ tokens: { access_token: 'opaque', refresh_token: 'cr1' }, last_refresh: '2026-06-01T11:00:00Z' })}\n` });
  expiry('codex-opaque-token-no-age', 'codex-auth-json', { 'auth.json': `${JSON.stringify({ tokens: { access_token: 'opaque' } })}` });
  expiry('codex-no-tokens', 'codex-auth-json', { 'auth.json': '{}' });
  expiry('claude-config-ms', 'claude-config-credentials-json', { '.credentials.json': claudeAuth(NOW + 3 * HOUR, 'cl1') });
  expiry('claude-config-seconds', 'claude-config-credentials-json', { '.credentials.json': claudeAuth(Math.floor((NOW + 3 * HOUR) / 1000), 'cl1') });
  expiry('claude-home-nested', 'claude-credentials-json', { '.claude/.credentials.json': claudeAuth(NOW + 4 * HOUR, 'cl1') });
  expiry('claude-no-oauth', 'claude-config-credentials-json', { '.credentials.json': '{"other":1}' });
  expiry('omp-without-sqlite', 'omp-agent-db', { 'agent.db': 'not a database' });
  expiry('omp-missing-store', 'omp-agent-db', {});
  expiry('unknown-layout', 'no-such-layout', {});

  const layouts = [];
  const choose = (id, source) => layouts.push({ id, source, expected: renewal.credentialLayout(source) });
  choose('codex-home', { kind: 'codex-home', home: '/h' });
  choose('omp-before-pi', { kind: 'home-files', home: '/h', files: ['auth.json', 'agent.db'] });
  choose('pi', { kind: 'home-files', home: '/h', files: ['auth.json'] });
  choose('claude-config', { kind: 'home-files', home: '/h', files: ['.credentials.json'] });
  choose('claude-home', { kind: 'home-files', home: '/h', files: ['.claude/.credentials.json'] });
  choose('unrelated-files', { kind: 'home-files', home: '/h', files: ['other.json'] });
  choose('unknown-kind', { kind: 'env', home: '/h' });
  choose('no-source', null);

  const lifeCases = [];
  const life = (id, layout, files, timeoutMs) => {
    const dir = scratchDir();
    try {
      lay(dir, files);
      const source = { kind: 'home-files', home: dir, files: [LAYOUT_FILES[layout]] };
      lifeCases.push({ id, layout, files, timeoutMs, now: NOW, expected: renewal.loginLifeProblem(source, { timeoutMs, now: NOW }) });
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  };
  life('claude-life-short', 'claude-config-credentials-json', { '.credentials.json': claudeAuth(NOW + 10 * 60 * 1000, 'cl1') }, 30 * 60 * 1000);
  life('claude-life-enough', 'claude-config-credentials-json', { '.credentials.json': claudeAuth(NOW + 2 * HOUR, 'cl1') }, 30 * 60 * 1000);
  life('claude-already-expired', 'claude-config-credentials-json', { '.credentials.json': claudeAuth(NOW - HOUR, 'cl1') }, 30 * 60 * 1000);
  life('pi-never-judged', 'pi-auth-json', { 'auth.json': piAuth({ 'openai-codex': piEntry(NOW + 1000, 'r1') }) }, 30 * 60 * 1000);

  write('expiry', 'readCredentialExpiry per layout, the layout chosen for a credential source, loginLifeProblem, and the refresh-ahead windows', {
    constants: { defaultRefreshAheadMinThresholdMs: renewal.DEFAULT_REFRESH_AHEAD_MIN_THRESHOLD_MS, codexRefreshIntervalMs: renewal.CODEX_REFRESH_INTERVAL_MS, renewalCooldownMs: renewal.DEFAULT_RENEWAL_COOLDOWN_MS, maxPendingCopies: renewal.MAX_PENDING_COPIES, stagingMinAgeMs: renewal.STAGING_MIN_AGE_MS },
    windows: [0, 1000, 30 * 60 * 1000, 55 * 60 * 1000, 60 * 60 * 1000, 120 * 60 * 1000].map((probeTimeoutMs) => ({ probeTimeoutMs, expected: renewal.defaultRefreshAheadThresholdMs(probeTimeoutMs) })),
    expiry: cases,
    layouts,
    life: lifeCases,
  });
}

// ---------------------------------------------------------------------------------------------------- apply
{
  const cases = [];
  const apply = (id, layout, provider, source, copy, { requireFuture = true } = {}) => {
    const sourceDir = scratchDir();
    const copyDir = scratchDir();
    try {
      lay(sourceDir, source);
      lay(copyDir, copy);
      const result = renewal.applyRenewedCredential({ layoutName: layout, sourceHome: sourceDir, copyHome: copyDir, provider, requireFuture, now: NOW, loadSqlite: () => null });
      cases.push({ id, layout, provider: provider ?? null, requireFuture, now: NOW, source, copy, expected: { result: JSON.parse(JSON.stringify(result)), sourceAfter: readTree(sourceDir) } });
    } finally { fs.rmSync(sourceDir, { recursive: true, force: true }); fs.rmSync(copyDir, { recursive: true, force: true }); }
  };
  const pi = (...entries) => ({ 'auth.json': piAuth(Object.fromEntries(entries)) });
  apply('pi-newer-with-new-refresh-applies', 'pi-auth-json', 'openai-codex', pi(['openai-codex', piEntry(NOW + HOUR, 'old')]), pi(['openai-codex', piEntry(NOW + 5 * HOUR, 'new')]));
  apply('pi-same-refresh-renewed-nothing', 'pi-auth-json', 'openai-codex', pi(['openai-codex', piEntry(NOW + HOUR, 'same')]), pi(['openai-codex', piEntry(NOW + 5 * HOUR, 'same')]));
  apply('pi-not-later-unchanged', 'pi-auth-json', 'openai-codex', pi(['openai-codex', piEntry(NOW + 5 * HOUR, 'old')]), pi(['openai-codex', piEntry(NOW + HOUR, 'new')]));
  apply('pi-expired-renewal-needs-future', 'pi-auth-json', 'openai-codex', pi(['openai-codex', piEntry(NOW - 5 * HOUR, 'old')]), pi(['openai-codex', piEntry(NOW - HOUR, 'new')]));
  apply('pi-expired-copy-applies-without-future', 'pi-auth-json', 'openai-codex', pi(['openai-codex', piEntry(NOW - 5 * HOUR, 'old')]), pi(['openai-codex', piEntry(NOW - HOUR, 'new')]), { requireFuture: false });
  apply('pi-only-the-providers-entry-changes', 'pi-auth-json', 'openai-codex', pi(['openai-codex', piEntry(NOW + HOUR, 'old')], ['xai', piEntry(NOW + HOUR, 'x-old')]), pi(['openai-codex', piEntry(NOW + 5 * HOUR, 'new')], ['xai', piEntry(NOW + 9 * HOUR, 'x-new')]));
  apply('pi-provider-prefix-matches-owner', 'pi-auth-json', 'openai', pi(['openai-codex', piEntry(NOW + HOUR, 'old')]), pi(['openai-codex', piEntry(NOW + 5 * HOUR, 'new')]));
  apply('pi-two-owners-cannot-be-told-apart', 'pi-auth-json', 'openai', pi(['openai-codex', piEntry(NOW + HOUR, 'a')], ['openai-extra', piEntry(NOW + HOUR, 'b')]), pi(['openai-codex', piEntry(NOW + 5 * HOUR, 'a2')]));
  apply('pi-copy-without-refresh-never-replaces', 'pi-auth-json', 'openai-codex', pi(['openai-codex', piEntry(NOW + HOUR, 'old')]), { 'auth.json': piAuth({ 'openai-codex': { type: 'oauth', access: 'a', expires: NOW + 5 * HOUR } }) });
  apply('pi-copy-unreadable-json-is-unusable', 'pi-auth-json', 'openai-codex', pi(['openai-codex', piEntry(NOW + HOUR, 'old')]), { 'auth.json': '{"openai-codex": {' });
  apply('pi-copy-missing-is-unusable', 'pi-auth-json', 'openai-codex', pi(['openai-codex', piEntry(NOW + HOUR, 'old')]), {});
  apply('pi-source-missing-defers', 'pi-auth-json', 'openai-codex', {}, pi(['openai-codex', piEntry(NOW + 5 * HOUR, 'new')]));
  apply('pi-compact-source-stays-compact', 'pi-auth-json', 'openai-codex', { 'auth.json': piAuth({ 'openai-codex': piEntry(NOW + HOUR, 'old') }, 0) }, pi(['openai-codex', piEntry(NOW + 5 * HOUR, 'new')]));
  apply('pi-seconds-expiry-compared-in-ms', 'pi-auth-json', 'openai-codex', pi(['openai-codex', piEntry(Math.floor((NOW + HOUR) / 1000), 'old')]), pi(['openai-codex', piEntry(NOW + 5 * HOUR, 'new')]));
  apply('codex-newer-applies-tokens-and-last-refresh', 'codex-auth-json', 'openai-codex', { 'auth.json': codexAuth(NOW + HOUR, 'old') }, { 'auth.json': codexAuth(NOW + 6 * HOUR, 'new', 'acct-1', '2026-06-01T11:59:00Z') });
  apply('codex-same-refresh-unchanged', 'codex-auth-json', 'openai-codex', { 'auth.json': codexAuth(NOW + HOUR, 'same') }, { 'auth.json': codexAuth(NOW + 6 * HOUR, 'same') });
  apply('codex-copy-no-tokens-unusable', 'codex-auth-json', 'openai-codex', { 'auth.json': codexAuth(NOW + HOUR, 'old') }, { 'auth.json': '{}' });
  apply('claude-newer-applies-entry', 'claude-config-credentials-json', 'anthropic', { '.credentials.json': claudeAuth(NOW + HOUR, 'old') }, { '.credentials.json': claudeAuth(NOW + 6 * HOUR, 'new') });
  apply('claude-home-nested-applies', 'claude-credentials-json', 'anthropic', { '.claude/.credentials.json': claudeAuth(NOW + HOUR, 'old') }, { '.claude/.credentials.json': claudeAuth(NOW + 6 * HOUR, 'new') });
  apply('unknown-layout', 'no-such-layout', 'anthropic', {}, {});

  write('apply', 'applyRenewedCredential: the status and the source store after it, per layout (compare-before-write)', { cases });
}

// ---------------------------------------------------------------------------------------------------- write-back
{
  const targets = [];
  const target = (id, args) => targets.push({ id, args, expected: JSON.parse(JSON.stringify(renewal.credentialWriteBackTarget(args))) });
  const rt = '/var/run/fgos';
  target('codex-home', { provider: 'openai', accountId: 'a1', credentialSource: { kind: 'codex-home', home: '/home/o/.codex' }, runtimeDir: rt });
  target('per-cli-store', { provider: 'openai', accountId: 'a1', credentialSource: { kind: 'home-files', home: '/home/o/.pi', files: ['auth.json'], cli: 'pi' }, runtimeDir: rt });
  target('unsafe-account-id', { provider: 'openai', accountId: '../x', credentialSource: { kind: 'codex-home', home: '/home/o/.codex' }, runtimeDir: rt });
  target('unsafe-cli-key', { provider: 'openai', accountId: 'a1', credentialSource: { kind: 'home-files', home: '/h', files: ['auth.json'], cli: '../pi' }, runtimeDir: rt });
  target('relative-home', { provider: 'openai', accountId: 'a1', credentialSource: { kind: 'codex-home', home: 'relative/home' }, runtimeDir: rt });
  target('relative-runtime-dir', { provider: 'openai', accountId: 'a1', credentialSource: { kind: 'codex-home', home: '/h' }, runtimeDir: 'run' });
  target('unsupported-layout', { provider: 'openai', accountId: 'a1', credentialSource: { kind: 'home-files', home: '/h', files: ['x'] }, runtimeDir: rt });

  const cases = [];
  const writeBack = (id, layout, provider, source, home, { store } = {}) => {
    const sourceDir = scratchDir();
    const homeDir = scratchDir();
    const runtimeDir = scratchDir();
    try {
      lay(sourceDir, source);
      lay(homeDir, home);
      const target = { provider, accountId: 'acct', kind: 'home-files', home: sourceDir, layout, runtimeDir, ...(store ? { store } : {}) };
      const result = renewal.writeBackRenewedCredential(homeDir, target, { loadSqlite: () => null, now: () => NOW });
      const storeDir = store ? path.join(runtimeDir, 'account-locks', provider, 'acct', 'stores', store) : path.join(runtimeDir, 'account-locks', provider, 'acct');
      const pendingDir = path.join(storeDir, 'pending');
      const staged = fs.existsSync(pendingDir) ? fs.readdirSync(pendingDir).sort() : [];
      // The staged copy is named `<15 digits of the staging time>-agent-<8 hex>`; only the shape is recorded.
      const stagedTrees = staged.map((name) => ({ name: name.replace(/^(\d{15})-agent-[0-9a-f]{8}$/, '$1-agent-<hex8>'), files: readTree(path.join(pendingDir, name)) }));
      const retained = renewal.inspectRetainedCredentialCopies({ runtimeDir, now: NOW, minAgeMs: 0 }).map(({ provider: p, accountId, kind, stranded }) => ({ provider: p, accountId, kind, stranded }));
      cases.push({ id, layout, provider, source, home, store: store ?? null, now: NOW, expected: { result: JSON.parse(JSON.stringify(result)), staged: stagedTrees, retained } });
    } finally { for (const dir of [sourceDir, homeDir, runtimeDir]) fs.rmSync(dir, { recursive: true, force: true }); }
  };
  const pi = (...entries) => ({ 'auth.json': piAuth(Object.fromEntries(entries)) });
  writeBack('newer-login-is-staged-not-applied', 'pi-auth-json', 'openai-codex', pi(['openai-codex', piEntry(NOW + HOUR, 'old')]), pi(['openai-codex', piEntry(NOW + 5 * HOUR, 'new')]));
  writeBack('identical-files-are-not-newer', 'pi-auth-json', 'openai-codex', pi(['openai-codex', piEntry(NOW + HOUR, 'same')]), pi(['openai-codex', piEntry(NOW + HOUR, 'same')]));
  writeBack('older-login-is-unchanged', 'pi-auth-json', 'openai-codex', pi(['openai-codex', piEntry(NOW + 5 * HOUR, 'old')]), pi(['openai-codex', piEntry(NOW + HOUR, 'new')]));
  writeBack('same-refresh-later-expiry-is-unchanged', 'pi-auth-json', 'openai-codex', pi(['openai-codex', piEntry(NOW + HOUR, 'same')]), pi(['openai-codex', piEntry(NOW + 5 * HOUR, 'same')]));
  writeBack('malformed-copy-is-unchanged', 'pi-auth-json', 'openai-codex', pi(['openai-codex', piEntry(NOW + HOUR, 'old')]), { 'auth.json': 'truncated {' });
  writeBack('missing-login-file-is-unchanged', 'pi-auth-json', 'openai-codex', pi(['openai-codex', piEntry(NOW + HOUR, 'old')]), {});
  writeBack('source-unreadable-stages-for-the-owner', 'pi-auth-json', 'openai-codex', {}, pi(['openai-codex', piEntry(NOW + 5 * HOUR, 'new')]));
  writeBack('provider-not-in-source-with-unknown-refresh-stages', 'pi-auth-json', 'other', pi(['openai-codex', piEntry(NOW + HOUR, 'old')]), pi(['openai-codex', piEntry(NOW + 5 * HOUR, 'new')]));
  writeBack('provider-not-in-source-with-known-refresh-unchanged', 'pi-auth-json', 'other', pi(['openai-codex', piEntry(NOW + HOUR, 'old')]), pi(['openai-codex', piEntry(NOW + 5 * HOUR, 'old')]));
  writeBack('codex-newer-staged', 'codex-auth-json', 'openai-codex', { 'auth.json': codexAuth(NOW + HOUR, 'old') }, { 'auth.json': codexAuth(NOW + 6 * HOUR, 'new') });
  writeBack('claude-home-nested-staged-with-its-directory', 'claude-credentials-json', 'anthropic', { '.claude/.credentials.json': claudeAuth(NOW + HOUR, 'old') }, { '.claude/.credentials.json': claudeAuth(NOW + 6 * HOUR, 'new') });
  writeBack('per-cli-store-stages-under-its-own-directory', 'pi-auth-json', 'openai-codex', pi(['openai-codex', piEntry(NOW + HOUR, 'old')]), pi(['openai-codex', piEntry(NOW + 5 * HOUR, 'new')]), { store: 'pi' });

  const edge = [];
  const run = (id, args, home) => {
    const homeDir = scratchDir();
    try {
      if (home) lay(homeDir, home);
      edge.push({ id, args, expected: JSON.parse(JSON.stringify(renewal.writeBackRenewedCredential(homeDir, args, { loadSqlite: () => null, now: () => NOW }))) });
    } finally { fs.rmSync(homeDir, { recursive: true, force: true }); }
  };
  run('no-target', undefined);
  run('null-target', null);
  run('relative-home-target', { provider: 'p', accountId: 'a', home: 'rel', runtimeDir: '/rt', layout: 'pi-auth-json' });
  run('unknown-layout-target', { provider: 'p', accountId: 'a', home: '/h', runtimeDir: '/rt', layout: 'nope' });

  write('write-back', 'credentialWriteBackTarget choice, and writeBackRenewedCredential: its status, the copy staged beside the source (same file names, same bytes) and how the retained-copy listing reads it', { targets, cases, edge });
}

console.log(`credentials vectors written to ${outDir}`);
