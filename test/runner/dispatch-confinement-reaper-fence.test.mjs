// Acceptance cases for the confinement orphan reaper fence (backlog p-c3a41d07).
//
// The defect: the orphan reaper can remove the private home (and, through stopProcesses, end the
// processes) of a herdr worker that is still running, because the pane a worker runs in never reaches
// the home's ownership marker, the reaper decides on a marker it read before the controller acted, and
// nothing stops a controller from launching into a home a reaper already decided to remove.
//
// Every case runs the real reaper (`reapOrphanedConfinementResources`) and the real finalizer
// (`finalizeConfinementResources`) on real temp directories. OS facts are injected through the seams
// the reaper already has: `checkLiveness` (is the controller pid alive) and `checkPaneOpen` (is the
// pane open: true / false / null when herdr cannot be asked). Interleavings are driven from those two
// callbacks, which the reaper calls after its decision read of the marker, and from a one-shot wrap of
// `fs.rmSync`, which runs after the removal's own marker re-read and right before the home is deleted.
// The reaper has no clock seam; ages are set by backdating the marker's timestamps with minute-scale
// margins, so the outcome does not depend on how long a test takes.
//
// Two kinds of cases:
//   - plain tests: the contract the lite fence ships (bind before launch, launch record, bind-anchored
//     keep window, recorded herdr endpoint, re-read before destroy, finalizer field contract, cli-spawn
//     supervisor binding); the cases named REGRESSION were red before it;
//   - `test.todo`: the case needs part (ii) (bind refusal, launch and post-launch checks, exclusive
//     reclaim claim), deferred to the run supervisor + holder-lock component; the name says so.
//
// Never kills a real worker or touches a real home: the worker is modelled, every directory is under a
// fresh mkdtemp, and the processes spawned are mock herdr scripts that only print JSON and short-lived
// node children standing in for a run supervisor.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

import {
  reapOrphanedConfinementResources,
  writeOwnershipMarker,
  extendOwnershipMarker,
  readOwnershipMarker,
  markResourceRetained,
  ensurePrivateDir,
  RUN_SETTLE_GRACE_MS,
  LAUNCH_GRACE_MS,
  bindOwnershipMarker,
  markOwnershipLaunched,
} from '../../src/runner/dispatch/confinement/cleanup.mjs';
import { finalizeConfinementResources, bindingForPrepared } from '../../src/runner/dispatch/confinement/authority.mjs';
import { computeSha256Digest } from '../../src/runner/dispatch/proof-helpers.mjs';
import { RUN_TIMEOUT_MAX_MS } from '../../src/runner/dispatch/run-timeout.mjs';
import { herdrEndpointForEnv, socketPathForSession } from '../../src/runner/dispatch/worker-session.mjs';
import { EXECUTOR_ADAPTERS, bindConfinedHomesToSupervisor } from '../../src/runner/dispatch/transport.mjs';

const MIN = 60_000;
const HOUR = 60 * MIN;
const MAX_AGE_MS = HOUR; // the reaper's default maxAgeMs
const CONTROLLER_PID = 424242; // never signalled: liveness is injected

// ---------------------------------------------------------------------------------------------
// Fixtures

function workspace() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-s2-fence-'));
  const root = path.join(tmp, 'fgos-confinement');
  return { tmp, root, cleanup: () => fs.rmSync(tmp, { recursive: true, force: true }) };
}

/** A private home as Confinement Authority prepares it (bwrap prepare: ensurePrivateDir + marker). */
function preparedHome(w, { dispatchId = 'disp_s2', timeoutMs, ageMs = 0 } = {}) {
  const dir = path.join(w.root, dispatchId, 'home');
  ensurePrivateDir(dir, { root: w.root });
  writeOwnershipMarker(dir, { dispatchId, pid: CONTROLLER_PID, timeoutMs });
  if (ageMs) extendOwnershipMarker(dir, { createdAt: new Date(Date.now() - ageMs).toISOString() });
  fs.writeFileSync(path.join(dir, 'auth.json'), '{"fake":"login copy"}');
  return dir;
}

/**
 * The marker state item 1a (i) leaves, written by the real Confinement Authority functions: the binding
 * (paneId, the herdr endpoint the launching client used, the binder's pid and boundAt) and, unless
 * `launched: false`, the launch record written right before `pane run`. Used as a PRECONDITION for
 * reaper-rule cases.
 */
function writeBindingFixture(dir, { paneId = 'w1:p7', endpoint = '/run/herdr/default.sock', binderPid = CONTROLLER_PID, boundAtMs = Date.now(), launched = true } = {}) {
  bindOwnershipMarker(dir, { paneId, herdrEndpoint: endpoint, binderPid, binderStartTime: null, boundAt: new Date(boundAtMs).toISOString() });
  if (launched) markOwnershipLaunched(dir, { launchedAt: new Date(boundAtMs).toISOString() });
}

/**
 * The controller between prepare and worker launch with the lite fence (herdr-round.mjs pre-run site):
 *   bind    -> Confinement Authority's bind (bindOwnershipMarker), for every confined round;
 *   launch  -> the launch record (markOwnershipLaunched) written right before `pane run`.
 * There is no launch check and no post-launch check: those belong to part (ii), deferred to the run
 * supervisor + holder-lock component, so a launch is always allowed here.
 */
