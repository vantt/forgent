// test/runner/dispatch-confinement-p05.test.mjs
// Comprehensive test suite for Phase 05: Herdr and Legacy Confinement Convergence (R1-R6)
// Spec: docs/platform/agent-confinement/spec.md, plans/.../phase-05-herdr-and-legacy-convergence.md

import '../helpers/process-tmp-root.mjs';
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import {
  assessAndPrepare,
  buildConfinementAttestation,
} from "../../src/runner/dispatch/confinement/authority.mjs";
import {
  buildConfinementRequest,
  validateConfinementRequest,
} from "../../src/runner/dispatch/confinement/request.mjs";
import {
  normalizeLegacyConfinement,
} from "../../src/runner/dispatch/confinement/policies.mjs";
import { establishConfinement } from "../../src/runner/dispatch/herdr-round.mjs";
import { evaluateBypassPairing } from "../../src/runner/dispatch/confinement/bypass-pairing.mjs";
import { checkConfinementHerdrMaturity } from "../../src/setup/registrations.mjs";
import { DispatchError } from "../../src/runner/dispatch/transport.mjs";
import { writeProjectConfig } from '../helpers/config-fixture.mjs';
import { initFixtureRepo } from '../helpers/git-fixture.mjs';
import { readStandardValue } from '../../src/config/facade.mjs';

function mkTemp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// ─── R1: Legacy Flag Normalization to v1 Policy Controls ──────────────────────

test("R1: normalizeLegacyConfinement converts legacy flags to canonical v1 controls", () => {
  const legacy = {
    privateHome: true,
    isolatedSession: true,
    ownWorktree: true,
  };

  const normalized = normalizeLegacyConfinement(legacy);
  assert.equal(normalized.contract, "confinement-policy.v1");
  assert.equal(normalized.controls.home, "private");
  assert.equal(normalized.controls.session, "isolated");
  assert.equal(normalized.controls.workspace, "own");
  assert.ok(normalized.grants.some((g) => g.resource === "private-home"));
});

test("R1: normalizeLegacyConfinement handles partial legacy flags", () => {
  const onlyHome = normalizeLegacyConfinement({ privateHome: true });
  assert.equal(onlyHome.controls.home, "private");
  assert.equal(onlyHome.controls.session, "shared");
  assert.equal(onlyHome.controls.workspace, "shared");

  const onlySession = normalizeLegacyConfinement({ isolatedSession: true });
  assert.equal(onlySession.controls.session, "isolated");
  assert.equal(onlySession.controls.home, "host");
  assert.equal(onlySession.controls.workspace, "shared");

  const onlyWorktree = normalizeLegacyConfinement({ ownWorktree: true });
  assert.equal(onlyWorktree.controls.workspace, "own");
  assert.equal(onlyWorktree.controls.home, "host");
  assert.equal(onlyWorktree.controls.session, "shared");
});

test("R1: normalizeLegacyConfinement preserves v1 policy controls if passed v1 shape", () => {
  const v1 = {
    contract: "confinement-policy.v1",
    controls: {
      home: "private",
      session: "isolated",
      workspace: "own",
    },
    grants: [{ resource: "private-home", access: "read-write" }],
  };

  const normalized = normalizeLegacyConfinement(v1);
  assert.equal(normalized.contract, "confinement-policy.v1");
  assert.equal(normalized.controls.home, "private");
  assert.equal(normalized.controls.session, "isolated");
  assert.equal(normalized.controls.workspace, "own");
  assert.equal(normalized.grants.length, 1);
});

