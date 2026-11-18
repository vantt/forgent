// dispatch/plan.mjs — DispatchPlan compiler (tsk-5x7-1 D1/D6)
//
// Exposes `compileDispatchPlan()`, which calls the existing
// `decideDispatchMechanism` / `decideExecutorDispatchMechanism` helpers in
// `mechanism.mjs` rather than re-deriving any routing rules, packaging
// selector, caller, mechanism, executorId, capability, invocation, governance,
// and reasonCodes into a canonical DispatchPlan object.

import { MODEL_POLICY_TIERS, assertReasoningEffort } from './config.mjs';
import { RunnerConfigError } from './runner-config-error.mjs';
import { lookupExecutor, resolveExecutorConfig } from './resolve.mjs';
import { toolProvidersOf } from './tool-providers.mjs';
import { decideDispatchMechanism, decideExecutorDispatchMechanism } from './mechanism.mjs';
import { refuseWorkItemInput } from './work-item-input.mjs';
import { resolveExecutorProvider, resolveExecutorGovernance } from './executor-governance.mjs';
import { REPEAT_MODE_VALUES } from './execution-contract.mjs';
import { RIGOR_VALUES, resolveStrongerRigor } from '../rigor.mjs';
import { deriveOperationCapability } from '../operation-capability.mjs';
import { SEAT_ROLES, effectiveRigorOf } from '../execution/seat-resolver.mjs';
import { capabilityRigorOf, hasOwnPreferPool, registeredCapabilityOf } from '../execution/capability-config.mjs';
import { isReadOnlyAssignment } from './assignment.mjs';
import { bindWorkSeat, viaSeatRoute } from '../execution/bind.mjs';
import { plan as routePlan } from '../../seat-binding/client.mjs';

/** The source Seat Binding recorded for one field of a bound seat, carried over as it is. */
function bindingSource(binding, field) {
  const id = binding.provenance?.[field]?.source;
  return id === undefined ? { scope: 'seat-binding' } : { scope: 'seat-binding', id };
}

/**
 * What a launch pins: the bound seat's executor, invocation, pool, account and model; a launch with no
 * binding (the account probe) pins what its dispatch-door override names.
 */
export function launchPinOf({ binding, cliOverride } = {}) {
  return {
    executor: binding?.executor ?? cliOverride?.preferExecutor,
    invocation: binding?.invocation ?? cliOverride?.preferInvocation ?? undefined,
    pool: binding?.pool ?? cliOverride?.pool ?? undefined,
    leaseAccount: binding?.leaseAccount ?? cliOverride?.leaseAccount,
    accountViewDigest: binding?.leaseAccount ? (binding.bindingInput?.accountViewDigest ?? null) : (cliOverride?.accountViewDigest ?? null),
    model: binding?.model ?? cliOverride?.model,
  };
}

/**
 * The effective dispatch policy of an assignment: the executor and provider it runs on, the tier and
 * the model of that tier's cell, the persona, the visibility, the repeat mode, the constraints and the
 * governance verdict, each with where it came from.
 *
 * Nothing here chooses an executor, a tier or a model. A caller that already bound the seat (a unit run)
 * passes the `binding`: its executor, tier, model and effort are taken as given, each carrying the source
 * Seat Binding recorded for it (`{ scope: 'seat-binding', id }`), never relabelled. Every other
 * caller gets Seat Binding's answer through `bind()` (the same crate call a unit run makes): a pinned
 * executor, tier or effort is an override it judges, and the model is the one it names. With no runner
 * config and no binding the policy is refused (`runner-config-missing`). Rigor is recorded
 * as the demand it is (checker count, independence) and never moves the tier or the effort.
 *
 * @param {object} params
 * @param {object} params.assignment Assignment object (required). Its own `rigor` and `domain` are the
 *   caller's demand: the Work layer folds an item's rigor and risk into `rigor` before dispatch sees it.
 * @param {object} [params.runnerConfig] Runner configuration
 * @param {object} [params.binding] The bound seat Seat Binding returned (executor, tier, model, effort, provenance)
 * @param {object} [params.cliOverride] Caller overrides (preferExecutor, preferInvocation, tier, model, ...)
 * @param {object} [params.options] Governance options (disallowedProviders, disallowedExecutors)
 * @returns {Readonly<object>} Effective dispatch policy
 */
