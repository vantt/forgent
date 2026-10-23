// mailbox-live-confined.test.mjs — the confined launch of the mailbox behaviour suite's live
// CLIs (scripts/lib/mailbox-live-confined.mjs): fgOS's bwrap driver with the run directory as
// the only writable host path, login stores and secrets masked, a copied login, and an end
// that leaves no process. Real bwrap, real host and shim, a stub head; skipped only where no
// working bwrap exists (a platform capability).

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import cp from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { makeFixtureDir } from '../helpers/fixture-dir.mjs';
import { DatabaseSync } from 'node:sqlite';
import {
  credentialRowsDigest,
  endConfinedRun,
  layOutRunProject,
  maskPlan,
  maskPlanSha256,
  materializeAccountLogin,
  piOmpInstall as confinedPiOmpInstall,
  prepareConfinedRun,
  readAccountCredential,
  settleCopy,
  processesOfRun,
  settleLoginCopy,
  startConfinedRun,
  sweepOrphans,
} from '../../scripts/lib/mailbox-live-confined.mjs';
import { ROTATED_AUTH, removeRunDir } from '../../scripts/lib/codex-auth-guard.mjs';
import { CODEX_FEATURES_OFF, writeCodexConfig } from '../../scripts/lib/mailbox-behaviour-run.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MODULE = path.join(REPO, 'scripts', 'lib', 'mailbox-live-confined.mjs');
const STUB = path.join(REPO, 'test', 'live', 'mailbox-behaviour-stub.mjs');
const HOME = os.homedir();

function hasWorkingBwrap(binary = '/usr/bin/bwrap') {
  if (os.platform() !== 'linux') return false;
  return cp.spawnSync(binary, ['--ro-bind', '/', '/', '--', 'true'], { stdio: 'ignore' }).status === 0;
}
const HAS_WORKING_BWRAP = hasWorkingBwrap();

const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let shimBytes = null;
/** The workspace shim exactly as this branch's `fgctl` writes it (its generator's output). */
function shim() {
  shimBytes ??= cp.execFileSync('cargo', ['run', '-q', '--locked', '-p', 'fgos-distribution', '--example', 'print-workspace-shim'], { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 20 });
  assert.ok(shimBytes.startsWith('#!/bin/sh'));
  return shimBytes;
}

/** The pinned Codex release directory, when Codex is installed here. */
function codexRelease() {
  try {
    return path.dirname(path.dirname(fs.realpathSync(path.join(HOME, '.local', 'bin', 'codex'))));
  } catch {
    return null;
  }
}

/** The allow-list the tests' launches bind back: the pinned Codex release, Node's install and the stub, as the harness's dry runs do. */
const ALLOW = () => [codexRelease(), path.dirname(path.dirname(process.execPath)), STUB];

/**
 * One base (under /tmp) with a private release of the host under test, a planted login home (scratch
 * bytes, never a real login), a planted secret, a planted host file and a sibling run.
 */
function world() {
  // Under /tmp, as the live base is: the driver's private /tmp hides it unless bound back.
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'mbx-confined-'));
  const host = process.env.FGOS_HOST_BIN;
  assert.ok(host && fs.existsSync(host), 'the test runner names the host binary under test (FGOS_HOST_BIN)');
  const release = path.join(base, 'release');
  fs.mkdirSync(path.join(release, 'bin'), { recursive: true });
  fs.copyFileSync(host, path.join(release, 'bin', 'fgos'));
  fs.chmodSync(path.join(release, 'bin', 'fgos'), 0o755);
  const loginHome = makeFixtureDir('mbx-login-');
  const login = path.join(loginHome, '.claude', '.credentials.json');
  fs.mkdirSync(path.dirname(login), { recursive: true });
  fs.writeFileSync(login, '{"claudeAiOauth":{"accessToken":"SCRATCH-NOT-A-TOKEN","expiresAt":1}}\n', { mode: 0o600 });
  // A project secret under the real home, as every project's is: inside this checkout's runtime scratch.
  const secret = path.join(REPO, '.fgos', 'runtime', `mbx-confined-secret-${process.pid}`, 'project', '.fgos', 'secrets.local.env');
  fs.mkdirSync(path.dirname(secret), { recursive: true });
  fs.writeFileSync(secret, 'PLANTED_SECRET=1\n');
  process.once('exit', () => fs.rmSync(path.join(REPO, '.fgos', 'runtime', `mbx-confined-secret-${process.pid}`), { recursive: true, force: true }));
  const planted = path.join(makeFixtureDir('mbx-planted-'), 'host-file.txt');
  fs.writeFileSync(planted, 'PLANTED\n');
  const sibling = path.join(base, 'run-sibling');
  fs.mkdirSync(sibling, { recursive: true });
  const masks = maskPlan({ allow: ALLOW() });
  return { base, release, loginHome, login, secret, planted, sibling, masks };
}

const baseEnv = (extra = {}) => ({ PATH: process.env.PATH, LANG: 'C.UTF-8', ...extra });

/** Runs `command args` confined as run `runId`, to its exit; returns stdout, the exit and the end. */
async function runConfined(w, runId, command, args, { login = null, env = {}, layOut = null } = {}) {
  const prepared = prepareConfinedRun({ base: w.base, runId, command, args, env: baseEnv(env), login, masks: w.masks, readOnly: layOut ? [path.join(w.base, runId, 'ws', '.fgos', 'installation')] : [] });
  layOut?.(prepared);
  const run = startConfinedRun(prepared);
  let stdout = '';
  run.child.stdout.on('data', (d) => { stdout += d; });
  run.child.stderr.resume();
  const exit = await run.exited;
  const end = await endConfinedRun(run);
  return { prepared, run, stdout, exit, end };
}