test("R1: buildConfinementRequest normalizes legacy flags on invocation.confinement", () => {
  const runDir = mkTemp("p05-r1-req-");
  const req = buildConfinementRequest({
    capability: "code:implement",
    executorId: "herdr-agent",
    invocation: {
      command: "claude",
      adapter: "herdr-spawn",
      confinement: {
        privateHome: true,
        isolatedSession: true,
        ownWorktree: true,
      },
    },
    context: {
      cwd: "/worktree/repo",
      repoRoot: "/main/repo",
      runDir,
    },
  });

  assert.equal(req.invocation.confinement.contract, "confinement-policy.v1");
  assert.equal(req.invocation.confinement.controls.home, "private");
  assert.equal(req.invocation.confinement.controls.session, "isolated");
  assert.equal(req.invocation.confinement.controls.workspace, "own");

  fs.rmSync(runDir, { recursive: true, force: true });
});

// ─── R3: Pre-Adapter Preparation & Partial Maturity Attestation ────────────────

test("R3: Authority preparation refuses ownWorktree in repo root with own-worktree-unavailable", async () => {
  const rootDir = mkTemp("p05-r3-reporoot-");
  const runDir = path.join(rootDir, "rundir");
  fs.mkdirSync(runDir, { recursive: true });

  const req = buildConfinementRequest({
    capability: "code:implement",
    executorId: "test-herdr",
    invocation: {
      command: "claude",
      adapter: "herdr-spawn",
      interactiveMode: { exitCommand: "/exit", kind: "claude" },
      confinement: {
        ownWorktree: true,
      },
    },
    context: {
      cwd: rootDir,
      repoRoot: rootDir, // cwd is repo root
      runDir,
    },
  });

  await assert.rejects(
    () => assessAndPrepare(req),
    (err) => {
      assert.equal(err.errorClass, "invalid-config");
      assert.equal(err.reason, "own-worktree-unavailable");
      assert.equal(err.contract, "confinement-execution.v1");
      assert.equal(err.status, "refused");
      assert.ok(err.attestation, "refused attestation must be attached to error");
      return true;
    },
  );

  fs.rmSync(rootDir, { recursive: true, force: true });
});

test("R3: herdr-spawn attestation includes herdr-partial-maturity mismatch and evidence", async () => {
  const runDir = mkTemp("p05-r3-mismatch-");

  const req = buildConfinementRequest({
    capability: "code:implement",
    executorId: "test-herdr",
    invocation: {
      command: "claude",
      adapter: "herdr-spawn",
      interactiveMode: { exitCommand: "/exit", kind: "claude" },
      confinement: {
        privateHome: true,
      },
    },
    context: {
      cwd: "/repo/worktree",
      repoRoot: "/repo",
      runDir,
    },
  });

  const att = buildConfinementAttestation({ request: req, phase: "prepared" });
  assert.ok(att.mismatches.some((m) => m.code === "herdr-partial-maturity"));
  assert.ok(att.evidence.some((e) => e.ref === "herdr-partial-maturity:herdr-round"));

  fs.rmSync(runDir, { recursive: true, force: true });
});

// ─── R5: Bypass Refusal Without Full Confinement ──────────────────────────────

test("R5: permissionMode: 'bypass' without full confinement is refused before spawn", async () => {
  const runDir = mkTemp("p05-r5-bypass-refuse-");

  // Missing privateHome and isolatedSession
  const req = buildConfinementRequest({
    capability: "code:implement",
    executorId: "bypass-agent",
    invocation: {
      command: "claude",
      adapter: "herdr-spawn",
      permissionMode: "bypass",
      interactiveMode: { exitCommand: "/exit", kind: "claude" },
      confinement: {
        ownWorktree: true, // incomplete!
      },
    },
    context: {
      cwd: "/tmp/worktree",
      repoRoot: "/tmp/repo",
      runDir,
    },
  });

  await assert.rejects(
    () => assessAndPrepare(req),
    (err) => {
      assert.equal(err.errorClass, "invalid-config");
      assert.equal(err.reason, "bypass-confinement-incomplete");
      assert.equal(err.status, "refused");
      assert.match(err.message, /requires full confinement/);
      return true;
    },
  );

  fs.rmSync(runDir, { recursive: true, force: true });
});

