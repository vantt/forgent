// dispatch.mjs — barrel re-export (D7, tsk-2uf-1): the former 2204-line,
// 6-concerns-in-one-file module now lives at
// src/runner/dispatch/{config,resolve,mechanism,transport,prepare,cli}.mjs.
// This file re-exports every name the module used to export directly, so
// none of the existing importers (bin/fgos.mjs, bin/fgos-runner.mjs,
// scripts/dispatch-decide-hook.mjs, scripts/project-agents.mjs,
// src/runner/loop.mjs, src/setup/registrations.mjs, and their tests) needs
// to change a single import line. Pure consolidation + naming — no
// behavior change (docs/history/dispatch-activation-and-handoff-redesign/
// CONTEXT.md D7; tsk-5tm-3 D5 — the dispatch MECHANISM is not re-decided
// anywhere in this split).
//
// This file's own CLI entry-point guard below is the one piece of real
// logic kept here: `node src/runner/dispatch.mjs execute/decide/log ...`
// is a documented, literal invocation path (AGENTS.md's Dispatch section,
// several skills' own SKILL.md prose) that must keep resolving to THIS
// file — the guard stays here, unchanged, and delegates its body to
// `dispatch/cli.mjs`'s `runDispatchCli()`.

export {
  RunnerConfigError,
  loadRunnerConfig,
  KNOWN_ASSISTANT_CLI_NAMES,
  detectAssistantCli,
  DEFAULT_RUNNER_CONFIG,
  SUPPORTED_EXECUTOR_TEMPLATES,
  loadRunnerConfigFromDir,
  ensureRunnerConfigForDir,
  EXECUTOR_KINDS,
  EXECUTOR_CARRIES,
  CLAUDE_CLI_COMMANDS,
  MODEL_POLICY_TIERS,
  INVOCATION_VIA,
} from './dispatch/config.mjs';

export { resolveTierModel, resolveExecutorAndOverrides } from './dispatch/resolve.mjs';
export { executorIdForWork, buildPrompt, resolveCapabilityIdentityDetails, resolveCapabilityIdentity } from './work-compat.mjs';

export { decideDispatchMechanism, decideExecutorDispatchMechanism } from './dispatch/mechanism.mjs';

export { compileDispatchPlan } from './dispatch/plan.mjs';

export {
  ProviderCapacityConfigError,
  rejectProjectProviderAccountInventory,
  validateProviderAccountInventory,
  providerAccountInventory,
  hasProviderAccounts,
  stableHash,
  rankProviderAccounts,
  acquireProviderAccountLease,
  releaseProviderAccountLease,
  quarantineProviderAccount,
  clearProviderAccountQuarantine,
  inspectProviderCapacity,
  classifyProviderCapacityFault,
  redactProviderCapacitySelection,
} from './dispatch/provider-capacity.mjs';

export { DispatchError, resolveExecutorCommand, resolveExecutorEnv, resolveHerdrBin, DEFAULT_ADAPTER, DISPATCH_DEPTH_ENV, MAX_DISPATCH_DEPTH } from './dispatch/transport.mjs';

export { executeThroughConfinement } from './dispatch/confinement/authority.mjs';

export {
  resolveAgentTypeForTaskSpec,
  executeExecutorCli,
} from './dispatch/cli.mjs';
export { resolveAgentTypeForWork, spawnWorker } from './work-dispatch.mjs';

export { logExecutorDispatch } from './dispatch-log.mjs';
export { fanoutBatchExecutorCli } from './fanout-batch.mjs';

export {
  createAssignmentId,
  buildAssignment,
  renderAssignmentPrompt,
} from './dispatch/assignment.mjs';

export {
  resolveAssignmentDispatchPolicy,
  resolveStrongerTier,
  TIER_STRENGTH,
} from './dispatch/assignment-policy.mjs';

export {
  executeAssignment,
} from './dispatch/assignment-runner.mjs';