export function effectiveDispatchPolicy({ assignment, runnerConfig, binding, cliOverride = {}, options = {} }) {
  refuseWorkItemInput(arguments[0], 'the dispatch policy');
  if (!assignment || typeof assignment !== 'object') {
    throw new RunnerConfigError('an effective dispatch policy needs an assignment object');
  }
  const opPolicy = assignment.policy === undefined ? {} : assignment.policy;
  if (!opPolicy || typeof opPolicy !== 'object' || Array.isArray(opPolicy)) {
    throw new RunnerConfigError('assignment.policy must be an object when provided');
  }
  const retiredMinTier = ['min', 'Tier'].join('');
  if (Object.prototype.hasOwnProperty.call(opPolicy, retiredMinTier)) {
    throw new RunnerConfigError(`assignment policy field "${retiredMinTier}" was removed; normalize persisted assignments at the load boundary or use "rigor"/"tier"`);
  }
  if (opPolicy._fromYaml && opPolicy.tier !== undefined) {
    throw new RunnerConfigError('workflow YAML cannot set explicit tier; declare the tier in the project config (capability, role, persona or seat), or set it at actor/assignment/CLI scope');
  }
  // A literal model name is accepted only from an assignment or the caller, never from workflow YAML.
  if (opPolicy.model && !assignment._allowLiteralModel && !cliOverride.model && !binding && opPolicy._fromYaml) {
    throw new RunnerConfigError('workflow YAML cannot pin literal model names; declare the cell in modelPolicies or name a persona');
  }

  const opId = assignment.operation;

  // Rigor: the strongest explicit demand of the operation, the assignment and the caller. It is a demand
  // (checker count, independence), never a tier; the capability's own rigor joins it in `effectiveRigorOf`.
  const checkedRigor = (value, label) => {
    if (!RIGOR_VALUES.includes(value)) {
      throw new RunnerConfigError(`invalid ${label} rigor "${value}". Valid rigors: [${RIGOR_VALUES.join(', ')}]`);
    }
    return value;
  };
  const derivedCapability = deriveOperationCapability(
    { id: assignment.operation, policy: opPolicy, result: assignment.result ?? { kind: assignment.resultKind } },
    { domain: assignment.domain, primaryCapability: assignment.primaryCapability },
    runnerConfig,
  );
  const targetCap = opPolicy.capability ?? assignment.capability ?? derivedCapability.name;
  const demands = [
    opPolicy.rigor !== undefined ? [checkedRigor(opPolicy.rigor, 'operation'), { scope: 'opPolicy', id: opId }] : null,
    assignment.rigor !== undefined ? [checkedRigor(assignment.rigor, 'assignment'), { scope: 'assignment', id: assignment.assignmentId ?? assignment.workId ?? null }] : null,
    cliOverride.rigor !== undefined ? [checkedRigor(cliOverride.rigor, 'override'), cliOverride.policyProvenance?.rigor ?? { scope: 'cliOverride' }] : null,
  ].filter(Boolean);
  const [demandRigor, demandSource] = demands.reduce((best, d) => (!best || RIGOR_VALUES.indexOf(d[0]) > RIGOR_VALUES.indexOf(best[0]) ? d : best), null) ?? [undefined, { scope: 'default' }];
  const effectiveRigor = effectiveRigorOf({ rigor: demandRigor, capability: targetCap }, runnerConfig, { fallback: 'standard' });
  const rigorSource = effectiveRigor !== demandRigor && effectiveRigor === capabilityRigorOf(runnerConfig, targetCap)
    ? { scope: 'capability', id: targetCap }
    : demandSource;

  // Reasoning effort: only an explicit level is rendered into the launch. Rigor never sets one; without
  // a level the seat runs at its invocation's own default.
  const explicitEffort = binding?.reasoningEffort ?? cliOverride.reasoningEffort ?? opPolicy.reasoningEffort;
  if (explicitEffort !== undefined) assertReasoningEffort(explicitEffort);
  const reasoningEffortSource = binding
    ? bindingSource(binding, 'reasoningEffort')
    : explicitEffort === undefined
      ? { scope: 'default' }
      : cliOverride.reasoningEffort ? { scope: 'cliOverride' } : { scope: 'opPolicy', id: opId };

  // Persona.
  // A bound seat's persona is Seat Binding's answer, none included, with its source; any other caller names it itself.
  const resolvedPersona = binding
    ? (binding.persona ?? undefined)
    : cliOverride.preferPersona ?? opPolicy.preferPersona ?? (assignment.role === 'reviewer' ? 'code-reviewer' : undefined);
  const personaSource = binding
    ? bindingSource(binding, 'persona')
    : cliOverride.preferPersona
      ? (cliOverride.policyProvenance?.persona ?? { scope: 'cliOverride' })
      : opPolicy.preferPersona
        ? { scope: 'opPolicy', id: opId }
        : resolvedPersona
          ? { scope: 'default', id: assignment.role }
          : { scope: 'default' };

  // Executor, tier, model and effort. A caller that already bound the seat (a unit run) passes the tier and
  // the model and they are taken as given. Every other caller asks Seat Binding through `bind()`: a pinned
  // executor (the caller's, else the operation's) is an override, a tier or effort stated by the assignment
  // or the caller is one too, and with no pin the capability's pool decides.
  // The executor the caller names, else the runner's default executor, reaches the crate as a pin.
  const namedExecutor = binding?.executor ?? cliOverride.preferExecutor ?? opPolicy.preferExecutor;
  // The default is registered under its command and under `claude` (withDefaultExecutor): pin the one the registry has.
  const defaultExecutor = runnerConfig?.executor
    ? [runnerConfig.executor.command, 'claude'].find((id) => id && (!runnerConfig.executors || runnerConfig.executors[id]))
    : undefined;
  const pinnedExecutor = namedExecutor ?? defaultExecutor;
  const pinnedInvocation = launchPinOf({ binding, cliOverride }).invocation;
  const explicitTier = binding?.tier ?? cliOverride.tier ?? opPolicy.tier;
  if (explicitTier !== undefined && !MODEL_POLICY_TIERS.includes(explicitTier)) {
    throw new RunnerConfigError(`invalid explicit tier "${explicitTier}". Valid tiers: [${MODEL_POLICY_TIERS.join(', ')}]`);
  }
  const tierProvenance = cliOverride.policyProvenance?.tier;
  if (!binding && cliOverride.tier !== undefined && tierProvenance !== undefined && !['actor', 'assignment', 'cli', 'cliOverride'].includes(tierProvenance.scope)) {
    throw new RunnerConfigError(`explicit tier provenance scope "${tierProvenance.scope}" is not allowed; tier may be explicit only at actor, assignment, or CLI scope`);
  }
  const boundUpstream = binding?.tier !== undefined && binding?.model !== undefined;
  let bound = null;
  if (!boundUpstream) {
    if (!runnerConfig) {
      throw new RunnerConfigError('the dispatch policy needs the runner config to choose a tier and a model: pass it, or pass both the tier and the model', { code: 'runner-config-missing' });
    }
    const override = {
      ...(pinnedExecutor ? { executor: pinnedExecutor, ...(pinnedInvocation ? { invocation: pinnedInvocation } : {}) } : {}),
      ...(explicitTier !== undefined ? { tier: explicitTier } : {}),
      ...(explicitEffort !== undefined ? { reasoningEffort: explicitEffort } : {}),
    };
    bound = bindWorkSeat({
      runnerConfig,
      unit: { id: opId ?? 'work-seat', capability: targetCap ?? '', rigor: effectiveRigor, ...(pinnedExecutor ? { prefer: [pinnedExecutor] } : {}) },
      role: SEAT_ROLES.includes(assignment.role) ? assignment.role : 'producer',
      readOnly: isReadOnlyAssignment(assignment),
      overrides: Object.keys(override).length > 0 ? [override] : [],
    });
  }
  // A pin is hard: an executor Seat Binding did not take (not registered, or unable to serve the seat) is refused.
  if (bound && pinnedExecutor && bound.executor !== pinnedExecutor) {
    throw new RunnerConfigError(`pin-unsatisfiable: preferExecutor "${pinnedExecutor}" is not registered or cannot serve this seat; Seat Binding chose "${bound.executor}"`, { code: 'pin-unsatisfiable' });
  }
  const primaryExecutor = bound?.executor ?? pinnedExecutor ?? 'claude';
  const executorSource = namedExecutor
    ? (binding?.executor ? bindingSource(binding, 'executor') : cliOverride.preferExecutor ? (cliOverride.policyProvenance?.executor ?? { scope: 'cliOverride' }) : { scope: 'opPolicy', id: opId })
    : { scope: 'default' };
  const { resolvedProvider, registeredExecutorEntry } = resolveExecutorProvider({ runnerConfig, primaryExecutor, options });
  const providerSource = registeredExecutorEntry
    ? { scope: 'registeredExecutor', id: primaryExecutor }
    : executorSource;

  let effectiveTier;
  let tierSource;
  let resolvedModel = null;
  let modelSource = { scope: 'default' };
  if (boundUpstream) {
    effectiveTier = binding.tier;
    tierSource = bindingSource(binding, 'tier');
    resolvedModel = binding.model;
    modelSource = bindingSource(binding, 'model');
  } else {
    effectiveTier = bound.tier;
    tierSource = { scope: 'seat-binding', id: bound.provenance.tier.source };
    if (cliOverride.model) {
      resolvedModel = cliOverride.model;
      modelSource = { scope: 'cliOverride' };
    } else if (opPolicy.model) {
      resolvedModel = opPolicy.model;
      modelSource = { scope: 'opPolicy', id: opId };
    } else {
      resolvedModel = bound.model;
      modelSource = { scope: 'placement-policy', id: `${resolvedProvider}.${effectiveTier}` };
    }
  }
  // Only a level somebody stated (the caller, the operation or the tier's cell) is rendered into the launch.
  const reasoningEffort = bound && bound.provenance.reasoningEffort.source !== 'invocation-default' ? bound.reasoningEffort : explicitEffort;

  // Visibility and repeat mode.
  const resolvedVisibility = cliOverride.visibility ?? opPolicy.visibility ?? 'headless';
  const visibilitySource = cliOverride.visibility
    ? (cliOverride.policyProvenance?.visibility ?? { scope: 'cliOverride' })
    : opPolicy.visibility
      ? { scope: 'opPolicy', id: opId }
      : { scope: 'default' };
  const resolvedRepeatMode = cliOverride.repeatMode ?? opPolicy.repeatMode;
  if (resolvedRepeatMode !== undefined && !REPEAT_MODE_VALUES.includes(resolvedRepeatMode)) {
    throw new RunnerConfigError(`invalid repeatMode "${resolvedRepeatMode}". Valid repeatModes: [${REPEAT_MODE_VALUES.join(', ')}]`);
  }
  // `repeatMode` is declared on the operation or by the caller, never derived from the assignment's
  // mutation: undeclared stays null and the recovery assessment treats that as a config error.
  const repeatModeSource = cliOverride.repeatMode
    ? { scope: 'cliOverride' }
    : opPolicy.repeatMode
      ? { scope: 'opPolicy', id: opId }
      : { scope: 'default' };

  // Constraints accumulate.
  const skills = Array.isArray(assignment.skills) ? assignment.skills : [];
  const constraints = { requiresSkills: Object.freeze([...skills]), ...(opPolicy.constraints || {}) };
  const constraintsSource = { scope: 'assignment', id: assignment.assignmentId };

  // Governance: the provider family and the executor id are two distinct checks.
  const { canonicalProvider } = resolveExecutorGovernance({ primaryExecutor, providerModel: resolvedProvider, options });
  const governanceSource = { scope: 'governance', id: canonicalProvider };

  return Object.freeze({
    role: assignment.role,
    persona: resolvedPersona,
    executorId: primaryExecutor,
    providerModel: resolvedProvider,
    rigor: effectiveRigor,
    tier: effectiveTier,
    model: resolvedModel,
    reasoningEffort,
    visibility: resolvedVisibility,
    repeatMode: resolvedRepeatMode ?? null,
    constraints: Object.freeze(constraints),
    provenance: Object.freeze({
      executor: Object.freeze({ value: primaryExecutor, source: Object.freeze(executorSource) }),
      provider: Object.freeze({ value: resolvedProvider, source: Object.freeze(providerSource) }),
      model: Object.freeze({ value: resolvedModel, source: Object.freeze(modelSource) }),
      rigor: Object.freeze({ value: effectiveRigor, source: Object.freeze(rigorSource) }),
      tier: Object.freeze({ value: effectiveTier, source: Object.freeze(tierSource) }),
      reasoningEffort: Object.freeze({ value: binding ? (reasoningEffort ?? null) : reasoningEffort, source: Object.freeze(reasoningEffortSource) }),
      persona: Object.freeze({ value: binding ? (resolvedPersona ?? null) : resolvedPersona, source: Object.freeze(personaSource) }),
      visibility: Object.freeze({ value: resolvedVisibility, source: Object.freeze(visibilitySource) }),
      repeatMode: Object.freeze({ value: resolvedRepeatMode ?? null, source: Object.freeze(repeatModeSource) }),
      constraints: Object.freeze({ value: constraints, source: Object.freeze(constraintsSource) }),
      governance: Object.freeze({ value: 'allowed', source: Object.freeze(governanceSource) }),
    }),
  });
}