test("R5: permissionMode: 'bypass' with full v1 controls passes the preparation gate", async () => {
  const runDir = mkTemp("p05-r5-bypass-ok-");

  const req = buildConfinementRequest({
    capability: "code:implement",
    executorId: "bypass-agent",
    invocation: {
      command: "claude",
      adapter: "herdr-spawn",
      permissionMode: "bypass",
      interactiveMode: { exitCommand: "/exit", kind: "claude" },
      confinement: {
        workspace: "own",
        home: "private",
        session: "isolated",
      },
    },
    context: {
      cwd: "/tmp/worktree",
      repoRoot: "/tmp/repo",
      runDir,
    },
  });

  await assert.doesNotReject(() => assessAndPrepare(req));

  fs.rmSync(runDir, { recursive: true, force: true });
});

test("R5: direct establishConfinement with permissionMode: 'bypass' and only ownWorktree hard-refuses via evaluateBypassPairing", async () => {
  const tmpBase = mkTemp("p05-direct-bypass-");
  const repoRoot = path.join(tmpBase, "repo");
  const cwd = path.join(repoRoot, "worktree");
  fs.mkdirSync(cwd, { recursive: true });

  const mockRound = {
    workId: "w-direct-bypass-incomplete",
    agentName: "worker-direct-bypass",
    note: () => {},
    fail: (errorClass, reason, message) => {
      const err = new Error(message);
      err.errorClass = errorClass;
      err.reason = reason;
      return err;
    },
  };

  await assert.rejects(
    () =>
      establishConfinement({
        confinement: { ownWorktree: true },
        round: mockRound,
        fullEnv: { HOME: os.homedir() },
        cwd,
        repoRoot,
        permissionMode: "bypass",
      }),
    (err) => {
      assert.equal(err.errorClass, "invalid-config");
      assert.equal(err.reason, "bypass-confinement-incomplete");
      assert.match(err.message, /permissionMode "bypass" requires full confinement/);
      assert.match(err.message, /home: private \(privateHome\)/);
      assert.match(err.message, /session: isolated \(isolatedSession\)/);
      return true;
    },
  );

  fs.rmSync(tmpBase, { recursive: true, force: true });
});

test("R5: direct establishConfinement with permissionMode: 'bypass' and only v1 controls.workspace='own' hard-refuses via evaluateBypassPairing", async () => {
  // Same incomplete-pairing scenario as the legacy-flag test above, but
  // expressed as confinement-policy.v1-shaped input (controls.workspace)
  // instead of the legacy ownWorktree flag, to prove both input shapes are
  // refused identically at this entry point.
  const tmpBase = mkTemp("p05-direct-bypass-v1-");
  const repoRoot = path.join(tmpBase, "repo");
  const cwd = path.join(repoRoot, "worktree");
  fs.mkdirSync(cwd, { recursive: true });

  const mockRound = {
    workId: "w-direct-bypass-v1-incomplete",
    agentName: "worker-direct-bypass-v1",
    note: () => {},
    fail: (errorClass, reason, message) => {
      const err = new Error(message);
      err.errorClass = errorClass;
      err.reason = reason;
      return err;
    },
  };

  await assert.rejects(
    () =>
      establishConfinement({
        confinement: {
          contract: "confinement-policy.v1",
          controls: { workspace: "own" }, // incomplete: no home/session controls
        },
        round: mockRound,
        fullEnv: { HOME: os.homedir() },
        cwd,
        repoRoot,
        permissionMode: "bypass",
      }),
    (err) => {
      assert.equal(err.errorClass, "invalid-config");
      assert.equal(err.reason, "bypass-confinement-incomplete");
      assert.match(err.message, /permissionMode "bypass" requires full confinement/);
      assert.match(err.message, /home: private \(privateHome\)/);
      assert.match(err.message, /session: isolated \(isolatedSession\)/);
      // controls.workspace: "own" must be recognized as satisfying ownWorktree,
      // so "workspace: own (ownWorktree)" must NOT be listed as missing.
      assert.doesNotMatch(err.message, /workspace: own \(ownWorktree\)/);
      return true;
    },
  );

  fs.rmSync(tmpBase, { recursive: true, force: true });
});

