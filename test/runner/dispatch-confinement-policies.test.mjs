import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  loadRunnerConfig,
  loadRunnerConfigFromDir,
  RunnerConfigError,
} from '../../src/runner/dispatch/config.mjs';
import {
  BUILTIN_POLICIES,
  BUILTIN_POLICY_IDS,
  validateConfinementPolicyShape,
  validateNetworkFilterShape,
  validateCapabilityConfinementShape,
  validateOverrideConfinementShape,
  normalizeLegacyConfinement,
  resolveConfinementPolicy,
  ConfinementPolicyError,
} from '../../src/runner/dispatch/confinement/policies.mjs';
import {
  validateBackendInstanceConfigShape,
  validateBackendRegistryShape,
  rejectProjectBackendOverride,
  resolveMachineBackendRegistryPath,
  loadMachineBackendRegistry,
  createBackendRegistrySnapshot,
  ensureMachineBackendRegistryDefaults,
  ConfinementBackendRegistryError,
} from '../../src/runner/dispatch/confinement/backend-registry.mjs';

function mkTempConfig(runnerObj) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-confinement-test-'));
  const file = path.join(dir, 'config.json');
  fs.writeFileSync(file, JSON.stringify({
    executor: { command: 'node', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 60000,
    ...runnerObj,
  }, null, 2));
  return { dir, file };
}

// ─── R2: Built-in Policies ──────────────────────────────────────────────────

test('R2: BUILTIN_POLICIES defines host-write-denied and workspace-write as immutable v1 schemas', () => {
  assert.ok(BUILTIN_POLICIES['host-write-denied'], 'host-write-denied must be defined');
  assert.ok(BUILTIN_POLICIES['workspace-write'], 'workspace-write must be defined');
  assert.deepEqual(BUILTIN_POLICY_IDS.slice().sort(), ['host-write-denied', 'workspace-write'].sort());

  // Both pass validateConfinementPolicyShape
  validateConfinementPolicyShape(BUILTIN_POLICIES['host-write-denied']);
  validateConfinementPolicyShape(BUILTIN_POLICIES['workspace-write']);

  // Immutability: frozen
  assert.ok(Object.isFrozen(BUILTIN_POLICIES));
  assert.ok(Object.isFrozen(BUILTIN_POLICIES['host-write-denied']));
  assert.ok(Object.isFrozen(BUILTIN_POLICIES['workspace-write']));
});

// ─── R3: Custom Confinement Policies Validation ─────────────────────────────

test('R3: validateConfinementPolicyShape accepts valid custom v1 policy', () => {
  const customPolicy = {
    contract: 'confinement-policy.v1',
    controls: {
      hostWrite: 'deny',
      hostRead: 'allow',
      networkEgress: 'filtered',
      process: 'isolated',
      home: 'private',
      session: 'isolated',
      workspace: 'own',
    },
    grants: [
      { resource: 'run-output', access: 'write', scope: 'dispatch' },
      { resource: 'workspace', access: 'read-write', scope: 'dispatch' },
    ],
    networkFilter: {
      defaultAction: 'deny',
      allow: [
        {
          protocol: 'tcp',
          destination: { kind: 'dns', value: 'registry.npmjs.org' },
          ports: [443],
        },
      ],
    },
  };

  const validated = validateConfinementPolicyShape(customPolicy);
  assert.equal(validated.contract, 'confinement-policy.v1');
  assert.equal(validated.controls.hostWrite, 'deny');
});

test('R3: validateConfinementPolicyShape rejects unknown root keys', () => {
  assert.throws(
    () => validateConfinementPolicyShape({
      contract: 'confinement-policy.v1',
      controls: {
        hostWrite: 'deny',
        hostRead: 'allow',
        networkEgress: 'deny',
        process: 'isolated',
        home: 'private',
        session: 'isolated',
        workspace: 'own',
      },
      grants: [],
      extraUnknownKey: true,
    }),
    /contains unknown key "extraUnknownKey"/,
  );
});

test('R3: validateConfinementPolicyShape rejects wrong contract', () => {
  assert.throws(
    () => validateConfinementPolicyShape({
      contract: 'confinement-policy.v2',
      controls: {},
      grants: [],
    }),
    /"contract" must be "confinement-policy.v1"/,
  );
});

