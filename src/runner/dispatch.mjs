// dispatch.mjs — barrel re-export (D7, tsk-2uf-1): the dispatch module lives at
// src/runner/dispatch/{config,resolve,mechanism,transport,prepare,cli}.mjs; this file
// re-exports the names its importers (bin/fgos.mjs, bin/fgos-runner.mjs,
// scripts/dispatch-decide-hook.mjs, scripts/project-agents.mjs, src/runner/loop.mjs,
// src/setup/registrations.mjs) use.
//
// Dispatch is the low layer under runUnit: this barrel re-exports nothing from the Work
// layer and imports no Work module directly (test/architecture.test.mjs walks it). `decide --work` needs a Work lookup, which `fgos
// dispatch decide` hands in from bin; run bare, `node src/runner/dispatch.mjs decide
// --work` refuses and names that door.

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

export { runDispatchCli, decideExecutorCli, runDoorHint } from './dispatch/cli.mjs';

import { runDispatchCli } from './dispatch/cli.mjs';
import { isMainModule } from '../../scripts/lib/is-main-module.mjs';

// CLI entry point — only runs when this file is executed directly (`node
// src/runner/dispatch.mjs decide|probe-account|reconcile ...`), never on import.
if (isMainModule(import.meta.url)) {
  runDispatchCli();
}
