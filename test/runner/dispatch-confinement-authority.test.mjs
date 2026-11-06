import '../helpers/process-tmp-root.mjs';
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { buildConfinementAttestation, prepareConfinementForLaunch } from "../../src/runner/dispatch/confinement/authority.mjs";
import { buildConfinementRequest, validateConfinementRequest } from "../../src/runner/dispatch/confinement/request.mjs";
import { ensureMachineBackendRegistryDefaults } from "../../src/runner/dispatch/confinement/backend-registry.mjs";
import { resolveConfinementPolicy } from "../../src/runner/dispatch/confinement/policies.mjs";
import { loadAttestationRecord } from "../../src/runner/dispatch/confinement/attestation-store.mjs";

test("buildConfinementRequest builds valid confinement-request.v1 shape at dispatch seam", () => {
  const req = buildConfinementRequest({
    capability: "fgos-coding-implement",
    executorId: "agy",
    invocation: {
      command: "agy",
      args: ["-i", "prompt"],
      adapter: "cli-spawn",
      env: { FOO: "bar" },
    },
    context: {
      cwd: "/repo",
      repoRoot: "/repo",
      runDir: "/repo/.fgos/runs/1",
      timeoutMs: 10000,
    },
  });

  assert.equal(req.contract, "confinement-request.v1");
  assert.ok(req.dispatchId.startsWith("disp_"));
  assert.equal(req.capability, "fgos-coding-implement");
  assert.equal(req.executorId, "agy");
  assert.equal(req.invocation.command, "agy");
  assert.deepEqual(req.invocation.args, ["-i", "prompt"]);
  assert.equal(req.context.cwd, "/repo");
  assert.equal(req.context.runDir, "/repo/.fgos/runs/1");
  assert.equal(req.requirement.mode, "unconfined");
  assert.equal(req.requirement.omitted, true);
  assert.doesNotThrow(() => validateConfinementRequest(req));
});

test("malformed required policy is rejected at the request door before any spawn", async () => {
  let spawnCount = 0;
  const fakeAdapter = async () => {
    spawnCount++;
    return { status: 0 };
  };

  assert.throws(
    () => buildConfinementRequest({
      capability: "secured-task", executorId: "test-exec",
      requirement: { mode: "required", policyId: "host-write-denied", policy: { contract: "confinement-policy.v1", controls: {}, grants: [] } },
      invocation: { command: "echo", args: [], adapter: "cli-spawn" },
      context: { cwd: "/cwd", runDir: "/runDir" },
    }),
    /missing required control "hostWrite"/,
  );
  assert.equal(spawnCount, 0, "malformed policy cannot reach an adapter");
});

test("observe mode emits unknown attestation for omitted policy and unconfined for explicit unconfined (R7)", () => {
  // 1. Omitted policy (legacy default)
  const omittedReq = buildConfinementRequest({
    capability: "legacy-cap",
    executorId: "exec",
    invocation: { command: "cmd", args: [] },
    context: { cwd: "/cwd", runDir: "/runDir" },
  });
  const omittedAtt = buildConfinementAttestation({ request: omittedReq, phase: "prepared" });
  assert.equal(omittedAtt.outcome, "unknown");
  assert.notEqual(omittedAtt.outcome, "enforced");

  // 2. Explicit unconfined
  const unconfinedReq = buildConfinementRequest({
    capability: "unconfined-cap",
    executorId: "exec",
    requirement: { mode: "unconfined", policyId: null, policy: null, omitted: false },
    invocation: { command: "cmd", args: [] },
    context: { cwd: "/cwd", runDir: "/runDir" },
  });
  const unconfinedAtt = buildConfinementAttestation({ request: unconfinedReq, phase: "prepared" });
  assert.equal(unconfinedAtt.outcome, "unconfined");
  assert.equal(unconfinedAtt.channels[0].coverage, "out-of-scope");
});