test('R3: validateConfinementPolicyShape rejects invalid control values', () => {
  assert.throws(
    () => validateConfinementPolicyShape({
      contract: 'confinement-policy.v1',
      controls: {
        hostWrite: 'unrestricted',
        hostRead: 'allow',
        networkEgress: 'deny',
        process: 'isolated',
        home: 'private',
        session: 'isolated',
        workspace: 'own',
      },
      grants: [],
    }),
    /controls\.hostWrite\) must be one of/,
  );

  assert.throws(
    () => validateConfinementPolicyShape({
      contract: 'confinement-policy.v1',
      controls: {
        hostWrite: 'deny',
        hostRead: 'allow',
        networkEgress: 'wide-open',
        process: 'isolated',
        home: 'private',
        session: 'isolated',
        workspace: 'own',
      },
      grants: [],
    }),
    /controls\.networkEgress\) must be one of/,
  );
});

test('R3: validateNetworkFilterShape rejects invalid rules and ports', () => {
  assert.throws(
    () => validateNetworkFilterShape({
      defaultAction: 'deny',
      allow: [
        {
          protocol: 'tcp',
          destination: { kind: 'dns', value: 'example.com' },
          ports: [99999],
        },
      ],
    }),
    /port 99999 must be an integer between 1 and 65535/,
  );

  assert.throws(
    () => validateNetworkFilterShape({
      defaultAction: 'deny',
      allow: [
        {
          protocol: 'tcp',
          destination: { kind: 'dns', value: '*.example.com' },
          ports: [443],
        },
      ],
    }),
    /must not contain wildcard "\*"/,
  );
});

// ─── R4: Legacy Normalization ───────────────────────────────────────────────

test('R4/H2: normalizeLegacyConfinement converts {privateHome, isolatedSession, ownWorktree} to v1 controls', () => {
  const legacy = { privateHome: true, isolatedSession: true, ownWorktree: true };
  const normalized = normalizeLegacyConfinement(legacy);

  assert.equal(normalized.contract, 'confinement-policy.v1');
  assert.equal(normalized.controls.home, 'private');
  assert.equal(normalized.controls.workspace, 'own');
  assert.equal(normalized.controls.session, 'isolated');
  assert.equal(normalized.controls.process, 'host');
  assert.equal(normalized.controls.hostWrite, 'allow');
  assert.equal(normalized.controls.networkEgress, 'allow');
  assert.deepEqual(normalized.grants, [
    { resource: 'private-home', access: 'read-write', scope: 'dispatch' },
  ]);

  const allFalse = normalizeLegacyConfinement({ privateHome: false, isolatedSession: false, ownWorktree: false });
  assert.equal(allFalse.controls.hostWrite, 'allow');
  assert.equal(allFalse.controls.home, 'host');
  assert.equal(allFalse.controls.workspace, 'shared');
  assert.equal(allFalse.controls.session, 'shared');
  assert.deepEqual(allFalse.grants, []);
});

test('R4: normalizeLegacyConfinement handles empty or partial legacy objects', () => {
  assert.equal(normalizeLegacyConfinement({}), null);
  assert.equal(normalizeLegacyConfinement(null), null);

  const partial = normalizeLegacyConfinement({ privateHome: true });
  assert.equal(partial.controls.home, 'private');
  assert.equal(partial.controls.workspace, 'shared');
  assert.equal(partial.controls.session, 'shared');
  assert.equal(partial.controls.hostWrite, 'allow');
  assert.deepEqual(partial.grants, [
    { resource: 'private-home', access: 'read-write', scope: 'dispatch' },
  ]);
});

// ─── R1 & R3: Capability Confinement Validation ─────────────────────────────

test('R1: validateCapabilityConfinementShape validates mode, policy, allowInvocationOverride', () => {
  const valid = validateCapabilityConfinementShape({
    mode: 'required',
    policy: 'workspace-write',
    allowInvocationOverride: true,
  });
  assert.equal(valid.mode, 'required');
  assert.equal(valid.policy, 'workspace-write');
  assert.equal(valid.allowInvocationOverride, true);
});

test('R1: validateCapabilityConfinementShape rejects invalid mode', () => {
  assert.throws(
    () => validateCapabilityConfinementShape({ mode: 'unrestricted' }),
    /mode/,
  );
});

test('R1: validateCapabilityConfinementShape rejects unknown keys', () => {
  assert.throws(
    () => validateCapabilityConfinementShape({
      mode: 'required',
      policy: 'workspace-write',
      disallowedKey: 123,
    }),
    /contains unknown key "disallowedKey"/,
  );
});

// ─── Override Downgrade Prevention ──────────────────────────────────────────

