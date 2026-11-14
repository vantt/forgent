// src/runner/execution/bind.mjs — Seat Binding for Node callers: one seat, one answer.
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/**
// Every decision (tier, ranking, independence, pins, effort, continuity, the walk) is the Rust crate's
// (through seat-policy.mjs). This module only collects what the crate must not read itself (the ask, the
// launch view, the account view) and turns its answer into the binding; it never ranks or filters.

import path from 'node:path';

import { decideExecutorDispatchMechanism } from '../dispatch/mechanism.mjs';
import { checkProviderDisallowed, familyOf, renderedEffortLevels } from '../dispatch/provider-adapter.mjs';
import { canApplyPosture, resolvePostureInvocation } from '../dispatch/confinement/policies.mjs';
import { MODEL_POLICY_TIERS, assertReasoningEffort, assertRunTimeoutMs } from '../dispatch/config.mjs';
import { RunnerConfigError } from '../dispatch/runner-config-error.mjs';
import { isCommandAvailable } from '../paths.mjs';
import { credentialSourceForCli, credentialStoreOf, providerAccountInventory, readAccountStates } from '../dispatch/provider-capacity.mjs';
import { parseTierCell } from '../dispatch/tier-cell.mjs';
import { legacyStateKey } from '../dispatch/llm-accounts.mjs';
import { PRODUCER_POSTURE, effectiveRigorOf, workflowTierOf } from './seat-resolver.mjs';
import { capabilityPersonaOf } from './capability-config.mjs';
import { seatBinding } from './seat-policy.mjs';

export const BIND_CONTRACT_VERSION = 'v1alpha1';

const identityKey = (executor, invocation, pool, model, effort) => [executor, invocation ?? '', pool ?? '', model ?? '', effort ?? ''].join('\u0000');

/** What names one candidate of a seat's walk: executor, invocation, pool, model and effort. */
export const bindingIdentity = (binding) => identityKey(binding?.executor, binding?.invocation, binding?.pool, binding?.model, binding?.reasoningEffort);

