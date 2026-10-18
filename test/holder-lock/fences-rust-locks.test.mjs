// The three locks the Rust callers take (the fgctl activation lock, the machine install lock, the
// Observe store lock) against a host built from this checkout: their old paths get tombstones once
// per workspace (install: once per machine), an old lock file still there stops the placement, the
// new fgctl and the Observe CLI run fine behind the fences, and the doctor checks name the three.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { placeFences, fenceStatus, TOMBSTONE_FILE, V1_LOCK_PRESENT } from '../../src/holder-lock/fences.mjs';
import { useReleaseFixture, fixture, runFgctl } from '../rust-host/fgctl-init-fixture.mjs';

const HOST = process.env.FGOS_HOST_BIN;
const HAS_FLOCK = spawnSync('flock', ['--version'], { stdio: 'ignore' }).status === 0;

useReleaseFixture();

let scratch;
let stateHome;
before(() => {
  assert.ok(HOST, 'set FGOS_HOST_BIN to a host built from this checkout');
  scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-fences-rust-'));
  stateHome = path.join(scratch, 'state');
  fs.mkdirSync(stateHome);
  // Node asks the host for the state root (one formula, in Rust): the same one fgctl uses below.
  delete process.env.FGOS_STATE_ROOT;
  process.env.FGOS_STATE_HOME = stateHome;
});
after(() => {
  fs.rmSync(scratch, { recursive: true, force: true });
});

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function workspace(name) {
  const root = path.join(scratch, name);
  fs.mkdirSync(root);
  git(['init', '-q'], root);
  git(['config', 'user.name', 'Test User'], root);
  git(['config', 'user.email', 'test@example.com'], root);
  return { root, fgosDir: path.join(root, '.fgos'), providerRuntimeDir: path.join(scratch, `${name}-no-provider-capacity`) };
}

const options = (ws, extra = {}) => ({ fgosDir: ws.fgosDir, workspaceRoot: ws.root, providerRuntimeDir: ws.providerRuntimeDir, ...extra });

function rustLockPaths(ws, root = stateHome) {
  return {
    activation: path.join(ws.fgosDir, 'installation', 'activation.lock'),
    install: path.join(root, 'install.lock'),
    observe: path.join(ws.fgosDir, 'observe', '.lock'),
  };
}

function tombstoneRecord(lockPath) {
  return JSON.parse(fs.readFileSync(path.join(lockPath, TOMBSTONE_FILE), 'utf8'));
}

function cleanEnv(extra = {}) {
  const env = { ...process.env, FGOS_STATE_HOME: stateHome, ...extra };
  for (const key of ['CLAUDE_CODE_SESSION_ID', 'CODEX_THREAD_ID', 'FGOS_SESSION_ID', 'FGOS_STATE_ROOT']) delete env[key];
  return env;
}

test('placeFences tombstones the three old paths, install once for the machine, and a second run changes nothing', () => {
  const first = workspace('tombstones-a');
  const paths = rustLockPaths(first);
  const placed = placeFences(options(first));
  assert.equal(placed.ok, true, JSON.stringify(placed));
  for (const [lock, lockPath] of Object.entries(paths)) {
    assert.ok(placed.placed.includes(lockPath), `${lock} placed at ${lockPath}`);
    assert.ok(fs.statSync(lockPath).isDirectory(), `${lockPath} is a directory`);
    assert.deepEqual({ lock: tombstoneRecord(lockPath).lock, by: tombstoneRecord(lockPath).by }, { lock, by: 'fgos 4.4' });
  }
  const records = Object.fromEntries(Object.values(paths).map((p) => [p, fs.readFileSync(path.join(p, TOMBSTONE_FILE), 'utf8')]));

  const again = placeFences(options(first));
  assert.equal(again.ok, true);
  assert.deepEqual(again.placed, []);
  for (const p of Object.values(paths)) {
    assert.ok(again.skipped.includes(p), `${p} skipped the second time`);
    assert.equal(fs.readFileSync(path.join(p, TOMBSTONE_FILE), 'utf8'), records[p], 'record unchanged');
  }

  // A second workspace shares the machine's install tombstone and adds its own two.
  const second = workspace('tombstones-b');
  const secondPaths = rustLockPaths(second);
  const other = placeFences(options(second));
  assert.equal(other.ok, true, JSON.stringify(other));
  assert.ok(other.skipped.includes(secondPaths.install), 'install is already fenced for the machine');
  assert.ok(other.placed.includes(secondPaths.activation) && other.placed.includes(secondPaths.observe));
  const secondStatus = fenceStatus(options(second));
  assert.equal(secondStatus.complete, true);
  assert.deepEqual(secondStatus.controllerMissing, [path.join(second.fgosDir, 'locks', 'activation.lock')], 'the controller fence is reported and left to fgctl');
});

