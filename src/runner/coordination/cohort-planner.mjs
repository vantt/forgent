// coordination/cohort-planner.mjs — Phase 04 (P04.1) Cohort Planner V1:
// PURE, deterministic candidate inventory + actor allocation +
// hard/soft-constraint handling + a resolver-handoff contract. R1-R4 of
// phase-04-research-cohort-planner.md ONLY -- independent fan-out
// execution, context isolation/fan-in, evidence/contradiction handling, and
// any live proof are R5-R9, a later cell (P04.2), not built here.
//
// Scope discipline (this cell's own non-goals, matching phase-04.md
// verbatim): no scoring, learning, cost optimization, model-family
// guessing beyond deriveProviderFamily/providerModel, direct execution,
// credentials probing, provider SDKs, Mission, Work mutation, headless
// driver, or telemetry backend. `distinctProviderFamilies` is COUNTED
// only -- never ranked by "goodness."
//
// Purity (R4): this module imports nothing from `dispatch/transport.mjs`
// or any CLI-spawn-capable module, and never touches `child_process` --
// grep-provable, mirrored by `test/runner/cohort-planner-purity.test.mjs`
// (same static-scan style as `coordination-static.test.mjs`). It reuses
// three EXISTING, already-accepted modules rather than reimplementing any
// of their logic a second time (the exact "two call sites disagree" bug
// class P00.4 spent three rounds closing):
//   - `deriveProviderFamily`/`resolveExecutorConfig` (dispatch/resolve.mjs)
//     for provider-family derivation and cross-provider governance
//     eligibility (R1) -- never guessed from an executor's name.
//   - `resolveAssignmentDispatchPolicy` (dispatch/assignment-policy.mjs)
//     for the resolver-handoff/mismatch check (R4) -- the SAME Assignment
//     resolution path an actual dispatch will re-run at execution time.
//   - `mergePolicyStack` (definitions/schema.mjs, P02.1) for PolicyPatch
//     shape validation and monotonic minTier composition (R2/R3) -- this
//     planner never invents a second PolicyPatch vocabulary.
//
// Candidate order (R2): `buildCandidateInventory` explicitly sorts
// `Object.keys(runnerConfig.executors)` before iterating -- never trusts
// raw `Object.entries()`/`Object.keys()` iteration order, the named
// bug-class risk for this cell. `test/runner/cohort-planner.test.mjs`
// proves this with permuted-insertion-order fixtures.

import { MODEL_POLICY_TIERS, RunnerConfigError, supportsPolicyTier } from '../dispatch/config.mjs';
import { deriveProviderFamily, resolveExecutorConfig } from '../dispatch/resolve.mjs';
import { resolveAssignmentDispatchPolicy } from '../dispatch/assignment-policy.mjs';
import { mergePolicyStack } from '../definitions/schema.mjs';

/**
 * Error raised by this module for malformed/missing STRUCTURAL input (no
 * `spec.profile.cohort` block, no `spec.actors`, a non-CoordinationProtocol
 * definition, an internal provider-family disagreement). A legitimate
 * "constraints not satisfiable" outcome is never thrown -- it is returned
 * as `{status: 'hard-failed', ...}` from `planCohort` so the caller can
 * inspect/log it, per R3's "must NAME the specific unsatisfied actor,
 * field, candidate, and reasons" (a structured object serves that better
 * than a thrown Error carrying only a message string).
 */
export class CohortPlanningError extends Error {
  constructor(category, message) {
    super(message);
    this.name = 'CohortPlanningError';
    this.category = category;
  }
}

function fail(category, message) {
  throw new CohortPlanningError(category, message);
}

