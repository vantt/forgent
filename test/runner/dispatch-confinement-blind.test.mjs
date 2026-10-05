// dispatch-confinement-blind.test.mjs — hostRead: blind. A blind worker keeps the host readable
// except other dispatches' run state, homes, processes and the herdr socket; a blind dispatch is
// refused, never run unblind, when it cannot be enforced.

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import cp from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

import { assessBwrap, prepareBwrap } from '../../src/runner/dispatch/confinement/drivers/bwrap.mjs';
import { buildConfinementRequest } from '../../src/runner/dispatch/confinement/request.mjs';
import { executeThroughConfinement } from '../../src/runner/dispatch/confinement/authority.mjs';
import { loadAttestationRecord, saveProbeCacheRecord } from '../../src/runner/dispatch/confinement/attestation-store.mjs';
import { resolveBlindHiddenRoots } from '../../src/runner/dispatch/confinement/resources.mjs';
import {
  BLIND_HIDDEN_ROOTS,
  CONTROL_AXES,
  CONTROL_ORDER,
  resolveConfinementPolicy,
  validateOverrideConfinementShape,
} from '../../src/runner/dispatch/confinement/policies.mjs';
import {
  computeProbeFingerprint,
  probePeerRunHidden,
  runAllConfinementProbes,
} from '../../src/runner/dispatch/confinement/probes/harness.mjs';
import { DispatchError } from '../../src/runner/dispatch/transport.mjs';
import { checkConfinementBlindRead } from '../../src/setup/registrations.mjs';
import { seedFileLocalBwrapRegistry } from './confinement-registry-fixture.helper.mjs';

function hasWorkingBwrap(binary = '/usr/bin/bwrap') {
  if (os.platform() !== 'linux') return false;
  return cp.spawnSync(binary, ['--ro-bind', '/', '/', '--', 'true'], { stdio: 'ignore' }).status === 0;
}
const HAS_WORKING_BWRAP = hasWorkingBwrap();

// Confined runs mount a private tmpfs over /tmp, so fixtures a worker must reach live outside it.
const FIXTURE_ROOT = fs.existsSync('/var/tmp') ? '/var/tmp' : os.tmpdir();

seedFileLocalBwrapRegistry();

const attestationStore = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-blind-attestations-'));
process.env.FGOS_CONFINEMENT_ATTESTATION_STORE_PATH = attestationStore;
after(() => {
  delete process.env.FGOS_CONFINEMENT_ATTESTATION_STORE_PATH;
  fs.rmSync(attestationStore, { recursive: true, force: true });
});

const roots = [];
after(() => {
  for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
});

function git(cwd, ...args) {
  return cp.execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

/**
 * A checkout with tracked files under .fgos, ignored run state with a peer's and an own
 * assignment, a workflow run, a herdr socket directory and a confinement temp root that holds a
 * peer's home.
 */
function makeProject() {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(FIXTURE_ROOT, 'fgos-blind-')));
  roots.push(root);
  const proj = path.join(root, 'project');
  const fgosDir = path.join(proj, '.fgos');
  const write = (file, text) => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
    return file;
  };

  fs.mkdirSync(proj, { recursive: true });
  git(proj, 'init', '-q', '-b', 'main');
  write(path.join(proj, '.gitignore'), '.fgos/assignments/\n.fgos/workflow-runs/\n.fgos/dispatch-runs/\n');
  write(path.join(fgosDir, 'config.json'), '{}\n');
  const repoFile = write(path.join(proj, 'src', 'file.txt'), 'REPO-FILE\n');
  git(proj, '-c', 'user.name=t', '-c', 'user.email=t@t', 'add', '-A');
  git(proj, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'initial');

  const peerReport = write(path.join(fgosDir, 'assignments', 'u1', 'peer', '1', 'outbox', 'report-1.md'), 'PEER-SECRET\n');
  const ownDir = path.join(fgosDir, 'assignments', 'u1', 'self', '1');
  const ownBrief = write(path.join(ownDir, 'brief.md'), 'OWN-BRIEF\n');
  const ownRef = write(path.join(ownDir, 'inputs', 'ref.md'), 'OWN-REF\n');
  const runDir = path.join(ownDir, 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  const gateAnswer = write(path.join(fgosDir, 'workflow-runs', 'wf1', 'gate-answers', 's1.md'), 'GATE-SECRET\n');
  write(path.join(fgosDir, 'dispatch-runs', 'd1', 'stdout.log'), 'DISPATCH-SECRET\n');

  const herdrDir = path.join(root, 'herdr');
  fs.mkdirSync(herdrDir, { recursive: true });
  const socket = path.join(herdrDir, 'herdr.sock');

  const tempRoot = path.join(root, 'confinement-temp');
  const peerHome = write(path.join(tempRoot, 'disp_peer', 'home', 'transcript.txt'), 'PEER-HOME\n');

  return {
    root, proj, fgosDir, runDir, ownDir, ownBrief, ownRef, peerReport, gateAnswer, repoFile, herdrDir, socket,
    tempRoot, peerHome, homeDir: path.join(tempRoot, 'disp_self', 'home'), outbox: path.join(runDir, 'outbox'),
  };
}

