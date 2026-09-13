// authority.mjs — Agent Confinement Authority runtime execution door
// (Phase 02 R1-R7, docs/specs/confinement-authority.md §1, §5.2, §6.6, §6.9).

import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { EXECUTOR_ADAPTERS, DEFAULT_ADAPTER, DispatchError, getAdapterMetadata, resolveExecutorEnv, currentDispatchDepth, DISPATCH_DEPTH_ENV } from "../transport.mjs";
import { RunnerConfigError } from "../config.mjs";
import { validateConfinementRequest, validateAssignmentLaunchContext } from "./request.mjs";
import { saveAttestationRecord, savePlanRecord, assertAttestationStoreIsolated, verifyAttestationStoreIsolation } from "./attestation-store.mjs";
import {
  loadMachineBackendRegistry,
  createBackendRegistrySnapshot,
  getBackendDriver,
} from "./backend-registry.mjs";
import { computeProbeFingerprint, runAllConfinementProbes } from "./probes/harness.mjs";

import { normalizeLegacyConfinement } from "./policies.mjs";
import { evaluateBypassPairing } from "./bypass-pairing.mjs";
import { OWNERSHIP_MARKER_FILE } from "./cleanup.mjs";
import {
  canonicalJson,
  computeSha256Digest,
  publishImmutableProof,
  publishMutableProjection,
  updateCommandEnvelope,
  commitCommandOutcome,
} from "../cli-spawn-supervisor.mjs";

export {
  DispatchError,
  canonicalJson,
  computeSha256Digest,
  publishImmutableProof,
  publishMutableProjection,
  updateCommandEnvelope,
  commitCommandOutcome,
};

function applyBackendPlanToAttestation(attestation, backendPlan) {
  if (!backendPlan) return attestation;
  attestation.coverage = backendPlan.coverage;
  attestation.resources = backendPlan.resources;
  attestation.readiness = backendPlan.readiness;
  attestation.grants = backendPlan.grants;
  attestation.backend = backendPlan.backend;
  if (Array.isArray(backendPlan.mismatches)) {
    const existingCodes = new Set((attestation.mismatches || []).map((m) => m.code));
    attestation.mismatches = [
      ...(attestation.mismatches || []),
      ...backendPlan.mismatches.filter((m) => !existingCodes.has(m.code)),
    ];
  }
  return attestation;
}

function adapterConsumesPreparedSandbox(adapterName, adapterPort) {
  if (adapterPort && typeof adapterPort === 'object' && adapterPort.preparedInvocationContract === 'exact-v1') {
    return true;
  }
  const meta = getAdapterMetadata(adapterName);
  return meta?.preparedInvocationContract === 'exact-v1';
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
  const result = runAllConfinementProbes({ bwrapBin: executable });
  return {
    ...result,
    fingerprint: computeProbeFingerprint({
      policy: request.requirement.policy,
      driverVersion: driver.version,
      backendConfig: backendInstance.config || {},
      bwrapExecutable: executable,
    }),
  };
}

/**
 * Build a canonical ConfinementAttestationV1 (spec §6.6).
 */
