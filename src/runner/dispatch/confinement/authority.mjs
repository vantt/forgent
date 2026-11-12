// authority.mjs — Agent Confinement Authority runtime execution door
// (docs/platform/agent-confinement/spec.md §1, §5.2; docs/platform/agent-confinement/contracts/confinement-authority-v1.md#6-canonical-contracts §6.6, §6.9).

import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { claudeMcpApprovalArgs, operatorClaudeStorePath } from "../../../run-supervisor/trust-store.mjs";
import { DEFAULT_ADAPTER, resolveExecutorEnv, workerBaseEnv, currentDispatchDepth, DISPATCH_DEPTH_ENV } from "../adapters.mjs";
import { DispatchError } from "../../../run-supervisor/dispatch-error.mjs";
import { validateConfinementRequest, validateAssignmentLaunchContext } from "./request.mjs";
import { DEFAULT_SEAT_TIMEOUT_MS } from "./resources.mjs";
import {
  saveAttestationRecord,
  savePlanRecord,
  assertAttestationStoreIsolated,
  verifyAttestationStoreIsolation,
  loadProbeCacheRecord,
  saveProbeCacheRecord,
} from "./attestation-store.mjs";
import {
  loadMachineBackendRegistry,
  createBackendRegistrySnapshot,
  getBackendDriver,
  credentialScanRoots,
} from "./backend-registry.mjs";
import { computeProbeFingerprint, runAllConfinementProbes } from "./probes/harness.mjs";
import { normalizeLegacyConfinement, requestIsBlind } from "./policies.mjs";
import { evaluateBypassPairing } from "./bypass-pairing.mjs";
import { OWNERSHIP_MARKER_FILE, CREDENTIAL_HOME_KEPT, CREDENTIAL_HOME_HELD, CREDENTIAL_KEEP_MAX_ATTEMPTS, ATTEMPT_HOME_MARKER_CONTRACT, countCredentialKeep, readAttemptHomeRecord, removeAttemptHome, keepSessionTranscript, describeAttemptHome, settleHeldCredentialHomes, MAX_HOME_MARKER_BYTES } from "./cleanup.mjs";
import { writeBackRenewedCredential } from "../provider-credential-renewal.mjs";
import {
  canonicalJson,
  computeSha256Digest,
  publishImmutableProof,
  publishMutableProjection,
  updateCommandEnvelope,
  commitCommandOutcome,
  readAgentFileSync,
} from "../../../native/proof-helpers.mjs";

export {
  DispatchError,
  canonicalJson,
  computeSha256Digest,
  publishImmutableProof,
  publishMutableProjection,
  updateCommandEnvelope,
  commitCommandOutcome,
};

// Persisted launch records keep only these standard shell variables of the worker env, never a value
// that could be a credential; `envDigest`, over the full real env, is the commitment a verifier checks.
const SAFE_ENV_ALLOWLIST = ['PATH', 'HOME', 'LANG', 'LC_ALL', 'TERM', 'SHELL', 'USER', 'LOGNAME', 'PWD', 'TZ', 'NODE_ENV', DISPATCH_DEPTH_ENV];

function redactEnvForPersistence(env) {
  const redacted = {};
  for (const key of SAFE_ENV_ALLOWLIST) {
    if (env && env[key] !== undefined) redacted[key] = env[key];
  }
  return redacted;
}

// Throws the typed refusal even when saving its attestation fails; the save error rides along as `cause`.
function saveAttestationRecordThenThrow(attestation, context, error) {
  try {
    saveAttestationRecord(attestation, context);
  } catch (saveErr) {
    error.cause = saveErr;
  }
  throw error;
}

function applyBackendPlanToAttestation(attestation, backendPlan) {
  if (!backendPlan) return attestation;
  attestation.coverage = backendPlan.coverage;
  attestation.resources = backendPlan.resources;
  attestation.readiness = backendPlan.readiness;
  attestation.grants = backendPlan.grants;
  attestation.backend = backendPlan.backend;
  // What a blind dispatch could not read, as resolved for this dispatch.
  const hiddenRoots = (backendPlan.resources || []).filter((r) => r.resource === "hidden-root").map((r) => r.hostTarget);
  if (hiddenRoots.length > 0) attestation.hiddenRoots = hiddenRoots;
  if (Array.isArray(backendPlan.mismatches)) {
    const existingCodes = new Set((attestation.mismatches || []).map((m) => m.code));
    attestation.mismatches = [
      ...(attestation.mismatches || []),
      ...backendPlan.mismatches.filter((m) => !existingCodes.has(m.code)),
    ];
  }
  return attestation;
}

function requiredCoverageFailures(policy, coverage) {
  const failures = [];
  for (const control of Object.keys(policy?.controls || {})) {
    const key = `control:${control}`;
    if (coverage[key] !== "satisfied") failures.push({ key, coverage: coverage[key] ?? "unknown" });
  }
  for (const grant of policy?.grants || []) {
    // Spec §6.6/§6.9: a resource grant is optional by default.  In particular,
    // built-in executor-credentials remains honestly unverified when absent,
    // but is deliberately not allowed to make an otherwise verified dispatch
    // refuse or degrade.
    if (grant.optional === false) {
      const key = `grant:${grant.resource}`;
      if (coverage[key] !== "satisfied") failures.push({ key, coverage: coverage[key] ?? "unknown" });
    }
  }
  return failures;
}

function verifyRequiredProbe(request, backendInstance, driver) {
  if (backendInstance.type !== "bwrap") {
    return { passed: false, message: `no falsification probe profile for backend type "${backendInstance.type}"` };
  }
  const executable = backendInstance.config?.executable || "bwrap";
  // A blind dispatch needs the blind-read probe on top of the standard set, and its own cache entry.
  const blind = requestIsBlind(request);
  const fingerprint = computeProbeFingerprint({
    policy: request.requirement.policy,
    driverVersion: driver.version,
    backendConfig: backendInstance.config || {},
    bwrapExecutable: executable,
    blind,
  });

  const cached = loadProbeCacheRecord(fingerprint, request?.context);
  if (cached) {
    return {
      ...cached,
      fingerprint,
    };
  }

  const result = runAllConfinementProbes({ bwrapBin: executable, blind });
  if (result.passed) {
    try {
      saveProbeCacheRecord(fingerprint, result, request?.context);
    } catch {
      // Best-effort cache save
    }
  }

  return {
    ...result,
    fingerprint,
  };
}

