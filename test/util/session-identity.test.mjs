// session-identity.test.mjs -- the Node facade over the Rust identity crate.
// The rule has one owning proof, packages/identity/rust/tests/golden.rs; these
// cases prove the door wiring (env, process tree, registry path, the doctor
// probe's failure codes) against the addon and host built from this checkout
// (FGOS_HOST_BIN, set by `npm test`). Probe failure modes use small stand-in
// executables (unix only).
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { IDENTITY_ENV_KEYS } from '../helpers/identity-env.mjs';
import { probeIdentity, resolveWriterIdentity } from '../../src/util/session-identity.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const FACADE_URL = new URL('../../src/util/session-identity.mjs', import.meta.url).href;
const CONTRACTS = path.join(REPO_ROOT, 'packages', 'identity', 'contracts');
const HOST = process.env.FGOS_HOST_BIN;
const UNIX = process.platform !== 'win32';

function requireHost(t) {
  if (!HOST || !fs.existsSync(HOST)) {
    assert.fail('set FGOS_HOST_BIN to a host built from this checkout (npm test does this)');
  }
  return HOST;
}

function tmp(prefix) {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
}

/** Env with the session id variables removed, then `extra` applied. */
function cleanEnv(extra = {}) {
  const env = { ...process.env };
  for (const key of IDENTITY_ENV_KEYS) delete env[key];
  for (const [key, value] of Object.entries(extra)) {
    if (value === undefined) delete env[key];
    else env[key] = value;
  }
  return env;
}

/** Runs `body` (an async function body with `facade` in scope) in a fresh
 * Node process and returns what it prints as JSON. */