/**
 * R1 candidate inventory: a PURE projection of `runnerConfig.executors`
 * (the already-validated runner config's own registry -- this function
 * assumes its shape already passed `validateRunnerConfigShape`/
 * `loadRunnerConfigFromDir`, same precondition `resolveExecutorConfig`/
 * `resolveAssignmentDispatchPolicy` themselves already assume; it never
 * re-validates or reads a file itself).
 *
 * Only `kind: "agent"` entries become candidates (config.mjs's
 * `EXECUTOR_KINDS`: "agent" = a live persona, potentially dispatchable as
 * a cohort actor; "tool" = presence-only, e.g. `gitnexus`/`herdr`, never
 * spawned as an actor). A `kind: "tool"` entry is not a REJECTED
 * candidate -- it was never a candidate in the first place, the same
 * distinction R3 draws between "no support available" and "not
 * applicable."
 *
 * Returned in EXPLICIT STABLE order: `Object.keys(executors)` is sorted
 * ascending before iteration, never trusted at raw insertion/property
 * order (R2's own named bug-class risk).
 *
 * @param {object} runnerConfig The validated runner config's own `runner`
 *   section (e.g. `.fgos/config.json`'s `"runner"` key, or
 *   `loadRunnerConfigFromDir(dir)`'s return value).
 * @returns {ReadonlyArray<Readonly<object>>} Frozen candidate array.
 */
export function buildCandidateInventory(runnerConfig) {
  if (!runnerConfig || typeof runnerConfig !== 'object') {
    fail('validation', 'buildCandidateInventory requires a runnerConfig object (the validated runner section, e.g. .fgos/config.json\'s "runner" key)');
  }
  const executors = runnerConfig.executors && typeof runnerConfig.executors === 'object' ? runnerConfig.executors : {};
  const executorIds = Object.keys(executors).sort();

  const candidates = [];
  for (const executorId of executorIds) {
    const executorEntry = executors[executorId];
    if (!executorEntry || executorEntry.kind !== 'agent') continue;

    const cliInvocation = Array.isArray(executorEntry.invocations)
      ? executorEntry.invocations.find((inv) => inv.via === 'cli')
      : undefined;
    // Mirrors `resolveExecutorConfig`'s (resolve.mjs) own command-resolution
    // fallback chain exactly, not just its `cliInvocation`/own-`command`
    // rungs: a `via:"cli"` invocation wins first, then the executor entry's
    // own `command`/`adapter` (resolve.mjs's `byExecutor = executorEntry`
    // branch) -- and for EVERY other shape (an `agentType`-only entry, or
    // one declaring no dispatch mechanism of its own at all) resolve.mjs's
    // `byExecutor ?? cfg.executor` falls all the way through to the
    // runner's GLOBAL `executor.command` (`buildAgentTypeExecutor` itself
    // only ever returns that same global `.command`, never a literal
    // `'claude'`; a fully bare entry reaches the identical global fallback
    // one branch earlier). Replicated here, never re-derived a different
    // way, so this module's own derivation and resolveExecutorConfig's
    // genuinely read the same effective command in every case -- the
    // defensive invariant a few lines below assumes exactly this.
    const hasOwnCommandOrAdapter = Boolean(executorEntry.adapter || executorEntry.command);
    const globalCommand = typeof runnerConfig.executor?.command === 'string' ? runnerConfig.executor.command : undefined;
    const resolvedCommand =
      cliInvocation?.command ??
      (hasOwnCommandOrAdapter && typeof executorEntry.command === 'string' ? executorEntry.command : undefined) ??
      (!hasOwnCommandOrAdapter ? globalCommand : undefined);

    // R1: provider family is NEVER guessed from a name -- reuse
    // `deriveProviderFamily` (resolve.mjs) verbatim, the one legitimate
    // derivation this codebase has (P00.4's own fix history).
    const providerFamily = deriveProviderFamily(executorEntry, resolvedCommand);

    const supportedTiers = Object.freeze(
      MODEL_POLICY_TIERS.filter((tier) => supportsPolicyTier(runnerConfig, providerFamily, tier)),
    );

    // Governance eligibility (R1): reuse `resolveExecutorConfig`
    // (resolve.mjs) -- the SAME cross-provider governance gate the real
    // resolver enforces at dispatch time -- instead of re-deriving the
    // allow/deny rule a second, independently-drifting time (exactly the
    // "two call sites disagree" bug class P00.4 spent three rounds
    // closing). `'repo-content'` is the conservative, widest declared
    // content class (matches `resolve.mjs`'s own default `egressContent`
    // fallback) since inventory build time has no real dispatch's actual
    // content class to declare yet -- a judgment call, not a guess: a
    // real dispatch's actual `contentCarries` is re-checked for real at
    // execution time by `resolveExecutorConfig` itself, unaffected by
    // this inventory-time approximation.
    let governanceEligible = true;
    let governanceReason;
    let egressKind;
    try {
      const resolved = resolveExecutorConfig(runnerConfig, undefined, executorId, undefined, 'repo-content');
      egressKind = resolved.governance.egress.kind;
      if (resolved.governance.providerFamily !== providerFamily) {
        // Defensive invariant: both derivations read the same
        // executorEntry/resolvedCommand, so this should never fire. A
        // mismatch means THIS module's own extraction has drifted from
        // resolve.mjs's -- fail loud rather than silently trust a wrong
        // value (this cell's whole reason for reusing the shared
        // function in the first place).
        fail(
          'validation',
          `buildCandidateInventory: internal provider-family disagreement for executor "${executorId}" (own derivation: "${providerFamily}", resolveExecutorConfig: "${resolved.governance.providerFamily}")`,
        );
      }
    } catch (err) {
      if (err instanceof RunnerConfigError) {
        governanceEligible = false;
        governanceReason = err.message;
      } else {
        throw err;
      }
    }

    candidates.push(
      Object.freeze({
        executorId,
        providerFamily,
        resolvedCommand: resolvedCommand ?? null,
        invocationMechanism: cliInvocation
          ? 'cli'
          : typeof executorEntry.command === 'string'
            ? 'cli'
            : typeof executorEntry.agentType === 'string'
              ? 'agent-type'
              : null,
        supportedTiers,
        capabilities: Object.freeze(Array.isArray(executorEntry.for) ? [...executorEntry.for] : []),
        persona: typeof executorEntry.persona === 'string' ? executorEntry.persona : undefined,
        tools: executorEntry.tools !== undefined && executorEntry.tools !== null ? Object.freeze({ ...executorEntry.tools }) : undefined,
        contextLimit: typeof executorEntry.contextLimit === 'number' ? executorEntry.contextLimit : undefined,
        governanceEligible,
        governanceReason,
        egressKind,
      }),
    );
  }

  return Object.freeze(candidates);
}

