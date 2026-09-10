import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { executeThroughConfinement, buildConfinementAttestation } from "../../src/runner/dispatch/confinement/authority.mjs";
import { buildConfinementRequest, validateConfinementRequest } from "../../src/runner/dispatch/confinement/request.mjs";
import { DispatchError } from "../../src/runner/dispatch/transport.mjs";
import { executeExecutorCli, spawnWorker } from "../../src/runner/dispatch/cli.mjs";
import { loadRunnerConfigFromDir, RunnerConfigError } from "../../src/runner/dispatch/config.mjs";

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

test("fake adapter receives only prepared invocation through Authority (R1-R3)", async () => {
  let receivedInvocation = null;
  let receivedOpts = null;

  const fakeAdapter = async (invocation, opts) => {
    receivedInvocation = invocation;
    receivedOpts = opts;
    return { status: 0, stdout: "fake stdout", stderr: "" };
  };

  const req = buildConfinementRequest({
    capability: "code:implement",
    executorId: "test-exec",
    invocation: {
      command: "echo",
      args: ["hello"],
      prompt: "do something",
      adapter: "cli-spawn",
    },
    context: {
      cwd: "/test/cwd",
      runDir: "/test/runDir",
      timeoutMs: 5000,
      workId: "w123",
      tier: "standard",
      model: "test-model",
    },
  });

  const res = await executeThroughConfinement(req, fakeAdapter);

  assert.equal(res.status, "completed");
  assert.equal(res.result.status, 0);
  assert.equal(res.stdout, "fake stdout");
  assert.ok(res.attestation, "attestation is attached to result");
  assert.equal(res.attestation.contract, "confinement-attestation.v1");
  assert.equal(res.attestation.dispatchId, req.dispatchId);
  assert.equal(res.attestation.outcome, "unknown", "observe mode emits unknown for omitted policy");

  assert.deepEqual(receivedInvocation.args, ["hello"]);
  assert.equal(receivedInvocation.command, "echo");
  assert.equal(receivedInvocation.prompt, "do something");
  assert.equal(receivedOpts.cwd, "/test/cwd");
  assert.equal(receivedOpts.runDir, "/test/runDir");
  assert.equal(receivedOpts.timeoutMs, 5000);
});

test("throw in policy resolve / required mode creates zero spawn (Verification)", async () => {
  let spawnCount = 0;
  const fakeAdapter = async () => {
    spawnCount++;
    return { status: 0 };
  };

  const req = buildConfinementRequest({
    capability: "secured-task",
    executorId: "test-exec",
    requirement: {
      mode: "required",
      policyId: "host-write-denied",
      policy: { contract: "confinement-policy.v1", controls: {}, grants: [] },
    },
    invocation: {
      command: "echo",
      args: [],
      adapter: "cli-spawn",
    },
    context: {
      cwd: "/cwd",
      runDir: "/runDir",
    },
  });

  await assert.rejects(
    () => executeThroughConfinement(req, fakeAdapter),
    (err) => {
      assert.ok(err instanceof DispatchError);
      assert.equal(err.errorClass, "confinement-unsupported");
      assert.match(err.message, /required confinement refused/);
      assert.ok(err.attestation);
      assert.equal(err.attestation.phase, "refused");
      assert.equal(err.attestation.outcome, "refused");
      return true;
    },
  );

  assert.equal(spawnCount, 0, "zero spawn when required policy cannot be enforced in observe mode");
});

test("in-process dispatch gets authorityScope: external-harness with null attestation (R6)", async () => {
  const inProcessReq = buildConfinementRequest({
    capability: "in-proc-task",
    executorId: "agent-task",
    authorityScope: "external-harness",
    invocation: {
      command: "agent",
      args: [],
    },
    context: {
      cwd: "/cwd",
      runDir: "/runDir",
    },
  });

  const res = await executeThroughConfinement(inProcessReq);
  assert.equal(res.authorityScope, "external-harness");
  assert.equal(res.attestation, null);
});

