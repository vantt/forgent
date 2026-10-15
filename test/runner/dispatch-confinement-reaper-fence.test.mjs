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
// Three kinds of cases:
//   - plain tests: the contract holds today (must stay green) or the case proves the defect (red today);
//   - `{ todo }` tests: runnable against the real functions but only meaningful once the fence exists;
//     their result is reported, never counted as a pass;
//   - `test.todo`: the fence function the case needs does not exist yet; the name says which one.
//
// Never kills a real process or touches a real home: the worker is modelled, every directory is under
// a fresh mkdtemp, and the one process spawned is a mock herdr script that only prints JSON.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  reapOrphanedConfinementResources,
  writeOwnershipMarker,
  extendOwnershipMarker,
  readOwnershipMarker,
  markResourceRetained,
  ensurePrivateDir,
  RUN_SETTLE_GRACE_MS,
} from '../../src/runner/dispatch/confinement/cleanup.mjs';
import { finalizeConfinementResources } from '../../src/runner/dispatch/confinement/authority.mjs';
import { computeSha256Digest } from '../../src/runner/dispatch/proof-helpers.mjs';
import { RUN_TIMEOUT_MAX_MS } from '../../src/runner/dispatch/run-timeout.mjs';

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
 * The marker state item 1a (i) says a binding leaves: paneId, the herdr endpoint the launching client
 * used, the binder's own pid and boundAt, written atomically by Confinement Authority. Used only as a
 * PRECONDITION for reaper-rule cases. The field names are this file's assumption (the packet names
 * paneId, boundAt and pid; it leaves the endpoint field unnamed): 1a either uses these names or
 * changes this one helper.
 */
function writeBindingFixture(dir, { paneId = 'w1:p7', endpoint = '/run/herdr/default.sock', binderPid = CONTROLLER_PID, boundAtMs = Date.now() } = {}) {
  extendOwnershipMarker(dir, { paneId, herdrEndpoint: endpoint, pid: binderPid, boundAt: new Date(boundAtMs).toISOString() });
}

/**
 * The controller as shipped today, between prepare and worker launch (herdr-round.mjs:1877-1905):
 * the pane id reaches only the launch-command record (patchCommandRecord, and only inside
 * `if (isAssignmentRun)`), never the ownership marker; there is no launch check and no post-launch
 * check. SEAMS 1a MUST ADD, and swap in here once they exist:
 *   bind            -> the per-home bind function from Confinement Authority (sibling of
 *                      prepared.retain in drivers/bwrap.mjs), handed through adapterOpts
 *                      (authority.mjs) and herdrSpawnInteractiveAdapter (transport.mjs) to
 *                      runHerdrRound; refuses past the creation-anchored run window;
 *   launchAllowed   -> the launch check (no reclaim claim, own bound marker present with own pid,
 *                      within launch grace of boundAt);
 *   afterLaunchOk   -> the post-launch check (marker/home still there, no claim appeared).
 */
const controllerAsShippedToday = Object.freeze({
  bind(_dir, _binding) { return { bound: false }; },
  launchAllowed(_dir) { return true; },
  afterLaunchOk(_dir) { return true; },
});

