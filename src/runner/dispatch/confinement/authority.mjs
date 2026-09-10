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

  const channels = isExplicitUnconfined
    ? [
        { name: "filesystem", coverage: "out-of-scope", detail: "explicitly unconfined" },
        { name: "inherited-fd", coverage: "out-of-scope", detail: "explicitly unconfined" },
        { name: "stdio", coverage: "out-of-scope", detail: "explicitly unconfined" },
        { name: "host-ipc", coverage: "out-of-scope", detail: "explicitly unconfined" },
        { name: "network", coverage: "out-of-scope", detail: "explicitly unconfined" },
      ]
    : [
        { name: "filesystem", coverage: "unknown", detail: "observe-mode: no policy declared" },
        { name: "inherited-fd", coverage: "unknown", detail: "observe-mode: no policy declared" },
        { name: "stdio", coverage: "unknown", detail: "observe-mode: stdio unmanaged" },
        { name: "host-ipc", coverage: "out-of-scope", detail: "observe-mode: host IPC unmanaged" },
        { name: "network", coverage: "out-of-scope", detail: "observe-mode: network unmanaged" },
      ];

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
    coverage: {},
    effectiveControls: {},
    resources: [],
    readiness: {},
    channels,
    receipt: null,
    backend: null,
    grants: [],
    mismatches: [],
    evidence: [
      {
        kind: "structural-observation",
        ref: `dispatch:${request.dispatchId}`,
        freshness: "current",
      },
    ],
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
        `required confinement refused: in-process dispatch with authorityScope "external-harness" has no trusted harness attestation contract.`,
        {
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
      err.attestation = failedAttestation;
      err.dispatchId = request.dispatchId;
      throw err;
    }
    throw new DispatchError(
      "confinement-execution-failed",
      `confinement execution failed for dispatch "${request.dispatchId}": ${err.message}`,
      {
        dispatchId: request.dispatchId,
        attestation: failedAttestation,
        cause: err.message,
      },
    );
  }

  const attestation = buildConfinementAttestation({
    request,
    phase: "completed",
  });

  return {
    ...adapterResult,
    attestation,
  };
}
