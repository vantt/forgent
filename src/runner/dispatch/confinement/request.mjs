// request.mjs — Confinement Authority request construction and validation
// (Phase 02 R1-R2, docs/specs/confinement-authority.md §6.4).

import crypto from "node:crypto";
import path from "node:path";
import os from "node:os";
import {
  validateCapabilityConfinementShape,
  resolveConfinementPolicy,
  normalizeLegacyConfinement,
} from "./policies.mjs";

/**
 * Validate a ConfinementRequestV1 shape (spec §6.4).
 */
export function validateConfinementRequest(request) {
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    throw new Error("ConfinementRequest must be an object.");
  }
  if (request.contract !== "confinement-request.v1") {
    throw new Error(`ConfinementRequest contract must be "confinement-request.v1", got "${request.contract}".`);
  }
  if (!request.dispatchId || typeof request.dispatchId !== "string") {
    throw new Error("ConfinementRequest dispatchId must be a non-empty string.");
  }
  if (!request.capability || typeof request.capability !== "string") {
    throw new Error("ConfinementRequest capability must be a non-empty string.");
  }
  if (!request.executorId || typeof request.executorId !== "string") {
    throw new Error("ConfinementRequest executorId must be a non-empty string.");
  }
  if (!request.invocation || typeof request.invocation !== "object" || Array.isArray(request.invocation)) {
    throw new Error("ConfinementRequest invocation must be an object.");
  }
  if (!request.context || typeof request.context !== "object" || Array.isArray(request.context)) {
    throw new Error("ConfinementRequest context must be an object.");
  }
  if (!request.context.cwd || typeof request.context.cwd !== "string") {
    throw new Error("ConfinementRequest context.cwd must be a non-empty string.");
  }
  if (!request.context.runDir || typeof request.context.runDir !== "string") {
    throw new Error("ConfinementRequest context.runDir must be a non-empty string.");
  }
  if (!request.requirement || typeof request.requirement !== "object" || Array.isArray(request.requirement)) {
    throw new Error("ConfinementRequest requirement must be an object.");
  }
  return request;
}

/**
 * Build a canonical ConfinementRequestV1 at the dispatch seam
 * (after executor resolution and runDir allocation, before adapter spawn).
 */
export function buildConfinementRequest({
  capability,
  executorId,
  invocation = {},
  context = {},
  cfg = null,
  requirement = null,
  override = null,
  resourceNeeds = [],
  backendId = null,
  authorityScope = null,
  dispatchId = null,
} = {}) {
  const cap = capability || executorId || "(unknown-capability)";
  const execId = executorId || cap;

  let resolvedRequirement = requirement;
  if (!resolvedRequirement) {
    const capConfinement = cfg?.capabilities?.[cap]?.confinement;
    if (capConfinement) {
      validateCapabilityConfinementShape(capConfinement, `capabilities.${cap}.confinement`);
      const mode = capConfinement.mode;
      if (mode === "unconfined") {
        resolvedRequirement = {
          mode: "unconfined",
          policyId: null,
          policy: null,
        };
      } else {
        resolvedRequirement = {
          mode,
          policyId: capConfinement.policy,
          policy: resolveConfinementPolicy(capConfinement.policy),
        };
      }
    } else {
      let legacy = null;
      if (invocation?.confinement) {
        legacy = normalizeLegacyConfinement(invocation.confinement, `executor.${execId}.confinement`);
      }
      resolvedRequirement = {
        mode: "unconfined",
        policyId: null,
        policy: null,
        omitted: true,
        ...(legacy ? { legacy } : {}),
      };
    }
  }

  const id = dispatchId || `disp_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

  const req = {
    contract: "confinement-request.v1",
    dispatchId: id,
    capability: cap,
    executorId: execId,
    invocation: {
      command: invocation.command,
      args: invocation.args,
      argsTemplate: invocation.argsTemplate,
      prompt: invocation.prompt,
      env: invocation.env || {},
      liveOutput: invocation.liveOutput,
      interactiveMode: invocation.interactiveMode,
      promptDelivery: invocation.promptDelivery,
      permissionMode: invocation.permissionMode,
      confinement: invocation.confinement,
      adapter: invocation.adapter || "cli-spawn",
      resourceBindings: invocation.resourceBindings || [],
      ...(invocation.method || invocation.url ? {
        method: invocation.method,
        url: invocation.url,
        headers: invocation.headers,
        body: invocation.body,
      } : {}),
      ...(invocation.transport ? { transport: invocation.transport } : {}),
    },
    context: {
      cwd: context.cwd || process.cwd(),
      repoRoot: context.repoRoot,
      runDir:
        context.runDir ||
        (context.fgosDir
          ? path.join(context.fgosDir, "dispatch-runs", String(execId), String(Date.now()))
          : path.join(os.tmpdir(), "fgos-dispatch-runs", String(execId), String(Date.now()))),
      fgosDir: context.fgosDir,
      timeoutMs: context.timeoutMs,
      idleTimeoutMs: context.idleTimeoutMs,
      maxBuffer: context.maxBuffer,
      onChunk: context.onChunk,
      workId: context.workId,
      tier: context.tier,
      model: context.model,
      herdrBin: context.herdrBin,
      transportDeadlines: context.transportDeadlines,
      closeAlways: context.closeAlways,
    },
    requirement: resolvedRequirement,
    override: override || undefined,
    resourceNeeds: Array.isArray(resourceNeeds) ? resourceNeeds : [],
    backendId: backendId ?? null,
    ...(authorityScope ? { authorityScope } : {}),
  };

  return validateConfinementRequest(req);
}
