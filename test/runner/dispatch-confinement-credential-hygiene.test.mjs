import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import cp from 'node:child_process';
import { executeThroughConfinement } from '../../src/runner/dispatch/confinement/authority.mjs';
import { buildConfinementRequest } from '../../src/runner/dispatch/confinement/request.mjs';
import { resolveConfinementPolicy } from '../../src/runner/dispatch/confinement/policies.mjs';
import { registerBackendDriver, getBackendDriver } from '../../src/runner/dispatch/confinement/backend-registry.mjs';
import { DispatchError } from '../../src/runner/dispatch/transport.mjs';
import { prepareBwrap } from '../../src/runner/dispatch/confinement/drivers/bwrap.mjs';
import { resolveConfinementResources } from '../../src/runner/dispatch/confinement/resources.mjs';
import {
  reapOrphanedConfinementResources,
  resolveConfinementTempRoot,
  ensurePrivateDir,
  readOwnershipMarker,
} from '../../src/runner/dispatch/confinement/cleanup.mjs';

// A private home holds a copy of an account login. These tests pin the three
// things that keep that copy from lingering or being readable: owner-only
// directories at every level, removal when the run is over, and a reaper that
// never takes a home away from a pane that is still open.

const modeOf = (p) => fs.statSync(p).mode & 0o777;

function fixture() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-cred-hygiene-'));
  const tempRoot = path.join(tmp, 'fgos-confinement');
  const accountHome = path.join(tmp, 'account-home');
  fs.mkdirSync(path.join(accountHome, '.codex'), { recursive: true });
  fs.writeFileSync(path.join(accountHome, '.codex', 'auth.json'), '{"token":"placeholder"}');
  fs.writeFileSync(path.join(accountHome, 'plain-auth.json'), '{"token":"placeholder"}');
  return { tmp, tempRoot, accountHome, cleanup: () => fs.rmSync(tmp, { recursive: true, force: true }) };
}

function planFor(tempRoot, dispatchId) {
  const resources = resolveConfinementResources({
    dispatchId,
    context: {},
    grants: [{ resource: 'private-home', access: 'read-write', scope: 'dispatch' }],
    backendConfig: { tempRoot },
  });
  return { contract: 'confinement-plan.v1', dispatchId, decision: 'execute', coverage: {}, resources };
}

const requestFor = (dispatchId, source) => ({
  dispatchId,
  executorId: 'codex-bwrap',
  invocation: { command: 'agent-cli', args: [], env: {}, resourceBindings: [] },
  providerCapacity: { provider: 'openai-codex', accountId: 'a', credentialSource: source },
  context: { cwd: os.tmpdir(), runDir: os.tmpdir() },
});

test('private home, its per-dispatch parent and the root are owner-only under a 002 umask', async () => {
  const f = fixture();
  const previous = process.umask(0o002);
  try {
    const plan = planFor(f.tempRoot, 'disp_modes');
    const prepared = await prepareBwrap(
      plan,
      requestFor('disp_modes', { kind: 'home-files', home: f.accountHome, files: ['.codex/auth.json', 'plain-auth.json'] }),
      { id: 'bwrap', type: 'bwrap', config: {} },
    );
    const home = plan.resources[0].hostTarget;
    assert.equal(modeOf(f.tempRoot), 0o700, 'root');
    assert.equal(modeOf(path.dirname(home)), 0o700, '<dispatchId>');
    assert.equal(modeOf(home), 0o700, 'home');
    assert.equal(modeOf(path.join(home, '.codex')), 0o700, 'intermediate credential directory');
    assert.equal(modeOf(path.join(home, '.codex', 'auth.json')), 0o600);
    await prepared.cleanup();
  } finally { process.umask(previous); f.cleanup(); }
});

test('a codex-home credential copy is owner-only', async () => {
  const f = fixture();
  const previous = process.umask(0o002);
  try {
    const plan = planFor(f.tempRoot, 'disp_codex_mode');
    const prepared = await prepareBwrap(
      plan,
      requestFor('disp_codex_mode', { kind: 'codex-home', home: path.join(f.accountHome, '.codex') }),
      { id: 'bwrap', type: 'bwrap', config: {} },
    );
    assert.equal(modeOf(path.join(plan.resources[0].hostTarget, 'auth.json')), 0o600);
    await prepared.cleanup();
  } finally { process.umask(previous); f.cleanup(); }
});

test('cleanup removes the home and the now-empty <dispatchId> directory', async () => {
  const f = fixture();
  try {
    const plan = planFor(f.tempRoot, 'disp_cleanup');
    const prepared = await prepareBwrap(plan, requestFor('disp_cleanup', undefined), { id: 'bwrap', type: 'bwrap', config: {} });
    const home = plan.resources[0].hostTarget;
    assert.ok(fs.existsSync(home));
    await prepared.cleanup();
    assert.equal(fs.existsSync(path.dirname(home)), false, '<dispatchId> directory must go with its home');
  } finally { f.cleanup(); }
});

