// src/runner/execution/bind.mjs — Single authority for executor/transport/tier/model/persona/mechanism/posture binding (Wave B / Phase 3)
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/**

import { decideExecutorDispatchMechanism } from '../dispatch/mechanism.mjs';
import { deriveProviderFamily, resolveTierModel } from '../dispatch/resolve.mjs';
import { checkProviderDisallowed } from '../dispatch/provider-adapter.mjs';
import { canApplyPosture, resolvePostureInvocation } from '../dispatch/confinement/policies.mjs';
import { RIGOR_VALUES, RIGOR_RANK, resolveStrongerRigor } from '../rigor.mjs';
import { MODEL_POLICY_TIERS, assertReasoningEffort } from '../dispatch/config.mjs';
import { resolveStrongerTier, TIER_STRENGTH } from '../dispatch/assignment-policy.mjs';

export const BIND_CONTRACT_VERSION = 'v1alpha1';

const CHECKER_ROLES = new Set(['reviewer', 'red-team', 'tester', 'panelist', 'synthesizer']);

/** Checker and panel roles never run inline or in-process. */
function isCheckerOrPanelRole(role) {
  return CHECKER_ROLES.has(role) || Boolean(role && role.startsWith('panelist-'));
}

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
 * The executor's herdr-spawn invocation, when it has one a caller can pin by id.
 * A herdr invocation without an id cannot be named, so it is never chosen.
 */
function findHerdrInvocation(executorEntry) {
  if (!executorEntry || !Array.isArray(executorEntry.invocations)) {
    return null;
  }
  return executorEntry.invocations.find(
    (inv) => inv?.via === 'cli' && inv?.adapter === 'herdr-spawn' && typeof inv.id === 'string' && inv.id,
  ) ?? null;
}

/**
 * Look up capability config in runnerConfig:
 * First capabilities[domain:verb], then fallback capabilities[verb].
 */
export function hasUsablePrefer(entry) {
  const prefer = entry?.prefer;
  return typeof prefer === 'string' ? prefer.trim() !== '' : Array.isArray(prefer) && prefer.length > 0;
}

