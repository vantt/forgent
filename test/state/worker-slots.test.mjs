import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  countWorkerSlots,
  hasWorkerSlotRoom,
  ADMIN_LANE_RESERVATION,
  DEFAULT_WORKER_SLOT_CEILING,
} from '../../src/state/worker-slots.mjs';
import { claimWork, ClaimError } from '../../src/runner/claim-port.mjs';
import { initStore, addWork, listWork } from '../../src/state/store.mjs';
import { acquireClaim } from '../../src/state/runtime-coordination.mjs';

const FGOS_BIN = fileURLToPath(new URL('../../bin/fgos.mjs', import.meta.url));

/** A view is just `{work: {id: item}}` — worker-slots.mjs is pure, so these
 * never need a real store on disk. */
function viewOf(...items) {
  const work = {};
  for (const item of items) work[item.id] = item;
  return { work };
}

function doingItem(id, extra = {}) {
  return { id, status: 'doing', writer: { id: `session-${id}`, source: 'env' }, claimRole: 'session', ...extra };
}

// --- countWorkerSlots: the pure fold (D2) -----------------------------------

test('countWorkerSlots on an empty view reports zero occupancy and the fixed admin reservation', () => {
  const counts = countWorkerSlots({ work: {} });
  assert.equal(counts.execution.occupied, 0);
  assert.deepEqual(counts.execution.items, []);
  assert.equal(counts.admin.reserved, ADMIN_LANE_RESERVATION);
});

test('countWorkerSlots tolerates a missing view entirely rather than throwing', () => {
  assert.equal(countWorkerSlots(undefined).execution.occupied, 0);
});

test('countWorkerSlots counts only items at doing, never any other status', () => {
  const view = viewOf(
    doingItem('a'),
    doingItem('b'),
    { id: 'c', status: 'todo' },
    { id: 'd', status: 'awaiting-approval' },
    { id: 'e', status: 'blocked' },
    { id: 'f', status: 'awaiting-human' },
    { id: 'g', status: 'done' },
  );
  const counts = countWorkerSlots(view);
  assert.equal(counts.execution.occupied, 2);
  assert.deepEqual(counts.execution.items.map((i) => i.id), ['a', 'b']);
});

test('countWorkerSlots surfaces the session identity and claim role already folded onto the item', () => {
  const view = viewOf(doingItem('a', { claimRole: 'runner' }));
  assert.deepEqual(countWorkerSlots(view).execution.items, [
    { id: 'a', sessionId: 'session-a', claimRole: 'runner' },
  ]);
});

test('countWorkerSlots leaves sessionId undefined when the item carries no writer, instead of throwing', () => {
  const view = viewOf({ id: 'a', status: 'doing', claimRole: 'human' });
  assert.deepEqual(countWorkerSlots(view).execution.items, [
    { id: 'a', sessionId: undefined, claimRole: 'human' },
  ]);
});

test('countWorkerSlots excludeId omits that item — an item already at doing holds its slot already', () => {
  const view = viewOf(doingItem('a'), doingItem('b'));
  assert.equal(countWorkerSlots(view, { excludeId: 'a' }).execution.occupied, 1);
  assert.equal(countWorkerSlots(view, { excludeId: 'nonexistent' }).execution.occupied, 2);
});

// --- hasWorkerSlotRoom: the pre-check face, carrying D8 ----------------------

test('hasWorkerSlotRoom with no ceiling configured always allows, and grants the whole batch', () => {
  const view = viewOf(...Array.from({ length: 50 }, (_, n) => doingItem(`i${n}`)));
  const room = hasWorkerSlotRoom(view, { batchSize: 7 });
  assert.equal(room.allowed, true);
  assert.equal(room.reason, 'no-ceiling-configured');
  assert.equal(room.ceiling, null);
  assert.equal(room.free, null);
  assert.equal(room.granted, 7);
  assert.equal(room.occupied, 50);
});

test('hasWorkerSlotRoom treats a malformed ceiling as no ceiling rather than refusing everything', () => {
  const view = viewOf(doingItem('a'));
  for (const ceiling of [0, -3, 2.5, '4', null, NaN]) {
    const room = hasWorkerSlotRoom(view, { ceiling });
    assert.equal(room.allowed, true, `ceiling ${String(ceiling)} should not refuse`);
    assert.equal(room.reason, 'no-ceiling-configured');
  }
});

test('hasWorkerSlotRoom below the ceiling reports the real free count', () => {
  const view = viewOf(doingItem('a'), doingItem('b'));
  const room = hasWorkerSlotRoom(view, { ceiling: 5 });
  assert.equal(room.allowed, true);
  assert.equal(room.reason, 'room-available');
  assert.equal(room.occupied, 2);
  assert.equal(room.free, 3);
  assert.equal(room.granted, 1);
});