test('a retained home is tagged with its pane and survives the reaper while the pane is open', async () => {
  const f = fixture();
  try {
    const plan = planFor(f.tempRoot, 'disp_retained');
    const prepared = await prepareBwrap(
      plan,
      requestFor('disp_retained', { kind: 'home-files', home: f.accountHome, files: ['plain-auth.json'] }),
      { id: 'bwrap', type: 'bwrap', config: {} },
    );
    const home = plan.resources[0].hostTarget;
    assert.deepEqual(prepared.retain({ paneId: 'p-7' }), [home]);
    assert.equal(readOwnershipMarker(home).paneId, 'p-7');

    const deadOwner = () => false; // the launching process is long gone
    const alive = reapOrphanedConfinementResources({ tempRoot: f.tempRoot, checkLiveness: deadOwner, checkPaneOpen: () => true });
    assert.deepEqual(alive.reaped, []);
    assert.ok(fs.existsSync(path.join(home, 'plain-auth.json')), 'a live pane keeps its login');

    const unknown = reapOrphanedConfinementResources({ tempRoot: f.tempRoot, checkLiveness: deadOwner, checkPaneOpen: () => null });
    assert.deepEqual(unknown.reaped, [], 'herdr unreachable and not yet expired: leave it');

    const closed = reapOrphanedConfinementResources({ tempRoot: f.tempRoot, checkLiveness: deadOwner, checkPaneOpen: () => false });
    assert.equal(closed.reaped.length, 1);
    assert.equal(closed.reaped[0].reason, 'pane-closed');
    assert.equal(fs.existsSync(path.dirname(home)), false, 'home and <dispatchId> directory are gone once the pane is');
  } finally { f.cleanup(); }
});

test('an unanswerable pane check does not keep a login past the maximum age', async () => {
  const f = fixture();
  try {
    const plan = planFor(f.tempRoot, 'disp_expired');
    const prepared = await prepareBwrap(plan, requestFor('disp_expired', undefined), { id: 'bwrap', type: 'bwrap', config: {} });
    prepared.retain({ paneId: 'p-9' });
    const res = reapOrphanedConfinementResources({
      tempRoot: f.tempRoot, maxAgeMs: -1, checkLiveness: () => false, checkPaneOpen: () => null,
    });
    assert.equal(res.reaped.length, 1);
  } finally { f.cleanup(); }
});

test('ensurePrivateDir refuses a path outside its root and never touches levels above it', () => {
  const f = fixture();
  try {
    fs.chmodSync(f.tmp, 0o755);
    ensurePrivateDir(path.join(f.tempRoot, 'a', 'b'), { root: f.tempRoot });
    assert.equal(modeOf(f.tmp), 0o755, 'parent of the root is left alone');
    assert.equal(modeOf(path.join(f.tempRoot, 'a')), 0o700);
    assert.throws(() => ensurePrivateDir(path.join(f.tmp, 'elsewhere'), { root: f.tempRoot }), /not inside/);
  } finally { f.cleanup(); }
});

test('a root owned by another user is not reused: a per-uid root is chosen', () => {
  if (typeof process.getuid !== 'function') return;
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-root-owner-'));
  try {
    assert.equal(resolveConfinementTempRoot(base), path.join(base, 'fgos-confinement'));
    // `/` is root-owned and exists: stands in for a shared name someone else created.
    if (process.getuid() !== 0) {
      const foreign = path.join(base, 'fgos-confinement');
      fs.mkdirSync(foreign);
      const realStat = fs.statSync;
      fs.statSync = (p, ...rest) => {
        const st = realStat(p, ...rest);
        return p === foreign ? Object.assign(Object.create(Object.getPrototypeOf(st)), st, { uid: process.getuid() + 1 }) : st;
      };
      try {
        assert.equal(resolveConfinementTempRoot(base), `${foreign}-${process.getuid()}`);
      } finally { fs.statSync = realStat; }
    }
  } finally { fs.rmSync(base, { recursive: true, force: true }); }
});

// --- The authority decides, per failure, whether the home goes or stays -------

const HAS_WORKING_BWRAP = os.platform() === 'linux'
  && cp.spawnSync('/usr/bin/bwrap', ['--ro-bind', '/', '/', '--', 'true'], { stdio: 'ignore' }).status === 0;