/**
 * R3 hard-constraint check for ONE (candidate, requirement) pair. Returns
 * `{ok: true}` or `{ok: false, field, reason, availableSupport}` -- five
 * DISTINCT, specifically-worded rejection fields (`'executor' | 'provider'
 * | 'tier' | 'capability' | 'governance'`, plus `'context'` for the
 * optional context-limit dimension R1/R2 also name), never one generic
 * "no match" message.
 *
 * `requirement.executorId`/`requirement.providerFamily` are both OPTIONAL
 * pins -- distinct dimensions: `executorId` is a specific-executor pin (a
 * trusted assignment/cli-scope `preferExecutor` override); `providerFamily`
 * is a specific-family requirement (this planner itself never sets this
 * per-actor -- diversity is satisfied by allocation PREFERENCE in
 * `planCohort`, not a hard per-actor pin -- but a caller building its own
 * requirement is free to use it).
 *
 * @param {Readonly<object>} candidate One entry from `buildCandidateInventory`.
 * @param {object} requirement `{role, minTier?, requiredCapabilities?, minContext?, executorId?, providerFamily?}`
 */
export function matchCandidateToRequirement(candidate, requirement) {
  const { role, minTier, requiredCapabilities = [], minContext, executorId, providerFamily } = requirement;

  if (executorId !== undefined && candidate.executorId !== executorId) {
    return {
      ok: false,
      field: 'executor',
      reason: `role "${role}" is pinned to executor "${executorId}", but candidate "${candidate.executorId}" is a different executor`,
      availableSupport: `the pinned executor "${executorId}" must itself be a registered "agent"-kind candidate for role "${role}" to be satisfiable`,
    };
  }

  if (providerFamily !== undefined && candidate.providerFamily !== providerFamily) {
    return {
      ok: false,
      field: 'provider',
      reason: `role "${role}" requires provider family "${providerFamily}", but candidate "${candidate.executorId}" resolves to provider family "${candidate.providerFamily}"`,
      availableSupport: `candidate "${candidate.executorId}" is provider family "${candidate.providerFamily}", not "${providerFamily}"`,
    };
  }

  if (minTier !== undefined && !candidate.supportedTiers.includes(minTier)) {
    return {
      ok: false,
      field: 'tier',
      reason: `role "${role}" needs tier "${minTier}"; candidate "${candidate.executorId}" (provider "${candidate.providerFamily}") only supports [${candidate.supportedTiers.join(', ') || 'none'}]`,
      availableSupport:
        candidate.supportedTiers.length > 0
          ? `candidate "${candidate.executorId}" supports [${candidate.supportedTiers.join(', ')}]`
          : `candidate "${candidate.executorId}" has no policy tiers configured for provider "${candidate.providerFamily}"`,
    };
  }

  const missingCapabilities = requiredCapabilities.filter((cap) => !candidate.capabilities.includes(cap));
  if (missingCapabilities.length > 0) {
    return {
      ok: false,
      field: 'capability',
      reason: `role "${role}" requires capabilities [${requiredCapabilities.join(', ')}]; candidate "${candidate.executorId}" is missing [${missingCapabilities.join(', ')}] (declares: [${candidate.capabilities.join(', ') || 'none'}])`,
      availableSupport:
        candidate.capabilities.length > 0
          ? `candidate "${candidate.executorId}" declares capabilities [${candidate.capabilities.join(', ')}]`
          : `candidate "${candidate.executorId}" declares no capabilities`,
    };
  }

  if (minContext !== undefined) {
    if (typeof candidate.contextLimit !== 'number') {
      return {
        ok: false,
        field: 'context',
        reason: `role "${role}" requires a minimum context of ${minContext} tokens; candidate "${candidate.executorId}" declares no contextLimit -- never assumed to satisfy an unknown limit`,
        availableSupport: `candidate "${candidate.executorId}" declares no contextLimit in its runner config entry`,
      };
    }
    if (candidate.contextLimit < minContext) {
      return {
        ok: false,
        field: 'context',
        reason: `role "${role}" requires a minimum context of ${minContext} tokens; candidate "${candidate.executorId}" declares contextLimit ${candidate.contextLimit}`,
        availableSupport: `candidate "${candidate.executorId}" declares contextLimit ${candidate.contextLimit}`,
      };
    }
  }

  if (!candidate.governanceEligible) {
    return {
      ok: false,
      field: 'governance',
      reason: `candidate "${candidate.executorId}" (provider "${candidate.providerFamily}") is not governance-eligible for role "${role}": ${candidate.governanceReason ?? 'unknown reason'}`,
      availableSupport: `candidate "${candidate.executorId}" would need its runner config entry to satisfy the cross-provider governance gate (e.g. allowCrossProvider: true) before it can serve role "${role}"`,
    };
  }

  return { ok: true };
}

