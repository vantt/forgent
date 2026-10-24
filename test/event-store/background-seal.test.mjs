// Owning proof of the CLI seal hand-off (spec §16): a Work command appends and fsyncs its event, prints its answer and
// hands the seal to one short detached `fgos events seal` child. Everything here runs the real CLI and the real child.
import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { initGitCwd, addOk, run } from '../cli/helpers/fgos-cli-harness.mjs';
import { holdLockInChild } from '../helpers/hold-lock-in-child.mjs';
import { prepareWorkStore } from '../../src/state/work-event-store.mjs';
import { scan, judge, signalByIdentity } from '../../src/runner/dispatch/process-identity.mjs';
import { acquireSync, createLockScope } from '../../src/holder-lock/index.mjs';

const BIN = path.resolve(import.meta.dirname, '../../bin/fgos.mjs');
const REFUSE_SPAWN = path.resolve(import.meta.dirname, 'fixtures/refuse-detached-spawn.cjs');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const waitFor = async (what, predicate, timeoutMs = 20000) => {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = predicate();
    if (value) return value;
    if (Date.now() > deadline) assert.fail(`timed out waiting for ${what}`);
    await sleep(25);
  }
};

function workspace() {
  const cwd = fs.realpathSync(initGitCwd());
  assert.equal(addOk(cwd, 'bs-1').status, 0);
  const dir = path.join(cwd, '.fgos');
  const store = prepareWorkStore(dir, dir).store;
  const eventRoot = path.join(cwd, '.git', 'fgos', 'events');
  const receipt = () => {
    const file = path.join(eventRoot, 'project', 'sealed.json');
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)).lastSeq : 0;
  };
  const total = () => store.read({ streams: ['project'] }, []).events.length;
  const sealChildren = () => {
    const views = scan({});
    return views === 'unsupported' ? [] : views.filter((view) => {
      const args = Array.isArray(view.cmdline) ? view.cmdline.join(' ') : String(view.cmdline);
      return view.pid !== process.pid && args.includes(' events seal ') && args.includes(cwd);
    });
  };
  const env = { ...process.env, FGOS_SESSION_ID: 'fgos-cli-harness-test' };
  return {
    cwd, receipt, total, sealChildren, env, eventRoot,
    holdSeal: () => holdLockInChild('event-seal', { eventOpenRoot: eventRoot }),
    move: (to) => run(cwd, ['move', 'bs-1', '--to', to]),
  };
}
const stopHolder = async (holder) => { holder.child.kill('SIGKILL'); await holder.exited; };
/** A seal-lock holder that is stopped however the test ends. */
const holdSealFor = async (t, w) => { const holder = await w.holdSeal(); t.after(() => stopHolder(holder)); return holder; };
const gone = (views) => views.every((view) => view.tuple === null || judge(view.tuple) === 'dead');

test('a CLI Work command returns before its seal, a detached child then certifies it, and the child exits', async (t) => {
  const w = workspace();
  const holder = await holdSealFor(t, w);
  const before = w.receipt();
  const moved = w.move('blocked');
  assert.equal(moved.status, 0, moved.stderr);
  assert.equal(w.receipt(), before, 'the answer came back while the seal lock was held elsewhere: the command did not wait for the seal');
  assert.ok(w.total() > before, 'the appended event is durable and readable before the seal');
  const [child] = await waitFor('the seal child', () => { const found = w.sealChildren(); return found.length ? found : null; });
  await stopHolder(holder);
  await waitFor('the receipt to cover every event', () => w.receipt() === w.total());
  await waitFor('the seal child to exit', () => gone([child]));
  assert.deepEqual(w.sealChildren(), [], 'no seal child is left');
});

test('a burst of CLI commands ends with every event sealed, no child running and no lock held', async (t) => {
  const w = workspace();
  for (const to of ['blocked', 'todo', 'blocked', 'todo', 'blocked']) assert.equal(w.move(to).status, 0);
  await waitFor('every event sealed', () => w.receipt() === w.total());
  await waitFor('no seal child left', () => w.sealChildren().length === 0);
  const taken = acquireSync(createLockScope('background-seal-test'), 'event-seal', { eventOpenRoot: w.eventRoot });
  assert.equal(taken.result, 'acquired', 'the seal lock is free');
  taken.handle.release();
});

test('a seal child killed before it seals loses nothing and the next command seals both events', async (t) => {
  const w = workspace();
  const holder = await holdSealFor(t, w);
  assert.equal(w.move('blocked').status, 0);
  const [child] = await waitFor('the seal child', () => { const found = w.sealChildren(); return found.length ? found : null; });
  assert.equal(signalByIdentity(child.tuple, 'kill'), 'sent');
  await waitFor('the child to die', () => gone([child]));
  await stopHolder(holder);
  assert.ok(w.total() - w.receipt() >= 1, 'the killed child sealed nothing');
  assert.equal(JSON.parse(run(w.cwd, ['show', 'bs-1']).stdout).data.work.status, 'blocked', 'the event is not lost');
  assert.equal(w.move('todo').status, 0);
  await waitFor('the next command to seal both', () => w.receipt() === w.total());
});

test('a seal child that cannot be started never fails the command, and the next command seals', async (t) => {
  const w = workspace();
  const sealed = w.receipt();
  const result = spawnSync(process.execPath, ['--require', REFUSE_SPAWN, BIN, 'move', 'bs-1', '--to', 'blocked'], { cwd: w.cwd, env: w.env, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  await sleep(500);
  assert.equal(w.receipt(), sealed, 'no child ran');
  assert.equal(w.move('todo').status, 0);
  await waitFor('the next command to seal both', () => w.receipt() === w.total());
});

test('a seal child lives on when the CLI process group is interrupted', async (t) => {
  const w = workspace();
  const holder = await holdSealFor(t, w);
  const cli = spawn(process.execPath, [BIN, 'move', 'bs-1', '--to', 'blocked'], { cwd: w.cwd, env: w.env, detached: true, stdio: 'ignore' });
  const [child] = await waitFor('the seal child', () => { const found = w.sealChildren(); return found.length ? found : null; });
  assert.notEqual(child.pid, cli.pid);
  const groupOf = (pid) => Number(spawnSync('ps', ['-o', 'pgid=', '-p', String(pid)], { encoding: 'utf8' }).stdout.trim());
  assert.equal(groupOf(child.pid), child.pid, 'the seal child leads its own process group, apart from the CLI group');
  try { process.kill(-cli.pid, 'SIGINT'); } catch { /* the CLI already ended: nothing left to interrupt */ }
  await sleep(300);
  assert.equal(gone([child]), false, 'the interrupt of the CLI group did not reach the seal child');
  await stopHolder(holder);
  await waitFor('the receipt to cover every event', () => w.receipt() === w.total());
});
