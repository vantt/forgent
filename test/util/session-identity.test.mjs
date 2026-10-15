// session-identity.test.mjs -- the Node facade over the Rust session identity
// crate. Every case runs the real host binary (FGOS_HOST_BIN, built from this
// checkout by `npm test`) in a fresh Node process, so the per-process cache
// starts empty and the answer comes from the one authority. Failure modes use
// small stand-in executables (unix only); the real-binary cases run on
// Windows too.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { IDENTITY_ENV_KEYS } from '../../src/util/session-identity.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const FACADE_URL = new URL('../../src/util/session-identity.mjs', import.meta.url).href;
const CONTRACTS = path.join(REPO_ROOT, 'packages', 'session-identity', 'contracts');
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

test('the facade cache key names the same env variables, in the same order, as the contract', () => {
  const contract = JSON.parse(fs.readFileSync(path.join(CONTRACTS, 'session-identity.resolve.v1.json'), 'utf8'));
  assert.deepEqual([...IDENTITY_ENV_KEYS], contract['x-envOrder']);
});

test('the dispatch writerId format floor uses the contract id charset and length', async () => {
  const contract = JSON.parse(fs.readFileSync(path.join(CONTRACTS, 'session-identity.resolve.v1.json'), 'utf8'));
  const { WRITER_ID_RE, MAX_WRITER_ID_LENGTH } = await import('../../src/runner/dispatch/execution-contract.mjs');
  assert.equal(WRITER_ID_RE.source, contract['x-idPattern']);
  assert.equal(MAX_WRITER_ID_LENGTH, contract['x-maxIdLength']);
});

test('every shared env vector resolves the same through the real binary', (t) => {
  requireHost(t);
  const golden = JSON.parse(fs.readFileSync(path.join(CONTRACTS, 'session-identity.golden.v1.json'), 'utf8'));
  const root = tmp('fgos-identity-env-');
  const cases = golden.envCases.map((c, i) => {
    let dir = null;
    if (c.registry.kind !== 'none') {
      dir = path.join(root, `case-${i}`);
      fs.mkdirSync(dir);
      if (c.registry.kind === 'rows') fs.writeFileSync(path.join(dir, 'sessions.json'), JSON.stringify(c.registry.rows));
      if (c.registry.kind === 'raw') fs.writeFileSync(path.join(dir, 'sessions.json'), c.registry.raw);
    }
    return { name: c.name, env: c.env, dir, expected: c.expected };
  });
  const results = inFreshProcess(`
    const cases = ${JSON.stringify(cases)};
    const keys = ${JSON.stringify(IDENTITY_ENV_KEYS)};
    return cases.map((c) => {
      for (const key of keys) delete process.env[key];
      Object.assign(process.env, c.env);
      return facade.resolveWriterIdentity(c.dir ?? undefined);
    });`);
  cases.forEach((c, i) => {
    if (c.expected === null) {
      assert.ok([ 'pid', 'unresolved' ].includes(results[i].source), `${c.name}: ${JSON.stringify(results[i])}`);
    } else {
      assert.deepEqual(results[i], c.expected, c.name);
    }
  });
});

test('one exec per session env for the pid branch, whatever fgos dir is passed; a new env asks again', (t) => {
  if (!UNIX) return t.skip('stand-in hosts are sh scripts');
  const host = requireHost(t);
  const dir = tmp('fgos-identity-cache-');
  const wrapper = standIn(dir, 'host', `exec "${host}" "$@"`);
  const [a, b, c, d] = inFreshProcess(`
    const a = facade.resolveWriterIdentity(${JSON.stringify(path.join(dir, 'one'))});
    const b = facade.resolveWriterIdentity(${JSON.stringify(path.join(dir, 'two'))});
    const c = facade.resolveWriterIdentity();
    process.env.FGOS_SESSION_ID = 'later-session';
    const d = facade.resolveWriterIdentity(${JSON.stringify(path.join(dir, 'one'))});
    facade.resolveWriterIdentity(${JSON.stringify(path.join(dir, 'one'))});
    return [a, b, c, d];`, { env: cleanEnv({ FGOS_HOST_BIN: wrapper }) });
  assert.deepEqual(a, b);
  assert.deepEqual(a, c);
  assert.ok(['pid', 'unresolved'].includes(a.source));
  assert.deepEqual(d, { id: 'later-session', source: 'env' });
  assert.equal(calls(wrapper).length, 2, calls(wrapper).join('\n'));
});