const BWRAP_BACKEND = (project) => ({
  id: 'bwrap',
  type: 'bwrap',
  config: { type: 'bwrap', executable: '/usr/bin/bwrap', tempRoot: project.tempRoot },
});

function requestFor(project, { blind = true, script = 'process.exit(0)', contextRefs, cwd = project.proj, requirement } = {}) {
  return buildConfinementRequest({
    capability: 'code:review',
    executorId: 'bwrap-exec',
    dispatchId: 'disp_self',
    requirement: requirement ?? { mode: 'required', policyId: 'workspace-write', policy: resolveConfinementPolicy('workspace-write') },
    ...(blind ? { blind: true } : {}),
    backendId: 'bwrap',
    invocation: { command: 'node', args: ['-e', script], env: {}, adapter: 'herdr-spawn' },
    context: { cwd, repoRoot: cwd, runDir: project.runDir, fgosDir: project.fgosDir, ...(contextRefs ? { contextRefs } : {}) },
  });
}

async function prepare(project, options) {
  const request = requestFor(project, options);
  const backend = BWRAP_BACKEND(project);
  const assessment = assessBwrap(request, backend);
  assert.deepEqual(assessment.mismatches, []);
  const prepared = await prepareBwrap({ resources: assessment.resources, coverage: assessment.coverage }, request, backend);
  return { request, assessment, prepared };
}