/** The rigor and domain a Work hint demands, as the fields a synthesized assignment carries. */
function hintDemand(workHint, workIdArg) {
  if (!workHint) return {};
  return {
    ...(workIdArg ? { workId: workIdArg } : {}),
    ...(workHint.rigor !== undefined ? { rigor: workHint.rigor } : {}),
    ...(workHint.domain ? { domain: workHint.domain } : {}),
  };
}

const noGovernance = () => ({ providerFamily: null, egress: null });

/** A DispatchPlan: the selector and caller shell, then the decision fields in their canonical order. */
function planOf(shell, { mechanism, executorId, capability, invocation = null, governance = noGovernance(), reasonCodes, configured, ...rest }) {
  return { ...shell, mechanism, executorId, capability, invocation, governance, reasonCodes, configured, ...rest };
}

const nativeFirstCode = (hasLiveTaskAccess) => (hasLiveTaskAccess ? 'native-first.rule-2.live-task-access' : 'native-first.rule-1.no-native-mechanism');

/**
 * The selector mirrors the resolution precedence applied below, never a ranking of its own: an explicit
 * executor id wins before anything else is consulted, so it is the reason reported even when a work id came with it.
 */
function selectorOf({ executorIdArg, assignmentArg, workIdArg, purpose }) {
  if (executorIdArg) return { type: 'executor', value: executorIdArg };
  if (assignmentArg) return { type: 'assignment', value: typeof assignmentArg === 'string' ? assignmentArg : assignmentArg.assignmentId };
  if (workIdArg) return { type: 'work', value: workIdArg };
  if (purpose) return { type: 'purpose', value: purpose };
  return { type: 'adHocAgent', value: true };
}