test('the env-branch cache key stays the same when the fgos dir is created under a symlink after priming', (t) => {
  if (!UNIX) return t.skip('symlinks need privileges on Windows');
  const host = requireHost(t);
  const dir = tmp('fgos-identity-symlink-');
  fs.mkdirSync(path.join(dir, 'real'));
  fs.symlinkSync(path.join(dir, 'real'), path.join(dir, 'alias'));
  const wrapper = standIn(dir, 'host', `exec "${host}" "$@"`);
  const fgosDir = path.join(dir, 'alias', 'new', '.fgos');
  const [first, second] = inFreshProcess(`
    const fs = await import('node:fs');
    const first = facade.resolveWriterIdentity(${JSON.stringify(fgosDir)});
    fs.mkdirSync(${JSON.stringify(fgosDir)}, { recursive: true });
    facade.noteLockHeld();
    const second = facade.resolveWriterIdentity(${JSON.stringify(fgosDir)});
    facade.noteLockReleased();
    return [first, second];`, { env: cleanEnv({ FGOS_HOST_BIN: wrapper, FGOS_SESSION_ID: 'sess-sym' }) });
  assert.deepEqual(first, { id: 'sess-sym', source: 'env' });
  assert.deepEqual(second, first);
  assert.equal(calls(wrapper).length, 1);
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

test('activation discovery finds the host without FGOS_HOST_BIN', (t) => {
  if (!UNIX) return t.skip('stand-in release binary is a sh script');
  const host = requireHost(t);
  const root = tmp('fgos-identity-activation-');
  const release = path.join(root, 'release');
  fs.mkdirSync(path.join(release, 'bin'), { recursive: true });
  const releaseBin = standIn(path.join(release, 'bin'), 'fgos', `exec "${host}" "$@"`);
  fs.mkdirSync(path.join(root, '.fgos', 'installation'), { recursive: true });
  fs.writeFileSync(path.join(root, '.fgos', 'installation', 'activation.json'), JSON.stringify({ status: 'ready', releasePath: release }));
  const answer = inFreshProcess(`return facade.resolveWriterIdentity(${JSON.stringify(path.join(root, '.fgos'))});`, {
    cwd: os.tmpdir(),
    env: cleanEnv({ FGOS_HOST_BIN: undefined, FGOS_SESSION_ID: 'via-activation' }),
  });
  assert.deepEqual(answer, { id: 'via-activation', source: 'env' });
  assert.equal(calls(releaseBin).length, 1);
});

function failure(env, body = 'facade.resolveWriterIdentity();') {
  return inFreshProcess(`
    const started = Date.now();
    try { ${body} return { ok: true }; }
    catch (err) { return { name: err.name, code: err.code, category: err.category, message: err.message, ms: Date.now() - started }; }`, { env });
}

test('no host binary anywhere is host-missing, naming where it looked', () => {
  const cwd = tmp('fgos-identity-missing-');
  const result = inFreshProcess(`
    try { facade.resolveWriterIdentity(${JSON.stringify(path.join(cwd, '.fgos'))}); return { ok: true }; }
    catch (err) { return { code: err.code, category: err.category, message: err.message }; }`, {
    cwd,
    env: cleanEnv({ FGOS_HOST_BIN: undefined }),
  });
  assert.equal(result.code, 'host-missing');
  assert.equal(result.category, 'precondition');
  assert.match(result.message, /activation\.json/);
});

test('host failures are classified, never guessed, and never cached', (t) => {
  if (!UNIX) return t.skip('stand-in hosts are sh scripts');
  const host = requireHost(t);
  const dir = tmp('fgos-identity-failures-');
  const oldHost = standIn(dir, 'old', 'echo \'fgos: unknown verb "identity". Usage: fgos <command> [args...]\' >&2; exit 4');
  const slow = standIn(dir, 'slow', `echo $$ > "${dir}/slow.pid"; exec sleep 10`);
  const junk = standIn(dir, 'junk', 'echo not json');
  const okShape = standIn(dir, 'shape', 'echo \'{"contract":"fgos.v1","generated_at":"x","data_hash":"y","data":{"id":"7","source":"pid"}}\'');
  const broken = standIn(dir, 'broken', 'echo boom >&2; exit 3');
  const real = standIn(dir, 'real', `exec "${host}" "$@"`);

  assert.equal(failure(cleanEnv({ FGOS_HOST_BIN: oldHost })).code, 'host-version-mismatch');
  assert.equal(failure(cleanEnv({ FGOS_HOST_BIN: junk })).code, 'bad-output');
  assert.equal(failure(cleanEnv({ FGOS_HOST_BIN: okShape })).code, 'bad-output', 'pid source with a string id');
  const hostError = failure(cleanEnv({ FGOS_HOST_BIN: broken }));
  assert.equal(hostError.code, 'host-error');
  assert.match(hostError.message, /exit 3.*boom/);

  const timeout = failure(cleanEnv({ FGOS_HOST_BIN: slow }));
  assert.equal(timeout.code, 'timeout');
  assert.ok(timeout.ms < 6000, `took ${timeout.ms} ms`);
  const slowPid = Number(fs.readFileSync(path.join(dir, 'slow.pid'), 'utf8'));
  assert.throws(() => process.kill(slowPid, 0), { code: 'ESRCH' }, 'the timed-out host was killed and reaped');

  // A failure is not remembered: the same process asks again and succeeds.
  const retried = inFreshProcess(`
    try { facade.resolveWriterIdentity(); } catch (err) { if (err.code !== 'bad-output') throw err; }
    process.env.FGOS_HOST_BIN = ${JSON.stringify(real)};
    return facade.resolveWriterIdentity();`, { env: cleanEnv({ FGOS_HOST_BIN: junk, FGOS_SESSION_ID: 'after-failure' }) });
  assert.deepEqual(retried, { id: 'after-failure', source: 'env' });
});

test('no exec while a lock is held: a cache miss and a direct probe both refuse before spawning', (t) => {
  if (!UNIX) return t.skip('stand-in hosts are sh scripts');
  const host = requireHost(t);
  const dir = tmp('fgos-identity-inlock-');
  const wrapper = standIn(dir, 'host', `exec "${host}" "$@"`);
  const result = inFreshProcess(`
    const codes = [];
    facade.noteLockHeld();
    try { facade.resolveWriterIdentity(); } catch (err) { codes.push(err.code); }
    try { facade.probeIdentity(${JSON.stringify(wrapper)}); } catch (err) { codes.push(err.code); }
    facade.noteLockReleased();
    const after = facade.resolveWriterIdentity();
    facade.noteLockHeld();
    const cached = facade.resolveWriterIdentity();
    facade.noteLockReleased();
    return { codes, after, cached };`, { env: cleanEnv({ FGOS_HOST_BIN: wrapper, FGOS_SESSION_ID: 'locked' }) });
  assert.deepEqual(result.codes, ['identity-in-lock', 'identity-in-lock']);
  assert.deepEqual(result.after, { id: 'locked', source: 'env' });
  assert.deepEqual(result.cached, result.after);
  assert.equal(calls(wrapper).length, 1);
});

test('the verb runs with the caller pid and without the invocation record path', (t) => {
  if (!UNIX) return t.skip('stand-in hosts are sh scripts');
  const host = requireHost(t);
  const dir = tmp('fgos-identity-env-');
  const wrapper = standIn(dir, 'host', `echo "record=\${FGOS_INVOCATION_RECORD_PATH:-unset}" >> "${dir}/seen"; exec "${host}" "$@"`);
  const pid = inFreshProcess('facade.resolveWriterIdentity(); return process.pid;', {
    env: cleanEnv({ FGOS_HOST_BIN: wrapper, FGOS_INVOCATION_RECORD_PATH: path.join(dir, 'records.jsonl') }),
  });
  assert.equal(fs.readFileSync(path.join(dir, 'seen'), 'utf8').trim(), 'record=unset');
  assert.ok(!fs.existsSync(path.join(dir, 'records.jsonl')));
  assert.match(calls(wrapper)[0], new RegExp(`identity --pid ${pid}$`));
});

test('on every platform an unresolved answer names the calling Node process', (t) => {
  if (process.platform === 'linux') return t.skip('Linux always reads the process tree');
  requireHost(t);
  const result = inFreshProcess('return { answer: facade.resolveWriterIdentity(), pid: process.pid };');
  if (result.answer.source === 'unresolved') assert.equal(result.answer.id, result.pid);
});