const isRootPath = (p) => p === "/" || p === "";

// The controls a hand-written bwrap argv sets up, read from its options before `--`. A bind is
// either one string ("--bind <src> <dest>") or the flag followed by its two arguments.
function observeBwrapArgv(rawArgs, repoRoot) {
  const dashDashIdx = rawArgs.indexOf("--");
  const bwrapOptions = dashDashIdx >= 0 ? rawArgs.slice(0, dashDashIdx) : rawArgs;
  const seen = { hasHostWriteDeny: false, hasProcessIsolation: false, hasSessionIsolation: false, hasPrivateHome: false, hasOwnWorkspace: false, writableBinds: [] };
  let hasRoRoot = false;
  let hasWiderWritableRebind = false;
  let declaredHomeTarget = null;

  for (let i = 0; i < bwrapOptions.length; i++) {
    const arg = bwrapOptions[i];
    if (typeof arg !== "string") continue;

    let flag = arg;
    let src;
    let dest;
    if (/^--(ro-bind|bind|dev-bind)(-try)? /.test(arg)) {
      [flag, src, dest] = arg.trim().split(/\s+/);
    } else if (/^--(ro-bind|bind|dev-bind)(-try)?$/.test(arg)) {
      src = bwrapOptions[i + 1];
      dest = bwrapOptions[i + 2];
      i += 2;
    }

    if (arg === "--unshare-pid" || arg === "--unshare-all") {
      seen.hasProcessIsolation = true;
    } else if (flag === "--ro-bind" || flag === "--ro-bind-try") {
      if (isRootPath(src) && isRootPath(dest)) hasRoRoot = true;
    } else if (flag === "--bind" || flag === "--bind-try" || flag === "--dev-bind" || flag === "--dev-bind-try") {
      if (isRootPath(dest)) {
        hasWiderWritableRebind = true;
      } else if (typeof dest === "string" && dest) {
        seen.writableBinds.push({ src, dest });
        if (repoRoot && src === repoRoot && dest !== src) seen.hasOwnWorkspace = true;
      }
    } else if (arg === '--setenv' && bwrapOptions[i + 1] === 'HOME' && typeof bwrapOptions[i + 2] === 'string') {
      declaredHomeTarget = bwrapOptions[i + 2];
      i += 2;
    }

    if (arg === "--unshare-ipc" || arg === "--unshare-all") seen.hasSessionIsolation = true;
  }

  seen.hasPrivateHome = Boolean(declaredHomeTarget) && seen.writableBinds.some(
    (bind) => bind.dest === declaredHomeTarget && bind.src !== declaredHomeTarget,
  );
  seen.hasHostWriteDeny = hasRoRoot && !hasWiderWritableRebind;
  return seen;
}

// What the launch is observed to enforce: the driver's claims when it prepared the sandbox, else a
// hand-written bwrap argv, else nothing.
function observedControls(request, driverClaims) {
  if (driverClaims && typeof driverClaims === "object") {
    const satisfied = (control) => driverClaims[`control:${control}`] === "satisfied";
    return {
      hasHostWriteDeny: satisfied("hostWrite"),
      hasProcessIsolation: satisfied("process"),
      hasSessionIsolation: satisfied("session"),
      hasPrivateHome: satisfied("home"),
      hasOwnWorkspace: satisfied("workspace"),
      writableBinds: [],
    };
  }
  if (request.invocation?.command === "bwrap" && Array.isArray(request.invocation?.args)) {
    return observeBwrapArgv(request.invocation.args, request.context?.repoRoot);
  }
  return { hasHostWriteDeny: false, hasProcessIsolation: false, hasSessionIsolation: false, hasPrivateHome: false, hasOwnWorkspace: false, writableBinds: [] };
}

/**
 * Build a canonical ConfinementAttestationV1 (spec §6.6). `phase` is what the launch has reached:
 * "refused" or "prepared", the only two any caller records.
 */