test("in-process dispatch with required confinement refuses without trusted harness attestation (R6)", async () => {
  const inProcessReq = buildConfinementRequest({
    capability: "in-proc-required",
    executorId: "agent-task",
    authorityScope: "external-harness",
    requirement: {
      mode: "required",
      policyId: "host-write-denied",
      policy: null,
    },
    invocation: {
      command: "agent",
      args: [],
    },
    context: {
      cwd: "/cwd",
      runDir: "/runDir",
    },
  });

  await assert.rejects(
    () => executeThroughConfinement(inProcessReq),
    (err) => {
      assert.ok(err instanceof DispatchError);
      assert.equal(err.errorClass, "confinement-unsupported");
      assert.match(err.message, /external-harness/);
      return true;
    },
  );
});

test("observe mode emits unknown attestation for omitted policy and unconfined for explicit unconfined (R7)", async () => {
  const fakeAdapter = async () => ({ status: 0 });

  // 1. Omitted policy (legacy default)
  const omittedReq = buildConfinementRequest({
    capability: "legacy-cap",
    executorId: "exec",
    invocation: { command: "cmd", args: [] },
    context: { cwd: "/cwd", runDir: "/runDir" },
  });
  const omittedRes = await executeThroughConfinement(omittedReq, fakeAdapter);
  assert.equal(omittedRes.attestation.outcome, "unknown");
  assert.notEqual(omittedRes.attestation.outcome, "enforced");

  // 2. Explicit unconfined
  const unconfinedReq = buildConfinementRequest({
    capability: "unconfined-cap",
    executorId: "exec",
    requirement: { mode: "unconfined", policyId: null, policy: null, omitted: false },
    invocation: { command: "cmd", args: [] },
    context: { cwd: "/cwd", runDir: "/runDir" },
  });
  const unconfinedRes = await executeThroughConfinement(unconfinedReq, fakeAdapter);
  assert.equal(unconfinedRes.attestation.outcome, "unconfined");
  assert.equal(unconfinedRes.attestation.channels[0].coverage, "out-of-scope");
});

test("confinement execution failure wraps into named DispatchError with attestation (R5)", async () => {
  const failingAdapter = async () => {
    throw new Error("underlying process crashed with SIGSEGV");
  };

  const req = buildConfinementRequest({
    capability: "test",
    executorId: "exec",
    invocation: { command: "crash", args: [] },
    context: { cwd: "/cwd", runDir: "/runDir" },
  });

  await assert.rejects(
    () => executeThroughConfinement(req, failingAdapter),
    (err) => {
      assert.ok(err instanceof DispatchError);
      assert.equal(err.errorClass, "confinement-execution-failed");
      assert.equal(err.dispatchId, req.dispatchId);
      assert.ok(err.attestation);
      assert.equal(err.attestation.phase, "failed");
      return true;
    },
  );
});

