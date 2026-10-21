// dispatch/plan.mjs — DispatchPlan compiler (tsk-5x7-1 D1/D6)
//
// Exposes `compileDispatchPlan()`, which calls the existing
// `decideDispatchMechanism` / `decideExecutorDispatchMechanism` helpers in
// `mechanism.mjs` rather than re-deriving any routing rules, packaging
// selector, caller, mechanism, executorId, capability, invocation, governance,
// and reasonCodes into a canonical DispatchPlan object.

import { MODEL_POLICY_TIERS, RunnerConfigError, assertReasoningEffort } from './config.mjs';
import { resolveExecutorAndOverrides, resolveExecutorConfig, tierCellMissingDetail } from './resolve.mjs';
import { decideDispatchMechanism, decideExecutorDispatchMechanism } from './mechanism.mjs';
import { refuseWorkItemInput } from './work-item-input.mjs';
import { resolveExecutorProvider, resolveExecutorGovernance } from './executor-governance.mjs';
import { REPEAT_MODE_VALUES } from './execution-contract.mjs';
import { RIGOR_VALUES, resolveStrongerRigor } from '../rigor.mjs';
import { deriveOperationCapability } from '../operation-capability.mjs';
import { SEAT_ROLES, capabilityRigorOf } from '../execution/seat-resolver.mjs';
import { seatPolicy } from '../execution/seat-policy.mjs';

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


/**
 * The first model of a seat policy's cell for `family`: the cell entries Seat Binding returned at the
 * tier it decided. Undefined when the family serves no cell at that tier.
 */
function modelOfCell(policy, family) {
  return policy.cells?.[family]?.[0]?.model;
}

/**
 * The effective dispatch policy of an assignment: the executor and provider it runs on, the tier and
 * the model of that tier's cell, the persona, the visibility, the repeat mode, the constraints and the
 * governance verdict, each with where it came from.
 *
 * Nothing here chooses a tier or a model. A caller that already bound the seat (a unit run) passes both
 * as `cliOverride.tier` and `cliOverride.model` and they are taken as given. Otherwise the tier is
 * Seat Binding's answer for the assignment's capability (an explicit tier from the assignment or the
 * caller is an override, which may keep or lower the tier but never raise it) and the model is the first
 * entry of the executor family's cell at that tier. Rigor is recorded as the demand it is (checker
 * count, independence) and never moves the tier or the effort.
 *
 * @param {object} params
 * @param {object} params.assignment Assignment object (required). Its own `rigor` and `domain` are the
 *   caller's demand: the Work layer folds an item's rigor and risk into `rigor` before dispatch sees it.
 * @param {object} [params.runnerConfig] Runner configuration
 * @param {object} [params.cliOverride] Caller overrides (preferExecutor, preferInvocation, tier, model, ...)
 * @param {object} [params.options] Governance options (disallowedProviders, disallowedExecutors)
 * @returns {Readonly<object>} Effective dispatch policy
 */