export function buildConfinementAttestation({
  request,
  phase,
  outcome = null,
  driverClaims = null,
} = {}) {
  const reqMode = request.requirement.mode;
  const isExplicitUnconfined = reqMode === "unconfined" && !request.requirement?.omitted;
  // A legacy omitted policy observes as unknown, never as enforced.
  const determinedOutcome = outcome
    || (phase === "refused" ? "refused" : isExplicitUnconfined ? "unconfined" : "unknown");

  const legacy =
    request.requirement?.legacy ||
    (request.invocation?.confinement
      ? normalizeLegacyConfinement(request.invocation.confinement)
      : null);
  const hasBwrapCmd = request.invocation?.command === "bwrap";
  const {
    hasHostWriteDeny, hasProcessIsolation, hasSessionIsolation, hasPrivateHome, hasOwnWorkspace, writableBinds,
  } = observedControls(request, driverClaims);

  const isVerifiedBwrap = hasHostWriteDeny || hasProcessIsolation;
  const isHeuristicBwrap =
    !isVerifiedBwrap &&
    (hasBwrapCmd ||
      request.executorId?.includes?.("bwrap") ||
      (Array.isArray(request.invocation?.args) && request.invocation.args.includes("bwrap")));
  const bwrapNamed = hasBwrapCmd || isHeuristicBwrap;

  const effectiveControls = {
    ...(legacy?.controls ? { ...legacy.controls } : {}),
    ...(hasHostWriteDeny ? { hostWrite: "deny" } : {}),
    ...(hasProcessIsolation ? { process: "isolated" } : {}),
    // The driver claims it satisfied the request's own hostRead: blind.
    ...(requestIsBlind(request) && driverClaims?.["control:hostRead"] === "satisfied" ? { hostRead: "blind" } : {}),
  };

  const coverage = {};
  if (driverClaims && typeof driverClaims === "object") {
    for (const [k, v] of Object.entries(driverClaims)) {
      coverage[k] = v;
    }
  } else {
    if (hasHostWriteDeny) {
      coverage["control:hostWrite"] = "satisfied";
    } else if (bwrapNamed) {
      coverage["control:hostWrite"] = "unverified";
    }

    if (hasProcessIsolation) {
      coverage["control:process"] = "satisfied";
    } else if (bwrapNamed) {
      coverage["control:process"] = "unverified";
    }

    if (legacy?.controls?.session === "isolated") {
      coverage["control:session"] = hasSessionIsolation ? "satisfied" : "unverified";
    }
    if (legacy?.controls?.workspace === "own") {
      coverage["control:workspace"] = hasOwnWorkspace ? "satisfied" : "unverified";
    }
    if (legacy?.controls?.home === "private") {
      coverage["control:home"] = hasPrivateHome ? "satisfied" : "unverified";
    }
  }

  // A legacy grant names an abstract resource whose path the adapter allocates later: its target is
  // the known home directory, else the resource name itself.
  const grants = [
    ...(legacy?.grants
      ? legacy.grants.map((g) => ({
          ...g,
          target: request.context?.homeDir ?? g.resource,
        }))
      : []),
  ];
  if (isVerifiedBwrap && !grants.some((g) => g.resource === "run-output")) {
    grants.push({
      resource: "run-output",
      access: "write",
      target: request.context?.runDir ?? "run-output",
    });
  }
  if (hasHostWriteDeny) {
    for (const wb of writableBinds) {
      const resource =
        wb.dest.endsWith(".fgos/assignments") || wb.dest.endsWith("/assignments")
          ? "assignments"
          : (path.basename(wb.dest) || "writable-exception");
      if (!grants.some((g) => g.target === wb.dest || g.resource === resource)) {
        grants.push({
          resource,
          access: "read-write",
          target: wb.dest,
        });
      }
    }
  }

  const isHerdrSpawn = request.invocation?.adapter === "herdr-spawn";
  const sessionIsolated = legacy?.controls?.session === "isolated";
  const hostIpcCovered = !isHerdrSpawn && isVerifiedBwrap && sessionIsolated;
  const sandboxChannel = (name, covered) => ({
    name,
    coverage: covered ? "covered" : bwrapNamed ? "unverified" : "unknown",
    detail: covered
      ? (driverClaims ? "driver-verified confinement control" : "observed hand-written bwrap sandbox")
      : bwrapNamed
        ? "observe-mode: heuristic bwrap name detected but sandbox unverified"
        : (request.requirement?.policyId
            ? `observe-mode: unverified execution for policy ${request.requirement.policyId}`
            : "observe-mode: no policy declared"),
  });
  const channels = isExplicitUnconfined
    ? ["filesystem", "inherited-fd", "stdio", "host-ipc", "network"]
        .map((name) => ({ name, coverage: "out-of-scope", detail: "explicitly unconfined" }))
    : [
        sandboxChannel("filesystem", hasHostWriteDeny),
        sandboxChannel("inherited-fd", isVerifiedBwrap),
        { name: "stdio", coverage: "unknown", detail: "observe-mode: stdio unmanaged" },
        {
          name: "host-ipc",
          coverage: hostIpcCovered ? "covered" : "out-of-scope",
          detail: hostIpcCovered
            ? "observed legacy isolated session with verified bwrap"
            : isHerdrSpawn && sessionIsolated
              ? "observe-mode: herdr session isolation is lifecycle hygiene, not OS IPC confinement"
              : "observe-mode: host IPC unmanaged",
        },
        { name: "network", coverage: "out-of-scope", detail: "observe-mode: network unmanaged" },
      ];

  const mismatches = isHerdrSpawn
    ? [{ code: "herdr-partial-maturity", detail: "herdr-spawn session/home lifecycle remains in adapter; pre-adapter preparation partially mature." }]
    : [];

  const observation = (ref) => ({ kind: "structural-observation", ref, freshness: "current" });
  const evidence = [observation(`dispatch:${request.dispatchId}`)];
  if (isHerdrSpawn) evidence.push(observation("herdr-partial-maturity:herdr-round"));
  if (isVerifiedBwrap) evidence.push(observation(`bwrap-argv:${request.executorId}`));
  else if (isHeuristicBwrap) evidence.push(observation(`bwrap-heuristic:${request.executorId}`));
  if (legacy) evidence.push(observation(`legacy-confinement:${request.executorId}`));
  if (isExplicitUnconfined) {
    evidence.push({
      kind: "explicit-opt-out",
      ref: "policy:unconfined",
      detail: "explicit unconfined policy declared; running unconfined with audited opt-out",
      freshness: "current",
    });
  }

  return {
    contract: "confinement-attestation.v1",
    dispatchId: request.dispatchId,
    phase,
    outcome: determinedOutcome,
    // The bypass-pairing decision gates dispatch on this value; recorded so an audit need not rebuild it.
    permissionMode: request.invocation?.permissionMode ?? null,
    requested: {
      mode: reqMode,
      policyId: request.requirement?.policyId ?? null,
      policy: request.requirement?.policy ?? null,
      ...(request.override ? { override: request.override } : {}),
    },
    coverage,
    effectiveControls,
    resources: [],
    readiness: {},
    channels,
    receipt: null,
    backend: null,
    grants,
    mismatches,
    evidence,
    cleanup: { status: "not-needed" },
  };
}

// Saves the refused attestation (with the backend plan, a mismatch or a piece of evidence when given) and
// throws the refusal. `details` are the error fields between its status and its attestation; by default
// the dispatch, capability and requirement.
function refuseLaunch(request, code, message, { backendPlan = null, mismatch = null, evidence = null, details = null } = {}) {
  const attestation = buildConfinementAttestation({ request, phase: "refused", outcome: "refused" });
  applyBackendPlanToAttestation(attestation, backendPlan);
  if (mismatch) attestation.mismatches.push(mismatch);
  if (evidence) attestation.evidence.push(evidence);
  saveAttestationRecord(attestation, request.context);
  throw new DispatchError(code, message, {
    contract: "confinement-execution.v1",
    status: "refused",
    ...(details ?? { dispatchId: request.dispatchId, capability: request.capability, requirement: request.requirement }),
    attestation,
  });
}

