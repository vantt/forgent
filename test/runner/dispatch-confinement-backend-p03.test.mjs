// dispatch-confinement-backend-p03.test.mjs — tests for Phase 03:
// Local Bwrap Backend, Resources, Probes, Attestation Store, and Cleanup (R1-R8).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import cp from 'node:child_process';

import {
  getBackendDriver,
  registerBackendDriver,
  ALLOWED_DRIVER_TYPES,
  ConfinementBackendRegistryError,
} from '../../src/runner/dispatch/confinement/backend-registry.mjs';

import {
  bwrapDriver,
  validateBwrapConfig,
  assessBwrap,
  prepareBwrap,
  BWRAP_DRIVER_TYPE,
  BWRAP_DRIVER_VERSION,
} from '../../src/runner/dispatch/confinement/drivers/bwrap.mjs';

import {
  resolveConfinementResources,
  canonicalizeAndVerifySubpath,
  resolveWorkspaceGitMetadata,
  ConfinementResourceError,
} from '../../src/runner/dispatch/confinement/resources.mjs';

import {
  writeOwnershipMarker,
  readOwnershipMarker,
  cleanupConfinementResource,
  reapOrphanedConfinementResources,
  OWNERSHIP_MARKER_FILE,
  OWNERSHIP_CONTRACT,
  OWNERSHIP_CREATOR,
} from '../../src/runner/dispatch/confinement/cleanup.mjs';

import {
  saveAttestationRecord,
  loadAttestationRecord,
  savePlanRecord,
  createRedactedAttestationReference,
  validateAttestationCompleteness,
  verifyAttestationStoreIsolation,
  REQUIRED_CHANNELS,
  VALID_PHASES,
  AttestationStoreError,
} from '../../src/runner/dispatch/confinement/attestation-store.mjs';

import {
  runAllConfinementProbes,
  probeRunOutputWritable,
  probeHostWriteDenied,
  probeWorkspaceWritable,
  probeOtherRunDirDenied,
  probePrivateHomeIsolated,
  probeNoInheritedWritableFd,
  probeExecutorCredentialsReadOnly,
  probeHostReadAndNetworkNotOverclaimed,
  computeProbeFingerprint,
  computePlatformDigest,
} from '../../src/runner/dispatch/confinement/probes/harness.mjs';

import { checkConfinementProbeFreshness } from '../../src/setup/registrations.mjs';
import { executeThroughConfinement, buildConfinementAttestation } from '../../src/runner/dispatch/confinement/authority.mjs';
import { buildConfinementRequest } from '../../src/runner/dispatch/confinement/request.mjs';
import { DispatchError } from '../../src/runner/dispatch/transport.mjs';

// =========================================================================
// R1: Backend driver allowlist + bwrap driver config validation
// =========================================================================

test('R1: backend driver allowlist returns bwrap driver for type "bwrap"', () => {
  const driver = getBackendDriver('bwrap');
  assert.ok(driver);
  assert.equal(driver.type, 'bwrap');
  assert.equal(driver.version, 'local-bwrap-v1');
  assert.equal(typeof driver.validateConfig, 'function');
  assert.equal(typeof driver.assess, 'function');
  assert.equal(typeof driver.prepare, 'function');
});

test('R1: backend driver allowlist refuses unknown driver types with confinement-backend-unknown', () => {
  assert.throws(
    () => getBackendDriver('unknown-driver'),
    (err) => {
      assert.ok(err instanceof ConfinementBackendRegistryError);
      assert.match(err.message, /unknown confinement backend driver type/);
      assert.match(err.message, /confinement-backend-unknown/);
      return true;
    },
  );
});

test('R1: bwrap driver config validation accepts valid bwrap configuration', () => {
  assert.doesNotThrow(() =>
    validateBwrapConfig({
      type: 'bwrap',
      enabled: true,
      executable: '/usr/bin/bwrap',
      tempRoot: '/tmp/fgos',
      privateHomeRoot: '/tmp/fgos-home',
    }),
  );
});

test('R1: bwrap driver config validation refuses unknown config keys', () => {
  assert.throws(
    () =>
      validateBwrapConfig({
        type: 'bwrap',
        unknownKey: 'foo',
      }),
    /unknown config key "unknownKey"/,
  );
});

// =========================================================================
// R2: Resource resolver with canonical path validation & symlink escape rejection
// =========================================================================

