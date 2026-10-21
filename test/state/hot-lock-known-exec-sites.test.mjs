// The guard catches the three places that started a child process inside the
// old events lock: `currentHead` in a claim, `getMainFgosDir` in
// `acquireClaim`, `assertPlanEvidence` in `moveWork`. The code of those places
// is taken from the commit before the hot lock existed (they are being moved
// out of the critical section, so today's code no longer shows them), and run
// against the real hot lock of this checkout.
//
// Two of the three sit inside a broad try/catch that turns the guard's error
// into "no branch" or "no main root", so the test watches the call itself: a
// spy outside the guard records every execFileSync made at critical-section
// depth, with its stack.

import '../helpers/process-tmp-root.mjs';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const BASELINE = 'eab4d617b';
const SOURCES = ['src', 'packages/holder-lock/contracts', 'core', 'package.json'];

let tree = null;
let skipReason = null;

before(() => {
  tree = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-hot-baseline-'));
  try {
    const archive = execFileSync('git', ['archive', BASELINE, ...SOURCES], { cwd: ROOT, maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    const untar = spawnSync('tar', ['-x', '-C', tree], { input: archive });
    if (untar.status !== 0) throw new Error('tar failed');
  } catch {
    skipReason = `not measured: baseline commit ${BASELINE} is not available in this clone`;
    return;
  }
  // The lock under test, and the files that must agree with it, from this checkout.
  for (const file of ['src/state/hot-lock.mjs', 'src/state/event-log.mjs', 'src/state/events.mjs', 'packages/holder-lock/contracts/lock-registry.v1.json']) {
    fs.copyFileSync(path.join(ROOT, file), path.join(tree, file));
  }
  // The lock door the hot lock calls through, whole, so its modules agree with each other.
  fs.cpSync(path.join(ROOT, 'src/holder-lock'), path.join(tree, 'src/holder-lock'), { recursive: true });
  // The process door is this checkout's own: the door loads only the addon of the payload it runs in, so the
  // baseline tree reaches this checkout's client instead of carrying a payload (and a copy of the addon) of its own.
  fs.writeFileSync(path.join(tree, 'src/runner/dispatch/process-identity.mjs'), `export * from ${JSON.stringify(pathToFileURL(path.join(ROOT, 'src/runner/dispatch/process-identity.mjs')).href)};\n`);
  // The baseline callers still use the pre-cutover names; give them to the
  // copied events module as thin wrappers over the real hot lock.
  fs.appendFileSync(path.join(tree, 'src/state/events.mjs'), `
export { appendEventCore as appendEventLocked };
export function withEventsLock(logPath, fn, fgosDir = path.dirname(logPath)) {
  const parent = path.dirname(logPath);
  const porting = path.basename(parent) === 'porting';
  const root = porting && fgosDir === parent ? path.dirname(parent) : fgosDir;
  return withStateTx(root, () => fn(), { resource: porting ? 'porting-events' : 'state' });
}
`);
  fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(tree, 'node_modules'));
});

after(() => {
  if (tree) fs.rmSync(tree, { recursive: true, force: true });
});

const SCRIPT = `
import childProcess from 'node:child_process';
import nodeModule from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const tree = process.argv[1];
const repo = process.argv[2];
const mod = (rel) => import(path.join(tree, rel));
const { hotLockDepth } = await mod('src/state/hot-lock.mjs');
const store = await mod('src/state/store.mjs');
const events = await mod('src/state/events.mjs');
const claimPort = await mod('src/runner/claim-port.mjs');
const runtime = await mod('src/state/runtime-coordination.mjs');

const seen = [];
const guarded = childProcess.execFileSync;
childProcess.execFileSync = function spy(...args) {
  seen.push({ depth: hotLockDepth(), stack: new Error().stack });
  return Reflect.apply(guarded, this, args);
};
nodeModule.syncBuiltinESMExports();

const dir = path.join(repo, '.fgos');
store.initStore(dir);
const item = (id, extra = {}) => ({ id, title: id, kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true', ...extra });
store.addWork(dir, item('claim-me'));
store.addWork(dir, item('heavy', { risk: 'heavy' }));
const sitesAt = (name) => seen.filter((s) => s.depth > 0 && s.stack.includes(name)).length;
const answer = {};

try {
  await claimPort.claimWork(dir, { id: 'claim-me', actor: 'session', isolate: false, repoRoot: repo });
  answer.claim = 'no error';
} catch (err) {
  answer.claim = err.code ?? err.name;
}
answer.currentHead = sitesAt('currentHead');

seen.length = 0;
try {
  events.withEventsLock(path.join(dir, 'events.jsonl'), () => runtime.acquireClaim(dir, { id: 'claim-me', actor: 'session' }), dir);
} catch (err) {
  answer.acquire = err.code ?? err.name;
}
answer.getMainFgosDir = sitesAt('getMainFgosDir');

seen.length = 0;
const heavy = { id: 'heavy', risk: 'heavy' };
fs.mkdirSync(path.join(repo, 'docs/history/heavy'), { recursive: true });
fs.writeFileSync(path.join(repo, 'docs/history/heavy/plan.md'), '# plan\\n');
const git = (...a) => childProcess.spawnSync('git', a, { cwd: repo, encoding: 'utf8' });
git('checkout', '-q', '-b', 'fgw/heavy');
git('add', 'docs');
git('commit', '-q', '-m', 'plan');
git('checkout', '-q', '-');
seen.length = 0;
store.assertPlanEvidence('heavy', heavy, repo);
answer.outsideLock = 'ok';
answer.outsideLockSpied = seen.length;
seen.length = 0;
try {
  events.withEventsLock(path.join(dir, 'events.jsonl'), () => store.assertPlanEvidence('heavy', heavy, repo), dir);
  answer.insideLock = 'ok';
} catch (err) {
  answer.insideLock = err.name;
}
answer.assertPlanEvidence = sitesAt('assertPlanEvidence');
process.stdout.write(JSON.stringify(answer));
`;

test('the three places that started a child inside the old lock are caught by the guard', { timeout: 120000 }, (t) => {
  if (skipReason) return t.skip(skipReason);
  const repo = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-hot-sites-')));
  try {
    const git = (...args) => execFileSync('git', args, { cwd: repo, stdio: ['ignore', 'pipe', 'pipe'] });
    git('init', '-q');
    git('config', 'user.email', 'test@example.com');
    git('config', 'user.name', 'Test');
    fs.writeFileSync(path.join(repo, 'seed.txt'), 'seed\n');
    git('add', 'seed.txt');
    git('commit', '-q', '-m', 'init');
    const env = { ...process.env };
    for (const key of ['CLAUDE_CODE_SESSION_ID', 'CODEX_THREAD_ID', 'FGOS_SESSION_ID']) delete env[key];
    const run = spawnSync(process.execPath, ['--input-type=module', '-e', SCRIPT, tree, repo], { cwd: repo, env, encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    const answer = JSON.parse(run.stdout);

    // currentHead: the error reaches the caller.
    assert.equal(answer.claim, 'exec-under-hot-lock');
    assert.ok(answer.currentHead >= 1, 'currentHead ran git at critical-section depth');
    // getMainFgosDir: swallowed by its own catch, but the call was made at depth and refused.
    assert.ok(answer.getMainFgosDir >= 1, 'getMainFgosDir ran git at critical-section depth');
    // assertPlanEvidence: same pattern; outside the lock the identical call works and sees the plan.
    assert.equal(answer.outsideLock, 'ok');
    assert.ok(answer.outsideLockSpied >= 1);
    assert.ok(answer.assertPlanEvidence >= 1, 'assertPlanEvidence ran git at critical-section depth');
    assert.equal(answer.insideLock, 'StoreError', 'inside the lock the refused git call reads as "no plan on the branch"');
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});
