import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { executeThroughConfinement, buildConfinementAttestation } from "../../src/runner/dispatch/confinement/authority.mjs";
import { buildConfinementRequest, validateConfinementRequest } from "../../src/runner/dispatch/confinement/request.mjs";
import { DispatchError } from "../../src/runner/dispatch/transport.mjs";
import { executeExecutorCli, spawnWorker } from "../../src/runner/dispatch/cli.mjs";
import { loadRunnerConfigFromDir } from "../../src/runner/dispatch/config.mjs";

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
