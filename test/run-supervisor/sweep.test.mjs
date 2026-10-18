// The sweep door: adopt is the only judge of an attempt directory, and only its finalize-home step removes a
// private home, while the attempt's lock is free and its process domain is empty. Real directories and a real
// host binary (FGOS_HOST_BIN built from this checkout).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { computeSha256Digest } from '../../src/runner/dispatch/proof-helpers.mjs';
import { ensurePrivateDir, writeOwnershipMarkerV2, extendOwnershipMarker } from '../../src/runner/dispatch/confinement/cleanup.mjs';
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
function deadAttempt(w, name, home, { countFile } = {}) {
  const runDir = path.join(w.assignmentsRoot, 'asg-1', 'runs', name);
  fs.mkdirSync(path.join(runDir, 'protected', 'confinement-finalization'), { recursive: true });
  fs.writeFileSync(path.join(runDir, 'protected', 'confinement-finalization', 'cmd-1.json'), JSON.stringify({
    contract: 'confinement-finalization.v1', launchCommandId: 'cmd-1', resources: [{ pathRef: home }], cleanupState: 'pending', cleanupResult: null,
  }));
  const script = `import(${JSON.stringify(path.join(REPO, 'src/runner/dispatch/confinement/authority.mjs'))}).then((m) => { const r = m.finalizeAttemptHome({ runDir: ${JSON.stringify(runDir)}, attemptId: ${JSON.stringify(`att-${name}`)} }); ${countFile ? `if (r.state === 'cleaned') require('node:fs').appendFileSync(${JSON.stringify(countFile)}, 'x\\n'); ` : ''}process.exit(r.state === 'cleaned' ? 0 : 75); });`;
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

test('lock free, domain empty, receipt present: adopt finalizes the home and nothing else touches it', { skip: NEEDS_HOST }, () => {
  const w = workspace();
  try {
    const runDir = path.join(w.assignmentsRoot, 'asg-1', 'runs', 'r1');
    const home = attemptHome(w, { attemptId: 'att-r1', runDir, ageMs: 12 * HOUR });
    deadAttempt(w, 'r1', home);
    const result = sweepAttempts({ assignmentsRoot: w.assignmentsRoot });
    assert.equal(result.adoptError, null);
    assert.equal(result.adopt.length, 1);
    assert.equal(fs.existsSync(home), false, 'finalize-home removed the home');
    assert.equal(fs.existsSync(path.join(w.tempRoot, 'disp_att-r1')), false, 'the emptied per-dispatch directory went with it');
  } finally { w.cleanup(); }
});

test('a home with no attempt directory to adopt is never removed, whatever its age', { skip: NEEDS_HOST }, () => {
  const w = workspace();
  try {
    const home = attemptHome(w, { attemptId: 'att-r0', runDir: path.join(w.assignmentsRoot, 'asg-1', 'runs', 'r0'), ageMs: 48 * HOUR });
    const result = sweepAttempts({ assignmentsRoot: w.assignmentsRoot });
    assert.deepEqual(result.adopt, []);
    assert.equal(fs.existsSync(path.join(home, 'auth.json')), true);
  } finally { w.cleanup(); }
});

test('the attempt lock is held: adopt does not finalize, and the home stays until the holder lets go', { skip: NEEDS_HOST || !fs.existsSync('/usr/bin/flock') }, async () => {
  const w = workspace();
  let holder;
  try {
    const runDir = path.join(w.assignmentsRoot, 'asg-1', 'runs', 'r3');
    const home = attemptHome(w, { attemptId: 'att-r3', runDir });
    deadAttempt(w, 'r3', home);
    // flock forks its command, so the holder is the whole process group, killed together below.
    holder = spawn('/usr/bin/flock', ['-x', path.join(runDir, 'attempt.lock'), 'sleep', '60'], { stdio: 'ignore', detached: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    const during = sweepAttempts({ assignmentsRoot: w.assignmentsRoot });
    assert.equal(during.adoptError, null);
    assert.equal(fs.existsSync(path.join(home, 'auth.json')), true, 'a held lock keeps the home');
    process.kill(-holder.pid, 'SIGKILL');
    await new Promise((resolve) => holder.once('exit', resolve));
    await new Promise((resolve) => setTimeout(resolve, 300));
    const after = sweepAttempts({ assignmentsRoot: w.assignmentsRoot });
    assert.equal(after.adoptError, null);
    assert.equal(fs.existsSync(home), false, 'the next sweep, with the lock free, finalizes it');
  } finally {
    try { if (holder) process.kill(-holder.pid, 'SIGKILL'); } catch { /* gone */ }
    w.cleanup();
  }
});

test('two adopters over one dead attempt remove its home once', { skip: NEEDS_HOST }, async () => {
  const w = workspace();
  try {
    const runDir = path.join(w.assignmentsRoot, 'asg-1', 'runs', 'r4');
    const home = attemptHome(w, { attemptId: 'att-r4', runDir });
    const countFile = path.join(w.root, 'finalized.count');
    deadAttempt(w, 'r4', home, { countFile });
    const sweepScript = `import(${JSON.stringify(path.join(REPO, 'src/run-supervisor/sweep.mjs'))}).then((m) => { m.sweepAttempts({ assignmentsRoot: ${JSON.stringify(w.assignmentsRoot)} }); });`;
    const run = () => new Promise((resolve) => {
      const child = spawn(process.execPath, ['-e', sweepScript], { stdio: 'ignore', env: { ...process.env, FGOS_HOST_BIN: HOST } });
      child.once('exit', resolve);
    });
    await Promise.all([run(), run()]);
    assert.equal(fs.existsSync(home), false);
    assert.equal(fs.readFileSync(countFile, 'utf8').trim().split('\n').length, 1, 'the finalizer ran to a cleaned home exactly once');
  } finally { w.cleanup(); }
});

test('sweepAttempts without a usable host binary says why adopt did not run, and removes nothing', () => {
  const w = workspace();
  try {
    const runDir = path.join(w.assignmentsRoot, 'asg-1', 'runs', 'r2');
    fs.mkdirSync(runDir, { recursive: true });
    const home = attemptHome(w, { attemptId: 'att-r2', runDir, ageMs: 12 * HOUR });
    const result = sweepAttempts({ assignmentsRoot: w.assignmentsRoot, adoptOptions: { hostBin: '/nonexistent/fgos' } });
    assert.equal(result.adopt, null);
    assert.equal(result.adoptError, 'adopt-route-failed');
    assert.equal(fs.existsSync(path.join(home, 'auth.json')), true);
  } finally { w.cleanup(); }
});

test('no production code reaches a home by any rule but adopt', () => {
  const gone = ['reapOrphanedConfinementResources', 'bindOwnershipMarker', 'markOwnershipLaunched', 'markResourceRetained', 'paneOpenUnlessClosed', 'bindingForPrepared', 'herdrEndpointForEnv', 'envForEndpoint', 'OWNERSHIP_BINDING_FIELDS', 'LAUNCH_GRACE_MS'];
  for (const name of gone) {
    let out = '';
    try { out = execFileSync('grep', ['-rln', name, 'src'], { cwd: REPO, encoding: 'utf8' }); } catch { /* no match */ }
    assert.equal(out.trim(), '', `${name} is gone from src`);
  }
  for (const file of ['src/runner/execution/run.mjs', 'src/runner/loop.mjs', 'src/setup/run-supervisor-checks.mjs']) {
    assert.match(fs.readFileSync(path.join(REPO, file), 'utf8'), /sweepAttempts\(/, file);
  }
});