/**
 * Resolve the operation wired to `actorId` in `definition.spec.graph`
 * (independently re-derived here, NOT imported from
 * `coordination/session-engine.mjs` -- that module is read-only reference
 * for this cell, and this planner stays a standalone, decoupled pure
 * module with no coupling to the session engine's own execution
 * machinery). Mirrors `resolveDeclaredOperationActor`'s pairing logic at
 * the same level of strictness, scoped down to just what allocation needs
 * (role/tier/capabilities), never a copy of its full validation surface.
 */
function resolveActorOperation(definition, actorId) {
  for (const node of definition.spec.graph.nodes) {
    for (const opRef of node.operations) {
      if (opRef.actor === actorId) {
        return definition.spec.operations.find((op) => op.id === opRef.ref);
      }
    }
  }
  return undefined;
}

/**
 * Summarize, across the FULL candidate pool (used or not), what support IS
 * available for the given rejection `field` -- R3's own worded example
 * ("role X needs tier Y; only Z is configured for any candidate"). Purely
 * descriptive; never mutates or re-decides anything.
 */
function summarizeAvailableSupport(field, requirement, allCandidates) {
  switch (field) {
    case 'tier': {
      const capableFamilies = [...new Set(allCandidates.filter((c) => c.supportedTiers.includes(requirement.minTier)).map((c) => c.providerFamily))].sort();
      return capableFamilies.length > 0
        ? `role "${requirement.role}" needs tier "${requirement.minTier}"; only [${capableFamilies.join(', ')}] ${capableFamilies.length === 1 ? 'is' : 'are'} configured for any candidate`
        : `role "${requirement.role}" needs tier "${requirement.minTier}"; no candidate currently configures that tier for any provider family`;
    }
    case 'capability': {
      const capableIds = allCandidates.filter((c) => requirement.requiredCapabilities.every((cap) => c.capabilities.includes(cap))).map((c) => c.executorId);
      return capableIds.length > 0
        ? `role "${requirement.role}" requires capabilities [${requirement.requiredCapabilities.join(', ')}]; only [${capableIds.join(', ')}] declare(s) all of them`
        : `role "${requirement.role}" requires capabilities [${requirement.requiredCapabilities.join(', ')}]; no candidate declares all of them`;
    }
    case 'governance': {
      const eligibleIds = allCandidates.filter((c) => c.governanceEligible).map((c) => c.executorId);
      return eligibleIds.length > 0
        ? `governance-eligible candidates: [${eligibleIds.join(', ')}]`
        : 'no registered candidate is currently governance-eligible';
    }
    case 'executor':
      return requirement.executorId
        ? `role "${requirement.role}" is pinned to executor "${requirement.executorId}", which is not an eligible registered "agent"-kind candidate`
        : 'every registered candidate is already allocated to another actor in this cohort';
    case 'provider': {
      const families = [...new Set(allCandidates.map((c) => c.providerFamily))].sort();
      return `configured provider families: [${families.join(', ')}]`;
    }
    default:
      return undefined;
  }
}

