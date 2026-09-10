// authority.mjs — Agent Confinement Authority runtime execution door
// (Phase 02 R1-R7, docs/specs/confinement-authority.md §1, §5.2, §6.6, §6.9).

import { EXECUTOR_ADAPTERS, DEFAULT_ADAPTER, DispatchError } from "../transport.mjs";
import { RunnerConfigError } from "../config.mjs";
import { validateConfinementRequest } from "./request.mjs";

export { DispatchError };

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
  const isBwrap =
    request.invocation?.command === "bwrap" ||
    request.executorId?.includes?.("bwrap") ||
    (Array.isArray(request.invocation?.args) && request.invocation.args.includes("bwrap"));

  const effectiveControls = {
    ...(legacy?.controls ? { ...legacy.controls } : {}),
    ...(isBwrap ? { hostWrite: "deny", process: "isolated" } : {}),
  };

  const coverage = {};
  if (isBwrap) {
    coverage["control:hostWrite"] = "satisfied";
    coverage["control:process"] = "satisfied";
  }
  if (legacy?.controls?.session === "isolated") {
    coverage["control:session"] = "satisfied";
  }
  if (legacy?.controls?.workspace === "own") {
    coverage["control:workspace"] = "satisfied";
  }
  if (legacy?.controls?.home === "private") {
    coverage["control:home"] = "satisfied";
  }

  const grants = [
    ...(legacy?.grants ? legacy.grants.map((g) => ({ ...g, target: g.resource })) : []),
  ];
  if (isBwrap && !grants.some((g) => g.resource === "run-output")) {
    grants.push({
      resource: "run-output",
      access: "write",
      target: request.context?.runDir ?? "run-output",
    });
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
          coverage: isBwrap ? "covered" : "unknown",
          detail: isBwrap
            ? "observed hand-written bwrap sandbox"
            : (request.requirement?.policyId
                ? `observe-mode: unverified execution for policy ${request.requirement.policyId}`
                : "observe-mode: no policy declared"),
        },
        {
          name: "inherited-fd",
          coverage: isBwrap ? "covered" : "unknown",
          detail: isBwrap
            ? "observed hand-written bwrap sandbox"
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
  if (isBwrap) {
    evidence.push({
      kind: "structural-observation",
      ref: `bwrap-argv:${request.executorId}`,
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
      contract: "confinement-execution.v1",
      status: "completed",
      result: request.invocation,
      ...request.invocation,
      attestation: null,
      authorityScope: "external-harness",
    };
  }

  // R7 / Phase 02 Observe Mode:
  // Required confinement must refuse before spawn since bwrap enforcement is not active in this phase
  if (request.requirement?.mode === "required") {
    const refusedAttestation = buildConfinementAttestation({
      request,
      phase: "refused",
      outcome: "refused",
    });
    throw new DispatchError(
      "confinement-unsupported",
      `required confinement refused for capability "${request.capability}": no confinement backend available in observe mode.`,
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

  // R3: Resolve adapter function through Authority
  let adapterFn = null;
  const adapterName = request.invocation?.adapter ?? DEFAULT_ADAPTER;

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
  const preparedInvocation = {
    command: request.invocation.command,
    args: request.invocation.args,
    argsTemplate: request.invocation.argsTemplate,
    prompt: request.invocation.prompt,
    env: request.invocation.env,
    liveOutput: request.invocation.liveOutput,
    interactiveMode: request.invocation.interactiveMode,
    promptDelivery: request.invocation.promptDelivery,
    permissionMode: request.invocation.permissionMode,
    confinement: request.invocation.confinement,
    method: request.invocation.transport?.method ?? request.invocation.method,
    url: request.invocation.transport?.url ?? request.invocation.url,
    headers: request.invocation.transport?.headers ?? request.invocation.headers,
    body: request.invocation.transport?.body ?? request.invocation.body,
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
  }

  const attestation = buildConfinementAttestation({
    request,
    phase: "completed",
  });

  return {
    contract: "confinement-execution.v1",
    status: "completed",
    result: adapterResult,
    ...adapterResult,
    attestation,
  };
}
