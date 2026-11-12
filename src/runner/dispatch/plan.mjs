// dispatch/plan.mjs — DispatchPlan compiler (tsk-5x7-1 D1/D6)
//
// Exposes `compileDispatchPlan()`, which calls the existing
// `decideDispatchMechanism` / `decideExecutorDispatchMechanism` helpers in
// `mechanism.mjs` rather than re-deriving any routing rules, packaging
// selector, caller, mechanism, executorId, capability, invocation, governance,
// and reasonCodes into a canonical DispatchPlan object.

import { MODEL_POLICY_TIERS, assertReasoningEffort } from './config.mjs';
import { RunnerConfigError } from './runner-config-error.mjs';
import { resolveExecutorAndOverrides, resolveExecutorConfig } from './resolve.mjs';
import { decideDispatchMechanism, decideExecutorDispatchMechanism } from './mechanism.mjs';
import { refuseWorkItemInput } from './work-item-input.mjs';
import { resolveExecutorProvider, resolveExecutorGovernance } from './executor-governance.mjs';
import { REPEAT_MODE_VALUES } from './execution-contract.mjs';
import { RIGOR_VALUES, resolveStrongerRigor } from '../rigor.mjs';
import { deriveOperationCapability } from '../operation-capability.mjs';
import { SEAT_ROLES, capabilityRigorOf, effectiveRigorOf } from '../execution/seat-resolver.mjs';
import { isReadOnlyAssignment } from './assignment.mjs';
import { bindWorkSeat } from '../execution/bind.mjs';

// Additive check for the `capability.unknown` reason code (never changes
// `mechanism`): is `name` a real entry key, or a declared `aliases[]` member,
// of `cfg.capabilities`? Mirrors the same "key or alias" membership
// `resolveExecutorAndOverrides` (resolve.mjs) already checks for `prefer`
// resolution, kept local here since that function resolves a single name to
// its serving executor rather than answering a plain existence question.
function isKnownCapabilityName(cfg, name) {
  const capabilities = cfg && cfg.capabilities && typeof cfg.capabilities === 'object' ? cfg.capabilities : {};
  if (Object.prototype.hasOwnProperty.call(capabilities, name)) return true;
  return Object.values(capabilities).some((entry) => Array.isArray(entry?.aliases) && entry.aliases.includes(name));
}


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
  const reasoningEffortSource = explicitEffort === undefined
    ? { scope: 'default' }
    : binding?.reasoningEffort
      ? bindingSource(binding, 'reasoningEffort')
      : cliOverride.reasoningEffort ? { scope: 'cliOverride' } : { scope: 'opPolicy', id: opId };

  // Persona.
  const resolvedPersona =
    cliOverride.preferPersona ??
    opPolicy.preferPersona ??
    (assignment.role === 'reviewer' ? 'code-reviewer' : undefined);
  const personaSource = cliOverride.preferPersona
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
    ? (binding?.executor ? { scope: 'seat-binding' } : cliOverride.preferExecutor ? (cliOverride.policyProvenance?.executor ?? { scope: 'cliOverride' }) : { scope: 'opPolicy', id: opId })
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
      reasoningEffort: Object.freeze({ value: reasoningEffort, source: Object.freeze(reasoningEffortSource) }),
      persona: Object.freeze({ value: resolvedPersona, source: Object.freeze(personaSource) }),
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