/**
 * R2/R3: plan a full cohort allocation for a validated `CoordinationProtocol`
 * FlowDefinition (`definition`, already run through `validateFlowDefinition`
 * -- this function never re-validates or forks that schema) against a real,
 * validated runner config.
 *
 * Enumeration order (R2): `spec.actors` (already a declaration-ordered
 * ARRAY -- no `Object.keys()` risk there) is additionally sorted by `id`
 * before allocation, so this function's own order never silently depends
 * on caller-supplied array order either; `buildCandidateInventory` (above)
 * independently guarantees the same for the executor registry.
 *
 * Allocation, per actor in that stable order: resolve its wired operation
 * (role/tier/capabilities), compose the DECLARED policy scope stack this
 * planner has real data for (`definition < operation < actor`, ascending
 * specificity, via `mergePolicyStack` -- never a second minTier-monotonicity
 * implementation) to get the effective `minTier`/pinned `preferExecutor`,
 * then pick the first candidate (stable order) satisfying every hard
 * constraint (`matchCandidateToRequirement`) that is not already allocated
 * to a prior actor in this cohort. Diversity-seeking tie-break: among
 * multiple eligible candidates, prefer one whose provider family is NOT YET
 * used by this cohort -- a binary partition + stable order, never a scored
 * "goodness" ranking (explicit non-goal).
 *
 * Hard failure (any actor with zero eligible candidates, or a missing
 * `requiredRoles` actor, or an unresolvable graph wiring) returns
 * `{status: 'hard-failed', failure: {actorId?, role?, field, reason,
 * availableSupport}, allocations}` -- names the specific actor/field/
 * candidate reasons plus what IS available, never thrown, per R3.
 *
 * Soft diversity shortfall (`cohort.distinctProviderFamilies` not fully
 * achieved among allocated actors) degrades ONLY when a caller-declared
 * `fallbackRules` entry (`{id, appliesTo: 'distinctProviderFamilies',
 * reason}`) permits it -- the degradation is ALWAYS recorded in the
 * returned `diversity` block (`degraded`, `fallbackRuleApplied`), never
 * silent; absent a declared rule, the shortfall is a hard failure instead.
 *
 * @param {object} params
 * @param {Readonly<object>} params.definition A `validateFlowDefinition`-shaped `CoordinationProtocol` document.
 * @param {object} params.runnerConfig The validated runner config's `runner` section.
 * @param {Array<{id?: string, appliesTo: string, reason?: string}>} [params.fallbackRules] Declared soft-diversity fallback rules.
 * @returns {Readonly<object>} `{status: 'allocated'|'hard-failed', allocations, diversity?, failure?, explanation}`
 */
