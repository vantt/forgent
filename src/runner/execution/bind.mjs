// src/runner/execution/bind.mjs — Single authority for executor/transport/tier/model/persona/mechanism/posture binding (Wave B / Phase 3)
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/**

import { decideExecutorDispatchMechanism } from '../dispatch/mechanism.mjs';
import { deriveProviderFamily, resolveTierModel } from '../dispatch/resolve.mjs';
import { checkProviderDisallowed } from '../dispatch/provider-adapter.mjs';
import { canApplyPosture } from '../dispatch/confinement/policies.mjs';
import { RIGOR_VALUES, RIGOR_RANK, resolveStrongerRigor } from '../rigor.mjs';
import { MODEL_POLICY_TIERS } from '../dispatch/config.mjs';
import { resolveStrongerTier, TIER_STRENGTH } from '../dispatch/assignment-policy.mjs';

export const BIND_CONTRACT_VERSION = 'v1alpha1';

const CHECKER_ROLES = new Set(['reviewer', 'red-team', 'tester', 'panelist', 'synthesizer']);

/**
 * Normalizes capability prefer pool to array of { executor, invocation }
 */
function normalizeCandidates(prefer) {
  if (!prefer) return [];
  if (typeof prefer === 'string') {
    return [{ executor: prefer, invocation: null }];
  }
  if (Array.isArray(prefer)) {
    return prefer.map((entry) => {
      if (typeof entry === 'string') {
        return { executor: entry, invocation: null };
      }
      if (entry && typeof entry === 'object') {
        return {
          executor: entry.executor,
          invocation: entry.invocation ?? null,
        };
      }
      return null;
    }).filter(Boolean);
  }
  return [];
}

/**
 * Check if executor has an invocation with via: 'cli' and adapter: 'herdr-spawn'
 */
function hasHerdrCliInvocation(executorEntry) {
  if (!executorEntry || !Array.isArray(executorEntry.invocations)) {
    return false;
  }
  return executorEntry.invocations.some((inv) => inv?.via === 'cli' && inv?.adapter === 'herdr-spawn');
}

/**
 * Look up capability config in runnerConfig:
 * First capabilities[domain:verb], then fallback capabilities[verb].
 */
function lookupCapabilityConfig(runnerConfig, capability) {
  if (!runnerConfig || typeof runnerConfig !== 'object' || !capability) {
    return { entry: null, key: null };
  }
  const capabilities = runnerConfig.capabilities ?? runnerConfig.runner?.capabilities ?? {};
  if (capabilities[capability]) {
    return { entry: capabilities[capability], key: capability };
  }
  if (capability.includes(':')) {
    const [, verb] = capability.split(':');
    if (capabilities[verb]) {
      return { entry: capabilities[verb], key: verb };
    }
  }
  return { entry: null, key: null };
}

/**
 * Filter candidate matching scope
 */
function findMatchingOverride(overrides, unit, role) {
  if (!Array.isArray(overrides)) return null;
  return overrides.find((ov) => {
    if (!ov || typeof ov !== 'object') return false;
    const scope = ov.scope;
    if (!scope) return true; // Global scope override
    const unitMatch = scope.unit === undefined || scope.unit === null || scope.unit === unit?.id;
    const roleMatch = scope.role === undefined || scope.role === null || scope.role === role;
    return unitMatch && roleMatch;
  }) ?? null;
}

/**
 * Resolve provider family for an executor id or candidate
 */
function getProviderFamily(runnerConfig, executorId) {
  const executors = runnerConfig?.executors ?? runnerConfig?.runner?.executors ?? {};
  const executorEntry = executors[executorId];
  const globalCommand = runnerConfig?.executor?.command ?? runnerConfig?.runner?.executor?.command;
  const cliInvocation = executorEntry?.invocations?.find((inv) => inv?.via === 'cli');
  const hasOwnCommandOrAdapter = cliInvocation?.command || cliInvocation?.adapter || executorEntry?.command || executorEntry?.adapter;
  const resolvedCommand = cliInvocation?.command ?? executorEntry?.command ?? (!hasOwnCommandOrAdapter ? globalCommand : undefined);
  return deriveProviderFamily(executorEntry, resolvedCommand);
}
/**
 * Pure bind function implementing the 5-level table and filter rules.
 *
 * @param {object} ask
 * @param {object} ctx
 * @returns {object} success binding or { refused: { reason, detail } }
 */
