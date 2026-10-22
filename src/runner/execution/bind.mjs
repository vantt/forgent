// src/runner/execution/bind.mjs — Seat Binding for Node callers: one seat, one answer.
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/**
//
// Every decision (tier, ranking, independence, pins, effort, continuity, the walk after a failure) is the
// Rust crate's (`fgos internal seat-binding`, through seat-policy.mjs). This module collects what the
// crate must not read itself and turns its answer into the binding the runner launches:
//   - the ask: unit, seat, overrides, independence and the persona that sits the seat;
//   - launchView: per executor, what this machine can launch (family, mechanism, invocations that carry
//     the posture, the CLI each reads a login from, the effort levels its CLI renders);
//   - accountView: per pool, the accounts the config declares and the CLIs each holds a login for.
// It never ranks, filters or orders candidates.

import { decideExecutorDispatchMechanism } from '../dispatch/mechanism.mjs';
import { deriveProviderFamily } from '../dispatch/resolve.mjs';
import { checkProviderDisallowed, renderedEffortLevels } from '../dispatch/provider-adapter.mjs';
import { canApplyPosture, resolvePostureInvocation } from '../dispatch/confinement/policies.mjs';
import { MODEL_POLICY_TIERS, RunnerConfigError, assertReasoningEffort, assertRunTimeoutMs } from '../dispatch/config.mjs';
import { credentialSourceForCli, credentialStoreOf, providerAccountInventory, readAccountStates } from '../dispatch/provider-capacity.mjs';
import { parseTierCell } from '../dispatch/tier-cell.mjs';
import { legacyStateKey } from '../dispatch/llm-accounts.mjs';
import { PRODUCER_POSTURE, capabilityEntriesOf, effectiveRigorOf } from './seat-resolver.mjs';
import { seatBinding } from './seat-policy.mjs';

export const BIND_CONTRACT_VERSION = 'v1alpha1';

const identityKey = (executor, invocation, pool, model, effort) => [executor, invocation ?? '', pool ?? '', model ?? '', effort ?? ''].join('\u0000');

/** What names one candidate of a seat's walk: executor, invocation, pool, model and effort. */
export const bindingIdentity = (binding) => identityKey(binding?.executor, binding?.invocation, binding?.pool, binding?.model, binding?.reasoningEffort);

/** A binding as the crate's walk state names a candidate. */
export const identityOf = (binding) => ({
  executor: binding.executor,
  ...(binding.invocation ? { invocation: binding.invocation } : {}),
  ...(binding.pool ? { pool: binding.pool } : {}),
  ...(binding.model && binding.model !== 'default' ? { model: binding.model } : {}),
  ...(binding.reasoningEffort ? { effort: binding.reasoningEffort } : {}),
});

/** Where an override came from: its origin when it names one (a workflow's seat persona), else just "override". */
const overrideSource = (override) => (override?.origin ? `override:${override.origin}` : 'override');

/** An override that applies to this unit, seat and role (a scope-less one applies to every seat of the run). */
function findMatchingOverride(overrides, unit, seat, role) {
  if (!Array.isArray(overrides)) return null;
  return overrides.find((ov) => {
    if (!ov || typeof ov !== 'object') return false;
    const scope = ov.scope;
    if (!scope) return true;
    const unitMatch = scope.unit === undefined || scope.unit === null || scope.unit === unit?.id;
    const seatMatch = scope.seat === undefined || scope.seat === null || scope.seat === seat;
    const roleMatch = scope.role === undefined || scope.role === null || scope.role === role;
    return unitMatch && seatMatch && roleMatch;
  }) ?? null;
}

/** The provider family of an executor id: its own `providerModel`/`provider`, else inferred from its command. */
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
 * The persona that sits a seat, and where it came from: an override's, else the seat's own, the
 * unit's, the locked one, the capability's default (its exact entry, then its prefix entry).
 * `base` is the same chain without the persona an override named, which is what the tier is judged
 * against before the selection (an override persona that lifts the tier is a raise).
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
  const selected = matchingOverride?.persona ?? null;
  const chosen = matchingOverride?.persona
    ? { persona: matchingOverride.persona, source: overrideSource(matchingOverride) }
    : chain(null);
  return { ...chosen, selected, base: chain(selected).persona };
}

// ---- machine facts ------------------------------------------------------------------------------

const executorsOf = (runnerConfig) => runnerConfig.executors ?? runnerConfig.runner?.executors ?? {};