test("H1: spawnWorker resolves and binds curated capability confinement (code:implement) instead of ignoring it", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fgos-h1-test-"));
  const cfg = {
    capabilities: {
      "code:implement": {
        confinement: { mode: "required", policy: "workspace-write" },
      },
    },
    executors: {
      "agy-cli": {
        command: "agy",
        adapter: "cli-spawn",
        args: ["-p", "{prompt}"],
        invocations: [{ via: "cli", command: "agy", args: ["-p", "{prompt}"] }],
      },
    },
    executor: {
      command: "agy",
      adapter: "cli-spawn",
      args: ["-p", "{prompt}"],
      invocations: [{ via: "cli", command: "agy", args: ["-p", "{prompt}"] }],
    },
    modelPolicies: {
      claude: { standard: "sonnet" },
      gemini: { standard: "gemini-flash" },
    },
  };

  const sampleWork = {
    id: "work-h1",
    domain: "coding",
    stage: "executing",
    tier: "standard",
    kind: "feat",
  };

  await assert.rejects(
    () => spawnWorker(sampleWork, cfg, tmpDir, { fgosDir: path.join(tmpDir, ".fgos") }),
    (err) => {
      assert.ok(err instanceof DispatchError);
      assert.equal(err.errorClass, "confinement-unsupported");
      assert.match(err.message, /required confinement refused for capability "code:implement"/);
      return true;
    },
  );
});

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

  const att = buildConfinementAttestation({ request: req });
  assert.equal(att.effectiveControls.hostWrite, "deny");
  assert.equal(att.effectiveControls.process, "isolated");
  assert.equal(att.effectiveControls.session, "isolated");
  assert.equal(att.effectiveControls.workspace, "own");
  assert.equal(att.effectiveControls.home, "private");
  assert.equal(att.coverage["control:hostWrite"], "satisfied");
  assert.equal(att.coverage["control:process"], "satisfied");
  assert.equal(att.coverage["control:session"], "satisfied");
  assert.equal(att.coverage["control:workspace"], "satisfied");
  assert.equal(att.coverage["control:home"], "satisfied");
  assert.ok(att.grants.some((g) => g.resource === "run-output"));
  assert.ok(att.grants.some((g) => g.resource === "private-home"));
  assert.ok(att.channels.some((c) => c.name === "filesystem" && c.coverage === "covered"));
  assert.ok(att.channels.some((c) => c.name === "host-ipc" && c.coverage === "covered"));
  assert.ok(att.evidence.some((e) => e.ref.includes("bwrap-argv")));
  assert.ok(att.evidence.some((e) => e.ref.includes("legacy-confinement")));
});

test("M2: executeExecutorCli in-process required confinement goes through executeThroughConfinement and throws DispatchError with refused attestation", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "fgos-m2-test-"));
  const cfg = {
    capabilities: {
      "code:implement": {
        prefer: "in-proc-exec",
        confinement: { mode: "required", policy: "host-write-denied" },
      },
    },
    executors: {
      "in-proc-exec": {
        agentType: "my-task-agent",
        kind: "agent",
      },
    },
  };

  await assert.rejects(
    () =>
      executeExecutorCli("in-proc-exec", {
        for: "code:implement",
        repoRoot: root,
        runnerConfig: cfg,
        hasLiveTaskAccess: true,
      }),
    (err) => {
      assert.ok(err instanceof DispatchError);
      assert.equal(err.errorClass, "confinement-unsupported");
      assert.equal(err.contract, "confinement-execution.v1");
      assert.equal(err.status, "refused");
      assert.ok(err.dispatchId);
      assert.ok(err.attestation);
      assert.equal(err.attestation.phase, "refused");
      return true;
    },
  );
});

test("M3: executeThroughConfinement returns spec 6.9 confinement-execution.v1 shape and failure preserves cleanup/result", async () => {
  const fakeAdapter = async () => ({ exitCode: 0, stdout: "done" });
  const req = buildConfinementRequest({
    capability: "m3-cap",
    executorId: "m3-exec",
    invocation: { command: "echo", args: [] },
    context: { cwd: "/cwd", runDir: "/runDir" },
  });

  const res = await executeThroughConfinement(req, fakeAdapter);
  assert.equal(res.contract, "confinement-execution.v1");
  assert.equal(res.status, "completed");
  assert.equal(res.result.exitCode, 0);
  assert.ok(res.attestation);

  const failingAdapter = async () => {
    throw new Error("fail with partial");
  };
  await assert.rejects(
    () => executeThroughConfinement(req, failingAdapter),
    (err) => {
      assert.ok(err instanceof DispatchError);
      assert.equal(err.contract, "confinement-execution.v1");
      assert.equal(err.status, "failed");
      assert.ok(err.cleanup);
      return true;
    },
  );
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
});