const controllerWithLiteFence = Object.freeze({
  bind(dir, { paneId }) { bindOwnershipMarker(dir, { paneId, herdrEndpoint: '/run/herdr/default.sock', binderPid: CONTROLLER_PID, binderStartTime: null }); },
  launch(dir) { markOwnershipLaunched(dir); return true; },
});

function reap(w, { alive, pane, maxAgeMs = MAX_AGE_MS, onLiveness, onPane, onClose } = {}) {
  return reapOrphanedConfinementResources({
    tempRoot: w.root,
    maxAgeMs,
    checkLiveness: (pid) => {
      onLiveness?.(pid);
      return typeof alive === 'function' ? alive(pid) : alive;
    },
    checkPaneOpen: pane === undefined ? undefined : (paneId, session, endpoint) => {
      onPane?.(paneId, session, endpoint);
      return typeof pane === 'function' ? pane(paneId, session, endpoint) : pane;
    },
    // Never a real herdr: a pane close is recorded, not sent.
    closePane: (paneId, session, endpoint) => onClose?.(paneId, session, endpoint),
  });
}

/**
 * Run `fn` with a one-shot hook placed after the removal path's own marker re-read
 * (cleanupConfinementResource) and stopProcessesInside, right before `dir` is deleted. This is
 * the window RT2-1 uses: the reaper has decided and re-read an identical marker, the home still exists.
 */
function withHookBeforeDeletionOf(dir, hook, fn) {
  const realRmSync = fs.rmSync;
  fs.rmSync = function patchedRmSync(target, ...rest) {
    if (path.resolve(String(target)) === path.resolve(dir)) {
      fs.rmSync = realRmSync;
      hook();
    }
    return realRmSync.call(this, target, ...rest);
  };
  try { return fn(); } finally { fs.rmSync = realRmSync; }
}

const exists = (dir) => fs.existsSync(dir);

// ---------------------------------------------------------------------------------------------
// (1) Controller killed before binding, after binding before pane run, after pane run.

test('S2(1) controller killed before binding: no pane, no worker -> the home is reaped', () => {
  const w = workspace();
  try {
    const dir = preparedHome(w, { timeoutMs: HOUR });
    const result = reap(w, { alive: false, pane: () => assert.fail('an unbound home has no pane to ask about') });
    assert.equal(exists(dir), false);
    assert.equal(result.reaped[0]?.reason, 'process-dead');
  } finally { w.cleanup(); }
});

test('S2(1) controller killed after binding, before pane run (no launchedAt): the home is reaped and its empty pane closed, whatever the pane answers', () => {
  const w = workspace();
  try {
    const dir = preparedHome(w, { timeoutMs: HOUR, ageMs: 2 * MIN });
    writeBindingFixture(dir, { boundAtMs: Date.now() - MIN, launched: false });
    const closed = [];
    const result = reap(w, { alive: false, pane: true, onClose: (paneId, session, endpoint) => closed.push({ paneId, session, endpoint }) });
    assert.equal(exists(dir), false, 'no worker was ever launched into the home: nothing keeps it');
    assert.equal(result.reaped[0]?.reason, 'bound-never-launched');
    assert.deepEqual(closed, [{ paneId: 'w1:p7', session: null, endpoint: '/run/herdr/default.sock' }], 'the empty pane is closed on the endpoint the binding recorded');
  } finally { w.cleanup(); }
});

test('S2(1) bound, binder alive, no launchedAt yet: kept inside the bind-anchored window (the binder may still be launching)', () => {
  const w = workspace();
  try {
    const dir = preparedHome(w, { timeoutMs: HOUR, ageMs: 2 * MIN });
    writeBindingFixture(dir, { boundAtMs: Date.now() - MIN, launched: false });
    const closed = [];
    reap(w, { alive: true, pane: false, onClose: (paneId) => closed.push(paneId) });
    assert.equal(exists(dir), true);
    assert.deepEqual(closed, []);
  } finally { w.cleanup(); }
});

test('S2(1) REGRESSION controller killed after pane run, worker alive in its pane: the home must survive (p-c3a41d07)', () => {
  const w = workspace();
  try {
    const dir = preparedHome(w, { timeoutMs: HOUR, ageMs: 2 * MIN });
    const controller = controllerWithLiteFence;
    const worker = { launched: false, paneOpen: false };
    controller.bind(dir, { paneId: 'w1:p7' });
    if (controller.launch(dir)) { worker.launched = true; worker.paneOpen = true; }
    // The controller dies now; the worker keeps running in its open pane.
    reap(w, { alive: false, pane: (paneId) => (paneId === 'w1:p7' ? worker.paneOpen : false) });
    assert.equal(worker.launched, true);
    assert.equal(exists(dir), true, 'the reaper removed the home of a worker still running in an open pane');
  } finally { w.cleanup(); }
});