test("R5: evaluateBypassPairing table test covers valid and invalid pairings", () => {
  // 1. Non-bypass cases always pass regardless of controls
  assert.deepEqual(
    evaluateBypassPairing({
      isBypass: false,
      hasOwnWorktree: false,
      hasPrivateHome: false,
      hasIsolatedSession: false,
    }),
    { satisfied: true, missing: [] },
  );
  assert.deepEqual(
    evaluateBypassPairing({
      isBypass: false,
      hasOwnWorktree: true,
      hasPrivateHome: false,
      hasIsolatedSession: true,
    }),
    { satisfied: true, missing: [] },
  );

  // 2. Complete valid pairing passes under bypass
  assert.deepEqual(
    evaluateBypassPairing({
      isBypass: true,
      hasOwnWorktree: true,
      hasPrivateHome: true,
      hasIsolatedSession: true,
    }),
    { satisfied: true, missing: [] },
  );

  // 3. Each incomplete/invalid pairing shape under bypass
  const invalidCases = [
    {
      name: "missing all controls",
      input: { isBypass: true, hasOwnWorktree: false, hasPrivateHome: false, hasIsolatedSession: false },
      expectedMissing: [
        "home: private (privateHome)",
        "session: isolated (isolatedSession)",
        "workspace: own (ownWorktree)",
      ],
    },
    {
      name: "only ownWorktree (missing home and session)",
      input: { isBypass: true, hasOwnWorktree: true, hasPrivateHome: false, hasIsolatedSession: false },
      expectedMissing: [
        "home: private (privateHome)",
        "session: isolated (isolatedSession)",
      ],
    },
    {
      name: "only privateHome (missing session and workspace)",
      input: { isBypass: true, hasOwnWorktree: false, hasPrivateHome: true, hasIsolatedSession: false },
      expectedMissing: [
        "session: isolated (isolatedSession)",
        "workspace: own (ownWorktree)",
      ],
    },
    {
      name: "only isolatedSession (missing home and workspace)",
      input: { isBypass: true, hasOwnWorktree: false, hasPrivateHome: false, hasIsolatedSession: true },
      expectedMissing: [
        "home: private (privateHome)",
        "workspace: own (ownWorktree)",
      ],
    },
    {
      name: "missing session only",
      input: { isBypass: true, hasOwnWorktree: true, hasPrivateHome: true, hasIsolatedSession: false },
      expectedMissing: [
        "session: isolated (isolatedSession)",
      ],
    },
    {
      name: "missing home only",
      input: { isBypass: true, hasOwnWorktree: true, hasPrivateHome: false, hasIsolatedSession: true },
      expectedMissing: [
        "home: private (privateHome)",
      ],
    },
    {
      name: "missing workspace only",
      input: { isBypass: true, hasOwnWorktree: false, hasPrivateHome: true, hasIsolatedSession: true },
      expectedMissing: [
        "workspace: own (ownWorktree)",
      ],
    },
  ];

  for (const c of invalidCases) {
    const result = evaluateBypassPairing(c.input);
    assert.equal(result.satisfied, false, `case "${c.name}" must not be satisfied`);
    assert.deepEqual(result.missing, c.expectedMissing, `case "${c.name}" missing mismatch`);
  }
});

// ─── R6: No OS Confinement Overclaim for herdr Routes ──────────────────────────

