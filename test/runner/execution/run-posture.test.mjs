// test/runner/execution/run-posture.test.mjs -- the posture a seat is bound with maps onto the built-in
// confinement policies, and a posture applies only on a declared backend this machine can run.

import '../../helpers/process-tmp-root.mjs';
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { resolvePosture, canApplyPosture } from '../../../src/runner/dispatch/confinement/policies.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';
import { makeFixtureDir } from '../../helpers/fixture-dir.mjs';

seedFileLocalBwrapRegistry();

const fixtureDirs = [];
const fixtureDir = (prefix) => {
  const dir = makeFixtureDir(prefix);
  fixtureDirs.push(dir);
  return dir;
};
after(() => {
  for (const dir of fixtureDirs) fs.rmSync(dir, { recursive: true, force: true });
});

test('resolvePosture maps posture onto the built-in policies without building sandbox arguments', () => {
  const ro = resolvePosture({ posture: 'read-only' });
  assert.equal(ro.policyId, 'host-write-denied');
  assert.deepEqual(ro.requirement, { mode: 'required', policyId: 'host-write-denied', policy: ro.policy });
  assert.ok(ro.policy.grants.some((g) => g.resource === 'run-output' && g.access === 'write'));
  assert.ok(ro.policy.grants.some((g) => g.resource === 'executor-credentials' && g.access === 'read'));
  assert.ok(!ro.policy.grants.some((g) => g.resource === 'workspace'));
  assert.equal('bwrapArgs' in ro, false);

  const rw = resolvePosture({ posture: 'workspace-write' });
  assert.equal(rw.policyId, 'workspace-write');
  assert.equal(rw.requirement.mode, 'required');
  assert.ok(rw.policy.grants.some((g) => g.resource === 'workspace' && g.access === 'read-write'));

  // an unknown or missing posture never widens access
  assert.equal(resolvePosture({ posture: 'anything-else' }).policyId, 'host-write-denied');
  assert.equal(resolvePosture(undefined).policyId, 'host-write-denied');
});

test('canApplyPosture needs a declared backend that is registered and executable on this machine', () => {
  const executors = {
    confined: { invocations: [{ id: 'cli-bwrap', via: 'cli', confinement: { backend: 'bwrap' } }, { id: 'cli-plain', via: 'cli' }] },
    plain: { invocations: [{ id: 'cli-plain', via: 'cli', command: 'x', args: [] }] },
  };
  const ctx = { executors };
  assert.equal(canApplyPosture({ executor: 'confined', invocation: 'cli-bwrap' }, 'read-only', ctx), true);
  assert.equal(canApplyPosture({ executor: 'confined', invocation: null }, 'workspace-write', ctx), true);
  assert.equal(canApplyPosture({ executor: 'confined', invocation: 'cli-plain' }, 'read-only', ctx), false);
  assert.equal(canApplyPosture({ executor: 'confined', invocation: 'missing' }, 'read-only', ctx), false);
  assert.equal(canApplyPosture({ executor: 'plain', invocation: null }, 'read-only', ctx), false);
  assert.equal(canApplyPosture({ executor: 'unknown' }, 'read-only', ctx), false);
  assert.equal(canApplyPosture(null, 'read-only', ctx), false);

  const dir = fixtureDir('fgos-posture-reg-');
  const write = (name, doc) => { const p = path.join(dir, name); fs.writeFileSync(p, JSON.stringify(doc)); return p; };
  const reg = (instance) => ({ contract: 'confinement-backend-registry.v1', confinementBackends: { bwrap: instance } });
  const base = { executor: 'confined', invocation: 'cli-bwrap' };
  assert.equal(canApplyPosture(base, 'read-only', { executors, registryPath: write('missing-exe.json', reg({ type: 'bwrap', enabled: true, executable: '/nonexistent/bwrap' })) }), false);
  assert.equal(canApplyPosture(base, 'read-only', { executors, registryPath: write('disabled.json', reg({ type: 'bwrap', enabled: false, executable: '/usr/bin/bwrap' })) }), false);
  assert.equal(canApplyPosture(base, 'read-only', { executors, registryPath: write('empty.json', { contract: 'confinement-backend-registry.v1', confinementBackends: {} }) }), false);
  assert.equal(canApplyPosture(base, 'read-only', { executors, registryPath: path.join(dir, 'malformed.json') }), false);
});

test('guard: policies.mjs builds no sandbox arguments of its own', () => {
  const src = fs.readFileSync(path.resolve('src/runner/dispatch/confinement/policies.mjs'), 'utf8');
  assert.ok(!/bwrapArgs/.test(src), 'sandbox argv belongs to the bwrap driver only');
});