test('S2(1) controller killed after pane run, home bound as 1a(i) specifies: the dead binder\'s home is kept while its pane is open', () => {
  const w = workspace();
  try {
    const dir = preparedHome(w, { timeoutMs: HOUR, ageMs: 2 * MIN });
    writeBindingFixture(dir, { boundAtMs: Date.now() - MIN });
    reap(w, { alive: false, pane: true });
    assert.equal(exists(dir), true);
  } finally { w.cleanup(); }
});

// ---------------------------------------------------------------------------------------------
// (2) Reaper decided on an unbound marker; bind + launch + controller death happen before it acts.

test('S2(2) REGRESSION reaper reads the unbound marker, then bind + launch + controller death before its liveness check: the home must survive (V14)', () => {
  const w = workspace();
  try {
    const dir = preparedHome(w, { timeoutMs: HOUR, ageMs: 2 * MIN });
    const worker = { launched: false };
    // checkLiveness runs after the reaper's decision read and before the removal: the controller
    // binds (the state 1a(i) leaves), launches, and dies in between.
    reap(w, {
      alive: () => {
        writeBindingFixture(dir, { boundAtMs: Date.now() });
        worker.launched = true;
        return false;
      },
      pane: true,
    });
    assert.equal(worker.launched, true);
    assert.equal(exists(dir), true, 'the reaper removed a home whose marker, re-read before removal, names a live pane');
    assert.equal(readOwnershipMarker(dir)?.paneId, 'w1:p7');
  } finally { w.cleanup(); }
});

// ---------------------------------------------------------------------------------------------
// (2b) Live-but-expired controller (RT2-1): unbound home past max(maxAgeMs, timeout + settle grace),
// controller alive.

const RT2_1 = { timeoutMs: HOUR, ageMs: 2 * HOUR }; // isPastRun: 2h > max(1h, 1h + 10m)

// RT2-1 (bind and launch landing after the reaper's identical re-read, before deletion) needs either the
// bind refusal past the creation-anchored window or an exclusive reclaim claim: both are part (ii). The
// case stays named, unrun, until that component exists; withHookBeforeDeletionOf is kept for it.
void withHookBeforeDeletionOf;
test.todo('S2(2b) RT2-1: controller binds and launches after the reaper\'s identical re-read and before deletion; never a launched worker whose home is removed — needs run supervisor + holder-lock (deferred part ii)');

test('S2(2b) REGRESSION mirrored order: controller binds and passes its check first, the reaper comes after and must keep the home', () => {
  const w = workspace();
  try {
    const dir = preparedHome(w, RT2_1);
    const controller = controllerWithLiteFence;
    const worker = { launched: false };
    controller.bind(dir, { paneId: 'w1:p7' });
    if (controller.launch(dir)) worker.launched = true;
    reap(w, { alive: true, pane: null });
    assert.ok(!(worker.launched && !exists(dir)), 'the reaper removed the home of a worker its live controller had just launched');
  } finally { w.cleanup(); }
});

test.todo('S2(2b) a binder whose home is past its creation-anchored run window refuses to bind: pane closed, round fails, no worker — needs run supervisor + holder-lock (deferred part ii)');

// ---------------------------------------------------------------------------------------------
// (2c) Bound-marker read, binder alive, home past its creation-anchored window, pane answer null.
// Created 75m ago (past max(1h, 1h + 10m)), bound 9m after creation (inside that window, so a 1a binder
// was allowed to bind), 66m since binding: inside boundAt + max(maxAgeMs, launch grace + 1h + 10m).

function boundPastCreationWindow(w) {
  const dir = preparedHome(w, { timeoutMs: HOUR, ageMs: 75 * MIN });
  writeBindingFixture(dir, { boundAtMs: Date.now() - 66 * MIN });
  return dir;
}

test('S2(2c) REGRESSION bound marker, binder alive inside its bind-anchored window, pane answer null: the home is kept (RV3-1 / RT-R1-1 case1A, case1B)', () => {
  const w = workspace();
  try {
    const dir = boundPastCreationWindow(w);
    reap(w, { alive: true, pane: null });
    assert.equal(exists(dir), true, 'an unanswerable pane check let expiry remove a live binder\'s home inside its window');
  } finally { w.cleanup(); }
});

test('S2(2c) REGRESSION same, pane answer false (wrong or other server\'s socket): ignored inside the window, the home is kept', () => {
  const w = workspace();
  try {
    const dir = boundPastCreationWindow(w);
    reap(w, { alive: true, pane: false });
    assert.equal(exists(dir), true);
  } finally { w.cleanup(); }
});

test.todo('S2(2c) a controller already past the creation-anchored window refuses to bind: pane closed, no worker — needs run supervisor + holder-lock (deferred part ii)');

// ---------------------------------------------------------------------------------------------
// (2d) Post-launch check.

test.todo('S2(2d) a launch whose post-launch check finds the marker or home gone, or a claim present, closes the pane and fails the round, never accepting a result — needs run supervisor + holder-lock (deferred part ii)');

// ---------------------------------------------------------------------------------------------
// (3) Active binding, binder alive, run timeout 4h. Bound 1 minute after creation, so every age
// below up to timeout + settle grace + 1s from creation is inside the bind-anchored window for
// any launch grace >= 0.

const TIMEOUT_4H = 4 * HOUR;
assert.ok(TIMEOUT_4H <= RUN_TIMEOUT_MAX_MS, 'a 4h run timeout is allowed (RUN_TIMEOUT_MAX_MS)');