// spawnWorker no longer builds a confinement request of its own: it runs the worker as a Unit
// run, whose posture comes from the Unit's writes (a writing Unit is always confined). A missing
// backend refusing instead of running unconfined is tested in
// test/runner/execution/run-posture.test.mjs; the loop-facing refusal in
// test/runner/spawn-worker.test.mjs.

test("M1: buildConfinementAttestation surfaces legacy confinement and bwrap observation in effectiveControls, coverage, grants, channels, and evidence", () => {
  const req = buildConfinementRequest({
    capability: "legacy-bwrap-cap",
    executorId: "claude-bwrap",
    invocation: {
      command: "bwrap",
      args: ["--ro-bind", "/", "/", "--unshare-pid"],
      confinement: {
        isolatedSession: true,
        ownWorktree: true,
        privateHome: true,
      },
    },
    context: {
      cwd: "/repo",
      runDir: "/repo/.fgos/runs/1",
    },
  });

  const att = buildConfinementAttestation({ request: req, phase: "prepared" });
  assert.equal(att.effectiveControls.hostWrite, "deny");
  assert.equal(att.effectiveControls.process, "isolated");
  assert.equal(att.effectiveControls.session, "isolated");
  assert.equal(att.effectiveControls.workspace, "own");
  assert.equal(att.effectiveControls.home, "private");
  assert.equal(att.coverage["control:hostWrite"], "satisfied");
  assert.equal(att.coverage["control:process"], "satisfied");
  assert.equal(att.coverage["control:session"], "unverified");
  assert.equal(att.coverage["control:workspace"], "unverified");
  assert.equal(att.coverage["control:home"], "unverified");
  assert.ok(att.grants.some((g) => g.resource === "run-output"));
  assert.ok(att.grants.some((g) => g.resource === "private-home"));
  assert.ok(att.channels.some((c) => c.name === "filesystem" && c.coverage === "covered"));
  assert.ok(att.channels.some((c) => c.name === "host-ipc" && c.coverage === "covered"));
  assert.ok(att.evidence.some((e) => e.ref.includes("bwrap-argv")));
  assert.ok(att.evidence.some((e) => e.ref.includes("legacy-confinement")));
});

test("M4: validateConfinementRequest rejects unknown keys and buildConfinementRequest rejects omitted runDir", () => {
  const validReq = buildConfinementRequest({
    capability: "cap",
    executorId: "exec",
    invocation: { command: "c", args: [] },
    context: { cwd: "/cwd", runDir: "/runDir" },
  });

  assert.throws(
    () => validateConfinementRequest({ ...validReq, unknownAlienKey: 123 }),
    /ConfinementRequest contains unknown key "unknownAlienKey"/,
  );

  assert.throws(
    () =>
      buildConfinementRequest({
        capability: "cap",
        executorId: "exec",
        invocation: { command: "c", args: [] },
        context: { cwd: "/cwd" },
      }),
    /ConfinementRequest context.runDir must be a non-empty string/,
  );

  assert.throws(
    () => validateConfinementRequest({ ...validReq, requirement: { ...validReq.requirement, mode: "sorta-confined" } }),
    /requirement\.mode must be one of "unconfined", "preferred", "required"/,
  );
});

test("L5: throw in resolveConfinementPolicy upstream of door creates zero spawn", async () => {
  let spawnCount = 0;
  const fakeAdapter = async () => {
    spawnCount++;
    return { status: 0 };
  };

  const cfg = {
    capabilities: {
      "bad-cap": {
        confinement: { mode: "required", policy: "non-existent-policy" },
      },
    },
  };

  assert.throws(
    () =>
      buildConfinementRequest({
        capability: "bad-cap",
        executorId: "exec",
        cfg,
        context: { cwd: "/cwd", runDir: "/runDir" },
      }),
    /ConfinementPolicyError|runner config.*policy.*unknown/,
  );

  assert.equal(spawnCount, 0, "zero spawn occurs when policy resolution throws upstream of door");
});

