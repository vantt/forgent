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
  resolveConfinementTempRoot,
  ensurePrivateDir,
} from '../../src/runner/dispatch/confinement/cleanup.mjs';

// A private home holds a copy of an account login. These tests pin the things
// that keep that copy from lingering or being readable: owner-only directories
// at every level and removal when the run is over.

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
  invocation: { command: 'agent-cli', args: [], env: {} },
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

  const calls = { cleanup: 0 };
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

test('an adapter failure removes the home', async () => {
  if (!HAS_WORKING_BWRAP) return;
  const { calls, thrown } = await runFailingDispatch(new DispatchError("worker-timeout", "timed out"));
  assert.ok(thrown, 'the failure still propagates');
  assert.equal(calls.cleanup, 1);
});