function inFreshProcess(body, { env = cleanEnv(), cwd = REPO_ROOT, viaShell = 0 } = {}) {
  const script = `const facade = await import(${JSON.stringify(FACADE_URL)});
const out = await (async () => { ${body} })();
process.stdout.write(JSON.stringify(out));`;
  let command = process.execPath;
  let args = ['--input-type=module', '-e', script];
  for (let i = 0; i < viaShell; i++) {
    args = ['-c', `exec_me() { "$@"; }; exec_me ${[command, ...args].map(shellQuote).join(' ')}; :`];
    command = '/bin/sh';
  }
  const res = spawnSync(command, args, { env, cwd, encoding: 'utf8' });
  assert.equal(res.status, 0, `fresh process failed: ${res.stderr}`);
  return JSON.parse(res.stdout);
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

/** A stand-in host: a sh script that logs each call then runs `tail`. */
function standIn(dir, name, tail) {
  const file = path.join(dir, name);
  fs.writeFileSync(file, `#!/bin/sh\necho "$$ $*" >> "${file}.calls"\n${tail}\n`, { mode: 0o755 });
  return file;
}

function calls(file) {
  try {
    return fs.readFileSync(`${file}.calls`, 'utf8').trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

test('the dispatch writerId format floor uses the contract id charset and length', async () => {
  const contract = JSON.parse(fs.readFileSync(path.join(CONTRACTS, 'identity.writer.v1.json'), 'utf8'));
  const { WRITER_ID_RE, MAX_WRITER_ID_LENGTH } = await import('../../src/runner/dispatch/execution-contract.mjs');
  assert.equal(WRITER_ID_RE.source, contract['x-idPattern']);
  assert.equal(MAX_WRITER_ID_LENGTH, contract['x-maxIdLength']);
});

test('every shared env vector resolves the same through the door', (t) => {
  requireHost(t);
  const golden = JSON.parse(fs.readFileSync(path.join(CONTRACTS, 'identity.writer.golden.v1.json'), 'utf8'));
  const root = tmp('fgos-identity-env-');
  const saved = Object.fromEntries(IDENTITY_ENV_KEYS.map((key) => [key, process.env[key]]));
  try {
    golden.envCases.forEach((c, i) => {
      let dir;
      if (c.registry.kind !== 'none') {
        dir = path.join(root, `case-${i}`);
        fs.mkdirSync(dir);
        if (c.registry.kind === 'rows') fs.writeFileSync(path.join(dir, 'sessions.json'), JSON.stringify(c.registry.rows));
        if (c.registry.kind === 'raw') fs.writeFileSync(path.join(dir, 'sessions.json'), c.registry.raw);
      }
      for (const key of IDENTITY_ENV_KEYS) delete process.env[key];
      Object.assign(process.env, c.env);
      const answer = resolveWriterIdentity(dir);
      assert.deepEqual(resolveWriterIdentity(dir), answer, `${c.name}: asked twice, answered the same`);
      if (c.expected === null) assert.ok(['pid', 'unresolved'].includes(answer.source), `${c.name}: ${JSON.stringify(answer)}`);
      else assert.deepEqual(answer, c.expected, c.name);
    });
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('no fgos dir means no registry confirmation, never the cwd', (t) => {
  requireHost(t);
  const cwd = tmp('fgos-identity-nodir-');
  fs.mkdirSync(path.join(cwd, '.fgos'));
  fs.writeFileSync(path.join(cwd, '.fgos', 'sessions.json'), JSON.stringify([{ sessionId: 'sess-cwd' }]));
  const answer = inFreshProcess('return facade.resolveWriterIdentity();', {
    cwd,
    env: cleanEnv({ FGOS_SESSION_ID: 'sess-cwd' }),
  });
  assert.deepEqual(answer, { id: 'sess-cwd', source: 'env' });
});

test('the depth of wrapper layers between the caller and its terminal does not change the id', (t) => {
  if (!UNIX) return t.skip('needs /bin/sh');
  requireHost(t);
  const direct = inFreshProcess('return facade.resolveWriterIdentity();');
  const wrapped = inFreshProcess('return facade.resolveWriterIdentity();', { viaShell: 2 });
  assert.deepEqual(wrapped, direct);
});

test('a process with no terminal anywhere above it resolves to its session id', (t) => {
  if (process.platform !== 'linux') return t.skip('reads /proc');
  requireHost(t);
  const dir = tmp('fgos-identity-setsid-');
  const out = path.join(dir, 'out.json');
  const script = `const facade = await import(${JSON.stringify(FACADE_URL)});
const fs = await import('node:fs');
const stat = fs.readFileSync('/proc/self/stat', 'utf8');
const fields = stat.slice(stat.lastIndexOf(')') + 1).trim().split(/\\s+/);
fs.writeFileSync(${JSON.stringify(out)}, JSON.stringify({ answer: facade.resolveWriterIdentity(), session: Number(fields[3]), tty: Number(fields[4]) }));`;
  // setsid without a terminal, then orphan the node child so no ancestor
  // with a terminal is left above it.
  const launcher = `( ${shellQuote(process.execPath)} --input-type=module -e ${shellQuote(script)} </dev/null >/dev/null 2>&1 & ) ; exit 0`;
  const res = spawnSync('/bin/sh', ['-c', launcher], { env: cleanEnv(), detached: true, stdio: 'ignore' });
  assert.equal(res.status, 0);
  const deadline = Date.now() + 10_000;
  while (!fs.existsSync(out) && Date.now() < deadline) spawnSync('sleep', ['0.05']);
  const { answer, session, tty } = JSON.parse(fs.readFileSync(out, 'utf8'));
  assert.equal(tty, 0);
  assert.deepEqual(answer, { id: session, source: 'pid' });
});

test('the doctor probe finds the activation host without FGOS_HOST_BIN, runs it with the caller pid and without the invocation record path', (t) => {
  if (!UNIX) return t.skip('stand-in release binary is a sh script');
  const host = requireHost(t);
  const root = tmp('fgos-identity-activation-');
  const release = path.join(root, 'release');
  fs.mkdirSync(path.join(release, 'bin'), { recursive: true });
  const releaseBin = standIn(path.join(release, 'bin'), 'fgos', `echo "record=\${FGOS_INVOCATION_RECORD_PATH:-unset}" >> "${root}/seen"; exec "${host}" "$@"`);
  fs.mkdirSync(path.join(root, '.fgos', 'installation'), { recursive: true });
  fs.writeFileSync(path.join(root, '.fgos', 'installation', 'activation.json'), JSON.stringify({ status: 'ready', releasePath: release }));
  const result = inFreshProcess(`
    const { resolveActiveHostBin } = await import(${JSON.stringify(new URL('../../src/util/host-bin-path.mjs', import.meta.url).href)});
    const { bin } = resolveActiveHostBin({ fgosDir: ${JSON.stringify(path.join(root, '.fgos'))}, cwd: ${JSON.stringify(root)} });
    return { bin, answer: facade.probeIdentity(bin, ${JSON.stringify(path.join(root, '.fgos'))}), pid: process.pid };`, {
    cwd: os.tmpdir(),
    env: cleanEnv({ FGOS_HOST_BIN: undefined, FGOS_SESSION_ID: 'via-activation', FGOS_INVOCATION_RECORD_PATH: path.join(root, 'records.jsonl') }),
  });
  assert.equal(result.bin, releaseBin);
  assert.deepEqual(result.answer, { id: 'via-activation', source: 'env' });
  assert.equal(fs.readFileSync(path.join(root, 'seen'), 'utf8').trim(), 'record=unset');
  assert.ok(!fs.existsSync(path.join(root, 'records.jsonl')));
  assert.match(calls(releaseBin)[0], new RegExp(`identity --pid ${result.pid} --fgos-dir ${path.join(root, '.fgos')}$`));
});

test('without the addon the resolver is host-missing and names the dev door', () => {
  const cwd = tmp('fgos-identity-missing-');
  const result = inFreshProcess(`
    try { facade.resolveWriterIdentity(${JSON.stringify(path.join(cwd, '.fgos'))}); return { ok: true }; }
    catch (err) { return { code: err.code, category: err.category, message: err.message }; }`, {
    cwd,
    env: cleanEnv({ FGOS_HOST_BIN: undefined, FGOS_ACTIVE_RELEASE_PATH: undefined, FGOS_ACTIVE_MANIFEST_PATH: undefined }),
  });
  assert.equal(result.code, 'host-missing');
  assert.equal(result.category, 'precondition');
  assert.match(result.message, /npm run fgos:dev/);
});

test('the doctor probe classifies every host failure and never guesses an id', (t) => {
  if (!UNIX) return t.skip('stand-in hosts are sh scripts');
  const dir = tmp('fgos-identity-failures-');
  const oldHost = standIn(dir, 'old', 'echo \'fgos: unknown verb "identity". Usage: fgos <command> [args...]\' >&2; exit 4');
  const slow = standIn(dir, 'slow', `echo $$ > "${dir}/slow.pid"; exec sleep 10`);
  const junk = standIn(dir, 'junk', 'echo not json');
  const okShape = standIn(dir, 'shape', 'echo \'{"contract":"fgos.v1","generated_at":"x","data_hash":"y","data":{"id":"7","source":"pid"}}\'');
  const broken = standIn(dir, 'broken', 'echo boom >&2; exit 3');
  const codeOf = (bin) => { try { probeIdentity(bin); } catch (err) { return err; } return { code: 'answered' }; };

  assert.equal(codeOf(path.join(dir, 'absent')).code, 'host-missing');
  assert.equal(codeOf(oldHost).code, 'host-version-mismatch');
  assert.equal(codeOf(junk).code, 'host-error', 'an answer that is not JSON');
  assert.equal(codeOf(okShape).code, 'host-error', 'a pid source with a string id');
  const hostError = codeOf(broken);
  assert.equal(hostError.code, 'host-error');
  assert.match(hostError.message, /exit 3.*boom/);

  const started = Date.now();
  const hung = codeOf(slow);
  assert.equal(hung.code, 'host-error', 'a hung host is killed and named');
  assert.match(hung.message, /ETIMEDOUT|SIGKILL/);
  assert.ok(Date.now() - started < 6000, `took ${Date.now() - started} ms`);
  const slowPid = Number(fs.readFileSync(path.join(dir, 'slow.pid'), 'utf8'));
  assert.throws(() => process.kill(slowPid, 0), { code: 'ESRCH' }, 'the timed-out host was killed and reaped');
});

test('on every platform an unresolved answer names the calling Node process', (t) => {
  if (process.platform === 'linux') return t.skip('Linux always reads the process tree');
  requireHost(t);
  const result = inFreshProcess('return { answer: facade.resolveWriterIdentity(), pid: process.pid };');
  if (result.answer.source === 'unresolved') assert.equal(result.answer.id, result.pid);
});