test('validateOverrideConfinementShape prevents widening write scope or relaxing posture', () => {
  const strictBasePolicy = {
    contract: 'confinement-policy.v1',
    controls: {
      hostWrite: 'deny',
      hostRead: 'deny',
      networkEgress: 'deny',
      process: 'isolated',
      home: 'private',
      session: 'isolated',
      workspace: 'own',
    },
    grants: [],
  };

  // Downgrade attempt: enabling network when base denied
  assert.throws(
    () => validateOverrideConfinementShape(
      { controls: { networkEgress: 'allow' } },
      strictBasePolicy,
    ),
    /override downgrade/,
  );

  // Downgrade attempt: allowing hostWrite when base denied
  assert.throws(
    () => validateOverrideConfinementShape(
      { controls: { hostWrite: 'allow' } },
      strictBasePolicy,
    ),
    /override downgrade/,
  );

  // Downgrade attempt: changing home from private to host
  assert.throws(
    () => validateOverrideConfinementShape(
      { controls: { home: 'host' } },
      strictBasePolicy,
    ),
    /override downgrade/,
  );

  // Hardening is allowed: keeping same or stricter
  const valid = validateOverrideConfinementShape(
    { controls: { hostWrite: 'deny', networkEgress: 'deny' } },
    strictBasePolicy,
  );
  assert.ok(valid);
});

test('H3: validateOverrideConfinementShape rejects illegal access values, requires scope:dispatch, requires networkFilter when filtered', () => {
  const basePolicy = {
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
      { resource: 'x', access: 'read', scope: 'dispatch' },
    ],
  };

  // Rejects unknown access token even with no base policy
  assert.throws(
    () => validateOverrideConfinementShape({
      grants: [{ resource: 'x', access: 'admin', scope: 'dispatch' }],
    }),
    /access.*must be one of/,
  );

  // Rejects invalid scope
  assert.throws(
    () => validateOverrideConfinementShape({
      grants: [{ resource: 'x', access: 'read', scope: 'global' }],
    }),
    /scope.*must be "dispatch"/,
  );

  // Rejects unknown grant keys
  assert.throws(
    () => validateOverrideConfinementShape({
      grants: [{ resource: 'x', access: 'read', scope: 'dispatch', extra: 1 }],
    }),
    /contains unknown key "extra"/,
  );

  // Rejects illegal access against base grant
  assert.throws(
    () => validateOverrideConfinementShape(
      { grants: [{ resource: 'x', access: 'admin', scope: 'dispatch' }] },
      basePolicy,
    ),
    /access.*must be one of/,
  );

  // Rejects setting networkEgress: filtered without networkFilter
  assert.throws(
    () => validateOverrideConfinementShape(
      { controls: { networkEgress: 'filtered' } },
      basePolicy,
    ),
    /networkFilter.*required when networkEgress is "filtered"/,
  );
});

// ─── R5: Machine Backend Registry ───────────────────────────────────────────

test('R5: rejectProjectBackendOverride rejects confinementBackends in project config', () => {
  assert.throws(
    () => rejectProjectBackendOverride(
      { confinementBackends: { bwrap: { type: 'bwrap' } } },
      'project .fgos/config.json',
    ),
    /confinement-backend-registry-forbidden/,
  );
});

test('R5: validateBackendRegistryShape validates confinement-backend-registry.v1 schema', () => {
  const validRegistry = {
    contract: 'confinement-backend-registry.v1',
    confinementBackends: {
      bwrap: {
        type: 'bwrap',
        enabled: true,
        executable: '/usr/bin/bwrap',
      },
      docker: {
        type: 'container',
        enabled: false,
        runtime: 'docker',
        image: 'fgos-worker:latest',
      },
      cluster: {
        type: 'remote',
        enabled: false,
        endpoint: 'https://cluster.internal:8443',
        credentialRef: 'env:CLUSTER_TOKEN',
      },
    },
  };

  const validated = validateBackendRegistryShape(validRegistry);
  assert.equal(validated.contract, 'confinement-backend-registry.v1');
  assert.equal(validated.confinementBackends.bwrap.type, 'bwrap');
});

test('R5: validateBackendRegistryShape rejects invalid driver type', () => {
  assert.throws(
    () => validateBackendRegistryShape({
      contract: 'confinement-backend-registry.v1',
      confinementBackends: {
        wasm: { type: 'wasm-sandbox' },
      },
    }),
    /type.*must be one of/,
  );
});