function reap(w, { alive, pane, maxAgeMs = MAX_AGE_MS, onLiveness, onPane } = {}) {
  return reapOrphanedConfinementResources({
    tempRoot: w.root,
    maxAgeMs,
    checkLiveness: (pid) => {
      onLiveness?.(pid);
      return typeof alive === 'function' ? alive(pid) : alive;
    },
    checkPaneOpen: pane === undefined ? undefined : (paneId, session) => {
      onPane?.(paneId, session);
      return typeof pane === 'function' ? pane(paneId, session) : pane;
    },
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

test('S2(1) controller killed after binding, before pane run: kept while the (empty) pane is open, reaped once it closes', () => {
  const w = workspace();
  try {
    const dir = preparedHome(w, { timeoutMs: HOUR, ageMs: 2 * MIN });
    writeBindingFixture(dir, { boundAtMs: Date.now() - MIN });
    reap(w, { alive: false, pane: true });
    assert.equal(exists(dir), true, 'a dead binder with an open pane: the home is kept for the pane (R5: visible pane leak, no credential loss)');
    reap(w, { alive: false, pane: false });
    assert.equal(exists(dir), false, 'the pane is gone: the home goes');
  } finally { w.cleanup(); }
});

test('S2(1) REGRESSION controller killed after pane run, worker alive in its pane: the home must survive (p-c3a41d07)', () => {
  const w = workspace();
  try {
    const dir = preparedHome(w, { timeoutMs: HOUR, ageMs: 2 * MIN });
    const controller = controllerAsShippedToday;
    const worker = { launched: false, paneOpen: false };
    controller.bind(dir, { paneId: 'w1:p7' });
    if (controller.launchAllowed(dir)) { worker.launched = true; worker.paneOpen = true; }
    assert.equal(controller.afterLaunchOk(dir), true);
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

test('S2(2b) REGRESSION RT2-1: controller binds and launches after the reaper\'s identical re-read and before deletion; never a launched worker whose home is removed', () => {
  const w = workspace();
  try {
    const dir = preparedHome(w, RT2_1);
    const controller = controllerAsShippedToday;
    const worker = { launched: false };
    const result = withHookBeforeDeletionOf(dir, () => {
      const bound = controller.bind(dir, { paneId: 'w1:p7' });
      if (controller.launchAllowed(dir)) worker.launched = true;
      void bound;
    }, () => reap(w, { alive: true, pane: null }));
    assert.equal(result.reaped[0]?.reason, 'expired', 'the precondition: the reaper decided on a live-but-expired controller');
    assert.ok(!(worker.launched && !exists(dir)),
      'a worker was launched into a home the reaper then removed: either the controller must refuse (bind past the run window, or a claim exists) or the reaper must abort');
  } finally { w.cleanup(); }
});

test('S2(2b) REGRESSION mirrored order: controller binds and passes its check first, the reaper comes after and must keep the home', () => {
  const w = workspace();
  try {
    const dir = preparedHome(w, RT2_1);
    const controller = controllerAsShippedToday;
    const worker = { launched: false };
    controller.bind(dir, { paneId: 'w1:p7' });
    if (controller.launchAllowed(dir)) worker.launched = true;
    reap(w, { alive: true, pane: null });
    assert.ok(!(worker.launched && !exists(dir)), 'the reaper removed the home of a worker its live controller had just launched');
  } finally { w.cleanup(); }
});

test.todo('S2(2b) a binder whose home is past its creation-anchored run window refuses to bind: pane closed, round fails, no worker [needs 1a(ii) bind refusal in the Confinement Authority bind function]');

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

test.todo('S2(2c) a controller already past the creation-anchored window refuses to bind: pane closed, no worker [needs 1a(ii) bind refusal]');

// ---------------------------------------------------------------------------------------------
// (2d) Post-launch check.

test.todo('S2(2d) a launch whose post-launch check finds the marker or home gone, or a claim present, closes the pane and fails the round, never accepting a result [needs 1a(ii) post-launch-check function called by runHerdrRound after pane run]');

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

test('S2(5) a home bound with exactly the authorized fields finalizes and is cleaned', {
  todo: 'needs 1a(iv): today any binding field changes the prepare-time digest, so binding alone would make every confined round end in ownership-marker-mismatch',
}, async () => {
  const w = workspace();
  try {
    const dir = preparedHome(w, { timeoutMs: HOUR });
    const digest = computeSha256Digest(readOwnershipMarker(dir));
    writeBindingFixture(dir, { binderPid: CONTROLLER_PID + 1 });
    const result = await finalizeWithPrepareDigest(w, dir, digest);
    assert.equal(result.cleanupState, 'cleaned', `finalizer said ${JSON.stringify(result.cleanupResult)}`);
    assert.equal(exists(dir), false);
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

test.todo('S2(5) a bound marker whose binding fields disagree with the launch record (paneId, endpoint) is ownership-marker-mismatch [needs 1a(iv) comparison against the launch record]');

// ---------------------------------------------------------------------------------------------
// (6) Exclusion under multiplicity. Nothing to call yet: no reclaim claim exists today.

test.todo('S2(6) two reaper passes from different processes against one home: at most one commits a claim, the other backs off; the home is removed at most once [needs 1a(ii) exclusive reclaim claim recording claimant pid + start time + claimedAt]');
test.todo('S2(6) a resuming controller rebinds with its own pid before its launch check; a reaper that decided on the first binding aborts on its re-read [needs 1a(ii) claim-then-reread in every destructive path]');
test.todo('S2(6) a stale claim left by a reaper that crashed after claiming makes the controller refuse launch (fail closed) [needs 1a(ii) launch check]');
test.todo('S2(6) a later pass takes over a stale claim only once its recorded claimant pid is provably dead, never while it lives, then runs its own read, claim and re-read [needs 1a(ii) takeover rule with an injectable claimant-liveness seam]');

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

test('S2(7) REGRESSION default-session round (HERDR_SESSION unset, recorded as null today): the reaper asks herdr on that endpoint and keeps the home while the pane is open (V24)', () => {
  const w = workspace();
  try {
    withMockHerdr(w, ({ setPanes, calls }) => {
      const dir = preparedHome(w, { timeoutMs: HOUR, ageMs: 2 * HOUR });
      // What authority.mjs:1170-1185 passes for a default-session round today: err.herdrSession is
      // round.herdrSession, which herdr-round.mjs:1700 sets to null when HERDR_SESSION is unset.
      markResourceRetained(dir, { paneId: 'w1:p7', herdrSession: null });
      setPanes(['w1:p7']);
      reap(w, { alive: false });
      assert.ok(calls().length > 0, 'the reaper never asked herdr: a default-session pane is unaskable');
      assert.equal(exists(dir), true, 'an open default-session pane lost its home to expiry');
    });
  } finally { w.cleanup(); }
});

test.todo('S2(7) runHerdrRound records the herdr endpoint its client actually used (socket path from the client env, or the session it resolves from; never an assumed "default") in the binding, for a round with HERDR_SESSION unset [needs 1a(i) endpoint field written by bind]');
test.todo('S2(7) live, not mocked: defaultPaneOpen against the endpoint recorded for a real default-session pane returns true while it is open and false after it closes [needs 1a(i) and a live herdr; out of scope for a deterministic suite]');

// ---------------------------------------------------------------------------------------------
// (8) Plumbing authority -> transport -> herdr-round. No bind / launch-check / post-launch-check
// function exists to look for in adapterOpts yet (authority.mjs:1089-1139 builds adapterOpts with
// no such field; only prepared.retain exists, and only on the failure path, authority.mjs:1170-1185).

test.todo('S2(8) an assignment confined herdr-spawn dispatch hands bind, launch-check and post-launch-check from executeThroughConfinement through herdrSpawnInteractiveAdapter into runHerdrRound, which calls bind before pane run [needs 1a(i) plumbing]');
test.todo('S2(8) a NON-assignment confined dispatch (no runId / launchCommandId) still calls bind before pane run: the call sits outside the isAssignmentRun guard at herdr-round.mjs:1889 [needs 1a(i) plumbing]');
test.todo('S2(8) a bind failure or refusal closes the pane and fails the round before pane run; no worker starts [needs 1a(i) fail-closed bind]');
test.todo('S2(8) an unconfined round has no home and is handed no bind function [needs 1a(i) plumbing]');
