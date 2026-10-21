// src/runner/execution/bind.mjs — Single authority for executor/transport/tier/model/persona/mechanism/posture binding (Wave B / Phase 3)
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/**

import { decideExecutorDispatchMechanism } from '../dispatch/mechanism.mjs';
import { deriveProviderFamily, resolveTierCandidates, resolveTierModel, tierCellMissingDetail, tierFallbackOf } from '../dispatch/resolve.mjs';
import { checkProviderDisallowed } from '../dispatch/provider-adapter.mjs';
import { canApplyPosture, resolvePostureInvocation } from '../dispatch/confinement/policies.mjs';
import { MODEL_POLICY_TIERS, RunnerConfigError, assertReasoningEffort, assertRunTimeoutMs } from '../dispatch/config.mjs';
import { credentialSourceForCli, credentialStoreOf, providerAccountInventory } from '../dispatch/provider-capacity.mjs';
import { legacyStateKey } from '../dispatch/llm-accounts.mjs';
import { PIN_REFUSES_SEAT, parseAccountPin, resolveAccountPin } from './account-pin.mjs';
import { DEFAULT_RUN_CAPABILITY, PRODUCER_POSTURE, capabilityEntriesOf, effectiveRigorOf } from './seat-resolver.mjs';
import { seatPolicy } from './seat-policy.mjs';

export const BIND_CONTRACT_VERSION = 'v1alpha1';


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
 * Filter candidate matching scope
 */