test("L3: missing executor adapter produces async rejection with RunnerConfigError", async () => {
  const req = buildConfinementRequest({
    capability: "cap",
    executorId: "exec",
    invocation: { command: "c", args: [], adapter: "non-existent-adapter-name" },
    context: { cwd: "/cwd", runDir: "/runDir" },
  });

  await assert.rejects(
    () => executeThroughConfinement(req),
    (err) => {
      assert.ok(err instanceof RunnerConfigError);
      assert.match(err.message, /no executor adapter registered for "non-existent-adapter-name"/);
      return true;
    },
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

test("Red-team MEDIUM: ExecutorResult attaches confinement attestation per R5 deliberate contract", async () => {
  // Per Phase 02 R5 contract ('confinement attestation attached where the caller can carry it'),
  // successful execution attaches an attestation key while preserving external result fields.
  const fakeAdapter = async () => ({ status: 0, stdout: "output", stderr: "" });
  const req = buildConfinementRequest({
    capability: "rt-cap",
    executorId: "rt-exec",
    invocation: { command: "echo", args: [] },
    context: { cwd: "/cwd", runDir: "/runDir" },
  });

  const res = await executeThroughConfinement(req, fakeAdapter);
  assert.equal(res.status, "completed");
  assert.equal(res.result.status, 0);
  assert.equal(res.stdout, "output");
  assert.equal(res.stderr, "");
  assert.ok("attestation" in res, "attestation key is present per R5 contract");
  assert.equal(res.attestation.contract, "confinement-attestation.v1");
});

test("HIGH-1 regression: fake adapter returning status/contract/result does not clobber spec 6.9 tokens", async () => {
  const fakeAdapter = async () => ({
    status: 123,
    contract: "custom-adapter.v9",
    result: { custom: true },
    stdout: "adapter stdout",
    stderr: "",
  });

  const req = buildConfinementRequest({
    capability: "high1-cap",
    executorId: "high1-exec",
    invocation: { command: "echo", args: [] },
    context: { cwd: "/cwd", runDir: "/runDir" },
  });

  const res = await executeThroughConfinement(req, fakeAdapter);
  assert.equal(res.contract, "confinement-execution.v1", "spec 6.9 contract token is preserved");
  assert.equal(res.status, "completed", "spec 6.9 status token is completed, not adapter status 123");
  assert.ok(res.attestation, "attestation is attached");
  assert.equal(res.result.status, 123, "wrapped result preserves adapter status");
  assert.equal(res.result.contract, "custom-adapter.v9", "wrapped result preserves adapter contract");
  assert.deepEqual(res.result.result, { custom: true }, "wrapped result preserves adapter result key");
});

test("MED-1: required policy on execute, advise, and stage names binds on spawnWorker", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fgos-med1-test-"));
  try {
    const baseCfg = {
      executors: {
        claude: {
          command: "claude",
          adapter: "cli-spawn",
          args: ["-p", "{prompt}"],
          invocations: [{ via: "cli", command: "claude", args: ["-p", "{prompt}"] }],
        },
      },
      executor: {
        command: "claude",
        adapter: "cli-spawn",
        args: ["-p", "{prompt}"],
        invocations: [{ via: "cli", command: "claude", args: ["-p", "{prompt}"] }],
      },
      modelPolicies: {
        claude: { standard: "sonnet" },
      },
    };

    // 1. Required policy on 'execute'
    const cfgExecute = {
      ...baseCfg,
      capabilities: {
        execute: { confinement: { mode: "required", policy: "workspace-write" } },
      },
    };
    await assert.rejects(
      () => spawnWorker({ id: "w-exec", domain: "coding", stage: "executing", tier: "standard" }, cfgExecute, tmpDir, { fgosDir: path.join(tmpDir, ".fgos") }),
      (err) => {
        assert.ok(err instanceof DispatchError);
        assert.equal(err.errorClass, "confinement-unsupported");
        assert.equal(err.capability, "execute");
        return true;
      },
    );

    // 2. Required policy on 'advise'
    const cfgAdvise = {
      ...baseCfg,
      capabilities: {
        advise: { confinement: { mode: "required", policy: "workspace-write" } },
      },
    };
    await assert.rejects(
      () => spawnWorker({ id: "w-adv", domain: "coding", stage: "exploring", kind: "advise", tier: "standard" }, cfgAdvise, tmpDir, { fgosDir: path.join(tmpDir, ".fgos") }),
      (err) => {
        assert.ok(err instanceof DispatchError);
        assert.equal(err.errorClass, "confinement-unsupported");
        assert.equal(err.capability, "advise");
        return true;
      },
    );

    // 3. Required policy on domain-folded stage name 'discovery'
    const cfgDiscovery = {
      ...baseCfg,
      capabilities: {
        discovery: { confinement: { mode: "required", policy: "workspace-write" } },
      },
    };
    await assert.rejects(
      () => spawnWorker({ id: "w-disc", domain: "coding", stage: "discovery", tier: "standard" }, cfgDiscovery, tmpDir, { fgosDir: path.join(tmpDir, ".fgos") }),
      (err) => {
        assert.ok(err instanceof DispatchError);
        assert.equal(err.errorClass, "confinement-unsupported");
        assert.equal(err.capability, "discovery");
        return true;
      },
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("MED-2: spawnWorker and executeExecutorCli agree on capability identity for research domain", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fgos-med2-test-"));
  try {
    const cfg = {
      capabilities: {
        "code:implement": { confinement: { mode: "required", policy: "workspace-write" } },
      },
      executors: {
        "agy-cli": {
          command: "agy",
          adapter: "cli-spawn",
          args: ["-p", "{prompt}"],
          invocations: [{ via: "cli", command: "agy", args: ["-p", "{prompt}"] }],
        },
      },
      executor: {
        command: "agy",
        adapter: "cli-spawn",
        args: ["-p", "{prompt}"],
        invocations: [{ via: "cli", command: "agy", args: ["-p", "{prompt}"] }],
      },
      modelPolicies: {
        claude: { standard: "sonnet" },
        gemini: { standard: "gemini-flash" },
      },
    };

    const researchWork = { id: "w-research", domain: "research", stage: "executing", tier: "standard" };

    let spawnRefusedCap;
    try {
      await spawnWorker(researchWork, cfg, tmpDir, { fgosDir: path.join(tmpDir, ".fgos") });
    } catch (err) {
      spawnRefusedCap = err.capability;
    }
    assert.equal(spawnRefusedCap, "code:implement", "spawnWorker folded research domain to coding and resolved code:implement");

    let cliRefusedCap;
    try {
      await executeExecutorCli("fgos-coding-implement", {
        work: researchWork,
        stage: "executing",
        repoRoot: tmpDir,
        cwd: tmpDir,
        runnerConfig: cfg,
        fgosDir: path.join(tmpDir, ".fgos"),
        tier: "standard",
      });
    } catch (err) {
      cliRefusedCap = err.capability;
    }
    assert.equal(cliRefusedCap, "code:implement", "executeExecutorCli folded research domain to coding and resolved code:implement identically");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("MED-3: executor for[] order does not affect capability resolution or required refusal", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fgos-med3-test-"));
  try {
    const cfgA = {
      capabilities: {
        "code:review": { confinement: { mode: "required", policy: "workspace-write" } },
      },
      executors: {
        "multi-order-a": {
          command: "echo",
          adapter: "cli-spawn",
          allowCrossProvider: true,
          for: ["advise", "code:review"],
          invocations: [{ via: "cli", command: "echo", args: [] }],
        },
      },
      modelPolicies: { claude: { standard: "sonnet" } },
    };

    const cfgB = {
      capabilities: {
        "code:review": { confinement: { mode: "required", policy: "workspace-write" } },
      },
      executors: {
        "multi-order-b": {
          command: "echo",
          adapter: "cli-spawn",
          allowCrossProvider: true,
          for: ["code:review", "advise"],
          invocations: [{ via: "cli", command: "echo", args: [] }],
        },
      },
      modelPolicies: { claude: { standard: "sonnet" } },
    };

    let refusedCapA;
    try {
      await executeExecutorCli("multi-order-a", {
        repoRoot: tmpDir,
        cwd: tmpDir,
        runnerConfig: cfgA,
        fgosDir: path.join(tmpDir, ".fgos"),
        tier: "standard",
      });
    } catch (err) {
      refusedCapA = err.capability;
    }

    let refusedCapB;
    try {
      await executeExecutorCli("multi-order-b", {
        repoRoot: tmpDir,
        cwd: tmpDir,
        runnerConfig: cfgB,
        fgosDir: path.join(tmpDir, ".fgos"),
        tier: "standard",
      });
    } catch (err) {
      refusedCapB = err.capability;
    }

    assert.equal(refusedCapA, "code:review", "order ['advise', 'code:review'] binds required policy");
    assert.equal(refusedCapB, "code:review", "order ['code:review', 'advise'] binds required policy identically");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
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

  const att = buildConfinementAttestation({ request: req });
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

test("MED-5: fail-closed policy errors produce structured DispatchError with attestation and settled run.json", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fgos-med5-test-"));
  const fgosDir = path.join(tmpDir, ".fgos");
  fs.mkdirSync(fgosDir, { recursive: true });

  try {
    const cfg = {
      capabilities: {
        "code:implement": {
          confinement: { mode: "required", policy: "non-existent-policy" },
        },
      },
      executors: {
        "agy-cli": {
          command: "agy",
          adapter: "cli-spawn",
          args: ["-p", "{prompt}"],
          invocations: [{ via: "cli", command: "agy", args: ["-p", "{prompt}"] }],
        },
      },
      executor: {
        command: "agy",
        adapter: "cli-spawn",
        args: ["-p", "{prompt}"],
        invocations: [{ via: "cli", command: "agy", args: ["-p", "{prompt}"] }],
      },
      modelPolicies: { claude: { standard: "sonnet" }, gemini: { standard: "gemini-flash" } },
    };

    let caughtErr;
    try {
      await spawnWorker(
        { id: "wleak", domain: "coding", stage: "executing", tier: "standard" },
        cfg,
        tmpDir,
        { fgosDir },
      );
    } catch (err) {
      caughtErr = err;
    }

    assert.ok(caughtErr, "error must be thrown");
    assert.ok(caughtErr instanceof DispatchError, "must be a DispatchError");
    assert.equal(caughtErr.errorClass, "confinement-policy-error");
    assert.equal(caughtErr.status, "refused");
    assert.ok(caughtErr.dispatchId, "dispatchId must be present");
    assert.ok(caughtErr.attestation, "attestation must be attached");
    assert.equal(caughtErr.attestation.phase, "refused");
    assert.equal(caughtErr.attestation.outcome, "refused");

    // Check that run.json is NOT left at status 'running'
    const runsBase = path.join(fgosDir, "dispatch-runs", "wleak");
    const runSubdirs = fs.readdirSync(runsBase);
    assert.ok(runSubdirs.length > 0, "run directory must exist");
    const runJsonPath = path.join(runsBase, runSubdirs[0], "run.json");
    const runRecord = JSON.parse(fs.readFileSync(runJsonPath, "utf8"));
    assert.equal(runRecord.status, "settled", "run.json must be closed at settled, never stuck at running");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
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

    const att = buildConfinementAttestation({ request: req });

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
  const bindAllAtt = buildConfinementAttestation({ request: bindAllReq });
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
  const unshareUserAtt = buildConfinementAttestation({ request: unshareUserReq });
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
  const widerRebindAtt = buildConfinementAttestation({ request: widerRebindReq });
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
  const pidOnlyAtt = buildConfinementAttestation({ request: pidOnlyReq });
  assert.equal(pidOnlyAtt.effectiveControls.process, "isolated", "--unshare-pid grants process: isolated");
  assert.equal(pidOnlyAtt.coverage["control:process"], "satisfied");
  assert.notEqual(pidOnlyAtt.effectiveControls.hostWrite, "deny");
  assert.equal(pidOnlyAtt.coverage["control:hostWrite"], "unverified");
});