const nodeProbe = (body) => ['-e', `const fs = require('fs'); const P = JSON.parse(process.env.PROBE); const code = (fn) => { try { const v = fn(); return v === undefined ? 'ok' : v; } catch (e) { return e.code; } }; ${body}`];

const WRITE_PROBE = `process.stdout.write(JSON.stringify(Object.fromEntries(Object.entries(P).map(([k, f]) => [k, code(() => { fs.mkdirSync(require('path').dirname(f), { recursive: true }); fs.writeFileSync(f, 'W'); })]))));`;
const READ_PROBE = `process.stdout.write(JSON.stringify(Object.fromEntries(Object.entries(P).map(([k, f]) => [k, code(() => fs.readFileSync(f).length)]))));`;

function writeTargets(w, runId) {
  const dir = path.join(w.base, runId);
  return {
    ws: path.join(dir, 'ws', 'probe.txt'),
    mailbox: path.join(dir, 'ws', '.fgos', 'runtime', 'mailbox', 'probe.txt'),
    home: path.join(dir, 'home', 'probe.txt'),
    sibling: path.join(w.sibling, 'probe.txt'),
    base: path.join(w.base, 'probe.txt'),
    repo: path.join(REPO, '.fgos', 'runtime', `mbx-confined-probe-${process.pid}.txt`),
    planted: w.planted,
    realClaude: path.join(HOME, '.claude', `mbx-confined-probe-${process.pid}.txt`),
  };
}

function readTargets(w, runId) {
  const targets = {
    claudeJson: path.join(HOME, '.claude.json'),
    secret: w.secret,
    ownCopy: path.join(w.base, runId, 'home', '.claude', '.credentials.json'),
  };
  if (fs.existsSync(path.join(HOME, '.claude'))) targets.claudeLogin = path.join(HOME, '.claude', '.credentials.json');
  const tetnu = path.join(HOME, '.codex-tetnu', 'auth.json');
  if (fs.existsSync(path.dirname(tetnu))) targets.codexLogin = tetnu;
  return targets;
}

test('a confined run writes its own run directory and nothing else', async (t) => {
  if (!HAS_WORKING_BWRAP) return t.skip('working bwrap backend not available');
  const w = world();
  const before = sha256(w.planted);
  const targets = writeTargets(w, 'run-write');
  const { stdout } = await runConfined(w, 'run-write', process.execPath, nodeProbe(WRITE_PROBE), { env: { PROBE: JSON.stringify(targets) } });
  const seen = JSON.parse(stdout);
  for (const own of ['ws', 'mailbox', 'home']) assert.equal(seen[own], 'ok', `${own}: ${stdout}`);
  for (const other of ['sibling', 'base', 'planted']) assert.equal(seen[other], 'EROFS', `${other}: ${stdout}`);
  // Under the hidden home the parent directories do not exist and cannot be made.
  for (const hidden of ['repo', 'realClaude']) assert.ok(['EROFS', 'ENOENT'].includes(seen[hidden]), `${hidden}: ${stdout}`);
  assert.equal(sha256(w.planted), before, 'the planted host file is unchanged');
  for (const other of ['sibling', 'base', 'repo', 'realClaude']) assert.equal(fs.existsSync(targets[other]), false, other);
});

test('a confined run cannot read a real login store or a project secret, and reads its own login copy', async (t) => {
  if (!HAS_WORKING_BWRAP) return t.skip('working bwrap backend not available');
  const w = world();
  const targets = readTargets(w, 'run-read');
  const { stdout } = await runConfined(w, 'run-read', process.execPath, nodeProbe(READ_PROBE), { env: { PROBE: JSON.stringify(targets) }, login: { cli: 'claude', home: w.loginHome } });
  const seen = JSON.parse(stdout);
  if (targets.claudeLogin) assert.equal(seen.claudeLogin, 'ENOENT');
  if (targets.codexLogin) assert.equal(seen.codexLogin, 'ENOENT');
  assert.equal(seen.claudeJson, 'ENOENT', 'the hidden home has no ~/.claude.json');
  assert.equal(seen.secret, 'ENOENT', 'a project secret under the home is hidden');
  assert.equal(seen.ownCopy, fs.statSync(w.login).size, 'the run reads its own copy');

  const release = codexRelease();
  if (release) {
    const codex = await runConfined(w, 'run-codex-version', path.join(release, 'bin', 'codex'), ['--version']);
    assert.equal(codex.exit.code, 0, 'the masked ~/.codex still lets the pinned Codex binary start');
    assert.match(codex.stdout, /^codex-cli \d+\.\d+\.\d+/);
  }
});

test('the falsifier: the same probes without the confined launch write the planted host file and read the planted secret', () => {
  const w = world();
  const before = sha256(w.planted);
  const write = cp.spawnSync(process.execPath, nodeProbe(WRITE_PROBE), { env: baseEnv({ PROBE: JSON.stringify({ planted: w.planted }) }), encoding: 'utf8' });
  assert.equal(JSON.parse(write.stdout).planted, 'ok');
  assert.notEqual(sha256(w.planted), before);
  const read = cp.spawnSync(process.execPath, nodeProbe(READ_PROBE), { env: baseEnv({ PROBE: JSON.stringify({ secret: w.secret }) }), encoding: 'utf8' });
  assert.equal(JSON.parse(read.stdout).secret, fs.statSync(w.secret).size);
});

