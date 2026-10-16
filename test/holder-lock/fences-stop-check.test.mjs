// The stop-everything check through the real host route `fgos internal
// quiesce-scan`: a node process running a fgOS payload with its cwd inside
// the workspace is a blocker, nothing running is clean, and a process that
// starts after the first scan is caught by the scan that follows placement.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { checkStopped, placeFences, fenceStatus, fenceCutover, ownPidChain } from '../../src/holder-lock/fences.mjs';

const HOST_BIN = process.env.FGOS_HOST_BIN;
const READY_WAIT_MS = 10_000;
const SETTLE_ATTEMPTS = 20;
const GIT_ENV = { ...process.env, GIT_AUTHOR_NAME: 'fences', GIT_AUTHOR_EMAIL: 'fences@test', GIT_COMMITTER_NAME: 'fences', GIT_COMMITTER_EMAIL: 'fences@test' };

let scratch;
const children = new Set();
before(() => {
  assert.ok(HOST_BIN && fs.existsSync(HOST_BIN), `set FGOS_HOST_BIN to a host built from this checkout (npm test does): ${HOST_BIN}`);
  scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-fences-stop-check-'));
});
after(async () => {
  for (const child of children) await stopPayload(child);
  fs.rmSync(scratch, { recursive: true, force: true });
});

/** A git workspace carrying a `bin/fgos.mjs` that only stays alive: the shape an old payload has when it runs. */
function makeWorkspace(name) {
  const root = path.join(scratch, name);
  fs.mkdirSync(path.join(root, 'bin'), { recursive: true });
  execFileSync('git', ['init', '-q'], { cwd: root, env: GIT_ENV });
  execFileSync('git', ['commit', '-q', '--allow-empty', '-m', 'init'], { cwd: root, env: GIT_ENV });
  fs.writeFileSync(path.join(root, 'bin', 'fgos.mjs'), [
    'import fs from "node:fs";',
    'fs.writeFileSync(process.argv[2], String(process.pid));',
    'setInterval(() => {}, 1000);',
    '',
  ].join('\n'));
  const fgosDir = path.join(root, '.fgos');
  fs.mkdirSync(fgosDir);
  const providerRuntimeDir = path.join(scratch, `${name}-no-provider-capacity`);
  return { root, fgosDir, providerRuntimeDir };
}

