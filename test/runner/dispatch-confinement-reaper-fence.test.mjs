// Acceptance cases for who may remove a private home (backlog p-c3a41d07, rewritten for attempt-owned homes).
//
// The old defect: a sweep judged a home by a pid, a pane or an age, and could take the home of a worker
// that was still running. The rule now: a home is removed only by adopt's finalize-home step, and only
// while the attempt's lock is free and its process domain is empty. No other sweep judges a home.
//
// How the old cases (1)-(9) map onto that rule:
//   (1)(2)(2b)(2c) controller killed before or after binding, a reaper racing a binder -> there is no
//       binder and no reaper; test/run-supervisor/sweep.test.mjs holds the lock-held and lock-free cases and
//       test/run-supervisor/direct-crash-matrix.test.mjs kills real controllers and supervisors
//   (3)(4)(7)(9)   pane, retained-pane and herdr-endpoint rules, pane-less binding kept for doctor -> removed
//       with the pane rules: terminal-control owns panes by key, the home belongs to the attempt
//   (5)            finalizer field contract -> below: the marker at removal must equal the marker at prepare
//   (6)            two reapers over one home -> test/run-supervisor/sweep.test.mjs, two adopters remove it once
//   (8)            one binding over every prepared home -> removed with the binding
//
// Real directories under a fresh mkdtemp; nothing here signals a process.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  writeOwnershipMarker,
  extendOwnershipMarker,
  readOwnershipMarker,
  ensurePrivateDir,
  writeOwnershipMarkerV2,
  removeConfinementDir,
} from '../../src/runner/dispatch/confinement/cleanup.mjs';
import { finalizeConfinementResources } from '../../src/runner/dispatch/confinement/authority.mjs';
import { computeSha256Digest } from '../../src/runner/dispatch/proof-helpers.mjs';

const exists = (p) => fs.existsSync(p);

function workspace() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-s2-fence-'));
  const root = path.join(tmp, 'fgos-confinement');
  return { tmp, root, cleanup: () => fs.rmSync(tmp, { recursive: true, force: true }) };
}

/** A private home as a dispatch outside the assignment door prepares it (ensurePrivateDir + marker). */
function preparedHome(w, { dispatchId = 'disp_s2' } = {}) {
  const dir = path.join(w.root, dispatchId, 'home');
  ensurePrivateDir(dir, { root: w.root });
  writeOwnershipMarker(dir, { dispatchId, pid: 424242 });
  fs.writeFileSync(path.join(dir, 'auth.json'), '{"fake":"login copy"}');
  return dir;
}

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

test('a home whose marker is exactly as prepared finalizes and is cleaned', async () => {
  const w = workspace();
  try {
    const dir = preparedHome(w);
    const result = await finalizeWithPrepareDigest(w, dir, computeSha256Digest(readOwnershipMarker(dir)));
    assert.equal(result.cleanupState, 'cleaned', `finalizer said ${JSON.stringify(result.cleanupResult)}`);
    assert.equal(exists(dir), false);
  } finally { w.cleanup(); }
});

test('the count of a failed removal is the only change to the marker the finalizer accepts', async () => {
  const w = workspace();
  try {
    const dir = preparedHome(w);
    const digest = computeSha256Digest(readOwnershipMarker(dir));
    extendOwnershipMarker(dir, { credentialKept: { attempts: 1, since: new Date().toISOString() } });
    const result = await finalizeWithPrepareDigest(w, dir, digest);
    assert.equal(result.cleanupState, 'cleaned', `finalizer said ${JSON.stringify(result.cleanupResult)}`);
  } finally { w.cleanup(); }
});

for (const [label, change] of [
  ['an unauthorized new field', { evil: 'x' }],
  ['a pane the home was never bound to', { paneId: 'w1:p7', terminalKey: 'k', boundAt: new Date().toISOString() }],
  ['a changed dispatchId', { dispatchId: 'disp_other' }],
  ['a changed resource kind', { resource: 'scratch' }],
  ['a changed createdAt', { createdAt: new Date(0).toISOString() }],
  ['a rewritten pid', { pid: 424243 }],
]) {
  test(`a marker that also carries ${label}: ownership-marker-mismatch, home kept`, async () => {
    const w = workspace();
    try {
      const dir = preparedHome(w);
      const digest = computeSha256Digest(readOwnershipMarker(dir));
      extendOwnershipMarker(dir, change);
      const result = await finalizeWithPrepareDigest(w, dir, digest);
      assert.equal(result.cleanupResult?.reason, 'ownership-marker-mismatch');
      assert.equal(exists(dir), true);
    } finally { w.cleanup(); }
  });
}

test('writeOwnershipMarkerV2 refuses a missing attempt or run directory and leaves no marker', () => {
  const w = workspace();
  try {
    const dir = path.join(w.root, 'disp_bad', 'home');
    ensurePrivateDir(dir, { root: w.root });
    assert.throws(() => writeOwnershipMarkerV2(dir, { runDir: '/r' }), /attemptId/);
    assert.throws(() => writeOwnershipMarkerV2(dir, { attemptId: 'a' }), /runDir/);
    assert.equal(exists(path.join(dir, '.fgos-confinement-owner.json')), false);
  } finally { w.cleanup(); }
});

test('removeConfinementDir refuses an attempt home and removes nothing', () => {
  const w = workspace();
  try {
    const dir = path.join(w.root, 'disp_v2b', 'home');
    ensurePrivateDir(dir, { root: w.root });
    writeOwnershipMarkerV2(dir, { attemptId: 'att-2', runDir: path.join(w.tmp, 'run') });
    assert.throws(() => removeConfinementDir(dir), /attempt-home-owned-by-adopt/);
    assert.equal(exists(dir), true);
  } finally { w.cleanup(); }
});

test('extending an attempt home marker keeps it a version 2 marker', () => {
  const w = workspace();
  try {
    const dir = path.join(w.root, 'disp_v2', 'home');
    ensurePrivateDir(dir, { root: w.root });
    writeOwnershipMarkerV2(dir, { attemptId: 'att-1', runDir: path.join(w.tmp, 'runs', '01'), dispatchId: 'disp_v2' });
    extendOwnershipMarker(dir, { createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString() });
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir, '.fgos-confinement-owner.json'), 'utf8')).attemptId, 'att-1');
  } finally { w.cleanup(); }
});