test('a confined run holds a copy of its login, never a link', (t) => {
  if (!HAS_WORKING_BWRAP) return t.skip('working bwrap backend not available');
  const w = world();
  const prepared = prepareConfinedRun({ base: w.base, runId: 'run-copy', command: 'true', env: baseEnv(), login: { cli: 'claude', home: w.loginHome }, masks: w.masks });
  const stat = fs.lstatSync(prepared.copy);
  assert.equal(stat.isFile(), true);
  assert.equal(stat.isSymbolicLink(), false);
  assert.equal(stat.mode & 0o777, 0o600);
  assert.deepEqual(fs.readFileSync(prepared.copy), fs.readFileSync(w.login));
  assert.notEqual(stat.ino, fs.statSync(w.login).ino);
  assert.equal(prepared.snapshot, sha256(w.login));
  assert.equal(prepared.env.HOME, path.join(w.base, 'run-copy', 'home'));
});

/** The project's mailbox snapshot, or null. */
const snapshotOf = (ws) => {
  const file = path.join(ws, '.fgos', 'runtime', 'mailbox', 'record', 'snapshot.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
};

async function waitFor(fn, ms = 20_000) {
  const deadline = Date.now() + ms;
  for (;;) {
    const value = fn();
    if (value) return value;
    if (Date.now() > deadline) return null;
    await sleep(100);
  }
}

/** The harness's own send, from outside every sandbox, through the run's shim. */
function harnessSend(ws, to, body) {
  const out = cp.spawnSync(path.join(ws, '.fgos', 'installation', 'bin', 'fgos'), ['mailbox', 'send', '--to', to, '--', body], { cwd: ws, env: { PATH: process.env.PATH, HOME, FGOS_SESSION_ID: 'mailbox-behaviour-harness' }, encoding: 'utf8' });
  return { status: out.status, text: `${out.stdout}${out.stderr}` };
}

const claudeTexts = (home) => {
  const dir = path.join(home, '.claude', 'projects', 'stub');
  return fs.existsSync(dir) ? fs.readdirSync(dir).map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n') : '';
};

test('a send from outside reaches a head registered inside the sandbox; a send before registration is refused as an unknown name', async (t) => {
  if (!HAS_WORKING_BWRAP) return t.skip('working bwrap backend not available');
  const w = world();
  const runId = 'run-send';
  const settings = path.join(w.base, 'settings', `${runId}.json`);
  const prompt = '1. Run: ls\n2. Run: until [ -f go1.txt ]; do sleep 0.2; done\n';
  const prepared = prepareConfinedRun({ base: w.base, runId, command: process.execPath, args: [STUB, 'claude', '-p', '--settings', settings, prompt], env: baseEnv(), masks: w.masks, readOnly: [path.join(w.base, runId, 'ws', '.fgos', 'installation')] });
  layOutRunProject(prepared.paths, { cli: 'claude', release: w.release, shim: shim() });
  const early = harnessSend(prepared.paths.ws, 'ws-claude', 'too early');
  assert.notEqual(early.status, 0);
  assert.match(early.text, /unknown-name/);

  const run = startConfinedRun(prepared);
  run.child.stdout.resume();
  run.child.stderr.resume();
  const binding = await waitFor(() => Object.values(snapshotOf(prepared.paths.ws)?.bindings ?? {})[0]);
  assert.ok(binding, 'the head registered at its first hook');
  assert.equal(JSON.parse(binding.head).pid, 1, 'the head is the sandbox pid 1, seen from its own namespace');
  assert.equal(snapshotOf(prepared.paths.ws).messages?.length ?? 0, 0, 'the registering hook claimed nothing');
  const sent = harnessSend(prepared.paths.ws, binding.name, 'MBX-CONFINED-HELLO');
  assert.equal(sent.status, 0, sent.text);
  fs.writeFileSync(path.join(prepared.paths.ws, 'go1.txt'), '');
  assert.equal((await run.exited).code, 0);
  assert.deepEqual((await endConfinedRun(run)).left, []);

  const [message] = snapshotOf(prepared.paths.ws).messages;
  assert.equal(message.from, 'mailbox-behaviour-harness');
  assert.ok(message.state.offered, JSON.stringify(message.state));
  assert.match(claudeTexts(prepared.paths.home), /MBX-CONFINED-HELLO/, 'the frame reached the head as hook context');
});

test('ending a confined run leaves no process, whether it ignores SIGTERM or forked a setsid child', async (t) => {
  if (!HAS_WORKING_BWRAP) return t.skip('working bwrap backend not available');
  const w = world();
  for (const [runId, script] of [['run-trap', "trap '' TERM; while :; do sleep 1; done"], ['run-setsid', 'setsid sleep 600 & sleep 600']]) {
    const prepared = prepareConfinedRun({ base: w.base, runId, command: 'sh', args: ['-c', script], env: baseEnv(), masks: w.masks });
    const run = startConfinedRun(prepared);
    await sleep(300);
    assert.ok(processesOfRun(prepared.paths.dir, run.entry.pidNs).length >= 2, `${runId} runs before the end`);
    const { left } = await endConfinedRun(run);
    assert.deepEqual(left, [], runId);
    assert.deepEqual(processesOfRun(prepared.paths.dir, run.entry.pidNs), [], runId);
    assert.ok(JSON.parse(fs.readFileSync(prepared.paths.ledger, 'utf8')).endedAt);
  }
});

test('the orphan sweep kills a run the harness did not finish, even one whose launch facts were never written, and records it as an error before a new run starts', async (t) => {
  if (!HAS_WORKING_BWRAP) return t.skip('working bwrap backend not available');
  const w = world();
  const harness = `
    const C = await import(${JSON.stringify(MODULE)});
    const entries = [];
    for (const runId of ['run-orphan-a', 'run-orphan-b']) {
      const prepared = C.prepareConfinedRun({ base: ${JSON.stringify(w.base)}, runId, command: 'sleep', args: ['600'], env: { PATH: process.env.PATH }, masks: ${JSON.stringify(w.masks)}, login: { cli: 'claude', home: ${JSON.stringify(w.loginHome)} } });
      entries.push(C.startConfinedRun(prepared, { stdio: 'ignore' }).entry);
    }
    process.stdout.write(JSON.stringify(entries) + '\\n');
    setInterval(() => {}, 1000);`;
  const child = cp.spawn(process.execPath, ['--input-type=module', '-e', harness], { stdio: ['ignore', 'pipe', 'inherit'] });
  const line = await new Promise((resolve) => { let buf = ''; child.stdout.on('data', (d) => { buf += d; if (buf.includes('\n')) resolve(buf.split('\n')[0]); }); });
  const entries = JSON.parse(line);
  // Each ledger entry names its login copy and the copy's snapshot; one copy changes while it runs.
  for (const entry of entries) assert.equal(entry.login.snapshot, sha256(w.login), entry.runId);
  fs.appendFileSync(entries[0].login.copy, 'REFRESHED');
  child.kill('SIGKILL');
  await new Promise((resolve) => child.once('exit', resolve));
  for (const entry of entries) assert.ok(processesOfRun(entry.dir, entry.pidNs).length > 0, `${entry.runId} outlives its killed harness`);
  // A harness killed between the spawn and the second ledger write leaves an entry without launch facts.
  const bareFile = path.join(w.base, 'ledger', 'run-orphan-b.json');
  fs.writeFileSync(bareFile, JSON.stringify({ runId: 'run-orphan-b', dir: entries[1].dir, startedAt: entries[1].startedAt }));

  // The bare entry lost its launch facts but keeps the copy's: written before the spawn.
  fs.writeFileSync(bareFile, JSON.stringify({ ...JSON.parse(fs.readFileSync(bareFile, 'utf8')), login: entries[1].login }));
  const { swept, left, asides } = sweepOrphans(w.base);
  assert.deepEqual(swept, ['run-orphan-a', 'run-orphan-b']);
  assert.deepEqual(left, []);
  // An orphan's login copy is settled as a finished run's: the changed one set aside, the equal one removed.
  assert.deepEqual(asides.map((a) => [a.runId, a.aside]), [['run-orphan-a', path.join(entries[0].dir, ROTATED_AUTH)]]);
  assert.match(asides[0].stop, /login refreshed inside a run/);
  assert.match(fs.readFileSync(asides[0].aside, 'utf8'), /REFRESHED$/);
  assert.equal(fs.existsSync(entries[0].login.copy), false);
  assert.equal(fs.existsSync(entries[1].login.copy), false, 'an unchanged copy is removed');
  assert.ok(fs.existsSync(path.dirname(entries[1].login.copy)), 'only the copy, never its home');
  for (const entry of entries) {
    assert.deepEqual(processesOfRun(entry.dir, entry.pidNs), [], entry.runId);
    const recorded = JSON.parse(fs.readFileSync(path.join(w.base, 'ledger', `${entry.runId}.json`), 'utf8'));
    assert.equal(recorded.outcome, 'error');
    assert.equal(recorded.reason, 'orphan');
  }
  assert.deepEqual(sweepOrphans(w.base).swept, [], 'a swept run is not swept again');

  const next = await runConfined(w, 'run-after-sweep', 'true', []);
  assert.equal(next.exit.code, 0);
});

test('an orphan whose processes survive the kill still has its login copy settled, stays open and refuses runs until a later sweep ends it, settling a copy written since', async (t) => {
  if (!HAS_WORKING_BWRAP) return t.skip('working bwrap backend not available');
  const w = world();
  const prepared = prepareConfinedRun({ base: w.base, runId: 'run-survivor', command: 'true', env: baseEnv(), masks: w.masks, login: { cli: 'claude', home: w.loginHome } });
  const run = startConfinedRun(prepared);
  await run.exited;
  // The harness died before ending the run, and a process of the run (by its cwd) outlives it.
  const survivor = cp.spawn('sleep', ['600'], { cwd: prepared.paths.dir, stdio: 'ignore', detached: true });
  t.after(() => { try { process.kill(survivor.pid, 'SIGKILL'); } catch { /* gone */ } });
  await sleep(100);
  const ledger = prepared.paths.ledger;

  // A sweep that cannot end the process (no time to wait) still settles the unchanged copy.
  const first = sweepOrphans(w.base, { waitMs: 0 });
  assert.deepEqual(first.left, [survivor.pid]);
  assert.deepEqual(first.asides, []);
  assert.deepEqual(first.unsettled, []);
  assert.equal(fs.existsSync(prepared.copy), false, 'the unchanged copy is removed although the run is not ended');
  let entry = JSON.parse(fs.readFileSync(ledger, 'utf8'));
  assert.equal(entry.endedAt, undefined, 'the entry stays open');
  assert.equal(entry.loginSettled, true);
  // The harness starts no run while `left` is not empty (test/live/mailbox-behaviour.live.mjs `recover`).

  // The surviving CLI writes a new copy; the next sweep ends the process and sets that copy aside.
  fs.writeFileSync(prepared.copy, 'REFRESHED');
  const second = sweepOrphans(w.base);
  assert.deepEqual(second.left, []);
  assert.deepEqual(second.asides.map((a) => [a.runId, a.aside]), [['run-survivor', path.join(prepared.paths.dir, ROTATED_AUTH)]]);
  assert.equal(fs.readFileSync(second.asides[0].aside, 'utf8'), 'REFRESHED');
  entry = JSON.parse(fs.readFileSync(ledger, 'utf8'));
  assert.ok(entry.endedAt);
  assert.deepEqual(sweepOrphans(w.base), { swept: [], left: [], asides: [], unsettled: [] }, 'an ended entry is not swept again');
});

test('a login copy the sweep cannot set aside, because one is set aside there already, is reported unsettled and refuses runs', async (t) => {
  if (!HAS_WORKING_BWRAP) return t.skip('working bwrap backend not available');
  const w = world();
  const prepared = prepareConfinedRun({ base: w.base, runId: 'run-unsettled', command: 'true', env: baseEnv(), masks: w.masks, login: { cli: 'claude', home: w.loginHome } });
  const run = startConfinedRun(prepared);
  await run.exited;
  fs.writeFileSync(path.join(prepared.paths.dir, ROTATED_AUTH), 'EARLIER');
  fs.appendFileSync(prepared.copy, 'CHANGED');
  const { unsettled } = sweepOrphans(w.base);
  assert.deepEqual(unsettled.map((u) => [u.runId, u.copy]), [['run-unsettled', prepared.copy]]);
  assert.ok(fs.existsSync(prepared.copy), 'nothing is deleted');
});

test('two heads in two sandboxes share one record, and each receives the other\'s frame', async (t) => {
  if (!HAS_WORKING_BWRAP) return t.skip('working bwrap backend not available');
  const w = world();
  const workspace = path.join(w.base, 'pair');
  fs.mkdirSync(workspace);
  const ws = path.join(workspace, 'ws');
  const installation = path.join(ws, '.fgos', 'installation');
  const prompt = (me, peer) => `1. Run: ls\n2. Run: until [ -f go.txt ]; do sleep 0.2; done; fgos mailbox send --to "$(cat peer-${me}.txt)" -- "MBX-FROM-${me}"; touch sent-${me}.txt\n3. Run: until [ -f sent-${peer}.txt ]; do sleep 0.2; done\n`;
  const runs = {};
  for (const [me, peer] of [['A', 'B'], ['B', 'A']]) {
    const runId = `run-pair-${me}`;
    const settings = path.join(w.base, 'settings', `${runId}.json`);
    const prepared = prepareConfinedRun({ base: w.base, runId, workspace, command: process.execPath, args: [STUB, 'claude', '-p', '--settings', settings, prompt(me, peer)], env: baseEnv({ PATH: `${path.join(installation, 'bin')}:${process.env.PATH}` }), masks: w.masks, readOnly: [installation] });
    if (me === 'A') layOutRunProject(prepared.paths, { cli: 'claude', release: w.release, shim: shim() });
    else fs.copyFileSync(path.join(w.base, 'settings', 'run-pair-A.json'), settings);
    runs[me] = startConfinedRun(prepared);
    runs[me].prepared = prepared;
    runs[me].child.stdout.resume();
    runs[me].child.stderr.resume();
  }
  const bindings = await waitFor(() => { const b = Object.values(snapshotOf(ws)?.bindings ?? {}); return b.length === 2 ? b : null; });
  assert.ok(bindings, 'both heads registered');
  const nameOf = (me) => bindings.find((b) => JSON.parse(b.head).pidNs === runs[me].entry.pidNs)?.name;
  assert.ok(nameOf('A') && nameOf('B') && nameOf('A') !== nameOf('B'), JSON.stringify(bindings));
  fs.writeFileSync(path.join(ws, 'peer-A.txt'), nameOf('B'));
  fs.writeFileSync(path.join(ws, 'peer-B.txt'), nameOf('A'));
  fs.writeFileSync(path.join(ws, 'go.txt'), '');
  for (const me of ['A', 'B']) {
    assert.equal((await runs[me].exited).code, 0, me);
    assert.deepEqual((await endConfinedRun(runs[me])).left, [], me);
  }
  const messages = snapshotOf(ws).messages;
  assert.equal(messages.length, 2);
  for (const m of messages) assert.ok(m.state.offered, JSON.stringify(m));
  assert.match(claudeTexts(runs.A.prepared.paths.home), /MBX-FROM-B/);
  assert.match(claudeTexts(runs.B.prepared.paths.home), /MBX-FROM-A/);
});

test('a changed login copy is set aside, never deleted, keeps its run directory and stops the batch', async (t) => {
  if (!HAS_WORKING_BWRAP) return t.skip('working bwrap backend not available');
  const w = world();
  const source = fs.readFileSync(w.login);
  const { prepared, exit } = await runConfined(w, 'run-rotate', 'sh', ['-c', 'printf CHANGED >> "$HOME/.claude/.credentials.json"'], { login: { cli: 'claude', home: w.loginHome } });
  assert.equal(exit.code, 0);
  const settled = settleLoginCopy(prepared);
  assert.match(settled.stop, /login refreshed inside a run/);
  assert.equal(settled.aside, path.join(prepared.paths.dir, ROTATED_AUTH));
  assert.equal(fs.readFileSync(settled.aside, 'utf8'), `${source}CHANGED`);
  assert.equal(fs.existsSync(prepared.copy), false);
  assert.match(removeRunDir(prepared.paths.dir), /refusing to remove/);
  assert.deepEqual(fs.readFileSync(w.login), source, 'the source login is untouched');

  const { prepared: same } = await runConfined(w, 'run-same', 'true', [], { login: { cli: 'claude', home: w.loginHome } });
  assert.equal(settleLoginCopy(same), null);
  assert.equal(fs.existsSync(same.copy), false, 'an unchanged copy is removed, by its name only');
  assert.ok(fs.existsSync(same.paths.home), 'the home with its transcripts stays');
});

/** A scratch home with credential-like files at paths no list names, one allow-listed tool, and a scratch runtime directory. */
function plantedHome() {
  const home = makeFixtureDir('mbx-cred-home-');
  const runtimeDir = makeFixtureDir('mbx-cred-run-');
  const planted = {};
  for (const rel of [path.join('.pi', 'agent', 'auth.json'), path.join('.pi', 'accounts', 'openrouter', 'auth.json'), path.join('.omp', 'agent', 'auth.json'), path.join('.config', '.wrangler', 'config', 'default.toml'), path.join('.local', 'share', 'keyrings', 'login.keyring'), '.npmrc', path.join('some-new-cli', 'deep', 'token.json')]) {
    const file = path.join(home, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, 'PLANTED-CREDENTIAL\n');
    planted[rel] = file;
  }
  planted.runtime = path.join(runtimeDir, 'keyring', 'control');
  fs.mkdirSync(path.dirname(planted.runtime), { recursive: true });
  fs.writeFileSync(planted.runtime, 'PLANTED-CREDENTIAL\n');
  const tool = path.join(home, '.local', 'share', 'tool', 'bin', 'tool');
  fs.mkdirSync(path.dirname(tool), { recursive: true });
  fs.writeFileSync(tool, 'TOOL\n');
  return { home, runtimeDir, planted, tool };
}

test('the whole home and the runtime directory are hidden but for the allow-list: a file at any other home path is unreadable inside the sandbox, and the plan is recorded in full', async (t) => {
  if (!HAS_WORKING_BWRAP) return t.skip('working bwrap backend not available');
  const { home, runtimeDir, planted, tool } = plantedHome();
  const masks = maskPlan({ home, runtimeDir, allow: [path.dirname(path.dirname(tool)), path.join(home, 'not-there'), '/usr/bin'] });
  assert.deepEqual(masks, { hidden: [home, runtimeDir], bindBack: [path.dirname(path.dirname(tool))] }, 'only an existing path inside the home is bound back');
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'mbx-cred-'));
  const loginHome = makeFixtureDir('mbx-cred-login-');
  fs.writeFileSync(path.join(loginHome, 'auth.json'), '{"tokens":{"access_token":"SCRATCH"}}');
  const probe = { ...planted, tool };
  const prepared = prepareConfinedRun({ base, runId: 'run-allow', command: process.execPath, args: nodeProbe(READ_PROBE), env: baseEnv({ PROBE: JSON.stringify(probe) }), masks, login: { cli: 'codex', home: loginHome } });
  const run = startConfinedRun(prepared);
  let stdout = '';
  run.child.stdout.on('data', (d) => { stdout += d; });
  run.child.stderr.resume();
  await run.exited;
  await endConfinedRun(run);
  const seen = JSON.parse(stdout);
  for (const key of Object.keys(planted)) assert.equal(seen[key], 'ENOENT', `${key}: ${stdout}`);
  assert.equal(seen.tool, 'TOOL\n'.length, 'the allow-listed tool is readable');
  const entry = JSON.parse(fs.readFileSync(prepared.paths.ledger, 'utf8'));
  assert.deepEqual(entry.masks, masks, 'the ledger entry records the plan itself');
  assert.equal(entry.maskSha256, maskPlanSha256(masks));
  assert.deepEqual(entry.argv, [process.execPath, ...nodeProbe(READ_PROBE)]);
  // The falsifier: the same probe without the confined launch reads every planted file.
  const open = cp.spawnSync(process.execPath, nodeProbe(READ_PROBE), { env: baseEnv({ PROBE: JSON.stringify(probe) }), encoding: 'utf8' });
  for (const [key, value] of Object.entries(JSON.parse(open.stdout))) assert.equal(value, key === 'tool' ? 'TOOL\n'.length : 'PLANTED-CREDENTIAL\n'.length, key);
});