// Supersedes the whole-batch rule, which this test previously asserted as
// `granted === 5`. That rule said a pre-computed batch passes whole while any
// slot is free, overshooting by a bounded margin — but the enforcing gate
// inside claimWork claims ONE item per call and re-folds the log each time,
// so it never had a way to honor a batch grant. Nothing ever overshot: a
// batch of five against one free slot landed one and refused four, every
// time. Trimming here is what stops a launcher standing up four workers that
// die at the claim door.
test('hasWorkerSlotRoom trims a batch to the free slots, because the gate can only ever admit that many', () => {
  const view = viewOf(...Array.from({ length: 7 }, (_, n) => doingItem(`i${n}`)));
  const room = hasWorkerSlotRoom(view, { ceiling: 8, batchSize: 5 });
  assert.equal(room.allowed, true);
  assert.equal(room.free, 1);
  assert.equal(room.granted, 1, 'granting more than free would promise what claimWork refuses');
});

// The claim-door proof for the test above: a grant is advice, the gate
// decides, and it admits exactly `free` — never one more.
test('a batch trimmed to granted is exactly what the claim door actually admits', () => {
  const view = viewOf(...Array.from({ length: 7 }, (_, n) => doingItem(`i${n}`)));
  const room = hasWorkerSlotRoom(view, { ceiling: 8, batchSize: 5 });

  // Simulate dispatching `granted` items: each claim re-reads occupancy the
  // way claimWork does, one at a time.
  let occupied = room.occupied;
  let admitted = 0;
  for (let i = 0; i < room.granted; i += 1) {
    const perClaim = hasWorkerSlotRoom(viewOf(...Array.from({ length: occupied }, (_, n) => doingItem(`i${n}`))), { ceiling: 8 });
    if (!perClaim.allowed) break;
    admitted += 1;
    occupied += 1;
  }
  assert.equal(admitted, room.granted, 'every granted item must survive the claim door');
  assert.equal(occupied, 8, 'and occupancy lands exactly on the ceiling, never past it');
});

test('hasWorkerSlotRoom refuses exactly at the ceiling, so occupancy can never exceed it', () => {
  const view = viewOf(...Array.from({ length: 8 }, (_, n) => doingItem(`i${n}`)));
  const room = hasWorkerSlotRoom(view, { ceiling: 8, batchSize: 5 });
  assert.equal(room.allowed, false);
  assert.equal(room.reason, 'ceiling-reached');
  assert.equal(room.free, 0);
  assert.equal(room.granted, 0);
});

test('hasWorkerSlotRoom past the ceiling clamps free at zero rather than reporting a negative', () => {
  const view = viewOf(...Array.from({ length: 12 }, (_, n) => doingItem(`i${n}`)));
  const room = hasWorkerSlotRoom(view, { ceiling: 8 });
  assert.equal(room.allowed, false);
  assert.equal(room.free, 0);
  assert.equal(room.occupied, 12);
});

test('hasWorkerSlotRoom falls back to a batch of 1 for a malformed batchSize', () => {
  const view = viewOf(doingItem('a'));
  assert.equal(hasWorkerSlotRoom(view, { ceiling: 5, batchSize: 0 }).granted, 1);
  assert.equal(hasWorkerSlotRoom(view, { ceiling: 5, batchSize: -2 }).granted, 1);
});

// --- the enforcing gate inside claimWork -------------------------------------
//
// These live here rather than in test/runner/claim-port.test.mjs because that
// file is outside this item's declared footprint. Each builds its own
// disposable git repo + store, same as claim-port's own fixtures — nothing
// touches this repo's checkout.

function initTempRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-worker-slots-test-'));
  execFileSync('git', ['init', '-q'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: repoRoot });
  return repoRoot;
}

/** assert.throws returns undefined, so capture the error to inspect it. */
function captureThrow(fn) {
  try {
    fn();
  } catch (err) {
    return err;
  }
  assert.fail('expected a throw, got none');
}

/** `occupants` items are created and given an active runtime claim so they
 * hold slots via the effective view (tsk-40m: `todo -> doing` is retired
 * from status-fsm.mjs's TRANSITIONS -- nothing durably writes into `doing`
 * anymore, not even a test's own direct moveWork shortcut; a real
 * acquireClaim is the only way an item now reads as effective 'doing'). */
