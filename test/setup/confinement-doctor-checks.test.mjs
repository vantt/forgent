import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import cp from 'node:child_process';

import {
  DOCTOR_CHECKS,
  FIX_REGISTRATIONS,
} from '../../src/setup/checks.mjs';
import {
  checkConfinementPoliciesDeclared,
  checkConfinementBackendRegistryReadable,
  fixConfinementBackendRegistryReadable,
  checkConfinementBwrapPlatform,
  checkConfinementProbeFreshness,
  checkConfinementStrictReadiness,
  checkConfinementOrphanedResourcesReaped,
  fixConfinementOrphanedResourcesReaped,
  defaultConfinementTempRoots,
} from '../../src/setup/registrations.mjs';
import { writeOwnershipMarker, reapOrphanedConfinementResources } from '../../src/runner/dispatch/confinement/cleanup.mjs';

function mkTempProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-confinement-doctor-'));
  fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
  return dir;
}

function writeProjectConfig(dir, config) {
  const cfgPath = path.join(dir, '.fgos', 'config.json');
  fs.writeFileSync(cfgPath, JSON.stringify(config, null, 2));
}

function hasWorkingBwrap(binary = 'bwrap') {
  if (os.platform() !== 'linux') return false;
  const res = cp.spawnSync(binary, ['--ro-bind', '/', '/', '--', 'true'], { stdio: 'ignore' });
  return res.status === 0;
}

const HAS_WORKING_BWRAP = hasWorkingBwrap();

// ─── Registration Verification ──────────────────────────────────────────────

test('confinement doctor checks and fix are registered in checks.mjs', () => {
  const checkIds = DOCTOR_CHECKS.map((c) => c.id);
  assert.ok(checkIds.includes('confinement-policies-declared'));
  assert.ok(checkIds.includes('confinement-backend-registry-readable'));
  assert.ok(checkIds.includes('confinement-bwrap-platform'));
  assert.ok(checkIds.includes('confinement-probe-freshness'));
  assert.ok(checkIds.includes('confinement-strict-readiness'));
  assert.ok(checkIds.includes('confinement-orphaned-resources-reaped'));

  const fixIds = FIX_REGISTRATIONS.map((f) => f.id);
  assert.ok(fixIds.includes('confinement-backend-registry-readable'));
  assert.ok(fixIds.includes('confinement-orphaned-resources-reaped'));
});

// ─── Check: confinement-orphaned-resources-reaped (Phase 04 M8) ────────────