test('a confined Codex run lists no MCP server and has its connectors off, and the same launch with a planted server and without the off switches lists one', async (t) => {
  if (!HAS_WORKING_BWRAP) return t.skip('working bwrap backend not available');
  const release = codexRelease();
  if (!release) return t.skip('Codex is not installed');
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'mbx-mcp-'));
  const loginHome = makeFixtureDir('mbx-mcp-login-');
  fs.writeFileSync(path.join(loginHome, 'auth.json'), '{"tokens":{"access_token":"SCRATCH-NOT-A-TOKEN"}}');
  const masks = maskPlan({ allow: ALLOW() });
  const codex = path.join(release, 'bin', 'codex');
  const zeroModel = async (runId, args, config) => {
    const prepared = prepareConfinedRun({ base, runId, command: codex, args, env: baseEnv(), masks, login: { cli: 'codex', home: loginHome } });
    config(prepared.paths.home);
    const run = startConfinedRun(prepared);
    let stdout = '';
    run.child.stdout.on('data', (d) => { stdout += d; });
    run.child.stderr.on('data', (d) => { stdout += d; });
    const exit = await run.exited;
    await endConfinedRun(run);
    assert.equal(exit.code, 0, `${runId}: ${stdout}`);
    return stdout;
  };
  const confinedConfig = (home) => writeCodexConfig(home, path.join(base, 'ws'), {}, { effort: 'low' });
  const planted = (home) => {
    confinedConfig(home);
    fs.appendFileSync(path.join(home, 'config.toml'), '\n[mcp_servers.planted]\ncommand = "/bin/true"\n');
  };
  const withoutOff = (home) => {
    confinedConfig(home);
    const toml = fs.readFileSync(path.join(home, 'config.toml'), 'utf8');
    fs.writeFileSync(path.join(home, 'config.toml'), toml.split('\n').filter((l) => !CODEX_FEATURES_OFF.some((f) => l.startsWith(`${f} =`))).join('\n'));
  };
  const flag = (listing, feature) => new RegExp(`^${feature}\\s+\\S.*\\s(true|false)$`, 'm').exec(listing)?.[1];

  assert.match(await zeroModel('run-mcp-list', ['mcp', 'list'], confinedConfig), /No MCP servers configured/);
  const features = await zeroModel('run-features', ['features', 'list'], confinedConfig);
  // The account's connectors are the H3 risk: named here, not only through the list under test.
  for (const feature of new Set(['apps', 'plugins', ...CODEX_FEATURES_OFF])) assert.equal(flag(features, feature), 'false', feature);

  assert.match(await zeroModel('run-mcp-planted', ['mcp', 'list'], planted), /^planted\s/m, 'the falsifier: a planted server is listed');
  assert.equal(flag(await zeroModel('run-features-on', ['features', 'list'], withoutOff), 'apps'), 'true', 'the falsifier: connectors are on by default');
});