test('R5: ensureMachineBackendRegistryDefaults creates default registry file if missing', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-backend-reg-test-'));
  const customPath = path.join(dir, 'backends.json');
  process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = customPath;

  try {
    const res1 = ensureMachineBackendRegistryDefaults();
    assert.equal(res1.created, true);
    assert.equal(res1.path, customPath);
    assert.ok(fs.existsSync(customPath));

    const content = JSON.parse(fs.readFileSync(customPath, 'utf8'));
    assert.equal(content.contract, 'confinement-backend-registry.v1');
    assert.ok(content.confinementBackends.bwrap);

    // Calling a second time is idempotent and does not overwrite
    const res2 = ensureMachineBackendRegistryDefaults();
    assert.equal(res2.created, false);
  } finally {
    delete process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('H1: createBackendRegistrySnapshot deeply freezes snapshot preventing mutation and injection', () => {
  const doc = {
    contract: 'confinement-backend-registry.v1',
    confinementBackends: {
      bwrap: {
        type: 'bwrap',
        enabled: true,
        executable: '/usr/bin/bwrap',
      },
    },
  };
  const snap = createBackendRegistrySnapshot(doc);
  assert.throws(() => {
    snap.confinementBackends.bwrap.executable = '/tmp/evil-bwrap';
  }, /Cannot assign to read only property|not extensible/);
  assert.throws(() => {
    snap.confinementBackends.injected = { type: 'remote', endpoint: 'http://evil', credentialRef: 'x' };
  }, /Cannot add property|not extensible/);
});

test('M5: ensureMachineBackendRegistryDefaults strips unknown keys and stale contracts before write', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-m5-reg-test-'));
  const customPath = path.join(dir, 'backends.json');
  try {
    fs.writeFileSync(customPath, JSON.stringify({
      contract: 'confinement-backend-registry.v0',
      junkKey: 'junkValue',
      confinementBackends: {
        custom: {
          type: 'bwrap',
          enabled: true,
          executable: '/usr/local/bin/bwrap',
        },
      },
    }, null, 2));

    const res = ensureMachineBackendRegistryDefaults(customPath);
    assert.equal(res.changed, true);
    const written = JSON.parse(fs.readFileSync(customPath, 'utf8'));
    assert.equal(written.contract, 'confinement-backend-registry.v1');
    assert.equal(written.junkKey, undefined);
    assert.ok(written.confinementBackends.custom);
    assert.equal(written.confinementBackends.bwrap, undefined);
    assert.doesNotThrow(() => validateBackendRegistryShape(written));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ─── Config Integration: Strict Mode & Capabilities ─────────────────────────

test('Strict mode: throws confinement-policy-missing when strict: true and capability has no policy', () => {
  const { dir, file } = mkTempConfig({
    executor: { command: 'node', args: ['{prompt}'] },
    confinement: { strict: true },
    capabilities: {
      'code:implement': {
        description: 'implementing code',
        // missing confinement policy
      },
    },
  });

  try {
    assert.throws(
      () => loadRunnerConfig(file),
      /confinement-policy-missing/,
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('Strict mode: passes when capability declares valid built-in policy or mode: unconfined', () => {
  const { dir, file } = mkTempConfig({
    executor: { command: 'node', args: ['{prompt}'] },
    confinement: { strict: true },
    capabilities: {
      'code:implement': {
        description: 'implementing code',
        confinement: {
          mode: 'required',
          policy: 'workspace-write',
        },
      },
      advise: {
        description: 'advising',
        confinement: {
          mode: 'unconfined',
        },
      },
    },
  });

  try {
    const cfg = loadRunnerConfig(file);
    assert.equal(cfg.confinement.strict, true);
    assert.equal(cfg.capabilities['code:implement'].confinement.policy, 'workspace-write');
    assert.equal(cfg.capabilities.advise.confinement.mode, 'unconfined');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('M1/M2: Capability rejects boolean unconfined syntax in favor of mode: unconfined', () => {
  const { dir, file } = mkTempConfig({
    executor: { command: 'node', args: ['{prompt}'] },
    capabilities: {
      advise: {
        unconfined: true,
      },
    },
  });

  try {
    assert.throws(
      () => loadRunnerConfig(file),
      /boolean "unconfined" is deprecated\/disallowed/,
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('L6: Non-strict mode rejects mode:required referencing a nonexistent policy', () => {
  const { dir, file } = mkTempConfig({
    executor: { command: 'node', args: ['{prompt}'] },
    confinement: { strict: false },
    capabilities: {
      'code:implement': {
        confinement: {
          mode: 'required',
          policy: 'non-existent-policy',
        },
      },
    },
  });

  try {
    assert.throws(
      () => loadRunnerConfig(file),
      /mode "required" references unknown policy "non-existent-policy"/,
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('Strict mode: rejects capability referencing unknown policy', () => {
  const { dir, file } = mkTempConfig({
    executor: { command: 'node', args: ['{prompt}'] },
    confinement: { strict: true },
    capabilities: {
      'code:implement': {
        description: 'implementing code',
        confinement: {
          mode: 'required',
          policy: 'non-existent-policy',
        },
      },
    },
  });

  try {
    assert.throws(
      () => loadRunnerConfig(file),
      /references unknown policy "non-existent-policy" in strict mode \(confinement-policy-missing\)/,
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('Runner config rejects project-local confinementBackends definition', () => {
  const { dir, file } = mkTempConfig({
    executor: { command: 'node', args: ['{prompt}'] },
    confinementBackends: {
      hackedBackend: { type: 'bwrap' },
    },
  });

  try {
    assert.throws(
      () => loadRunnerConfig(file),
      /confinement-backend-registry-forbidden/,
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ─── Tests for L4, N3, N2, N1 ────────────────────────────────────────────────

test('L4: validateNetworkFilterShape canonicalizes IPv4 CIDR values', () => {
  const filter = {
    defaultAction: 'deny',
    allow: [
      {
        protocol: 'tcp',
        destination: { kind: 'cidr', value: '10.0.0.1/8' },
        ports: [443],
      },
    ],
  };
  validateNetworkFilterShape(filter);
  assert.equal(filter.allow[0].destination.value, '10.0.0.0/8');
});

test('L4: validateNetworkFilterShape rejects syntactically invalid CIDRs', () => {
  const invalidFilter = {
    defaultAction: 'deny',
    allow: [
      {
        protocol: 'tcp',
        destination: { kind: 'cidr', value: 'not-a-cidr' },
        ports: [443],
      },
    ],
  };
  assert.throws(
    () => validateNetworkFilterShape(invalidFilter),
    /invalid CIDR "not-a-cidr"/,
  );
});

test('L4: validateNetworkFilterShape rejects duplicate allow-rule entries', () => {
  const dupFilter = {
    defaultAction: 'deny',
    allow: [
      {
        protocol: 'tcp',
        destination: { kind: 'cidr', value: '10.0.0.0/8' },
        ports: [80, 443],
      },
      {
        protocol: 'tcp',
        destination: { kind: 'cidr', value: '10.0.0.0/8' },
        ports: [443, 80],
      },
    ],
  };
  assert.throws(
    () => validateNetworkFilterShape(dupFilter),
    /duplicate allow rule entry/,
  );
});

test('N3: validateOverrideConfinementShape rejects override adding broader CIDR or port set than base', () => {
  const basePolicy = {
    contract: 'confinement-policy.v1',
    controls: {
      hostWrite: 'deny',
      hostRead: 'allow',
      networkEgress: 'filtered',
      process: 'host',
      home: 'host',
      session: 'shared',
      workspace: 'shared',
    },
    grants: [],
    networkFilter: {
      defaultAction: 'deny',
      allow: [
        {
          protocol: 'tcp',
          destination: { kind: 'cidr', value: '10.0.0.1/32' },
          ports: [443],
        },
      ],
    },
  };

  // Override supplying 0.0.0.0/0
  const broadCidrOverride = {
    controls: { networkEgress: 'filtered' },
    networkFilter: {
      defaultAction: 'deny',
      allow: [
        {
          protocol: 'tcp',
          destination: { kind: 'cidr', value: '0.0.0.0/0' },
          ports: [443],
        },
      ],
    },
  };

  assert.throws(
    () => validateOverrideConfinementShape(broadCidrOverride, basePolicy),
    /override cannot add rule with destination "0.0.0.0\/0"/,
  );

  // Override supplying broader ports (e.g. 80 when base only allows 443)
  const broadPortOverride = {
    controls: { networkEgress: 'filtered' },
    networkFilter: {
      defaultAction: 'deny',
      allow: [
        {
          protocol: 'tcp',
          destination: { kind: 'cidr', value: '10.0.0.1/32' },
          ports: [443, 80],
        },
      ],
    },
  };

  assert.throws(
    () => validateOverrideConfinementShape(broadPortOverride, basePolicy),
    /override cannot add port 80 not permitted by base policy/,
  );
});

test('N2: ensureMachineBackendRegistryDefaults returns skipped contract on unparseable JSON without throwing', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-n2-reg-test-'));
  const customPath = path.join(dir, 'backends.json');
  try {
    fs.writeFileSync(customPath, 'not json', 'utf8');
    const res = ensureMachineBackendRegistryDefaults(customPath);
    assert.equal(res.changed, false);
    assert.equal(res.created, false);
    assert.match(res.message, /skipped -- cannot parse machine backend registry/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