function lookupCapabilityConfig(runnerConfig, capability) {
  if (!runnerConfig || typeof runnerConfig !== 'object' || !capability) {
    return { entry: null, key: null };
  }
  const capabilities = runnerConfig.capabilities ?? runnerConfig.runner?.capabilities ?? {};
  // An entry wins only with a usable prefer pool: a description-only slot must not
  // hide a bare-verb entry that has one. With no usable pool anywhere, the exact
  // entry (then the bare verb) is still returned so its rigor/persona apply.
  const verb = capability.includes(':') ? capability.split(':')[1] : null;
  const ordered = [capability, verb].filter(Boolean).map((key) => ({ key, entry: capabilities[key] })).filter((hit) => hit.entry);
  const hit = ordered.find((h) => hasUsablePrefer(h.entry)) ?? ordered[0];
  if (hit) return { entry: hit.entry, key: hit.key };
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
export function getProviderFamily(runnerConfig, executorId) {
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
export function bind(ask, ctx, { skipCandidateIndex = -1, excludeFamilies = [] } = {}) {
  const {
    unit,
    role,
    readOnly = false,
    independentOf = [],
    preferIndependentOf = null,
    lockedPersona = null,
    overrides = [],
    blind = false,
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

  // Each candidate carries its own `source`; the binding records the source of the one chosen.
  let candidatePool = [];

  if (matchingOverride && matchingOverride.executor) {
    candidatePool = [{
      executor: matchingOverride.executor,
      invocation: matchingOverride.invocation ?? null,
      override: matchingOverride,
      source: 'override',
    }];
  } else {
    // The unit's own `prefer` is soft: its candidates go ahead of the capability's pool, a
    // capability candidate it already names is not listed twice, and every filter below applies
    // to both alike. A bare executor id names the executor whatever invocation it runs, so it
    // covers every capability entry of that executor: a failover never walks back onto it.
    // A unit without one binds exactly as before.
    const seen = new Set();
    const keyOf = (cand) => `${cand.executor}\u0000${cand.invocation ?? ''}`;
    const unitCandidates = normalizeCandidates(unit?.prefer)
      .filter((cand) => !seen.has(keyOf(cand)) && seen.add(keyOf(cand)))
      .map((cand) => ({ ...cand, source: 'unit-prefer' }));
    const bareExecutors = new Set(unitCandidates.filter((cand) => !cand.invocation).map((cand) => cand.executor));
    const capabilityCandidates = (capConfig?.prefer ? normalizeCandidates(capConfig.prefer) : [])
      .filter((cand) => !seen.has(keyOf(cand)) && !bareExecutors.has(cand.executor))
      .map((cand) => ({ ...cand, source: `capability:${capKey}` }));
    candidatePool = [...unitCandidates, ...capabilityCandidates];
  }

  // Soft spread: `preferIndependentOf` is [{ role, executor }] of the seats already bound (empty
  // for the first seat of a spread; absent when the role asks for none). It never refuses; it only
  // ranks the candidates that passed every filter (see below).
  const spreadRequested = Array.isArray(preferIndependentOf);
  const familyUse = new Map();
  for (const seat of spreadRequested ? preferIndependentOf : []) {
    if (!seat?.executor) continue;
    const family = getProviderFamily(runnerConfig, seat.executor).toLowerCase();
    familyUse.set(family, (familyUse.get(family) ?? 0) + 1);
  }

  // Families a fallback walk must not land on (a login that just failed); lower-cased like the spread.
  const excludedFamilies = new Set((Array.isArray(excludeFamilies) ? excludeFamilies : []).map((family) => String(family).toLowerCase()));

  // 3. Candidate resolution & Filtering
  let chosenCandidate = null;
  let chosenCandidateIndex = -1;
  let chosenFamilyUse = Infinity;
  let refusalReason = null;
  let refusalDetail = null;

  if (candidatePool.length > 0) {
    for (let poolIndex = 0; poolIndex < candidatePool.length; poolIndex += 1) {
      // A fallback walk resumes after the candidate that just failed.
      if (poolIndex <= skipCandidateIndex) continue;
      const cand = candidatePool[poolIndex];
      const executorId = cand.executor;
      const executorEntry = executors[executorId];
      const providerFamily = getProviderFamily(runnerConfig, executorId);

      // Filter: a unit may name an executor this config does not register; it is skipped, not thrown.
      if (cand.source === 'unit-prefer' && !executorEntry) {
        refusalReason = 'unknown-executor';
        refusalDetail = `Unit prefers executor "${executorId}", which is not registered`;
        continue;
      }

      // Filter: Governance
      const disallowedProviders = runnerConfig.governance?.disallowedProviders ?? runnerConfig.runner?.governance?.disallowedProviders;
      const disallowedExecutors = runnerConfig.governance?.disallowedExecutors ?? runnerConfig.runner?.governance?.disallowedExecutors;
      const govResult = checkProviderDisallowed(disallowedProviders, providerFamily, executorEntry?.command ?? executorId);
      if (govResult.disallowed || (Array.isArray(disallowedExecutors) && disallowedExecutors.includes(executorId))) {
        refusalReason = 'governance';
        refusalDetail = `Governance rejected executor "${executorId}" (provider: "${govResult.canonicalProvider || providerFamily}")`;
        continue;
      }

      // Filter: a family excluded by the caller (a dead credential seen earlier in this unit).
      if (excludedFamilies.has(providerFamily.toLowerCase())) {
        refusalReason = 'family-excluded';
        refusalDetail = `Candidate "${executorId}" (provider: "${providerFamily}") is excluded because its credential just failed`;
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
      // The invocation that can carry the posture is decided here, once, and recorded
      // in the binding: it is exactly the one the run pins.
      const approved = resolvePostureInvocation(cand, posture, { runnerConfig, executors, herdrPresent: session.herdrPresent === true });
      if (!approved.ok) {
        refusalReason = 'posture-unavailable';
        refusalDetail = `Candidate "${executorId}" cannot apply posture "${posture}"`;
        continue;
      }

      // Filter: a blind role needs a sandbox around its worker. An in-process agent has none,
      // so a candidate that would run in-process is never chosen for it.
      if (blind && !isCheckerOrPanelRole(role)
        && decideExecutorDispatchMechanism(runnerConfig, executorId, { hasLiveTaskAccess: Boolean(session.hasNativeAgent) }) !== 'out-of-process') {
        refusalReason = 'blind-in-process';
        refusalDetail = `Candidate "${executorId}" would run in-process, where no sandbox can keep a blind role blind`;
        continue;
      }

      // Candidate passed filters. Without a soft spread the first one in pool order wins. With
      // one, the family used by the fewest listed seats wins (an unused family has 0), and the
      // pool order breaks ties because a later candidate must be strictly better to replace it.
      const use = spreadRequested ? (familyUse.get(providerFamily.toLowerCase()) ?? 0) : 0;
      if (!chosenCandidate || use < chosenFamilyUse) {
        chosenCandidate = { ...cand, invocation: approved.invocation };
        chosenCandidateIndex = poolIndex;
        chosenFamilyUse = use;
      }
      if (!spreadRequested || use === 0) break;
    }
  }

  // Fallback: If no candidate chosen yet
  if (!chosenCandidate) {
    // If role === 'producer' and session has Lead (not headless) -> inline
    if (role === 'producer' && isLeadPresent && !blind) {
      chosenCandidate = {
        executor: session.provider ?? 'lead',
        invocation: null,
        isInlineFallback: true,
        source: 'session-lead-inline',
      };
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
  const executorEntry = executors[executorId];
  const providerFamily = getProviderFamily(runnerConfig, executorId);

  // 4. Transport (G7): herdr when this session runs inside one and the executor has a
  // herdr-spawn invocation that can carry the posture; the invocation that runs is then
  // that herdr one. An invocation a human pinned by override, or one a unit named in its own
  // `prefer`, stays as named.
  let invocation = chosenCandidate.invocation;
  let transport = 'cli';
  let transportSource = 'default-cli';
  const herdrInvocation = findHerdrInvocation(executorEntry);
  const namedInvocation = chosenCandidate.override?.invocation
    || (chosenCandidate.source === 'unit-prefer' && chosenCandidate.invocation);
  if (namedInvocation) {
    transportSource = chosenCandidate.override?.invocation ? 'override-pinned-invocation' : 'unit-prefer-pinned-invocation';
    const pinned = executorEntry?.invocations?.find((inv) => inv?.id === invocation);
    if (pinned?.adapter === 'herdr-spawn') transport = 'herdr';
  } else if (herdrInvocation && session.herdrPresent === true && !chosenCandidate.isInlineFallback) {
    if (canApplyPosture({ executor: executorId, invocation: herdrInvocation.id }, posture, { runnerConfig, executors })) {
      transport = 'herdr';
      transportSource = 'herdr-invocation-present';
      invocation = herdrInvocation.id;
    } else {
      transportSource = 'cli:herdr-invocation-cannot-apply-posture';
    }
  }

  // 5. Mechanism (Q-A / D-ADR0033)
  let mechanism = 'out-of-process';
  let mechanismSource = 'decideExecutorDispatchMechanism';

  if (chosenCandidate.isInlineFallback) {
    mechanism = 'inline';
    mechanismSource = 'lead-producer-inline';
  } else {
    if (isCheckerOrPanelRole(role)) {
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
  const unitPersona = typeof unit?.persona === 'string' && unit.persona ? unit.persona : null;

  if (lockedPersona && unitPersona && unitPersona !== lockedPersona) {
    return {
      refused: {
        reason: 'locked-persona',
        detail: `Unit persona "${unitPersona}" conflicts with locked persona "${lockedPersona}"`,
      },
    };
  }

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
  } else if (unitPersona) {
    persona = unitPersona;
    personaSource = 'unit';
  } else if (lockedPersona) {
    persona = lockedPersona;
    personaSource = 'locked-persona';
  } else if (capConfig?.persona) {
    persona = capConfig.persona;
    personaSource = `capability:${capKey}`;
  }

  // 7b. Reasoning effort: only an override asks for one (`fgos run --effort`, or a
  // `reasoningEffort` key in `--override`). It is checked here against the same rule the launch
  // applies (canonical levels, then the executor's declared `supports.reasoningEffort`), so a
  // level the chosen executor refuses is a refused binding, not a failed run; the transport
  // renders it into the provider CLI's own flag. Without one the executor's own default stands.
  let reasoningEffort = null;
  let reasoningEffortSource = 'none';
  if (matchingOverride && matchingOverride.reasoningEffort !== undefined) {
    try {
      reasoningEffort = assertReasoningEffort(matchingOverride.reasoningEffort, {
        supported: executorEntry?.supports?.reasoningEffort,
        executorId,
      });
    } catch (err) {
      return { refused: { reason: 'reasoning-effort', detail: err.message } };
    }
    reasoningEffortSource = `override:${matchingOverride.origin ?? 'unknown'}`;
  }

  // 8. Provenance
  const provenance = {
    executor: { value: executorId, source: chosenCandidate.source },
    invocation: { value: invocation, source: invocation ? chosenCandidate.source : 'none' },
    transport: { value: transport, source: transportSource },
    tier: { value: finalTier, source: tierSource },
    model: { value: model, source: modelSource },
    persona: { value: persona, source: personaSource },
    reasoningEffort: { value: reasoningEffort, source: reasoningEffortSource },
    mechanism: { value: mechanism, source: mechanismSource },
    posture: { value: posture, source: isReadOnlyPosture ? 'read-only-ask-or-writes-empty' : 'producer-writes-declared' },
  };

  // Degraded independence is recorded, never hidden: which seats this one shares a provider
  // family with, and that no eligible (governance, posture) unused family was left in the pool.
  if (spreadRequested && !chosenCandidate.isInlineFallback) {
    const family = providerFamily.toLowerCase();
    const sharedWith = preferIndependentOf
      .filter((seat) => seat?.executor && getProviderFamily(runnerConfig, seat.executor).toLowerCase() === family)
      .map((seat) => seat.role);
    provenance.familySpread = {
      value: { family: providerFamily, sharedWith: [...new Set(sharedWith)] },
      source: sharedWith.length === 0 ? 'prefer-independent-of:distinct-family' : 'prefer-independent-of:no-eligible-unused-family',
    };
  }

  if (matchingOverride?.origin) {
    provenance.overridesOrigin = { value: matchingOverride.origin, source: 'override' };
  }

  return {
    contractVersion: BIND_CONTRACT_VERSION,
    executor: executorId,
    invocation: invocation ?? null,
    transport,
    candidateIndex: chosenCandidateIndex,
    tier: finalTier,
    model,
    persona: persona ?? null,
    reasoningEffort,
    mechanism,
    posture,
    provenance,
  };
}

/**
 * Quota helper: walks to the next candidate in prefer[] matching all filters,
 * recording provenance fallbackFrom (`kind: 'next-candidate'`).
 *
 * @param {object} prevBinding
 * @param {object} ask
 * @param {object} ctx
 * @param {string} [reason='provider-limit']
 * @param {object} [opts]
 * @param {string[]} [opts.excludeFamilies] provider families the walk must not land on
 * @returns {object} next binding or refusal
 */
export function nextCandidate(prevBinding, ask, ctx, reason = 'provider-limit', { excludeFamilies = [] } = {}) {
  const prevIndex = Number.isInteger(prevBinding?.candidateIndex) ? prevBinding.candidateIndex : -1;
  if (prevIndex < 0) {
    return {
      refused: {
        reason: 'no-candidate',
        detail: 'the previous binding did not come from a capability prefer pool, so there is no next candidate',
      },
    };
  }
  const nextResult = bind(ask, ctx, { skipCandidateIndex: prevIndex, excludeFamilies });

  if (nextResult.refused) {
    return nextResult;
  }

  // Augment provenance with fallbackFrom
  nextResult.provenance = {
    ...nextResult.provenance,
    fallbackFrom: {
      executor: prevBinding.executor,
      invocation: prevBinding.invocation ?? null,
      transport: prevBinding.transport ?? null,
      reason,
      kind: 'next-candidate',
    },
  };

  return nextResult;
}

/**
 * The same candidate again, for another account of its provider: the binding is unchanged (same
 * executor, invocation, transport and pool position, so a later walk resumes where this one
 * would have) and only its provenance says it is a retry of `prevBinding` (`kind:
 * 'account-rotation'`). Which account the retry runs on is the lease's choice, not bind()'s.
 *
 * @param {object} prevBinding
 * @param {object} [detail] extra provenance, e.g. { provider, accountsHealthy }
 * @param {string} [reason='provider-limit']
 */
export function retrySameCandidate(prevBinding, detail = {}, reason = 'provider-limit') {
  return {
    ...prevBinding,
    provenance: {
      ...prevBinding.provenance,
      fallbackFrom: {
        executor: prevBinding.executor,
        invocation: prevBinding.invocation ?? null,
        transport: prevBinding.transport ?? null,
        reason,
        kind: 'account-rotation',
        ...detail,
      },
    },
  };
}
export { canApplyPosture };