/** The prepared claims are exactly the assessed plan's coverage: no key missing, none different, none extra. */
function claimsMatchCoverage(claims, coverage) {
  if (!claims) return false;
  for (const [key, expected] of Object.entries(coverage)) {
    if (claims[key] !== expected) return false;
  }
  return Object.keys(claims).every((key) => key in coverage);
}

/**
 * Confinement assessment and preparation: the one pipeline that refuses a launch the policy cannot
 * enforce and prepares the sandbox. `prepareConfinementForLaunch` runs it for every launch.
 */
export async function assessAndPrepare(request, opts = {}) {
  const reqMode = request.requirement.mode;
  const isRequired = reqMode === "required";

  if (request.requirement?.mode === "preferred") {
    refuseLaunch(request, "confinement-mode-unsupported",
      `preferred confinement mode is disabled / unsupported in this phase; refusing dispatch cleanly before spawn.`);
  }

  // Pre-adapter bypass pairing checks
  const invocationConfinement = request.invocation?.confinement;
  const legacyNormalized = invocationConfinement
    ? normalizeLegacyConfinement(invocationConfinement)
    : null;
  const declares = (control, value, flag) => Boolean(
    legacyNormalized?.controls?.[control] === value ||
      invocationConfinement?.[flag] ||
      invocationConfinement?.controls?.[control] === value,
  );
  const hasOwnWorktree = declares("workspace", "own", "ownWorktree");
  const { satisfied, missing } = evaluateBypassPairing({
    isBypass: request.invocation?.permissionMode === "bypass",
    hasOwnWorktree,
    hasPrivateHome: declares("home", "private", "privateHome"),
    hasIsolatedSession: declares("session", "isolated", "isolatedSession"),
  });
  const workLabel = request.context?.workId ?? request.executorId;
  if (!satisfied) {
    refuseLaunch(request, "invalid-config",
      `executor for work "${workLabel}" refused: permissionMode "bypass" requires full confinement (missing: ${missing.join(", ")}).`,
      { details: { reason: "bypass-confinement-incomplete", dispatchId: request.dispatchId, executorId: request.executorId, confinement: invocationConfinement } });
  }

  if (
    hasOwnWorktree &&
    request.context?.repoRoot &&
    path.resolve(request.context.cwd) === path.resolve(request.context.repoRoot)
  ) {
    refuseLaunch(request, "invalid-config",
      `executor for work "${workLabel}" refused: confinement declares ownWorktree, but this dispatch runs in the repo root itself (${path.resolve(request.context.cwd)}) rather than a worktree of its own.`,
      { details: { reason: "own-worktree-unavailable", dispatchId: request.dispatchId, executorId: request.executorId, cwd: request.context.cwd, repoRoot: request.context.repoRoot, confinement: invocationConfinement } });
  }

  const effectiveBackendId = request.backendId ?? (isRequired ? 'bwrap' : null);
  if (reqMode !== 'unconfined' && effectiveBackendId) return prepareBackend(request, effectiveBackendId);

  let backendPlan = null;
  if (request.assignmentLaunchContext) {
    // Unconfined assignment launch needs a plan record and prepared attestation
    backendPlan = {
      contract: "confinement-plan.v1",
      dispatchId: request.dispatchId,
      decision: "execute",
      requested: request.requirement,
      coverage: {
        "control:hostWrite": "unverified",
        "control:hostRead": "satisfied",
        "control:networkEgress": "satisfied",
      },
      resources: [],
      readiness: {},
      grants: [],
      backend: { id: "none", type: "none", version: "none", configDigest: null },
      mismatches: [],
    };
    savePlanRecord(backendPlan, request.context);
    const prepAttestation = buildConfinementAttestation({ request, phase: "prepared", outcome: "unconfined" });
    applyBackendPlanToAttestation(prepAttestation, backendPlan);
    saveAttestationRecord(prepAttestation, request.context);
  }
  return { backendInstance: null, driver: null, backendPlan, preparedConfinement: null };
}