/**
 * A work item whose step executor has no registry entry of its own dispatches native-first. The global
 * executor's real governance still runs through the dispatch policy: a governance refusal reports the plan
 * as unavailable. Any other policy throw is a synthesized-assignment mismatch and never crashes compilation.
 */
function planForUnconfiguredWork({ shell, cfg, executorId, workHint, workIdArg, hasLiveTaskAccess, cliOverride, options }) {
  const mechanism = decideDispatchMechanism({ hasNativeMechanism: true, hasLiveTaskAccess, forceCliSpawn: false });
  const reasonCodes = [nativeFirstCode(hasLiveTaskAccess)];
  let governance = noGovernance();
  let resolvedForDispatch;
  try {
    resolvedForDispatch = resolveExecutorConfig(cfg, undefined, executorId, undefined, undefined, workHint.agentType ?? undefined);
    governance = resolvedForDispatch?.governance ?? governance;
  } catch { /* no real config to resolve governance from: stays null */ }
  if (resolvedForDispatch) {
    try {
      effectiveDispatchPolicy({
        assignment: { operation: executorId, role: undefined, policy: { preferExecutor: executorId }, skills: [], ...hintDemand(workHint, workIdArg) },
        runnerConfig: cfg,
        cliOverride,
        options,
      });
    } catch (err) {
      if (/governance gate rejected/.test(err.message)) {
        return planOf(shell, {
          mechanism: 'unavailable',
          executorId,
          capability: executorId,
          governance,
          reasonCodes: [...reasonCodes, 'governance.blocked'],
          configured: false,
          blockedReason: err.message,
        });
      }
    }
  }
  return planOf(shell, { mechanism, executorId, capability: executorId, governance, reasonCodes, configured: false });
}