test("R6: herdr-spawn attestation marks host-ipc out-of-scope and controls unverified", async () => {
  const runDir = mkTemp("p05-r6-overclaim-");

  const req = buildConfinementRequest({
    capability: "code:implement",
    executorId: "test-herdr",
    invocation: {
      command: "claude",
      adapter: "herdr-spawn",
      interactiveMode: { exitCommand: "/exit", kind: "claude" },
      confinement: {
        isolatedSession: true,
        privateHome: true,
        ownWorktree: true,
      },
    },
    context: {
      cwd: "/repo/worktree",
      repoRoot: "/repo",
      runDir,
    },
  });

  const att = buildConfinementAttestation({ request: req, phase: "prepared" });

  // Outcome must NOT be claimed as "enforced"
  assert.notEqual(att.outcome, "enforced");

  // host-ipc must be out-of-scope for herdr session isolation
  const hostIpc = att.channels.find((c) => c.name === "host-ipc");
  assert.ok(hostIpc);
  assert.equal(hostIpc.coverage, "out-of-scope");
  assert.match(hostIpc.detail, /herdr session isolation is lifecycle hygiene/);

  // Controls must remain unverified because herdr does not use bwrap
  assert.equal(att.coverage["control:session"], "unverified");
  assert.equal(att.coverage["control:home"], "unverified");
  assert.equal(att.coverage["control:workspace"], "unverified");

  fs.rmSync(runDir, { recursive: true, force: true });
});

// ─── Doctor Check: confinement-herdr-maturity ──────────────────────────────────

test("Doctor check: confinement-herdr-maturity reports partial maturity for herdr executors", () => {
  const tmpDir = mkTemp("p05-doctor-");
  initFixtureRepo(tmpDir);
  writeProjectConfig(tmpDir, {
      runner: {
        executors: {
          "herdr-agent": {
            kind: "agent",
            adapter: "herdr-spawn",
            command: "claude",
            interactiveMode: { exitCommand: "/exit", kind: "claude" },
            confinement: {
              privateHome: true,
              isolatedSession: true,
              ownWorktree: true,
            },
          },
        },
      },
    });

  const res = checkConfinementHerdrMaturity(tmpDir);
  assert.equal(res.passed, true);
  assert.equal(res.maturity, "partial");
  assert.match(res.message, /partial/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("Doctor check: confinement-herdr-maturity fails if bypass is missing full controls", () => {
  const tmpDir = mkTemp("p05-doctor-bypass-bad-");
  initFixtureRepo(tmpDir);
  writeProjectConfig(tmpDir, {
      runner: {
        executors: {
          "herdr-agent": {
            kind: "agent",
            adapter: "herdr-spawn",
            command: "claude",
            permissionMode: "bypass",
            interactiveMode: { exitCommand: "/exit", kind: "claude" },
            confinement: {
              ownWorktree: true, // missing privateHome & isolatedSession
            },
          },
        },
      },
    });

  const res = checkConfinementHerdrMaturity(tmpDir);
  assert.equal(res.passed, false);
  assert.equal(res.maturity, "invalid");
  assert.match(res.message, /bypass without full confinement/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("Doctor check: confinement-herdr-maturity reports not-applicable when no herdr executors", () => {
  const tmpDir = mkTemp("p05-doctor-none-");
  initFixtureRepo(tmpDir);
  // The standard ships executors that open a herdr pane first; a project that dispatches nothing through
  // herdr puts each one's headless invocation ahead of its pane invocation.
  const standardExecutors = readStandardValue("runner.executors").value;
  const headlessFirst = Object.fromEntries(Object.entries(standardExecutors).map(([id, executor]) => [id, {
    invocations: [...executor.invocations.filter((i) => i.adapter !== "herdr-spawn"), ...executor.invocations.filter((i) => i.adapter === "herdr-spawn")],
  }]));
  writeProjectConfig(tmpDir, {
      runner: {
        executors: {
          ...headlessFirst,
          "cli-agent": {
            kind: "agent",
            adapter: "cli-spawn",
            command: "node",
          },
        },
      },
    });

  const res = checkConfinementHerdrMaturity(tmpDir);
  assert.equal(res.passed, true);
  assert.equal(res.maturity, "not-applicable");

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