test("MED-4: executor named bwrap without real bwrap invocation does not claim satisfied/covered", () => {
  const req = buildConfinementRequest({
    capability: "nobwrap-cap",
    executorId: "claude-nobwrap-fallback",
    invocation: {
      command: "claude",
      args: ["-p", "hi"],
    },
    context: { cwd: "/cwd", runDir: "/runDir" },
  });

  const att = buildConfinementAttestation({ request: req, phase: "prepared" });
  assert.notEqual(att.effectiveControls.hostWrite, "deny", "must not claim hostWrite: deny without verified bwrap");
  assert.notEqual(att.effectiveControls.process, "isolated", "must not claim process: isolated without verified bwrap");
  assert.notEqual(att.coverage["control:hostWrite"], "satisfied", "must not claim satisfied coverage");
  assert.notEqual(att.coverage["control:process"], "satisfied", "must not claim satisfied coverage");
  const fsChannel = att.channels.find((c) => c.name === "filesystem");
  assert.notEqual(fsChannel?.coverage, "covered", "filesystem channel must not be covered");
  assert.ok(
    fsChannel?.detail.includes("unverified") || fsChannel?.detail.includes("no policy declared"),
    "detail must state unverified or no policy declared",
  );
  assert.ok(!att.evidence.some((e) => e.ref.startsWith("bwrap-argv:")), "must not emit bwrap-argv evidence");
});

// ─── The launch door returns the prepared backend plan and sandbox to its caller, so the
// attempt that follows can attest what was genuinely prepared rather than "unknown". ───

// bwrap must be able to build a sandbox here, not merely be installed: a host
// that blocks unprivileged user namespaces (Ubuntu 24.04's AppArmor default)
// has the binary but fails every probe with "setting up uid map".
const BWRAP_PRESENT = (() => {
  try {
    return spawnSync("bwrap", ["--ro-bind", "/", "/", "--", "true"], { stdio: "ignore" }).status === 0;
  } catch {
    return false;
  }
})();