const TOOL_STATUS_RANK = { present: 0, stale: 1, missing: 2, unknown: 2 };
const TOOL_ANSWERS = {
  present: { mechanism: 'in-process', reasonCode: 'tool.present' },
  stale: { mechanism: 'in-process', reasonCode: 'tool.stale' },
  missing: { mechanism: 'unavailable', reasonCode: 'tool.missing' },
  unknown: { mechanism: 'unavailable', reasonCode: 'tool.unprobeable' },
};

/**
 * The one door from a purpose (a capability row name, or an executor id) to what serves it:
 * 1. an executor registered under that name is that executor (nothing is chosen);
 * 2. a tool executor serving it (`for`) answers with its live presence: the best provider by status
 *    (`present`, then `stale`, then `missing` or `unknown`), the row's `prefer` is never read;
 * 3. a row with a `prefer` pool of its own is bound by Seat Binding, the same crate call a unit run makes,
 *    so the executor named is the one that would run (or the refusal that would stop it);
 * 4. otherwise nothing is configured: no executor, never a fallback tier.
 *
 * @returns {{configured: boolean, executorId: string|null, executor?: object, bindingSource: string|null,
 *   invocationId?: string, binding?: object, refused?: {reason: string, detail: string},
 *   tool?: {mechanism: string, reasonCode: string, stale?: true, mcpTool?: string, command?: string,
 *   providers: {executorId: string, status: string}[]}}}
 */