/** Everything the worker script checks, as it sees it from inside the sandbox. */
function observationScript(project, siblingPid) {
  const paths = {
    proj: project.proj, fgos: project.fgosDir, tempRoot: project.tempRoot, socket: project.socket,
    peerReport: project.peerReport, gateAnswer: project.gateAnswer, peerHome: project.peerHome, siblingPid,
    ownBrief: project.ownBrief, ownRef: project.ownRef, outbox: path.join(project.outbox, 'out.txt'),
    home: path.join(project.homeDir, 'h.txt'), repoFile: project.repoFile,
    inMask: path.join(project.fgosDir, 'assignments', 'new.txt'),
  };
  return `
    const P = ${JSON.stringify(paths)};
    const fs = require('fs'); const net = require('net'); const cp = require('child_process'); const dns = require('dns');
    const code = (fn) => { try { fn(); return 'ok'; } catch (e) { return e.code || String(e); } };
    const tree = [];
    const walk = (dir) => { let entries; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const e of entries) { const f = dir + '/' + e.name; tree.push(f.slice(P.fgos.length)); if (e.isDirectory()) walk(f); } };
    walk(P.fgos);
    (async () => {
      const git = cp.spawnSync('git', ['status', '--porcelain'], { cwd: P.proj, encoding: 'utf8' });
      const grep = cp.spawnSync('grep', ['-rl', 'PEER-SECRET\\\\|GATE-SECRET\\\\|DISPATCH-SECRET\\\\|PEER-HOME', P.proj, P.tempRoot], { encoding: 'utf8' });
      const find = cp.spawnSync('find', [P.fgos, '-name', 'report-1.md'], { encoding: 'utf8' });
      process.stdout.write(JSON.stringify({
        peerReport: code(() => fs.readFileSync(P.peerReport)),
        gateAnswer: code(() => fs.readFileSync(P.gateAnswer)),
        peerHome: code(() => fs.readFileSync(P.peerHome)),
        peerProcess: code(() => fs.readFileSync('/proc/' + P.siblingPid + '/cmdline')),
        socket: await new Promise((r) => { const s = net.connect(P.socket); s.on('connect', () => { s.destroy(); r('connected'); }); s.on('error', (e) => r(e.code)); }),
        tree, grep: grep.stdout, find: find.stdout,
        ownBrief: code(() => fs.readFileSync(P.ownBrief)), ownBriefWrite: code(() => fs.writeFileSync(P.ownBrief, 'EDIT')),
        ownRef: code(() => fs.readFileSync(P.ownRef)), ownRefWrite: code(() => fs.writeFileSync(P.ownRef, 'EDIT')),
        outbox: code(() => fs.writeFileSync(P.outbox, 'WRITTEN')), home: code(() => fs.writeFileSync(P.home, 'WRITTEN')),
        maskWrite: code(() => fs.writeFileSync(P.inMask, 'LEAK')),
        repoFile: code(() => fs.readFileSync(P.repoFile)),
        dns: await new Promise((r) => dns.lookup('localhost', (e) => r(e ? e.code : 'ok'))),
        gitStatus: { status: git.status, out: git.stdout },
      }));
    })();
  `;
}

async function observe(project, { blind }) {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(project.socket, resolve));
  const sibling = cp.spawn('sleep', ['60'], { stdio: 'ignore' });
  const previousSocket = process.env.HERDR_SOCKET_PATH;
  process.env.HERDR_SOCKET_PATH = project.socket;
  try {
    const { prepared } = await prepare(project, { blind, script: observationScript(project, sibling.pid) });
    const res = cp.spawnSync(prepared.invocation.command, prepared.invocation.args, { encoding: 'utf8', timeout: 60000 });
    assert.equal(res.status, 0, res.stderr);
    await prepared.cleanup();
    return JSON.parse(res.stdout);
  } finally {
    if (previousSocket === undefined) delete process.env.HERDR_SOCKET_PATH;
    else process.env.HERDR_SOCKET_PATH = previousSocket;
    sibling.kill();
    server.close();
  }
}

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

test('hostRead has the order deny > blind > allow, and a blind override only narrows', () => {
  assert.deepEqual([...CONTROL_AXES.hostRead], ['deny', 'blind', 'allow']);
  assert.ok(CONTROL_ORDER.hostRead.deny > CONTROL_ORDER.hostRead.blind);
  assert.ok(CONTROL_ORDER.hostRead.blind > CONTROL_ORDER.hostRead.allow);

  const allow = resolveConfinementPolicy('host-write-denied');
  assert.doesNotThrow(() => validateOverrideConfinementShape({ controls: { hostRead: 'blind' } }, allow));
  const denying = { ...allow, controls: { ...allow.controls, hostRead: 'deny' } };
  assert.throws(() => validateOverrideConfinementShape({ controls: { hostRead: 'blind' } }, denying), /downgrade/);
  // The built-in policies are unchanged.
  assert.equal(allow.controls.hostRead, 'allow');
  assert.equal(resolveConfinementPolicy('workspace-write').controls.hostRead, 'allow');
});