/** A binding as the crate's walk state names a candidate. */
const identityOf = (binding) => ({
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
  const fits = (want, have) => want === undefined || want === null || want === have;
  if (!Array.isArray(overrides)) return null;
  return overrides.find((ov) => ov && typeof ov === 'object'
    && (!ov.scope || (fits(ov.scope.unit, unit?.id) && fits(ov.scope.seat, seat) && fits(ov.scope.role, role)))) ?? null;
}

/** The provider family of an executor id: its own `providerModel`/`provider`, else inferred from its command. */
function executorFamily(runnerConfig, executorId) {
  const entry = executorsOf(runnerConfig ?? {})[executorId];
  const cli = entry?.invocations?.find((inv) => inv?.via === 'cli');
  const ownCommand = cli?.command || cli?.adapter || entry?.command || entry?.adapter;
  return familyOf(entry, cli?.command ?? entry?.command ?? (ownCommand ? undefined : runnerCommandOf(runnerConfig ?? {})));
}

/**
 * The persona that sits a seat, and where it came from: an override's, else the seat's own, the
 * unit's, the locked one, the capability's default (its exact entry, then its prefix entry).
 * `base` is the same chain without the persona an override named, which is what the tier is judged
 * against before the selection (an override persona that lifts the tier is a raise).
 */
function resolvePersona({ ask, unit, matchingOverride, capPersona }) {
  const { persona: seatPersona = null, lockedPersona = null } = ask ?? {};
  const unitPersona = typeof unit?.persona === 'string' && unit.persona ? unit.persona : null;
  if (lockedPersona && unitPersona && unitPersona !== lockedPersona) {
    return { refused: { reason: 'locked-persona', detail: `Unit persona "${unitPersona}" conflicts with locked persona "${lockedPersona}"` } };
  }
  if (matchingOverride?.persona && lockedPersona && matchingOverride.persona !== lockedPersona) {
    return { refused: { reason: 'locked-persona', detail: `Cannot override locked persona "${lockedPersona}" with "${matchingOverride.persona}"` } };
  }
  const chain = (skip) => {
    if (seatPersona) return { persona: seatPersona, source: 'seat' };
    if (unitPersona && unitPersona !== skip) return { persona: unitPersona, source: 'unit' };
    if (lockedPersona) return { persona: lockedPersona, source: 'locked-persona' };
    if (capPersona) return { persona: capPersona.persona, source: `capability:${capPersona.key}` };
    return { persona: null, source: 'none' };
  };
  const selected = matchingOverride?.persona ?? null;
  const chosen = selected ? { persona: selected, source: overrideSource(matchingOverride) } : chain(null);
  return { ...chosen, selected, base: chain(selected).persona };
}

// ---- machine facts ------------------------------------------------------------------------------
const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const executorsOf = (runnerConfig) => runnerConfig.executors ?? runnerConfig.runner?.executors ?? {};
const runnerCommandOf = (runnerConfig) => runnerConfig.executor?.command ?? runnerConfig.runner?.executor?.command;

/** The command an invocation runs: its own, else the executor's, else the runner's default executor. */
const commandOf = (runnerConfig, entry, invocation) => invocation.command ?? entry.command ?? runnerCommandOf(runnerConfig);

/**
 * The programs an executor starts, as bare names, when none of them is installed here; null when one is, or
 * when the executor starts no program of its own (an agent the caller runs inside its own session, a tool).
 */
function missingClisOf(runnerConfig, id, entry, session) {
  if (entry.kind === 'tool') return null;
  if (decideExecutorDispatchMechanism(runnerConfig, id, { hasLiveTaskAccess: Boolean(session.hasNativeAgent) }) !== 'out-of-process') return null;
  const invocations = Array.isArray(entry.invocations) && entry.invocations.length > 0 ? entry.invocations : [{}];
  const commands = [...new Set(invocations.map((inv) => commandOf(runnerConfig, entry, inv)).filter((command) => typeof command === 'string' && command !== ''))];
  if (commands.length === 0 || commands.some((command) => isCommandAvailable(command, session.pathEnv ?? process.env.PATH))) return null;
  return [...new Set(commands.map((command) => path.basename(command)))];
}

/** The agent CLIs the configured executors run that are not installed here, by bare name, sorted. */
function absentClisOf(runnerConfig, session) {
  const names = Object.entries(executorsOf(runnerConfig))
    .filter(([, entry]) => entry && typeof entry === 'object' && entry.kind !== 'tool')
    .flatMap(([id, entry]) => missingClisOf(runnerConfig, id, entry, session) ?? []);
  return [...new Set(names)].sort();
}

/**
 * The refusal for a machine on which no agent executor can start, or null when one can: every agent executor
 * of the config runs programs and none of them is installed. It names the programs that were looked for and
 * what to do, so a first run on a machine with no agent CLI reads as that, not as a routing failure.
 */
export function agentCliMissingRefusal(runnerConfig, session = {}) {
  const missing = Object.entries(executorsOf(runnerConfig))
    .filter(([, entry]) => entry && typeof entry === 'object' && entry.kind !== 'tool')
    .map(([id, entry]) => missingClisOf(runnerConfig, id, entry, session));
  if (missing.length === 0 || missing.includes(null)) return null;
  const clis = [...new Set(missing.flat())].sort();
  return {
    reason: 'agent-cli-missing',
    detail: `no agent CLI is installed on this machine (looked for ${clis.join(', ')} on PATH)`,
    fix: `install one of ${clis.join(', ')}, then run "fgos doctor" to check it`,
  };
}

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
  const family = executorFamily(runnerConfig, id);
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
  const missingCli = missingClisOf(runnerConfig, id, entry, session)?.join(' or ');
  return {
    kind: entry.kind === 'tool' ? 'tool' : 'agent',
    family,
    mechanism: mechanism === 'out-of-process' ? 'out-of-process' : 'in-process',
    ...(disallowed ? { disallowed } : {}),
    ...(missingCli ? { missingCli } : {}),
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

/**
 * The pools a seat may be served by (named by a cell entry, or the family itself) and the accounts each
 * declares, each with the CLIs it holds a login store for (never where it is kept); an unreadable inventory
 * is no accounts. With `accounts` ({ runtimeDir, assignmentId }) the view adds the lease state, read here and
 * not under the lock: the account held, quarantines, and a quarantined login liftable by one real call (only
 * when no account of the pool is healthy). Without it the view is the config alone, as replay and explain read.
 */
function accountViewOf(runnerConfig, launchView, accounts = null, now = Date.now()) {
  let inventory;
  try {
    inventory = providerAccountInventory(runnerConfig) ?? {};
  } catch {
    inventory = {};
  }
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

/**
 * When the account Seat Binding's view holds quarantined now ends (epoch milliseconds, the largest safe
 * integer when only a person clears it), or null when the view offers it: the judgement the crate ranks by,
 * so a pinned account is refused for the reason a ranked one is passed over. The lease re-checks it under
 * its lock at the time of use.
 */
export function accountQuarantineOf(runnerConfig, { pool, id }, { runtimeDir, now = Date.now() } = {}) {
  const view = accountViewOf(runnerConfig, launchViewOf(runnerConfig, {}), { runtimeDir }, now);
  return view.pools[pool]?.find((account) => account.id === id)?.quarantinedUntil ?? null;
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

/** A `modelPolicies` or `tierFallback` section keyed by the family name, whatever spelling it was written in; null when it already is. */
function familyKeyedSection(section, listsFamilies) {
  const misspelt = (key) => typeof key === 'string' && familyOf(key) !== key;
  const named = (value) => (typeof value === 'string' ? familyOf(value) : value);
  if (listsFamilies ? !Object.values(section).flat().some(misspelt) : !Object.keys(section).some(misspelt)) return null;
  if (listsFamilies) return Object.fromEntries(Object.entries(section).map(([tier, families]) => [tier, [...new Set([families].flat().map(named))]]));
  // A cell written under the family's own name wins over one written under another spelling of it.
  const keyed = {};
  for (const [key, cells] of Object.entries(section)) {
    const family = named(key);
    if (key === family || keyed[family] === undefined) keyed[family] = cells;
  }
  return keyed;
}

/**
 * The runner config with its family-keyed sections (`modelPolicies` cells, `tierFallback` lists) keyed by the
 * name `familyOf` gives each family, so a cell written under `codex` is found for an executor of family `openai`.
 * Returns the config itself when every key already is that name.
 */
function familyKeyed(runnerConfig) {
  const apply = (section) => {
    const policies = isPlainObject(section.modelPolicies) ? familyKeyedSection(section.modelPolicies, false) : null;
    const fallback = isPlainObject(section.tierFallback) ? familyKeyedSection(section.tierFallback, true) : null;
    return policies || fallback ? { ...section, ...(policies ? { modelPolicies: policies } : {}), ...(fallback ? { tierFallback: fallback } : {}) } : null;
  };
  const top = apply(runnerConfig);
  const nested = isPlainObject(runnerConfig.runner) ? apply(runnerConfig.runner) : null;
  if (!top && !nested) return runnerConfig;
  return { ...(top ?? runnerConfig), ...(nested ? { runner: nested } : {}) };
}

/**
 * The ask of one seat, built alike by the run and the dry bind from what the pattern hands its seat runner.
 * Independence and spread are read from the seat ledger now, so they see exactly the seats bound before this
 * one; independence is symmetric (a seat bound earlier that must differ from this one holds it to that too).
 */
export function askFor({ seat, unit, independentOf = [], preferIndependentOf = [] }, ledger, { overrides = [], workflowId, raiseAuthorized, blind } = {}) {
  const workflowTier = workflowTierOf(seat, unit, workflowId);
  return {
    unit,
    seat: seat.seat,
    role: seat.role,
    posture: seat.posture,
    ...(seat.persona ? { persona: seat.persona } : {}),
    ...(workflowTier ? { workflowTier } : {}),
    raiseAuthorized: raiseAuthorized === true,
    readOnly: seat.posture.readOnly,
    independentOf: [...ledger.resolve(independentOf), ...ledger.dependentExecutors(seat.seat)],
    ...(preferIndependentOf.length > 0 ? { preferIndependentOf: ledger.seats(preferIndependentOf) } : {}),
    overrides,
    ...(blind ? { blind: true } : {}),
  };
}

/**
 * Everything the crate is asked for one seat. Throws RunnerConfigError for an override no seat could take
 * (an unknown tier or effort name); returns `{ refused }` for a persona conflict.
 */
function requestOf(ask, ctx, walk) {
  const { unit, seat = 'producer', role = 'producer', posture: seatPosture = PRODUCER_POSTURE, readOnly = false } = ask ?? {};
  const { independentOf = [], preferIndependentOf = null, overrides = [], blind = false } = ask ?? {};
  const { runnerConfig: configAsWritten = {}, session = {} } = ctx ?? {};
  const runnerConfig = familyKeyed(configAsWritten);
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
  const persona = resolvePersona({ ask, unit, matchingOverride, capPersona: capabilityPersonaOf(runnerConfig, unit?.capability) });
  if (persona.refused) return { refused: persona.refused };

  const selectors = persona.selected ? { persona: persona.selected } : {};
  // Only roles that do the unit's work are asked for its skills; a checker or panel seat reads the result.
  const requiredSkills = !seatPosture.forceOutOfProcess && Array.isArray(unit?.skills) ? unit.skills : [];
  // A hard `independentOf` names executors (or seats not bound yet): the crate compares provider families.
  const hard = [...new Set(independentOf.map((dep) => (executors[dep] ? executorFamily(runnerConfig, dep) : dep)))];
  // A soft preference names the seats already bound, each at the executor it holds now.
  const peers = [];
  for (const [index, peer] of (Array.isArray(preferIndependentOf) ? preferIndependentOf : []).entries()) {
    if (!peer?.executor) continue;
    const entry = { seat: peer.seat ?? `${peer.executor}#${index}`, executor: peer.executor, family: executorFamily(runnerConfig, peer.executor) };
    const at = peers.findIndex((known) => known.seat === entry.seat);
    if (at >= 0) peers[at] = entry; else peers.push(entry);
  }
  const override = crateOverrideOf(matchingOverride);
  const crateAsk = {
    capability: unit?.capability,
    seat,
    role,
    ...(persona.base ? { persona: persona.base } : {}),
    label: unit?.id ?? null,
    ...(ask?.workflowTier ? { workflow: ask.workflowTier } : {}),
    selectors,
    raiseAuthorized: ask?.raiseAuthorized === true,
    ...(override ? { override } : {}),
    posture: { readOnly: seatPosture.readOnly === true, forceOutOfProcess: seatPosture.forceOutOfProcess === true, blind: blind === true },
    effectiveRigor: effectiveRigorOf(unit, runnerConfig, { fallback: 'standard' }),
    independence: { hard, hardCheckers: [], soft: peers.map((peer) => peer.seat) },
    requiredSkills,
    unitPrefer: unitPreferOf(unit?.prefer),
  };
  const launchView = launchViewOf(runnerConfig, session);
  return {
    persona, matchingOverride, posture, isReadOnlyPosture, launchView,
    request: { ask: crateAsk, runnerConfig, peers, walk: walkOf(walk), accountView: accountViewOf(runnerConfig, launchView, ctx?.accounts), launchView },
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
function refusalOf(refusal, { session, unit, runnerConfig }) {
  const noAgentCli = agentCliMissingRefusal(runnerConfig, session);
  if (noAgentCli) return noAgentCli;
  const nothingConfigured = refusal.reason === 'no-candidate' && (refusal.configured ?? 0) === 0;
  if (nothingConfigured && session.headless) {
    return { reason: 'headless-no-executor', detail: `No candidate executor available in headless session for capability "${unit?.capability}"` };
  }
  return {
    reason: refusal.reason,
    detail: refusal.detail,
    ...(refusal.reason === 'cli-missing' ? { missingClis: absentClisOf(runnerConfig, session) } : {}),
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
  // Not a step of the walk: the same candidate again after its lease or its brief failed.
  if (reason === 'lease-conflict' || reason === 'brief-not-delivered') return { ...base, kind: reason };
  const sameFamily = executorFamily(runnerConfig, previous.executor) === executorFamily(runnerConfig, binding.executor);
  return { ...base, kind: 'next-candidate', walk: sameFamily ? 'entry' : 'family' };
}

function bindingOf({ out, prep, ask, ctx, walk }) {
  const { unit, seat = 'producer', posture: seatPosture = PRODUCER_POSTURE } = ask ?? {};
  const { runnerConfig = {}, session = {} } = ctx ?? {};
  const { persona: personaChoice, matchingOverride, posture, isReadOnlyPosture, launchView } = prep;
  const { policy, ranked } = out;
  // Stage 1 refused (a tier no cell serves, a raise no door may make): there is nothing to rank.
  if (!ranked) return { refused: refusalOf(out.refusal, { session, unit, runnerConfig }) };

  const cand = ranked.candidates[0];
  if (!cand) return { refused: refusalOf(out.refusal ?? { reason: 'no-candidate', detail: 'no candidate' }, { session, unit, runnerConfig }) };
  let timeout;
  try {
    timeout = timeoutOf(matchingOverride, unit);
  } catch (err) {
    return { refused: { reason: 'run-timeout', detail: err.message } };
  }

  const executorEntry = executorsOf(runnerConfig)[cand.executor];
  const { transport, transportSource } = transportOf({ cand, executorEntry, session, launchFacts: launchView.executors[cand.executor] });
  const { mechanism } = cand;
  const model = cand.model ?? 'default';
  const reasoningEffort = cand.effort ?? null;

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
      ...Object.fromEntries(['recommendation', 'loweredFrom', 'maxTier', 'raisedBy'].filter((key) => policy[key]).map((key) => [key, policy[key]])),
    },
    model: { value: model, source: cand.modelSource },
    persona: { value: personaChoice.persona, source: personaChoice.source },
    reasoningEffort: { value: reasoningEffort, source: cand.effortSource === 'override' ? overrideSource(matchingOverride) : cand.effortSource },
    timeoutMs: { value: timeout.timeoutMs, source: timeout.timeoutMsSource },
    mechanism: { value: mechanism, source: seatPosture.forceOutOfProcess ? 'posture-forced-out-of-process' : 'decideExecutorDispatchMechanism' },
    posture: { value: posture, source: isReadOnlyPosture ? 'read-only-ask-or-writes-empty' : 'producer-writes-declared' },
  };
  if (cand.pool) provenance.pool = { value: cand.pool, source: cand.modelSource };
  if (ranked.skipped.length > 0) provenance.skipped = ranked.skipped;
  // Degraded independence is recorded, never hidden: which seats this one shares a provider family with.
  if (Array.isArray(ask?.preferIndependentOf)) {
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
    family: cand.family,
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
    bindingInput: { ...bindingInput, hostVersion: out.hostVersion },
  };
  const from = walk?.from ?? walk?.tried?.at(-1);
  if (from) {
    binding.provenance.fallbackFrom = fallbackFrom(from, binding, { reason: walk.reason ?? 'provider-limit', rotation: walk.rotation === true, detail: walk.detail, runnerConfig });
  }
  return binding;
}

/**
 * The binding of one seat (one crate exec), or `{ refused: { reason, detail } }`; execution admission
 * belongs to the calling door.
 *
 * @param {object} ask what `askFor` builds
 * @param {object} ctx { runnerConfig, session, accounts? }
 * @param {object} [options.walk] where the seat stands after a failure: `tried` (earlier bindings, oldest
 *   first), `excludePools`, `continuity` (a binding whose executor, model and effort the seat keeps, else
 *   `seat-continuity-unavailable`), `from` (the binding left, default the last tried; recorded as
 *   `fallbackFrom`), `rotation` (same candidate, another account), `detail`, `reason` (default `provider-limit`)
 */
export function bind(ask, ctx, { walk = {} } = {}) {
  return explainSeat(ask, ctx, { walk, chain: false }).binding;
}

/**
 * The seat a Work operation or a raw dispatch runs: one headless producer seat by the same crate call a unit
 * run makes, its posture judged at launch (so the ask names no writes); a stated executor, tier or effort is
 * one override, and a refusal throws, named. `unit` is `{ id, capability, rigor }`.
 */
export function bindWorkSeat({ runnerConfig, unit, role = 'producer', readOnly = false, overrides = [] }) {
  const bound = bind(
    { unit: { ...unit, writes: [] }, seat: 'producer', role, readOnly, overrides, raiseAuthorized: false },
    { runnerConfig, session: { headless: true, postureAtLaunch: true } },
  );
  if (bound.refused) throw new RunnerConfigError(`${bound.refused.reason}: ${bound.refused.detail}${bound.refused.fix ? `; ${bound.refused.fix}` : ''}`, { code: bound.refused.reason });
  return bound;
}

/**
 * Why a seat lands where it does, read-only (nothing leased, spawned or written): the binding, the crate's
 * ranked candidates, skip reasons and explanation, and the walk a failure would take, one binding per step
 * (`chain: false` skips the walk: one host call instead of one per step).
 * @returns {{ binding: object, policy?: object, ranked?: object, explain?: {lines: string[]}, launchView?: object, walk: object[] }}
 */
export function explainSeat(ask, ctx, { walk = {}, chain: walkChain = true } = {}) {
  const prep = requestOf(ask, ctx, walk);
  if (prep.refused) return { binding: { refused: prep.refused }, walk: [] };
  const out = seatBinding(prep.request);
  const binding = bindingOf({ out, prep, ask, ctx, walk });
  const chain = [];
  if (walkChain && !binding.refused) {
    const seen = new Set();
    let current = binding;
    while (current && !current.refused && !seen.has(bindingIdentity(current))) {
      seen.add(bindingIdentity(current));
      chain.push(current);
      current = bind(ask, ctx, { walk: { ...walk, tried: [...(walk.tried ?? []), ...chain] } });
    }
  }
  return { binding, policy: out.policy, ranked: out.ranked, explain: out.explain, launchView: prep.launchView, walk: chain };
}