// Declared twin of the host's `plan` op for the selectors that are not binding ones (an executor id, an assignment,
// a Work hint): the twin reads no host, spawns nothing, and goes away when those selectors move to the host
// (retiredBy: S6a). The `--for` selector no longer comes through here.
export function purposeSeatOf(cfg, purpose, { repoRoot } = {}) {
  const named = lookupExecutor(cfg, purpose);
  if (named.configured || !purpose) return named;

  const providers = toolProvidersOf(cfg, { capability: purpose, repoRoot });
  if (providers.length > 0) {
    const best = providers.reduce((chosen, next) => (TOOL_STATUS_RANK[next.status] < TOOL_STATUS_RANK[chosen.status] ? next : chosen));
    // A tool that is there but names nothing to call (no mcp tool for the purpose, no cli command) is no answer.
    const named = Boolean(best.mcpTool || best.command);
    const { mechanism, reasonCode } = TOOL_ANSWERS[best.status].mechanism === 'in-process' && !named
      ? { mechanism: 'unavailable', reasonCode: 'tool.unnamed' }
      : TOOL_ANSWERS[best.status];
    const callable = mechanism === 'in-process';
    return {
      configured: true,
      executorId: best.executorId,
      executor: cfg.executors[best.executorId],
      bindingSource: 'tool-provider',
      tool: {
        mechanism,
        reasonCode,
        ...(best.status === 'stale' ? { stale: true } : {}),
        ...(callable && best.mcpTool ? { mcpTool: best.mcpTool } : {}),
        ...(callable && best.command ? { command: best.command } : {}),
        providers: providers.map(({ executorId, status }) => ({ executorId, status })),
      },
    };
  }

  if (hasOwnPreferPool(cfg, purpose)) {
    try {
      const binding = bindWorkSeat({ runnerConfig: cfg, unit: { id: purpose, capability: purpose } });
      return {
        configured: true,
        executorId: binding.executor,
        executor: cfg.executors?.[binding.executor],
        bindingSource: 'seat-binding',
        invocationId: binding.invocation ?? undefined,
        binding,
      };
    } catch (err) {
      if (!(err instanceof RunnerConfigError) || !err.code) throw err;
      const prefix = `${err.code}: `;
      const detail = err.message.startsWith(prefix) ? err.message.slice(prefix.length) : err.message;
      return { configured: true, executorId: null, executor: undefined, bindingSource: null, refused: { reason: err.code, detail } };
    }
  }

  return named;
}

/**
 * The plan a purpose answered by a tool or by a seat refusal carries, or null when the answer names an
 * executor to dispatch. A tool answer is final: it has no policy and no governance, the caller runs the tool.
 */
function planOfPurposeAnswer(shell, purposeName, answer) {
  if (answer.refused) {
    return planOf(shell, {
      mechanism: 'unavailable',
      executorId: null,
      capability: purposeName,
      reasonCodes: ['seat-binding.refused'],
      configured: true,
      blockedReason: `${answer.refused.reason}: ${answer.refused.detail}`,
    });
  }
  if (answer.tool) {
    const { mechanism, reasonCode, stale, mcpTool, command, providers } = answer.tool;
    return planOf(shell, {
      mechanism,
      executorId: answer.executorId,
      capability: purposeName,
      reasonCodes: [reasonCode],
      configured: true,
      ...(mcpTool ? { mcpTool } : {}),
      ...(command ? { command } : {}),
      ...(stale ? { stale } : {}),
      providers,
    });
  }
  return null;
}

/**
 * The tier, model, provider and provenance the dispatch policy gives the executor this plan chose, from the
 * caller's real assignment or a synthesized one. A real assignment's failure propagates. A synthesized
 * assignment never turns a working `decide` into a throw (except a seat binding route that does not answer);
 * the new fields are left null.
 */
function policyForPlan({ cfg, executorId, capability, assignmentItem, assignmentArg, workHint, workIdArg, binding, cliOverride, options }) {
  const realAssignment = assignmentItem ?? (typeof assignmentArg === 'object' && assignmentArg ? assignmentArg : null);
  const syntheticPolicy = { preferExecutor: executorId };
  const capRigor = capabilityRigorOf(cfg, capability);
  if (capRigor) syntheticPolicy.rigor = capRigor;
  if (capability) syntheticPolicy.capability = capability;
  const assignment = realAssignment ?? {
    operation: capability ?? executorId,
    role: undefined,
    policy: syntheticPolicy,
    skills: [],
    ...hintDemand(workHint, workIdArg),
  };
  let policy = null;
  try {
    policy = effectiveDispatchPolicy({ assignment, runnerConfig: cfg, binding, cliOverride, options });
  } catch (err) {
    if (realAssignment || err?.name === 'SeatBindingError') throw err;
    return { policy: null };
  }
  if (policy.executorId !== executorId) {
    if (realAssignment) {
      throw new RunnerConfigError(`dispatch decide mismatch for operation "${assignment.operation}": decided executor "${executorId}" does not match execution policy executor "${policy.executorId}"`);
    }
    return { policy: null, reasonCode: 'policy.executor-mismatch-ignored' };
  }
  return { policy };
}