/** Resolves the backend, then assesses, probes and prepares the confined launch, refusing at the first step that fails. */
async function prepareBackend(request, effectiveBackendId) {
  const registryDoc = loadMachineBackendRegistry();
  const rawInstance = registryDoc?.confinementBackends?.[effectiveBackendId];
  if (rawInstance && rawInstance.enabled === false) {
    refuseLaunch(request, "confinement-backend-disabled",
      `confinement backend instance "${effectiveBackendId}" is disabled in machine registry.`,
      { mismatch: { code: "confinement-backend-missing", detail: `confinement backend "${effectiveBackendId}" is not configured or disabled.` } });
  }
  const backendInstance = createBackendRegistrySnapshot(registryDoc).resolve(effectiveBackendId);
  if (!backendInstance) {
    refuseLaunch(request, "confinement-backend-missing",
      `confinement backend instance "${effectiveBackendId}" not found in machine registry.`,
      { mismatch: { code: "confinement-backend-missing", detail: `confinement backend "${effectiveBackendId}" could not be resolved from snapshot.` } });
  }

  // getBackendDriver returns a registered driver or throws, so past this block the driver is set.
  let driver = null;
  try {
    driver = getBackendDriver(backendInstance.type);
  } catch (err) {
    const refusedAttestation = buildConfinementAttestation({ request, phase: "refused", outcome: "refused" });
    refusedAttestation.mismatches.push({ code: "confinement-backend-missing", detail: err.message });
    saveAttestationRecordThenThrow(refusedAttestation, request.context, new DispatchError("confinement-backend-missing", err.message, {
      contract: "confinement-execution.v1", status: "refused", dispatchId: request.dispatchId,
      capability: request.capability, requirement: request.requirement, attestation: refusedAttestation,
    }));
  }

  // Every root private homes live under is masked: the registry names them, the driver cannot read it.
  const assessment = driver.assess({ ...request, context: { ...request.context, confinementRoots: credentialScanRoots() } }, backendInstance);
  try {
    assertAttestationStoreIsolated(request.context, assessment.resources || []);
    if (request.assignmentLaunchContext && request.context?.runDir) {
      verifyAttestationStoreIsolation(path.join(request.context.runDir, 'protected'), assessment.resources || []);
      verifyAttestationStoreIsolation(path.join(request.context.runDir, 'controller'), assessment.resources || []);
    }
  } catch (err) {
    assessment.mismatches.push({ code: 'confinement-grant-invalid', detail: err.message });
    assessment.coverage['control:hostWrite'] = 'unsatisfied';
  }

  for (const failure of requiredCoverageFailures(request.requirement?.policy, assessment.coverage)) {
    assessment.mismatches.push({
      code: "confinement-coverage-unverified",
      detail: `${failure.key} has ${failure.coverage} coverage; required confinement needs satisfied coverage.`,
    });
  }

  const backendPlan = {
    contract: "confinement-plan.v1",
    dispatchId: request.dispatchId,
    decision: assessment.mismatches.length > 0 ? "refuse" : "execute",
    requested: request.requirement,
    coverage: assessment.coverage,
    resources: assessment.resources,
    readiness: assessment.readiness,
    grants: (request.requirement?.policy?.grants || []).map((g) => {
      const match = assessment.resources.find((r) => r.resource === g.resource);
      return { resource: g.resource, access: g.access, resolvedTarget: match?.executionTarget?.path || g.resource };
    }),
    backend: {
      id: backendInstance.id,
      type: backendInstance.type,
      version: driver.version,
      configDigest: crypto.createHash("sha256").update(JSON.stringify(backendInstance.config || {})).digest("hex"),
    },
    mismatches: assessment.mismatches,
  };
  savePlanRecord(backendPlan, request.context);

  if (backendPlan.decision === "refuse") {
    refuseLaunch(request, assessment.mismatches[0]?.code || "confinement-unsupported",
      `required confinement refused for capability "${request.capability}": ${assessment.mismatches.map((m) => m.detail).join("; ")}`,
      { backendPlan });
  }

  const probe = verifyRequiredProbe(request, backendInstance, driver);
  if (!probe.passed) {
    refuseLaunch(request, "confinement-probe-failed", `required confinement refused: ${probe.message}`,
      { backendPlan, evidence: { kind: "falsification-probe", ref: probe.message, freshness: "stale", fingerprint: probe.fingerprint } });
  }
  backendPlan.probe = probe;

  const preparedConfinement = await driver.prepare(backendPlan, request, backendInstance);
  if (!claimsMatchCoverage(preparedConfinement?.claims, backendPlan.coverage || {})) {
    if (preparedConfinement?.cleanup) {
      try { await preparedConfinement.cleanup(); } catch {}
    }
    refuseLaunch(request, "confinement-plan-mismatch",
      `prepared confinement claims mismatch the assessed plan coverage for capability "${request.capability}".`,
      { backendPlan, mismatch: { code: "confinement-plan-mismatch", detail: "prepared confinement claims mismatch the assessed plan coverage." } });
  }

  const prepAttestation = buildConfinementAttestation({
    request,
    phase: "prepared",
    outcome: "unknown",
    driverClaims: preparedConfinement.claims,
  });
  applyBackendPlanToAttestation(prepAttestation, backendPlan);
  saveAttestationRecord(prepAttestation, request.context);
  return { backendInstance, driver, backendPlan, preparedConfinement };
}

// The launch context a supervised attempt needs, checked before anything is prepared; returns its
// command id and run directory.
function requireLaunchContext(request) {
  const invalid = (message) => new DispatchError('confinement-launch-context-invalid', message,
    { contract: 'confinement-execution.v1', status: 'refused', dispatchId: request.dispatchId });
  if (!request.assignmentLaunchContext) throw invalid('prepareConfinementForLaunch requires assignmentLaunchContext.');
  const launchContext = request.assignmentLaunchContext;
  validateAssignmentLaunchContext(launchContext, request.context);

  const runDir = request.context?.runDir;
  if (!runDir) throw invalid('prepareConfinementForLaunch requires context.runDir.');
  // Everything published under protected/ is host-private: 0700 at first creation, and the publish
  // helpers' later recursive mkdir never widens it.
  try { fs.mkdirSync(path.join(runDir, 'protected'), { recursive: true, mode: 0o700 }); } catch {}

  const launchCommandId = launchContext.command?.launchCommandId;
  if (!launchCommandId) throw invalid('prepareConfinementForLaunch requires launchCommandId in assignmentLaunchContext.command.');
  // Every launch is an attempt of the run supervisor: the attempt envelope its controller writes is the one
  // launch record, so a request without one is refused before anything is prepared.
  if (typeof request.attemptId !== 'string' || request.attemptId === '') {
    throw new DispatchError('attempt-required', 'a launch needs a supervised attempt (the request carries no attemptId)', {
      code: 'attempt-required',
      runId: launchContext.run.runId,
      launchCommandId,
    });
  }
  return { launchContext, runDir, launchCommandId };
}