import { runDispatchCli as runCoreDispatchCli, decideExecutorCli as decideCore } from './dispatch/cli.mjs';
import { resolveWorkForDispatch } from './work-dispatch.mjs';
import { logExecutorDispatch } from './dispatch-log.mjs';
import { fanoutBatchExecutorCli } from './fanout-batch.mjs';
import { resolveRepoRoot, resolveMainCheckoutRoot, fgosDirFromRoot } from './paths.mjs';
import { StoreError } from '../state/store.mjs';
import { isMainModule } from '../../scripts/lib/is-main-module.mjs';

/**
 * Top-level CLI entry point for node src/runner/dispatch.mjs.
 * Handles higher-level subcommands (log, fanout-batch) before delegating
 * core dispatch subcommands (execute, decide, reconcile) to dispatch/cli.mjs.
 */
export async function runDispatchCli(argv = process.argv.slice(2), { returnResult = false } = {}) {
  const [subcommand, ...afterSubcommand] = argv;
  const executorId = afterSubcommand[0] && !afterSubcommand[0].startsWith('--') ? afterSubcommand[0] : undefined;
  const rest = executorId ? afterSubcommand.slice(1) : afterSubcommand;
  const flagValue = (name) => {
    const i = rest.indexOf(name);
    return i !== -1 ? rest[i + 1] : undefined;
  };

  if (subcommand === 'log') {
    const id = flagValue('--id');
    const provider = flagValue('--provider');
    const command = flagValue('--command');
    const model = flagValue('--model');
    const capability = flagValue('--capability');
    const mechanism = flagValue('--mechanism');
    const tier = flagValue('--tier');
    const fallbackReason = flagValue('--fallback-reason');
    const outcome = flagValue('--outcome');
    if (!id || !executorId || !provider || !command) {
      const usageMsg =
        'usage: node src/runner/dispatch.mjs log <executorId> --id <workItemId> --provider <p> --command <c> [--model <m>] [--capability <name>] [--mechanism <m>] [--tier <t>] [--fallback-reason <text>] [--outcome <status>]\n';
      if (returnResult) throw new StoreError('validation', usageMsg.trim());
      process.stderr.write(usageMsg);
      process.exitCode = 1;
    } else {
      const root = resolveMainCheckoutRoot(process.cwd()) ?? resolveRepoRoot(process.cwd());
      const fgosDir = fgosDirFromRoot(root);
      const event = logExecutorDispatch(fgosDir, { id, executorId, provider, command, model, capability, mechanism, tier, fallbackReason, outcome });
      if (returnResult) return event;
      process.stdout.write(`${JSON.stringify(event)}\n`);
    }
    return;
  }

  if (subcommand === 'fanout-batch') {
    const candidateArg = executorId ?? flagValue('--candidates');
    const candidateIds = candidateArg ? String(candidateArg).split(',').map((s) => s.trim()).filter(Boolean) : [];
    try {
      const result = await fanoutBatchExecutorCli(candidateIds, {
        cwd: flagValue('--cwd') ?? flagValue('--dir'),
        hasLiveTaskAccess: rest.includes('--has-live-task-access'),
      });
      if (returnResult) return result;
      process.stdout.write(`${JSON.stringify(result)}\n`);
    } catch (err) {
      if (returnResult) throw err;
      process.stderr.write(`${err.message}\n`);
      process.exitCode = 1;
    }
    return;
  }

  return runCoreDispatchCli(argv, { returnResult, resolveWork: resolveWorkForDispatch });
}

/**
 * `decide` with the Work layer's `--work` lookup attached: dispatch itself holds no
 * Work store, so a `work` selector is resolved here before the plan is compiled.
 */
export function decideExecutorCli(executorId, options = {}) {
  return decideCore(executorId, { resolveWork: resolveWorkForDispatch, ...options });
}

// CLI entry point — only runs when this file is executed directly (`node
// src/runner/dispatch.mjs ...`), never on import (every existing caller
// imports named exports, none execute this module as a script).
if (isMainModule(import.meta.url)) {
  runDispatchCli();
}