/**
 * Compiles a canonical DispatchPlan object for a dispatch request.
 *
 * @param {object} cfg - Runner config object
 * @param {object} [opts] - Dispatch parameters
 * @param {string} [opts.executorId] - Positional executor identifier
 * @param {string} [opts.for] - Purpose identifier
 * @param {string} [opts.workId] - Work item identifier (the `--work` selector)
 * @param {string|object} [opts.assignment] - Assignment identifier or object
 * @param {boolean} [opts.needsSoul=false] - True if caller needs a soul-bearing agent
 * @param {boolean} [opts.hasLiveTaskAccess=false] - True if caller holds live Task tool access
 * @param {object} [opts.caller] - Caller role descriptors ({ role: 'driver'|'launcher' })
 * @param {{workExecutorId: string|null, agentType?: string|null, rigor?: string, domain?: string}} [opts.workHint]
 *   - What the Work layer resolved for `workId` at its step: the executor identity (null when its
 *   Workflow declares none), the item's agent type, its rigor demand and its domain. Required with
 *   `workId`; dispatch never reads the Work item itself.
 * @param {object} [opts.assignmentItem] - Pre-resolved assignment object (for --assignment option)
 * @param {string} [opts.repoRoot] - Root a tool purpose's `scanTarget` and `HEAD` resolve against (the working directory when absent)
 * @returns {object} DispatchPlan
 */