test('the hidden roots are data in the contract: the three run-state directories, never all of .fgos', () => {
  assert.deepEqual([...BLIND_HIDDEN_ROOTS], [
    '{fgosDir}/assignments',
    '{fgosDir}/workflow-runs',
    '{fgosDir}/dispatch-runs',
    '{herdrSocketDir}',
    '{confinementTempRoot}',
  ]);
});

test('hidden roots resolve to the existing ones of this project, the herdr socket directory and the temp root', () => {
  const project = makeProject();
  const resolved = resolveBlindHiddenRoots({
    fgosDir: project.fgosDir,
    backendConfig: { tempRoot: project.tempRoot },
    env: { HERDR_SOCKET_PATH: project.socket },
  });
  assert.deepEqual(resolved, [
    path.join(project.fgosDir, 'assignments'),
    path.join(project.fgosDir, 'workflow-runs'),
    path.join(project.fgosDir, 'dispatch-runs'),
    project.herdrDir,
    project.tempRoot,
  ]);
  fs.rmSync(path.join(project.fgosDir, 'dispatch-runs'), { recursive: true });
  const without = resolveBlindHiddenRoots({ fgosDir: project.fgosDir, backendConfig: { tempRoot: project.tempRoot }, env: { HERDR_SOCKET_PATH: project.socket } });
  assert.equal(without.includes(path.join(project.fgosDir, 'dispatch-runs')), false, 'a root that does not exist is skipped');
});

// ---------------------------------------------------------------------------
// Argv shape
// ---------------------------------------------------------------------------

test('the blind argv masks before it binds back, binds its own directory read-only, and remounts the masks read-only last', async () => {
  const project = makeProject();
  const previousSocket = process.env.HERDR_SOCKET_PATH;
  process.env.HERDR_SOCKET_PATH = project.socket;
  try {
    const { prepared } = await prepare(project, {});
    const args = prepared.invocation.args;
    const head = args.slice(0, args.indexOf('--'));
    assert.deepEqual(head.slice(0, 7), ['--ro-bind', '/', '/', '--dev', '/dev', '--proc', '/proc']);
    assert.ok(head.includes('--unshare-pid'));

    const at = (flag, target) => head.findIndex((arg, i) => arg === flag && head[i + 1] === target);
    const masks = [
      path.join(project.fgosDir, 'assignments'),
      path.join(project.fgosDir, 'workflow-runs'),
      path.join(project.fgosDir, 'dispatch-runs'),
      project.herdrDir,
      project.tempRoot,
    ];
    const maskIndexes = masks.map((m) => at('--tmpfs', m));
    const remountIndexes = masks.map((m) => at('--remount-ro', m));
    assert.ok(maskIndexes.every((i) => i > 0), 'every hidden root is masked');
    assert.ok(remountIndexes.every((i) => i > 0), 'every mask is remounted read-only');

    const ownIndex = at('--ro-bind', project.ownDir);
    const outboxIndex = at('--bind', project.outbox);
    const homeIndex = at('--bind', project.homeDir);
    assert.ok(Math.max(...maskIndexes) < ownIndex, 'masks come before the own directory');
    assert.ok(ownIndex < outboxIndex && ownIndex < homeIndex, 'the writable mounts under a mask come after the own directory');
    assert.ok(Math.max(outboxIndex, homeIndex) < Math.min(...remountIndexes), 'remount-ro comes after every bind');
    assert.deepEqual(head.slice(-masks.length * 2).filter((_, i) => i % 2 === 0), masks.map(() => '--remount-ro'), 'remount-ro is last');
    await prepared.cleanup();
  } finally {
    if (previousSocket === undefined) delete process.env.HERDR_SOCKET_PATH;
    else process.env.HERDR_SOCKET_PATH = previousSocket;
  }
});