/** pi's and omp's installs (the confined launch's one definition), when installed here. */
function piOmpInstall() {
  const install = confinedPiOmpInstall();
  return install.installed ? { ...install, piBin: install.pi } : null;
}

/** A scratch OAuth credential in the account shape: never a real token. */
const scratchCredential = () => ({ type: 'oauth', access: 'SCRATCH-NOT-A-TOKEN', refresh: 'SCRATCH-REFRESH', expires: Date.now() + 864e5, accountId: 'acct-scratch' });

test('a confined pi or omp run cannot read the real account stores, starts from its bound-back binary, and its copied account holds no sessions', async (t) => {
  if (!HAS_WORKING_BWRAP) return t.skip('working bwrap backend not available');
  const install = piOmpInstall();
  if (!install) return t.skip('pi and omp are not installed');
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'mbx-piomp-'));
  const masks = maskPlan({ allow: [...install.allow, path.dirname(path.dirname(process.execPath))] });
  // Every account store of both CLIs, by the real paths the owner's accounts use.
  const stores = Object.fromEntries([
    ...['.pi/accounts', '.omp/profiles'].flatMap((dir) => (fs.existsSync(path.join(HOME, dir)) ? fs.readdirSync(path.join(HOME, dir)).map((a) => [`${dir}/${a}`, path.join(HOME, dir, a)]) : [])),
    ['.pi/agent/auth.json', path.join(HOME, '.pi', 'agent', 'auth.json')],
    ['.omp/agent/agent.db', path.join(HOME, '.omp', 'agent', 'agent.db')],
  ]);
  const confinedRun = async (runId, command, args, { env = {}, accountLogin }) => {
    const prepared = prepareConfinedRun({ base, runId, command, args, env: baseEnv(env), masks, accountLogin });
    const run = startConfinedRun(prepared);
    let stdout = '';
    run.child.stdout.on('data', (d) => { stdout += d; });
    run.child.stderr.on('data', (d) => { stdout += d; });
    const exit = await run.exited;
    await endConfinedRun(run);
    return { prepared, stdout, exit };
  };
  const probeScript = `const fs = require('fs'); const P = JSON.parse(process.env.PROBE); process.stdout.write(JSON.stringify(Object.fromEntries(Object.entries(P).map(([k, f]) => { try { fs.statSync(f); return [k, 'visible']; } catch (e) { return [k, e.code]; } }))));`;
  const pi = await confinedRun('run-pi', process.execPath, ['-e', probeScript], { env: { PROBE: JSON.stringify(stores) }, accountLogin: { cli: 'pi', credential: scratchCredential() } });
  for (const [key, value] of Object.entries(JSON.parse(pi.stdout))) assert.equal(value, 'ENOENT', `${key} is hidden`);
  // The copied account: the login file alone, a copy (never a link), no sessions.
  assert.deepEqual(fs.readdirSync(pi.prepared.paths.home).filter((f) => f !== '.ownership.json' && !f.startsWith('.fgos')).sort(), ['auth.json']);
  assert.equal(fs.lstatSync(pi.prepared.copy).isSymbolicLink(), false);
  assert.equal(fs.statSync(pi.prepared.copy).mode & 0o777, 0o600);

  const piVersion = await confinedRun('run-pi-version', install.piBin, ['--version'], { env: { PI_CODING_AGENT_DIR: path.join(base, 'run-pi-version', 'home') }, accountLogin: { cli: 'pi', credential: scratchCredential() } });
  assert.equal(piVersion.exit.code, 0, piVersion.stdout);
  assert.match(piVersion.stdout, /^\d+\.\d+\.\d+/m, 'pi starts from its bound-back launcher and install');

  const omp = await confinedRun('run-omp-version', install.omp, ['--version'], { env: { PI_NATIVES_DIR: install.natives }, accountLogin: { cli: 'omp', credential: scratchCredential(), profile: 'acct', ompBin: install.omp, nativesDir: install.natives } });
  assert.equal(omp.exit.code, 0, omp.stdout);
  assert.match(omp.stdout, /omp\/\d+\.\d+\.\d+/, 'omp starts from its bound-back binary and natives');
  const agentDir = path.dirname(omp.prepared.copy);
  assert.equal(omp.prepared.copy, path.join(omp.prepared.paths.home, '.omp', 'profiles', 'acct', 'agent', 'agent.db'));
  assert.equal(fs.existsSync(path.join(agentDir, 'sessions')) ? fs.readdirSync(path.join(agentDir, 'sessions')).length : 0, 0, 'the copied omp account holds no sessions');
  assert.equal(fs.existsSync(path.join(omp.prepared.paths.home, '.omp', 'natives')), false, 'the natives are read where they are installed, never unpacked into the run');
});