test('an old observe lock file still there stops the placement and is left alone', () => {
  const ws = workspace('v1-observe');
  const { observe, activation } = rustLockPaths(ws);
  fs.mkdirSync(path.dirname(observe), { recursive: true });
  fs.writeFileSync(observe, JSON.stringify({ pid: process.pid, startTime: null, ts: new Date().toISOString() }));
  const result = placeFences(options(ws));
  assert.equal(result.ok, false);
  assert.equal(result.error, V1_LOCK_PRESENT);
  assert.deepEqual(result.paths, [observe]);
  assert.deepEqual(result.placed, []);
  assert.ok(fs.statSync(observe).isFile(), 'the old lock file is not touched');
  assert.equal(fs.existsSync(activation), false, 'no other path is fenced half-way');
  assert.deepEqual(fenceStatus(options(ws)).v1Present, [observe]);
});

test('behind the fences the new fgctl activates the workspace and the Observe CLI takes its kernel lock', () => {
  const ws = workspace('behind-fences');
  assert.equal(placeFences(options(ws)).ok, true);
  const init = runFgctl(['init', '--from', fixture.releaseDir], { cwd: ws.root, stateHome, env: { HOME: path.join(scratch, 'home') } });
  assert.equal(init.status, 0, `fgctl init: ${init.stderr}`);
  assert.ok(fs.existsSync(path.join(ws.fgosDir, 'installation', 'activation.json')), 'activated');

  const open = spawnSync(HOST, ['metrics', 'case', 'open', 'fenced-case', '--harness', 'plain', '--dir', ws.root], { env: cleanEnv(), encoding: 'utf8' });
  assert.equal(open.status, 0, `metrics case open: ${open.stdout}${open.stderr}`);
  const locks = path.join(ws.fgosDir, 'locks');
  assert.ok(fs.statSync(path.join(locks, 'observe.lock')).isFile(), 'observe takes its kernel lock file');
  assert.ok(fs.statSync(path.join(locks, 'activation-v2.lock')).isFile(), 'fgctl takes its kernel lock file');
  assert.ok(fs.statSync(path.join(stateHome, 'locks', 'install.lock')).isFile(), 'the release store takes its kernel lock file');
  for (const lockPath of Object.values(rustLockPaths(ws))) assert.ok(fs.statSync(lockPath).isDirectory(), `${lockPath} still a tombstone`);
});

test('doctor names the three locks: lock-fences before the fences, lock-holders while a foreign process holds observe', { skip: !HAS_FLOCK }, async () => {
  const ws = workspace('doctor');
  const ownState = path.join(scratch, 'doctor-state');
  fs.mkdirSync(ownState);
  const ownHome = path.join(scratch, 'doctor-home');
  const init = runFgctl(['init', '--from', fixture.releaseDir], { cwd: ws.root, stateHome: ownState, env: { HOME: ownHome } });
  assert.equal(init.status, 0, `fgctl init: ${init.stderr}`);
  const doctorEnv = () => cleanEnv({ FGOS_STATE_HOME: ownState, HOME: ownHome });
  const shim = path.join(ws.fgosDir, 'installation', 'bin', 'fgos');
  const doctor = () => {
    const res = spawnSync(shim, ['doctor', '--json'], { cwd: ws.root, env: doctorEnv(), encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    assert.ok(res.stdout.trim(), `fgos doctor printed nothing (exit ${res.status}): ${res.stderr}`);
    const parsed = JSON.parse(res.stdout);
    const list = Array.isArray(parsed) ? parsed : parsed.checks ?? parsed.results ?? parsed.data?.checks ?? [];
    return Object.fromEntries(list.map((check) => [check.id ?? check.name, check]));
  };

  // `fgctl init` ends in `doctor --fix`, which fences the workspace whenever no other fgOS process is running on the machine.
  // Put the workspace in the state under test either way: the Node and main door locks fenced, the three the Rust callers take missing.
  assert.equal(placeFences(options(ws, { owners: ['4.2', '4.3'], stateRoot: ownState })).ok, true);
  const paths = rustLockPaths(ws, ownState);
  for (const lockPath of Object.values(paths)) fs.rmSync(lockPath, { recursive: true, force: true });
  const fences = doctor()['lock-fences'];
  assert.ok(fences, 'lock-fences is reported');
  for (const lockPath of Object.values(paths)) {
    assert.ok(`${fences.message}`.includes(lockPath), `lock-fences names ${lockPath}: ${fences.message}`);
  }

  const observeLock = path.join(ws.fgosDir, 'locks', 'observe.lock');
  fs.mkdirSync(path.dirname(observeLock), { recursive: true });
  const holder = spawn('flock', [observeLock, 'sleep', '60'], { stdio: 'ignore' });
  try {
    await new Promise((resolve) => holder.once('spawn', resolve));
    const deadline = Date.now() + 5000;
    let holders;
    while (Date.now() < deadline) {
      holders = doctor()['lock-holders'];
      if (holders && /observe/.test(`${holders.message}`) && /held by pid/.test(`${holders.message}`)) break;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    assert.ok(holders, 'lock-holders is reported');
    assert.match(`${holders.message}`, /observe .*observe\.lock held by pid \d+ \(.*sleep.*\), not a fgOS process nor a borrowed child/);
  } finally {
    holder.kill('SIGKILL');
  }
});