test('a non-blind dispatch\'s argv is what it was before: no pid namespace, no mask, binds in resource order', async () => {
  const project = makeProject();
  const { prepared, assessment } = await prepare(project, { blind: false });
  const args = prepared.invocation.args;
  const head = args.slice(0, args.indexOf('--'));
  const expected = ['--ro-bind', '/', '/', '--dev', '/dev', '--proc', '/proc', '--tmpfs', '/tmp'];
  for (const res of assessment.resources) {
    const writable = res.access === 'write' || res.access === 'read-write';
    expected.push(writable ? '--bind' : '--ro-bind', res.hostTarget, res.executionTarget.path);
  }
  assert.deepEqual(head, expected);
  assert.equal(assessment.resources.some((r) => r.resource === 'hidden-root' || r.resource === 'own-assignment'), false);
  await prepared.cleanup();
});

// ---------------------------------------------------------------------------
// Behaviour under real bwrap
// ---------------------------------------------------------------------------

test('a blind worker cannot read a peer, a gate answer, a peer home, a peer process or the herdr socket; unblind it can', async (t) => {
  if (!HAS_WORKING_BWRAP) return t.skip('working bwrap backend not available');

  const open = await observe(makeProject(), { blind: false });
  assert.equal(open.peerReport, 'ok');
  assert.equal(open.gateAnswer, 'ok');
  assert.equal(open.peerHome, 'ok');
  assert.equal(open.peerProcess, 'ok');
  assert.equal(open.socket, 'connected');

  const blind = await observe(makeProject(), { blind: true });
  // What it must not reach.
  assert.equal(blind.peerReport, 'ENOENT');
  assert.equal(blind.gateAnswer, 'ENOENT');
  assert.equal(blind.peerHome, 'ENOENT');
  assert.equal(blind.peerProcess, 'ENOENT');
  assert.equal(blind.socket, 'ENOENT');
  assert.equal(blind.grep, '', 'grep -r finds none of the planted peer text');
  assert.equal(blind.find, '', 'find does not list a peer report');
  assert.ok(!blind.tree.some((entry) => /peer|wf1|d1/.test(entry)), `tree shows only its own chain: ${blind.tree.join(' ')}`);
  assert.ok(blind.tree.includes('/assignments/u1/self/1/brief.md'));
  assert.ok(blind.tree.includes('/config.json'), 'tracked files under .fgos stay visible');
  assert.equal(blind.maskWrite, 'EROFS', 'the mask itself is not writable');

  // What it still has.
  assert.equal(blind.ownBrief, 'ok');
  assert.equal(blind.ownBriefWrite, 'EROFS');
  assert.equal(blind.ownRef, 'ok');
  assert.equal(blind.ownRefWrite, 'EROFS');
  assert.equal(blind.outbox, 'ok');
  assert.equal(blind.home, 'ok');
  assert.equal(blind.repoFile, 'ok');
  assert.equal(blind.dns, 'ok');
  assert.equal(blind.gitStatus.status, 0);
  assert.equal(blind.gitStatus.out, '', 'the checkout status is clean: nothing under .fgos looks deleted');
});

test('the outbox a blind worker writes lands on the host and its brief is left as it was', async (t) => {
  if (!HAS_WORKING_BWRAP) return t.skip('working bwrap backend not available');
  const project = makeProject();
  await observe(project, { blind: true });
  assert.equal(fs.readFileSync(path.join(project.outbox, 'out.txt'), 'utf8'), 'WRITTEN');
  assert.equal(fs.readFileSync(path.join(project.ownDir, 'brief.md'), 'utf8'), 'OWN-BRIEF\n', 'the brief was not edited');
});

test('the blind-read probe passes on the real argv and fails when the masks are left out', (t) => {
  if (!HAS_WORKING_BWRAP) return t.skip('working bwrap backend not available');
  const run = (brokenConfig) => {
    const dir = fs.mkdtempSync(path.join(FIXTURE_ROOT, 'fgos-blind-probe-'));
    roots.push(dir);
    return probePeerRunHidden({ bwrapBin: '/usr/bin/bwrap', scratchDir: dir, brokenConfig });
  };
  const good = run(false);
  assert.equal(good.passed, true, good.detail);
  assert.equal(good.probe, 'peer-run-hidden');
  const broken = run(true);
  assert.equal(broken.passed, false, 'the falsifier must read the planted peer file');
  assert.match(broken.detail, /"peerReport":"ok"/);
});

