// authority.mjs — Agent Confinement Authority runtime execution door
// (Phase 02 R1-R7, docs/specs/confinement-authority.md §1, §5.2, §6.6, §6.9).

import crypto from "node:crypto";
import path from "node:path";
import { EXECUTOR_ADAPTERS, DEFAULT_ADAPTER, DispatchError } from "../transport.mjs";
import { RunnerConfigError } from "../config.mjs";
import { validateConfinementRequest } from "./request.mjs";
import { saveAttestationRecord, savePlanRecord } from "./attestation-store.mjs";
import {
  loadMachineBackendRegistry,
  createBackendRegistrySnapshot,
  getBackendDriver,
} from "./backend-registry.mjs";
import { computeProbeFingerprint, runAllConfinementProbes } from "./probes/harness.mjs";

export { DispatchError };

function applyBackendPlanToAttestation(attestation, backendPlan) {
  if (!backendPlan) return attestation;
  attestation.coverage = backendPlan.coverage;
  attestation.resources = backendPlan.resources;
  attestation.readiness = backendPlan.readiness;
  attestation.grants = backendPlan.grants;
  attestation.backend = backendPlan.backend;
  if (Array.isArray(backendPlan.mismatches)) {
    attestation.mismatches = backendPlan.mismatches;
  }
  return attestation;
}

function adapterConsumesPreparedSandbox(adapterName) {
  // Only adapters that execute Authority's prepared command and argv may
  // receive a bwrap enforcement attestation. New adapters intentionally
  // default to unverified until they prove that contract.
  return adapterName === 'cli-spawn';
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

  const legacy = request.requirement?.legacy;
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
          coverage: legacy?.controls?.session === "isolated" ? "covered" : "out-of-scope",
          detail: legacy?.controls?.session === "isolated"
            ? "observed legacy isolated session"
            : "observe-mode: host IPC unmanaged",
        },
        {
          name: "network",
          coverage: "out-of-scope",
          detail: "observe-mode: network unmanaged",
        },
      ];

  const evidence = [
    {
      kind: "structural-observation",
      ref: `dispatch:${request.dispatchId}`,
      freshness: "current",
    },
  ];
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
    mismatches: [],
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

  // Phase 04 Required Enforcement & Backend Resolution:
  let backendInstance = null;
  let driver = null;
  let backendPlan = null;
  let preparedConfinement = null;
  const adapterName = request.invocation?.adapter ?? DEFAULT_ADAPTER;

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
    if (!adapterConsumesPreparedSandbox(adapterName)) {
      const detail = `adapter ${adapterName} does not apply the prepared sandbox.`;
      assessment.mismatches.push({ code: 'confinement-unsupported', detail });
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

  // Prepare invocation
  const sourceInvocation = preparedConfinement?.invocation || request.invocation;
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
  };

  let adapterResult;
  try {
    adapterResult = await adapterFn(preparedInvocation, adapterOpts);
  } catch (err) {
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
