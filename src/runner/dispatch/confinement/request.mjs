// request.mjs — Confinement Authority request construction and validation
// (Phase 02 R1-R2, docs/specs/confinement-authority.md §6.4, §6.10).

import crypto from "node:crypto";
import {
  validateCapabilityConfinementShape,
  resolveConfinementPolicy,
  normalizeLegacyConfinement,
  validateConfinementPolicyShape,
  validateOverrideConfinementShape,
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
  if (request.requirement.mode === "unconfined" &&
      (request.requirement.policyId !== null || request.requirement.policy !== null)) {
    throw new Error("ConfinementRequest unconfined requirement must set policyId and policy to null.");
  }
  // Requests can reach Authority without the config loader.  Keep that door
  // closed too: an invalid control is a malformed request, not "unknown"
  // coverage that could accidentally be executed.
  if (request.requirement.policy !== null && request.requirement.policy !== undefined) {
    validateConfinementPolicyShape(request.requirement.policy, "ConfinementRequest requirement.policy");
  }
  if (request.override !== null && request.override !== undefined) {
    validateOverrideConfinementShape(
      request.override,
      request.requirement?.policy ?? null,
      "ConfinementRequest override",
      request.requirement?.mode ?? "preferred",
    );
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
  fallbackFrom = null,
  anchorCapability = null,
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
    const effectiveFallback = fallbackFrom || anchorCapability || null;
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

    let activeConfinement = capConfinement || skillConfinement;
    let effectiveAnchor = capConfinement ? cap : (skillConfinement ? stageSkill : null);

    // F-c: capability fallback must carry the same confinement policy that the anchor it fell back from declared
    if (!activeConfinement && effectiveFallback && cfg?.capabilities?.[effectiveFallback]?.confinement) {
      activeConfinement = cfg.capabilities[effectiveFallback].confinement;
      effectiveAnchor = effectiveFallback;
    }

    if (activeConfinement) {
      validateCapabilityConfinementShape(activeConfinement, `capabilities.${effectiveAnchor}.confinement`);
      const mode = activeConfinement.mode;
      if (mode === "unconfined") {
        resolvedRequirement = {
          mode: "unconfined",
          policyId: null,
          policy: null,
          anchor: effectiveAnchor,
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
          anchor: effectiveAnchor,
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
        anchor: effectiveAnchor,
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
      confinement: invocation.confinement ? (normalizeLegacyConfinement(invocation.confinement, `executor.${execId}.confinement`) ?? invocation.confinement) : invocation.confinement,
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
      dispatchBatchKey: context.dispatchBatchKey,
    },
    requirement: resolvedRequirement,
    override: override ?? invocation?.confinement?.override ?? cfg?.executors?.[execId]?.confinement?.override ?? undefined,
    resourceNeeds: Array.isArray(resourceNeeds) ? resourceNeeds : [],
    // Invocation data is untrusted at this boundary. Backend selection belongs
    // to the trusted executor registration (or an explicit caller argument).
    backendId: backendId ?? cfg?.executors?.[execId]?.confinement?.backend ?? null,
    ...(authorityScope ? { authorityScope } : {}),
  };

  return validateConfinementRequest(req);
}
