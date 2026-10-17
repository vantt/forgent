// The sweep door: adopt first, then the reaper for what adopt does not own. Real directories and, for
// the adopt cases, a real host binary (FGOS_HOST_BIN built from this checkout).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { computeSha256Digest } from '../../src/runner/dispatch/proof-helpers.mjs';
import { ensurePrivateDir, writeOwnershipMarkerV2, writeOwnershipMarker, extendOwnershipMarker, reapOrphanedConfinementResources, OWNERSHIP_MARKER_FILE } from '../../src/runner/dispatch/confinement/cleanup.mjs';
import { sweepAttempts } from '../../src/run-supervisor/sweep.mjs';

const REPO = path.resolve(import.meta.dirname, '../..');
const HOST = process.env.FGOS_HOST_BIN;
const NEEDS_HOST = HOST && fs.existsSync(HOST) ? false : 'FGOS_HOST_BIN does not name a host built from this checkout';
const HOUR = 60 * 60 * 1000;

function workspace() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-sweep-'));
  const tempRoot = path.join(root, 'fgos-confinement');
  const assignmentsRoot = path.join(root, 'assignments');
  fs.mkdirSync(assignmentsRoot);
  return { root, tempRoot, assignmentsRoot, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

function attemptHome(w, { attemptId, runDir, ageMs = 0 }) {
  const dir = path.join(w.tempRoot, `disp_${attemptId}`, 'home');
  ensurePrivateDir(dir, { root: w.tempRoot });
  writeOwnershipMarkerV2(dir, { attemptId, runDir, dispatchId: `disp_${attemptId}` });
  if (ageMs) extendOwnershipMarker(dir, { createdAt: new Date(Date.now() - ageMs).toISOString() });
  fs.writeFileSync(path.join(dir, 'auth.json'), '{"fake":"login copy"}');
  return dir;
}

/**
 * An attempt directory a dead supervisor left: v3 envelope, free attempt lock, empty process domain, a
 * receipt, and one step that runs the real finalizer for the attempt's homes.
 */
function deadAttempt(w, name, home) {
  const runDir = path.join(w.assignmentsRoot, 'asg-1', 'runs', name);
  fs.mkdirSync(path.join(runDir, 'protected', 'confinement-finalization'), { recursive: true });
  fs.writeFileSync(path.join(runDir, 'protected', 'confinement-finalization', 'cmd-1.json'), JSON.stringify({
    contract: 'confinement-finalization.v1', launchCommandId: 'cmd-1', resources: [{ pathRef: home }], cleanupState: 'pending', cleanupResult: null,
  }));
  const script = `import(${JSON.stringify(path.join(REPO, 'src/runner/dispatch/confinement/authority.mjs'))}).then((m) => { const r = m.finalizeAttemptHome({ runDir: ${JSON.stringify(runDir)}, attemptId: ${JSON.stringify(`att-${name}`)} }); process.exit(r.state === 'cleaned' ? 0 : 75); });`;
  const envelope = {
    v: 3, attemptId: `att-${name}`, unitRunId: 'unit-1', runDir, mode: 'direct', protocolId: 1,
    hostBin: HOST ?? '/bin/false', payloadRoot: '/', cwd: runDir, mutation: 'read-only',
    launch: { command: '/bin/true', args: [], env: {}, stdinPolicy: 'null', briefPath: null, outboxDir: path.join(runDir, 'outbox'), capture: { stdout: path.join(runDir, 'o.log'), stderr: path.join(runDir, 'e.log') } },
    containment: { preferred: 'linux-gate' },
    deadlines: { softAt: null, idleMs: null, hardCeiling: null, gateKillGraceMs: 1000 },
    agentProtocol: { cli: 'claude', mode: 'direct' },
    steps: [{ stepId: 'finalize-home', hostBin: process.execPath, payloadRoot: '/', argv: ['-e', script], cwd: runDir, env: { PATH: process.env.PATH }, stepTimeoutMs: 30_000 }],
  };
  envelope.digest = computeSha256Digest(envelope);
  fs.writeFileSync(path.join(runDir, 'envelope.json'), JSON.stringify(envelope));
  fs.writeFileSync(path.join(runDir, 'attempt.lock'), '');
  fs.writeFileSync(path.join(runDir, 'receipt.json'), JSON.stringify({ v: 1, attemptId: `att-${name}`, outcome: 'exited', captureDigests: { stdout: null, stderr: null }, outboxPresent: false, synthesizedBy: 'supervisor', publishedAt: new Date().toISOString() }));
  return runDir;
}

test('an attempt home survives 50 reaper passes in any liveness and pane state', () => {
  const w = workspace();
  try {
    const home = attemptHome(w, { attemptId: 'a1', runDir: path.join(w.root, 'run'), ageMs: 12 * HOUR });
    for (let i = 0; i < 50; i += 1) {
      const result = reapOrphanedConfinementResources({ tempRoot: w.tempRoot, checkLiveness: () => i % 2 === 0, checkPaneOpen: () => (i % 3 === 0 ? null : i % 3 === 1) });
      assert.deepEqual(result.reaped, [], `pass ${i}`);
      assert.equal(fs.existsSync(path.join(home, 'auth.json')), true, `pass ${i}`);
    }
  } finally { w.cleanup(); }
});

test('sweepAttempts: adopt finishes a dead attempt\'s finalize-home, so the reaper never gets to the home', { skip: NEEDS_HOST }, () => {
  const w = workspace();
  try {
    const runDir = path.join(w.assignmentsRoot, 'asg-1', 'runs', 'r1');
    const home = attemptHome(w, { attemptId: 'att-r1', runDir, ageMs: 12 * HOUR });
    deadAttempt(w, 'r1', home);
    const seen = [];
    const result = sweepAttempts({
      assignmentsRoot: w.assignmentsRoot,
      tempRoot: w.tempRoot,
      reaperOptions: { checkLiveness: () => false, checkPaneOpen: (...a) => { seen.push(a); return false; } },
    });
    assert.equal(result.adoptError, null);
    assert.equal(result.adopt.length, 1);
    assert.equal(fs.existsSync(home), false, 'finalize-home removed the home');
    assert.deepEqual(result.reap.reaped, []);
    assert.deepEqual(seen, []);
  } finally { w.cleanup(); }
});

test('sweepAttempts without a host binary still runs the reaper and says why adopt did not run', () => {
  const w = workspace();
  try {
    const runDir = path.join(w.assignmentsRoot, 'asg-1', 'runs', 'r2');
    fs.mkdirSync(runDir, { recursive: true });
    // An unusable host: the route fails, the sweep reports it and goes on.
    const result = sweepAttempts({ assignmentsRoot: w.assignmentsRoot, tempRoot: w.tempRoot, adoptOptions: { hostBin: '/nonexistent/fgos' } });
    assert.equal(result.adopt, null);
    assert.equal(result.adoptError, 'adopt-route-failed');
    assert.deepEqual(result.reap, { reaped: [], skipped: [] });
  } finally { w.cleanup(); }
});

test('sweepAttempts leaves the herdr rule alone: a version 1 home whose pane is closed is reaped, an open pane keeps it', () => {
  const w = workspace();
  try {
    const mk = (id) => {
      const dir = path.join(w.tempRoot, id, 'home');
      ensurePrivateDir(dir, { root: w.tempRoot });
      writeOwnershipMarker(dir, { dispatchId: id, pid: 424242 });
      const marker = JSON.parse(fs.readFileSync(path.join(dir, OWNERSHIP_MARKER_FILE), 'utf8'));
      fs.writeFileSync(path.join(dir, OWNERSHIP_MARKER_FILE), JSON.stringify({ ...marker, paneId: `w1:${id}`, retainedAt: new Date().toISOString() }));
      return dir;
    };
    const closed = mk('disp_closed');
    const open = mk('disp_open');
    const result = sweepAttempts({
      tempRoot: w.tempRoot,
      reaperOptions: { checkPaneOpen: (paneId) => paneId.endsWith('disp_open') },
    });
    assert.equal(fs.existsSync(closed), false);
    assert.equal(fs.existsSync(open), true);
    assert.equal(result.reap.reaped.length, 1);
  } finally { w.cleanup(); }
});

test('production call sites reach the reaper only through sweepAttempts', () => {
  const out = execFileSync('grep', ['-rln', 'reapOrphanedConfinementResources(', 'src'], { cwd: REPO, encoding: 'utf8' }).split('\n').filter(Boolean).sort();
  assert.deepEqual(out, [
    'src/run-supervisor/sweep.mjs',
    'src/runner/dispatch/confinement/cleanup.mjs',
    'src/setup/registrations.mjs',
  ]);
  for (const file of ['src/runner/execution/run.mjs', 'src/runner/loop.mjs', 'src/runner/dispatch/cli.mjs']) {
    assert.match(fs.readFileSync(path.join(REPO, file), 'utf8'), /sweepAttempts\(/, file);
  }
});
