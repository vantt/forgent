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

  assert.equal(res.status, 0);
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
      args: ["--ro-bind", "/", "/"],
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
  assert.equal(res.status, 0);
  assert.equal(res.stdout, "output");
  assert.equal(res.stderr, "");
  assert.ok("attestation" in res, "attestation key is present per R5 contract");
  assert.equal(res.attestation.contract, "confinement-attestation.v1");
});