/** Start `node bin/fgos.mjs` with its cwd in the workspace and wait until it has written its pid. */
async function startPayload(ws) {
  const readyFile = path.join(scratch, `ready-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const child = spawn(process.execPath, ['bin/fgos.mjs', readyFile], { cwd: ws.root, stdio: 'ignore' });
  children.add(child);
  const deadline = Date.now() + READY_WAIT_MS;
  while (!fs.existsSync(readyFile)) {
    if (child.exitCode !== null) throw new Error(`payload exited early with ${child.exitCode}`);
    if (Date.now() > deadline) throw new Error('payload did not come up');
    await new Promise((resolve) => { setTimeout(resolve, 25); });
  }
  return child;
}

async function stopPayload(child) {
  if (!children.has(child)) return;
  children.delete(child);
  if (child.exitCode === null && child.signalCode === null) {
    const exited = new Promise((resolve) => child.once('exit', resolve));
    child.kill('SIGKILL');
    await exited;
  }
}

function blockerPids(result) {
  return result.blockers.filter((blocker) => blocker.kind === 'process').map((blocker) => blocker.pid);
}

/**
 * fgOS processes of other sessions on this machine (a test suite, a doctor
 * run) match every workspace through their argv, and the scan is right to
 * count them. The test names the ones running right now, read from a
 * workspace it never starts anything in, and declares them next to its own
 * pid chain, so only what the test itself starts can block.
 */
function foreignPids() {
  const probe = path.join(scratch, 'foreign-probe');
  fs.mkdirSync(probe, { recursive: true });
  const mine = new Set([...children].map((child) => child.pid));
  const result = checkStopped({ workspaces: [probe], hostBin: HOST_BIN });
  return [...ownPidChain(), ...blockerPids(result).filter((pid) => !mine.has(pid))];
}

/** Whether every blocker is a process of another session that started after the probe, or a transient unreadable entry. */
function onlyForeign(result) {
  const mine = new Set([...children].map((child) => child.pid));
  return result.blockers.length > 0 && result.blockers.every((blocker) => blocker.kind === 'unreadable' || !mine.has(blocker.pid));
}

function scan(ws) {
  return checkStopped({ workspaces: [ws.root], hostBin: HOST_BIN, excludePids: foreignPids() });
}

/** A scan that is not blocked by other sessions' processes coming and going: retried while only those block it. */
function settledScan(ws) {
  let result;
  for (let attempt = 0; attempt < SETTLE_ATTEMPTS; attempt += 1) {
    result = scan(ws);
    if (result.status !== 'blocked' || !onlyForeign(result)) return result;
  }
  return result;
}

test('ownPidChain starts with this process and climbs through its parents', () => {
  const chain = ownPidChain();
  assert.equal(chain[0], process.pid);
  assert.equal(chain[1], process.ppid);
  assert.ok(chain.every((pid) => Number.isInteger(pid) && pid > 0));
  assert.equal(new Set(chain).size, chain.length);
});

test('a workspace with no fgOS process is clean', () => {
  const ws = makeWorkspace('clean');
  const result = settledScan(ws);
  assert.equal(result.status, 'clean', JSON.stringify(result.blockers));
  assert.deepEqual(result.blockers, []);
  assert.equal(result.scans.length, 1);
  assert.equal(result.scans[0].unreadable, 0);
});

test('a node process running the payload with its cwd in the workspace is a blocker until it is gone', async () => {
  const ws = makeWorkspace('blocker');
  const payload = await startPayload(ws);
  try {
    const result = scan(ws);
    assert.equal(result.status, 'blocked', JSON.stringify(result));
    assert.ok(blockerPids(result).includes(payload.pid), `pid ${payload.pid} among ${JSON.stringify(result.blockers)}`);
    const found = result.blockers.find((blocker) => blocker.pid === payload.pid);
    assert.equal(found.workspace, path.resolve(ws.root));
    assert.ok(['environ', 'cwd', 'cmdline'].includes(found.matched));
  } finally {
    await stopPayload(payload);
  }
  const afterwards = settledScan(ws);
  assert.equal(afterwards.status, 'clean', JSON.stringify(afterwards.blockers));
});

test('a blocker found before placement means nothing is placed', async () => {
  const ws = makeWorkspace('blocked-cutover');
  const payload = await startPayload(ws);
  try {
    const result = fenceCutover({ workspaces: [ws.root], fgosDir: ws.fgosDir, workspaceRoot: ws.root, providerRuntimeDir: ws.providerRuntimeDir, hostBin: HOST_BIN });
    assert.equal(result.status, 'blocked');
    assert.ok(blockerPids(result.before).includes(payload.pid));
    assert.equal(result.fences, null);
    assert.equal(result.after, null);
    const status = fenceStatus({ fgosDir: ws.fgosDir, workspaceRoot: ws.root, providerRuntimeDir: ws.providerRuntimeDir });
    assert.equal(status.complete, false);
    assert.equal(status.targets.filter((target) => target.fenced).length, 0);
  } finally {
    await stopPayload(payload);
  }
});

test('a process that starts after the first scan is seen by the scan after placement', async () => {
  const ws = makeWorkspace('late-starter');
  const first = settledScan(ws);
  assert.equal(first.status, 'clean', JSON.stringify(first.blockers));
  const payload = await startPayload(ws);
  try {
    const placed = placeFences({ fgosDir: ws.fgosDir, workspaceRoot: ws.root, providerRuntimeDir: ws.providerRuntimeDir });
    assert.equal(placed.ok, true, JSON.stringify(placed));
    const second = scan(ws);
    assert.equal(second.status, 'blocked');
    assert.ok(blockerPids(second).includes(payload.pid), JSON.stringify(second.blockers));
  } finally {
    await stopPayload(payload);
  }
});

test('a clean workspace is fenced and scanned clean again by the whole cutover step', () => {
  const ws = makeWorkspace('clean-cutover');
  const placedPaths = new Set();
  let result;
  for (let attempt = 0; attempt < SETTLE_ATTEMPTS; attempt += 1) {
    result = fenceCutover({ workspaces: [ws.root], fgosDir: ws.fgosDir, workspaceRoot: ws.root, providerRuntimeDir: ws.providerRuntimeDir, hostBin: HOST_BIN, excludePids: foreignPids() });
    for (const placed of result.fences?.placed ?? []) placedPaths.add(placed);
    if (result.status === 'placed') break;
    // Another session's process starting between the probe and a scan:
    // a blocked first scan placed nothing; a blocked second scan left the
    // fences in place, and the next attempt finds them and skips them.
    const scanned = result.status === 'blocked' ? result.before : result.after;
    assert.ok(['blocked', 'placed-then-blocked'].includes(result.status) && onlyForeign(scanned), JSON.stringify(result));
    if (result.status === 'blocked') assert.equal(result.fences, null);
  }
  assert.equal(result.status, 'placed', JSON.stringify(result));
  assert.equal(result.before.status, 'clean');
  assert.equal(result.fences.ok, true);
  assert.ok(placedPaths.size > 0);
  assert.equal(result.after.status, 'clean');
  assert.equal(fenceStatus({ fgosDir: ws.fgosDir, workspaceRoot: ws.root, providerRuntimeDir: ws.providerRuntimeDir }).complete, true);
});

test('a pid the caller declares as its own is not counted, every other matching pid is', async () => {
  const ws = makeWorkspace('exclusions');
  const payload = await startPayload(ws);
  try {
    const excluded = checkStopped({ workspaces: [ws.root], hostBin: HOST_BIN, excludePids: [...ownPidChain(), payload.pid] });
    assert.ok(!blockerPids(excluded).includes(payload.pid), JSON.stringify(excluded.blockers));
    const counted = checkStopped({ workspaces: [ws.root], hostBin: HOST_BIN, excludePids: ownPidChain() });
    assert.ok(blockerPids(counted).includes(payload.pid), JSON.stringify(counted.blockers));
  } finally {
    await stopPayload(payload);
  }
});
