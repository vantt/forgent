// request.mjs — Confinement Authority request construction and validation
// (Phase 02 R1-R2, docs/specs/confinement-authority.md §6.4, §6.10).

import fs from "node:fs";
import path from "node:path";
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
  "assignmentLaunchContext",
]);

export function crossCheckAssignmentLaunchContext(launchContext, context = null) {
  if (!launchContext || !context?.runDir) return;
  const runDir = context.runDir;

  // 1. Cross-check run.json if present
  const runJsonPath = path.join(runDir, 'run.json');
  if (fs.existsSync(runJsonPath)) {
    try {
      const runMeta = JSON.parse(fs.readFileSync(runJsonPath, 'utf8'));
      if (runMeta.runId && launchContext.run?.runId && runMeta.runId !== launchContext.run.runId) {
        const err = new Error(`assignmentLaunchContext runId "${launchContext.run.runId}" mismatches run.json runId "${runMeta.runId}".`);
        err.code = 'confinement-launch-context-invalid';
        throw err;
      }
      if (runMeta.assignmentId && launchContext.run?.assignmentId && runMeta.assignmentId !== launchContext.run.assignmentId) {
        const err = new Error(`assignmentLaunchContext assignmentId "${launchContext.run.assignmentId}" mismatches run.json assignmentId "${runMeta.assignmentId}".`);
        err.code = 'confinement-launch-context-invalid';
        throw err;
      }
      if (runMeta.attempt !== undefined && launchContext.run?.attempt !== undefined && runMeta.attempt !== launchContext.run.attempt) {
        const err = new Error(`assignmentLaunchContext attempt "${launchContext.run.attempt}" mismatches run.json attempt "${runMeta.attempt}".`);
        err.code = 'confinement-launch-context-invalid';
        throw err;
      }
      if (runMeta.dispatchPlanDigest && launchContext.run?.dispatchPlanDigest && runMeta.dispatchPlanDigest !== launchContext.run.dispatchPlanDigest) {
        const err = new Error(`assignmentLaunchContext dispatchPlanDigest "${launchContext.run.dispatchPlanDigest}" mismatches run.json dispatchPlanDigest "${runMeta.dispatchPlanDigest}".`);
        err.code = 'confinement-launch-context-invalid';
        throw err;
      }
    } catch (err) {
      if (err.code === 'confinement-launch-context-invalid') throw err;
    }
  }

  // 2. Cross-check evaluator-baseline.json if present
  const baselinePath = path.join(runDir, 'controller', 'evaluator-baseline.json');
  if (fs.existsSync(baselinePath)) {
    try {
      const baselineRecord = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
      if (baselineRecord.digest && launchContext.run?.evaluatorBaselineDigest && baselineRecord.digest !== launchContext.run.evaluatorBaselineDigest) {
        const err = new Error(`assignmentLaunchContext evaluatorBaselineDigest "${launchContext.run.evaluatorBaselineDigest}" mismatches evaluator-baseline digest "${baselineRecord.digest}".`);
        err.code = 'confinement-launch-context-invalid';
        throw err;
      }
    } catch (err) {
      if (err.code === 'confinement-launch-context-invalid') throw err;
    }
  }

  // 3. Cross-check command file if present
  const launchCommandId = launchContext.command?.launchCommandId;
  if (launchCommandId) {
    const commandPath = path.join(runDir, 'controller', 'commands', `${launchCommandId}.json`);
    if (fs.existsSync(commandPath)) {
      try {
        const cmdRecord = JSON.parse(fs.readFileSync(commandPath, 'utf8'));
        if (cmdRecord.runId && launchContext.run?.runId && cmdRecord.runId !== launchContext.run.runId) {
          const err = new Error(`assignmentLaunchContext runId "${launchContext.run.runId}" mismatches command file runId "${cmdRecord.runId}".`);
          err.code = 'confinement-launch-context-invalid';
          throw err;
        }
        if (cmdRecord.controlEpoch !== undefined && launchContext.command?.controlEpoch !== undefined && cmdRecord.controlEpoch !== launchContext.command.controlEpoch) {
          const err = new Error(`assignmentLaunchContext controlEpoch "${launchContext.command.controlEpoch}" mismatches command file controlEpoch "${cmdRecord.controlEpoch}".`);
          err.code = 'confinement-launch-context-invalid';
          throw err;
        }
        if (cmdRecord.controlTokenDigest && launchContext.command?.controlTokenDigest && cmdRecord.controlTokenDigest !== launchContext.command.controlTokenDigest) {
          const err = new Error(`assignmentLaunchContext controlTokenDigest mismatches command file controlTokenDigest.`);
          err.code = 'confinement-launch-context-invalid';
          throw err;
        }
      } catch (err) {
        if (err.code === 'confinement-launch-context-invalid') throw err;
      }
    }
  }
}