// Per planned resource: its binding for the prepared invocation and, for a temporary directory, its
// finalization entry; both carry the digest of the ownership marker found in it.
function bindPlanResources(backendPlan, preparedConfinement, sessionDir) {
  const resourceBindings = [];
  const finalizationResources = [];
  for (const res of backendPlan.resources || []) {
    let ownershipMarkerDigest = null;
    if (res.allocation === 'temporary' && res.hostTarget) {
      const markerPath = path.join(res.hostTarget, OWNERSHIP_MARKER_FILE);
      if (fs.existsSync(markerPath)) {
        try {
          const raw = fs.readFileSync(markerPath, 'utf8');
          try {
            ownershipMarkerDigest = computeSha256Digest(JSON.parse(raw));
          } catch {
            ownershipMarkerDigest = computeSha256Digest(raw);
          }
        } catch {}
      }
      finalizationResources.push({
        kind: 'temporary-directory',
        resourceId: res.resource,
        planEntryDigest: computeSha256Digest(res),
        ownershipMarkerDigest,
        pathRef: res.hostTarget,
        // Where finalize-home writes a login renewed in the private home back to. Recorded only here, in
        // host state outside every grant: the home and its marker are the agent's to rewrite.
        ...(res.resource === 'private-home' && preparedConfinement?.credentialWriteBack
          ? { credentialWriteBack: preparedConfinement.credentialWriteBack }
          : {}),
        // The folder of the home the CLI writes its session to; finalize-home keeps it before the home goes.
        ...(res.resource === 'private-home' && sessionDir ? { sessionDir } : {}),
      });
    }

    resourceBindings.push({
      resource: res.resource,
      access: res.access,
      hostTargetDigest: computeSha256Digest(res.hostTarget || res.resource),
      executionTarget: res.executionTarget?.path || res.resource,
      ownershipMarkerDigest,
    });
  }
  return { resourceBindings, finalizationResources };
}

// Publishes the prepared invocation once per launch command and returns its digest. The record on disk,
// and so the digest, carries the redacted env, never the real one. A resume re-enters with a fresh
// `publishedAt`: it keeps the digest already published, which the attempt envelope and the finalization
// descriptor were bound to, and never overwrites the record.
function publishPreparedInvocation(preparedInvocationPath, preparedInvocationRecord, redactedEnv) {
  const diskRecord = {
    ...preparedInvocationRecord,
    workerInvocation: { ...preparedInvocationRecord.workerInvocation, env: redactedEnv },
  };
  let digest = computeSha256Digest(diskRecord);
  diskRecord.digest = digest;
  if (fs.existsSync(preparedInvocationPath)) {
    try {
      const existingPreparedInvocation = JSON.parse(fs.readFileSync(preparedInvocationPath, 'utf8'));
      if (existingPreparedInvocation?.digest) digest = existingPreparedInvocation.digest;
    } catch {
      // A corrupt record keeps the fresh digest; its mismatch surfaces where the record is verified.
    }
  } else {
    publishImmutableProof(preparedInvocationPath, diskRecord);
  }
  return digest;
}

/**
 * Prepare confinement for the launch of one supervised attempt (Producer Ordering, spec & contracts).
 *
 * Persists the prepared attestation, publishes authority-prepared-invocation.v1 and the
 * confinement-finalization.v1 descriptor, and returns the attempt's command, env and sandbox prefix;
 * the attempt envelope itself is the controller's.
 */