export function bind(ask, ctx, { skipCandidateIndex = -1 } = {}) {
  const {
    unit,
    role,
    readOnly = false,
    independentOf = [],
    lockedPersona = null,
    overrides = [],
  } = ask ?? {};

  const {
    runnerConfig = {},
    session = {},
  } = ctx ?? {};

  const executors = runnerConfig.executors ?? runnerConfig.runner?.executors ?? {};
  const isHeadless = Boolean(session.headless);
  const isLeadPresent = !isHeadless && (session.hasNativeAgent || session.provider);

  // 1. Posture resolution (X-1)
  const isWriteEmpty = !Array.isArray(unit?.writes) || unit.writes.length === 0;
  const isReadOnlyPosture = readOnly === true || isWriteEmpty;
  const posture = isReadOnlyPosture ? 'read-only' : (role === 'producer' ? 'workspace-write' : 'read-only');

  // 2. Candidate collection (5 levels)
  // Level 4: Overrides matching role/unit
  const matchingOverride = findMatchingOverride(overrides, unit, role);

  // Level 2 & 1: Capability prefer candidates (project / global)
  const { entry: capConfig, key: capKey } = lookupCapabilityConfig(runnerConfig, unit?.capability);

  let candidatePool = [];
  let candidateSource = 'prefer';

  if (matchingOverride && matchingOverride.executor) {
    candidatePool = [{
      executor: matchingOverride.executor,
      invocation: matchingOverride.invocation ?? null,
      override: matchingOverride,
    }];
    candidateSource = 'override';
  } else if (capConfig?.prefer) {
    candidatePool = normalizeCandidates(capConfig.prefer);
    candidateSource = `capability:${capKey}`;
  }

  // 3. Candidate resolution & Filtering
  let chosenCandidate = null;
  let refusalReason = null;
  let refusalDetail = null;

  if (candidatePool.length > 0) {
    let poolToSearch = candidatePool;
    if (skipCandidateIndex >= 0) {
      poolToSearch = candidatePool.slice(skipCandidateIndex + 1);
    }

    for (const cand of poolToSearch) {
      const executorId = cand.executor;
      const executorEntry = executors[executorId];
      const providerFamily = getProviderFamily(runnerConfig, executorId);

      // Filter: Governance
      const disallowedProviders = runnerConfig.governance?.disallowedProviders ?? runnerConfig.runner?.governance?.disallowedProviders;
      const disallowedExecutors = runnerConfig.governance?.disallowedExecutors ?? runnerConfig.runner?.governance?.disallowedExecutors;
      const govResult = checkProviderDisallowed(disallowedProviders, providerFamily, executorEntry?.command ?? executorId);
      if (govResult.disallowed || (Array.isArray(disallowedExecutors) && disallowedExecutors.includes(executorId))) {
        refusalReason = 'governance';
        refusalDetail = `Governance rejected executor "${executorId}" (provider: "${govResult.canonicalProvider || providerFamily}")`;
        continue;
      }

      // Filter: Independence
      if (Array.isArray(independentOf) && independentOf.length > 0) {
        // Collect provider families that we must be independent of
        const forbiddenFamilies = new Set();
        for (const dep of independentOf) {
          // dep might be a role name (e.g. 'producer') or a provider family directly
          forbiddenFamilies.add(dep.toLowerCase());
          // If dep is an executor registered in config, add its provider family too
          if (executors[dep]) {
            forbiddenFamilies.add(getProviderFamily(runnerConfig, dep).toLowerCase());
          }
        }

        const candidateFamilyLower = providerFamily.toLowerCase();
        const violatesIndependence = forbiddenFamilies.has(candidateFamilyLower);

        if (violatesIndependence) {
          // Check override exception: acceptDependence === true AND origin === 'human-cli'
          const isHumanOverrideAllowed = cand.override && cand.override.acceptDependence === true && cand.override.origin === 'human-cli';
          if (!isHumanOverrideAllowed) {
            refusalReason = 'independence';
            refusalDetail = `Candidate "${executorId}" (provider: "${providerFamily}") violates independence requirement against [${independentOf.join(', ')}]`;
            continue;
          }
        }
      }

      // Filter: Posture capability (Phase 6)
      if (!canApplyPosture(cand, posture, { runnerConfig, executors })) {
        refusalReason = 'posture-unavailable';
        refusalDetail = `Candidate "${executorId}" cannot apply posture "${posture}"`;
        continue;
      }

      // Candidate passed filters
      chosenCandidate = cand;
      break;
    }
  }

  // Fallback: If no candidate chosen yet
  if (!chosenCandidate) {
    // If role === 'producer' and session has Lead (not headless) -> inline
    if (role === 'producer' && isLeadPresent) {
      chosenCandidate = {
        executor: session.provider ?? 'lead',
        invocation: null,
        isInlineFallback: true,
      };
      candidateSource = 'session-lead-inline';
    } else {
      if (isHeadless) {
        return {
          refused: {
            reason: refusalReason || 'headless-no-executor',
            detail: refusalDetail || `No candidate executor available in headless session for capability "${unit?.capability}"`,
          },
        };
      }
      return {
        refused: {
          reason: refusalReason || 'no-candidate',
          detail: refusalDetail || `No candidate executor found for role "${role}" and capability "${unit?.capability}"`,
        },
      };
    }
  }

  const executorId = chosenCandidate.executor;
  const invocation = chosenCandidate.invocation;
  const executorEntry = executors[executorId];
  const providerFamily = getProviderFamily(runnerConfig, executorId);

  // 4. Transport (G7)
  let transport = 'cli';
  let transportSource = 'default-cli';
  if (hasHerdrCliInvocation(executorEntry) && session.herdrPresent === true) {
    transport = 'herdr';
    transportSource = 'herdr-invocation-present';
  }

  // 5. Mechanism (Q-A / D-ADR0033)
  let mechanism = 'out-of-process';
  let mechanismSource = 'decideExecutorDispatchMechanism';

  if (chosenCandidate.isInlineFallback) {
    mechanism = 'inline';
    mechanismSource = 'lead-producer-inline';
  } else {
    const isCheckerOrPanelRole = CHECKER_ROLES.has(role) || (role && role.startsWith('panelist-'));
    if (isCheckerOrPanelRole) {
      // Checker/reviewer/red-team/panel MUST NEVER be inline
      mechanism = 'out-of-process';
      mechanismSource = 'checker-role-forced-out-of-process';
    } else {
      const decidedMech = decideExecutorDispatchMechanism(runnerConfig, executorId, {
        hasLiveTaskAccess: Boolean(session.hasNativeAgent),
      });
      mechanism = decidedMech;
      mechanismSource = 'decideExecutorDispatchMechanism';
    }
  }

  // 6. Tier & Model (T)
  const unitRigor = unit?.rigor;
  const capRigor = capConfig?.rigor;
  const effectiveRigor = resolveStrongerRigor(unitRigor ?? 'standard', capRigor ?? 'standard');

  const rigorToTier = runnerConfig.rigorToTier ?? runnerConfig.runner?.rigorToTier ?? {
    low: 'nano',
    standard: 'standard',
    high: 'flagship',
    critical: 'frontier',
  };
  const derivedTier = rigorToTier[effectiveRigor] ?? 'standard';

  let finalTier = derivedTier;
  let tierSource = `rigor:${effectiveRigor}`;

  if (matchingOverride && matchingOverride.tier) {
    finalTier = resolveStrongerTier(derivedTier, matchingOverride.tier);
    tierSource = `override:${matchingOverride.origin ?? 'unknown'}`;
  }

  // Global maxTier check if configured
  const globalMaxTier = runnerConfig.maxTier ?? runnerConfig.runner?.maxTier;
  if (globalMaxTier && MODEL_POLICY_TIERS.includes(globalMaxTier)) {
    if (TIER_STRENGTH[finalTier] > TIER_STRENGTH[globalMaxTier]) {
      finalTier = globalMaxTier;
      tierSource = `clamped:maxTier(${globalMaxTier})`;
    }
  }

  // Resolve Model
  let model = executorEntry?.model ?? 'default';
  let modelSource = 'executor-entry';
  try {
    model = resolveTierModel(runnerConfig, finalTier, providerFamily);
    modelSource = `resolveTierModel(${providerFamily}.${finalTier})`;
  } catch {
    // If not in modelPolicies, fallback to executor.model or executor default
    if (executorEntry?.model) {
      model = executorEntry.model;
      modelSource = 'executor-entry-model';
    }
  }

  // 7. Persona
  let persona = null;
  let personaSource = 'none';

  if (matchingOverride && matchingOverride.persona) {
    if (lockedPersona && matchingOverride.persona !== lockedPersona) {
      return {
        refused: {
          reason: 'locked-persona',
          detail: `Cannot override locked persona "${lockedPersona}" with "${matchingOverride.persona}"`,
        },
      };
    }
    persona = matchingOverride.persona;
    personaSource = `override:${matchingOverride.origin ?? 'unknown'}`;
  } else if (lockedPersona) {
    persona = lockedPersona;
    personaSource = 'locked-persona';
  } else if (capConfig?.persona) {
    persona = capConfig.persona;
    personaSource = `capability:${capKey}`;
  }

  // 8. Provenance
  const provenance = {
    executor: { value: executorId, source: candidateSource },
    invocation: { value: invocation, source: invocation ? candidateSource : 'none' },
    transport: { value: transport, source: transportSource },
    tier: { value: finalTier, source: tierSource },
    model: { value: model, source: modelSource },
    persona: { value: persona, source: personaSource },
    mechanism: { value: mechanism, source: mechanismSource },
    posture: { value: posture, source: isReadOnlyPosture ? 'read-only-ask-or-writes-empty' : 'producer-writes-declared' },
  };

  if (matchingOverride?.origin) {
    provenance.overridesOrigin = { value: matchingOverride.origin, source: 'override' };
  }

  return {
    contractVersion: BIND_CONTRACT_VERSION,
    executor: executorId,
    invocation: invocation ?? null,
    transport,
    tier: finalTier,
    model,
    persona: persona ?? null,
    mechanism,
    posture,
    provenance,
  };
}

/**
 * Quota helper: walks to the next candidate in prefer[] matching all filters,
 * recording provenance fallbackFrom.
 *
 * @param {object} prevBinding
 * @param {object} ask
 * @param {object} ctx
 * @param {string} [reason='provider-limit']
 * @returns {object} next binding or refusal
 */
export function nextCandidate(prevBinding, ask, ctx, reason = 'provider-limit') {
  const { runnerConfig = {} } = ctx ?? {};
  const { entry: capConfig } = lookupCapabilityConfig(runnerConfig, ask?.unit?.capability);
  const candidates = normalizeCandidates(capConfig?.prefer);

  const prevIndex = candidates.findIndex((c) => c.executor === prevBinding?.executor);
  const nextResult = bind(ask, ctx, { skipCandidateIndex: prevIndex >= 0 ? prevIndex : 0 });

  if (nextResult.refused) {
    return nextResult;
  }

  // Augment provenance with fallbackFrom
  nextResult.provenance = {
    ...nextResult.provenance,
    fallbackFrom: {
      executor: prevBinding.executor,
      reason,
    },
  };

  return nextResult;
}
export { canApplyPosture };