async function runFailingDispatch(adapterError) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-authority-hygiene-'));
  const regPath = path.join(tmp, 'confinement-backends.json');
  fs.writeFileSync(regPath, JSON.stringify({
    contract: 'confinement-backend-registry.v1',
    confinementBackends: { bwrap: { type: 'bwrap', enabled: true, executable: '/usr/bin/bwrap' } },
  }));
  const previousRegistry = process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
  process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = regPath;

  const calls = { cleanup: 0, retain: [] };
  const originalDriver = getBackendDriver('bwrap');
  registerBackendDriver({
    type: 'bwrap',
    version: 'mock-v1',
    validateConfig: () => true,
    assess: (req) => {
      const coverage = {};
      for (const k of Object.keys(req.requirement.policy.controls || {})) coverage[`control:${k}`] = 'satisfied';
      return { coverage, resources: [], readiness: {}, mismatches: [] };
    },
    prepare: async (plan) => ({
      invocation: { command: 'echo', args: ['mocked'] },
      claims: { ...plan.coverage },
      cleanup: async () => { calls.cleanup += 1; },
      retain: ({ paneId }) => { calls.retain.push(paneId); return ['/fake/home']; },
    }),
  });

  try {
    const req = buildConfinementRequest({
      capability: 'advise',
      executorId: 'test-exec',
      requirement: { mode: 'required', policyId: 'host-write-denied', policy: resolveConfinementPolicy('host-write-denied') },
      backendId: 'bwrap',
      invocation: { command: 'echo', args: ['hi'], adapter: 'cli-spawn' },
      context: { cwd: tmp, runDir: tmp },
    });
    let thrown;
    try {
      await executeThroughConfinement(req, async () => { throw adapterError; });
    } catch (err) { thrown = err; }
    return { calls, thrown };
  } finally {
    registerBackendDriver(originalDriver);
    if (previousRegistry === undefined) delete process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
    else process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = previousRegistry;
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

test('an adapter failure with no pane left open removes the home', async () => {
  if (!HAS_WORKING_BWRAP) return;
  const { calls, thrown } = await runFailingDispatch(new DispatchError('worker-timeout', 'timed out', { paneId: 'p-1', paneRetained: false }));
  assert.ok(thrown, 'the failure still propagates');
  assert.equal(calls.cleanup, 1);
  assert.deepEqual(calls.retain, []);
});

test('an adapter failure that left its pane open keeps the home, tags it with the pane and names it in the error', async () => {
  if (!HAS_WORKING_BWRAP) return;
  const { calls, thrown } = await runFailingDispatch(new DispatchError('worker-timeout', 'paused', { paneId: 'p-2', paneRetained: true }));
  assert.equal(calls.cleanup, 0, 'a live pane is still using the home');
  assert.deepEqual(calls.retain, ['p-2']);
  assert.deepEqual(thrown.retainedPrivateHomes, ['/fake/home']);
  assert.match(thrown.message, /Private home kept for the open pane.*\/fake\/home/, 'the failure record names the path');
});

test('a restarted controller and the reaper both address the herdr session a worker was launched in', async () => {
  const f = fixture();
  const savedBin = process.env.FGOS_HERDR_BIN;
  const savedSession = process.env.HERDR_SESSION;
  try {
    // A fake herdr that lists the pane only for the worker's own session and records which session asked.
    const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-fake-herdr-'));
    const state = path.join(scratch, 'pane-open');
    const asked = path.join(scratch, 'asked');
    fs.writeFileSync(state, '1');
    const bin = path.join(scratch, 'fake-herdr.sh');
    fs.writeFileSync(bin, `#!/bin/sh
echo "$HERDR_SESSION" >> '${asked}'
if [ "$HERDR_SESSION" = "fgos-worker" ] && [ -s '${state}' ]; then
  echo '{"result":{"panes":[{"pane_id":"p-9"}]}}'
else
  echo '{"result":{"panes":[]}}'
fi
`, { mode: 0o755 });
    process.env.FGOS_HERDR_BIN = bin;
    process.env.HERDR_SESSION = 'operator-cockpit'; // the ambient session is not the worker's

    const plan = planFor(f.tempRoot, 'disp_session');
    const prepared = await prepareBwrap(
      plan,
      requestFor('disp_session', { kind: 'home-files', home: f.accountHome, files: ['plain-auth.json'] }),
      { id: 'bwrap', type: 'bwrap', config: {} },
    );
    const home = plan.resources[0].hostTarget;
    prepared.retain({ paneId: 'p-9', herdrSession: 'fgos-worker' });
    assert.equal(readOwnershipMarker(home).herdrSession, 'fgos-worker');

    const deadOwner = () => false;
    const whilePaneOpen = reapOrphanedConfinementResources({ tempRoot: f.tempRoot, checkLiveness: deadOwner });
    assert.deepEqual(whilePaneOpen.reaped, [], 'the worker session still has the pane, so its home stays');
    assert.ok(fs.readFileSync(asked, 'utf8').includes('fgos-worker'), 'the reaper asked the recorded session');
    assert.ok(!fs.readFileSync(asked, 'utf8').includes('operator-cockpit'), 'and never the ambient one');

    fs.writeFileSync(state, '');
    const afterClose = reapOrphanedConfinementResources({ tempRoot: f.tempRoot, checkLiveness: deadOwner });
    assert.equal(afterClose.reaped.length, 1);
    assert.equal(afterClose.reaped[0].reason, 'pane-closed');
  } finally {
    if (savedBin === undefined) delete process.env.FGOS_HERDR_BIN; else process.env.FGOS_HERDR_BIN = savedBin;
    if (savedSession === undefined) delete process.env.HERDR_SESSION; else process.env.HERDR_SESSION = savedSession;
    f.cleanup();
  }
});
