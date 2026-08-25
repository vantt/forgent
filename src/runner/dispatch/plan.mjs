// dispatch/plan.mjs — DispatchPlan compiler (tsk-5x7-1 D1/D6)
//
// Exposes `compileDispatchPlan()`, which calls the existing
// `decideDispatchMechanism` / `decideExecutorDispatchMechanism` helpers in
// `mechanism.mjs` rather than re-deriving any routing rules, packaging
// selector, caller, mechanism, executorId, capability, invocation, governance,
// and reasonCodes into a canonical DispatchPlan object.

import { RunnerConfigError } from './config.mjs';
import { resolveExecutorAndOverrides } from './resolve.mjs';
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
  let selector;
  if (workIdArg) {
    selector = { type: 'work', value: workIdArg };
  } else if (purpose) {
    selector = { type: 'purpose', value: purpose };
  } else if (executorIdArg) {
    selector = { type: 'executor', value: executorIdArg };
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
        governance: { carries: [], egress: null },
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
        governance: { carries: [], egress: null },
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
      governance: { carries: [], egress: null },
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

  const invEntry = Array.isArray(executor?.invocations) ? executor.invocations[0] : undefined;
  const invocation = {
    via: invEntry?.via ?? 'cli',
    adapter: executor?.adapter ?? 'cli-spawn',
    protocol: 'prompt-stdout-v1',
  };

  const governance = {
    carries: Array.isArray(executor?.carries) ? executor.carries : [],
    egress: null,
  };

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
