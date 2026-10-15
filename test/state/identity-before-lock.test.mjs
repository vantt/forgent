// identity-before-lock.test.mjs -- the identity bridge never runs the host
// binary while the calling process holds events.lock or claims.lock.
//
// FGOS_HOST_BIN is a small sh stand-in that, at each exec, reads the owner
// pid of every events.lock/claims.lock under the store and records a
// violation only when the owner is the caller itself (`--pid`), then execs
// the real host. A fresh Node process (empty identity cache) runs the real
// write paths against a real git repo reached through a symlinked path, so
// lexical and canonical forms of the same .fgos dir both occur.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { initStore, addWork } from '../../src/state/store.mjs';
import { withEventsLock } from '../../src/state/events.mjs';
import { IDENTITY_ENV_KEYS } from '../../src/util/session-identity.mjs';

const HOST = process.env.FGOS_HOST_BIN;
const UNIX = process.platform !== 'win32';
const STORE_URL = new URL('../../src/state/store.mjs', import.meta.url).href;
const EVENTS_URL = new URL('../../src/state/events.mjs', import.meta.url).href;
const CLAIMS_URL = new URL('../../src/state/runtime-coordination.mjs', import.meta.url).href;
const CLAIM_PORT_URL = new URL('../../src/runner/claim-port.mjs', import.meta.url).href;
const PORTING_URL = new URL('../../src/state/porting-store.mjs', import.meta.url).href;
const FACADE_URL = new URL('../../src/util/session-identity.mjs', import.meta.url).href;

function git(cwd, ...args) {
  execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
}

/** A git repo at <tmp>/real/repo (linked worktree <tmp>/real/wt), reached
 * through <tmp>/alias. `store: 'worktree'` puts the event store in the
 * linked worktree, so claims (always the main checkout's .fgos) and events
 * live under two different dirs. */
function setup({ store = 'main' } = {}) {
  const base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-identity-lock-')));
  const realRepo = path.join(base, 'real', 'repo');
  fs.mkdirSync(realRepo, { recursive: true });
  git(realRepo, 'init', '-q');
  git(realRepo, 'config', 'user.email', 'test@example.com');
  git(realRepo, 'config', 'user.name', 'Test');
  fs.writeFileSync(path.join(realRepo, 'seed.txt'), 'seed\n');
  git(realRepo, 'add', 'seed.txt');
  git(realRepo, 'commit', '-q', '-m', 'init');
  git(realRepo, 'worktree', 'add', '-q', path.join(base, 'real', 'wt'), '-b', 'side');
  fs.symlinkSync(path.join(base, 'real'), path.join(base, 'alias'));
  const repoRoot = path.join(base, 'alias', store === 'main' ? 'repo' : 'wt');
  const dir = path.join(repoRoot, '.fgos');
  initStore(dir);
  addWork(dir, { id: 'item-a', title: 'Item A', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });

  const wrapper = path.join(base, 'host');
  fs.writeFileSync(wrapper, `#!/bin/sh
caller=""; prev=""
for a in "$@"; do [ "$prev" = "--pid" ] && caller="$a"; prev="$a"; done
echo "$caller" >> "${base}/calls"
for f in $(find "${path.join(base, 'real')}" -name events.lock -o -name claims.lock 2>/dev/null); do
  owner=$(grep -o '[0-9][0-9]*' "$f" 2>/dev/null | head -n 1)
  [ -n "$owner" ] && [ "$owner" = "$caller" ] && echo "$f held by caller $caller" >> "${base}/violations"
done
exec "${HOST}" "$@"
`, { mode: 0o755 });
  return { base, repoRoot, dir, wrapper };
}

function childEnv(wrapper, extra = {}) {
  const env = { ...process.env, FGOS_HOST_BIN: wrapper, ...extra };
  for (const key of IDENTITY_ENV_KEYS) if (!(key in extra)) delete env[key];
  return env;
}