export function compileDispatchPlan(
  cfg,
  {
    executorId: executorIdArg,
    for: purpose,
    workId: workIdArg,
    assignment: assignmentArg,
    needsSoul = false,
    hasLiveTaskAccess = false,
    caller = { role: 'driver' },
    workHint,
    assignmentItem,
    repoRoot,
    binding,
    cliOverride,
    options,
  } = {},
) {
  refuseWorkItemInput(arguments[1], 'compileDispatchPlan()');
  if (!executorIdArg && !purpose && !workIdArg && !assignmentArg && !needsSoul) {
    throw new RunnerConfigError(
      'usage: node src/runner/dispatch.mjs decide <executorId> [--has-live-task-access] | decide --for <purpose> [--needs-soul] [--has-live-task-access] | decide --work <workId> [--stage <stage>] [--has-live-task-access] | decide --assignment <assignmentId> [--has-live-task-access] | decide --needs-soul [--has-live-task-access]',
    );
  }

  const selector = selectorOf({ executorIdArg, assignmentArg, workIdArg, purpose });
  const shell = { selector, caller: { role: caller?.role ?? 'driver' } };
  const reasonCodes = [];

  let executorId = executorIdArg;
  // What names the executor to dispatch (a registry lookup, or the seat Seat Binding bound), and the seat itself.
  let resolved;
  let seatBinding;
  let workInputId;

  if (!executorId && assignmentArg) {
    const asgnObj = assignmentItem ?? (typeof assignmentArg === 'object' ? assignmentArg : null);
    if (asgnObj) {
      executorId = effectiveDispatchPolicy({ assignment: asgnObj, runnerConfig: cfg, binding, cliOverride, options }).executorId;
      resolved = lookupExecutor(cfg, executorId);
    }
  }

  if (!executorId && workIdArg) {
    if (!workHint) {
      throw new RunnerConfigError(`no work item "${workIdArg}" found -- cannot resolve its dispatch executor.`);
    }
    if (workHint.workExecutorId === undefined) {
      throw new RunnerConfigError(
        `work item "${workIdArg}" was supplied without the executor identity its Workflow step resolves to -- the Work layer must resolve it (dispatch does not look steps up).`,
      );
    }
    workInputId = workHint.workExecutorId ?? undefined;
    const answer = purposeSeatOf(cfg, workInputId, { repoRoot });
    const answered = planOfPurposeAnswer(shell, workInputId, answer);
    if (answered) return answered;
    if (!answer.configured) {
      return planForUnconfiguredWork({ shell, cfg, executorId: workInputId, workHint, workIdArg, hasLiveTaskAccess, cliOverride, options });
    }
    resolved = answer;
    seatBinding = answer.binding;
    executorId = answer.bindingSource === 'seat-binding' ? answer.executorId : workInputId;
  }

  if (!executorId && purpose) {
    // The binding selectors (`--for`, `--needs-soul`) are the host route's `plan` op: the purpose's seat, its tool
    // providers and its mechanism are decided there, never re-derived here.
    const answer = viaSeatRoute(() => routePlan({ runner: cfg, for: purpose, needsSoul, hasLiveTaskAccess, ...(repoRoot ? { repoRoot } : {}) }));
    if (answer.providers || answer.mechanism === 'unavailable' || !answer.executorId) {
      return planOf(shell, {
        mechanism: answer.mechanism,
        executorId: answer.executorId ?? null,
        capability: purpose,
        reasonCodes: answer.reasonCodes,
        configured: answer.configured,
        ...(answer.mcpTool ? { mcpTool: answer.mcpTool } : {}),
        ...(answer.command ? { command: answer.command } : {}),
        ...(answer.stale ? { stale: answer.stale } : {}),
        ...(answer.providers ? { providers: answer.providers } : {}),
        ...(answer.blockedReason !== undefined ? { blockedReason: answer.blockedReason } : {}),
      });
    }
    // An executor registered under the purpose's own name is that executor; any other one is the seat the host bound.
    const named = lookupExecutor(cfg, purpose);
    executorId = answer.executorId;
    resolved = named.configured ? named : { ...lookupExecutor(cfg, executorId), bindingSource: 'seat-binding' };
  }

  if (!executorId) {
    if (needsSoul) {
      return planOf(shell, {
        mechanism: decideDispatchMechanism({ hasNativeMechanism: true, hasLiveTaskAccess, forceCliSpawn: false }),
        executorId: null,
        capability: purpose ?? null,
        reasonCodes: [nativeFirstCode(hasLiveTaskAccess)],
        configured: false,
      });
    }
    reasonCodes.push('selector.unregistered');
    // Additive diagnosis for the one case a caller can act on: the purpose was never registered as a capability key or alias.
    if (selector.type === 'purpose' && registeredCapabilityOf(cfg, purpose) === undefined) {
      reasonCodes.push('capability.unknown');
    }
    return planOf(shell, { mechanism: 'unavailable', executorId: null, capability: purpose ?? null, reasonCodes, configured: false });
  }

  // A positional name may be a capability row rather than an executor id: it is answered the way a purpose is.
  const positionalName = executorIdArg;
  if (positionalName) {
    const answer = purposeSeatOf(cfg, positionalName, { repoRoot });
    const answered = planOfPurposeAnswer(shell, positionalName, answer);
    if (answered) return answered;
    resolved = answer;
    seatBinding = answer.binding;
    if (answer.bindingSource === 'seat-binding') executorId = answer.executorId;
  }

  const mechanism = decideExecutorDispatchMechanism(cfg, executorId, { hasLiveTaskAccess });
  reasonCodes.push(mechanism === 'out-of-process' ? 'native-first.0033.cli-spawn-shaped' : 'native-first.rule-2.live-task-access');

  resolved = resolved?.executorId === executorId ? resolved : lookupExecutor(cfg, executorId);
  const { executor, configured } = resolved;
  const capability = purpose ?? positionalName ?? workInputId ?? executorId ?? null;

  // An unregistered executor id is refused the same way an unregistered `--for` name is: never guessed at.
  if (selector.type === 'executor' && !configured) {
    reasonCodes.push('selector.unregistered');
    return planOf(shell, { mechanism: 'unavailable', executorId, capability, reasonCodes, configured: false });
  }

  const agentType = executor?.agentType;

  // The invocation and governance describe what execution will actually do, so an out-of-process plan runs
  // the same resolution `resolveExecutorCommand` runs. When it fails the failure is real: the plan says
  // unavailable and carries the reason, never a working mechanism over a governance refusal. An in-process
  // plan never takes the cli path, so an mcp-only executor failing there is no blocker.
  let resolvedForDispatch;
  let resolveError;
  if (mechanism === 'out-of-process') {
    try {
      // A pinned invocation (bind() picks herdr-spawn vs cli-spawn that way) must be the one the plan describes.
      const { invocation: pinnedInvocationId } = launchPinOf({ binding: seatBinding ?? binding, cliOverride });
      const pinnedInvocation = typeof pinnedInvocationId === 'string' && pinnedInvocationId.trim() ? pinnedInvocationId : undefined;
      resolvedForDispatch = resolveExecutorConfig(cfg, undefined, executorId, undefined, undefined, agentType, pinnedInvocation);
    } catch (err) {
      resolveError = err;
    }
    if (!resolvedForDispatch) {
      reasonCodes.push('governance.blocked');
      // `configured` keeps its one meaning (the id has a registry entry); `blockedReason` carries the refusal.
      return planOf(shell, {
        mechanism: 'unavailable',
        executorId,
        capability,
        reasonCodes,
        configured,
        blockedReason: resolveError?.message ?? null,
      });
    }
  }

  const invocation = resolvedForDispatch
    ? { via: 'cli', adapter: resolvedForDispatch.adapter ?? executor?.adapter ?? 'cli-spawn', protocol: 'prompt-stdout-v1' }
    : null;

  const { policy: effectivePolicy, reasonCode } = policyForPlan({
    cfg, executorId, capability, assignmentItem, assignmentArg, workHint, workIdArg, binding: seatBinding ?? binding, cliOverride, options,
  });
  if (reasonCode) reasonCodes.push(reasonCode);

  return planOf(shell, {
    mechanism: mechanism,
    executorId,
    capability,
    invocation,
    governance: resolvedForDispatch?.governance ?? noGovernance(),
    reasonCodes,
    ...(agentType ? { agentType } : {}),
    configured,
    bindingSource: resolved.bindingSource ?? null,
    tier: effectivePolicy?.tier ?? null,
    model: effectivePolicy?.model ?? null,
    providerModel: effectivePolicy?.providerModel ?? null,
    provenance: effectivePolicy?.provenance ?? null,
    policy: effectivePolicy,
  });
}