export async function prepareConfinementForLaunch(request, opts = {}) {
  validateConfinementRequest(request);
  const { launchContext, runDir, launchCommandId } = requireLaunchContext(request);

  const adapterName = request.invocation?.adapter || DEFAULT_ADAPTER;
  const prep = await assessAndPrepare(request, { adapterPort: opts.adapterPort });
  const backendPlan = prep.backendPlan;
  const preparedConfinement = prep.preparedConfinement;
  const backendInstance = prep.backendInstance;
  const driver = prep.driver;

  // Prepared Worker Invocation
  const sourceInvocation = preparedConfinement?.invocation || request.invocation;
  // The attempt runs the agent under the gate: the sandbox prefix travels in the envelope and the worker
  // is the agent argv itself, never the sandbox wrapper command line.
  const attemptAgentArgv = preparedConfinement?.agentArgv ?? [request.invocation.command, ...(request.invocation.args || [])];
  const workerCommand = attemptAgentArgv[0];
  const claudeTrust = sourceInvocation.interactiveMode?.trustStore;
  // A prepared record that already exists is the invocation this launch was published with: its
  // args do not change with files that can change between attempts (.mcp.json, the trust store).
  const preparedInvocationPath = path.join(runDir, 'protected', 'prepared-invocation', `${launchCommandId}.json`);
  let publishedArgs = null;
  try { publishedArgs = JSON.parse(fs.readFileSync(preparedInvocationPath, 'utf8'))?.workerInvocation?.args ?? null; } catch { /* first attempt */ }
  const workerArgs = Array.isArray(publishedArgs) ? publishedArgs : [
    ...attemptAgentArgv.slice(1),
    // The target project's own MCP servers are approved for this worker only, so the claude
    // dialog that asks a person cannot stop an unattended seat.
    ...(claudeTrust?.kind === 'claude-json'
      ? claudeMcpApprovalArgs({
        cwd: request.context.cwd,
        repoRoot: request.context.repoRoot ?? request.context.cwd,
        storePath: operatorClaudeStorePath({ trustStore: claudeTrust }),
      })
      : []),
  ];
  const workerCwd = request.context.cwd;
  const depth = currentDispatchDepth();
  const resolvedExecutorEnv = resolveExecutorEnv(sourceInvocation.env || {});
  const workerEnv = { ...workerBaseEnv(), ...resolvedExecutorEnv, [DISPATCH_DEPTH_ENV]: String(depth + 1) };

  const workerCommandDigest = computeSha256Digest({ command: workerCommand, args: workerArgs });
  const envDigest = computeSha256Digest(workerEnv);
  const attestationPlanDigest = computeSha256Digest(backendPlan);
  // The real env (with secrets) is never persisted here: the attempt keeps it in the side file its
  // controller writes next to the envelope.
  const redactedEnv = redactEnvForPersistence(workerEnv);
  const { resourceBindings, finalizationResources } = bindPlanResources(backendPlan, preparedConfinement, request.invocation?.credentialStore?.sessionDir);

  // 1. Publish authority-prepared-invocation.v1
  const preparedInvocationRecord = {
    contract: 'authority-prepared-invocation.v1',
    dispatchId: request.dispatchId,
    adapter: adapterName,
    run: {
      runId: launchContext.run.runId,
      assignmentId: launchContext.run.assignmentId,
      attempt: launchContext.run.attempt,
      launchCommandId,
      controlEpoch: launchContext.command.controlEpoch,
      controlTokenDigest: launchContext.command.controlTokenDigest,
      dispatchPlanDigest: launchContext.run.dispatchPlanDigest,
      evaluatorBaselineDigest: launchContext.run.evaluatorBaselineDigest,
    },
    requirement: {
      mode: request.requirement.mode,
      policyId: request.requirement.policyId ?? null,
      policyDigest: request.requirement.policy ? computeSha256Digest(request.requirement.policy) : null,
    },
    backend: backendInstance ? {
      id: backendInstance.id,
      type: backendInstance.type,
      version: driver?.version || 'local-bwrap-v1',
      configDigest: computeSha256Digest(backendInstance.config || {}),
    } : {
      id: 'none',
      type: 'none',
      version: 'none',
      configDigest: null,
    },
    workerInvocation: {
      command: workerCommand,
      args: workerArgs,
      cwd: workerCwd,
      // The real env stays in memory only; the record on disk carries the redacted env.
      env: workerEnv,
      envDigest,
      workerCommandDigest,
      stdin: 'ignore',
      encoding: 'utf8',
      timeoutMs: request.context.timeoutMs || DEFAULT_SEAT_TIMEOUT_MS,
      idleTimeoutMs: request.context.idleTimeoutMs || null,
      maxBuffer: request.context.maxBuffer || 10485760,
    },
    resourceBindings,
    ...(preparedConfinement?.providerCapacity ? { providerCapacity: preparedConfinement.providerCapacity } : {}),
    proof: {
      confinementPlanDigest: attestationPlanDigest,
      preparedAttestationDigest: attestationPlanDigest,
      probeFingerprintDigest: backendPlan?.probe?.fingerprint ? computeSha256Digest(backendPlan.probe.fingerprint) : null,
    },
    publishedAt: new Date().toISOString(),
  };
  const preparedInvocationDigest = publishPreparedInvocation(preparedInvocationPath, preparedInvocationRecord, redactedEnv);
  preparedInvocationRecord.digest = preparedInvocationDigest;

  // 2. Publish confinement-finalization.v1
  const finalizationDescBody = {
    contract: 'confinement-finalization.v1',
    runId: launchContext.run.runId,
    launchCommandId,
    backend: backendInstance ? (driver?.version || backendInstance.type) : 'none',
    dispatchId: request.dispatchId,
    resourceOwner: 'confinement-authority',
    preparedPlan: {
      planRef: `protected/confinement-finalization/${launchCommandId}.json#preparedPlan`,
      planDigest: attestationPlanDigest,
    },
    attestationPlanDigest,
    preparedInvocationDigest,
    finalAttestation: {
      state: 'pending',
      resultRef: null,
      resultDigest: null,
    },
    resources: finalizationResources,
    cleanupState: 'pending',
    cleanupResult: null,
    retainUntil: 'safe-cleanup-proof-or-manual-review',
    updatedAt: new Date().toISOString(),
  };
  // The digest covers the descriptor's fixed fields, never its mutable cleanup and final-attestation state.
  finalizationDescBody.digest = computeSha256Digest({
    contract: finalizationDescBody.contract,
    runId: finalizationDescBody.runId,
    launchCommandId: finalizationDescBody.launchCommandId,
    backend: finalizationDescBody.backend,
    dispatchId: finalizationDescBody.dispatchId,
    resourceOwner: finalizationDescBody.resourceOwner,
    preparedPlan: finalizationDescBody.preparedPlan,
    attestationPlanDigest: finalizationDescBody.attestationPlanDigest,
    preparedInvocationDigest: finalizationDescBody.preparedInvocationDigest,
    resources: finalizationDescBody.resources,
    retainUntil: finalizationDescBody.retainUntil,
  });

  const finalizationPath = path.join(runDir, 'protected', 'confinement-finalization', `${launchCommandId}.json`);
  publishMutableProjection(finalizationPath, finalizationDescBody);

  return {
    attempt: {
      command: workerCommand,
      args: workerArgs,
      cwd: workerCwd,
      env: redactedEnv,
      secretEnv: workerEnv,
      envDigest,
      bwrapPrefix: preparedConfinement?.bwrapPrefix ?? null,
      bwrapExecutable: preparedConfinement?.bwrapPrefix ? (backendInstance?.config?.executable || '/usr/bin/bwrap') : null,
      launchDigest: preparedConfinement?.launchDigest ?? null,
    },
    preparedInvocation: preparedInvocationRecord,
    preparedInvocationDigest,
    providerCapacity: preparedConfinement?.providerCapacity || null,
    finalizationPath,
    finalizationDescriptor: finalizationDescBody,
    backendPlan,
    preparedConfinement,
  };
}

/** A home that does not belong to the attempt, or whose marker cannot be read: nothing is removed. */
export class AttemptHomeError extends Error {
  constructor(code, message) {
    super(`${code}: ${message}`);
    this.name = 'AttemptHomeError';
    this.code = code;
  }
}

function attemptFinalizationDescriptors(runDir) {
  const dir = path.join(runDir, 'protected', 'confinement-finalization');
  let names;
  try { names = fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort(); } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw new AttemptHomeError('finalization-descriptor-unreadable', `${dir}: ${err.code ?? err.message}`);
  }
  const found = [];
  for (const name of names) {
    const file = path.join(dir, name);
    try { found.push({ file, descriptor: JSON.parse(fs.readFileSync(file, 'utf8')) }); } catch {
      throw new AttemptHomeError('finalization-descriptor-unreadable', `${name} cannot be read`);
    }
  }
  return found;
}

function readAttemptHomeMarker(homeDir, attemptId, runDir) {
  let marker;
  try { marker = JSON.parse(readAgentFileSync(path.join(homeDir, OWNERSHIP_MARKER_FILE), MAX_HOME_MARKER_BYTES).toString('utf8')); } catch {
    throw new AttemptHomeError('home-marker-unreadable', `${homeDir} has no readable ownership marker`);
  }
  if (marker?.contract !== ATTEMPT_HOME_MARKER_CONTRACT || marker.creator !== 'fgos-confinement' || marker.attemptId !== attemptId || marker.runDir !== runDir) {
    throw new AttemptHomeError('home-marker-mismatch', `${homeDir} is not a version 2 home of attempt ${attemptId} in ${runDir}`);
  }
  return marker;
}

