// authority.mjs — Agent Confinement Authority runtime execution door
// (Phase 02 R1-R7, docs/platform/agent-confinement/spec.md §1, §5.2; docs/platform/agent-confinement/contracts/confinement-authority-v1.md#6-canonical-contracts §6.6, §6.9).

import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { claudeMcpApprovalArgs } from "../../../run-supervisor/trust-store.mjs";
import { DEFAULT_ADAPTER, resolveExecutorEnv, workerBaseEnv, currentDispatchDepth, DISPATCH_DEPTH_ENV } from "../adapters.mjs";
import { DispatchError } from "../../../run-supervisor/dispatch-error.mjs";
import { validateConfinementRequest, validateAssignmentLaunchContext } from "./request.mjs";
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
import { OWNERSHIP_MARKER_FILE, CREDENTIAL_HOME_KEPT, CREDENTIAL_HOME_HELD, CREDENTIAL_KEEP_MAX_ATTEMPTS, ATTEMPT_HOME_MARKER_CONTRACT, countCredentialKeep, readAttemptHomeRecord, removeAttemptHome, settleHeldCredentialHomes, MAX_HOME_MARKER_BYTES } from "./cleanup.mjs";
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

// H11: the persisted prepared-invocation/launch-envelope records keep the
// worker's real spawn environment's keys visible for audit (which env vars
// this dispatch actually set) without ever persisting values that could be
// credentials -- `envDigest` (computed separately, over the FULL real env)
// is the cryptographic commitment a verifier checks the real env against;
// this allow-list is deliberately short and standard-shell-only, never
// provider/executor-specific, so nothing here has to guess which var names
// look secret-shaped.
const SAFE_ENV_ALLOWLIST = ['PATH', 'HOME', 'LANG', 'LC_ALL', 'TERM', 'SHELL', 'USER', 'LOGNAME', 'PWD', 'TZ', 'NODE_ENV', DISPATCH_DEPTH_ENV];

function redactEnvForPersistence(env) {
  const redacted = {};
  for (const key of SAFE_ENV_ALLOWLIST) {
    if (env && env[key] !== undefined) redacted[key] = env[key];
  }
  return redacted;
}