const WRITE_PATHS = `
const store = await import(${JSON.stringify(STORE_URL)});
const events = await import(${JSON.stringify(EVENTS_URL)});
const claims = await import(${JSON.stringify(CLAIMS_URL)});
const claimPort = await import(${JSON.stringify(CLAIM_PORT_URL)});
const porting = await import(${JSON.stringify(PORTING_URL)});
const { dir, repoRoot } = JSON.parse(process.argv[1]);
store.addWork(dir, { id: 'item-b', title: 'Item B', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
store.editWork(dir, { id: 'item-b', patch: { title: 'Item B edited' } });
const claim = claimPort.claimWork(dir, { id: 'item-a', actor: 'session', isolate: false, repoRoot });
store.settleClaim(dir, { id: 'item-a', claimId: claim.claimId, finalStatus: 'todo' });
const runtime = claims.acquireClaim(dir, { id: 'item-c', actor: 'session' });
claims.releaseClaim(dir, { id: 'item-c', claimId: runtime.claimId });
events.appendEvent(store.resolveWriterLogPath(dir), { type: 'test.note', payload: null }, dir);
porting.addPorting(dir, { id: 'p1', title: 'Widget' });
porting.movePorting(dir, { id: 'p1', to: 'planned', expectedStatus: 'candidate' });
`;

function runWritePaths({ dir, repoRoot, wrapper }, extraEnv) {
  return spawnSync(process.execPath, ['--input-type=module', '-e', WRITE_PATHS, JSON.stringify({ dir, repoRoot })], {
    cwd: path.join(path.dirname(repoRoot), 'wt'),
    env: childEnv(wrapper, extraEnv),
    encoding: 'utf8',
  });
}

function read(file) {
  try {
    return fs.readFileSync(file, 'utf8').trim();
  } catch {
    return '';
  }
}

for (const [label, extraEnv, store] of [
  ['without a session env (pid branch)', {}, 'main'],
  ['with a session env (env branch)', { FGOS_SESSION_ID: 'lock-probe-session' }, 'main'],
  ['with a session env and the event store in a linked worktree', { FGOS_SESSION_ID: 'lock-probe-session' }, 'worktree'],
]) {
  test(`every write path resolves the writer before taking a lock, ${label}`, (t) => {
    if (!UNIX) return t.skip('the stand-in host is a sh script');
    assert.ok(HOST && fs.existsSync(HOST), 'set FGOS_HOST_BIN to a host built from this checkout');
    const fixture = setup({ store });
    const res = runWritePaths(fixture, extraEnv);
    assert.equal(res.status, 0, res.stderr);
    assert.equal(read(path.join(fixture.base, 'violations')), '', 'the host ran while the caller held a lock');
    assert.ok(read(path.join(fixture.base, 'calls')).length > 0, 'the host was asked at least once');
    assert.doesNotMatch(res.stderr, /identity-in-lock/);
  });
}

test('resolving while another process holds the lock is fine and is not counted as a violation', async (t) => {
  if (!UNIX) return t.skip('the stand-in host is a sh script');
  const fixture = setup();
  const script = `const facade = await import(${JSON.stringify(FACADE_URL)});
process.stdout.write(JSON.stringify(facade.resolveWriterIdentity(${JSON.stringify(fixture.dir)})));`;
  const answer = await withEventsLock(path.join(fixture.dir, 'events.jsonl'), () => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--input-type=module', '-e', script], {
      env: childEnv(fixture.wrapper, { FGOS_SESSION_ID: 'other-process' }),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    let err = '';
    child.stdout.on('data', (chunk) => { out += chunk; });
    child.stderr.on('data', (chunk) => { err += chunk; });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve(JSON.parse(out)) : reject(new Error(err))));
  }), fixture.dir);
  assert.deepEqual(answer, { id: 'other-process', source: 'env' });
  assert.equal(read(path.join(fixture.base, 'violations')), '');
  assert.equal(read(path.join(fixture.base, 'calls')).split('\n').length, 1);
});