const ages = [
  ['age 2h', 2 * HOUR],
  ['just past maxAgeMs', MAX_AGE_MS + 1000],
  ['just past timeout + settle grace', TIMEOUT_4H + RUN_SETTLE_GRACE_MS + 1000],
];
for (const [label, ageMs] of ages) {
  for (const answer of [null, true, false]) {
    // Today: true keeps; null keeps only while not expired (every age here is expired); false reaps.
    test(`S2(3) ${answer === true ? '' : 'REGRESSION '}binder alive, timeout 4h, ${label}, pane answer ${answer}: kept inside the bind-anchored window`, () => {
      const w = workspace();
      try {
        const dir = preparedHome(w, { timeoutMs: TIMEOUT_4H, ageMs });
        writeBindingFixture(dir, { boundAtMs: Date.now() - ageMs + MIN });
        reap(w, { alive: true, pane: answer });
        assert.equal(exists(dir), true, `a live binder's home was removed inside its window (pane answer ${answer})`);
      } finally { w.cleanup(); }
    });
  }
}

// After the window (bound one hour past timeout + settle grace ago; assumes launch grace < 1h, the
// packet calls it "short") the pane answer decides (iii): true keeps, null falls to expiry, false reaps.
// Same for a dead binder. These hold today and must keep holding.
for (const [who, alive, sinceBindMs] of [
  ['binder alive, past its bind-anchored window', true, TIMEOUT_4H + RUN_SETTLE_GRACE_MS + HOUR],
  ['binder dead, age 2h', false, 2 * HOUR],
]) {
  for (const [answer, kept] of [[true, true], [null, false], [false, false]]) {
    test(`S2(3) ${who}, pane answer ${answer}: ${kept ? 'kept' : 'reaped'} per (iii)`, () => {
      const w = workspace();
      try {
        const dir = preparedHome(w, { timeoutMs: TIMEOUT_4H, ageMs: sinceBindMs + MIN });
        writeBindingFixture(dir, { boundAtMs: Date.now() - sinceBindMs });
        reap(w, { alive, pane: answer });
        assert.equal(exists(dir), kept);
      } finally { w.cleanup(); }
    });
  }
}

// ---------------------------------------------------------------------------------------------
// (4) Retained marker (retainedAt): today's pane rule, whatever the binder's liveness.

for (const [label, ageMs, answer, alive, kept] of [
  ['pane open, past expiry', 2 * HOUR, true, false, true],
  ['pane open, binder alive', 2 * HOUR, true, true, true],
  ['pane unanswerable, not expired', 10 * MIN, null, false, true],
  ['pane unanswerable, expired', 2 * HOUR, null, true, false],
  ['pane closed, not expired, binder alive', 10 * MIN, false, true, false],
]) {
  test(`S2(4) retained marker, ${label}: ${kept ? 'kept' : 'reaped'} (unchanged from today)`, () => {
    const w = workspace();
    try {
      const dir = preparedHome(w, { timeoutMs: HOUR, ageMs });
      assert.equal(markResourceRetained(dir, { paneId: 'w1:p7', herdrSession: 'fgos-s2' }), true);
      assert.ok(readOwnershipMarker(dir).retainedAt);
      reap(w, { alive, pane: answer });
      assert.equal(exists(dir), kept);
    } finally { w.cleanup(); }
  });
}

// ---------------------------------------------------------------------------------------------
// (5) Finalizer field contract.

async function finalizeWithPrepareDigest(w, dir, digest) {
  const runDir = path.join(w.tmp, 'run');
  fs.mkdirSync(runDir, { recursive: true });
  return finalizeConfinementResources({
    runDir,
    launchCommandId: 'launch_s2',
    receipt: { completion: { kind: 'exited' } },
    descriptor: { resources: [{ kind: 'temporary-directory', pathRef: dir, ownershipMarkerDigest: digest }] },
  });
}

test('S2(5) a home bound with exactly the authorized fields finalizes and is cleaned', async () => {
  const w = workspace();
  try {
    const dir = preparedHome(w, { timeoutMs: HOUR });
    const digest = computeSha256Digest(readOwnershipMarker(dir));
    writeBindingFixture(dir, { binderPid: CONTROLLER_PID + 1 });
    // A rebinding by another binder, with a session and a start time, is still only authorized fields.
    bindOwnershipMarker(dir, { paneId: 'w1:p8', herdrEndpoint: '/run/herdr/s.sock', herdrSession: 'fgos-s2', binderPid: CONTROLLER_PID + 2, binderStartTime: '12345' });
    const result = await finalizeWithPrepareDigest(w, dir, digest);
    assert.equal(result.cleanupState, 'cleaned', `finalizer said ${JSON.stringify(result.cleanupResult)}`);
    assert.equal(exists(dir), false);
  } finally { w.cleanup(); }
});