test("the launch door returns the prepared backend plan and sandbox, and saves a prepared attestation naming the bwrap backend, for a required dispatch", { skip: !BWRAP_PRESENT }, async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fgos-h9-assignment-door-enforced-"));
  const oldRegistry = process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
  try {
    const registryPath = path.join(tmp, "confinement-backends.json");
    ensureMachineBackendRegistryDefaults(registryPath);
    process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = registryPath;

    const runDir = path.join(tmp, ".fgos", "assignments", "asgn_h9", "runs", "01");
    fs.mkdirSync(runDir, { recursive: true });

    const req = buildConfinementRequest({
      capability: "code:implement",
      executorId: "claude-bwrap",
      backendId: "bwrap",
      requirement: {
        mode: "required",
        policyId: "host-write-denied",
        policy: resolveConfinementPolicy("host-write-denied"),
      },
      invocation: {
        command: process.execPath,
        args: ["-e", "console.log('h9-assignment-door-ok')"],
        adapter: "cli-spawn",
      },
      context: { cwd: tmp, repoRoot: tmp, runDir, fgosDir: path.join(tmp, ".fgos") },
      assignmentLaunchContext: {
        contract: "assignment-cli-spawn-launch-context.v1",
        run: {
          runId: "run_h9",
          assignmentId: "asgn_h9",
          attempt: 1,
          dispatchPlanDigest: `sha256:${"a".repeat(64)}`,
          evaluatorBaselineDigest: `sha256:${"b".repeat(64)}`,
        },
        command: { launchCommandId: "lc-h9-01", controlEpoch: 1, controlTokenDigest: `sha256:${"c".repeat(64)}` },
      },
    });

    const prepared = await prepareConfinementForLaunch(req);

    assert.equal(prepared.backendPlan.backend.type, "bwrap");
    assert.equal(prepared.backendPlan.decision, "execute");
    assert.ok(prepared.preparedConfinement, "a genuinely prepared sandbox is returned to the caller");
    const record = loadAttestationRecord(req.dispatchId, "prepared", req.context);
    assert.equal(record.phase, "prepared");
    assert.equal(record.backend.id, "bwrap");
  } finally {
    if (oldRegistry === undefined) delete process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
    else process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = oldRegistry;
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("a supervised attempt that opts in to credential write-back gets its target recorded on the private-home entry of the finalization descriptor, and its home marker names none", { skip: !BWRAP_PRESENT }, async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fgos-writeback-descriptor-"));
  const oldRegistry = process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
  try {
    const registryPath = path.join(tmp, "confinement-backends.json");
    ensureMachineBackendRegistryDefaults(registryPath);
    process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = registryPath;
    const runDir = path.join(tmp, ".fgos", "assignments", "asgn_wb", "runs", "01");
    fs.mkdirSync(runDir, { recursive: true });
    const accountHome = path.join(tmp, "account-home");
    fs.mkdirSync(accountHome, { recursive: true });
    fs.writeFileSync(path.join(accountHome, "auth.json"), JSON.stringify({ xai: { type: "oauth", refresh: "FAKE-REFRESH", expires: Date.now() + 3600000 } }));
    const runtimeDir = path.join(tmp, "runtime");

    const req = buildConfinementRequest({
      capability: "code:implement",
      executorId: "agent-bwrap",
      backendId: "bwrap",
      requirement: { mode: "required", policyId: "host-write-denied", policy: resolveConfinementPolicy("host-write-denied") },
      invocation: { command: process.execPath, args: ["-e", "0"], adapter: "cli-spawn", credentialStore: { use: "agent-cli", homeEnv: "AGENT_HOME" } },
      providerCapacity: {
        provider: "xai", accountId: "acct",
        credentialSource: { kind: "home-files", home: accountHome, files: ["auth.json"] },
        credentialWriteBack: { runtimeDir },
      },
      attemptId: "lc-wb-01",
      launchMode: "direct",
      context: { cwd: tmp, repoRoot: tmp, runDir, fgosDir: path.join(tmp, ".fgos") },
      assignmentLaunchContext: {
        contract: "assignment-cli-spawn-launch-context.v1",
        run: {
          runId: "run_wb",
          assignmentId: "asgn_wb",
          attempt: 1,
          dispatchPlanDigest: `sha256:${"a".repeat(64)}`,
          evaluatorBaselineDigest: `sha256:${"b".repeat(64)}`,
        },
        command: { launchCommandId: "lc-wb-01", controlEpoch: 1, controlTokenDigest: `sha256:${"c".repeat(64)}` },
      },
    });

    const prepared = await prepareConfinementForLaunch(req);
    const descriptor = JSON.parse(fs.readFileSync(prepared.finalizationPath, "utf8"));
    const home = descriptor.resources.find((r) => r.resourceId === "private-home");
    assert.ok(home, JSON.stringify(descriptor.resources));
    assert.deepEqual(home.credentialWriteBack, {
      provider: "xai", accountId: "acct", kind: "home-files", home: accountHome, layout: "pi-auth-json", runtimeDir,
    });
    const markerText = fs.readFileSync(path.join(home.pathRef, ".fgos-confinement-owner.json"), "utf8");
    assert.equal(markerText.includes(accountHome), false, "the home marker names no login store");
  } finally {
    if (oldRegistry === undefined) delete process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
    else process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = oldRegistry;
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("MED-A: production bwrap executor argvs yield process: unverified while hostWrite: deny is satisfied and writable exception recorded as grant", () => {
  const prodExecutors = [
    {
      executorId: "claude-bwrap",
      args: [
        "--ro-bind", "/", "/",
        "--dev", "/dev",
        "--proc", "/proc",
        "--bind", "/home/vantt/projects/forgentX/.fgos/assignments", "/home/vantt/projects/forgentX/.fgos/assignments",
        "--", "claude", "-p", "{prompt}", "--model", "{model}", "--permission-mode", "acceptEdits",
      ],
    },
    {
      executorId: "agy-bwrap",
      args: [
        "--ro-bind", "/", "/",
        "--dev", "/dev",
        "--proc", "/proc",
        "--bind", "/home/vantt/projects/forgentX/.fgos/assignments", "/home/vantt/projects/forgentX/.fgos/assignments",
        "--", "agy", "-p", "{prompt}", "--mode", "accept-edits", "--print-timeout", "30m", "--model", "{model}",
      ],
    },
    {
      executorId: "codex-bwrap",
      args: [
        "--ro-bind", "/", "/",
        "--dev", "/dev",
        "--proc", "/proc",
        "--tmpfs", "/tmp",
        "--ro-bind", "/home/vantt/.codex-fgovn/auth.json", "/tmp/cdxhome/auth.json",
        "--setenv", "CODEX_HOME", "/tmp/cdxhome",
        "--bind", "/home/vantt/projects/forgentX/.fgos/assignments", "/home/vantt/projects/forgentX/.fgos/assignments",
        "--", "codex", "exec", "--skip-git-repo-check", "-s", "danger-full-access", "--model", "{model}", "{prompt}",
      ],
    },
  ];

  for (const { executorId, args } of prodExecutors) {
    const req = buildConfinementRequest({
      capability: "advise",
      executorId,
      invocation: {
        command: "bwrap",
        args,
      },
      context: {
        cwd: "/repo",
        runDir: "/repo/.fgos/assignments/asgn_test/runs/01",
      },
    });

    const att = buildConfinementAttestation({ request: req, phase: "prepared" });

    // hostWrite must be satisfied and deny because --ro-bind / / is present without wider writable re-bind
    assert.equal(att.effectiveControls.hostWrite, "deny", `${executorId}: hostWrite must be deny`);
    assert.equal(att.coverage["control:hostWrite"], "satisfied", `${executorId}: control:hostWrite must be satisfied`);
    const fsChannel = att.channels.find((c) => c.name === "filesystem");
    assert.equal(fsChannel?.coverage, "covered", `${executorId}: filesystem channel must be covered`);

    // process must be unverified because none of the production executors pass --unshare-pid today
    assert.notEqual(att.effectiveControls.process, "isolated", `${executorId}: process must not be claimed isolated`);
    assert.equal(att.coverage["control:process"], "unverified", `${executorId}: control:process must be unverified`);

    // Writable exception on top of ro-bind (/home/.../.fgos/assignments) must be recorded as a grant, not contradicting hostWrite
    const assignmentGrant = att.grants.find((g) => g.resource === "assignments");
    assert.ok(assignmentGrant, `${executorId}: must record assignments writable exception as a grant`);
    assert.equal(assignmentGrant.access, "read-write", `${executorId}: assignments grant access must be read-write`);
    assert.ok(assignmentGrant.target.includes(".fgos/assignments"), `${executorId}: assignments grant target must match path`);

    // Verified bwrap evidence must be emitted
    assert.ok(att.evidence.some((e) => e.ref === `bwrap-argv:${executorId}`), `${executorId}: bwrap-argv evidence must be emitted`);
  }

  // Probe MED-A live falsification cases:
  // 1. `bwrap --bind / / -- sh` confines nothing; must not claim hostWrite: deny or process: isolated
  const bindAllReq = buildConfinementRequest({
    capability: "advise",
    executorId: "bwrap-bind-all",
    invocation: {
      command: "bwrap",
      args: ["--bind", "/", "/", "--", "sh", "-c", "echo pwned"],
    },
    context: { cwd: "/repo", runDir: "/repo/runs/1" },
  });
  const bindAllAtt = buildConfinementAttestation({ request: bindAllReq, phase: "prepared" });
  assert.notEqual(bindAllAtt.effectiveControls.hostWrite, "deny", "bwrap --bind / / must not earn hostWrite: deny");
  assert.notEqual(bindAllAtt.effectiveControls.process, "isolated", "bwrap --bind / / must not earn process: isolated");
  assert.equal(bindAllAtt.coverage["control:hostWrite"], "unverified");
  assert.equal(bindAllAtt.coverage["control:process"], "unverified");
  assert.notEqual(bindAllAtt.channels.find((c) => c.name === "filesystem")?.coverage, "covered");
  assert.ok(!bindAllAtt.evidence.some((e) => e.ref.startsWith("bwrap-argv:")), "must not emit bwrap-argv evidence");

  // 2. `bwrap --unshare-user -- sh` does not isolate PID; must not claim process: isolated
  const unshareUserReq = buildConfinementRequest({
    capability: "advise",
    executorId: "bwrap-unshare-user",
    invocation: {
      command: "bwrap",
      args: ["--unshare-user", "--", "sh"],
    },
    context: { cwd: "/repo", runDir: "/repo/runs/1" },
  });
  const unshareUserAtt = buildConfinementAttestation({ request: unshareUserReq, phase: "prepared" });
  assert.notEqual(unshareUserAtt.effectiveControls.process, "isolated", "bwrap --unshare-user must not earn process: isolated");
  assert.notEqual(unshareUserAtt.effectiveControls.hostWrite, "deny", "bwrap --unshare-user must not earn hostWrite: deny");
  assert.equal(unshareUserAtt.coverage["control:process"], "unverified");
  assert.equal(unshareUserAtt.coverage["control:hostWrite"], "unverified");

  // 3. `bwrap --ro-bind / / --bind / /` has wider writable re-bind; hostWrite must be unverified
  const widerRebindReq = buildConfinementRequest({
    capability: "advise",
    executorId: "bwrap-wider-rebind",
    invocation: {
      command: "bwrap",
      args: ["--ro-bind", "/", "/", "--bind", "/", "/"],
    },
    context: { cwd: "/repo", runDir: "/repo/runs/1" },
  });
  const widerRebindAtt = buildConfinementAttestation({ request: widerRebindReq, phase: "prepared" });
  assert.notEqual(widerRebindAtt.effectiveControls.hostWrite, "deny", "--ro-bind / / with --bind / / must not earn hostWrite: deny");
  assert.equal(widerRebindAtt.coverage["control:hostWrite"], "unverified");

  // 4. `bwrap --unshare-pid` grants process: isolated independently of ro-bind
  const pidOnlyReq = buildConfinementRequest({
    capability: "advise",
    executorId: "bwrap-pid-only",
    invocation: {
      command: "bwrap",
      args: ["--unshare-pid", "--", "sh"],
    },
    context: { cwd: "/repo", runDir: "/repo/runs/1" },
  });
  const pidOnlyAtt = buildConfinementAttestation({ request: pidOnlyReq, phase: "prepared" });
  assert.equal(pidOnlyAtt.effectiveControls.process, "isolated", "--unshare-pid grants process: isolated");
  assert.equal(pidOnlyAtt.coverage["control:process"], "satisfied");
  assert.notEqual(pidOnlyAtt.effectiveControls.hostWrite, "deny");
  assert.equal(pidOnlyAtt.coverage["control:hostWrite"], "unverified");
});

test("M4 / M4b lock: authority.mjs contains 0 adapter layer imports (static or dynamic)", () => {
  const authorityPath = fileURLToPath(new URL("../../src/runner/dispatch/confinement/authority.mjs", import.meta.url));
  const content = fs.readFileSync(authorityPath, "utf8");
  const forbiddenAdapters = [
    "herdr-round",
    "herdr-agent",
    "detached-run-supervisor",
    "transport.mjs",
    "assignment-runner",
  ];
  const importRegexes = [
    /\bimport\s*\(\s*['"]([^'"]+)['"]\)/g,
    /\b(?:import|export)\s+(?:(?!\b(?:import|export)\b)[\s\S])*?\bfrom\s*['"]([^'"]+)['"]/g,
    /\bimport\s+['"]([^'"]+)['"]/g,
  ];
  const importedModules = [];
  for (const re of importRegexes) {
    let m;
    while ((m = re.exec(content)) !== null) {
      importedModules.push(m[1]);
    }
  }
  for (const imp of importedModules) {
    for (const forbidden of forbiddenAdapters) {
      assert.equal(
        imp.includes(forbidden),
        false,
        `authority.mjs must not import adapter module '${forbidden}' (found '${imp}', M4/M4b violation)`,
      );
    }
  }
});