/** The tool a handback invocation names for `purpose`, when the executor declares an mcp invocation. */
function mcpToolFor(executor, purpose) {
  const mcpInvocation = Array.isArray(executor?.invocations) ? executor.invocations.find((inv) => inv.via === 'mcp') : undefined;
  const candidate = purpose && mcpInvocation?.tools ? mcpInvocation.tools[purpose] : undefined;
  return typeof candidate === 'string' && candidate ? candidate : undefined;
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
  let workResolved;
  let workResolvedInputId;
  let assignmentResolved;

  if (!executorId && assignmentArg) {
    const asgnObj = assignmentItem ?? (typeof assignmentArg === 'object' ? assignmentArg : null);
    if (asgnObj) {
      executorId = effectiveDispatchPolicy({ assignment: asgnObj, runnerConfig: cfg, binding, cliOverride, options }).executorId;
      assignmentResolved = resolveExecutorAndOverrides(cfg, executorId);
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
    executorId = workHint.workExecutorId ?? undefined;
    workResolvedInputId = executorId;
    workResolved = resolveExecutorAndOverrides(cfg, executorId);
    if (!workResolved.configured) {
      return planForUnconfiguredWork({ shell, cfg, executorId, workHint, workIdArg, hasLiveTaskAccess, cliOverride, options });
    }
  }

  let purposeResolved;
  if (!executorId && purpose) {
    purposeResolved = resolveExecutorAndOverrides(cfg, purpose);
    executorId = purposeResolved.executorId;
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
    if (selector.type === 'purpose' && !isKnownCapabilityName(cfg, purpose)) {
      reasonCodes.push('capability.unknown');
    }
    return planOf(shell, { mechanism: 'unavailable', executorId: null, capability: purpose ?? null, reasonCodes, configured: false });
  }

  const mechanism = decideExecutorDispatchMechanism(cfg, executorId, { hasLiveTaskAccess });
  reasonCodes.push(mechanism === 'out-of-process' ? 'native-first.0033.cli-spawn-shaped' : 'native-first.rule-2.live-task-access');

  const resolved = workResolved && workResolvedInputId === executorId
    ? workResolved
    : assignmentResolved && assignmentResolved.executorId === executorId
      ? assignmentResolved
      : purposeResolved && purposeResolved.executorId === executorId
        ? purposeResolved
        : resolveExecutorAndOverrides(cfg, executorId);
  const { executor, configured } = resolved;
  const capability = purpose ?? (executorId ?? null);

  // An unregistered executor id is refused the same way an unregistered `--for` name is: never guessed at.
  if (selector.type === 'executor' && !configured) {
    reasonCodes.push('selector.unregistered');
    return planOf(shell, { mechanism: 'unavailable', executorId, capability, reasonCodes, configured: false });
  }

  let mcpTool;
  let finalMechanism = mechanism;
  if (mechanism === 'out-of-process') {
    mcpTool = mcpToolFor(executor, purpose);
    if (mcpTool) {
      finalMechanism = 'in-process';
      reasonCodes.push('native-first.mcp-handback');
    }
  }

  const agentType = executor?.agentType;

  // The invocation and governance describe what execution will actually do, so an out-of-process plan runs
  // the same resolution `resolveExecutorCommand` runs. When it fails the failure is real: the plan says
  // unavailable and carries the reason, never a working mechanism over a governance refusal. An in-process
  // plan never takes the cli path, so an mcp-only executor failing there is no blocker.
  let resolvedForDispatch;
  let resolveError;
  if (finalMechanism === 'out-of-process') {
    try {
      // A pinned invocation (bind() picks herdr-spawn vs cli-spawn that way) must be the one the plan describes.
      const { invocation: pinnedInvocationId } = launchPinOf({ binding, cliOverride });
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
    cfg, executorId, capability, assignmentItem, assignmentArg, workHint, workIdArg, binding, cliOverride, options,
  });
  if (reasonCode) reasonCodes.push(reasonCode);

  return planOf(shell, {
    mechanism: finalMechanism,
    executorId,
    capability,
    invocation,
    governance: resolvedForDispatch?.governance ?? noGovernance(),
    reasonCodes,
    ...(agentType ? { agentType } : {}),
    ...(mcpTool ? { mcpTool } : {}),
    configured,
    bindingSource: resolved.bindingSource ?? null,
    tier: effectivePolicy?.tier ?? null,
    model: effectivePolicy?.model ?? null,
    providerModel: effectivePolicy?.providerModel ?? null,
    provenance: effectivePolicy?.provenance ?? null,
    policy: effectivePolicy,
  });
}
