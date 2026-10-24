// dispatch-confinement-machine-private.test.mjs — machine-private roots (spec section 9.3): a
// directory listed in MACHINE_PRIVATE_ROOTS is masked for every confined dispatch, whatever its
// hostRead. The pure side: the list, the resolver, the refusal and the argv order. The proof that a
// real worker cannot read it, nor reach a Claude Code session socket, is the harness probe
// `machine-private-hidden` (real bwrap), run below.

import '../helpers/process-tmp-root.mjs';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import cp from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

import { assessBwrap, prepareBwrap, CONFINED_MARKER_ENV } from '../../src/runner/dispatch/confinement/drivers/bwrap.mjs';
import { buildConfinementRequest } from '../../src/runner/dispatch/confinement/request.mjs';
import {
  MACHINE_PRIVATE_ROOTS,
  resolveConfinementResources,
  ensureSessionSocketDir,
  resolveClaudeSocketBase,
  resolveMachinePrivateRoots,
} from '../../src/runner/dispatch/confinement/resources.mjs';
import { BUILTIN_POLICY_IDS, resolveConfinementPolicy } from '../../src/runner/dispatch/confinement/policies.mjs';
import { computeProbeFingerprint, probeMachinePrivateHidden } from '../../src/runner/dispatch/confinement/probes/harness.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';

const HAS_WORKING_BWRAP = os.platform() === 'linux'
  && cp.spawnSync('/usr/bin/bwrap', ['--ro-bind', '/', '/', '--', 'true'], { stdio: 'ignore' }).status === 0;

const fixtures = [];
after(() => {
  for (const dir of fixtures) fs.rmSync(dir, { recursive: true, force: true });
});

/**
 * A host home with (or without) the private directory, a Claude socket base that is absent, empty
 * or already holds `cc-socks`, and a project with the run directory a dispatch needs. An absent base
 * is one Claude Code cannot bind in either, so nothing is created and nothing is masked there.
 */