export function effectiveDispatchPolicy({ assignment, runnerConfig, cliOverride = {}, options = {} }) {
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
  if (opPolicy.model && !assignment._allowLiteralModel && !cliOverride.model && opPolicy._fromYaml) {
    throw new RunnerConfigError('workflow YAML cannot pin literal model names; declare the cell in modelPolicies or name a persona');
  }

  const opId = assignment.operation;

  // Rigor: the strongest explicit demand wins; the implicit standard is only a final fallback. It sets
  // checker count and independence, so it is recorded here and never read as a tier.
  const rigorStrength = (r) => RIGOR_VALUES.indexOf(r);
  const checkedRigor = (value, label) => {
    if (!RIGOR_VALUES.includes(value)) {
      throw new RunnerConfigError(`invalid ${label} rigor "${value}". Valid rigors: [${RIGOR_VALUES.join(', ')}]`);
    }
    return value;
  };
  let effectiveRigor = opPolicy.rigor !== undefined ? checkedRigor(opPolicy.rigor, 'operation') : 'standard';
  let rigorSource = opPolicy.rigor !== undefined ? { scope: 'opPolicy', id: opId } : { scope: 'default' };
  const raiseRigor = (value, source) => {
    if (rigorSource.scope === 'default' || rigorStrength(value) > rigorStrength(effectiveRigor)) {
      effectiveRigor = rigorSource.scope === 'default' ? value : resolveStrongerRigor(effectiveRigor, value);
      rigorSource = source;
    }
  };
  if (assignment.rigor !== undefined) {
    raiseRigor(checkedRigor(assignment.rigor, 'assignment'), { scope: 'assignment', id: assignment.assignmentId ?? assignment.workId ?? null });
  }
  const derivedCapability = deriveOperationCapability(
    { id: assignment.operation, policy: opPolicy, result: assignment.result ?? { kind: assignment.resultKind } },
    { domain: assignment.domain, primaryCapability: assignment.primaryCapability },
    runnerConfig,
  );
  const targetCap = opPolicy.capability ?? assignment.capability ?? derivedCapability.name;
  const capRigor = targetCap ? capabilityRigorOf(runnerConfig, targetCap) : undefined;
  if (capRigor !== undefined) raiseRigor(checkedRigor(capRigor, `capability "${targetCap}"`), { scope: 'capability', id: targetCap });
  if (cliOverride.rigor !== undefined) {
    raiseRigor(checkedRigor(cliOverride.rigor, 'override'), cliOverride.policyProvenance?.rigor ?? { scope: 'cliOverride' });
  }

  // Executor preference: the caller's pin, else the operation's, else the global default executor.
  const primaryExecutor =
    cliOverride.preferExecutor ??
    opPolicy.preferExecutor ??
    runnerConfig?.executor?.command ??
    (runnerConfig?.executor?.invocations?.[0]?.command ?? runnerConfig?.executor?.invocations?.[0]?.id) ??
    'claude';
  const executorSource = cliOverride.preferExecutor
    ? (cliOverride.policyProvenance?.executor ?? { scope: 'cliOverride' })
    : opPolicy.preferExecutor
      ? { scope: 'opPolicy', id: opId }
      : { scope: 'default' };

  // Reasoning effort: only an explicit level is rendered into the launch. Rigor never sets one; without
  // a level the seat runs at its invocation's own default.
  const explicitEffort = cliOverride.reasoningEffort ?? opPolicy.reasoningEffort;
  const reasoningEffort = explicitEffort === undefined ? undefined : assertReasoningEffort(explicitEffort);
  const reasoningEffortSource = explicitEffort === undefined
    ? { scope: 'default' }
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

  // Registry validation and provider derivation.
  const { resolvedProvider, registeredExecutorEntry } = resolveExecutorProvider({ runnerConfig, primaryExecutor, options });
  const providerSource = registeredExecutorEntry
    ? { scope: 'registeredExecutor', id: primaryExecutor }
    : executorSource;

  // Tier and model.
  let effectiveTier;
  let tierSource;
  let resolvedModel = null;
  let modelSource = { scope: 'default' };
  const explicitTier = cliOverride.tier ?? opPolicy.tier;
  if (explicitTier !== undefined && !MODEL_POLICY_TIERS.includes(explicitTier)) {
    throw new RunnerConfigError(`invalid explicit tier "${explicitTier}". Valid tiers: [${MODEL_POLICY_TIERS.join(', ')}]`);
  }
  const tierProvenance = cliOverride.policyProvenance?.tier;
  if (cliOverride.tier !== undefined && tierProvenance !== undefined && !['actor', 'assignment', 'cli', 'cliOverride'].includes(tierProvenance.scope)) {
    throw new RunnerConfigError(`explicit tier provenance scope "${tierProvenance.scope}" is not allowed; tier may be explicit only at actor, assignment, or CLI scope`);
  }
  if (cliOverride.tier !== undefined && cliOverride.model !== undefined) {
    // The seat was bound upstream: its tier and the model of its cell are taken as given.
    effectiveTier = cliOverride.tier;
    tierSource = tierProvenance ?? { scope: 'cliOverride' };
    resolvedModel = cliOverride.model;
    modelSource = { scope: 'cliOverride' };
  } else if (runnerConfig) {
    const decided = seatPolicy({
      capability: targetCap ?? '',
      seat: 'producer',
      role: SEAT_ROLES.includes(assignment.role) ? assignment.role : 'producer',
      label: opId ?? null,
      selectors: {},
      raiseAuthorized: false,
      ...(explicitTier !== undefined ? { override: { tier: explicitTier } } : {}),
      effectiveRigor,
    }, runnerConfig);
    if (decided.refused) {
      throw new RunnerConfigError(`${decided.refused.reason}: ${decided.refused.detail}`, { code: decided.refused.reason });
    }
    effectiveTier = decided.policy.tier;
    tierSource = { scope: 'seat-binding', id: decided.policy.tierSource };
    if (cliOverride.model) {
      resolvedModel = cliOverride.model;
      modelSource = { scope: 'cliOverride' };
    } else if (opPolicy.model) {
      resolvedModel = opPolicy.model;
      modelSource = { scope: 'opPolicy', id: opId };
    } else {
      resolvedModel = modelOfCell(decided.policy, resolvedProvider);
      if (resolvedModel === undefined) {
        throw new RunnerConfigError(`tier-cell-missing: ${tierCellMissingDetail(resolvedProvider, effectiveTier)}`, { code: 'tier-cell-missing' });
      }
      modelSource = { scope: 'placement-policy', id: `${resolvedProvider}.${effectiveTier}` };
    }
  } else {
    // With no runner config nothing can decide a tier or a cell: only what the caller itself stated stands.
    effectiveTier = explicitTier;
    tierSource = cliOverride.tier !== undefined ? (tierProvenance ?? { scope: 'cliOverride' }) : opPolicy.tier !== undefined ? { scope: 'opPolicy', id: opId } : { scope: 'default' };
    if (cliOverride.model) {
      resolvedModel = cliOverride.model;
      modelSource = { scope: 'cliOverride' };
    } else if (opPolicy.model) {
      resolvedModel = opPolicy.model;
      modelSource = { scope: 'opPolicy', id: opId };
    }
  }

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

  // 1. Derive selector
  //
  // Self-review finding (2026-08-25): this order must mirror the ACTUAL
  // resolution precedence below, never a separate ranking of its own — the
  // resolution logic only ever consults `workIdArg`/`purpose` inside an
  // `if (!executorId && ...)` guard, so an explicit `executorIdArg` always
  // wins first regardless of what else the caller passed. The old order
  // (work > purpose > executor) reported `selector.type: 'work'` for a
  // caller that passed BOTH `executorId` and `work`, even though
  // resolution never touched the work item at all — any audit/log
  // consumer reading `plan.selector` to understand why this dispatch
  // resolved the way it did was told the wrong reason.
  let selector;
  if (executorIdArg) {
    selector = { type: 'executor', value: executorIdArg };
  } else if (assignmentArg) {
    selector = {
      type: 'assignment',
      value: typeof assignmentArg === 'string' ? assignmentArg : assignmentArg.assignmentId,
    };
  } else if (workIdArg) {
    selector = { type: 'work', value: workIdArg };
  } else if (purpose) {
    selector = { type: 'purpose', value: purpose };
  } else {
    selector = { type: 'adHocAgent', value: true };
  }

  const callerObj = { role: caller?.role ?? 'driver' };
  const reasonCodes = [];

  let executorId = executorIdArg;
  let workResolved;
  let workResolvedInputId;
  let assignmentResolved;

  if (!executorId && assignmentArg) {
    const asgnObj = assignmentItem ?? (typeof assignmentArg === 'object' ? assignmentArg : null);
    if (asgnObj) {
      const policy = effectiveDispatchPolicy({
        assignment: asgnObj,
        runnerConfig: cfg,
        cliOverride,
        options,
      });
      executorId = policy.executorId;
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
    const hasExplicitExecutor = workResolved.configured;
    if (!hasExplicitExecutor) {
      const mechanism = decideDispatchMechanism({ hasNativeMechanism: true, hasLiveTaskAccess, forceCliSpawn: false });
      reasonCodes.push(hasLiveTaskAccess ? 'native-first.rule-2.live-task-access' : 'native-first.rule-1.no-native-mechanism');
      // H6a: this branch used to hardcode `governance: {providerFamily:
      // null, egress: null}` unconditionally -- a real DispatchPlan
      // reported as dispatchable (native-first, `configured: false` just
      // means "no executors.<id> entry of its own", not "nothing will run")
      // with no governance evaluated at all. `disallowedProviders`/
      // `disallowedExecutors` (the dispatch policy's own governance gate)
      // silently never fired for a `--work` dispatch that fell through to
      // here. Same fix shape as the out-of-process resolveExecutorConfig
      // path further below: resolve the global executor's real config,
      // synthesize a minimal policy so the SAME governance gate runs, and
      // -- exactly like that other path -- report `mechanism: 'unavailable'`
      // instead of silently previewing as dispatchable when it actually
      // is not.
      let workGovernance = { providerFamily: null, egress: null };
      let workResolvedForDispatch;
      try {
        workResolvedForDispatch = resolveExecutorConfig(cfg, undefined, executorId, undefined, undefined, workHint.agentType ?? undefined);
        workGovernance = workResolvedForDispatch?.governance ?? workGovernance;
      } catch { /* no real config to resolve governance from -- stays null, same as before */ }
      if (workResolvedForDispatch) {
        const workSyntheticPolicy = { preferExecutor: executorId };
        const workAssignmentForPolicy = {
          operation: executorId,
          role: undefined,
          policy: workSyntheticPolicy,
          skills: [],
          ...hintDemand(workHint, workIdArg),
        };
        try {
          effectiveDispatchPolicy({
            assignment: workAssignmentForPolicy,
            runnerConfig: cfg,
            cliOverride,
            options,
          });
        } catch (err) {
          // Only a REAL governance refusal (the dispatch policy's own
          // "governance gate rejected ..." throw, disallowedProviders/
          // disallowedExecutors) downgrades this plan to unavailable. This
          // branch's assignment/work are synthesized, the same as the main
          // success path's own `assignmentForPolicy` -- any OTHER throw
          // (a synthesis-shape mismatch this narrower object hits that a
          // real Assignment would not) must degrade the same lenient way
          // the main path already does for a synthesized assignment: never
          // crash plan compilation, never claim a governance block that
          // was never actually evaluated.
          if (/governance gate rejected/.test(err.message)) {
            return {
              selector,
              caller: callerObj,
              mechanism: 'unavailable',
              executorId,
              capability: executorId,
              invocation: null,
              governance: workGovernance,
              reasonCodes: [...reasonCodes, 'governance.blocked'],
              configured: false,
              blockedReason: err.message,
            };
          }
        }
      }
      return {
        selector,
        caller: callerObj,
        mechanism,
        executorId,
        capability: executorId,
        invocation: null,
        governance: workGovernance,
        reasonCodes,
        configured: false,
      };
    }
  }

  let purposeResolved;
  if (!executorId && purpose) {
    purposeResolved = resolveExecutorAndOverrides(cfg, purpose);
    executorId = purposeResolved.executorId;
  }

  if (!executorId) {
    if (needsSoul) {
      const mechanism = decideDispatchMechanism({ hasNativeMechanism: true, hasLiveTaskAccess, forceCliSpawn: false });
      reasonCodes.push(hasLiveTaskAccess ? 'native-first.rule-2.live-task-access' : 'native-first.rule-1.no-native-mechanism');
      return {
        selector,
        caller: callerObj,
        mechanism,
        executorId: null,
        capability: purpose ?? null,
        invocation: null,
        governance: { providerFamily: null, egress: null },
        reasonCodes,
        configured: false,
      };
    }
    reasonCodes.push('selector.unregistered');
    // H7 (capability-aware dispatch gate, 2026-09-27): a `--for` purpose
    // that resolved to nothing is ALREADY refused above via
    // `selector.unregistered` -- this reason code only adds a more specific
    // diagnosis for the one case a caller can actually act on differently:
    // the name itself was never registered in `cfg.capabilities` (as a key
    // or a declared alias), as opposed to being registered but pointing at
    // an executor that failed to resolve for some other reason. Additive
    // only: `mechanism`/`configured` are unchanged either way.
    if (selector.type === 'purpose' && !isKnownCapabilityName(cfg, purpose)) {
      reasonCodes.push('capability.unknown');
    }
    return {
      selector,
      caller: callerObj,
      mechanism: 'unavailable',
      executorId: null,
      capability: purpose ?? null,
      invocation: null,
      governance: { providerFamily: null, egress: null },
      reasonCodes,
      configured: false,
    };
  }

  const mechanism = decideExecutorDispatchMechanism(cfg, executorId, { hasLiveTaskAccess });
  if (mechanism === 'out-of-process') {
    reasonCodes.push('native-first.0033.cli-spawn-shaped');
  } else {
    reasonCodes.push('native-first.rule-2.live-task-access');
  }

  const resolved = workResolved && workResolvedInputId === executorId
    ? workResolved
    : assignmentResolved && assignmentResolved.executorId === executorId
      ? assignmentResolved
      : purposeResolved && purposeResolved.executorId === executorId
        ? purposeResolved
        : resolveExecutorAndOverrides(cfg, executorId);
  const { executor, configured } = resolved;

  // H6b (D1, 2026-09-20 ACCEPTED): `decide <executorId>` naming an
  // unregistered id used to keep falling through to `decideExecutorDispatchMechanism`'s
  // guessed native-first mechanism -- a typo in an explicit executorId
  // silently "worked" via whatever native fallback happened to apply,
  // while the exact same situation for `--for` (below, `!executorId` after
  // purpose resolution fails) already refused outright with
  // `mechanism: 'unavailable'`/`reasonCodes: ['selector.unregistered']`.
  // D1 accepted making both doors apply the same rule: an unregistered
  // name is never silently guessed at, whether it arrived as `--for` or as
  // a bare positional executorId.
  if (selector.type === 'executor' && !configured) {
    reasonCodes.push('selector.unregistered');
    return {
      selector,
      caller: callerObj,
      mechanism: 'unavailable',
      executorId,
      capability: purpose ?? (executorId ?? null),
      invocation: null,
      governance: { providerFamily: null, egress: null },
      reasonCodes,
      configured: false,
    };
  }

  let mcpTool;
  let finalMechanism = mechanism;
  if (mechanism === 'out-of-process') {
    const mcpInvocation = Array.isArray(executor?.invocations) ? executor.invocations.find((inv) => inv.via === 'mcp') : undefined;
    const lookupPurpose = purpose;
    const candidate = lookupPurpose && mcpInvocation?.tools ? mcpInvocation.tools[lookupPurpose] : undefined;
    if (typeof candidate === 'string' && candidate) {
      mcpTool = candidate;
      finalMechanism = 'in-process';
      reasonCodes.push('native-first.mcp-handback');
    }
  }

  const agentType = executor?.agentType;
    const capability = purpose ?? (executorId ?? null);

  // Self-review finding (2026-08-25): the invocation/governance below used
  // to be APPROXIMATED here -- `executor.invocations[0]` instead of the
  // `via:"cli"` entry `resolveExecutorConfig`'s own Gate B2 actually
  // selects (an executor declaring `[{via:"mcp",...}, {via:"cli",...}]`
  // would silently report the wrong one), and a hardcoded `egress: null`
  // that never reflected the real per-executor governance resolve.mjs
  // computes for every actual dispatch. A canonical DispatchPlan exists to
  // describe what execution will ACTUALLY do, so it reuses the exact same
  // resolution function `resolveExecutorCommand` calls, rather than
  // re-deriving a second, drifting approximation of it.
  //
  // Second-round advisor finding (real, 2026-08-25): the first cut of this
  // fix caught a `resolveExecutorConfig` throw and quietly degraded to
  // `governance: null` while STILL returning `mechanism: "out-of-process",
  // configured: true` -- a governance-blocked executor (cross-provider,
  // no `allowCrossProvider`) would preview as dispatchable when the real
  // `execute` call for the exact same executorId would refuse it outright.
  // That is a preflight lying about the one gate it exists to describe.
  //
  // Only ATTEMPT real resolution when `finalMechanism === 'out-of-process'`
  // -- an `in-process` result (native Task/Agent, or the mcp-handback
  // branch just above) never runs through `resolveExecutorCommand`'s cli
  // path at all, so an mcp-only executor (no `via:"cli"` invocation, e.g.
  // gitnexus) throwing here is not a real blocker for THAT dispatch, only
  // for a cli one this plan was never going to take. When the mechanism
  // really is `out-of-process` and resolution still fails, that failure is
  // real and this plan must say so -- never silently report a working
  // mechanism while hiding why execution would actually refuse it.
  let resolvedForDispatch;
  let resolveError;
  if (finalMechanism === 'out-of-process') {
    try {
      // A caller that pinned an invocation (bind() picks herdr-spawn vs cli-spawn that
      // way) must see the plan describe that very invocation, not the executor's first.
      const pinnedInvocation = typeof cliOverride?.preferInvocation === 'string' && cliOverride.preferInvocation.trim()
        ? cliOverride.preferInvocation
        : undefined;
      resolvedForDispatch = resolveExecutorConfig(cfg, undefined, executorId, undefined, undefined, agentType, pinnedInvocation);
    } catch (err) {
      resolveError = err;
    }
  }

  if (finalMechanism === 'out-of-process' && !resolvedForDispatch) {
    reasonCodes.push('governance.blocked');
    // Second-round advisor finding (real, 2026-08-25): `configured` means
    // "does this executorId resolve to a real config entry" everywhere
    // else in this function (and in decideExecutorCli's own docstring) --
    // it is NOT "can this be dispatched right now". A governance-blocked
    // executor still HAS a real `executors.<id>` entry (`configured`,
    // already computed above from the same `resolved` this branch reads
    // `executor` from) -- overriding it to `false` here conflated two
    // different questions under one field. `mechanism: 'unavailable'` +
    // `blockedReason` already carry the refusal; `configured` stays
    // faithful to its one meaning.
    return {
      selector,
      caller: callerObj,
      mechanism: 'unavailable',
      executorId,
      capability,
      invocation: null,
      governance: { providerFamily: null, egress: null },
      reasonCodes,
      configured,
      blockedReason: resolveError?.message ?? null,
    };
  }

  const invocation = resolvedForDispatch
    ? { via: 'cli', adapter: resolvedForDispatch.adapter ?? executor?.adapter ?? 'cli-spawn', protocol: 'prompt-stdout-v1' }
    : null;

  const governance = resolvedForDispatch?.governance ?? { providerFamily: null, egress: null };

  // Dispatch Core Contract Normalization, Slice D: merge tier/model/
  // providerModel/provenance into the DispatchPlan itself, additive-only,
  // by delegating to the SAME policy resolver (the dispatch policy)
  // every dispatch already uses -- never a second, independently-derived
  // computation. Uses the caller's real Assignment when one was given
  // (assignment-runner.mjs's executeAssignment path); synthesizes a minimal
  // one otherwise so --executor-id/--for/--work callers (including the
  // decide-before-dispatch PreToolUse hook) get the same fields without
  // requiring a real Assignment object. `preferExecutor: executorId` pins
  // the synthesized resolution to the SAME executor this function already
  // chose above, so the two resolvers agree by construction; the
  // executorId check below still catches the case where a
  // caller-supplied cliOverride.preferExecutor disagrees anyway.
  const realAssignmentForPolicy = assignmentItem ?? (typeof assignmentArg === 'object' && assignmentArg ? assignmentArg : null);
  const syntheticPolicy = { preferExecutor: executorId };
  const capRigor = capabilityRigorOf(cfg, capability);
  if (capRigor) syntheticPolicy.rigor = capRigor;
  if (capability) syntheticPolicy.capability = capability;
  const assignmentForPolicy = realAssignmentForPolicy ?? {
    operation: capability ?? executorId,
    role: undefined,
    policy: syntheticPolicy,
    skills: [],
    ...hintDemand(workHint, workIdArg),
  };
  let effectivePolicy = null;
  try {
    effectivePolicy = effectiveDispatchPolicy({
      assignment: assignmentForPolicy,
      runnerConfig: cfg,
      cliOverride,
      options,
    });
  } catch (err) {
    // A real Assignment's policy failure is a real failure -- propagate it,
    // matching the pre-existing contract where a caller (assignment-runner.mjs)
    // called the dispatch policy separately and let it throw.
    if (realAssignmentForPolicy) throw err;
    // A synthesized assignment (no real Assignment given, e.g. `decide --for`)
    // never crashes plan compilation over this -- decide-before-dispatch
    // callers, including the hook, must keep working exactly as before; the
    // new fields are simply left null. A seat binding route that does not
    // answer is not a policy failure: it is never hidden here.
    if (err?.name === 'SeatBindingError') throw err;
    effectivePolicy = null;
  }
  if (effectivePolicy && effectivePolicy.executorId !== executorId) {
    const message = `dispatch decide mismatch for operation "${assignmentForPolicy.operation}": decided executor "${executorId}" does not match execution policy executor "${effectivePolicy.executorId}"`;
    if (realAssignmentForPolicy) {
      throw new RunnerConfigError(message);
    }
    // Same non-fatal posture as the catch block above: a synthesized
    // assignment must never turn a working `decide` into a thrown error.
    effectivePolicy = null;
    reasonCodes.push('policy.executor-mismatch-ignored');
  }

  return {
    selector,
    caller: callerObj,
    mechanism: finalMechanism,
    executorId,
    capability,
    invocation,
    governance,
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
  };
}