test('an omp login copy is compared by its credential rows: rows a run adds leave it unchanged and it is removed, leaving no WAL file; a changed credential is set aside and stops the batch', async (t) => {
  const install = piOmpInstall();
  if (!install) return t.skip('omp is not installed');
  const home = makeFixtureDir('mbx-omp-login-');
  const run = path.dirname(home);
  const made = materializeAccountLogin({ cli: 'omp', home, credential: scratchCredential(), profile: 'acct', ompBin: install.omp, nativesDir: install.natives });
  assert.equal(made.digest, 'credentials');
  // The rows omp writes on every run (usage, cache) are not the login.
  const db = new DatabaseSync(made.copy);
  db.exec("CREATE TABLE IF NOT EXISTS usage_probe (n INTEGER); INSERT INTO usage_probe VALUES (1);");
  db.close();
  assert.equal(credentialRowsDigest(made.copy), made.snapshot);
  assert.equal(settleCopy(made, run), null);
  for (const f of [made.copy, `${made.copy}-wal`, `${made.copy}-shm`]) assert.equal(fs.existsSync(f), false, f);

  const again = materializeAccountLogin({ cli: 'omp', home: makeFixtureDir('mbx-omp-login-'), credential: scratchCredential(), profile: 'acct', ompBin: install.omp, nativesDir: install.natives });
  const changed = new DatabaseSync(again.copy);
  changed.exec(`UPDATE auth_credentials SET data = json_set(data, '$.access', 'ROTATED')`);
  changed.close();
  const settled = settleCopy(again, path.dirname(path.dirname(again.copy)));
  assert.match(settled.stop, /login refreshed inside a run/);
  assert.equal(path.basename(settled.aside), ROTATED_AUTH);
  assert.equal(fs.existsSync(again.copy), false);
  const kept = new DatabaseSync(settled.aside, { readOnly: true });
  assert.match(kept.prepare('SELECT data FROM auth_credentials').get().data, /ROTATED/, 'the set-aside copy keeps the rotated credential');
  kept.close();
});