function setup({ ceiling, occupants = 0 } = {}) {
  const repoRoot = initTempRepo();
  const dir = path.join(repoRoot, '.fgos');
  initStore(dir);
  addWork(dir, { id: 'target', title: 'Target', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  for (let n = 0; n < occupants; n++) {
    const id = `busy-${n}`;
    addWork(dir, { id, title: `Busy ${n}`, kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
    acquireClaim(dir, { id, actor: 'session', preClaimStatus: 'todo', claimRole: 'session' });
  }
  if (ceiling !== undefined) {
    fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify({ workerSlots: { ceiling } }));
  }
  return { repoRoot, dir };
}

test('claimWork is unchanged when no workerSlots config exists, however many items are already running', () => {
  const { repoRoot, dir } = setup({ occupants: 20 });
  const claim = claimWork(dir, { id: 'target', actor: 'session', isolate: false, repoRoot });
  assert.equal(claim.to, 'doing');
  assert.equal(listWork(dir).work.target.status, 'doing');
});

test('claimWork refuses once the configured ceiling is reached', () => {
  const { repoRoot, dir } = setup({ ceiling: 2, occupants: 2 });
  const err = captureThrow(() => claimWork(dir, { id: 'target', actor: 'session', isolate: false, repoRoot }));
  assert.ok(err instanceof ClaimError);
  assert.equal(err.code, 'worker-slot-ceiling');
  assert.match(err.message, /worker-slot ceiling reached/);
  assert.equal(err.occupied, 2);
  assert.equal(err.ceiling, 2);
});

test('a ceiling refusal is categorised validation, so the runner halts one item instead of crashing its drain-run', () => {
  const { repoRoot, dir } = setup({ ceiling: 1, occupants: 1 });
  const err = captureThrow(() => claimWork(dir, { id: 'target', actor: 'runner', isolate: false, repoRoot }));
  assert.equal(err.category, 'validation');
});

test('claimWork still allows a claim while the ceiling has room', () => {
  const { repoRoot, dir } = setup({ ceiling: 5, occupants: 2 });
  const claim = claimWork(dir, { id: 'target', actor: 'session', isolate: false, repoRoot });
  assert.equal(claim.to, 'doing');
});

test('the ceiling refusal happens BEFORE moveWork, leaving the item at todo rather than orphaned at doing', () => {
  const { repoRoot, dir } = setup({ ceiling: 1, occupants: 1 });
  assert.throws(() => claimWork(dir, { id: 'target', actor: 'session', isolate: false, repoRoot }), ClaimError);
  assert.equal(listWork(dir).work.target.status, 'todo');
});

test('the gate fires uniformly for isolate:true (pick), not only for the isolate:false take path', () => {
  const { repoRoot, dir } = setup({ ceiling: 1, occupants: 1 });
  const err = captureThrow(() => claimWork(dir, {
    id: 'target',
    actor: 'session',
    isolate: true,
    repoRoot,
    worktreeDir: path.join(repoRoot, '.claude', 'worktrees'),
  }));
  assert.equal(err.code, 'worker-slot-ceiling');
  assert.equal(listWork(dir).work.target.status, 'todo');
});

test('every claim actor is subject to the gate — a worker holds a slot regardless of who launched it', () => {
  for (const actor of ['session', 'runner', 'human']) {
    const { repoRoot, dir } = setup({ ceiling: 1, occupants: 1 });
    const err = captureThrow(() => claimWork(dir, { id: 'target', actor, isolate: false, repoRoot }));
    assert.equal(err.code, 'worker-slot-ceiling', `actor ${actor} should be gated`);
  }
});

// --- the CLI port (decision 0014: the CLI is the door) -----------------------

// `--dir` is the project root; the CLI resolves `.fgos` underneath it.
function runFgos(repoRoot, args) {
  const out = execFileSync('node', [FGOS_BIN, ...args, '--dir', repoRoot], { encoding: 'utf8' });
  return JSON.parse(out).data;
}

test('fgos slots reports occupancy, the admin reservation, and no ceiling when none is configured', () => {
  const { repoRoot } = setup({ occupants: 3 });
  const data = runFgos(repoRoot, ['slots', '--json']);
  assert.equal(data.execution.occupied, 3);
  assert.equal(data.execution.ceiling, null);
  assert.equal(data.execution.hasRoom, true);
  assert.equal(data.execution.reason, 'no-ceiling-configured');
  assert.equal(data.admin.reserved, ADMIN_LANE_RESERVATION);
});

test('fgos slots reports no room once the configured ceiling is reached', () => {
  const { repoRoot } = setup({ ceiling: 2, occupants: 2 });
  const data = runFgos(repoRoot, ['slots', '--json']);
  assert.equal(data.execution.ceiling, 2);
  assert.equal(data.execution.free, 0);
  assert.equal(data.execution.hasRoom, false);
  assert.equal(data.execution.reason, 'ceiling-reached');
});

test('fgos report lands a driver closing report on the item, readable through fgos show', () => {
  const { repoRoot } = setup();
  const written = runFgos(repoRoot, ['report', 'target', '--text', 'returned, verify green', '--stop-reason', 'awaiting-approval']);
  assert.equal(written.id, 'target');
  assert.equal(written.stopReason, 'awaiting-approval');

  const shown = runFgos(repoRoot, ['show', 'target', '--json']);
  const reports = shown.decisions.filter((d) => d.source === 'driver-report');
  assert.equal(reports.length, 1);
  assert.equal(reports[0].text, 'returned, verify green');
  assert.match(reports[0].rationale, /awaiting-approval/);
});

test('fgos report supplies its own rationale when no stop reason is given, since addDecision requires one', () => {
  const { repoRoot } = setup();
  const written = runFgos(repoRoot, ['report', 'target', '--text', 'closing note']);
  assert.equal(written.stopReason, null);
  const shown = runFgos(repoRoot, ['show', 'target', '--json']);
  const report = shown.decisions.find((d) => d.source === 'driver-report');
  assert.ok(report.rationale.trim().length > 0);
});

// The shared config is an edit-the-file-by-hand surface, so a half-typed edit
// is an ordinary state. Before the ceiling existed, take/pick never read that
// file at all; reading it bare made a broken one throw an UNCATEGORIZED error
// straight through claimWork — exit 1 with a raw stack instead of the
// validation code, and a whole runner drain-run dying with it.
test('a shared config that is not valid JSON leaves claiming alive: no ceiling, no crash', () => {
  const { repoRoot, dir } = setup();
  fs.writeFileSync(path.join(dir, 'config.json'), '{ not json');

  claimWork(dir, { id: 'target', actor: 'session', isolate: false, repoRoot });

  assert.equal(
    listWork(dir).work.target.status,
    'doing',
    'an unreadable config must read as "no ceiling", exactly like an absent one',
  );
});

// --- the registered config default ------------------------------------------

test('the worker-slot ceiling is registered as a config default so fgos setup writes it and doctor sees it', async () => {
  const { CONFIG_DEFAULT_REGISTRATIONS } = await import('../../src/setup/registrations.mjs');
  const entry = CONFIG_DEFAULT_REGISTRATIONS.find((e) => e.id === 'workerSlots');
  assert.ok(entry, 'workerSlots must be registered via registerConfigDefault');
  assert.equal(entry.key, 'workerSlots');
  assert.deepEqual(entry.shape, { ceiling: null });
});

// The regression that matters most about that shape: `fgos doctor` tells
// every project to run `fgos setup` as ordinary maintenance, so whatever
// setup writes is armed on a command nobody runs meaning "cap me now". This
// repo was carrying 12 running items when the ceiling shipped; had setup
// written the recommended 8, the very next take/pick would have been
// refused and the backlog frozen. Asserting the shape alone would not catch
// a future edit that puts a number back, so assert the CONSEQUENCE.
test('what fgos setup writes leaves every claim allowed, however many items are already running', async () => {
  const { CONFIG_DEFAULT_REGISTRATIONS } = await import('../../src/setup/registrations.mjs');
  const { shape } = CONFIG_DEFAULT_REGISTRATIONS.find((e) => e.id === 'workerSlots');

  const work = {};
  for (let i = 0; i < DEFAULT_WORKER_SLOT_CEILING * 3; i += 1) {
    work[`tsk-busy${i}`] = { status: 'doing' };
  }
  const room = hasWorkerSlotRoom({ work }, { ceiling: shape.ceiling });

  assert.equal(room.allowed, true, 'a fresh `fgos setup` must never refuse a claim');
  assert.equal(room.reason, 'no-ceiling-configured');
});

// The admin reservation is constant by definition (D9): the lane never
// claims a work item, so nothing counts it and nothing could enforce a
// different number. It was briefly a `workerSlots.adminReservation` config
// key that setup wrote, doctor displayed, and no code ever read.
test('the admin reservation is reported as a constant, never offered as a config knob', async () => {
  const { CONFIG_DEFAULT_REGISTRATIONS } = await import('../../src/setup/registrations.mjs');
  const { shape } = CONFIG_DEFAULT_REGISTRATIONS.find((e) => e.id === 'workerSlots');

  assert.equal('adminReservation' in shape, false, 'a dial wired to nothing is worse than no dial');
  assert.equal(countWorkerSlots({ work: {} }).admin.reserved, ADMIN_LANE_RESERVATION);
});