test('S2(5) a cli-spawn binding (supervisor pid, no pane) finalizes and is cleaned', async () => {
  const w = workspace();
  try {
    const dir = preparedHome(w, { timeoutMs: HOUR });
    const digest = computeSha256Digest(readOwnershipMarker(dir));
    bindOwnershipMarker(dir, { binderPid: CONTROLLER_PID + 3, binderStartTime: null });
    const result = await finalizeWithPrepareDigest(w, dir, digest);
    assert.equal(result.cleanupState, 'cleaned', `finalizer said ${JSON.stringify(result.cleanupResult)}`);
  } finally { w.cleanup(); }
});

test('S2(5) a bound home whose prepare-time pid was rewritten: still ownership-marker-mismatch (binding never rewrites pid)', async () => {
  const w = workspace();
  try {
    const dir = preparedHome(w, { timeoutMs: HOUR });
    const digest = computeSha256Digest(readOwnershipMarker(dir));
    writeBindingFixture(dir);
    extendOwnershipMarker(dir, { pid: CONTROLLER_PID + 9 });
    const result = await finalizeWithPrepareDigest(w, dir, digest);
    assert.equal(result.cleanupResult?.reason, 'ownership-marker-mismatch');
    assert.equal(exists(dir), true);
  } finally { w.cleanup(); }
});

for (const [label, change] of [
  ['an unauthorized new field', { evil: 'x' }],
  ['a changed dispatchId', { dispatchId: 'disp_other' }],
  ['a changed resource kind', { resource: 'scratch' }],
  ['a changed createdAt', { createdAt: new Date(0).toISOString() }],
]) {
  test(`S2(5) bound home whose marker also carries ${label}: still ownership-marker-mismatch, home kept`, async () => {
    const w = workspace();
    try {
      const dir = preparedHome(w, { timeoutMs: HOUR });
      const digest = computeSha256Digest(readOwnershipMarker(dir));
      writeBindingFixture(dir);
      extendOwnershipMarker(dir, change);
      const result = await finalizeWithPrepareDigest(w, dir, digest);
      assert.equal(result.cleanupResult?.reason, 'ownership-marker-mismatch');
      assert.equal(exists(dir), true);
    } finally { w.cleanup(); }
  });
}

test.todo('S2(5) a bound marker whose binding fields disagree with the launch record (paneId, endpoint) is ownership-marker-mismatch — the comparison against the launch record is not in the owner-approved lite scope of (iv)');

// ---------------------------------------------------------------------------------------------
// (6) Exclusion under multiplicity. The re-read before destroy (V14) exists; the reclaim claim does not.

test.todo('S2(6) two reaper passes from different processes against one home: at most one commits a claim, the other backs off; the home is removed at most once — needs run supervisor + holder-lock (deferred part ii)');

test('S2(6) a resuming controller rebinds with its own pid after the reaper decided on the first binding: the reaper skips on its re-read', () => {
  const w = workspace();
  try {
    const dir = preparedHome(w, { timeoutMs: HOUR, ageMs: 2 * HOUR });
    writeBindingFixture(dir, { boundAtMs: Date.now() - 90 * MIN });
    // First binder dead, pane answers closed: the reaper decides to reap. Before it destroys, a resuming
    // controller rebinds the home with its own pid.
    const result = reap(w, {
      alive: false,
      pane: () => {
        bindOwnershipMarker(dir, { paneId: 'w1:p7', herdrEndpoint: '/run/herdr/default.sock', binderPid: CONTROLLER_PID + 1, binderStartTime: null });
        return false;
      },
    });
    assert.equal(exists(dir), true);
    assert.equal(result.skipped.find((s) => s.path === dir)?.reason, 'marker-changed');
    assert.equal(readOwnershipMarker(dir).binderPid, CONTROLLER_PID + 1);
  } finally { w.cleanup(); }
});

test.todo('S2(6) a stale claim left by a reaper that crashed after claiming makes the controller refuse launch (fail closed) — needs run supervisor + holder-lock (deferred part ii)');
test.todo('S2(6) a later pass takes over a stale claim only once its recorded claimant pid is provably dead, never while it lives, then runs its own read, claim and re-read — needs run supervisor + holder-lock (deferred part ii)');

// ---------------------------------------------------------------------------------------------
// (7) The pane check queries the endpoint the round actually used. Mock herdr: a script on
// FGOS_HERDR_BIN that logs the endpoint it was asked on and prints a pane list.