const TRANSCRIPT_DIR = path.join('protected', 'session');

/** Where a seat's kept session is, relative to the run directory, or null when none was kept. */
function transcriptPathOf(runDir) {
  try { return fs.readdirSync(path.join(runDir, TRANSCRIPT_DIR)).length > 0 ? TRANSCRIPT_DIR : null; } catch { return null; }
}

// Copy the session of one home into the run directory and note what the home held, by name only. Nothing
// here can stop the removal: a refused or failed copy becomes a structured warning.
function keepSessionBeforeRemoval({ target, sessionDir, runDir, launchCommandId }, keeping) {
  const warn = (code, message) => {
    keeping.warnings.push({ code, message, launchCommandId });
    process.stderr.write(`fgos: session transcript not kept (${code}): ${message}\n`);
  };
  try { keeping.homeLayout.push(...describeAttemptHome(target).map((entry) => ({ ...entry, launchCommandId }))); } catch { /* a layout is a diagnostic only */ }
  if (!sessionDir) return warn('session-dir-undeclared', 'the executor declares no session directory');
  try {
    const kept = keepSessionTranscript({ homeDir: target, sessionDir, destDir: path.join(runDir, TRANSCRIPT_DIR), root: path.join(runDir, 'protected') });
    if (!kept.found) warn('session-not-written', `the CLI wrote nothing under "${sessionDir}" in its home`);
  } catch (err) {
    warn('session-copy-failed', err.message);
  }
}

/**
 * Give the credential back and remove every private home of one attempt, whatever way the attempt
 * ended. The caller (supervisor or adopt step) holds the attempt lock and the process domain is
 * empty, so no agent still uses a home. It never keeps a home for the kind of ending; it keeps one
 * only when its renewed login is not safe anywhere else yet.
 *
 * Every marker is checked before anything is removed: a marker that is not version 2 or names another
 * attempt throws `AttemptHomeError` and leaves all homes in place. Where a renewed login goes back to is
 * taken only from the descriptor's resource entry (`credentialWriteBack`), and how often its staging
 * failed only from the home's host record, never from the home. Once its own homes are done, the held
 * homes of other attempts under the same temp roots are settled when their record allows it.
 *
 * Before a home is removed, the session directory its executor declares is copied into the run directory
 * (`keepSessionBeforeRemoval`); a copy that fails is a warning and never keeps the home or the login back.
 *
 * @returns {{state: 'cleaned'|'credential-home-kept'|'credential-home-held', homes: number, transcriptPath: string|null,
 *   homeLayout: object[], warnings: Array<{code: string, message: string}>}} `transcriptPath` is relative to `runDir`
 */
export function finalizeAttemptHome({ runDir, attemptId } = {}) {
  if (typeof runDir !== 'string' || typeof attemptId !== 'string' || attemptId === '') {
    throw new AttemptHomeError('invalid-arguments', 'runDir and attemptId are required');
  }
  const descriptors = attemptFinalizationDescriptors(runDir);
  const homes = [];
  for (const { file, descriptor } of descriptors) {
    for (const res of descriptor.resources || descriptor.temporaryDirectories || []) {
      const target = res.pathRef || res.path;
      if (!target || homes.some((h) => h.target === target) || !fs.existsSync(target)) continue;
      homes.push({ target, marker: readAttemptHomeMarker(target, attemptId, runDir), writeBack: res.credentialWriteBack, sessionDir: res.sessionDir, launchCommandId: path.basename(file, '.json') });
    }
  }
  let kept = 0;
  let held = 0;
  const keeping = { warnings: [], homeLayout: [] };
  for (const { target, marker, writeBack, sessionDir, launchCommandId } of homes) {
    const record = { attemptId, runDir, dispatchId: marker.dispatchId, launchCommandId };
    // A home whose staging failed the allowed number of times is left to a later settle; doctor reports it.
    if ((readAttemptHomeRecord(target, record)?.credentialKept?.attempts ?? 0) >= CREDENTIAL_KEEP_MAX_ATTEMPTS) { held += 1; continue; }
    const result = writeBackRenewedCredential(target, writeBack);
    if (result.status === 'failed' && result.keepHome) {
      const isHeld = countCredentialKeep(target, record) >= CREDENTIAL_KEEP_MAX_ATTEMPTS;
      if (isHeld) held += 1; else kept += 1;
      process.stderr.write(`fgos: credential write-back not done (${result.code}); private home ${isHeld ? 'held for a later settle' : 'kept for a later retry'}\n`);
      continue;
    }
    if (result.status === 'failed') process.stderr.write(`fgos: credential write-back not done (${result.code})\n`);
    keepSessionBeforeRemoval({ target, sessionDir, runDir, launchCommandId }, keeping);
    removeAttemptHome(target, marker.dispatchId);
  }
  // Homes held by other attempts under the same roots: whatever kept them may be gone by now.
  try {
    settleHeldCredentialHomes({ tempRoots: [...new Set(homes.map(({ target }) => path.dirname(path.dirname(target))))] });
  } catch { /* they stay held; doctor names them */ }
  const transcriptPath = transcriptPathOf(runDir);
  const reported = { homes: homes.length, transcriptPath, homeLayout: keeping.homeLayout, warnings: keeping.warnings };
  if (kept > 0) return { state: CREDENTIAL_HOME_KEPT, ...reported };
  const cleanupState = held > 0 ? 'retained' : 'cleaned';
  for (const { file, descriptor } of descriptors) {
    if (descriptor.cleanupState === cleanupState) continue;
    publishMutableProjection(file, {
      ...descriptor,
      cleanupState,
      cleanupResult: { kind: cleanupState },
      updatedAt: new Date().toISOString(),
    });
  }
  return { state: held > 0 ? CREDENTIAL_HOME_HELD : 'cleaned', ...reported };
}