/** The command an invocation runs: its own, else the executor's, else the runner's default executor. */
const commandOf = (runnerConfig, entry, invocation) => invocation.command ?? entry.command
  ?? runnerConfig.executor?.command ?? runnerConfig.runner?.executor?.command;

/** Why governance disallows an executor, or undefined when it does not. */
function disallowedReason(runnerConfig, id, entry, family) {
  const governance = runnerConfig.governance ?? runnerConfig.runner?.governance;
  const verdict = checkProviderDisallowed(governance?.disallowedProviders, family, entry?.command ?? id);
  if (verdict.disallowed) return `provider "${verdict.canonicalProvider || family}" is disallowed`;
  if (Array.isArray(governance?.disallowedExecutors) && governance.disallowedExecutors.includes(id)) return `executor "${id}" is disallowed`;
  return undefined;
}

/**
 * What the crate may know of one executor: its family, mechanism and skills, the invocations that can
 * carry the posture (with the CLI each reads a login from and the effort levels it renders), and the
 * invocation the transport takes when nothing pins one: the herdr-spawn invocation when this session runs
 * inside herdr and it can carry the posture, else the first plain one that can.
 */
function executorFacts(id, entry, { runnerConfig, executors, session }) {
  const family = getProviderFamily(runnerConfig, id);
  const mechanism = decideExecutorDispatchMechanism(runnerConfig, id, { hasLiveTaskAccess: Boolean(session.hasNativeAgent) });
  const supported = Array.isArray(entry.supports?.reasoningEffort) ? entry.supports.reasoningEffort : null;
  const herdrPresent = session.herdrPresent === true;
  const ctx = { runnerConfig, executors, herdrPresent };
  // A caller that binds only to learn who, which model and what tier (not to launch this binding) leaves
  // the posture to the launch: the confinement authority judges it when the assignment starts.
  const atLaunch = session.postureAtLaunch === true;
  const invocations = (entry.invocations ?? []).filter((inv) => typeof inv?.id === 'string' && inv.id).map((inv) => {
    const store = credentialStoreOf({ ...inv, command: commandOf(runnerConfig, entry, inv) });
    const efforts = renderedEffortLevels(commandOf(runnerConfig, entry, inv));
    return {
      id: inv.id,
      ...(store?.use ? { cli: store.use } : {}),
      efforts: supported ? efforts.filter((level) => supported.includes(level)) : efforts,
      carriesPosture: atLaunch || canApplyPosture({ executor: id, invocation: inv.id }, 'read-only', ctx),
    };
  });
  let defaultInvocation;
  let approved = resolvePostureInvocation({ executor: id, invocation: null }, 'read-only', ctx);
  if (!approved.ok && atLaunch) approved = { ok: true, invocation: invocations[0]?.id ?? null };
  if (approved.ok && approved.invocation) {
    defaultInvocation = approved.invocation;
    const herdr = (entry.invocations ?? []).find((inv) => inv?.via === 'cli' && inv?.adapter === 'herdr-spawn' && typeof inv.id === 'string' && inv.id);
    if (herdrPresent && invocations.find((inv) => inv.id === herdr?.id)?.carriesPosture) defaultInvocation = herdr.id;
  }
  // An executor that declares no invocation runs its own command: for a caller that does not launch this
  // binding, that command is the one invocation whose effort levels are judged.
  if (atLaunch && invocations.length === 0) {
    invocations.push({ id: 'command', efforts: renderedEffortLevels(commandOf(runnerConfig, entry, {})), carriesPosture: true });
    defaultInvocation = 'command';
  }
  const disallowed = disallowedReason(runnerConfig, id, entry, family);
  return {
    kind: entry.kind === 'tool' ? 'tool' : 'agent',
    family,
    mechanism: mechanism === 'out-of-process' ? 'out-of-process' : 'in-process',
    ...(disallowed ? { disallowed } : {}),
    skills: Array.isArray(entry.supports?.skills) ? entry.supports.skills : [],
    invocations,
    ...(defaultInvocation ? { defaultInvocation } : {}),
    ...(approved.ok && !approved.invocation ? { unnamedCarries: true } : {}),
  };
}