// L9: `saveAttestationRecord` can itself throw (disk write failure, a
// concurrent isolation-violation check) -- every refusal site in this file
// calls it right before throwing its own typed DispatchError, and if the
// save throws first, that typed refusal (the reason the caller actually
// needs) never gets thrown at all; the raw attestation-store error escapes
// in its place instead. This wraps that pattern: the save failure is never
// silently dropped (it's attached as `cause`) and never masks the intended
// refusal either. New refusal sites should use this instead of the bare
// `saveAttestationRecord(...); throw ...` pattern still used by most
// existing call sites in this file (a full retrofit is a separate,
// deliberately-scoped-out follow-up, not part of this Low-severity fix).
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
  const reqMode = request.requirement?.mode ?? "unconfined";
  const isExplicitUnconfined = reqMode === "unconfined" && !request.requirement?.omitted;

  let determinedOutcome = outcome;
  if (!determinedOutcome) {
    if (phase === "refused") {
      determinedOutcome = "refused";
    } else if (isExplicitUnconfined) {
      determinedOutcome = "unconfined";
    } else {
      // In observe mode (this phase), legacy omitted policy emits unknown, never enforced
      determinedOutcome = "unknown";
    }
  }

  const legacy =
    request.requirement?.legacy ||
    (request.invocation?.confinement
      ? normalizeLegacyConfinement(request.invocation.confinement)
      : null);
  const hasBwrapCmd = request.invocation?.command === "bwrap";

  let hasHostWriteDeny = false;
  let hasProcessIsolation = false;
  let hasSessionIsolation = false;
  let hasPrivateHome = false;
  let hasOwnWorkspace = false;
  let declaredHomeTarget = null;
  const writableBinds = [];

  if (driverClaims && typeof driverClaims === "object") {
    if (driverClaims["control:hostWrite"] === "satisfied") hasHostWriteDeny = true;
    if (driverClaims["control:process"] === "satisfied") hasProcessIsolation = true;
    if (driverClaims["control:session"] === "satisfied") hasSessionIsolation = true;
    if (driverClaims["control:workspace"] === "satisfied") hasOwnWorkspace = true;
    if (driverClaims["control:home"] === "satisfied") hasPrivateHome = true;
  } else if (hasBwrapCmd && Array.isArray(request.invocation?.args)) {
    const rawArgs = request.invocation.args;
    const dashDashIdx = rawArgs.indexOf("--");
    const bwrapOptions = dashDashIdx >= 0 ? rawArgs.slice(0, dashDashIdx) : rawArgs;

    let hasRoRoot = false;
    let hasWiderWritableRebind = false;

    for (let i = 0; i < bwrapOptions.length; i++) {
      const arg = bwrapOptions[i];
      if (typeof arg !== "string") continue;

      if (arg === "--unshare-pid" || arg === "--unshare-all") {
        hasProcessIsolation = true;
      } else if (arg.startsWith("--ro-bind ") || arg.startsWith("--ro-bind-try ")) {
        const parts = arg.trim().split(/\s+/);
        if ((parts[1] === "/" || parts[1] === "") && (parts[2] === "/" || parts[2] === "")) {
          hasRoRoot = true;
        }
      } else if (
        arg.startsWith("--bind ") ||
        arg.startsWith("--bind-try ") ||
        arg.startsWith("--dev-bind ") ||
        arg.startsWith("--dev-bind-try ")
      ) {
        const parts = arg.trim().split(/\s+/);
        if (parts[2] === "/" || parts[2] === "") {
          hasWiderWritableRebind = true;
        } else if (parts[2]) {
          writableBinds.push({ src: parts[1], dest: parts[2] });
          if (request.context?.repoRoot && parts[1] === request.context.repoRoot && parts[2] !== parts[1]) {
            hasOwnWorkspace = true;
          }
        }
      } else if (arg === "--ro-bind" || arg === "--ro-bind-try") {
        const src = bwrapOptions[i + 1];
        const dest = bwrapOptions[i + 2];
        i += 2;
        if ((src === "/" || src === "") && (dest === "/" || dest === "")) {
          hasRoRoot = true;
        }
      } else if (
        arg === "--bind" ||
        arg === "--bind-try" ||
        arg === "--dev-bind" ||
        arg === "--dev-bind-try"
      ) {
        const src = bwrapOptions[i + 1];
        const dest = bwrapOptions[i + 2];
        i += 2;
        if (dest === "/" || dest === "") {
          hasWiderWritableRebind = true;
        } else if (typeof dest === "string" && dest) {
          writableBinds.push({ src, dest });
          if (request.context?.repoRoot && src === request.context.repoRoot && dest !== src) {
            hasOwnWorkspace = true;
          }
        }
      } else if (arg === '--setenv' && bwrapOptions[i + 1] === 'HOME' && typeof bwrapOptions[i + 2] === 'string') {
        declaredHomeTarget = bwrapOptions[i + 2];
        i += 2;
      }

      if (arg === "--unshare-ipc" || arg === "--unshare-all") {
        hasSessionIsolation = true;
      }
    }

    hasPrivateHome = Boolean(declaredHomeTarget) && writableBinds.some(
      (bind) => bind.dest === declaredHomeTarget && bind.src !== declaredHomeTarget,
    );

    if (hasRoRoot && !hasWiderWritableRebind) {
      hasHostWriteDeny = true;
    }
  }

  const isVerifiedBwrap = hasHostWriteDeny || hasProcessIsolation;
  const isHeuristicBwrap =
    !isVerifiedBwrap &&
    (hasBwrapCmd ||
      request.executorId?.includes?.("bwrap") ||
      (Array.isArray(request.invocation?.args) && request.invocation.args.includes("bwrap")));

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
    } else if (hasBwrapCmd || isHeuristicBwrap) {
      coverage["control:hostWrite"] = "unverified";
    }

    if (hasProcessIsolation) {
      coverage["control:process"] = "satisfied";
    } else if (hasBwrapCmd || isHeuristicBwrap) {
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

  // LOW-2: Legacy grants name an abstract resource (e.g. 'private-home') whose concrete filesystem
  // path is allocated downstream by the adapter runtime (e.g. herdr private HOME), unlike the
  // bwrap run-output grant where runDir was already allocated at the dispatch seam. When request.context?.homeDir
  // is known, target uses it; otherwise it preserves g.resource as an abstract target descriptor.
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

  const channels = isExplicitUnconfined
    ? [
        { name: "filesystem", coverage: "out-of-scope", detail: "explicitly unconfined" },
        { name: "inherited-fd", coverage: "out-of-scope", detail: "explicitly unconfined" },
        { name: "stdio", coverage: "out-of-scope", detail: "explicitly unconfined" },
        { name: "host-ipc", coverage: "out-of-scope", detail: "explicitly unconfined" },
        { name: "network", coverage: "out-of-scope", detail: "explicitly unconfined" },
      ]
    : [
        {
          name: "filesystem",
          coverage: hasHostWriteDeny ? "covered" : (hasBwrapCmd || isHeuristicBwrap) ? "unverified" : "unknown",
          detail: hasHostWriteDeny
            ? (driverClaims ? "driver-verified confinement control" : "observed hand-written bwrap sandbox")
            : (hasBwrapCmd || isHeuristicBwrap)
              ? "observe-mode: heuristic bwrap name detected but sandbox unverified"
              : (request.requirement?.policyId
                  ? `observe-mode: unverified execution for policy ${request.requirement.policyId}`
                  : "observe-mode: no policy declared"),
        },
        {
          name: "inherited-fd",
          coverage: isVerifiedBwrap ? "covered" : (hasBwrapCmd || isHeuristicBwrap) ? "unverified" : "unknown",
          detail: isVerifiedBwrap
            ? (driverClaims ? "driver-verified confinement control" : "observed hand-written bwrap sandbox")
            : (hasBwrapCmd || isHeuristicBwrap)
              ? "observe-mode: heuristic bwrap name detected but sandbox unverified"
              : (request.requirement?.policyId
                  ? `observe-mode: unverified execution for policy ${request.requirement.policyId}`
                  : "observe-mode: no policy declared"),
        },
        {
          name: "stdio",
          coverage: "unknown",
          detail: "observe-mode: stdio unmanaged",
        },
        {
          name: "host-ipc",
          coverage:
            request.invocation?.adapter !== "herdr-spawn" &&
            isVerifiedBwrap &&
            legacy?.controls?.session === "isolated"
              ? "covered"
              : "out-of-scope",
          detail:
            request.invocation?.adapter !== "herdr-spawn" &&
            isVerifiedBwrap &&
            legacy?.controls?.session === "isolated"
              ? "observed legacy isolated session with verified bwrap"
              : request.invocation?.adapter === "herdr-spawn" &&
                  legacy?.controls?.session === "isolated"
                ? "observe-mode: herdr session isolation is lifecycle hygiene, not OS IPC confinement"
                : "observe-mode: host IPC unmanaged",
        },
        {
          name: "network",
          coverage: "out-of-scope",
          detail: "observe-mode: network unmanaged",
        },
      ];

  const isHerdrSpawn = request.invocation?.adapter === "herdr-spawn";
  const mismatches = [];
  if (isHerdrSpawn) {
    mismatches.push({
      code: "herdr-partial-maturity",
      detail:
        "herdr-spawn session/home lifecycle remains in adapter; pre-adapter preparation partially mature.",
    });
  }

  const evidence = [
    {
      kind: "structural-observation",
      ref: `dispatch:${request.dispatchId}`,
      freshness: "current",
    },
  ];
  if (isHerdrSpawn) {
    evidence.push({
      kind: "structural-observation",
      ref: "herdr-partial-maturity:herdr-round",
      freshness: "current",
    });
  }
  if (isVerifiedBwrap) {
    evidence.push({
      kind: "structural-observation",
      ref: `bwrap-argv:${request.executorId}`,
      freshness: "current",
    });
  } else if (isHeuristicBwrap) {
    evidence.push({
      kind: "structural-observation",
      ref: `bwrap-heuristic:${request.executorId}`,
      freshness: "current",
    });
  }
  if (legacy) {
    evidence.push({
      kind: "structural-observation",
      ref: `legacy-confinement:${request.executorId}`,
      freshness: "current",
    });
  }
  if (isExplicitUnconfined) {
    evidence.push({
      kind: "explicit-opt-out",
      ref: "policy:unconfined",
      detail: "explicit unconfined policy declared; running unconfined with audited opt-out",
      freshness: "current",
    });
  }

  const attestation = {
    contract: "confinement-attestation.v1",
    dispatchId: request.dispatchId,
    phase,
    outcome: determinedOutcome,
    // M8: the bypass-pairing decision (evaluateBypassPairing) already gates
    // dispatch on this exact value -- recording it here means an auditor
    // reading the attestation later never has to reconstruct it from the
    // raw invocation shape.
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

  return attestation;
}

/**
 * Confinement assessment and preparation: the one pipeline that refuses a launch the policy cannot
 * enforce and prepares the sandbox. `prepareConfinementForLaunch` runs it for every launch.
 */
export async function assessAndPrepare(request, opts = {}) {
  const reqMode = request.requirement?.mode ?? "unconfined";
  const isRequired = reqMode === "required";
  const adapterPort = opts.adapterPort ?? null;
  const adapterName = request.invocation?.adapter ?? DEFAULT_ADAPTER;

  if (request.requirement?.mode === "preferred") {
    const refusedAttestation = buildConfinementAttestation({
      request,
      phase: "refused",
      outcome: "refused",
    });
    saveAttestationRecord(refusedAttestation, request.context);
    throw new DispatchError(
      "confinement-mode-unsupported",
      `preferred confinement mode is disabled / unsupported in this phase; refusing dispatch cleanly before spawn.`,
      {
        contract: "confinement-execution.v1",
        status: "refused",
        dispatchId: request.dispatchId,
        capability: request.capability,
        requirement: request.requirement,
        attestation: refusedAttestation,
      },
    );
  }

  // Pre-adapter bypass pairing checks
  const invocationConfinement = request.invocation?.confinement;
  const legacyNormalized = invocationConfinement
    ? normalizeLegacyConfinement(invocationConfinement)
    : null;
  const isBypass = request.invocation?.permissionMode === "bypass";

  const hasOwnWorktree = Boolean(
    legacyNormalized?.controls?.workspace === "own" ||
      invocationConfinement?.ownWorktree ||
      invocationConfinement?.controls?.workspace === "own",
  );
  const hasPrivateHome = Boolean(
    legacyNormalized?.controls?.home === "private" ||
      invocationConfinement?.privateHome ||
      invocationConfinement?.controls?.home === "private",
  );
  const hasIsolatedSession = Boolean(
    legacyNormalized?.controls?.session === "isolated" ||
      invocationConfinement?.isolatedSession ||
      invocationConfinement?.controls?.session === "isolated",
  );

  {
    const { satisfied, missing } = evaluateBypassPairing({
      isBypass,
      hasOwnWorktree,
      hasPrivateHome,
      hasIsolatedSession,
    });
    if (!satisfied) {
      const refusedAttestation = buildConfinementAttestation({
        request,
        phase: "refused",
        outcome: "refused",
      });
      saveAttestationRecord(refusedAttestation, request.context);
      throw new DispatchError(
        "invalid-config",
        `executor for work "${request.context?.workId ?? request.executorId}" refused: permissionMode "bypass" requires full confinement (missing: ${missing.join(", ")}).`,
        {
          contract: "confinement-execution.v1",
          status: "refused",
          reason: "bypass-confinement-incomplete",
          dispatchId: request.dispatchId,
          executorId: request.executorId,
          confinement: invocationConfinement,
          attestation: refusedAttestation,
        },
      );
    }
  }

  if (
    hasOwnWorktree &&
    request.context?.repoRoot &&
    path.resolve(request.context.cwd) === path.resolve(request.context.repoRoot)
  ) {
    const refusedAttestation = buildConfinementAttestation({
      request,
      phase: "refused",
      outcome: "refused",
    });
    saveAttestationRecord(refusedAttestation, request.context);
    throw new DispatchError(
      "invalid-config",
      `executor for work "${request.context?.workId ?? request.executorId}" refused: confinement declares ownWorktree, but this dispatch runs in the repo root itself (${path.resolve(request.context.cwd)}) rather than a worktree of its own.`,
      {
        contract: "confinement-execution.v1",
        status: "refused",
        reason: "own-worktree-unavailable",
        dispatchId: request.dispatchId,
        executorId: request.executorId,
        cwd: request.context.cwd,
        repoRoot: request.context.repoRoot,
        confinement: invocationConfinement,
        attestation: refusedAttestation,
      },
    );
  }

  let backendInstance = null;
  let driver = null;
  let backendPlan = null;
  let preparedConfinement = null;

  const effectiveBackendId = request.backendId ?? (isRequired ? 'bwrap' : null);

  if (reqMode !== 'unconfined' && effectiveBackendId) {
    const registryDoc = loadMachineBackendRegistry();
    const rawInstance = registryDoc?.confinementBackends?.[effectiveBackendId];
    if (rawInstance && rawInstance.enabled === false) {
      const refusedAttestation = buildConfinementAttestation({
        request,
        phase: "refused",
        outcome: "refused",
      });
      refusedAttestation.mismatches.push({
        code: "confinement-backend-missing",
        detail: `confinement backend "${effectiveBackendId}" is not configured or disabled.`,
      });
      saveAttestationRecord(refusedAttestation, request.context);
      throw new DispatchError(
        "confinement-backend-disabled",
        `confinement backend instance "${effectiveBackendId}" is disabled in machine registry.`,
        {
          contract: "confinement-execution.v1",
          status: "refused",
          dispatchId: request.dispatchId,
          capability: request.capability,
          requirement: request.requirement,
          attestation: refusedAttestation,
        },
      );
    }
    const snapshot = createBackendRegistrySnapshot(registryDoc);
    backendInstance = snapshot.resolve(effectiveBackendId);
    if (!backendInstance) {
      const refusedAttestation = buildConfinementAttestation({
        request,
        phase: "refused",
        outcome: "refused",
      });
      refusedAttestation.mismatches.push({
        code: "confinement-backend-missing",
        detail: `confinement backend "${effectiveBackendId}" could not be resolved from snapshot.`,
      });
      saveAttestationRecord(refusedAttestation, request.context);
      throw new DispatchError(
        "confinement-backend-missing",
        `confinement backend instance "${effectiveBackendId}" not found in machine registry.`,
        {
          contract: "confinement-execution.v1",
          status: "refused",
          dispatchId: request.dispatchId,
          capability: request.capability,
          requirement: request.requirement,
          attestation: refusedAttestation,
        },
      );
    }

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

    if (isRequired && (!backendInstance || !driver)) {
      const refusedAttestation = buildConfinementAttestation({
        request,
        phase: "refused",
        outcome: "refused",
      });
      saveAttestationRecord(refusedAttestation, request.context);
      throw new DispatchError(
        "confinement-backend-missing",
        `required confinement refused for capability "${request.capability}": backend "${effectiveBackendId}" unavailable.`,
        {
          contract: "confinement-execution.v1",
          status: "refused",
          dispatchId: request.dispatchId,
          capability: request.capability,
          requirement: request.requirement,
          attestation: refusedAttestation,
        },
      );
    }

    // Every root private homes live under is masked: the registry names them, the driver cannot read it.
    const assessment = driver.assess({ ...request, context: { ...request.context, confinementRoots: credentialScanRoots() } }, backendInstance);
    try {
      assertAttestationStoreIsolated(request.context, assessment.resources || []);
      if (request.assignmentLaunchContext && request.context?.runDir) {
        const protectedDir = path.join(request.context.runDir, 'protected');
        const controllerDir = path.join(request.context.runDir, 'controller');
        verifyAttestationStoreIsolation(protectedDir, assessment.resources || []);
        verifyAttestationStoreIsolation(controllerDir, assessment.resources || []);
      }
    } catch (err) {
      assessment.mismatches.push({
        code: 'confinement-grant-invalid',
        detail: err.message,
      });
      assessment.coverage['control:hostWrite'] = 'unsatisfied';
    }

    const coverageFailures = requiredCoverageFailures(request.requirement?.policy, assessment.coverage);
    for (const failure of coverageFailures) {
      assessment.mismatches.push({
        code: "confinement-coverage-unverified",
        detail: `${failure.key} has ${failure.coverage} coverage; required confinement needs satisfied coverage.`,
      });
    }

    backendPlan = {
      contract: "confinement-plan.v1",
      dispatchId: request.dispatchId,
      decision: assessment.mismatches.length > 0 ? "refuse" : "execute",
      requested: request.requirement,
      coverage: assessment.coverage,
      resources: assessment.resources,
      readiness: assessment.readiness,
      grants: (request.requirement?.policy?.grants || []).map((g) => {
        const match = assessment.resources.find((r) => r.resource === g.resource);
        return {
          resource: g.resource,
          access: g.access,
          resolvedTarget: match?.executionTarget?.path || g.resource,
        };
      }),
      backend: {
        id: backendInstance.id,
        type: backendInstance.type,
        version: driver.version,
        configDigest: crypto
          .createHash("sha256")
          .update(JSON.stringify(backendInstance.config || {}))
          .digest("hex"),
      },
      mismatches: assessment.mismatches,
    };
    savePlanRecord(backendPlan, request.context);

    if (backendPlan.decision === "refuse") {
      const refusedAttestation = buildConfinementAttestation({
        request,
        phase: "refused",
        outcome: "refused",
      });
      applyBackendPlanToAttestation(refusedAttestation, backendPlan);
      saveAttestationRecord(refusedAttestation, request.context);
      const primaryMismatch = assessment.mismatches[0] || {};
      const errorCode = primaryMismatch.code || "confinement-unsupported";
      throw new DispatchError(
        errorCode,
        `required confinement refused for capability "${request.capability}": ${assessment.mismatches.map((m) => m.detail).join("; ")}`,
        {
          contract: "confinement-execution.v1",
          status: "refused",
          dispatchId: request.dispatchId,
          capability: request.capability,
          requirement: request.requirement,
          attestation: refusedAttestation,
        },
      );
    }

    const probe = verifyRequiredProbe(request, backendInstance, driver);
    if (!probe.passed) {
      const refusedAttestation = buildConfinementAttestation({ request, phase: "refused", outcome: "refused" });
      applyBackendPlanToAttestation(refusedAttestation, backendPlan);
      refusedAttestation.evidence.push({ kind: "falsification-probe", ref: probe.message, freshness: "stale", fingerprint: probe.fingerprint });
      saveAttestationRecord(refusedAttestation, request.context);
      throw new DispatchError("confinement-probe-failed", `required confinement refused: ${probe.message}`, {
        contract: "confinement-execution.v1", status: "refused", dispatchId: request.dispatchId,
        capability: request.capability, requirement: request.requirement, attestation: refusedAttestation,
      });
    }
    backendPlan.probe = probe;

    preparedConfinement = await driver.prepare(backendPlan, request, backendInstance);

    let claimsMismatch = false;
    if (!preparedConfinement?.claims) {
      claimsMismatch = true;
    } else {
      for (const [key, expected] of Object.entries(backendPlan.coverage || {})) {
        if (preparedConfinement.claims[key] !== expected) {
          claimsMismatch = true;
          break;
        }
      }
      if (!claimsMismatch) {
        for (const key of Object.keys(preparedConfinement.claims)) {
          if (!(key in (backendPlan.coverage || {}))) {
            claimsMismatch = true;
            break;
          }
        }
      }
    }

    if (claimsMismatch) {
      if (preparedConfinement?.cleanup) {
        try { await preparedConfinement.cleanup(); } catch {}
      }
      const refusedAttestation = buildConfinementAttestation({ request, phase: "refused", outcome: "refused" });
      applyBackendPlanToAttestation(refusedAttestation, backendPlan);
      refusedAttestation.mismatches.push({
        code: "confinement-plan-mismatch",
        detail: "prepared confinement claims mismatch the assessed plan coverage.",
      });
      saveAttestationRecord(refusedAttestation, request.context);
      throw new DispatchError(
        "confinement-plan-mismatch",
        `prepared confinement claims mismatch the assessed plan coverage for capability "${request.capability}".`,
        {
          contract: "confinement-execution.v1",
          status: "refused",
          dispatchId: request.dispatchId,
          capability: request.capability,
          requirement: request.requirement,
          attestation: refusedAttestation,
        },
      );
    }

    const prepAttestation = buildConfinementAttestation({
      request,
      phase: "prepared",
      outcome: "unknown",
      driverClaims: preparedConfinement.claims,
    });
    applyBackendPlanToAttestation(prepAttestation, backendPlan);
    saveAttestationRecord(prepAttestation, request.context);
  } else if (request.assignmentLaunchContext) {
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
      backend: {
        id: "none",
        type: "none",
        version: "none",
        configDigest: null,
      },
      mismatches: [],
    };
    savePlanRecord(backendPlan, request.context);

    const prepAttestation = buildConfinementAttestation({
      request,
      phase: "prepared",
      outcome: "unconfined",
    });
    applyBackendPlanToAttestation(prepAttestation, backendPlan);
    saveAttestationRecord(prepAttestation, request.context);
  }

  return {
    backendInstance,
    driver,
    backendPlan,
    preparedConfinement,
  };
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

  if (!request.assignmentLaunchContext) {
    throw new DispatchError(
      'confinement-launch-context-invalid',
      'prepareConfinementForLaunch requires assignmentLaunchContext.',
      { contract: 'confinement-execution.v1', status: 'refused', dispatchId: request.dispatchId },
    );
  }

  const launchContext = request.assignmentLaunchContext;
  validateAssignmentLaunchContext(launchContext, request.context);

  const runDir = request.context?.runDir;
  if (!runDir) {
    throw new DispatchError(
      'confinement-launch-context-invalid',
      'prepareConfinementForLaunch requires context.runDir.',
      { contract: 'confinement-execution.v1', status: 'refused', dispatchId: request.dispatchId },
    );
  }
  // H11: 0700 at first creation -- everything this function publishes under
  // here (prepared-invocation, finalization descriptor) is
  // host-private evidence, never meant to be world/group-readable. A
  // subsequent mkdirSync(..., {recursive:true}) by the generic publish
  // helpers below is a no-op on an already-existing directory and never
  // widens this back.
  try { fs.mkdirSync(path.join(runDir, 'protected'), { recursive: true, mode: 0o700 }); } catch {}

  const launchCommandId = launchContext.command?.launchCommandId;
  if (!launchCommandId) {
    throw new DispatchError(
      'confinement-launch-context-invalid',
      'prepareConfinementForLaunch requires launchCommandId in assignmentLaunchContext.command.',
      { contract: 'confinement-execution.v1', status: 'refused', dispatchId: request.dispatchId },
    );
  }
  // Every launch is an attempt of the run supervisor: the attempt envelope its controller writes is the one
  // launch record, so a request without one is refused before anything is prepared.
  if (typeof request.attemptId !== 'string' || request.attemptId === '') {
    throw new DispatchError('attempt-required', 'a launch needs a supervised attempt (the request carries no attemptId)', {
      code: 'attempt-required',
      runId: launchContext.run.runId,
      launchCommandId,
    });
  }

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
  const publishedInvocationPath = path.join(runDir ?? "", "protected", "prepared-invocation", `${launchCommandId}.json`);
  let publishedArgs = null;
  try { publishedArgs = JSON.parse(fs.readFileSync(publishedInvocationPath, 'utf8'))?.workerInvocation?.args ?? null; } catch { /* first attempt */ }
  const workerArgs = Array.isArray(publishedArgs) ? publishedArgs : [
    ...attemptAgentArgv.slice(1),
    // The target project's own MCP servers are approved for this worker only, so the claude
    // dialog that asks a person cannot stop an unattended seat.
    ...(claudeTrust?.kind === 'claude-json'
      ? claudeMcpApprovalArgs({
        cwd: request.context.cwd,
        repoRoot: request.context.repoRoot ?? request.context.cwd,
        storePath: claudeTrust.path ?? path.join(os.homedir(), '.claude.json'),
      })
      : []),
  ];
  const workerCwd = request.context.cwd;
  const depth = currentDispatchDepth();
  const rawEnv = sourceInvocation.env || {};
  const resolvedExecutorEnv = resolveExecutorEnv(rawEnv);
  const workerEnv = {
    ...workerBaseEnv(),
    ...resolvedExecutorEnv,
    [DISPATCH_DEPTH_ENV]: String(depth + 1),
  };

  const workerCommandDigest = computeSha256Digest({ command: workerCommand, args: workerArgs });
  const envDigest = computeSha256Digest(workerEnv);
  const attestationPlanDigest = computeSha256Digest(backendPlan);

  // H11: the real env (with secrets) is never persisted here: the attempt keeps it in the side file its
  // controller writes next to the envelope. The records below carry `redactedEnv` (allow-list only) plus
  // `envDigest` (over the FULL real env) as the verifiable commitment to what the real env was.
  const redactedEnv = redactEnvForPersistence(workerEnv);

  // Resource bindings with ownership marker digests
  const resourceBindingsList = [];
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
      });
    }

    resourceBindingsList.push({
      resource: res.resource,
      access: res.access,
      hostTargetDigest: computeSha256Digest(res.hostTarget || res.resource),
      executionTarget: res.executionTarget?.path || res.resource,
      ownershipMarkerDigest,
    });
  }

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
      // H11: real env stays in-memory only; the disk record below carries the redacted env.
      env: workerEnv,
      envDigest,
      workerCommandDigest,
      stdin: 'ignore',
      encoding: 'utf8',
      timeoutMs: request.context.timeoutMs || 900000,
      idleTimeoutMs: request.context.idleTimeoutMs || null,
      maxBuffer: request.context.maxBuffer || 10485760,
    },
    resourceBindings: resourceBindingsList,
    ...(preparedConfinement?.providerCapacity ? { providerCapacity: preparedConfinement.providerCapacity } : {}),
    proof: {
      confinementPlanDigest: attestationPlanDigest,
      preparedAttestationDigest: computeSha256Digest(backendPlan),
      probeFingerprintDigest: backendPlan?.probe?.fingerprint ? computeSha256Digest(backendPlan.probe.fingerprint) : null,
    },
    publishedAt: new Date().toISOString(),
  };

  const preparedInvocationPath = path.join(runDir, 'protected', 'prepared-invocation', `${launchCommandId}.json`);

  // F1 (resume corrupts prepared digest): `preparedInvocationRecord.publishedAt`
  // above is always "now", so a resume that re-enters this function for the
  // SAME launchCommandId always recomputes a byte-different record and thus a
  // DIFFERENT digest than the one the first attempt actually published.
  // `publishImmutableProof` below is itself resume-safe (its EEXIST branch
  // never overwrites the file), but every caller downstream (the attempt
  // envelope and confinement-finalization.v1's own
  // `preparedInvocationDigest` field) reads the digest from THIS variable,
  // not from disk -- so on resume they must reuse the ORIGINAL record's
  // digest, never a freshly recomputed one, or `reconcileHerdrSpawnRun`
  // refuses a live, healthy worker as `confinement-mismatch` purely because
  // this function ran twice.
  // H11: the digest (and the on-disk record) are computed over a REDACTED
  // clone -- the same shape as `preparedInvocationRecord` but with
  // `workerInvocation.env` swapped for `redactedEnv` -- never over the
  // real-env object. Every downstream consumer of `preparedInvocationDigest`
  // (the attempt envelope, confinement-finalization.v1) only ever needs a stable digest a reader
  // can recompute from the ACTUAL bytes on disk; it was never a digest OF
  // the secrets themselves.
  const preparedInvocationDiskRecord = {
    ...preparedInvocationRecord,
    workerInvocation: { ...preparedInvocationRecord.workerInvocation, env: redactedEnv },
  };
  let preparedInvocationDigest = computeSha256Digest(preparedInvocationDiskRecord);
  preparedInvocationDiskRecord.digest = preparedInvocationDigest;
  preparedInvocationRecord.digest = preparedInvocationDigest;

  if (fs.existsSync(preparedInvocationPath)) {
    try {
      const existingPreparedInvocation = JSON.parse(fs.readFileSync(preparedInvocationPath, 'utf8'));
      if (existingPreparedInvocation?.digest) {
        preparedInvocationDigest = existingPreparedInvocation.digest;
        preparedInvocationRecord.digest = preparedInvocationDigest;
      }
    } catch {
      // Corrupt on-disk record: fall through and attempt the normal
      // (no-op-on-EEXIST) publish below, which will surface the mismatch
      // through publishImmutableProof's own collision handling elsewhere.
    }
  } else {
    publishImmutableProof(preparedInvocationPath, preparedInvocationDiskRecord);
  }

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
 * @returns {{state: 'cleaned'|'credential-home-kept'|'credential-home-held', homes: number}}
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
      homes.push({ target, marker: readAttemptHomeMarker(target, attemptId, runDir), writeBack: res.credentialWriteBack, launchCommandId: path.basename(file, '.json') });
    }
  }
  let kept = 0;
  let held = 0;
  for (const { target, marker, writeBack, launchCommandId } of homes) {
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
    removeAttemptHome(target, marker.dispatchId);
  }
  // Homes held by other attempts under the same roots: whatever kept them may be gone by now.
  try {
    settleHeldCredentialHomes({ tempRoots: [...new Set(homes.map(({ target }) => path.dirname(path.dirname(target))))] });
  } catch { /* they stay held; doctor names them */ }
  if (kept > 0) return { state: CREDENTIAL_HOME_KEPT, homes: homes.length };
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
  return { state: held > 0 ? CREDENTIAL_HOME_HELD : 'cleaned', homes: homes.length };
}