export function validateAssignmentLaunchContext(launchContext, context = null) {
  if (!launchContext || typeof launchContext !== "object" || Array.isArray(launchContext)) {
    const err = new Error("assignmentLaunchContext must be an object.");
    err.code = "confinement-launch-context-invalid";
    throw err;
  }
  const validContracts = [
    "assignment-cli-spawn-launch-context.v1",
    "assignment-herdr-spawn-launch-context.v1",
    "assignment-launch-context.v1",
  ];
  if (!validContracts.includes(launchContext.contract)) {
    const err = new Error(`assignmentLaunchContext contract must be "assignment-cli-spawn-launch-context.v1" or "assignment-herdr-spawn-launch-context.v1", got "${launchContext.contract}".`);
    err.code = "confinement-launch-context-invalid";
    throw err;
  }
  const { run, command } = launchContext;
  if (!run || typeof run !== "object" || Array.isArray(run)) {
    const err = new Error("assignmentLaunchContext.run must be an object.");
    err.code = "confinement-launch-context-invalid";
    throw err;
  }
  if (!run.runId || typeof run.runId !== "string" || !run.runId.trim()) {
    const err = new Error("assignmentLaunchContext.run.runId must be a non-empty string.");
    err.code = "confinement-launch-context-invalid";
    throw err;
  }
  if (!run.assignmentId || typeof run.assignmentId !== "string" || !run.assignmentId.trim()) {
    const err = new Error("assignmentLaunchContext.run.assignmentId must be a non-empty string.");
    err.code = "confinement-launch-context-invalid";
    throw err;
  }
  if (typeof run.attempt !== "number" || !Number.isInteger(run.attempt) || run.attempt < 1) {
    const err = new Error("assignmentLaunchContext.run.attempt must be a positive integer.");
    err.code = "confinement-launch-context-invalid";
    throw err;
  }
  if (!run.dispatchPlanDigest || typeof run.dispatchPlanDigest !== "string" || !run.dispatchPlanDigest.startsWith("sha256:")) {
    const err = new Error("assignmentLaunchContext.run.dispatchPlanDigest must be a non-empty sha256 string.");
    err.code = "confinement-launch-context-invalid";
    throw err;
  }
  if (!run.evaluatorBaselineDigest || typeof run.evaluatorBaselineDigest !== "string" || !run.evaluatorBaselineDigest.startsWith("sha256:")) {
    const err = new Error("assignmentLaunchContext.run.evaluatorBaselineDigest must be a non-empty sha256 string.");
    err.code = "confinement-launch-context-invalid";
    throw err;
  }
  if (!command || typeof command !== "object" || Array.isArray(command)) {
    const err = new Error("assignmentLaunchContext.command must be an object.");
    err.code = "confinement-launch-context-invalid";
    throw err;
  }
  if (!command.launchCommandId || typeof command.launchCommandId !== "string" || !command.launchCommandId.trim()) {
    const err = new Error("assignmentLaunchContext.command.launchCommandId must be a non-empty string.");
    err.code = "confinement-launch-context-invalid";
    throw err;
  }
  if (typeof command.controlEpoch !== "number" || !Number.isInteger(command.controlEpoch) || command.controlEpoch < 1) {
    const err = new Error("assignmentLaunchContext.command.controlEpoch must be a positive integer.");
    err.code = "confinement-launch-context-invalid";
    throw err;
  }
  if (!command.controlTokenDigest || typeof command.controlTokenDigest !== "string" || !command.controlTokenDigest.startsWith("sha256:")) {
    const err = new Error("assignmentLaunchContext.command.controlTokenDigest must be a non-empty sha256 string.");
    err.code = "confinement-launch-context-invalid";
    throw err;
  }
  if (context) {
    crossCheckAssignmentLaunchContext(launchContext, context);
  }
  return launchContext;
}

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
  if (request.assignmentLaunchContext !== undefined && request.assignmentLaunchContext !== null) {
    validateAssignmentLaunchContext(request.assignmentLaunchContext, request.context);
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
  assignmentLaunchContext = null,
  dispatchId = null,
} = {}) {
  const cap = capability || executorId || "(unknown-capability)";
  const execId = executorId || cap;

  if (!context?.runDir || typeof context.runDir !== "string" || !context.runDir.trim()) {
    throw new Error("ConfinementRequest context.runDir must be a non-empty string.");
  }

  let resolvedRequirement = requirement;
  if (resolvedRequirement && typeof resolvedRequirement === "object" && resolvedRequirement.mode === "unconfined") {
    resolvedRequirement = {
      policyId: null,
      policy: null,
      ...resolvedRequirement,
    };
  }
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
      ...(invocation.providerKindOnly !== undefined ? { providerKindOnly: invocation.providerKindOnly } : {}),
      ...(invocation.workerCommandSeam !== undefined ? { workerCommandSeam: invocation.workerCommandSeam } : {}),
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
    ...(assignmentLaunchContext ? { assignmentLaunchContext } : {}),
  };

  return validateConfinementRequest(req);
}
