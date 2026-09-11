// test/runner/dispatch-confinement-p04.test.mjs
// Comprehensive test suite for Phase 04: Required Enforcement And Executor Migration (R1-R8)
// Spec: docs/specs/confinement-authority.md, plans/.../phase-04-required-enforcement-and-executor-migration.md

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { executeThroughConfinement, buildConfinementAttestation } from "../../src/runner/dispatch/confinement/authority.mjs";
import { buildConfinementRequest, validateConfinementRequest } from "../../src/runner/dispatch/confinement/request.mjs";
import {
  validateOverrideConfinementShape,
  resolveConfinementPolicy,
  ConfinementPolicyError,
} from "../../src/runner/dispatch/confinement/policies.mjs";
import {
  ensureMachineBackendRegistryDefaults,
  resolveMachineBackendRegistryPath,
  registerBackendDriver,
  getBackendDriver,
} from "../../src/runner/dispatch/confinement/backend-registry.mjs";
import { establishConfinement } from "../../src/runner/dispatch/herdr-round.mjs";
import { DEFAULT_CAPABILITY_SLOTS } from "../../src/setup/registrations.mjs";
import { DispatchError } from "../../src/runner/dispatch/transport.mjs";
import { loadRunnerConfig } from "../../src/runner/dispatch/config.mjs";
import { loadAttestationRecord } from "../../src/runner/dispatch/confinement/attestation-store.mjs";
import { resolveCapabilityIdentityDetails } from "../../src/runner/dispatch/resolve.mjs";

function mkTemp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// ─── R1: Required Policy Refusal Before Spawn (0 Adapter Calls) ────────────────