export function planCohort({ definition, runnerConfig, fallbackRules = [] }) {
  if (!definition || definition.spec?.profile?.kind !== 'CoordinationProtocol') {
    fail('validation', 'planCohort requires a validated CoordinationProtocol FlowDefinition (spec.profile.kind must be "CoordinationProtocol")');
  }
  const cohort = definition.spec.profile.cohort;
  if (!cohort) {
    fail('validation', 'planCohort: definition declares no spec.profile.cohort block -- nothing to plan');
  }
  const actors = definition.spec.actors;
  if (!Array.isArray(actors) || actors.length === 0) {
    fail('validation', 'planCohort: definition declares no spec.actors -- a cohort plan requires stable SessionActor identities');
  }
  if (cohort.count !== undefined && cohort.count !== actors.length) {
    fail('validation', `planCohort: spec.profile.cohort.count (${cohort.count}) does not match spec.actors.length (${actors.length})`);
  }
  if (!Array.isArray(fallbackRules)) {
    fail('validation', 'planCohort: fallbackRules must be an array when provided');
  }

  if (Array.isArray(cohort.requiredRoles)) {
    const declaredRoles = new Set(actors.map((a) => a.role));
    const missingRoles = cohort.requiredRoles.filter((role) => !declaredRoles.has(role));
    if (missingRoles.length > 0) {
      return Object.freeze({
        status: 'hard-failed',
        allocations: Object.freeze([]),
        failure: Object.freeze({
          field: 'requiredRole',
          reason: `spec.profile.cohort.requiredRoles declares [${missingRoles.join(', ')}] but no spec.actors[] entry declares that role`,
          availableSupport: `spec.actors declares roles: [${[...declaredRoles].sort().join(', ')}]`,
        }),
        explanation: `Cohort planning aborted before allocation: required role(s) [${missingRoles.join(', ')}] have no declared actor.`,
      });
    }
  }

  const candidates = buildCandidateInventory(runnerConfig);
  const orderedActors = [...actors].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const allocations = [];
  const usedExecutorIds = new Set();
  const usedProviderFamilies = new Set();

  for (const actor of orderedActors) {
    const operation = resolveActorOperation(definition, actor.id);
    if (!operation) {
      return Object.freeze({
        status: 'hard-failed',
        allocations: Object.freeze(allocations.slice()),
        failure: Object.freeze({
          actorId: actor.id,
          role: actor.role,
          field: 'requiredRole',
          reason: `actor "${actor.id}" (role "${actor.role}") has no operation wired into the protocol graph -- nothing to allocate for`,
          availableSupport: 'no operation references this actor in spec.graph.nodes[].operations[]',
        }),
        explanation: `Cohort planning aborted: actor "${actor.id}" has no reachable operation.`,
      });
    }

    const scopeStack = [
      { scope: 'definition', source: definition.metadata.id, policy: definition.spec.policy ?? {} },
      { scope: 'operation', source: operation.id, policy: operation.policy ?? {} },
      { scope: 'actor', source: actor.id, policy: actor.policy ?? {} },
    ];
    const merged = mergePolicyStack(scopeStack);
    const minTier = merged.minTier ?? 'standard';
    const requiredCapabilities = operation.capabilities ?? [];

    const requirement = {
      role: actor.role,
      minTier,
      requiredCapabilities,
      // A declared actor/operation/definition-scope preferExecutor pin
      // (schema-legal, though `session-engine.mjs`'s own
      // `assertNoPortableExecutorPin` rejects it at those portable scopes
      // at actual dispatch time -- a separate, already-built enforcement
      // this planner does not duplicate) is honored here as a hard pin:
      // the planner never second-guesses a declared requirement, it only
      // allocates against it.
      executorId: merged.preferExecutor,
    };

    const eligible = candidates.filter((c) => !usedExecutorIds.has(c.executorId) && matchCandidateToRequirement(c, requirement).ok);

    if (eligible.length === 0) {
      const firstUnused = candidates.find((c) => !usedExecutorIds.has(c.executorId));
      const detail = firstUnused ? matchCandidateToRequirement(firstUnused, requirement) : { field: 'executor', reason: undefined };
      const field = detail.field ?? 'executor';
      const reason = detail.reason
        ? `actor "${actor.id}" (role "${actor.role}"): ${detail.reason}`
        : `actor "${actor.id}" (role "${actor.role}"): every registered candidate is already allocated to another actor in this cohort`;

      return Object.freeze({
        status: 'hard-failed',
        allocations: Object.freeze(allocations.slice()),
        failure: Object.freeze({
          actorId: actor.id,
          role: actor.role,
          field,
          reason,
          availableSupport: summarizeAvailableSupport(field, requirement, candidates) ?? `candidates: [${candidates.map((c) => c.executorId).join(', ')}]`,
        }),
        explanation: `Cohort planning aborted: ${reason}`,
      });
    }

    // Diversity-seeking, stable-order tie-break (R2: never scored --
    // a binary partition by "provider family not yet used in this
    // cohort," then first-in-stable-order).
    const unusedFamily = eligible.find((c) => !usedProviderFamilies.has(c.providerFamily));
    const chosen = unusedFamily ?? eligible[0];

    usedExecutorIds.add(chosen.executorId);
    usedProviderFamilies.add(chosen.providerFamily);

    const assignmentPolicyFragment = {
      minTier,
      preferExecutor: chosen.executorId,
      ...(merged.preferPersona !== undefined ? { preferPersona: merged.preferPersona } : {}),
      ...(merged.visibility !== undefined ? { visibility: merged.visibility } : {}),
    };
    // 'assignment' scope: the ONE legal, non-portable scope a concrete
    // preferExecutor pin may be recorded at (flow-definition.md's
    // PolicyPatch section; session-engine.mjs's own
    // PORTABLE_POLICY_SCOPES excludes it for exactly this reason) -- this
    // planner's own concrete choice for THIS plan, never written back
    // into the portable definition/operation/role/actor scopes.
    const policyPatch = mergePolicyStack([{ scope: 'assignment', source: actor.id, policy: assignmentPolicyFragment }]);

    allocations.push({
      actorId: actor.id,
      role: actor.role,
      operationId: operation.id,
      executorId: chosen.executorId,
      providerFamily: chosen.providerFamily,
      tier: minTier,
      policyPatch,
      explanation: `actor "${actor.id}" (role "${actor.role}") allocated to executor "${chosen.executorId}" (provider "${chosen.providerFamily}", tier "${minTier}") -- chosen from ${eligible.length} eligible candidate(s) in stable order; provider family "${chosen.providerFamily}" ${
        unusedFamily ? 'not yet used by this cohort' : 'already used by a prior actor in this cohort (no unused-family candidate was eligible)'
      }`,
    });
  }

  const achievedFamilies = new Set(allocations.map((a) => a.providerFamily));
  const requiredDiversity = cohort.distinctProviderFamilies ?? 1;
  let diversityDegraded = false;
  let appliedFallbackRule = null;

  if (achievedFamilies.size < requiredDiversity) {
    appliedFallbackRule = fallbackRules.find((rule) => rule && rule.appliesTo === 'distinctProviderFamilies') ?? null;
    if (!appliedFallbackRule) {
      return Object.freeze({
        status: 'hard-failed',
        allocations: Object.freeze(allocations.map((a) => Object.freeze(a))),
        failure: Object.freeze({
          field: 'diversity',
          reason: `spec.profile.cohort.distinctProviderFamilies requires ${requiredDiversity} distinct provider families; only ${achievedFamilies.size} achieved ([${[...achievedFamilies].sort().join(', ')}]) and no declared fallback rule permits the shortfall`,
          availableSupport: `candidate provider families available: [${[...new Set(candidates.map((c) => c.providerFamily))].sort().join(', ')}]`,
        }),
        explanation: `Cohort planning aborted: provider-family diversity requirement (${requiredDiversity}) not satisfiable with the current candidate pool (${achievedFamilies.size} achieved) and no fallback rule declared.`,
      });
    }
    diversityDegraded = true;
  }

  return Object.freeze({
    status: 'allocated',
    allocations: Object.freeze(allocations.map((a) => Object.freeze(a))),
    diversity: Object.freeze({
      required: requiredDiversity,
      achieved: achievedFamilies.size,
      satisfied: !diversityDegraded,
      degraded: diversityDegraded,
      // R3: a soft degradation is NEVER silent -- the applied fallback
      // rule (or null when fully satisfied) is always persisted in the
      // returned plan.
      fallbackRuleApplied: appliedFallbackRule,
    }),
    explanation: diversityDegraded
      ? `Cohort planned: ${allocations.length}/${actors.length} actors allocated. Provider-family diversity DEGRADED: ${achievedFamilies.size}/${requiredDiversity} distinct families achieved, permitted by declared fallback rule "${appliedFallbackRule.id ?? '(unnamed)'}" (${appliedFallbackRule.reason ?? 'no reason recorded'}).`
      : `Cohort planned: ${allocations.length}/${actors.length} actors allocated. Provider-family diversity satisfied: ${achievedFamilies.size}/${requiredDiversity} distinct families.`,
  });
}

