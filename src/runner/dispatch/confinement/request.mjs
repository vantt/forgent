// request.mjs — Confinement Authority request construction and validation
// (Phase 02 R1-R2, docs/specs/confinement-authority.md §6.4, §6.10).

import crypto from "node:crypto";
import {
  validateCapabilityConfinementShape,
  resolveConfinementPolicy,
  normalizeLegacyConfinement,
  ConfinementPolicyError,
} from "./policies.mjs";

const ALLOWED_REQUEST_KEYS = new Set([
  "contract",
  "dispatchId",
  "capability",
  "stageSkill",
  "executorId",
  "invocation",
  "context",
  "requirement",
  "override",
  "resourceNeeds",
  "backendId",
  "authorityScope",
]);

/**
 * Validate a ConfinementRequestV1 shape (spec §6.4, §6.10 closed-shape).
 */
export function validateConfinementRequest(request) {
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    throw new Error("ConfinementRequest must be an object.");
  }
  for (const k of Object.keys(request)) {
    if (!ALLOWED_REQUEST_KEYS.has(k)) {
      throw new Error(`ConfinementRequest contains unknown key "${k}".`);
    }
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
  if (request.stageSkill !== undefined && (typeof request.stageSkill !== "string" || !request.stageSkill)) {
    throw new Error("ConfinementRequest stageSkill must be a non-empty string when present.");
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
  if (!request.context.runDir || typeof request.context.runDir !== "string" || !request.context.runDir.trim()) {
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
  stageSkill = null,
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

  if (!context?.runDir || typeof context.runDir !== "string" || !context.runDir.trim()) {
    throw new Error("ConfinementRequest context.runDir must be a non-empty string.");
  }

  let resolvedRequirement = requirement;
  if (!resolvedRequirement) {
    const capConfinement = cfg?.capabilities?.[cap]?.confinement;
    const skillConfinement = stageSkill && stageSkill !== cap ? cfg?.capabilities?.[stageSkill]?.confinement : undefined;

    if (capConfinement && skillConfinement) {
      validateCapabilityConfinementShape(capConfinement, `capabilities.${cap}.confinement`);
      validateCapabilityConfinementShape(skillConfinement, `capabilities.${stageSkill}.confinement`);
      const capMode = capConfinement.mode;
      const skillMode = skillConfinement.mode;
      const capPolicy = capConfinement.policy;
      const skillPolicy = skillConfinement.policy;
      if (capMode !== skillMode || capPolicy !== skillPolicy) {
        throw new ConfinementPolicyError(
          `ambiguous confinement policies between capability "${cap}" (${capMode}:${capPolicy ?? "none"}) and stage skill "${stageSkill}" (${skillMode}:${skillPolicy ?? "none"}).`,
        );
      }
    }

    const activeConfinement = capConfinement || skillConfinement;
    if (activeConfinement) {
      validateCapabilityConfinementShape(activeConfinement, `capabilities.${capConfinement ? cap : stageSkill}.confinement`);
      const mode = activeConfinement.mode;
      if (mode === "unconfined") {
        resolvedRequirement = {
          mode: "unconfined",
          policyId: null,
          policy: null,
        };
      } else {
        const policyObj = resolveConfinementPolicy(activeConfinement.policy, cfg?.confinementPolicies);
        if (!policyObj) {
          throw new ConfinementPolicyError(
            `runner config policy "${activeConfinement.policy}" is unknown (neither built-in nor declared in confinementPolicies).`,
          );
        }
        resolvedRequirement = {
          mode,
          policyId: activeConfinement.policy,
          policy: policyObj,
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
    ...(stageSkill ? { stageSkill } : {}),
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
      runDir: context.runDir,
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
