// dispatch/plan.mjs — DispatchPlan compiler (tsk-5x7-1 D1/D6)
//
// Exposes `compileDispatchPlan()`, which calls the existing
// `decideDispatchMechanism` / `decideExecutorDispatchMechanism` helpers in
// `mechanism.mjs` rather than re-deriving any routing rules, packaging
// selector, caller, mechanism, executorId, capability, invocation, governance,
// and reasonCodes into a canonical DispatchPlan object.

import { RunnerConfigError } from './config.mjs';
import { resolveExecutorAndOverrides, resolveExecutorConfig } from './resolve.mjs';
import { decideDispatchMechanism, decideExecutorDispatchMechanism } from './mechanism.mjs';
import { executorIdForWork } from './cli.mjs';

/**
 * Compiles a canonical DispatchPlan object for a dispatch request.
 *
 * @param {object} cfg - Runner config object
 * @param {object} [opts] - Dispatch parameters
 * @param {string} [opts.executorId] - Positional executor identifier
 * @param {string} [opts.for] - Purpose identifier
 * @param {string} [opts.work] - Work item identifier
 * @param {string} [opts.stage] - Workflow stage
 * @param {boolean} [opts.needsSoul=false] - True if caller needs a soul-bearing agent
 * @param {boolean} [opts.hasLiveTaskAccess=false] - True if caller holds live Task tool access
 * @param {object} [opts.caller] - Caller role descriptors ({ role: 'driver'|'launcher' })
 * @param {object} [opts.workItem] - Pre-resolved work item object (for --work option)
 * @returns {object} DispatchPlan
 */
export function compileDispatchPlan(
  cfg,
  {
    executorId: executorIdArg,
    for: purpose,
    work: workIdArg,
    stage: stageArg,
    needsSoul = false,
    hasLiveTaskAccess = false,
    caller = { role: 'driver' },
    workItem,
  } = {},
) {
  if (!executorIdArg && !purpose && !workIdArg && !needsSoul) {
    throw new RunnerConfigError(
      'usage: node src/runner/dispatch.mjs decide <executorId> [--has-live-task-access] | decide --for <purpose> [--needs-soul] [--has-live-task-access] | decide --work <workId> [--stage <stage>] [--has-live-task-access] | decide --needs-soul [--has-live-task-access]',
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

  if (!executorId && workIdArg) {
    if (!workItem) {
      throw new RunnerConfigError(`no work item "${workIdArg}" found -- cannot resolve its dispatch executor.`);
    }
    executorId = executorIdForWork(workItem, stageArg);
    workResolvedInputId = executorId;
    workResolved = resolveExecutorAndOverrides(cfg, executorId);
    const hasExplicitExecutor = workResolved.configured;
    if (!hasExplicitExecutor) {
      const mechanism = decideDispatchMechanism({ hasNativeMechanism: true, hasLiveTaskAccess, forceCliSpawn: false });
      reasonCodes.push(hasLiveTaskAccess ? 'native-first.rule-2.live-task-access' : 'native-first.rule-1.no-native-mechanism');
      return {
        selector,
        caller: callerObj,
        mechanism,
        executorId,
        capability: executorId,
        invocation: null,
        governance: { providerFamily: null, egress: null },
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
    : purposeResolved && purposeResolved.executorId === executorId
      ? purposeResolved
      : resolveExecutorAndOverrides(cfg, executorId);
  const { executor, configured } = resolved;

  let mcpTool;
  let finalMechanism = mechanism;
  if (mechanism === 'out-of-process') {
    const mcpInvocation = Array.isArray(executor?.invocations) ? executor.invocations.find((inv) => inv.via === 'mcp') : undefined;
    const lookupPurpose = purpose ?? (Array.isArray(executor?.for) && executor.for.length === 1 ? executor.for[0] : undefined);
    const candidate = lookupPurpose && mcpInvocation?.tools ? mcpInvocation.tools[lookupPurpose] : undefined;
    if (typeof candidate === 'string' && candidate) {
      mcpTool = candidate;
      finalMechanism = 'in-process';
      reasonCodes.push('native-first.mcp-handback');
    }
  }

  const agentType = executor?.agentType;
  const capability = purpose ?? (Array.isArray(executor?.for) && executor.for.length > 0 ? executor.for[0] : (executorId ?? null));

  // Self-review finding (2026-08-25): the invocation/governance below used
  // to be APPROXIMATED here -- `executor.invocations[0]` instead of the
  // `via:"cli"` entry `resolveExecutorConfig`'s own Gate B2 actually
  // selects (an executor declaring `[{via:"mcp",...}, {via:"cli",...}]`
  // would silently report the wrong one), and a hardcoded `egress: null`
  // that never reflected the real per-executor governance resolve.mjs
  // computes for every actual dispatch. A canonical DispatchPlan exists to
  // describe what execution will ACTUALLY do, so it reuses the exact same
  // resolution function `resolveExecutorCommand` calls, rather than
  // re-deriving a second, drifting approximation of it. Caught and
  // gracefully degraded (never lets `decide` itself start throwing for a
  // call that previously succeeded): a governance-blocked executor or an
  // mcp-only one (no `via:"cli"` invocation at all, e.g. gitnexus, exactly
  // the case an mcp handback above may already be reporting) is a real
  // resolution failure this preview reports as "unknown" rather than
  // crashing on — the throw itself only ever matters at actual dispatch
  // time, which resolveExecutorCommand still enforces unconditionally.
  let resolvedForDispatch;
  try {
    resolvedForDispatch = resolveExecutorConfig(cfg, undefined, executorId, undefined, undefined, agentType);
  } catch {
    resolvedForDispatch = undefined;
  }

  const invocation = {
    via: 'cli',
    adapter: resolvedForDispatch?.adapter ?? executor?.adapter ?? 'cli-spawn',
    protocol: 'prompt-stdout-v1',
  };

  const governance = resolvedForDispatch?.governance ?? { providerFamily: null, egress: null };

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
  };
}