/**
 * R4 resolver handoff: re-validate ONE planned allocation (an entry from
 * `planCohort(...).allocations`) against a CURRENT runner config through
 * `resolveAssignmentDispatchPolicy` -- the EXISTING, unmodified Assignment
 * resolution path a real dispatch will run at actual execution time. This
 * function never spawns anything and never calls `resolveExecutorConfig`
 * (which resolves a real spawnable command); it only proves that what was
 * PLANNED still re-resolves to the SAME executor/provider/tier right now.
 *
 * Does NOT re-verify governance eligibility (the cross-provider
 * `allowCrossProvider` gate) -- that check lives in `resolveExecutorConfig`,
 * which this function deliberately never calls since it never resolves a
 * real spawnable command. A real dispatch caller (P04.2) MUST independently
 * re-run `resolveExecutorConfig`'s governance gate immediately before
 * spawn; this function alone is not the complete R4 safety net -- it only
 * re-verifies executor/provider/tier identity, one dimension short of what
 * Phase 04's own R4 text describes a resolver revalidating.
 *
 * A caller (a later cell, P04.2) is expected to call this immediately
 * before dispatch and abort when `abort: true` -- this cell only defines
 * and proves the CONTRACT shape, never wires it into an actual dispatch
 * call itself.
 *
 * @param {Readonly<object>} allocation One `planCohort(...).allocations[]` entry.
 * @param {object} currentRunnerConfig The runner config AS IT STANDS NOW (possibly drifted since planning).
 * @returns {Readonly<{ok: boolean, abort: boolean, reason?: string, resolvedPolicy?: object}>}
 */