test('the probe set grows by one for a blind dispatch and keeps its own fingerprint and cache entry', (t) => {
  const plain = computeProbeFingerprint({ policy: { a: 1 } });
  const blind = computeProbeFingerprint({ policy: { a: 1 }, blind: true });
  assert.equal('blind' in plain, false, 'a non-blind fingerprint is what it was');
  assert.equal(blind.blind, true);
  assert.notDeepEqual(plain, blind);

  if (!HAS_WORKING_BWRAP) return t.skip('working bwrap backend not available');
  assert.equal(runAllConfinementProbes({ bwrapBin: '/usr/bin/bwrap' }).results.length, 8);
  const withBlind = runAllConfinementProbes({ bwrapBin: '/usr/bin/bwrap', blind: true });
  assert.equal(withBlind.results.length, 9);
  assert.equal(withBlind.results.at(-1).probe, 'peer-run-hidden');
  assert.equal(withBlind.passed, true, withBlind.message);
});

test('doctor reports blind-read through the real probe', (t) => {
  if (!HAS_WORKING_BWRAP) return t.skip('working bwrap backend not available');
  const result = checkConfinementBlindRead();
  assert.equal(result.passed, true);
  assert.match(result.message, /^blind-read: pass/);
});

test('doctor names a backend that cannot enforce blind reads', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-blind-doctor-'));
  const registry = path.join(dir, 'confinement-backends.json');
  const previous = process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
  try {
    fs.writeFileSync(registry, JSON.stringify({ contract: 'confinement-backend-registry.v1', confinementBackends: { bwrap: { type: 'bwrap', enabled: false, executable: '/usr/bin/bwrap' } } }));
    process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = registry;
    assert.match(checkConfinementBlindRead().message, /^blind-read: backend-unsupported/);

    fs.writeFileSync(registry, JSON.stringify({ contract: 'confinement-backend-registry.v1', confinementBackends: { bwrap: { type: 'bwrap', enabled: true, executable: path.join(dir, 'no-such-bwrap') } } }));
    assert.match(checkConfinementBlindRead().message, /^blind-read: backend-unsupported/);
  } finally {
    if (previous === undefined) delete process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
    else process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = previous;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Refusals: named, before anything launches
// ---------------------------------------------------------------------------

function countingAdapter() {
  const adapter = async () => {
    adapter.calls += 1;
    return { status: 0, stdout: '', stderr: '' };
  };
  adapter.calls = 0;
  adapter.preparedInvocationContract = 'exact-v1';
  return adapter;
}

async function assertRefused(project, options, code) {
  const adapter = countingAdapter();
  await assert.rejects(
    async () => executeThroughConfinement(requestFor(project, options), adapter),
    (err) => {
      assert.ok(err instanceof DispatchError, String(err));
      assert.equal(err.code, code);
      assert.equal(err.data?.status, 'refused');
      return true;
    },
  );
  assert.equal(adapter.calls, 0, 'nothing launched');
}

test('a blind dispatch is refused, with a named reason, when it cannot be enforced', async () => {
  const project = makeProject();

  // A ref or cwd inside what blind hides.
  await assertRefused(project, { contextRefs: [project.peerReport] }, 'blind-ref-hidden');
  await assertRefused(project, { cwd: path.join(project.fgosDir, 'assignments', 'u1') }, 'blind-hides-workspace');

  // Not required confinement, or no sandbox around the worker.
  assert.throws(() => requestFor(project, { requirement: { mode: 'unconfined', policyId: null, policy: null } }), (err) => err.code === 'blind-requires-confinement');
  assert.throws(() => requestFor(project, { requirement: { mode: 'preferred', policyId: 'workspace-write', policy: resolveConfinementPolicy('workspace-write') } }), (err) => err.code === 'blind-requires-confinement');
  assert.throws(
    () => buildConfinementRequest({
      capability: 'code:review', executorId: 'x', blind: true, authorityScope: 'external-harness',
      requirement: { mode: 'required', policyId: 'workspace-write', policy: resolveConfinementPolicy('workspace-write') },
      context: { cwd: project.proj, runDir: project.runDir, fgosDir: project.fgosDir },
    }),
    (err) => err.code === 'blind-in-process',
  );
});

test('refs inside the dispatch\'s own directory and outside every hidden root are accepted', () => {
  const project = makeProject();
  const assessment = assessBwrap(requestFor(project, { contextRefs: [project.ownRef, 'src/file.txt', project.repoFile] }), BWRAP_BACKEND(project));
  assert.deepEqual(assessment.mismatches, []);
});

test('a blind dispatch is refused when its backend is disabled, and when the blind probe fails, never run unblind', async () => {
  const project = makeProject();
  const registryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-blind-registry-'));
  const registry = path.join(registryDir, 'confinement-backends.json');
  const previous = process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
  const setBackend = (backend) => {
    fs.writeFileSync(registry, JSON.stringify({ contract: 'confinement-backend-registry.v1', confinementBackends: { bwrap: backend } }));
    process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = registry;
  };
  try {
    setBackend({ type: 'bwrap', enabled: false, executable: '/usr/bin/bwrap' });
    await assertRefused(project, {}, 'confinement-backend-disabled');

    // A backend whose sandbox binary does not work fails the probe, which a blind dispatch needs fresh.
    const broken = path.join(registryDir, 'broken-bwrap');
    fs.writeFileSync(broken, '#!/bin/sh\nexit 1\n', { mode: 0o755 });
    setBackend({ type: 'bwrap', enabled: true, executable: broken });
    // A passing standard-probe cache entry for the same backend must not satisfy a blind dispatch.
    const standard = computeProbeFingerprint({
      policy: resolveConfinementPolicy('workspace-write'), driverVersion: 'local-bwrap-v1', backendConfig: { type: 'bwrap', enabled: true, executable: broken }, bwrapExecutable: broken,
    });
    saveProbeCacheRecord(standard, { passed: true, message: 'cached', results: [] }, {});
    await assertRefused(project, {}, 'confinement-probe-failed');
  } finally {
    if (previous === undefined) delete process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
    else process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = previous;
    fs.rmSync(registryDir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Attestation
// ---------------------------------------------------------------------------

test('the attestation records the override, the effective hostRead and the hidden roots it resolved', async (t) => {
  if (!HAS_WORKING_BWRAP) return t.skip('working bwrap backend not available');
  const project = makeProject();
  const previousSocket = process.env.HERDR_SOCKET_PATH;
  process.env.HERDR_SOCKET_PATH = project.socket;
  try {
    const adapter = countingAdapter();
    // The standard policy's backend config is the machine registry's; the temp root is the machine's.
    await executeThroughConfinement(requestFor(project, {}), adapter);
    assert.equal(adapter.calls, 1);
    const record = loadAttestationRecord('disp_self', 'prepared');
    assert.deepEqual(record.requested.override, { controls: { hostRead: 'blind' } });
    assert.equal(record.effectiveControls.hostRead, 'blind');
    assert.equal(record.coverage['control:hostRead'], 'satisfied');
    assert.ok(record.hiddenRoots.includes(path.join(project.fgosDir, 'assignments')));
    assert.ok(record.hiddenRoots.includes(project.herdrDir));
    assert.ok(record.resources.some((r) => r.resource === 'own-assignment' && r.hostTarget === project.ownDir));
  } finally {
    if (previousSocket === undefined) delete process.env.HERDR_SOCKET_PATH;
    else process.env.HERDR_SOCKET_PATH = previousSocket;
  }
});