test('the account credential is read from a scratch copy of the profile store, so the owner\'s database, WAL and index keep their bytes, mtimes and inodes; a store with no credential or no database refuses the launch', () => {
  const profile = makeFixtureDir('mbx-omp-profile-');
  const scratchDir = makeFixtureDir('mbx-login-read-');
  assert.throws(() => readAccountCredential(profile, scratchDir), /never logged in/);
  fs.mkdirSync(path.join(profile, 'agent'));
  const file = path.join(profile, 'agent', 'agent.db');
  // The owner's omp keeps its store open in WAL mode, so a -wal and a -shm file exist beside it.
  const owner = new DatabaseSync(file);
  owner.exec('PRAGMA journal_mode = WAL; CREATE TABLE auth_credentials (id INTEGER PRIMARY KEY, provider TEXT, credential_type TEXT, data TEXT, disabled_cause TEXT)');
  assert.throws(() => readAccountCredential(profile, scratchDir), /holds no openai-codex credential/);
  owner.prepare('INSERT INTO auth_credentials (provider, credential_type, data) VALUES (?, ?, ?)').run('openai-codex', 'oauth', JSON.stringify({ access: 'A', refresh: 'R', expires: 5, accountId: 'X' }));
  owner.prepare('INSERT INTO auth_credentials (provider, credential_type, data, disabled_cause) VALUES (?, ?, ?, ?)').run('openai-codex', 'oauth', JSON.stringify({ access: 'OLD' }), 'revoked');
  const dir = path.dirname(file);
  // Every file of the store directory, by name, inode, mtime and bytes.
  const stamp = () => fs.readdirSync(dir).sort().map((n) => {
    const st = fs.statSync(path.join(dir, n), { bigint: true });
    return { n, ino: st.ino, mtimeNs: st.mtimeNs, sha: sha256(path.join(dir, n)) };
  });
  const credential = { type: 'oauth', access: 'A', refresh: 'R', expires: 5, accountId: 'X' };
  // While the owner's omp holds the store open: its rows sit in the WAL.
  assert.deepEqual(stamp().map((e) => e.n), ['agent.db', 'agent.db-shm', 'agent.db-wal']);
  let before = stamp();
  assert.deepEqual(readAccountCredential(profile, scratchDir), credential, 'the newest live row, read with the WAL\'s rows');
  assert.deepEqual(stamp(), before, 'no file of the open store was written, replaced or touched');
  // At rest (the owner's omp closed): only agent.db is left.
  owner.close();
  before = stamp();
  assert.deepEqual(before.map((e) => e.n), ['agent.db']);
  assert.deepEqual(readAccountCredential(profile, scratchDir), credential);
  assert.deepEqual(stamp(), before, 'no file appeared beside the store at rest');
  assert.deepEqual(fs.readdirSync(scratchDir), [], 'the copy is removed');
  // The falsifier: a read-only open of the store in place writes beside it.
  const inPlace = new DatabaseSync(file, { readOnly: true });
  inPlace.prepare('SELECT count(*) FROM auth_credentials').get();
  inPlace.close();
  assert.notDeepEqual(stamp(), before, 'an in-place read-only open creates the owner\'s -wal and -shm');
});