export function verifyPlannedAllocationAgainstCurrentConfig(allocation, currentRunnerConfig) {
  if (!allocation || typeof allocation !== 'object') {
    fail('validation', 'verifyPlannedAllocationAgainstCurrentConfig requires a planned allocation object (one entry from planCohort(...).allocations)');
  }

  const syntheticAssignment = {
    assignmentId: `cohort-plan-verify:${allocation.actorId}`,
    role: allocation.role,
    operation: allocation.operationId,
    policy: {
      minTier: allocation.tier,
      preferExecutor: allocation.executorId,
    },
  };

  let effective;
  try {
    effective = resolveAssignmentDispatchPolicy({ assignment: syntheticAssignment, runnerConfig: currentRunnerConfig });
  } catch (err) {
    if (err instanceof RunnerConfigError) {
      return Object.freeze({
        ok: false,
        abort: true,
        reason: `planned allocation for actor "${allocation.actorId}" no longer resolves against the current runner config -- aborting before spawn: ${err.message}`,
      });
    }
    throw err;
  }

  const mismatches = [];
  if (effective.executorId !== allocation.executorId) {
    mismatches.push(`executor: planned "${allocation.executorId}", re-resolved "${effective.executorId}"`);
  }
  if (effective.providerModel !== allocation.providerFamily) {
    mismatches.push(`provider: planned "${allocation.providerFamily}", re-resolved "${effective.providerModel}"`);
  }
  if (effective.tier !== allocation.tier) {
    mismatches.push(`tier: planned "${allocation.tier}", re-resolved "${effective.tier}"`);
  }

  if (mismatches.length > 0) {
    return Object.freeze({
      ok: false,
      abort: true,
      reason: `planned allocation for actor "${allocation.actorId}" disagrees with the current runner config re-resolution -- aborting before spawn: ${mismatches.join('; ')}`,
    });
  }

  return Object.freeze({ ok: true, abort: false, resolvedPolicy: effective });
}