test('R2: canonicalizeAndVerifySubpath verifies containment and rejects symlink escape', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-res-test-'));
  try {
    const rootDir = path.join(tmp, 'root');
    const insideDir = path.join(rootDir, 'nested', 'inside');
    const outsideDir = path.join(tmp, 'outside');

    fs.mkdirSync(insideDir, { recursive: true });
    fs.mkdirSync(outsideDir, { recursive: true });

    // Valid path inside root
    const valid = canonicalizeAndVerifySubpath(insideDir, rootDir, 'test-resource');
    assert.ok(valid.hostTarget);
    assert.equal(valid.declaredRoot, fs.realpathSync(rootDir));

    // Symlink inside root pointing outside
    const symlinkToOutside = path.join(rootDir, 'escape-link');
    fs.symlinkSync(outsideDir, symlinkToOutside, 'dir');

    assert.throws(
      () => canonicalizeAndVerifySubpath(symlinkToOutside, rootDir, 'test-resource'),
      (err) => {
        assert.ok(err instanceof ConfinementResourceError);
        assert.equal(err.code, 'confinement-grant-invalid');
        assert.match(err.message, /symlink escape or out-of-bounds path detected/);
        return true;
      },
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('R2: resolveConfinementResources resolves run-output, workspace, private-home, and credentials', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-res-full-'));
  try {
    const runDir = path.join(tmp, 'runs', '1');
    const wsDir = path.join(tmp, 'workspace');
    const fgosDir = path.join(tmp, 'runs');
    fs.mkdirSync(runDir, { recursive: true });
    fs.mkdirSync(wsDir, { recursive: true });

    const grants = [
      { resource: 'run-output', access: 'write', scope: 'dispatch' },
      { resource: 'workspace', access: 'read-write', scope: 'dispatch' },
      { resource: 'private-home', access: 'read-write', scope: 'dispatch' },
    ];

    const resolved = resolveConfinementResources({
      dispatchId: 'disp_123',
      context: { runDir, repoRoot: wsDir, fgosDir },
      grants,
      backendConfig: { tempRoot: tmp },
    });

    assert.equal(resolved.length, 3);
    const runRes = resolved.find((r) => r.resource === 'run-output');
    assert.ok(runRes);
    assert.equal(runRes.access, 'write');
    assert.equal(runRes.delivery, 'mount');

    const wsRes = resolved.find((r) => r.resource === 'workspace');
    assert.ok(wsRes);
    assert.equal(wsRes.access, 'read-write');

    const homeRes = resolved.find((r) => r.resource === 'private-home');
    assert.ok(homeRes);
    assert.equal(homeRes.allocation, 'temporary');
    assert.ok(fs.existsSync(homeRes.hostTarget));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('H2/M2: bwrap refuses unknown or missing required controls and unresolved credentials', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-control-refusal-'));
  try {
    const base = {
      dispatchId: 'disp_controls',
      context: { cwd: tmp, repoRoot: tmp, runDir: path.join(tmp, '.fgos', 'runs', 'one'), fgosDir: path.join(tmp, '.fgos') },
      requirement: {
        mode: 'required', policyId: 'host-write-denied', policy: {
          controls: { hostWrite: 'deny', hostRead: 'allow', networkEgress: 'allow', process: 'host', home: 'host', session: 'shared', workspace: 'shared' },
          grants: [{ resource: 'run-output', access: 'write', scope: 'dispatch' }],
        },
      },
    };
    fs.mkdirSync(base.context.runDir, { recursive: true });
    const unknown = assessBwrap({ ...base, requirement: { ...base.requirement, policy: { ...base.requirement.policy, controls: { ...base.requirement.policy.controls, gpu: 'deny' } } } }, { id: 'bwrap', config: { type: 'bwrap' } });
    assert.ok(unknown.mismatches.some((m) => m.detail.includes('control "gpu"')));
    const missing = assessBwrap({ ...base, requirement: { ...base.requirement, policy: { ...base.requirement.policy, controls: { ...base.requirement.policy.controls, hostWrite: undefined } } } }, { id: 'bwrap', config: { type: 'bwrap' } });
    assert.ok(missing.mismatches.some((m) => m.detail.includes('missing control "hostWrite"')));
    const credentials = assessBwrap({ ...base, requirement: { ...base.requirement, policy: { ...base.requirement.policy, grants: [{ resource: 'executor-credentials', access: 'read', scope: 'dispatch' }] } } }, { id: 'bwrap', config: { type: 'bwrap' } });
    assert.equal(credentials.coverage['grant:executor-credentials'], 'unverified');
    assert.ok(credentials.mismatches.some((m) => m.detail.includes('no provider credential source')));
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('H1/M5/M6: resolver refuses unsafe state boundaries before creating private home', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-resource-refusal-'));
  const oldStore = process.env.FGOS_CONFINEMENT_ATTESTATION_STORE_PATH;
  try {
    const fgosDir = path.join(tmp, '.fgos');
    const runDir = path.join(fgosDir, 'runs', 'one');
    fs.mkdirSync(runDir, { recursive: true });
    assert.throws(() => resolveConfinementResources({ dispatchId: 'disp_run', context: { runDir }, grants: [{ resource: 'run-output', access: 'write' }] }), ConfinementResourceError);
    const outside = path.join(tmp, 'outside');
    fs.mkdirSync(outside);
    const workspaceLink = path.join(tmp, 'workspace-link');
    fs.symlinkSync(outside, workspaceLink);
    assert.throws(() => resolveConfinementResources({ dispatchId: 'disp_workspace', context: { repoRoot: workspaceLink }, grants: [{ resource: 'workspace', access: 'read-write' }] }), ConfinementResourceError);
    const escaped = path.join(tmp, 'escaped', 'home');
    assert.throws(() => resolveConfinementResources({ dispatchId: '../../escaped', context: {}, grants: [{ resource: 'private-home', access: 'read-write' }], backendConfig: { tempRoot: path.join(tmp, 'safe') } }), ConfinementResourceError);
    assert.equal(fs.existsSync(escaped), false);
    process.env.FGOS_CONFINEMENT_ATTESTATION_STORE_PATH = path.join(fgosDir, 'attestations');
    assert.throws(() => verifyAttestationStoreIsolation(path.join(fgosDir, 'attestations'), [{ resource: 'workspace', hostTarget: path.dirname(fgosDir), access: 'read-write' }]), AttestationStoreError);
  } finally {
    if (oldStore === undefined) delete process.env.FGOS_CONFINEMENT_ATTESTATION_STORE_PATH;
    else process.env.FGOS_CONFINEMENT_ATTESTATION_STORE_PATH = oldStore;
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('R2: resolveWorkspaceGitMetadata resolves worktree gitdir pointers', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-gitdir-test-'));
  try {
    const commonGitDir = path.join(tmp, 'common', '.git');
    const worktreeGitDir = path.join(commonGitDir, 'worktrees', 'wt1');
    const wtDir = path.join(tmp, 'wt1');

    fs.mkdirSync(worktreeGitDir, { recursive: true });
    fs.mkdirSync(wtDir, { recursive: true });

    // Create .git file in worktree pointing to worktreeGitDir
    fs.writeFileSync(path.join(wtDir, '.git'), `gitdir: ${worktreeGitDir}\n`, 'utf8');

    const resolved = resolveWorkspaceGitMetadata(wtDir);
    assert.equal(resolved, fs.realpathSync(worktreeGitDir));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// =========================================================================
// R3: bwrap 'assess' for default support matrix only
// =========================================================================

test('R3: assessBwrap accepts default host-write-denied and workspace-write policies in required mode', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-assess-test-'));
  try {
    const runDir = path.join(tmp, 'run');
    fs.mkdirSync(runDir, { recursive: true });

    const req = buildConfinementRequest({
      capability: 'code:review',
      executorId: 'bwrap-exec',
      requirement: {
        mode: 'required',
        policyId: 'host-write-denied',
        policy: {
          contract: 'confinement-policy.v1',
          controls: {
            hostWrite: 'deny',
            hostRead: 'allow',
            networkEgress: 'allow',
            process: 'host',
            home: 'host',
            session: 'shared',
            workspace: 'shared',
          },
          grants: [{ resource: 'run-output', access: 'write', scope: 'dispatch' }],
        },
      },
      context: { cwd: tmp, runDir, fgosDir: tmp },
      backendId: 'bwrap',
    });

    const assessment = assessBwrap(req, { id: 'bwrap', type: 'bwrap', config: { type: 'bwrap' } });
    assert.equal(assessment.mismatches.length, 0);
    assert.equal(assessment.coverage['control:hostWrite'], 'satisfied');
    assert.equal(assessment.coverage['control:hostRead'], 'satisfied');
    assert.equal(assessment.coverage['control:networkEgress'], 'satisfied');
    assert.equal(assessment.coverage['control:process'], 'satisfied');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('R3: assessBwrap returns named mismatches for unsupported controls (hostRead:deny, networkEgress:filtered, process:isolated)', () => {
  const req = buildConfinementRequest({
    capability: 'secure-task',
    executorId: 'bwrap-exec',
    requirement: {
      mode: 'required',
      policyId: 'custom-tight',
      policy: {
        contract: 'confinement-policy.v1',
        controls: {
          hostWrite: 'deny',
          hostRead: 'deny', // unsupported
          networkEgress: 'filtered', // unsupported
          process: 'isolated', // unsupported
          home: 'host',
          session: 'shared',
          workspace: 'shared',
        },
        grants: [{ resource: 'run-output', access: 'write', scope: 'dispatch' }],
      },
    },
    context: { cwd: '/tmp', runDir: '/tmp' },
    backendId: 'bwrap',
  });

  const assessment = assessBwrap(req, { id: 'bwrap', type: 'bwrap', config: { type: 'bwrap' } });
  assert.ok(assessment.mismatches.length >= 3);
  assert.ok(assessment.mismatches.some((m) => m.detail.includes('hostRead: deny')));
  assert.ok(assessment.mismatches.some((m) => m.detail.includes('networkEgress: filtered')));
  assert.ok(assessment.mismatches.some((m) => m.detail.includes('process: isolated')));
  assert.equal(assessment.coverage['control:hostRead'], 'unsatisfied');
  assert.equal(assessment.coverage['control:networkEgress'], 'unsatisfied');
  assert.equal(assessment.coverage['control:process'], 'unsatisfied');
});

test('R3: assessBwrap returns mismatch for preferred mode and invocation override', () => {
  const req = buildConfinementRequest({
    capability: 'pref-task',
    executorId: 'bwrap-exec',
    requirement: {
      mode: 'preferred', // unsupported in default v1
      policyId: 'host-write-denied',
      policy: {
        contract: 'confinement-policy.v1',
        controls: {
          hostWrite: 'deny',
          hostRead: 'allow',
          networkEgress: 'allow',
          process: 'host',
          home: 'host',
          session: 'shared',
          workspace: 'shared',
        },
        grants: [{ resource: 'run-output', access: 'write', scope: 'dispatch' }],
      },
    },
    override: { controls: { hostRead: 'deny' } },
    context: { cwd: '/tmp', runDir: '/tmp' },
    backendId: 'bwrap',
  });

  const assessment = assessBwrap(req, { id: 'bwrap', type: 'bwrap', config: { type: 'bwrap' } });
  assert.ok(assessment.mismatches.some((m) => m.detail.includes('preferred confinement mode is not supported')));
  assert.ok(assessment.mismatches.some((m) => m.detail.includes('invocation confinement override is not supported')));
});

// =========================================================================
// R4: bwrap 'prepare' strictly from resolved resources
// =========================================================================

test('R4: prepareBwrap materializes mounts strictly from resolved resources and applies bindings generically', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-prep-test-'));
  try {
    const runDir = path.join(tmp, 'rundir');
    const wsDir = path.join(tmp, 'workspace');
    fs.mkdirSync(runDir, { recursive: true });
    fs.mkdirSync(wsDir, { recursive: true });

    const plan = {
      contract: 'confinement-plan.v1',
      dispatchId: 'disp_test_prep',
      decision: 'execute',
      coverage: { 'control:hostWrite': 'satisfied' },
      resources: [
        {
          resource: 'run-output',
          hostTarget: runDir,
          executionTarget: { location: 'host', path: runDir },
          access: 'write',
          delivery: 'mount',
        },
        {
          resource: 'workspace',
          hostTarget: wsDir,
          executionTarget: { location: 'host', path: wsDir },
          access: 'read-write',
          delivery: 'mount',
        },
        {
          resource: 'private-home',
          hostTarget: path.join(tmp, 'private-home'),
          executionTarget: { location: 'host', path: '/home/sandbox' },
          access: 'read-write',
          delivery: 'mount',
          allocation: 'temporary',
        },
      ],
    };

    const req = {
      dispatchId: 'disp_test_prep',
      invocation: {
        command: 'agent-cli',
        args: ['--work', '{HOME_TOKEN}'],
        env: { FOO: 'bar' },
        resourceBindings: [
          { resource: 'private-home', target: { kind: 'env', name: 'AGENT_HOME' } },
          { resource: 'private-home', target: { kind: 'argument', token: '{HOME_TOKEN}' } },
        ],
      },
      context: { cwd: wsDir, runDir },
    };

    const prepared = await prepareBwrap(plan, req, {
      id: 'bwrap',
      type: 'bwrap',
      config: { executable: '/usr/bin/bwrap' },
    });

    assert.ok(prepared.invocation);
    assert.equal(prepared.invocation.command, '/usr/bin/bwrap');

    const args = prepared.invocation.args;
    // Must contain base mounts
    assert.ok(args.includes('--ro-bind'));
    assert.ok(args.includes('--proc'));
    assert.ok(args.includes('--dev'));
    assert.ok(args.includes('--tmpfs'));

    // Must bind run-output and workspace
    const runIdx = args.indexOf(runDir);
    assert.ok(runIdx > 0 && args[runIdx - 1] === '--bind');
    const wsIdx = args.indexOf(wsDir);
    assert.ok(wsIdx > 0 && args[wsIdx - 1] === '--bind');

    // Generic bindings applied
    assert.equal(prepared.invocation.env.AGENT_HOME, '/home/sandbox');
    assert.ok(args.includes('/home/sandbox'));

    // Cleanup handle provided
    assert.equal(typeof prepared.cleanup, 'function');
    await prepared.cleanup();
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// =========================================================================
// R5: Ownership markers and idempotent reaper
// =========================================================================

test('R5: writeOwnershipMarker writes valid marker and cleanup removes only owned directory', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-clean-test-'));
  try {
    const ownedDir = path.join(tmp, 'owned');
    const foreignDir = path.join(tmp, 'foreign');
    fs.mkdirSync(ownedDir, { recursive: true });
    fs.mkdirSync(foreignDir, { recursive: true });

    writeOwnershipMarker(ownedDir, { dispatchId: 'disp_alpha', resource: 'private-home' });
    const marker = readOwnershipMarker(ownedDir);
    assert.ok(marker);
    assert.equal(marker.contract, OWNERSHIP_CONTRACT);
    assert.equal(marker.creator, OWNERSHIP_CREATOR);
    assert.equal(marker.dispatchId, 'disp_alpha');

    // Refuses to clean foreign dir without marker
    const foreignClean = cleanupConfinementResource(foreignDir, 'disp_alpha');
    assert.equal(foreignClean.cleaned, false);
    assert.equal(foreignClean.reason, 'missing-or-invalid-marker');
    assert.ok(fs.existsSync(foreignDir));

    // Refuses to clean if dispatchId mismatches
    const mismatchClean = cleanupConfinementResource(ownedDir, 'disp_wrong');
    assert.equal(mismatchClean.cleaned, false);
    assert.equal(mismatchClean.reason, 'dispatch-id-mismatch');
    assert.ok(fs.existsSync(ownedDir));

    // Successfully cleans owned dir with matching dispatchId
    const successClean = cleanupConfinementResource(ownedDir, 'disp_alpha');
    assert.equal(successClean.cleaned, true);
    assert.ok(!fs.existsSync(ownedDir));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('R5: reapOrphanedConfinementResources is idempotent and ignores living processes', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-reap-test-'));
  try {
    const deadDir = path.join(tmp, 'dead-dispatch', 'home');
    const aliveDir = path.join(tmp, 'alive-dispatch', 'home');
    fs.mkdirSync(deadDir, { recursive: true });
    fs.mkdirSync(aliveDir, { recursive: true });

    // Write marker with dead pid (e.g. 99999999)
    writeOwnershipMarker(deadDir, { dispatchId: 'dead-1', pid: 99999999 });
    // Write marker with current living process pid
    writeOwnershipMarker(aliveDir, { dispatchId: 'alive-1', pid: process.pid });

    // First reaper pass: dead process allocation is reaped, alive is kept
    const firstPass = reapOrphanedConfinementResources({ tempRoot: tmp });
    assert.equal(firstPass.reaped.length, 1);
    assert.equal(firstPass.reaped[0].dispatchId, 'dead-1');
    assert.ok(!fs.existsSync(deadDir));
    assert.ok(fs.existsSync(aliveDir));

    // Second reaper pass: IDEMPOTENT (no error, double-acting, or crash)
    const secondPass = reapOrphanedConfinementResources({ tempRoot: tmp });
    assert.equal(secondPass.reaped.length, 0);
    assert.ok(fs.existsSync(aliveDir));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// =========================================================================
// R6: Persistent attestation store and schema verification
// =========================================================================

test('R6: validateAttestationCompleteness enforces 4 phases and 5 required channels', () => {
  const validAttestation = {
    contract: 'confinement-attestation.v1',
    dispatchId: 'disp_schema_test',
    phase: 'prepared',
    outcome: 'unknown',
    channels: REQUIRED_CHANNELS.map((name) => ({ name, coverage: 'covered', detail: 'test' })),
  };

  assert.doesNotThrow(() => validateAttestationCompleteness(validAttestation));

  // Test missing channel
  const missingChannel = {
    ...validAttestation,
    channels: validAttestation.channels.filter((c) => c.name !== 'inherited-fd'),
  };
  assert.throws(() => validateAttestationCompleteness(missingChannel), /missing required channel "inherited-fd"/);

  // Test invalid phase
  const invalidPhase = {
    ...validAttestation,
    phase: 'settled', // "settled" is invalid per brief-1.md
  };
  assert.throws(() => validateAttestationCompleteness(invalidPhase), /phase must be one of/);
});

test('R6: saveAttestationRecord persists records outside write grants and createRedactedAttestationReference creates digest', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-attest-test-'));
  const oldStore = process.env.FGOS_CONFINEMENT_ATTESTATION_STORE_PATH;
  try {
    process.env.FGOS_CONFINEMENT_ATTESTATION_STORE_PATH = path.join(tmp, 'machine-state', 'attestations');
    const context = { fgosDir: tmp };

    for (const phase of ['prepared', 'completed', 'failed', 'refused']) {
      const att = {
        contract: 'confinement-attestation.v1',
        dispatchId: `disp_${phase}`,
        phase,
        outcome: phase === 'refused' ? 'refused' : 'enforced',
        channels: REQUIRED_CHANNELS.map((name) => ({ name, coverage: 'covered', detail: 'ok' })),
        coverage: { 'control:hostWrite': 'satisfied' },
        effectiveControls: { hostWrite: 'deny' },
        mismatches: [],
      };

      const saved = saveAttestationRecord(att, context);
      assert.ok(fs.existsSync(saved.path));

      const loaded = loadAttestationRecord(att.dispatchId, phase, context);
      assert.equal(loaded.dispatchId, att.dispatchId);
      assert.equal(loaded.phase, phase);

      const ref = createRedactedAttestationReference(att);
      assert.equal(ref.contract, 'confinement-attestation-ref.v1');
      assert.equal(ref.dispatchId, att.dispatchId);
      assert.ok(ref.digest.startsWith('sha256:'));
      assert.equal(ref.ref, `attestation:${att.dispatchId}:${phase}`);
    }
  } finally {
    if (oldStore === undefined) delete process.env.FGOS_CONFINEMENT_ATTESTATION_STORE_PATH;
    else process.env.FGOS_CONFINEMENT_ATTESTATION_STORE_PATH = oldStore;
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// =========================================================================
// R7: Falsification probe harness + RED FALSIFIERS for all 8 probes
// =========================================================================

test('R7: probe 1 (run-output writable) passes on valid sandbox and fails on red falsifier', () => {
  if (os.platform() !== 'linux') return;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-p1-'));
  try {
    const runDir = path.join(tmp, 'run');
    fs.mkdirSync(runDir, { recursive: true });

    // Normal configuration: passes
    const normal = probeRunOutputWritable({ runDir });
    assert.equal(normal.passed, true);

    // RED FALSIFIER: read-only run-output fails
    const red = probeRunOutputWritable({ runDir, brokenConfig: true });
    assert.equal(red.passed, false, 'probe correctly detected broken read-only run-output');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('R7: probe 2 (host-write denied) passes on valid sandbox and fails on red falsifier', () => {
  if (os.platform() !== 'linux') return;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-p2-'));
  try {
    const hostDir = path.join(tmp, 'host');
    fs.mkdirSync(hostDir, { recursive: true });

    // Normal configuration: write to hostDir is denied
    const normal = probeHostWriteDenied({ targetDir: hostDir });
    assert.equal(normal.passed, true);

    // RED FALSIFIER: writable bind to hostDir allows write -> probe catches violation!
    const red = probeHostWriteDenied({ targetDir: hostDir, brokenConfig: true });
    assert.equal(red.passed, false, 'probe correctly detected writable host directory leak');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('R7: probe 3 (workspace writable ONLY) passes on valid sandbox and fails on red falsifiers', () => {
  if (os.platform() !== 'linux') return;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-p3-'));
  try {
    const wsDir = path.join(tmp, 'ws');
    const outsideDir = path.join(tmp, 'outside');
    fs.mkdirSync(wsDir, { recursive: true });
    fs.mkdirSync(outsideDir, { recursive: true });

    // Normal configuration: workspace writable, outside denied
    const normal = probeWorkspaceWritable({ workspaceDir: wsDir, outsideDir });
    assert.equal(normal.passed, true);

    // RED FALSIFIER 1: workspace read-only
    const red1 = probeWorkspaceWritable({ workspaceDir: wsDir, outsideDir, brokenConfig: 'ws-readonly' });
    assert.equal(red1.passed, false, 'probe correctly detected read-only workspace');

    // RED FALSIFIER 2: outsideDir writable leak
    const red2 = probeWorkspaceWritable({ workspaceDir: wsDir, outsideDir, brokenConfig: 'outside-writable' });
    assert.equal(red2.passed, false, 'probe correctly detected outside directory write leak');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('R7: probe 4 (other runDir denied) passes on valid sandbox and fails on red falsifier', () => {
  if (os.platform() !== 'linux') return;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-p4-'));
  try {
    const ownRunDir = path.join(tmp, 'disp1', 'run');
    const otherRunDir = path.join(tmp, 'disp2', 'run');
    fs.mkdirSync(ownRunDir, { recursive: true });
    fs.mkdirSync(otherRunDir, { recursive: true });

    // Normal configuration: otherRunDir denied
    const normal = probeOtherRunDirDenied({ ownRunDir, otherRunDir });
    assert.equal(normal.passed, true);

    // RED FALSIFIER: shared parent writable
    const red = probeOtherRunDirDenied({ ownRunDir, otherRunDir, brokenConfig: true });
    assert.equal(red.passed, false, 'probe correctly detected cross-dispatch runDir write leak');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('R7: probe 5 (private home isolated) passes on valid sandbox and fails on red falsifier', () => {
  if (os.platform() !== 'linux') return;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-p5-'));
  try {
    const hostHome = path.join(tmp, 'host-home');
    const privateHome = path.join(tmp, 'private-home');
    fs.mkdirSync(hostHome, { recursive: true });
    fs.mkdirSync(privateHome, { recursive: true });

    // Normal configuration: private home written, host home untouched
    const normal = probePrivateHomeIsolated({ hostHomeDir: hostHome, privateHomeDir: privateHome });
    assert.equal(normal.passed, true);

    // RED FALSIFIER: real host home writable -> probe catches leak
    const red = probePrivateHomeIsolated({ hostHomeDir: hostHome, privateHomeDir: privateHome, brokenConfig: true });
    assert.equal(red.passed, false, 'probe correctly detected private home leak into real host home');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('R7: probe 6 (no inherited writable fd / MED-1 fix) passes with fd closer and fails without it', () => {
  if (os.platform() !== 'linux') return;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-p6-'));
  try {
    const hostFile = path.join(tmp, 'target-fd.txt');

    // Normal configuration: fd closer drops inherited fd -> hostFile unmodified
    const normal = probeNoInheritedWritableFd({ hostFile });
    assert.equal(normal.passed, true);

    // RED FALSIFIER: without fd closer, child writes through inherited fd and mutates hostFile
    const red = probeNoInheritedWritableFd({ hostFile, brokenConfig: true });
    assert.equal(red.passed, false, 'probe correctly caught inherited writable fd leak');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('R7: probe 7 (executor credentials read-only) passes on valid sandbox and fails on red falsifier', () => {
  if (os.platform() !== 'linux') return;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-p7-'));
  try {
    const credsDir = path.join(tmp, 'creds');
    fs.mkdirSync(credsDir, { recursive: true });

    // Normal configuration: credentials readable, write denied
    const normal = probeExecutorCredentialsReadOnly({ credsDir });
    assert.equal(normal.passed, true);

    // RED FALSIFIER: credentials mounted writable
    const red = probeExecutorCredentialsReadOnly({ credsDir, brokenConfig: true });
    assert.equal(red.passed, false, 'probe correctly caught writable credentials tampering');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('R7: probe 8 (host read and network not overclaimed) passes on valid sandbox and fails on red falsifier', () => {
  if (os.platform() !== 'linux') return;

  // Normal configuration: read and network available
  const normal = probeHostReadAndNetworkNotOverclaimed();
  assert.equal(normal.passed, true);

  // RED FALSIFIER: network unshared without loopback -> probe detects overclaim
  const red = probeHostReadAndNetworkNotOverclaimed({ brokenConfig: true });
  assert.equal(red.passed, false, 'probe correctly detected overclaimed network denial');
});

test('R7: runAllConfinementProbes runs all 8 probes and succeeds on Linux', () => {
  if (os.platform() !== 'linux') return;
  const result = runAllConfinementProbes();
  assert.equal(result.passed, true);
  assert.equal(result.results.length, 8);
  for (const r of result.results) {
    assert.equal(r.passed, true, `probe "${r.probe}" failed: ${r.detail}`);
  }
});

// =========================================================================
// R8: Doctor check uses the same probe harness
// =========================================================================

test('R8: checkConfinementProbeFreshness in doctor passes on Linux with working bwrap', () => {
  const check = checkConfinementProbeFreshness();
  assert.equal(check.passed, true);
  if (os.platform() === 'linux') {
    assert.match(check.message, /all 8 local-bwrap-v1 probes passed/);
  }
});

// =========================================================================
// Lifecycle & Authority Door Integration
// =========================================================================

test('Authority Door: required mode with bwrap backend assesses, prepares, executes, cleans up, and records attestation', async () => {
  if (os.platform() !== 'linux') return;

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-door-test-'));
  try {
    const runDir = path.join(tmp, 'run');
    fs.mkdirSync(runDir, { recursive: true });

    let adapterSpawned = false;
    const fakeAdapter = async (invocation, opts) => {
      adapterSpawned = true;
      assert.equal(invocation.command, '/usr/bin/bwrap');
      assert.ok(invocation.args.includes('--bind'));
      return { status: 0, stdout: 'success' };
    };

    const req = buildConfinementRequest({
      capability: 'code:review',
      executorId: 'bwrap-exec',
      requirement: {
        mode: 'required',
        policyId: 'host-write-denied',
        policy: {
          contract: 'confinement-policy.v1',
          controls: {
            hostWrite: 'deny',
            hostRead: 'allow',
            networkEgress: 'allow',
            process: 'host',
            home: 'host',
            session: 'shared',
            workspace: 'shared',
          },
          grants: [
            { resource: 'run-output', access: 'write', scope: 'dispatch' },
            { resource: 'private-home', access: 'read-write', scope: 'dispatch' },
          ],
        },
      },
      context: { cwd: tmp, runDir, fgosDir: tmp },
      backendId: 'bwrap',
    });

    const execResult = await executeThroughConfinement(req, fakeAdapter);
    assert.equal(adapterSpawned, true);
    assert.equal(execResult.status, 'completed');
    assert.ok(execResult.attestation);
    assert.equal(execResult.attestation.phase, 'completed');

    // Attestation records persisted outside write grants
    const loadedPrep = loadAttestationRecord(req.dispatchId, 'prepared', { fgosDir: tmp });
    assert.ok(loadedPrep);
    const loadedTerm = loadAttestationRecord(req.dispatchId, 'completed', { fgosDir: tmp });
    assert.ok(loadedTerm);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('Cleanup: prepare failure triggers immediate cleanup of allocated resources', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-prep-fail-'));
  try {
    const allocatedHome = path.join(tmp, 'disp_fail', 'home');
    fs.mkdirSync(allocatedHome, { recursive: true });
    writeOwnershipMarker(allocatedHome, { dispatchId: 'disp_fail', resource: 'private-home' });

    const plan = {
      contract: 'confinement-plan.v1',
      dispatchId: 'disp_fail',
      resources: [
        {
          resource: 'private-home',
          hostTarget: allocatedHome,
          executionTarget: { location: 'host', path: '/home/sandbox' },
          access: 'read-write',
          allocation: 'temporary',
        },
      ],
      coverage: {},
    };

    // Deliberately trigger an error in prepare by passing invalid invocation
    const brokenReq = {
      dispatchId: 'disp_fail',
      invocation: null, // will cause TypeError during prepare
      context: {},
    };

    await assert.rejects(
      () => prepareBwrap(plan, brokenReq, { id: 'bwrap', type: 'bwrap', config: {} }),
      /command|invocation|TypeError/,
    );

    // Verify allocatedHome was cleaned up on error
    assert.ok(!fs.existsSync(allocatedHome), 'allocated temporary home directory was cleaned up on prepare failure');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('Cleanup: adapter failure and timeout/cancel clean up temporary resources in finally block', async () => {
  if (os.platform() !== 'linux') return;

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-adapt-fail-'));
  try {
    const runDir = path.join(tmp, 'run');
    fs.mkdirSync(runDir, { recursive: true });

    let allocatedHomePath = null;
    const failingAdapter = async (invocation, opts) => {
      // Find the allocated private home mount from invocation args
      const bindIdx = invocation.args.indexOf('--bind');
      for (let i = 0; i < invocation.args.length - 1; i++) {
        if (invocation.args[i] === '--bind' && invocation.args[i + 1].includes('disp_fail_adapter')) {
          allocatedHomePath = invocation.args[i + 1];
        }
      }
      throw new DispatchError('worker-timeout', 'simulated adapter execution timeout');
    };

    const req = buildConfinementRequest({
      dispatchId: 'disp_fail_adapter',
      capability: 'code:review',
      executorId: 'bwrap-exec',
      requirement: {
        mode: 'required',
        policyId: 'host-write-denied',
        policy: {
          contract: 'confinement-policy.v1',
          controls: {
            hostWrite: 'deny',
            hostRead: 'allow',
            networkEgress: 'allow',
            process: 'host',
            home: 'host',
            session: 'shared',
            workspace: 'shared',
          },
          grants: [
            { resource: 'run-output', access: 'write', scope: 'dispatch' },
            { resource: 'private-home', access: 'read-write', scope: 'dispatch' },
          ],
        },
      },
      context: { cwd: tmp, runDir, fgosDir: tmp },
      backendId: 'bwrap',
    });

    await assert.rejects(
      () => executeThroughConfinement(req, failingAdapter),
      (err) => {
        assert.ok(err instanceof DispatchError);
        assert.equal(err.errorClass, 'worker-timeout');
        return true;
      },
    );

    // Verify private-home allocated directory was cleaned up in finally block
    if (allocatedHomePath) {
      assert.ok(!fs.existsSync(allocatedHomePath), 'allocated private home was cleaned up in finally block after adapter failure');
    }

    // Verify failure attestation was recorded
    const failedAttestation = loadAttestationRecord('disp_fail_adapter', 'failed', { fgosDir: tmp });
    assert.ok(failedAttestation);
    assert.equal(failedAttestation.phase, 'failed');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
