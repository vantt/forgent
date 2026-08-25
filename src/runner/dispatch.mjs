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

export { modelForTier, resolveExecutorIdForPurpose, resolveExecutorAndOverrides } from './dispatch/resolve.mjs';

export { decideDispatchMechanism, decideExecutorDispatchMechanism } from './dispatch/mechanism.mjs';

export { DispatchError, resolveExecutorCommand, resolveExecutorEnv, DEFAULT_ADAPTER, EXECUTOR_ADAPTERS, DISPATCH_DEPTH_ENV, MAX_DISPATCH_DEPTH } from './dispatch/transport.mjs';

export { buildPrompt } from './dispatch/prepare.mjs';

export {
  executorIdForWork,
  resolveAgentTypeForTaskSpec,
  resolveAgentTypeForWork,
  spawnWorker,
  logExecutorDispatch,
  executeExecutorCli,
  decideExecutorCli,
  fanoutBatchExecutorCli,
} from './dispatch/cli.mjs';

import { runDispatchCli } from './dispatch/cli.mjs';

// CLI entry point — only runs when this file is executed directly (`node
// src/runner/dispatch.mjs ...`), never on import (every existing caller
// imports named exports, none execute this module as a script). Unchanged
// guard condition from before the split; the body it calls now lives in
// dispatch/cli.mjs (`runDispatchCli`) — pure relocation, no behavior change.
if (import.meta.url === `file://${process.argv[1]}`) {
  runDispatchCli();
}