export function buildConfinementAttestation({
  request,
  phase = "completed",
  outcome = null,
  error = null,
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

  if (hasBwrapCmd && Array.isArray(request.invocation?.args)) {
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
  };

  const coverage = {};
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
            ? "observed hand-written bwrap sandbox"
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
            ? "observed hand-written bwrap sandbox"
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
    requested: {
      mode: reqMode,
      policyId: request.requirement?.policyId ?? null,
      policy: request.requirement?.policy ?? null,
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
 * The single runtime door to external executor adapters.
 *
 * executeThroughConfinement(request, adapterPort) -> result + attestation
 */
export async function executeThroughConfinement(request, adapterPort = null) {
  validateConfinementRequest(request);

  // R6: In-process Agent/Task dispatch gets authorityScope: "external-harness" with null attestation
  if (request.authorityScope === "external-harness") {
    if (request.requirement?.mode === "required") {
      const refusedAttestation = buildConfinementAttestation({
        request,
        phase: "refused",
        outcome: "refused",
      });
      throw new DispatchError(
        "confinement-unsupported",
        `required confinement refused: in-process dispatch has no trusted harness attestation contract (authorityScope "external-harness").`,
        {
          contract: "confinement-execution.v1",
          status: "refused",
          dispatchId: request.dispatchId,
          capability: request.capability,
          requirement: request.requirement,
          attestation: refusedAttestation,
          authorityScope: "external-harness",
        },
      );
    }
    return {
      ...request.invocation,
      contract: "confinement-execution.v1",
      status: "completed",
      result: request.invocation,
      attestation: null,
      authorityScope: "external-harness",
    };
  }

  // R2: Preferred mode stays disabled / explicitly bounded; never silently runs unconfined;
  // cleanly refuses before spawn with named reason (confinement-mode-unsupported).
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

  // Safe pre-adapter preparation checks (R3, R5: ownWorktree & bypass pairing)
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

  // Phase 04 Required Enforcement & Backend Resolution:
  let backendInstance = null;
  let driver = null;
  let backendPlan = null;
  let preparedConfinement = null;
  const adapterName = request.invocation?.adapter ?? DEFAULT_ADAPTER;

  if (!request.assignmentLaunchContext) {
    if (request.backendId) {
    const registryDoc = loadMachineBackendRegistry();
    const rawInstance = registryDoc?.confinementBackends?.[request.backendId];
    if (rawInstance && rawInstance.enabled === false) {
      const refusedAttestation = buildConfinementAttestation({
        request,
        phase: "refused",
        outcome: "refused",
      });
      saveAttestationRecord(refusedAttestation, request.context);
      throw new DispatchError(
        "confinement-backend-disabled",
        `confinement backend instance "${request.backendId}" is disabled in machine registry.`,
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
    backendInstance = snapshot.resolve(request.backendId);
    if (!backendInstance) {
      const refusedAttestation = buildConfinementAttestation({
        request,
        phase: "refused",
        outcome: "refused",
      });
      saveAttestationRecord(refusedAttestation, request.context);
      throw new DispatchError(
        "confinement-backend-missing",
        `confinement backend instance "${request.backendId}" not found in machine registry.`,
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
    driver = getBackendDriver(backendInstance.type);
  }

  if (request.requirement?.mode === "required") {
    if (!request.backendId) {
      const refusedAttestation = buildConfinementAttestation({
        request,
        phase: "refused",
        outcome: "refused",
      });
      saveAttestationRecord(refusedAttestation, request.context);
      throw new DispatchError(
        "confinement-backend-missing",
        `required confinement refused for capability "${request.capability}": no confinement backend specified.`,
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

    if (!backendInstance || !driver) {
      const refusedAttestation = buildConfinementAttestation({
        request,
        phase: "refused",
        outcome: "refused",
      });
      saveAttestationRecord(refusedAttestation, request.context);
      throw new DispatchError(
        "confinement-backend-missing",
        `required confinement refused for capability "${request.capability}": backend "${request.backendId}" unavailable.`,
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

    const assessment = driver.assess(request, backendInstance);
    if (!adapterConsumesPreparedSandbox(adapterName, adapterPort)) {
      const detail = `adapter ${adapterName} does not apply the prepared sandbox.`;
      assessment.mismatches.push({ code: 'confinement-adapter-unsupported', detail });
      for (const key of Object.keys(assessment.coverage)) {
        if (assessment.coverage[key] === 'satisfied') assessment.coverage[key] = 'unverified';
      }
    }
    const coverageFailures = requiredCoverageFailures(request.requirement.policy, assessment.coverage);
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

    // The same real falsification harness used by doctor is Authority's
    // pre-spawn proof gate. Structural inspection of argv cannot establish
    // outcome: enforced (spec §6.6).
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

    // Verify prepared claims match plan coverage (R1: prepared claims mismatch the plan)
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
    });
    applyBackendPlanToAttestation(prepAttestation, backendPlan);
    saveAttestationRecord(prepAttestation, request.context);
  }
}

  // R3: Resolve adapter function through Authority
  let adapterFn = null;
  if (typeof adapterPort === "function") {
    adapterFn = adapterPort;
  } else if (typeof adapterPort === "object" && adapterPort !== null) {
    if (typeof adapterPort.execute === "function") {
      adapterFn = adapterPort.execute.bind(adapterPort);
    } else if (typeof adapterPort[adapterName] === "function") {
      adapterFn = adapterPort[adapterName];
    } else if (typeof adapterPort.getAdapter === "function") {
      adapterFn = adapterPort.getAdapter(adapterName);
    }
  }

  if (!adapterFn) {
    adapterFn = EXECUTOR_ADAPTERS[adapterName];
  }

  if (!adapterFn) {
    throw new RunnerConfigError(`no executor adapter registered for "${adapterName}".`);
  }

  let preparedLaunch = null;
  if (request.assignmentLaunchContext) {
    try {
      preparedLaunch = await prepareConfinementForLaunch(request, { adapterPort });
      const launchCommandId = request.assignmentLaunchContext.command?.launchCommandId;
      const runDir = request.context?.runDir;
      const controlEpoch = request.assignmentLaunchContext.command?.controlEpoch;
      const controlToken = request.context?.controlToken || request.assignmentLaunchContext.command?.controlToken;
      if (runDir && launchCommandId && controlToken) {
        updateCommandEnvelope({
          runDir,
          launchCommandId,
          controlEpoch,
          controlToken,
          envelopeDigest: preparedLaunch.envelope.digest,
        });
      }
    } catch (err) {
      const launchCommandId = request.assignmentLaunchContext.command?.launchCommandId;
      const runDir = request.context?.runDir;
      const controlEpoch = request.assignmentLaunchContext.command?.controlEpoch;
      const controlToken = request.context?.controlToken || request.assignmentLaunchContext.command?.controlToken;
      if (runDir && launchCommandId && controlToken) {
        try {
          const failedAt = new Date().toISOString();
          const failureDetail = {
            message: err.message,
            code: err.code || err.errorClass || null,
            source: 'confinement-authority',
          };
          const failureDigest = computeSha256Digest({
            kind: 'submission-refused',
            reason: 'confinement-refused',
            failureDetail,
            failedAt,
          });
          commitCommandOutcome({
            runDir,
            launchCommandId,
            controlEpoch,
            controlToken,
            outcome: {
              kind: 'submission-refused',
              reason: 'confinement-refused',
              failureDetail,
              failureDigest,
              failedAt,
            },
            state: 'reconciled',
          });
        } catch {}
      }
      throw err;
    }
  }

  // Prepare invocation
  const sourceInvocation = preparedLaunch?.envelope?.invocation || preparedConfinement?.invocation || request.invocation;
  const preparedInvocation = {
    command: sourceInvocation.command,
    args: sourceInvocation.args,
    argsTemplate: sourceInvocation.argsTemplate,
    prompt: sourceInvocation.prompt,
    env: sourceInvocation.env,
    liveOutput: sourceInvocation.liveOutput,
    interactiveMode: sourceInvocation.interactiveMode,
    promptDelivery: sourceInvocation.promptDelivery,
    permissionMode: sourceInvocation.permissionMode,
    confinement: sourceInvocation.confinement,
    method: sourceInvocation.transport?.method ?? sourceInvocation.method,
    url: sourceInvocation.transport?.url ?? sourceInvocation.url,
    headers: sourceInvocation.transport?.headers ?? sourceInvocation.headers,
    body: sourceInvocation.transport?.body ?? sourceInvocation.body,
  };

  const adapterOpts = {
    cwd: request.context.cwd,
    repoRoot: request.context.repoRoot,
    runDir: request.context.runDir,
    timeoutMs: request.context.timeoutMs,
    idleTimeoutMs: request.context.idleTimeoutMs,
    maxBuffer: request.context.maxBuffer,
    onChunk: request.context.onChunk,
    workId: request.context.workId ?? request.executorId,
    tier: request.context.tier,
    model: request.context.model,
    herdrBin: request.context.herdrBin,
    transportDeadlines: request.context.transportDeadlines,
    closeAlways: request.context.closeAlways,
    dispatchBatchKey: request.context.dispatchBatchKey,
  };

  if (preparedLaunch) {
    adapterOpts.envelopePath = preparedLaunch.envelopePath;
    adapterOpts.envelope = preparedLaunch.envelope;
    adapterOpts.assignmentLaunchContext = request.assignmentLaunchContext;
    adapterOpts.launchCommandId = request.assignmentLaunchContext.command?.launchCommandId;
    adapterOpts.controlEpoch = request.assignmentLaunchContext.command?.controlEpoch;
    adapterOpts.controlToken = request.context?.controlToken || request.assignmentLaunchContext.command?.controlToken;
  }

  let adapterResult;
  try {
    adapterResult = await adapterFn(preparedInvocation, adapterOpts);
    if (preparedLaunch && adapterResult?.receipt) {
      const launchCommandId = request.assignmentLaunchContext.command?.launchCommandId;
      const runDir = request.context?.runDir;
      const controlEpoch = request.assignmentLaunchContext.command?.controlEpoch;
      const controlToken = request.context?.controlToken || request.assignmentLaunchContext.command?.controlToken;
      if (runDir && launchCommandId && controlToken) {
        const outcome = {
          kind: 'receipt-backed',
          receiptDigest: adapterResult.receipt.digest,
          adapterCompletion: {
            kind: adapterResult.receipt.completion?.kind || 'unknown',
          },
        };
        commitCommandOutcome({
          runDir,
          launchCommandId,
          controlEpoch,
          controlToken,
          outcome,
          state: 'reconciled',
          receiptDigest: adapterResult.receipt.digest,
          bindingDigest: adapterResult.receipt.bindingDigest,
        });
      }
    }
  } catch (err) {
    if (preparedLaunch) {
      const launchCommandId = request.assignmentLaunchContext.command?.launchCommandId;
      const runDir = request.context?.runDir;
      const controlEpoch = request.assignmentLaunchContext.command?.controlEpoch;
      const controlToken = request.context?.controlToken || request.assignmentLaunchContext.command?.controlToken;
      const receipt = err.receipt || err.context?.receipt;
      if (receipt && runDir && launchCommandId && controlToken) {
        const outcome = {
          kind: 'receipt-backed',
          receiptDigest: receipt.digest,
          adapterCompletion: {
            kind: receipt.completion?.kind || 'unknown',
          },
        };
        commitCommandOutcome({
          runDir,
          launchCommandId,
          controlEpoch,
          controlToken,
          outcome,
          state: 'reconciled',
          receiptDigest: receipt.digest,
          bindingDigest: receipt.bindingDigest,
        });
      } else if (runDir && launchCommandId && controlToken) {
        try {
          const failedAt = new Date().toISOString();
          const failureDetail = {
            message: err.message,
            code: err.code || err.errorClass || null,
            source: 'supervisor-launch',
          };
          const failureDigest = computeSha256Digest({
            kind: 'submission-refused',
            reason: 'supervisor-spawn-refused',
            failureDetail,
            failedAt,
          });
          commitCommandOutcome({
            runDir,
            launchCommandId,
            controlEpoch,
            controlToken,
            outcome: {
              kind: 'submission-refused',
              reason: 'supervisor-spawn-refused',
              failureDetail,
              failureDigest,
              failedAt,
            },
            state: 'reconciled',
          });
        } catch {}
      }
    }
    const failedAttestation = buildConfinementAttestation({
      request,
      phase: "failed",
      outcome: "unknown",
      error: err,
    });
    applyBackendPlanToAttestation(failedAttestation, backendPlan);
    saveAttestationRecord(failedAttestation, request.context);
    if (err instanceof DispatchError) {
      err.contract = "confinement-execution.v1";
      err.status = "failed";
      err.attestation = failedAttestation;
      err.dispatchId = request.dispatchId;
      err.cleanup = failedAttestation.cleanup;
      if (err.result === undefined && adapterResult !== undefined) {
        err.result = adapterResult;
      }
      throw err;
    }
    throw new DispatchError(
      "confinement-execution-failed",
      `confinement execution failed for dispatch "${request.dispatchId}": ${err.message}`,
      {
        contract: "confinement-execution.v1",
        status: "failed",
        dispatchId: request.dispatchId,
        attestation: failedAttestation,
        cleanup: failedAttestation.cleanup,
        result: adapterResult,
        cause: err.message,
      },
    );
  } finally {
    if (preparedConfinement?.cleanup) {
      try {
        await preparedConfinement.cleanup();
      } catch {
        // cleanup failure preserved
      }
    }
  }

  const attestation = buildConfinementAttestation({
    request,
    phase: "completed",
    outcome: preparedConfinement ? "enforced" : undefined,
  });
  applyBackendPlanToAttestation(attestation, backendPlan);
  if (backendPlan?.probe?.fingerprint) {
    attestation.evidence.push({
      kind: "falsification-probe",
      ref: "local-bwrap-v1:pre-spawn",
      freshness: "current",
      fingerprint: backendPlan.probe.fingerprint,
    });
  }
  saveAttestationRecord(attestation, request.context);

  return {
    ...adapterResult,
    contract: "confinement-execution.v1",
    status: "completed",
    result: adapterResult,
    attestation,
  };
}

/**
 * Prepare confinement for launch (Producer Ordering, spec & contracts).
 *
 * Persists prepared attestation, publishes authority-prepared-invocation.v1,
 * publishes confinement-finalization.v1 descriptor, and publishes launch-envelope.v1.
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

  const launchCommandId = launchContext.command?.launchCommandId;
  if (!launchCommandId) {
    throw new DispatchError(
      'confinement-launch-context-invalid',
      'prepareConfinementForLaunch requires launchCommandId in assignmentLaunchContext.command.',
      { contract: 'confinement-execution.v1', status: 'refused', dispatchId: request.dispatchId },
    );
  }

  const adapterName = request.invocation?.adapter || DEFAULT_ADAPTER;
  const reqMode = request.requirement?.mode ?? 'unconfined';

  let backendPlan = null;
  let preparedConfinement = null;
  let backendInstance = null;
  let driver = null;

  if (reqMode !== 'unconfined') {
    const backendRegistry = loadMachineBackendRegistry();
    const backendId = request.backendId || backendRegistry.defaultBackend || 'bwrap';
    const rawInstance = backendRegistry.confinementBackends?.[backendId];

    if (!rawInstance || rawInstance.enabled === false) {
      const refusedAttestation = buildConfinementAttestation({ request, phase: 'refused', outcome: 'refused' });
      refusedAttestation.mismatches.push({
        code: 'confinement-backend-missing',
        detail: `confinement backend "${backendId}" is not configured or disabled.`,
      });
      saveAttestationRecord(refusedAttestation, request.context);
      throw new DispatchError('confinement-backend-missing', `confinement backend "${backendId}" is not available.`, {
        contract: 'confinement-execution.v1', status: 'refused', dispatchId: request.dispatchId,
        capability: request.capability, requirement: request.requirement, attestation: refusedAttestation,
      });
    }

    const snapshot = createBackendRegistrySnapshot(backendRegistry);
    backendInstance = snapshot.resolve(backendId);
    if (!backendInstance) {
      const refusedAttestation = buildConfinementAttestation({ request, phase: 'refused', outcome: 'refused' });
      refusedAttestation.mismatches.push({
        code: 'confinement-backend-missing',
        detail: `confinement backend "${backendId}" could not be resolved from snapshot.`,
      });
      saveAttestationRecord(refusedAttestation, request.context);
      throw new DispatchError('confinement-backend-missing', `confinement backend "${backendId}" is not available.`, {
        contract: 'confinement-execution.v1', status: 'refused', dispatchId: request.dispatchId,
        capability: request.capability, requirement: request.requirement, attestation: refusedAttestation,
      });
    }

    try {
      driver = getBackendDriver(backendInstance.type);
    } catch (err) {
      const refusedAttestation = buildConfinementAttestation({ request, phase: 'refused', outcome: 'refused' });
      refusedAttestation.mismatches.push({ code: 'confinement-backend-missing', detail: err.message });
      saveAttestationRecord(refusedAttestation, request.context);
      throw new DispatchError('confinement-backend-missing', err.message, {
        contract: 'confinement-execution.v1', status: 'refused', dispatchId: request.dispatchId,
        capability: request.capability, requirement: request.requirement, attestation: refusedAttestation,
      });
    }

    const assessment = driver.assess(request, backendInstance);
    if (!adapterConsumesPreparedSandbox(adapterName, opts.adapterPort)) {
      const detail = `adapter ${adapterName} does not apply the prepared sandbox.`;
      assessment.mismatches.push({ code: 'confinement-adapter-unsupported', detail });
      for (const key of Object.keys(assessment.coverage)) {
        if (assessment.coverage[key] === 'satisfied') assessment.coverage[key] = 'unverified';
      }
    }

    // Fail closed if protected or attestation store overlaps writable worker grant
    try {
      assertAttestationStoreIsolated(request.context, assessment.resources || []);
      if (request.context?.runDir) {
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

    const coverageFailures = requiredCoverageFailures(request.requirement.policy, assessment.coverage);
    for (const failure of coverageFailures) {
      assessment.mismatches.push({
        code: 'confinement-coverage-unverified',
        detail: `${failure.key} has ${failure.coverage} coverage; required confinement needs satisfied coverage.`,
      });
    }

    backendPlan = {
      contract: 'confinement-plan.v1',
      dispatchId: request.dispatchId,
      decision: assessment.mismatches.length > 0 ? 'refuse' : 'execute',
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
        configDigest: crypto.createHash('sha256').update(JSON.stringify(backendInstance.config || {})).digest('hex'),
      },
      mismatches: assessment.mismatches,
    };
    savePlanRecord(backendPlan, request.context);

    if (backendPlan.decision === 'refuse') {
      const refusedAttestation = buildConfinementAttestation({ request, phase: 'refused', outcome: 'refused' });
      applyBackendPlanToAttestation(refusedAttestation, backendPlan);
      saveAttestationRecord(refusedAttestation, request.context);
      const primaryMismatch = assessment.mismatches[0] || {};
      const errorCode = primaryMismatch.code || 'confinement-unsupported';
      throw new DispatchError(
        errorCode,
        `required confinement refused for capability "${request.capability}": ${assessment.mismatches.map((m) => m.detail).join('; ')}`,
        {
          contract: 'confinement-execution.v1', status: 'refused', dispatchId: request.dispatchId,
          capability: request.capability, requirement: request.requirement, attestation: refusedAttestation,
        },
      );
    }

    const probe = verifyRequiredProbe(request, backendInstance, driver);
    if (!probe.passed) {
      const refusedAttestation = buildConfinementAttestation({ request, phase: 'refused', outcome: 'refused' });
      applyBackendPlanToAttestation(refusedAttestation, backendPlan);
      refusedAttestation.evidence.push({ kind: 'falsification-probe', ref: probe.message, freshness: 'stale', fingerprint: probe.fingerprint });
      saveAttestationRecord(refusedAttestation, request.context);
      throw new DispatchError('confinement-probe-failed', `required confinement refused: ${probe.message}`, {
        contract: 'confinement-execution.v1', status: 'refused', dispatchId: request.dispatchId,
        capability: request.capability, requirement: request.requirement, attestation: refusedAttestation,
      });
    }
    backendPlan.probe = probe;

    preparedConfinement = await driver.prepare(backendPlan, request, backendInstance);

    const prepAttestation = buildConfinementAttestation({
      request,
      phase: 'prepared',
      outcome: 'unknown',
    });
    applyBackendPlanToAttestation(prepAttestation, backendPlan);
    saveAttestationRecord(prepAttestation, request.context);
  } else {
    // Unconfined
    backendPlan = {
      contract: 'confinement-plan.v1',
      dispatchId: request.dispatchId,
      decision: 'execute',
      requested: request.requirement,
      coverage: {
        'control:hostWrite': 'unverified',
        'control:hostRead': 'satisfied',
        'control:networkEgress': 'satisfied',
      },
      resources: [],
      readiness: {},
      grants: [],
      backend: {
        id: 'none',
        type: 'none',
        version: 'none',
        configDigest: null,
      },
      mismatches: [],
    };
    savePlanRecord(backendPlan, request.context);

    const prepAttestation = buildConfinementAttestation({
      request,
      phase: 'prepared',
      outcome: 'unconfined',
    });
    applyBackendPlanToAttestation(prepAttestation, backendPlan);
    saveAttestationRecord(prepAttestation, request.context);
  }

  // Prepared Worker Invocation
  const sourceInvocation = preparedConfinement?.invocation || request.invocation;
  const workerCommand = sourceInvocation.command;
  const workerArgs = sourceInvocation.args || [];
  const workerCwd = request.context.cwd;
  const depth = currentDispatchDepth();
  const rawEnv = sourceInvocation.env || {};
  const resolvedExecutorEnv = resolveExecutorEnv(rawEnv);
  const workerEnv = {
    ...process.env,
    ...resolvedExecutorEnv,
    [DISPATCH_DEPTH_ENV]: String(depth + 1),
  };

  const workerCommandDigest = computeSha256Digest({ command: workerCommand, args: workerArgs });
  const envDigest = computeSha256Digest(workerEnv);
  const attestationPlanDigest = computeSha256Digest(backendPlan);
  const launchContextDigest = computeSha256Digest(launchContext);

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
    proof: {
      confinementPlanDigest: attestationPlanDigest,
      preparedAttestationDigest: computeSha256Digest(backendPlan),
      probeFingerprintDigest: backendPlan?.probe?.fingerprint ? computeSha256Digest(backendPlan.probe.fingerprint) : null,
    },
    publishedAt: new Date().toISOString(),
  };

  const preparedInvocationDigest = computeSha256Digest(preparedInvocationRecord);
  preparedInvocationRecord.digest = preparedInvocationDigest;

  const preparedInvocationPath = path.join(runDir, 'protected', 'prepared-invocation', `${launchCommandId}.json`);
  publishImmutableProof(preparedInvocationPath, preparedInvocationRecord);

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

  // 3. Publish cli-spawn-launch-envelope.v1
  const envelopeBody = {
    contract: 'cli-spawn-launch-envelope.v1',
    run: {
      runId: launchContext.run.runId,
      assignmentId: launchContext.run.assignmentId,
      attempt: launchContext.run.attempt,
      dispatchPlanDigest: launchContext.run.dispatchPlanDigest,
      evaluatorBaselineDigest: launchContext.run.evaluatorBaselineDigest,
    },
    command: {
      launchCommandId,
      state: 'pending',
      controlEpoch: launchContext.command.controlEpoch,
      controlTokenDigest: launchContext.command.controlTokenDigest,
    },
    invocation: {
      adapter: 'cli-spawn',
      command: workerCommand,
      args: workerArgs,
      cwd: workerCwd,
      env: workerEnv,
      stdin: 'ignore',
      encoding: 'utf8',
      dispatchDepth: depth + 1,
      timeoutMs: request.context.timeoutMs || 900000,
      idleTimeoutMs: request.context.idleTimeoutMs || null,
      maxBuffer: request.context.maxBuffer || 10485760,
    },
    confinement: {
      decision: 'execute',
      launchContextDigest,
      persistedPlanRef: `protected/confinement-finalization/${launchCommandId}.json#preparedPlan`,
      attestationPlanDigest,
      preparedInvocationDigest,
      cleanupDescriptorRef: `protected/confinement-finalization/${launchCommandId}.json`,
    },
    paths: {
      workerOutboxDir: 'worker-output/outbox',
      protectedCaptureDir: `protected/capture/${launchCommandId}`,
      protectedDir: 'protected',
      controllerDir: 'controller',
    },
    publishedAt: new Date().toISOString(),
  };

  const envelopeDigest = computeSha256Digest(envelopeBody);
  const envelope = {
    ...envelopeBody,
    digest: envelopeDigest,
  };

  const envelopePath = path.join(runDir, 'protected', 'launch-envelope', `${launchCommandId}.json`);
  publishImmutableProof(envelopePath, envelope);
  const compatEnvelopePath = path.join(runDir, 'protected', 'launch-envelope.json');
  try {
    publishImmutableProof(compatEnvelopePath, envelope);
  } catch {}

  return {
    envelope,
    envelopePath,
    preparedInvocation: preparedInvocationRecord,
    preparedInvocationDigest,
    finalizationPath,
    finalizationDescriptor: finalizationDescBody,
  };
}

/**
 * Finalize confinement resources idempotently.
 */
export async function finalizeConfinementResources({
  runDir,
  launchCommandId,
  receipt = null,
  descriptor = null,
} = {}) {
  const descriptorPath = path.join(runDir, 'protected', 'confinement-finalization', `${launchCommandId}.json`);
  let finalizationDesc = descriptor;
  if (!finalizationDesc) {
    if (!fs.existsSync(descriptorPath)) {
      return { cleanupState: 'absent', cleanupResult: null };
    }
    try {
      finalizationDesc = JSON.parse(fs.readFileSync(descriptorPath, 'utf8'));
    } catch {
      return { cleanupState: 'corrupt', cleanupResult: null };
    }
  }

  // Idempotent check
  if (finalizationDesc.cleanupState === 'cleaned' || finalizationDesc.cleanupState === 'retained') {
    return {
      cleanupState: finalizationDesc.cleanupState,
      cleanupResult: finalizationDesc.cleanupResult,
      descriptor: finalizationDesc,
    };
  }

  const completionKind = receipt?.completion?.kind || receipt?.outcome?.kind;
  const coverage = receipt?.processTree?.coverage;

  let willClean = false;
  let typedReason = null;

  if (receipt) {
    if ((completionKind === 'exited' || completionKind === 'exit') && (coverage === 'process-group' || !coverage)) {
      willClean = true;
    } else if (completionKind === 'spawn-failed' && receipt.processTree?.terminatedPgid === null) {
      willClean = true;
    } else {
      typedReason = completionKind || 'partial-coverage';
    }
  } else {
    typedReason = 'receipt-missing';
  }

  let cleanupResult = null;
  if (willClean) {
    let allAbsent = true;
    const resourcesList = finalizationDesc.resources || finalizationDesc.temporaryDirectories || [];
    for (const res of resourcesList) {
      const targetPath = res.pathRef || res.path;
      if (!targetPath) continue;
      if (fs.existsSync(targetPath)) {
        allAbsent = false;
        const markerPath = path.join(targetPath, OWNERSHIP_MARKER_FILE);
        let markerDigest = null;
        if (fs.existsSync(markerPath)) {
          try {
            const raw = fs.readFileSync(markerPath, 'utf8');
            try {
              markerDigest = computeSha256Digest(JSON.parse(raw));
            } catch {
              markerDigest = computeSha256Digest(raw);
            }
          } catch {}
        }
        if (res.ownershipMarkerDigest && markerDigest !== res.ownershipMarkerDigest) {
          willClean = false;
          typedReason = 'ownership-marker-mismatch';
          break;
        }
        try {
          fs.rmSync(targetPath, { recursive: true, force: true });
        } catch (err) {
          willClean = false;
          typedReason = `cleanup-failed: ${err.message}`;
          break;
        }
      }
    }
    if (willClean) {
      cleanupResult = allAbsent && (resourcesList.length > 0)
        ? { kind: 'already-absent-after-owned-delete' }
        : { kind: 'cleaned' };
    }
  }

  const updatedDesc = {
    ...finalizationDesc,
    finalAttestation: {
      state: 'published',
      resultRef: receipt ? `protected/adapter-receipts/${launchCommandId}.json` : null,
      resultDigest: receipt?.digest ?? null,
    },
    cleanupState: willClean ? 'cleaned' : 'retained',
    cleanupResult: willClean ? cleanupResult : { kind: 'retained', reason: typedReason },
    updatedAt: new Date().toISOString(),
  };

  publishMutableProjection(descriptorPath, updatedDesc);

  return {
    cleanupState: updatedDesc.cleanupState,
    cleanupResult: updatedDesc.cleanupResult,
    descriptor: updatedDesc,
  };
}