function withMockHerdr(w, fn) {
  const bin = path.join(w.tmp, 'mock-herdr.sh');
  const log = path.join(w.tmp, 'mock-herdr.log');
  const panes = path.join(w.tmp, 'mock-herdr-panes.json');
  fs.writeFileSync(bin, [
    '#!/bin/sh',
    'printf \'%s|%s|%s\\n\' "$*" "${HERDR_SESSION-unset}" "${HERDR_SOCKET_PATH-unset}" >> "$S2_HERDR_LOG"',
    'cat "$S2_HERDR_PANES"',
    '',
  ].join('\n'), { mode: 0o700 });
  const setPanes = (ids) => fs.writeFileSync(panes, JSON.stringify({ result: { panes: ids.map((pane_id) => ({ pane_id })) } }));
  setPanes([]);
  const saved = { FGOS_HERDR_BIN: process.env.FGOS_HERDR_BIN, S2_HERDR_LOG: process.env.S2_HERDR_LOG, S2_HERDR_PANES: process.env.S2_HERDR_PANES };
  Object.assign(process.env, { FGOS_HERDR_BIN: bin, S2_HERDR_LOG: log, S2_HERDR_PANES: panes });
  try {
    return fn({ setPanes, calls: () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').filter(Boolean) : []) });
  } finally {
    for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
}

test('S2(7) control: a retained home whose session is named is asked on that session and follows the pane (mock herdr)', () => {
  const w = workspace();
  try {
    withMockHerdr(w, ({ setPanes, calls }) => {
      const dir = preparedHome(w, { timeoutMs: HOUR, ageMs: 2 * HOUR });
      markResourceRetained(dir, { paneId: 'w1:p7', herdrSession: 'fgos-s2' });
      setPanes(['w1:p7']);
      reap(w, { alive: false });
      assert.equal(exists(dir), true, 'open pane keeps the home past expiry');
      assert.match(calls()[0] ?? '', /^pane list\|fgos-s2\|/);
      setPanes([]);
      reap(w, { alive: false });
      assert.equal(exists(dir), false, 'closed pane releases it');
    });
  } finally { w.cleanup(); }
});

test('S2(7) REGRESSION default-session round (HERDR_SESSION unset): the binding records the endpoint actually used, so the reaper asks herdr there and keeps the home while the pane is open (V24)', () => {
  const w = workspace();
  try {
    withMockHerdr(w, ({ setPanes, calls }) => {
      const dir = preparedHome(w, { timeoutMs: HOUR, ageMs: 2 * HOUR });
      // A default-session round: the client env names no session, so the endpoint is the socket herdr
      // itself falls back to. The binding records it before launch; a later retain (authority.mjs, with
      // round.herdrSession null) keeps it.
      const endpoint = herdrEndpointForEnv({ HOME: '/home/s2-user' });
      assert.deepEqual(endpoint, { herdrEndpoint: socketPathForSession('default', { home: '/home/s2-user' }), herdrSession: null });
      bindOwnershipMarker(dir, { paneId: 'w1:p7', ...endpoint, binderPid: CONTROLLER_PID, binderStartTime: null });
      markOwnershipLaunched(dir);
      markResourceRetained(dir, { paneId: 'w1:p7', herdrSession: null });
      setPanes(['w1:p7']);
      reap(w, { alive: false, pane: undefined });
      assert.ok(calls().length > 0, 'the reaper never asked herdr: a default-session pane is unaskable');
      assert.equal(calls()[0], `pane list|unset|${endpoint.herdrEndpoint}`, 'asked on the recorded socket, with no session assumed');
      assert.equal(exists(dir), true, 'an open default-session pane lost its home to expiry');
      setPanes([]);
      reap(w, { alive: false, pane: undefined });
      assert.equal(exists(dir), false, 'closed pane releases it');
    });
  } finally { w.cleanup(); }
});

test('S2(7) herdrEndpointForEnv: the socket path the client env names wins, then its named session, never an assumed session name', () => {
  assert.deepEqual(herdrEndpointForEnv({ HOME: '/h', HERDR_SOCKET_PATH: '/x/cockpit.sock', HERDR_SESSION: 'ops' }), { herdrEndpoint: '/x/cockpit.sock', herdrSession: 'ops' });
  assert.deepEqual(herdrEndpointForEnv({ HOME: '/h', HERDR_SOCKET_PATH: '/x/cockpit.sock' }), { herdrEndpoint: '/x/cockpit.sock', herdrSession: null });
  assert.deepEqual(herdrEndpointForEnv({ HOME: '/h', HERDR_SESSION: 'fgos-worker' }), { herdrEndpoint: '/h/.config/herdr/sessions/fgos-worker/herdr.sock', herdrSession: 'fgos-worker' });
  assert.deepEqual(herdrEndpointForEnv({ HOME: '/h' }), { herdrEndpoint: '/h/.config/herdr/herdr.sock', herdrSession: null });
});

test.todo('S2(7) live, not mocked: defaultPaneOpen against the endpoint recorded for a real default-session pane returns true while it is open and false after it closes [needs a live herdr; out of scope for a deterministic suite]');

// ---------------------------------------------------------------------------------------------
// (8) Plumbing authority -> transport -> herdr-round. A confined herdr-spawn round driven through the
// real adapter door with a mock herdr; the binding is a spy standing in for Confinement Authority's
// bind/markLaunched (the adapter only ever sees those two functions).

const POSIX_ONLY = process.platform === 'win32' && 'the mock herdr is a POSIX shell wrapper';

function createRoundMockHerdr(tmp) {
  const script = path.join(tmp, 'round-herdr.mjs');
  const bin = path.join(tmp, 'round-herdr.sh');
  const log = path.join(tmp, 'round-herdr.jsonl');
  fs.writeFileSync(log, '');
  fs.writeFileSync(script, `
import fs from 'node:fs';
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({ args, socket: process.env.HERDR_SOCKET_PATH ?? null, session: process.env.HERDR_SESSION ?? null }) + '\\n');
const ok = (result) => { console.log(JSON.stringify({ id: 'cli:mock', result })); process.exit(0); };
const [group, action] = args;
if (group === 'pane' && action === 'split') ok({ pane: { pane_id: 'mock-pane-1' } });
if (group === 'pane' && action === 'process-info') ok({ process_info: { pane_id: 'mock-pane-1', shell_pid: 1, foreground_process_group_id: 1, foreground_processes: [] } });
ok({});
`);
  fs.writeFileSync(bin, `#!/bin/sh\nexec node "${script}" "$@"\n`, { mode: 0o755 });
  const calls = () => fs.readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
  return { bin, calls };
}

async function confinedRound(tmp, mock, { confinementBinding, runIds = {} } = {}) {
  const runDir = path.join(tmp, 'run');
  fs.mkdirSync(runDir, { recursive: true });
  return EXECUTOR_ADAPTERS['herdr-spawn'](
    {
      command: 'agy',
      args: [],
      prompt: 'p',
      env: {},
      interactiveMode: { exitCommand: '/exit', kind: 'agy' },
      requirement: { mode: 'required' },
      workerInvocation: { command: '/bin/true', args: [], env: {}, cwd: tmp },
    },
    {
      cwd: tmp, timeoutMs: 5000, workId: 'w-s2-8', tier: 'standard', model: 'sonnet',
      herdrBin: mock.bin, runDir, transportDeadlines: { readyTimeoutMs: 200, resendAfterMs: 200 },
      confinementBinding,
      ...runIds,
    },
  );
}

function withHerdrEnv(vars, fn) {
  const keys = ['HERDR_SOCKET_PATH', 'HERDR_SESSION'];
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  for (const k of keys) { if (vars[k] === undefined) delete process.env[k]; else process.env[k] = vars[k]; }
  const restore = () => { for (const k of keys) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } };
  return Promise.resolve().then(fn).finally(restore);
}

function spyBinding(mock, { failBind = false } = {}) {
  const events = [];
  return {
    events,
    binding: {
      bind: (b) => { events.push({ kind: 'bind', binding: b, herdrCallsBefore: mock.calls().length }); if (failBind) throw new Error('bind refused for the test'); },
      markLaunched: () => { events.push({ kind: 'launched', herdrCallsBefore: mock.calls().length }); },
    },
  };
}

test('S2(8) a NON-assignment confined dispatch binds pane, endpoint and its own pid before pane run, then records the launch, outside the isAssignmentRun guard', { skip: POSIX_ONLY }, async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-s2-round-'));
  try {
    const mock = createRoundMockHerdr(tmp);
    const spy = spyBinding(mock);
    const socket = path.join(tmp, 'herdr.sock');
    await withHerdrEnv({ HERDR_SOCKET_PATH: socket }, () => assert.rejects(() => confinedRound(tmp, mock, { confinementBinding: spy.binding })));
    const calls = mock.calls();
    const runIdx = calls.findIndex((c) => c.args[0] === 'pane' && c.args[1] === 'run');
    assert.ok(runIdx >= 0, 'the round reached pane run');
    assert.deepEqual(spy.events.map((e) => e.kind), ['bind', 'launched']);
    const [bind, launched] = spy.events;
    assert.deepEqual(bind.binding, { paneId: 'mock-pane-1', herdrEndpoint: socket, herdrSession: null, binderPid: process.pid });
    assert.ok(bind.herdrCallsBefore <= runIdx && launched.herdrCallsBefore <= runIdx, 'bind and the launch record both precede pane run');
    assert.equal(calls[runIdx].socket, socket, 'the recorded endpoint is the one the round\'s client used');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('S2(8) a default-session confined round (no HERDR_SOCKET_PATH, no HERDR_SESSION) records the socket herdr falls back to, never a session name', { skip: POSIX_ONLY }, async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-s2-round-'));
  try {
    const mock = createRoundMockHerdr(tmp);
    const spy = spyBinding(mock);
    await withHerdrEnv({}, () => assert.rejects(() => confinedRound(tmp, mock, { confinementBinding: spy.binding })));
    assert.deepEqual(spy.events[0].binding, { paneId: 'mock-pane-1', herdrEndpoint: socketPathForSession('default', { home: process.env.HOME }), herdrSession: null, binderPid: process.pid });
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('S2(8) a bind failure closes the pane and fails the round before pane run; no worker starts', { skip: POSIX_ONLY }, async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-s2-round-'));
  try {
    const mock = createRoundMockHerdr(tmp);
    const spy = spyBinding(mock, { failBind: true });
    await withHerdrEnv({ HERDR_SOCKET_PATH: path.join(tmp, 'herdr.sock') }, () => assert.rejects(
      () => confinedRound(tmp, mock, { confinementBinding: spy.binding }),
      (err) => { assert.match(`${err.code ?? ''} ${err.errorClass ?? ''} ${err.message}`, /confinement-bind-failed|could not bind/); return true; },
    ));
    const calls = mock.calls();
    assert.equal(calls.some((c) => c.args[0] === 'pane' && c.args[1] === 'run'), false, 'no pane run after a failed bind');
    assert.ok(calls.some((c) => c.args[0] === 'pane' && c.args[1] === 'close' && c.args.includes('mock-pane-1')), 'the pane was closed');
    assert.deepEqual(spy.events.map((e) => e.kind), ['bind']);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('S2(8) Confinement Authority hands one binding over every prepared home and none when nothing can bind', () => {
  assert.equal(bindingForPrepared([null, { cleanup() {} }]), null, 'an unconfined round has no home and is handed no bind function');
  const seen = [];
  const prepared = { bind: (b) => seen.push(['bind', b]), markLaunched: () => seen.push(['launched']) };
  const binding = bindingForPrepared([prepared, prepared]);
  binding.bind({ paneId: 'p' });
  binding.markLaunched();
  assert.deepEqual(seen, [['bind', { paneId: 'p' }], ['launched']], 'the same prepared confinement is bound once');
});

test.todo('S2(8) an assignment confined herdr-spawn dispatch also hands a launch-check and a post-launch-check into runHerdrRound — needs run supervisor + holder-lock (deferred part ii)');

// ---------------------------------------------------------------------------------------------
// (9) cli-spawn confined rounds: the home is bound to the detached run supervisor, which outlives the
// controller. Real processes stand in for the supervisor; liveness is the reaper's own (pid + start time).

function spawnSupervisorStandIn() {
  const child = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 60000)'], { stdio: 'ignore' });
  return child;
}

function waitExit(child) {
  return new Promise((resolve) => { if (child.exitCode !== null || child.signalCode !== null) resolve(); else child.once('exit', resolve); });
}

function cliSpawnBinding(dir) {
  return bindingForPrepared([{
    bind: (b) => bindOwnershipMarker(dir, b),
    markLaunched: () => markOwnershipLaunched(dir),
  }]);
}

test('S2(9) controller dead, run supervisor alive: the reaper keeps the cli-spawn home; supervisor dead: reaped', { skip: process.platform !== 'linux' && 'reads /proc for the start time' }, async () => {
  const w = workspace();
  const supervisor = spawnSupervisorStandIn();
  try {
    const dir = preparedHome(w, { timeoutMs: HOUR, ageMs: 2 * HOUR }); // marker pid: a dead controller
    assert.equal(bindConfinedHomesToSupervisor(cliSpawnBinding(dir), supervisor), true);
    const marker = readOwnershipMarker(dir);
    assert.equal(marker.binderPid, supervisor.pid);
    assert.ok(marker.binderStartTime, 'the supervisor start time is recorded');
    assert.equal(marker.paneId, undefined);

    const kept = reapOrphanedConfinementResources({ tempRoot: w.root });
    assert.equal(exists(dir), true, 'the home of a worker still run by its supervisor was removed');
    assert.equal(kept.skipped.find((s) => s.path === dir)?.reason, 'binder-alive-in-window');

    supervisor.kill('SIGKILL');
    await waitExit(supervisor);
    const gone = reapOrphanedConfinementResources({ tempRoot: w.root });
    assert.equal(exists(dir), false);
    assert.equal(gone.reaped[0]?.reason, 'process-dead');
  } finally { try { supervisor.kill('SIGKILL'); } catch {} w.cleanup(); }
});

test('S2(9) run supervisor alive but past its bind-anchored window: reaped as expired', { skip: process.platform !== 'linux' && 'reads /proc for the start time' }, async () => {
  const w = workspace();
  const supervisor = spawnSupervisorStandIn();
  try {
    const dir = preparedHome(w, { timeoutMs: HOUR, ageMs: 3 * HOUR });
    const past = Date.now() - (LAUNCH_GRACE_MS + HOUR + RUN_SETTLE_GRACE_MS + MIN);
    bindOwnershipMarker(dir, { binderPid: supervisor.pid, boundAt: new Date(past).toISOString() });
    const result = reapOrphanedConfinementResources({ tempRoot: w.root });
    assert.equal(exists(dir), false);
    assert.equal(result.reaped[0]?.reason, 'expired');
  } finally { supervisor.kill('SIGKILL'); await waitExit(supervisor); w.cleanup(); }
});

test('S2(9) a recorded supervisor pid now held by another process (start time differs) counts as dead', { skip: process.platform !== 'linux' && 'reads /proc for the start time' }, async () => {
  const w = workspace();
  const other = spawnSupervisorStandIn();
  try {
    const dir = preparedHome(w, { timeoutMs: HOUR, ageMs: 2 * HOUR });
    bindOwnershipMarker(dir, { binderPid: other.pid, binderStartTime: '1' });
    reapOrphanedConfinementResources({ tempRoot: w.root });
    assert.equal(exists(dir), false);
  } finally { other.kill('SIGKILL'); await waitExit(other); w.cleanup(); }
});

test('S2(9) a cli-spawn bind that cannot be written leaves the run going and the home as prepared', () => {
  const w = workspace();
  try {
    const failing = { bind: () => { throw new Error('no marker'); } };
    const saved = process.stderr.write;
    let said = '';
    process.stderr.write = (s) => { said += s; return true; };
    try {
      assert.equal(bindConfinedHomesToSupervisor(failing, { pid: 4242 }), false);
    } finally { process.stderr.write = saved; }
    assert.match(said, /confinement-bind-failed/);
    assert.equal(bindConfinedHomesToSupervisor(null, { pid: 4242 }), false, 'an unconfined run has nothing to bind');
  } finally { w.cleanup(); }
});