function findMatchingOverride(overrides, unit, seat, role) {
  if (!Array.isArray(overrides)) return null;
  return overrides.find((ov) => {
    if (!ov || typeof ov !== 'object') return false;
    const scope = ov.scope;
    if (!scope) return true; // Global scope override
    const unitMatch = scope.unit === undefined || scope.unit === null || scope.unit === unit?.id;
    const seatMatch = scope.seat === undefined || scope.seat === null || scope.seat === seat;
    const roleMatch = scope.role === undefined || scope.role === null || scope.role === role;
    return unitMatch && seatMatch && roleMatch;
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

const identityKey = (executor, invocation, pool, model) => [executor, invocation ?? '', pool ?? '', model ?? ''].join('\u0000');

/** What names one candidate of a seat's walk: executor, invocation, pool and model. */
export const bindingIdentity = (binding) => identityKey(binding?.executor, binding?.invocation, binding?.pool, binding?.model);

/** Where an override came from: its origin when it names one (a workflow's seat persona), else just "override". */
const overrideSource = (override) => (override?.origin ? `override:${override.origin}` : 'override');

/**
 * The persona that sits a seat, and where it came from: an override's, else the seat's own, the
 * unit's, the locked one, the capability's default (its exact entry, then its prefix entry).
 * `base` is the same chain without the persona a door selected, which is what the tier is judged
 * against before the selection (a persona a door picks that lifts the tier is a raise).
 */
function resolvePersona({ ask, unit, matchingOverride, capEntries }) {
  const { persona: seatPersona = null, lockedPersona = null } = ask ?? {};
  const unitPersona = typeof unit?.persona === 'string' && unit.persona ? unit.persona : null;
  if (lockedPersona && unitPersona && unitPersona !== lockedPersona) {
    return { refused: { reason: 'locked-persona', detail: `Unit persona "${unitPersona}" conflicts with locked persona "${lockedPersona}"` } };
  }
  if (matchingOverride?.persona && lockedPersona && matchingOverride.persona !== lockedPersona) {
    return { refused: { reason: 'locked-persona', detail: `Cannot override locked persona "${lockedPersona}" with "${matchingOverride.persona}"` } };
  }
  const capDefault = capEntries.find(({ entry }) => entry.persona);
  const chain = (skip) => {
    if (seatPersona) return { persona: seatPersona, source: 'seat' };
    if (unitPersona && unitPersona !== skip) return { persona: unitPersona, source: 'unit' };
    if (lockedPersona) return { persona: lockedPersona, source: 'locked-persona' };
    if (capDefault) return { persona: capDefault.entry.persona, source: `capability:${capDefault.key}` };
    return { persona: null, source: 'none' };
  };
  const selected = ask?.selectors?.persona ?? matchingOverride?.persona ?? null;
  const chosen = matchingOverride?.persona
    ? { persona: matchingOverride.persona, source: overrideSource(matchingOverride) }
    : chain(null);
  return { ...chosen, selected, base: chain(selected).persona };
}

/**
 * Stage 1: the tier, the ordered executors and where each came from, decided by Seat Binding (the
 * crate). This builds its ask from the unit, the seat and the overrides; it chooses nothing itself.
 * Returns `{ policy }` or `{ refused }`.
 */
function decidePolicy({ ask, unit, seat, role, seatPosture, blind, matchingOverride, persona, runnerConfig }) {
  const overrideTier = matchingOverride?.tier;
  if (overrideTier !== undefined && !MODEL_POLICY_TIERS.includes(overrideTier)) {
    throw new RunnerConfigError(`invalid tier "${overrideTier}". Valid tiers: [${MODEL_POLICY_TIERS.join(', ')}]`);
  }
  const doorSelectors = ask?.selectors ?? {};
  const selectors = {
    ...(persona.selected ? { persona: persona.selected } : {}),
    ...(doorSelectors.seat ? { seat: doorSelectors.seat } : {}),
    ...(doorSelectors.capability ? { capability: doorSelectors.capability } : {}),
  };
  return seatPolicy({
    // A door that names the capability changes it: the ask carries what the door would have run without it.
    capability: selectors.capability ? DEFAULT_RUN_CAPABILITY : unit?.capability,
    seat,
    role,
    ...(persona.base ? { persona: persona.base } : {}),
    label: unit?.id ?? null,
    ...(ask?.workflowTier ? { workflow: ask.workflowTier } : {}),
    selectors,
    raiseAuthorized: ask?.raiseAuthorized === true,
    ...(overrideTier !== undefined ? { override: { tier: overrideTier } } : {}),
    posture: { readOnly: seatPosture.readOnly === true, forceOutOfProcess: seatPosture.forceOutOfProcess === true, blind: blind === true },
    effectiveRigor: effectiveRigorOf(unit, runnerConfig, { fallback: 'standard' }),
  }, runnerConfig);
}

/**
 * The executor a `prefer` entry of the decided policy names. An entry that comes from the tier's own
 * fallback list names a family; the agent executor that serves the family is the candidate. Any other
 * entry already names an executor.
 */
function executorOfEntry(entry, { fromFallback, runnerConfig, executors }) {
  if (!fromFallback) return entry.executor;
  if (executors[entry.executor] && executors[entry.executor].kind !== 'tool') return entry.executor;
  return Object.keys(executors).find((id) => executors[id]?.kind !== 'tool' && getProviderFamily(runnerConfig, id) === entry.executor) ?? null;
}

/**
 * The invocation and transport a candidate launches with (G7): herdr when this session runs inside
 * one and the executor has a herdr-spawn invocation that can carry the posture; the invocation that
 * runs is then that herdr one. An invocation a human pinned by override, or one a unit named in its
 * own `prefer`, stays as named. Null when no invocation can carry the posture.
 */
function resolveLaunch(cand, { posture, runnerConfig, executors, session }) {
  const executorEntry = executors[cand.executor];
  const approved = resolvePostureInvocation(cand, posture, { runnerConfig, executors, herdrPresent: session.herdrPresent === true });
  if (!approved.ok) return null;
  let invocation = approved.invocation;
  let transport = 'cli';
  let transportSource = 'default-cli';
  const herdrInvocation = findHerdrInvocation(executorEntry);
  const namedInvocation = cand.override?.invocation
    || (cand.source === 'unit-prefer' && cand.invocation);
  if (namedInvocation) {
    transportSource = cand.override?.invocation ? 'override-pinned-invocation' : 'unit-prefer-pinned-invocation';
    const pinned = executorEntry?.invocations?.find((inv) => inv?.id === invocation);
    if (pinned?.adapter === 'herdr-spawn') transport = 'herdr';
  } else if (herdrInvocation && session.herdrPresent === true) {
    if (canApplyPosture({ executor: cand.executor, invocation: herdrInvocation.id }, posture, { runnerConfig, executors })) {
      transport = 'herdr';
      transportSource = 'herdr-invocation-present';
      invocation = herdrInvocation.id;
    } else {
      transportSource = 'cli:herdr-invocation-cannot-apply-posture';
    }
  }
  return { invocation, transport, transportSource };
}

/** The accounts the lease reads, per state key; empty when the inventory cannot be read. */
function readInventory(runnerConfig) {
  try {
    return providerAccountInventory(runnerConfig) ?? {};
  } catch {
    return {};
  }
}

/**
 * Why a pool cannot serve a launch through `invocation`, or null when it can. A pool with no
 * account runs on the executor's own login, which only the pool named after the family may do; a
 * pool with accounts needs one that is enabled and holds a login store for the CLI the invocation
 * reads. Config only: quarantine and leases are the lease's business at dispatch.
 */
export function poolUnusableReason(inventory, { pool, family, executorEntry, invocation }) {
  const accounts = Object.values(inventory?.[legacyStateKey(pool)]?.accounts ?? {});
  const invocationEntry = executorEntry?.invocations?.find((inv) => inv?.id === invocation);
  const store = invocationEntry ? credentialStoreOf({ ...invocationEntry, command: invocationEntry.command ?? executorEntry.command }) : null;
  if (accounts.length === 0) {
    return pool === family ? null : `pool "${pool}" has no account in runner.llmAccounts, so nothing can pay for the call`;
  }
  if (!store) return pool === family ? null : `the invocation reads no login store, which pool "${pool}" needs an account for`;
  if (!accounts.some((account) => account.disabled !== true && credentialSourceForCli(account, store.use))) {
    return `no enabled account of pool "${pool}" holds a "${store.use}" login store`;
  }
  return null;
}

/**
 * Everything a binding is chosen from, before any candidate is judged: the posture, the tier, the
 * candidates (one per tier-cell entry of each `prefer` executor, in order) and the filter that says
 * why a candidate is out. Pure over `ask` and `ctx`.
 */
function prepare(ask, ctx, { excludePools = [] } = {}) {
  const {
    unit,
    seat = 'producer',
    role = 'producer',
    posture: seatPosture = PRODUCER_POSTURE,
    readOnly = false,
    independentOf = [],
    overrides = [],
    blind = false,
  } = ask ?? {};
  const { runnerConfig = {}, session = {} } = ctx ?? {};
  const executors = runnerConfig.executors ?? runnerConfig.runner?.executors ?? {};
  const policyConfig = runnerConfig.modelPolicies ? runnerConfig : (runnerConfig.runner ?? runnerConfig);

  // Posture resolution (X-1)
  const isWriteEmpty = !Array.isArray(unit?.writes) || unit.writes.length === 0;
  const isReadOnlyPosture = readOnly === true || seatPosture.readOnly === true || isWriteEmpty;
  const posture = isReadOnlyPosture ? 'read-only' : (seatPosture.writer ? 'workspace-write' : 'read-only');

  // Candidate collection (5 levels). Level 4: overrides matching role/unit.
  const matchingOverride = findMatchingOverride(overrides, unit, seat, role);

  // Skills the work needs. Only roles that do the unit's work are asked for them; a checker or panel
  // seat reads the result and is chosen on independence, not on what the producer's task needs.
  const requiredSkills = !seatPosture.forceOutOfProcess && Array.isArray(unit?.skills) ? unit.skills : [];

  // The persona, then the tier and the executor order, which Seat Binding decides (stage 1). The tier
  // comes first: each family's cell is read at it while the candidates are built.
  const persona = resolvePersona({ ask, unit, matchingOverride, capEntries: capabilityEntriesOf(runnerConfig, unit?.capability) });
  if (persona.refused) return { refused: persona.refused };
  const decided = decidePolicy({ ask, unit, seat, role, seatPosture, blind, matchingOverride, persona, runnerConfig });
  if (decided.refused) return { refused: decided.refused };
  const { policy } = decided;
  const seatTier = { tier: policy.tier, source: policy.tierSource };

  // Each candidate carries its own `source`; the binding records the source of the one chosen.
  let basePool = [];
  if (matchingOverride && matchingOverride.executor) {
    basePool = [{
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
    const fromFallback = policy.preferSource.startsWith('tierFallback.');
    const capabilityCandidates = normalizeCandidates(policy.prefer)
      .map((cand) => ({ ...cand, executor: executorOfEntry(cand, { fromFallback, runnerConfig, executors }) }))
      .filter((cand) => cand.executor && !seen.has(keyOf(cand)) && !bareExecutors.has(cand.executor))
      .map((cand) => ({ ...cand, source: policy.preferSource }));
    basePool = [...unitCandidates, ...capabilityCandidates];
  }

  // Candidates are (executor, tier-cell entry). A seat that leases a provider account (an
  // out-of-process agent) needs a model, so its family's cell at the tier must exist and each of its
  // entries is a candidate of its own; a seat that runs in-process or as a tool needs none.
  const launchEnv = { posture, runnerConfig, executors, session };
  const candidates = [];
  for (const base of basePool) {
    const executorEntry = executors[base.executor];
    const family = getProviderFamily(runnerConfig, base.executor);
    const mechanism = !executorEntry ? null
      : seatPosture.forceOutOfProcess ? 'out-of-process'
        : decideExecutorDispatchMechanism(runnerConfig, base.executor, { hasLiveTaskAccess: Boolean(session.hasNativeAgent) });
    const common = { ...base, family, executorEntry, mechanism, launch: executorEntry ? resolveLaunch(base, launchEnv) : null, entry: null, cellProblem: null };
    const leases = Boolean(executorEntry) && executorEntry.kind !== 'tool' && mechanism === 'out-of-process';
    if (!leases) {
      let model = 'default';
      let modelSource = 'no-model-needed';
      try {
        model = resolveTierModel(policyConfig, seatTier.tier, family);
        modelSource = `modelPolicies.${family}.${seatTier.tier}`;
      } catch { /* an in-process or tool seat runs without a model */ }
      candidates.push({ ...common, pool: null, model, modelSource });
      continue;
    }
    let cell = null;
    try {
      cell = resolveTierCandidates(policyConfig, seatTier.tier, family);
    } catch { /* reported as the missing cell below */ }
    if (!cell) {
      candidates.push({
        ...common,
        pool: null,
        model: null,
        modelSource: null,
        cellProblem: tierCellMissingDetail(family, seatTier.tier),
      });
      continue;
    }
    cell.forEach((entry, index) => candidates.push({
      ...common,
      entry,
      pool: entry.pool,
      model: entry.model,
      modelSource: `modelPolicies.${family}.${seatTier.tier}[${index}]`,
    }));
  }
  const identityOf = (cand) => identityKey(cand.executor, cand.launch?.invocation, cand.pool, cand.model);

  const inventory = readInventory(runnerConfig);
  const excluded = new Set(Array.isArray(excludePools) ? excludePools : []);

  /** Why this candidate is out of the running, or null. */
  const rejectionOf = (cand) => {
    const executorId = cand.executor;
    const executorEntry = cand.executorEntry;
    const providerFamily = cand.family;

    // A unit may name an executor this config does not register; it is skipped, not thrown.
    if (cand.source === 'unit-prefer' && !executorEntry) {
      return { reason: 'unknown-executor', detail: `Unit prefers executor "${executorId}", which is not registered` };
    }

    const disallowedProviders = runnerConfig.governance?.disallowedProviders ?? runnerConfig.runner?.governance?.disallowedProviders;
    const disallowedExecutors = runnerConfig.governance?.disallowedExecutors ?? runnerConfig.runner?.governance?.disallowedExecutors;
    const govResult = checkProviderDisallowed(disallowedProviders, providerFamily, executorEntry?.command ?? executorId);
    if (govResult.disallowed || (Array.isArray(disallowedExecutors) && disallowedExecutors.includes(executorId))) {
      return { reason: 'governance', detail: `Governance rejected executor "${executorId}" (provider: "${govResult.canonicalProvider || providerFamily}")` };
    }

    // The executor must declare every skill the unit needs (`supports.skills`).
    if (requiredSkills.length > 0) {
      const declared = executorEntry?.supports?.skills ?? [];
      const missing = requiredSkills.filter((skill) => !declared.includes(skill));
      if (missing.length > 0) {
        return { reason: 'skills-unavailable', detail: `Candidate "${executorId}" does not declare skill${missing.length > 1 ? 's' : ''} [${missing.join(', ')}] in supports.skills` };
      }
    }

    // A pool excluded by the caller (a dead credential seen earlier in this unit).
    if (cand.pool && excluded.has(cand.pool)) {
      return { reason: 'pool-excluded', detail: `Candidate "${executorId}" (pool: "${cand.pool}") is excluded because its credential just failed` };
    }

    if (Array.isArray(independentOf) && independentOf.length > 0) {
      // Collect provider families that we must be independent of
      const forbiddenFamilies = new Set();
      for (const dep of independentOf) {
        // dep might be a role name (e.g. 'producer') or a provider family directly
        forbiddenFamilies.add(dep.toLowerCase());
        // If dep is an executor registered in config, add its provider family too
        if (executors[dep]) forbiddenFamilies.add(getProviderFamily(runnerConfig, dep).toLowerCase());
      }
      if (forbiddenFamilies.has(providerFamily.toLowerCase())) {
        // Accepting a dependence is a raise only an authorized door may make; no door is authorized yet.
        const isDependenceAccepted = cand.override?.acceptDependence === true && ask?.raiseAuthorized === true;
        if (!isDependenceAccepted) {
          return { reason: 'independence', detail: `Candidate "${executorId}" (provider: "${providerFamily}") violates independence requirement against [${independentOf.join(', ')}]` };
        }
      }
    }

    // Posture capability: the invocation that can carry the posture is decided once, in `launch`.
    if (!cand.launch) {
      return { reason: 'posture-unavailable', detail: `Candidate "${executorId}" cannot apply posture "${posture}"` };
    }

    // A blind role needs a sandbox around its worker. An in-process agent has none,
    // so a candidate that would run in-process is never chosen for it.
    if (blind && !seatPosture.forceOutOfProcess && cand.mechanism !== 'out-of-process') {
      return { reason: 'blind-in-process', detail: `Candidate "${executorId}" would run in-process, where no sandbox can keep a blind role blind` };
    }

    if (cand.cellProblem) {
      return { reason: 'tier-cell-missing', detail: cand.cellProblem, family: providerFamily };
    }
    if (cand.entry) {
      const unusable = poolUnusableReason(inventory, { pool: cand.pool, family: providerFamily, executorEntry, invocation: cand.launch.invocation });
      if (unusable) {
        return { reason: 'pool-unusable', detail: `Candidate "${executorId}" with model "${cand.model}" is not served: ${unusable}`, family: providerFamily };
      }
    }
    return null;
  };

  return {
    unit, seat, role, seatPosture, blind, runnerConfig, session, executors, policyConfig,
    posture, isReadOnlyPosture, matchingOverride, requiredSkills, persona,
    policy, seatTier, candidates, identityOf, rejectionOf, inventory,
  };
}

/**
 * The order a walk visits candidates after `tried` (the seat's earlier bindings, last one failed):
 * first the remaining entries of the failed candidate's family in cell order, then the tier's
 * declared family order (`runner.tierFallback.<tier>`, limited to the families `prefer` names, so a
 * list narrows and never widens), or, with no list declared, the rest of the `prefer` order.
 */
function walkOrder(prep, tried) {
  const { candidates, identityOf } = prep;
  const last = tried[tried.length - 1];
  const lastKey = bindingIdentity(last);
  const lastIndex = candidates.findIndex((cand) => identityOf(cand) === lastKey);
  const lastFamily = lastIndex >= 0 ? candidates[lastIndex].family : getProviderFamily(prep.runnerConfig, last.executor);
  const tierList = tierFallbackOf(prep.policyConfig, prep.seatTier.tier);
  const sameFamily = candidates.filter((cand) => cand.family === lastFamily);
  const rest = tierList
    ? tierList.flatMap((family) => candidates.filter((cand) => cand.family === family))
    : candidates.slice(lastIndex + 1);
  const triedKeys = new Set(tried.map(bindingIdentity));
  return [...new Set([...sameFamily, ...rest])].filter((cand) => !triedKeys.has(identityOf(cand)));
}

/**
 * Pure bind function implementing the 5-level table and filter rules.
 *
 * @param {object} ask
 * @param {object} ctx
 * @param {object} [walk] where a failed seat's walk stands
 * @param {object[]} [walk.tried] the seat's earlier bindings, oldest first (empty: the first binding)
 * @param {string[]} [walk.excludePools] pools the walk must not land on (a login that just failed)
 * @returns {object} success binding or { refused: { reason, detail } }
 */
export function bind(ask, ctx, { tried = [], excludePools = [] } = {}) {
  const prep = prepare(ask, ctx, { excludePools });
  if (prep.refused) return { refused: prep.refused };
  const { unit, seat, seatPosture, blind, runnerConfig, session, executors, posture, isReadOnlyPosture, matchingOverride, requiredSkills, seatTier, policy } = prep;
  const { preferIndependentOf = null } = ask ?? {};
  const isHeadless = Boolean(session.headless);
  const isLeadPresent = !isHeadless && (session.hasNativeAgent || session.provider);

  // Soft spread: `preferIndependentOf` is [{ seat, executor }] of the seats already bound (empty
  // for the first seat of a spread; absent when the seat asks for none). It never refuses; it only
  // ranks the candidates that passed every filter, in first-binding order or, after a failure, in
  // walk order.
  const walking = tried.length > 0;
  const spreadRequested = Array.isArray(preferIndependentOf);
  const familyUse = new Map();
  for (const seat of spreadRequested ? preferIndependentOf : []) {
    if (!seat?.executor) continue;
    const family = getProviderFamily(runnerConfig, seat.executor).toLowerCase();
    familyUse.set(family, (familyUse.get(family) ?? 0) + 1);
  }

  const ordered = walking ? walkOrder(prep, tried) : prep.candidates;
  let chosen = null;
  let chosenFamilyUse = Infinity;
  let refusalReason = null;
  let refusalDetail = null;
  const skipped = [];
  for (const cand of ordered) {
    const rejection = prep.rejectionOf(cand);
    if (rejection) {
      refusalReason = rejection.reason;
      refusalDetail = rejection.detail;
      if (rejection.family) skipped.push({ family: rejection.family, executor: cand.executor, pool: cand.pool, reason: rejection.reason, detail: rejection.detail });
      continue;
    }
    // Without a soft spread the first one in order wins. With one, the family used by the fewest
    // listed seats wins (an unused family has 0), and the order breaks ties because a later
    // candidate must be strictly better to replace it.
    const use = spreadRequested ? (familyUse.get(cand.family.toLowerCase()) ?? 0) : 0;
    if (!chosen || use < chosenFamilyUse) {
      chosen = cand;
      chosenFamilyUse = use;
    }
    if (!spreadRequested || use === 0) break;
  }

  // Fallback: If no candidate chosen yet
  let inlineFallback = false;
  if (!chosen) {
    // If the seat may run inline and the session has a Lead (not headless) -> inline
    // The session lead declares no skills, so a unit that needs some never falls back to it.
    if (seatPosture.inlineAllowed && isLeadPresent && !blind && requiredSkills.length === 0) {
      inlineFallback = true;
      const leadId = session.provider ?? 'lead';
      chosen = {
        executor: leadId,
        launch: { invocation: null, transport: 'cli', transportSource: 'default-cli' },
        family: getProviderFamily(runnerConfig, leadId),
        mechanism: 'inline',
        pool: null,
        model: 'default',
        modelSource: 'no-model-needed',
        source: 'session-lead-inline',
      };
    } else {
      const reason = refusalReason || (requiredSkills.length > 0 ? 'skills-unavailable' : (isHeadless ? 'headless-no-executor' : 'no-candidate'));
      const detail = refusalDetail || (isHeadless
        ? `No candidate executor available in headless session for capability "${unit?.capability}"`
        : `No candidate executor found for seat "${seat}" and capability "${unit?.capability}"`);
      return { refused: { reason, detail } };
    }
  }

  // 5b. Account: only an override pins one (`fgos run --account pool/account`, or `account` in
  // `--override`). The pin selects the candidate of the chosen family whose pool it names; a seat
  // whose family has no entry in that pool (a checker must use another family) binds unpinned, with
  // the reason recorded, and the unit run refuses a pin no seat takes. The pin never steers the
  // executor choice.
  let pin = null;
  if (matchingOverride && matchingOverride.account !== undefined) {
    pin = parseAccountPin(matchingOverride.account);
    if (pin.refused) return pin;
    if (!inlineFallback && chosen.pool !== pin.pool) {
      const inPool = ordered.find((cand) => cand.family === chosen.family && cand.pool === pin.pool && !prep.rejectionOf(cand));
      if (inPool) chosen = inPool;
    }
  }

  const executorId = chosen.executor;
  const executorEntry = executors[executorId];
  const providerFamily = chosen.family;
  const { invocation, transport, transportSource } = chosen.launch;
  const mechanism = chosen.mechanism ?? 'out-of-process';
  const mechanismSource = inlineFallback ? 'lead-producer-inline'
    : seatPosture.forceOutOfProcess ? 'posture-forced-out-of-process'
      : 'decideExecutorDispatchMechanism';

  let account = null;
  let accountSkipped = null;
  if (pin) {
    // A seat that leases nothing (in-process, inline, tool) has no pool: the pin says why it cannot apply.
    const resolved = chosen.pool === pin.pool || chosen.pool === null
      ? resolveAccountPin(runnerConfig, { executorId, mechanism, pool: pin.pool, accountId: pin.id })
      : { refused: { reason: 'account-pin-other-pool', detail: `account "${pin.pool}/${pin.id}" cannot be pinned on executor "${executorId}": family "${providerFamily}" has no usable entry in its tier cell served by pool "${pin.pool}"` } };
    if (resolved.refused && PIN_REFUSES_SEAT.has(resolved.refused.reason)) return resolved;
    if (resolved.refused) accountSkipped = resolved.refused;
    else account = resolved;
  }

  const finalTier = seatTier.tier;
  const { persona, source: personaSource } = prep.persona;

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
    reasoningEffortSource = overrideSource(matchingOverride);
  }

  // 7c. Run timeout: an override (`fgos run --timeout`, or a `timeoutMs` key in `--override`), else
  // the unit's own `timeoutMs`; without either the dispatch uses `runner.timeoutMs`. Checked here so
  // a value out of range is a refused binding, never a run killed at once or left to hang.
  let timeoutMs = null;
  let timeoutMsSource = 'none';
  if (matchingOverride && matchingOverride.timeoutMs !== undefined) {
    try {
      timeoutMs = assertRunTimeoutMs(matchingOverride.timeoutMs, 'override timeoutMs');
    } catch (err) {
      return { refused: { reason: 'run-timeout', detail: err.message } };
    }
    timeoutMsSource = overrideSource(matchingOverride);
  } else if (unit?.timeoutMs !== undefined) {
    try {
      timeoutMs = assertRunTimeoutMs(unit.timeoutMs, 'unit.timeoutMs');
    } catch (err) {
      return { refused: { reason: 'run-timeout', detail: err.message } };
    }
    timeoutMsSource = 'unit';
  }

  // 8. Provenance
  const provenance = {
    executor: { value: executorId, source: chosen.source },
    invocation: { value: invocation, source: invocation ? chosen.source : 'none' },
    transport: { value: transport, source: transportSource },
    tier: {
      value: finalTier,
      source: seatTier.source,
      ...(policy.recommendation ? { recommendation: policy.recommendation } : {}),
      ...(policy.loweredFrom ? { loweredFrom: policy.loweredFrom } : {}),
      ...(policy.maxTier ? { maxTier: policy.maxTier } : {}),
      ...(policy.raisedBy ? { raisedBy: policy.raisedBy } : {}),
    },
    model: { value: chosen.model, source: chosen.modelSource },
    persona: { value: persona, source: personaSource },
    reasoningEffort: { value: reasoningEffort, source: reasoningEffortSource },
    timeoutMs: { value: timeoutMs, source: timeoutMsSource },
    mechanism: { value: mechanism, source: mechanismSource },
    posture: { value: posture, source: isReadOnlyPosture ? 'read-only-ask-or-writes-empty' : 'producer-writes-declared' },
  };
  if (chosen.pool) provenance.pool = { value: chosen.pool, source: chosen.modelSource };
  if (skipped.length > 0) provenance.skipped = skipped;

  // Degraded independence is recorded, never hidden: which seats this one shares a provider
  // family with, and that no eligible (governance, posture) unused family was left in the pool.
  if (spreadRequested && !inlineFallback) {
    const family = providerFamily.toLowerCase();
    const sharedWith = preferIndependentOf
      .filter((seat) => seat?.executor && getProviderFamily(runnerConfig, seat.executor).toLowerCase() === family)
      .map((peer) => peer.seat);
    provenance.familySpread = {
      value: { family: providerFamily, sharedWith: [...new Set(sharedWith)] },
      source: sharedWith.length === 0 ? 'prefer-independent-of:distinct-family' : 'prefer-independent-of:no-eligible-unused-family',
    };
  }

  if (account || accountSkipped) {
    provenance.account = {
      value: account ? `${account.pool}/${account.id}` : null,
      source: overrideSource(matchingOverride),
      ...(accountSkipped ? { skipped: accountSkipped } : {}),
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
    pool: chosen.pool ?? null,
    tier: finalTier,
    model: chosen.model,
    persona: persona ?? null,
    reasoningEffort,
    timeoutMs,
    mechanism,
    posture,
    ...(account ? { account } : {}),
    provenance,
  };
}

/**
 * Every binding a seat would visit if each one failed, in walk order, ending where bind() refuses:
 * the same walk a provider-limit failover takes, so nothing is dispatched, written or paid for.
 *
 * @param {object} ask
 * @param {object} ctx
 * @param {{excludePools?: string[]}} [options]
 * @returns {object[]} bindings, the first being what bind() returns without a walk
 */
export function walkBindings(ask, ctx, { excludePools = [] } = {}) {
  const visited = [];
  const seen = new Set();
  for (;;) {
    const next = bind(ask, ctx, { tried: visited, excludePools });
    if (next.refused || next.mechanism === 'inline' || seen.has(bindingIdentity(next))) return visited;
    seen.add(bindingIdentity(next));
    visited.push(next);
  }
}

/**
 * The candidates a seat of `ask` is chosen from, in `prefer` order and cell-entry order, each with
 * the reason it is out of the running (`out`, null when it is in). Read-only, for
 * `fgos dispatch explain`.
 */
export function listCandidates(ask, ctx) {
  const prep = prepare(ask, ctx);
  if (prep.refused) return { refused: prep.refused, candidates: [] };
  return {
    tier: prep.seatTier,
    policy: prep.policy,
    candidates: prep.candidates.map((cand) => ({
      executor: cand.executor,
      family: cand.family,
      invocation: cand.launch?.invocation ?? null,
      executorEntry: cand.executorEntry ?? null,
      pool: cand.pool,
      model: cand.model,
      out: prep.rejectionOf(cand),
    })),
  };
}

/**
 * Quota helper: walks to the next candidate after the binding that just failed, recording
 * provenance fallbackFrom (`kind: 'next-candidate'`, `walk: 'entry'` when the next candidate is
 * another model entry of the failed family, `'family'` when it is another family).
 *
 * @param {object} prevBinding the binding that just failed
 * @param {object} ask
 * @param {object} ctx
 * @param {string} [reason='provider-limit']
 * @param {object} [opts]
 * @param {object[]} [opts.tried] the seat's earlier bindings, oldest first, `prevBinding` last (what
 *   the unit record can still read; empty restarts the walk at the primary)
 * @param {string[]} [opts.excludePools] pools the walk must not land on
 * @returns {object} next binding or refusal
 */
export function nextCandidate(prevBinding, ask, ctx, reason = 'provider-limit', { tried = [prevBinding], excludePools = [] } = {}) {
  const nextResult = bind(ask, ctx, { tried, excludePools });
  if (nextResult.refused) return nextResult;

  const prevFamily = getProviderFamily(ctx.runnerConfig, prevBinding.executor);
  const nextFamily = getProviderFamily(ctx.runnerConfig, nextResult.executor);
  nextResult.provenance = {
    ...nextResult.provenance,
    fallbackFrom: {
      executor: prevBinding.executor,
      invocation: prevBinding.invocation ?? null,
      transport: prevBinding.transport ?? null,
      pool: prevBinding.pool ?? null,
      reason,
      kind: 'next-candidate',
      walk: prevFamily === nextFamily ? 'entry' : 'family',
    },
  };
  return nextResult;
}

/**
 * The same candidate again, for another account of its pool: the binding is unchanged (same
 * executor, invocation, transport, pool and model, so a later walk resumes where this one would
 * have) and only its provenance says it is a retry of `prevBinding` (`kind: 'account-rotation'`).
 * Which account the retry runs on is the lease's choice, not bind()'s.
 *
 * @param {object} prevBinding
 * @param {object} [detail] extra provenance, e.g. { accountsHealthy }
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
        pool: prevBinding.pool ?? null,
        reason,
        kind: 'account-rotation',
        ...detail,
      },
    },
  };
}
export { canApplyPosture };