function makeHost({ withPrivate = true, socketBase = 'absent' } = {}) {
  const root = fs.realpathSync(makeFixtureDir('fgos-machine-private-'));
  fixtures.push(root);
  const home = path.join(root, 'home');
  const privateDir = path.join(home, '.fgos', 'private');
  fs.mkdirSync(withPrivate ? privateDir : home, { recursive: true });
  const claudeSocketBase = path.join(root, 'run-user');
  const sessionSockets = path.join(claudeSocketBase, 'cc-socks');
  if (socketBase === 'empty') fs.mkdirSync(claudeSocketBase, { mode: 0o700 });
  if (socketBase === 'with-sockets') fs.mkdirSync(sessionSockets, { recursive: true, mode: 0o700 });
  const project = path.join(root, 'project');
  const fgosDir = path.join(project, '.fgos');
  const runDir = path.join(fgosDir, 'assignments', 'u1', 'self', '1', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  return { root, home, privateDir, claudeSocketBase, sessionSockets, project, fgosDir, runDir, tempRoot: path.join(root, 'confinement-temp') };
}

/**
 * `os.homedir()` and `$XDG_RUNTIME_DIR` are what the driver resolves `{home}` and
 * `{claudeSocketBase}` from; point them at the fixture for one call, so the real host's
 * directories never leak in.
 */
async function withHome(host, fn) {
  const previous = { HOME: process.env.HOME, XDG_RUNTIME_DIR: process.env.XDG_RUNTIME_DIR };
  process.env.HOME = host.home;
  process.env.XDG_RUNTIME_DIR = host.claudeSocketBase;
  try {
    return await fn();
  } finally {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

const backendFor = (host) => ({ id: 'bwrap', type: 'bwrap', config: { type: 'bwrap', executable: '/usr/bin/bwrap', tempRoot: host.tempRoot } });

function requestFor(host, { policyId = 'workspace-write', blind = false, cwd = host.project } = {}) {
  return buildConfinementRequest({
    capability: 'code:review',
    executorId: 'bwrap-exec',
    dispatchId: 'disp_self',
    requirement: { mode: 'required', policyId, policy: resolveConfinementPolicy(policyId) },
    ...(blind ? { blind: true } : {}),
    backendId: 'bwrap',
    invocation: { command: 'node', args: ['-e', 'process.exit(0)'], env: {}, adapter: 'herdr-spawn' },
    context: { cwd, repoRoot: cwd, runDir: host.runDir, fgosDir: host.fgosDir },
  });
}

async function prepared(host, options) {
  return withHome(host, async () => {
    const request = requestFor(host, options);
    const assessment = assessBwrap(request, backendFor(host));
    assert.deepEqual(assessment.mismatches, []);
    const out = await prepareBwrap({ resources: assessment.resources, coverage: assessment.coverage }, request, backendFor(host));
    const args = out.invocation.args;
    const head = args.slice(0, args.indexOf('--'));
    await out.cleanup();
    return { head, assessment };
  });
}

const indexOfFlag = (head, flag, target) => head.findIndex((arg, i) => arg === flag && head[i + 1] === target);

test('every confined launch sets the one marker variable the Config session class reads, under the same name', async () => {
  const host = makeHost({ withPrivate: false });
  const { head } = await prepared(host, {});
  assert.equal(indexOfFlag(head, '--setenv', CONFINED_MARKER_ENV) > 0 && head[indexOfFlag(head, '--setenv', CONFINED_MARKER_ENV) + 2], '1');
  const rustSource = fs.readFileSync(new URL('../../packages/config/rust/src/session.rs', import.meta.url), 'utf8');
  assert.match(rustSource, new RegExp(`pub const CONFINED_MARKER: &str = "${CONFINED_MARKER_ENV}";`), 'the crate and the driver name the same variable');
});

test('the machine-private roots are data in the contract: the private directory of the host home and the Claude Code session sockets', () => {
  assert.deepEqual([...MACHINE_PRIVATE_ROOTS], ['{home}/.fgos/private', '{claudeSocketBase}/cc-socks']);
});

test('the Claude socket base follows Claude Code: the user runtime dir, else CLAUDE_CODE_TMPDIR, else the temp dir', () => {
  const env = { XDG_RUNTIME_DIR: '/run/user/4242', CLAUDE_CODE_TMPDIR: '/srv/claude-tmp', TMPDIR: '/srv/tmp', TMP: '/srv/tmp2', TEMP: '/srv/tmp3' };
  assert.equal(resolveClaudeSocketBase({ env }), '/run/user/4242');
  assert.equal(resolveClaudeSocketBase({ env: { ...env, XDG_RUNTIME_DIR: 'relative/dir' } }), '/srv/claude-tmp');
  assert.equal(resolveClaudeSocketBase({ env: { ...env, XDG_RUNTIME_DIR: undefined, CLAUDE_CODE_TMPDIR: undefined } }), '/srv/tmp');
  assert.equal(resolveClaudeSocketBase({ env: { TMP: '/srv/tmp2', TEMP: '/srv/tmp3' } }), '/srv/tmp2');
  assert.equal(resolveClaudeSocketBase({ env: { TEMP: '/srv/tmp3' } }), '/srv/tmp3');
  assert.equal(resolveClaudeSocketBase({ env: {} }), '/tmp');
});

test('the session socket directory is created owner-only in a base this user owns, and an existing entry is left exactly as it is', () => {
  const host = makeHost({ socketBase: 'empty' });
  ensureSessionSocketDir(host.claudeSocketBase);
  assert.equal(fs.statSync(host.sessionSockets).mode & 0o777, 0o700);

  const existing = makeHost({ socketBase: 'with-sockets' });
  fs.chmodSync(existing.sessionSockets, 0o750);
  ensureSessionSocketDir(existing.claudeSocketBase);
  assert.equal(fs.statSync(existing.sessionSockets).mode & 0o777, 0o750, 'never chmod-ed');

  const absent = makeHost();
  ensureSessionSocketDir(absent.claudeSocketBase);
  assert.equal(fs.existsSync(absent.claudeSocketBase), false, 'a missing base is not created');

  const foreign = makeHost({ socketBase: 'empty' });
  ensureSessionSocketDir(foreign.claudeSocketBase, { uid: process.getuid() + 1 });
  assert.equal(fs.existsSync(foreign.sessionSockets), false, 'a base of another user is left alone');

  const linked = makeHost({ socketBase: 'empty' });
  const link = path.join(linked.root, 'linked-base');
  fs.symlinkSync(linked.claudeSocketBase, link);
  ensureSessionSocketDir(link);
  assert.equal(fs.existsSync(linked.sessionSockets), false, 'a symlinked base is left alone');
});

test('a machine-private root resolves from the injected home and is skipped when absent or not a directory', () => {
  const roots = (host) => resolveMachinePrivateRoots({ homeDir: host.home, claudeSocketBase: host.claudeSocketBase });
  const host = makeHost();
  assert.deepEqual(roots(host), [host.privateDir]);

  const both = makeHost({ socketBase: 'with-sockets' });
  assert.deepEqual(roots(both), [both.privateDir, both.sessionSockets]);

  const sockets = makeHost({ withPrivate: false, socketBase: 'with-sockets' });
  assert.deepEqual(roots(sockets), [sockets.sessionSockets]);

  // A base with no `cc-socks` yet gets one before the roots are resolved, so it is masked from launch.
  const later = makeHost({ withPrivate: false, socketBase: 'empty' });
  assert.deepEqual(roots(later), [later.sessionSockets]);

  const without = makeHost({ withPrivate: false });
  assert.deepEqual(roots(without), []);

  const asFile = makeHost({ withPrivate: false });
  fs.mkdirSync(path.join(asFile.home, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(asFile.home, '.fgos', 'private'), 'a file, not a directory');
  assert.deepEqual(roots(asFile), []);
});

test('the resolver yields a machine-private hidden-root for a non-blind request, and none when the host has no such directory', () => {
  const host = makeHost();
  const grants = [{ resource: 'run-output', access: 'write', scope: 'dispatch' }];
  const context = { cwd: host.project, repoRoot: host.project, runDir: host.runDir, fgosDir: host.fgosDir };
  const resolve = (on, extra = {}) => resolveConfinementResources({ dispatchId: 'disp_self', context, grants, backendConfig: { tempRoot: host.tempRoot }, homeDir: on.home, claudeSocketBase: on.claudeSocketBase, ...extra });

  const hidden = resolve(host).filter((r) => r.resource === 'hidden-root');
  assert.equal(hidden.length, 1);
  assert.equal(hidden[0].hostTarget, host.privateDir);
  assert.equal(hidden[0].machinePrivate, true);
  assert.equal(hidden[0].delivery, 'mask');

  const sockets = makeHost({ withPrivate: false, socketBase: 'with-sockets' });
  const socketMask = resolve(sockets).filter((r) => r.resource === 'hidden-root');
  assert.deepEqual(socketMask.map((r) => [r.hostTarget, r.machinePrivate]), [[sockets.sessionSockets, true]]);

  const without = makeHost({ withPrivate: false });
  assert.equal(resolve(without).some((r) => r.resource === 'hidden-root'), false);

  // A root that blind would hide too is listed once: here the confinement temp root is the private directory.
  const blind = resolveConfinementResources({
    dispatchId: 'disp_self', context, grants, backendConfig: { tempRoot: host.privateDir }, homeDir: host.home, claudeSocketBase: host.claudeSocketBase, blind: true,
  }).filter((r) => r.resource === 'hidden-root' && r.hostTarget === host.privateDir);
  assert.equal(blind.length, 1);
});

for (const policyId of BUILTIN_POLICY_IDS) {
  test(`${policyId}: the private directory and the session socket directory are masked after the mounts and remounted read-only after the attempt binds, without a blind override`, async (t) => {
    if (!HAS_WORKING_BWRAP) return t.skip('working bwrap backend not available');
    const host = makeHost({ socketBase: 'with-sockets' });
    const { head } = await prepared(host, { policyId });
    const lastMount = Math.max(...head.map((arg, i) => ((arg === '--bind' || arg === '--ro-bind') && i > 6 ? i : -1)));
    for (const root of [host.privateDir, host.sessionSockets]) {
      const mask = indexOfFlag(head, '--tmpfs', root);
      const remount = indexOfFlag(head, '--remount-ro', root);
      assert.ok(mask > 0 && remount > mask, `${root} masked, then remounted read-only`);
      assert.ok(lastMount < mask, 'every mount comes before the mask');
    }
    assert.deepEqual(head.slice(-4), ['--remount-ro', host.privateDir, '--remount-ro', host.sessionSockets], 'the read-only remounts are last');
    assert.equal(head.includes('--unshare-pid'), true, 'every launch has its pid namespace');
  });

  test(`${policyId}: with no private directory on the host the argv has no mask at all`, async (t) => {
    if (!HAS_WORKING_BWRAP) return t.skip('working bwrap backend not available');
    const host = makeHost({ withPrivate: false });
    const { head } = await prepared(host, { policyId });
    assert.equal(head.includes('--remount-ro'), false);
    assert.deepEqual(head.filter((arg, i) => head[i - 1] === '--tmpfs'), ['/tmp'], 'the only tmpfs is the private /tmp');
  });
}

test('a session socket directory that is absent at launch is created and masked, so a socket the host binds after the worker started stays out of reach', async (t) => {
  if (!HAS_WORKING_BWRAP) return t.skip('working bwrap backend not available');
  const host = makeHost({ withPrivate: false, socketBase: 'empty' });
  const socketPath = path.join(host.sessionSockets, '4242.sock');
  const goFile = path.join(host.project, 'socket-is-listening');
  // The worker waits until the host says the socket listens, then tries it once.
  const script = `
    const fs = require('fs');
    const net = require('net');
    const wait = () => fs.existsSync(${JSON.stringify(goFile)}) ? probe() : setTimeout(wait, 20);
    const probe = () => {
      const c = net.connect(${JSON.stringify(socketPath)});
      c.on('connect', () => { process.stdout.write('ok'); c.destroy(); });
      c.on('error', (e) => process.stdout.write(e.code));
    };
    wait();
  `;
  await withHome(host, async () => {
    const request = buildConfinementRequest({
      capability: 'code:review',
      executorId: 'bwrap-exec',
      dispatchId: 'disp_self',
      requirement: { mode: 'required', policyId: 'workspace-write', policy: resolveConfinementPolicy('workspace-write') },
      backendId: 'bwrap',
      invocation: { command: 'node', args: ['-e', script], env: {}, adapter: 'herdr-spawn' },
      context: { cwd: host.project, repoRoot: host.project, runDir: host.runDir, fgosDir: host.fgosDir },
    });
    const assessment = assessBwrap(request, backendFor(host));
    assert.deepEqual(assessment.mismatches, []);
    const out = await prepareBwrap({ resources: assessment.resources, coverage: assessment.coverage }, request, backendFor(host));
    const worker = cp.spawn(out.invocation.command, out.invocation.args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    worker.stdout.on('data', (chunk) => { stdout += chunk; });
    const exited = new Promise((resolve) => worker.on('exit', resolve));
    // What Claude Code does when its first session opens: make the directory if missing, then bind.
    fs.mkdirSync(host.sessionSockets, { recursive: true, mode: 0o700 });
    const server = net.createServer((conn) => conn.destroy());
    await new Promise((resolve) => server.listen(socketPath, resolve));
    fs.writeFileSync(goFile, 'go');
    await exited;
    server.close();
    await out.cleanup();
    assert.equal(stdout, 'ENOENT', 'the worker cannot reach a socket bound after it started');
    assert.equal(fs.statSync(host.sessionSockets).mode & 0o777, 0o700, 'the directory was created owner-only');
  });
});

test('a blind dispatch masks the private directory with its own roots and keeps the blind order', async (t) => {
  if (!HAS_WORKING_BWRAP) return t.skip('working bwrap backend not available');
  const host = makeHost();
  fs.mkdirSync(path.join(host.fgosDir, 'dispatch-runs'), { recursive: true });
  const { head } = await prepared(host, { blind: true });
  const own = path.join(host.fgosDir, 'assignments', 'u1', 'self', '1');
  const masks = [host.privateDir, path.join(host.fgosDir, 'dispatch-runs')].map((m) => indexOfFlag(head, '--tmpfs', m));
  assert.ok(masks.every((i) => i > 0), 'the private directory and the blind roots are all masked');
  assert.ok(Math.max(...masks) < indexOfFlag(head, '--ro-bind', own), 'masks come before the own directory');
  assert.ok(indexOfFlag(head, '--remount-ro', host.privateDir) > indexOfFlag(head, '--ro-bind', own), 'remount-ro comes last');
});

test('a workspace, cwd or repo root inside a machine-private root is refused before launch, blind or not', async () => {
  const host = makeHost();
  const inside = path.join(host.privateDir, 'worktree');
  fs.mkdirSync(inside, { recursive: true });
  for (const blind of [false, true]) {
    const mismatches = await withHome(host, () => assessBwrap(requestFor(host, { blind, cwd: inside }), backendFor(host)).mismatches);
    const codes = mismatches.map((m) => m.code);
    assert.ok(codes.includes('machine-private-hides-workspace'), `refused with blind=${blind}: ${JSON.stringify(mismatches)}`);
    assert.equal(codes.includes('blind-hides-workspace'), false, 'the blind refusal does not repeat the machine-private one');
  }
  const ok = await withHome(host, () => assessBwrap(requestFor(host), backendFor(host)).mismatches);
  assert.deepEqual(ok, []);
});

test('the probe fingerprint carries the digest of the list, so a changed list refreshes every proof', () => {
  const fingerprint = computeProbeFingerprint({ policy: { a: 1 } });
  assert.match(fingerprint.machinePrivate, /^[0-9a-f]{64}$/);
});

test('the machine-private probe passes on the real argv and its falsifier reads the planted files without the mask', (t) => {
  if (!HAS_WORKING_BWRAP) return t.skip('working bwrap backend not available');
  for (const blind of [false, true]) {
    const run = (brokenConfig) => {
      // The scratch directory sits under /tmp on purpose: the probe must not let the sandbox's empty /tmp hide the file for it.
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-mp-probe-'));
      try {
        return probeMachinePrivateHidden({ bwrapBin: '/usr/bin/bwrap', scratchDir: dir, blind, brokenConfig });
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    };
    const good = run(false);
    assert.equal(good.passed, true, good.detail);
    assert.equal(good.probe, 'machine-private-hidden');
    const broken = run(true);
    assert.equal(broken.passed, false, 'the falsifier must read the planted files');
    assert.match(broken.detail, /"accounts":"ok"/);
    assert.match(broken.detail, /"token":"ok"/);
    assert.match(broken.detail, /"socket":"ok"/, 'without the masks the worker reaches the session socket');
    // Only the session socket mask dropped: the socket check alone must fail the probe.
    const socketsOnly = run('session-sockets');
    assert.equal(socketsOnly.passed, false, 'the falsifier without the socket mask must reach the socket');
    assert.match(socketsOnly.detail, /"socket":"ok"/);
    assert.doesNotMatch(socketsOnly.detail, /"accounts":"ok"|"token":"ok"/, 'the private directory stays hidden');
    assert.match(broken.detail, /host-write-denied/);
    assert.match(broken.detail, /workspace-write/);
    if (blind) assert.match(broken.detail, /\+blind/);
  }
});