test("R1 Case 1: missing backendId refuses with confinement-backend-missing and 0 adapter calls", async () => {
  const tmpDir = mkTemp("p04-r1-c1-");
  let adapterCalls = 0;
  const fakeAdapter = async () => {
    adapterCalls++;
    return { status: 0, stdout: "ok", stderr: "" };
  };

  const req = buildConfinementRequest({
    capability: "advise",
    executorId: "test-exec",
    requirement: {
      mode: "required",
      policyId: "host-write-denied",
      policy: resolveConfinementPolicy("host-write-denied"),
    },
    backendId: null, // missing backend
    invocation: { command: "echo", args: ["hi"], adapter: "cli-spawn" },
    context: { cwd: tmpDir, runDir: tmpDir },
  });

  await assert.rejects(
    async () => executeThroughConfinement(req, fakeAdapter),
    (err) => {
      assert.ok(err instanceof DispatchError);
      assert.equal(err.code, "confinement-backend-missing");
      assert.equal(err.data?.status, "refused");
      assert.equal(err.data?.attestation?.phase, "refused");
      assert.equal(err.data?.attestation?.outcome, "refused");
      return true;
    },
  );

  assert.equal(adapterCalls, 0, "adapter must not be called when backend is missing");
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("R1 Case 2: unknown/missing backend in registry refuses with confinement-backend-missing and 0 adapter calls", async () => {
  const tmpDir = mkTemp("p04-r1-c2-");
  const regPath = path.join(tmpDir, "confinement-backends.json");
  fs.writeFileSync(
    regPath,
    JSON.stringify({
      contract: "confinement-backend-registry.v1",
      confinementBackends: {},
    }),
  );
  process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = regPath;

  let adapterCalls = 0;
  const fakeAdapter = async () => {
    adapterCalls++;
    return { status: 0, stdout: "ok", stderr: "" };
  };

  const req = buildConfinementRequest({
    capability: "advise",
    executorId: "test-exec",
    requirement: {
      mode: "required",
      policyId: "host-write-denied",
      policy: resolveConfinementPolicy("host-write-denied"),
    },
    backendId: "non-existent-backend",
    invocation: { command: "echo", args: ["hi"], adapter: "cli-spawn" },
    context: { cwd: tmpDir, runDir: tmpDir },
  });

  await assert.rejects(
    async () => executeThroughConfinement(req, fakeAdapter),
    (err) => {
      assert.ok(err instanceof DispatchError);
      assert.equal(err.code, "confinement-backend-missing");
      assert.equal(err.data?.status, "refused");
      return true;
    },
  );

  assert.equal(adapterCalls, 0, "adapter must not be called when backend is not in registry");
  delete process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("R1 Case 3: disabled backend refuses with confinement-backend-disabled and 0 adapter calls", async () => {
  const tmpDir = mkTemp("p04-r1-c3-");
  const regPath = path.join(tmpDir, "confinement-backends.json");
  fs.writeFileSync(
    regPath,
    JSON.stringify({
      contract: "confinement-backend-registry.v1",
      confinementBackends: {
        bwrap: {
          type: "bwrap",
          enabled: false,
          executable: "/usr/bin/bwrap",
        },
      },
    }),
  );
  process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = regPath;

  let adapterCalls = 0;
  const fakeAdapter = async () => {
    adapterCalls++;
    return { status: 0, stdout: "ok", stderr: "" };
  };

  const req = buildConfinementRequest({
    capability: "advise",
    executorId: "test-exec",
    requirement: {
      mode: "required",
      policyId: "host-write-denied",
      policy: resolveConfinementPolicy("host-write-denied"),
    },
    backendId: "bwrap",
    invocation: { command: "echo", args: ["hi"], adapter: "cli-spawn" },
    context: { cwd: tmpDir, runDir: tmpDir },
  });

  await assert.rejects(
    async () => executeThroughConfinement(req, fakeAdapter),
    (err) => {
      assert.ok(err instanceof DispatchError);
      assert.equal(err.code, "confinement-backend-disabled");
      assert.equal(err.data?.status, "refused");
      return true;
    },
  );

  assert.equal(adapterCalls, 0, "adapter must not be called when backend is disabled");
  delete process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("R1 Case 4: unsupported control/backend refuses with confinement-unsupported and 0 adapter calls", async () => {
  const tmpDir = mkTemp("p04-r1-c4-");
  const regPath = path.join(tmpDir, "confinement-backends.json");
  fs.writeFileSync(
    regPath,
    JSON.stringify({
      contract: "confinement-backend-registry.v1",
      confinementBackends: {
        bwrap: {
          type: "bwrap",
          enabled: true,
          executable: "/usr/bin/bwrap",
        },
      },
    }),
  );
  process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = regPath;

  let adapterCalls = 0;
  const fakeAdapter = async () => {
    adapterCalls++;
    return { status: 0, stdout: "ok", stderr: "" };
  };

  // Policy with unsupported control: hostRead: deny (bwrap only supports allow)
  const unsupportedPolicy = {
    contract: "confinement-policy.v1",
    controls: {
      hostWrite: "deny",
      hostRead: "deny", // unsupported!
      networkEgress: "allow",
      process: "host",
      home: "host",
      session: "shared",
      workspace: "shared",
    },
    grants: [],
  };

  const req = buildConfinementRequest({
    capability: "custom-cap",
    executorId: "test-exec",
    requirement: {
      mode: "required",
      policyId: "custom-unsupported",
      policy: unsupportedPolicy,
    },
    backendId: "bwrap",
    invocation: { command: "echo", args: ["hi"], adapter: "cli-spawn" },
    context: { cwd: tmpDir, runDir: tmpDir },
  });

  await assert.rejects(
    async () => executeThroughConfinement(req, fakeAdapter),
    (err) => {
      assert.ok(err instanceof DispatchError);
      assert.equal(err.code, "confinement-unsupported");
      assert.equal(err.data?.status, "refused");
      return true;
    },
  );

  assert.equal(adapterCalls, 0, "adapter must not be called for unsupported control");
  delete process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("R1 Case 5: stale probe failure refuses with confinement-probe-failed and 0 adapter calls", async () => {
  const tmpDir = mkTemp("p04-r1-c5-");
  const regPath = path.join(tmpDir, "confinement-backends.json");
  fs.writeFileSync(
    regPath,
    JSON.stringify({
      contract: "confinement-backend-registry.v1",
      confinementBackends: {
        bwrap: {
          type: "bwrap",
          enabled: true,
          executable: "/nonexistent/bwrap/binary",
        },
      },
    }),
  );
  process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = regPath;

  let adapterCalls = 0;
  const fakeAdapter = async () => {
    adapterCalls++;
    return { status: 0, stdout: "ok", stderr: "" };
  };

  const fgosDir5 = path.join(tmpDir, ".fgos");
  const runDir5 = path.join(fgosDir5, "runs", "1");
  fs.mkdirSync(runDir5, { recursive: true });

  const req = buildConfinementRequest({
    capability: "advise",
    executorId: "test-exec",
    requirement: {
      mode: "required",
      policyId: "host-write-denied",
      policy: resolveConfinementPolicy("host-write-denied"),
    },
    backendId: "bwrap",
    invocation: { command: "echo", args: ["hi"], adapter: "cli-spawn" },
    context: { cwd: tmpDir, repoRoot: tmpDir, runDir: runDir5, fgosDir: fgosDir5 },
  });

  await assert.rejects(
    async () => executeThroughConfinement(req, fakeAdapter),
    (err) => {
      assert.ok(err instanceof DispatchError);
      assert.equal(err.code, "confinement-probe-failed");
      assert.equal(err.data?.status, "refused");
      return true;
    },
  );

  assert.equal(adapterCalls, 0, "adapter must not be called when probe fails");
  delete process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("R1 Case 6: invalid grant refuses with confinement-grant-invalid and 0 adapter calls", async () => {
  const tmpDir = mkTemp("p04-r1-c6-");
  const regPath = path.join(tmpDir, "confinement-backends.json");
  fs.writeFileSync(
    regPath,
    JSON.stringify({
      contract: "confinement-backend-registry.v1",
      confinementBackends: {
        bwrap: {
          type: "bwrap",
          enabled: true,
          executable: "/usr/bin/bwrap",
        },
      },
    }),
  );
  process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = regPath;

  let adapterCalls = 0;
  const fakeAdapter = async () => {
    adapterCalls++;
    return { status: 0, stdout: "ok", stderr: "" };
  };

  const fgosDir6 = path.join(tmpDir, ".fgos");
  const runDir6 = path.join(fgosDir6, "runs", "1");
  fs.mkdirSync(runDir6, { recursive: true });

  // Under policy host-write-denied, resource workspace is NOT allowed in grants
  const invalidGrantPolicy = {
    contract: "confinement-policy.v1",
    controls: {
      hostWrite: "deny",
      hostRead: "allow",
      networkEgress: "allow",
      process: "host",
      home: "host",
      session: "shared",
      workspace: "shared",
    },
    grants: [
      { resource: "workspace", access: "read-write", scope: "dispatch" },
    ],
  };

  const req = buildConfinementRequest({
    capability: "advise",
    executorId: "test-exec",
    requirement: {
      mode: "required",
      policyId: "host-write-denied",
      policy: invalidGrantPolicy,
    },
    backendId: "bwrap",
    invocation: { command: "echo", args: ["hi"], adapter: "cli-spawn" },
    context: { cwd: tmpDir, repoRoot: tmpDir, runDir: runDir6, fgosDir: fgosDir6 },
  });

  await assert.rejects(
    async () => executeThroughConfinement(req, fakeAdapter),
    (err) => {
      assert.ok(err instanceof DispatchError);
      assert.equal(err.code, "confinement-grant-invalid");
      assert.equal(err.data?.status, "refused");
      return true;
    },
  );

  assert.equal(adapterCalls, 0, "adapter must not be called when grant is invalid");
  delete process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("R1 Case 7: unsatisfied need refuses with confinement-need-unsatisfied and 0 adapter calls", async () => {
  const tmpDir = mkTemp("p04-r1-c7-");
  const regPath = path.join(tmpDir, "confinement-backends.json");
  fs.writeFileSync(
    regPath,
    JSON.stringify({
      contract: "confinement-backend-registry.v1",
      confinementBackends: {
        bwrap: {
          type: "bwrap",
          enabled: true,
          executable: "/usr/bin/bwrap",
        },
      },
    }),
  );
  process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = regPath;

  let adapterCalls = 0;
  const fakeAdapter = async () => {
    adapterCalls++;
    return { status: 0, stdout: "ok", stderr: "" };
  };

  const fgosDir7 = path.join(tmpDir, ".fgos");
  const runDir7 = path.join(fgosDir7, "runs", "1");
  fs.mkdirSync(runDir7, { recursive: true });

  const req = buildConfinementRequest({
    capability: "advise",
    executorId: "test-exec",
    requirement: {
      mode: "required",
      policyId: "host-write-denied",
      policy: resolveConfinementPolicy("host-write-denied"),
    },
    backendId: "bwrap",
    resourceNeeds: [
      { resource: "nonexistent-custom-resource", access: "read" },
    ],
    invocation: { command: "echo", args: ["hi"], adapter: "cli-spawn" },
    context: { cwd: tmpDir, repoRoot: tmpDir, runDir: runDir7, fgosDir: fgosDir7 },
  });

  await assert.rejects(
    async () => executeThroughConfinement(req, fakeAdapter),
    (err) => {
      assert.ok(err instanceof DispatchError);
      assert.equal(err.code, "confinement-need-unsatisfied");
      assert.equal(err.data?.status, "refused");
      return true;
    },
  );

  assert.equal(adapterCalls, 0, "adapter must not be called when resource need is unsatisfied");
  delete process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("R1 Case 8: prepared claims mismatch plan refuses with confinement-plan-mismatch and 0 adapter calls", async () => {
  const tmpDir = mkTemp("p04-r1-c8-");
  const regPath = path.join(tmpDir, "confinement-backends.json");
  fs.writeFileSync(
    regPath,
    JSON.stringify({
      contract: "confinement-backend-registry.v1",
      confinementBackends: {
        bwrap: {
          type: "bwrap",
          enabled: true,
          executable: "/usr/bin/bwrap",
        },
      },
    }),
  );
  process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = regPath;

  const origDriver = getBackendDriver("bwrap");
  // Register a mock bwrap driver whose prepare returns mismatched claims
  registerBackendDriver({
    type: "bwrap",
    version: "mock-v1",
    validateConfig: () => true,
    assess: (req) => {
      const coverage = {};
      for (const k of Object.keys(req.requirement.policy.controls || {})) {
        coverage[`control:${k}`] = "satisfied";
      }
      return {
        coverage,
        resources: [],
        readiness: {},
        mismatches: [],
      };
    },
    prepare: async (plan) => ({
      invocation: { command: "echo", args: ["mocked"] },
      claims: { "control:hostWrite": "unverified" }, // Claims mismatch plan coverage!
      cleanup: async () => {},
    }),
  });

  let adapterCalls = 0;
  const fakeAdapter = async () => {
    adapterCalls++;
    return { status: 0, stdout: "ok", stderr: "" };
  };

  try {
    const req = buildConfinementRequest({
      capability: "advise",
      executorId: "test-exec",
      requirement: {
        mode: "required",
        policyId: "host-write-denied",
        policy: resolveConfinementPolicy("host-write-denied"),
      },
      backendId: "bwrap",
      invocation: { command: "echo", args: ["hi"], adapter: "cli-spawn" },
      context: { cwd: tmpDir, runDir: tmpDir },
    });

    await assert.rejects(
      async () => executeThroughConfinement(req, fakeAdapter),
      (err) => {
        assert.ok(err instanceof DispatchError);
        assert.equal(err.code, "confinement-plan-mismatch");
        assert.equal(err.data?.status, "refused");
        return true;
      },
    );

    assert.equal(adapterCalls, 0, "adapter must not be called when prepared claims mismatch the plan");
  } finally {
    registerBackendDriver(origDriver);
    delete process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// ─── R2: Preferred Mode Stays Disabled / Bounded ───────────────────────────────

test("R2: preferred mode refuses cleanly before spawn with confinement-mode-unsupported", async () => {
  const tmpDir = mkTemp("p04-r2-");
  let adapterCalls = 0;
  const fakeAdapter = async () => {
    adapterCalls++;
    return { status: 0, stdout: "ok", stderr: "" };
  };

  const req = buildConfinementRequest({
    capability: "advise",
    executorId: "test-exec",
    requirement: {
      mode: "preferred",
      policyId: "host-write-denied",
      policy: resolveConfinementPolicy("host-write-denied"),
    },
    backendId: "bwrap",
    invocation: { command: "echo", args: ["hi"], adapter: "cli-spawn" },
    context: { cwd: tmpDir, runDir: tmpDir },
  });

  await assert.rejects(
    async () => executeThroughConfinement(req, fakeAdapter),
    (err) => {
      assert.ok(err instanceof DispatchError);
      assert.equal(err.code, "confinement-mode-unsupported");
      assert.equal(err.data?.status, "refused");
      assert.equal(err.data?.attestation?.phase, "refused");
      assert.equal(err.data?.attestation?.outcome, "refused");
      return true;
    },
  );

  assert.equal(adapterCalls, 0, "adapter must not be called in preferred mode");
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ─── R3: Explicit Unconfined Attestation with Backend Null ─────────────────────

test("R3: explicit unconfined policy produces audited attestation with backend: null and explicit-opt-out", async () => {
  const tmpDir = mkTemp("p04-r3-");
  let adapterCalls = 0;
  const fakeAdapter = async () => {
    adapterCalls++;
    return { status: 0, stdout: "executed-unconfined", stderr: "" };
  };

  const req = buildConfinementRequest({
    capability: "execute",
    executorId: "test-exec",
    requirement: {
      mode: "unconfined",
      policyId: null,
      policy: null,
      omitted: false, // explicit opt-out!
    },
    invocation: { command: "echo", args: ["unconfined"], adapter: "cli-spawn" },
    context: { cwd: tmpDir, runDir: tmpDir },
  });

  const result = await executeThroughConfinement(req, fakeAdapter);
  assert.equal(adapterCalls, 1);
  assert.equal(result.attestation.outcome, "unconfined");
  assert.equal(result.attestation.backend, null);

  const optOutEvidence = result.attestation.evidence.find((e) => e.kind === "explicit-opt-out");
  assert.ok(optOutEvidence, "attestation must carry explicit-opt-out evidence");
  assert.equal(optOutEvidence.ref, "policy:unconfined");

  // Verify record was saved to attestation store
  const record = loadAttestationRecord(req.dispatchId, "completed", req.context);
  assert.ok(record);
  assert.equal(record.outcome, "unconfined");
  assert.equal(record.backend, null);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ─── R4 & R5: Migrated Executor Config & Static Check ──────────────────────────

test("R4 & R5: migrated claude-bwrap, agy-bwrap, codex-bwrap config fixture uses confinement.backend without bwrap in argv", () => {
  const migratedConfig = loadRunnerConfig(path.join(process.cwd(), "test/fixtures/confinement-migrated-executors.json"));

  for (const [id, exec] of Object.entries(migratedConfig.executors)) {
    // R5: IDs preserved unchanged
    assert.ok(["claude-bwrap", "agy-bwrap", "codex-bwrap"].includes(id));

    // R4: confinement.backend is bwrap
    assert.equal(exec.confinement?.backend, "bwrap");

    // Static check: command is the real tool binary, NOT bwrap
    const inv = exec.invocations[0];
    assert.notEqual(inv.command, "bwrap", `${id} command must not be bwrap`);

    // Static check: argv does not contain hardcoded bwrap flags
    const hasBwrapFlags = inv.args.some((a) => a.includes("--ro-bind") || a.includes("--dev") || a.includes("--proc"));
    assert.equal(hasBwrapFlags, false, `${id} argv must not contain hardcoded bwrap mount args`);
  }
});

test("R6: an unconfined request cannot carry a policy", () => {
  const tmpDir = mkTemp("p04-unconfined-policy-");
  assert.throws(() => validateConfinementRequest({
    contract: "confinement-request.v1", dispatchId: "disp_bad", capability: "advise", executorId: "test",
    invocation: {}, context: { cwd: tmpDir, runDir: tmpDir },
    requirement: { mode: "unconfined", policyId: "host-write-denied", policy: resolveConfinementPolicy("host-write-denied") },
  }), /unconfined requirement/);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ─── R6: Closure of Fail-Open Paths (F-a, F-b, F-c, F-d) ──────────────────────

test("R6 / F-a: cliSpawnAdapter structurally cannot reach unconfined dispatch under required policy", async () => {
  // If required confinement fails, executeThroughConfinement rejects before calling the adapter.
  const tmpDir = mkTemp("p04-f-a-");
  let cliSpawnCalled = false;
  const mockCliSpawn = async () => {
    cliSpawnCalled = true;
    return { status: 0 };
  };

  const req = buildConfinementRequest({
    capability: "advise",
    executorId: "test-exec",
    requirement: {
      mode: "required",
      policyId: "host-write-denied",
      policy: resolveConfinementPolicy("host-write-denied"),
    },
    backendId: null, // missing backend triggers pre-spawn refusal
    invocation: { command: "echo", args: ["hello"], adapter: "cli-spawn" },
    context: { cwd: tmpDir, runDir: tmpDir },
  });

  await assert.rejects(
    async () => executeThroughConfinement(req, mockCliSpawn),
    (err) => err instanceof DispatchError,
  );

  assert.equal(cliSpawnCalled, false, "cliSpawnAdapter must never be reached when required policy refuses");
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("R6 / F-b: invocation confinement override validation rejects grant addition, control lowering, policy change, mode flip", () => {
  const basePolicy = resolveConfinementPolicy("host-write-denied");

  // 1. Cannot add new grant without base policy
  assert.throws(
    () =>
      validateOverrideConfinementShape(
        { grants: [{ resource: "workspace", access: "read-write", scope: "dispatch" }] },
        null,
        "test-override",
      ),
    /cannot add grant for "workspace" without a base policy/,
  );

  // 2. Cannot add new grant not in base policy
  assert.throws(
    () =>
      validateOverrideConfinementShape(
        { grants: [{ resource: "workspace", access: "read-write", scope: "dispatch" }] },
        basePolicy,
        "test-override",
      ),
    /cannot add new grant for "workspace"/,
  );

  // 3. Cannot widen grant access
  assert.throws(
    () =>
      validateOverrideConfinementShape(
        { grants: [{ resource: "run-output", access: "read-write", scope: "dispatch" }] },
        basePolicy, // run-output in basePolicy is write
        "test-override",
      ),
    /override cannot widen access/,
  );

  // 4. Cannot lower control (hostWrite deny -> allow)
  assert.throws(
    () =>
      validateOverrideConfinementShape(
        { controls: { hostWrite: "allow" } },
        basePolicy,
        "test-override",
      ),
    /override downgrade: "allow" is less protective than base policy "deny"/,
  );

  // 5. Cannot change policy ID (unknown key)
  assert.throws(
    () =>
      validateOverrideConfinementShape(
        { policy: "unconfined" },
        basePolicy,
        "test-override",
      ),
    /contains unknown key "policy"/,
  );

  // 6. Cannot flip mode to unconfined
  assert.throws(
    () =>
      validateOverrideConfinementShape(
        { mode: "unconfined" },
        basePolicy,
        "test-override",
        "required",
      ),
    /override must be "required" or "preferred"/,
  );

  // 7. Cannot downgrade mode from required to preferred
  assert.throws(
    () =>
      validateOverrideConfinementShape(
        { mode: "preferred" },
        basePolicy,
        "test-override",
        "required",
      ),
    /cannot downgrade mode from "required" to "preferred"/,
  );
});

test("R6 / F-c: capability fallback carries the same confinement policy and anchor from which it fell back", () => {
  const cfg = {
    capabilities: {
      "code:review": {
        confinement: { mode: "required", policy: "host-write-denied" },
      },
      "generic-fallback": {
        // has no confinement entry
      },
    },
  };

  const req = buildConfinementRequest({
    capability: "generic-fallback",
    fallbackFrom: "code:review",
    executorId: "test-exec",
    cfg,
    context: { cwd: "/tmp", runDir: "/tmp" },
  });

  assert.equal(req.requirement.mode, "required");
  assert.equal(req.requirement.policyId, "host-write-denied");
  assert.equal(req.requirement.anchor, "code:review", "anchor must be preserved from fallback");
  assert.ok(req.requirement.policy);
  assert.equal(req.requirement.policy.contract, "confinement-policy.v1");
});

test("R6 / F-c: resolver retains a distinct configured anchor for a generic requested capability", () => {
  const cfg = {
    capabilities: {
      "generic-fallback": { prefer: "reviewer" },
      "code:review": { confinement: { mode: "required", policy: "host-write-denied" } },
    },
    executors: { reviewer: { for: ["code:review"] } },
  };
  const resolvedExecutor = cfg.executors.reviewer;
  const resolution = resolveCapabilityIdentityDetails({
    cfg,
    executorId: "reviewer",
    resolvedExecutor,
    purpose: "generic-fallback",
  });

  assert.deepEqual(resolution, {
    capability: "generic-fallback",
    anchorCapability: "code:review",
  });

  const req = buildConfinementRequest({
    ...resolution,
    fallbackFrom: resolution.anchorCapability,
    executorId: "reviewer",
    cfg,
    context: { cwd: "/tmp", runDir: "/tmp" },
  });
  assert.equal(req.requirement.mode, "required");
  assert.equal(req.requirement.policyId, "host-write-denied");
  assert.equal(req.requirement.anchor, "code:review");
});

test("R6 / F-d: establishConfinement returns confined: false, status: unconfined when nothing was confined", async () => {
  const tmpBase = mkTemp("p04-repo-base-");
  const repoRoot = path.join(tmpBase, "repo");
  const cwd = path.join(repoRoot, "worktree");
  fs.mkdirSync(cwd, { recursive: true });

  const tmpHome = mkTemp("p04-fake-home-");
  fs.mkdirSync(path.join(tmpHome, ".claude"), { recursive: true });
  fs.writeFileSync(
    path.join(tmpHome, ".claude.json"),
    JSON.stringify({ projects: { [repoRoot]: { hasTrustDialogAccepted: true, allowedTools: [] } } }),
  );
  fs.writeFileSync(
    path.join(tmpHome, ".claude", ".credentials.json"),
    '{"synthetic":"not-a-real-credential"}',
  );

  const mockRound = {
    workId: "w-1",
    agentName: "worker-1",
    note: () => {},
    fail: (type, code, msg) => new Error(msg),
  };

  // 1. When no confinement flags are set: returns unconfined
  const resultUnconfined = await establishConfinement({
    confinement: {},
    round: mockRound,
    fullEnv: { HOME: tmpHome },
    cwd,
    repoRoot,
  });

  assert.equal(resultUnconfined.confined, false);
  assert.equal(resultUnconfined.status, "unconfined");
  assert.equal(resultUnconfined.workerHomePath, null);

  // 2. When privateHome is set: returns confined: true, status: confined
  const resultConfined = await establishConfinement({
    confinement: { privateHome: true },
    round: mockRound,
    fullEnv: { HOME: tmpHome },
    cwd,
    repoRoot,
  });

  assert.equal(resultConfined.confined, true);
  assert.equal(resultConfined.status, "confined");
  assert.ok(resultConfined.workerHomePath);

  // 3. A worktree location is checked but does not provision isolation.
  const resultOwnWorktreeOnly = await establishConfinement({
    confinement: { ownWorktree: true },
    round: mockRound,
    fullEnv: { HOME: tmpHome },
    cwd,
    repoRoot,
  });
  assert.equal(resultOwnWorktreeOnly.confined, false);
  assert.equal(resultOwnWorktreeOnly.status, "partial");
  assert.equal(resultOwnWorktreeOnly.workerHomePath, null);

  fs.rmSync(tmpHome, { recursive: true, force: true });
  fs.rmSync(tmpBase, { recursive: true, force: true });
});

// ─── R7: DEFAULT_CAPABILITY_SLOTS Explicit Confinement Policies ────────────────

test("R7: read-only DEFAULT_CAPABILITY_SLOTS use the explicit interim unconfined posture until P06 wires backends", () => {
  const unconfinedSlots = ["advise", "code:review", "code:debug"];
  for (const name of unconfinedSlots) {
    const slot = DEFAULT_CAPABILITY_SLOTS[name];
    assert.ok(slot, `slot "${name}" must exist`);
    assert.equal(slot.confinement?.mode, "unconfined", `${name} must have unconfined mode`);
  }
});

// ─── R8: Optional Live Bwrap Test (Gated) ──────────────────────────────────────

test("R8: live bwrap dispatch executes through Confinement Authority when FGOS_LIVE_BWRAP_TESTS=1", { skip: process.env.FGOS_LIVE_BWRAP_TESTS !== "1" }, async () => {
  const tmpDir = mkTemp("p04-r8-live-");
  const regPath = path.join(tmpDir, "confinement-backends.json");
  ensureMachineBackendRegistryDefaults(regPath);
  process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = regPath;

  const fgosDir = path.join(tmpDir, ".fgos");
  const runDir = path.join(fgosDir, "runs", "1");
  fs.mkdirSync(runDir, { recursive: true });

  const req = buildConfinementRequest({
    capability: "advise",
    executorId: "claude-bwrap",
    requirement: {
      mode: "required",
      policyId: "host-write-denied",
      policy: resolveConfinementPolicy("host-write-denied"),
    },
    backendId: "bwrap",
    invocation: {
      command: process.execPath,
      args: ["-e", "console.log('live-bwrap-confinement-success')"],
      adapter: "cli-spawn",
    },
    context: {
      cwd: tmpDir,
      repoRoot: tmpDir,
      runDir,
      fgosDir,
    },
  });

  const result = await executeThroughConfinement(req);
  assert.equal(result.status, "completed");
  assert.equal(result.result?.status, 0);
  assert.match(result.stdout, /live-bwrap-confinement-success/);
  assert.equal(result.attestation.outcome, "enforced");
  assert.equal(result.attestation.phase, "completed");

  delete process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