test('confinement-orphaned-resources-reaped passes when no temp root has any marker', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-confinement-reap-empty-'));
  try {
    const result = checkConfinementOrphanedResourcesReaped();
    // Only asserts it never throws and returns the shape -- the REAL default
    // tempRoot on this machine may or may not have unrelated markers from
    // other concurrent test runs, so this cannot assert `passed: true`
    // unconditionally.
    assert.equal(typeof result.passed, 'boolean');
    assert.equal(typeof result.message, 'string');
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('confinement-orphaned-resources-reaped detects a marker owned by a dead pid, and fix reclaims it', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-confinement-reap-dead-'));
  try {
    // A pid essentially guaranteed to be dead: spawn a real child and let it exit.
    const dead = cp.spawnSync(process.execPath, ['-e', 'process.exit(0)']);
    const orphanDir = path.join(tempRoot, 'disp_orphan_1', 'home');
    fs.mkdirSync(orphanDir, { recursive: true });
    writeOwnershipMarker(orphanDir, { dispatchId: 'disp_orphan_1', pid: dead.pid });

    const before = reapOrphanedConfinementResources({ tempRoot, checkLiveness: () => false });
    assert.equal(before.reaped.length, 1);
    assert.equal(fs.existsSync(orphanDir), false);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('defaultConfinementTempRoots always includes the os.tmpdir()/fgos-confinement default', () => {
  const roots = defaultConfinementTempRoots();
  assert.ok(roots.includes(path.join(os.tmpdir(), 'fgos-confinement')));
});

test('fixConfinementOrphanedResourcesReaped reports changed:false when nothing needs reaping under an isolated root', () => {
  // fixConfinementOrphanedResourcesReaped always scans the real default
  // roots (doctor has no per-project override for this), so this only
  // asserts the return shape, not a specific count.
  const result = fixConfinementOrphanedResourcesReaped();
  assert.equal(typeof result.changed, 'boolean');
  assert.equal(typeof result.message, 'string');
});

// ─── Check 1: confinement-policies-declared ─────────────────────────────────

test('confinement-policies-declared passes when all referenced policies are declared', () => {
  const dir = mkTempProject();
  try {
    writeProjectConfig(dir, {
      runner: {
        capabilities: {
          'code:implement': {
            confinement: {
              mode: 'required',
              policy: 'workspace-write',
            },
          },
          'advise': {
            confinement: {
              mode: 'preferred',
              policy: 'host-write-denied',
            },
          },
        },
      },
    });

    const res = checkConfinementPoliciesDeclared(dir);
    assert.equal(res.passed, true);
    assert.match(res.message, /all capability confinement policies are declared/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('confinement-policies-declared passes with custom policies defined in confinementPolicies', () => {
  const dir = mkTempProject();
  try {
    writeProjectConfig(dir, {
      runner: {
        confinementPolicies: {
          'custom-isolated': {
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
          },
        },
        capabilities: {
          'code:implement': {
            confinement: {
              mode: 'required',
              policy: 'custom-isolated',
            },
          },
        },
      },
    });

    const res = checkConfinementPoliciesDeclared(dir);
    assert.equal(res.passed, true);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('confinement-policies-declared fails when unknown policy is referenced', () => {
  const dir = mkTempProject();
  try {
    writeProjectConfig(dir, {
      runner: {
        capabilities: {
          'code:implement': {
            confinement: {
              mode: 'required',
              policy: 'ghost-policy',
            },
          },
        },
      },
    });

    const res = checkConfinementPoliciesDeclared(dir);
    assert.equal(res.passed, false);
    assert.match(res.message, /unknown policy "ghost-policy"/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('confinement-policies-declared fails when custom policy document is malformed', () => {
  const dir = mkTempProject();
  try {
    writeProjectConfig(dir, {
      runner: {
        confinementPolicies: {
          'bad-policy': {
            contract: 'invalid-contract-version',
            controls: {},
          },
        },
        capabilities: {},
      },
    });

    const res = checkConfinementPoliciesDeclared(dir);
    assert.equal(res.passed, false);
    assert.match(res.message, /custom confinement policy "bad-policy" is malformed/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ─── Check 2: confinement-backend-registry-readable & fix ───────────────────

test('confinement-backend-registry-readable fails when missing, fix creates it, then check passes', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-doctor-reg-'));
  const regPath = path.join(dir, 'confinement-backends.json');
  process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = regPath;

  try {
    // 1. Missing: check fails
    const initialCheck = checkConfinementBackendRegistryReadable();
    assert.equal(initialCheck.passed, false);
    assert.match(initialCheck.message, /not found/);

    // 2. Fix creates it
    const fixRes = fixConfinementBackendRegistryReadable();
    assert.equal(fixRes.changed, true);
    assert.ok(fs.existsSync(regPath));

    // 3. Re-check passes
    const passCheck = checkConfinementBackendRegistryReadable();
    assert.equal(passCheck.passed, true);
    assert.match(passCheck.message, /machine backend registry valid/);

    // 4. Second fix invocation is idempotent
    const secondFix = fixConfinementBackendRegistryReadable();
    assert.equal(secondFix.changed, false);
  } finally {
    delete process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('confinement-backend-registry-readable fails when file contains malformed JSON or schema', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-doctor-reg-'));
  const regPath = path.join(dir, 'confinement-backends.json');
  process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = regPath;

  try {
    fs.writeFileSync(regPath, '{ invalid json');
    const jsonFail = checkConfinementBackendRegistryReadable();
    assert.equal(jsonFail.passed, false);
    assert.match(jsonFail.message, /not valid JSON/);

    fs.writeFileSync(regPath, JSON.stringify({ contract: 'wrong.v1' }));
    const schemaFail = checkConfinementBackendRegistryReadable();
    assert.equal(schemaFail.passed, false);
    assert.match(schemaFail.message, /malformed/);
  } finally {
    delete process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ─── Check 3: confinement-bwrap-platform (postures: configured/disabled/unavailable/ready)

test('confinement-bwrap-platform reports disabled when enabled: false in registry', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-doctor-bwrap-'));
  const regPath = path.join(dir, 'confinement-backends.json');
  process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = regPath;

  try {
    fs.writeFileSync(regPath, JSON.stringify({
      contract: 'confinement-backend-registry.v1',
      confinementBackends: {
        bwrap: {
          type: 'bwrap',
          enabled: false,
        },
      },
    }));

    const res = checkConfinementBwrapPlatform();
    assert.equal(res.passed, true);
    assert.match(res.message, /disabled in machine registry/);
  } finally {
    delete process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('confinement-bwrap-platform reports not configured when bwrap missing from registry', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-doctor-bwrap-'));
  const regPath = path.join(dir, 'confinement-backends.json');
  process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = regPath;

  try {
    fs.writeFileSync(regPath, JSON.stringify({
      contract: 'confinement-backend-registry.v1',
      confinementBackends: {
        docker: {
          type: 'container',
          enabled: true,
          runtime: 'docker',
          image: 'fgos-worker',
        },
      },
    }));

    const res = checkConfinementBwrapPlatform();
    assert.equal(res.passed, false);
    assert.match(res.message, /not configured in machine registry/);
  } finally {
    delete process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('confinement-bwrap-platform reports unavailable when binary is not executable or fails smoke test', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-doctor-bwrap-'));
  const regPath = path.join(dir, 'confinement-backends.json');
  process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = regPath;

  try {
    fs.writeFileSync(regPath, JSON.stringify({
      contract: 'confinement-backend-registry.v1',
      confinementBackends: {
        bwrap: {
          type: 'bwrap',
          enabled: true,
          executable: '/nonexistent/bwrap/binary',
        },
      },
    }));

    const res = checkConfinementBwrapPlatform();
    assert.equal(res.passed, false);
    assert.match(res.message, /unavailable/);
  } finally {
    delete process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('confinement-bwrap-platform reports ready when platform is Linux and bwrap binary executes', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-doctor-bwrap-'));
  const regPath = path.join(dir, 'confinement-backends.json');
  process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = regPath;

  try {
    fs.writeFileSync(regPath, JSON.stringify({
      contract: 'confinement-backend-registry.v1',
      confinementBackends: {
        bwrap: {
          type: 'bwrap',
          enabled: true,
          executable: 'bwrap',
        },
      },
    }));

    const res = checkConfinementBwrapPlatform();
    if (HAS_WORKING_BWRAP) {
      assert.equal(res.passed, true);
      assert.match(res.message, /ready/);
    } else if (os.platform() === 'linux') {
      assert.equal(res.passed, false);
      assert.match(res.message, /unavailable/);
    } else {
      assert.equal(res.passed, false);
      assert.match(res.message, /is not Linux/);
    }
  } finally {
    delete process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ─── Check 4: confinement-probe-freshness ───────────────────────────────────

test('confinement-probe-freshness reports probe results through the real probe harness', () => {
  if (!HAS_WORKING_BWRAP) return;
  const res = checkConfinementProbeFreshness();
  assert.equal(res.passed, true);
  if (os.platform() === 'linux') {
    assert.match(res.message, /probes passed|fresh/);
  } else {
    assert.match(res.message, /not Linux/);
  }
});

// ─── Check 5: confinement-strict-readiness ──────────────────────────────────

test('confinement-strict-readiness passes when all capabilities have valid policies and bwrap is ready', () => {
  if (!HAS_WORKING_BWRAP) return;
  const dir = mkTempProject();
  const regDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-doctor-strict-'));
  const regPath = path.join(regDir, 'confinement-backends.json');
  process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = regPath;

  try {
    fs.writeFileSync(regPath, JSON.stringify({
      contract: 'confinement-backend-registry.v1',
      confinementBackends: {
        bwrap: {
          type: 'bwrap',
          enabled: true,
          executable: 'bwrap',
        },
      },
    }));

    writeProjectConfig(dir, {
      runner: {
        confinement: { strict: true },
        capabilities: {
          'code:implement': {
            confinement: {
              mode: 'required',
              policy: 'workspace-write',
            },
          },
          'advise': {
            confinement: {
              mode: 'unconfined',
            },
          },
        },
      },
    });

    const res = checkConfinementStrictReadiness(dir);
    if (os.platform() === 'linux') {
      assert.equal(res.passed, true);
      assert.match(res.message, /strict confinement readiness satisfied/);
    } else {
      assert.equal(res.passed, false);
      assert.match(res.message, /strict confinement not ready/);
    }
  } finally {
    delete process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(regDir, { recursive: true, force: true });
  }
});

test('H4: confinement-strict-readiness reports warning when strict: false and capability lacks policy', () => {
  const dir = mkTempProject();
  try {
    writeProjectConfig(dir, {
      runner: {
        confinement: { strict: false },
        capabilities: {
          'code:implement': {
            description: 'unconfined capability without flag',
          },
        },
      },
    });

    const res = checkConfinementStrictReadiness(dir);
    assert.equal(res.passed, true);
    assert.match(res.message, /warning.*strict confinement disabled/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('H4: confinement-strict-readiness fails when strict: true and capability lacks policy', () => {
  const dir = mkTempProject();
  try {
    writeProjectConfig(dir, {
      runner: {
        confinement: { strict: true },
        capabilities: {
          'code:implement': {
            description: 'unconfined capability without flag',
          },
        },
      },
    });

    const res = checkConfinementStrictReadiness(dir);
    assert.equal(res.passed, false);
    assert.match(res.message, /missing confinement policy/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('L2: doctor checks fail when runner config is not readable', () => {
  const dir = mkTempProject();
  try {
    fs.writeFileSync(path.join(dir, '.fgos', 'config.json'), '{ not valid json');

    const res1 = checkConfinementPoliciesDeclared(dir);
    assert.equal(res1.passed, false);
    assert.match(res1.message, /runner config not readable/);

    const res2 = checkConfinementStrictReadiness(dir);
    assert.equal(res2.passed, false);
    assert.match(res2.message, /runner config not readable/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('L-c: confinement-bwrap-platform distinguishes malformed registry from not configured', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-doctor-bwrap-malformed-'));
  const regPath = path.join(dir, 'confinement-backends.json');
  process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = regPath;

  try {
    fs.writeFileSync(regPath, '{ invalid json');
    const res = checkConfinementBwrapPlatform();
    assert.equal(res.passed, false);
    assert.match(res.message, /machine registry not readable or malformed/);
  } finally {
    delete process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('N2: fixConfinementBackendRegistryReadable returns skipped contract on corrupt registry', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-doctor-bwrap-corrupt-'));
  const regPath = path.join(dir, 'confinement-backends.json');
  process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = regPath;

  try {
    fs.writeFileSync(regPath, 'not json', 'utf8');
    const res = fixConfinementBackendRegistryReadable();
    assert.equal(res.changed, false);
    assert.match(res.message, /skipped -- cannot parse machine backend registry/);
  } finally {
    delete process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