/** Every executor of the config, as the crate reads them. */
function launchViewOf(runnerConfig, session) {
  const executors = executorsOf(runnerConfig);
  return {
    executors: Object.fromEntries(Object.entries(executors)
      .filter(([, entry]) => entry && typeof entry === 'object')
      .map(([id, entry]) => [id, executorFacts(id, entry, { runnerConfig, executors, session })])),
  };
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
 * The pools a seat may be served by and the accounts each declares: a pool is named by a cell entry or is
 * the family itself. An account lists the CLIs it holds a login store for (never where it is kept).
 * With `accounts` ({ runtimeDir, assignmentId }) the view also carries what the lease state says, read here
 * and not under the lock: the account this assignment already holds, until when an account is quarantined,
 * and whether a quarantined login may be lifted by one real call (offered, unprobed, only when no account of
 * the pool is healthy). Without it the view is the config alone, which is what a replay and a read-only
 * explanation rank from.
 */
function accountViewOf(runnerConfig, launchView, accounts = null, now = Date.now()) {
  const inventory = readInventory(runnerConfig);
  const clis = [...new Set(Object.values(launchView.executors).flatMap((facts) => facts.invocations.map((inv) => inv.cli).filter(Boolean)))];
  const pools = new Set(Object.values(launchView.executors).map((facts) => facts.family));
  const policies = runnerConfig.modelPolicies ?? runnerConfig.runner?.modelPolicies ?? {};
  for (const [family, tiers] of Object.entries(policies)) {
    for (const cell of Object.values(tiers ?? {})) {
      try {
        for (const entry of parseTierCell(cell, family)) pools.add(entry.pool);
      } catch { /* a malformed cell is the config validator's to report */ }
    }
  }
  const poolOf = (pool) => {
    const states = accounts ? readAccountStates({ provider: legacyStateKey(pool), assignmentId: accounts.assignmentId, runtimeDir: accounts.runtimeDir, now }) : {};
    const declared = Object.entries(inventory[legacyStateKey(pool)]?.accounts ?? {});
    const out = (state) => state?.quarantinedUntil != null && state.quarantinedUntil > now;
    const healthy = declared.some(([id, account]) => account.disabled !== true && !out(states[id]));
    return declared.map(([id, account]) => {
      const state = states[id];
      const liftable = out(state) && state.probeable && !healthy;
      return {
        id,
        clis: clis.filter((cli) => credentialSourceForCli(account, cli)),
        ...(account.disabled === true ? { disabled: true } : {}),
        ...(state?.sticky ? { sticky: true } : {}),
        ...(out(state) && !liftable ? { quarantinedUntil: state.quarantinedUntil } : {}),
        ...(out(state) && state.probeFailed ? { probe: 'failed' } : {}),
      };
    });
  };
  return { pools: Object.fromEntries([...pools].map((pool) => [pool, poolOf(pool)])) };
}

// ---- the ask ------------------------------------------------------------------------------------

/** The unit's own `prefer` (`fgos run --provider`) in the shape the crate reads. */
const unitPreferOf = (prefer) => (Array.isArray(prefer) ? prefer.map((entry) => (typeof entry === 'string' ? entry : { executor: entry.executor, ...(entry.invocation ? { invocation: entry.invocation } : {}) })) : []);

/** The crate's override from the override that matched: an override with no scope is run-wide. */
function crateOverrideOf(override) {
  if (!override) return undefined;
  const out = {};
  if (override.tier !== undefined) out.tier = override.tier;
  if (override.executor) out.executor = override.executor;
  if (override.invocation) out.invocation = override.invocation;
  if (override.reasoningEffort !== undefined) out.effort = override.reasoningEffort;
  if (override.account !== undefined) out.account = typeof override.account === 'string' ? override.account : String(override.account);
  if (override.acceptDependence === true) out.acceptDependence = true;
  if (!override.scope && override.executor) out.runWide = true;
  return Object.keys(out).length > 0 ? out : undefined;
}

/** The session lead that may run a seat inline: a lead is in the session and the seat's posture allows it. */
function inlineLeadOf(seatPosture, session, runnerConfig) {
  if (!seatPosture.inlineAllowed || session.headless || !(session.hasNativeAgent || session.provider)) return undefined;
  const executor = session.provider ?? 'lead';
  return { executor, family: getProviderFamily(runnerConfig, executor) };
}

/**
 * Everything the crate is asked for one seat. Throws RunnerConfigError for an override no seat could take
 * (an unknown tier or effort name); returns `{ refused }` for a persona conflict.
 */
function requestOf(ask, ctx, walk) {
  const {
    unit,
    seat = 'producer',
    role = 'producer',
    posture: seatPosture = PRODUCER_POSTURE,
    readOnly = false,
    independentOf = [],
    preferIndependentOf = null,
    overrides = [],
    blind = false,
  } = ask ?? {};
  const { runnerConfig = {}, session = {} } = ctx ?? {};
  const executors = executorsOf(runnerConfig);

  const isWriteEmpty = !Array.isArray(unit?.writes) || unit.writes.length === 0;
  const isReadOnlyPosture = readOnly === true || seatPosture.readOnly === true || isWriteEmpty;
  const posture = isReadOnlyPosture ? 'read-only' : (seatPosture.writer ? 'workspace-write' : 'read-only');
  const matchingOverride = findMatchingOverride(overrides, unit, seat, role);
  const overrideTier = matchingOverride?.tier;
  if (overrideTier !== undefined && !MODEL_POLICY_TIERS.includes(overrideTier)) {
    throw new RunnerConfigError(`invalid tier "${overrideTier}". Valid tiers: [${MODEL_POLICY_TIERS.join(', ')}]`);
  }
  if (matchingOverride?.reasoningEffort !== undefined) {
    try {
      assertReasoningEffort(matchingOverride.reasoningEffort);
    } catch (err) {
      return { refused: { reason: 'reasoning-effort', detail: err.message } };
    }
  }

  const persona = resolvePersona({ ask, unit, matchingOverride, capEntries: capabilityEntriesOf(runnerConfig, unit?.capability) });
  if (persona.refused) return { refused: persona.refused };

  const selectors = persona.selected ? { persona: persona.selected } : {};
  // Only roles that do the unit's work are asked for its skills; a checker or panel seat reads the result.
  const requiredSkills = !seatPosture.forceOutOfProcess && Array.isArray(unit?.skills) ? unit.skills : [];
  // A hard `independentOf` names executors (or seats not bound yet): the crate compares provider families.
  const hard = [...new Set(independentOf.map((dep) => (executors[dep] ? getProviderFamily(runnerConfig, dep) : dep)))];
  // A soft preference names the seats already bound, each at the executor it holds now.
  const peers = [];
  for (const [index, peer] of (Array.isArray(preferIndependentOf) ? preferIndependentOf : []).entries()) {
    if (!peer?.executor) continue;
    const entry = { seat: peer.seat ?? `${peer.executor}#${index}`, executor: peer.executor, family: getProviderFamily(runnerConfig, peer.executor) };
    const at = peers.findIndex((known) => known.seat === entry.seat);
    if (at >= 0) peers[at] = entry; else peers.push(entry);
  }
  const inlineLead = inlineLeadOf(seatPosture, session, runnerConfig);
  const crateAsk = {
    capability: unit?.capability,
    seat,
    role,
    ...(persona.base ? { persona: persona.base } : {}),
    label: unit?.id ?? null,
    ...(ask?.workflowTier ? { workflow: ask.workflowTier } : {}),
    selectors,
    raiseAuthorized: ask?.raiseAuthorized === true,
    ...(crateOverrideOf(matchingOverride) ? { override: crateOverrideOf(matchingOverride) } : {}),
    posture: { readOnly: seatPosture.readOnly === true, forceOutOfProcess: seatPosture.forceOutOfProcess === true, blind: blind === true },
    effectiveRigor: effectiveRigorOf(unit, runnerConfig, { fallback: 'standard' }),
    independence: { hard, hardCheckers: [], soft: peers.map((peer) => peer.seat) },
    requiredSkills,
    unitPrefer: unitPreferOf(unit?.prefer),
    ...(inlineLead ? { inlineLead } : {}),
  };
  const launchView = launchViewOf(runnerConfig, session);
  return {
    persona, matchingOverride, posture, isReadOnlyPosture, launchView,
    request: {
      ask: crateAsk,
      runnerConfig,
      peers,
      walk: walkOf(walk),
      accountView: accountViewOf(runnerConfig, launchView, ctx?.accounts),
      launchView,
    },
  };
}

/** The crate's walk state from the runner's: earlier bindings, pools to avoid, the identity a seat keeps. */
function walkOf({ tried = [], excludePools = [], failedAccounts = [], continuity = null } = {}) {
  return {
    tried: tried.map(identityOf),
    excludePools: [...excludePools],
    failedAccounts,
    ...(continuity ? { continuity: identityOf(continuity) } : {}),
  };
}

// ---- the binding --------------------------------------------------------------------------------

/** A refusal in the runner's shape; the headless wording is the session's fact, not the crate's. */
function refusalOf(refusal, { session, unit }) {
  const nothingConfigured = refusal.reason === 'no-candidate' && (refusal.configured ?? 0) === 0;
  if (nothingConfigured && session.headless) {
    return { reason: 'headless-no-executor', detail: `No candidate executor available in headless session for capability "${unit?.capability}"` };
  }
  return {
    reason: refusal.reason,
    detail: refusal.detail,
    ...(refusal.config ? { config: refusal.config } : {}),
    ...(refusal.peers?.length ? { peers: refusal.peers } : {}),
    ...(refusal.rendered?.length ? { rendered: refusal.rendered } : {}),
  };
}

/** How the transport got to the invocation that runs. */
function transportOf({ cand, executorEntry, session, launchFacts }) {
  const invocation = executorEntry?.invocations?.find((inv) => inv?.id === cand.invocation);
  const transport = invocation?.adapter === 'herdr-spawn' ? 'herdr' : 'cli';
  if (cand.pinned) {
    const source = cand.source === 'override' ? 'override-pinned-invocation'
      : cand.source === 'unit-prefer' ? 'unit-prefer-pinned-invocation' : 'prefer-pinned-invocation';
    return { transport, transportSource: source };
  }
  if (transport === 'herdr') return { transport, transportSource: 'herdr-invocation-present' };
  const herdr = launchFacts?.invocations.find((inv) => (executorEntry?.invocations ?? []).some((raw) => raw?.id === inv.id && raw.adapter === 'herdr-spawn'));
  if (session.herdrPresent === true && herdr && !herdr.carriesPosture) return { transport, transportSource: 'cli:herdr-invocation-cannot-apply-posture' };
  return { transport, transportSource: 'default-cli' };
}

/** The run timeout an override or the unit asks for, checked here so an out-of-range value is a refused binding. */
function timeoutOf(matchingOverride, unit) {
  if (matchingOverride && matchingOverride.timeoutMs !== undefined) {
    return { timeoutMs: assertRunTimeoutMs(matchingOverride.timeoutMs, 'override timeoutMs'), timeoutMsSource: overrideSource(matchingOverride) };
  }
  if (unit?.timeoutMs !== undefined) return { timeoutMs: assertRunTimeoutMs(unit.timeoutMs, 'unit.timeoutMs'), timeoutMsSource: 'unit' };
  return { timeoutMs: null, timeoutMsSource: 'none' };
}

/** What the walk step records about the candidate it left: another entry or family, or another account of the same candidate. */
function fallbackFrom(previous, binding, { reason, rotation, detail, runnerConfig }) {
  const base = { executor: previous.executor, invocation: previous.invocation ?? null, transport: previous.transport ?? null, pool: previous.pool ?? null, reason };
  if (rotation) return { ...base, kind: 'account-rotation', ...detail };
  if (reason === 'lease-conflict') return { ...base, kind: 'lease-conflict' };
  const sameFamily = getProviderFamily(runnerConfig, previous.executor) === getProviderFamily(runnerConfig, binding.executor);
  return { ...base, kind: 'next-candidate', walk: sameFamily ? 'entry' : 'family' };
}

function bindingOf({ out, prep, ask, ctx, walk }) {
  const { unit, seat = 'producer', posture: seatPosture = PRODUCER_POSTURE } = ask ?? {};
  const { runnerConfig = {}, session = {} } = ctx ?? {};
  const { persona: personaChoice, matchingOverride, posture, isReadOnlyPosture, launchView } = prep;
  const executors = executorsOf(runnerConfig);
  const { policy, ranked } = out;
  // Stage 1 refused (a tier no cell serves, a raise no door may make): there is nothing to rank.
  if (!ranked) return { refused: refusalOf(out.refusal, { session, unit }) };

  const cand = ranked.candidates[0];
  if (!cand) return { refused: refusalOf(out.refusal ?? { reason: 'no-candidate', detail: 'no candidate' }, { session, unit }) };
  // The crate seats the session lead inline when the seat has no candidate configured; nothing launches then.
  const inlineFallback = cand.mechanism === 'inline';

  let timeout;
  try {
    timeout = timeoutOf(matchingOverride, unit);
  } catch (err) {
    return { refused: { reason: 'run-timeout', detail: err.message } };
  }

  const executorEntry = executors[cand.executor];
  const mechanism = cand.mechanism;
  const { transport, transportSource } = inlineFallback
    ? { transport: 'cli', transportSource: 'default-cli' }
    : transportOf({ cand, executorEntry, session, launchFacts: launchView.executors[cand.executor] });
  const model = cand.model ?? 'default';
  const reasoningEffort = cand.effort ?? null;
  const mechanismSource = inlineFallback ? 'lead-producer-inline'
    : seatPosture.forceOutOfProcess ? 'posture-forced-out-of-process'
      : 'decideExecutorDispatchMechanism';

  // An override pins an account (`fgos run --account pool/account`) only on a seat whose chosen entry is
  // served by that pool; any other seat runs unpinned and says why.
  const pinText = matchingOverride?.account;
  const pinSkip = pinText === undefined ? null : ranked.skipped.find((skip) => skip.reason === 'account-pin-other-pool') ?? null;
  const account = pinText !== undefined && !pinSkip && cand.pool && cand.account ? { pool: cand.pool, id: cand.account } : null;

  const provenance = {
    executor: { value: cand.executor, source: cand.source },
    invocation: { value: cand.invocation ?? null, source: cand.invocation ? cand.source : 'none' },
    transport: { value: transport, source: transportSource },
    tier: {
      value: policy.tier,
      source: policy.tierSource,
      ...(policy.recommendation ? { recommendation: policy.recommendation } : {}),
      ...(policy.loweredFrom ? { loweredFrom: policy.loweredFrom } : {}),
      ...(policy.maxTier ? { maxTier: policy.maxTier } : {}),
      ...(policy.raisedBy ? { raisedBy: policy.raisedBy } : {}),
    },
    model: { value: model, source: cand.modelSource },
    persona: { value: personaChoice.persona, source: personaChoice.source },
    reasoningEffort: { value: reasoningEffort, source: cand.effortSource === 'override' ? overrideSource(matchingOverride) : cand.effortSource },
    timeoutMs: { value: timeout.timeoutMs, source: timeout.timeoutMsSource },
    mechanism: { value: mechanism, source: mechanismSource },
    posture: { value: posture, source: isReadOnlyPosture ? 'read-only-ask-or-writes-empty' : 'producer-writes-declared' },
  };
  if (cand.pool) provenance.pool = { value: cand.pool, source: cand.modelSource };
  if (ranked.skipped.length > 0) provenance.skipped = ranked.skipped;
  // Degraded independence is recorded, never hidden: which seats this one shares a provider family with.
  if (Array.isArray(ask?.preferIndependentOf) && !inlineFallback) {
    provenance.familySpread = {
      value: { family: cand.family, sharedWith: [...new Set(ranked.sharedWith)] },
      source: ranked.sharedWith.length === 0 ? 'prefer-independent-of:distinct-family' : 'prefer-independent-of:no-eligible-unused-family',
    };
  }
  if (pinText !== undefined) {
    provenance.account = {
      value: account ? `${account.pool}/${account.id}` : null,
      source: overrideSource(matchingOverride),
      ...(pinSkip ? { skipped: { reason: pinSkip.reason, detail: pinSkip.detail } } : {}),
    };
  }
  if (matchingOverride?.origin) provenance.overridesOrigin = { value: matchingOverride.origin, source: 'override' };

  // What was decided from, without the config body and without account facts: what a replay needs to
  // recompute the answer and an audit needs to see what the seat was asked.
  const { now, ...bindingInput } = out.bindingInput;
  const binding = {
    contractVersion: BIND_CONTRACT_VERSION,
    executor: cand.executor,
    invocation: cand.invocation ?? null,
    transport,
    pool: cand.pool ?? null,
    tier: policy.tier,
    model,
    persona: personaChoice.persona ?? null,
    reasoningEffort,
    timeoutMs: timeout.timeoutMs,
    mechanism,
    posture,
    // The account the lease takes: named here, taken under the lock, re-ranked (a new bind) when it cannot be.
    ...(cand.pool && cand.account ? { leaseAccount: cand.account } : {}),
    ...(account ? { account } : {}),
    provenance,
    ...(inlineFallback ? {} : { bindingInput: { ...bindingInput, hostVersion: out.hostVersion } }),
  };
  const from = walk?.from ?? walk?.tried?.at(-1);
  if (from && !inlineFallback) {
    binding.provenance.fallbackFrom = fallbackFrom(from, binding, { reason: walk.reason ?? 'provider-limit', rotation: walk.rotation === true, detail: walk.detail, runnerConfig });
  }
  return binding;
}

/**
 * Both stages for one seat through the crate: one exec. Returns the crate's answer and the facts the
 * binding is built from, or `{ refused }` for a refusal Node owns (a persona conflict, an effort name no
 * seat could take).
 */
function decide(ask, ctx, walk) {
  const prep = requestOf(ask, ctx, walk);
  if (prep.refused) return { refused: prep.refused };
  return { prep, out: seatBinding(prep.request) };
}

/**
 * The binding of one seat, or `{ refused: { reason, detail } }`.
 *
 * @param {object} ask unit, seat, role, posture, persona, overrides, independentOf (executors or seats the
 *   seat must differ from), preferIndependentOf ([{ seat, executor }] it should differ from), blind,
 *   workflowTier, raiseAuthorized
 * @param {object} ctx { runnerConfig, session }
 *   Execution admission belongs to the calling door, not seat choice or replay.
 * @param {object} [options]
 * @param {object} [options.walk] where the seat stands after a failure
 * @param {object[]} [options.walk.tried] the seat's earlier bindings, oldest first (empty: the first binding)
 * @param {string[]} [options.walk.excludePools] pools the walk must not land on (a login that just failed)
 * @param {object} [options.walk.continuity] a binding the seat keeps (a later round, or another account of
 *   the same candidate): executor, model and effort stay, else `seat-continuity-unavailable`
 * @param {object} [options.walk.from] the binding the seat is leaving (default: the last of `tried`); a bind
 *   that has one records `fallbackFrom` in its provenance
 * @param {boolean} [options.walk.rotation] the bind retries the kept candidate on another account (not a step)
 * @param {object} [options.walk.detail] extra provenance of a rotation, e.g. `{ accountsHealthy }`
 * @param {string} [options.walk.reason] why the walk moved (default `provider-limit`)
 */
export function bind(ask, ctx, { walk = {} } = {}) {
  const decided = decide(ask, ctx, walk);
  if (decided.refused) return { refused: decided.refused };
  return bindingOf({ out: decided.out, prep: decided.prep, ask, ctx, walk });
}

/**
 * The seat a Work operation or a raw dispatch runs, by the same crate call a unit run makes (one headless
 * producer seat; the posture is judged when the assignment launches, not here, so the ask names no writes). A pinned executor, a tier or an effort the caller stated come in as one override. A
 * refusal throws, named; there is no policy of its own behind it.
 *
 * @param {object} args `{ runnerConfig, unit, role, readOnly, overrides }`; `unit` is `{ id, capability, rigor }`
 */
export function bindWorkSeat({ runnerConfig, unit, role = 'producer', readOnly = false, overrides = [] }) {
  const bound = bind(
    { unit: { ...unit, writes: [] }, seat: 'producer', role, readOnly, overrides, raiseAuthorized: false },
    { runnerConfig, session: { headless: true, postureAtLaunch: true } },
  );
  if (bound.refused) throw new RunnerConfigError(`${bound.refused.reason}: ${bound.refused.detail}`, { code: bound.refused.reason });
  return bound;
}

/**
 * Why a seat lands where it does, read-only: the same crate call as `bind` (nothing is leased, spawned or
 * written), its ranked candidates and skip reasons, its explanation text, and the walk a failure would
 * take, one binding per step.
 *
 * @returns {{ binding: object, policy?: object, ranked?: object, explain?: {lines: string[]}, launchView?: object, walk: object[] }}
 */
export function explainSeat(ask, ctx, { walk = {} } = {}) {
  const decided = decide(ask, ctx, walk);
  if (decided.refused) return { binding: { refused: decided.refused }, walk: [] };
  const { out, prep } = decided;
  const binding = bindingOf({ out, prep, ask, ctx, walk });
  const chain = [];
  if (!binding.refused && binding.mechanism !== 'inline') {
    const seen = new Set();
    let current = binding;
    while (current && !current.refused && current.mechanism !== 'inline' && !seen.has(bindingIdentity(current))) {
      seen.add(bindingIdentity(current));
      chain.push(current);
      current = bind(ask, ctx, { walk: { ...walk, tried: [...(walk.tried ?? []), ...chain] } });
    }
  }
  return { binding, policy: out.policy, ranked: out.ranked, explain: out.explain, launchView: prep.launchView, walk: chain };
}

export { canApplyPosture };
